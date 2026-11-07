import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validatePromotionalShortPlan } from "../scripts/validate-promotional-short-plan.mjs";

const checkedInPlan = JSON.parse(fs.readFileSync("content/promotional-short-plan.json", "utf8"));
const products = JSON.parse(fs.readFileSync("config/products.json", "utf8")).products;
const clone = value => structuredClone(value);

test("next-week creator-education Shorts pass as a draft-only two-item plan", () => {
  const errors = validatePromotionalShortPlan(checkedInPlan, products);
  assert.deepEqual(errors, []);
  assert.equal(checkedInPlan.weeks[0].weekOf, "2026-11-09");
  assert.equal(checkedInPlan.weeks[0].items.length, 2);
  assert.ok(checkedInPlan.weeks[0].items.every(item => item.targetSeconds === 55));
});

test("candidate seller verification is required while the other promotion gates remain unresolved", () => {
  const candidates = clone(products);
  const candidate = candidates.find(product => product.status === "candidate");
  assert.ok(candidate);
  candidate.promotionGate.seller.status = "UNVERIFIED";
  assert.ok(validatePromotionalShortPlan(checkedInPlan, candidates).some(error => /seller evidence must be VERIFIED/.test(error)));
});

test("the weekly promotional Short cap rejects a third item", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items.push(clone(plan.weeks[0].items[0]));
  plan.weeks[0].items[2].id = "third-short";
  assert.ok(validatePromotionalShortPlan(plan, products).some(error => /exceeds the 2-Short weekly limit/.test(error)));
});

test("candidate products stay draft-only and keep the disclosure hold", () => {
  const plan = clone(checkedInPlan);
  plan.weeks[0].items[0].status = "READY_FOR_PRIVATE_UPLOAD";
  assert.ok(validatePromotionalShortPlan(plan, products).some(error => /status must remain DRAFT_ONLY/.test(error)));
  plan.weeks[0].items[0].status = "DRAFT_ONLY";
  plan.weeks[0].items[0].disclosure.status = "APPROVED";
  assert.ok(validatePromotionalShortPlan(plan, products).some(error => /disclosure hold/.test(error)));
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
