import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("authenticated Facebook draft endpoints persist review state and refuse live publication", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-dashboard-"));
  // Let the OS allocate an isolated ephemeral port. Random selection from a
  // shared range can collide with parallel test servers and make the test read
  // another process's state directory, producing misleading recovery failures.
  const port = 0;
  const token = "facebook-test-token-" + "z".repeat(36);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_OPERATOR_ID: "facebook-test-owner", DASHBOARD_STATE_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => { child.kill("SIGTERM"); fs.rmSync(stateDir, { recursive: true, force: true }); });
  let base = null;
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) break;
    const started = logs.match(/"event":"dashboard_started"[^\n]*"port":(\d+)/);
    if (started) {
      base = `http://127.0.0.1:${started[1]}`;
      try { const response = await fetch(base + "/healthz"); if (response.ok) { ready = true; break; } } catch {}
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard did not start: " + logs);
  assert.equal((await fetch(base + "/api/facebook/state")).status, 401);
  const headers = { "content-type": "application/json", "x-operator-token": token };
  assert.equal((await fetch(base + "/api/facebook/idea?date=2030-10-25")).status, 401);
  const ideaResponse = await fetch(base + "/api/facebook/idea?date=2030-10-25", { headers });
  assert.equal(ideaResponse.status, 200);
  const ideaBody = await ideaResponse.json();
  assert.equal(ideaBody.publishReady, false);
  assert.match(ideaBody.idea.researchPrompt, /reliable primary or authoritative source/i);
  const stateResponse = await fetch(base + "/api/facebook/state", { headers });
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  assert.equal(state.publishingEnabled, false);
  assert.equal(state.pageIdentityVerified, false);
  assert.ok(state.blockers.some(item => /Page identity has not passed a recent live Meta API check/i.test(item)));
  assert.ok(state.blockers.some(item => /Meta Page publishing permissions have not passed the live API permission.*task check/i.test(item)));
  assert.ok(state.blockers.some(item => /publishing kill switches remain disabled/i.test(item)));
  const verifyPageResponse = await fetch(base + "/api/facebook/verify-page", { method: "POST", headers, body: JSON.stringify({}) });
  assert.equal(verifyPageResponse.status, 409, "identity verification must fail closed until a numeric Page ID and secure token are configured");

  const draft = {
    id: "facebook-dashboard-draft-1", topic: "Wetland biodiversity",
    pillar: "habitats_biodiversity",
    caption: "Wetlands provide habitat for diverse species. Which wetland animals have you seen?",
    scheduledDate: "2030-10-25", destinationPageId: "123456789012345",
    claims: [], media: null
  };
  const createdResponse = await fetch(base + "/api/facebook/drafts", { method: "POST", headers, body: JSON.stringify(draft) });
  const created = await createdResponse.json();
  assert.equal(createdResponse.status, 201, JSON.stringify(created));
  assert.equal(created.draft.status, "DRAFT");
  assert.equal(created.draft.publishingEnabled, false);
  assert.ok(created.evaluation.blockers.some(item => /Page ID/i.test(item)));
  assert.ok(created.evaluation.blockers.some(item => /media asset/i.test(item)));

  const duplicateResponse = await fetch(base + "/api/facebook/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "facebook-dashboard-draft-2" }) });
  assert.equal(duplicateResponse.status, 409, await duplicateResponse.text());
  const sameDayResponse = await fetch(base + "/api/facebook/drafts", { method: "POST", headers, body: JSON.stringify({
    ...draft, id: "facebook-dashboard-draft-3", topic: "Forest canopy biodiversity",
    caption: "A field guide to forest canopy biodiversity explains how tree cover supports birds and insects."
  }) });
  assert.equal(sameDayResponse.status, 409);
  assert.match((await sameDayResponse.json()).error, /one-post-per-day collision/i);

  const evaluateResponse = await fetch(base + "/api/facebook/drafts/evaluate", { method: "POST", headers, body: JSON.stringify({ draftId: draft.id }) });
  assert.equal(evaluateResponse.status, 200);
  const evaluated = await evaluateResponse.json();
  assert.equal(evaluated.evaluation.ok, false);

  const approvalResponse = await fetch(base + "/api/facebook/drafts/approve", { method: "POST", headers, body: JSON.stringify({ draftId: draft.id, decision: "APPROVE" }) });
  assert.equal(approvalResponse.status, 400, "approval must fail closed while Page identity, rights and compliance blockers remain");

  const publishResponse = await fetch(base + "/api/facebook/publish", { method: "POST", headers, body: JSON.stringify({ draftId: draft.id, confirmOperation: true }) });
  assert.equal(publishResponse.status, 409);
  const publishBody = await publishResponse.json();
  assert.equal(publishBody.publishingEnabled, false);
  assert.match(publishBody.error, /not ready; no remote mutation was attempted/i);
  assert.ok(Array.isArray(publishBody.blockers));

  const saved = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.ok(saved.facebookDrafts.some(item => item.id === draft.id));
  assert.ok(saved.audit.some(event => event.action === "FACEBOOK_DRAFT_CREATED" && event.itemId === draft.id && event.actor === "facebook-test-owner"));
  assert.ok(saved.audit.some(event => event.action === "FACEBOOK_DRAFT_RECHECKED"));
});
test("dashboard restart moves interrupted Facebook submissions to reconciliation without losing known remote IDs", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-recovery-"));
  const port = 28000 + Math.floor(Math.random() * 10000);
  const token = "facebook-recovery-token-" + "r".repeat(32);
  const statePath = path.join(stateDir, "dashboard-state.json");
  fs.writeFileSync(statePath, JSON.stringify({
    version: 1, queueItems: [], campaigns: [], audit: [], jobs: [], uploads: [], facebookDrafts: [], facebookPosts: [],
    facebookAttempts: [
      { id: "attempt-ledger-receipt", kind: "FACEBOOK_PUBLISH_ATTEMPT", status: "SUBMITTING", retryAllowed: false, remotePostId: null },
      { id: "attempt-no-ledger", kind: "FACEBOOK_PUBLISH_ATTEMPT", status: "SUBMITTING", retryAllowed: false, remotePostId: null },
      { id: "attempt-known-id", kind: "FACEBOOK_PUBLISH_ATTEMPT", status: "REMOTE_SCHEDULED_UNVERIFIED", retryAllowed: false, remotePostId: "123456789012345_987" }
    ]
  }, null, 2) + "\n", { mode: 0o600 });
  fs.writeFileSync(path.join(stateDir, "facebook-recovery-ledger.jsonl"), JSON.stringify({ attemptId: "attempt-ledger-receipt", remotePostId: "123456789012345_654", status: "NEEDS_RECONCILIATION", reason: "test-only durable receipt", recordedAt: new Date().toISOString() }) + "\n", { mode: 0o600 });
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_OPERATOR_ID: "facebook-recovery-owner", DASHBOARD_STATE_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => { child.kill("SIGTERM"); fs.rmSync(stateDir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) break;
    try { const response = await fetch(base + "/healthz"); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard did not start: " + logs);
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const restored = state.facebookAttempts.find(x => x.id === "attempt-ledger-receipt");
  assert.equal(restored.status, "NEEDS_RECONCILIATION");
  assert.equal(restored.remotePostId, "123456789012345_654", "append-only recovery ledger restores the remote ID after state write failure");
  const noLedger = state.facebookAttempts.find(x => x.id === "attempt-no-ledger");
  assert.equal(noLedger.status, "NEEDS_RECONCILIATION");
  assert.equal(noLedger.remotePostId, null);
  const known = state.facebookAttempts.find(x => x.id === "attempt-known-id");
  assert.equal(known.status, "NEEDS_RECONCILIATION");
  assert.equal(known.remotePostId, "123456789012345_987", "known remote IDs must survive restart recovery");
  assert.equal(known.retryAllowed, false);
  assert.ok(state.audit.some(event => event.action === "FACEBOOK_PUBLISH_RECOVERY_REQUIRED" && event.attemptId === "attempt-known-id"));
});
