import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  FACEBOOK_TIMEZONE, createFacebookDraft, evaluateFacebookDraft, similarityRatio,
  approveFacebookDraft, facebookApprovalFingerprint, assertFacebookPublishAllowed,
  chooseFacebookExperimentSlot, summarizeFacebookExperiment, reconcileFacebookOutcome, generateFacebookIdea,
  facebookContentFingerprint
} from "../scripts/facebook-pipeline.mjs";

const sha = value => crypto.createHash("sha256").update(value).digest("hex");
const NOW = "2026-10-24T10:00:00.000Z";
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-pipeline-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const media = Buffer.from("test-only media fixture bytes");
  const license = Buffer.from("test-only license evidence fixture");
  fs.writeFileSync(path.join(root, "media.bin"), media);
  fs.writeFileSync(path.join(root, "license.txt"), license);
  const draft = createFacebookDraft({
    id: "nf-daily-test-001", topic: "Why wetland habitats matter",
    pillar: "habitats_biodiversity",
    caption: "Wetlands support diverse wildlife and help filter water. What wetland species have you observed?",
    scheduledDate: "2026-10-25", scheduledTime: "08:00",
    destinationPageId: "123456789012345",
    claims: [{ text: "Wetlands support biodiversity", sourceUrls: ["https://www.ramsar.org/"], verified: true }],
    disclosureRequired: false,
    media: {
      path: "media.bin", sha256: sha(media), provenance: "TEST FIXTURE — not publishable",
      licenseEvidencePath: "license.txt", licenseEvidenceSha256: sha(license),
      commercialPermission: true, platformPermission: true, attributionRequired: false,
      syntheticOrAltered: false
    }
  }, { now: NOW, expectedPageId: "123456789012345" });
  return { root, draft };
}

test("Facebook draft schedule uses Africa/Johannesburg without server-local offsets", () => {
  const draft = createFacebookDraft({
    id: "nf-timezone-test", topic: "Habitat facts", pillar: "habitats_biodiversity",
    caption: "A useful habitat explainer", scheduledDate: "2026-10-25", scheduledTime: "08:00",
    destinationPageId: "123456789012345"
  }, { now: NOW, expectedPageId: "123456789012345" });
  assert.equal(draft.timezone, FACEBOOK_TIMEZONE);
  assert.equal(draft.scheduledAt, "2026-10-25T06:00:00.000Z");
  assert.equal(draft.experiment.slot, "08:00");
  assert.equal(draft.publishingEnabled, false);
});

test("daily idea suggestions avoid existing topics and remain explicitly research-only", () => {
  const first = generateFacebookIdea({ date: "2030-10-25" });
  assert.equal(first.publishReady, false);
  assert.equal(first.factualClaims.length, 0);
  assert.match(first.captionStarter, /Add one specific, sourced fact/);
  const second = generateFacebookIdea({ date: "2030-10-25", existingDrafts: [{ topic: first.topic, status: "DRAFT" }] });
  assert.notEqual(second.topic, first.topic);
  assert.match(second.researchPrompt, /reliable primary or authoritative source/i);
  assert.throws(() => generateFacebookIdea({ date: "2030-02-31" }), /date/i);
});

test("invalid dates, past schedules, bad pillars and display-name-only destinations are rejected", () => {
  const base = { id: "nf-invalid-test", topic: "Topic", pillar: "habitats_biodiversity", caption: "A useful post", scheduledDate: "2026-10-25", destinationPageId: "Nature Frontiers" };
  assert.throws(() => createFacebookDraft({ ...base, scheduledDate: "2026-02-31" }, { now: NOW }), /date|time/i);
  assert.throws(() => createFacebookDraft({ ...base, scheduledDate: "2026-10-23" }, { now: NOW }), /future/i);
  assert.throws(() => createFacebookDraft({ ...base, pillar: "unknown" }, { now: NOW }), /pillar/i);
  assert.throws(() => createFacebookDraft(base, { now: NOW }), /numeric/i);
});

