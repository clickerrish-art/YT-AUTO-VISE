import test from "node:test";
import assert from "node:assert/strict";
import { createReviewDecision, isReviewCurrent, validateReviewEvidence, validateTechnicalReviewBinding } from "../scripts/human-review.mjs";

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
const base = { artifact, rightsEvidence, metadataVersion: "metadata-sha256:cccc", technicalValidationSha256: "c".repeat(64), reviewer: "reviewer@example.test", decision: "APPROVE", reason: "" };

test("approval is bound to artifact checksum, metadata version and rights evidence", () => {
  const review = createReviewDecision(base, "2026-10-23T10:01:00.000Z");
  assert.equal(isReviewCurrent(review, { artifact, metadataVersion: base.metadataVersion, rightsEvidence }), true);
  assert.equal(isReviewCurrent(review, { artifact: { ...artifact, sha256: "d".repeat(64) }, metadataVersion: base.metadataVersion, rightsEvidence }), false);
  assert.equal(isReviewCurrent(review, { artifact, metadataVersion: "metadata-sha256:changed", rightsEvidence }), false);
  assert.equal(isReviewCurrent(review, { artifact, metadataVersion: base.metadataVersion, rightsEvidence: { ...rightsEvidence, licenseEvidenceLocation: "evidence/changed.txt" } }), false);
});

test("approval requires and records the exact technical-validation receipt digest", () => {
  assert.throws(
    () => createReviewDecision({ ...base, technicalValidationSha256: undefined }),
    /exact technical-validation receipt SHA-256 is required/
  );
  const review = createReviewDecision(base, "2026-10-23T10:00:30.000Z");
  assert.equal(review.technicalValidationSha256, base.technicalValidationSha256);
});

test("approval fails closed when rights evidence is missing or incomplete", () => {
  assert.throws(() => createReviewDecision({ ...base, rightsEvidence: null }), /rights evidence is required/);
  assert.throws(() => createReviewDecision({ ...base, rightsEvidence: { ...rightsEvidence, verificationStatus: "UNVERIFIED" } }), /must be marked VERIFIED/);
  assert.throws(() => createReviewDecision({ ...base, rightsEvidence: { ...rightsEvidence, permittedUses: ["personal-use"] } }), /explicitly permit YouTube/);
  assert.throws(() => createReviewDecision({ ...base, artifact: { ...artifact, sha256: "invalid" } }), /SHA-256 checksum/);
});

test("rights verification timestamps must be timezone-qualified and calendar-valid", () => {
  for (const verifiedAt of [
    "2026-10-23T10:00:00",
    "2026-02-30T10:00:00.000Z",
    "2026-10-23T10:00:00+14:30",
    "not-a-timestamp"
  ]) {
    assert.throws(
      () => createReviewDecision({ ...base, rightsEvidence: { ...rightsEvidence, verifiedAt } }),
      /calendar-valid ISO timestamp with an explicit timezone/
    );
  }
  assert.doesNotThrow(() => createReviewDecision({
    ...base,
    rightsEvidence: { ...rightsEvidence, verifiedAt: "2026-10-23T10:00:00.000+02:00" }
  }));
});

test("review receipt timestamp must be valid when created and when reused", () => {
  for (const reviewedAt of [
    "2026-10-23T10:00:00",
    "2026-02-30T10:00:00.000Z",
    "2026-10-23T10:00:00+14:30",
    "invalid"
  ]) {
    assert.throws(
      () => createReviewDecision(base, reviewedAt),
      /review timestamp must be a calendar-valid ISO timestamp with an explicit timezone/
    );
  }
  const review = createReviewDecision(base, "2026-10-23T10:01:00.000Z");
  assert.equal(isReviewCurrent(review, { artifact, metadataVersion: base.metadataVersion, rightsEvidence }), true);
  for (const reviewedAt of ["2026-10-23T10:01:00", "2026-02-30T10:01:00.000Z", "invalid"]) {
    assert.equal(isReviewCurrent({ ...review, reviewedAt }, { artifact, metadataVersion: base.metadataVersion, rightsEvidence }), false);
  }
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


test("final approval receipt preserves the complete inspected artifact package", () => {
  const reviewed = {
    ...artifact,
    relatedArtifacts: [
      artifact,
      { path: "media/thumbnail.jpg", sha256: "d".repeat(64) },
      { path: "captions/final.srt", sha256: "e".repeat(64) },
      { path: "content/metadata.json", sha256: "f".repeat(64) },
      { path: "content/render-manifest.json", sha256: "1".repeat(64) },
      { path: "media/narration.mp3", sha256: "2".repeat(64) }
    ]
  };
  const review = createReviewDecision({ ...base, artifact: reviewed }, "2026-10-23T10:03:00.000Z");
  assert.deepEqual(review.relatedArtifacts, reviewed.relatedArtifacts);
  assert.equal(isReviewCurrent(review, {
    artifact: reviewed,
    metadataVersion: base.metadataVersion,
    rightsEvidence
  }), true);
  const changedCaptions = {
    ...reviewed,
    relatedArtifacts: reviewed.relatedArtifacts.map(item =>
      item.path === "captions/final.srt" ? { ...item, sha256: "3".repeat(64) } : item
    )
  };
  assert.equal(isReviewCurrent(review, {
    artifact: changedCaptions,
    metadataVersion: base.metadataVersion,
    rightsEvidence
  }), false);
});

test("final review must use the exact artifact, metadata and thumbnail covered by technical validation", () => {
  const job = {
    metadataPath: "metadata/job.json",
    metadataVersion: "c".repeat(64),
    outputArtifacts: [{ path: artifact.path, sha256: artifact.sha256 }],
    thumbnailArtifact: { path: "media/fixture-thumbnail.jpg", sha256: "d".repeat(64) },
    validationResults: {
      passed: true,
      metadataVersion: "c".repeat(64),
      artifacts: [{ path: artifact.path, sha256: artifact.sha256 }],
      thumbnail: { path: "media/fixture-thumbnail.jpg", sha256: "d".repeat(64) },
      captionsPath: "captions/fixture.srt",
      captionsSha256: "e".repeat(64)
    }
  };
  const input = { job, artifactPath: artifact.path, artifactSha256: artifact.sha256, metadataPath: job.metadataPath, metadataVersion: job.metadataVersion };
  assert.deepEqual(validateTechnicalReviewBinding(input), []);
  assert.match(validateTechnicalReviewBinding({ ...input, artifactSha256: "f".repeat(64) }).join("; "), /exact file that passed technical validation/);
  assert.match(validateTechnicalReviewBinding({ ...input, metadataPath: "metadata/other.json" }).join("; "), /metadata path must match/);
  assert.match(validateTechnicalReviewBinding({ ...input, metadataVersion: "a".repeat(64) }).join("; "), /metadata checksum/);
  assert.match(validateTechnicalReviewBinding({ ...input, job: { ...job, validationResults: { ...job.validationResults, thumbnail: { path: job.thumbnailArtifact.path, sha256: "f".repeat(64) } } } }).join("; "), /exact recorded thumbnail/);
});
