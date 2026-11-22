import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validatePromotionalShortPlan } from "../scripts/validate-promotional-short-plan.mjs";

const checkedInPlan = JSON.parse(fs.readFileSync("content/promotional-short-plan.json", "utf8"));
const products = JSON.parse(fs.readFileSync("config/products.json", "utf8")).products;
const clone = value => structuredClone(value);
const validatePlan = (plan, productRows = products, options = {}) => validatePromotionalShortPlan(plan, productRows, {
  now: new Date("2026-11-22T11:05:00+02:00"),
  ...options
});

test("creator-education Shorts stay within the two-item weekly cap across draft-only weeks", () => {
  const errors = validatePlan(checkedInPlan, products);
  assert.deepEqual(errors, []);
  assert.equal(checkedInPlan.weeks[0].weekOf, "2026-11-09");
  assert.equal(checkedInPlan.weeks[0].items.length, 2);
  assert.equal(checkedInPlan.weeks[1].weekOf, "2026-11-16");
  assert.equal(checkedInPlan.weeks[1].items.length, 2);
  assert.ok(checkedInPlan.weeks[1].items.some(item => item.id === "sonicvhibez-short-006-niche-selection"));
  assert.ok(checkedInPlan.weeks.every(week => week.items.length <= 2));
  assert.ok(checkedInPlan.weeks.every(week => week.items.every(item => item.targetSeconds === 55)));
});

test("approximately 55-second scripts accept 150-wpm tolerance and reject overlong copy", () => {
  const plan = clone(checkedInPlan);
  const item = plan.weeks.find(week => week.weekOf === "2026-11-23")
    .items.find(row => row.id === "sonicvhibez-short-007-ethical-wildlife-filming");
  const measuredWords = item.script.trim().split(/\s+/).filter(Boolean).length;
  assert.equal(measuredWords, 141);
  assert.deepEqual(validatePlan(plan, products), []);

  const tooLong = clone(plan);
  const tooLongItem = tooLong.weeks.find(week => week.weekOf === "2026-11-23")
    .items.find(row => row.id === item.id);
  tooLongItem.script += " extra extra extra extra extra extra extra extra extra extra";
  assert.ok(validatePlan(tooLong, products)
    .some(error => /script must contain 90–150 words/.test(error)));
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
  assert.deepEqual(validatePlan(plan, products), []);

  const alteredScript = clone(plan);
  const alteredItem = alteredScript.weeks[1].items.find(row => row.id === item.id);
  alteredItem.script = alteredItem.script.replace(approval.text, "Purchases may support this business.");
  assert.ok(validatePlan(alteredScript, products)
    .some(error => /script must place an advertisement identifier before the exact owner-approved direct-sales disclosure/.test(error)));

  const alteredApproval = clone(plan);
  const alteredApprovalItem = alteredApproval.weeks[1].items.find(row => row.id === item.id);
  alteredApprovalItem.disclosure.approvalReference = "unrelated approval";
  assert.ok(validatePlan(alteredApproval, products)
    .some(error => /disclosure approval must match the exact owner-approved product registry record/.test(error)));
});



test("approved disclosure must precede the product name and link in both narration and description", () => {
  const baseline = clone(checkedInPlan);
  const item = baseline.weeks.find(week => week.weekOf === "2026-11-16")
    .items.find(candidate => candidate.id === "sonicvhibez-short-005-wildlife-story-sequence");
  const product = products.find(candidate => candidate.id === "wildlife-creators-vault");
  const disclosure = product.promotionGate.disclosure.text;
  const productName = product.name.split(/\s+[–—]\s+/)[0].trim();

  const reorderedScript = clone(baseline);
  const scriptItem = reorderedScript.weeks.find(week => week.weekOf === "2026-11-16")
    .items.find(candidate => candidate.id === item.id);
  const scriptWithoutDisclosure = scriptItem.script.replace(disclosure, "");
  const scriptNameIndex = scriptWithoutDisclosure.indexOf(productName);
  scriptItem.script = scriptWithoutDisclosure.slice(0, scriptNameIndex)
    + productName + " " + disclosure
    + scriptWithoutDisclosure.slice(scriptNameIndex + productName.length);
  assert.ok(validatePlan(reorderedScript, products)
    .some(error => /script must place the exact owner-approved disclosure before the product name or link/.test(error)));

  const reorderedDescription = clone(baseline);
  const descriptionItem = reorderedDescription.weeks.find(week => week.weekOf === "2026-11-16")
    .items.find(candidate => candidate.id === item.id);
  const descriptionWithoutDisclosure = descriptionItem.description.replace(disclosure, "");
  const descriptionNameIndex = descriptionWithoutDisclosure.indexOf(productName);
  descriptionItem.description = descriptionWithoutDisclosure.slice(0, descriptionNameIndex)
    + productName + " " + disclosure
    + descriptionWithoutDisclosure.slice(descriptionNameIndex + productName.length);
  assert.ok(validatePlan(reorderedDescription, products)
    .some(error => /description must place ADVERTISEMENT and the exact owner-approved disclosure before the product name or link/.test(error)));
});

