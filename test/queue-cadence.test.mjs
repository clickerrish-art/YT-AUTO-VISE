import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ROLLING_PUBLICATION_FORMATS, weeklyUtcCronGaps, validateCadenceDecision } from "../scripts/schedule-policy.mjs";
const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
const plan = JSON.parse(fs.readFileSync("config/weekly-content-plan.json", "utf8"));
const longFormQueue = JSON.parse(fs.readFileSync("content/long-form-queue.json", "utf8"));
test("authoritative plan defines the rolling long-form, long-form, Short publication cycle", () => {
  assert.equal(plan.channel, "SonicVhibez");
  assert.equal(plan.timezone, "Africa/Johannesburg");
  assert.equal(plan.publishingEnabled, false);
  assert.equal(plan.minimumPublicationSpacingHours, 72);
  assert.deepEqual(plan.publicationCycle.formats, ["long_form", "long_form", "short"]);
  assert.deepEqual(plan.publicationCycle.formats, ROLLING_PUBLICATION_FORMATS);
  assert.equal(plan.publicationCycle.minimumHoursBetweenConsecutivePublications, 72);
  assert.equal(plan.publicationCycle.minimumCycleHours, 216);
  assert.equal(plan.publicationCycle.publicationRequiresVerifiedHistory, true);
  assert.equal(plan.publicationCycle.publicationEnabled, false);
  assert.equal("targetCadence" in plan, false);
  assert.equal("requestedTargetCadence" in plan, false);
  assert.equal("cadenceDecisionRequired" in plan, false);
});
test("draft preparation fallback has actual cyclic UTC gaps of 96 and 72 hours but is not publication cadence", () => {
  const gaps = weeklyUtcCronGaps(plan.schedule);
  assert.deepEqual(gaps.map(gap => gap.hours), [96, 72]);
  assert.ok(gaps.every(gap => gap.hours >= 72));
  assert.ok(plan.schedule.every(slot => slot.status === "DRAFT_ONLY"));
  assert.equal(queue.cadence.draftPreparationFallback.notPublicationCadence, true);
});
test("the requested three-publication weekly cadence conflicts with the 72-hour minimum", () => {
  assert.equal(plan.requestedWeeklyCadence.totalPublicationsPerWeek, 3);
  assert.equal(plan.requestedWeeklyCadence.totalPublicationsPerWeek * plan.minimumPublicationSpacingHours, 216);
  assert.equal(plan.requestedWeeklyCadence.status, "CONFLICTS_WITH_72_HOUR_MINIMUM");
  assert.equal(plan.publicationCycle.minimumCycleHours, 216);
  assert.equal(queue.cadence.minimumCycleHours, 216);
  assert.equal(queue.cadence.minimumHoursBetweenConsecutivePublications, 72);
  assert.deepEqual(queue.cadence.formats, ["long_form", "long_form", "short"]);
  assert.equal("postsPerWeek" in queue.cadence, false);
});
test("draft-preparation cron converts 15:00 UTC to 17:00 Johannesburg local time", () => {
  const instant = new Date("2026-10-27T15:00:00Z");
  const local = new Intl.DateTimeFormat("en-GB", { timeZone: plan.timezone, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(instant).reduce((acc,p)=>(acc[p.type]=p.value,acc),{});
  assert.equal(local.weekday, "Tuesday"); assert.equal(local.hour, "17"); assert.equal(local.minute, "00");
});
test("queue has exactly one draft-only preparation item per fallback slot", () => {
  assert.equal(queue.publishingEnabled, false);
  assert.equal(queue.cadence.timezone, plan.timezone);
  const scheduled = queue.items.filter(item => item.scheduledDay);
  assert.equal(scheduled.length, 2);
  assert.equal(new Set(scheduled.map(item => item.scheduledDay)).size, scheduled.length);
  assert.equal(scheduled.filter(item => item.scheduledDay === "Tuesday" && item.contentType === "long_form").length, 1);
  assert.equal(scheduled.filter(item => item.scheduledDay === "Saturday" && item.contentType === "short").length, 1);
  for (const item of scheduled) assert.equal(item.contentType, plan.schedule.find(slot=>slot.day===item.scheduledDay).format);
});
test("queue IDs are unique and every item uses only the approved Selar URL", () => {
  const ids=queue.items.map(item => item.id); assert.equal(new Set(ids).size,ids.length);
  for (const item of queue.items) assert.equal(item.productUrl,"https://selar.com/0u19v8u99l",item.id);
});
test("automation workflow queue validation enforces the hard 72-hour publication minimum", () => {
  const automationWorkflow = fs.readFileSync(".github/workflows/validate-automation.yml", "utf8");
  assert.match(automationWorkflow, /72 <= spacing <= 8760/);
  assert.doesNotMatch(automationWorkflow, /0 < spacing <= 8760/);
});

test("narration workflows have no scheduled triggers while commercial narrator rights are blocked", () => {
  const longWorkflow = fs.readFileSync(".github/workflows/generate-long-form-narration.yml", "utf8");
  const shortWorkflow = fs.readFileSync(".github/workflows/free-narration-artifact.yml", "utf8");
  assert.ok(longWorkflow.includes("generate:"));
  assert.ok(shortWorkflow.includes("generate-audio:"));
  assert.match(longWorkflow, /if: false # Disabled:/);
  assert.match(shortWorkflow, /if: false # Disabled:/);
  assert.doesNotMatch(longWorkflow, /schedule:|cron:/);
  assert.doesNotMatch(shortWorkflow, /schedule:|cron:/);
});

test("draft-preparation triggers are separated from narration generation and publication", () => {
  const draftWorkflow = fs.readFileSync(".github/workflows/draft-preparation.yml", "utf8");
  const shortWorkflow = fs.readFileSync(".github/workflows/free-narration-artifact.yml", "utf8");
  const automationWorkflow = fs.readFileSync(".github/workflows/validate-automation.yml", "utf8");
  assert.ok(draftWorkflow.includes('cron: "0 15 * * 2"'));
  assert.ok(draftWorkflow.includes('cron: "0 15 * * 6"'));
  assert.match(draftWorkflow, /npm run validate:schedule/);
  assert.match(draftWorkflow, /npm run validate:promotional-shorts/);
  assert.doesNotMatch(draftWorkflow, /upload-private|youtube[.]upload|render:short|render:long|generate-narration/i);
  assert.match(shortWorkflow, /if: false # Disabled:/);
  const narrationPolicy = JSON.parse(fs.readFileSync("config/narration-voice-candidates.json", "utf8"));
  assert.equal(narrationPolicy.ownerDecision.approvedVoiceId, "b5c5b28db1ea408abc7d851202983bdb");
  assert.equal(narrationPolicy.ownerDecision.alternativeVoicesAuthorized, false);
  assert.equal(narrationPolicy.ownerDecision.selectionStatus, "OWNER_SELECTED_SPEECHMA_ANDREW_BROWSER_AUDITION_PENDING");
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.provider, "Speechma");
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.name, "Andrew");
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.voiceId, null);
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.productionApproved, false);
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.commercialUseAllowed, true);
  assert.match(automationWorkflow, /72 <= spacing <= 8760/);
  assert.match(automationWorkflow, /minimumCycleHours/);
  assert.equal(plan.publicationCycle.publicationRequiresVerifiedHistory, true);
});

