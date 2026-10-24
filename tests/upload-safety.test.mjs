import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { validateUploadApproval, assertReconciliationOnlyHasPriorAttempt, verifyRetainedRightsEvidence, sha256File } from "../scripts/upload-private.mjs";

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
    assert.match(workflow, /previous_ledger_run_id/);
    assert.match(workflow, /sonicvhibez-upload-ledger/);
    assert.match(workflow, /privacyStatus|private/i);
  }
});


test("reconciliation-only mode cannot create a new upload attempt", () => {
  assert.throws(() => assertReconciliationOnlyHasPriorAttempt(true, null), /refuses to create a new upload attempt/);
  assert.equal(assertReconciliationOnlyHasPriorAttempt(true, { status: "RECOVERY_REQUIRED" }), true);
  assert.equal(assertReconciliationOnlyHasPriorAttempt(false, null), true);
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
