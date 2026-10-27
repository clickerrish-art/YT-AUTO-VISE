import crypto from "node:crypto";

const SHA256 = /^[a-f0-9]{64}$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

/** Parse persisted Short metadata without allowing malformed or non-object JSON to bind. */
export function parseShortMetadataJson(raw) {
  let metadata;
  try {
    metadata = JSON.parse(raw);
  } catch {
    throw new Error("Short metadata is invalid JSON");
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("Short metadata must be a JSON object");
  }
  return metadata;
}

/** Validate the receipt against the explicitly configured SonicVhibez identity. */
export function validateConfiguredSonicVhibezChannel(receipt, configuredChannelId) {
  const errors = [];
  if (!CHANNEL_ID.test(typeof configuredChannelId === "string" ? configuredChannelId.trim() : "")) errors.push("a valid owner-configured SONICVHIBEZ_CHANNEL_ID is required");
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) errors.push("verified parent upload receipt is required");
  else {
    if (receipt.channelTitle !== "SonicVhibez") errors.push("parent receipt channel title must be SonicVhibez");
    if (!CHANNEL_ID.test(receipt.channelId ?? "")) errors.push("parent receipt must contain a valid channel ID");
    else if (typeof configuredChannelId === "string" && configuredChannelId.trim() && receipt.channelId !== configuredChannelId.trim()) errors.push("parent receipt channel ID does not match configured SONICVHIBEZ_CHANNEL_ID");
  }
  return errors;
}

/** Require the remote parent's title to match the exact approved metadata revision. */
export function validateParentReceiptTitle(receipt, approvedMetadata) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return ["verified parent upload receipt is required"];
  if (!approvedMetadata || typeof approvedMetadata !== "object" || Array.isArray(approvedMetadata)) return ["approved parent metadata JSON is required"];
  if (typeof approvedMetadata.title !== "string" || !approvedMetadata.title.trim()) return ["approved parent metadata must contain an exact title"];
  if (typeof receipt.title !== "string" || !receipt.title.trim()) return ["verified parent receipt must contain the remote title"];
  return receipt.title === approvedMetadata.title ? [] : ["remote parent title does not match the approved parent metadata title"];
}

/**
 * Validate a Short's explicit parent binding. This checks integrity and recorded
 * evidence shape; it does not independently prove YouTube state or rights.
 */
