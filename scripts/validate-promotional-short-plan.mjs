#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidZonedIsoTimestamp } from "./schedule-policy.mjs";

const WORD_MIN = 90;
const WORD_MAX = 135;
const KEYWORD_EVIDENCE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const KEYWORD_EVIDENCE_FUTURE_SKEW_MS = 5 * 60 * 1000;
const SELLER_EVIDENCE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const SELLER_EVIDENCE_FUTURE_SKEW_MS = 5 * 60 * 1000;

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function getSecureProductHost(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "";
    return parsed.hostname.toLowerCase();
  } catch {
    return "";
  }
}

function firstTextIndex(value, candidates) {
  const haystack = String(value ?? "").toLowerCase();
  const indexes = (Array.isArray(candidates) ? candidates : [])
    .filter(candidate => typeof candidate === "string" && candidate.trim())
    .map(candidate => haystack.indexOf(candidate.toLowerCase()))
    .filter(index => index >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
}

function isRealMonday(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && date.getUTCDay() === 1;
}

function currentMondayInTimezone(referenceNow, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(referenceNow);
  const values = Object.fromEntries(parts
    .filter(part => ["year", "month", "day"].includes(part.type))
    .map(part => [part.type, part.value]));
  const localCalendarDate = new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day)
  ));
  const daysSinceMonday = (localCalendarDate.getUTCDay() + 6) % 7;
  localCalendarDate.setUTCDate(localCalendarDate.getUTCDate() - daysSinceMonday);
  return [
    localCalendarDate.getUTCFullYear(),
    String(localCalendarDate.getUTCMonth() + 1).padStart(2, "0"),
    String(localCalendarDate.getUTCDate()).padStart(2, "0")
  ].join("-");
}

const PUBLICATION_TIMESTAMP_KEYS = new Set([
  "scheduledAt", "publishedAt", "publicationAt", "publishAt",
  "actualPublishedAt", "actualPublicationAt", "actualPublishAt",
  "scheduledPublishAt", "scheduledPublicationAt", "scheduledStartTime",
  "plannedPublishAt", "plannedPublicationAt",
  "scheduledFor", "publishedFor", "publicationFor",
  "scheduledTimestamp", "publishedTimestamp", "publicationTimestamp", "publishTimestamp",
  "scheduledDate", "publishedDate", "publicationDate", "publishDate",
  "actualPublishedDate", "actualPublicationDate",
  "scheduledPublishDate", "plannedPublishDate", "plannedPublicationDate",
  "scheduledPublishTime", "plannedPublishTime", "actualPublishTime",
  "actualPublishedTimestamp", "actualPublicationTimestamp", "actualPublishTimestamp", "scheduledPublicationTimestamp", "scheduledPublishTimestamp", "plannedPublicationTimestamp", "plannedPublishTimestamp", "publishedTime", "publicationTime", "publishTime", "scheduledTime", "plannedTime", "actualTime", "publishedDateTime", "publicationDateTime", "publishDateTime", "scheduledDateTime", "plannedDateTime", "actualDateTime", "actualPublishDateTime", "scheduledPublishDateTime", "plannedPublishDateTime"
].map(normalizePublicationKey));

const GENERIC_PUBLICATION_TIME_KEYS = new Set([
  "at", "for", "date", "time", "timestamp", "datetime", "epoch", "unix"
]);
const PUBLICATION_TIME_SUFFIX = /(?:at|for|date|time|timestamp|datetime|epoch|unix)(?:utc|gmt|iso|ms|seconds|epoch|unix)*$/;

