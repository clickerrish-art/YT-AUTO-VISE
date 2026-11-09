#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidZonedIsoTimestamp } from "./schedule-policy.mjs";

const WORD_MIN = 90;
const WORD_MAX = 135;

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

export function validatePromotionalShortPlan(plan, products) {
  const errors = [];
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return ["plan must be a JSON object"];
  if (plan.channel !== "SonicVhibez") errors.push("channel must be exactly SonicVhibez");
  if (plan.timezone !== "Africa/Johannesburg") errors.push("timezone must be Africa/Johannesburg");
  if (plan.maxShortsPerWeek !== 2) errors.push("maxShortsPerWeek must remain exactly 2");
  if (plan.publicationEnabled !== false) errors.push("publicationEnabled must remain false");
  if (plan.schedulingEnabled !== false) errors.push("schedulingEnabled must remain false");
  if (plan.calendarStatus !== "DRAFT_PREPARATION_ONLY_NO_PUBLICATION_DATES") {
    errors.push("calendarStatus must identify draft preparation without publication dates");
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
      if (product?.status === "candidate") {
        if (item?.status !== "DRAFT_ONLY") errors.push(`${label}: candidate products may appear only in DRAFT_ONLY content`);
        const gate = product.promotionGate ?? {};
        if (gate.seller?.status !== "VERIFIED") errors.push(`${label}: candidate seller evidence must be VERIFIED from its exact Selar URL`);
        if (gate.seller?.name !== "Click 47") errors.push(`${label}: candidate seller name must match the verified Selar listing`);
        if (gate.seller?.sourceUrl !== product.url) errors.push(`${label}: candidate seller evidence URL must match the exact product URL`);
        if (!isValidZonedIsoTimestamp(gate.seller?.verifiedAt)) errors.push(`${label}: candidate seller verification needs a valid timezone-qualified timestamp`);
        if (typeof gate.seller?.evidenceReference !== "string" || !gate.seller.evidenceReference.trim()) errors.push(`${label}: candidate seller verification needs an evidence reference`);
        if (gate.brandAuthorization?.status !== "OWNER_CONFIRMED") errors.push(`${label}: candidate SonicVhibez brand authorization must be owner-confirmed`);
        if (gate.brandAuthorization?.brand !== "SonicVhibez") errors.push(`${label}: candidate brand authorization must name exactly SonicVhibez`);
        if (!isValidZonedIsoTimestamp(gate.brandAuthorization?.confirmedAt)) errors.push(`${label}: candidate brand authorization needs a valid timezone-qualified confirmation timestamp`);
        if (typeof gate.brandAuthorization?.approvalReference !== "string" || !gate.brandAuthorization.approvalReference.trim()) errors.push(`${label}: candidate brand authorization needs an owner approval reference`);
        if (gate.compensation?.status !== "OWNER_CONFIRMED" || String(gate.compensation?.type).toLowerCase() !== "direct_sales_revenue") errors.push(`${label}: Selar candidate compensation must be owner-confirmed direct sales revenue`);
        if (gate.disclosure?.status !== "UNVERIFIED") errors.push(`${label}: candidate disclosure status must remain UNVERIFIED`);
      }
      if (typeof item?.productId !== "string" || item.productId !== product?.id) {
        errors.push(`${label}: productId must match the exact product registry record`);
      }

      if (Object.hasOwn(item ?? {}, "scheduledAt") || Object.hasOwn(item ?? {}, "publishedAt")
          || (Object.hasOwn(item ?? {}, "publicationAt") && item.publicationAt !== null)) {
        errors.push(`${label}: publication timestamps are forbidden in a draft-preparation plan`);
      }
      if (item?.visibility && item.visibility !== "private") errors.push(`${label}: only private visibility may be represented`);
      if (typeof item?.primaryKeyword !== "string" || !item.primaryKeyword.trim()) errors.push(`${label}: primaryKeyword is required`);
      const firstDescriptionLines = String(item?.description ?? "").slice(0, 240).toLowerCase();
      if (!firstDescriptionLines.includes(String(item?.primaryKeyword ?? "").toLowerCase())) {
        errors.push(`${label}: primary keyword must appear naturally near the start of the description`);
      }
      if (typeof item?.description !== "string" || !item.description.includes(item?.productUrl ?? "")) {
        errors.push(`${label}: description must contain the exact product URL`);
      }
      if (!/DISCLOSURE HOLD/i.test(item?.description ?? "")) errors.push(`${label}: description must retain an explicit disclosure hold`);
      if (item?.disclosure?.status !== "HOLD" || item.disclosure.relationshipStatus !== "UNVERIFIED"
          || item.disclosure.requiredBeforeRelease !== true) {
        errors.push(`${label}: unresolved promotion relationship must remain on disclosure hold`);
      }
      if (!Array.isArray(item?.keywordPhrases) || item.keywordPhrases.length < 3
          || !item.keywordPhrases.some(row => typeof row?.phrase === "string" && row.phrase.toLowerCase() === item?.primaryKeyword?.toLowerCase())) {
        errors.push(`${label}: keywordPhrases must include the primary phrase and at least two related phrases`);
      }
      const evidence = item?.keywordEvidence;
      const evidenceTimestampValid = isValidZonedIsoTimestamp(evidence?.researchedAt);
      if (!evidenceTimestampValid) {
        errors.push(`${label}: keyword evidence needs a valid research timestamp`);
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
