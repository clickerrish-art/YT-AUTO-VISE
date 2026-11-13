import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validatePromotionalShortPlan } from "../scripts/validate-promotional-short-plan.mjs";

const checkedInPlan = JSON.parse(fs.readFileSync("content/promotional-short-plan.json", "utf8"));
const products = JSON.parse(fs.readFileSync("config/products.json", "utf8")).products;
const clone = value => structuredClone(value);

test("creator-education Shorts stay within the two-item weekly cap across draft-only weeks", () => {
  const errors = validatePromotionalShortPlan(checkedInPlan, products);
  assert.deepEqual(errors, []);
  assert.equal(checkedInPlan.weeks[0].weekOf, "2026-11-09");
  assert.equal(checkedInPlan.weeks[0].items.length, 2);
  assert.equal(checkedInPlan.weeks[1].weekOf, "2026-11-16");
  assert.equal(checkedInPlan.weeks[1].items.length, 2);
  assert.ok(checkedInPlan.weeks[1].items.some(item => item.id === "sonicvhibez-short-006-niche-selection"));
  assert.ok(checkedInPlan.weeks.every(week => week.items.length <= 2));
  assert.ok(checkedInPlan.weeks.every(week => week.items.every(item => item.targetSeconds === 55)));
});

test("owner-approved direct-sales disclosure is carried verbatim in the wildlife Short script and description", () => {
  const plan = clone(checkedInPlan);
  const item = plan.weeks[1].items.find(row => row.id === "sonicvhibez-short-005-wildlife-story-sequence");
  const product = products.find(row => row.id === "wildlife-creators-vault");
  const approval = product.promotionGate.disclosure;

  assert.equal(item.disclosure.status, "APPROVED");
  assert.equal(item.disclosure.approvedAt, approval.approvedAt);
  assert.equal(item.disclosure.approvalReference, approval.approvalReference);
  assert.ok(item.script.indexOf("Advertisement.") < item.script.indexOf("Complete YouTube Wildlife Creator's Vault"));
  assert.ok(item.script.includes(approval.text));
  assert.ok(item.script.indexOf("Advertisement.") < item.script.indexOf(approval.text));
  assert.match(item.description, /^ADVERTISEMENT$/m);
  assert.ok(item.description.includes(approval.text));
  assert.equal(/DISCLOSURE HOLD/i.test(item.description), false);
  assert.deepEqual(validatePromotionalShortPlan(plan, products), []);

  const alteredScript = clone(plan);
  const alteredItem = alteredScript.weeks[1].items.find(row => row.id === item.id);
  alteredItem.script = alteredItem.script.replace(approval.text, "Purchases may support this business.");
  assert.ok(validatePromotionalShortPlan(alteredScript, products)
    .some(error => /script must place an advertisement identifier before the exact owner-approved direct-sales disclosure/.test(error)));

  const alteredApproval = clone(plan);
  const alteredApprovalItem = alteredApproval.weeks[1].items.find(row => row.id === item.id);
  alteredApprovalItem.disclosure.approvalReference = "unrelated approval";
  assert.ok(validatePromotionalShortPlan(alteredApproval, products)
    .some(error => /disclosure approval must match the exact owner-approved product registry record/.test(error)));
});

test("candidate seller verification is required while direct Selar sales are owner-confirmed and disclosure remains unresolved", () => {
  const candidates = clone(products);
  const candidate = candidates.find(product => product.status === "candidate");
  assert.ok(candidate);
  candidate.promotionGate.seller.status = "UNVERIFIED";
  assert.ok(validatePromotionalShortPlan(checkedInPlan, candidates).some(error => /seller evidence must be VERIFIED/.test(error)));
});

