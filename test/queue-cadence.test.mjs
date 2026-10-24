import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
const plan = JSON.parse(fs.readFileSync("config/weekly-content-plan.json", "utf8"));
function minuteOfWeek(slot) {
  const [minute, hour, , , weekday] = slot.cronUtc.split(" ").map(Number);
  return weekday * 1440 + hour * 60 + minute;
}
test("authoritative plan defines Tuesday long-form and Saturday Short draft slots", () => {
  assert.equal(plan.channel, "SonicVhibez");
  assert.equal(plan.timezone, "Africa/Johannesburg");
  assert.equal(plan.publishingEnabled, false);
  assert.equal(plan.minimumPublicationSpacingHours, 72);
  assert.deepEqual(plan.schedule.map(x => [x.day, x.format, x.cronUtc]), [
    ["Tuesday", "long_form", "0 15 * * 2"],
    ["Saturday", "short", "0 15 * * 6"]
  ]);
  assert.deepEqual(plan.targetCadence, { longFormVideosPerWeek: 1, shortsPerWeek: 1, totalVideosPerWeek: 2 });
});
test("weekly cycle maintains at least 72 full hours across adjacent slots and week boundary", () => {
  const times = plan.schedule.map(minuteOfWeek).sort((a, b) => a - b);
  const week = 7 * 24 * 60;
  const gaps = times.map((time, index) => {
    const next = times[(index + 1) % times.length];
    return (index === times.length - 1 ? next + week : next) - time;
  });
  assert.deepEqual(gaps, [96 * 60, 72 * 60]);
  assert.ok(gaps.every(gap => gap >= plan.minimumPublicationSpacingHours * 60));
  assert.equal(new Set(plan.schedule.map(slot => slot.day)).size, plan.schedule.length);
});
test("weekly cadence converts 15:00 UTC to 17:00 Johannesburg local time", () => {
  const instant = new Date("2026-10-27T15:00:00Z");
  const local = new Intl.DateTimeFormat("en-GB", {
    timeZone: plan.timezone, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(instant).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  assert.equal(local.weekday, "Tuesday");
  assert.equal(local.hour, "17");
  assert.equal(local.minute, "00");
});
test("queue has exactly one active draft per slot and remains draft-only", () => {
  assert.equal(queue.publishingEnabled, false);
  assert.equal(queue.cadence.postsPerWeek, 2);
  assert.deepEqual(queue.cadence.days, ["Tuesday", "Saturday"]);
  assert.equal(queue.cadence.timezone, plan.timezone);
  assert.equal(queue.cadence.breakdown.longForm, 1);
  assert.equal(queue.cadence.breakdown.short, 1);
  const scheduled = queue.items.filter(item => item.scheduledDay);
  assert.equal(scheduled.length, 2, "exactly two queue items may occupy active weekly slots");
  assert.equal(new Set(scheduled.map(item => item.scheduledDay)).size, scheduled.length, "no queue slot collisions");
  assert.equal(scheduled.filter(item => item.scheduledDay === "Tuesday" && item.contentType === "long_form").length, 1);
  assert.equal(scheduled.filter(item => item.scheduledDay === "Saturday" && item.contentType === "short").length, 1);
  for (const item of scheduled) {
    const expected = plan.schedule.find(slot => slot.day === item.scheduledDay);
    assert.ok(expected, "unknown scheduled day on " + item.id);
    assert.equal(item.contentType, expected.format, "content type/day mismatch on " + item.id);
  }
});
test("queue IDs are unique and every item uses only the approved Selar URL", () => {
  const ids = queue.items.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of queue.items) assert.equal(item.productUrl, "https://selar.com/0u19v8u99l", item.id);
});
test("workflow cron schedules match the authoritative plan", () => {
  const longWorkflow = fs.readFileSync(".github/workflows/generate-long-form-narration.yml", "utf8");
  const shortWorkflow = fs.readFileSync(".github/workflows/free-narration-artifact.yml", "utf8");
  assert.match(longWorkflow, /cron:\s*"0 15 \* \* 2"/);
  assert.match(shortWorkflow, /cron:\s*"0 15 \* \* 6"/);
  assert.match(longWorkflow, /Tuesday at 17:00 SAST/i);
  assert.match(shortWorkflow, /Saturday at 17:00 SAST/i);
});
