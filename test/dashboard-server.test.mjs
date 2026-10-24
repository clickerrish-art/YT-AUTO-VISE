import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("dashboard API authenticates operators, persists real drafts, and cannot grant approval", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-"));
  const port = 18000 + Math.floor(Math.random() * 10000);
  const token = "test-token-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_OPERATOR_ID: "test-owner@example.test", DASHBOARD_STATE_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => { child.kill("SIGTERM"); fs.rmSync(stateDir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) break;
    try { const response = await fetch(base + "/healthz"); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server did not start: " + logs);
  const unauthorized = await fetch(base + "/api/state");
  assert.equal(unauthorized.status, 401);
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const initial = await fetch(base + "/api/state", { headers });
  assert.equal(initial.status, 200);
  const body = await initial.json();
  assert.equal(body.publishingEnabled, false);
  assert.ok(body.blockers.some(item => /Owner decision required:.*72-hour minimum/i.test(item)), "dashboard state must expose the unresolved cadence blocker");
  const readinessResponse = await fetch(base + "/readyz");
  const readiness = await readinessResponse.json();
  assert.equal(readinessResponse.status, 503, "production readiness must fail closed while owner-controlled prerequisites are missing");
  assert.equal(readiness.ready, false);
  assert.equal(readiness.publishingEnabled, false);
  assert.ok(Array.isArray(readiness.blockers));
  assert.ok(readiness.blockers.some(item => /long-form(?: render manifest|-render-manifest)/i.test(item)));
  assert.ok(readiness.blockers.some(item => /SONICVHIBEZ_CHANNEL_ID|channel ID/i.test(item)));
  const noPriorReconcile = await fetch(base + "/api/uploads/reconcile", { method: "POST", headers, body: JSON.stringify({ jobId: "no-prior-job", videoPath: "README.md", metadataPath: "README.md", approvalPath: "README.md" }) });
  const noPriorBody = await noPriorReconcile.json();
  assert.equal(noPriorReconcile.status, 409, JSON.stringify(noPriorBody));
  assert.match(noPriorBody.error, /never create a new upload/i);
  const safari = body.campaigns.find(c => c.type === "safari_affiliate");
  assert.equal(safari.status, "INACTIVE");
  const preview = await fetch(base + "/api/campaigns/manage", { method: "POST", headers, body: JSON.stringify({ campaignId: safari.id, action: "preview", destinationUrl: "https://example.com/verified-stay", disclosureText: "I may earn a commission from eligible bookings." }) });
  const previewBody = await preview.json();
  assert.equal(preview.status, 200, JSON.stringify(previewBody));
  assert.equal(previewBody.previewOnly, true);
  const activated = await fetch(base + "/api/campaigns/manage", { method: "POST", headers, body: JSON.stringify({ campaignId: safari.id, action: "activate", confirmOwnerApproval: true }) });
  const activatedBody = await activated.json();
  assert.equal(activated.status, 200, JSON.stringify(activatedBody));
  assert.equal(activatedBody.campaign.status, "ACTIVE_FOR_DRAFTS_ONLY");
  const deactivated = await fetch(base + "/api/campaigns/manage", { method: "POST", headers, body: JSON.stringify({ campaignId: safari.id, action: "deactivate" }) });
  const deactivatedBody = await deactivated.json();
  assert.equal(deactivated.status, 200, JSON.stringify(deactivatedBody));
  const inactiveSafari = deactivatedBody.campaign;
  assert.equal(inactiveSafari.status, "INACTIVE");
  assert.equal(inactiveSafari.destinationUrl, "");
  const afterCampaignChanges = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.ok(afterCampaignChanges.audit.some(event => event.action === "CAMPAIGN_PREVIEW"));
  assert.ok(afterCampaignChanges.audit.some(event => event.action === "CAMPAIGN_ACTIVATE"));
  assert.ok(afterCampaignChanges.audit.some(event => event.action === "CAMPAIGN_DEACTIVATE"));
  const draft = {
    id: "dashboard-test-draft", title: "Test wildlife planning draft", topic: "planning a wildlife video",
    contentType: "long_form", scheduledDay: "Tuesday", scheduledDate: "2026-10-27", productUrl: "https://selar.com/0u19v8u99l"
  };
  const created = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(draft) });
  assert.equal(created.status, 201, await created.text());
  const duplicate = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(draft) });
  assert.equal(duplicate.status, 409);
  const conflictingSlot = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-other", title: "Conflicting Tuesday reservation" }) });
  assert.equal(conflictingSlot.status, 409, "different drafts must not reserve the same calendar slot");
  const unsupportedDirectJob = await fetch(base + "/api/jobs", { method: "POST", headers, body: JSON.stringify({
    idempotencyKey: "draft:thursday-job", title: "Unsupported Thursday job", topic: "schedule boundary test",
    contentType: "long_form", scheduledDay: "Thursday", scheduledDate: "2026-10-29", inputReferences: []
  }) });
  assert.equal(unsupportedDirectJob.status, 409, "direct API jobs must respect the authoritative schedule, not just same-date locks");
  assert.match((await unsupportedDirectJob.json()).error, /not an authorized slot/);
  const invalidDate = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-invalid-date", scheduledDate: "2026-02-31" }) });
  assert.equal(invalidDate.status, 400, "invalid calendar dates must be rejected");
  const unsafe = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-unsafe", rightsConfirmed: true }) });
  assert.equal(unsafe.status, 400);
  const saved = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.ok(saved.queueItems.some(item => item.id === draft.id));
  assert.ok(saved.audit.some(event => event.action === "DRAFT_CREATED" && event.itemId === draft.id));
  assert.ok(saved.audit.filter(event => event.itemId === draft.id).every(event => event.actor === "test-owner@example.test"), "audit records must use the configured authenticated operator identity");
  assert.equal(saved.queueItems.find(item => item.id === draft.id).rightsConfirmed, undefined);
  const productionJob = saved.jobs.find(job => job.kind === "CONTENT_PRODUCTION" && job.idempotencyKey === "draft:" + draft.id);
  assert.ok(productionJob);
  assert.equal(productionJob.transitionHistory[0].actor, "test-owner@example.test");
  const claim = await fetch(base + "/api/jobs/lease/claim", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, workerId: "test-worker-a", leaseMs: 10_000 }) });
  const claimBody = await claim.json();
  assert.equal(claim.status, 200, JSON.stringify(claimBody));
  assert.equal(claimBody.job.state, "GENERATING");
  const competingClaim = await fetch(base + "/api/jobs/lease/claim", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, workerId: "test-worker-b", leaseMs: 10_000 }) });
  assert.equal(competingClaim.status, 400, "an active lease must prevent a concurrent worker claim");
  const heartbeat = await fetch(base + "/api/jobs/lease/heartbeat", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, leaseToken: claimBody.leaseToken, leaseMs: 10_000 }) });
  assert.equal(heartbeat.status, 200);
  const fakeGeneration = await fetch(base + "/api/jobs/lease/complete", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, leaseToken: claimBody.leaseToken, nextState: "GENERATED", metadataPath: "content/nonexistent-test-metadata.json", result: { outputArtifacts: [{ path: "media/test-only-nonexistent.mp4", sha256: "a".repeat(64) }], metadataVersion: "test-only-metadata-version" } }) });
  assert.equal(fakeGeneration.status, 400, "a nonexistent output must never be recorded as generated");
  const failed = await fetch(base + "/api/jobs/lease/complete", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, leaseToken: claimBody.leaseToken, nextState: "FAILED", result: { errorDetails: { retryable: false, message: "test fixture intentionally has no media artifact" } } }) });
  const failedBody = await failed.json();
  assert.equal(failed.status, 200, JSON.stringify(failedBody));
  assert.equal(failedBody.job.state, "FAILED");
  const forgedReview = await fetch(base + "/api/jobs/transition", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, nextState: "AWAITING_HUMAN_REVIEW", reason: "attempted bypass" }) });
  assert.equal(forgedReview.status, 400, "worker output alone cannot bypass the rights-evidence gate");
  const shortDraft = { id: "dashboard-test-render-short", title: "Test Short render attempt", topic: "ethical wildlife filming", contentType: "short", scheduledDay: "Saturday", scheduledDate: "2026-10-24", productUrl: "https://selar.com/0u19v8u99l" };
  const shortCreated = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(shortDraft) });
  const shortCreatedBody = await shortCreated.json();
  assert.equal(shortCreated.status, 201, JSON.stringify(shortCreatedBody));
  const renderJob = shortCreatedBody.job;
  const renderAttempt = await fetch(base + "/api/jobs/produce", { method: "POST", headers, body: JSON.stringify({ jobId: renderJob.id }) });
  const renderAttemptBody = await renderAttempt.json();
  assert.equal(renderAttempt.status, 409, JSON.stringify(renderAttemptBody));
  assert.equal(renderAttemptBody.job.state, "BLOCKED");
  assert.match(renderAttemptBody.job.renderExecution.output, /render manifest not found/i);
  assert.equal(renderAttemptBody.job.outputArtifacts.length, 0, "a blocked renderer must not claim a generated artifact");

  // Simulate a legacy/corrupt state file with two different queue items reserving
  // the same local date. A distant new slot must still be blocked until the
  // existing collision is repaired; the validator must not hide duplicates.
  const statePath = path.join(stateDir, "dashboard-state.json");
  const collisionState = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const existingReservation = collisionState.queueItems.find(item => item.id === draft.id);
  collisionState.queueItems.push({
    ...existingReservation,
    id: "dashboard-test-duplicate-reservation",
    title: "Duplicate existing Tuesday reservation"
  });
  fs.writeFileSync(statePath, JSON.stringify(collisionState, null, 2) + "\n", { mode: 0o600 });
  const distantDraft = {
    id: "dashboard-test-distant-draft", title: "Distant Saturday draft", topic: "creator workflow planning",
    contentType: "short", scheduledDay: "Saturday", scheduledDate: "2026-10-31", productUrl: "https://selar.com/0u19v8u99l"
  };
  const blockedByExistingCollision = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(distantDraft) });
  const collisionBody = await blockedByExistingCollision.json();
  assert.equal(blockedByExistingCollision.status, 409, JSON.stringify(collisionBody));
  assert.ok(collisionBody.blockers.some(error => /existing publication date collision/i.test(error)), "pre-existing same-day queue collisions must fail closed");
});