test("owner-approved rolling cadence preserves the 72-hour minimum and records a timezone-qualified decision", () => {
  const decision = {
    status: "OWNER_APPROVED",
    ownerApproved: true,
    approvedMode: "ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET",
    approvedAt: "2026-11-06T20:38:00+02:00",
    approvalReference: "test-fixture-owner-decision"
  };
  assert.equal(validateCadenceDecision(decision, 72).valid, true);
  assert.equal(validateCadenceDecision(decision, 71.99).valid, false);
});

test("owner-defined cadence rejects three publications compressed into a 168-hour week", () => {
  const decision = {
    status: "OWNER_APPROVED",
    ownerApproved: true,
    approvedMode: "OTHER_OWNER_DEFINED_FEASIBLE_POLICY",
    approvedAt: "2026-11-06T20:38:00+02:00",
    approvalReference: "test-fixture-owner-decision",
    ownerDefinedPolicy: {
      description: "Three publications per week",
      publicationsPerCycle: 3,
      cycleHours: 168
    }
  };
  const result = validateCadenceDecision(decision, 72);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("mathematically infeasible")));
});

test("the requested weekly target remains planning metadata while the owner-approved rolling cycle controls publication", () => {
  // The operational queue must not carry a weekly publication target:
  // the owner-approved rolling cycle deliberately has no weekly target.
  assert.equal("targetPerWeek" in longFormQueue, false);
  assert.equal("targetPerWeek" in longFormQueue.cadence, false);
  assert.equal(longFormQueue.cadence.weeklyTarget, null);
  assert.equal("postsPerWeek" in longFormQueue.cadence, false);
  assert.deepEqual(longFormQueue.cadence.draftPreparationDays, ["Tuesday", "Saturday"]);
  assert.equal(longFormQueue.status, "AI_GENERATED_RECONSTRUCTION_REQUIRED; PLANNING_ONLY");
  assert.equal(longFormQueue.publishingEnabled, false);
  assert.equal(plan.requestedWeeklyCadence.longFormPerWeek, 2);
  assert.equal(plan.requestedWeeklyCadence.shortsPerWeek, 1);
  assert.equal(plan.requestedWeeklyCadence.totalPublicationsPerWeek, 3);
  assert.equal(plan.requestedWeeklyCadence.status, "CONFLICTS_WITH_72_HOUR_MINIMUM");
  assert.equal(plan.cadenceDecision.status, "OWNER_APPROVED");
  assert.equal(plan.cadenceDecision.ownerApproved, true);
  assert.equal(plan.cadenceDecision.approvedMode, "ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET");
  assert.equal(validateCadenceDecision(plan.cadenceDecision, 72).valid, true);
});

