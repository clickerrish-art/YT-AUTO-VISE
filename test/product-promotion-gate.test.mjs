import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { validateProductPromotionGate } from "../scripts/product-promotion-gate.mjs";

const url = "https://example-affiliate-store.test/product";
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

test("checked-in product registry records the seller but remains blocked on promotion authorization", () => {
  const config = JSON.parse(fs.readFileSync("config/products.json", "utf8"));
  const seller = config.products[0].promotionGate.seller;
  assert.equal(seller.status, "VERIFIED");
  assert.equal(seller.name, "Click 47");
  assert.ok(seller.evidenceReference.includes("2026-11-09"));
  const errors = validateProductPromotionGate(config.products[0], undefined, { requireMetadataDisclosure: false });
  assert.equal(errors.some(error => /seller details must be reverified/i.test(error)), false);
  assert.equal(errors.some(error => /brand authorization must be owner-confirmed/i.test(error)), false);
  assert.equal(errors.some(error => /commercial compensation relationship must be verified or owner-confirmed/i.test(error)), false);
  assert.ok(errors.some(error => /viewer-facing disclosure must be owner-approved/i.test(error)));
});

test("checked-in uppercase DIRECT_SALES_REVENUE is accepted as owner-confirmed Selar business revenue", () => {
  const config = JSON.parse(fs.readFileSync("config/products.json", "utf8"));
  const product = config.products.find(item => item.id === "wildlife-creators-vault");
  const errors = validateProductPromotionGate(product, undefined, { requireMetadataDisclosure: false });
  assert.equal(errors.some(error => /commercial compensation relationship/i.test(error)), false);
  assert.equal(errors.some(error => /compensation type must be/i.test(error)), false);
  assert.equal(errors.some(error => /Selar products must be classified/i.test(error)), false);
  assert.ok(errors.some(error => /viewer-facing disclosure must be owner-approved/i.test(error)));
  const metadata = { hasPaidPromotion: false };
  assert.ok(validateProductPromotionGate(product, metadata, { requireMetadataDisclosure: false })
    .some(error => /hasPaidPromotion must match/i.test(error)));
  metadata.hasPaidPromotion = true;
  assert.equal(validateProductPromotionGate(product, metadata, { requireMetadataDisclosure: false })
    .some(error => /hasPaidPromotion must match/i.test(error)), false);
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

test("no-material-connection cannot bypass the owner-confirmed URL relationship rule", () => {
  const fixture = verifiedFixture("none");
  assert.equal(fixture.metadata.hasPaidPromotion, false);
  assert.ok(validateProductPromotionGate(fixture.product, fixture.metadata)
    .some(error => /non-Selar products must be classified as affiliate promotions/i.test(error)));
  fixture.metadata.hasPaidPromotion = true;
  assert.ok(validateProductPromotionGate(fixture.product, fixture.metadata)
    .some(error => /hasPaidPromotion must match/i.test(error)));
});

test("Selar is direct business revenue and non-Selar product links are affiliate promotions", () => {
  const selar = verifiedFixture("direct_sales_revenue");
  selar.product.url = "https://selar.com/0u19v8u99l";
  selar.product.promotionGate.seller.sourceUrl = selar.product.url;
  selar.product.promotionGate.compensation.status = "OWNER_CONFIRMED";
  selar.product.promotionGate.compensation.verifiedAt = "2026-11-09";
  selar.product.promotionGate.compensation.evidenceReference = "owner-confirmed-own-Selar-business";
  selar.product.promotionGate.disclosure.text = "This product is sold through my own Selar business; purchases generate revenue for my business.";
  selar.product.promotionGate.disclosure.approvedAt = "2026-11-09T08:00:00Z";
  selar.metadata.hasPaidPromotion = true;
  selar.metadata.description = "Creator lesson. " + selar.product.promotionGate.disclosure.text;
  selar.metadata.promotionDisclosure = { status: "APPROVED", type: "direct_sales_revenue", text: selar.product.promotionGate.disclosure.text };
  assert.deepEqual(validateProductPromotionGate(selar.product, selar.metadata), []);

  const external = verifiedFixture("affiliate");
  external.product.url = "https://example-affiliate-store.test/product";
  external.product.promotionGate.seller.sourceUrl = external.product.url;
  assert.deepEqual(validateProductPromotionGate(external.product, external.metadata), []);

  const misclassifiedSelar = verifiedFixture("affiliate");
  misclassifiedSelar.product.url = "https://selar.com/0u19v8u99l";
  misclassifiedSelar.product.promotionGate.seller.sourceUrl = misclassifiedSelar.product.url;
  assert.ok(validateProductPromotionGate(misclassifiedSelar.product, misclassifiedSelar.metadata)
    .some(error => /Selar products must be classified as direct_sales_revenue/i.test(error)));

  const misclassifiedExternal = verifiedFixture("none");
  misclassifiedExternal.product.url = "https://serengeti.example/product";
  misclassifiedExternal.product.promotionGate.seller.sourceUrl = misclassifiedExternal.product.url;
  assert.ok(validateProductPromotionGate(misclassifiedExternal.product, misclassifiedExternal.metadata)
    .some(error => /non-Selar products must be classified as affiliate promotions/i.test(error)));
});

test("Selar host matching rejects deceptive suffixes and accepts genuine Selar subdomains", () => {
  const deceptive = verifiedFixture("affiliate");
  deceptive.product.url = "https://selar.com.attacker.example/product";
  deceptive.product.promotionGate.seller.sourceUrl = deceptive.product.url;
  assert.equal(validateProductPromotionGate(deceptive.product, deceptive.metadata).length, 0);

  const genuineSubdomain = verifiedFixture("direct_sales_revenue");
  genuineSubdomain.product.url = "https://shop.selar.com/product";
  genuineSubdomain.product.promotionGate.seller.sourceUrl = genuineSubdomain.product.url;
  genuineSubdomain.product.promotionGate.compensation.status = "OWNER_CONFIRMED";
  genuineSubdomain.product.promotionGate.compensation.verifiedAt = "2026-11-09";
  genuineSubdomain.product.promotionGate.compensation.evidenceReference = "owner-confirmed-direct-Selar-sales";
  genuineSubdomain.product.promotionGate.disclosure.text = "This is sold through my own Selar business.";
  genuineSubdomain.product.promotionGate.disclosure.approvedAt = "2026-11-09T08:00:00Z";
  genuineSubdomain.metadata.hasPaidPromotion = true;
  genuineSubdomain.metadata.description = "Creator lesson. " + genuineSubdomain.product.promotionGate.disclosure.text;
  genuineSubdomain.metadata.promotionDisclosure = {
    status: "APPROVED",
    type: "direct_sales_revenue",
    text: genuineSubdomain.product.promotionGate.disclosure.text
  };
  assert.deepEqual(validateProductPromotionGate(genuineSubdomain.product, genuineSubdomain.metadata), []);
});

test("product promotion gate rejects insecure or credential-bearing product URLs", () => {
  const insecure = verifiedFixture("affiliate");
  insecure.product.url = "http://example-affiliate-store.test/product";
  insecure.product.promotionGate.seller.sourceUrl = insecure.product.url;
  assert.ok(validateProductPromotionGate(insecure.product, insecure.metadata)
    .some(error => /valid HTTPS URL without embedded credentials/.test(error)));

  const credentialed = verifiedFixture("affiliate");
  credentialed.product.url = "https://seller:password@example-affiliate-store.test/product";
  credentialed.product.promotionGate.seller.sourceUrl = credentialed.product.url;
  assert.ok(validateProductPromotionGate(credentialed.product, credentialed.metadata)
    .some(error => /valid HTTPS URL without embedded credentials/.test(error)));
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
  assert.doesNotMatch(result.stderr, /brand authorization must be owner-confirmed/i);
  assert.doesNotMatch(result.stderr, /compensation relationship must be verified/i);
  assert.match(result.stderr, /viewer-facing disclosure must be owner-approved/i);
});

test("readiness JSON identifies product promotion gates as owner-controlled blockers", () => {
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    encoding: "utf8",
    env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "", SONICVHIBEZ_CHANNEL_ID: "" }
  });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  const blockers = report.blockers.filter(item => item.message.startsWith("Product promotion gate:"));
  assert.equal(blockers.some(item => /brand authorization must be owner-confirmed/i.test(item.message)), false);
  assert.equal(blockers.some(item => /commercial compensation relationship must be verified or owner-confirmed/i.test(item.message)), false);
  assert.ok(blockers.every(item => item.evidence.path === "config/products.json"));
  assert.ok(blockers.every(item => item.controlOwner === "external_owner_or_human_reviewer"));
});