test("external candidate links require verified affiliate classification rather than Selar seller assumptions", () => {
  const candidateProducts = clone(products);
  const candidate = candidateProducts.find(product => product.status === "candidate");
  assert.ok(candidate);
  const externalUrl = "https://www.serengeti.example/creator-product";
  candidate.url = externalUrl;
  candidate.promotionGate.seller = {
    status: "VERIFIED",
    name: "Serengeti Partner Store",
    sourceUrl: externalUrl,
    verifiedAt: "2026-11-09T10:00:00+02:00",
    evidenceReference: "owner-supplied external affiliate listing evidence"
  };
  candidate.promotionGate.compensation = {
    status: "VERIFIED",
    type: "affiliate",
    verifiedAt: "2026-11-09T10:00:00+02:00",
    evidenceReference: "verified affiliate relationship for the exact external listing"
  };
  const plan = clone(checkedInPlan);
  const items = plan.weeks.flatMap(week => week.items).filter(row => row.productId === candidate.id);
  assert.ok(items.length);
  for (const item of items) {
    const previousUrl = item.productUrl;
    item.productUrl = externalUrl;
    item.description = item.description.replaceAll(previousUrl, externalUrl);
    item.disclosure.relationshipStatus = "UNVERIFIED";
  }
  const errors = validatePromotionalShortPlan(plan, candidateProducts);
  assert.equal(errors.some(error => /Click 47/.test(error)), false);
  assert.equal(errors.some(error => /affiliate seller name must be recorded/.test(error)), false);
  assert.equal(errors.some(error => /candidate compensation must match the URL relationship/.test(error)), false);
  assert.equal(errors.some(error => /exact relationship status recorded/.test(error)), false);
});

test("candidate commercial evidence requires valid dates and exact relationship references", () => {
  const candidateProducts = clone(products);
  const candidate = candidateProducts.find(product => product.status === "candidate");
  assert.ok(candidate);
  candidate.promotionGate.compensation.verifiedAt = "2026-02-31";
  const plan = clone(checkedInPlan);
  const errors = validatePromotionalShortPlan(plan, candidateProducts);
  assert.ok(errors.some(error => /calendar-valid YYYY-MM-DD confirmation date/.test(error)));

  candidate.promotionGate.compensation.verifiedAt = "2026-11-09";
  candidate.promotionGate.compensation.evidenceReference = "";
  assert.ok(validatePromotionalShortPlan(plan, candidateProducts)
    .some(error => /candidate compensation needs an exact relationship evidence reference/.test(error)));
});

test("promotional draft plans reject insecure product registry URLs", () => {
  const candidateProducts = clone(products);
  const candidate = candidateProducts.find(product => product.status === "candidate");
  assert.ok(candidate);
  const insecureUrl = "http://example-affiliate-store.test/product";
  candidate.url = insecureUrl;
  candidate.promotionGate.seller.sourceUrl = insecureUrl;
  const plan = clone(checkedInPlan);
  const item = plan.weeks.flatMap(week => week.items).find(row => row.productId === candidate.id);
  assert.ok(item);
  item.productUrl = insecureUrl;
  const errors = validatePromotionalShortPlan(plan, candidateProducts);
  assert.ok(errors.some(error => /product registry URL must be HTTPS and must not contain embedded credentials/.test(error)));
});

test("the weekly promotional Short cap rejects a third item", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items.push(clone(plan.weeks[0].items[0]));
  plan.weeks[0].items[2].id = "third-short";
  assert.ok(validatePromotionalShortPlan(plan, products).some(error => /exceeds the 2-Short weekly limit/.test(error)));
});

test("promotional Short drafts require explicit private visibility", () => {
  for (const [label, visibility] of [["missing", undefined], ["public", "public"], ["unlisted", "unlisted"]]) {
    const plan = clone(checkedInPlan);
    const item = plan.weeks[0].items[0];
    if (visibility === undefined) delete item.visibility;
    else item.visibility = visibility;
    assert.ok(
      validatePromotionalShortPlan(plan, products).some(error => /visibility must be exactly private/.test(error)),
      `${label} visibility must fail closed`
    );
  }
});

test("candidate products stay draft-only and keep the disclosure hold", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items[0].status = "READY_FOR_PRIVATE_UPLOAD";
  assert.ok(validatePromotionalShortPlan(plan, products).some(error => /status must remain DRAFT_ONLY/.test(error)));
  plan.weeks[0].items[0].status = "DRAFT_ONLY";
  plan.weeks[0].items[0].disclosure.status = "APPROVED";
  assert.ok(validatePromotionalShortPlan(plan, products).some(error => /disclosure must remain on HOLD/i.test(error)));
});