test("the recorded rolling cadence approval is explicit and does not waive 72-hour spacing", () => {
  assert.equal(plan.cadenceDecision.status, "OWNER_APPROVED");
  assert.equal(plan.cadenceDecision.ownerApproved, true);
  assert.equal(plan.cadenceDecision.approvedMode, "ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET");
  assert.ok(plan.cadenceDecision.approvedAt);
  assert.ok(plan.cadenceDecision.approvalReference.trim());
  const validation = validateCadenceDecision(plan.cadenceDecision, 72);
  assert.equal(validation.valid, true);
  assert.equal(validateCadenceDecision(plan.cadenceDecision, 71.99).valid, false);
});


test("queue manifests distinguish the Speechma audition candidate from the prohibited existing Roderic production audio", () => {
  const expectedNarrator = "No production narrator approved; Speechma Andrew is selected for a manual zero-cost audition only.";
  for (const source of [queue, longFormQueue]) {
    const policy = source.productionPolicy;
    const candidate = policy.selectedNarrationAuditionCandidate;
    assert.equal(policy.narrator, expectedNarrator);
    assert.equal(policy.alternativeNarratorAuthorized, false);
    assert.equal(policy.paidUpgradeAuthorized, false);
    assert.equal(policy.publishingEnabled, false);
    assert.equal(candidate.provider, "Speechma");
    assert.equal(candidate.name, "Andrew");
    assert.equal(candidate.manualBrowserOnly, true);
    assert.equal(candidate.automationAllowed, false);
    assert.equal(candidate.securityCodeRequiredPerGeneration, true);
    assert.equal(candidate.maximumCharactersPerStandardConversion, 2000);
    assert.equal(candidate.browserHistoryLocalOnly, true);
    assert.equal(candidate.productionApproved, false);
    assert.equal(candidate.publicationAuthorized, false);
  }
  assert.match(longFormQueue.items.find(item => item.id === "long-form-001-two-eyes-above-water").narrationVoice, /Roderic/);
  assert.match(longFormQueue.items.find(item => item.id === "long-form-001-two-eyes-above-water").narrationVoice, /internal-only.*not commercially cleared/i);
  assert.equal(longFormQueue.items.find(item => item.id === "long-form-001-two-eyes-above-water").narrationStatus, "INTERNAL_EVALUATION_ONLY_PROVIDER_DENIED_COMMERCIAL_USE");
  assert.match(longFormQueue.items.find(item => item.id === "long-form-001-two-eyes-above-water").productionNotes, /Speechma Andrew.*manual zero-cost browser audition only/);
});
