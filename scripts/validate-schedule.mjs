#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { weeklyUtcCronGaps, ROLLING_PUBLICATION_FORMATS } from "./schedule-policy.mjs";
const root = process.cwd();
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const errors = [];
let plan, queue;
try { plan = read("config/weekly-content-plan.json"); } catch (error) { console.error("FAIL: cannot read weekly schedule: " + error.message); process.exit(1); }
try { queue = read("content/queue.json"); } catch (error) { console.error("FAIL: cannot read content queue: " + error.message); process.exit(1); }
if (plan.channel !== "SonicVhibez") errors.push("schedule channel must be SonicVhibez");
if (plan.timezone !== "Africa/Johannesburg") errors.push("schedule timezone must be Africa/Johannesburg");
if (plan.publishingEnabled !== false || queue.publishingEnabled !== false || plan.publicationCycle?.publicationEnabled !== false) errors.push("publishing must remain disabled in schedule, cycle policy and queue");
const minSpacing = plan.minimumPublicationSpacingHours;
if (!Number.isFinite(minSpacing) || minSpacing <= 0 || minSpacing > 8760) errors.push("minimumPublicationSpacingHours must be a finite positive number no greater than 8760 hours");
if (plan.publicationCycle?.minimumHoursBetweenConsecutivePublications !== minSpacing) errors.push("publicationCycle minimum spacing must match minimumPublicationSpacingHours");
if (plan.spacingPolicy?.minimumHoursBetweenPosts !== minSpacing) errors.push("spacingPolicy minimumHoursBetweenPosts must match minimumPublicationSpacingHours");
if (JSON.stringify(plan.publicationCycle?.formats) !== JSON.stringify(ROLLING_PUBLICATION_FORMATS)) errors.push("publicationCycle formats must be long_form, long_form, short in that order");
if (plan.publicationCycle?.minimumCycleHours !== minSpacing * ROLLING_PUBLICATION_FORMATS.length) errors.push("rolling cycle minimum must equal minimumPublicationSpacingHours multiplied by the publication cycle length");
if (plan.spacingPolicy?.minimumCycleHours !== minSpacing * ROLLING_PUBLICATION_FORMATS.length) errors.push("spacingPolicy minimumCycleHours must match the configured publication cycle");
if (plan.publicationCycle?.publicationRequiresVerifiedHistory !== true) errors.push("publication must require independently verified channel history");
if ("targetCadence" in plan || "requestedTargetCadence" in plan || "interimDraftCadence" in plan) errors.push("stale weekly-count cadence fields must be removed; use requestedWeeklyCadence, cadenceDecision and publicationCycle");
const requestedCadence = plan.requestedWeeklyCadence;
if (requestedCadence?.longFormPerWeek !== 2 || requestedCadence?.shortsPerWeek !== 1 || requestedCadence?.totalPublicationsPerWeek !== 3 || requestedCadence?.status !== "CONFLICTS_WITH_72_HOUR_MINIMUM") errors.push("requestedWeeklyCadence must explicitly record the requested 2 long-form + 1 Short weekly target and its 72-hour conflict");
const cadenceDecision = plan.cadenceDecision;
const supportedCadenceModes = ["ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET", "WEEKLY_TARGET_WITH_SHORTER_SPACING", "OTHER_OWNER_DEFINED_FEASIBLE_POLICY"];
if (!cadenceDecision || !["OWNER_DECISION_REQUIRED", "OWNER_APPROVED"].includes(cadenceDecision.status) || typeof cadenceDecision.ownerApproved !== "boolean") errors.push("cadenceDecision must explicitly record owner decision status");
if (cadenceDecision?.status === "OWNER_APPROVED" && cadenceDecision.ownerApproved !== true) errors.push("cadenceDecision OWNER_APPROVED status requires ownerApproved=true");
if (cadenceDecision?.ownerApproved === true || cadenceDecision?.status === "OWNER_APPROVED") {
 if (cadenceDecision.status !== "OWNER_APPROVED" || cadenceDecision.ownerApproved !== true) errors.push("approved cadence decision must have matching OWNER_APPROVED status and ownerApproved=true");
 if (!supportedCadenceModes.includes(cadenceDecision.approvedMode)) errors.push("approved cadence decision must name a supported approvedMode");
 if (typeof cadenceDecision.approvedAt !== "string" || !Number.isFinite(Date.parse(cadenceDecision.approvedAt)) || !/(Z|[+-]\d{2}:\d{2})$/.test(cadenceDecision.approvedAt)) errors.push("approved cadence decision requires approvedAt as an ISO timestamp with explicit timezone");
 if (typeof cadenceDecision.approvalReference !== "string" || !cadenceDecision.approvalReference.trim()) errors.push("approved cadence decision requires a non-empty approvalReference");
 if (cadenceDecision.approvedMode === "ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET" && minSpacing < 72) errors.push("rolling-cycle mode must retain at least 72 hours between publications");
 if (cadenceDecision.approvedMode === "WEEKLY_TARGET_WITH_SHORTER_SPACING" && minSpacing > 56) errors.push("weekly target mode requires a minimum gap no greater than 56 hours for three recurring publications per 168-hour cycle");
 if (cadenceDecision.approvedMode === "OTHER_OWNER_DEFINED_FEASIBLE_POLICY") {
  const custom = cadenceDecision.ownerDefinedPolicy;
  if (!custom || typeof custom.description !== "string" || !custom.description.trim() || !Number.isFinite(custom.publicationsPerCycle) || custom.publicationsPerCycle < 1 || !Number.isFinite(custom.cycleHours) || custom.cycleHours <= 0 || custom.publicationsPerCycle * minSpacing > custom.cycleHours) errors.push("custom cadence mode requires a documented policy whose publication count times minimum spacing fits within its cycle duration");
 }
}
if (cadenceDecision?.status !== "OWNER_APPROVED" || cadenceDecision?.ownerApproved !== true) console.log("BLOCKED — CADENCE DECISION: requested 2 long-form + 1 Short per week conflicts with 72-hour spacing; owner approval of a feasible policy mode is required before publication.");
if (!Array.isArray(plan.schedule) || plan.schedule.length !== 2) errors.push("draft-preparation fallback must contain exactly two draft-only slots");
const expected = [
 { day: "Tuesday", format: "long_form", cronUtc: "0 15 * * 2", duration: "minutes" },
 { day: "Saturday", format: "short", cronUtc: "0 15 * * 6", duration: "seconds" }
];
const dayNumber = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
for (const slot of expected) {
 const actual = (plan.schedule ?? []).find(s => s.day === slot.day);
 if (!actual) { errors.push("draft-preparation fallback missing " + slot.day); continue; }
 if (actual.format !== slot.format) errors.push(slot.day + " format must be " + slot.format);
 if (actual.cronUtc !== slot.cronUtc) errors.push(slot.day + " cronUtc must be " + slot.cronUtc);
 if (actual.status !== "DRAFT_ONLY") errors.push(slot.day + " must remain DRAFT_ONLY");
 const match = String(actual.cronUtc ?? "").match(/^(\d{1,2}) (\d{1,2}) \* \* ([0-6])$/);
 if (!match || Number(match[1]) > 59 || Number(match[2]) > 23 || Number(match[3]) !== dayNumber[slot.day]) errors.push(slot.day + " draft cron must be valid UTC minute hour * * weekday");
 if (slot.duration === "minutes" && (actual.targetDurationMinutes?.min !== 6 || actual.targetDurationMinutes?.max !== 10)) errors.push("Tuesday must target 6–10 minutes");
 if (slot.duration === "seconds" && (actual.targetDurationSeconds?.min !== 50 || actual.targetDurationSeconds?.max !== 60)) errors.push("Saturday Short must target 50–60 seconds");
}
try {
 const gaps = weeklyUtcCronGaps(plan.schedule ?? []);
 if (gaps.some(g => g.hours < 72)) errors.push("draft-preparation fallback contains a cyclic gap shorter than 72 hours");
} catch (error) { errors.push("draft-preparation cron validation failed: " + error.message); }
if (new Set((plan.schedule ?? []).map(s => s.day)).size !== (plan.schedule ?? []).length) errors.push("draft-preparation fallback contains duplicate days");
if (plan.product?.url !== "https://selar.com/0u19v8u99l") errors.push("schedule product URL is not the approved Selar URL");
if (!Array.isArray(queue.items)) errors.push("queue items must be an array");
const items = Array.isArray(queue.items) ? queue.items : [], ids = items.map(item => item?.id);
if (ids.some(id => typeof id !== "string" || !id.trim())) errors.push("every queue item needs a stable non-empty ID");
if (new Set(ids).size !== ids.length) errors.push("queue item IDs must be unique");
for (const item of items) {
 if (item.productUrl !== "https://selar.com/0u19v8u99l") errors.push("queue item " + (item.id ?? "(unknown)") + " uses an unapproved destination");
 if (item.scheduledDay) {
  const slot = expected.find(s => s.day === item.scheduledDay);
  if (!slot) errors.push("queue item " + item.id + " has unsupported draftPreparationDay " + item.scheduledDay);
  else if (item.contentType !== slot.format) errors.push("queue item " + item.id + " type " + item.contentType + " conflicts with " + item.scheduledDay + " draft slot " + slot.format);
 }
}
const scheduledItems = items.filter(item => item?.scheduledDay);
if (scheduledItems.length !== expected.length) errors.push("queue must have exactly one draft-only preparation item per fallback slot; found " + scheduledItems.length);
for (const slot of expected) {
 const matches = scheduledItems.filter(item => item.scheduledDay === slot.day && item.contentType === slot.format);
 if (matches.length !== 1) errors.push("queue must have exactly one " + slot.format + " draft assigned to " + slot.day + "; found " + matches.length);
}
const cadence = queue.cadence ?? {};
if (cadence.publicationCycleId !== plan.publicationCycle?.id || JSON.stringify(cadence.formats) !== JSON.stringify(ROLLING_PUBLICATION_FORMATS)
 || cadence.minimumHoursBetweenConsecutivePublications !== minSpacing || cadence.minimumCycleHours !== minSpacing * ROLLING_PUBLICATION_FORMATS.length) errors.push("queue cadence must match the authoritative rolling publication cycle");
