import fs from "node:fs";
import path from "node:path";

const pageId = process.env.MOCK_META_PAGE_ID ?? "123456789012345";
const pageName = process.env.MOCK_META_PAGE_NAME ?? "Nature Frontiers";
const pageToken = process.env.META_PAGE_ACCESS_TOKEN ?? "";
const userToken = process.env.META_USER_ACCESS_TOKEN ?? "";
const tracePath = process.env.MOCK_META_TRACE_PATH ?? "";
const originalFetch = globalThis.fetch;
const originalReadFileSync = fs.readFileSync;

// Keep the repository's real Page ID empty. The test preloader supplies an
// isolated allowlist value in memory only; it never edits tracked config.
const configPath = path.resolve(process.env.MOCK_META_CONFIG_PATH ?? "config/facebook-publishing.json");
fs.readFileSync = function (file, options) {
  if (path.resolve(String(file)) === configPath) {
    const source = originalReadFileSync.call(this, file, "utf8");
    const config = JSON.parse(source);
    config.destinationPageId = pageId;
    const serialized = JSON.stringify(config, null, 2) + "\n";
    return options === "utf8" || options === "utf-8" ? serialized : Buffer.from(serialized);
  }
  return originalReadFileSync.apply(this, arguments);
};

function respond(status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

globalThis.fetch = async function (input, init = {}) {
  const url = new URL(typeof input === "string" ? input : input.url);
  if (url.hostname !== "graph.facebook.com") return originalFetch(input, init);
  const method = String(init.method ?? input.method ?? "GET").toUpperCase();
  if (tracePath) fs.appendFileSync(tracePath, JSON.stringify({ method, pathname: url.pathname }) + "\n", { mode: 0o600 });
  if (method !== "GET") return respond(405, { error: { message: "Mock Meta identity adapter is read-only" } });
  const authorization = new Headers(init.headers ?? input.headers).get("authorization") ?? "";
  if (url.pathname.endsWith("/me/permissions")) {
    if (authorization !== "Bearer " + userToken) return respond(401, { error: { message: "Invalid mock user token" } });
    const permissions = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];
    if (process.env.MOCK_META_FAIL_MODE === "missing-permission") permissions.pop();
    return respond(200, { data: permissions.map(permission => ({ permission, status: "granted" })) });
  }
  if (url.pathname.endsWith("/me/accounts")) {
    if (authorization !== "Bearer " + userToken) return respond(401, { error: { message: "Invalid mock user token" } });
    return respond(200, { data: [{ id: pageId, name: pageName, tasks: ["CREATE_CONTENT", "MANAGE"], access_token: pageToken }] });
  }
  if (url.pathname.endsWith("/" + pageId)) {
    if (authorization !== "Bearer " + pageToken) return respond(401, { error: { message: "Invalid mock Page token" } });
    return respond(200, { id: pageId, name: pageName });
  }
  return respond(404, { error: { message: "Unexpected mock Meta Graph API path" } });
};
