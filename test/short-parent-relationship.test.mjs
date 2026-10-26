import test from "node:test";
import assert from "node:assert/strict";
import { validateShortParentRelationship, assertShortParentRelationship, shortParentRelationshipSha256, shortParentEvidenceSha256 } from "../scripts/short-parent-relationship.mjs";

const sha = c => c.repeat(64);
const base = {
  childContentId: "child-job-001", childRevision: "rev-2", childMediaSha256: sha("a"), childMetadataSha256: sha("b"),
  parentContentId: "parent-job-001", parentRevision: "rev-5", parentMediaSha256: sha("c"), parentMetadataSha256: sha("d"),
  parentApprovalSha256: sha("e"), parentRemoteVideoId: "abcdefghijk", parentCanonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
  parentChannelTitle: "SonicVhibez", parentRemoteTitle: "Why honey badgers survive venom", parentChannelId: "UC" + "A".repeat(22), parentRemoteVerified: true, parentPrivacyStatus: "private",
  parentApproved: true, parentRevisionApproved: true, parentPublicationCycleId: "cycle-2026-10-A", childPublicationCycleId: "cycle-2026-10-A",
  sourceSegments: [{ sceneId: "scene-03", startSeconds: 42, endSeconds: 58 }],
  relationshipApproved: true, relationshipReviewer: "operator-1", relationshipApprovedAt: "2026-10-26T10:00:00.000Z",
  relationshipEvidenceSha256: sha("f"),
  nativeRelatedVideo: { status: "BLOCKED_EXTERNAL", blocker: "Private parent is ineligible; owner authorization and eligible visibility arrangement are required." }
};
base.relationshipEvidenceSha256 = shortParentEvidenceSha256(base);

test("accepts an explicit, hash-bound Short parent with native feature honestly blocked for private parent", () => {
  assert.deepEqual(validateShortParentRelationship(base, { childContentId: base.childContentId, childMediaSha256: base.childMediaSha256, childMetadataSha256: base.childMetadataSha256, channelId: base.parentChannelId }), []);
  assert.equal(assertShortParentRelationship(base, { channelId: base.parentChannelId }), true);
  assert.match(shortParentRelationshipSha256(base), /^[a-f0-9]{64}$/);
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
  assert.match(validateShortParentRelationship(invalid).join(" "), /private parent/);
  assert.match(validateShortParentRelationship({ ...base, parentPrivacyStatus: "public", nativeRelatedVideo: { status: "BLOCKED_EXTERNAL", blocker: "unknown" } }).join(" "), /native Related video/);
});
