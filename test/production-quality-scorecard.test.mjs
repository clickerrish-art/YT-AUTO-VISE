import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { validateProductionQualityScorecard, PRODUCTION_QUALITY_DIMENSIONS, PRODUCTION_QUALITY_CRITICAL_GATES } from "../scripts/production-quality-scorecard.mjs";

const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const scores = Object.fromEntries(PRODUCTION_QUALITY_DIMENSIONS.map(key => [key, 90]));
const criticalGates = Object.fromEntries(PRODUCTION_QUALITY_CRITICAL_GATES.map(key => [key, true]));
const relatedArtifacts = [
  { path: "media/final-thumbnail.jpg", sha256: hash("thumbnail") },
  { path: "media/final-captions.srt", sha256: hash("captions") },
  { path: "media/final-narration.mp3", sha256: hash("narration") }
];
function validReview() {
  return {
    policyId: "SV-PQS-001", decision: "APPROVED", reviewer: "Human Reviewer",
    reviewedAt: "2026-11-18T10:00:00.000Z",
    fullVideoPlayback: true, fullPlaybackEvidenceRef: "review/full-playback-001",
    thumbnailInspectedAtMobile: true, thumbnailInspectedAtDesktop: true,
    imageInspectionEvidenceRef: "review/image-inspection-001",
    factualEditorialEvidenceRef: "review/factual-editorial-001",
    scores: { ...scores }, criticalGates: { ...criticalGates },
    artifactHashes: {
      video: hash("video"), metadata: hash("metadata"),
      thumbnail: relatedArtifacts[0].sha256, images: [relatedArtifacts[0].sha256], captions: relatedArtifacts[1].sha256,
      narration: relatedArtifacts[2].sha256
    }
  };
}
const options = review => ({
  artifactSha256: hash("video"), metadataSha256: hash("metadata"),
  relatedArtifacts, now: new Date("2026-11-18T11:00:00.000Z")
});

test("accepts a complete human scorecard bound to every exact release artifact", () => {
  assert.deepEqual(validateProductionQualityScorecard(validReview(), options()), []);
});

test("rejects missing scorecard and missing individual dimensions", () => {
  assert.match(validateProductionQualityScorecard(null).join(" "), /scorecard is required/);
  const review = validReview();
  delete review.scores.narrationVoicePerformance;
  assert.match(validateProductionQualityScorecard(review, options()).join(" "), /narrationVoicePerformance/);
});

test("rejects any dimension below 80 even when the mean remains high", () => {
  const review = validReview();
  review.scores.sharpnessImageClarity = 79;
  assert.match(validateProductionQualityScorecard(review, options()).join(" "), /below the mandatory 80/);
});

test("rejects an overall mean below 85", () => {
  const review = validReview();
  for (const key of PRODUCTION_QUALITY_DIMENSIONS) review.scores[key] = 84;
  assert.match(validateProductionQualityScorecard(review, options()).join(" "), /overall quality score/);
});

test("rejects any critical visual, factual, narration or rights gate failure", () => {
  const review = validReview();
  review.criticalGates.photorealism = false;
  assert.match(validateProductionQualityScorecard(review, options()).join(" "), /critical.*must explicitly pass/);
});

test("rejects missing full playback and image inspection evidence", () => {
  const review = validReview();
  review.fullVideoPlayback = false;
  review.thumbnailInspectedAtMobile = false;
  assert.match(validateProductionQualityScorecard(review, options()).join(" "), /full playback/);
  assert.match(validateProductionQualityScorecard(review, options()).join(" "), /mobile and desktop/);
});

test("rejects stale, future-dated, timezone-naive and hash-mismatched reviews", () => {
  const timezoneNaive = validReview();
  timezoneNaive.reviewedAt = "2026-11-18T10:00:00";
  assert.match(validateProductionQualityScorecard(timezoneNaive, options()).join(" "), /timestamp must be valid/);
  const review = validReview();
  review.reviewedAt = "2020-01-01T00:00:00.000Z";
  review.artifactHashes.video = hash("different-video");
  const errors = validateProductionQualityScorecard(review, options());
  assert.match(errors.join(" "), /no older than/);
  assert.match(errors.join(" "), /video hash does not match/);
});

test("rejects absent or incorrectly typed thumbnail, caption and narration bindings", () => {
  const review = validReview();
  review.artifactHashes.captions = hash("not-in-approved-set");
  assert.match(validateProductionQualityScorecard(review, options()).join(" "), /captions hash is not present/);
});

test("rejects any final image missing from the image-review hash set", () => {
  const review = validReview();
  const additionalImage = { path: "media/scene-still.png", sha256: hash("scene-still") };
  assert.match(validateProductionQualityScorecard(review, { ...options(), relatedArtifacts: [...relatedArtifacts, additionalImage] }).join(" "), /final image artifact is not bound/);
  review.artifactHashes.images.push(additionalImage.sha256);
  assert.deepEqual(validateProductionQualityScorecard(review, { ...options(), relatedArtifacts: [...relatedArtifacts, additionalImage] }), []);
});

test("private upload source invokes the mandatory scorecard gate before any remote insert", () => {
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  assert.match(source, /validateProductionQualityScorecard/);
  assert.ok(source.indexOf("validateProductionQualityScorecard") < source.indexOf("youtube.videos.insert("));
});
