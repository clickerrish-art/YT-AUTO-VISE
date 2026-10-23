import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
const plan = JSON.parse(fs.readFileSync("config/weekly-content-plan.json", "utf8"));

test("authoritative plan defines Tuesday/Thursday long-form and Saturday Short", () => {
  assert.equal(plan.channel, "SonicVhibez");
  assert.equal(plan.timezone, "Africa/Johannesburg");
  assert.equal(plan.publishingEnabled, false);
  assert.deepEqual(plan.schedule.map(x => [x.day, x.format, x.cronUtc]), [
    ["Tuesday", "long_form", "0 15 * * 2"],
    ["Thursday", "long_form", "0 15 * * 4"],
    ["Saturday", "short", "0 15 * * 6"]
  ]);
  assert.deepEqual(plan.targetCadence, { longFormVideosPerWeek: 2, shortsPerWeek: 1, totalVideosPerWeek: 3 });
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

test("queue has the expected weekly mix and remains draft-only", () => {
  assert.equal(queue.publishingEnabled, false, "public publishing must remain disabled");
  assert.equal(queue.cadence.postsPerWeek, 3);
  assert.deepEqual(queue.cadence.days, ["Tuesday", "Thursday", "Saturday"]);
  assert.equal(queue.cadence.timezone, plan.timezone);
  assert.equal(queue.cadence.breakdown.longForm, 2);
  assert.equal(queue.cadence.breakdown.short, 1);

  const longForm = queue.items.filter(item => item.contentType === "long_form" && ["Tuesday", "Thursday"].includes(item.scheduledDay));
  const shorts = queue.items.filter(item => item.contentType === "short" && item.scheduledDay === "Saturday");
  assert.ok(longForm.some(item => item.scheduledDay === "Tuesday"), "Tuesday needs a long-form draft");
  assert.ok(longForm.some(item => item.scheduledDay === "Thursday"), "Thursday needs a long-form draft");
  assert.ok(shorts.some(item => item.targetSeconds === 55), "Saturday needs a 55-second Short draft");
  for (const item of queue.items.filter(item => item.scheduledDay)) {
    const expected = plan.schedule.find(slot => slot.day === item.scheduledDay);
    assert.ok(expected, "unknown scheduled day on " + item.id);
    assert.equal(item.contentType, expected.format, "content type/day mismatch on " + item.id);
  }
});

test("queue IDs are unique and every item uses only the approved Selar URL", () => {
  const ids = queue.items.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length, "queue IDs must be unique");
  for (const item of queue.items) assert.equal(item.productUrl, "https://selar.com/0u19v8u99l", item.id);
});

test("workflow cron schedules match the authoritative plan", () => {
  const longWorkflow = fs.readFileSync(".github/workflows/generate-long-form-narration.yml", "utf8");
  const shortWorkflow = fs.readFileSync(".github/workflows/free-narration-artifact.yml", "utf8");
  assert.match(longWorkflow, /cron:\s*"0 15 \* \* 2,4"/);
  assert.match(shortWorkflow, /cron:\s*"0 15 \* \* 6"/);
  assert.match(longWorkflow, /Tuesday and Thursday at 17:00 SAST/i);
  assert.match(shortWorkflow, /Saturday at 17:00 SAST/i);
});