test("dashboard refuses to start when persisted Facebook history is malformed", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-corrupt-history-"));
  const stateFile = path.join(stateDir, "dashboard-state.json");
  fs.writeFileSync(stateFile, JSON.stringify({
    version: 1,
    queueItems: [],
    campaigns: [],
    audit: [],
    jobs: [],
    uploads: [],
    facebookDrafts: { lost: "history" },
    facebookPosts: [],
    facebookAttempts: []
  }) + "\n", { mode: 0o600 });
  const port = 28000 + Math.floor(Math.random() * 10000);
  const token = "test-token-" + "y".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_OPERATOR_ID: "test-owner@example.test", DASHBOARD_STATE_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => { if (child.exitCode === null) child.kill("SIGTERM"); fs.rmSync(stateDir, { recursive: true, force: true }); });

  const exited = await new Promise(resolve => {
    const timeout = setTimeout(() => resolve(false), 3000);
    child.once("exit", () => { clearTimeout(timeout); resolve(true); });
  });
  assert.equal(exited, true, "dashboard must not start against corrupt publication history");
  assert.notEqual(child.exitCode, 0, "corrupt persisted history must fail startup");
  assert.match(logs, /Invalid state schema: facebookDrafts/);
  assert.deepEqual(JSON.parse(fs.readFileSync(stateFile, "utf8")).facebookDrafts, { lost: "history" }, "startup must preserve corrupt evidence for operator recovery, not overwrite it");
});
