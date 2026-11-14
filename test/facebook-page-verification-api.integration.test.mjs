import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";

async function getAvailablePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", resolve); });
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

async function startDashboard({ stateDir, token, pageId, pageToken, userToken, tracePath, failMode = "" }) {
  const port = await getAvailablePort();
  const mockPath = path.resolve("test/fixtures/mock-meta-page-fetch.mjs");
  const serverEnv = {
    ...process.env,
    DASHBOARD_OPERATOR_TOKEN: token,
    DASHBOARD_OPERATOR_ID: "meta-verification-test-operator",
    DASHBOARD_STATE_DIR: stateDir,
    PORT: String(port),
    DASHBOARD_HOST: "127.0.0.1",
    NATURE_FRONTIERS_FACEBOOK_PAGE_ID: pageId,
    META_PAGE_ACCESS_TOKEN: pageToken,
    META_USER_ACCESS_TOKEN: userToken,
    META_GRAPH_API_VERSION: "v26.0",
    MOCK_META_PAGE_ID: pageId,
    MOCK_META_PAGE_NAME: "Nature Frontiers",
    MOCK_META_USER_ID: "987654321098765",
    MOCK_META_TRACE_PATH: tracePath,
    MOCK_META_CONFIG_PATH: path.resolve("config/facebook-publishing.json"),
    MOCK_META_FAIL_MODE: failMode,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, "--import=" + mockPath].filter(Boolean).join(" ")
  };
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], { env: serverEnv, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) break;
    try { if ((await fetch(base + "/healthz")).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard did not start: " + logs);
  return { child, base, headers: { "content-type": "application/json", "x-operator-token": token }, logs: () => logs };
}

async function stopDashboard(instance) {
  if (instance.child.exitCode === null && instance.child.signalCode === null) {
    instance.child.kill("SIGTERM");
    await new Promise(resolve => instance.child.once("exit", resolve));
  }
}

test("mocked Meta Page verification persists identity, permission and audit evidence across concurrency and restart without enabling publication", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "meta-page-verification-"));
  const token = "meta-dashboard-test-token-" + "x".repeat(36);
  const pageId = "123456789012345";
  const pageToken = "mock-page-access-token-" + "p".repeat(32);
  const userToken = "mock-user-access-token-" + "u".repeat(32);
  const tracePath = path.join(stateDir, "provider-trace.jsonl");
  let server = await startDashboard({ stateDir, token, pageId, pageToken, userToken, tracePath });
  t.after(async () => { await stopDashboard(server); fs.rmSync(stateDir, { recursive: true, force: true }); });

  const verificationRequests = await Promise.all([1, 2].map(() =>
    fetch(server.base + "/api/facebook/verify-page", { method: "POST", headers: server.headers, body: JSON.stringify({}) })
  ));
  assert.deepEqual(verificationRequests.map(response => response.status), [200, 200]);
  const verificationBodies = await Promise.all(verificationRequests.map(response => response.json()));
  assert.ok(verificationBodies.every(body => body.permissionsConfirmed === true && body.publishingEnabled === false));
  assert.ok(verificationBodies.every(body => body.identity.pageId === pageId && body.identity.pageName === "Nature Frontiers"));

  const statePath = path.join(stateDir, "dashboard-state.json");
  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(persisted.facebookConnection.verified, true);
  assert.equal(persisted.facebookConnection.permissionsVerified, true);
  assert.equal(persisted.facebookConnection.pageId, pageId);
  assert.equal(persisted.facebookConnection.pageName, "Nature Frontiers");
  assert.notEqual(persisted.facebookConnection.pageTokenFingerprint, pageToken);
  assert.notEqual(persisted.facebookConnection.userTokenFingerprint, userToken);
  assert.equal(persisted.audit.filter(event => event.action === "FACEBOOK_PAGE_IDENTITY_VERIFIED").length, 2,
    "each successful explicit identity check must have one reviewer-attributed audit event");
  assert.ok(persisted.audit.filter(event => event.action === "FACEBOOK_PAGE_IDENTITY_VERIFIED").every(event => event.actor === "meta-verification-test-operator"));
  const providerCalls = fs.readFileSync(tracePath, "utf8").trim().split("\n").map(line => JSON.parse(line));
  assert.equal(providerCalls.length, 8, "two verifications each perform user identity, permission, managed-Page and Page identity reads");
  assert.ok(providerCalls.every(call => call.method === "GET"), "identity verification must not perform a provider mutation");
  assert.equal(providerCalls.filter(call => call.pathname.endsWith("/me")).length, 2, "each verification resolves the numeric user ID");
  assert.equal(providerCalls.filter(call => call.pathname.endsWith("/987654321098765/permissions")).length, 2, "each verification reads permissions from the numeric user edge");
  assert.equal(providerCalls.filter(call => call.pathname.endsWith("/me/accounts")).length, 2);
  assert.equal(providerCalls.filter(call => call.pathname.endsWith("/" + pageId)).length, 2);

  await stopDashboard(server);
  server = await startDashboard({ stateDir, token, pageId, pageToken, userToken, tracePath });
  const recoveredResponse = await fetch(server.base + "/api/facebook/state", { headers: server.headers });
  assert.equal(recoveredResponse.status, 200);
  const recovered = await recoveredResponse.json();
  assert.equal(recovered.pageIdentityVerified, true);
  assert.equal(recovered.permissionsConfirmed, true);
  assert.equal(recovered.publishingEnabled, false);
  assert.equal(recovered.dryRun, true);
  const afterRestart = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(afterRestart.audit.filter(event => event.action === "FACEBOOK_PAGE_IDENTITY_VERIFIED").length, 2);

  // The provider credentials and verified identity are deliberately not
  // sufficient to publish: the owner-controlled emergency stop, publishing
  // switch and dry-run defaults remain active in the real repository config.
  const beforeBlockedPublish = fs.readFileSync(statePath);
  const providerTraceBeforePublish = fs.readFileSync(tracePath);
  const blockedPublishResponses = await Promise.all([1, 2].map(() =>
    fetch(server.base + "/api/facebook/publish", {
      method: "POST", headers: server.headers,
      body: JSON.stringify({ draftId: "not-authorized-for-publication", confirmOperation: true })
    })
  ));
  assert.deepEqual(blockedPublishResponses.map(response => response.status), [409, 409]);
  const blockedPublishBodies = await Promise.all(blockedPublishResponses.map(response => response.json()));
  assert.ok(blockedPublishBodies.every(body => body.publishingEnabled === false && body.blockers.some(item => /emergency stop is active/i.test(item))));
  assert.deepEqual(fs.readFileSync(statePath), beforeBlockedPublish, "disabled publication must not create attempts or audit events");
  assert.deepEqual(fs.readFileSync(tracePath), providerTraceBeforePublish, "disabled publication must not call the Meta provider");

  await stopDashboard(server);
  server = await startDashboard({ stateDir, token, pageId, pageToken, userToken, tracePath });
  const afterBlockedPublishRestart = fs.readFileSync(statePath);
  assert.deepEqual(afterBlockedPublishRestart, beforeBlockedPublish, "disabled publication remains a no-op after restart");

  // A provider permission failure must not mutate the last verified record or audit.
  await stopDashboard(server);
  server = await startDashboard({ stateDir, token, pageId, pageToken, userToken, tracePath, failMode: "missing-permission" });
  const beforeFailure = fs.readFileSync(statePath);
  const failed = await fetch(server.base + "/api/facebook/verify-page", { method: "POST", headers: server.headers, body: JSON.stringify({}) });
  assert.equal(failed.status, 502);
  assert.deepEqual(fs.readFileSync(statePath), beforeFailure, "failed provider verification must preserve the last verified identity and audit byte-for-byte");
  assert.equal(recovered.publishingEnabled, false);
});
