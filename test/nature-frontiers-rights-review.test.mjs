import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { recordNatureFrontiersRightsReview } from "../scripts/record-nature-frontiers-rights-review.mjs";

const CHECKS = {
  sourceLicenceReviewed: true,
  commercialUsePermitted: true,
  attributionRequirementsChecked: true,
  thirdPartyRightsChecked: true,
  platformUseAndEditingRestrictionsChecked: true
};

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nf-rights-review-"));
  fs.mkdirSync(path.join(root, "media/nature-frontiers"), { recursive: true });
  const bytes = Buffer.from("fixture media bytes");
  fs.writeFileSync(path.join(root, "media/nature-frontiers/clip.mp4"), bytes);
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");
  const register = {
    schemaVersion: "1.0.0",
    registerId: "nature-frontiers-media",
    brand: "Nature Frontiers",
    timezone: "Africa/Johannesburg",
    policy: { defaultPublicationState: "held", requireHumanApproval: true, allowAutomaticPublication: false, sourceOfTruth: "versioned-local-json" },
    assets: [{
    id: "nf-test-asset-001",
    mediaType: "video",
    source: { provider: "Local archive", url: "https://archive.example.org/clip", listingStatus: "verified", listingEvidence: [] },
    media: { sha256: hash },
    claims: [],
    inspection: { status: "not_inspected", inspectedBy: null, inspectedAt: null, visualNotes: "" },
    editorial: { status: "candidate" },
    localFile: { path: "media/nature-frontiers/clip.mp4", sha256: hash },
    approval: { status: "pending" },
    usage: { scheduled: false, published: false },
    rights: { reviewStatus: "not_assessed", additionalPermissionsStatus: "not_assessed", licenseEvidence: [] }
  }] };
  return { root, register, hash };
}

function review(hash, overrides = {}) {
  return {
    reviewer: "rights reviewer",
    reviewedAt: "2026-11-15T10:00:00+02:00",
    fileSha256: hash,
    reviewStatus: "cleared",
    additionalPermissionsStatus: "not_required",
    licenseEvidence: ["https://example.org/licence"],
    additionalPermissionsEvidence: [],
    permittedUsage: ["Instagram Reel"],
    checklist: { ...CHECKS },
    reviewNotes: "Commercial and platform use checked against the source licence and third-party rights.",
    ...overrides
  };
}

test("records hash-bound rights clearance with permitted usage but leaves approval pending", () => {
  const f = fixture();
  try {
    const result = recordNatureFrontiersRightsReview({
      register: f.register, assetId: "nf-test-asset-001", review: review(f.hash),
      root: f.root, now: Date.parse("2026-11-16T00:00:00Z")
    });
    const asset = f.register.assets[0];
    assert.equal(result.fileSha256, f.hash);
    assert.equal(asset.rights.reviewStatus, "cleared");
    assert.deepEqual(asset.rights.permittedUsage, ["Instagram Reel"]);
    assert.equal(asset.approval.status, "pending");
    assert.equal(asset.usage.scheduled, false);
    assert.equal(asset.usage.published, false);
    assert.equal(asset.rights.reviewHistory.length, 1);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("refuses rights clearance with incomplete checklist, missing licence evidence or usage scope", () => {
  const f = fixture();
  try {
    assert.throws(() => recordNatureFrontiersRightsReview({
      register: f.register, assetId: "nf-test-asset-001",
      review: review(f.hash, { checklist: { ...CHECKS, thirdPartyRightsChecked: false } }),
      root: f.root, now: Date.parse("2026-11-16T00:00:00Z")
    }), /every required rights checklist item/);
    assert.throws(() => recordNatureFrontiersRightsReview({
      register: f.register, assetId: "nf-test-asset-001",
      review: review(f.hash, { licenseEvidence: [] }),
      root: f.root, now: Date.parse("2026-11-16T00:00:00Z")
    }), /licence evidence/);
    assert.throws(() => recordNatureFrontiersRightsReview({
      register: f.register, assetId: "nf-test-asset-001",
      review: review(f.hash, { permittedUsage: [] }),
      root: f.root, now: Date.parse("2026-11-16T00:00:00Z")
    }), /permittedUsage scope/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("requires evidence when additional permissions are marked obtained", () => {
  const f = fixture();
  try {
    assert.throws(() => recordNatureFrontiersRightsReview({
      register: f.register, assetId: "nf-test-asset-001",
      review: review(f.hash, { additionalPermissionsStatus: "obtained" }),
      root: f.root, now: Date.parse("2026-11-16T00:00:00Z")
    }), /additional permissions require evidence/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("refuses rights review when local file bytes no longer match registered SHA-256", () => {
  const f = fixture();
  try {
    fs.writeFileSync(path.join(f.root, "media/nature-frontiers/clip.mp4"), "changed bytes");
    assert.throws(() => recordNatureFrontiersRightsReview({
      register: f.register, assetId: "nf-test-asset-001", review: review(f.hash),
      root: f.root, now: Date.parse("2026-11-16T00:00:00Z")
    }), /bytes changed/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("cannot clear rights for assets already approved, scheduled or published", () => {
  const f = fixture();
  try {
    f.register.assets[0].usage.scheduled = true;
    assert.throws(() => recordNatureFrontiersRightsReview({
      register: f.register, assetId: "nf-test-asset-001", review: review(f.hash),
      root: f.root, now: Date.parse("2026-11-16T00:00:00Z")
    }), /scheduled or published/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});
