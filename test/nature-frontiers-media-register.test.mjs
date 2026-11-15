import test from "node:test";
import assert from "node:assert/strict";
import { validateMediaRegister } from "../scripts/validate-nature-frontiers-media-register.mjs";

const base = {
  schemaVersion: "1.0.0",
  registerId: "nature-frontiers-media",
  brand: "Nature Frontiers",
  timezone: "Africa/Johannesburg",
  policy: {
    defaultPublicationState: "held",
    requireHumanApproval: true,
    allowAutomaticPublication: false,
    sourceOfTruth: "versioned-local-json"
  },
  assets: [{
    id: "nf-test-asset-001",
    mediaType: "video",
    source: {
      provider: "Pexels",
      assetId: "123",
      url: "https://www.pexels.com/video/example-123/",
      listingStatus: "verified",
      listingEvidence: ["https://www.pexels.com/video/example-123/"]
    },
    localFile: null,
    media: { sha256: null },
    claims: [],
    rights: {
      reviewStatus: "not_assessed",
      additionalPermissionsStatus: "not_assessed",
      licenseEvidence: []
    },
    inspection: { status: "not_inspected", inspectedBy: null, inspectedAt: null, visualNotes: "" },
    editorial: { status: "candidate" },
    approval: { status: "pending", approvedBy: null, approvedAt: null, approvedFileSha256: null, approvedUsage: [] },
    usage: { scheduled: false, published: false, platformPostIds: [] }
  }]
};

test("accepts provider-neutral local records without API credentials or network access", () => {
  assert.deepEqual(validateMediaRegister(base), []);
});


test("does not require a provider asset ID, API key, or remote metadata", () => {
  const value = structuredClone(base);
  delete value.assets[0].source.assetId;
  value.assets[0].source.provider = "Local archive";
  value.assets[0].source.url = "https://archive.example.org/wildlife/clip-01";
  assert.deepEqual(validateMediaRegister(value), []);
});

test("rejects duplicate stable asset IDs", () => {
  const value = structuredClone(base);
  value.assets.push(structuredClone(value.assets[0]));
  assert.ok(validateMediaRegister(value).some(error => error.includes("duplicate asset ID")));
});

test("rejects insecure source URLs and path traversal", () => {
  const value = structuredClone(base);
  value.assets[0].source.url = "http://example.com/video";
  value.assets[0].localFile = { path: "../../outside.mp4", sha256: "a".repeat(64) };
  const errors = validateMediaRegister(value);
  assert.ok(errors.some(error => error.includes("source URL must be HTTPS")));
  assert.ok(errors.some(error => error.includes("must not escape the project")));
});

test("prevents approval when rights or complete visual inspection are missing", () => {
  const value = structuredClone(base);
  value.assets[0].approval.status = "approved";
  value.assets[0].approval.approvedBy = "reviewer";
  value.assets[0].approval.approvedAt = "2026-11-15T10:00:00+02:00";
  value.assets[0].approval.approvedUsage = ["Instagram Reel"];
  const errors = validateMediaRegister(value);
  assert.ok(errors.some(error => error.includes("rights are cleared")));
  assert.ok(errors.some(error => error.includes("full visual inspection")));
  assert.ok(errors.some(error => error.includes("exact local file SHA-256")));
});

test("requires a matching file hash, reviewer, evidence and usage scope for approval", () => {
  const value = structuredClone(base);
  const hash = "b".repeat(64);
  value.assets[0].localFile = { path: "media/nf-test.mp4", sha256: hash };
  value.assets[0].media.sha256 = hash;
  value.assets[0].rights = {
    reviewStatus: "cleared",
    additionalPermissionsStatus: "not_required",
    licenseEvidence: ["https://example.com/license-evidence"],
    permittedUsage: ["Instagram Reel"],
    reviewedBy: "rights reviewer",
    reviewedAt: "2026-11-15T10:00:00+02:00"
  };
  value.assets[0].inspection = {
    status: "complete",
    inspectedBy: "editor",
    inspectedAt: "2026-11-15T10:05:00+02:00",
    inspectedFileSha256: hash,
    visualNotes: "Full clip inspected; species and visible behaviour documented."
  };
  value.assets[0].approval = {
    status: "approved",
    approvedBy: "owner",
    approvedAt: "2026-11-15T10:10:00+02:00",
    approvedFileSha256: hash,
    approvedUsage: ["Instagram Reel"]
  };
  assert.deepEqual(validateMediaRegister(value), []);
});


