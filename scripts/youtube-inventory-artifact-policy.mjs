const ALLOWED_VISIBILITY = new Set(["public", "private", "unlisted"]);

export function evaluateYoutubeInventoryArtifact(inventory) {
  if (!inventory || typeof inventory !== "object" || Array.isArray(inventory) ||
      inventory.schemaVersion !== 1 || inventory.complete !== true ||
      !Array.isArray(inventory.videos)) {
    throw new Error("YouTube inventory is not a complete schema-version-1 inventory");
  }
  const totalUploads = inventory.totalUploads;
  const declared = inventory.visibilityCounts;
  if (!Number.isSafeInteger(totalUploads) || totalUploads < 0 ||
      !declared || typeof declared !== "object") {
    throw new Error("YouTube inventory totals are invalid");
  }
  for (const visibility of ALLOWED_VISIBILITY) {
    if (!Number.isSafeInteger(declared[visibility]) || declared[visibility] < 0) {
      throw new Error("YouTube inventory visibility counts are invalid");
    }
  }
  if (Object.values(declared).reduce((sum, count) => sum + count, 0) !== totalUploads ||
      inventory.videos.length !== totalUploads) {
    throw new Error("YouTube inventory video count does not match its declared totals");
  }

  const actual = { public: 0, private: 0, unlisted: 0 };
  const ids = new Set();
  for (const video of inventory.videos) {
    if (!video || typeof video.id !== "string" || !video.id.trim() ||
        !ALLOWED_VISIBILITY.has(video.visibility) || ids.has(video.id)) {
      throw new Error("YouTube inventory contains an invalid or duplicate video entry");
    }
    ids.add(video.id);
    actual[video.visibility] += 1;
  }
  for (const visibility of ALLOWED_VISIBILITY) {
    if (actual[visibility] !== declared[visibility]) {
      throw new Error("YouTube inventory visibility counts do not match its video entries");
    }
  }

  const artifactReady = actual.private === 0 && actual.unlisted === 0;
  return Object.freeze({
    artifactReady,
    reason: artifactReady
      ? "PUBLIC_ONLY_INVENTORY_SAFE_FOR_REPOSITORY_ARTIFACT"
      : "PRIVATE_OR_UNLISTED_VIDEO_METADATA_MUST_NOT_BE_UPLOADED",
    totalUploads,
    visibilityCounts: Object.freeze(actual)
  });
}
