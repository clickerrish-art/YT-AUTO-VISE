import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { verifyMetaPageIdentity, verifyMetaPagePermissions, publishMetaPagePost, fetchMetaPagePost, reconcileMetaPagePost, createMetaUnpublishedPageDraft, fetchMetaUnpublishedPageDraft, reconcileMetaUnpublishedPageDraft, metaProviderDraftPayloadSha256, MetaPageApiError } from "../scripts/meta-page-adapter.mjs";
import { facebookApprovalFingerprint } from "../scripts/facebook-pipeline.mjs";

const PAGE_ID = "123456789012345";
const TOKEN = "test-token-never-log-" + "x".repeat(30);
const API = "v27.0";
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
  assert.equal(called.options.redirect, "error");
  await assert.rejects(() => verifyMetaPageIdentity({
    pageId: PAGE_ID, expectedPageId: "999999999999999", accessToken: TOKEN, apiVersion: API,
    fetchImpl: async () => { throw new Error("must not call"); }
  }), /does not match/i);
});

test("Meta permission verification requires granted scopes, exact Page identity, Page task and runtime Page token", async () => {
  const userToken = "user-access-token-" + "u".repeat(30);
  const calls = [];
  const result = await verifyMetaPagePermissions({
    pageId: PAGE_ID, userAccessToken: userToken, apiVersion: API,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith("/me?fields=id")) return response({ id: "987654321098765" });
      if (url.endsWith("/987654321098765/permissions")) return response({ data: [
        { permission: "pages_show_list", status: "granted" },
        { permission: "pages_read_engagement", status: "granted" },
        { permission: "pages_manage_posts", status: "granted" }
      ] });
      return response({ data: [{ id: PAGE_ID, name: "Nature Frontiers", tasks: ["CREATE_CONTENT", "MODERATE"], access_token: TOKEN }] });
    }
  });
  assert.equal(result.permissionsVerified, true);
  assert.equal(result.pageAccessToken, TOKEN);
  assert.deepEqual(result.grantedPermissions, ["pages_show_list", "pages_read_engagement", "pages_manage_posts"]);
  assert.ok(result.tasks.includes("CREATE_CONTENT"));
  assert.equal(calls.length, 3);
  assert.ok(calls.every(call => call.options.redirect === "error"));
  assert.equal(new URL(calls[0].url).searchParams.has("access_token"), false);
  await assert.rejects(() => verifyMetaPagePermissions({
    pageId: PAGE_ID, userAccessToken: userToken, apiVersion: API,
    fetchImpl: async url => String(url).endsWith("/me?fields=id")
      ? response({ id: "987654321098765" })
      : String(url).endsWith("/987654321098765/permissions")
        ? response({ data: [{ permission: "pages_show_list", status: "granted" }, { permission: "pages_manage_posts", status: "granted" }] })
        : response({ data: [{ id: PAGE_ID, name: "Nature Frontiers", tasks: ["CREATE_CONTENT"], access_token: TOKEN }] })
  }), /permissions are missing/i);
  await assert.rejects(() => verifyMetaPagePermissions({
    pageId: PAGE_ID, userAccessToken: userToken, apiVersion: API,
    fetchImpl: async url => String(url).endsWith("/me?fields=id")
      ? response({ id: "987654321098765" })
      : String(url).endsWith("/987654321098765/permissions")
        ? response({ data: [
            { permission: "pages_show_list", status: "granted" },
            { permission: "pages_read_engagement", status: "granted" },
            { permission: "pages_manage_posts", status: "granted" }
          ] })
        : response({ data: [{ id: PAGE_ID, name: "Nature Frontiers", tasks: ["CREATE_CONTENT"] }] })
  }), /usable Page access token/i);
});

