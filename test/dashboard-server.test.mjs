import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { canonicalAuthoringScriptSha256 } from "../scripts/authoring-production-pipeline.mjs";
import { inventoryDashboardSources } from "../scripts/dashboard-inventory.mjs";

test("dashboard API authenticates operators, persists real drafts, and cannot grant approval", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-"));
  let narrationFixtureDir = null;
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
    if (narrationFixtureDir) fs.rmSync(narrationFixtureDir, { recursive: true, force: true });
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
  const sourceInventory = inventoryDashboardSources(
    fs.readFileSync(path.join(process.cwd(), "public", "dashboard.html"), "utf8"),
    fs.readFileSync(path.join(process.cwd(), "scripts", "dashboard-server.mjs"), "utf8"),
  );
  const apiRoutes = [...new Map(sourceInventory.routes
    .filter(route => route.path.startsWith("/api/"))
    .map(route => [route.method + " " + route.path, route])).values()];
  assert.ok(apiRoutes.length > 0, "the route inventory must discover API routes");
  for (const route of apiRoutes) {
    const response = await fetch(base + route.path, { method: route.method });
    assert.equal(
      response.status,
      401,
      `unauthenticated request must be rejected for ${route.method} ${route.path}`,
    );
  }
  const malformedUnicodeToken = "é" + "x".repeat(token.length - 1);
  assert.equal(malformedUnicodeToken.length, token.length);
  const malformedTokenResponse = await fetch(base + "/api/state", { headers: { "x-operator-token": malformedUnicodeToken } });
  assert.equal(malformedTokenResponse.status, 401, "equal JavaScript string lengths with unequal UTF-8 byte lengths must reject cleanly");
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const malformedJson = await fetch(base + "/api/drafts", {
    method: "POST", headers, body: "{\"id\":"
  });
  assert.equal(malformedJson.status, 400, "malformed JSON must be rejected before any draft mutation");
  const malformedJsonBody = await malformedJson.json();
  assert.match(malformedJsonBody.error, /valid JSON/i);
  assert.equal(JSON.stringify(malformedJsonBody).includes(stateDir), false, "malformed-body errors must not expose local state paths");
  const unsupportedContentType = await fetch(base + "/api/drafts", {
    method: "POST",
    headers: { "content-type": "text/plain", "x-operator-token": token },
    body: JSON.stringify({ id: "must-not-be-created", title: "Unsupported content type" }),
  });
  assert.equal(unsupportedContentType.status, 415, "JSON-looking bodies with a non-JSON media type must be rejected");
  const unsupportedContentTypeBody = await unsupportedContentType.json();
  assert.ok(unsupportedContentTypeBody.error.includes("application/json"));
  assert.equal(JSON.stringify(unsupportedContentTypeBody).includes(stateDir), false, "unsupported-content-type errors must not disclose local paths");
  const oversizedBody = await fetch(base + "/api/drafts", {
    method: "POST", headers, body: JSON.stringify({ payload: "x".repeat(17_000) })
  });
  assert.equal(oversizedBody.status, 413, "requests above the 16KB body limit must return Payload Too Large before parsing or mutation");
  const oversizedBodyResult = await oversizedBody.json();
  assert.match(oversizedBodyResult.error, /16KB/i);
  assert.equal(JSON.stringify(oversizedBodyResult).includes(stateDir), false, "oversized-body errors must not expose local state paths");
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
  const concurrentDrafts = [
    { ...draft, id: "dashboard-concurrent-a", title: "Concurrent Tuesday reservation A", scheduledDate: "2026-11-03" },
    { ...draft, id: "dashboard-concurrent-b", title: "Concurrent Tuesday reservation B", scheduledDate: "2026-11-03" }
  ];
  const concurrentResponses = await Promise.all(concurrentDrafts.map(item =>
    fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(item) })
  ));
  assert.deepEqual(
    concurrentResponses.map(response => response.status).sort((a, b) => a - b),
    [201, 409],
    "concurrent requests for the same publication slot must persist exactly one reservation and reject the other"
  );
  const concurrentState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(concurrentState.queueItems.filter(item => item.scheduledDate === "2026-11-03" && item.reservationType === "SCHEDULED_SLOT").length, 1);
  assert.equal(concurrentState.audit.filter(event => event.action === "DRAFT_CREATED" && concurrentDrafts.some(item => item.id === event.itemId)).length, 1);
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
  const approvedScriptSha256 = canonicalAuthoringScriptSha256(authorBody.job.authoring.result.script);
  const staleScriptReview = await fetch(base + "/api/jobs/authoring/review", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, decision: "APPROVE", scriptSha256: "0".repeat(64),
    reason: "Reviewed factual claims against the supplied research."
  }) });
  assert.equal(staleScriptReview.status, 409, "stale script hashes must never be approved");
  const scriptReviewResponse = await fetch(base + "/api/jobs/authoring/review", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, decision: "APPROVE", scriptSha256: approvedScriptSha256,
    reason: "Reviewed factual claims against the supplied research."
  }) });
  const scriptReviewBody = await scriptReviewResponse.json();
  assert.equal(scriptReviewResponse.status, 200, JSON.stringify(scriptReviewBody));
  assert.equal(scriptReviewBody.scriptReview.decision, "APPROVE");
  assert.equal(scriptReviewBody.scriptReview.scriptSha256, approvedScriptSha256);
  assert.equal(scriptReviewBody.publishable, false, "script approval must not imply production or publication approval");
  const narrationWrongRevision = await fetch(base + "/api/jobs/narration", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, scriptSha256: "0".repeat(64)
  }) });
  assert.equal(narrationWrongRevision.status, 409, "narration must reject a script revision that does not match the current draft");
  const rejectedScriptReview = await fetch(base + "/api/jobs/authoring/review", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, decision: "REJECT", scriptSha256: approvedScriptSha256,
    reason: "Revise the narrative structure before narration."
  }) });
  const rejectedScriptReviewBody = await rejectedScriptReview.json();
  assert.equal(rejectedScriptReview.status, 200, JSON.stringify(rejectedScriptReviewBody));
  assert.equal(rejectedScriptReviewBody.job.authoring.status, "REJECTED");
  const reauthorResponse = await fetch(base + "/api/jobs/author", { method: "POST", headers, body: JSON.stringify({ jobId: authorJob.id, brief: authorBrief }) });
  const reauthorBody = await reauthorResponse.json();
  assert.equal(reauthorResponse.status, 201, JSON.stringify(reauthorBody));
  assert.equal(reauthorBody.job.authoring.status, "AWAITING_HUMAN_EDITORIAL_REVIEW", "a rejected draft can be replaced by a newly generated review draft");

  const reauthScriptSha256 = canonicalAuthoringScriptSha256(reauthorBody.job.authoring.result.script);
  const reauthApproval = await fetch(base + "/api/jobs/authoring/review", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, decision: "APPROVE", scriptSha256: reauthScriptSha256,
    reason: "Reviewed the replacement script and source mapping."
  }) });
  assert.equal(reauthApproval.status, 200, "replacement script must be approved against its exact revision");
  const stageStatePath = path.join(stateDir, "dashboard-state.json");
  const stageState = JSON.parse(fs.readFileSync(stageStatePath, "utf8"));
  const stageJob = stageState.jobs.find(job => job.id === authorJob.id);
  narrationFixtureDir = path.join(process.cwd(), "media", "generated-authoring", stageJob.id + "-" + reauthScriptSha256.slice(0, 12));
  fs.mkdirSync(narrationFixtureDir, { recursive: true });
  const digest = value => crypto.createHash("sha256").update(value).digest("hex");
  const fixtureAudio = Buffer.from("test fixture bytes only; not playable production audio");
  const fixtureTranscript = String(stageJob.authoring.result.script.narration).replace(/\s+/gu, " ").trim() + "\n";
  const fixtureCaptions = "1\n00:00:00,000 --> 00:00:55,000\nNarration caption fixture.\n";
  const writeArtifact = (name, bytes) => {
    fs.writeFileSync(path.join(narrationFixtureDir, name), bytes);
    return { path: path.relative(process.cwd(), path.join(narrationFixtureDir, name)).split(path.sep).join("/"), sha256: digest(bytes) };
  };
  const audioArtifact = writeArtifact("narration.mp3", fixtureAudio);
  const transcriptArtifact = writeArtifact("narration.txt", fixtureTranscript);
  const captionsArtifact = writeArtifact("captions.srt", fixtureCaptions);
  const fixtureReport = {
    format: stageJob.contentType, scriptSha256: reauthScriptSha256,
    wordCount: fixtureTranscript.trim().split(/\s+/u).length, durationSeconds: 55,
    wordBoundaryCount: 5, captionTiming: "TTS_WORD_BOUNDARIES",
    audioSha256: audioArtifact.sha256, transcriptSha256: transcriptArtifact.sha256,
    captionsSha256: captionsArtifact.sha256, humanReviewRequired: true,
    rightsStatus: "NOT_VERIFIED", status: "DRAFT_REVIEW_REQUIRED", publishingEnabled: false
  };
  const reportBytes = Buffer.from(JSON.stringify(fixtureReport) + "\n");
  const reportArtifact = writeArtifact("narration-report.json", reportBytes);
  stageJob.authoring.narrationStage = {
    status: "DRAFT_REVIEW_REQUIRED", scriptSha256: reauthScriptSha256,
    scriptApprovalSha256: stageJob.authoring.scriptApproval.approvalSha256,
    narrationReport: fixtureReport,
    artifacts: {
      "narration.mp3": audioArtifact, "narration.txt": transcriptArtifact,
      "captions.srt": captionsArtifact, "narration-report.json": reportArtifact
    }, publishable: false, publishingEnabled: false
  };
  fs.writeFileSync(stageStatePath, JSON.stringify(stageState, null, 2), { mode: 0o600 });
  const narrationBundleResponse = await fetch(base + "/api/jobs/narration/review?jobId=" + encodeURIComponent(authorJob.id), { headers });
  const narrationBundle = await narrationBundleResponse.json();
  assert.equal(narrationBundleResponse.status, 200, JSON.stringify(narrationBundle));
  assert.equal(narrationBundle.scriptSha256, reauthScriptSha256);
  assert.equal(narrationBundle.transcript, fixtureTranscript);
  const audioResponse = await fetch(base + "/api/jobs/narration/audio?jobId=" + encodeURIComponent(authorJob.id), { headers });
  assert.equal(audioResponse.status, 200);
  assert.equal(Buffer.from(await audioResponse.arrayBuffer()).toString(), fixtureAudio.toString());
  const missingAttestations = await fetch(base + "/api/jobs/narration/review", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, decision: "APPROVE", scriptSha256: reauthScriptSha256,
    audioSha256: audioArtifact.sha256, transcriptSha256: transcriptArtifact.sha256,
    captionsSha256: captionsArtifact.sha256, reportSha256: reportArtifact.sha256,
    reason: "Review attempted without full-playback attestations."
  }) });
  assert.equal(missingAttestations.status, 400, "approval must require explicit audio, transcript and caption review attestations");
  const narrationApproval = await fetch(base + "/api/jobs/narration/review", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, decision: "APPROVE", scriptSha256: reauthScriptSha256,
    audioSha256: audioArtifact.sha256, transcriptSha256: transcriptArtifact.sha256,
    captionsSha256: captionsArtifact.sha256, reportSha256: reportArtifact.sha256,
    confirmAudioListened: true, confirmTranscriptReviewed: true, confirmCaptionsReviewed: true,
    reason: "Test fixture only: exercised hash and attestation checks, not a genuine listening review."
  }) });
  const narrationApprovalBody = await narrationApproval.json();
  assert.equal(narrationApproval.status, 200, JSON.stringify(narrationApprovalBody));
  assert.equal(narrationApprovalBody.job.authoring.narrationStage.status, "APPROVED_FOR_RENDER");
  assert.equal(narrationApprovalBody.publishable, false, "narration approval must not imply video approval or publication");
  const authorRenderBypass = await fetch(base + "/api/jobs/produce", { method: "POST", headers, body: JSON.stringify({ jobId: authorJob.id }) });
  const authorRenderBypassBody = await authorRenderBypass.json();
  assert.equal(authorRenderBypass.status, 409, "a generated script must not bypass missing narration/caption/scene integration");
  assert.equal(authorRenderBypassBody.publishable, false);
  assert.match(authorRenderBypassBody.error, /not render-ready; mandatory approval, provenance, quality, compliance or artifact-integrity evidence is missing or stale/i);

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

  const concurrentDraft = {
    id: "dashboard-test-concurrent-worker-claim",
    title: "Concurrent worker lease test",
    topic: "wildlife observation",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: "2026-11-21",
    productUrl: "https://selar.com/0u19v8u99l"
  };
  const concurrentDraftResponse = await fetch(base + "/api/drafts", {
    method: "POST", headers, body: JSON.stringify(concurrentDraft)
  });
  const concurrentDraftBody = await concurrentDraftResponse.json();
  assert.equal(concurrentDraftResponse.status, 201, JSON.stringify(concurrentDraftBody));
  const concurrentJob = concurrentDraftBody.job;
  const concurrentClaims = await Promise.all(["worker-race-a", "worker-race-b"].map(workerId =>
    fetch(base + "/api/jobs/lease/claim", {
      method: "POST",
      headers,
      body: JSON.stringify({ jobId: concurrentJob.id, workerId, leaseMs: 10_000 })
    })
  ));
  const concurrentResults = await Promise.all(concurrentClaims.map(async response => ({
    status: response.status,
    body: await response.json()
  })));
  assert.deepEqual(concurrentResults.map(result => result.status).sort(), [200, 400],
    "simultaneous workers must not both acquire the same content-job lease");
  const winningClaim = concurrentResults.find(result => result.status === 200);
  assert.ok(winningClaim?.body.leaseToken, "the single winning worker receives the lease token");
  assert.equal(concurrentResults.filter(result => result.status === 400).length, 1);
  const leaseRaceState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  const concurrentJobState = leaseRaceState.jobs.find(job => job.id === concurrentJob.id);
  assert.equal(concurrentJobState.workerLease.workerId,
    concurrentResults.find(result => result.status === 200).body.job.workerLease.workerId);
  assert.equal(leaseRaceState.audit.filter(event =>
    event.action === "WORKER_LEASE_CLAIMED" && event.jobId === concurrentJob.id).length, 1,
    "only the winning claim may produce a durable lease-claimed audit event");

  const duplicateRaceDraft = {
    id: "dashboard-test-concurrent-draft-idempotency",
    title: "Concurrent duplicate draft test",
    topic: "ethical wildlife observation",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: "2026-12-05",
    productUrl: "https://selar.com/0u19v8u99l"
  };
  const duplicateRaceResponses = await Promise.all([1, 2].map(() =>
    fetch(base + "/api/drafts", {
      method: "POST", headers, body: JSON.stringify(duplicateRaceDraft)
    })
  ));
  const duplicateRaceResults = await Promise.all(duplicateRaceResponses.map(async response => ({
    status: response.status,
    body: await response.json()
  })));
  assert.deepEqual(duplicateRaceResults.map(result => result.status).sort(), [201, 409],
    "simultaneous duplicate draft submissions must create one durable draft and reject the duplicate");
  const duplicateRaceState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(duplicateRaceState.queueItems.filter(item => item.id === duplicateRaceDraft.id).length, 1,
    "the queue must contain exactly one draft after concurrent duplicate submission");
  assert.equal(duplicateRaceState.jobs.filter(job => job.idempotencyKey === "draft:" + duplicateRaceDraft.id).length, 1,
    "concurrent duplicate submission must not create multiple production jobs");
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
  assert.match(renderAttemptBody.error, /legacy fixed-manifest rendering is disabled/i);
  assert.equal(renderAttemptBody.renderStarted, false, "legacy draft jobs must be rejected before a renderer process is launched");
  assert.equal(renderAttemptBody.publishable, false);
  const legacyRenderState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  const legacyRenderJob = legacyRenderState.jobs.find(job => job.id === renderJob.id);
  assert.equal(legacyRenderJob.state, "QUEUED", "rejecting a legacy render must not claim or mutate the job");
  assert.equal(legacyRenderJob.workerLease, null, "rejecting a legacy render must not claim a worker lease");
  assert.equal(legacyRenderJob.renderExecution, undefined, "rejecting a legacy render must not create render execution state");
  assert.equal(legacyRenderJob.outputArtifacts.length, 0, "a rejected renderer must not claim a generated artifact");
  assert.equal(legacyRenderState.audit.some(event => event.action === "CONTENT_RENDER_STARTED" && event.jobId === renderJob.id), false,
    "a rejected legacy render must not record a render-start audit event");

  // A retry must not let FFmpeg's -y overwrite an output retained after an
  // interrupted attempt. The API must refuse before claiming work and preserve
  // the existing bytes for explicit reconciliation.
  const protectedDraft = {
    id: "dashboard-test-protected-render-output", title: "Protected render output",
    topic: "wildlife observation", contentType: "short", scheduledDay: "Saturday",
    scheduledDate: "2026-10-31", productUrl: "https://selar.com/0u19v8u99l"
  };
  const protectedCreated = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(protectedDraft) });
  const protectedCreatedBody = await protectedCreated.json();
  assert.equal(protectedCreated.status, 201, JSON.stringify(protectedCreatedBody));
  const protectedJob = protectedCreatedBody.job;
  // Exercise the per-job authoring output path; the render readiness gate is
  // intentionally bypassed by the pre-existing-output refusal under test.
  const protectedStatePath = path.join(stateDir, "dashboard-state.json");
  const protectedState = JSON.parse(fs.readFileSync(protectedStatePath, "utf8"));
  const protectedJobIndex = protectedState.jobs.findIndex(job => job.id === protectedJob.id);
  protectedState.jobs[protectedJobIndex].authoring = { status: "TEST_FIXTURE_ONLY" };
  fs.writeFileSync(protectedStatePath, JSON.stringify(protectedState, null, 2), { mode: 0o600 });
  const protectedDirectory = path.join(process.cwd(), "media", "jobs", protectedJob.id);
  const protectedOutput = path.join(protectedDirectory, "final.mp4");
  const protectedBytes = Buffer.from("retained interrupted-render bytes");
  fs.mkdirSync(protectedDirectory, { recursive: true });
  fs.writeFileSync(protectedOutput, protectedBytes);
  try {
    const protectedAttempt = await fetch(base + "/api/jobs/produce", { method: "POST", headers, body: JSON.stringify({ jobId: protectedJob.id }) });
    const protectedBody = await protectedAttempt.json();
    assert.equal(protectedAttempt.status, 409, JSON.stringify(protectedBody));
    assert.equal(protectedBody.recoveryRequired, true);
    assert.equal(protectedBody.retryAllowed, false);
    assert.equal(protectedBody.artifactPath, "media/jobs/" + protectedJob.id + "/final.mp4");
    assert.deepEqual(fs.readFileSync(protectedOutput), protectedBytes, "existing render output must remain byte-for-byte unchanged");
    const protectedState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
    assert.equal(protectedState.jobs.find(job => job.id === protectedJob.id).state, "QUEUED", "refusal must happen before worker claim");
  } finally {
    fs.rmSync(protectedDirectory, { recursive: true, force: true });
  }

  // A prior per-job render manifest is also retained evidence. A restart
  // must not silently replace it merely because the MP4 output is absent.
  const manifestDraft = {
    id: "dashboard-test-protected-render-manifest", title: "Protected render manifest",
    topic: "wildlife observation", contentType: "short", scheduledDay: "Saturday",
    scheduledDate: "2026-11-14", productUrl: "https://selar.com/0u19v8u99l"
  };
  const manifestCreated = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(manifestDraft) });
  const manifestCreatedBody = await manifestCreated.json();
  assert.equal(manifestCreated.status, 201, JSON.stringify(manifestCreatedBody));
  const manifestJob = manifestCreatedBody.job;
  const manifestStatePath = path.join(stateDir, "dashboard-state.json");
  const manifestState = JSON.parse(fs.readFileSync(manifestStatePath, "utf8"));
  const manifestJobIndex = manifestState.jobs.findIndex(job => job.id === manifestJob.id);
  manifestState.jobs[manifestJobIndex].authoring = { status: "TEST_FIXTURE_ONLY" };
  fs.writeFileSync(manifestStatePath, JSON.stringify(manifestState, null, 2), { mode: 0o600 });
  const manifestDirectory = path.join(process.cwd(), "content", "job-render-manifests");
  const manifestPath = path.join(manifestDirectory, manifestJob.id + ".json");
  const retainedManifestBytes = Buffer.from('{"retained":"previous attempt evidence"}\\n');
  fs.mkdirSync(manifestDirectory, { recursive: true });
  fs.writeFileSync(manifestPath, retainedManifestBytes, { flag: "wx", mode: 0o600 });
  try {
    const manifestAttempt = await fetch(base + "/api/jobs/produce", { method: "POST", headers, body: JSON.stringify({ jobId: manifestJob.id }) });
    const manifestBody = await manifestAttempt.json();
    assert.equal(manifestAttempt.status, 409, JSON.stringify(manifestBody));
    assert.equal(manifestBody.recoveryRequired, true);
    assert.equal(manifestBody.retryAllowed, false);
    assert.equal(manifestBody.artifactPath, "content/job-render-manifests/" + manifestJob.id + ".json");
    assert.deepEqual(fs.readFileSync(manifestPath), retainedManifestBytes, "an existing render manifest must remain byte-for-byte unchanged");
    const stateAfterManifestRefusal = JSON.parse(fs.readFileSync(manifestStatePath, "utf8"));
    assert.equal(stateAfterManifestRefusal.jobs.find(job => job.id === manifestJob.id).state, "QUEUED");
  } finally {
    fs.rmSync(manifestPath, { force: true });
  }

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


