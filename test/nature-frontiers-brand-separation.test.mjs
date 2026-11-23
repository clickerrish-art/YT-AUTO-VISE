import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8"));
const facebook = read("../config/facebook-publishing.json");
const instagram = read("../config/instagram-publishing.json");
const links = read("../config/nature-frontiers-post-links.json");
const sonicMediaPolicy = read("../config/media-production-policy.json");
const natureMediaRegister = read("../content/nature-frontiers-media-register.json");

function isYouTubeUrl(value) {
  try { return /(^|\.)youtube\.com$/i.test(new URL(value).hostname); }
  catch { return false; }
}

test("Nature Frontiers Facebook and Instagram configs cannot route to YouTube", () => {
  assert.equal(facebook.destination, "nature_frontiers_facebook");
  assert.equal(instagram.destination, "nature_frontiers_instagram");
  assert.equal(facebook.publishingEnabled, false);
  assert.equal(facebook.dryRun, true);
  assert.equal(instagram.publishingEnabled, false);
  assert.equal(instagram.dryRun, true);
  assert.equal(instagram.emergencyStop, true);
  assert.ok(facebook.approvedDestinations.every(url => !isYouTubeUrl(url)));
  assert.ok(instagram.approvedDestinations.every(url => !isYouTubeUrl(url)));
});

test("Nature Frontiers destination catalogue is Facebook/Instagram-only", () => {
  assert.equal(links.brand, "Nature Frontiers");
  assert.ok(links.destinations.every(item => item.kind !== "youtube_subscription"));
  assert.equal(Object.hasOwn(links.platformNotes, "youtube"), false);
  assert.equal(links.safety.youtubePublishingAllowed, false);
  assert.equal(links.safety.publishingEnabled, false);
  assert.equal(links.safety.dryRun, true);
  assert.equal(links.safety.emergencyStop, true);
  assert.ok(links.destinations.every(item => !isYouTubeUrl(item.url)));
});

test("SonicVhibez YouTube channel is not embedded in Nature Frontiers publishing configuration", () => {
  const serialized = JSON.stringify({ facebook, instagram, links });
  assert.equal(serialized.includes("UCSlkuPfHH78oGC1o418HV4w"), false);
  assert.equal(serialized.includes("NatureFrontiers-life"), false);
});


test("Nature Frontiers and SonicVhibez have explicit, non-overlapping media policy scopes", () => {
  assert.deepEqual(sonicMediaPolicy.policyScope, {
    brand: "SonicVhibez",
    platforms: ["youtube"],
    mediaMode: "AI_GENERATED_RECONSTRUCTION_REQUIRED",
    notApplicableTo: ["Nature Frontiers"]
  });
  assert.deepEqual(natureMediaRegister.policyScope, {
    brand: "Nature Frontiers",
    platforms: ["facebook", "instagram"],
    mediaMode: "ORIGINAL_CREATOR_CAPTURED_ONLY",
    notApplicableTo: ["SonicVhibez"]
  });
  assert.equal(sonicMediaPolicy.policyScope.brand, "SonicVhibez");
  assert.equal(sonicMediaPolicy.productionVisualMode, "AI_GENERATED_RECONSTRUCTION_REQUIRED");
  assert.equal(natureMediaRegister.policy.originalCreatorCapturedMediaRequired, true);
  assert.equal(natureMediaRegister.policy.stockMediaAllowed, false);
  assert.equal(natureMediaRegister.policy.aiGeneratedWildlifeVisualsAllowed, false);
  assert.ok(natureMediaRegister.assets.every(asset => asset.productionEligibility?.eligible === false));
  assert.equal(facebook.brand, "Nature Frontiers");
  assert.equal(instagram.brand, "Nature Frontiers");
  assert.equal(facebook.publishingEnabled, false);
  assert.equal(facebook.dryRun, true);
  assert.equal(instagram.publishingEnabled, false);
  assert.equal(instagram.dryRun, true);
  assert.equal(instagram.emergencyStop, true);
});
