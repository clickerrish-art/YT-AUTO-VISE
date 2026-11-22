import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const pageId = "123456789012345678";
const pageName = "Nature Frontiers Test Fixture";
const userId = "1234567890";
const pageToken = "test-page-access-token-" + "p".repeat(32);
const userToken = "test-user-access-token-" + "u".repeat(32);
const operatorToken = "test-provider-draft-token-" + "o".repeat(40);
const remotePostId = pageId + "_987654321";
const caption = "TEST ONLY: Field observations describe what was seen, record context, and distinguish evidence from interpretation.";
const apiVersion = "v27.0";

function sha256(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}
async function request(base, route, method, body, token) {
  return fetch(new URL(route, base), {
    method,
    headers: { "x-operator-token": token, "content-type": "application/json", connection: "close" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}
async function readJson(response) { return { status: response.status, body: await response.json() }; }

test("Meta provider-draft API creates one unpublished object, fences concurrent duplicates, and reconciles read-only", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "meta-provider-draft-api-"));
  const configPath = path.join(stateDir, "facebook-publishing.test.json");
  const mediaName = ".meta-provider-test-" + path.basename(stateDir) + ".png";
  const licenseName = ".meta-provider-license-" + path.basename(stateDir) + ".txt";
  const mediaPath = path.join(projectRoot, "test", mediaName);
  const licensePath = path.join(projectRoot, "test", licenseName);
  const mediaBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/fS8AAAAASUVORK5CYII=", "base64");
  const licenseBytes = Buffer.from("TEST ONLY: synthetic fixture for mocked API integration. Not a real license or production rights evidence.\n");
  fs.writeFileSync(mediaPath, mediaBytes, { mode: 0o600 });
  fs.writeFileSync(licensePath, licenseBytes, { mode: 0o600 });
  const config = JSON.parse(fs.readFileSync(path.join(projectRoot, "config/facebook-publishing.json"), "utf8"));
  Object.assign(config, {
    destinationPageId: pageId,
    destinationPageName: pageName,
    providerDraftsEnabled: true,
    publishingEnabled: false,
    dryRun: false,
    emergencyStop: false
  });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });

  let createCalls = 0;
  let createBody = "";
  let readBackCalls = 0;
  const graph = createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const apiPath = url.pathname.split("/").slice(2).join("/");
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", async () => {
      const send = (status, value) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(value));
      };
      if (req.method === "GET" && apiPath === "me") return send(200, { id: userId });
      if (req.method === "GET" && apiPath === userId + "/permissions") {
        return send(200, { data: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "pages_manage_metadata", "business_management"].map(permission => ({ permission, status: "granted" })) });
      }
      if (req.method === "GET" && apiPath === "me/accounts") {
        return send(200, { data: [{ id: pageId, name: pageName, tasks: ["CREATE_CONTENT", "MODERATE", "MANAGE"], access_token: pageToken }] });
      }
      if (req.method === "GET" && apiPath === pageId) return send(200, { id: pageId, name: pageName });
      if (req.method === "POST" && apiPath === pageId + "/photos") {
        createCalls += 1;
        createBody = Buffer.concat(chunks).toString("utf8");
        await new Promise(resolve => setTimeout(resolve, 120));
        return send(200, { id: "test-photo-001", post_id: remotePostId });
      }
      if (req.method === "GET" && apiPath === remotePostId) {
        readBackCalls += 1;
        return send(200, { id: remotePostId, from: { id: pageId }, message: caption, is_published: false, permalink_url: "https://www.facebook.com/" + remotePostId, created_time: "2026-11-22T12:00:00+0000" });
      }
      return send(404, { error: { message: "Unexpected mocked Graph API route", path: apiPath, method: req.method } });
    });
  });
  const graphPort = await listen(graph);
  const portServer = createServer();
  const port = await listen(portServer);
  await new Promise((resolve, reject) => portServer.close(error => error ? reject(error) : resolve()));
  const preload = pathToFileURL(path.join(projectRoot, "test-support", "meta-provider-draft-fetch-preload.mjs")).href;
  const childOptions = {
    cwd: stateDir,
    env: {
      ...process.env,
      NODE_ENV: "test",
      NODE_OPTIONS: "--import=" + preload,
      META_GRAPH_API_MOCK_URL: "http://127.0.0.1:" + graphPort,
      DASHBOARD_TEST_FACEBOOK_CONFIG_PATH: configPath,
      DASHBOARD_OPERATOR_TOKEN: operatorToken,
      DASHBOARD_OPERATOR_ID: "test-provider-owner@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      FACEBOOK_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      NATURE_FRONTIERS_FACEBOOK_PAGE_ID: pageId,
      META_USER_ACCESS_TOKEN: userToken,
      META_PAGE_ACCESS_TOKEN: pageToken,
      FACEBOOK_PROVIDER_DRAFTS_ENABLED: "YES",
      FACEBOOK_PUBLISH_ENABLED: "NO"
    },
    stdio: ["ignore", "pipe", "pipe"]
  };
  let logs = "";
  const startChild = () => {
    const processChild = spawn(process.execPath, [path.join(projectRoot, "scripts", "dashboard-server.mjs")], childOptions);
    processChild.stdout.on("data", chunk => { logs += chunk.toString(); });
    processChild.stderr.on("data", chunk => { logs += chunk.toString(); });
    return processChild;
  };
  const waitReady = async () => {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        const response = await fetch("http://127.0.0.1:" + port + "/healthz", { headers: { connection: "close" } });
        if (response.ok) { ready = true; break; }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(ready, true, "dashboard server did not become ready: " + logs);
  };
  let child = startChild();
  t.after(async () => {
    if (child && child.exitCode === null) child.kill("SIGTERM");
    graph.close();
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(mediaPath, { force: true });
    fs.rmSync(licensePath, { force: true });
  });
  const base = "http://127.0.0.1:" + port;
  await waitReady();
  const unauthenticated = await fetch(base + "/api/facebook/drafts/provider", {
    method: "POST", headers: { "content-type": "application/json", connection: "close" },
    body: JSON.stringify({ draftId: "unauthorized", confirmProviderDraft: true })
  });
  assert.equal(unauthenticated.status, 401, "provider-draft mutation must reject unauthenticated callers");
  const malformed = await request(base, "/api/facebook/drafts/provider", "POST", {
    draftId: "malformed", confirmProviderDraft: false
  }, operatorToken);
  assert.equal(malformed.status, 400, "provider-draft mutation must require explicit one-shot confirmation");
  assert.equal(createCalls, 0, "auth and input rejection must happen before any remote mutation");

  const verified = await request(base, "/api/facebook/verify-page", "POST", {}, operatorToken);
  assert.equal(verified.status, 200, await verified.text());
  const media = {
    path: "test/" + mediaName,
    sha256: sha256(mediaBytes),
    provenance: "TEST ONLY: one-pixel PNG fixture; never a production wildlife asset",
    licenseEvidencePath: "test/" + licenseName,
    licenseEvidenceSha256: sha256(licenseBytes),
    commercialPermission: true,
    platformPermission: true,
    attributionRequired: false,
    syntheticOrAltered: false
  };
  const draftId = "meta-provider-integration-" + path.basename(stateDir).replace(/[^a-z0-9-]/gi, "");
  const draftResponse = await request(base, "/api/facebook/drafts", "POST", {
    id: draftId,
    topic: "Responsible wildlife observation test",
    caption,
    pillar: "wildlife_behaviour",
    scheduledDate: new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10),
    scheduledTime: "08:00",
    destinationPageId: pageId,
    claims: [],
    media
  }, operatorToken);
  const draft = await readJson(draftResponse);
  assert.ok([200, 201].includes(draft.status), JSON.stringify(draft.body));
  assert.equal(draft.body.evaluation?.ok, true, JSON.stringify(draft.body.evaluation));

  const approval = await request(base, "/api/facebook/drafts/approve", "POST", {
    draftId,
    decision: "APPROVE",
    reason: "TEST ONLY: mock provider integration fixture"
  }, operatorToken);
  assert.equal(approval.status, 200, await approval.text());

  const payload = { draftId, confirmProviderDraft: true };
  const [first, second] = await Promise.all([
    request(base, "/api/facebook/drafts/provider", "POST", payload, operatorToken).then(readJson),
    request(base, "/api/facebook/drafts/provider", "POST", payload, operatorToken).then(readJson)
  ]);
  assert.ok([200, 409].includes(first.status) && [200, 409].includes(second.status), JSON.stringify({ first, second }));
  assert.ok(first.status === 200 || second.status === 200, "at least one concurrent request must receive the verified provider-draft result");
  assert.equal(createCalls, 1, "concurrent duplicate requests must create exactly one remote object");
  assert.match(createBody, /name="published"\r?\n\r?\nfalse/);
  assert.doesNotMatch(createBody, /scheduled_publish_time/);
  assert.ok(readBackCalls >= 1, "remote object must be read back before acceptance");

  const stateResponse = await request(base, "/api/facebook/state", "GET", undefined, operatorToken);
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  const attempt = state.providerDraftAttempts?.find(item => item.draftId === draftId);
  assert.ok(attempt, "durable provider attempt must survive the API request");
  assert.equal(attempt.status, "UNPUBLISHED_PROVIDER_DRAFT_VERIFIED");
  assert.equal(attempt.remotePostId, remotePostId);
  assert.equal(attempt.destinationPageId, pageId);
  assert.match(attempt.payloadSha256, /^[a-f0-9]{64}$/);
  assert.match(attempt.approvalFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(state.publishingEnabled, false);
  assert.equal(state.providerDraftsEnabled, true);

  const auditResponse = await request(base, "/api/state", "GET", undefined, operatorToken);
  assert.equal(auditResponse.status, 200);
  const auditState = await auditResponse.json();
  const preparedAuditCount = auditState.audit.filter(event => event.action === "FACEBOOK_PROVIDER_DRAFT_ATTEMPT_PREPARED").length;
  const verifiedAuditCount = auditState.audit.filter(event => event.action === "FACEBOOK_PROVIDER_DRAFT_VERIFIED_UNPUBLISHED").length;
  assert.equal(preparedAuditCount, 1);
  assert.equal(verifiedAuditCount, 1);

  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
    child.kill("SIGTERM");
  });
  child = startChild();
  await waitReady();

  const restoredResponse = await request(base, "/api/facebook/state", "GET", undefined, operatorToken);
  assert.equal(restoredResponse.status, 200);
  const restored = await restoredResponse.json();
  const restoredAttempt = restored.providerDraftAttempts?.find(item => item.id === attempt.id);
  assert.ok(restoredAttempt, "provider-draft attempt must survive a full dashboard process restart");
  assert.equal(restoredAttempt.status, "UNPUBLISHED_PROVIDER_DRAFT_VERIFIED");
  assert.equal(restoredAttempt.remotePostId, remotePostId);
  assert.equal(restored.publishingEnabled, false);
  const restoredAuditResponse = await request(base, "/api/state", "GET", undefined, operatorToken);
  assert.equal(restoredAuditResponse.status, 200);
  const restoredAudit = await restoredAuditResponse.json();
  assert.equal(restoredAudit.audit.filter(event => event.action === "FACEBOOK_PROVIDER_DRAFT_ATTEMPT_PREPARED").length, preparedAuditCount);
  assert.equal(restoredAudit.audit.filter(event => event.action === "FACEBOOK_PROVIDER_DRAFT_VERIFIED_UNPUBLISHED").length, verifiedAuditCount);

  const reconcile = await request(base, "/api/facebook/drafts/provider/reconcile", "POST", { draftId, attemptId: attempt.id }, operatorToken);
  const reconciled = await readJson(reconcile);
  assert.equal(reconciled.status, 200, JSON.stringify(reconciled.body));
  assert.equal(createCalls, 1, "reconciliation must remain read-only and never create a second object");
  assert.equal(readBackCalls, 1, "reusing a verified attempt after restart must not repeat provider read-back");
});
