import test from "node:test";
import assert from "node:assert/strict";
import { verifyMetaCredentials } from "../scripts/verify-meta-credentials.mjs";

const pageId = "1431329126735709";
const config = {
  destinationPageId: pageId,
  destinationPageName: "Nature Frontiers",
  apiVersion: "v27.0",
  publishingEnabled: false,
  dryRun: true,
  emergencyStop: true
};
const env = {
  NATURE_FRONTIERS_FACEBOOK_PAGE_ID: pageId,
  META_USER_ACCESS_TOKEN: "user-token-secret-value-1234567890",
  META_PAGE_ACCESS_TOKEN: "page-token-secret-value-1234567890"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

test("invalid user token does not prevent an independent stored Page-token identity check", async () => {
  const requested = [];
  const fetchImpl = async (url) => {
    const value = String(url);
    requested.push(value);
    if (value.includes("/me?fields=id")) {
      return json({ error: { message: "The session is invalid because the user logged out.", code: 190, error_subcode: 467 } }, 401);
    }
    if (value.endsWith("/" + pageId + "?fields=id,name")) return json({ id: pageId, name: "Nature Frontiers" });
    throw new Error("Unexpected endpoint: " + value);
  };
  const report = await verifyMetaCredentials({ env, config, fetchImpl });
  assert.equal(report.result, "BLOCKED");
  assert.equal(report.userToken.status, "FAIL");
  assert.equal(report.userToken.httpStatus, 401);
  assert.equal(report.userToken.errorCode, 190);
  assert.equal(report.pageToken.status, "PASS");
  assert.equal(requested.length, 2);
  const serialized = JSON.stringify(report);
  for (const secret of [env.META_USER_ACCESS_TOKEN, env.META_PAGE_ACCESS_TOKEN]) assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes("derived-page-token"), false);
});

test("valid user and stored Page tokens are independently verified against the exact configured Page", async () => {
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/me?fields=id")) return json({ id: "123456789" });
    if (value.endsWith("/123456789/permissions")) {
      return json({ data: ["pages_show_list", "pages_read_engagement", "pages_manage_posts"].map(permission => ({ permission, status: "granted" })) });
    }
    if (value.includes("/me/accounts?")) {
      return json({ data: [{ id: pageId, name: "Nature Frontiers", tasks: ["CREATE_CONTENT"], access_token: "derived-page-token-never-log" }] });
    }
    if (value.endsWith("/" + pageId + "?fields=id,name")) return json({ id: pageId, name: "Nature Frontiers" });
    throw new Error("Unexpected endpoint: " + value);
  };
  const report = await verifyMetaCredentials({ env, config, fetchImpl });
  assert.equal(report.result, "PASS");
  assert.equal(report.userToken.status, "PASS", JSON.stringify(report));
  assert.deepEqual(report.userToken.grantedPermissions, ["pages_show_list", "pages_read_engagement", "pages_manage_posts"]);
  assert.equal(report.pageToken.status, "PASS");
  assert.equal(report.identityNamesMatch, true);
  const serialized = JSON.stringify(report);
  for (const secret of [env.META_USER_ACCESS_TOKEN, env.META_PAGE_ACCESS_TOKEN, "derived-page-token-never-log"]) assert.equal(serialized.includes(secret), false);
});

test("a missing stored Page token remains a separate blocker even when user permissions pass", async () => {
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/me?fields=id")) return json({ id: "123456789" });
    if (value.endsWith("/123456789/permissions")) {
      return json({ data: ["pages_show_list", "pages_read_engagement", "pages_manage_posts"].map(permission => ({ permission, status: "granted" })) });
    }
    if (value.includes("/me/accounts?")) {
      return json({ data: [{ id: pageId, name: "Nature Frontiers", tasks: ["CREATE_CONTENT"], access_token: "derived-page-token" }] });
    }
    throw new Error("Unexpected endpoint: " + value);
  };
  const report = await verifyMetaCredentials({ env: { ...env, META_PAGE_ACCESS_TOKEN: "" }, config, fetchImpl });
  assert.equal(report.userToken.status, "PASS");
  assert.equal(report.pageToken.status, "NOT_CONFIGURED");
  assert.equal(report.result, "BLOCKED");
});

test("a Page token for a different Page fails even when the user token is valid", async () => {
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.includes("/me?fields=id")) return json({ id: "123456789" });
    if (value.endsWith("/123456789/permissions")) {
      return json({ data: ["pages_show_list", "pages_read_engagement", "pages_manage_posts"].map(permission => ({ permission, status: "granted" })) });
    }
    if (value.includes("/me/accounts?")) {
      return json({ data: [{ id: pageId, name: "Nature Frontiers", tasks: ["CREATE_CONTENT"], access_token: "derived-page-token" }] });
    }
    if (value.endsWith("/" + pageId + "?fields=id,name")) return json({ id: "987654321", name: "Other Page" });
    throw new Error("Unexpected endpoint: " + value);
  };
  const report = await verifyMetaCredentials({ env, config, fetchImpl });
  assert.equal(report.userToken.status, "PASS");
  assert.equal(report.pageToken.status, "FAIL");
  assert.equal(report.result, "BLOCKED");
});

test("invalid owner-specified Page ID blocks both checks before any network request", async () => {
  let calls = 0;
  const report = await verifyMetaCredentials({
    env: { ...env, NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "wrong" },
    config,
    fetchImpl: async () => { calls += 1; return json({}); }
  });
  assert.equal(report.result, "BLOCKED");
  assert.equal(report.userToken.status, "BLOCKED_CONFIG");
  assert.equal(report.pageToken.status, "BLOCKED_CONFIG");
  assert.equal(calls, 0);
});