test("dashboard refuses startup while an interrupted restore journal exists", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-interrupted-restore-"));
  const journal = path.join(stateDir, ".restore-transaction.json");
  fs.writeFileSync(journal, JSON.stringify({
    format: "sonicvhibez-restore-transaction",
    version: 1,
    entries: []
  }) + "\n", { mode: 0o600 });
  const port = 18000 + Math.floor(Math.random() * 10000);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: "test-token-" + "z".repeat(40),
      DASHBOARD_OPERATOR_ID: "test-owner",
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
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const result = await new Promise(resolve => {
    const timer = setTimeout(() => resolve({ timedOut: true, code: null }), 3000);
    child.once("exit", code => {
      clearTimeout(timer);
      resolve({ timedOut: false, code });
    });
  });
  assert.equal(result.timedOut, false, "dashboard must refuse startup before serving partially restored state");
  assert.equal(result.code, 2);
  assert.match(logs, /interrupted state restore journal exists/i);
  assert.equal(fs.existsSync(path.join(stateDir, "dashboard-state.json")), false,
    "startup refusal must not initialize or overwrite state while recovery is pending");
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

test("every protected dashboard API route rejects missing and invalid operator authentication", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-auth-matrix-"));
  const token = "test-token-" + "a".repeat(48);
  const port = 20000 + Math.floor(Math.random() * 20000);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "test-auth-matrix",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", chunk => { stderr += chunk; });
  const base = `http://127.0.0.1:${port}`;

  try {
    let healthy = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) break;
      try {
        const response = await fetch(base + "/healthz", { signal: AbortSignal.timeout(500) });
        if (response.status === 200) {
          healthy = true;
          break;
        }
      } catch {
        // The server may still be binding its local test port.
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(healthy, true, "dashboard must start before authorization matrix runs; stderr: " + stderr);

    const inventory = inventoryDashboardSources(
      fs.readFileSync(path.join(process.cwd(), "public/dashboard.html"), "utf8"),
      fs.readFileSync(path.join(process.cwd(), "scripts/dashboard-server.mjs"), "utf8"),
    );
    const mutatingRoutes = inventory.routes.filter(route =>
      route.path.startsWith("/api/") && route.method !== "GET"
    );
    assert.equal(mutatingRoutes.length, 28, "all declared mutating API routes must be included in the auth matrix");

    for (const route of mutatingRoutes) {
      for (const authCase of [
        { label: "missing token", headers: { "content-type": "application/json" } },
        { label: "invalid token", headers: { "content-type": "application/json", "x-operator-token": "invalid-token" } },
      ]) {
        const response = await fetch(base + route.path, {
          method: route.method,
          headers: authCase.headers,
          body: "{}",
          signal: AbortSignal.timeout(3000),
        });
        assert.equal(
          response.status,
          401,
          `${route.acceptanceId} (${route.method} ${route.path}) must reject ${authCase.label} before validation or mutation`,
        );
        const payload = await response.json();
        assert.match(String(payload.error ?? ""), /authentication required/i);
      }
    }

    const protectedReadRoutes = inventory.routes.filter(route =>
      route.path.startsWith("/api/") && route.method === "GET"
    );
    assert.equal(protectedReadRoutes.length, 7, "all protected API read routes must be included in the auth matrix");

    for (const route of protectedReadRoutes) {
      for (const authCase of [
        { label: "missing token", headers: {} },
        { label: "invalid token", headers: { "x-operator-token": "invalid-token" } },
      ]) {
        const response = await fetch(base + route.path, {
          method: "GET",
          headers: authCase.headers,
          signal: AbortSignal.timeout(3000),
        });
        assert.equal(
          response.status,
          401,
          `${route.acceptanceId} (GET ${route.path}) must reject ${authCase.label}`,
        );
        const payload = await response.json();
        assert.match(String(payload.error ?? ""), /authentication required/i);
      }
    }
  } finally {
    child.kill("SIGTERM");
    await new Promise(resolve => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 3000);
      child.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});



test("all dashboard POST routes reject empty operation payloads without mutating persisted state", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-route-matrix-"));
  const port = 18000 + Math.floor(Math.random() * 10000);
  const token = "route-matrix-token-" + "x".repeat(32);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "route-matrix-owner@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      FACEBOOK_PUBLISH_ENABLED: "NO",
      FACEBOOK_RUNTIME_KILL_SWITCH: "YES",
      META_PAGE_ACCESS_TOKEN: "",
      META_USER_ACCESS_TOKEN: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => {
    child.kill("SIGTERM");
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = "http://127.0.0.1:" + port;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard server did not start: " + logs);

  const routes = [
    "/api/facebook/verify-page",
    "/api/facebook/drafts",
    "/api/facebook/drafts/evaluate",
    "/api/facebook/drafts/approve",
    "/api/facebook/publish",
    "/api/tasks/run",
    "/api/campaigns/manage",
    "/api/drafts",
    "/api/jobs",
    "/api/jobs/production-plan",
    "/api/jobs/production-plan/review",
    "/api/jobs/authoring/review",
    "/api/jobs/narration/reconcile",
    "/api/jobs/narration/review",
    "/api/jobs/narration",
    "/api/jobs/author",
    "/api/jobs/validate",
    "/api/jobs/parent-relationship",
    "/api/jobs/rights/verify",
    "/api/jobs/review",
    "/api/uploads/reconcile",
    "/api/jobs/produce",
    "/api/jobs/lease/claim",
    "/api/jobs/lease/heartbeat",
    "/api/jobs/lease/complete",
    "/api/jobs/lease/reap",
    "/api/jobs/transition",
    "/api/drafts/update"
  ];
  const stateFile = path.join(stateDir, "dashboard-state.json");
  const originalState = fs.readFileSync(stateFile, "utf8");
  const headers = { "content-type": "application/json", "x-operator-token": token };

  for (const route of routes) {
    const response = await fetch(base + route, {
      method: "POST",
      headers,
      body: "{}"
    });
    const responseText = await response.text();
    assert.ok(
      response.status >= 400 && response.status < 500,
      "empty payload for POST " + route + " must fail with a client error, received " +
        response.status + ": " + responseText
    );
    assert.equal(
      fs.readFileSync(stateFile, "utf8"),
      originalState,
      "empty payload for POST " + route + " must not mutate persisted dashboard state"
    );
  }
});
