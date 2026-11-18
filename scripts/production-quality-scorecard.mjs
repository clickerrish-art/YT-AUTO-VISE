import crypto from "node:crypto";

const SHA256 = /^[a-f0-9]{64}$/;
const DIMENSIONS = [
  "photorealismVisualCredibility",
  "sharpnessImageClarity",
  "compositionVisualSimplicity",
  "motionContinuityTechnicalExecution",
  "storyOriginalityFactualIntegrity",
  "hookPacingRetentionEngineering",
  "narrationVoicePerformance",
  "audioCaptionsAccessibility"
];
const CRITICAL_GATES = [
  "photorealism",
  "sharpness",
  "composition",
  "editorialSpecificity",
  "continuity",
  "thumbnailIntegrity",
  "technicalExport",
  "factualAccuracy",
  "narrationIntelligibility",
  "rightsAndDisclosure"
];

const nonempty = value => typeof value === "string" && value.trim().length > 0;

/**
 * Validate a human quality review bound to the exact release package.
 * This validates the record's structure and bindings; it cannot prove that a
 * human actually watched the video or that the evidence is truthful.
 */
export function validateProductionQualityScorecard(review, {
  artifactSha256,
  metadataSha256,
  relatedArtifacts,
  now = new Date(),
  maxAgeMs = 30 * 24 * 60 * 60 * 1000
} = {}) {
  const errors = [];
  if (!review || typeof review !== "object" || Array.isArray(review)) {
    return ["production quality scorecard is required"];
  }
  if (review.policyId !== "SV-PQS-001" || review.decision !== "APPROVED") {
    errors.push("quality scorecard must approve policy SV-PQS-001");
  }
  if (!nonempty(review.reviewer) || review.reviewer.trim().length < 2) errors.push("quality scorecard reviewer identity is required");
  const reviewedAt = Date.parse(review.reviewedAt);
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(reviewedAt) || !Number.isFinite(nowMs) || reviewedAt > nowMs + 5 * 60_000 || nowMs - reviewedAt > maxAgeMs) {
    errors.push("quality scorecard timestamp must be valid, not future-dated and no older than the permitted review window");
  }
  if (review.fullVideoPlayback !== true || !nonempty(review.fullPlaybackEvidenceRef)) {
    errors.push("full playback of the exact final export and its evidence reference are mandatory");
  }
  if (review.thumbnailInspectedAtMobile !== true || review.thumbnailInspectedAtDesktop !== true ||
      !nonempty(review.imageInspectionEvidenceRef)) {
    errors.push("thumbnail and final images must be inspected at mobile and desktop sizes with evidence");
  }
  if (!nonempty(review.factualEditorialEvidenceRef)) errors.push("factual and editorial review evidence reference is required");
  if (!review.scores || typeof review.scores !== "object" || Array.isArray(review.scores)) {
    errors.push("all eight numeric quality scores are required");
  } else {
    let total = 0;
    for (const key of DIMENSIONS) {
      const score = review.scores[key];
      if (!Number.isInteger(score) || score < 0 || score > 100) {
        errors.push("quality score " + key + " must be an integer from 0 to 100");
      } else {
        total += score;
        if (score < 80) errors.push("quality score " + key + " is below the mandatory 80/100 dimension floor");
      }
    }
    if (DIMENSIONS.every(key => Number.isInteger(review.scores[key]) && review.scores[key] >= 0 && review.scores[key] <= 100)) {
      const average = total / DIMENSIONS.length;
      if (average < 85) errors.push("overall quality score must be at least 85/100; measured " + average.toFixed(2));
    }
  }
  if (!review.criticalGates || typeof review.criticalGates !== "object" ||
      CRITICAL_GATES.some(key => review.criticalGates[key] !== true)) {
    errors.push("every critical visual, technical, factual, narration and rights gate must explicitly pass");
  }
  if (!review.artifactHashes || typeof review.artifactHashes !== "object") {
    errors.push("exact reviewed artifact SHA-256 bindings are required");
  } else {
    if (!SHA256.test(artifactSha256 ?? "") || review.artifactHashes.video !== artifactSha256) {
      errors.push("quality scorecard video hash does not match the exact upload artifact");
    }
    if (!SHA256.test(metadataSha256 ?? "") || review.artifactHashes.metadata !== metadataSha256) {
      errors.push("quality scorecard metadata hash does not match the exact metadata artifact");
    }
    for (const key of ["thumbnail", "captions", "narration"]) {
      if (!SHA256.test(review.artifactHashes[key] ?? "")) errors.push("quality scorecard must bind a valid " + key + " SHA-256");
    }
  }
  if (!Array.isArray(relatedArtifacts)) {
    errors.push("approved related artifact set is required to verify quality-review bindings");
  } else {
    const byHash = new Map(relatedArtifacts.filter(item => item && typeof item.sha256 === "string").map(item => [item.sha256, item]));
    for (const key of ["thumbnail", "captions", "narration"]) {
      const hash = review.artifactHashes?.[key];
      const artifact = byHash.get(hash);
      if (!artifact) errors.push("quality scorecard " + key + " hash is not present in the approved related artifact set");
      else if (key === "thumbnail" && !/\.(jpg|jpeg|png|webp)$/i.test(artifact.path ?? "")) errors.push("quality scorecard thumbnail binding must reference an image artifact");
      else if (key === "captions" && !/\.srt$/i.test(artifact.path ?? "")) errors.push("quality scorecard captions binding must reference an SRT artifact");
      else if (key === "narration" && !/\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(artifact.path ?? "")) errors.push("quality scorecard narration binding must reference an audio artifact");
    }
  }
  return [...new Set(errors)];
}

export function qualityScorecardSha256(review) {
  return crypto.createHash("sha256").update(JSON.stringify(review)).digest("hex");
}

export const PRODUCTION_QUALITY_DIMENSIONS = Object.freeze([...DIMENSIONS]);
export const PRODUCTION_QUALITY_CRITICAL_GATES = Object.freeze([...CRITICAL_GATES]);