if (cadence.draftPreparationFallback?.status !== "DRAFT_ONLY" || cadence.draftPreparationFallback?.notPublicationCadence !== true) errors.push("Tuesday/Saturday fallback must be explicitly draft-only and not a publication cadence");
const workflowChecks = [
 [".github/workflows/generate-long-form-narration.yml", "0 15 * * 2", "Tuesday long-form draft preparation"],
 [".github/workflows/free-narration-artifact.yml", "0 15 * * 6", "Saturday Short draft preparation"]
];
for (const [file, cron, label] of workflowChecks) {
 let content;
 try { content = fs.readFileSync(path.join(root, file), "utf8"); } catch { errors.push("missing workflow: " + file); continue; }
 if (!content.includes('cron: "' + cron + '"')) errors.push(label + " workflow cron must be " + cron);
 if (!content.includes("branches: [main]")) errors.push(file + " must remain scoped to main for push-triggered generation");
 if (!/draft/i.test(content)) errors.push(file + " must identify output as draft preparation");
}
if (errors.length) { for (const error of errors) console.error("FAIL: " + error); process.exitCode = 1; }
else {
 console.log("PASS: rolling long_form, long_form, short cycle; 72 elapsed-hour minimum; 216-hour minimum cycle; unique queue IDs; approved Selar destination; draft-only preparation triggers; publishing disabled.");
 console.log("BLOCKED — LIVE HISTORY: upload must independently reconcile public, private, unlisted, scheduled and uncertain channel items before publication.");
}