test("Short 001 keeps the required title format and an explicit disclosure hold", () => {
  const brief = fs.readFileSync("content/short-001-wildlife-video-storytelling.md", "utf8");
  assert.match(brief, /^## YouTube title\n\S/m);
  assert.match(brief, /DISCLOSURE HOLD/i);
  assert.match(brief, /never Nature Frontiers/i);
});


test("new supplied Selar products have owner-confirmed brand authorization but remain blocked until disclosure is verified", () => {
  const config = JSON.parse(fs.readFileSync("config/products.json", "utf8"));
  const candidates = config.products.filter(product => product.status === "candidate");
  assert.equal(candidates.length, 2);
  for (const product of candidates) {
    assert.equal(product.promotionGate.seller.status, "VERIFIED");
    assert.equal(product.promotionGate.seller.name, "Click 47");
    const errors = validateProductPromotionGate(product, undefined, { requireMetadataDisclosure: false });
    assert.ok(!errors.some(error => /seller details must be reverified/i.test(error)));
    assert.ok(errors.some(error => /product must remain approved/i.test(error)));
    assert.equal(errors.some(error => /brand authorization must be owner-confirmed/i.test(error)), false);
    assert.equal(errors.some(error => /compensation relationship must be verified/i.test(error)), false);
    assert.ok(errors.some(error => /viewer-facing disclosure must be owner-approved/i.test(error)));
  }
});

test("YouTube channel monetization is not evidence of Selar compensation", () => {
  const config = JSON.parse(fs.readFileSync("config/products.json", "utf8"));
  const product = config.products[0];
  assert.equal(product.promotionGate.compensation.status, "OWNER_CONFIRMED");
  assert.match(product.promotionGate.compensation.note, /direct commercial relationship/i);
  assert.match(product.promotionGate.compensation.note, /Do not classify as an affiliate commission/i);

  const fixture = verifiedFixture("affiliate");
  fixture.product.promotionGate.compensation.type = "youtube_monetization";
  const invalidTypeErrors = validateProductPromotionGate(fixture.product, fixture.metadata);
  assert.ok(invalidTypeErrors.some(error => /compensation type must be affiliate, paid, direct_sales_revenue, or none/i.test(error)));

  fixture.product.promotionGate.compensation.type = "none";
  const mismatchErrors = validateProductPromotionGate(fixture.product, fixture.metadata);
  assert.ok(mismatchErrors.some(error => /hasPaidPromotion must match/i.test(error)));
});
