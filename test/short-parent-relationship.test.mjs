import test from "node:test";
import assert from "node:assert/strict";
import { validateShortParentRelationship, assertShortParentRelationship, shortParentRelationshipSha256, shortParentEvidenceSha256, validateSourceSegmentsAgainstEvidence, validateConfiguredSonicVhibezChannel, validateParentReceiptTitle, parseShortMetadataJson } from "../scripts/short-parent-relationship.mjs";

const sha = c => c.repeat(64);
const base = {
  childContentId: "child-job-001", childRevision: "rev-2", childMediaSha256: sha("a"), childMetadataSha256: sha("b"),
  parentContentId: "parent-job-001", parentRevision: "rev-5", parentMediaSha256: sha("c"), parentMetadataSha256: sha("d"),
  parentApprovalSha256: sha("e"), parentSourceEvidencePath: "content/long-form-quality-evidence.json", parentSourceEvidenceSha256: sha("7"), parentRemoteVideoId: "abcdefghijk", parentCanonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
  parentChannelTitle: "SonicVhibez", parentRemoteTitle: "Why honey badgers survive venom", parentChannelId: "UC" + "A".repeat(22), parentRemoteVerified: true, parentPrivacyStatus: "private",
  parentApproved: true, parentRevisionApproved: true, parentPublicationCycleId: "cycle-2026-10-A", childPublicationCycleId: "cycle-2026-10-A",
  sourceSegments: [{ sceneId: "scene-03", startSeconds: 42, endSeconds: 58 }],
  relationshipApproved: true, relationshipReviewNotes: "Parent narrative and source scene segment reviewed.", relationshipReviewer: "operator-1", relationshipApprovedAt: "2026-10-26T10:00:00.000Z",
  relationshipEvidenceSha256: sha("f"),
  nativeRelatedVideo: { status: "BLOCKED_EXTERNAL", blocker: "Private parent is ineligible; owner authorization and eligible visibility arrangement are required." }
};
base.relationshipEvidenceSha256 = shortParentEvidenceSha256(base);

test("accepts an explicit, hash-bound Short parent with native feature honestly blocked for private parent", () => {
  assert.deepEqual(validateShortParentRelationship(base, { childContentId: base.childContentId, childMediaSha256: base.childMediaSha256, childMetadataSha256: base.childMetadataSha256, channelId: base.parentChannelId, allowPrivateParent: true }), []);
  assert.equal(assertShortParentRelationship(base, { channelId: base.parentChannelId, allowPrivateParent: true }), true);
  assert.match(shortParentRelationshipSha256(base), /^[a-f0-9]{64}$/);
});

test("private parent validation fails closed unless a caller explicitly records a blocked pending relationship", () => {
  assert.match(
    validateShortParentRelationship(base, { channelId: base.parentChannelId }).join(" "),
    /a private parent is ineligible for native YouTube Related video/
  );
  assert.deepEqual(
    validateShortParentRelationship(base, { channelId: base.parentChannelId, allowPrivateParent: true }),
    [],
    "explicitly allowed private-parent records still require nativeRelatedVideo=BLOCKED_EXTERNAL"
  );
});

test("requires timezone-qualified, calendar-valid timestamps for relationship and native-association approvals", () => {
  for (const timestamp of [
    "2026-10-26T10:00:00",
    "2026-02-30T10:00:00.000Z",
    "2026-10-26T10:00:00+15:00"
  ]) {
    const invalid = { ...base, relationshipApprovedAt: timestamp };
    invalid.relationshipEvidenceSha256 = shortParentEvidenceSha256(invalid);
    assert.match(
      validateShortParentRelationship(invalid, { channelId: base.parentChannelId, allowPrivateParent: true }).join(" "),
      /relationship approval timestamp must be a valid ISO timestamp with an explicit timezone/,
      timestamp
    );
  }

  const verified = {
    status: "VERIFIED",
    verifiedBy: "operator-1",
    verifiedAt: "2026-10-27T10:00:00.000Z",
    evidenceSha256: sha("9"),
    parentVideoId: base.parentRemoteVideoId,
    channelId: base.parentChannelId,
    destinationUrl: base.parentCanonicalUrl
  };
  for (const timestamp of ["2026-10-27T10:00:00", "2026-02-30T10:00:00.000Z"]) {
    const invalid = { ...base, parentPrivacyStatus: "public", nativeRelatedVideo: { ...verified, verifiedAt: timestamp } };
    invalid.relationshipEvidenceSha256 = shortParentEvidenceSha256(invalid);
    assert.match(
      validateShortParentRelationship(invalid, { channelId: base.parentChannelId }).join(" "),
      /native Related video verification requires reviewer, timestamp and evidence hash/,
      timestamp
    );
  }
});