test("every promotional product requires fresh seller evidence tied to its exact HTTPS listing", () => {
  const latestEvidence = Math.max(...checkedInPlan.weeks.flatMap(week =>
    week.items.flatMap(item => [item.keywordEvidence, item.currentIntentEvidence]
      .filter(evidence => evidence?.researchedAt)
      .map(evidence => Date.parse(evidence.researchedAt)))
  ));
  const latestSellerEvidence = Math.max(...products.map(product => Date.parse(product.promotionGate.seller.verifiedAt)));
  const now = new Date(Math.max(latestEvidence, latestSellerEvidence) + 60 * 1000);
  assert.deepEqual(validatePlan(checkedInPlan, products, { now }), []);

  const staleProducts = clone(products);
  staleProducts.find(product => product.id === "wildlife-creators-vault")
    .promotionGate.seller.verifiedAt = "2026-11-01T09:49:01+02:00";
  assert.ok(validatePlan(checkedInPlan, staleProducts, { now })
    .some(error => /seller evidence must be no more than 14 days old/.test(error)));

  const mismatchedProducts = clone(products);
  mismatchedProducts.find(product => product.id === "wildlife-creators-vault")
    .promotionGate.seller.sourceUrl = "https://selar.com/different-listing";
  assert.ok(validatePlan(checkedInPlan, mismatchedProducts, { now })
    .some(error => /seller evidence sourceUrl must exactly match the product URL/.test(error)));

  const futureProducts = clone(products);
  futureProducts.find(product => product.id === "wildlife-creators-vault")
    .promotionGate.seller.verifiedAt = new Date(now.getTime() + 6 * 60 * 1000).toISOString();
  assert.ok(validatePlan(checkedInPlan, futureProducts, { now })
    .some(error => /cannot be more than 5 minutes in the future/.test(error)));

  const unnamedProducts = clone(products);
  unnamedProducts.find(product => product.id === "wildlife-creators-vault")
    .promotionGate.seller.name = " ";
  assert.ok(validatePlan(checkedInPlan, unnamedProducts, { now })
    .some(error => /verified seller name is required/.test(error)));
});

test("the 90-Day Blueprint Short stays held without presenting unapproved wording as narration", () => {
  const item = checkedInPlan.weeks.find(week => week.weekOf === "2026-11-16")
    .items.find(candidate => candidate.id === "sonicvhibez-short-006-niche-selection");
  const product = products.find(candidate => candidate.id === "youtube-success-blueprint-90-day");
  assert.equal(item.productUrl, "https://selar.com/91j893378q");
  assert.equal(item.disclosure.status, "HOLD");
  assert.match(item.script, /^\[INTERNAL HOLD — NOT SPOKEN\./);
  assert.equal(item.script.includes(product.promotionGate.disclosure.text), false);
  assert.ok(item.script.toLowerCase().indexOf("[internal hold") < item.script.indexOf(product.name));
  assert.match(item.description, /DISCLOSURE HOLD — proposed wording, not approved for this product/);
  assert.ok(item.description.indexOf("DISCLOSURE HOLD") < item.description.indexOf(product.name));
  assert.ok(item.description.indexOf("DISCLOSURE HOLD") < item.description.indexOf(item.productUrl));
  assert.ok(item.description.indexOf("proposed wording, not approved") < item.description.indexOf(product.promotionGate.disclosure.text));
  const spokenWords = item.script.trim().split(/\s+/).filter(Boolean).length;
  assert.ok(spokenWords >= 90 && spokenWords <= 135);
  assert.deepEqual(validatePlan(checkedInPlan, products), []);

  const unsafeScript = clone(checkedInPlan);
  const unsafeScriptItem = unsafeScript.weeks.find(week => week.weekOf === "2026-11-16")
    .items.find(candidate => candidate.id === item.id);
  unsafeScriptItem.script = unsafeScriptItem.script
    .replace(/^\[INTERNAL HOLD[^\]]+\]\s*/i, "")
    .replace("Choosing a YouTube niche?", product.promotionGate.disclosure.text + " Choosing a YouTube niche?");
  assert.ok(validatePlan(unsafeScript, products)
    .some(error => /candidate script must start with a non-spoken internal hold/.test(error)
      || /candidate script must not present unapproved disclosure wording/.test(error)));

  const unsafeDescription = clone(checkedInPlan);
  const unsafeDescriptionItem = unsafeDescription.weeks.find(week => week.weekOf === "2026-11-16")
    .items.find(candidate => candidate.id === item.id);
  unsafeDescriptionItem.description = `Explore ${product.name}: ${product.url}\n\n` + unsafeDescriptionItem.description;
  assert.ok(validatePlan(unsafeDescription, products)
    .some(error => /candidate description must place DISCLOSURE HOLD before the product name and link/.test(error)));
});

