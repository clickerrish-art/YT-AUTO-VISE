import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metadata = JSON.parse(readFileSync(path.join(root, "content/short-004-california-spiny-lobster-metadata.json"), "utf8"));
const review = JSON.parse(readFileSync(path.join(root, "content/short-004-california-spiny-lobster-review-render.json"), "utf8"));

test("SHORT-004 NOAA rights evidence is source-bound and publishing remains fail-closed", () => {
  assert.equal(metadata.rightsConfirmed, true);
  assert.equal(metadata.rightsEvidenceReviewed, true);
  assert.equal(review.rightsConfirmed, true);
  assert.equal(review.rightsEvidenceReviewed, true);

  assert.equal(metadata.rightsEvidence.sourceSha256, review.sourceSha256);
  assert.equal(metadata.rightsEvidence.sourceArtifactId, review.sourceArtifactId);
  assert.equal(metadata.rightsEvidence.sourceWorkflowRunId, review.sourceWorkflowRunId);
  assert.equal(metadata.rightsEvidence.licenseType, "PUBLIC_DOMAIN_NOAA_BROLL");
  assert.match(metadata.rightsEvidence.sourcePageUrl, /^https:\/\/videos\.fisheries\.noaa\.gov\//);
  assert.equal(metadata.rightsEvidence.sourceAudioRemoved, true);
  assert.equal(metadata.rightsEvidence.requiredAttributionForFinalMaster, "NOAA Fisheries / NOAA's Office of National Marine Sanctuaries");
  assert.equal(metadata.requiredAttribution, metadata.rightsEvidence.requiredAttributionForFinalMaster);
  assert.equal(metadata.rightsEvidence.attributionStatus, "ADD_NOAA_FISHERIES_CREDIT_TO_FINAL_MASTER");

  assert.equal(metadata.humanApproved, false);
  assert.equal(metadata.complianceReviewed, false);
  assert.equal(metadata.productionApproved, false);
  assert.equal(metadata.uploadAllowed, false);
  assert.equal(metadata.scheduleAllowed, false);
  assert.equal(review.humanApproved, false);
  assert.equal(review.complianceReviewed, false);
  assert.equal(review.productionApproved, false);
  assert.equal(review.uploadAllowed, false);
  assert.equal(review.scheduleAllowed, false);
});
