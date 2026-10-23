import test from "node:test";
import assert from "node:assert/strict";
import { createReviewDecision, isReviewCurrent, validateReviewEvidence } from "../scripts/human-review.mjs";

const artifact = { path: "artifacts/fixture.mp4", sha256: "a".repeat(64) };
const rightsEvidence = {
  assetId: "fixture-wildlife-001",
  source: "owner-provided test fixture",
  rightsHolder: "Fixture author",
  licenseEvidenceLocation: "evidence/fixture-license.txt",
  permittedUses: ["YouTube", "derivative-work"],
  verificationStatus: "VERIFIED",
  verifiedBy: "reviewer@example.test",
  verifiedAt: "2026-10-23T10:00:00.000Z",
  assetSha256: "b".repeat(64)
};
const base = { artifact, rightsEvidence, metadataVersion: "metadata-sha256:cccc", reviewer: "reviewer@example.test", decision: "APPROVE", reason: "" };

test("approval is bound to artifact checksum, metadata version and rights evidence", () => {
  const review = createReviewDecision(base, "2026-10-23T10:01:00.000Z");
  assert.equal(isReviewCurrent(review, { artifact, metadataVersion: base.metadataVersion, rightsEvidence }), true);
  assert.equal(isReviewCurrent(review, { artifact: { ...artifact, sha256: "d".repeat(64) }, metadataVersion: base.metadataVersion, rightsEvidence }), false);
  assert.equal(isReviewCurrent(review, { artifact, metadataVersion: "metadata-sha256:changed", rightsEvidence }), false);
  assert.equal(isReviewCurrent(review, { artifact, metadataVersion: base.metadataVersion, rightsEvidence: { ...rightsEvidence, licenseEvidenceLocation: "evidence/changed.txt" } }), false);
});

test("approval fails closed when rights evidence is missing or incomplete", () => {
  assert.throws(() => createReviewDecision({ ...base, rightsEvidence: null }), /rights evidence is required/);
  assert.throws(() => createReviewDecision({ ...base, rightsEvidence: { ...rightsEvidence, verificationStatus: "UNVERIFIED" } }), /must be marked VERIFIED/);
  assert.throws(() => createReviewDecision({ ...base, rightsEvidence: { ...rightsEvidence, permittedUses: ["personal-use"] } }), /explicitly permit YouTube/);
  assert.throws(() => createReviewDecision({ ...base, artifact: { ...artifact, sha256: "invalid" } }), /SHA-256 checksum/);
});

test("reviewer identity and rejection reason are required", () => {
  assert.throws(() => createReviewDecision({ ...base, reviewer: "" }), /authenticated reviewer identity/);
  assert.throws(() => createReviewDecision({ ...base, decision: "REJECT", reason: "" }), /rejection reason/);
  assert.equal(validateReviewEvidence({ ...base, decision: "REJECT", reason: "Captions are incomplete" }).length, 0);
});


test("approval becomes stale when the reviewed thumbnail checksum changes", () => {
  const thumbnail = { path: "media/fixture-thumbnail.jpg", sha256: "d".repeat(64) };
  const artifactSet = { ...artifact, relatedArtifacts: [artifact, thumbnail] };
  const review = createReviewDecision({ ...base, artifact: artifactSet }, "2026-10-23T10:02:00.000Z");
  assert.equal(isReviewCurrent(review, { artifact: artifactSet, metadataVersion: base.metadataVersion, rightsEvidence }), true);
  const changedSet = { ...artifact, relatedArtifacts: [artifact, { ...thumbnail, sha256: "e".repeat(64) }] };
  assert.equal(isReviewCurrent(review, { artifact: changedSet, metadataVersion: base.metadataVersion, rightsEvidence }), false);
});
