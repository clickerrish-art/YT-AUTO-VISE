import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("dashboard API authenticates operators, persists real drafts, and cannot grant approval", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-"));
  const ledgerTarget = path.join(os.tmpdir(), "sonicvhibez-upload-ledger-target-" + path.basename(stateDir) + ".json");
  const ledgerLink = path.join(stateDir, "upload-attempts.json");
  fs.writeFileSync(ledgerTarget, JSON.stringify({ attempts: [{ attemptId: "forged-symlink-attempt", status: "PRIVATE_UPLOAD_VERIFIED", remoteVideoId: "not-authoritative" }] }) + "\n", { mode: 0o600 });
  fs.symlinkSync(ledgerTarget, ledgerLink);
  const researchSource = { id: "source-1", title: "Field ecology paper", url: "https://wildlife-research.org/paper", evidenceLocator: "Results section, paragraphs 2–4", evidenceSummary: "The supplied research describes observation conditions and explains why repeated observations are needed before generalizing animal behavior." };
  const narration = [
    "A wildlife encounter can look simple from a distance, but the evidence often tells a more careful story. The first question is not which animal is strongest; it is what each animal is doing in its own habitat. Good reporting separates observed action from assumptions about intent.",
    "Field observations can describe behavior under specific conditions, but one observation cannot establish a universal rule. Researchers compare repeated observations, environmental context, and competing explanations before drawing conclusions. Strong conclusions depend on source quality, methods, and repeated observations.",
    "That distinction matters when a short video compresses a complicated interaction into a dramatic moment. A responsible account separates what the source directly reports from what remains uncertain, and never invents a scene to make the story more exciting. That care can make a story more compelling without pretending uncertainty has disappeared."
  ].join("\n\n");
  const generatedScript = {
    premise: "Explain how to interpret wildlife behavior without overstating a single observation.",
    conclusion: "The strongest wildlife story is the one that keeps observation, interpretation, and uncertainty distinct.",
    narration,
    sections: [
      { heading: "The question", purpose: "Frame the evidence", narration: narration.split("\n\n")[0], visualDirection: "Wide habitat establishing shot", pacing: "Measured", soundDesign: "Natural ambience" },
      { heading: "What evidence means", purpose: "Explain source limits", narration: narration.split("\n\n")[1], visualDirection: "Documented behavior with no invented encounter", pacing: "Steady", soundDesign: "Low ambience under narration" },
      { heading: "The responsible conclusion", purpose: "Resolve the premise", narration: narration.split("\n\n")[2], visualDirection: "Return to habitat context", pacing: "Slow slightly", soundDesign: "Natural fade" }
    ],
    claims: [{ text: "Researchers compare observations and context before drawing conclusions.", sourceIds: ["source-1"] }],
    sources: [researchSource],
    similarityReview: { status: "REVIEWED", evidenceRef: "provider-claim-must-not-be-trusted" }
  };
  const provider = createServer((req, res) => {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(generatedScript) } }] }));
    });
  });
  await new Promise(resolve => provider.listen(0, "127.0.0.1", resolve));
  const providerPort = provider.address().port;
  const port = 18000 + Math.floor(Math.random() * 10000);
  const token = "test-token-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_OPERATOR_ID: "test-owner@example.test", DASHBOARD_STATE_DIR: stateDir, UPLOAD_LOG_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1", SCRIPT_GENERATION_ENDPOINT: `http://127.0.0.1:${providerPort}/v1/chat/completions`, SCRIPT_GENERATION_TIMEOUT_MS: "5000" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-outside-path-"));
  const outsideFile = path.join(outsideDir, "private-evidence.txt");
  const symlinkName = ".dashboard-test-outside-" + path.basename(stateDir) + ".txt";
  const symlinkPath = path.join(process.cwd(), symlinkName);
  const internalSymlinkName = ".dashboard-test-internal-" + path.basename(stateDir) + ".md";
  const internalSymlinkPath = path.join(process.cwd(), internalSymlinkName);
  fs.writeFileSync(outsideFile, "test-only external file; not a credential");
  fs.symlinkSync(outsideFile, symlinkPath);
  fs.symlinkSync(path.join(process.cwd(), "README.md"), internalSymlinkPath);
  t.after(() => {
    child.kill("SIGTERM");
    provider.close();
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(ledgerTarget, { force: true });
    fs.rmSync(symlinkPath, { force: true });
    fs.rmSync(internalSymlinkPath, { force: true });
    fs.rmSync(outsideDir, { recursive: true, force: true });
  });
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
  assert.equal(body.uploadLedger.available, false, "a symlinked upload ledger must never be trusted as authoritative attempt history");
  assert.match(body.uploadLedger.error, /unsafe/i, "the dashboard must report an unsafe ledger without exposing its contents");
  assert.equal(Object.hasOwn(body, "stateFile"), false, "authenticated API responses must not disclose the local state-file path");
  assert.equal(logs.includes(stateDir), false, "startup logs must not disclose the local state directory");
  assert.ok(body.blockers.some(item => /complete SonicVhibez public\/private\/unlisted history is reconciled/i.test(item)), "dashboard state must expose the live history reconciliation blocker");
  const autonomousUnauth = await fetch(base + "/api/facebook/autonomous-status");
  assert.equal(autonomousUnauth.status, 401, "autonomous publisher status must use the same operator authentication");
  const autonomousResponse = await fetch(base + "/api/facebook/autonomous-status", { headers });
  assert.equal(autonomousResponse.status, 200);
  const autonomous = await autonomousResponse.json();
  assert.equal(autonomous.destination, "nature_frontiers_facebook");
  assert.equal(autonomous.publishingEnabled, false, "dashboard must report disabled safe defaults");
  assert.equal(autonomous.emergencyStop, true);
  assert.equal(Object.hasOwn(autonomous, "META_PAGE_ACCESS_TOKEN"), false);
  assert.ok(Array.isArray(autonomous.blockers));
  assert.equal(typeof autonomous.queueCount, "number");

  const emergencyStoppedPublish = await fetch(base + "/api/facebook/publish", {
    method: "POST", headers, body: JSON.stringify({ draftId: "must-not-publish", confirmOperation: true })
  });
  const emergencyStoppedBody = await emergencyStoppedPublish.json();
  assert.equal(emergencyStoppedPublish.status, 409);
  assert.ok(emergencyStoppedBody.blockers.some(item => /Facebook emergency stop is active/i.test(item)),
    "manual publish endpoint must explicitly report the emergency stop even if other kill switches are also disabled");
  const stateBeforeCampaignTests = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(stateBeforeCampaignTests.facebookAttempts.length, 0, "emergency-stop rejection must not create an external-operation attempt");

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
  const symlinkReconcile = await fetch(base + "/api/uploads/reconcile", { method: "POST", headers, body: JSON.stringify({ jobId: "symlink-job", videoPath: symlinkName, metadataPath: "README.md", approvalPath: "README.md" }) });
  const symlinkBody = await symlinkReconcile.json();
  assert.equal(symlinkReconcile.status, 400, JSON.stringify(symlinkBody));
  assert.match(symlinkBody.error, /resolves outside repository root/i, "repository-relative symlinks must not expose files outside the repository");
  const internalSymlinkReconcile = await fetch(base + "/api/uploads/reconcile", { method: "POST", headers, body: JSON.stringify({ jobId: "internal-symlink-job", videoPath: internalSymlinkName, metadataPath: "README.md", approvalPath: "README.md" }) });
  const internalSymlinkBody = await internalSymlinkReconcile.json();
  assert.equal(internalSymlinkReconcile.status, 400, JSON.stringify(internalSymlinkBody));
  assert.match(internalSymlinkBody.error, /must not contain symbolic links/i, "even in-repository symlinks must be rejected for evidence paths");
  const safari = body.campaigns.find(c => c.type === "safari_affiliate");
  assert.equal(safari.status, "INACTIVE");
  const preview = await fetch(base + "/api/campaigns/manage", { method: "POST", headers, body: JSON.stringify({ campaignId: safari.id, action: "preview", destinationUrl: "https://example.com/verified-stay", disclosureText: "I may earn a commission from eligible bookings." }) });
  const previewBody = await preview.json();
  assert.equal(preview.status, 200, JSON.stringify(previewBody));
  assert.equal(previewBody.previewOnly, true);
  const activated = await fetch(base + "/api/campaigns/manage", { method: "POST", headers, body: JSON.stringify({ campaignId: safari.id, action: "activate", confirmOwnerApproval: true }) });
  const activatedBody = await activated.json();
  assert.equal(activated.status, 400, JSON.stringify(activatedBody));
  assert.match(activatedBody.error, /Safari affiliate campaigns are disabled.*remain INACTIVE/i);
  const afterRejectedActivation = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(afterRejectedActivation.campaigns.find(c => c.id === safari.id).status, "INACTIVE");
  assert.equal(afterRejectedActivation.audit.some(event => event.action === "CAMPAIGN_ACTIVATE" && event.campaignId === safari.id), false,
    "rejected Safari activation must not persist an activation audit event");
  const deactivated = await fetch(base + "/api/campaigns/manage", { method: "POST", headers, body: JSON.stringify({ campaignId: safari.id, action: "deactivate" }) });
  const deactivatedBody = await deactivated.json();
  assert.equal(deactivated.status, 200, JSON.stringify(deactivatedBody));
  const inactiveSafari = deactivatedBody.campaign;
  assert.equal(inactiveSafari.status, "INACTIVE");
  assert.equal(inactiveSafari.destinationUrl, "");
  const afterCampaignChanges = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.ok(afterCampaignChanges.audit.some(event => event.action === "CAMPAIGN_PREVIEW"));
  assert.equal(afterCampaignChanges.audit.some(event => event.action === "CAMPAIGN_ACTIVATE" && event.campaignId === safari.id), false,
    "Safari activation must remain blocked even after preview and explicit confirmation");
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
  const authorDraft = { id: "dashboard-test-authoring-short", title: "Evidence-led wildlife Short", topic: "Interpreting wildlife observations", contentType: "short", scheduledDay: "Saturday", scheduledDate: "2026-11-07", productUrl: "https://selar.com/0u19v8u99l" };
  const authorDraftResponse = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(authorDraft) });
  const authorDraftBody = await authorDraftResponse.json();
  assert.equal(authorDraftResponse.status, 201, JSON.stringify(authorDraftBody));
  const authorJob = authorDraftBody.job;
  const authorBrief = { topic: "Interpreting wildlife observations", audience: "Adults", editorialPurpose: "Explain evidence limits", sources: [researchSource], parentRecord: { contentId: "long-parent", weeklyContentCycleId: "cycle-1", format: "long_form", channel: "SonicVhibez" } };
  const authorResponse = await fetch(base + "/api/jobs/author", { method: "POST", headers, body: JSON.stringify({ jobId: authorJob.id, brief: authorBrief }) });
  const authorBody = await authorResponse.json();
  assert.equal(authorResponse.status, 201, JSON.stringify(authorBody));
  assert.equal(authorBody.job.authoring.status, "AWAITING_HUMAN_EDITORIAL_REVIEW");
  assert.equal(authorBody.job.authoring.result.script.similarityReview.status, "PENDING", "provider/model claims must never satisfy originality review");
  assert.equal(authorBody.publishable, false);
  assert.equal(authorBody.publishingEnabled, false);
  assert.equal(authorBody.job.authoring.gates.factualVerification, "PENDING");
  assert.equal(authorBody.job.authoring.gates.rightsReview, "PENDING");
  const authorDuplicate = await fetch(base + "/api/jobs/author", { method: "POST", headers, body: JSON.stringify({ jobId: authorJob.id, brief: authorBrief }) });
  const authorDuplicateBody = await authorDuplicate.json();
  assert.equal(authorDuplicate.status, 200, JSON.stringify(authorDuplicateBody));
  assert.equal(authorDuplicateBody.reused, true, "identical retries must reuse the persisted authoring result");
  const authorRenderBypass = await fetch(base + "/api/jobs/produce", { method: "POST", headers, body: JSON.stringify({ jobId: authorJob.id }) });
  const authorRenderBypassBody = await authorRenderBypass.json();
  assert.equal(authorRenderBypass.status, 409, "a generated script must not bypass missing narration/caption/scene integration");
  assert.equal(authorRenderBypassBody.publishable, false);
  assert.match(authorRenderBypassBody.error, /not yet connected to narration, captions and scene rendering/i);

  const authorState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(authorState.jobs.find(job => job.id === authorJob.id).authoring.result.script.narration, narration);
  assert.deepEqual(authorState.jobs.find(job => job.id === authorJob.id).authoring.researchBrief, authorBrief, "the exact supplied research brief and evidence locators must remain auditable");
  assert.ok(authorState.audit.some(event => event.action === "SCRIPT_AUTHORING_COMPLETED_REVIEW_REQUIRED" && event.jobId === authorJob.id));
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


