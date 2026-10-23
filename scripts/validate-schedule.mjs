#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const fail = (errors) => {
  for (const error of errors) console.error(`FAIL: ${error}`);
  process.exitCode = errors.length ? 1 : 0;
};
const errors = [];
let plan, queue;
try { plan = read("config/weekly-content-plan.json"); }
catch (error) { console.error(`FAIL: cannot read weekly schedule: ${error.message}`); process.exit(1); }
try { queue = read("content/queue.json"); }
catch (error) { console.error(`FAIL: cannot read content queue: ${error.message}`); process.exit(1); }

if (plan.channel !== "SonicVhibez") errors.push("schedule channel must be SonicVhibez");
if (plan.timezone !== "Africa/Johannesburg") errors.push("schedule timezone must be Africa/Johannesburg");
if (plan.publishingEnabled !== false || queue.publishingEnabled !== false) errors.push("publishing must remain disabled in schedule and queue");
if (!Array.isArray(plan.schedule) || plan.schedule.length !== 3) errors.push("authoritative schedule must contain exactly three weekly slots");
const expected = [
  { day: "Tuesday", format: "long_form", cronUtc: "0 15 * * 2", duration: "minutes" },
  { day: "Thursday", format: "long_form", cronUtc: "0 15 * * 4", duration: "minutes" },
  { day: "Saturday", format: "short", cronUtc: "0 15 * * 6", duration: "seconds" }
];
for (const slot of expected) {
  const actual = (plan.schedule ?? []).find(s => s.day === slot.day);
  if (!actual) { errors.push(`schedule missing ${slot.day}`); continue; }
  if (actual.format !== slot.format) errors.push(`${slot.day} format must be ${slot.format}`);
  if (actual.cronUtc !== slot.cronUtc) errors.push(`${slot.day} cronUtc must be ${slot.cronUtc}`);
  if (actual.status !== "DRAFT_ONLY") errors.push(`${slot.day} must remain DRAFT_ONLY`);
  if (slot.duration === "minutes" && (actual.targetDurationMinutes?.min !== 6 || actual.targetDurationMinutes?.max !== 10)) errors.push(`${slot.day} must target 6–10 minutes`);
  if (slot.duration === "seconds" && (actual.targetDurationSeconds?.min !== 50 || actual.targetDurationSeconds?.max !== 60)) errors.push("Saturday Short must target 50–60 seconds");
}
if (plan.targetCadence?.longFormVideosPerWeek !== 2 || plan.targetCadence?.shortsPerWeek !== 1 || plan.targetCadence?.totalVideosPerWeek !== 3) errors.push("target cadence must be 2 long-form + 1 Short = 3 weekly");
const approvedUrl = "https://selar.com/0u19v8u99l";
if (plan.product?.url !== approvedUrl) errors.push("schedule product URL is not the approved Selar URL");
if (!Array.isArray(queue.items)) errors.push("queue items must be an array");
const items = Array.isArray(queue.items) ? queue.items : [];
const ids = items.map(item => item?.id);
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
for (const slot of expected) {
  if (!items.some(item => item?.scheduledDay === slot.day && item?.contentType === slot.format)) errors.push(`queue has no ${slot.format} draft assigned to ${slot.day}`);
}
const workflowChecks = [
  [".github/workflows/generate-long-form-narration.yml", "0 15 * * 2,4", "Tuesday/Thursday long-form"],
  [".github/workflows/free-narration-artifact.yml", "0 15 * * 6", "Saturday Short"]
];
for (const [file, cron, label] of workflowChecks) {
  let content;
  try { content = fs.readFileSync(path.join(root, file), "utf8"); }
  catch { errors.push(`missing workflow: ${file}`); continue; }
  if (!content.includes(`cron: "${cron}"`)) errors.push(`${label} workflow cron must be ${cron}`);
  if (!content.includes("branches: [main]")) errors.push(`${file} must remain scoped to main for push-triggered generation`);
}
if (!fs.readFileSync(path.join(root, ".github/workflows/generate-long-form-narration.yml"), "utf8").includes("publishing")) {
  // The workflow may use different wording, but must explicitly describe itself as draft-only.
  const wf = fs.readFileSync(path.join(root, ".github/workflows/generate-long-form-narration.yml"), "utf8");
  if (!/draft/i.test(wf)) errors.push("long-form workflow must identify its output as drafts");
}
if (errors.length) fail(errors);
else console.log("PASS: authoritative schedule, queue types, approved destination, workflow UTC crons, and disabled publishing agree. This validates configuration only; it does not prove media production or upload.");
