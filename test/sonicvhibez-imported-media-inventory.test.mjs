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

test("all imported Canva clips remain excluded, unlicensed and unavailable to production", () => {
  for (const asset of inventory.assets) {
    assert.equal(asset.originalSourceUrl, null);
    assert.equal(asset.creatorConfirmed, false);
    assert.equal(asset.rightsConfirmed, false);
    assert.equal(asset.localMediaPath, null);
    assert.equal(asset.humanVisualReview, "NOT_DONE");
    assert.equal(asset.status, "EXCLUDED_NOT_USED");
    assert.equal(asset.excludedFromProduction, true);
    if (asset.candidateSourceUrl) assert.match(asset.candidateSourceUrl, /^https:\/\/www\.pexels\.com\/video\//);
  }
  assert.equal(inventory.releaseAuthorized, false);
  assert.equal(inventory.status, "EXCLUDED_NOT_USED_FROM_PRODUCTION");
});

test("general Pexels license policy and candidate pages are not treated as asset-specific rights clearance", () => {
  assert.equal(inventory.policyReference.reviewStatus, "POLICY_REVIEWED_AS_GENERAL_POLICY_ONLY");
  assert.match(inventory.notes, /quarantined as EXCLUDED_NOT_USED/);
  assert.match(inventory.notes, /not cleared for any production use/);
  assert.ok(inventory.blockingEvidence.some(item => /not rights-cleared/i.test(item)));
  assert.equal(inventory.assets.find(asset => asset.canvaAssetId === "VAHZ9oFCiak").sourceMatchStatus, "UNRESOLVED_SOURCE_URL_AND_CREATOR_NOT_RECORDED");
});