test("Meta publish adapter schedules a future post and performs no retries", async () => {
  let calls = 0, request;
  const draft = { kind: "FACEBOOK_PAGE_DRAFT", caption: "Verified draft caption", scheduledAt: "2026-10-25T06:00:00.000Z", media: null };
  const result = await publishMetaPagePost({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    permissionsVerified: true, now: NOW,
    fetchImpl: async (url, options) => {
      calls++; request = { url, options };
      assert.equal(url, "https://graph.facebook.com/v27.0/123456789012345/feed");
      return response({ id: PAGE_ID + "_999" });
    }
  });
  assert.equal(calls, 1);
  assert.equal(result.remotePostId, PAGE_ID + "_999");
  assert.equal(result.verifiedRemotely, false);
  assert.equal(request.options.headers.authorization, "Bearer " + TOKEN);
  assert.equal(request.options.redirect, "error");
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
  let request, readRequest;
  const draft = { kind: "FACEBOOK_PAGE_DRAFT", caption: "Caption", scheduledAt: "2026-10-25T06:00:00.000Z", media: { path: "image.jpg", sha256: sha } };
  const published = await publishMetaPagePost({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, permissionsVerified: true, rootDir: root, now: NOW, probeImage: () => ({ width: 640, height: 480 }),
    fetchImpl: async (url, options) => { request = { url, options }; return response({ id: "photo-777", post_id: PAGE_ID + "_888" }); }
  });
  assert.equal(published.remotePostId, PAGE_ID + "_888");
  await assert.rejects(() => publishMetaPagePost({ draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API, permissionsVerified: true, rootDir: root, now: NOW, probeImage: () => { throw new MetaPageApiError("simulated decode failure"); }, fetchImpl: async () => response({ id: "should-not-publish" }) }), /simulated decode failure/i);
  assert.equal(request.url, "https://graph.facebook.com/v27.0/123456789012345/photos");
  assert.ok(request.options.body.get("source") instanceof Blob);
  await assert.rejects(() => publishMetaPagePost({
    draft: { ...draft, media: { ...draft.media, sha256: "a".repeat(64) } }, pageId: PAGE_ID, expectedPageId: PAGE_ID,
    accessToken: TOKEN, apiVersion: API, permissionsVerified: true, rootDir: root, now: NOW, fetchImpl: async () => response({})
  }), /checksum/i);

  const verified = await fetchMetaPagePost({
    remotePostId: PAGE_ID + "_888", expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    fetchImpl: async (url, options) => {
      readRequest = { url, options };
      assert.match(url, /fields=id,message,created_time,permalink_url,is_published,scheduled_publish_time/);
      return response({ id: PAGE_ID + "_888", message: "Caption", created_time: "2026-10-24T10:00:00Z", permalink_url: "https://www.facebook.com/" + PAGE_ID + "_888", is_published: false, scheduled_publish_time: 1792908000 });
    }
  });
  assert.equal(verified.status, "SCHEDULED_VERIFIED");
  assert.equal(readRequest.options.redirect, "error");
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
  const urls = [], requestOptions = [];
  const result = await verifyMetaPagePermissions({
    pageId: PAGE_ID, userAccessToken: userToken, apiVersion: API,
    fetchImpl: async (url, options) => {
      urls.push(String(url));
      requestOptions.push(options);
      if (String(url).endsWith("/me?fields=id")) return response({ id: "987654321098765" });
      if (String(url).endsWith("/987654321098765/permissions")) return response({ data: [
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
  assert.equal(urls.length, 4);
  assert.ok(requestOptions.every(options => options.redirect === "error"));
  assert.ok(urls.every(url => !url.includes(userToken) && !url.includes(TOKEN)));
});


test("uncertain Facebook mutation is reconciled against the scheduled-post edge with bounded pagination", async () => {
  const calls = [], requestOptions = [];
  const result = await reconcileMetaPagePost({
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    caption: "Exact scheduled caption", scheduledAt: "2026-10-25T06:00:00.000Z",
    attemptStartedAt: "2026-10-24T10:00:00.000Z",
    fetchImpl: async (url, options) => {
      calls.push(String(url));
      requestOptions.push(options);
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
  assert.ok(requestOptions.every(options => options.redirect === "error"));
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


test("Meta scheduled mutations reject timezone-free and impossible timestamps before any request", async () => {
  const baseDraft = { kind: "FACEBOOK_PAGE_DRAFT", caption: "Caption", scheduledAt: "2026-10-25T06:00:00.000Z", media: null };
  const invalidTimestamps = [
    "2026-10-25T06:00:00",
    "2026-02-30T06:00:00.000Z",
    "2026-10-25T06:00:00+15:00",
    "2026-10-25T06:60:00.000Z"
  ];
  let requests = 0;
  for (const scheduledAt of invalidTimestamps) {
    await assert.rejects(() => publishMetaPagePost({
      draft: { ...baseDraft, scheduledAt },
      pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
      permissionsVerified: true, now: NOW,
      fetchImpl: async () => { requests++; return response({ id: PAGE_ID + "_999" }); }
    }), /calendar-valid ISO timestamp with an explicit timezone/i, scheduledAt);
  }
  assert.equal(requests, 0, "invalid schedule timestamps must be rejected before a remote mutation");
});


test("Meta permission verification fails closed when the configured Page is absent from the managed-Page list", async () => {
  const userToken = "user-access-token-" + "d".repeat(30);
  let directPageRequested = false;
  await assert.rejects(() => verifyMetaPagePermissions({
    pageId: PAGE_ID, userAccessToken: userToken, apiVersion: API,
    fetchImpl: async (url, options) => {
      assert.equal(options.headers.authorization, "Bearer " + userToken);
      assert.equal(options.redirect, "error");
      if (String(url).endsWith("/me?fields=id")) return response({ id: "987654321098765" });
      if (String(url).endsWith("/987654321098765/permissions")) return response({ data: [
        { permission: "pages_show_list", status: "granted" },
        { permission: "pages_read_engagement", status: "granted" },
        { permission: "pages_manage_posts", status: "granted" }
      ] });
      if (String(url).includes("/me/accounts?")) return response({ data: [] });
      directPageRequested = true;
      return response({ id: PAGE_ID, name: "Nature Frontiers", access_token: TOKEN });
    }
  }), /not returned by the authenticated account's managed-Page list/i);
  assert.equal(directPageRequested, false, "direct Page identity must not substitute for managed Page task authorization");
});

test("expired or revoked user and Page tokens fail closed without any automatic OAuth exchange", async () => {
  const userToken = "expired-user-token-" + "u".repeat(30);
  const pageToken = "expired-page-token-" + "p".repeat(30);
  const paths = [];
  await assert.rejects(() => verifyMetaPagePermissions({
    pageId: PAGE_ID, userAccessToken: userToken, apiVersion: API,
    fetchImpl: async url => {
      const parsed = new URL(url); paths.push(parsed.pathname);
      return response({ error: { code: 190, message: "Invalid OAuth access token" } }, 400);
    }
  }), error => error instanceof MetaPageApiError && error.code === 190 && !error.message.includes(userToken));
  assert.deepEqual(paths, ["/v27.0/me"]);
  paths.length = 0;
  await assert.rejects(() => verifyMetaPageIdentity({
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: pageToken, apiVersion: API,
    fetchImpl: async url => {
      const parsed = new URL(url); paths.push(parsed.pathname);
      return response({ error: { code: 190, message: "Invalid OAuth access token" } }, 400);
    }
  }), error => error instanceof MetaPageApiError && error.code === 190 && !error.message.includes(pageToken));
  assert.deepEqual(paths, ["/v27.0/" + PAGE_ID]);
  assert.ok(paths.every(item => !item.includes("/oauth/access_token")));
});


function approvedProviderDraft() {
  const draft = {
    id: "provider-draft-001", kind: "FACEBOOK_PAGE_DRAFT",
    destination: "nature_frontiers_facebook",
    destinationPageId: PAGE_ID, expectedPageId: PAGE_ID,
    caption: "A reviewed wildlife education draft.",
    status: "APPROVED_DRAFT", media: null, claims: [],
    complianceVersion: "nf-facebook-baseline-2026-10-v2",
    approval: { decision: "APPROVE", reviewer: "operator", fingerprint: "" }
  };
  draft.approval.fingerprint = facebookApprovalFingerprint(draft);
  return draft;
}
function providerDraftAuthorization(draft, now = NOW) {
  return {
    operation: "CREATE_UNPUBLISHED_PROVIDER_DRAFT", confirmed: true, oneShot: true,
    draftId: draft.id, pageId: PAGE_ID,
    approvalFingerprint: draft.approval.fingerprint,
    payloadSha256: metaProviderDraftPayloadSha256(draft),
    nonce: "provider-draft-nonce-000001",
    issuedAt: new Date(now - 1000).toISOString(),
    expiresAt: new Date(now + 60_000).toISOString()
  };
}

test("unpublished provider draft binds exact approval, Page and payload and never schedules or publishes", async () => {
  const draft = approvedProviderDraft();
  let calls = 0, request;
  const result = await createMetaUnpublishedPageDraft({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN,
    apiVersion: API, permissionsVerified: true,
    authorization: providerDraftAuthorization(draft), now: NOW,
    fetchImpl: async (url, options) => {
      calls++; request = { url, options };
      return response({ id: PAGE_ID + "_provider_001" });
    }
  });
  assert.equal(calls, 1);
  assert.equal(new URL(request.url).pathname, "/" + API + "/" + PAGE_ID + "/feed");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.body.get("published"), "false");
  assert.equal(request.options.body.get("message"), draft.caption);
  assert.equal(request.options.body.has("scheduled_publish_time"), false);
  assert.equal(result.status, "REMOTE_UNPUBLISHED_UNVERIFIED");
  assert.equal(result.remotePostId, PAGE_ID + "_provider_001");
  assert.equal(result.payloadSha256, metaProviderDraftPayloadSha256(draft));
  assert.equal(result.publishingEnabled, false);
});

test("provider draft rejects missing one-shot authorization before network mutation", async () => {
  const draft = approvedProviderDraft();
  let calls = 0;
  await assert.rejects(() => createMetaUnpublishedPageDraft({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN,
    permissionsVerified: true, now: NOW, fetchImpl: async () => { calls++; return response({ id: PAGE_ID + "_1" }); }
  }), /one-shot authorization/i);
  assert.equal(calls, 0);
});

test("expired Meta token fails closed and does not retry provider mutation", async () => {
  const draft = approvedProviderDraft();
  let calls = 0;
  await assert.rejects(() => createMetaUnpublishedPageDraft({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN,
    permissionsVerified: true, authorization: providerDraftAuthorization(draft), now: NOW,
    fetchImpl: async () => { calls++; return response({ error: { code: 190, message: "Invalid OAuth access token" } }, 400); }
  }), error => error instanceof MetaPageApiError && error.code === 190);
  assert.equal(calls, 1);
});

test("provider draft rejects a Page identity different from the owner-verified Page", async () => {
  const draft = approvedProviderDraft();
  let calls = 0;
  const authorization = { ...providerDraftAuthorization(draft), pageId: "999999999999999" };
  await assert.rejects(() => createMetaUnpublishedPageDraft({
    draft, pageId: "999999999999999", expectedPageId: "999999999999999", accessToken: TOKEN,
    permissionsVerified: true, authorization, now: NOW,
    fetchImpl: async () => { calls++; return response({ id: PAGE_ID + "_1" }); }
  }), /does not match the exact verified Nature Frontiers Page/i);
  assert.equal(calls, 0);
});

test("provider draft rejects any payload modified after human approval", async () => {
  const draft = approvedProviderDraft();
  const authorization = providerDraftAuthorization(draft);
  draft.caption += " changed after approval";
  let calls = 0;
  await assert.rejects(() => createMetaUnpublishedPageDraft({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN,
    permissionsVerified: true, authorization, now: NOW,
    fetchImpl: async () => { calls++; return response({ id: PAGE_ID + "_1" }); }
  }), /changed after approval/i);
  assert.equal(calls, 0);
});

test("provider-draft payload fingerprint changes on material content changes", () => {
  const draft = approvedProviderDraft();
  const original = metaProviderDraftPayloadSha256(draft);
  assert.notEqual(metaProviderDraftPayloadSha256({ ...draft, caption: "A different caption" }), original);
  assert.notEqual(metaProviderDraftPayloadSha256({ ...draft, id: "another-draft" }), original);
});

test("provider-draft create timeout is uncertain and never automatically retried", async () => {
  const draft = approvedProviderDraft();
  let calls = 0;
  await assert.rejects(() => createMetaUnpublishedPageDraft({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN,
    permissionsVerified: true, authorization: providerDraftAuthorization(draft), now: NOW,
    fetchImpl: async () => { calls++; throw new Error("socket timed out after request dispatch"); }
  }), error => error instanceof MetaPageApiError && error.uncertain === true && error.retryable === false);
  assert.equal(calls, 1);
});

test("provider-draft timeout after remote creation remains uncertain rather than retryable", async () => {
  const draft = approvedProviderDraft();
  let calls = 0;
  await assert.rejects(() => createMetaUnpublishedPageDraft({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN,
    permissionsVerified: true, authorization: providerDraftAuthorization(draft), now: NOW,
    fetchImpl: async () => { calls++; throw new Error("response lost after remote creation"); }
  }), error => error instanceof MetaPageApiError && error.uncertain === true);
  assert.equal(calls, 1);
});

test("provider-draft remote read-back verifies exact ID, caption, Page and unpublished state", async () => {
  const remotePostId = PAGE_ID + "_provider_002";
  const result = await fetchMetaUnpublishedPageDraft({
    remotePostId, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    expectedMessage: "A reviewed wildlife education draft.",
    fetchImpl: async url => {
      assert.ok(String(url).includes(encodeURIComponent(remotePostId)));
      return response({ id: remotePostId, message: "A reviewed wildlife education draft.",
        is_published: false, from: { id: PAGE_ID }, created_time: "2026-11-22T10:00:00+0000" });
    }
  });
  assert.equal(result.status, "UNPUBLISHED_PROVIDER_DRAFT_VERIFIED");
  assert.equal(result.isPublished, false);
});

test("provider-draft read-back failure is retryable as a read only, never as a create", async () => {
  let calls = 0;
  await assert.rejects(() => fetchMetaUnpublishedPageDraft({
    remotePostId: PAGE_ID + "_provider_003", expectedPageId: PAGE_ID,
    accessToken: TOKEN, apiVersion: API,
    fetchImpl: async () => { calls++; throw new Error("read timed out"); }
  }), error => error instanceof MetaPageApiError && error.retryable === true);
  assert.equal(calls, 1);
});

test("provider-draft read-back rejects an object that is unexpectedly published", async () => {
  await assert.rejects(() => fetchMetaUnpublishedPageDraft({
    remotePostId: PAGE_ID + "_provider_004", expectedPageId: PAGE_ID,
    accessToken: TOKEN, apiVersion: API,
    fetchImpl: async () => response({ id: PAGE_ID + "_provider_004", message: "A reviewed wildlife education draft.", is_published: true, from: { id: PAGE_ID } })
  }), error => error instanceof MetaPageApiError && error.uncertain === true && /not demonstrably unpublished/i.test(error.message));
});

test("provider-draft read-back rejects wrong Page and changed caption", async () => {
  await assert.rejects(() => fetchMetaUnpublishedPageDraft({
    remotePostId: PAGE_ID + "_provider_005", expectedPageId: PAGE_ID,
    accessToken: TOKEN, apiVersion: API, expectedMessage: "approved",
    fetchImpl: async () => response({ id: PAGE_ID + "_provider_005", message: "modified", is_published: false, from: { id: "999999999999999" } })
  }), /does not match the exact Page/i);
});

test("provider-draft reconciliation after restart reads known remote ID without creating again", async () => {
  let calls = 0;
  const args = {
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    caption: "A reviewed wildlife education draft.",
    attemptStartedAt: "2026-11-22T10:00:00.000Z",
    remotePostId: PAGE_ID + "_provider_006",
    fetchImpl: async () => {
      calls++;
      return response({ id: PAGE_ID + "_provider_006", message: "A reviewed wildlife education draft.", is_published: false, from: { id: PAGE_ID } });
    }
  };
  const first = await reconcileMetaUnpublishedPageDraft(args);
  const recovered = await reconcileMetaUnpublishedPageDraft(args);
  assert.equal(first.outcome, "CONFIRMED_UNPUBLISHED");
  assert.equal(recovered.outcome, "CONFIRMED_UNPUBLISHED");
  assert.equal(calls, 2, "recovery performs read-only verification only");
});

test("provider-draft reconciliation with no matching feed result remains unresolved and forbids retry", async () => {
  const result = await reconcileMetaUnpublishedPageDraft({
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    caption: "A reviewed wildlife education draft.",
    attemptStartedAt: "2026-11-22T10:00:00.000Z",
    fetchImpl: async () => response({ data: [] })
  });
  assert.equal(result.outcome, "UNRESOLVED");
  assert.equal(result.retryAllowed, false);
});

test("provider-draft reconciliation rejects multiple remote candidates as ambiguous", async () => {
  const result = await reconcileMetaUnpublishedPageDraft({
    pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN, apiVersion: API,
    caption: "A reviewed wildlife education draft.",
    attemptStartedAt: "2026-11-22T10:00:00.000Z",
    fetchImpl: async () => response({ data: [
      { id: PAGE_ID + "_a", message: "A reviewed wildlife education draft.", is_published: false },
      { id: PAGE_ID + "_b", message: "A reviewed wildlife education draft.", is_published: false }
    ] })
  });
  assert.equal(result.outcome, "AMBIGUOUS");
  assert.equal(result.retryAllowed, false);
});

test("provider-draft adapter never issues a publishing or scheduling follow-up", async () => {
  const draft = approvedProviderDraft();
  const methods = [];
  await createMetaUnpublishedPageDraft({
    draft, pageId: PAGE_ID, expectedPageId: PAGE_ID, accessToken: TOKEN,
    permissionsVerified: true, authorization: providerDraftAuthorization(draft), now: NOW,
    fetchImpl: async (url, options) => {
      methods.push({ method: options.method, url: String(url), body: options.body });
      return response({ id: PAGE_ID + "_provider_007" });
    }
  });
  assert.equal(methods.length, 1);
  assert.equal(methods[0].method, "POST");
  assert.equal(methods[0].body.get("published"), "false");
  assert.equal(methods[0].body.has("scheduled_publish_time"), false);
});
