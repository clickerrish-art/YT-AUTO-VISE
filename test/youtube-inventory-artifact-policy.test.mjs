import test from "node:test";
import assert from "node:assert/strict";
import { evaluateYoutubeInventoryArtifact } from "../scripts/youtube-inventory-artifact-policy.mjs";

function inventory(visibilities) {
  return {
    schemaVersion: 1,
    complete: true,
    totalUploads: visibilities.length,
    visibilityCounts: {
      public: visibilities.filter(x => x === "public").length,
      private: visibilities.filter(x => x === "private").length,
      unlisted: visibilities.filter(x => x === "unlisted").length
    },
    videos: visibilities.map((visibility, index) => ({
      id: "video-" + index,
      visibility
    }))
  };
}

test("complete public-only YouTube inventory is eligible for a short-lived artifact", () => {
  const result = evaluateYoutubeInventoryArtifact(inventory(["public", "public"]));
  assert.equal(result.artifactReady, true);
  assert.equal(result.reason, "PUBLIC_ONLY_INVENTORY_SAFE_FOR_REPOSITORY_ARTIFACT");
  assert.deepEqual(result.visibilityCounts, { public: 2, private: 0, unlisted: 0 });
});

test("private or unlisted metadata is never eligible for a repository artifact", () => {
  for (const visibility of ["private", "unlisted"]) {
    const result = evaluateYoutubeInventoryArtifact(inventory(["public", visibility]));
    assert.equal(result.artifactReady, false);
    assert.equal(result.reason, "PRIVATE_OR_UNLISTED_VIDEO_METADATA_MUST_NOT_BE_UPLOADED");
  }
});

test("empty complete inventory is eligible without exposing any video data", () => {
  const result = evaluateYoutubeInventoryArtifact(inventory([]));
  assert.equal(result.artifactReady, true);
  assert.equal(result.totalUploads, 0);
});

test("incomplete inventory fails closed", () => {
  assert.throws(
    () => evaluateYoutubeInventoryArtifact({ ...inventory(["public"]), complete: false }),
    /not a complete/
  );
});

test("mismatched counts or missing video entries fail closed", () => {
  const bad = inventory(["public"]);
  bad.visibilityCounts.public = 0;
  assert.throws(() => evaluateYoutubeInventoryArtifact(bad), /totals|counts/);
  const missing = inventory(["public"]);
  missing.videos = [];
  assert.throws(() => evaluateYoutubeInventoryArtifact(missing), /count does not match/);
});

test("duplicate IDs and unsupported visibility fail closed", () => {
  const duplicate = inventory(["public", "public"]);
  duplicate.videos[1].id = duplicate.videos[0].id;
  assert.throws(() => evaluateYoutubeInventoryArtifact(duplicate), /invalid or duplicate/);
  const unsupported = inventory(["public"]);
  unsupported.videos[0].visibility = "scheduled";
  assert.throws(() => evaluateYoutubeInventoryArtifact(unsupported), /invalid or duplicate/);
});
