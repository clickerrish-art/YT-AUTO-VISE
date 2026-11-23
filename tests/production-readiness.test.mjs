import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTestDashboardProject } from "../test/helpers/queue-identity-fixture.mjs";

function currentYouTubeReconciliationExpectation() {
  const verification = JSON.parse(fs.readFileSync("content/youtube-channel-verification-status.json", "utf8"));
  const reconciliation = JSON.parse(fs.readFileSync("content/youtube-history-reconciliation.json", "utf8"));
  const now = Date.now();
  const isFresh = value => {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= 24 * 60 * 60 * 1000;
  };
  const publication = verification.publicationHistoryReconciliation;
  const attempts = reconciliation.uploadAttemptReconciliation;
  const verificationAttempts = verification.uploadAttemptReconciliation;
  const ledgerValidation = attempts?.evidence?.automatedLedgerValidation;
  const inventoryArtifact = verification.inventoryArtifact;
  const channel = verification.channel;
  const priorOwnerReview = verification.previousSuccessfulVerification?.publicationHistoryReconciliation;
  const priorOwnerVideo = verification.previousSuccessfulVerification?.videos?.find(video =>
    video?.id === reconciliation.videos?.[0]?.id
  );
  const reconciledVideo = reconciliation.videos?.[0];
  const priorOwnerReviewMatchesFreshRecord =
    priorOwnerReview?.status === "OWNER_REVIEWED_REMOTE_HISTORY_MATCHES_FRESH_INVENTORY" &&
    priorOwnerReview?.verifiedBy === "clickerrish-art" &&
    priorOwnerVideo?.ownerConfirmed === true &&
    priorOwnerVideo?.format === reconciledVideo?.format &&
    priorOwnerVideo?.visibility === reconciledVideo?.visibility &&
    priorOwnerVideo?.youtubePublishedAt === reconciledVideo?.actualPublishedAt &&
    priorOwnerVideo?.duration === reconciledVideo?.latestInventoryMatch?.duration &&
    priorOwnerVideo?.ownerReview?.format === reconciledVideo?.format &&
    priorOwnerVideo?.ownerReview?.studioPublicationDateConfirmed === true &&
    reconciledVideo?.priorOwnerReview?.reaffirmedAt === "2026-11-18" &&
        reconciledVideo?.priorOwnerReview?.ownerConfirmed === true &&
        reconciledVideo?.priorOwnerReview?.verifiedBy === "clickerrish-art" &&
    verification.videos?.length === 1 &&
    verification.videos[0]?.id === reconciledVideo?.id &&
    verification.videos[0]?.visibility === reconciledVideo?.visibility &&
    verification.videos[0]?.youtubePublishedAt === reconciledVideo?.actualPublishedAt &&
    verification.videos[0]?.duration === reconciledVideo?.latestInventoryMatch?.duration;
  const publicationReviewAccepted =
    publication?.status === "OWNER_REVIEWED_REMOTE_HISTORY_MATCHES_FRESH_INVENTORY" ||
    (publication?.status === "PRIOR_OWNER_REVIEW_MATCHES_FRESH_INVENTORY" && priorOwnerReviewMatchesFreshRecord);
  const historyMatches = verification.channelIdentityVerified === true &&
    verification.uploadsInventoryComplete === true &&
    typeof channel?.id === "string" &&
    ["SonicVhibez", "SonicVibes"].includes(channel.title) &&
    channel.handle === "@sonicvhibez" &&
    publicationReviewAccepted &&
    publication.freshInventoryRunId === verification.workflowRunId &&
    publication.freshInventoryArtifactSha256 === inventoryArtifact?.sha256 &&
    reconciliation.complete === true &&
    reconciliation.channelId === channel.id &&
    reconciliation.verifiedAt === verification.checkedAt &&
    reconciliation.latestInventoryEvidence?.verifiedAt === reconciliation.verifiedAt &&
    reconciliation.latestInventoryEvidence?.complete === true &&
    reconciliation.latestInventoryEvidence?.workflowRunId === verification.workflowRunId &&
    reconciliation.latestInventoryEvidence?.artifactSha256 === inventoryArtifact?.sha256 &&
    reconciliation.latestInventoryEvidence?.totalUploads === verification.totalUploads;
  const historyFresh = isFresh(verification.checkedAt) &&
    isFresh(reconciliation.verifiedAt) &&
    Date.parse(inventoryArtifact?.expiresAt ?? "") > now;
  const attemptsReconciled = attempts?.status === "VERIFIED_NO_PRIOR_PRIVATE_UPLOAD_JOBS" &&
    reconciliation.uploadAttemptReconciliation?.status === attempts.status &&
    reconciliation.uploadAttemptReconciliation?.inspectedAt === attempts.inspectedAt &&
    verificationAttempts?.status === attempts.status &&
    verificationAttempts?.inspectedAt === attempts.inspectedAt &&
    verificationAttempts?.evidence?.automatedLedgerValidation?.runId === ledgerValidation?.runId &&
    verificationAttempts?.ownerAttestation?.status === "CONFIRMED" &&
    attempts.ownerAttestation?.status === "CONFIRMED" &&
    attempts.ownerAttestation.confirmedAt === attempts.inspectedAt?.slice(0, 10) &&
    attempts.evidence?.executedPrivateUploadJobs === 0 &&
    attempts.evidence?.uploadArtifactPrivatelyWorkflowRunsFound === 0 &&
    ledgerValidation?.conclusion === "success" &&
    ledgerValidation.executedPrivateUploadRuns === 0 &&
    ledgerValidation.previousLedgerRunId === "NONE" &&
    attempts.evidence?.nextPrivateUploadPreviousLedgerRunId === "NONE";
  const attemptsFresh = isFresh(attempts?.inspectedAt);
  return { historyMatches, historyFresh, attemptsReconciled, attemptsFresh };
}

