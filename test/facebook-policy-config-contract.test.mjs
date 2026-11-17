import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FACEBOOK_POLICY_RULE_VERSION, NATURE_FRONTIERS_KNOWN_DESTINATIONS } from "../scripts/facebook-policy-engine.mjs";

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
  assert.deepEqual(config.allowedCampaignIds, [], "unregistered Safari affiliate and Selar direct-sales campaigns must not authorize commercial publishing");
  const campaignConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "config/campaigns.json"), "utf8"));
  assert.equal(campaignConfig.campaigns.find(item => item.type === "safari_affiliate")?.status, "INACTIVE");
  assert.equal(campaignConfig.campaigns.find(item => item.type === "selar_digital_product")?.status, "ACTIVE_FOR_DRAFTS_ONLY");
});

test("Nature Frontiers remains a Facebook destination, not a YouTube target", () => {
  assert.equal(config.destination, "nature_frontiers_facebook");
  assert.equal(config.timezone, "Africa/Johannesburg");
});


test("known Nature Frontiers destinations remain allowlisted but are never required on every organic post", () => {
  assert.deepEqual(config.allowedCampaignIds, [], "no Nature Frontiers commercial campaign is authorized for autonomous publishing yet");
  for (const url of NATURE_FRONTIERS_KNOWN_DESTINATIONS) assert.ok(config.approvedDestinations.includes(url), url);
  assert.equal(NATURE_FRONTIERS_KNOWN_DESTINATIONS.length, 8);
  const links = JSON.parse(fs.readFileSync(path.join(process.cwd(), "config/nature-frontiers-post-links.json"), "utf8"));
  assert.equal(links.campaignId, null);
  assert.equal(links.disclosure, null);
  assert.deepEqual(links.requiredForEveryPost, []);
  assert.equal(links.safety.campaignId, null);
  assert.equal(links.safety.commercial, false);
  assert.equal(links.safety.disclosureRequired, false);
  assert.equal(links.safety.publishingEnabled, false);
  assert.equal(links.safety.dryRun, true);
  assert.equal(links.safety.emergencyStop, true);
  assert.ok(links.destinations.every(item => item.required === false));
  assert.equal(links.destinations.find(item => item.campaignId === "safari-affiliate-inactive")?.status, "INACTIVE");
  assert.equal(links.destinations.find(item => item.campaignId === "selar-wildlife-vault")?.status, "ACTIVE_FOR_DRAFTS_ONLY");
  assert.equal(links.destinations.find(item => item.url === "https://selar.com/m/kehinde-ajiboye3108854")?.status, "NOT_APPROVED_DESTINATION");
  assert.equal(links.destinations.find(item => item.url === "https://selar.com/m/kehinde-ajiboye3108854")?.campaignId, null);
});