export function validateShortParentRelationship(relationship, {
  childContentId,
  childMediaSha256,
  childMetadataSha256,
  channelId,
  allowPrivateParent = true
} = {}) {
  const errors = [];
  if (!relationship || typeof relationship !== "object" || Array.isArray(relationship)) {
    return ["an explicit Short-to-parent relationship record is required"];
  }
  for (const [key, expected] of [["childContentId", childContentId], ["childMediaSha256", childMediaSha256], ["childMetadataSha256", childMetadataSha256]]) {
    if (typeof relationship[key] !== "string" || !relationship[key].trim()) errors.push("relationship " + key + " is required");
    else if (expected !== undefined && relationship[key] !== expected) errors.push("relationship " + key + " does not match the current child artifact");
  }
  if (typeof relationship.childRevision !== "string" || !relationship.childRevision.trim()) errors.push("child revision is required");
  if (typeof relationship.parentContentId !== "string" || !relationship.parentContentId.trim() || relationship.parentContentId === relationship.childContentId) errors.push("a distinct exact parent content ID is required");
  if (typeof relationship.parentRevision !== "string" || !relationship.parentRevision.trim()) errors.push("parent approved revision is required");
  if (!SHA256.test(relationship.parentMediaSha256 ?? "")) errors.push("parent media SHA-256 is required");
  if (!SHA256.test(relationship.parentMetadataSha256 ?? "")) errors.push("parent approved metadata SHA-256 is required");
  if (!SHA256.test(relationship.parentApprovalSha256 ?? "")) errors.push("parent approval SHA-256 is required");
  if (typeof relationship.parentSourceEvidencePath !== "string" || !relationship.parentSourceEvidencePath.trim()) errors.push("exact parent source-quality evidence path is required");
  if (!SHA256.test(relationship.parentSourceEvidenceSha256 ?? "")) errors.push("parent source-quality evidence SHA-256 is required");
  if (!VIDEO_ID.test(relationship.parentRemoteVideoId ?? "")) errors.push("verified parent YouTube video ID is required");
  const canonical = "https://www.youtube.com/watch?v=" + String(relationship.parentRemoteVideoId ?? "");
  if (relationship.parentCanonicalUrl !== canonical) errors.push("parent URL must be the canonical watch URL for the exact verified parent ID");
  if (typeof relationship.parentRemoteTitle !== "string" || !relationship.parentRemoteTitle.trim()) errors.push("verified parent remote title is required for narrative review");
  if (relationship.parentChannelTitle !== "SonicVhibez") errors.push("parent must be verified as belonging to SonicVhibez");
  if (!CHANNEL_ID.test(relationship.parentChannelId ?? "") || (channelId && relationship.parentChannelId !== channelId)) errors.push("parent channel ID must match the verified configured SonicVhibez channel");
  if (relationship.parentRemoteVerified !== true) errors.push("parent remote identity and state have not been verified");
  if (!["private", "public", "unlisted"].includes(relationship.parentPrivacyStatus)) errors.push("verified parent privacy status is required");
  if (!allowPrivateParent && relationship.parentPrivacyStatus === "private") errors.push("a private parent is ineligible for native YouTube Related video");
  if (relationship.parentApproved !== true) errors.push("parent human approval is missing or stale");
  if (relationship.parentRevisionApproved !== true) errors.push("parent revision approval is missing or stale");
  if (typeof relationship.parentPublicationCycleId !== "string" || !relationship.parentPublicationCycleId.trim() || relationship.parentPublicationCycleId !== relationship.childPublicationCycleId) errors.push("parent and Short must belong to the same explicit publication cycle");
  if (!Array.isArray(relationship.sourceSegments) || relationship.sourceSegments.length < 1 || relationship.sourceSegments.length > 30 || relationship.sourceSegments.some(s => !s || typeof s.sceneId !== "string" || !s.sceneId.trim() || typeof s.startSeconds !== "number" || !Number.isFinite(s.startSeconds) || s.startSeconds < 0 || typeof s.endSeconds !== "number" || !Number.isFinite(s.endSeconds) || s.endSeconds <= s.startSeconds)) errors.push("one or more explicit, valid parent source scene segments are required");
  if (relationship.relationshipApproved !== true) errors.push("the Short-to-parent relationship has not been human-approved");
  if (typeof relationship.relationshipReviewNotes !== "string" || relationship.relationshipReviewNotes.trim().length < 3 || relationship.relationshipReviewNotes.length > 1000) errors.push("human relationship-review notes are required");
  if (typeof relationship.relationshipReviewer !== "string" || relationship.relationshipReviewer.trim().length < 2) errors.push("relationship reviewer identity is required");
  if (!Number.isFinite(Date.parse(relationship.relationshipApprovedAt ?? ""))) errors.push("relationship approval timestamp is invalid");
  if (!SHA256.test(relationship.relationshipEvidenceSha256 ?? "")) errors.push("relationship evidence SHA-256 is required");
  else if (relationship.relationshipEvidenceSha256 !== shortParentEvidenceSha256(relationship)) errors.push("relationship evidence checksum does not match the exact relationship record");
  const native = relationship.nativeRelatedVideo;
  if (!native || !["VERIFIED", "BLOCKED_EXTERNAL"].includes(native.status)) errors.push("native YouTube Related video status must be explicitly VERIFIED or BLOCKED_EXTERNAL");
  else if (relationship.parentPrivacyStatus === "private" && native.status !== "BLOCKED_EXTERNAL") errors.push("a private parent cannot be reported as natively Related-video eligible");
  else if (native.status === "VERIFIED" && (!native.verifiedBy || !Number.isFinite(Date.parse(native.verifiedAt ?? "")) || !SHA256.test(native.evidenceSha256 ?? ""))) errors.push("native Related video verification requires reviewer, timestamp and evidence hash");
  else if (native.status === "VERIFIED" && native.parentVideoId !== relationship.parentRemoteVideoId) errors.push("native Related video evidence must identify the exact approved parent video ID");
  else if (native.status === "VERIFIED" && native.channelId !== relationship.parentChannelId) errors.push("native Related video evidence channel must match the verified SonicVhibez parent channel");
  else if (native.status === "VERIFIED" && native.destinationUrl !== canonical) errors.push("native Related video evidence must identify the exact canonical parent destination URL");
  else if (native.status === "BLOCKED_EXTERNAL" && typeof native.blocker !== "string") errors.push("native Related video external blocker must be explained");
  return errors;
}

