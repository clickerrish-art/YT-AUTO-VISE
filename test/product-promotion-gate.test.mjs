import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { validateProductPromotionGate } from "../scripts/product-promotion-gate.mjs";

const url = "https://selar.com/0u19v8u99l";
const affiliateDisclosure = "Affiliate disclosure: I may earn a commission if you purchase through this link.";

function verifiedFixture(type = "affiliate") {
  const disclosureText = type === "none"
    ? "No affiliate commission or paid placement is associated with this product link."
    : affiliateDisclosure;
  const product = {
    id: "wildlife-creators-vault",
    name: "Complete YouTube Wildlife Creator's Vault",
    url,
    status: "approved",
    promotionGate: {
      seller: { status: "VERIFIED", name: "Verified listing seller", sourceUrl: url, verifiedAt: "2026-11-06T08:00:00Z", evidenceReference: "selar-listing-check-2026-11-06" },
      brandAuthorization: { status: "OWNER_CONFIRMED", brand: "SonicVhibez", confirmedAt: "2026-11-06T08:01:00Z", approvalReference: "owner-promotion-approval-2026-11-06" },
      compensation: { status: "VERIFIED", type, verifiedAt: "2026-11-06T08:02:00Z", evidenceReference: "compensation-relationship-check-2026-11-06" },
      disclosure: { status: "OWNER_APPROVED", text: disclosureText, approvedAt: "2026-11-06T08:03:00Z", approvalReference: "approved-disclosure-2026-11-06" }
    }
  };
  const metadata = {
    hasPaidPromotion: type !== "none",
    description: "Creator lesson. " + disclosureText + " Product: " + url,
    promotionDisclosure: { status: "APPROVED", type, text: disclosureText }
  };
  return { product, metadata };
}

test("checked-in product registry remains blocked while promotion evidence is unverified", () => {
  const config = JSON.parse(fs.readFileSync("config/products.json", "utf8"));
  const errors = validateProductPromotionGate(config.products[0], undefined, { requireMetadataDisclosure: false });
  assert.ok(errors.some(error => /seller details must be reverified/i.test(error)));
  assert.ok(errors.some(error => /brand authorization must be owner-confirmed/i.test(error)));
  assert.ok(errors.some(error => /compensation relationship must be verified/i.test(error)));
  assert.ok(errors.some(error => /viewer-facing disclosure must be owner-approved/i.test(error)));
});

test("verified seller, SonicVhibez authorization, compensation and exact disclosure pass", () => {
  const fixture = verifiedFixture("affiliate");
  assert.deepEqual(validateProductPromotionGate(fixture.product, fixture.metadata), []);
});

test("metadata cannot substitute a different or partial disclosure", () => {
  const fixture = verifiedFixture("affiliate");
  fixture.metadata.promotionDisclosure.text = "I may earn money.";
  fixture.metadata.description = "Creator lesson. I may earn money. Product: " + url;
  const errors = validateProductPromotionGate(fixture.product, fixture.metadata);
  assert.ok(errors.some(error => /must exactly match the owner-approved disclosure/i.test(error)));
  assert.ok(errors.some(error => /must contain the exact owner-approved viewer-facing disclosure/i.test(error)));
});

test("no-material-connection classification requires a matching non-paid flag and explicit disclosure", () => {
  const fixture = verifiedFixture("none");
  assert.equal(fixture.metadata.hasPaidPromotion, false);
  assert.deepEqual(validateProductPromotionGate(fixture.product, fixture.metadata), []);
  fixture.metadata.hasPaidPromotion = true;
  assert.ok(validateProductPromotionGate(fixture.product, fixture.metadata).some(error => /hasPaidPromotion must match/i.test(error)));
});

test("promotion evidence rejects timezone-free or invalid verification timestamps", () => {
  const fixture = verifiedFixture("paid");
  fixture.product.promotionGate.seller.verifiedAt = "2026-11-06T08:00:00";
  fixture.product.promotionGate.brandAuthorization.confirmedAt = "2026-02-31T08:00:00Z";
  const errors = validateProductPromotionGate(fixture.product, fixture.metadata);
  assert.ok(errors.some(error => /seller verification needs a calendar-valid timezone-qualified timestamp/i.test(error)));
  assert.ok(errors.some(error => /brand authorization needs a calendar-valid timezone-qualified timestamp/i.test(error)));
});

test("content checker surfaces the product gate before any private-upload readiness claim", () => {
  const result = spawnSync(process.execPath, ["scripts/check-content.mjs", "content/next-short.example.json"], {
    encoding: "utf8",
    env: { ...process.env, SONICVHIBEZ_CHANNEL_ID: "UC_TEST_ONLY_NOT_A_REAL_CHANNEL" }
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /product promotion gate: seller details must be reverified/i);
  assert.match(result.stderr, /brand authorization must be owner-confirmed/i);
  assert.match(result.stderr, /compensation relationship must be verified/i);
});

test("readiness JSON identifies product promotion gates as owner-controlled blockers", () => {
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    encoding: "utf8",
    env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "", SONICVHIBEZ_CHANNEL_ID: "" }
  });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  const blockers = report.blockers.filter(item => item.message.startsWith("Product promotion gate:"));
  assert.ok(blockers.some(item => /seller details must be reverified/i.test(item.message)));
  assert.ok(blockers.some(item => /brand authorization must be owner-confirmed/i.test(item.message)));
  assert.ok(blockers.some(item => /compensation relationship must be verified/i.test(item.message)));
  assert.ok(blockers.every(item => item.evidence.path === "config/products.json"));
  assert.ok(blockers.every(item => item.controlOwner === "external_owner_or_human_reviewer"));
});
