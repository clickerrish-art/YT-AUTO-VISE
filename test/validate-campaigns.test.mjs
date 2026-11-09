import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateCampaigns } from "../scripts/validate-campaigns.mjs";

const baseline = JSON.parse(fs.readFileSync(new URL("../config/campaigns.json", import.meta.url), "utf8"));

test("campaign config preserves Selar and keeps Safari inactive", () => {
  assert.deepEqual(validateCampaigns(baseline), []);
  const selar = baseline.campaigns.find(c => c.type === "selar_digital_product");
  const safari = baseline.campaigns.find(c => c.type === "safari_affiliate");
  const affiliate = baseline.campaigns.find(c => c.type === "affiliate");
  assert.equal(selar.destinationUrl, "https://selar.com/0u19v8u99l");
  assert.equal(selar.status, "ACTIVE_FOR_DRAFTS_ONLY");
  assert.equal(safari.status, "INACTIVE");
  assert.equal(safari.destinationUrl, "");
  assert.equal(safari.ownerApproved, false);
  assert.equal(affiliate.status, "INACTIVE");
  assert.equal(affiliate.destinationUrl, "");
  assert.equal(affiliate.compensationType, "affiliate");
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

test("campaign validator rejects duplicate IDs and misleading disclosure", () => {
  const bad = structuredClone(baseline);
  bad.campaigns[1].id = bad.campaigns[0].id;
  bad.campaigns[0].disclosureText = "";
  const errors = validateCampaigns(bad);
  assert.ok(errors.some(error => error.includes("duplicate campaign ID")));
  assert.ok(errors.some(error => error.includes("Selar disclosure must accurately identify")));
});


test("generic external affiliate activation requires a verified HTTPS destination and explicit disclosure approval", () => {
  const bad = structuredClone(baseline);
  const affiliate = bad.campaigns.find(c => c.type === "affiliate");
  affiliate.status = "ACTIVE_FOR_DRAFTS_ONLY";
  affiliate.destinationUrl = "http://example.org/booking";
  affiliate.destinationValidation = "owner_verified";
  affiliate.ownerApproved = true;
  affiliate.disclosureText = "I may earn a commission.";
  affiliate.approval = { approvedBy: "owner", approvedAt: "2026-11-09T10:00:00Z", destinationVersion: "a".repeat(64) };
  assert.ok(validateCampaigns(bad).some(error => /exact HTTPS destination/i.test(error)));
  const selarAffiliate = structuredClone(baseline);
  const selarCampaign = selarAffiliate.campaigns.find(c => c.type === "affiliate");
  selarCampaign.status = "ACTIVE_FOR_DRAFTS_ONLY";
  selarCampaign.destinationUrl = "https://selar.com/another-product";
  selarCampaign.destinationValidation = "owner_confirmed_exact_https";
  selarCampaign.ownerApproved = true;
  selarCampaign.disclosureText = "I may earn a commission from this affiliate link.";
  selarCampaign.approval = { approvedBy: "owner", approvedAt: "2026-11-09T10:00:00Z", destinationVersion: "a".repeat(64) };
  assert.ok(validateCampaigns(selarAffiliate).some(error => /dedicated direct-sales campaign/i.test(error)));
  const missingDisclosure = structuredClone(baseline);
  const candidate = missingDisclosure.campaigns.find(c => c.type === "affiliate");
  candidate.status = "ACTIVE_FOR_DRAFTS_ONLY";
  candidate.destinationUrl = "https://affiliate.example/serengeti";
  candidate.destinationValidation = "owner_verified";
  candidate.ownerApproved = true;
  candidate.approval = { approvedBy: "owner", approvedAt: "2026-11-09T10:00:00Z", destinationVersion: "a".repeat(64) };
  assert.ok(validateCampaigns(missingDisclosure).some(error => /approved viewer-facing affiliate disclosure/i.test(error)));
});
