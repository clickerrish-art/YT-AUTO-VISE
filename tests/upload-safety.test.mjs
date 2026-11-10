import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { validateUploadApproval, validateOneShotUploadAuthorization, assertReconciliationOnlyHasPriorAttempt, verifyRetainedRightsEvidence, sha256File, resolveRegularFileNoSymlinks, resolveRepositoryFileNoSymlinks, prepareUploadLogDirectory, remoteUploadMatchesApprovedMetadata, matchesApprovedSonicVhibezChannel, validatePromotionDisclosure, APPROVED_SELAR_DISCLOSURE } from "../scripts/upload-private.mjs";

test("YouTube uploader is private-only and binds upload to the verified SonicVhibez channel", () => {
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");

  // Guard the actual API request, not just the metadata template.
  assert.match(source, /status:\s*\{\s*privacyStatus:\s*"private",\s*selfDeclaredMadeForKids:\s*false,[\s\S]*?\}/);
  assert.match(source, /metadata\.visibility\s*!==\s*"private"/);
  assert.match(source, /item\.id\s*===\s*expectedChannelId/);
  assert.match(source, /metadata\.channelId\s*!==\s*expectedChannelId/);
  assert.match(source, /matchesApprovedSonicVhibezChannel\(matchedChannel, expectedChannelId\)/);
  assert.match(source, /matchesApprovedSonicVhibezChannel\(item, expectedChannelId\)/);
  assert.match(source, /remoteUploadMatchesApprovedMetadata\(remoteItem/);
  assert.match(source, /remoteUploadMatchesApprovedMetadata\(item/);

  // No API path for public visibility, scheduled publishing, or channel-wide uploads.
  assert.doesNotMatch(source, /privacyStatus:\s*["']public["']/);
  assert.doesNotMatch(source, /publishAt\s*:/);
  assert.doesNotMatch(source, /youtube\.videos\.update\s*\(/);
});


test("YouTube insert uses the documented paid-promotion and synthetic-media API fields", () => {
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  assert.match(source, /part: \["snippet", "status", "paidProductPlacementDetails"\]/);
  assert.match(source, /status:\s*\{[\s\S]*?containsSyntheticMedia: metadata\.containsSyntheticMedia\s*\}/);
  assert.match(source, /paidProductPlacementDetails:\s*\{\s*hasPaidProductPlacement: metadata\.hasPaidPromotion\s*\}/);
  assert.doesNotMatch(source, /status:\s*\{[\s\S]*?paidProductPlacementDetails:/);
});

test("promotion disclosure validation fails closed unless metadata and final captions are exact", () => {
  const metadata = {
    productUrl: "https://selar.com/0u19v8u99l",
    hasPaidPromotion: true,
    containsSyntheticMedia: true,
    description: "ADVERTISEMENT — " + APPROVED_SELAR_DISCLOSURE,
    promotionDisclosure: { status: "APPROVED", type: "direct_sales_revenue", text: APPROVED_SELAR_DISCLOSURE }
  };
  const captions = "Advertisement.\n" + APPROVED_SELAR_DISCLOSURE;
  assert.equal(validatePromotionDisclosure(metadata, captions), true);
  assert.throws(() => validatePromotionDisclosure({ ...metadata, hasPaidPromotion: false }, captions), /paid-promotion declaration/);
  assert.throws(() => validatePromotionDisclosure({ ...metadata, containsSyntheticMedia: undefined }, captions), /synthetic-media declaration/);
  assert.throws(() => validatePromotionDisclosure({ ...metadata, promotionDisclosure: { ...metadata.promotionDisclosure, status: "UNVERIFIED" } }, captions), /owner-approved/);
  assert.throws(() => validatePromotionDisclosure({ ...metadata, description: "Product link: " + APPROVED_SELAR_DISCLOSURE }, captions), /identify the advertisement/);
  assert.throws(() => validatePromotionDisclosure(metadata, "No ad label or disclosure"), /final captions/);
});

test("verified @sonicvhibez handle is accepted when the channel display title is SonicVibes", () => {
  const channelId = "UCSlkuPfHH78oGC1o418HV4w";
  assert.equal(matchesApprovedSonicVhibezChannel({
    id: channelId, snippet: { title: "SonicVibes", customUrl: "@sonicvhibez" }
  }, channelId), true);
  assert.equal(matchesApprovedSonicVhibezChannel({
    id: channelId, snippet: { title: "SonicVibes", customUrl: "@differentchannel" }
  }, channelId), false);
  assert.equal(matchesApprovedSonicVhibezChannel({
    id: "UC" + "A".repeat(22), snippet: { title: "SonicVibes", customUrl: "@sonicvhibez" }
  }, channelId), false);
  assert.equal(matchesApprovedSonicVhibezChannel({
    id: channelId, snippet: { title: "Nature Frontiers", customUrl: "@naturefrontiers" }
  }, channelId), false);
  assert.equal(matchesApprovedSonicVhibezChannel({
    id: channelId, snippet: { title: "SonicVhibez" }
  }, channelId), true);
});

test("upload workflow requires media preflight before the YouTube insert call", () => {
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  const preflightIndex = source.indexOf('scripts/preflight-media.mjs');
  const uploadIndex = source.indexOf('youtube.videos.insert(');
  assert.notEqual(preflightIndex, -1, "media preflight command must exist");
  assert.notEqual(uploadIndex, -1, "YouTube upload call must exist");
  assert.ok(preflightIndex < uploadIndex, "media preflight must happen before upload");
  assert.match(source, /rightsConfirmed and complianceReviewed|preflight-media\.mjs/);
});


test("upload approval rejects mismatched job, artifact, metadata, and visibility", () => {
  const rightsEvidence = { assetPath: "media/source.mp4", assetSha256: "e".repeat(64), licenseEvidenceLocation: "rights/source-license.txt", licenseEvidenceSha256: "f".repeat(64), permittedUses: ["YouTube"], verificationStatus: "VERIFIED", verifiedBy: "owner@example.test", verifiedAt: "2026-10-24T00:00:00.000Z" };
  const rightsEvidenceSha256 = crypto.createHash("sha256").update(JSON.stringify(rightsEvidence)).digest("hex");
  const approval = { decision: "APPROVE", jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64), technicalValidationSha256: crypto.createHash("sha256").update(JSON.stringify({ passed: true, fixtureOnly: true })).digest("hex"), technicalValidationReceipt: { passed: true, fixtureOnly: true }, reviewer: "owner@example.test", rightsEvidenceSha256, rightsEvidence, publishingEnabled: false, visibility: "private", relatedArtifacts: [{ path: "media/next-short.mp4", sha256: "a".repeat(64) }, { path: "media/next-short-thumbnail.jpg", sha256: "d".repeat(64) }, { path: "content/next-short.srt", sha256: "e".repeat(64) }, { path: "content/next-short.json", sha256: "b".repeat(64) }] };
  assert.equal(validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), true);
  assert.throws(() => validateUploadApproval({ ...approval, technicalValidationReceipt: undefined }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /technical-validation receipt is missing/);
  assert.throws(() => validateUploadApproval({ ...approval, technicalValidationReceipt: { passed: false, fixtureOnly: true } }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /receipt checksum does not match/);
  assert.throws(() => validateUploadApproval(approval, { jobId: "job-002", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /job ID/);
  assert.throws(() => validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "d".repeat(64), metadataVersion: "b".repeat(64) }), /artifact checksum/);
  assert.throws(() => validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "e".repeat(64) }), /metadata version/);
  assert.throws(() => validateUploadApproval({ ...approval, visibility: "public" }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /private-only/);
  assert.throws(() => validateUploadApproval({ ...approval, rightsEvidenceSha256: "c".repeat(64) }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /rights evidence checksum/);
  assert.throws(() => validateUploadApproval({ ...approval, rightsEvidence: { ...rightsEvidence, permittedUses: ["Personal use only"] } }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /rights evidence checksum/);
  assert.throws(() => validateUploadApproval({ ...approval, relatedArtifacts: [{ path: "media/next-short.mp4", sha256: "a".repeat(64) }] }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /thumbnail checksum/);
  assert.throws(() => validateUploadApproval({ ...approval, relatedArtifacts: approval.relatedArtifacts.filter(item => !item.path.endsWith(".srt")) }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /captions checksum/);
});


test("upload attempts are persisted before insert and reconciled without blind retries", () => {
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  assert.match(source, /CONFIRM_PRIVATE_UPLOAD/);
  assert.match(source, /UPLOAD_APPROVAL_PATH/);
  assert.match(source, /upload-attempts\.json/);
  assert.match(source, /REMOTE_ACCEPTED_RECONCILIATION_REQUIRED/);
  assert.match(source, /RECOVERY_REQUIRED/);
  assert.match(source, /youtube\.videos\.list\(\{ part: \["id", "snippet", "status"\], id: /);
  const ledgerWrite = source.indexOf("persistJson(ledgerPath, ledger);");
  const insert = source.indexOf("youtube.videos.insert(");
  assert.ok(ledgerWrite !== -1 && ledgerWrite < insert, "attempt ledger must be persisted before the remote insert");
  assert.ok(source.indexOf("if (prior)") < insert, "existing attempts must be reconciled before any new insert");
});

test("both manual upload workflows require explicit private confirmation and preserve the attempt ledger", () => {
  for (const file of [".github/workflows/upload-private.yml", ".github/workflows/upload-artifact-privately.yml"]) {
    const workflow = fs.readFileSync(file, "utf8");
    assert.match(workflow, /confirm_private_upload/);
    assert.match(workflow, /inputs\.confirm_private_upload == 'YES'/);
    assert.match(workflow, /confirm_emergency_stop_release/);
    assert.match(workflow, /one_shot_authorization_path/);
    assert.match(workflow, /PRIVATE_UPLOAD_AUTHORIZATION_PATH:/);
    assert.match(workflow, /group: sonicvhibez-private-upload/);
    assert.match(workflow, /cancel-in-progress: false/);
    assert.match(workflow, /Validate previous upload ledger against executed private-upload jobs/);
    assert.match(workflow, /run: node scripts\/validate-upload-ledger-run\.mjs/);
    assert.match(workflow, /PREVIOUS_LEDGER_RUN_ID/);
    assert.match(workflow, /previous_ledger_run_id/);
    assert.match(workflow, /sonicvhibez-upload-ledger/);
    assert.match(workflow, /CHANNEL_HISTORY_RECONCILIATION_PATH: content\/youtube-history-reconciliation\.json/);
    assert.doesNotMatch(workflow, /Refuse ledger bypass after any prior manual upload run/);
    assert.match(workflow, /run: npm ci --ignore-scripts/);
    assert.doesNotMatch(workflow, /run: npm install --ignore-scripts/);
    assert.match(workflow, /privacyStatus|private/i);
  }
});


test("both manual upload workflows default the emergency stop to active and require an explicit release", () => {
  for (const file of [".github/workflows/upload-private.yml", ".github/workflows/upload-artifact-privately.yml"]) {
    const workflow = fs.readFileSync(file, "utf8");
    assert.match(workflow, /confirm_emergency_stop_release:/);
    assert.match(workflow, /default:\s*'NO'/);
    assert.match(workflow, /inputs\.confirm_emergency_stop_release == 'YES'/);
    assert.match(workflow, /YOUTUBE_EMERGENCY_STOP:/);
  }
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  assert.match(source, /env\.YOUTUBE_EMERGENCY_STOP !== "false"/);
  assert.match(source, /YouTube emergency stop is active or unset; private upload is blocked/);
  assert.match(source, /resolveRepositoryFileNoSymlinks\(authorizationPath, "One-shot private-upload authorization"\)/);
  assert.match(source, /const resolveInputFile = youtubeFactory \? resolveRegularFileNoSymlinks : resolveRepositoryFileNoSymlinks/);
  assert.match(source, /verifyRetainedRightsEvidence\(approval, youtubeFactory \? \{\} : \{ repositoryRoot: process\.cwd\(\) \}\)/);
  assert.match(source, /resolveRepositoryFileNoSymlinks\(env\.CHANNEL_HISTORY_RECONCILIATION_PATH, "Channel history reconciliation"\)/);
  assert.match(source, /fetchCompleteYoutubeHistorySnapshot\(youtube, matchedChannel, safeHistoryPath, expectedChannelId, \{ now: now\(\) \}\)/);
  assert.match(source, /scheduledItems: historySnapshot\.scheduledItems/);
});

test("reconciliation-only mode cannot create a new upload attempt", () => {
  assert.throws(() => assertReconciliationOnlyHasPriorAttempt(true, null), /refuses to create a new upload attempt/);
  assert.equal(assertReconciliationOnlyHasPriorAttempt(true, { status: "RECOVERY_REQUIRED" }), true);
  assert.equal(assertReconciliationOnlyHasPriorAttempt(false, null), true);
});


test("upload approval, rights evidence and one-shot authorization reject malformed timestamps", () => {
  const baseRights = { assetPath: "media/source.mp4", assetSha256: "e".repeat(64), licenseEvidenceLocation: "rights/source-license.txt", licenseEvidenceSha256: "f".repeat(64), permittedUses: ["YouTube"], verificationStatus: "VERIFIED", verifiedBy: "Test Operator", verifiedAt: "2026-10-24T00:00:00.000Z" };
  const approvalBase = { decision: "APPROVE", jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64), technicalValidationSha256: crypto.createHash("sha256").update(JSON.stringify({ passed: true, fixtureOnly: true })).digest("hex"), technicalValidationReceipt: { passed: true, fixtureOnly: true }, reviewer: "Test Operator", rightsEvidenceSha256: crypto.createHash("sha256").update(JSON.stringify(baseRights)).digest("hex"), rightsEvidence: baseRights, publishingEnabled: false, visibility: "private", relatedArtifacts: [{ path: "media/next-short.mp4", sha256: "a".repeat(64) }, { path: "media/next-short-thumbnail.jpg", sha256: "d".repeat(64) }, { path: "content/next-short.srt", sha256: "e".repeat(64) }, { path: "content/next-short.json", sha256: "b".repeat(64) }] };
  for (const invalid of ["2026-02-30T00:00:00.000Z", "2026-10-24T00:00:00", "2026-10-24T00:00:00+14:30"]) {
    const rightsEvidence = { ...baseRights, verifiedAt: invalid };
    const rightsEvidenceSha256 = crypto.createHash("sha256").update(JSON.stringify(rightsEvidence)).digest("hex");
    assert.throws(() => validateUploadApproval({ ...approvalBase, rightsEvidence, rightsEvidenceSha256 }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /valid verification timestamp/);
    assert.throws(() => verifyRetainedRightsEvidence({ rightsEvidence }), /valid verification timestamp/);
    assert.throws(() => validateOneShotUploadAuthorization({
      decision: "AUTHORIZE_ONE_PRIVATE_UPLOAD", authorizationId: "auth-12345678", jobId: "job-001",
      artifactSha256: "a".repeat(64), metadataSha256: "b".repeat(64), approvalSha256: "c".repeat(64),
      channelId: "UC_SONIC_TEST", visibility: "private", publishingEnabled: false, operator: "Test Operator", authorizedAt: invalid
    }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataSha256: "b".repeat(64), approvalSha256: "c".repeat(64), channelId: "UC_SONIC_TEST", now: new Date("2026-10-24T12:00:00.000Z") }), /timestamp must be valid/);
  }
});

test("retained rights evidence fails closed when a source asset or license file changes", async () => {
  const os = await import("node:os");
  const path = await import("node:path");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-rights-integrity-"));
  try {
    const assetPath = path.join(dir, "source.mp4");
    const licensePath = path.join(dir, "license.txt");
    fs.writeFileSync(assetPath, "isolated fixture asset, not production media");
    fs.writeFileSync(licensePath, "isolated test fixture only; not a real license");
    const rightsEvidence = { assetPath, assetSha256: sha256File(assetPath), licenseEvidenceLocation: licensePath, licenseEvidenceSha256: sha256File(licensePath), permittedUses: ["YouTube"], verificationStatus: "VERIFIED", verifiedBy: "Test Operator", verifiedAt: "2026-10-24T00:00:00.000Z" };
    const approval = { rightsEvidence };
    assert.equal(verifyRetainedRightsEvidence(approval), true);
    fs.writeFileSync(licensePath, "changed after review");
    assert.throws(() => verifyRetainedRightsEvidence(approval), /license evidence is missing, empty, or its checksum changed/);
    fs.writeFileSync(licensePath, "isolated test fixture only; not a real license");
    fs.writeFileSync(assetPath, "substituted asset after review");
    assert.throws(() => verifyRetainedRightsEvidence(approval), /source asset is missing or its checksum changed/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});


test("production evidence paths cannot escape the repository root", async () => {
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-upload-outside-root-"));
  const outsideFile = path.join(outsideDir, "outside.json");
  fs.writeFileSync(outsideFile, "{}");
  try {
    assert.equal(resolveRepositoryFileNoSymlinks("package.json"), path.resolve("package.json"));
    assert.throws(() => resolveRepositoryFileNoSymlinks(outsideFile, "Authorization"), /must remain inside the repository root/);
    assert.throws(() => resolveRepositoryFileNoSymlinks(path.join("..", path.basename(outsideDir), "outside.json"), "Authorization"), /must remain inside the repository root|missing or cannot be inspected/);
  } finally {
    fs.rmSync(outsideDir, { recursive: true, force: true });
  }
});

test("upload evidence path resolver rejects symlinked artifacts and rights evidence", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-upload-path-safety-"));
  try {
    const realFile = path.join(dir, "real.txt");
    const linkedFile = path.join(dir, "linked.txt");
    fs.writeFileSync(realFile, "fixture evidence");
    fs.symlinkSync(realFile, linkedFile);
    assert.equal(resolveRegularFileNoSymlinks(realFile), realFile);
    assert.throws(() => resolveRegularFileNoSymlinks(linkedFile, "Approval-bound artifact"), /symbolic link/);
    const rights = {
      rightsEvidence: {
        assets: [{
          assetPath: linkedFile,
          assetSha256: sha256File(realFile),
          licenseEvidenceLocation: realFile,
          licenseEvidenceSha256: sha256File(realFile),
          permittedUses: ["YouTube"],
          verificationStatus: "VERIFIED",
          verifiedBy: "Test Operator",
          verifiedAt: "2026-10-24T00:00:00.000Z"
        }]
      }
    };
    assert.throws(() => verifyRetainedRightsEvidence(rights), /symbolic link/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("upload log directory creation rejects symlinked ancestors before ledger or lock writes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-upload-log-symlink-"));
  const real = path.join(dir, "real");
  const link = path.join(dir, "redirect");
  fs.mkdirSync(real);
  try {
    fs.symlinkSync(real, link, "dir");
    assert.throws(() => prepareUploadLogDirectory(path.join(link, "logs")), /symbolic link/);
    assert.equal(fs.existsSync(path.join(real, "logs")), false, "a symlink must not redirect log directory creation");
    assert.equal(fs.readdirSync(real).length, 0, "no ledger or lock artifacts may be created through the symlink");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("remote YouTube read-back must match exact metadata, paid-promotion and synthetic-media declarations", () => {
  const expected = { videoId: "video-accepted-001", channelId: "UC" + "A".repeat(22), title: "Approved wildlife documentary", description: "ADVERTISEMENT — approved direct-sales disclosure", hasPaidPromotion: true, containsSyntheticMedia: true };
  const remote = { id: expected.videoId, snippet: { channelId: expected.channelId, title: expected.title, description: expected.description }, status: { privacyStatus: "private", containsSyntheticMedia: true }, paidProductPlacementDetails: { hasPaidProductPlacement: true } };
  assert.equal(remoteUploadMatchesApprovedMetadata(remote, expected), true);
  assert.equal(remoteUploadMatchesApprovedMetadata({ ...remote, id: "other-video" }, expected), false);
  assert.equal(remoteUploadMatchesApprovedMetadata({ ...remote, snippet: { ...remote.snippet, channelId: "UC" + "B".repeat(22) } }, expected), false);
  assert.equal(remoteUploadMatchesApprovedMetadata({ ...remote, snippet: { ...remote.snippet, title: "Different title" } }, expected), false);
  assert.equal(remoteUploadMatchesApprovedMetadata({ ...remote, status: { privacyStatus: "unlisted" } }, expected), false);
  assert.equal(remoteUploadMatchesApprovedMetadata({ ...remote, paidProductPlacementDetails: { hasPaidProductPlacement: false } }, expected), false);
  assert.equal(remoteUploadMatchesApprovedMetadata({ ...remote, status: { ...remote.status, containsSyntheticMedia: false } }, expected), false);
  assert.equal(remoteUploadMatchesApprovedMetadata({ ...remote, snippet: { ...remote.snippet, description: "missing disclosure" } }, expected), false);

  assert.equal(remoteUploadMatchesApprovedMetadata(null, expected), false);
});

test("ledger guard distinguishes skipped read-only jobs from executed private-upload jobs", () => {
  const guard = fs.readFileSync("scripts/validate-upload-ledger-run.mjs", "utf8");
  assert.match(guard, /event=workflow_dispatch&per_page=/);
  assert.match(guard, /job\?\.name === "private-upload"/);
  assert.match(guard, /job\?\.conclusion !== "skipped"/);
  assert.match(guard, /earlier read-only or skipped/);
  assert.match(guard, /exactly one unexpired sonicvhibez-upload-ledger artifact/);
});
