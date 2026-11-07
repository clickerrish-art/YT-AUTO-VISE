import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateCampaigns } from "../scripts/validate-campaigns.mjs";

const baseline = JSON.parse(fs.readFileSync(new URL("../config/campaigns.json", import.meta.url), "utf8"));

test("campaign config preserves Selar and keeps Safari inactive", () => {
  assert.deepEqual(validateCampaigns(baseline), []);
  const selar = baseline.campaigns.find(c => c.type === "selar_digital_product");
  const safari = baseline.campaigns.find(c => c.type === "safari_affiliate");
  assert.equal(selar.destinationUrl, "https://selar.com/0u19v8u99l");
  assert.equal(selar.status, "ACTIVE_FOR_DRAFTS_ONLY");
  assert.equal(safari.status, "INACTIVE");
  assert.equal(safari.destinationUrl, "");
  assert.equal(safari.ownerApproved, false);
});

test("campaign validator rejects changed Selar URLs", () => {
  const bad = structuredClone(baseline);
  bad.campaigns.find(c => c.type === "selar_digital_product").destinationUrl = "https://example.com";
  assert.ok(validateCampaigns(bad).some(error => error.includes("Selar destination must exactly match")));
});

test("campaign validator rejects activating Safari without verified owner URL", () => {
  const bad = structuredClone(baseline);
  const safari = bad.campaigns.find(c => c.type === "safari_affiliate");
  safari.status = "ACTIVE_FOR_DRAFTS_ONLY";
  assert.ok(validateCampaigns(bad).some(error => error.includes("active Safari campaign requires")));
  assert.ok(validateCampaigns(bad).some(error => error.includes("owner approval and verified destination")));
});

test("campaign validator rejects duplicate IDs and missing disclosure", () => {
  const bad = structuredClone(baseline);
  bad.campaigns[1].id = bad.campaigns[0].id;
  bad.campaigns[0].disclosureText = "";
  const errors = validateCampaigns(bad);
  assert.ok(errors.some(error => error.includes("duplicate campaign ID")));
  assert.ok(errors.some(error => error.includes("Selar disclosure text is required")));
});
