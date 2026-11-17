import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FACEBOOK_POLICY_RULE_VERSION, NATURE_FRONTIERS_REQUIRED_POST_LINKS } from "../scripts/facebook-policy-engine.mjs";

const configPath = path.join(process.cwd(), "config/facebook-publishing.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

test("Nature Frontiers publishing configuration stays aligned with the active policy engine", () => {
  assert.equal(config.complianceRuleSet, FACEBOOK_POLICY_RULE_VERSION);
});

test("Nature Frontiers publishing configuration retains fail-closed defaults", () => {
  assert.equal(config.publishingEnabled, false);
  assert.equal(config.dryRun, true);
  assert.equal(config.emergencyStop, true);
  assert.equal(config.mediaHistoryReconciled, false);
});

test("Nature Frontiers remains a Facebook destination, not a YouTube target", () => {
  assert.equal(config.destination, "nature_frontiers_facebook");
  assert.equal(config.timezone, "Africa/Johannesburg");
});


test("every Nature Frontiers post destination is exact-allowlisted for the disclosed campaign", () => {
  assert.ok(config.allowedCampaignIds.includes("nature-frontiers-affiliate-monetization"));
  for (const url of NATURE_FRONTIERS_REQUIRED_POST_LINKS) {
    assert.ok(config.approvedDestinations.includes(url), url);
  }
  assert.equal(NATURE_FRONTIERS_REQUIRED_POST_LINKS.length, 8);
});