test("candidate seller verification is required while direct Selar sales are owner-confirmed and disclosure remains unresolved", () => {
  const candidates = clone(products);
  const candidate = candidates.find(product => product.status === "candidate");
  assert.ok(candidate);
  candidate.promotionGate.seller.status = "UNVERIFIED";
  assert.ok(validatePlan(checkedInPlan, candidates).some(error => /seller evidence must be VERIFIED/.test(error)));
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
  const errors = validatePlan(plan, candidateProducts);
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
  const errors = validatePlan(plan, candidateProducts);
  assert.ok(errors.some(error => /calendar-valid YYYY-MM-DD confirmation date/.test(error)));

  candidate.promotionGate.compensation.verifiedAt = "2026-11-09";
  candidate.promotionGate.compensation.evidenceReference = "";
  assert.ok(validatePlan(plan, candidateProducts)
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
  const errors = validatePlan(plan, candidateProducts);
  assert.ok(errors.some(error => /product registry URL must be HTTPS and must not contain embedded credentials/.test(error)));
});

test("the weekly promotional Short cap rejects a third item", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items.push(clone(plan.weeks[0].items[0]));
  plan.weeks[0].items[2].id = "third-short";
  assert.ok(validatePlan(plan, products).some(error => /exceeds the 2-Short weekly limit/.test(error)));
});

test("promotional Short drafts require explicit private visibility", () => {
  for (const [label, visibility] of [["missing", undefined], ["public", "public"], ["unlisted", "unlisted"]]) {
    const plan = clone(checkedInPlan);
    const item = plan.weeks[0].items[0];
    if (visibility === undefined) delete item.visibility;
    else item.visibility = visibility;
    assert.ok(
      validatePlan(plan, products).some(error => /visibility must be exactly private/.test(error)),
      `${label} visibility must fail closed`
    );
  }
});

test("candidate products stay draft-only and keep the disclosure hold", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items[0].status = "READY_FOR_PRIVATE_UPLOAD";
  assert.ok(validatePlan(plan, products).some(error => /status must remain DRAFT_ONLY/.test(error)));
  plan.weeks[0].items[0].status = "DRAFT_ONLY";
  plan.weeks[0].items[0].disclosure.status = "APPROVED";
  assert.ok(validatePlan(plan, products).some(error => /disclosure must remain on HOLD/i.test(error)));
});

test("publication timestamps at any depth and live scheduling are forbidden in the draft plan", () => {
  const itemTimestamp = clone(checkedInPlan);
  itemTimestamp.weeks[0].items[0].scheduledAt = "2026-11-12T10:00:00+02:00";
  assert.ok(validatePlan(itemTimestamp, products).some(error => /publication timestamps are forbidden/.test(error)));

  const rootTimestamp = clone(checkedInPlan);
  rootTimestamp.publishedAt = "2026-11-12T10:00:00+02:00";
  assert.ok(validatePlan(rootTimestamp, products).some(error => /publication timestamps are forbidden/.test(error)));

  const nestedTimestamp = clone(checkedInPlan);
  nestedTimestamp.weeks[0].review = { metadata: { publicationAt: "2026-11-12T10:00:00+02:00" } };
  assert.ok(validatePlan(nestedTimestamp, products).some(error => /publication timestamps are forbidden/.test(error)));

  const unsafe = clone(checkedInPlan);
  unsafe.schedulingEnabled = true;
  assert.ok(validatePlan(unsafe, products).some(error => /schedulingEnabled must remain false/.test(error)));
});

test("draft plans reject nested auto-publish and non-draft flags at any depth", () => {
  const unsafeCases = [
    ["autoPublish", true],
    ["auto_publish", true],
    ["auto-publish", true],
    ["draft", false],
    ["draft", "false"],
    ["publishingEnabled", true],
    ["schedulingEnabled", true]
  ];
  for (const [key, value] of unsafeCases) {
    const unsafe = clone(checkedInPlan);
    unsafe.weeks[0].items[0].provider = { youtube: { [key]: value } };
    const errors = validatePlan(unsafe, products);
    assert.ok(
      errors.some(error => error.includes(`plan.weeks[0].items[0].provider.youtube.${key}`)),
      `${key}=${String(value)} must fail closed at any depth`
    );
  }

  const safe = clone(checkedInPlan);
  safe.weeks[0].items[0].provider = { youtube: { autoPublish: false, draft: true } };
  assert.deepEqual(validatePlan(safe, products), []);
});

