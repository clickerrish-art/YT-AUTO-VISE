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
  const approval = { decision: "APPROVE", jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64), reviewer: "owner@example.test", rightsEvidenceSha256: "c".repeat(64), publishingEnabled: false, visibility: "private" };
  assert.equal(validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), true);
  assert.throws(() => validateUploadApproval(approval, { jobId: "job-002", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /job ID/);
  assert.throws(() => validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "d".repeat(64), metadataVersion: "b".repeat(64) }), /artifact checksum/);
  assert.throws(() => validateUploadApproval(approval, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "e".repeat(64) }), /metadata version/);
  assert.throws(() => validateUploadApproval({ ...approval, visibility: "public" }, { jobId: "job-001", artifactSha256: "a".repeat(64), metadataVersion: "b".repeat(64) }), /private-only/);
});
