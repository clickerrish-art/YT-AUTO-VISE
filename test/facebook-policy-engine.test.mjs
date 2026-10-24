import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { evaluateFinalFacebookPayload, FACEBOOK_POLICY_RULE_VERSION, APPROVED_SELLAR_URL } from "../scripts/facebook-policy-engine.mjs";

const hash = value => crypto.createHash("sha256").update(value).digest("hex");
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-policy-"));
  const media = Buffer.from("licensed media fixture");
  const license = Buffer.from("commercial and social media license evidence fixture");
  fs.writeFileSync(path.join(root, "asset.bin"), media);
  fs.writeFileSync(path.join(root, "license.txt"), license);
  const payload = {
    destination: "nature_frontiers_facebook",
    destinationPageId: "123456789012345",
    slotId: "nf-2026-10-25-0800",
    caption: "A short educational note about respecting wildlife distance and observing without disturbance.",
    claims: [],
    links: [],
    commercial: false,
    media: [{
      id: "asset-1", path: "asset.bin", sha256: hash(media), syntheticOrAltered: false,
      representationKnown: true,
      rightsRecord: { evidencePath: "license.txt", evidenceSha256: hash(license), source: "Documented original asset",
        license: "Commercial social media use", commercialUse: true, socialMediaUse: true,
        provenanceVerified: true, syntheticOrAlteredKnown: true, attributionRequired: false }
    }]
  };
  return { root, payload, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
const options = root => ({
  expectedPageId: "123456789012345", expectedPageName: "Nature Frontiers", evidenceRoot: root,
  history: [], allowedDomains: [], allowedCampaignIds: ["selar-wildlife-vault"],
  approvedDestinations: [], now: "2026-10-24T12:00:00.000Z",
  fetchImpl: async url => ({ ok: true, status: 200, url: String(url) })
});

test("policy returns the required structured decision and accepts only a complete safe fixture", async () => {
  const f = fixture();
  try {
    const result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, true, JSON.stringify(result.blockers));
    assert.equal(result.policyRuleVersion, FACEBOOK_POLICY_RULE_VERSION);
    assert.match(result.contentFingerprint, /^[a-f0-9]{64}$/);
    assert.equal(result.mediaFingerprints[0].passed, true);
    assert.equal(result.duplicateCheck.passed, true);
    for (const key of ["blockers","warnings","sourceChecks","rightsChecks","disclosureChecks","destinationChecks","duplicateCheck","contentFingerprint","mediaFingerprints","checkedAt","reason"]) assert.ok(key in result, key);
  } finally { f.cleanup(); }
});

test("missing rights evidence and changed media checksum fail closed", async () => {
  const f = fixture();
  try {
    f.payload.media[0].rightsRecord.license = "";
    const result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, false);
    assert.match(result.blockers.join(" "), /rights/i);
    f.payload.media[0].rightsRecord.license = "Commercial social media use";
    f.payload.media[0].sha256 = "a".repeat(64);
    const changed = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(changed.eligible, false);
  } finally { f.cleanup(); }
});

test("unsourced factual claims and unreachable or redirected sources block", async () => {
  const f = fixture();
  try {
    f.payload.caption = "Research shows this species population increased by 40 percent.";
    f.payload.claims = [{ text: "Population increased by 40 percent", sourceUrls: ["https://example.org/report"], verified: true, sourceSupportsClaim: true }];
    const badAuthority = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(badAuthority.eligible, false);
    f.payload.claims[0].sourceUrls = ["https://sanbi.org/report"];
    const unreachable = await evaluateFinalFacebookPayload(f.payload, { ...options(f.root), fetchImpl: async () => { throw new Error("offline"); } });
    assert.equal(unreachable.eligible, false);
    assert.match(unreachable.blockers.join(" "), /source/i);
  } finally { f.cleanup(); }
});

test("engagement bait, graphic wildlife and sensitive location content block", async () => {
  const f = fixture();
  try {
    for (const caption of [
      "Like and share this to win a prize.",
      "A graphic injury scene shows bloodied wildlife.",
      "Exact GPS coordinates of an endangered species nest are included."
    ]) {
      f.payload.caption = caption;
      const result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
      assert.equal(result.eligible, false, caption);
    }
  } finally { f.cleanup(); }
});

test("affiliate promotion requires visible disclosure, allowlisted campaign and exact Selar URL", async () => {
  const f = fixture();
  try {
    f.payload.commercial = true;
    f.payload.campaignId = "selar-wildlife-vault";
    f.payload.links = [APPROVED_SELLAR_URL];
    f.payload.caption = "Explore the Wildlife Creator Vault. https://selar.com/0u19v8u99l";
    let result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, false);
    assert.match(result.blockers.join(" "), /disclosure/i);
    f.payload.caption = "Affiliate link: I may earn a commission if you buy. Explore the Wildlife Creator Vault. https://selar.com/0u19v8u99l";
    result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, true, JSON.stringify(result.blockers));
    f.payload.links = ["https://selar.com/not-approved"];
    result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, false);
  } finally { f.cleanup(); }
});

test("Safari remains inactive and arbitrary or unsafe destinations are blocked", async () => {
  const f = fixture();
  try {
    f.payload.commercial = true;
    f.payload.campaignId = "safari-affiliate";
    f.payload.links = ["https://example.com/affiliate"];
    f.payload.caption = "Affiliate link: I may earn a commission. Consider this travel option.";
    let result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some(x => /campaign|destination/i.test(x)));
    f.payload.links = ["https://user:password@example.com/path"];
    result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, false);
  } finally { f.cleanup(); }
});

test("duplicate slots, near-duplicates and daily frequency limits block", async () => {
  const f = fixture();
  try {
    const history = [{ destination: "nature_frontiers_facebook", slotId: f.payload.slotId, status: "UNCERTAIN", caption: f.payload.caption, createdAt: "2026-10-24T11:00:00Z" }];
    const result = await evaluateFinalFacebookPayload(f.payload, { ...options(f.root), history });
    assert.equal(result.eligible, false);
    assert.equal(result.duplicateCheck.passed, false);
  } finally { f.cleanup(); }
});

test("no owner-approval flag is required for ordinary eligible content; unknown synthetic origin blocks", async () => {
  const f = fixture();
  try {
    const result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, true);
    f.payload.media[0].representationKnown = false;
    const unknown = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(unknown.eligible, false);
    assert.ok(unknown.blockers.some(x => /origin|representation/i.test(x)));
  } finally { f.cleanup(); }
});

test("symlinked asset evidence escaping the rights root is blocked", async () => {
  const f = fixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-policy-outside-"));
  try {
    fs.writeFileSync(path.join(outside, "license.txt"), "outside license");
    fs.symlinkSync(path.join(outside, "license.txt"), path.join(f.root, "escape.txt"));
    f.payload.media[0].rightsRecord.evidencePath = "escape.txt";
    f.payload.media[0].rightsRecord.evidenceSha256 = hash("outside license");
    const result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, false);
    assert.ok(result.blockers.some(x => /rights/i.test(x)));
  } finally {
    f.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("URLs embedded directly in the final caption are checked even when links metadata omits them", async () => {
  const f = fixture();
  try {
    f.payload.caption = "Educational note. Visit https://unapproved.example/path for more.";
    f.payload.links = [];
    const result = await evaluateFinalFacebookPayload(f.payload, options(f.root));
    assert.equal(result.eligible, false);
    assert.ok(result.destinationChecks.some(check => check.url.includes("unapproved.example") && !check.passed));
  } finally { f.cleanup(); }
});