test("rejects missing parent, guessed/noncanonical URL, channel mismatch and unverified remote parent", () => {
  assert.match(validateShortParentRelationship(null)[0], /required/);
  for (const patch of [
    { parentContentId: "" },
    { parentCanonicalUrl: "https://example.com/abcdefghijk" },
    { parentRemoteVideoId: "not-an-id" },
    { parentChannelId: "UC" + "B".repeat(22) },
    { parentRemoteVerified: false },
    { parentApproved: false },
    { parentRevisionApproved: false }
  ]) assert.ok(validateShortParentRelationship({ ...base, ...patch }, { channelId: base.parentChannelId }).length, JSON.stringify(patch));
});

test("requires child media and metadata identities to be actual SHA-256 digests even without caller-supplied expected hashes", () => {
  for (const patch of [
    { childMediaSha256: "not-a-digest" },
    { childMetadataSha256: "f".repeat(63) }
  ]) {
    const invalid = { ...base, ...patch };
    invalid.relationshipEvidenceSha256 = shortParentEvidenceSha256(invalid);
    assert.match(validateShortParentRelationship(invalid).join(" "), /child(Media|Metadata)Sha256 must be a SHA-256 digest/);
  }
});

test("rejects stale child hashes, cross-cycle parent, absent source segment and missing review evidence", () => {
  assert.match(validateShortParentRelationship(base, { childMediaSha256: sha("9") }).join(" "), /childMediaSha256/);
  for (const patch of [
    { childMetadataSha256: sha("9") },
    { childPublicationCycleId: "another-cycle" },
    { sourceSegments: [] },
    { relationshipApproved: false },
    { relationshipReviewer: "" },
    { relationshipEvidenceSha256: "bad" }
  ]) assert.ok(validateShortParentRelationship({ ...base, ...patch }).length, JSON.stringify(patch));
});

test("private parent cannot claim native Related video verification", () => {
  const invalid = { ...base, nativeRelatedVideo: { status: "VERIFIED", verifiedBy: "operator", verifiedAt: "2026-10-26T10:00:00Z", evidenceSha256: sha("a") } };
  invalid.relationshipEvidenceSha256 = shortParentEvidenceSha256(invalid);
  assert.match(validateShortParentRelationship(invalid).join(" "), /private parent/);
  const invalidStatus = { ...base, parentPrivacyStatus: "public", nativeRelatedVideo: { status: "UNKNOWN" } };
  invalidStatus.relationshipEvidenceSha256 = shortParentEvidenceSha256(invalidStatus);
  assert.match(validateShortParentRelationship(invalidStatus).join(" "), /native YouTube Related video status/);
});

test("native Related video proof must bind exact parent ID, channel and destination", () => {
  const verified = {
    status: "VERIFIED",
    verifiedBy: "operator-1",
    verifiedAt: "2026-10-27T10:00:00.000Z",
    evidenceSha256: sha("9"),
    parentVideoId: base.parentRemoteVideoId,
    channelId: base.parentChannelId,
    destinationUrl: base.parentCanonicalUrl
  };
  const eligibleBase = { ...base, parentPrivacyStatus: "public", nativeRelatedVideo: verified };
  eligibleBase.relationshipEvidenceSha256 = shortParentEvidenceSha256(eligibleBase);
  assert.deepEqual(validateShortParentRelationship(eligibleBase, { channelId: base.parentChannelId }), []);

  for (const [patch, expected] of [
    [{ parentVideoId: "zzzzzzzzzzz" }, /exact approved parent video ID/],
    [{ channelId: "UC" + "B".repeat(22) }, /verified SonicVhibez parent channel/],
    [{ destinationUrl: "https://example.com/other-parent" }, /canonical parent destination URL/]
  ]) {
    const invalid = { ...eligibleBase, nativeRelatedVideo: { ...verified, ...patch } };
    invalid.relationshipEvidenceSha256 = shortParentEvidenceSha256(invalid);
    assert.match(validateShortParentRelationship(invalid, { channelId: base.parentChannelId }).join(" "), expected);
  }
});