test("does not approve listing-only species or unverified location claims", () => {
  const value = structuredClone(base);
  const hash = "c".repeat(64);
  value.assets[0].localFile = { path: "media/nf-test.mp4", sha256: hash };
  value.assets[0].media.sha256 = hash;
  value.assets[0].rights = {
    reviewStatus: "cleared",
    additionalPermissionsStatus: "not_required",
    licenseEvidence: ["https://example.com/license-evidence"],
    permittedUsage: ["Instagram Reel"],
    reviewedBy: "rights reviewer",
    reviewedAt: "2026-11-15T10:00:00+02:00"
  };
  value.assets[0].inspection = {
    status: "complete",
    inspectedBy: "editor",
    inspectedAt: "2026-11-15T10:05:00+02:00",
    visualNotes: "Full clip inspected; species and visible behaviour documented."
  };
  value.assets[0].claims = [{ type: "location", value: "South Africa", status: "unverified" }];
  value.assets[0].approval = {
    status: "approved",
    approvedBy: "owner",
    approvedAt: "2026-11-15T10:10:00+02:00",
    approvedFileSha256: hash,
    approvedUsage: ["Instagram Reel"]
  };
  assert.ok(validateMediaRegister(value).some(error => error.includes("factual claims remain listing-only or unverified")));
  value.assets[0].claims[0].status = "verified";
  value.assets[0].rights.additionalPermissionsStatus = "not_assessed";
  assert.ok(validateMediaRegister(value).some(error => error.includes("explicit resolution of additional permissions")));
});

test("rejects scheduled or published records without approval and publication receipts", () => {
  const value = structuredClone(base);
  value.assets[0].usage.scheduled = true;
  value.assets[0].usage.published = true;
  const errors = validateMediaRegister(value);
  assert.ok(errors.some(error => error.includes("without exact-asset human approval")));
  assert.ok(errors.some(error => error.includes("remote platform post ID receipt")));
});

test("keeps automatic publishing disabled as an invariant", () => {
  const value = structuredClone(base);
  value.policy.allowAutomaticPublication = true;
  assert.ok(validateMediaRegister(value).some(error => error.includes("automatic publication must remain disabled")));
});


test("malformed nested arrays produce validation errors instead of crashing", () => {
  const value = structuredClone(base);
  value.assets[0].source.listingEvidence = { url: "https://example.com/evidence" };
  value.assets[0].rights.licenseEvidence = { url: "https://example.com/license" };
  value.assets[0].claims = { type: "species", value: "lion", status: "verified" };
  const errors = validateMediaRegister(value);
  assert.ok(errors.some(error => error.includes("listingEvidence must be an array")));
  assert.ok(errors.some(error => error.includes("rights.licenseEvidence must be an array")));
  assert.ok(errors.some(error => error.includes("claims must be an array")));
});

test("rejects impossible calendar dates even when Date.parse normalizes them", () => {
  const value = structuredClone(base);
  const hash = "d".repeat(64);
  value.assets[0].localFile = { path: "media/nf-test.mp4", sha256: hash };
  value.assets[0].media.sha256 = hash;
  value.assets[0].rights = {
    reviewStatus: "cleared",
    additionalPermissionsStatus: "not_required",
    licenseEvidence: ["https://example.com/license-evidence"],
    permittedUsage: ["Instagram Reel"],
    reviewedBy: "rights reviewer",
    reviewedAt: "2026-02-30T10:00:00+02:00"
  };
  const errors = validateMediaRegister(value);
  assert.ok(errors.some(error => error.includes("valid non-future timezone-qualified reviewedAt")));
});

test("verified factual claims require evidence URLs rather than an unsupported status flag", () => {
  const value = structuredClone(base);
  value.assets[0].claims = [{ type: "species", value: "lion", status: "verified" }];
  assert.ok(validateMediaRegister(value).some(error => error.includes("verified factual claims require one or more HTTPS evidenceUrls")));
  value.assets[0].claims[0].evidenceUrls = ["https://trusted.example.org/species"];
  assert.ok(!validateMediaRegister(value).some(error => error.includes("verified factual claims require one or more HTTPS evidenceUrls")));
});


test("malformed claims remain a validation error even when approval is asserted", () => {
  const value = structuredClone(base);
  value.assets[0].claims = { type: "species", value: "lion", status: "verified" };
  value.assets[0].approval.status = "approved";
  assert.ok(validateMediaRegister(value).some(error => error.includes("claims must be an array")));
});

test("rejects empty or non-string remote publication receipts", () => {
  const value = structuredClone(base);
  value.assets[0].usage.published = true;
  value.assets[0].approval.status = "approved";
  value.assets[0].usage.platformPostIds = ["post-123", ""];
  assert.ok(validateMediaRegister(value).some(error => error.includes("platformPostIds entries must be non-empty strings")));
  value.assets[0].usage.platformPostIds = [123];
  assert.ok(validateMediaRegister(value).some(error => error.includes("platformPostIds entries must be non-empty strings")));
});