test("readiness report identifies blockers, preserves safety defaults, and reports history evidence according to its actual age", () => {
  const env = { ...process.env };
  for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) delete env[key];
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.equal(result.status, 2);
  assert.match(result.stdout, /SonicVhibez production readiness/);
  const reconciliation = currentYouTubeReconciliationExpectation();
  const historyCurrent = reconciliation.historyMatches && reconciliation.historyFresh;
  if (historyCurrent) assert.doesNotMatch(result.stdout, /LIVE BLOCKER: complete owner-reviewed public\/private\/unlisted SonicVhibez history evidence is missing, stale, or inconsistent/);
  else assert.match(result.stdout, /LIVE BLOCKER: complete owner-reviewed public\/private\/unlisted SonicVhibez history evidence is missing, stale, or inconsistent/);
  assert.doesNotMatch(result.stdout, /LIVE BLOCKER: YouTube OAuth upload scope is not independently verified/,
    "the 21 November read-only scope verification is fresh; the separate history gate remains stale");
  assert.doesNotMatch(result.stdout, /latest read-only YouTube OAuth attempt is BLOCKED \(OAuth error invalid_grant\)/);
  assert.doesNotMatch(result.stdout, /LIVE BLOCKER: complete SonicVhibez public, private and unlisted history/);
  assert.match(result.stdout, /LIVE BLOCKER: local, workflow and owner-attested upload-attempt reconciliation is missing, stale, or incomplete/);
  assert.match(result.stdout, /HOLD:/);
  assert.match(result.stdout, /public publishing disabled/);
  assert.match(result.stdout, /content\/render-manifest\.json/);
  assert.match(result.stdout, /long-form-render-manifest/);
  assert.match(result.stdout, /narration rights are not cleared for public branded\/production use/i);
  assert.match(result.stdout, /owner selected Speechma Andrew.*zero-cost browser audition.*No audition audio has been generated/i);
  assert.match(result.stdout, /manual browser action/);
  assert.match(result.stdout, /Under the zero-cost constraint/);
  assert.match(result.stdout, /download the MP3 for durable project retention/);
  assert.match(result.stdout, /free-site Terms prohibit scripts, bots and automated CAPTCHA solving/);
  assert.match(result.stdout, /only the official API is permitted for automation, and that API is paid/);
  assert.match(result.stdout, /do not automate Speechma's free site/i);
  assert.match(result.stdout, /Do not use HeyGen Free-plan Roderic or Wade audio/);
  assert.match(result.stdout, /do not run local Piper\/Edge TTS/);
  assert.doesNotMatch(result.stdout, /Owner-authorized zero-cost alternative auditions are permitted/);
  const shortManifest = JSON.parse(fs.readFileSync("content/render-manifest.json", "utf8"));
  assert.equal(shortManifest.footageOrigin, "ai_generated_reconstruction", "the production manifest must target AI-generated wildlife visuals");
  assert.equal(shortManifest.reviewPreviewFootageOrigin, "licensed_pexels_stock", "the legacy preview remains accurately labelled as stock review material");
  assert.equal(shortManifest.aiGenerationStatus, "NOT_GENERATED");
  assert.equal(shortManifest.creatorCapturedOriginal, false);
  assert.equal(shortManifest.originalCreatorCapturedMediaRequired, false);
  assert.equal(shortManifest.stockMediaAllowed, false);
  assert.equal(shortManifest.pexelsAllowed, false);
  assert.equal(shortManifest.pixabayAllowed, false);
  assert.equal(shortManifest.stockVideoFootageAllowed, false);
  assert.equal(shortManifest.stockPhotographsAllowed, false);
  assert.equal(shortManifest.aiGeneratedWildlifeVisualsAllowed, true);
  assert.match(result.stdout, /AI-generated wildlife generation is pending/);
  assert.ok(Array.isArray(shortManifest.footageSourceUrls) && shortManifest.footageSourceUrls.length >= 3);
  assert.ok(shortManifest.aiGenerationEvidencePath);
  assert.equal(shortManifest.syntheticMediaDisclosureRequired, true);
  assert.match(result.stdout, /Metadata complianceReviewed must be true/);
  assert.doesNotMatch(result.stdout, /Metadata needs the verified SonicVhibez YouTube channel ID/);
  assert.match(result.stdout, /SONICVHIBEZ_CHANNEL_ID/);
  assert.doesNotMatch(result.stdout, /read-only YouTube identity and uploads inventory verification is BLOCKED; OAuth error invalid_client/);
  assert.match(result.stdout, /YOUTUBE_CLIENT_ID/);
  assert.match(result.stdout, /never uploads, schedules, or publishes/i);
});

