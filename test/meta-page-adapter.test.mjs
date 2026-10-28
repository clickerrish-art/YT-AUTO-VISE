import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { verifyMetaPageIdentity, verifyMetaPagePermissions, publishMetaPagePost, fetchMetaPagePost, reconcileMetaPagePost, MetaPageApiError } from "../scripts/meta-page-adapter.mjs";

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

test("Meta permission verification requires granted scopes, Page task and matching Page token", async () => {
  const userToken = "user-access-token-" + "u".repeat(30);
  const calls = [];
  const result = await verifyMetaPagePermissions({
    pageId: PAGE_ID, userAccessToken: userToken, pageAccessToken: TOKEN, apiVersion: API,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/me/permissions")) return response({ data: [
        { permission: "pages_show_list", status: "granted" },
        { permission: "pages_read_engagement", status: "granted" },
        { permission: "pages_manage_posts", status: "granted" }
      ] });
      return response({ data: [{ id: PAGE_ID, name: "Nature Frontiers", tasks: ["CREATE_CONTENT", "MODERATE"], access_token: TOKEN }] });
    }
  });
  assert.equal(result.permissionsVerified, true);
  assert.deepEqual(result.grantedPermissions, ["pages_show_list", "pages_read_engagement", "pages_manage_posts"]);
  assert.ok(result.tasks.includes("CREATE_CONTENT"));
  assert.equal(calls.length, 2);
  assert.equal(new URL(calls[0].url).searchParams.has("access_token"), false);
  await assert.rejects(() => verifyMetaPagePermissions({
    pageId: PAGE_ID, userAccessToken: userToken, pageAccessToken: "different-page-token-" + "y".repeat(25), apiVersion: API,
    fetchImpl: async url => url.endsWith("/me/permissions")
      ? response({ data: [{ permission: "pages_show_list", status: "granted" }, { permission: "pages_manage_posts", status: "granted" }] })
      : response({ data: [{ id: PAGE_ID, name: "Nature Frontiers", tasks: ["CREATE_CONTENT"], access_token: TOKEN }] })
  }), /permissions are missing/i);
});

