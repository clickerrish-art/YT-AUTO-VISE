import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { verifyMetaPageIdentity, publishMetaPagePost, fetchMetaPagePost, MetaPageApiError } from "../scripts/meta-page-adapter.mjs";

const PAGE_ID = "123456789012345";
const TOKEN = "test-token-never-log-" + "x".repeat(30);
const API = "v26.0";
const NOW = Date.parse("2026-10-24T10:00:00.000Z");
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("Meta Page identity verification checks exact Page ID without putting token in URL", async () => {
  let called;
  const result = await verifyMetaPageIdentity({
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, expectedPageName: "Nature Frontiers",
    fetchImpl: async (url, options) => { called = { url, options }; return response({ id: PAGE_ID, name: "Nature Frontiers" }); }
  });
  assert.equal(result.verified, true);
  assert.equal(result.pageId, PAGE_ID);
  assert.equal(new URL(called.url).searchParams.has("access_token"), false);
  assert.equal(called.options.headers.authorization, "Bearer " + TOKEN);
  await assert.rejects(() => verifyMetaPageIdentity({
    pageId: PAGE_ID, expectedPageId: "999999999999999", accessToken: TOKEN, apiVersion: API,
    fetchImpl: async () => { throw new Error("must not call"); }
  }), /does not match/i);
});

test("Meta publish adapter schedules a future post and performs no retries", async () => {
  let calls = 0, request;
  const draft = { kind: "FACEBOOK_PAGE_DRAFT", caption: "Verified draft caption", scheduledAt: "2026-10-25T06:00:00.000Z", media: null };
  const result = await publishMetaPagePost({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    permissionsConfirmed: true, now: NOW,
    fetchImpl: async (url, options) => {
      calls++; request = { url, options };
      assert.equal(url, "https://graph.facebook.com/v26.0/123456789012345/feed");
      return response({ id: PAGE_ID + "_999" });
    }
  });
  assert.equal(calls, 1);
  assert.equal(result.remotePostId, PAGE_ID + "_999");
  assert.equal(result.verifiedRemotely, false);
  assert.equal(request.options.headers.authorization, "Bearer " + TOKEN);
  const form = request.options.body;
  assert.equal(form.get("message"), draft.caption);
  assert.equal(form.get("published"), "false");
  assert.equal(form.get("unpublished_content_type"), "SCHEDULED");
  assert.equal(Number(form.get("scheduled_publish_time")), Date.parse(draft.scheduledAt) / 1000);
});

test("Meta adapter requires explicit permission confirmation and supported schedule window", async () => {
  const draft = { kind: "FACEBOOK_PAGE_DRAFT", caption: "Caption", scheduledAt: "2026-10-25T06:00:00.000Z", media: null };
  await assert.rejects(() => publishMetaPagePost({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, permissionsConfirmed: false, now: NOW,
    fetchImpl: async () => { throw new Error("must not call"); }
  }), /permissions/i);
  await assert.rejects(() => publishMetaPagePost({
    draft: { ...draft, scheduledAt: "2026-10-24T10:01:00.000Z" }, pageId: PAGE_ID, expectedPageId: PAGE_ID,
    accessToken: TOKEN, apiVersion: API, permissionsConfirmed: true, now: NOW,
    fetchImpl: async () => { throw new Error("must not call"); }
  }), /10 minutes/i);
});

test("Meta adapter validates local image checksums and remote verification status", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "meta-adapter-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bytes = Buffer.from("test-only image fixture");
  fs.writeFileSync(path.join(root, "image.jpg"), bytes);
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  let request;
  const draft = { kind: "FACEBOOK_PAGE_DRAFT", caption: "Caption", scheduledAt: "2026-10-25T06:00:00.000Z", media: { path: "image.jpg", sha256: sha } };
  const published = await publishMetaPagePost({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, permissionsConfirmed: true, rootDir: root, now: NOW,
    fetchImpl: async (url, options) => { request = { url, options }; return response({ id: "photo-777", post_id: PAGE_ID + "_888" }); }
  });
  assert.equal(published.remotePostId, PAGE_ID + "_888");
  assert.equal(request.url, "https://graph.facebook.com/v26.0/123456789012345/photos");
  assert.ok(request.options.body.get("source") instanceof Blob);
  await assert.rejects(() => publishMetaPagePost({
    draft: { ...draft, media: { ...draft.media, sha256: "a".repeat(64) } }, pageId: PAGE_ID, expectedPageId: PAGE_ID,
    accessToken: TOKEN, apiVersion: API, permissionsConfirmed: true, rootDir: root, now: NOW, fetchImpl: async () => response({})
  }), /checksum/i);

  const verified = await fetchMetaPagePost({
    remotePostId: PAGE_ID + "_888", expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    fetchImpl: async url => {
      assert.match(url, /fields=id,message,created_time,permalink_url,is_published,scheduled_publish_time/);
      return response({ id: PAGE_ID + "_888", message: "Caption", created_time: "2026-10-24T10:00:00Z", permalink_url: "https://www.facebook.com/" + PAGE_ID + "_888", is_published: false, scheduled_publish_time: 1792908000 });
    }
  });
  assert.equal(verified.status, "SCHEDULED_VERIFIED");
  assert.equal(verified.remotePostId, PAGE_ID + "_888");
});

test("Meta API errors redact access tokens and network failures are marked uncertain", async () => {
  await assert.rejects(() => verifyMetaPageIdentity({
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    fetchImpl: async () => response({ error: { message: "bad token " + TOKEN, code: 190 } }, 400)
  }), error => error instanceof MetaPageApiError && !error.message.includes(TOKEN) && error.code === 190);
  await assert.rejects(() => publishMetaPagePost({
    draft: { kind: "FACEBOOK_PAGE_DRAFT", caption: "Caption", scheduledAt: "2026-10-25T06:00:00.000Z" },
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, permissionsConfirmed: true, now: NOW,
    fetchImpl: async () => { throw new Error("simulated timeout"); }
  }), error => error instanceof MetaPageApiError && error.uncertain === true && error.retryable === false);
});
