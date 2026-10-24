#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const fail = (errors) => { for (const error of errors) console.error(`FAIL: ${error}`); process.exitCode = errors.length ? 1 : 0; };
const errors = [];
let plan, queue;
try { plan = read("config/weekly-content-plan.json"); } catch (error) { console.error(`FAIL: cannot read weekly schedule: ${error.message}`); process.exit(1); }
try { queue = read("content/queue.json"); } catch (error) { console.error(`FAIL: cannot read content queue: ${error.message}`); process.exit(1); }
if (plan.channel !== "SonicVhibez") errors.push("schedule channel must be SonicVhibez");
if (plan.timezone !== "Africa/Johannesburg") errors.push("schedule timezone must be Africa/Johannesburg");
if (plan.publishingEnabled !== false || queue.publishingEnabled !== false) errors.push("publishing must remain disabled in schedule and queue");
if (plan.minimumPublicationSpacingHours !== 72) errors.push("minimumPublicationSpacingHours must be exactly 72");
if (!Array.isArray(plan.schedule) || plan.schedule.length !== 2) errors.push("authoritative schedule must contain exactly two weekly slots");
const expected = [
  { day: "Tuesday", format: "long_form", cronUtc: "0 15 * * 2", duration: "minutes" },
  { day: "Saturday", format: "short", cronUtc: "0 15 * * 6", duration: "seconds" }
];
const weekdayIndex = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
for (const slot of expected) {
  const actual = (plan.schedule ?? []).find(s => s.day === slot.day);
  if (!actual) { errors.push(`schedule missing ${slot.day}`); continue; }
  if (actual.format !== slot.format) errors.push(`${slot.day} format must be ${slot.format}`);
  if (actual.cronUtc !== slot.cronUtc) errors.push(`${slot.day} cronUtc must be ${slot.cronUtc}`);
  if (actual.status !== "DRAFT_ONLY") errors.push(`${slot.day} must remain DRAFT_ONLY`);
  if (slot.duration === "minutes" && (actual.targetDurationMinutes?.min !== 6 || actual.targetDurationMinutes?.max !== 10)) errors.push(`${slot.day} must target 6–10 minutes`);
  if (slot.duration === "seconds" && (actual.targetDurationSeconds?.min !== 50 || actual.targetDurationSeconds?.max !== 60)) errors.push("Saturday Short must target 50–60 seconds");
}
const weeklyMinutes = [];
for (const slot of (Array.isArray(plan.schedule) ? plan.schedule : [])) {
  const match = String(slot.cronUtc ?? "").match(/^(\d{1,2}) (\d{1,2}) \* \* ([0-6])$/);
  if (!match) { errors.push(`${slot.day ?? "(unknown)"} cronUtc must use minute hour * * weekday in UTC`); continue; }
  const minute = Number(match[1]), hour = Number(match[2]), weekday = Number(match[3]);
  if (minute > 59 || hour > 23) { errors.push(`${slot.day ?? "(unknown)"} cronUtc has an invalid hour or minute`); continue; }
  if (weekdayIndex[slot.day] !== weekday) errors.push(`${slot.day ?? "(unknown)"} day does not match its UTC cron weekday`);
  weeklyMinutes.push({ day: slot.day, minuteOfWeek: weekday * 1440 + hour * 60 + minute });
}
if (new Set((plan.schedule ?? []).map(s => s.day)).size !== (plan.schedule ?? []).length) errors.push("no more than one publication slot may be assigned to a calendar day");
if (weeklyMinutes.length > 1) {
  weeklyMinutes.sort((a, b) => a.minuteOfWeek - b.minuteOfWeek);
  const weekMinutes = 7 * 24 * 60;
  for (let i = 0; i < weeklyMinutes.length; i++) {
    const current = weeklyMinutes[i], next = weeklyMinutes[(i + 1) % weeklyMinutes.length];
    let gapMinutes = next.minuteOfWeek - current.minuteOfWeek;
    if (i === weeklyMinutes.length - 1) gapMinutes += weekMinutes;
    if (gapMinutes < 72 * 60) errors.push(`publication spacing between ${current.day} and ${next.day} is ${(gapMinutes / 60).toFixed(2)} hours; minimum is 72 full hours`);
  }
}
if (plan.targetCadence?.longFormVideosPerWeek !== 1 || plan.targetCadence?.shortsPerWeek !== 1 || plan.targetCadence?.totalVideosPerWeek !== 2) errors.push("target cadence must be 1 long-form + 1 Short = 2 weekly");
if (plan.requestedTargetCadence?.longFormVideosPerWeek !== 2 || plan.requestedTargetCadence?.shortsPerWeek !== 1 || plan.requestedTargetCadence?.totalVideosPerWeek !== 3) errors.push("requestedTargetCadence must preserve the owner-requested 2 long-form + 1 Short target");
if (plan.cadenceDecisionRequired !== true) errors.push("cadenceDecisionRequired must remain true until the owner resolves the incompatible target and spacing rule");
const approvedUrl = "https://selar.com/0u19v8u99l";
if (plan.product?.url !== approvedUrl) errors.push("schedule product URL is not the approved Selar URL");
if (!Array.isArray(queue.items)) errors.push("queue items must be an array");
const items = Array.isArray(queue.items) ? queue.items : [], ids = items.map(item => item?.id);
if (ids.some(id => typeof id !== "string" || !id.trim())) errors.push("every queue item needs a stable non-empty ID");
if (new Set(ids).size !== ids.length) errors.push("queue item IDs must be unique");
for (const item of items) {
  if (item.productUrl !== approvedUrl) errors.push(`queue item ${item.id ?? "(unknown)"} uses an unapproved destination`);
  if (item.scheduledDay) {
    const slot = expected.find(s => s.day === item.scheduledDay);
    if (!slot) errors.push(`queue item ${item.id} has unsupported scheduledDay ${item.scheduledDay}`);
    else if (item.contentType !== slot.format) errors.push(`queue item ${item.id} type ${item.contentType} conflicts with ${item.scheduledDay} slot ${slot.format}`);
  }
}
const scheduledItems = items.filter(item => item?.scheduledDay);
if (scheduledItems.length !== expected.length) errors.push(`queue must have exactly one active draft per slot; found ${scheduledItems.length} scheduled items for ${expected.length} slots`);
for (const slot of expected) {
  const matches = scheduledItems.filter(item => item.scheduledDay === slot.day && item.contentType === slot.format);
  if (matches.length !== 1) errors.push(`queue must have exactly one ${slot.format} draft assigned to ${slot.day}; found ${matches.length}`);
}
if (queue.cadence?.postsPerWeek !== 2 || JSON.stringify(queue.cadence?.days) !== JSON.stringify(["Tuesday", "Saturday"]) || queue.cadence?.breakdown?.longForm !== 1 || queue.cadence?.breakdown?.short !== 1) errors.push("queue cadence must be Tuesday/Saturday with one long-form and one Short");
const workflowChecks = [
  [".github/workflows/generate-long-form-narration.yml", "0 15 * * 2", "Tuesday long-form"],
  [".github/workflows/free-narration-artifact.yml", "0 15 * * 6", "Saturday Short"]
];
for (const [file, cron, label] of workflowChecks) {
  let content;
  try { content = fs.readFileSync(path.join(root, file), "utf8"); } catch { errors.push(`missing workflow: ${file}`); continue; }
  if (!content.includes(`cron: "${cron}"`)) errors.push(`${label} workflow cron must be ${cron}`);
  if (!content.includes("branches: [main]")) errors.push(`${file} must remain scoped to main for push-triggered generation`);
}
const longWorkflow = fs.readFileSync(path.join(root, ".github/workflows/generate-long-form-narration.yml"), "utf8");
if (!/draft/i.test(longWorkflow)) errors.push("long-form workflow must identify its output as drafts");
if (errors.length) fail(errors);
else {
  console.log("PASS: interim Tuesday/Saturday draft slots, >=72-hour cyclic spacing, unique queue slots, approved destination, UTC workflow crons, and disabled publishing agree.");
  if (plan.cadenceDecisionRequired) console.log("BLOCKED: the requested 2-long-form + 1-Short weekly target requires at least 216 elapsed hours for three cyclic gaps and cannot fit in 168 hours. The two-slot schedule is an interim safety fallback; owner decision required before publication.");
  console.log("Actual YouTube upload history must still be checked before any publication.");
}