test("Meta publish adapter schedules a future post and performs no retries", async () => {
  let calls = 0, request;
  const draft = { kind: "FACEBOOK_PAGE_DRAFT", caption: "Verified draft caption", scheduledAt: "2026-10-25T06:00:00.000Z", media: null };
  const result = await publishMetaPagePost({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    permissionsVerified: true, now: NOW,
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

test("Meta adapter requires live permission verification and supported schedule window", async () => {
  const draft = { kind: "FACEBOOK_PAGE_DRAFT", caption: "Caption", scheduledAt: "2026-10-25T06:00:00.000Z", media: null };
  await assert.rejects(() => publishMetaPagePost({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, permissionsVerified: false, now: NOW,
    fetchImpl: async () => { throw new Error("must not call"); }
  }), /permissions/i);
  await assert.rejects(() => publishMetaPagePost({
    draft: { ...draft, scheduledAt: "2026-10-24T10:01:00.000Z" }, pageId: PAGE_ID, expectedPageId: PAGE_ID,
    accessToken: TOKEN, apiVersion: API, permissionsVerified: true, now: NOW,
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
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, permissionsVerified: true, rootDir: root, now: NOW, probeImage: () => ({ width: 640, height: 480 }),
    fetchImpl: async (url, options) => { request = { url, options }; return response({ id: "photo-777", post_id: PAGE_ID + "_888" }); }
  });
  assert.equal(published.remotePostId, PAGE_ID + "_888");
  await assert.rejects(() => publishMetaPagePost({ draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, permissionsVerified: true, rootDir: root, now: NOW, probeImage: () => { throw new MetaPageApiError("simulated decode failure"); }, fetchImpl: async () => response({ id: "should-not-publish" }) }), /simulated decode failure/i);
  assert.equal(request.url, "https://graph.facebook.com/v26.0/123456789012345/photos");
  assert.ok(request.options.body.get("source") instanceof Blob);
  await assert.rejects(() => publishMetaPagePost({
    draft: { ...draft, media: { ...draft.media, sha256: "a".repeat(64) } }, pageId: PAGE_ID, expectedPageId: PAGE_ID,
    accessToken: TOKEN, apiVersion: API, permissionsVerified: true, rootDir: root, now: NOW, fetchImpl: async () => response({})
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
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, permissionsVerified: true, now: NOW,
    fetchImpl: async () => { throw new Error("simulated timeout"); }
  }), error => error instanceof MetaPageApiError && error.uncertain === true && error.retryable === false);
});

test("Meta permission verification follows cursor pagination to find the exact managed Page", async () => {
  const userToken = "user-access-token-" + "p".repeat(30);
  const urls = [];
  const result = await verifyMetaPagePermissions({
    pageId: PAGE_ID, userAccessToken: userToken, pageAccessToken: TOKEN, apiVersion: API,
    fetchImpl: async url => {
      urls.push(String(url));
      if (String(url).endsWith("/me/permissions")) return response({ data: [
        { permission: "pages_show_list", status: "granted" },
        { permission: "pages_read_engagement", status: "granted" },
        { permission: "pages_manage_posts", status: "granted" }
      ] });
      if (!new URL(url).searchParams.has("after")) return response({
        data: [{ id: "999999999999999", name: "Other Page", tasks: ["CREATE_CONTENT"], access_token: "other-token" }],
        paging: { next: "https://graph.facebook.com/sensitive-next-url", cursors: { after: "cursor-1" } }
      });
      assert.equal(new URL(url).searchParams.get("after"), "cursor-1");
      return response({ data: [{ id: PAGE_ID, name: "Nature Frontiers", tasks: ["CREATE_CONTENT"], access_token: TOKEN }] });
    }
  });
  assert.equal(result.verified, true);
  assert.equal(result.pageId, PAGE_ID);
  assert.equal(urls.length, 3);
  assert.ok(urls.every(url => !url.includes(userToken) && !url.includes(TOKEN)));
});


test("uncertain Facebook mutation is reconciled against the scheduled-post edge with bounded pagination", async () => {
  const calls = [];
  const result = await reconcileMetaPagePost({
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    caption: "Exact scheduled caption", scheduledAt: "2026-10-25T06:00:00.000Z",
    attemptStartedAt: "2026-10-24T10:00:00.000Z",
    fetchImpl: async url => {
      calls.push(String(url));
      if (String(url).includes("/scheduled_posts")) {
        const u = new URL(url);
        if (!u.searchParams.has("after")) return response({
          data: [{ id: PAGE_ID + "_old", message: "Other caption", scheduled_publish_time: 1792908000 }],
          paging: { next: "redacted", cursors: { after: "next-cursor" } }
        });
        assert.equal(u.searchParams.get("after"), "next-cursor");
        return response({ data: [{
          id: PAGE_ID + "_confirmed", message: "Exact scheduled caption",
          created_time: "2026-10-24T10:01:00Z", scheduled_publish_time: String(Date.parse("2026-10-25T06:00:00.000Z") / 1000),
          permalink_url: "https://www.facebook.com/" + PAGE_ID + "_confirmed"
        }] });
      }
      return response({ data: [] });
    }
  });
  assert.equal(result.outcome, "CONFIRMED");
  assert.equal(result.receipt.remotePostId, PAGE_ID + "_confirmed");
  assert.equal(result.receipt.status, "SCHEDULED_VERIFIED");
  assert.equal(calls.length, 3);
  assert.ok(calls.every(url => !url.includes(TOKEN)));
});

test("no reconciliation match is unresolved, never proof that a publish is safe to retry", async () => {
  const result = await reconcileMetaPagePost({
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    caption: "Exact scheduled caption", scheduledAt: "2026-10-25T06:00:00.000Z",
    attemptStartedAt: "2026-10-24T10:00:00.000Z",
    fetchImpl: async () => response({ data: [] })
  });
  assert.equal(result.outcome, "UNRESOLVED");
  assert.equal(result.reason, "NO_MATCH_IS_NOT_PROOF_OF_NON_PUBLICATION");
});

test("multiple matching remote posts remain ambiguous and block retry", async () => {
  const item = id => ({
    id: PAGE_ID + "_" + id, message: "Exact scheduled caption",
    created_time: "2026-10-24T10:01:00Z", scheduled_publish_time: String(Date.parse("2026-10-25T06:00:00.000Z") / 1000)
  });
  const result = await reconcileMetaPagePost({
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    caption: "Exact scheduled caption", scheduledAt: "2026-10-25T06:00:00.000Z",
    attemptStartedAt: "2026-10-24T10:00:00.000Z",
    fetchImpl: async url => String(url).includes("/scheduled_posts")
      ? response({ data: [item("one"), item("two")] })
      : response({ data: [] })
  });
  assert.equal(result.outcome, "AMBIGUOUS");
  assert.equal(result.matches.length, 2);
});


test("Meta post read-back rejects IDs that only share a Page ID prefix", async () => {
  let calls = 0;
  for (const remotePostId of [
    PAGE_ID + "9_888",
    PAGE_ID + "9",
    PAGE_ID
  ]) {
    await assert.rejects(() => fetchMetaPagePost({
      remotePostId, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
      fetchImpl: async () => { calls++; return response({ id: remotePostId }); }
    }), /does not match the authorized Page ID/i, remotePostId);
  }
  assert.equal(calls, 0, "invalid remote IDs must be rejected before any API request");
});


test("Meta image upload rejects symlinked assets even when the link is inside the configured root", async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "meta-adapter-symlink-root-"));
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "meta-adapter-symlink-outside-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  t.after(() => fs.rmSync(outsideRoot, { recursive: true, force: true }));
  const outsideAsset = path.join(outsideRoot, "private.jpg");
  const linkedAsset = path.join(root, "image.jpg");
  const bytes = Buffer.from("outside-root bytes must never be uploaded");
  fs.writeFileSync(outsideAsset, bytes);
  fs.symlinkSync(outsideAsset, linkedAsset);
  let requests = 0;
  await assert.rejects(() => publishMetaPagePost({
    draft: {
      kind: "FACEBOOK_PAGE_DRAFT", caption: "Caption",
      scheduledAt: "2026-10-25T06:00:00.000Z",
      media: { path: "image.jpg", sha256: crypto.createHash("sha256").update(bytes).digest("hex") }
    },
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    permissionsVerified: true, rootDir: root, now: NOW,
    probeImage: () => { throw new Error("must not inspect symlink target"); },
    fetchImpl: async () => { requests++; return response({ id: PAGE_ID + "_999" }); }
  }), /unsafe|symbolic link/i);
  assert.equal(requests, 0, "unsafe symlinked assets must be rejected before any remote mutation");
});