function normalizePublicationKey(value) {
  return String(value ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isPublicationTimestampKey(key, currentPath) {
  const normalizedKey = normalizePublicationKey(key);
  if (PUBLICATION_TIMESTAMP_KEYS.has(normalizedKey)) return true;

  const hasTemporalSuffix = PUBLICATION_TIME_SUFFIX.test(normalizedKey);
  if (hasTemporalSuffix
      && (/(publish|publication|schedule)/.test(normalizedKey)
        || /^(actual|planned)/.test(normalizedKey))) {
    return true;
  }

  const normalizedPath = normalizePublicationKey(currentPath);
  const insidePublicationContext = /(publish|publication|schedule|actual|planned)/.test(normalizedPath);
  return insidePublicationContext && GENERIC_PUBLICATION_TIME_KEYS.has(normalizedKey);
}

function findPublicationTimestampPaths(value, currentPath = "plan", matches = []) {
  if (value === null || typeof value !== "object") return matches;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findPublicationTimestampPaths(entry, `${currentPath}[${index}]`, matches));
    return matches;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${currentPath}.${key}`;
    if (isPublicationTimestampKey(key, currentPath)) matches.push(childPath);
    findPublicationTimestampPaths(child, childPath, matches);
  }
  return matches;
}

export function validatePromotionalShortPlan(plan, products, options = {}) {
  const errors = [];
  const referenceNow = options.now instanceof Date && Number.isFinite(options.now.getTime()) ? options.now : new Date();
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return ["plan must be a JSON object"];
  if (plan.channel !== "SonicVhibez") errors.push("channel must be exactly SonicVhibez");
  if (plan.timezone !== "Africa/Johannesburg") errors.push("timezone must be Africa/Johannesburg");
  const currentWeekOf = currentMondayInTimezone(
    referenceNow,
    plan.timezone === "Africa/Johannesburg" ? plan.timezone : "Africa/Johannesburg"
  );
  if (plan.maxShortsPerWeek !== 2) errors.push("maxShortsPerWeek must remain exactly 2");
  if (plan.publicationEnabled !== false) errors.push("publicationEnabled must remain false");
  if (plan.schedulingEnabled !== false) errors.push("schedulingEnabled must remain false");
  if (plan.calendarStatus !== "DRAFT_PREPARATION_ONLY_NO_PUBLICATION_DATES") {
    errors.push("calendarStatus must identify draft preparation without publication dates");
  }
  const publicationTimestampPaths = findPublicationTimestampPaths(plan);
  if (publicationTimestampPaths.length) {
    errors.push("publication timestamps are forbidden in a draft-preparation plan: " + publicationTimestampPaths.join(", "));
  }
  if (!Array.isArray(products)) errors.push("product registry must contain a products array");

  const productByUrl = new Map((Array.isArray(products) ? products : []).map(product => [product?.url, product]));
  const weekKeys = new Set();
  const itemIds = new Set();
  if (!Array.isArray(plan.weeks) || plan.weeks.length === 0) {
    errors.push("weeks must contain at least one draft-preparation week");
    return errors;
  }

  for (const week of plan.weeks) {
    const requireFreshKeywordEvidence = typeof week?.weekOf === "string" && week.weekOf >= currentWeekOf;
    if (!isRealMonday(week?.weekOf)) errors.push("each weekOf must be a real Monday in YYYY-MM-DD format");
    if (weekKeys.has(week?.weekOf)) errors.push("weekOf values must be unique");
    weekKeys.add(week?.weekOf);
    if (week?.status !== "DRAFT_ONLY") errors.push("each week status must be DRAFT_ONLY");
    if (!Array.isArray(week?.items)) {
      errors.push("each week must contain an items array");
      continue;
    }
    if (week.items.length > plan.maxShortsPerWeek) {
      errors.push(`week ${week.weekOf} exceeds the ${plan.maxShortsPerWeek}-Short weekly limit`);
    }

    for (const item of week.items) {
      const label = item?.id || "(unnamed item)";
      if (typeof item?.id !== "string" || !item.id.trim()) errors.push("every Short needs a stable non-empty id");
      else if (itemIds.has(item.id)) errors.push(`duplicate Short id: ${item.id}`);
      else itemIds.add(item.id);
      if (item?.channel !== "SonicVhibez") errors.push(`${label}: channel must be exactly SonicVhibez`);
      if (item?.status !== "DRAFT_ONLY") errors.push(`${label}: status must remain DRAFT_ONLY`);
      if (!Number.isInteger(item?.targetSeconds) || item.targetSeconds < 50 || item.targetSeconds > 60) {
        errors.push(`${label}: targetSeconds must be an integer from 50 to 60`);
      }
      if (typeof item?.title !== "string" || !item.title.trim() || item.title.length > 100) {
        errors.push(`${label}: title must be non-empty and at most 100 characters`);
      }
      const titleKeyword = typeof item?.primaryKeyword === "string" ? item.primaryKeyword.trim().toLowerCase() : "";
      if (titleKeyword && typeof item?.title === "string") {
        const titleKeywordPosition = item.title.toLowerCase().indexOf(titleKeyword);
        if (titleKeywordPosition < 0 || titleKeywordPosition > 24) {
          errors.push(`${label}: primary keyword must appear near the start of the title (within the first 25 characters)`);
        }
      }
      const wordCount = typeof item?.script === "string" ? item.script.trim().split(/\s+/).filter(Boolean).length : 0;
      if (wordCount < WORD_MIN || wordCount > WORD_MAX) errors.push(`${label}: script must contain ${WORD_MIN}–${WORD_MAX} words for an approximately 55-second Short`);

      const product = productByUrl.get(item?.productUrl);
      if (!product) errors.push(`${label}: productUrl must exactly match a product in config/products.json`);
      else if (!["approved", "candidate"].includes(product.status)) errors.push(`${label}: product must be an approved or explicitly held candidate record`);
      const secureProductHost = product ? getSecureProductHost(product.url) : "";
      if (product && !secureProductHost) errors.push(`${label}: product registry URL must be HTTPS and must not contain embedded credentials`);
      if (product) {
        const seller = product.promotionGate?.seller ?? {};
        if (seller.status !== "VERIFIED") errors.push(`${label}: seller evidence must be VERIFIED`);
        if (seller.sourceUrl !== product.url) errors.push(`${label}: seller evidence sourceUrl must exactly match the product URL`);
        if (typeof seller.name !== "string" || !seller.name.trim()) errors.push(`${label}: verified seller name is required`);
        if (typeof seller.evidenceReference !== "string" || !seller.evidenceReference.trim()) errors.push(`${label}: seller evidence reference is required`);
        if (!isValidZonedIsoTimestamp(seller.verifiedAt)) {
          errors.push(`${label}: seller verification needs a timezone-qualified timestamp`);
        } else {
          const sellerEvidenceAgeMs = referenceNow.getTime() - Date.parse(seller.verifiedAt);
          if (sellerEvidenceAgeMs > SELLER_EVIDENCE_MAX_AGE_MS || sellerEvidenceAgeMs < -SELLER_EVIDENCE_FUTURE_SKEW_MS) {
            errors.push(`${label}: seller evidence must be no more than 14 days old and cannot be more than 5 minutes in the future`);
          }
        }
      }
      if (product?.status === "candidate") {
        if (item?.status !== "DRAFT_ONLY") errors.push(`${label}: candidate products may appear only in DRAFT_ONLY content`);
        const gate = product.promotionGate ?? {};
        const productHost = secureProductHost;
        const isSelarProduct = productHost === "selar.com" || productHost.endsWith(".selar.com");
        if (isSelarProduct) {
          if (!isCalendarDate(gate.compensation?.verifiedAt)) {
            errors.push(`${label}: owner-confirmed Selar sales need a calendar-valid YYYY-MM-DD confirmation date`);
          }
        } else if (!isValidZonedIsoTimestamp(gate.compensation?.verifiedAt)) {
          errors.push(`${label}: external affiliate compensation needs a timezone-qualified verification timestamp`);
        }
        if (typeof gate.compensation?.evidenceReference !== "string" || !gate.compensation.evidenceReference.trim()) {
          errors.push(`${label}: candidate compensation needs an exact relationship evidence reference`);
        }
        if (gate.disclosure?.status !== "UNVERIFIED") errors.push(`${label}: candidate disclosure status must remain UNVERIFIED`);
      }
      if (typeof item?.productId !== "string" || item.productId !== product?.id) {
        errors.push(`${label}: productId must match the exact product registry record`);
      }

      if (item?.visibility !== "private") errors.push(`${label}: visibility must be exactly private while the Short remains draft-only`);
      if (typeof item?.primaryKeyword !== "string" || !item.primaryKeyword.trim()) errors.push(`${label}: primaryKeyword is required`);
      const firstDescriptionLines = String(item?.description ?? "").slice(0, 240).toLowerCase();
      if (!firstDescriptionLines.includes(String(item?.primaryKeyword ?? "").toLowerCase())) {
        errors.push(`${label}: primary keyword must appear naturally near the start of the description`);
      }
      if (typeof item?.description !== "string" || !item.description.includes(item?.productUrl ?? "")) {
        errors.push(`${label}: description must contain the exact product URL`);
      }
      const expectedRelationshipStatus = product?.url && (() => {
        try { const host = new URL(product.url).hostname.toLowerCase(); return host === "selar.com" || host.endsWith(".selar.com"); }
        catch { return false; }
      })() ? "OWNER_CONFIRMED_DIRECT_SALES" : "UNVERIFIED";
      const productDisclosure = product?.promotionGate?.disclosure ?? {};
      const hasOwnerApprovedDisclosure = productDisclosure.status === "OWNER_APPROVED";
      const validOwnerApprovedDisclosure = hasOwnerApprovedDisclosure
        && typeof productDisclosure.text === "string" && productDisclosure.text.trim()
        && isValidZonedIsoTimestamp(productDisclosure.approvedAt)
        && typeof productDisclosure.approvalReference === "string" && productDisclosure.approvalReference.trim();
      const productName = typeof product?.name === "string" ? product.name.trim() : "";
      const productNameCore = productName.split(/\s+[–—]\s+/)[0].trim();
      const productReferences = [productName, productNameCore, product?.url]
        .filter(value => typeof value === "string" && value.trim());
      if (hasOwnerApprovedDisclosure && !validOwnerApprovedDisclosure) {
        errors.push(`${label}: product registry owner-approved disclosure evidence is incomplete`);
      }
      if (validOwnerApprovedDisclosure) {
        const itemDisclosure = item?.disclosure ?? {};
        if (itemDisclosure.status !== "APPROVED"
            || itemDisclosure.relationshipStatus !== expectedRelationshipStatus
            || itemDisclosure.requiredBeforeRelease !== true
            || itemDisclosure.approvedAt !== productDisclosure.approvedAt
            || itemDisclosure.approvalReference !== productDisclosure.approvalReference) {
          errors.push(`${label}: disclosure approval must match the exact owner-approved product registry record`);
        }
        const scriptText = String(item?.script ?? "");
        const advertisementIndex = scriptText.indexOf("Advertisement.");
        const disclosureIndex = scriptText.indexOf(productDisclosure.text);
        const scriptProductReferenceIndex = firstTextIndex(scriptText, productReferences);
        if (advertisementIndex < 0 || disclosureIndex < 0 || advertisementIndex > disclosureIndex) {
          errors.push(`${label}: script must place an advertisement identifier before the exact owner-approved direct-sales disclosure`);
        }
        if (scriptProductReferenceIndex >= 0 && disclosureIndex >= scriptProductReferenceIndex) {
          errors.push(`${label}: script must place the exact owner-approved disclosure before the product name or link`);
        }
        const description = String(item?.description ?? "");
        const descriptionAdvertisementIndex = description.search(/^ADVERTISEMENT$/m);
        const descriptionDisclosureIndex = description.indexOf(productDisclosure.text);
        const descriptionProductReferenceIndex = firstTextIndex(description, productReferences);
        if (!/^ADVERTISEMENT$/m.test(description) || descriptionDisclosureIndex < 0) {
          errors.push(`${label}: description must show an ADVERTISEMENT identifier and the exact owner-approved disclosure`);
        }
        if (descriptionProductReferenceIndex >= 0
            && (descriptionAdvertisementIndex < 0
              || descriptionAdvertisementIndex > descriptionProductReferenceIndex
              || descriptionDisclosureIndex < 0
              || descriptionDisclosureIndex >= descriptionProductReferenceIndex)) {
          errors.push(`${label}: description must place ADVERTISEMENT and the exact owner-approved disclosure before the product name or link`);
        }
        if (/DISCLOSURE HOLD/i.test(description)) {
          errors.push(`${label}: an owner-approved disclosure must not be labelled as a disclosure hold`);
        }
      } else {
        const scriptText = String(item?.script ?? "");
        const internalHoldIndex = scriptText.toLowerCase().indexOf("[internal hold");
        const scriptProductReferenceIndex = firstTextIndex(scriptText, productReferences);
        if (!/^\[INTERNAL HOLD — NOT SPOKEN\./i.test(scriptText)
            || internalHoldIndex < 0
            || (scriptProductReferenceIndex >= 0 && internalHoldIndex > scriptProductReferenceIndex)) {
          errors.push(`${label}: candidate script must start with a non-spoken internal hold before any product mention`);
        }
        if (typeof productDisclosure.text === "string" && productDisclosure.text.trim()
            && scriptText.includes(productDisclosure.text)) {
          errors.push(`${label}: candidate script must not present unapproved disclosure wording as approved narration`);
        }
        const description = String(item?.description ?? "");
        const descriptionHoldIndex = description.toLowerCase().indexOf("disclosure hold");
        const descriptionProductReferenceIndex = firstTextIndex(description, productReferences);
        if (descriptionHoldIndex < 0
            || (descriptionProductReferenceIndex >= 0 && descriptionHoldIndex > descriptionProductReferenceIndex)) {
          errors.push(`${label}: candidate description must place DISCLOSURE HOLD before the product name and link`);
        }
        if (typeof productDisclosure.text === "string" && productDisclosure.text.trim()
            && description.includes(productDisclosure.text)) {
          const proposedLabelIndex = description.toLowerCase().indexOf("proposed wording, not approved");
          const proposedTextIndex = description.indexOf(productDisclosure.text);
          if (proposedLabelIndex < 0 || proposedLabelIndex > proposedTextIndex) {
            errors.push(`${label}: unapproved disclosure text must be labelled as proposed and not approved before it appears`);
          }
        }
        if (item?.disclosure?.status !== "HOLD"
            || item.disclosure.relationshipStatus !== expectedRelationshipStatus
            || item.disclosure.requiredBeforeRelease !== true) {
          errors.push(`${label}: disclosure must remain on HOLD with the exact relationship status recorded`);
        }
      }
      if (!Array.isArray(item?.keywordPhrases) || item.keywordPhrases.length < 3
          || !item.keywordPhrases.some(row => typeof row?.phrase === "string" && row.phrase.trim().toLowerCase() === item?.primaryKeyword?.toLowerCase())) {
        errors.push(`${label}: keywordPhrases must include the primary phrase and at least two related phrases`);
      }
      if (Array.isArray(item?.keywordPhrases)) {
        if (item.keywordPhrases.length > 8) {
          errors.push(`${label}: keywordPhrases must not exceed eight phrases; avoid keyword stuffing`);
        }
        const normalizedPhrases = item.keywordPhrases.map(row =>
          typeof row?.phrase === "string" ? row.phrase.trim().toLowerCase() : ""
        );
        if (normalizedPhrases.some(phrase => !phrase || phrase.length > 100)) {
          errors.push(`${label}: each keyword phrase must be non-empty and no longer than 100 characters`);
        }
        if (new Set(normalizedPhrases).size !== normalizedPhrases.length) {
          errors.push(`${label}: keywordPhrases must be unique after trimming and case normalization`);
        }
      }
      const evidence = item?.keywordEvidence;
      const evidenceTimestampValid = isValidZonedIsoTimestamp(evidence?.researchedAt);
      if (!evidenceTimestampValid) {
        errors.push(`${label}: keyword evidence needs a valid research timestamp`);
      } else {
        const evidenceAgeMs = referenceNow.getTime() - Date.parse(evidence.researchedAt);
        if (evidenceAgeMs < -KEYWORD_EVIDENCE_FUTURE_SKEW_MS) {
          errors.push(`${label}: keyword evidence cannot be more than 5 minutes in the future`);
        } else if (requireFreshKeywordEvidence && evidenceAgeMs > KEYWORD_EVIDENCE_MAX_AGE_MS) {
          errors.push(`${label}: keyword evidence must be no more than 14 days old for current or future draft weeks`);
        }
      }
      const evidenceNote = typeof evidence?.note === "string" ? evidence.note.trim() : "";
      if (evidence?.provider === "vidIQ") {
        if (evidence.type !== "estimated_monthly_searches" || !evidenceNote || !/estimate|estimated|provider/i.test(evidenceNote)) {
          errors.push(`${label}: measured keyword evidence must identify vidIQ and clearly label search-volume figures as estimates`);
        }
      } else if (evidence?.provider === "web_search") {
        const sourcesValid = Array.isArray(evidence.sources) && evidence.sources.length > 0
          && evidence.sources.every(source => typeof source?.title === "string" && source.title.trim()
            && typeof source?.url === "string" && /^https:\/\//i.test(source.url)
            && typeof source?.whyRelevant === "string" && source.whyRelevant.trim());
        const hasUnmeasuredVolume = Array.isArray(item?.keywordPhrases) && item.keywordPhrases.some(row =>
          ["estimatedMonthlySearches", "volume", "volumeScore", "competition", "growthPct"].some(key => Object.hasOwn(row ?? {}, key))
        );
        if (evidence.type !== "qualitative_search_intent" || !evidenceNote
            || !/qualitative|no measured volume|volume unavailable/i.test(evidenceNote)
            || !sourcesValid || hasUnmeasuredVolume) {
          errors.push(`${label}: qualitative keyword evidence needs a clear no-volume caveat, dated HTTPS sources and no invented volume or competition metrics`);
        }
      } else {
        errors.push(`${label}: keyword evidence must use measured vidIQ estimates or qualitative web-search intent evidence`);
      }
      if (!Array.isArray(item?.hashtags) || item.hashtags.length < 3
          || item.hashtags.some(tag => typeof tag !== "string" || !/^#[A-Za-z0-9]+$/.test(tag))) {
        errors.push(`${label}: provide at least three concise, valid hashtags`);
      }
      if (typeof item?.thumbnailDirection !== "string" || !item.thumbnailDirection.trim()) errors.push(`${label}: thumbnailDirection is required`);
      if (!Array.isArray(item?.productionChecklist) || item.productionChecklist.length < 6
          || item.productionChecklist.some(check => typeof check !== "string" || !check.trim())) {
        errors.push(`${label}: productionChecklist must contain at least six actionable checks`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const planPath = process.argv[2] ?? "content/promotional-short-plan.json";
  try {
    const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
    const config = JSON.parse(fs.readFileSync("config/products.json", "utf8"));
    const errors = validatePromotionalShortPlan(plan, config.products);
    if (errors.length) {
      console.error("BLOCKED — promotional Short draft plan failed validation:");
      for (const error of errors) console.error("- " + error);
      process.exit(1);
    }
    const count = plan.weeks.reduce((total, week) => total + week.items.length, 0);
    console.log(`PASS — ${count} SonicVhibez Short drafts; weekly cap enforced; scheduling and publication remain disabled. This is draft-plan validation only.`);
  } catch (error) {
    console.error("BLOCKED — unable to read or validate promotional Short draft plan: " + error.message);
    process.exit(2);
  }
}