test("dashboard refuses a symlinked persisted state file at startup", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-symlink-state-"));
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-symlink-target-"));
  const outsideFile = path.join(outsideDir, "preserved.json");
  const stateFile = path.join(stateDir, "dashboard-state.json");
  const port = 28000 + Math.floor(Math.random() * 10000);
  fs.writeFileSync(outsideFile, JSON.stringify({ sentinel: "do-not-touch" }) + "\n", { mode: 0o600 });
  fs.symlinkSync(outsideFile, stateFile);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: "test-token-" + "x".repeat(40), DASHBOARD_OPERATOR_ID: "test-owner", DASHBOARD_STATE_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => {
    if (child.exitCode === null) child.kill("SIGTERM");
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(outsideDir, { recursive: true, force: true });
  });
  const code = await new Promise(resolve => {
    child.once("exit", resolve);
    setTimeout(() => { if (child.exitCode === null) child.kill("SIGKILL"); }, 5000).unref();
  });
  assert.notEqual(code, 0, "server must refuse to start when the state path is a symlink");
  assert.match(logs, /state file must be a regular file/i);
  assert.deepEqual(JSON.parse(fs.readFileSync(outsideFile, "utf8")), { sentinel: "do-not-touch" });
});


test("dashboard refuses a state directory beneath a symlink before creating nested state paths", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-parent-link-"));
  const outside = path.join(root, "outside");
  fs.mkdirSync(outside);
  const link = path.join(root, "state-link");
  fs.symlinkSync(outside, link, "dir");
  const stateDir = path.join(link, "new-state");
  const port = 18000 + Math.floor(Math.random() * 10000);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: "test-token-" + "x".repeat(40),
      DASHBOARD_OPERATOR_ID: "test-owner@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => {
    if (child.exitCode === null) child.kill("SIGTERM");
    fs.rmSync(root, { recursive: true, force: true });
  });

  const result = await new Promise(resolve => {
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({ timedOut: true, code: null, signal: "SIGTERM" });
    }, 3000);
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ timedOut: false, code, signal });
    });
  });

  assert.equal(result.timedOut, false, "unsafe startup should fail immediately, not begin serving");
  assert.notEqual(result.code, 0, "server must refuse the symlinked state ancestor");
  assert.equal(result.signal, null);
  assert.match(logs, /symbolic link/i);
  assert.equal(fs.existsSync(path.join(outside, "new-state")), false,
    "startup must not create directories through the symlink before rejecting it");
});