test("draft plans reject alternate actual and scheduled publication timestamp field names at any depth", () => {
  for (const key of ["actualPublishedTimestamp","actualPublicationTimestamp","actualPublishTimestamp","scheduledPublicationTimestamp","scheduledPublishTimestamp","plannedPublicationTimestamp","plannedPublishTimestamp","publishedTime","publicationTime","publishTime","scheduledTime","plannedTime","actualTime","publishedDateTime","publicationDateTime","publishDateTime","scheduledDateTime","plannedDateTime","actualDateTime","actualPublishDateTime","scheduledPublishDateTime","plannedPublishDateTime"]) {
    const unsafe = clone(checkedInPlan);
    unsafe.weeks[0].items[0].provider = { youtube: { [key]: "2026-12-17T10:00:00+02:00" } };
    const errors = validatePlan(unsafe, products);
    assert.ok(
      errors.some(error => error.includes(`plan.weeks[0].items[0].provider.youtube.${key}`)),
      `${key} must be treated as a publication timestamp anywhere in the draft plan`
    );
  }
});


test("the plan rejects another channel and non-Monday week boundaries", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items[0].channel = "Nature Frontiers";
  plan.weeks[0].weekOf = "2026-11-10";
  const errors = validatePlan(plan, products);
  assert.ok(errors.some(error => /channel must be exactly SonicVhibez/.test(error)));
  assert.ok(errors.some(error => /real Monday/.test(error)));
});

test("SEO and keyword evidence are required before a draft can pass", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items[1].description = "A general creator note. " + plan.weeks[0].items[1].productUrl;
  plan.weeks[0].items[1].keywordEvidence.researchedAt = "2026-11-06T10:46:19";
  const errors = validatePlan(plan, products);
  assert.ok(errors.some(error => /primary keyword must appear naturally near the start/.test(error)));
  assert.ok(errors.some(error => /valid research timestamp/.test(error)));
});

test("primary keyword must appear near the start of the SEO title", () => {
  const plan = clone(checkedInPlan);
  const item = plan.weeks[0].items[0];
  const originalTitle = item.title;

  item.title = "A complete beginner guide: " + originalTitle;
  const lateKeywordErrors = validatePlan(plan, products);
  assert.ok(lateKeywordErrors.some(error => /primary keyword must appear near the start of the title/.test(error)));

  item.title = "Quick tip: " + originalTitle;
  const earlyKeywordErrors = validatePlan(plan, products);
  assert.equal(earlyKeywordErrors.some(error => /primary keyword must appear near the start of the title/.test(error)), false);
});

test("qualitative web-search intent is accepted only with dated HTTPS sources and no invented volume", () => {
  const plan = clone(checkedInPlan);
  const item = plan.weeks[1].items[1];
  assert.equal(item.id, "sonicvhibez-short-006-niche-selection");
  assert.equal(validatePlan(plan, products).length, 0);

  const missingSources = clone(plan);
  missingSources.weeks[1].items[0].keywordEvidence.sources = [];
  assert.ok(validatePlan(missingSources, products).some(error => /qualitative keyword evidence needs/.test(error)));

  const insecureSource = clone(plan);
  insecureSource.weeks[1].items[0].keywordEvidence.sources[0].url = "http://example.com/source";
  assert.ok(validatePlan(insecureSource, products).some(error => /qualitative keyword evidence needs/.test(error)));

  const inventedVolume = clone(plan);
  inventedVolume.weeks[1].items[0].keywordPhrases[0].estimatedMonthlySearches = 10000;
  assert.ok(validatePlan(inventedVolume, products).some(error => /no invented volume or competition metrics/.test(error)));
});


test("keyword evidence is fresh for active and future weeks while historical drafts keep their original research record", () => {
  const evidenceTimes = checkedInPlan.weeks.flatMap(week =>
    week.items.flatMap(item => [item.keywordEvidence, item.currentIntentEvidence]
      .filter(evidence => evidence?.researchedAt)
      .map(evidence => Date.parse(evidence.researchedAt)))
  );
  const latestSellerEvidence = Math.max(...products.map(product => Date.parse(product.promotionGate.seller.verifiedAt)));
  const now = new Date(Math.max(...evidenceTimes, latestSellerEvidence));
  assert.deepEqual(validatePlan(checkedInPlan, products, { now }), []);

  const historical = clone(checkedInPlan);
  const archivedItem = historical.weeks.find(week => week.weekOf === "2026-11-09").items[0];
  archivedItem.keywordEvidence.researchedAt =
    new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(validatePlan(historical, products, { now })
    .some(error => /keyword evidence must be no more than 14 days old/.test(error)), false,
    "past draft-preparation weeks retain their historical evidence without pretending it is current");

  const stale = clone(checkedInPlan);
  const activeItem = stale.weeks.find(week => week.weekOf === "2026-11-23").items[0];
  activeItem.keywordEvidence.researchedAt =
    new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
  assert.ok(validatePlan(stale, products, { now })
    .some(error => /keyword evidence must be no more than 14 days old/.test(error)));

  const future = clone(checkedInPlan);
  const futureItem = future.weeks.find(week => week.weekOf === "2026-11-23").items[0];
  futureItem.keywordEvidence.researchedAt =
    new Date(now.getTime() + 5 * 60 * 1000 + 1).toISOString();
  assert.ok(validatePlan(future, products, { now })
    .some(error => /cannot be more than 5 minutes in the future/.test(error)));
});

