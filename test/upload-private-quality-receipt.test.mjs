import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  PRODUCTION_QUALITY_DIMENSIONS,
  PRODUCTION_QUALITY_CRITICAL_GATES,
  qualityScorecardSha256
} from "../scripts/production-quality-scorecard.mjs";
import { validateUploadApproval } from "../scripts/upload-private.mjs";
import { shortParentEvidenceSha256, shortParentRelationshipSha256 } from "../scripts/short-parent-relationship.mjs";

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

function validate(approval, video, metadata, contentType = "long_form") {
  return validateUploadApproval(approval, {
    jobId: approval.jobId,
    artifactSha256: video.sha256,
    metadataVersion: metadata.sha256,
    contentType
  });
}

test("accepts only a complete technical receipt bound to the exact long-form release package", () => {
  const f = fixture();
  assert.equal(validate(f.approval, f.video, f.metadata), true);
});

test("requires explicit upload metadata format and exact matching human approval", () => {
  const f = fixture();
  assert.throws(() => validateUploadApproval(f.approval, {
    jobId: f.approval.jobId,
    artifactSha256: f.video.sha256,
    metadataVersion: f.metadata.sha256
  }), /metadata must explicitly declare contentType/);
  const mismatched = structuredClone(f.approval);
  mismatched.contentType = "short";
  assert.throws(() => validateUploadApproval(mismatched, {
    jobId: mismatched.jobId,
    artifactSha256: f.video.sha256,
    metadataVersion: f.metadata.sha256,
    contentType: "long_form"
  }), /must exactly match/);
});

test("rejects impossible calendar dates and invalid offsets in technical validation receipts", () => {
  const f = fixture();
  f.approval.technicalValidationReceipt.checkedAt = "2026-02-31T12:00:00Z";
  f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
  assert.throws(() => validate(f.approval, f.video, f.metadata), /valid non-future timezone-aware checkedAt/);

  const offset = fixture();
  offset.approval.technicalValidationReceipt.checkedAt = "2026-11-21T12:00:00+15:00";
  offset.approval.technicalValidationSha256 = hash(JSON.stringify(offset.approval.technicalValidationReceipt));
  assert.throws(() => validate(offset.approval, offset.video, offset.metadata), /valid non-future timezone-aware checkedAt/);
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

  f.approval.technicalValidationReceipt.captionsSha256 = f.approval.relatedArtifacts.find(item => item.path.endsWith(".srt")).sha256;
  f.approval.technicalValidationReceipt.thumbnail.sha256 = hash("other-thumbnail");
  f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
  assert.throws(() => validate(f.approval, f.video, f.metadata), /exact 1280x720 approved thumbnail/);

  f.approval.technicalValidationReceipt.thumbnail.sha256 = f.approval.relatedArtifacts.find(item => item.path.endsWith(".jpg")).sha256;
  f.approval.technicalValidationReceipt.checks = ["mp4-sha256"];
  f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
  assert.throws(() => validate(f.approval, f.video, f.metadata), /missing required export/);
});

test("accepts a correctly bound vertical Short receipt", () => {
  const f = fixture();
  f.approval.contentType = "short";
  Object.assign(f.approval.technicalValidationReceipt.artifacts[0], {
    durationSeconds: 55, width: 1080, height: 1920
  });
  const channelId = "UC1234567890123456789012";
  const relationship = {
    childContentId: f.approval.jobId,
    childMediaSha256: f.video.sha256,
    childMetadataSha256: f.metadata.sha256,
    childRevision: "short-revision-1",
    childPublicationCycleId: "cycle-001",
    parentContentId: "parent-long-form-001",
    parentRevision: "parent-revision-1",
    parentMediaSha256: hash("parent-video"),
    parentMetadataSha256: hash("parent-metadata"),
    parentApprovalSha256: hash("parent-approval"),
    parentSourceEvidencePath: "content/parent-source-quality.json",
    parentSourceEvidenceSha256: hash("parent-source-quality"),
    parentRemoteVideoId: "abcdefghijk",
    parentCanonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
    parentRemoteTitle: "Approved parent long-form video",
    parentChannelTitle: "SonicVhibez",
    parentChannelId: channelId,
    parentRemoteVerified: true,
    parentPrivacyStatus: "private",
    parentApproved: true,
    parentRevisionApproved: true,
    parentPublicationCycleId: "cycle-001",
    sourceSegments: [{ sceneId: "scene-001", startSeconds: 10, endSeconds: 20 }],
    relationshipApproved: true,
    relationshipReviewNotes: "The selected segment is relevant and accurately represents the parent.",
    relationshipReviewer: "Human Reviewer",
    relationshipApprovedAt: now,
    relationshipEvidenceSha256: "",
    nativeRelatedVideo: {
      status: "BLOCKED_EXTERNAL",
      blocker: "The parent is private, so native related-video association is not eligible."
    }
  };
  relationship.relationshipEvidenceSha256 = shortParentEvidenceSha256(relationship);
  f.approval.shortParentRelationship = relationship;
  f.approval.shortParentRelationshipSha256 = shortParentRelationshipSha256(relationship);
  f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
  assert.equal(validateUploadApproval(f.approval, {
    jobId: f.approval.jobId,
    artifactSha256: f.video.sha256,
    metadataVersion: f.metadata.sha256,
    channelId,
    contentType: "short"
  }), true);
});

test("rejects a receipt with the wrong format dimensions or duration", () => {
  const f = fixture();
  f.approval.technicalValidationReceipt.artifacts[0].width = 1080;
  f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
  assert.throws(() => validate(f.approval, f.video, f.metadata), /1920x1080, 6–10 minute long-form export/);
});