test("dashboard startup repairs legacy state that had an active Safari campaign", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-safari-migration-"));
  const port = 28000 + Math.floor(Math.random() * 10000);
  const token = "test-token-" + "s".repeat(40);
  const queue = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/queue.json"), "utf8"));
  const campaignConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "config/campaigns.json"), "utf8"));
  const safari = campaignConfig.campaigns.find(campaign => campaign.type === "safari_affiliate");
  safari.status = "ACTIVE_FOR_DRAFTS_ONLY";
  safari.destinationUrl = "https://example.org/legacy-safari";
  safari.destinationValidation = "owner_verified";
  safari.ownerApproved = true;
  safari.disclosureText = "Legacy affiliate disclosure";
  safari.pendingDestinationUrl = "https://example.org/legacy-safari";
  safari.pendingDisclosureText = "Legacy affiliate disclosure";
  safari.pendingDestinationVersion = "a".repeat(64);
  safari.approval = { approvedBy: "legacy-owner", approvedAt: "2026-10-24T00:00:00Z", destinationVersion: "a".repeat(64) };
  const stateFile = path.join(stateDir, "dashboard-state.json");
  fs.writeFileSync(stateFile, JSON.stringify({
    version: 1, queueItems: queue.items ?? [], campaigns: campaignConfig.campaigns,
    audit: [], jobs: [], uploads: [], facebookDrafts: [], facebookPosts: [], facebookAttempts: []
  }), { mode: 0o600 });

  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_OPERATOR_ID: "test-owner@example.test", DASHBOARD_STATE_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => {
    if (child.exitCode === null) child.kill("SIGTERM");
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) break;
    try { const response = await fetch(base + "/healthz"); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server did not start with legacy fixture: " + logs);
  const response = await fetch(base + "/api/state", { headers: { "x-operator-token": token } });
  assert.equal(response.status, 200);
  const body = await response.json();
  const repaired = body.campaigns.find(campaign => campaign.type === "safari_affiliate");
  assert.equal(repaired.status, "INACTIVE");
  assert.equal(repaired.destinationUrl, "");
  assert.equal(repaired.destinationValidation, "not_verified");
  assert.equal(repaired.ownerApproved, false);
  assert.equal(repaired.disclosureText, "");
  assert.equal(Object.hasOwn(repaired, "pendingDestinationUrl"), false);
  assert.equal(Object.hasOwn(repaired, "pendingDisclosureText"), false);
  assert.equal(Object.hasOwn(repaired, "pendingDestinationVersion"), false);
  assert.equal(Object.hasOwn(repaired, "approval"), false);
  const durable = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(durable.campaigns.find(campaign => campaign.type === "safari_affiliate").status, "INACTIVE");
  assert.ok(durable.audit.some(event => event.action === "SAFARI_CAMPAIGN_POLICY_ENFORCED"));
});