test("publication timestamps and live scheduling are forbidden in the draft plan", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items[0].scheduledAt = "2026-11-12T10:00:00+02:00";
  assert.ok(validatePromotionalShortPlan(plan, products).some(error => /publication timestamps are forbidden/.test(error)));
  const unsafe = clone(checkedInPlan);
  unsafe.schedulingEnabled = true;
  assert.ok(validatePromotionalShortPlan(unsafe, products).some(error => /schedulingEnabled must remain false/.test(error)));
});

test("the plan rejects another channel and non-Monday week boundaries", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items[0].channel = "Nature Frontiers";
  plan.weeks[0].weekOf = "2026-11-10";
  const errors = validatePromotionalShortPlan(plan, products);
  assert.ok(errors.some(error => /channel must be exactly SonicVhibez/.test(error)));
  assert.ok(errors.some(error => /real Monday/.test(error)));
});

test("SEO and keyword evidence are required before a draft can pass", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items[1].description = "A general creator note. " + plan.weeks[0].items[1].productUrl;
  plan.weeks[0].items[1].keywordEvidence.researchedAt = "2026-11-06T10:46:19";
  const errors = validatePromotionalShortPlan(plan, products);
  assert.ok(errors.some(error => /primary keyword must appear naturally near the start/.test(error)));
  assert.ok(errors.some(error => /valid research timestamp/.test(error)));
});

test("primary keyword must appear near the start of the SEO title", () => {
  const plan = clone(checkedInPlan);
  const item = plan.weeks[0].items[0];
  const originalTitle = item.title;

  item.title = "A complete beginner guide: " + originalTitle;
  const lateKeywordErrors = validatePromotionalShortPlan(plan, products);
  assert.ok(lateKeywordErrors.some(error => /primary keyword must appear near the start of the title/.test(error)));

  item.title = "Quick tip: " + originalTitle;
  const earlyKeywordErrors = validatePromotionalShortPlan(plan, products);
  assert.equal(earlyKeywordErrors.some(error => /primary keyword must appear near the start of the title/.test(error)), false);
});

test("qualitative web-search intent is accepted only with dated HTTPS sources and no invented volume", () => {
  const plan = clone(checkedInPlan);
  const item = plan.weeks[1].items[1];
  assert.equal(item.id, "sonicvhibez-short-006-niche-selection");
  assert.equal(validatePromotionalShortPlan(plan, products).length, 0);

  const missingSources = clone(plan);
  missingSources.weeks[1].items[0].keywordEvidence.sources = [];
  assert.ok(validatePromotionalShortPlan(missingSources, products).some(error => /qualitative keyword evidence needs/.test(error)));

  const insecureSource = clone(plan);
  insecureSource.weeks[1].items[0].keywordEvidence.sources[0].url = "http://example.com/source";
  assert.ok(validatePromotionalShortPlan(insecureSource, products).some(error => /qualitative keyword evidence needs/.test(error)));

  const inventedVolume = clone(plan);
  inventedVolume.weeks[1].items[0].keywordPhrases[0].estimatedMonthlySearches = 10000;
  assert.ok(validatePromotionalShortPlan(inventedVolume, products).some(error => /no invented volume or competition metrics/.test(error)));
});


test("keyword evidence must be current and cannot be materially future-dated", () => {
  const evidenceTimes = checkedInPlan.weeks.flatMap(week =>
    week.items.map(item => Date.parse(item.keywordEvidence.researchedAt))
  );
  const now = new Date(Math.max(...evidenceTimes));
  assert.deepEqual(validatePromotionalShortPlan(checkedInPlan, products, { now }), []);

  const stale = clone(checkedInPlan);
  stale.weeks[0].items[0].keywordEvidence.researchedAt =
    new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
  assert.ok(validatePromotionalShortPlan(stale, products, { now })
    .some(error => /keyword evidence must be no more than 14 days old/.test(error)));

  const future = clone(checkedInPlan);
  future.weeks[0].items[0].keywordEvidence.researchedAt =
    new Date(now.getTime() + 5 * 60 * 1000 + 1).toISOString();
  assert.ok(validatePromotionalShortPlan(future, products, { now })
    .some(error => /cannot be more than 5 minutes in the future/.test(error)));
});

