import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const FACEBOOK_POLICY_RULE_VERSION = "nf-facebook-autonomous-policy-2026-10-v1";
export const APPROVED_SELLAR_URL = "https://selar.com/0u19v8u99l";
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const text = value => typeof value === "string" && value.trim().length > 0;
const absolutePathWithin = (root, candidate) => {
  const resolvedRoot = fs.realpathSync(root);
  const resolved = fs.realpathSync(path.resolve(resolvedRoot, candidate));
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    throw new Error("Path escapes configured evidence root");
  }
  return resolved;
};
const urlIsSafe = value => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password && !u.port && !u.hostname.endsWith(".") &&
      !["localhost", "127.0.0.1", "::1"].includes(u.hostname.toLowerCase());
  } catch { return false; }
};
const normalized = value => String(value ?? "").normalize("NFKC").toLocaleLowerCase("en-ZA")
  .replace(/https?:\/\/\S+/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
const tokenSet = value => new Set(normalized(value).split(" ").filter(t => t.length > 2));
export function nearDuplicateRatio(a, b) {
  const left = tokenSet(a), right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const item of left) if (right.has(item)) common++;
  return common / (left.size + right.size - common);
}
function hostMatches(host, domains) {
  return domains.some(domain => host === domain || host.endsWith("." + domain));
}
function containsAffiliateLanguage(caption) {
  return /\b(affiliate|affiliate link|earn commission|may earn|paid partnership|sponsored|advertisement|ad)\b/i.test(caption);
}
function fingerprint(payload) {
  return sha256(JSON.stringify({
    pageId: payload?.destinationPageId ?? "",
    slot: payload?.slotId ?? "",
    caption: String(payload?.caption ?? ""),
    links: Array.isArray(payload?.links) ? payload.links.map(String).sort() : [],
    media: Array.isArray(payload?.media) ? payload.media.map(m => ({ id: m?.id ?? "", sha256: m?.sha256 ?? "" })).sort((a,b) => a.id.localeCompare(b.id)) : []
  }));
}

/**
 * Fail-closed, deterministic gate for the exact final Facebook payload.
 * Source verification is deliberately injectable; a URL alone is never treated as evidence.
 * This engine prevents publication on unknowns but cannot guarantee Meta policy compliance.
 */