test("December 7 wildlife B-roll Short has current qualitative evidence and approved Vault disclosure", () => {
  const week = checkedInPlan.weeks.find(row => row.weekOf === "2026-12-07");
  assert.ok(week);
  assert.equal(week.items.length, 2);
  const item = week.items[0];
  assert.equal(item.id, "sonicvhibez-short-011-wildlife-broll");
  assert.equal(item.targetSeconds, 55);
  assert.equal(item.status, "DRAFT_ONLY");
  assert.equal(item.visibility, "private");
  assert.equal(item.productUrl, "https://selar.com/0u19v8u99l");
  assert.equal(item.disclosure.status, "APPROVED");
  assert.equal(item.keywordEvidence.type, "qualitative_search_intent");
  assert.ok(item.keywordEvidence.sources.length >= 3);
  assert.deepEqual(validatePlan(checkedInPlan, products), []);
});
test("December 14 YouTube Shorts analytics draft stays private and held for product-specific disclosure", () => {
  const week = checkedInPlan.weeks.find(row => row.weekOf === "2026-12-14");
  assert.ok(week);
  assert.equal(week.items.length, 2);
  const item = week.items.find(row => row.id === "sonicvhibez-short-013-youtube-shorts-analytics");
  assert.equal(item.targetSeconds, 55);
  assert.equal(item.status, "DRAFT_ONLY");
  assert.equal(item.visibility, "private");
  assert.equal(item.productUrl, "https://selar.com/91j893378q");
  assert.equal(item.disclosure.status, "HOLD");
  assert.equal(item.keywordEvidence.type, "qualitative_search_intent");
  assert.ok(item.keywordEvidence.sources.length >= 2);
  assert.deepEqual(validatePlan(checkedInPlan, products), []);
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
  assert.deepEqual(validatePlan(checkedInPlan, products), []);
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
  assert.deepEqual(validatePlan(checkedInPlan, products), []);
});


test("December 7 wildlife video-editing Short uses fresh vidIQ estimates and the exact approved Vault disclosure", () => {
  const week = checkedInPlan.weeks.find(row => row.weekOf === "2026-12-07");
  const item = week?.items.find(row => row.id === "sonicvhibez-short-012-wildlife-video-editing");
  const product = products.find(row => row.id === "wildlife-creators-vault");
  assert.ok(week);
  assert.equal(week.items.length, 2);
  assert.ok(item);
  assert.equal(item.channel, "SonicVhibez");
  assert.equal(item.status, "DRAFT_ONLY");
  assert.equal(item.visibility, "private");
  assert.equal(item.targetSeconds, 55);
  assert.equal(item.title, "Wildlife Video Editing: 3 Passes for a Clearer Story");
  assert.equal(item.primaryKeyword, "wildlife video editing");
  assert.equal(item.productUrl, product.url);
  assert.equal(item.keywordEvidence.provider, "vidIQ");
  assert.equal(item.keywordEvidence.type, "estimated_monthly_searches");
  assert.equal(item.keywordPhrases[0].estimatedMonthlySearches, 8456);
  assert.equal(item.keywordPhrases[0].competition, 18);
  assert.match(item.keywordEvidence.note, /provider estimates, not independently audited/i);
  assert.equal(item.disclosure.status, "APPROVED");
  assert.equal(item.disclosure.approvalReference, product.promotionGate.disclosure.approvalReference);
  assert.ok(item.script.indexOf("Advertisement.") < item.script.indexOf(product.promotionGate.disclosure.text));
  assert.match(item.description, /^ADVERTISEMENT\n/);
  assert.match(item.description, /^ADVERTISEMENT$/m);
  assert.ok(item.description.includes(product.promotionGate.disclosure.text));
  assert.equal(item.script.trim().split(/\s+/).filter(Boolean).length, 129);
  assert.ok(item.script.includes('You can explore the Complete YouTube Wildlife Creator’s Vault using the link in the description.'));
  assert.equal(item.script.includes('is a planning resource'), false);
  assert.equal(item.currentIntentEvidence.provider, "web_search");
  assert.equal(item.currentIntentEvidence.sources.length, 3);
  assert.ok(item.scriptEvidence.every(source => source.url.startsWith("https://")));
  assert.deepEqual(validatePlan(checkedInPlan, products), []);
});