test("readiness JSON exposes stable blocker IDs, severity, evidence and age-aware external reconciliation findings", () => {
  const env = { ...process.env };
  for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) delete env[key];
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.equal(report.application, "SonicVhibez Marketing Machine");
  assert.equal(report.mode, "read-only");
  assert.equal(report.status, "blocked");
  assert.ok(report.blockerCount > 0);
  assert.equal(report.blockers.length, report.blockerCount);
  const narrationRightsBlockers = report.blockers.filter(blocker =>
    /narration rights are not cleared for public branded\/production use/i.test(blocker.message)
  );
  assert.equal(narrationRightsBlockers.length, 2);
  assert.ok(narrationRightsBlockers.some(blocker => blocker.message.includes("content/render-manifest.json")));
  assert.ok(narrationRightsBlockers.some(blocker => blocker.message.includes("content/long-form-render-manifest.json")));
  assert.ok(narrationRightsBlockers.every(blocker => blocker.controlOwner === "external_owner_or_human_reviewer"));
  assert.ok(narrationRightsBlockers.every(blocker => blocker.message.includes("Speechma Andrew") && blocker.message.includes("No audition audio has been generated")));
  assert.ok(narrationRightsBlockers.every(blocker => blocker.message.includes("Do not use HeyGen Free-plan Roderic or Wade audio")));
  for (const blocker of report.blockers) {
    assert.match(blocker.id, /^RDY-[A-F0-9]{12}$/);
    assert.ok(["critical", "high"].includes(blocker.severity));
    assert.equal(typeof blocker.message, "string");
    assert.ok(["readiness-check-finding", "repository-path-check", "environment-presence-check", "external-reconciliation-required"].includes(blocker.evidence.kind));
    assert.equal(typeof blocker.evidence.observed, "string");
    assert.ok(["external_owner_or_human_reviewer", "shared_code_and_owner", "maintainer_code_or_configuration"].includes(blocker.controlOwner));
    assert.ok(blocker.resolution.length > 20);
  }
  const reconciliation = currentYouTubeReconciliationExpectation();
  assert.equal(report.blockers.some(blocker => /complete owner-reviewed public\/private\/unlisted SonicVhibez history/.test(blocker.message)), !(reconciliation.historyMatches && reconciliation.historyFresh));
  assert.equal(report.notes.some(note => /YouTube history: verified 1 upload/.test(note)), reconciliation.historyMatches && reconciliation.historyFresh && reconciliation.attemptsReconciled && reconciliation.attemptsFresh);
  const staleScopeBlocker = report.blockers.find(blocker => /YouTube OAuth upload scope is not independently verified/.test(blocker.message));
  assert.equal(staleScopeBlocker, undefined, "fresh 21 November scope evidence must satisfy only the OAuth-scope gate");
  assert.equal(report.blockers.some(blocker => /latest read-only YouTube OAuth attempt is BLOCKED \\(OAuth error invalid_grant\\)/.test(blocker.message)), false);
  assert.equal(report.blockers.some(blocker => /OAuth error invalid_client/.test(blocker.message) && blocker.evidence.path === "content/youtube-channel-verification-status.json"), false, "the verified read-only OAuth inventory must not remain incorrectly marked as invalid_client");
  const invalidGrantBlocker = report.blockers.find(blocker => /invalid_grant/i.test(blocker.message));
  if (invalidGrantBlocker) {
    assert.equal(invalidGrantBlocker.controlOwner, "external_owner_or_human_reviewer");
    assert.match(invalidGrantBlocker.resolution, /YOUTUBE_REFRESH_TOKEN/);
    assert.match(invalidGrantBlocker.resolution, /youtube\.readonly/);
    assert.match(invalidGrantBlocker.resolution, /youtube\.upload/);
    assert.match(invalidGrantBlocker.resolution, /offline access/i);
    assert.match(invalidGrantBlocker.resolution, /Never paste token values/i);
  }
  const cadenceBlocker = report.blockers.find(blocker => /CADENCE DECISION REQUIRED/i.test(blocker.message));
  assert.equal(cadenceBlocker, undefined, "the recorded feasible owner-approved cadence must not remain blocked");
  assert.ok(report.limitations.some(item => /never uploads/.test(item)));
});



