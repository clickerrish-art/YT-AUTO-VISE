import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ROLLING_PUBLICATION_FORMATS, weeklyUtcCronGaps } from "../scripts/schedule-policy.mjs";
const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
const plan = JSON.parse(fs.readFileSync("config/weekly-content-plan.json", "utf8"));
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
test("the 3-publication rolling cycle requires at least 216 hours, not a weekly count", () => {
  assert.equal(plan.publicationCycle.minimumCycleHours, 3 * 72);
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
  const ids=queue.items.map(item=>item.id); assert.equal(new Set(ids).size,ids.length);
  for (const item of queue.items) assert.equal(item.productUrl,"https://selar.com/0u19v8u99l",item.id);
});
test("workflow cron schedules remain draft preparation only", () => {
  const longWorkflow=fs.readFileSync(".github/workflows/generate-long-form-narration.yml","utf8");
  const shortWorkflow=fs.readFileSync(".github/workflows/free-narration-artifact.yml","utf8");
  assert.ok(longWorkflow.includes('cron: "0 15 * * 2"'));
  assert.ok(shortWorkflow.includes('cron: "0 15 * * 6"'));
  assert.match(longWorkflow,/draft/i); assert.match(shortWorkflow,/draft/i);
});