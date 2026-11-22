import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const inventory = JSON.parse(fs.readFileSync(new URL("../content/sonicvhibez-imported-media-inventory.json", import.meta.url), "utf8"));
const originalCanvaIds = ["VAHZ9kg2rvg", "VAHZ9hEjS0U", "VAHZ9niQJoo", "VAHZ9i3Hx6U", "VAHZ9oFCiak"];
const addedCrocodileCanvaIds = ["VAHbmcWc8lU", "VAHbmQ28Quo", "VAHbmRm73VM", "VAHbmXxvw3E", "VAHbmVmwByo"];

test("all ten previously imported Canva wildlife clips are inventoried with exact IDs and durations", () => {
  assert.equal(inventory.assets.length, 10);
  const original = inventory.assets.filter(asset => originalCanvaIds.includes(asset.canvaAssetId));
  assert.deepEqual(original.map(asset => asset.canvaAssetId), originalCanvaIds);
  assert.deepEqual(original.map(asset => asset.canvaMetadata.durationSeconds), [14, 13, 25, 21, 9]);
  const addedCrocodile = inventory.assets.filter(asset => addedCrocodileCanvaIds.includes(asset.canvaAssetId));
  assert.deepEqual(addedCrocodile.map(asset => asset.canvaAssetId), addedCrocodileCanvaIds);
  assert.deepEqual(addedCrocodile.map(asset => asset.canvaMetadata.durationSeconds), [36.24, 10.443767, 17.6176, 13.480133, 60.193467]);
  assert.ok(addedCrocodile.every(asset => asset.sourceAssetId?.startsWith("pexels-video-")));
});

test("licensed Pexels source matches can enter review without becoming release-cleared", () => {
  assert.equal(inventory.status, "CANDIDATES_HELD_PENDING_LOCAL_ORIGINAL_MEDIA_AND_RIGHTS_REVIEW");
  assert.equal(inventory.releaseAuthorized, false);
  assert.ok(inventory.assets.every(asset => asset.selectedForProduction === false));
  assert.equal(inventory.assets.filter(asset => asset.reviewRenderEligible === true).length, 8);
  assert.equal(inventory.assets.filter(asset => asset.reviewRenderEligible === false).length, 2);
  assert.equal(inventory.assets.filter(asset => asset.excludedFromProduction === false).length, 8);
  assert.equal(inventory.assets.filter(asset => asset.excludedFromProduction === true).length, 2);
  assert.equal(inventory.assets.filter(asset => asset.originalSourceUrl !== null).length, 9);
  assert.equal(inventory.assets.filter(asset => asset.originalSourceUrl === null).length, 1);

  for (const asset of inventory.assets) {
    assert.equal(asset.creatorConfirmed, false);
    assert.equal(asset.rightsConfirmed, false);
    assert.equal(asset.creatorCapturedOriginal, false);
    assert.equal(asset.localMediaPath, null);
    assert.equal(asset.productionEligible, false);
    assert.equal(asset.releaseEligible, false);
    assert.equal(asset.selectedForProduction, false);
    if (asset.sourceAssetId) {
      assert.match(asset.sha256, /^[a-f0-9]{64}$/);
      assert.equal(asset.humanVisualReview, "PENDING_FULL_PLAYBACK");
      assert.equal(asset.originalBytesAvailableInGitHubArtifact, true);
      assert.equal(asset.originalBytesAvailableLocally, false);
    } else {
      assert.equal(asset.sha256, null);
      assert.equal(asset.humanVisualReview, "NOT_DONE");
    }
  }

  for (const asset of inventory.assets.filter(asset => asset.reviewRenderEligible === true)) {
    assert.equal(asset.sourceMethod, "PEXELS_LICENSED_STOCK");
    assert.equal(asset.sourcePlatform, "Pexels");
    assert.equal(asset.sourcePageUrl, asset.originalSourceUrl);
    assert.match(asset.sourcePageUrl, /^https:\/\/www\.pexels\.com\/video\//);
    assert.ok(asset.creatorName);
    assert.equal(asset.platformLicenseReviewed, true);
    assert.equal(asset.thirdPartyRightsReviewed, false);
    assert.equal(asset.licenseEvidencePath, "content/media/pexels-license-evidence-2026-11-22.md");
  }

  assert.equal(inventory.currentProductionPolicy.originalCreatorCapturedMediaRequired, false);
  assert.equal(inventory.currentProductionPolicy.stockMediaAllowed, true);
  assert.equal(inventory.currentProductionPolicy.stockVideoFootageAllowed, true);
  assert.equal(inventory.currentProductionPolicy.stockPhotographsAllowed, false);
  assert.equal(inventory.currentProductionPolicy.pexelsAllowed, true);
  assert.equal(inventory.currentProductionPolicy.pixabayAllowed, true);
  assert.equal(inventory.currentProductionPolicy.aiGeneratedWildlifeVisualsAllowed, false);
});

test("duration-mismatch and unresolved-source Canva assets remain excluded", () => {
  const mismatch = inventory.assets.find(asset => asset.canvaAssetId === "VAHZ9hEjS0U");
  assert.equal(mismatch.sourceMatchStatus, "CANVA_DURATION_13S_VS_SOURCE_14S_PENDING_VISUAL_CONFIRMATION");
  assert.equal(mismatch.reviewRenderEligible, false);
  assert.equal(mismatch.excludedFromProduction, true);
  const unresolved = inventory.assets.find(asset => asset.canvaAssetId === "VAHZ9oFCiak");
  assert.equal(unresolved.sourceMethod, "UNVERIFIED");
  assert.equal(unresolved.sourceMatchStatus, "UNRESOLVED_SOURCE_PAGE_CREATOR");
  assert.equal(unresolved.originalSourceUrl, null);
  assert.equal(unresolved.reviewRenderEligible, false);
  assert.equal(unresolved.excludedFromProduction, true);
});

test("general Pexels licence evidence is not treated as asset-specific rights clearance", () => {
  assert.equal(inventory.policyReference.reviewStatus, "POLICY_REVIEWED_AS_GENERAL_POLICY_ONLY");
  assert.ok(inventory.notes.includes("permits qualifying Pexels/Pixabay stock"));
  assert.match(inventory.notes, /No candidate is selected for production or release-authorized/);
  assert.ok(inventory.blockingEvidence.some(item => /not rights-cleared/i.test(item)));
});