test("readiness JSON distinguishes fresh and stale external reconciliation from code-controlled findings", () => {
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    cwd: process.cwd(), encoding: "utf8",
    env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "", SONICVHIBEZ_CHANNEL_ID: "" }
  });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  const reconciliation = currentYouTubeReconciliationExpectation();
  const historyBlocker = report.blockers.find(blocker => /complete owner-reviewed public\/private\/unlisted SonicVhibez history evidence/.test(blocker.message));
  const attemptsBlocker = report.blockers.find(blocker => /local, workflow and owner-attested upload-attempt reconciliation is missing, stale, or incomplete/.test(blocker.message));
  assert.equal(Boolean(historyBlocker), !(reconciliation.historyMatches && reconciliation.historyFresh));
  assert.equal(Boolean(attemptsBlocker), !(reconciliation.attemptsReconciled && reconciliation.attemptsFresh));
  if (historyBlocker) assert.equal(historyBlocker.evidence.kind, "external-reconciliation-required");
  if (attemptsBlocker) assert.equal(attemptsBlocker.evidence.kind, "external-reconciliation-required");
  assert.equal(report.notes.some(note => /prior upload-attempt reconciliation passed/.test(note)), reconciliation.historyMatches && reconciliation.historyFresh && reconciliation.attemptsReconciled && reconciliation.attemptsFresh);
  assert.equal(report.blockers.some(blocker => blocker.evidence.kind === "repository-path-check" && /YouTube OAuth upload scope/.test(blocker.evidence.observed)), false);
  const readinessSource = fs.readFileSync("scripts/production-readiness.mjs", "utf8");
  assert.match(readinessSource, /const attempts = reconciliation\.uploadAttemptReconciliation/);
  assert.match(readinessSource, /isFreshHistoryEvidence/);
  const freshnessSource = fs.readFileSync("scripts/history-evidence-freshness.mjs", "utf8");
  assert.match(freshnessSource, /HISTORY_EVIDENCE_MAX_AGE_MS = 24 \* 60 \* 60 \* 1000/);
  assert.match(readinessSource, /uploadScopeVerified !== true/);
  assert.match(readinessSource, /reconciliation\.verifiedAt === verification\.checkedAt/);
  assert.doesNotMatch(readinessSource, /blockers\.push\("LIVE BLOCKER: complete SonicVhibez public, private and unlisted history/);
  assert.ok(report.blockers.some(blocker =>
    blocker.evidence.kind === "environment-presence-check" &&
    /secret values are never included/.test(blocker.evidence.observed)
  ));
  const cadence = report.blockers.find(blocker => /CADENCE DECISION REQUIRED/.test(blocker.message));
  assert.equal(cadence, undefined, "the owner-approved cadence is no longer an external approval blocker");
  assert.equal(report.blockers.some(blocker => /Metadata needs the verified SonicVhibez YouTube channel ID/.test(blocker.message)), false, "metadata already contains the authenticated SonicVhibez channel ID");
  const metadata = JSON.parse(fs.readFileSync("content/next-short.json", "utf8"));
  assert.equal(metadata.channelId, "UCSlkuPfHH78oGC1o418HV4w");
  assert.ok(report.blockers.some(blocker => /SONICVHIBEZ_CHANNEL_ID/.test(blocker.message)), "the secure OAuth environment binding remains an owner-controlled gate");
});



test("readiness rejects ungenerated Speechma Andrew narration even if manifest rights flags are manually changed to approved", () => {
  const project = createTestDashboardProject("sonicvhibez-voice-rights-fixture-");
  try {
    const manifestPath = path.join(project.root, "content", "render-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.narrationRightsStatus = "PROVIDER_APPROVED";
    manifest.narrationPublicBrandedDistributionAllowed = true;
    manifest.narrationCommercialUseAllowed = true;
    manifest.narrationProductionUseAllowed = true;
    manifest.rightsConfirmed = true;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    const result = spawnSync(process.execPath, [path.join(project.root, "scripts", "production-readiness.mjs"), "--json"], {
      cwd: project.root,
      encoding: "utf8",
      env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "", SONICVHIBEZ_CHANNEL_ID: "" }
    });
    assert.equal(result.status, 2);
    const report = JSON.parse(result.stdout);
    const blocker = report.blockers.find(item =>
      item.message.includes("content/render-manifest.json") &&
      /narration rights are not cleared for public branded\/production use/i.test(item.message)
    );
    assert.ok(blocker, "provider denial must override manually changed manifest flags");
    assert.match(blocker.message, /Speechma Andrew/);
    assert.match(blocker.message, /No audition audio has been generated/);
  } finally {
    project.cleanup();
  }
});

