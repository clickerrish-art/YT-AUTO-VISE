import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  CloudflareDashboardStateClient, DashboardStateConflictError,
  DashboardStateServiceError, validateRemoteDashboardState
} from "../scripts/cloudflare-dashboard-state-client.mjs";

const TOKEN = "test-cloudflare-operator-token-long-enough";
const state = (queueItems = []) => ({
  version: 1, queueItems, campaigns: [], audit: [], jobs: [], uploads: [],
  facebookDrafts: [], facebookPosts: [], facebookAttempts: [], publishingEnabled: false
});

async function fixture(t, handler) {
  const server = http.createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    let body;
    try { body = raw ? JSON.parse(raw) : undefined; } catch {}
    handler(req, res, body);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = server.address();
  return new CloudflareDashboardStateClient({
    baseUrl: `http://127.0.0.1:${address.port}`, operatorToken: TOKEN
  });
}
function respond(res, status, payload, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(payload));
}

test("remote state validation preserves fail-closed publishing and Safari rules", () => {
  assert.equal(validateRemoteDashboardState(state()).publishingEnabled, false);
  assert.throws(() => validateRemoteDashboardState({ version: 1, queueItems: [] }), /audit/);
  assert.throws(() => validateRemoteDashboardState({ ...state(), unattendedPublishingEnabled: true }), /publishing disabled/);
  assert.throws(() => validateRemoteDashboardState({ ...state(), campaigns: [{ type: "safari_affiliate", status: "ACTIVE" }] }), /Safari/);
});

test("client requires a secure endpoint and a sufficiently strong operator token", () => {
  assert.throws(() => new CloudflareDashboardStateClient({ baseUrl: "http://example.com", operatorToken: TOKEN }), /HTTPS/);
  assert.throws(() => new CloudflareDashboardStateClient({ baseUrl: "https://state.example", operatorToken: "short" }), /24 characters/);
});

test("bootstrap creates the first state revision and verifies its receipt", async t => {
  const client = await fixture(t, (req, res, body) => {
    assert.equal(req.method, "POST");
    assert.equal(req.url, "/api/state/bootstrap");
    assert.equal(req.headers["x-operator-token"], TOKEN);
    assert.equal(body.publishingEnabled, false);
    respond(res, 201, { revision: 1, state: body }, { etag: '"1"' });
  });
  const result = await client.bootstrapState(state(["seed"]));
  assert.equal(result.revision, 1);
  assert.deepEqual(result.state.queueItems, ["seed"]);
});

test("GET reads authenticated state and verifies the revision ETag", async t => {
  const client = await fixture(t, (req, res) => {
    assert.equal(req.url, "/api/state");
    assert.equal(req.headers["x-operator-token"], TOKEN);
    respond(res, 200, { revision: 7, updatedAt: "2026-11-08T00:00:00.000Z", state: state(["draft"]) }, { etag: '"7"' });
  });
  const result = await client.getState();
  assert.equal(result.revision, 7);
  assert.deepEqual(result.state.queueItems, ["draft"]);
});

test("GET rejects a mismatched ETag rather than accepting an ambiguous snapshot", async t => {
  const client = await fixture(t, (_req, res) => respond(res, 200, { revision: 7, state: state() }, { etag: '"6"' }));
  await assert.rejects(client.getState(), error => error instanceof DashboardStateServiceError && error.code === "INVALID_RESPONSE");
});

test("PUT sends If-Match and validates the incremented revision", async t => {
  const client = await fixture(t, (req, res, body) => {
    assert.equal(req.method, "PUT");
    assert.equal(req.url, "/api/state");
    assert.equal(req.headers["if-match"], "7");
    assert.equal(body.queueItems[0], "updated");
    respond(res, 200, { revision: 8, updatedAt: "2026-11-08T00:01:00.000Z", state: body }, { etag: '"8"' });
  });
  const result = await client.updateState(state(["updated"]), 7);
  assert.equal(result.revision, 8);
  assert.deepEqual(result.state.queueItems, ["updated"]);
});

test("PUT rejects a successful response with a mismatched ETag", async t => {
  const client = await fixture(t, (_req, res, body) =>
    respond(res, 200, { revision: 8, state: body }, { etag: '"7"' }));
  await assert.rejects(client.updateState(state(), 7), error =>
    error instanceof DashboardStateServiceError && error.code === "INVALID_RESPONSE");
});

test("PUT exposes revision conflicts and never retries a stale write", async t => {
  let calls = 0;
  const client = await fixture(t, (_req, res) => { calls++; respond(res, 409, { code: "REVISION_CONFLICT", error: "reload" }); });
  await assert.rejects(client.updateState(state(), 7), error => error instanceof DashboardStateConflictError && error.status === 409);
  assert.equal(calls, 1);
});

test("PUT refuses invalid state before making a network request", async t => {
  let calls = 0;
  const client = await fixture(t, (_req, res) => { calls++; respond(res, 200, {}); });
  await assert.rejects(client.updateState({ ...state(), publishingEnabled: true }, 1), /publishing disabled/);
  assert.equal(calls, 0);
});

test("backup and restore return verified, monotonic receipts", async t => {
  const client = await fixture(t, (req, res, body) => {
    if (req.url === "/api/backups" && req.method === "POST") {
      respond(res, 201, { backupId: "backup-1", sourceRevision: 4, sha256: "a".repeat(64), createdAt: "2026-11-08T00:00:00.000Z" });
      return;
    }
    assert.equal(req.url, "/api/backups/restore");
    assert.deepEqual(body, { backupId: "backup-1", expectedRevision: 4 });
    respond(res, 200, { revision: 5, state: state(["restored"]) }, { etag: '"5"' });
  });
  const backup = await client.createBackup();
  assert.equal(backup.sourceRevision, 4);
  const restored = await client.restoreBackup(backup.backupId, 4);
  assert.equal(restored.revision, 5);
  assert.deepEqual(restored.state.queueItems, ["restored"]);
});

test("network errors do not leak the operator token", async () => {
  const client = new CloudflareDashboardStateClient({
    baseUrl: "https://state.example.invalid", operatorToken: TOKEN,
    fetchImpl: async () => { throw new Error("socket failed for " + TOKEN); }
  });
  await assert.rejects(client.getState(), error =>
    error instanceof DashboardStateServiceError && error.code === "NETWORK_ERROR" && !error.message.includes(TOKEN));
});

test("a timeout fails closed with a stable error", async () => {
  const client = new CloudflareDashboardStateClient({
    baseUrl: "https://state.example.invalid", operatorToken: TOKEN, timeoutMs: 100,
    fetchImpl: (_url, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => {
      const error = new Error("aborted"); error.name = "AbortError"; reject(error);
    }, { once: true }))
  });
  await assert.rejects(client.getState(), error => error.code === "TIMEOUT");
});
