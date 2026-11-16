import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metadata = JSON.parse(readFileSync(path.join(root, "content/short-004-california-spiny-lobster-metadata.json"), "utf8"));
const review = JSON.parse(readFileSync(path.join(root, "content/short-004-california-spiny-lobster-review-render.json"), "utf8"));

test("SHORT-004 NOAA source licence is verified without releasing final-output gates", () => {
  const evidence = metadata.sourceRightsEvidence;
  assert.equal(evidence.status, "SOURCE_LICENSE_VERIFIED");
  assert.equal(evidence.licenseType, "PUBLIC_DOMAIN_NOAA_BROLL");
  assert.match(evidence.sourcePageUrl, /^https:\/\/videos\.fisheries\.noaa\.gov\//);
  assert.equal(evidence.sourceSha256, review.sourceSha256);
  assert.equal(evidence.sourceArtifactId, review.sourceArtifactId);
  assert.equal(evidence.sourceWorkflowRunId, review.sourceWorkflowRunId);
  assert.equal(evidence.sourceFileHashRecomputed, true);
  assert.equal(evidence.openingSlateInspected, true);
  assert.equal(evidence.sourceAudioRemoved, true);
  assert.equal(evidence.thirdPartyCreditCardObservedInOpeningSlate, false);
  assert.equal(evidence.requiredAttributionForFinalMaster, "NOAA Fisheries / NOAA's Office of National Marine Sanctuaries");
  assert.equal(evidence.attributionStatus, "ADD_NOAA_FISHERIES_CREDIT_TO_FINAL_MASTER");
  assert.equal(review.sourceRightsVerified, true);
  assert.equal(review.sourceRightsEvidence.sourceSha256, review.sourceSha256);

  assert.equal(metadata.rightsConfirmed, false);
  assert.equal(metadata.rightsEvidenceReviewed, false);
  assert.equal(metadata.humanApproved, false);
  assert.equal(metadata.complianceReviewed, false);
  assert.equal(metadata.productionApproved, false);
  assert.equal(metadata.uploadAllowed, false);
  assert.equal(metadata.scheduleAllowed, false);
  assert.equal(metadata.narrationReview.rightsConfirmed, false);
  assert.equal(metadata.narrationReview.rightsEvidenceReviewed, false);
  assert.equal(metadata.visualReview.rightsConfirmed, false);
  assert.equal(metadata.visualReview.rightsEvidenceReviewed, false);
  assert.equal(review.rightsConfirmed, false);
  assert.equal(review.rightsEvidenceReviewed, false);
  assert.equal(review.humanApproved, false);
  assert.equal(review.complianceReviewed, false);
  assert.equal(review.productionApproved, false);
  assert.equal(review.uploadAllowed, false);
  assert.equal(review.scheduleAllowed, false);
});
