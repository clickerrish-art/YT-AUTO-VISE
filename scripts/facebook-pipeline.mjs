import crypto from "node:crypto";
import fs from "node:fs";
import { localDateTimeToIso } from "./schedule-policy.mjs";

export const FACEBOOK_TIMEZONE = "Africa/Johannesburg";
export const FACEBOOK_COMPLIANCE_VERSION = "nf-facebook-baseline-2026-10-v1";
export const FACEBOOK_PILLARS = Object.freeze([
  "wildlife_behaviour", "conservation_education", "habitats_biodiversity",
  "ethical_photography", "educational_explainer", "authorized_behind_scenes"
]);
export const FACEBOOK_PUBLISHING_DEFAULTS = Object.freeze({
  targetPostsPerDay: 1, defaultLocalTime: "08:00", comparisonLocalTime: "18:00",
  timezone: FACEBOOK_TIMEZONE, publishingEnabled: false
});

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const safeString = (value, max = 10000) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const validHttps = value => {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }
  catch { return false; }
};

export function normalizeFacebookText(value) {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase("en-ZA")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

export function facebookContentFingerprint(draft) {
  return sha256(JSON.stringify({
    caption: normalizeFacebookText(draft?.caption),
    topic: normalizeFacebookText(draft?.topic),
    pillar: draft?.pillar ?? "",
    mediaSha256: draft?.media?.sha256 ?? ""
  }));
}

function tokenSet(value) {
  return new Set(normalizeFacebookText(value).split(" ").filter(word => word.length > 2));
}
export function similarityRatio(left, right) {
  const a = tokenSet(left), b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

/** Build an editable draft; this function never schedules or publishes remotely. */
export function createFacebookDraft(input, { now = new Date().toISOString(), expectedPageId = process.env.NATURE_FRONTIERS_FACEBOOK_PAGE_ID ?? "" } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Facebook draft must be an object");
  if (!safeString(input.id, 100) || !/^[A-Za-z0-9][A-Za-z0-9_-]{2,99}$/.test(input.id)) throw new Error("Draft ID must contain 3–100 safe characters");
  if (!safeString(input.topic, 300)) throw new Error("A specific topic is required");
  if (!safeString(input.caption, 5000)) throw new Error("Caption is required and must be at most 5000 characters");
  if (!FACEBOOK_PILLARS.includes(input.pillar)) throw new Error("Choose a supported Facebook content pillar");
  const scheduledDate = String(input.scheduledDate ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) throw new Error("scheduledDate must be YYYY-MM-DD");
  const scheduledTime = input.scheduledTime ?? FACEBOOK_PUBLISHING_DEFAULTS.defaultLocalTime;
  if (!/^(08:00|18:00)$/.test(scheduledTime)) throw new Error("Initial Facebook experiment supports only 08:00 or 18:00 local time");
  const scheduledAt = localDateTimeToIso(scheduledDate, scheduledTime, FACEBOOK_TIMEZONE);
  if (Date.parse(scheduledAt) <= Date.parse(now)) throw new Error("Facebook draft schedule must be in the future");
  const destinationPageId = String(input.destinationPageId ?? "").trim();
  if (destinationPageId && !/^\d{5,30}$/.test(destinationPageId)) throw new Error("Destination Page ID must be numeric; display names are not identities");
  const media = input.media && typeof input.media === "object" ? structuredClone(input.media) : null;
  return {
    id: input.id, kind: "FACEBOOK_PAGE_DRAFT", destination: "nature_frontiers_facebook",
    destinationPageId, expectedPageId: expectedPageId || null,
    topic: input.topic.trim(), pillar: input.pillar, caption: input.caption.trim(),
    claims: Array.isArray(input.claims) ? structuredClone(input.claims) : [],
    media, disclosure: String(input.disclosure ?? "").trim(),
    scheduledDate, scheduledTime, timezone: FACEBOOK_TIMEZONE, scheduledAt,
    experiment: { slot: scheduledTime, timezone: FACEBOOK_TIMEZONE, assignedAt: now, reason: "Balanced initial 08:00 vs 18:00 experiment; not a claim of optimal timing" },
    status: "DRAFT", complianceVersion: FACEBOOK_COMPLIANCE_VERSION,
    contentFingerprint: facebookContentFingerprint({ ...input, media }),
    approval: null, remote: null, createdAt: now, updatedAt: now,
    publishingEnabled: false
  };
}

/** Deterministic checks only; uncertain policy questions become human-review flags. */
export function evaluateFacebookDraft(draft, {
  existingDrafts = [], recentPosts = [], expectedPageId = process.env.NATURE_FRONTIERS_FACEBOOK_PAGE_ID ?? "",
  rightsRoot = process.cwd(), requireHumanApproval = true
} = {}) {
  const blockers = [], flags = [], warnings = [];
  if (!draft || draft.kind !== "FACEBOOK_PAGE_DRAFT") return { ok: false, blockers: ["A Facebook Page draft is required"], flags, warnings, score: 0, complianceVersion: FACEBOOK_COMPLIANCE_VERSION };
  if (!expectedPageId) blockers.push("Exact Nature Frontiers Facebook Page ID is not configured or independently verified");
  if (!draft.destinationPageId || !expectedPageId || draft.destinationPageId !== expectedPageId) blockers.push("Destination Page ID is missing or does not match the independently configured Page ID");
  if (!FACEBOOK_PILLARS.includes(draft.pillar)) blockers.push("Unsupported content pillar");
  if (!safeString(draft.caption, 5000)) blockers.push("Caption is missing or exceeds the allowed length");
  if (/(like and share|share this to win|comment yes|tag \d+ friends|share to save|react now|comment below to get)/i.test(draft.caption)) blockers.push("Potential engagement bait: rewrite as a useful, non-coercive discussion prompt");
  if (/\b(guaranteed|miracle cure|100% proven)\b/i.test(draft.caption)) flags.push("Potentially unsupported absolute claim requires human factual review");
  if (/(injured|blood|graphic|attack|kill|dead animal|poaching victim)/i.test(draft.caption)) flags.push("Potentially sensitive wildlife content requires editorial review");
  if (/\b(I witnessed|I rescued|we rescued|exclusive rescue footage)\b/i.test(draft.caption)) flags.push("Personal eyewitness/rescue claim requires evidence and human review");
  if (draft.claims.length === 0) warnings.push("No structured factual claims supplied; ensure factual statements in the caption have source records");
  for (const [index, claim] of draft.claims.entries()) {
    if (!safeString(claim?.text, 1000)) blockers.push(`Claim ${index + 1} has no valid claim text`);
    if (!Array.isArray(claim?.sourceUrls) || claim.sourceUrls.length === 0 || claim.sourceUrls.some(url => !validHttps(url))) blockers.push(`Claim ${index + 1} requires one or more HTTPS source URLs`);
    if (claim?.verified !== true) flags.push(`Claim ${index + 1} is not marked as human-verified`);
  }
  if (draft.disclosureRequired && !safeString(draft.disclosure, 500)) blockers.push("Required commercial/affiliate disclosure is missing");
  if (draft.disclosure && /selar\.com\//i.test(draft.disclosure)) warnings.push("Disclosure contains a product URL; verify it is the correct approved campaign destination");
  if (!draft.media) blockers.push("A relevant visual/media asset and provenance record are required");
  else {
    if (!safeString(draft.media.path, 1000) || !/^[a-f0-9]{64}$/.test(draft.media.sha256 ?? "")) blockers.push("Media path and SHA-256 checksum are required");
    else {
      const fullPath = require("node:path").resolve(rightsRoot, draft.media.path);
      const root = require("node:path").resolve(rightsRoot);
      if (!(fullPath === root || fullPath.startsWith(root + require("node:path").sep))) blockers.push("Media path escapes the configured rights root");
      else {
        try {
          const bytes = fs.readFileSync(fullPath);
          if (!bytes.length || sha256(bytes) !== draft.media.sha256) blockers.push("Media file is missing, empty, or its checksum has changed");
        } catch { blockers.push("Media file is missing or unreadable"); }
      }
    }
    if (!safeString(draft.media.provenance, 1000)) blockers.push("Media provenance is required");
    if (!safeString(draft.media.licenseEvidencePath, 1000) || !/^[a-f0-9]{64}$/.test(draft.media.licenseEvidenceSha256 ?? "")) blockers.push("License evidence path and checksum are required");
    else {
      const path = require("node:path");
      const fullPath = path.resolve(rightsRoot, draft.media.licenseEvidencePath);
      const root = path.resolve(rightsRoot);
      if (!(fullPath === root || fullPath.startsWith(root + path.sep))) blockers.push("License evidence path escapes the configured rights root");
      else {
        try { const bytes = fs.readFileSync(fullPath); if (!bytes.length || sha256(bytes) !== draft.media.licenseEvidenceSha256) blockers.push("License evidence is missing, empty, or checksum-mismatched"); }
        catch { blockers.push("License evidence file is missing or unreadable"); }
      }
    }
    if (draft.media.commercialPermission !== true || draft.media.platformPermission !== true) blockers.push("Commercial-use and platform-use permissions must be recorded; automated checks do not authenticate the license");
    if (draft.media.attributionRequired === true && !safeString(draft.media.attributionText, 500)) blockers.push("The asset requires attribution but no attribution text is recorded");
    if (draft.media.syntheticOrAltered === true && draft.media.disclosureApplied !== true) flags.push("Synthetic/altered-media disclosure needs review before approval");
  }
  const fingerprint = draft.contentFingerprint ?? facebookContentFingerprint(draft);
  for (const other of [...existingDrafts, ...recentPosts]) {
    if (!other || other.id === draft.id) continue;
    if (other.contentFingerprint && other.contentFingerprint === fingerprint) blockers.push(`Duplicate content fingerprint matches item ${other.id ?? "unknown"}`);
    else if (similarityRatio(draft.caption, other.caption) >= 0.82) blockers.push(`Caption is near-duplicate of item ${other.id ?? "unknown"}; create meaningfully original content`);
  }
  const score = Math.max(0, 100 - blockers.length * 20 - flags.length * 8 - warnings.length * 3);
  if (requireHumanApproval && flags.length) warnings.push("Human approval is required to resolve flagged claims or sensitive content");
  return { ok: blockers.length === 0 && flags.length === 0, blockers: [...new Set(blockers)], flags: [...new Set(flags)], warnings: [...new Set(warnings)], score, rubricVersion: "facebook-quality-rubric-v1", scoreNote: "Deterministic blocker/flag rubric only; not an SEO score, Meta certification, or prediction of reach." , complianceVersion: FACEBOOK_COMPLIANCE_VERSION };
}

export function facebookApprovalFingerprint(draft) {
  return sha256(JSON.stringify({
    caption: draft.caption, topic: draft.topic, pillar: draft.pillar,
    mediaSha256: draft.media?.sha256 ?? null, licenseEvidenceSha256: draft.media?.licenseEvidenceSha256 ?? null,
    destinationPageId: draft.destinationPageId, disclosure: draft.disclosure ?? "",
    scheduledAt: draft.scheduledAt, complianceVersion: draft.complianceVersion
  }));
}

export function approveFacebookDraft(draft, { reviewer, decision, reason = "", evaluation, now = new Date().toISOString() }) {
  if (!safeString(reviewer, 120)) throw new Error("Reviewer identity is required");
  if (!["APPROVE", "REJECT"].includes(decision)) throw new Error("Decision must be APPROVE or REJECT");
  if (!evaluation || evaluation.ok !== true) throw new Error("A passing compliance evaluation is required before approval");
  const approval = {
    reviewer: reviewer.trim(), decision, reason: String(reason).slice(0, 1000), reviewedAt: now,
    fingerprint: facebookApprovalFingerprint(draft), complianceVersion: evaluation.complianceVersion
  };
  return { ...draft, approval, status: decision === "APPROVE" ? "APPROVED_DRAFT" : "REJECTED", updatedAt: now, publishingEnabled: false };
}

export function assertFacebookPublishAllowed(draft, {
  publishingEnabled = false, explicitOperationAuthorization = false, dryRun = true,
  verifiedPageId = "", evaluation
} = {}) {
  const blockers = [];
  if (!publishingEnabled) blockers.push("Facebook publishing kill switch is disabled");
  if (!explicitOperationAuthorization) blockers.push("Explicit per-operation operator authorization is required");
  if (dryRun) blockers.push("Dry-run mode does not publish remotely");
  if (!verifiedPageId || verifiedPageId !== draft?.destinationPageId || verifiedPageId !== draft?.expectedPageId) blockers.push("Independently verified Facebook Page identity does not match the draft destination");
  if (!evaluation?.ok) blockers.push("Current compliance/rights preflight has not passed");
  if (draft?.status !== "APPROVED_DRAFT" || draft?.approval?.decision !== "APPROVE") blockers.push("Final human approval is missing");
  if (!draft?.approval?.fingerprint || draft.approval.fingerprint !== facebookApprovalFingerprint(draft)) blockers.push("Approval is missing or invalidated by a material content, media, disclosure, destination, or schedule change");
  return { allowed: blockers.length === 0, blockers, publishingEnabled: false, mode: "DRY_RUN_ONLY_NO_LIVE_ADAPTER" };
}

export function chooseFacebookExperimentSlot({ date, pillar, format = "text" }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !FACEBOOK_PILLARS.includes(pillar)) throw new Error("Valid date and content pillar are required for experiment assignment");
  const noon = new Date(date + "T12:00:00Z");
  if (Number.isNaN(noon.getTime()) || noon.toISOString().slice(0, 10) !== date) throw new Error("Experiment date is invalid");
  const dayIndex = (noon.getUTCDay() + 6) % 7;
  const week = Math.floor(noon.getTime() / 604800000);
  const salt = [...(pillar + ":" + format)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (dayIndex + week + salt) % 2 === 0 ? "08:00" : "18:00";
}

export function summarizeFacebookExperiment(posts, { minPerArm = 14 } = {}) {
  const valid = (Array.isArray(posts) ? posts : []).filter(post =>
    ["08:00", "18:00"].includes(post?.experiment?.slot) &&
    Number.isFinite(post?.metrics?.reach) && post.metrics.reach >= 0 &&
    Number.isFinite(post?.metrics?.meaningfulEngagement) && post.metrics.meaningfulEngagement >= 0 &&
    post?.metrics?.periodStart && post?.metrics?.periodEnd
  );
  const arms = Object.fromEntries(["08:00", "18:00"].map(slot => {
    const rows = valid.filter(post => post.experiment.slot === slot);
    const reach = rows.reduce((sum, post) => sum + post.metrics.reach, 0);
    const engaged = rows.reduce((sum, post) => sum + post.metrics.meaningfulEngagement, 0);
    return [slot, { sampleSize: rows.length, totalReach: reach, totalMeaningfulEngagement: engaged, engagementPerReach: reach ? engaged / reach : null }];
  }));
  const enough = arms["08:00"].sampleSize >= minPerArm && arms["18:00"].sampleSize >= minPerArm;
  return { timezone: FACEBOOK_TIMEZONE, arms, sampleThresholdPerArm: minPerArm, sufficientEvidence: enough, recommendation: enough ? "REVIEW_COMPARABILITY_AND_UNCERTAINTY_BEFORE_CHANGING_SCHEDULE" : "INSUFFICIENT_PAGE_SPECIFIC_DATA_KEEP_08_00_DEFAULT", note: "No causal or best-time claim is made; compare weekdays, pillars, formats and measurement windows before drawing conclusions." };
}

export function reconcileFacebookOutcome(job, remoteLookupResult) {
  if (!job || job.kind !== "FACEBOOK_PUBLISH_ATTEMPT") throw new Error("A durable Facebook publish-attempt record is required");
  if (!remoteLookupResult || remoteLookupResult.status === "UNKNOWN") return { ...job, status: "NEEDS_OPERATOR_REVIEW", retryAllowed: false, message: "Remote outcome is uncertain; reconcile before any retry" };
  if (remoteLookupResult.status === "FOUND" && safeString(remoteLookupResult.remotePostId, 200)) return { ...job, status: "PUBLISHED_VERIFIED", remotePostId: remoteLookupResult.remotePostId, remoteUrl: validHttps(remoteLookupResult.remoteUrl) ? remoteLookupResult.remoteUrl : null, remotePublishedAt: remoteLookupResult.publishedAt ?? null, retryAllowed: false };
  if (remoteLookupResult.status === "NOT_FOUND_CONFIRMED") return { ...job, status: "RETRY_ELIGIBLE_AFTER_OPERATOR_REVIEW", retryAllowed: true, message: "Remote absence was confirmed; operator must re-run current preflight and explicitly authorize a new operation" };
  throw new Error("Unsupported reconciliation result");
}