export async function evaluateFinalFacebookPayload(payload, {
  expectedPageId = "",
  expectedPageName = "Nature Frontiers",
  allowedDomains = [],
  allowedCampaignIds = [],
  approvedDestinations = [],
  history = [],
  evidenceRoot = process.cwd(),
  fetchImpl = fetch,
  now = new Date().toISOString(),
  maxPostsPerLocalDay = 1,
  minimumIntervalMinutes = 60 * 20,
  timezone = "Africa/Johannesburg",
  sourceTimeoutMs = 8000
} = {}) {
  const blockers = [], warnings = [], sourceChecks = [], rightsChecks = [], disclosureChecks = [], destinationChecks = [];
  const add = (list, reason) => { if (!list.includes(reason)) list.push(reason); };
  const resultBase = { eligible: false, blockers, warnings, sourceChecks, rightsChecks, disclosureChecks, destinationChecks,
    duplicateCheck: { passed: false, matches: [] }, policyRuleVersion: FACEBOOK_POLICY_RULE_VERSION,
    contentFingerprint: fingerprint(payload), mediaFingerprints: [], checkedAt: now, reason: "NOT_EVALUATED" };
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    add(blockers, "Final payload is missing or malformed");
    return { ...resultBase, reason: blockers[0] };
  }
  if (!text(payload.caption) || payload.caption.length > 5000) add(blockers, "Final caption is missing or exceeds 5000 characters");
  if (!text(payload.slotId)) add(blockers, "A durable intended slot ID is required for idempotency");
  if (!/^\d{5,30}$/.test(String(payload.destinationPageId ?? "")) || payload.destinationPageId !== expectedPageId) add(blockers, "Exact Nature Frontiers Page ID is not verified or does not match the configured destination");
  if (payload.destination !== "nature_frontiers_facebook") add(blockers, "Destination separation check failed");
  if (payload.requiresHumanApproval === true || payload.approvalRequired === true) add(blockers, "Routine publishing payload must not depend on per-post approval");
  if (/(like and share|share this to win|comment yes|tag \d+ friends|share to save|react now|comment below to get|share to unlock)/i.test(payload.caption ?? "")) add(blockers, "Engagement bait detected");
  if (/(graphic injury|animal cruelty|staged animal fight|bait(?:ing)? wildlife|chase wildlife|touch wild animals|provoke wildlife|bloodied carcass)/i.test(payload.caption ?? "")) add(blockers, "Wildlife welfare or graphic-content rule triggered");
  if (/(guaranteed earnings|guaranteed returns|miracle cure|100% proven|exclusive rescue footage|I rescued|we rescued)/i.test(payload.caption ?? "")) add(blockers, "Unsupported certainty, fabricated-experience risk, or high-impact claim detected");
  if (/(exact GPS|coordinates|nest location|den location|breeding site location)/i.test(payload.caption ?? "") && /(endangered|vulnerable|rare|nest|den|breeding)/i.test(payload.caption ?? "")) add(blockers, "Potentially sensitive wildlife location disclosure");

  const claims = Array.isArray(payload.claims) ? payload.claims : [];
  if (claims.length === 0 && /\b(according to|research shows|scientists found|population|percent|%|endangered|threatened|conservation success|recorded in|was observed|is native to|km|kilometres|million|billion)\b/i.test(payload.caption ?? "")) {
    add(blockers, "Factual, numerical, conservation, location or time-sensitive language requires structured source records");
  }
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    if (!text(claim?.text) || !Array.isArray(claim?.sourceUrls) || claim.sourceUrls.length === 0) {
      add(blockers, `Claim ${i + 1} lacks claim text or source URLs`);
      sourceChecks.push({ claimIndex: i, passed: false, reason: "MISSING_CLAIM_OR_SOURCE" });
      continue;
    }
    const checks = [];
    for (const sourceUrl of claim.sourceUrls) {
      if (!urlIsSafe(sourceUrl)) {
        checks.push({ url: String(sourceUrl), passed: false, reason: "URL_NOT_SAFE_HTTPS" });
        continue;
      }
      let host;
      try { host = new URL(sourceUrl).hostname.toLowerCase(); } catch {}
      const defaultAuthorities = ["gov", "gov.za", "sanbi.org", "iucnredlist.org", "iucn.org", "nationalgeographic.com", "si.edu", "nhm.ac.uk", "sciencedirect.com", "nature.com", "science.org", "journals.plos.org", "peerj.com", "animaldiversity.org", "wwf.org", "wwf.org.za", "birdlife.org", "birdlife.org.za"];
      const authoritative = host && (host.split(".").some(part => part === "gov" || part === "edu") || hostMatches(host, [...defaultAuthorities, ...allowedDomains]));
      if (!authoritative) {
        checks.push({ url: sourceUrl, passed: false, reason: "DOMAIN_NOT_IN_AUTHORITY_ALLOWLIST" });
        continue;
      }
      try {
        const response = await fetchImpl(sourceUrl, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(sourceTimeoutMs), headers: { accept: "text/html,application/xhtml+xml,text/plain;q=0.9,application/pdf;q=0.5" } });
        const finalUrl = response.url || sourceUrl;
        const reachable = response.ok && urlIsSafe(finalUrl) && new URL(finalUrl).hostname === new URL(sourceUrl).hostname;
        const body = reachable && typeof response.text === "function" ? await response.text() : "";
        const excerpt = normalized(claim.sourceExcerpt);
        const excerptFound = excerpt.length >= 25 && normalized(body).includes(excerpt);
        const passed = reachable && excerptFound;
        checks.push({ url: sourceUrl, passed, status: Number(response.status) || null, finalUrl, excerptFound, reason: !reachable ? "SOURCE_UNAVAILABLE_OR_REDIRECTED" : excerptFound ? "SOURCE_EXCERPT_FOUND" : "SOURCE_EXCERPT_MISSING_OR_UNVERIFIABLE" });
      } catch {
        checks.push({ url: sourceUrl, passed: false, reason: "SOURCE_CHECK_FAILED" });
      }
    }
    const passed = checks.some(check => check.passed && check.excerptFound === true) && claim.sourceSupportsClaim === true && claim.verified === true;
    sourceChecks.push({ claimIndex: i, claim: claim.text, checks, passed, reason: passed ? "SOURCE_CHECK_PASSED_WITH_DECLARED_CLAIM_SUPPORT" : "SOURCE_DOES_NOT_VERIFIABLY_SUPPORT_CLAIM" });
    if (!passed) add(blockers, `Claim ${i + 1} is not supported by a reachable, allowlisted source explicitly recorded as supporting it`);
    if (claim.kind === "quote" && claim.quoteVerified !== true) add(blockers, `Claim ${i + 1} contains an unverified quotation`);
  }

  const media = Array.isArray(payload.media) ? payload.media : [];
  if (media.length === 0) add(blockers, "At least one final media asset with a rights record is required");
  for (let i = 0; i < media.length; i++) {
    const asset = media[i] ?? {};
    const record = asset.rightsRecord ?? {};
    const check = { mediaIndex: i, passed: false, sha256: String(asset.sha256 ?? ""), reason: "" };
    if (!/^[a-f0-9]{64}$/.test(asset.sha256 ?? "")) {
      check.reason = "MISSING_OR_INVALID_ASSET_SHA256";
    } else if (!text(asset.path) || !text(record.evidencePath) || !/^[a-f0-9]{64}$/.test(record.evidenceSha256 ?? "")) {
      check.reason = "MISSING_PROVENANCE_OR_LICENSE_EVIDENCE";
    } else {
      try {
        const assetPath = absolutePathWithin(evidenceRoot, asset.path);
        const evidencePath = absolutePathWithin(evidenceRoot, record.evidencePath);
        const actualAssetHash = sha256(fs.readFileSync(assetPath));
        const actualEvidenceHash = sha256(fs.readFileSync(evidencePath));
        const rightsValid = actualAssetHash === asset.sha256 && actualEvidenceHash === record.evidenceSha256 &&
          text(record.source) && text(record.license) && record.commercialUse === true &&
          record.socialMediaUse === true && record.provenanceVerified === true &&
          (record.expiresAt == null || (Number.isFinite(Date.parse(record.expiresAt)) && Date.parse(record.expiresAt) > Date.parse(now))) &&
          record.syntheticOrAlteredKnown === true &&
          (record.attributionRequired !== true || text(record.attributionText));
        check.passed = rightsValid;
        check.reason = rightsValid ? "HASHES_AND_RECORDED_RIGHTS_FIELDS_VALID" : "RIGHTS_EVIDENCE_INCOMPLETE_EXPIRED_OR_HASH_MISMATCH";
      } catch (error) {
        check.reason = error?.message === "Path escapes configured evidence root" ? "EVIDENCE_PATH_ESCAPE" : "ASSET_OR_LICENSE_EVIDENCE_UNAVAILABLE";
      }
    }
    rightsChecks.push(check);
    if (!check.passed) add(blockers, `Media asset ${i + 1} failed rights, provenance, expiry or checksum verification`);
    resultBase.mediaFingerprints.push({ id: String(asset.id ?? ""), sha256: String(asset.sha256 ?? ""), passed: check.passed });
    if (typeof asset.syntheticOrAltered !== "boolean" || asset.representationKnown !== true) add(blockers, `Media asset ${i + 1} synthetic/altered origin or representation is unknown`);
    if (asset.syntheticOrAltered === true && asset.disclosureRequired === true && asset.disclosureApplied !== true) add(blockers, `Media asset ${i + 1} requires a visible synthetic/altered-media disclosure`);
  }

  const structuredLinks = Array.isArray(payload.links) ? payload.links.map(String) : [];
  const captionLinks = String(payload.caption ?? "").match(/https?:\/\/[^\s)]+/gi) ?? [];
  const links = [...new Set([...structuredLinks, ...captionLinks])];
  const affiliate = payload.commercial === true || links.some(link => /selar\.com|safari\.com/i.test(String(link)));
  const disclosureText = String(payload.caption ?? "");
  if (affiliate) {
    const disclosureVisible = /\b(affiliate link|affiliate disclosure|i may earn|may earn a commission|commission if you buy|paid partnership|sponsored|advertisement)\b/i.test(disclosureText);
    disclosureChecks.push({ required: true, visibleInCaption: disclosureVisible, passed: disclosureVisible });
    if (!disclosureVisible) add(blockers, "Commercial or affiliate promotion requires a clear disclosure visible in the final caption");
    if (payload.campaignId === "selar-wildlife-vault" && !links.includes(APPROVED_SELLAR_URL)) add(blockers, "Selar campaign must use the exact approved product destination");
    if (payload.campaignId !== "selar-wildlife-vault" && links.includes(APPROVED_SELLAR_URL)) add(blockers, "Approved Selar URL is restricted to the configured Selar campaign");
    if (payload.campaignId === "safari-affiliate" && payload.safariCampaignEnabled !== true) add(blockers, "Safari affiliate campaign is inactive until explicitly configured");
    if (!allowedCampaignIds.includes(payload.campaignId)) add(blockers, "Campaign ID is not allowlisted for autonomous publishing");
  } else {
    disclosureChecks.push({ required: false, visibleInCaption: false, passed: true });
  }
  for (const link of links) {
    if (!urlIsSafe(link)) {
      destinationChecks.push({ url: String(link), passed: false, reason: "HTTPS_URL_WITHOUT_CREDENTIALS_REQUIRED" });
      add(blockers, "Outbound destination must be a valid HTTPS URL without embedded credentials or custom ports");
      continue;
    }
    const parsed = new URL(link);
    const isSelar = parsed.hostname === "selar.com" || parsed.hostname.endsWith(".selar.com");
    const isSafari = parsed.hostname === "safari.com" || parsed.hostname.endsWith(".safari.com");
    const allowed = isSelar
      ? link === APPROVED_SELLAR_URL && payload.campaignId === "selar-wildlife-vault"
      : isSafari ? payload.campaignId === "safari-affiliate" && payload.safariCampaignEnabled === true && approvedDestinations.includes(link)
        : approvedDestinations.includes(link) || hostMatches(parsed.hostname, allowedDomains);
    destinationChecks.push({ url: link, passed: allowed, reason: allowed ? "ALLOWLISTED_DESTINATION" : "DESTINATION_NOT_ALLOWLISTED" });
    if (!allowed) add(blockers, "Outbound link is not on the exact approved destination allowlist");
  }

  const current = Date.parse(now);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(current));
  const prior = history.filter(item => item && item.destination === "nature_frontiers_facebook" && ["PUBLISHED_VERIFIED", "SCHEDULED_VERIFIED", "PUBLISHING", "UNCERTAIN"].includes(item.status));
  const matches = prior.filter(item => item.slotId === payload.slotId || item.contentFingerprint === resultBase.contentFingerprint ||
    (text(item.caption) && nearDuplicateRatio(payload.caption, item.caption) >= 0.82));
  resultBase.duplicateCheck = { passed: matches.length === 0, matches: matches.map(item => ({ slotId: item.slotId ?? null, status: item.status, remotePostId: item.remotePostId ?? null })) };
  if (matches.length) add(blockers, "Duplicate, near-duplicate, prior attempt or previously used slot detected");
  const sameDay = prior.filter(item => {
    const timestamp = Date.parse(item.publishedAt ?? item.createdAt ?? item.scheduledAt ?? "");
    if (!Number.isFinite(timestamp)) return true;
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(timestamp)) === day;
  });
  if (sameDay.length >= maxPostsPerLocalDay) add(blockers, "Daily publication cap already reached; missed slots are not caught up");
  const last = prior.map(item => Date.parse(item.publishedAt ?? item.createdAt ?? item.scheduledAt ?? "")).filter(Number.isFinite).sort((a,b)=>b-a)[0];
  if (last != null && current - last < minimumIntervalMinutes * 60000) add(blockers, "Minimum interval between Facebook posts has not elapsed");

  const warningsOut = [...new Set(warnings)];
  return {
    ...resultBase, eligible: blockers.length === 0, blockers: [...new Set(blockers)], warnings: warningsOut,
    duplicateCheck: resultBase.duplicateCheck,
    reason: blockers.length ? "BLOCKED_FAIL_CLOSED" : "ELIGIBLE_AUTOMATED_CHECKS_PASSED",
    checkedAt: now
  };
}