test("December 14 wildlife audio recording Short uses current qualitative intent and the approved Vault disclosure", () => {
  const week = checkedInPlan.weeks.find(row => row.weekOf === "2026-12-14");
  const item = week?.items.find(row => row.id === "sonicvhibez-short-014-wildlife-audio-recording");
  const product = products.find(row => row.id === "wildlife-creators-vault");
  assert.ok(week);
  assert.equal(week.items.length, 2);
  assert.ok(item);
  assert.equal(item.channel, "SonicVhibez");
  assert.equal(item.status, "DRAFT_ONLY");
  assert.equal(item.visibility, "private");
  assert.equal(item.targetSeconds, 55);
  assert.equal(item.title, "Wildlife Audio Recording: 3 Field Tips for Clear Sound");
  assert.equal(item.primaryKeyword, "wildlife audio recording");
  assert.equal(item.productUrl, product.url);
  assert.equal(item.keywordEvidence.provider, "web_search");
  assert.equal(item.keywordEvidence.type, "qualitative_search_intent");
  assert.match(item.keywordEvidence.note, /no live global keyword-volume|no numerical volume/i);
  assert.equal(item.currentIntentEvidence.provider, "web_search");
  assert.equal(item.currentIntentEvidence.sources.length, 3);
  assert.equal(item.disclosure.status, "APPROVED");
  assert.equal(item.disclosure.approvalReference, product.promotionGate.disclosure.approvalReference);
  assert.ok(item.script.indexOf("Advertisement.") < item.script.indexOf(product.promotionGate.disclosure.text));
  assert.match(item.description, /^ADVERTISEMENT\n/);
  assert.match(item.description, /^ADVERTISEMENT$/m);
  assert.ok(item.description.includes(product.promotionGate.disclosure.text));
  assert.equal(item.script.trim().split(/\s+/).filter(Boolean).length, 132);
  assert.deepEqual(validatePlan(checkedInPlan, products), []);
});

