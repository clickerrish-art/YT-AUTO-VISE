import test from "node:test";
import assert from "node:assert/strict";
import { manageCampaign } from "../scripts/campaign-management.mjs";
import { validateCampaigns } from "../scripts/validate-campaigns.mjs";
import fs from "node:fs";

const baseline = JSON.parse(fs.readFileSync(new URL("../config/campaigns.json", import.meta.url), "utf8"));
const operator = "owner@example.test";

test("Safari requires HTTPS preview but activation remains prohibited by project policy", () => {
  const id = baseline.campaigns.find(c => c.type === "safari_affiliate").id;
  assert.throws(() => manageCampaign(baseline, { campaignId: id, action: "activate", confirmOwnerApproval: true }, operator), /Safari affiliate campaigns are disabled.*remain INACTIVE/);
  assert.throws(() => manageCampaign(baseline, { campaignId: id, action: "preview", destinationUrl: "http://example.com", disclosureText: "Affiliate disclosure applies" }, operator), /HTTPS/);
  const preview = manageCampaign(baseline, { campaignId: id, action: "preview", destinationUrl: "https://example.com/stay", disclosureText: "I may earn a commission from eligible bookings." }, operator);
  assert.equal(preview.previewOnly, true);
  assert.equal(preview.config.campaigns.find(c => c.id === id).status, "INACTIVE");
  assert.throws(() => manageCampaign(preview.config, { campaignId: id, action: "activate", confirmOwnerApproval: true }, operator, "2026-10-23T12:00:00Z"),
    /Safari affiliate campaigns are disabled.*remain INACTIVE/);
  assert.deepEqual(validateCampaigns(preview.config), []);
});

test("Safari deactivation clears pending destination and approval data", () => {
  const id = baseline.campaigns.find(c => c.type === "safari_affiliate").id;
  const preview = manageCampaign(baseline, { campaignId: id, action: "preview", destinationUrl: "https://example.com/stay", disclosureText: "I may earn a commission from eligible bookings." }, operator);
  const inactive = manageCampaign(preview.config, { campaignId: id, action: "deactivate" }, operator);
  assert.equal(inactive.campaign.destinationUrl, "");
  assert.equal(inactive.campaign.ownerApproved, false);
  assert.equal(inactive.campaign.status, "INACTIVE");
  assert.equal(Object.hasOwn(inactive.campaign, "pendingDestinationUrl"), false);
  assert.equal(Object.hasOwn(inactive.campaign, "pendingDisclosureText"), false);
  assert.deepEqual(validateCampaigns(inactive.config), []);
});

test("Selar URL cannot be edited and campaign activation remains draft-only", () => {
  const id = baseline.campaigns.find(c => c.type === "selar_digital_product").id;
  assert.throws(() => manageCampaign(baseline, { campaignId: id, action: "activate", destinationUrl: "https://example.com", disclosureText: "Promotional link" }, operator), /exactly match/);
  const result = manageCampaign(baseline, { campaignId: id, action: "activate", destinationUrl: "https://selar.com/0u19v8u99l", disclosureText: "Promotional link: product details are on the seller page." }, operator);
  assert.equal(result.campaign.destinationUrl, "https://selar.com/0u19v8u99l");
  assert.equal(result.campaign.status, "ACTIVE_FOR_DRAFTS_ONLY");
  assert.deepEqual(validateCampaigns(result.config), []);
});
