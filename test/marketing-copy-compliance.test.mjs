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
  assert.ok(script.includes("AI-generated wildlife visuals are not permitted substitutes"));
  assert.ok(script.includes("Other stock/archive sources and AI-generated wildlife visuals are not permitted substitutes"));
  assert.ok(script.includes("internal-evaluation-only"));
  assert.ok(script.includes("The owner selected Speechma Andrew (English US male) for a manual, zero-cost browser audition only"));
  assert.ok(script.toLowerCase().includes("cannot be publicly redistributed for branded projects"));
});

test("separate creator-education long-form script has compliant disclosure order and fail-closed production rights", () => {
  const script = readText("content/long-form-001-wildlife-story-script.md");
  assertDisclosurePrecedesEveryProductMention(script, "creator-education long-form script");
  assert.ok(script.includes("ADVERTISEMENT."));
  assert.ok(script.includes("original creator-captured wildlife footage"));
  assert.ok(script.includes("AI-generated wildlife visuals are prohibited"));
  assert.ok(script.includes("cannot be used commercially"));
  assert.ok(script.includes("Speechma Andrew (English, United States, male standard voice) is selected for a manual zero-cost browser audition only"));
  assert.ok(script.toLowerCase().includes("cannot be publicly redistributed for branded projects"));
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

test("canonical long-form metadata keeps the crocodile documentary non-commercial and creator-education disclosure separate", () => {
  const crocodile = readText("content/long-form-001-youtube-metadata-draft.md");
  const creatorEducation = readText("content/long-form-002-youtube-metadata-draft.md");
  assert.ok(!crocodile.includes(SELAR_URL));
  assert.ok(!crocodile.includes("ADVERTISEMENT"));
  assert.ok(crocodile.includes("hasPaidPromotion=false"));
  assert.ok(crocodile.includes("no product CTA"));
  assertDisclosurePrecedesEveryProductMention(creatorEducation, "canonical long-form 002 metadata");
  assert.ok(creatorEducation.includes("ADVERTISEMENT"));
  assert.ok(creatorEducation.includes(SELAR_URL));
  assert.ok(creatorEducation.includes("hasPaidPromotion=true"));
  assert.ok(creatorEducation.includes("original creator-captured wildlife footage only"));
  assert.ok(!creatorEducation.includes("Qualifying Pexels/Pixabay video footage may be used"));
  for (const [path, canonicalPath] of [
    ["content/episode-001-upload-metadata-draft.md", "content/long-form-002-youtube-metadata-draft.md"],
    ["content/episode-002-upload-metadata-draft.md", "content/drafts/faceless-wildlife-workflow-metadata-draft.md"]
  ]) {
    const legacy = readText(path);
    assert.ok(legacy.includes("superseded") || legacy.includes("unassigned"));
    assert.ok(legacy.includes(canonicalPath));
    assert.ok(!legacy.includes(SELAR_URL), path + " must remain a historical pointer, not a second active metadata source");
    assert.ok(!legacy.includes("ADVERTISEMENT"));
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
  assert.ok(/not yet owner-verified/i.test(metadata.description));
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

test("Nile crocodile documentary is non-commercial and limits AI visuals to seven owner-approved clips", () => {
  const manifest = JSON.parse(readText("content/long-form-render-manifest.json"));
  const aiEvidence = JSON.parse(readText("content/ai-generation-evidence/long-form-001.json"));
  const metadata = readText("content/long-form-001-youtube-metadata-draft.md");
  const script = readText("content/drafts/long-form-001-two-eyes-above-water.md");
  assert.equal(manifest.hasPaidPromotion, false);
  assert.equal(manifest.narrationRightsStatus, "NOT_GENERATED_PENDING_OWNER_APPROVED_COMMERCIAL_VOICE");
  assert.equal(manifest.narrationPublicBrandedDistributionAllowed, false);
  assert.equal(manifest.narrationCommercialUseAllowed, false);
  assert.equal(manifest.narrationProductionUseAllowed, false);
  assert.ok(manifest.narrationRestrictionSummary.includes("No production narration file or commercial-use approval is recorded"));
  assert.equal(manifest.selectedNarratorForReview.name, "Andrew");
  assert.equal(manifest.selectedNarratorForReview.ownerSelectionStatus, "SELECTED_FOR_ZERO_COST_MANUAL_BROWSER_AUDITION_ONLY");
  assert.equal(manifest.selectedNarratorForReview.commercialUseAllowed, true);
  assert.equal(manifest.selectedNarratorForReview.productionApproved, false);
  assert.equal(manifest.selectedNarratorForReview.publicationAuthorized, false);
  assert.equal(manifest.ownerApprovalEvidencePath, "content/ai-generation-evidence/long-form-001.json");
  assert.equal(manifest.ownerApprovalEvidenceType, "OWNER_ATTESTATION_ONLY");
  assert.equal(aiEvidence.status, "OWNER_ATTESTED_GENERATED_CLIPS_PENDING_INGEST");
  assert.equal(aiEvidence.ownerApproval.clipCount, 7);
  assert.equal(aiEvidence.ownerApproval.sourceFilesAccessibleInCurrentWorkspace, false);
  assert.equal(aiEvidence.technicalValidationStatus, "NOT_DONE");
  assert.equal(aiEvidence.rightsReviewStatus, "PENDING");
  assert.equal(aiEvidence.humanVisualReview, "NOT_DONE");
  assert.ok(!metadata.includes(SELAR_URL));
  assert.ok(!metadata.includes("ADVERTISEMENT"));
  assert.ok(metadata.includes("hasPaidPromotion=false"));
  assert.ok(metadata.includes("no product CTA"));
  assert.ok(metadata.includes("exactly seven AI-generated wildlife clips explicitly approved by the owner"));
  assert.ok(metadata.includes("synthetic illustrations, not genuine camera-captured wildlife footage"));
  assert.ok(metadata.includes("This documentary contains AI-generated wildlife visuals."));
  assert.ok(metadata.includes("Do not use Pexels/Pixabay, other stock/archive footage or additional AI-generated wildlife shots."));
  assert.ok(script.includes("hasPaidPromotion=false"));
  assert.ok(script.includes("No product CTA, Selar URL"));
  assert.ok(script.includes("seven owner-approved AI-generated source clips are the sole permitted wildlife-visual exception"));
  assert.ok(script.includes("source MP4s are not yet ingested into the current workspace"));
  assert.ok(script.includes("Do not describe them as genuine wildlife footage"));
  assert.ok(script.includes("Clearly disclose AI-generated wildlife visuals"));
  assert.ok(script.includes("No stock/archive footage"));
  assert.ok(script.includes("commercially prohibited by the provider's written determination"));
  assert.ok(script.toLowerCase().includes("cannot be publicly redistributed for branded projects"));
  assert.ok(script.includes("selected Speechma Andrew"));
  assert.ok(script.includes("zero-cost browser audition only"));
  assert.ok(script.includes("No audition audio has been generated"));
  assert.ok(script.includes("No narrator is approved for production."));
  assert.ok(script.includes("No paid upgrade is authorized."));
  assert.ok(metadata.includes("selected Speechma Andrew"));
  assert.ok(metadata.includes("zero-cost browser audition only"));
  assert.ok(metadata.includes("No audition audio has been generated"));
  assert.ok(metadata.includes("No narrator is approved for production"));
  const voiceConfig = JSON.parse(readText("config/narration-voice-candidates.json"));
  assert.equal(voiceConfig.ownerDecision.selectedAlternative.provider, "Speechma");
  assert.equal(voiceConfig.ownerDecision.selectedAlternative.name, "Andrew");
  assert.equal(voiceConfig.ownerDecision.selectedAlternative.voiceId, null);
  assert.equal(voiceConfig.ownerDecision.selectedAlternative.productionApproved, false);
  assert.equal(voiceConfig.ownerDecision.selectedAlternative.commercialUseAllowed, true);
  assert.equal(voiceConfig.ownerDecision.selectionStatus, "OWNER_SELECTED_SPEECHMA_ANDREW_BROWSER_AUDITION_PENDING");
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