test("December 14 Shorts analytics lesson uses current official metric definitions and stays disclosure-held", () => {
  const item = checkedInPlan.weeks.find(row => row.weekOf === "2026-12-14")
    ?.items.find(row => row.id === "sonicvhibez-short-013-youtube-shorts-analytics");
  assert.ok(item, "the December 14 analytics draft must exist");
  assert.match(item.script, /stayed to watch/i);
  assert.match(item.script, /engaged views/i);
  assert.match(item.script, /average view duration/i);
  assert.match(item.script, /subscribers gained/i);
  assert.ok(item.keywordEvidence.sources.some(source =>
    source.url === "https://support.google.com/youtube/answer/12220281"
  ), "the draft must retain the official YouTube Shorts analytics definitions");
  assert.equal(item.visibility, "private");
  assert.equal(item.status, "DRAFT_ONLY");
  assert.equal(item.disclosure.status, "HOLD");
  assert.ok(item.description.includes("DISCLOSURE HOLD"));
  assert.match(item.script, /^\[INTERNAL HOLD — NOT SPOKEN\./);
  assert.ok(item.script.toLowerCase().indexOf("[internal hold") < item.script.indexOf("YouTube Success Blueprint"));
  assert.equal(item.script.includes("This product is sold through my own Selar business; purchases generate revenue for my business."), false);
  assert.ok(item.script.trim().split(/\s+/).filter(Boolean).length >= 90);
  assert.ok(item.script.trim().split(/\s+/).filter(Boolean).length <= 135);
});


test("November 23 ethical-wildlife and outline Shorts use fresh qualitative search evidence and preserve their separate disclosure gates", () => {
  const week = checkedInPlan.weeks.find(row => row.weekOf === "2026-11-23");
  assert.ok(week);
  assert.equal(week.items.length, 2, "the weekly cap is already full; do not add another Short");
  const ethical = week.items.find(row => row.id === "sonicvhibez-short-007-ethical-wildlife-filming");
  const outline = week.items.find(row => row.id === "sonicvhibez-short-008-youtube-video-outline");
  const vault = products.find(row => row.id === "wildlife-creators-vault");
  const promptPack = products.find(row => row.id === "video-creation-prompt-pack-premium");
  assert.ok(ethical && outline && vault && promptPack);

  for (const item of [ethical, outline]) {
    assert.equal(item.channel, "SonicVhibez");
    assert.equal(item.status, "DRAFT_ONLY");
    assert.equal(item.visibility, "private");
    assert.equal(item.targetSeconds, 55);
    assert.equal(item.keywordEvidence.provider, "web_search");
    assert.equal(item.keywordEvidence.type, "qualitative_search_intent");
    assert.match(item.keywordEvidence.note, /no measured global search volume/i);
    assert.ok(item.keywordEvidence.sources.length >= 2);
    assert.equal(item.currentIntentEvidence.provider, "web_search");
    assert.ok(item.currentIntentEvidence.sources.length >= 2);
    for (const researchedAt of [item.keywordEvidence.researchedAt, item.currentIntentEvidence.researchedAt]) {
      const timestamp = Date.parse(researchedAt);
      assert.ok(Number.isFinite(timestamp), "qualitative evidence must have a valid research timestamp");
      assert.ok(timestamp <= Date.now() + 5 * 60 * 1000, "research timestamps must not be materially in the future");
      assert.ok(Date.now() - timestamp <= 14 * 24 * 60 * 60 * 1000,
        "qualitative keyword evidence must remain within the validator's 14-day freshness window");
    }
    assert.ok(item.keywordPhrases.length >= 3);
    const firstDescriptionLines = item.description.split(/\n/).slice(0, 4).join("\n").toLowerCase();
    assert.ok(firstDescriptionLines.includes(item.primaryKeyword.toLowerCase()));
  }

  assert.equal(ethical.productUrl, vault.url);
  assert.equal(ethical.disclosure.status, "APPROVED");
  assert.equal(ethical.disclosure.approvalReference, vault.promotionGate.disclosure.approvalReference);
  assert.ok(ethical.script.indexOf("Advertisement.") < ethical.script.indexOf(vault.promotionGate.disclosure.text));
  assert.ok(ethical.script.includes(vault.promotionGate.disclosure.text));
  assert.match(ethical.description, /^ADVERTISEMENT$/m);
  assert.ok(ethical.description.includes(vault.promotionGate.disclosure.text));

  assert.equal(outline.productUrl, promptPack.url);
  assert.equal(outline.disclosure.status, "HOLD");
  assert.match(outline.script, /^\[INTERNAL HOLD — NOT SPOKEN\./);
  assert.match(outline.description, /DISCLOSURE HOLD/);
  assert.ok(outline.script.trim().split(/\s+/).filter(Boolean).length >= 90);
  assert.ok(outline.script.trim().split(/\s+/).filter(Boolean).length <= 135);
  assert.deepEqual(validatePlan(checkedInPlan, products), []);
});

test("draft plans reject normalized snake-case, kebab-case and nested publication timestamp aliases", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items[0].scheduled_publish_at = "2026-12-21T08:00:00Z";
  plan.weeks[1].items[0]["publication-timestamp"] = null;
  plan.weeks[2].items[0].publication = { timestamp: "2026-12-21T08:00:00+02:00" };
  plan.weeks[3].items[0].planned = { dateTime: "2026-12-21T08:00:00+02:00" };

  const errors = validatePlan(plan, products);
  for (const expectedPath of [
    "plan.weeks[0].items[0].scheduled_publish_at",
    "plan.weeks[1].items[0].publication-timestamp",
    "plan.weeks[2].items[0].publication.timestamp",
    "plan.weeks[3].items[0].planned.dateTime"
  ]) {
    assert.ok(errors.some(error => error.includes(expectedPath)), `expected publication timestamp guard for ${expectedPath}`);
  }
});

test("keyword phrase clusters are concise, unique and cannot be padded with keyword stuffing", () => {
  const tooMany = clone(checkedInPlan);
  const crowded = tooMany.weeks.find(week => week.weekOf === "2026-11-23")
    .items.find(item => item.id === "sonicvhibez-short-007-ethical-wildlife-filming");
  crowded.keywordPhrases.push(
    { phrase: "wildlife video creator tips" },
    { phrase: "wildlife photography video tips" },
    { phrase: "wildlife camera operator tips" },
    { phrase: "wildlife nature film creator tips" }
  );
  assert.ok(validatePlan(tooMany, products)
    .some(error => /keywordPhrases must not exceed eight phrases/.test(error)));

  const duplicate = clone(checkedInPlan);
  const duplicated = duplicate.weeks.find(week => week.weekOf === "2026-11-23")
    .items.find(item => item.id === "sonicvhibez-short-007-ethical-wildlife-filming");
  duplicated.keywordPhrases[1].phrase = duplicated.keywordPhrases[0].phrase.toUpperCase();
  assert.ok(validatePlan(duplicate, products)
    .some(error => /keywordPhrases must be unique after trimming and case normalization/.test(error)));

  const invalid = clone(checkedInPlan);
  const malformed = invalid.weeks.find(week => week.weekOf === "2026-11-23")
    .items.find(item => item.id === "sonicvhibez-short-007-ethical-wildlife-filming");
  malformed.keywordPhrases[1].phrase = " ".repeat(101);
  assert.ok(validatePlan(invalid, products)
    .some(error => /each keyword phrase must be non-empty and no longer than 100 characters/.test(error)));
});


test("current search-intent evidence is mandatory, dated, sourced and fresh for current/future drafts", () => {
  const now = new Date("2026-11-22T10:30:00+02:00");
  const valid = clone(checkedInPlan);
  assert.deepEqual(validatePlan(valid, products, { now }), []);

  const missing = clone(valid);
  delete missing.weeks.find(week => week.weekOf === "2026-11-23").items[0].currentIntentEvidence;
  assert.ok(validatePlan(missing, products, { now }).some(error => /current search-intent evidence needs a valid research timestamp/.test(error)));

  const stale = clone(valid);
  stale.weeks.find(week => week.weekOf === "2026-11-23").items[0].currentIntentEvidence.researchedAt = "2026-11-01T09:00:00+02:00";
  assert.ok(validatePlan(stale, products, { now }).some(error => /current search-intent evidence must be no more than 14 days old/.test(error)));

  const future = clone(valid);
  future.weeks.find(week => week.weekOf === "2026-11-23").items[0].currentIntentEvidence.researchedAt = "2026-11-22T10:36:00+02:00";
  assert.ok(validatePlan(future, products, { now }).some(error => /current search-intent evidence cannot be more than 5 minutes in the future/.test(error)));

  const insecure = clone(valid);
  insecure.weeks.find(week => week.weekOf === "2026-11-23").items[0].currentIntentEvidence.sources[0].url = "http://example.com/ethics";
  assert.ok(validatePlan(insecure, products, { now }).some(error => /current search-intent evidence needs a qualitative no-volume caveat and dated HTTPS sources/.test(error)));

  const invented = clone(valid);
  invented.weeks.find(week => week.weekOf === "2026-11-23").items[0].currentIntentEvidence.estimatedMonthlySearches = 900000;
  assert.ok(validatePlan(invented, products, { now }).some(error => /do not invent volume or competition metrics/.test(error)));
});


test("2026-12-28 creator-education drafts preserve product-specific disclosure and research gates", () => {
  const week = checkedInPlan.weeks.find(row => row.weekOf === "2026-12-28");
  assert.ok(week);
  assert.equal(week.status, "DRAFT_ONLY");
  assert.equal(week.items.length, 2);
  const thumbnail = week.items.find(row => row.id === "sonicvhibez-short-017-thumbnail-brief");
  const wildlifeTitle = week.items.find(row => row.id === "sonicvhibez-short-018-wildlife-video-titles");
  assert.ok(thumbnail);
  assert.ok(wildlifeTitle);
  assert.equal(thumbnail.primaryKeyword, "YouTube thumbnail brief");
  assert.ok(thumbnail.title.toLowerCase().indexOf(thumbnail.primaryKeyword) <= 24);
  assert.equal(thumbnail.productUrl, "https://selar.com/539497q11t");
  assert.equal(thumbnail.disclosure.status, "HOLD");
  assert.match(thumbnail.script, /^\\[INTERNAL HOLD — NOT SPOKEN\\./);
  assert.ok(thumbnail.description.indexOf("DISCLOSURE HOLD") < thumbnail.description.indexOf(thumbnail.productUrl));
  assert.equal(thumbnail.keywordEvidence.type, "qualitative_search_intent");
  assert.ok(thumbnail.keywordEvidence.sources.length >= 2);
  assert.equal(wildlifeTitle.primaryKeyword, "YouTube titles for wildlife videos");
  assert.ok(wildlifeTitle.title.toLowerCase().indexOf(wildlifeTitle.primaryKeyword) <= 24);
  assert.equal(wildlifeTitle.productUrl, "https://selar.com/0u19v8u99l");
  assert.equal(wildlifeTitle.disclosure.status, "APPROVED");
  const approvedText = products.find(row => row.id === "wildlife-creators-vault").promotionGate.disclosure.text;
  assert.ok(wildlifeTitle.script.indexOf("Advertisement.") < wildlifeTitle.script.indexOf(approvedText));
  assert.match(wildlifeTitle.description, /^ADVERTISEMENT$/m);
  assert.ok(wildlifeTitle.description.indexOf(approvedText) < wildlifeTitle.description.indexOf(wildlifeTitle.productUrl));
  assert.equal(wildlifeTitle.keywordEvidence.type, "qualitative_search_intent");
  assert.ok(wildlifeTitle.keywordEvidence.sources.length >= 3);
  assert.ok(week.items.every(row => row.status === "DRAFT_ONLY" && row.visibility === "private" && row.targetSeconds === 55));
  assert.equal(checkedInPlan.publicationEnabled, false);
  assert.equal(checkedInPlan.schedulingEnabled, false);
  assert.doesNotMatch(JSON.stringify(week), /"(?:scheduledAt|publishedAt|publicationAt|actualPublishedAt)"\\s*:/i);
  assert.deepEqual(validatePlan(checkedInPlan, products), []);
});