test("readiness workflow compares retained exit-code evidence and avoids false mismatches from missing step outputs", () => {
  const workflowPath = fileURLToPath(new URL("../.github/workflows/production-readiness.yml", import.meta.url));
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /readiness-report\/exit-codes\.txt/);
  assert.match(workflow, /readiness_status=\$\(sed -n '1p' readiness-report\/exit-codes\.txt\)/);
  assert.match(workflow, /json_status=\$\(sed -n '2p' readiness-report\/exit-codes\.txt\)/);
  assert.ok(workflow.includes("printf '%s\\n%s\\n'"));
  assert.match(workflow, /Production readiness is BLOCKED/);
  assert.doesNotMatch(workflow, /READINESS_EXIT_CODE:-2|READINESS_JSON_EXIT_CODE:-3/);
});


test("readiness evidence redacts absolute external queue paths", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "readiness-queue-"));
  const queueFile = path.join(directory, "queue.json");
  fs.writeFileSync(queueFile, "{ malformed json");
  try {
    const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
      cwd: process.cwd(), encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: queueFile }
    });
    assert.equal(result.status, 2);
    const report = JSON.parse(result.stdout);
    const queueBlocker = report.blockers.find(blocker => /content\/queue\.json is not valid JSON/.test(blocker.message));
    assert.ok(queueBlocker);
    assert.equal(queueBlocker.evidence.path, "configured QUEUE_PATH (absolute path withheld)");
    assert.equal(JSON.stringify(queueBlocker.evidence).includes(directory), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("readiness never accepts an owner-approved cadence that weakens the 72-hour publication invariant", () => {
  const readinessPath = fileURLToPath(new URL("../scripts/production-readiness.mjs", import.meta.url));
  const schedulePath = fileURLToPath(new URL("../config/weekly-content-plan.json", import.meta.url));
  const readiness = fs.readFileSync(readinessPath, "utf8");
  const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));

  const schedulePolicyPath = fileURLToPath(new URL("../scripts/schedule-policy.mjs", import.meta.url));
  const schedulePolicy = fs.readFileSync(schedulePolicyPath, "utf8");
  assert.match(readiness, /validateCadenceDecision\(schedule\.cadenceDecision, minimumSpacingHours\)/);
  assert.match(schedulePolicy, /minimumSpacingHours < 72/);
  assert.match(readiness, /minimumSpacingHours < 72/, "production readiness must independently enforce the hard 72-hour minimum");
  assert.doesNotMatch(readiness, /WEEKLY_TARGET_WITH_SHORTER_SPACING/);
  assert.equal(schedule.minimumPublicationSpacingHours, 72);
  assert.equal(schedule.publicationCycle.minimumHoursBetweenConsecutivePublications, 72);
  assert.equal(schedule.publicationCycle.minimumCycleHours, 216);
  assert.equal(schedule.cadenceDecision.status, "OWNER_APPROVED");
  assert.equal(schedule.cadenceDecision.ownerApproved, true);
  assert.equal(schedule.cadenceDecision.approvedMode, "ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET");
  assert.ok(schedule.cadenceDecision.approvedAt);
  assert.ok(schedule.cadenceDecision.approvalReference.trim());
  assert.doesNotMatch(schedule.cadenceDecision.approvedMode, /WEEKLY_TARGET_WITH_SHORTER_SPACING/);
});


test("readiness rejects valid JSON roots that are not objects for every required config artifact", () => {
  const sourceRoot = process.cwd();
  const cases = [
    ["content/queue.json", "Queue must be a JSON object with an items array"],
    ["content/render-manifest.json", "content/render-manifest.json must contain a JSON object"],
    ["content/long-form-render-manifest.json", "content/long-form-render-manifest.json must contain a JSON object"],
    ["content/next-short.json", "content/next-short.json must contain a JSON object"]
  ];
  for (const [targetPath, expected] of cases) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "readiness-json-root-"));
    try {
      for (const relative of ["scripts", "config", "content"]) fs.mkdirSync(path.join(directory, relative), { recursive: true });
      for (const relative of ["scripts/production-readiness.mjs", "scripts/production-quality-approval.mjs", "scripts/production-quality-scorecard.mjs", "scripts/safe-media-path.mjs", "scripts/product-promotion-gate.mjs", "scripts/schedule-policy.mjs", "scripts/safe-project-file.mjs", "scripts/queue-identity-policy.mjs", "scripts/history-evidence-freshness.mjs", "config/products.json", "config/weekly-content-plan.json", "content/queue.json"]) {
        fs.copyFileSync(path.join(sourceRoot, relative), path.join(directory, relative));
      }
      fs.writeFileSync(path.join(directory, targetPath), "null\n");
      const env = { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "", SONICVHIBEZ_CHANNEL_ID: "" };
      delete env.QUEUE_PATH;
      const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
        cwd: directory, env, encoding: "utf8"
      });
      assert.equal(result.status, 2, targetPath);
      const report = JSON.parse(result.stdout);
      assert.ok(report.blockers.some(blocker => blocker.message.includes(expected)), targetPath);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
});


