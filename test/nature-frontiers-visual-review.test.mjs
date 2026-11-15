import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { recordNatureFrontiersReview } from "../scripts/record-nature-frontiers-visual-review.mjs";
import { validateMediaRegister } from "../scripts/validate-nature-frontiers-media-register.mjs";

const checks = { watchedEntireClip: true, checkedBeginningMiddleEnd: true, checkedAudio: true, checkedEditsAndContext: true, checkedForMisleadingRepresentation: true };
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nf-review-"));
  fs.mkdirSync(path.join(root, "media/nature-frontiers"), { recursive: true });
  const bytes = Buffer.from("fixture media bytes");
  fs.writeFileSync(path.join(root, "media/nature-frontiers/clip.mp4"), bytes);
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  const register = {
    schemaVersion: "1.0.0", registerId: "nature-frontiers-media", brand: "Nature Frontiers", timezone: "Africa/Johannesburg",
    policy: { defaultPublicationState: "held", requireHumanApproval: true, allowAutomaticPublication: false, sourceOfTruth: "versioned-local-json" },
    assets: [{
      id: "nf-test-asset", mediaType: "video",
      source: { provider: "test", url: "https://example.com/asset", listingStatus: "unverified", listingEvidence: [] },
      localFile: { path: "media/nature-frontiers/clip.mp4", sha256: sha, byteSize: bytes.length },
      media: { sha256: sha, byteSize: bytes.length },
      claims: [{ type: "species", value: "giraffe", status: "listing_only" }, { type: "location", value: "South Africa", status: "unverified" }],
      rights: { reviewStatus: "not_assessed", additionalPermissionsStatus: "not_assessed", licenseEvidence: [], reviewedBy: null, reviewedAt: null },
      inspection: { status: "not_inspected", inspectedBy: null, inspectedAt: null, visualNotes: "" },
      approval: { status: "pending", approvedBy: null, approvedAt: null, approvedFileSha256: null, approvedUsage: [] },
      usage: { scheduled: false, published: false, platformPostIds: [] }
    }]
  };
  const review = {
    reviewer: "Editorial reviewer", reviewedAt: "2026-11-15T18:00:00+02:00", fileSha256: sha,
    checklist: { ...checks }, visualNotes: "Observed the full clip; animal visible throughout, with no unsupported location inference.",
    claims: [
      { type: "species", value: "giraffe", status: "verified", evidenceUrls: ["https://example.org/species-reference"] },
      { type: "location", value: "South Africa", status: "unverified", evidenceUrls: [] }
    ]
  };
  return { root, register, review, sha };
}

test("records complete visual inspection against exact file hash without clearing rights or approval", () => {
  const { root, register, review, sha } = fixture();
  const result = recordNatureFrontiersReview({ register, assetId: "nf-test-asset", review, root, now: Date.parse("2026-11-15T19:00:00+02:00") });
  const asset = register.assets[0];
  assert.equal(result.fileSha256, sha);
  assert.equal(asset.inspection.status, "complete");
  assert.equal(asset.inspection.inspectedFileSha256, sha);
  assert.equal(asset.reviewHistory.length, 1);
  assert.equal(asset.claims[0].status, "verified");
  assert.deepEqual(asset.claims[0].evidenceUrls, ["https://example.org/species-reference"]);
  assert.equal(asset.claims[1].status, "unverified");
  assert.equal(asset.rights.reviewStatus, "not_assessed");
  assert.equal(asset.approval.status, "pending");
  assert.equal(asset.usage.scheduled, false);
  assert.deepEqual(validateMediaRegister(register, { now: Date.parse("2026-11-15T19:00:00+02:00") }), []);
});

test("rejects stale hash and changed local bytes", () => {
  const a = fixture();
  assert.throws(() => recordNatureFrontiersReview({ register: a.register, assetId: "nf-test-asset", review: { ...a.review, fileSha256: "0".repeat(64) }, root: a.root }), /does not match/);
  fs.writeFileSync(path.join(a.root, "media/nature-frontiers/clip.mp4"), "replacement bytes");
  assert.throws(() => recordNatureFrontiersReview({ register: a.register, assetId: "nf-test-asset", review: a.review, root: a.root }), /bytes changed/);
});

test("requires every inspection check and explicit disposition for every registered claim", () => {
  const a = fixture();
  assert.throws(() => recordNatureFrontiersReview({ register: a.register, assetId: "nf-test-asset", review: { ...a.review, checklist: { ...checks, checkedAudio: false } }, root: a.root }), /checklist/);
  assert.throws(() => recordNatureFrontiersReview({ register: a.register, assetId: "nf-test-asset", review: { ...a.review, claims: a.review.claims.slice(0, 1) }, root: a.root }), /every registered claim/);
});

test("verified claims require HTTPS evidence and inspection cannot be changed after approval or scheduling", () => {
  const a = fixture();
  const badClaims = a.review.claims.map(item => ({ ...item }));
  badClaims[0].evidenceUrls = ["http://example.org/source"];
  assert.throws(() => recordNatureFrontiersReview({ register: a.register, assetId: "nf-test-asset", review: { ...a.review, claims: badClaims }, root: a.root }), /HTTPS evidence/);
  a.register.assets[0].approval.status = "approved";
  assert.throws(() => recordNatureFrontiersReview({ register: a.register, assetId: "nf-test-asset", review: a.review, root: a.root }), /after an approval decision/);
  a.register.assets[0].approval.status = "pending";
  a.register.assets[0].usage.scheduled = true;
  assert.throws(() => recordNatureFrontiersReview({ register: a.register, assetId: "nf-test-asset", review: a.review, root: a.root }), /after scheduling/);
});