test("December 7 wildlife B-roll Short has current qualitative evidence and approved Vault disclosure", () => {
  const week = checkedInPlan.weeks.find(row => row.weekOf === "2026-12-07");
  assert.ok(week);
  assert.equal(week.items.length, 1);
  const item = week.items[0];
  assert.equal(item.id, "sonicvhibez-short-011-wildlife-broll");
  assert.equal(item.targetSeconds, 55);
  assert.equal(item.status, "DRAFT_ONLY");
  assert.equal(item.visibility, "private");
  assert.equal(item.productUrl, "https://selar.com/0u19v8u99l");
  assert.equal(item.disclosure.status, "APPROVED");
  assert.equal(item.keywordEvidence.type, "qualitative_search_intent");
  assert.ok(item.keywordEvidence.sources.length >= 3);
  assert.deepEqual(validatePromotionalShortPlan(checkedInPlan, products), []);
});

test("November 30 wildlife fact-check Short uses current qualitative evidence and the exact approved Vault disclosure", () => {
  const week = checkedInPlan.weeks.find(row => row.weekOf === "2026-11-30");
  assert.ok(week);
  assert.equal(week.items.length, 2);
  const item = week.items.find(row => row.id === "sonicvhibez-short-009-wildlife-video-fact-check");
  const product = products.find(row => row.id === "wildlife-creators-vault");
  assert.ok(item);
  assert.equal(item.channel, "SonicVhibez");
  assert.equal(item.status, "DRAFT_ONLY");
  assert.equal(item.visibility, "private");
  assert.equal(item.targetSeconds, 55);
  assert.equal(item.primaryKeyword, "how to fact-check wildlife videos");
  assert.equal(item.productUrl, product.url);
  assert.equal(item.keywordEvidence.provider, "web_search");
  assert.equal(item.keywordEvidence.type, "qualitative_search_intent");
  assert.match(item.keywordEvidence.note, /no measured global search volume/i);
  assert.equal(item.disclosure.status, "APPROVED");
  assert.equal(item.disclosure.approvalReference, product.promotionGate.disclosure.approvalReference);
  assert.deepEqual(validatePromotionalShortPlan(checkedInPlan, products), []);
});


test("November 30 wildlife shot-list Short uses current qualitative intent and the exact approved Vault disclosure", () => {
  const week = checkedInPlan.weeks.find(row => row.weekOf === "2026-11-30");
  const item = week?.items.find(row => row.id === "sonicvhibez-short-010-wildlife-shot-list");
  const product = products.find(row => row.id === "wildlife-creators-vault");
  assert.ok(week);
  assert.equal(week.items.length, 2);
  assert.ok(item);
  assert.equal(item.channel, "SonicVhibez");
  assert.equal(item.status, "DRAFT_ONLY");
  assert.equal(item.visibility, "private");
  assert.equal(item.targetSeconds, 55);
  assert.equal(item.primaryKeyword, "wildlife documentary shot list");
  assert.equal(item.productUrl, product.url);
  assert.equal(item.keywordEvidence.provider, "web_search");
  assert.equal(item.keywordEvidence.type, "qualitative_search_intent");
  assert.match(item.keywordEvidence.note, /no measured global search volume/i);
  assert.equal(item.disclosure.status, "APPROVED");
  assert.equal(item.disclosure.approvalReference, product.promotionGate.disclosure.approvalReference);
  assert.ok(item.script.indexOf("Advertisement.") < item.script.indexOf(product.promotionGate.disclosure.text));
  assert.match(item.description, /^ADVERTISEMENT$/m);
  assert.ok(item.description.includes(product.promotionGate.disclosure.text));
  assert.deepEqual(validatePromotionalShortPlan(checkedInPlan, products), []);
});