test("readiness reports malformed render-manifest asset paths without crashing JSON diagnostics", () => {
  const sourceRoot = process.cwd();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "readiness-manifest-path-"));
  try {
    for (const relative of ["scripts", "config", "content", "media"]) fs.mkdirSync(path.join(directory, relative), { recursive: true });
    for (const relative of ["scripts/production-readiness.mjs", "scripts/production-quality-approval.mjs", "scripts/production-quality-scorecard.mjs", "scripts/safe-media-path.mjs", "scripts/product-promotion-gate.mjs", "scripts/schedule-policy.mjs", "scripts/safe-project-file.mjs", "scripts/queue-identity-policy.mjs", "scripts/history-evidence-freshness.mjs", "config/products.json", "config/weekly-content-plan.json", "content/queue.json", "content/next-short.json"]) {
      fs.copyFileSync(path.join(sourceRoot, relative), path.join(directory, relative));
    }
    fs.writeFileSync(path.join(directory, "content/long-form-render-manifest.json"), JSON.stringify({
      channel: "SonicVhibez",
      targetAspectRatio: "16:9",
      title: "Fixture long-form title",
      footagePath: "missing-long-form-footage.mp4",
      narrationPath: "missing-long-form-narration.mp3",
      captionsPath: "missing-long-form-captions.srt",
      footageLicenseEvidence: "pending fixture evidence",
      narrationLicenseEvidence: "pending fixture evidence",
      rightsConfirmed: false,
      complianceReviewed: false,
      containsSyntheticMedia: false,
      hasPaidPromotion: false
    }));
    fs.writeFileSync(path.join(directory, "content/render-manifest.json"), JSON.stringify({
      channel: "SonicVhibez",
      footagePath: { unexpected: "object" },
      narrationPath: 42,
      captionsPath: null,
      footageLicenseEvidence: "evidence reference pending review",
      narrationLicenseEvidence: "evidence reference pending review",
      rightsConfirmed: false,
      complianceReviewed: false
    }));
    const env = { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "", SONICVHIBEZ_CHANNEL_ID: "" };
    delete env.QUEUE_PATH;
    const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
      cwd: directory, env, encoding: "utf8"
    });
    assert.equal(result.status, 2);
    const report = JSON.parse(result.stdout);
    assert.ok(report.blockers.some(blocker => blocker.message.includes("Manifest asset footagePath must be a non-empty relative path string.")));
    assert.ok(report.blockers.some(blocker => blocker.message.includes("Manifest asset narrationPath must be a non-empty relative path string.")));
    assert.ok(report.blockers.some(blocker => blocker.message.includes("Manifest asset captionsPath must be a non-empty relative path string.")));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("readiness blocks selected licensed wildlife assets until source, local MP4, rights and human review are verified", () => {
  const directory = fs.mkdtempSync(path.join(process.cwd(), "content", ".sonicvhibez-media-inventory-"));
  try {
    const inventory = JSON.parse(fs.readFileSync("content/sonicvhibez-imported-media-inventory.json", "utf8"));
    inventory.assets[0].status = "HOLD";
    inventory.assets[0].excludedFromProduction = false;
    inventory.assets[0].selectedForProduction = true;
    inventory.assets[0].selectedForProduction = true;
    const inventoryPath = path.join(directory, "sonicvhibez-imported-media-inventory.json");
    fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
    const relativeInventoryPath = path.relative(process.cwd(), inventoryPath);
    const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
      cwd: process.cwd(),
      env: { ...process.env, SONICVHIBEZ_IMPORTED_MEDIA_INVENTORY_PATH: relativeInventoryPath },
      encoding: "utf8"
    });
    assert.equal(result.status, 2);
    const report = JSON.parse(result.stdout);
    const blocker = report.blockers.find(item => item.message.includes("selected imported wildlife asset"));
    assert.ok(blocker, "selected unverified imported Canva assets must be an explicit production blocker");
    assert.ok(report.blockers.some(item => item.message.includes("thirdPartyRightsReviewed must be true only after checking people, property, trademarks, music and other third-party rights")));
    assert.equal(blocker.severity, "critical");
    assert.equal(blocker.controlOwner, "external_owner_or_human_reviewer");
    assert.ok(blocker.evidence.path.endsWith("sonicvhibez-imported-media-inventory.json"));
    assert.match(blocker.message, /VAHZ9kg2rvg/);
    assert.match(blocker.resolution, /original camera operator/);
    assert.match(blocker.resolution, /capture-provenance/);
    assert.match(blocker.resolution, /original MP4/);
    assert.match(blocker.resolution, /SHA-256/);
    assert.match(blocker.resolution, /third-party rights/);
    assert.match(blocker.resolution, /human visual review/);
    assert.match(blocker.resolution, /Pexels\/Pixabay stock is not eligible/i);
    assert.match(blocker.resolution, /original MP4/);
    assert.match(blocker.resolution, /SHA-256/);
    assert.match(blocker.resolution, /third-party rights/);
    assert.match(blocker.resolution, /human visual review/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("review-eligible Pexels candidates do not become selected production inputs implicitly", () => {
  const inventory = JSON.parse(fs.readFileSync("content/sonicvhibez-imported-media-inventory.json", "utf8"));
  assert.equal(inventory.releaseAuthorized, false);
  assert.equal(inventory.assets.filter(asset => asset.reviewRenderEligible === true && asset.excludedFromProduction === false).length, 8);
  assert.equal(inventory.assets.filter(asset => asset.excludedFromProduction === true).length, 2);
  assert.equal(inventory.status, "CANDIDATES_HELD_PENDING_LOCAL_ORIGINAL_MEDIA_AND_RIGHTS_REVIEW");
  assert.ok(inventory.assets.every(asset => asset.selectedForProduction === false));
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    cwd: process.cwd(), encoding: "utf8"
  });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.equal(report.blockers.some(item => item.message.includes("selected imported wildlife asset")), false);
  assert.ok(report.notes.some(note => note.includes("0 selected/unresolved; release not authorized")));
});

