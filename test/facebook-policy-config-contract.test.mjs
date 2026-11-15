import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FACEBOOK_POLICY_RULE_VERSION } from "../scripts/facebook-policy-engine.mjs";

const configPath = path.join(process.cwd(), "config/facebook-publishing.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

test("Nature Frontiers publishing configuration stays aligned with the active policy engine", () => {
  assert.equal(config.complianceRuleSet, FACEBOOK_POLICY_RULE_VERSION);
});

test("Nature Frontiers publishing configuration retains fail-closed defaults", () => {
  assert.equal(config.publishingEnabled, false);
  assert.equal(config.dryRun, true);
  assert.equal(config.emergencyStop, true);
});

test("Nature Frontiers remains a Facebook destination, not a YouTube target", () => {
  assert.equal(config.destination, "nature_frontiers_facebook");
  assert.equal(config.timezone, "Africa/Johannesburg");
});
