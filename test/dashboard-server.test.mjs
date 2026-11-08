import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { canonicalAuthoringScriptSha256 } from "../scripts/authoring-production-pipeline.mjs";
import { inventoryDashboardSources } from "../scripts/dashboard-inventory.mjs";
import { futureScheduleDate } from "./helpers/schedule-fixtures.mjs";

async function reservePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
  return port;
}

async function fetchDashboard(url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("connection", "close");
  return fetch(url, { ...options, headers });
}

function dueJohannesburgSlot(minutesAgo = 2) {
  const now = Date.now() - minutesAgo * 60_000;
  return {
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date(now)),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).format(new Date(now)),
    timezone: "Africa/Johannesburg"
  };
}

test("dashboard API authenticates operators, persists real drafts, and cannot grant approval", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-"));
  let narrationFixtureDir = null;
  let validationFixtureDir = null;
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
  let providerCalls = 0;
  const provider = createServer((req, res) => {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      providerCalls += 1;
      // Hold the provider response long enough for a concurrent duplicate API
      // request to observe GENERATING and fail closed without a second call.
      await new Promise(resolve => setTimeout(resolve, 100));
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(generatedScript) } }] }));
    });
  });
  await new Promise(resolve => provider.listen(0, "127.0.0.1", resolve));
  const providerPort = provider.address().port;
  const port = await reservePort();
  const token = "test-token-" + "x".repeat(40);
  const serverEnv = { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_WORKER_TOKEN: "worker-test-token-" + "y".repeat(40), DASHBOARD_OPERATOR_ID: "test-owner@example.test", DASHBOARD_STATE_DIR: stateDir, UPLOAD_LOG_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1", SCRIPT_GENERATION_ENDPOINT: `http://127.0.0.1:${providerPort}/v1/chat/completions`, SCRIPT_GENERATION_TIMEOUT_MS: "5000" };
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-outside-path-"));
  let child = spawn(process.execPath, [path.join(process.cwd(), "scripts", "dashboard-server.mjs")], {
    cwd: outsideDir,
    env: serverEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
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
    if (validationFixtureDir) fs.rmSync(validationFixtureDir, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) break;
    try { const response = await fetchDashboard(base + "/healthz"); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server did not start: " + logs);
  const unauthorized = await fetchDashboard(base + "/api/state");
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
    const response = await fetchDashboard(base + route.path, { method: route.method });
    assert.equal(
      response.status,
      401,
      `unauthenticated request must be rejected for ${route.method} ${route.path}`,
    );
  }
  const malformedUnicodeToken = "é" + "x".repeat(token.length - 1);
  assert.equal(malformedUnicodeToken.length, token.length);
  const malformedTokenResponse = await fetchDashboard(base + "/api/state", { headers: { "x-operator-token": malformedUnicodeToken } });
  assert.equal(malformedTokenResponse.status, 401, "equal JavaScript string lengths with unequal UTF-8 byte lengths must reject cleanly");
  const headers = { "content-type": "application/json", "x-operator-token": token };

  // Route-level boundary acceptance for lifecycle operations whose complete
  // success path is separately gated by real media, remote receipts and human review.
  const protectedRouteStatePath = path.join(stateDir, "dashboard-state.json");
  const beforeProtectedRouteBoundaries = fs.existsSync(protectedRouteStatePath)
    ? fs.readFileSync(protectedRouteStatePath)
    : null;
  const narrationMissing = await fetchDashboard(base + "/api/jobs/narration", {
    method: "POST", headers, body: JSON.stringify({})
  });
  assert.equal(narrationMissing.status, 400, "narration generation must reject missing job/hash inputs");
  const narrationUnknown = await fetchDashboard(base + "/api/jobs/narration", {
    method: "POST", headers, body: JSON.stringify({ jobId: "missing-content-job", scriptSha256: "a".repeat(64) })
  });
  assert.equal(narrationUnknown.status, 404, "narration generation must return 404 for an unknown content job");

  const parentRelationshipMissing = await fetchDashboard(base + "/api/jobs/parent-relationship", {
    method: "POST", headers, body: JSON.stringify({})
  });
  assert.equal(parentRelationshipMissing.status, 400, "parent relationship must require explicit review and exact artifact inputs");
  const parentRelationshipUnknown = await fetchDashboard(base + "/api/jobs/parent-relationship", {
    method: "POST", headers, body: JSON.stringify({
      jobId: "missing-short-job", parentJobId: "missing-parent-job",
      parentMediaPath: "media/parent.mp4", childMediaPath: "media/child.mp4",
      parentQualityEvidencePath: "evidence/parent.json",
      confirmRelationshipReviewed: true, relationshipReviewNotes: "Reviewed test relationship evidence."
    })
  });
  assert.equal(parentRelationshipUnknown.status, 404, "parent relationship must reject unknown child/parent jobs");

  const contentReviewMissing = await fetchDashboard(base + "/api/jobs/review", {
    method: "POST", headers, body: JSON.stringify({})
  });
  assert.equal(contentReviewMissing.status, 400, "content review must require a job and explicit decision");
  const contentReviewUnknown = await fetchDashboard(base + "/api/jobs/review", {
    method: "POST", headers, body: JSON.stringify({ jobId: "missing-review-job", decision: "REJECT" })
  });
  assert.equal(contentReviewUnknown.status, 404, "content review must return 404 for an unknown job");
  if (beforeProtectedRouteBoundaries !== null) {
    assert.deepEqual(fs.readFileSync(protectedRouteStatePath), beforeProtectedRouteBoundaries,
      "rejected narration, parent-binding and review requests must preserve durable state byte-for-byte");
  } else {
    assert.equal(fs.existsSync(protectedRouteStatePath), false,
      "rejected lifecycle requests must not create durable state");
  }
  const malformedJson = await fetchDashboard(base + "/api/drafts", {
    method: "POST", headers, body: "{\"id\":"
  });
  assert.equal(malformedJson.status, 400, "malformed JSON must be rejected before any draft mutation");
  const malformedJsonBody = await malformedJson.json();
  assert.match(malformedJsonBody.error, /valid JSON/i);
  assert.equal(JSON.stringify(malformedJsonBody).includes(stateDir), false, "malformed-body errors must not expose local state paths");
  const unsupportedContentType = await fetchDashboard(base + "/api/drafts", {
    method: "POST",
    headers: { "content-type": "text/plain", "x-operator-token": token },
    body: JSON.stringify({ id: "must-not-be-created", title: "Unsupported content type" }),
  });
  assert.equal(unsupportedContentType.status, 415, "JSON-looking bodies with a non-JSON media type must be rejected");
  const unsupportedContentTypeBody = await unsupportedContentType.json();
  assert.ok(unsupportedContentTypeBody.error.includes("application/json"));
  assert.equal(JSON.stringify(unsupportedContentTypeBody).includes(stateDir), false, "unsupported-content-type errors must not disclose local paths");
  const oversizedBody = await fetchDashboard(base + "/api/drafts", {
    method: "POST", headers, body: JSON.stringify({ payload: "x".repeat(17_000) })
  });
  assert.equal(oversizedBody.status, 413, "requests above the 16KB body limit must return Payload Too Large before parsing or mutation");
  const oversizedBodyResult = await oversizedBody.json();
  assert.match(oversizedBodyResult.error, /16KB/i);
  assert.equal(JSON.stringify(oversizedBodyResult).includes(stateDir), false, "oversized-body errors must not expose local state paths");
  const initial = await fetchDashboard(base + "/api/state", { headers });
  assert.equal(initial.status, 200);
  const body = await initial.json();
  assert.equal(body.publishingEnabled, false);
  assert.equal(body.uploadLedger.available, false, "a symlinked upload ledger must never be trusted as authoritative attempt history");
  assert.match(body.uploadLedger.error, /unsafe/i, "the dashboard must report an unsafe ledger without exposing its contents");
  assert.equal(Object.hasOwn(body, "stateFile"), false, "authenticated API responses must not disclose the local state-file path");
  assert.equal(logs.includes(stateDir), false, "startup logs must not disclose the local state directory");
  assert.ok(body.blockers.some(item => /complete SonicVhibez public\/private\/unlisted history is reconciled/i.test(item)), "dashboard state must expose the live history reconciliation blocker");
  assert.ok(!body.blockers.some(item => /CADENCE DECISION REQUIRED/.test(item)), "the recorded owner approval must clear only the cadence-decision blocker");
  const autonomousUnauth = await fetchDashboard(base + "/api/facebook/autonomous-status");
  assert.equal(autonomousUnauth.status, 401, "autonomous publisher status must use the same operator authentication");
  const autonomousResponse = await fetchDashboard(base + "/api/facebook/autonomous-status", { headers });
  assert.equal(autonomousResponse.status, 200);
  const autonomous = await autonomousResponse.json();
  assert.equal(autonomous.destination, "nature_frontiers_facebook");
  assert.equal(autonomous.publishingEnabled, false, "dashboard must report disabled safe defaults");
  assert.equal(autonomous.emergencyStop, true);
  assert.equal(Object.hasOwn(autonomous, "META_PAGE_ACCESS_TOKEN"), false);
  assert.ok(Array.isArray(autonomous.blockers));
  assert.equal(typeof autonomous.queueCount, "number");

  const emergencyStoppedPublish = await fetchDashboard(base + "/api/facebook/publish", {
    method: "POST", headers, body: JSON.stringify({ draftId: "must-not-publish", confirmOperation: true })
  });
  const emergencyStoppedBody = await emergencyStoppedPublish.json();
  assert.equal(emergencyStoppedPublish.status, 409);
  assert.ok(emergencyStoppedBody.blockers.some(item => /Facebook emergency stop is active/i.test(item)),
    "manual publish endpoint must explicitly report the emergency stop even if other kill switches are also disabled");
  const stateBeforeCampaignTests = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(stateBeforeCampaignTests.facebookAttempts.length, 0, "emergency-stop rejection must not create an external-operation attempt");

  const readinessResponse = await fetchDashboard(base + "/readyz");
  const readiness = await readinessResponse.json();
  assert.equal(readinessResponse.status, 503, "production readiness must fail closed while owner-controlled prerequisites are missing");
  assert.equal(readiness.ready, false);
  assert.equal(readiness.publishingEnabled, false);
  assert.ok(Array.isArray(readiness.blockers));
  assert.ok(readiness.blockers.some(item => /long-form(?: render manifest|-render-manifest)/i.test(item)));
  assert.ok(readiness.blockers.some(item => /SONICVHIBEZ_CHANNEL_ID|channel ID/i.test(item)));
  assert.ok(!readiness.blockers.some(item => /CADENCE DECISION REQUIRED/.test(item)), "owner-approved cadence must no longer be a production blocker");
  assert.ok(readiness.blockers.some(item => /complete SonicVhibez public, private and unlisted history/i.test(item)), "unreconciled live history must remain a blocker");
  const operationalReadinessResponse = await fetchDashboard(base + "/operational-readyz");
  const operationalReadiness = await operationalReadinessResponse.json();
  assert.equal(operationalReadinessResponse.status, 200, "local service readiness must not inherit external publication blockers");
  assert.equal(operationalReadiness.ready, true);
  assert.equal(operationalReadiness.mode, "local-service");
  assert.equal(operationalReadiness.publicationReadiness, "separate");
  assert.equal(operationalReadiness.publicationGate, "/readyz");
  assert.equal(operationalReadiness.publishingEnabled, false);
  const noPriorReconcile = await fetchDashboard(base + "/api/uploads/reconcile", { method: "POST", headers, body: JSON.stringify({ jobId: "no-prior-job", videoPath: "README.md", metadataPath: "README.md", approvalPath: "README.md" }) });
  const noPriorBody = await noPriorReconcile.json();
  assert.equal(noPriorReconcile.status, 503, JSON.stringify(noPriorBody));
  assert.match(noPriorBody.error, /unreadable or unsafe/i, "a symlinked attempt ledger must be reported as unavailable, not as an absent prior attempt");
  const symlinkReconcile = await fetchDashboard(base + "/api/uploads/reconcile", { method: "POST", headers, body: JSON.stringify({ jobId: "symlink-job", videoPath: symlinkName, metadataPath: "README.md", approvalPath: "README.md" }) });
  const symlinkBody = await symlinkReconcile.json();
  assert.equal(symlinkReconcile.status, 400, JSON.stringify(symlinkBody));
  assert.match(symlinkBody.error, /resolves outside repository root/i, "repository-relative symlinks must not expose files outside the repository");
  const internalSymlinkReconcile = await fetchDashboard(base + "/api/uploads/reconcile", { method: "POST", headers, body: JSON.stringify({ jobId: "internal-symlink-job", videoPath: internalSymlinkName, metadataPath: "README.md", approvalPath: "README.md" }) });
  const internalSymlinkBody = await internalSymlinkReconcile.json();
  assert.equal(internalSymlinkReconcile.status, 400, JSON.stringify(internalSymlinkBody));
  assert.match(internalSymlinkBody.error, /must not contain symbolic links/i, "even in-repository symlinks must be rejected for evidence paths");
  const safari = body.campaigns.find(c => c.type === "safari_affiliate");
  assert.equal(safari.status, "INACTIVE");
  const preview = await fetchDashboard(base + "/api/campaigns/manage", { method: "POST", headers, body: JSON.stringify({ campaignId: safari.id, action: "preview", destinationUrl: "https://example.com/verified-stay", disclosureText: "I may earn a commission from eligible bookings." }) });
  const previewBody = await preview.json();
  assert.equal(preview.status, 200, JSON.stringify(previewBody));
  assert.equal(previewBody.previewOnly, true);
  const activated = await fetchDashboard(base + "/api/campaigns/manage", { method: "POST", headers, body: JSON.stringify({ campaignId: safari.id, action: "activate", confirmOwnerApproval: true }) });
  const activatedBody = await activated.json();
  assert.equal(activated.status, 400, JSON.stringify(activatedBody));
  assert.match(activatedBody.error, /Safari affiliate campaigns are disabled.*remain INACTIVE/i);
  const afterRejectedActivation = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(afterRejectedActivation.campaigns.find(c => c.id === safari.id).status, "INACTIVE");
  assert.equal(afterRejectedActivation.audit.some(event => event.action === "CAMPAIGN_ACTIVATE" && event.campaignId === safari.id), false,
    "rejected Safari activation must not persist an activation audit event");
  const deactivated = await fetchDashboard(base + "/api/campaigns/manage", { method: "POST", headers, body: JSON.stringify({ campaignId: safari.id, action: "deactivate" }) });
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
    contentType: "long_form", scheduledDay: "Tuesday", scheduledDate: futureScheduleDate("Tuesday", 1), productUrl: "https://selar.com/0u19v8u99l"
  };
  const created = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(draft) });
  assert.equal(created.status, 201, await created.text());
  const duplicate = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(draft) });
  assert.equal(duplicate.status, 409);
  const conflictingSlot = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-other", title: "Conflicting Tuesday reservation" }) });
  assert.equal(conflictingSlot.status, 409, "different drafts must not reserve the same calendar slot");
  const concurrentDrafts = [
    { ...draft, id: "dashboard-concurrent-a", title: "Concurrent Tuesday reservation A", scheduledDate: futureScheduleDate("Tuesday", 2) },
    { ...draft, id: "dashboard-concurrent-b", title: "Concurrent Tuesday reservation B", scheduledDate: "2026-11-03" }
  ];
  const concurrentResponses = await Promise.all(concurrentDrafts.map(item =>
    fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(item) })
  ));
  assert.deepEqual(
    concurrentResponses.map(response => response.status).sort((a, b) => a - b),
    [201, 409],
    "concurrent requests for the same publication slot must persist exactly one reservation and reject the other"
  );
  const concurrentState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(concurrentState.queueItems.filter(item => item.scheduledDate === futureScheduleDate("Tuesday", 2) && item.reservationType === "SCHEDULED_SLOT").length, 1);
  assert.equal(concurrentState.audit.filter(event => event.action === "DRAFT_CREATED" && concurrentDrafts.some(item => item.id === event.itemId)).length, 1);
  const unsupportedDirectJob = await fetchDashboard(base + "/api/jobs", { method: "POST", headers, body: JSON.stringify({
    idempotencyKey: "draft:thursday-job", title: "Unsupported Thursday job", topic: "schedule boundary test",
    contentType: "long_form", scheduledDay: "Thursday", scheduledDate: futureScheduleDate("Thursday", 1), inputReferences: []
  }) });
  assert.equal(unsupportedDirectJob.status, 409, "direct API jobs must respect the authoritative schedule, not just same-date locks");
  assert.match((await unsupportedDirectJob.json()).error, /not an authorized slot/);
  const invalidDate = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-invalid-date", scheduledDate: "2026-02-31" }) });
  assert.equal(invalidDate.status, 400, "invalid calendar dates must be rejected");
  const unsafe = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-unsafe", rightsConfirmed: true }) });
  assert.equal(unsafe.status, 400);

  const beforePastDraft = fs.readFileSync(path.join(stateDir, "dashboard-state.json"));
  const pastDraft = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-past-slot", contentType: "short", scheduledDay: "Saturday", scheduledDate: "2000-01-01" }) });
  const pastDraftBody = await pastDraft.json();
  assert.equal(pastDraft.status, 409, JSON.stringify(pastDraftBody));
  assert.match(pastDraftBody.blockers.join(" "), /must be in the future/i);
  assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), beforePastDraft,
    "a past draft slot must be rejected without changing queue, jobs or audit state");

  const pastDirectJob = await fetchDashboard(base + "/api/jobs", { method: "POST", headers, body: JSON.stringify({ idempotencyKey: "past-direct-job-fixture", title: "Past direct API slot", topic: "Past schedule fail-closed test", contentType: "short", scheduledDay: "Saturday", scheduledDate: "2000-01-01", inputReferences: [] }) });
  const pastDirectJobBody = await pastDirectJob.json();
  assert.equal(pastDirectJob.status, 409, JSON.stringify(pastDirectJobBody));
  assert.match(pastDirectJobBody.blockers.join(" "), /must be in the future/i);
  assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), beforePastDraft,
    "a past direct job slot must be rejected without changing queue, jobs or audit state");

  const pastDraftUpdate = await fetchDashboard(base + "/api/drafts/update", { method: "POST", headers, body: JSON.stringify({ ...draft, scheduledDate: "2000-01-04" }) });
  const pastDraftUpdateBody = await pastDraftUpdate.json();
  assert.equal(pastDraftUpdate.status, 409, JSON.stringify(pastDraftUpdateBody));
  assert.match(pastDraftUpdateBody.blockers.join(" "), /must be in the future/i);
  assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), beforePastDraft,
    "moving an existing draft to a past slot must not mutate state or audit history");

  const updatedDraftResponse = await fetchDashboard(base + "/api/drafts/update", {
    method: "POST", headers,
    body: JSON.stringify({ ...draft, title: "Updated wildlife planning draft" })
  });
  const updatedDraftBody = await updatedDraftResponse.json();
  assert.equal(updatedDraftResponse.status, 200, JSON.stringify(updatedDraftBody));
  assert.equal(updatedDraftBody.item.title, "Updated wildlife planning draft");
  const afterDraftUpdate = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(afterDraftUpdate.queueItems.find(item => item.id === draft.id).title, "Updated wildlife planning draft");
  assert.equal(afterDraftUpdate.audit.filter(event => event.action === "DRAFT_EDITED" && event.itemId === draft.id && event.actor === "test-owner@example.test").length, 1,
    "successful draft editing must persist exactly one authenticated audit event");

  const beforeInvalidDraftUpdate = fs.readFileSync(path.join(stateDir, "dashboard-state.json"));
  const invalidDraftUpdate = await fetchDashboard(base + "/api/drafts/update", {
    method: "POST", headers,
    body: JSON.stringify({ ...draft, scheduledDate: "2026-02-31" })
  });
  assert.equal(invalidDraftUpdate.status, 400);
  assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), beforeInvalidDraftUpdate,
    "invalid calendar date must not mutate draft state or audit history");

  const beforeUnsafeDraftUpdate = fs.readFileSync(path.join(stateDir, "dashboard-state.json"));
  const unsafeDraftUpdate = await fetchDashboard(base + "/api/drafts/update", {
    method: "POST", headers,
    body: JSON.stringify({ ...draft, rightsConfirmed: true })
  });
  assert.equal(unsafeDraftUpdate.status, 400);
  assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), beforeUnsafeDraftUpdate,
    "draft editing must not grant rights confirmation or mutate durable state");

  // Exercise the real HTTP technical-validation route with generated, test-only
  // media. This validates the API contract and FFmpeg/ffprobe integration; it is
  // not a genuine production asset, rights record, or human approval.
  validationFixtureDir = fs.mkdtempSync(path.join(process.cwd(), "content", "validation-integration-"));
  const validationVideoPath = path.join(validationFixtureDir, "validation-short.mp4");
  const validationThumbnailPath = path.join(validationFixtureDir, "validation-thumbnail.jpg");
  const validationCaptionsPath = path.join(validationFixtureDir, "validation-captions.srt");
  const validationMetadataPath = path.join(validationFixtureDir, "validation-metadata.json");
  const validationVideo = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=30:d=50",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=50",
    "-t", "50", "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage",
    "-crf", "35", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart", "-y", validationVideoPath
  ], { encoding: "utf8", timeout: 120_000 });
  assert.equal(validationVideo.status, 0, "test-only vertical Short fixture must render: " + validationVideo.stderr);
  const validationThumbnail = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i",
    "color=c=black:s=1280x720", "-frames:v", "1", "-q:v", "2", "-y", validationThumbnailPath
  ], { encoding: "utf8", timeout: 30_000 });
  assert.equal(validationThumbnail.status, 0, "test-only thumbnail fixture must render: " + validationThumbnail.stderr);
  fs.writeFileSync(validationCaptionsPath,
    "1\n00:00:00,000 --> 00:00:49,500\nTest-only caption cue for technical validation.\n");
  fs.writeFileSync(validationMetadataPath, JSON.stringify({
    channel: "SonicVhibez",
    visibility: "private",
    productUrl: "https://selar.com/0u19v8u99l",
    title: "Test-only vertical validation fixture",
    description: "Synthetic media used only to verify the technical validation API contract.",
    tags: ["wildlife", "education", "documentary"]
  }, null, 2) + "\n");
  const validationDraft = {
    id: "dashboard-validation-short",
    title: "Test-only validation fixture",
    topic: "Technical API validation fixture",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: futureScheduleDate("Saturday", 2),
    productUrl: "https://selar.com/0u19v8u99l"
  };
  const validationDraftResponse = await fetchDashboard(base + "/api/drafts", {
    method: "POST", headers, body: JSON.stringify(validationDraft)
  });
  const validationDraftBody = await validationDraftResponse.json();
  assert.equal(validationDraftResponse.status, 201, JSON.stringify(validationDraftBody));
  const validationJobId = validationDraftBody.job.id;
  const validationStatePath = path.join(stateDir, "dashboard-state.json");
  const validationState = JSON.parse(fs.readFileSync(validationStatePath, "utf8"));
  const validationJob = validationState.jobs.find(item => item.id === validationJobId);
  assert.ok(validationJob, "draft creation must persist its linked content-production job");
  const repositoryPath = file => path.relative(process.cwd(), file).split(path.sep).join("/");
  const fileSha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const videoRelativePath = repositoryPath(validationVideoPath);
  const thumbnailRelativePath = repositoryPath(validationThumbnailPath);
  const captionsRelativePath = repositoryPath(validationCaptionsPath);
  const metadataRelativePath = repositoryPath(validationMetadataPath);
  validationJob.state = "GENERATED";
  validationJob.outputArtifacts = [{ path: videoRelativePath, sha256: fileSha256(validationVideoPath) }];
  validationJob.metadataPath = metadataRelativePath;
  validationJob.metadataVersion = fileSha256(validationMetadataPath);
  validationJob.thumbnailArtifact = { path: thumbnailRelativePath, sha256: fileSha256(validationThumbnailPath) };
  validationJob.authoring = { narrationStage: { artifacts: { "captions.srt": {
    path: captionsRelativePath, sha256: fileSha256(validationCaptionsPath)
  } } } };
  fs.writeFileSync(validationStatePath, JSON.stringify(validationState) + "\n");
  const beforeRejectedValidation = fs.readFileSync(validationStatePath);
  const missingValidationInput = await fetchDashboard(base + "/api/jobs/validate", {
    method: "POST", headers, body: JSON.stringify({})
  });
  assert.equal(missingValidationInput.status, 400, "missing job/caption parameters must be rejected");
  assert.deepEqual(fs.readFileSync(validationStatePath), beforeRejectedValidation,
    "missing validation parameters must not mutate durable state or audit history");
  const unknownValidationJob = await fetchDashboard(base + "/api/jobs/validate", {
    method: "POST", headers,
    body: JSON.stringify({ jobId: "unknown-validation-job", captionsPath: captionsRelativePath })
  });
  assert.equal(unknownValidationJob.status, 404, "unknown validation jobs must be rejected");
  assert.deepEqual(fs.readFileSync(validationStatePath), beforeRejectedValidation,
    "unknown validation jobs must not mutate durable state or audit history");
  const validationResponse = await fetchDashboard(base + "/api/jobs/validate", {
    method: "POST", headers,
    body: JSON.stringify({ jobId: validationJobId, captionsPath: captionsRelativePath })
  });
  const validationBody = await validationResponse.json();
  assert.equal(validationResponse.status, 200, JSON.stringify(validationBody));
  assert.equal(validationBody.job.state, "VALIDATING");
  assert.equal(validationBody.job.validationResults.passed, true);
  assert.equal(validationBody.job.validationResults.artifacts[0].sha256, fileSha256(validationVideoPath));
  const validatedStateBytes = fs.readFileSync(validationStatePath);
  const validatedState = JSON.parse(validatedStateBytes);
  assert.equal(validatedState.audit.filter(event =>
    event.action === "CONTENT_JOB_VALIDATION_PASSED" && event.jobId === validationJobId
  ).length, 1, "successful technical validation must persist exactly one job-bound audit event");
  fs.appendFileSync(validationVideoPath, Buffer.from("tampered-after-validation"));
  const tamperedValidation = await fetchDashboard(base + "/api/jobs/validate", {
    method: "POST", headers,
    body: JSON.stringify({ jobId: validationJobId, captionsPath: captionsRelativePath })
  });
  assert.equal(tamperedValidation.status, 409, "changed media must be rejected by the exact recorded artifact hash");
  assert.deepEqual(fs.readFileSync(validationStatePath), validatedStateBytes,
    "a post-validation media hash mismatch must not mutate job state or audit history");

  const transitionDraft = {
    id: "dashboard-transition-race",
    title: "Transition concurrency fixture",
    topic: "Safe operator transition concurrency",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: futureScheduleDate("Saturday", 3),
    productUrl: "https://selar.com/0u19v8u99l"
  };
  const transitionDraftResponse = await fetchDashboard(base + "/api/drafts", {
    method: "POST", headers, body: JSON.stringify(transitionDraft)
  });
  const transitionDraftBody = await transitionDraftResponse.json();
  assert.equal(transitionDraftResponse.status, 201, JSON.stringify(transitionDraftBody));
  const transitionJobId = transitionDraftBody.job.id;
  const transitionRequests = await Promise.all([1, 2].map(() => fetchDashboard(base + "/api/jobs/transition", {
    method: "POST", headers,
    body: JSON.stringify({ jobId: transitionJobId, nextState: "GENERATING", reason: "Concurrent transition acceptance test" })
  })));
  const transitionStatuses = transitionRequests.map(response => response.status).sort((a, b) => a - b);
  assert.deepEqual(transitionStatuses, [200, 400],
    "concurrent duplicate state transitions must commit exactly once and reject the stale second transition");
  const transitionedStatePath = path.join(stateDir, "dashboard-state.json");
  const transitionedStateBytes = fs.readFileSync(transitionedStatePath);
  const transitionedState = JSON.parse(transitionedStateBytes);
  const transitionedJob = transitionedState.jobs.find(item => item.id === transitionJobId);
  assert.equal(transitionedJob.state, "GENERATING");
  assert.equal(transitionedState.audit.filter(event =>
    event.action === "CONTENT_JOB_STATE_CHANGED" &&
    event.jobId === transitionJobId &&
    event.from === "QUEUED" &&
    event.to === "GENERATING" &&
    event.actor === "test-owner@example.test"
  ).length, 1, "only the committed state transition may create an audit event");
  const duplicateTransition = await fetchDashboard(base + "/api/jobs/transition", {
    method: "POST", headers,
    body: JSON.stringify({ jobId: transitionJobId, nextState: "GENERATING", reason: "Duplicate transition must not commit" })
  });
  assert.equal(duplicateTransition.status, 400);
  assert.deepEqual(fs.readFileSync(transitionedStatePath), transitionedStateBytes,
    "a repeated invalid transition must not mutate state or duplicate its audit record");

  const saved = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.ok(saved.queueItems.some(item => item.id === draft.id));
  assert.ok(saved.audit.some(event => event.action === "DRAFT_CREATED" && event.itemId === draft.id));
  assert.ok(saved.audit.filter(event => event.itemId === draft.id).every(event => event.actor === "test-owner@example.test"), "audit records must use the configured authenticated operator identity");
  assert.equal(saved.queueItems.find(item => item.id === draft.id).rightsConfirmed, undefined);
  const authorDraft = { id: "dashboard-test-authoring-short", title: "Evidence-led wildlife Short", topic: "Interpreting wildlife observations", contentType: "short", scheduledDay: "Saturday", scheduledDate: futureScheduleDate("Saturday", 1), productUrl: "https://selar.com/0u19v8u99l" };
  const authorDraftResponse = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(authorDraft) });
  const authorDraftBody = await authorDraftResponse.json();
  assert.equal(authorDraftResponse.status, 201, JSON.stringify(authorDraftBody));
  const authorJob = authorDraftBody.job;
  const authorBrief = { topic: "Interpreting wildlife observations", audience: "Adults", editorialPurpose: "Explain evidence limits", sources: [researchSource], parentRecord: { contentId: "long-parent", weeklyContentCycleId: "cycle-1", format: "long_form", channel: "SonicVhibez" } };
  const concurrentAuthorResponses = await Promise.all([1, 2].map(() =>
    fetchDashboard(base + "/api/jobs/author", { method: "POST", headers, body: JSON.stringify({ jobId: authorJob.id, brief: authorBrief }) })
  ));
  const concurrentAuthorOutcomes = await Promise.all(concurrentAuthorResponses.map(async response => ({
    status: response.status,
    body: await response.json()
  })));
  assert.deepEqual(
    concurrentAuthorOutcomes.map(outcome => outcome.status).sort((a, b) => a - b),
    [201, 409],
    "concurrent identical authoring requests must start exactly one provider call"
  );
  const authorBody = concurrentAuthorOutcomes.find(outcome => outcome.status === 201).body;
  const blockedAuthor = concurrentAuthorOutcomes.find(outcome => outcome.status === 409).body;
  assert.match(blockedAuthor.error, /already in progress|duplicate provider calls are blocked/i);
  assert.equal(providerCalls, 1, "the duplicate request must not call the script provider");
  assert.equal(authorBody.job.authoring.status, "AWAITING_HUMAN_EDITORIAL_REVIEW");
  assert.equal(authorBody.job.authoring.result.script.similarityReview.status, "PENDING", "provider/model claims must never satisfy originality review");
  assert.equal(authorBody.publishable, false);
  assert.equal(authorBody.publishingEnabled, false);
  assert.equal(authorBody.job.authoring.gates.factualVerification, "PENDING");
  assert.equal(authorBody.job.authoring.gates.rightsReview, "PENDING");
  const authorDuplicate = await fetchDashboard(base + "/api/jobs/author", { method: "POST", headers, body: JSON.stringify({ jobId: authorJob.id, brief: authorBrief }) });
  const authorDuplicateBody = await authorDuplicate.json();
  assert.equal(authorDuplicate.status, 200, JSON.stringify(authorDuplicateBody));
  assert.equal(authorDuplicateBody.reused, true, "identical retries after completion must reuse the persisted authoring result");
  assert.equal(providerCalls, 1, "a completed idempotent retry must not call the provider again");
  const previousAuthoringChild = child;
  const authoringServerStopped = new Promise(resolve => previousAuthoringChild.once("exit", resolve));
  previousAuthoringChild.kill("SIGTERM");
  await authoringServerStopped;
  child = spawn(process.execPath, [path.join(process.cwd(), "scripts", "dashboard-server.mjs")], {
    cwd: outsideDir,
    env: serverEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  let authoringServerRestarted = false;
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetchDashboard(base + "/healthz");
      if (response.ok) { authoringServerRestarted = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(authoringServerRestarted, true, "dashboard did not recover after script authoring: " + logs);
  const recoveredAuthoringResponse = await fetchDashboard(base + "/api/state", { headers });
  assert.equal(recoveredAuthoringResponse.status, 200);
  const recoveredAuthoringState = await recoveredAuthoringResponse.json();
  const recoveredAuthoringJob = recoveredAuthoringState.jobs.find(item => item.id === authorJob.id);
  assert.equal(recoveredAuthoringJob.authoring.status, "AWAITING_HUMAN_EDITORIAL_REVIEW");
  assert.equal(recoveredAuthoringJob.authoring.fingerprint, authorBody.job.authoring.fingerprint);
  assert.equal(recoveredAuthoringJob.authoring.scriptSha256, authorBody.job.authoring.scriptSha256);
  assert.equal(providerCalls, 1, "server restart must not regenerate or re-submit the completed script");
  const approvedScriptSha256 = canonicalAuthoringScriptSha256(authorBody.job.authoring.result.script);
  const staleScriptReview = await fetchDashboard(base + "/api/jobs/authoring/review", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, decision: "APPROVE", scriptSha256: "0".repeat(64),
    reason: "Reviewed factual claims against the supplied research."
  }) });
  assert.equal(staleScriptReview.status, 409, "stale script hashes must never be approved");
  const scriptReviewPayload = {
    jobId: authorJob.id, decision: "APPROVE", scriptSha256: approvedScriptSha256,
    reason: "Reviewed factual claims against the supplied research."
  };
  const concurrentScriptReviews = await Promise.all([
    fetchDashboard(base + "/api/jobs/authoring/review", { method: "POST", headers, body: JSON.stringify(scriptReviewPayload) }),
    fetchDashboard(base + "/api/jobs/authoring/review", { method: "POST", headers, body: JSON.stringify(scriptReviewPayload) })
  ]);
  const concurrentScriptReviewBodies = await Promise.all(concurrentScriptReviews.map(response => response.json()));
  assert.ok(concurrentScriptReviews.every(response => response.status === 200),
    "concurrent identical script approvals must succeed or reuse the persisted decision: " + JSON.stringify(concurrentScriptReviewBodies));
  assert.equal(concurrentScriptReviewBodies.filter(body => body.reused === true).length, 1,
    "exactly one concurrent script review must reuse the original approval receipt");
  const scriptReviewBody = concurrentScriptReviewBodies.find(body => body.reused !== true);
  assert.ok(scriptReviewBody, "one concurrent request must create the script approval receipt");
  assert.equal(scriptReviewBody.scriptReview.decision, "APPROVE");
  assert.equal(scriptReviewBody.scriptReview.scriptSha256, approvedScriptSha256);
  assert.equal(scriptReviewBody.publishable, false, "script approval must not imply production or publication approval");
  const scriptApprovalState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(scriptApprovalState.audit.filter(event =>
    event.action === "SCRIPT_REVISION_APPROVED_FOR_NARRATION" && event.jobId === authorJob.id
  ).length, 1, "concurrent identical script approvals must append exactly one audit event");
  const beforeChangedScriptReview = fs.readFileSync(path.join(stateDir, "dashboard-state.json"));
  const changedScriptReview = await fetchDashboard(base + "/api/jobs/authoring/review", {
    method: "POST", headers, body: JSON.stringify({
      ...scriptReviewPayload, reason: "A changed review reason must not reuse the original approval."
    })
  });
  assert.equal(changedScriptReview.status, 409,
    "a changed script-review reason must not reuse an existing approval receipt");
  assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), beforeChangedScriptReview,
    "a changed script-review retry must not mutate state or audit history");
  const narrationWrongRevision = await fetchDashboard(base + "/api/jobs/narration", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, scriptSha256: "0".repeat(64)
  }) });
  assert.equal(narrationWrongRevision.status, 409, "narration must reject a script revision that does not match the current draft");
  const rejectedScriptReview = await fetchDashboard(base + "/api/jobs/authoring/review", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, decision: "REJECT", scriptSha256: approvedScriptSha256,
    reason: "Revise the narrative structure before narration."
  }) });
  const rejectedScriptReviewBody = await rejectedScriptReview.json();
  assert.equal(rejectedScriptReview.status, 200, JSON.stringify(rejectedScriptReviewBody));
  assert.equal(rejectedScriptReviewBody.job.authoring.status, "REJECTED");
  const reauthorResponse = await fetchDashboard(base + "/api/jobs/author", { method: "POST", headers, body: JSON.stringify({ jobId: authorJob.id, brief: authorBrief }) });
  const reauthorBody = await reauthorResponse.json();
  assert.equal(reauthorResponse.status, 201, JSON.stringify(reauthorBody));
  assert.equal(reauthorBody.job.authoring.status, "AWAITING_HUMAN_EDITORIAL_REVIEW", "a rejected draft can be replaced by a newly generated review draft");

  const reauthScriptSha256 = canonicalAuthoringScriptSha256(reauthorBody.job.authoring.result.script);
  const reauthApproval = await fetchDashboard(base + "/api/jobs/authoring/review", { method: "POST", headers, body: JSON.stringify({
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
  const narrationBundleResponse = await fetchDashboard(base + "/api/jobs/narration/review?jobId=" + encodeURIComponent(authorJob.id), { headers });
  const narrationBundle = await narrationBundleResponse.json();
  assert.equal(narrationBundleResponse.status, 200, JSON.stringify(narrationBundle));
  assert.equal(narrationBundle.scriptSha256, reauthScriptSha256);
  assert.equal(narrationBundle.transcript, fixtureTranscript);
  const audioResponse = await fetchDashboard(base + "/api/jobs/narration/audio?jobId=" + encodeURIComponent(authorJob.id), { headers });
  assert.equal(audioResponse.status, 200);
  assert.equal(Buffer.from(await audioResponse.arrayBuffer()).toString(), fixtureAudio.toString());

  // Exercise both read routes concurrently and prove they never mutate state/audit.
  const narrationReadStateBefore = fs.readFileSync(path.join(stateDir, "dashboard-state.json"));
  const parallelReviewResponses = await Promise.all(Array.from({ length: 4 }, () =>
    fetchDashboard(base + "/api/jobs/narration/review?jobId=" + encodeURIComponent(authorJob.id), { headers })
  ));
  const parallelReviewBodies = await Promise.all(parallelReviewResponses.map(response => response.json()));
  assert.ok(parallelReviewResponses.every(response => response.status === 200),
    "concurrent narration review reads must all succeed: " + JSON.stringify(parallelReviewBodies));
  assert.ok(parallelReviewBodies.every(body =>
    body.jobId === authorJob.id && body.scriptSha256 === reauthScriptSha256 &&
    body.stageStatus === "DRAFT_REVIEW_REQUIRED" && body.transcript === fixtureTranscript
  ), "concurrent narration review reads must return the same hash-bound bundle");

  const parallelAudioResponses = await Promise.all(Array.from({ length: 4 }, () =>
    fetchDashboard(base + "/api/jobs/narration/audio?jobId=" + encodeURIComponent(authorJob.id), { headers })
  ));
  const parallelAudioBodies = await Promise.all(parallelAudioResponses.map(response => response.arrayBuffer()));
  assert.ok(parallelAudioResponses.every(response => response.status === 200),
    "concurrent narration audio reads must all succeed");
  assert.ok(parallelAudioBodies.every(bytes => Buffer.from(bytes).equals(fixtureAudio)),
    "concurrent audio streams must return the exact verified bytes");
  assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), narrationReadStateBefore,
    "concurrent narration reads must not mutate durable job state or append audit events");
  const missingAttestations = await fetchDashboard(base + "/api/jobs/narration/review", { method: "POST", headers, body: JSON.stringify({
    jobId: authorJob.id, decision: "APPROVE", scriptSha256: reauthScriptSha256,
    audioSha256: audioArtifact.sha256, transcriptSha256: transcriptArtifact.sha256,
    captionsSha256: captionsArtifact.sha256, reportSha256: reportArtifact.sha256,
    reason: "Review attempted without full-playback attestations."
  }) });
  assert.equal(missingAttestations.status, 400, "approval must require explicit audio, transcript and caption review attestations");
  const narrationReviewPayload = {
    jobId: authorJob.id, decision: "APPROVE", scriptSha256: reauthScriptSha256,
    audioSha256: audioArtifact.sha256, transcriptSha256: transcriptArtifact.sha256,
    captionsSha256: captionsArtifact.sha256, reportSha256: reportArtifact.sha256,
    confirmAudioListened: true, confirmTranscriptReviewed: true, confirmCaptionsReviewed: true,
    reason: "Test fixture only: exercised hash and attestation checks, not a genuine listening review."
  };
  const concurrentNarrationApprovals = await Promise.all([
    fetchDashboard(base + "/api/jobs/narration/review", { method: "POST", headers, body: JSON.stringify(narrationReviewPayload) }),
    fetchDashboard(base + "/api/jobs/narration/review", { method: "POST", headers, body: JSON.stringify(narrationReviewPayload) })
  ]);
  const concurrentNarrationBodies = await Promise.all(concurrentNarrationApprovals.map(response => response.json()));
  assert.ok(concurrentNarrationApprovals.every(response => response.status === 200), JSON.stringify(concurrentNarrationBodies));
  assert.equal(concurrentNarrationBodies.filter(body => body.reused === true).length, 1, "exactly one concurrent review request must reuse the receipt");
  const narrationApprovalBody = concurrentNarrationBodies.find(body => body.reused !== true);
  assert.ok(narrationApprovalBody, "one request must create the original narration approval receipt");
  assert.equal(narrationApprovalBody.job.authoring.narrationStage.status, "APPROVED_FOR_RENDER");
  assert.equal(narrationApprovalBody.publishable, false, "narration approval must not imply video approval or publication");
  const afterConcurrentReviewState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(afterConcurrentReviewState.audit.filter(event => event.action === "NARRATION_APPROVED_FOR_RENDER" && event.jobId === authorJob.id).length, 1, "concurrent exact submissions must create one audit decision");
  const narrationApprovalRetry = await fetchDashboard(base + "/api/jobs/narration/review", { method: "POST", headers, body: JSON.stringify(narrationReviewPayload) });
  const narrationApprovalRetryBody = await narrationApprovalRetry.json();
  assert.equal(narrationApprovalRetry.status, 200, JSON.stringify(narrationApprovalRetryBody));
  assert.equal(narrationApprovalRetryBody.reused, true, "an exact retry after a timeout must reuse the persisted narration approval");
  assert.equal(narrationApprovalRetryBody.narrationReview.approvalSha256, narrationApprovalBody.narrationReview.approvalSha256);
  const beforeNarrationRestart = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  const previousNarrationChild = child;
  const narrationServerStopped = new Promise(resolve => previousNarrationChild.once("exit", resolve));
  previousNarrationChild.kill("SIGTERM");
  await narrationServerStopped;
  child = spawn(process.execPath, [path.join(process.cwd(), "scripts", "dashboard-server.mjs")], {
    cwd: outsideDir,
    env: serverEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  let narrationServerRestarted = false;
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetchDashboard(base + "/healthz");
      if (response.ok) { narrationServerRestarted = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(narrationServerRestarted, true, "dashboard did not recover the narration review receipt: " + logs);
  const recoveredNarrationBundleResponse = await fetchDashboard(base + "/api/jobs/narration/review?jobId=" + encodeURIComponent(authorJob.id), { headers });
  assert.equal(recoveredNarrationBundleResponse.status, 200);
  const recoveredNarrationBundle = await recoveredNarrationBundleResponse.json();
  assert.equal(recoveredNarrationBundle.stageStatus, "APPROVED_FOR_RENDER");
  assert.equal(recoveredNarrationBundle.narrationApproval.approvalSha256, narrationApprovalBody.narrationReview.approvalSha256);
  const recoveredNarrationAudio = await fetchDashboard(base + "/api/jobs/narration/audio?jobId=" + encodeURIComponent(authorJob.id), { headers });
  assert.equal(recoveredNarrationAudio.status, 200, "the exact approved narration audio must remain readable after restart");
  assert.ok(Number(recoveredNarrationAudio.headers.get("content-length")) > 0);
  const afterNarrationRestart = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.equal(afterNarrationRestart.audit.filter(event => event.action === "NARRATION_APPROVED_FOR_RENDER" && event.jobId === authorJob.id).length, 1);
  assert.deepEqual(afterNarrationRestart.jobs.find(job => job.id === authorJob.id).authoring.narrationApproval,
    beforeNarrationRestart.jobs.find(job => job.id === authorJob.id).authoring.narrationApproval,
    "the hash-bound narration review receipt must survive restart unchanged");
  const changedNarrationRetry = await fetchDashboard(base + "/api/jobs/narration/review", { method: "POST", headers, body: JSON.stringify({ ...narrationReviewPayload, reason: "Changed review reason." }) });
  assert.equal(changedNarrationRetry.status, 409, "a changed review cannot overwrite a finalized narration approval");
  fs.writeFileSync(path.join(process.cwd(), audioArtifact.path), "tampered after approval");
  const tamperedNarrationRetry = await fetchDashboard(base + "/api/jobs/narration/review", { method: "POST", headers, body: JSON.stringify(narrationReviewPayload) });
  assert.equal(tamperedNarrationRetry.status, 409, "an exact retry must not replay an approval receipt after an artifact has changed");
  // Give the preflight assertion an already-due Johannesburg slot so it tests
  // render readiness rather than being stopped earlier by the scheduler gate.
  const dueDispatchStatePath = path.join(stateDir, "dashboard-state.json");
  const dueDispatchState = JSON.parse(fs.readFileSync(dueDispatchStatePath, "utf8"));
  const dueDispatchJob = dueDispatchState.jobs.find(job => job.id === authorJob.id);
  const dueDispatchNow = Date.now();
  const dueDispatchDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date(dueDispatchNow));
  const dueDispatchTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).format(new Date(dueDispatchNow - 2 * 60_000));
  const originalAuthorScheduledSlot = structuredClone(dueDispatchJob.scheduledSlot);
  dueDispatchJob.scheduledSlot = { date: dueDispatchDate, time: dueDispatchTime, timezone: "Africa/Johannesburg" };
  fs.writeFileSync(dueDispatchStatePath, JSON.stringify(dueDispatchState, null, 2) + "\n", { mode: 0o600 });
  const authorRenderBypass = await fetchDashboard(base + "/api/jobs/produce", { method: "POST", headers, body: JSON.stringify({ jobId: authorJob.id }) });
  const authorRenderBypassBody = await authorRenderBypass.json();
  assert.equal(authorRenderBypass.status, 409, "a generated script must not bypass missing narration/caption/scene integration");
  assert.equal(authorRenderBypassBody.publishable, false);
  assert.match(authorRenderBypassBody.error, /failed render preflight/i);
  assert.equal(authorRenderBypassBody.jobState, "FAILED");
  assert.equal(authorRenderBypassBody.requiresOperatorRetry, true);
  const restoredAuthorState = JSON.parse(fs.readFileSync(dueDispatchStatePath, "utf8"));
  const restoredAuthorJob = restoredAuthorState.jobs.find(job => job.id === authorJob.id);
  restoredAuthorJob.scheduledSlot = originalAuthorScheduledSlot;
  fs.writeFileSync(dueDispatchStatePath, JSON.stringify(restoredAuthorState, null, 2) + "\n", { mode: 0o600 });

  const authorState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  const preflightFailedJob = authorState.jobs.find(job => job.id === authorJob.id);
  assert.equal(preflightFailedJob.state, "FAILED", "a deterministic render preflight failure must leave the dispatchable queue");
  assert.equal(preflightFailedJob.errorDetails.code, "RENDER_PREFLIGHT_NOT_READY");
  assert.equal(preflightFailedJob.errorDetails.retryableAfterOperatorReview, true);
  assert.equal(authorState.audit.filter(event => event.action === "CONTENT_RENDER_PREFLIGHT_FAILED" && event.jobId === authorJob.id).length, 1);
  assert.equal(preflightFailedJob.authoring.result.script.narration, narration);
  assert.deepEqual(authorState.jobs.find(job => job.id === authorJob.id).authoring.researchBrief, authorBrief, "the exact supplied research brief and evidence locators must remain auditable");
  assert.ok(authorState.audit.some(event => event.action === "SCRIPT_AUTHORING_COMPLETED_REVIEW_REQUIRED" && event.jobId === authorJob.id));
  const productionJob = saved.jobs.find(job => job.kind === "CONTENT_PRODUCTION" && job.idempotencyKey === "draft:" + draft.id);
  assert.ok(productionJob);
  assert.equal(productionJob.transitionHistory[0].actor, "test-owner@example.test");
  const claim = await fetchDashboard(base + "/api/jobs/lease/claim", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, workerId: "test-worker-a", leaseMs: 10_000 }) });
  const claimBody = await claim.json();
  assert.equal(claim.status, 200, JSON.stringify(claimBody));
  assert.equal(claimBody.job.state, "GENERATING");
  const competingClaim = await fetchDashboard(base + "/api/jobs/lease/claim", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, workerId: "test-worker-b", leaseMs: 10_000 }) });
  assert.equal(competingClaim.status, 400, "an active lease must prevent a concurrent worker claim");
  const heartbeat = await fetchDashboard(base + "/api/jobs/lease/heartbeat", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, leaseToken: claimBody.leaseToken, leaseMs: 10_000 }) });
  assert.equal(heartbeat.status, 200);
  const fakeGeneration = await fetchDashboard(base + "/api/jobs/lease/complete", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, leaseToken: claimBody.leaseToken, nextState: "GENERATED", metadataPath: "content/nonexistent-test-metadata.json", result: { outputArtifacts: [{ path: "media/test-only-nonexistent.mp4", sha256: "a".repeat(64) }], metadataVersion: "test-only-metadata-version" } }) });
  assert.equal(fakeGeneration.status, 400, "a nonexistent output must never be recorded as generated");
  const failedCompletionPayload = { jobId: productionJob.id, leaseToken: claimBody.leaseToken, nextState: "FAILED", result: { errorDetails: { retryable: false, message: "test fixture intentionally has no media artifact" } } };
  const failed = await fetchDashboard(base + "/api/jobs/lease/complete", { method: "POST", headers, body: JSON.stringify(failedCompletionPayload) });
  const failedBody = await failed.json();
  assert.equal(failed.status, 200, JSON.stringify(failedBody));
  assert.equal(failedBody.job.state, "FAILED");
  const afterFailedCompletion = fs.readFileSync(path.join(stateDir, "dashboard-state.json"));
  assert.equal(JSON.parse(afterFailedCompletion.toString("utf8")).audit.filter(event => event.action === "WORKER_STAGE_COMPLETED" && event.jobId === productionJob.id).length, 1);
  const failedRetry = await fetchDashboard(base + "/api/jobs/lease/complete", { method: "POST", headers, body: JSON.stringify(failedCompletionPayload) });
  const failedRetryBody = await failedRetry.json();
  assert.equal(failedRetry.status, 200, JSON.stringify(failedRetryBody));
  assert.equal(failedRetryBody.idempotent, true, "an exact worker completion retry must reuse its durable receipt");
  assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), afterFailedCompletion, "an exact worker completion retry must not duplicate state or audit writes");
  const changedCompletion = await fetchDashboard(base + "/api/jobs/lease/complete", { method: "POST", headers, body: JSON.stringify({ ...failedCompletionPayload, result: { errorDetails: { retryable: false, message: "different completion result" } } }) });
  assert.equal(changedCompletion.status, 409, "a reused lease token cannot complete a different result");
  assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), afterFailedCompletion, "a conflicting completion retry must preserve state and audit bytes");

  const concurrentDraft = {
    id: "dashboard-test-concurrent-worker-claim",
    title: "Concurrent worker lease test",
    topic: "wildlife observation",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: futureScheduleDate("Saturday", 4),
    productUrl: "https://selar.com/0u19v8u99l"
  };
  const concurrentDraftResponse = await fetchDashboard(base + "/api/drafts", {
    method: "POST", headers, body: JSON.stringify(concurrentDraft)
  });
  const concurrentDraftBody = await concurrentDraftResponse.json();
  assert.equal(concurrentDraftResponse.status, 201, JSON.stringify(concurrentDraftBody));
  const concurrentJob = concurrentDraftBody.job;
  const concurrentClaims = await Promise.all(["worker-race-a", "worker-race-b"].map(workerId =>
    fetchDashboard(base + "/api/jobs/lease/claim", {
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
    scheduledDate: futureScheduleDate("Saturday", 5),
    productUrl: "https://selar.com/0u19v8u99l"
  };
  const duplicateRaceResponses = await Promise.all([1, 2].map(() =>
    fetchDashboard(base + "/api/drafts", {
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
  const forgedReview = await fetchDashboard(base + "/api/jobs/transition", { method: "POST", headers, body: JSON.stringify({ jobId: productionJob.id, nextState: "AWAITING_HUMAN_REVIEW", reason: "attempted bypass" }) });
  assert.equal(forgedReview.status, 400, "worker output alone cannot bypass the rights-evidence gate");
  const shortDraft = { id: "dashboard-test-render-short", title: "Test Short render attempt", topic: "ethical wildlife filming", contentType: "short", scheduledDay: "Saturday", scheduledDate: futureScheduleDate("Saturday", 6), productUrl: "https://selar.com/0u19v8u99l" };
  const shortCreated = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(shortDraft) });
  const shortCreatedBody = await shortCreated.json();
  assert.equal(shortCreated.status, 201, JSON.stringify(shortCreatedBody));
  const renderJob = shortCreatedBody.job;
  const renderAttempt = await fetchDashboard(base + "/api/jobs/produce", { method: "POST", headers, body: JSON.stringify({ jobId: renderJob.id }) });
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
    scheduledDate: futureScheduleDate("Saturday", 7), productUrl: "https://selar.com/0u19v8u99l"
  };
  const protectedCreated = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(protectedDraft) });
  const protectedCreatedBody = await protectedCreated.json();
  assert.equal(protectedCreated.status, 201, JSON.stringify(protectedCreatedBody));
  const protectedJob = protectedCreatedBody.job;
  // Exercise the per-job authoring output path; the render readiness gate is
  // intentionally bypassed by the pre-existing-output refusal under test.
  const protectedStatePath = path.join(stateDir, "dashboard-state.json");
  const protectedState = JSON.parse(fs.readFileSync(protectedStatePath, "utf8"));
  const protectedJobIndex = protectedState.jobs.findIndex(job => job.id === protectedJob.id);
  protectedState.jobs[protectedJobIndex].authoring = { status: "TEST_FIXTURE_ONLY" };
  const originalProtectedScheduledSlot = structuredClone(protectedState.jobs[protectedJobIndex].scheduledSlot);
  protectedState.jobs[protectedJobIndex].scheduledSlot = dueJohannesburgSlot();
  fs.writeFileSync(protectedStatePath, JSON.stringify(protectedState, null, 2), { mode: 0o600 });
  const protectedDirectory = path.join(process.cwd(), "media", "jobs", protectedJob.id);
  const protectedOutput = path.join(protectedDirectory, "final.mp4");
  const protectedBytes = Buffer.from("retained interrupted-render bytes");
  fs.mkdirSync(protectedDirectory, { recursive: true });
  fs.writeFileSync(protectedOutput, protectedBytes);
  try {
    const protectedAttempt = await fetchDashboard(base + "/api/jobs/produce", { method: "POST", headers, body: JSON.stringify({ jobId: protectedJob.id }) });
    const protectedBody = await protectedAttempt.json();
    assert.equal(protectedAttempt.status, 409, JSON.stringify(protectedBody));
    assert.equal(protectedBody.recoveryRequired, true);
    assert.equal(protectedBody.retryAllowed, false);
    assert.equal(protectedBody.artifactPath, "media/jobs/" + protectedJob.id + "/final.mp4");
    assert.deepEqual(fs.readFileSync(protectedOutput), protectedBytes, "existing render output must remain byte-for-byte unchanged");
    const protectedState = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
    assert.equal(protectedState.jobs.find(job => job.id === protectedJob.id).state, "FAILED", "retained render artifacts must quarantine the job for operator recovery");
    protectedState.jobs.find(job => job.id === protectedJob.id).scheduledSlot = originalProtectedScheduledSlot;
    fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), JSON.stringify(protectedState, null, 2) + "\n", { mode: 0o600 });
  } finally {
    fs.rmSync(protectedDirectory, { recursive: true, force: true });
  }

  // A prior per-job render manifest is also retained evidence. A restart
  // must not silently replace it merely because the MP4 output is absent.
  const manifestDraft = {
    id: "dashboard-test-protected-render-manifest", title: "Protected render manifest",
    topic: "wildlife observation", contentType: "short", scheduledDay: "Saturday",
    scheduledDate: futureScheduleDate("Saturday", 20), productUrl: "https://selar.com/0u19v8u99l"
  };
  const manifestCreated = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(manifestDraft) });
  const manifestCreatedBody = await manifestCreated.json();
  assert.equal(manifestCreated.status, 201, JSON.stringify(manifestCreatedBody));
  const manifestJob = manifestCreatedBody.job;
  const manifestStatePath = path.join(stateDir, "dashboard-state.json");
  const manifestState = JSON.parse(fs.readFileSync(manifestStatePath, "utf8"));
  const manifestJobIndex = manifestState.jobs.findIndex(job => job.id === manifestJob.id);
  manifestState.jobs[manifestJobIndex].authoring = { status: "TEST_FIXTURE_ONLY" };
  const originalManifestScheduledSlot = structuredClone(manifestState.jobs[manifestJobIndex].scheduledSlot);
  manifestState.jobs[manifestJobIndex].scheduledSlot = dueJohannesburgSlot();
  fs.writeFileSync(manifestStatePath, JSON.stringify(manifestState, null, 2), { mode: 0o600 });
  const manifestDirectory = path.join(process.cwd(), "content", "job-render-manifests");
  const manifestPath = path.join(manifestDirectory, manifestJob.id + ".json");
  const retainedManifestBytes = Buffer.from('{"retained":"previous attempt evidence"}\\n');
  fs.mkdirSync(manifestDirectory, { recursive: true });
  fs.writeFileSync(manifestPath, retainedManifestBytes, { flag: "wx", mode: 0o600 });
  try {
    const manifestAttempt = await fetchDashboard(base + "/api/jobs/produce", { method: "POST", headers, body: JSON.stringify({ jobId: manifestJob.id }) });
    const manifestBody = await manifestAttempt.json();
    assert.equal(manifestAttempt.status, 409, JSON.stringify(manifestBody));
    assert.equal(manifestBody.recoveryRequired, true);
    assert.equal(manifestBody.retryAllowed, false);
    const restoredManifestState = JSON.parse(fs.readFileSync(manifestStatePath, "utf8"));
    restoredManifestState.jobs.find(job => job.id === manifestJob.id).scheduledSlot = originalManifestScheduledSlot;
    fs.writeFileSync(manifestStatePath, JSON.stringify(restoredManifestState, null, 2) + "\n", { mode: 0o600 });
    assert.equal(manifestBody.artifactPath, "content/job-render-manifests/" + manifestJob.id + ".json");
    assert.deepEqual(fs.readFileSync(manifestPath), retainedManifestBytes, "an existing render manifest must remain byte-for-byte unchanged");
    const stateAfterManifestRefusal = JSON.parse(fs.readFileSync(manifestStatePath, "utf8"));
    assert.equal(stateAfterManifestRefusal.jobs.find(job => job.id === manifestJob.id).state, "FAILED", "retained render manifests must quarantine the job for operator recovery");
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
    contentType: "short", scheduledDay: "Saturday", scheduledDate: futureScheduleDate("Saturday", 9), productUrl: "https://selar.com/0u19v8u99l"
  };
  const blockedByExistingCollision = await fetchDashboard(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(distantDraft) });
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
  const port = await reservePort();
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
  const port = await reservePort();
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
  const port = await reservePort();
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
  const port = await reservePort();
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
  const port = await reservePort();
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
    try { const response = await fetchDashboard(base + "/healthz"); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server did not start with legacy fixture: " + logs);
  const response = await fetchDashboard(base + "/api/state", { headers: { "x-operator-token": token } });
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
  const port = await reservePort();
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
        const response = await fetchDashboard(base + "/healthz", { signal: AbortSignal.timeout(500) });
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
    assert.equal(mutatingRoutes.length, 33, "all declared mutating API routes must be included in the auth matrix");

    for (const route of mutatingRoutes) {
      for (const authCase of [
        { label: "missing token", headers: { "content-type": "application/json" } },
        { label: "invalid token", headers: { "content-type": "application/json", "x-operator-token": "invalid-token" } },
      ]) {
        const response = await fetchDashboard(base + route.path, {
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
    assert.equal(protectedReadRoutes.length, 11, "all protected API read routes must be included in the auth matrix");

    for (const route of protectedReadRoutes) {
      for (const authCase of [
        { label: "missing token", headers: {} },
        { label: "invalid token", headers: { "x-operator-token": "invalid-token" } },
      ]) {
        const response = await fetchDashboard(base + route.path, {
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
  const port = await reservePort();
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
      const response = await fetchDashboard(base + "/healthz");
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
    const response = await fetchDashboard(base + route, {
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
  const unsignedRelease = await fetchDashboard(base + "/api/worker/quarantine-release", {
    method: "POST", headers, body: JSON.stringify({ jobId: "job-release-123", workerId: "worker-test" })
  });
  assert.equal(unsignedRelease.status, 403, "release endpoint must require the separate operator-only release credential");
  assert.equal(fs.readFileSync(stateFile, "utf8"), originalState, "unsigned release must not mutate dashboard state");
  const workerOnlyRelease = await fetchDashboard(base + "/api/worker/quarantine-release", {
    method: "POST",
    headers: { "content-type": "application/json", "x-worker-token": "worker-test-token-" + "y".repeat(40), "x-worker-id": "worker-test" },
    body: JSON.stringify({ jobId: "job-release-123", workerId: "worker-test" })
  });
  assert.equal(workerOnlyRelease.status, 401, "worker-scoped credentials must not authorize operator quarantine release");
  assert.equal(fs.readFileSync(stateFile, "utf8"), originalState, "worker-only release attempt must not mutate dashboard state");
});


test("read-only Facebook idea, connection-state and task endpoints return truthful safe states", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-readonly-"));
  const port = await reservePort();
  const token = "readonly-route-token-" + "x".repeat(32);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "readonly-owner@example.test",
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
      const response = await fetchDashboard(base + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard server did not start: " + logs);

  const headers = { "x-operator-token": token };
  const stateFile = path.join(stateDir, "dashboard-state.json");
  const originalState = fs.readFileSync(stateFile, "utf8");

  const missingDate = await fetchDashboard(base + "/api/facebook/idea", { headers });
  assert.equal(missingDate.status, 400);
  assert.match((await missingDate.json()).error, /date is required/i);

  const invalidDate = await fetchDashboard(base + "/api/facebook/idea?date=2026-02-30", { headers });
  assert.equal(invalidDate.status, 400);
  assert.match((await invalidDate.json()).error, /date is invalid/i);

  const ideaResponse = await fetchDashboard(base + "/api/facebook/idea?date=2026-10-31", { headers });
  assert.equal(ideaResponse.status, 200);
  const ideaBody = await ideaResponse.json();
  assert.equal(ideaBody.idea.date, "2026-10-31");
  assert.equal(ideaBody.idea.publishReady, false);
  assert.equal(ideaBody.publishReady, false);
  assert.equal(ideaBody.publishingEnabled, false);

  const connectionResponse = await fetchDashboard(base + "/api/facebook/state", { headers });
  assert.equal(connectionResponse.status, 200);
  const connection = await connectionResponse.json();
  assert.equal(connection.publishingEnabled, false);
  assert.equal(connection.pageIdentityVerified, false);
  assert.equal(connection.permissionsConfirmed, false);
  assert.equal(connection.accessTokenConfigured, false);
  assert.ok(Array.isArray(connection.blockers));
  assert.ok(connection.blockers.length > 0);

  const tasksResponse = await fetchDashboard(base + "/api/tasks", { headers });
  assert.equal(tasksResponse.status, 200);
  const tasks = await tasksResponse.json();
  assert.equal(tasks.publicPublishingEnabled, false);
  assert.ok(Array.isArray(tasks.tasks));
  assert.ok(tasks.tasks.length > 0);

  assert.equal(
    fs.readFileSync(stateFile, "utf8"),
    originalState,
    "read-only dashboard endpoints must not mutate persisted state"
  );
});

test("dashboard readiness and state diagnostics enforce the non-waivable 72-hour publication minimum", () => {
  const source = fs.readFileSync(new URL("../scripts/dashboard-server.mjs", import.meta.url), "utf8");
  assert.equal((source.match(/schedule\.minimumPublicationSpacingHours < 72/g) ?? []).length, 2);
  assert.doesNotMatch(source, /schedule\.minimumPublicationSpacingHours <= 0/);
  assert.ok(source.includes("validateCadenceDecision(schedule.cadenceDecision, schedule.minimumPublicationSpacingHours)"));
  assert.equal(source.includes("schedule.ownerApprovedPolicy"), false);
});
