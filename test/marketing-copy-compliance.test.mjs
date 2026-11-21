import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

const DISCLOSURE = "This product is sold through my own Selar business; purchases generate revenue for my business.";
const PRODUCT = "Complete YouTube Wildlife Creator";
const SELAR_URL = "https://selar.com/0u19v8u99l";

function readText(path) {
  return fs.readFileSync(path, "utf8");
}
function productPositions(value) {
  const positions = [];
  for (let index = value.indexOf(PRODUCT); index >= 0; index = value.indexOf(PRODUCT, index + 1)) positions.push(index);
  return positions;
}
function assertDisclosurePrecedesEveryProductMention(value, label) {
  const positions = productPositions(value);
  assert.ok(positions.length > 0, label + ": product reference is required");
  for (const productIndex of positions) {
    const disclosureIndex = value.lastIndexOf(DISCLOSURE, productIndex);
    assert.ok(disclosureIndex >= 0 && disclosureIndex < productIndex,
      label + ": exact owner-approved disclosure must precede each product name");
  }
}

test("creator-education long-form script places the exact direct-sales disclosure before every CTA", () => {
  const script = readText("content/long-form-scripts.md");
  const voiceovers = script.split("\n").filter(line => line.startsWith("Advertisement."));
  assert.equal(voiceovers.length, 2);
  for (const line of voiceovers) {
    const disclosureIndex = line.indexOf(DISCLOSURE);
    const productIndex = line.indexOf(PRODUCT);
    const urlIndex = line.indexOf(SELAR_URL);
    assert.ok(disclosureIndex >= 0 && disclosureIndex < productIndex && productIndex < urlIndex);
  }
  assert.equal((script.match(/ADVERTISEMENT\n\nThis product is sold through my own Selar business/g) ?? []).length, 2);
  assert.ok(script.includes("AI-generated wildlife visuals are prohibited"));
  assert.ok(script.includes("Do not use stock/archive footage"));
  assert.ok(script.includes("internal-evaluation-only"));
  assert.ok(script.includes("No alternate narrator or paid upgrade is authorized"));
});

test("separate creator-education long-form script has compliant disclosure order and fail-closed production rights", () => {
  const script = readText("content/long-form-001-wildlife-story-script.md");
  assertDisclosurePrecedesEveryProductMention(script, "creator-education long-form script");
  assert.ok(script.includes("ADVERTISEMENT."));
  assert.ok(script.includes("original creator-captured wildlife footage"));
  assert.ok(script.includes("AI-generated wildlife visuals are prohibited"));
  assert.ok(script.includes("not commercially cleared"));
  assert.ok(script.includes("No alternate narrator or paid upgrade is authorized"));
  assert.ok(script.includes("Queue ID: `long-story-wildlife-footage`"));
  assert.ok(script.includes("NOT ASSIGNED"));
  assert.ok(!script.includes("Long-Form Video 001"));
  const queue = JSON.parse(readText("content/long-form-queue.json"));
  const draft = queue.items.find(item => item.id === "long-story-wildlife-footage");
  assert.ok(draft);
  assert.equal(draft.scriptPath, "content/long-form-001-wildlife-story-script.md");
  assert.equal(draft.status, "SCRIPT_DRAFT");
  assert.equal(Object.hasOwn(draft, "publicationCyclePosition"), false);
});

test("Episode 001 and 002 metadata drafts disclose direct sales before the product CTA and exclude NOAA stock claims", () => {
  for (const path of [
    "content/episode-001-upload-metadata-draft.md",
    "content/episode-002-upload-metadata-draft.md"
  ]) {
    const draft = readText(path);
    assertDisclosurePrecedesEveryProductMention(draft, path);
    assert.ok(draft.includes("ADVERTISEMENT"));
    assert.ok(draft.includes(SELAR_URL));
    assert.ok(draft.includes("original creator-captured production footage"));
    assert.ok(!draft.includes("uses illustrative marine B-roll"));
    assert.ok(!draft.includes("NOAA Fisheries"));
  }
});

