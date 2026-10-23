import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateUploadApproval } from "../scripts/upload-private.mjs";

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
  const approval = { decision: "APPROVE", jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64), reviewer: "owner@example.test", rightsEvidenceSha256: "c".repeat(64), publishingEnabled: false, visibility: "private", relatedArtifacts: [{ path: "media/next-short.mp4", sha256: "a".repeat(64) }, { path: "media/next-short-thumbnail.jpg", sha256: "d".repeat(64) }] };
  assert.equal(validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), true);
  assert.throws(() => validateUploadApproval(approval, { jobId: "job-002", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /job ID/);
  assert.throws(() => validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "d".repeat(64), metadataVersion: "b".repeat(64) }), /artifact checksum/);
  assert.throws(() => validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "e".repeat(64) }), /metadata version/);
  assert.throws(() => validateUploadApproval({ ...approval, visibility: "public" }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /private-only/);
  assert.throws(() => validateUploadApproval({ ...approval, relatedArtifacts: [{ path: "media/next-short.mp4", sha256: "a".repeat(64) }] }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /thumbnail checksum/);
});


test("upload attempts are persisted before insert and reconciled without blind retries", () => {
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  assert.match(source, /CONFIRM_PRIVATE_UPLOAD/);
  assert.match(source, /UPLOAD_APPROVAL_PATH/);
  assert.match(source, /upload-attempts\.json/);
  assert.match(source, /REMOTE_ACCEPTED_RECONCILIATION_REQUIRED/);
  assert.match(source, /RECOVERY_REQUIRED/);
  assert.match(source, /youtube\.videos\.list\(\{ part: \["id", "snippet", "status"\], id: /);
  const ledgerWrite = source.indexOf("writeJsonAtomic(ledgerPath, ledger);");
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