export function assertShortParentRelationship(relationship, context = {}) {
  const errors = validateShortParentRelationship(relationship, context);
  if (errors.length) throw new Error("Short parent relationship blocked: " + errors.join("; "));
  return true;
}

/** Digest of the relationship fields with its own evidence digest blanked. */
export function shortParentEvidenceSha256(relationship) {
  if (!relationship || typeof relationship !== "object" || Array.isArray(relationship)) throw new Error("relationship record is required");
  return crypto.createHash("sha256").update(JSON.stringify({ ...relationship, relationshipEvidenceSha256: "" })).digest("hex");
}

/** Stable digest for binding the reviewed relationship to an approval record. */
export function shortParentRelationshipSha256(relationship) {
  if (!relationship || typeof relationship !== "object" || Array.isArray(relationship)) throw new Error("relationship record is required");
  return crypto.createHash("sha256").update(JSON.stringify(relationship)).digest("hex");
}

/** Validate submitted source segments against the exact parent quality-evidence file. */
export function validateSourceSegmentsAgainstEvidence(sourceSegments, evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence) || evidence.format !== "long_form") return ["parent source evidence must be a long_form quality-evidence object"];
  if (!Array.isArray(evidence.scenes) || evidence.scenes.length < 2) return ["parent source evidence must contain the explicit multi-scene timeline"];
  if (!Array.isArray(sourceSegments) || sourceSegments.length < 1 || sourceSegments.length > 30) return ["between 1 and 30 explicit source segments are required"];
  const seen = new Set();
  const acceptedSegments = [];
  for (const [index, segment] of sourceSegments.entries()) {
    if (!segment || typeof segment.sceneId !== "string" || !segment.sceneId.trim() || !Number.isFinite(segment.startSeconds) || !Number.isFinite(segment.endSeconds) || segment.startSeconds < 0 || segment.endSeconds <= segment.startSeconds) {
      errors.push("source segment " + (index + 1) + " requires a scene ID and valid start/end seconds");
      continue;
    }
    const matches = evidence.scenes.filter(scene => scene?.sceneId === segment.sceneId && Number.isFinite(scene?.startSeconds) && Number.isFinite(scene?.endSeconds) && segment.startSeconds >= scene.startSeconds && segment.endSeconds <= scene.endSeconds && scene.endSeconds > scene.startSeconds);
    if (matches.length !== 1) errors.push("source segment " + (index + 1) + " must map to exactly one recorded parent scene and stay within its reviewed time range");
    const key = [segment.sceneId, segment.startSeconds, segment.endSeconds].join(":");
    if (seen.has(key)) errors.push("duplicate source segment is not allowed");
    seen.add(key);
    // A child Short must not map overlapping time ranges from the same parent scene:
    // overlapping ranges can silently repeat the same source moment while appearing
    // to be distinct lineage entries. Adjacent segments remain valid.
    for (const previous of acceptedSegments) {
      if (previous.sceneId === segment.sceneId &&
          segment.startSeconds < previous.endSeconds &&
          segment.endSeconds > previous.startSeconds) {
        errors.push("overlapping source segments from the same parent scene are not allowed");
        break;
      }
    }
    acceptedSegments.push(segment);
  }
  return errors;
}
