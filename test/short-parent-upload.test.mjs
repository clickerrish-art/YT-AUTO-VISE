import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { validateUploadApproval } from "../scripts/upload-private.mjs";
import { shortParentRelationshipSha256, shortParentEvidenceSha256 } from "../scripts/short-parent-relationship.mjs";

const sha = c => c.repeat(64);
const channelId = "UC" + "A".repeat(22);
const relationship = {
  childContentId: "child-job-001", childRevision: sha("1"), childMediaSha256: sha("a"), childMetadataSha256: sha("b"),
  parentContentId: "parent-job-001", parentRevision: sha("2"), parentMediaSha256: sha("c"), parentMetadataSha256: sha("d"), parentApprovalSha256: sha("e"),
  parentRemoteVideoId: "abcdefghijk", parentCanonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
  parentChannelTitle: "SonicVhibez", parentRemoteTitle: "Parent documentary", parentChannelId: channelId, parentRemoteVerified: true, parentPrivacyStatus: "private",
  parentApproved: true, parentRevisionApproved: true, parentPublicationCycleId: "cycle-a", childPublicationCycleId: "cycle-a",
  sourceSegments: [{ sceneId: "scene-02", startSeconds: 5, endSeconds: 15 }],
  relationshipApproved: true, relationshipReviewer: "operator-1", relationshipApprovedAt: "2026-10-26T10:00:00.000Z",
  relationshipEvidenceSha256: sha("f"),
  nativeRelatedVideo: { status: "BLOCKED_EXTERNAL", blocker: "Parent is private; native Related video is ineligible without owner-authorized visibility policy." }
};
relationship.relationshipEvidenceSha256 = shortParentEvidenceSha256(relationship);
const rightsEvidence = { assets: [{ assetPath: "media/scene.mp4", licenseEvidenceLocation: "rights/license.txt", assetSha256: sha("c"), licenseEvidenceSha256: sha("d"), permittedUses: ["YouTube"], verificationStatus: "VERIFIED", verifiedBy: "operator-1", verifiedAt: "2026-10-26T10:00:00.000Z" }] };
const baseApproval = {
  decision: "APPROVE", jobId: "child-job-001", contentType: "short",
  artifactSha256: sha("a"), metadataVersion: sha("b"), reviewer: "operator-1",
  rightsEvidence,
  rightsEvidenceSha256: crypto.createHash("sha256").update(JSON.stringify(rightsEvidence)).digest("hex"), publishingEnabled: false, visibility: "private",
  relatedArtifacts: [
    { path: "media/child.mp4", sha256: sha("a") },
    { path: "media/thumb.jpg", sha256: sha("8") },
    { path: "captions/child.srt", sha256: sha("7") },
    { path: "metadata/child.json", sha256: sha("b") }
  ],
  shortParentRelationship: relationship,
  shortParentRelationshipSha256: shortParentRelationshipSha256(relationship)
};

test("Short upload approval must bind the exact approved parent and child hashes", () => {
  assert.equal(validateUploadApproval(baseApproval, { jobId: "child-job-001", artifactSha256: sha("a"), metadataVersion: sha("b"), channelId }), true);
  assert.throws(() => validateUploadApproval({ ...baseApproval, shortParentRelationship: null }, { jobId: "child-job-001", artifactSha256: sha("a"), metadataVersion: sha("b"), channelId }), /parent relationship/);
  assert.throws(() => validateUploadApproval({ ...baseApproval, shortParentRelationshipSha256: sha("8") }, { jobId: "child-job-001", artifactSha256: sha("a"), metadataVersion: sha("b"), channelId }), /does not bind the exact Short-to-parent relationship/);
  assert.throws(() => validateUploadApproval(baseApproval, { jobId: "child-job-001", artifactSha256: sha("9"), metadataVersion: sha("b"), channelId }), /childMediaSha256/);
  assert.throws(() => validateUploadApproval(baseApproval, { jobId: "child-job-001", artifactSha256: sha("a"), metadataVersion: sha("b"), channelId: "UC" + "Z".repeat(22) }), /configured SonicVhibez channel/);
});

test("Short relationship cannot claim private parent native Related video eligibility", () => {
  const changedRelationship = { ...relationship, nativeRelatedVideo: { status: "VERIFIED", verifiedBy: "operator", verifiedAt: "2026-10-26T10:00:00Z", evidenceSha256: sha("1") } };
  changedRelationship.relationshipEvidenceSha256 = shortParentEvidenceSha256(changedRelationship);
  const bad = { ...baseApproval, shortParentRelationship: changedRelationship };
  bad.shortParentRelationshipSha256 = shortParentRelationshipSha256(bad.shortParentRelationship);
  assert.throws(() => validateUploadApproval(bad, { jobId: "child-job-001", artifactSha256: sha("a"), metadataVersion: sha("b"), channelId }), /private parent/);
});
