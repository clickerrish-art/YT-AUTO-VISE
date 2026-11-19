import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  PRODUCTION_QUALITY_DIMENSIONS,
  PRODUCTION_QUALITY_CRITICAL_GATES,
  qualityScorecardSha256
} from "../scripts/production-quality-scorecard.mjs";
import { validateUploadApproval } from "../scripts/upload-private.mjs";

const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const now = new Date().toISOString();

function fixture() {
  const video = { path: "media/final.mp4", sha256: hash("video"), durationSeconds: 420, width: 1920, height: 1080 };
  const metadata = { path: "content/metadata.json", sha256: hash("metadata") };
  const thumbnail = { path: "media/thumbnail.jpg", sha256: hash("thumbnail") };
  const captions = { path: "content/captions.srt", sha256: hash("captions") };
  const narration = { path: "audio/narration.mp3", sha256: hash("narration") };
  const relatedArtifacts = [video, metadata, thumbnail, captions, narration].map(item => ({ ...item }));
  const qualityScorecard = {
    policyId: "SV-PQS-001",
    decision: "APPROVED",
    reviewer: "Human Reviewer",
    reviewedAt: now,
    fullVideoPlayback: true,
    fullPlaybackEvidenceRef: "review/full-playback",
    thumbnailInspectedAtMobile: true,
    thumbnailInspectedAtDesktop: true,
    imageInspectionEvidenceRef: "review/image-inspection",
    factualEditorialEvidenceRef: "review/factual-editorial",
    scores: Object.fromEntries(PRODUCTION_QUALITY_DIMENSIONS.map(key => [key, 90])),
    criticalGates: Object.fromEntries(PRODUCTION_QUALITY_CRITICAL_GATES.map(key => [key, true])),
    artifactHashes: {
      video: video.sha256,
      metadata: metadata.sha256,
      thumbnail: thumbnail.sha256,
      images: [thumbnail.sha256],
      captions: captions.sha256,
      narration: narration.sha256
    }
  };
  const technicalValidationReceipt = {
    passed: true,
    checkedAt: now,
    metadataVersion: metadata.sha256,
    captionsPath: captions.path,
    captionsSha256: captions.sha256,
    artifacts: [{ ...video }],
    thumbnail: { ...thumbnail, width: 1280, height: 720 },
    checks: [
      "metadata-sha256", "caption-structure", "mp4-sha256", "ffprobe-duration",
      "orientation", "audio-stream", "thumbnail-sha256", "thumbnail-dimensions"
    ]
  };
  const rightsEvidence = {
    assets: [{
      assetPath: "media/source-footage.mp4",
      licenseEvidenceLocation: "rights/source-license.txt",
      assetSha256: hash("source-footage"),
      licenseEvidenceSha256: hash("source-license"),
      permittedUses: ["YouTube"],
      verificationStatus: "VERIFIED",
      verifiedBy: "Human Reviewer",
      verifiedAt: now
    }]
  };
  const approval = {
    decision: "APPROVE",
    jobId: "long-form-001",
    contentType: "long_form",
    reviewer: "Human Reviewer",
    artifactSha256: video.sha256,
    metadataVersion: metadata.sha256,
    qualityScorecard,
    qualityScorecardSha256: qualityScorecardSha256(qualityScorecard),
    technicalValidationReceipt,
    technicalValidationSha256: hash(JSON.stringify(technicalValidationReceipt)),
    rightsEvidence,
    rightsEvidenceSha256: hash(JSON.stringify(rightsEvidence)),
    relatedArtifacts,
    publishingEnabled: false,
    visibility: "private"
  };
  return { approval, video, metadata };
}

function validate(approval, video, metadata) {
  return validateUploadApproval(approval, {
    jobId: approval.jobId,
    artifactSha256: video.sha256,
    metadataVersion: metadata.sha256,
    contentType: "long_form"
  });
}

test("accepts only a complete technical receipt bound to the exact long-form release package", () => {
  const f = fixture();
  assert.equal(validate(f.approval, f.video, f.metadata), true);
});

test("rejects a checksummed receipt for a different video or metadata revision", () => {
  const f = fixture();
  f.approval.technicalValidationReceipt.artifacts[0].sha256 = hash("other-video");
  f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
  assert.throws(() => validate(f.approval, f.video, f.metadata), /exact upload video path and SHA-256/);

  f.approval.technicalValidationReceipt.artifacts[0].sha256 = f.video.sha256;
  f.approval.technicalValidationReceipt.metadataVersion = hash("other-metadata");
  f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
  assert.throws(() => validate(f.approval, f.video, f.metadata), /metadata hash does not match/);
});

test("rejects missing or mismatched captions, thumbnail and required export checks", () => {
  const f = fixture();
  f.approval.technicalValidationReceipt.captionsSha256 = hash("other-captions");
  f.approval.technicalValidationReceipt.thumbnail.sha256 = hash("other-thumbnail");
  f.approval.technicalValidationReceipt.checks = ["mp4-sha256"];
  f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
  assert.throws(() => validate(f.approval, f.video, f.metadata), /exact approved captions/);
});

test("rejects a receipt with the wrong format dimensions or duration", () => {
  const f = fixture();
  f.approval.technicalValidationReceipt.artifacts[0].width = 1080;
  f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
  assert.throws(() => validate(f.approval, f.video, f.metadata), /1920x1080, 6–10 minute long-form export/);
});