test("Pexels stock remains blocked by original-only policy even when asset-level rights fields are marked complete", () => {
  const directory = fs.mkdtempSync(path.join(process.cwd(), "content", ".sonicvhibez-stock-acceptance-"));
  try {
    const inventory = JSON.parse(fs.readFileSync("content/sonicvhibez-imported-media-inventory.json", "utf8"));
    const candidates = inventory.assets.filter(asset => asset.reviewRenderEligible === true);
    assert.equal(candidates.length, 8);
    const localHash = createHash("sha256").update(fs.readFileSync("package.json")).digest("hex");
    for (const asset of candidates) {
      asset.status = "CLEARED";
      asset.excludedFromProduction = false;
      asset.selectedForProduction = true;
      asset.selectedForProduction = true;
      asset.creatorCapturedOriginal = false;
      asset.sourceMethod = "PEXELS_LICENSED_STOCK";
      asset.sourcePlatform = "Pexels";
      asset.sourcePageUrl = asset.originalSourceUrl;
      asset.creatorName = asset.creatorName || "Verified Pexels contributor";
      asset.creatorConfirmed = true;
      asset.platformLicenseReviewed = true;
      asset.licenseEvidencePath = "package.json";
      asset.thirdPartyRightsReviewed = true;
      asset.rightsEvidencePath = "package.json";
      asset.localMediaPath = "package.json";
      asset.sha256 = localHash;
      asset.rightsConfirmed = true;
      asset.humanVisualReview = "PASS";
      asset.productionEligible = true;
      asset.releaseEligible = true;
    }
    inventory.status = "CLEARED";
    inventory.releaseAuthorized = true;
    const inventoryPath = path.join(directory, "sonicvhibez-imported-media-inventory.json");
    fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
    const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
      cwd: process.cwd(),
      env: { ...process.env, SONICVHIBEZ_IMPORTED_MEDIA_INVENTORY_PATH: path.relative(process.cwd(), inventoryPath) },
      encoding: "utf8"
    });
    assert.equal(result.status, 2, "other production prerequisites must still keep the overall project on HOLD");
    const report = JSON.parse(result.stdout);
    assert.equal(report.blockers.some(item => item.message.includes("selected imported wildlife asset")), true,
      "Pexels stock must remain blocked under original creator-captured-only policy");
    const mediaBlocker = report.blockers.find(item => item.message.includes("selected imported wildlife asset"));
    assert.match(mediaBlocker.resolution, /original camera operator/);
    assert.match(mediaBlocker.resolution, /original MP4/);
    assert.match(mediaBlocker.resolution, /SHA-256/);
    assert.match(mediaBlocker.resolution, /Pexels\/Pixabay stock is not eligible/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("short and long-form manifest templates require original creator-captured footage and reject stock", () => {
  for (const file of [
    "content/render-manifest.example.json",
    "content/long-form-render-manifest.example.json"
  ]) {
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(manifest.footageOrigin, "creator_captured_original");
    assert.equal(manifest.creatorCapturedOriginal, true);
    assert.ok(Array.isArray(manifest.footageSourceUrls) && manifest.footageSourceUrls.length === 0);
    assert.match(manifest.captureEvidencePath, /CAPTURE_EVIDENCE/);
    assert.match(manifest.footageSourceManifest, /ORIGINAL_MEDIA_PROVENANCE_MANIFEST/);
    assert.equal(manifest.platformLicenseReviewed, false);
    assert.equal(manifest.thirdPartyRightsReviewed, false);
    assert.equal(manifest.stockVideoFootageAllowed, false);
    assert.equal(manifest.originalCreatorCapturedMediaRequired, true);
    assert.equal(manifest.stockMediaAllowed, false);
    assert.equal(manifest.pexelsAllowed, false);
    assert.equal(manifest.pixabayAllowed, false);
    assert.equal(manifest.stockPhotographsAllowed, false);
    assert.equal(manifest.aiGeneratedWildlifeVisualsAllowed, false);
    assert.equal(manifest.rightsConfirmed, false);
    assert.equal(manifest.complianceReviewed, false);
  }
});

test("production readiness accepts the exact owner-confirmed queue mapping but remains HOLD for separate production gates", () => {
  const env = { ...process.env };
  delete env.QUEUE_PATH;
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.equal(result.status, 2, "production readiness must remain on HOLD");
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "blocked");
  assert.equal(report.blockers.some(item => /QUEUE IDENTITY RECONCILIATION REQUIRED/.test(item.message)), false);
  assert.ok(report.notes.some(note => /Queue identity reconciliation: 2 owner-approved long-form mappings verified/.test(note)));
  assert.ok(report.blockerCount > 0, "media, narration, human-review and history gates must remain blocking");
});


test("queue production policy carries the manual-only Speechma audition without approving narration", () => {
  const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
  const longFormQueue = JSON.parse(fs.readFileSync("content/long-form-queue.json", "utf8"));
  const expectedNarrator = "No production narrator approved; Speechma Andrew is selected for a manual zero-cost audition only.";
  for (const source of [queue, longFormQueue]) {
    const policy = source.productionPolicy;
    const candidate = policy.selectedNarrationAuditionCandidate;
    assert.equal(policy.narrator, expectedNarrator);
    assert.ok(policy.narrationCommercialRightsStatus.includes("NO_PRODUCTION_NARRATOR_APPROVED"));
    assert.equal(policy.alternativeNarratorAuthorized, false);
    assert.equal(policy.paidUpgradeAuthorized, false);
    assert.equal(policy.publishingEnabled, false);
    assert.equal(candidate.provider, "Speechma");
    assert.equal(candidate.name, "Andrew");
    assert.equal(candidate.manualBrowserOnly, true);
    assert.equal(candidate.automationAllowed, false);
    assert.equal(candidate.securityCodeRequiredPerGeneration, true);
    assert.equal(candidate.maximumCharactersPerStandardConversion, 2000);
    assert.equal(candidate.browserHistoryLocalOnly, true);
    assert.equal(candidate.productionApproved, false);
    assert.equal(candidate.publicationAuthorized, false);
  }
  assert.match(longFormQueue.items.find(item => item.id === "long-form-001-two-eyes-above-water").narrationVoice, /Roderic/);
  assert.match(longFormQueue.items.find(item => item.id === "long-form-001-two-eyes-above-water").narrationVoice, /internal-only.*not commercially cleared/i);
  assert.equal(longFormQueue.items.find(item => item.id === "long-form-001-two-eyes-above-water").narrationStatus, "INTERNAL_EVALUATION_ONLY_PROVIDER_DENIED_COMMERCIAL_USE");
});


test("queue identity approval template is non-approving and pinned to canonical queue hashes", () => {
  const template = JSON.parse(fs.readFileSync("content/queue-identity-approval.template.json", "utf8"));
  const operationalQueue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
  const detailedQueue = JSON.parse(fs.readFileSync("content/long-form-queue.json", "utf8"));
  const canonicalHash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  assert.equal(template.schemaVersion, 1);
  assert.equal(template.status, "PENDING_OWNER_APPROVAL");
  assert.equal(template.ownerApproved, false);
  assert.equal(template.approvedBy, "");
  assert.equal(template.approvedAt, "");
  assert.equal(template.approvalReference, "");
  assert.equal(template.operationalQueueSha256, canonicalHash(operationalQueue));
  assert.equal(template.detailedQueueSha256, canonicalHash(detailedQueue));
  assert.deepEqual(template.mappings, [
    { operationalItemId: "long-form-plan-wildlife-video", detailedItemId: "", cyclePosition: 1 },
    { operationalItemId: "long-form-faceless-wildlife-workflow", detailedItemId: "", cyclePosition: 2 }
  ]);
});
