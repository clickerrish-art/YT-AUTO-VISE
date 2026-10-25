import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { validateUploadApproval, validateOneShotUploadAuthorization, assertReconciliationOnlyHasPriorAttempt, verifyRetainedRightsEvidence, sha256File, resolveRegularFileNoSymlinks, resolveRepositoryFileNoSymlinks } from "../scripts/upload-private.mjs";

test("YouTube uploader is private-only and binds upload to the verified SonicVhibez channel", () => {
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");

  // Guard the actual API request, not just the metadata template.
  assert.match(source, /status:\s*\{\s*privacyStatus:\s*"private",\s*selfDeclaredMadeForKids:\s*false,[\s\S]*?\}/);
  assert.match(source, /metadata\.visibility\s*!==\s*"private"/);
  assert.match(source, /item\.id\s*===\s*expectedChannelId/);
  assert.match(source, /metadata\.channelId\s*!==\s*expectedChannelId/);
  assert.match(source, /matchedChannel\.snippet\?\.title\s*!==\s*"SonicVhibez"/);

  // No API path for public visibility, scheduled publishing, or channel-wide uploads.
  assert.doesNotMatch(source, /privacyStatus:\s*["']public["']/);
  assert.doesNotMatch(source, /publishAt\s*:/);
  assert.doesNotMatch(source, /youtube\.videos\.update\s*\(/);
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
  const approval = { decision: "APPROVE", jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64), reviewer: "owner@example.test", rightsEvidenceSha256, rightsEvidence, publishingEnabled: false, visibility: "private", relatedArtifacts: [{ path: "media/next-short.mp4", sha256: "a".repeat(64) }, { path: "media/next-short-thumbnail.jpg", sha256: "d".repeat(64) }, { path: "content/next-short.srt", sha256: "e".repeat(64) }, { path: "content/next-short.json", sha256: "b".repeat(64) }] };
  assert.equal(validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), true);
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
    assert.match(workflow, /Refuse ledger bypass after any prior manual upload run/);
    assert.match(workflow, /event=workflow_dispatch&per_page=100/);
    assert.match(workflow, /PREVIOUS_LEDGER_RUN_ID/);
    assert.match(workflow, /previous_ledger_run_id cannot be NONE because prior manual private-upload workflow history exists/);
    assert.match(workflow, /previous_ledger_run_id/);
    assert.match(workflow, /sonicvhibez-upload-ledger/);
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
  assert.match(source, /fetchCompleteYoutubeHistory\(youtube, matchedChannel, safeHistoryPath, expectedChannelId\)/);
});

test("reconciliation-only mode cannot create a new upload attempt", () => {
  assert.throws(() => assertReconciliationOnlyHasPriorAttempt(true, null), /refuses to create a new upload attempt/);
  assert.equal(assertReconciliationOnlyHasPriorAttempt(true, { status: "RECOVERY_REQUIRED" }), true);
  assert.equal(assertReconciliationOnlyHasPriorAttempt(false, null), true);
});


test("upload approval, rights evidence and one-shot authorization reject malformed timestamps", () => {
  const baseRights = { assetPath: "media/source.mp4", assetSha256: "e".repeat(64), licenseEvidenceLocation: "rights/source-license.txt", licenseEvidenceSha256: "f".repeat(64), permittedUses: ["YouTube"], verificationStatus: "VERIFIED", verifiedBy: "Test Operator", verifiedAt: "2026-10-24T00:00:00.000Z" };
  const approvalBase = { decision: "APPROVE", jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64), reviewer: "Test Operator", rightsEvidenceSha256: crypto.createHash("sha256").update(JSON.stringify(baseRights)).digest("hex"), rightsEvidence: baseRights, publishingEnabled: false, visibility: "private", relatedArtifacts: [{ path: "media/next-short.mp4", sha256: "a".repeat(64) }, { path: "media/next-short-thumbnail.jpg", sha256: "d".repeat(64) }, { path: "content/next-short.srt", sha256: "e".repeat(64) }, { path: "content/next-short.json", sha256: "b".repeat(64) }] };
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