test("Short 001 remains explicitly held with its unverified disclosure before the draft CTA", () => {
  const metadata = JSON.parse(readText("content/short-001-metadata.example.json"));
  assert.equal(metadata.hasPaidPromotion, true);
  assert.equal(metadata.promotionDisclosure.status, "UNVERIFIED");
  assert.equal(metadata.visibility, "private");
  assert.equal(metadata.rightsConfirmed, false);
  assert.equal(metadata.complianceReviewed, false);
  assertDisclosurePrecedesEveryProductMention(metadata.description, "Short 001 description");
  assert.ok(metadata.description.indexOf("DISCLOSURE HOLD") < metadata.description.indexOf(PRODUCT));
  assert.ok(metadata.description.indexOf("ADVERTISEMENT — DRAFT ONLY") < metadata.description.indexOf(PRODUCT));
  assert.ok(metadata.description.includes("not yet approved for this draft"));
});

test("Short 002 retains its approved direct-sales promotion with disclosure before CTA but stays private and unreviewed", () => {
  const metadata = JSON.parse(readText("content/short-002-metadata.example.json"));
  assert.equal(metadata.hasPaidPromotion, true);
  assert.equal(metadata.promotionDisclosure.status, "APPROVED");
  assert.equal(metadata.promotionDisclosure.type, "direct_sales_revenue");
  assert.equal(metadata.promotionDisclosure.text, DISCLOSURE);
  assertDisclosurePrecedesEveryProductMention(metadata.description, "Short 002 description");
  assert.ok(metadata.description.indexOf("ADVERTISEMENT") < metadata.description.indexOf(DISCLOSURE));
  assert.ok(metadata.description.indexOf(DISCLOSURE) < metadata.description.indexOf(PRODUCT));
  assert.ok(metadata.description.indexOf(PRODUCT) < metadata.description.indexOf(SELAR_URL));
  assert.equal(metadata.visibility, "private");
  assert.equal(metadata.rightsConfirmed, false);
  assert.equal(metadata.complianceReviewed, false);
  assert.equal(metadata.channelId, "UCSlkuPfHH78oGC1o418HV4w");
});

test("Nile crocodile documentary is non-commercial and prohibits unapproved wildlife visuals", () => {
  const manifest = JSON.parse(readText("content/long-form-render-manifest.json"));
  const metadata = readText("content/long-form-001-youtube-metadata-draft.md");
  const script = readText("content/drafts/long-form-001-two-eyes-above-water.md");
  assert.equal(manifest.hasPaidPromotion, false);
  assert.ok(!metadata.includes(SELAR_URL));
  assert.ok(!metadata.includes("ADVERTISEMENT"));
  assert.ok(metadata.includes("hasPaidPromotion=false"));
  assert.ok(metadata.includes("no product CTA"));
  assert.ok(metadata.includes("original creator-captured wildlife footage"));
  assert.ok(metadata.includes("AI-generated wildlife visuals"));
  assert.ok(metadata.includes("not permitted substitutes"));
  assert.ok(script.includes("hasPaidPromotion=false"));
  assert.ok(script.includes("No product CTA, Selar URL"));
  assert.ok(script.includes("Original creator-captured wildlife footage only"));
  assert.ok(script.includes("AI-generated wildlife visuals") && script.includes("prohibited"));
  assert.ok(script.includes("stock/archive footage"));
  assert.ok(script.includes("commercially prohibited by the provider's written determination"));
  assert.ok(script.includes("No alternate voice or paid upgrade is authorized"));
  assert.ok(!/AI reconstruction if synthetic|labelled reconstruction|real footage or labelled reconstruction/i.test(script));
});

test("approved Selar campaign is bound to exact owner-approved wording and remains draft-only", () => {
  const config = JSON.parse(readText("config/campaigns.json"));
  const campaign = config.campaigns.find(item => item.id === "selar-wildlife-vault");
  assert.ok(campaign);
  assert.equal(campaign.destinationUrl, SELAR_URL);
  assert.equal(campaign.disclosureText, DISCLOSURE);
  assert.equal(campaign.disclosureApprovalStatus, "OWNER_APPROVED");
  assert.equal(campaign.status, "ACTIVE_FOR_DRAFTS_ONLY");
  assert.equal(campaign.approval.destinationVersion,
    crypto.createHash("sha256").update(SELAR_URL + "\n" + DISCLOSURE).digest("hex"));
  assert.ok(config.campaigns.filter(item => item.id !== "selar-wildlife-vault").every(item => item.status === "INACTIVE"));
});