test("freshness detection catches normalized exact duplicates and near duplicates", () => {
  assert.equal(similarityRatio("Wildlife needs healthy habitats", "WILDLIFE needs healthy habitats!"), 1);
  assert.ok(similarityRatio("Wetlands support wildlife and clean water", "Wetlands support wildlife and clean water for communities") > 0.7);
  assert.notEqual(facebookContentFingerprint({ caption: "New habitat story", topic: "wetlands", pillar: "habitats_biodiversity" }), facebookContentFingerprint({ caption: "Different story", topic: "wetlands", pillar: "habitats_biodiversity" }));
});

test("compliance blocks missing Page identity, engagement bait, missing sources, and broken rights checksums", (t) => {
  const { root, draft } = fixture(t);
  const wrongPage = evaluateFacebookDraft({ ...draft, destinationPageId: "999999999999999" }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.equal(wrongPage.ok, false);
  assert.ok(wrongPage.blockers.some(x => /Page ID/i.test(x)));
  const engagementBait = evaluateFacebookDraft({ ...draft, caption: "Like and share this to win now" }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(engagementBait.blockers.some(x => /engagement bait/i.test(x)));
  const noSources = evaluateFacebookDraft({ ...draft, claims: [{ text: "Wildlife claim", sourceUrls: [], verified: true }] }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(noSources.blockers.some(x => /HTTPS source URLs/i.test(x)));
  const changed = { ...draft, media: { ...draft.media, sha256: "a".repeat(64) } };
  const checksum = evaluateFacebookDraft(changed, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(checksum.blockers.some(x => /checksum/i.test(x)));
  const missingPage = evaluateFacebookDraft(draft, { expectedPageId: "", rightsRoot: root });
  assert.ok(missingPage.blockers.some(x => /not configured or independently verified/i.test(x)));
});

test("missing media/license evidence, path traversal, disclosure, and attribution fail closed", (t) => {
  const { root, draft } = fixture(t);
  const noMedia = evaluateFacebookDraft({ ...draft, media: null }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(noMedia.blockers.some(x => /media asset/i.test(x)));
  const traversal = evaluateFacebookDraft({ ...draft, media: { ...draft.media, path: "../outside.bin" } }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(traversal.blockers.some(x => /escapes/i.test(x)));
  const attribution = evaluateFacebookDraft({ ...draft, media: { ...draft.media, attributionRequired: true, attributionText: "" } }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(attribution.blockers.some(x => /attribution/i.test(x)));
  const requiredDisclosure = evaluateFacebookDraft({ ...draft, disclosureRequired: true, disclosure: "" }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(requiredDisclosure.blockers.some(x => /disclosure/i.test(x)));
});

test("commercial disclosures, approved Selar destination and high-impact claims are gated", (t) => {
  const { root, draft } = fixture(t);
  const commercial = evaluateFacebookDraft({ ...draft, commercial: true, disclosure: "" }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(commercial.blockers.some(x => /commercial\/affiliate disclosure/i.test(x)));
  const wrongSelar = evaluateFacebookDraft({ ...draft, caption: "Get details at https://selar.com/not-approved", commercial: true, disclosure: "Promotional link; see seller terms.", externalLinksReviewed: true }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(wrongSelar.blockers.some(x => /exact approved product URL/i.test(x)));
  const wrongCampaign = evaluateFacebookDraft({ ...draft, caption: "Find details at https://selar.com/0u19v8u99l", commercial: true, disclosure: "Promotional link; review seller terms.", externalLinksReviewed: true, campaignId: "online-money" }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(wrongCampaign.blockers.some(x => /exact approved selar-wildlife-vault campaign ID/i.test(x)));
  const unrelatedPillar = evaluateFacebookDraft({ ...draft, pillar: "wildlife_behaviour", caption: "Find details at https://selar.com/0u19v8u99l", commercial: true, disclosure: "Promotional link; review seller terms.", externalLinksReviewed: true, campaignId: "selar-wildlife-vault" }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(unrelatedPillar.blockers.some(x => /unrelated content pillar/i.test(x)));
  const healthClaim = evaluateFacebookDraft({ ...draft, caption: "This miracle cure cures cancer and is completely safe." }, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.ok(healthClaim.flags.some(x => /high-impact health/i.test(x)));
  assert.equal(healthClaim.ok, false);
});

test("human approval is bound to final content, media, disclosure, destination and time", (t) => {
  const { root, draft } = fixture(t);
  const evaluation = evaluateFacebookDraft(draft, { expectedPageId: "123456789012345", rightsRoot: root });
  assert.equal(evaluation.ok, true, JSON.stringify(evaluation));
  const approved = approveFacebookDraft(draft, { reviewer: "owner@example.test", decision: "APPROVE", evaluation, now: NOW });
  assert.equal(approved.status, "APPROVED_DRAFT");
  assert.equal(approved.approval.fingerprint, facebookApprovalFingerprint(approved));
  assert.throws(() => approveFacebookDraft(draft, { reviewer: "owner", decision: "APPROVE", evaluation: { ok: false } }), /passing compliance/i);
  const changed = { ...approved, caption: approved.caption + " Extra unsupported claim." };
  const gate = assertFacebookPublishAllowed(changed, { publishingEnabled: true, explicitOperationAuthorization: true, dryRun: false, verifiedPageId: "123456789012345", evaluation });
  assert.equal(gate.allowed, false);
  assert.ok(gate.blockers.some(x => /approval.*invalidated/i.test(x)));
});

test("publish gate remains closed for dry-run, missing authorization and wrong Page", (t) => {
  const { root, draft } = fixture(t);
  const evaluation = evaluateFacebookDraft(draft, { expectedPageId: "123456789012345", rightsRoot: root });
  const approved = approveFacebookDraft(draft, { reviewer: "owner@example.test", decision: "APPROVE", evaluation, now: NOW });
  assert.equal(assertFacebookPublishAllowed(approved, { evaluation, verifiedPageId: "123456789012345" }).allowed, false);
  const stillDry = assertFacebookPublishAllowed(approved, { publishingEnabled: true, explicitOperationAuthorization: true, dryRun: true, verifiedPageId: "123456789012345", evaluation });
  assert.ok(stillDry.blockers.some(x => /Dry-run/i.test(x)));
  const wrongPage = assertFacebookPublishAllowed(approved, { publishingEnabled: true, explicitOperationAuthorization: true, dryRun: false, verifiedPageId: "111111111111111", evaluation });
  assert.ok(wrongPage.blockers.some(x => /identity/i.test(x)));
});

test("08:00/18:00 assignment is deterministic and experiment reports insufficient evidence honestly", () => {
  const a = chooseFacebookExperimentSlot({ date: "2026-10-25", pillar: "habitats_biodiversity" });
  assert.equal(a, chooseFacebookExperimentSlot({ date: "2026-10-25", pillar: "habitats_biodiversity" }));
  assert.ok(["08:00", "18:00"].includes(a));
  const report = summarizeFacebookExperiment([]);
  assert.equal(report.sufficientEvidence, false);
  assert.match(report.recommendation, /INSUFFICIENT/);
  const posts = Array.from({ length: 28 }, (_, i) => ({
    experiment: { slot: i < 14 ? "08:00" : "18:00" },
    metrics: { reach: 100 + i, meaningfulEngagement: 5, periodStart: "2026-10-01", periodEnd: "2026-10-02" }
  }));
  assert.equal(summarizeFacebookExperiment(posts).sufficientEvidence, true);
});

test("uncertain remote publish outcomes cannot be blindly retried", () => {
  const job = { id: "attempt-1", kind: "FACEBOOK_PUBLISH_ATTEMPT", status: "UPLOADING" };
  const unknown = reconcileFacebookOutcome(job, { status: "UNKNOWN" });
  assert.equal(unknown.status, "NEEDS_OPERATOR_REVIEW");
  assert.equal(unknown.retryAllowed, false);
  const found = reconcileFacebookOutcome(job, { status: "FOUND", remotePostId: "remote-123", remoteUrl: "https://www.facebook.com/remote-123", publishedAt: NOW });
  assert.equal(found.status, "PUBLISHED_VERIFIED");
  assert.equal(found.remotePostId, "remote-123");
  assert.equal(reconcileFacebookOutcome(job, { status: "NOT_FOUND_CONFIRMED" }).retryAllowed, true);
});