test("source segments must map to the exact reviewed parent timeline and stay within scene bounds", () => {
  const evidence = { format: "long_form", scenes: [
    { sceneId: "scene-03", assetId: "asset-03", startSeconds: 40, endSeconds: 60 },
    { sceneId: "scene-04", assetId: "asset-04", startSeconds: 60, endSeconds: 85 }
  ] };
  assert.deepEqual(validateSourceSegmentsAgainstEvidence([{ sceneId: "scene-03", startSeconds: 42, endSeconds: 58 }], evidence), []);
  assert.match(validateSourceSegmentsAgainstEvidence([{ sceneId: "invented-scene", startSeconds: 42, endSeconds: 58 }], evidence).join(" "), /exactly one recorded parent scene/);
  assert.match(validateSourceSegmentsAgainstEvidence([{ sceneId: "asset-03", startSeconds: 42, endSeconds: 58 }], evidence).join(" "), /exactly one recorded parent scene/, "asset IDs must not substitute for explicit scene IDs");
  assert.match(validateSourceSegmentsAgainstEvidence([{ sceneId: "scene-03", startSeconds: 38, endSeconds: 58 }], evidence).join(" "), /exactly one recorded parent scene/);
  assert.match(validateSourceSegmentsAgainstEvidence([{ sceneId: "scene-03", startSeconds: 42, endSeconds: 58 }], { format: "short", scenes: evidence.scenes }).join(" "), /must be a long_form/);
});


test("configured SonicVhibez channel identity must independently match the parent receipt", () => {
  const channelId = "UC" + "A".repeat(22);
  const receipt = { channelTitle: "SonicVhibez", channelId };
  assert.deepEqual(validateConfiguredSonicVhibezChannel(receipt, channelId), []);
  assert.match(validateConfiguredSonicVhibezChannel(receipt, undefined).join(" "), /owner-configured SONICVHIBEZ_CHANNEL_ID/);
  assert.match(validateConfiguredSonicVhibezChannel(receipt, "UC" + "B".repeat(22)).join(" "), /does not match configured SONICVHIBEZ_CHANNEL_ID/);
  assert.match(validateConfiguredSonicVhibezChannel({ ...receipt, channelTitle: "Nature Frontiers" }, channelId).join(" "), /must be SonicVhibez/);
  assert.match(validateConfiguredSonicVhibezChannel({ ...receipt, channelId: "UCbad" }, channelId).join(" "), /valid channel ID/);
  assert.match(validateConfiguredSonicVhibezChannel(null, channelId).join(" "), /receipt is required/);
});


test("parent receipt title must exactly match the approved metadata revision", () => {
  const approvedMetadata = { title: "Why honey badgers survive venom" };
  const receipt = { title: approvedMetadata.title };
  assert.deepEqual(validateParentReceiptTitle(receipt, approvedMetadata), []);
  assert.match(validateParentReceiptTitle({ title: "Different remote title" }, approvedMetadata).join(" "), /does not match the approved parent metadata title/);
  assert.match(validateParentReceiptTitle({ title: "" }, approvedMetadata).join(" "), /must contain the remote title/);
  assert.match(validateParentReceiptTitle({}, { title: "" }).join(" "), /must contain an exact title/);
  assert.match(validateParentReceiptTitle(null, approvedMetadata).join(" "), /receipt is required/);
});


test("Short metadata parsing fails closed for malformed and non-object JSON", () => {
  assert.deepEqual(parseShortMetadataJson('{"title":"A verified title","parentContentId":"parent-1"}'), {
    title: "A verified title",
    parentContentId: "parent-1"
  });
  assert.throws(() => parseShortMetadataJson("{invalid"), /Short metadata is invalid JSON/);
  for (const raw of ["null", "[]", '"a string"', "42", "true"]) {
    assert.throws(() => parseShortMetadataJson(raw), /Short metadata must be a JSON object/, raw);
  }
});


test("parent source lineage rejects overlapping ranges from the same scene but permits adjacent ranges", () => {
  const evidence = { format: "long_form", scenes: [
    { sceneId: "scene-03", assetId: "asset-03", startSeconds: 40, endSeconds: 60 },
    { sceneId: "scene-04", assetId: "asset-04", startSeconds: 60, endSeconds: 85 }
  ] };
  assert.deepEqual(validateSourceSegmentsAgainstEvidence([
    { sceneId: "scene-03", startSeconds: 42, endSeconds: 50 },
    { sceneId: "scene-03", startSeconds: 50, endSeconds: 58 }
  ], evidence), []);
  assert.match(validateSourceSegmentsAgainstEvidence([
    { sceneId: "scene-03", startSeconds: 42, endSeconds: 52 },
    { sceneId: "scene-03", startSeconds: 50, endSeconds: 58 }
  ], evidence).join(" "), /overlapping source segments from the same parent scene/);
});
