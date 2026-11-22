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

test("imported Canva clips remain held from release while exact-match Pexels sources can enter review", () => {
  for (const asset of inventory.assets) {
    assert.equal(asset.originalSourceUrl, null);
    assert.equal(asset.creatorConfirmed, false);
    assert.equal(asset.rightsConfirmed, false);
    assert.equal(asset.localMediaPath, null);
    assert.equal(asset.humanVisualReview, "NOT_DONE");
    assert.equal(asset.excludedFromProduction, true);
    assert.equal(asset.productionEligible, false);
    assert.equal(asset.releaseEligible, false);
    if (asset.candidateSourceUrl) assert.match(asset.candidateSourceUrl, /^https:\/\/www\.pexels\.com\/video\//);
  }
  assert.equal(inventory.assets.filter(asset => asset.reviewRenderEligible === true).length, 3);
  assert.equal(inventory.assets.filter(asset => asset.reviewRenderEligible === false).length, 2);
  assert.equal(inventory.releaseAuthorized, false);
  assert.equal(inventory.status, "CANDIDATES_HELD_PENDING_LOCAL_ORIGINAL_MEDIA_AND_RIGHTS_REVIEW");
  assert.equal(inventory.currentProductionPolicy.originalCreatorCapturedMediaRequired, false);
  assert.equal(inventory.currentProductionPolicy.stockMediaAllowed, true);
  assert.equal(inventory.currentProductionPolicy.pexelsAllowed, true);
  assert.equal(inventory.currentProductionPolicy.pixabayAllowed, true);
  assert.equal(inventory.currentProductionPolicy.aiGeneratedWildlifeVisualsAllowed, false);
});

test("general Pexels license policy and candidate pages are not treated as asset-specific rights clearance", () => {
  assert.equal(inventory.policyReference.reviewStatus, "POLICY_REVIEWED_AS_GENERAL_POLICY_ONLY");
  assert.match(inventory.notes, /permits qualifying Pexels\\/Pixabay stock/);
  assert.match(inventory.notes, /remain held/);
  assert.ok(inventory.blockingEvidence.some(item => /not rights-cleared/i.test(item)));
  assert.equal(inventory.assets.find(asset => asset.canvaAssetId === "VAHZ9oFCiak").sourceMatchStatus, "UNRESOLVED_SOURCE_URL_AND_CREATOR_NOT_RECORDED");
});
