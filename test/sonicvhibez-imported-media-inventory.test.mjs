import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const inventory = JSON.parse(fs.readFileSync(new URL("../content/sonicvhibez-imported-media-inventory.json", import.meta.url), "utf8"));

test("all five previously imported Canva wildlife clips are inventoried with exact IDs and durations", () => {
  assert.equal(inventory.assets.length, 5);
  assert.deepEqual(inventory.assets.map(asset => asset.canvaAssetId), [
    "VAHZ9kg2rvg", "VAHZ9hEjS0U", "VAHZ9niQJoo", "VAHZ9i3Hx6U", "VAHZ9oFCiak"
  ]);
  assert.deepEqual(inventory.assets.map(asset => asset.canvaMetadata.durationSeconds), [14, 13, 25, 21, 9]);
});

test("candidate Pexels pages never become verified source or rights evidence without visual matching", () => {
  for (const asset of inventory.assets) {
    assert.equal(asset.originalSourceUrl, null);
    assert.equal(asset.creatorConfirmed, false);
    assert.equal(asset.rightsConfirmed, false);
    assert.equal(asset.localMediaPath, null);
    assert.equal(asset.status, "HOLD");
    if (asset.candidateSourceUrl) assert.match(asset.candidateSourceUrl, /^https:\/\/www\\.pexels\\.com\/video\//);
  }
  assert.equal(inventory.releaseAuthorized, false);
  assert.equal(inventory.status, "HOLD_SOURCE_PROVENANCE_AND_LOCAL_MEDIA_MISSING");
});

test("Pexels general license policy is not mistaken for proof of a specific asset's provenance", () => {
  assert.equal(inventory.policyReference.reviewStatus, "POLICY_REVIEWED_AS_GENERAL_POLICY_ONLY");
  assert.match(inventory.notes, /Candidate URLs are research leads, not verified provenance/);
  assert.equal(inventory.assets.find(asset => asset.canvaAssetId === "VAHZ9oFCiak").sourceMatchStatus, "UNRESOLVED_SOURCE_URL_AND_CREATOR_NOT_RECORDED");
});
