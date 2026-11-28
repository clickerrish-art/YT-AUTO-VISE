import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FACEBOOK_TIMEZONE, FACEBOOK_COMPLIANCE_VERSION, generateFacebookIdea } from "./facebook-pipeline.mjs";
import { FACEBOOK_POLICY_RULE_VERSION } from "./facebook-policy-engine.mjs";
import { localDateTimeToIso } from "./schedule-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const FACEBOOK_DAILY_PLAN_SLOTS = Object.freeze([
  Object.freeze({ key: "reel-morning", mediaType: "reel", localTime: "08:00", aspectRatio: "9:16" }),
  Object.freeze({ key: "feed-midday", mediaType: "feed_post", localTime: "13:00", aspectRatio: "4:5" }),
  Object.freeze({ key: "reel-evening", mediaType: "reel", localTime: "18:00", aspectRatio: "9:16" })
]);

function validateDate(date) {
  if (!datePattern.test(String(date))) throw new Error("date must use YYYY-MM-DD");
  const parsed = new Date(date + "T12:00:00Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error("date is invalid");
}

function ensureDirectoryWithoutSymlinks(directory) {
  const target = path.resolve(directory);
  const rootPath = path.parse(target).root;
  let cursor = rootPath;
  for (const component of path.relative(rootPath, target).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    try {
      const stat = fs.lstatSync(cursor);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("Plan output path contains a symlink or non-directory component");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      try { fs.mkdirSync(cursor, { mode: 0o700 }); }
      catch (mkdirError) { if (mkdirError?.code !== "EEXIST") throw mkdirError; }
      const stat = fs.lstatSync(cursor);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("Plan output path changed during creation");
    }
  }
}

function isSafePlan(plan, date) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return false;
  if (plan.schemaVersion !== 2 || plan.id !== "nature-frontiers-plan-" + date || plan.date !== date) return false;
  if (plan.destination !== "nature_frontiers_facebook" || plan.timezone !== FACEBOOK_TIMEZONE) return false;
  if (plan.dailyTarget !== 3 || plan.dailyReelTarget !== 2 || plan.dailyFeedPostTarget !== 1) return false;
  if (plan.publishReady !== false || plan.publishingEnabled !== false) return false;
  if (plan.complianceRuleSet !== FACEBOOK_COMPLIANCE_VERSION || plan.policyRuleVersion !== FACEBOOK_POLICY_RULE_VERSION) return false;
  if (!Array.isArray(plan.slots) || plan.slots.length !== 3) return false;
  for (let i = 0; i < FACEBOOK_DAILY_PLAN_SLOTS.length; i++) {
    const expected = FACEBOOK_DAILY_PLAN_SLOTS[i], slot = plan.slots[i];
    if (!slot || slot.id !== plan.id + "-" + expected.key || slot.mediaType !== expected.mediaType) return false;
    if (slot.localTime !== expected.localTime || slot.timezone !== FACEBOOK_TIMEZONE) return false;
    if (slot.scheduledAt !== localDateTimeToIso(date, expected.localTime, FACEBOOK_TIMEZONE)) return false;
    if (slot.publishReady !== false || !Array.isArray(slot.factualClaims) || slot.factualClaims.length !== 0 || slot.media !== null || slot.rightsEvidence !== null) return false;
    if (!Array.isArray(slot.blockers) || slot.blockers.length < 4) return false;
  }
  return true;
}

function createSlot(date, spec, idea, now) {
  const scheduledAt = localDateTimeToIso(date, spec.localTime, FACEBOOK_TIMEZONE);
  const missed = Date.parse(scheduledAt) <= Date.parse(now);
  const unavailable = idea.available === false;
  return {
    id: "nature-frontiers-plan-" + date + "-" + spec.key,
    mediaType: spec.mediaType, aspectRatio: spec.aspectRatio,
    localTime: spec.localTime, timezone: FACEBOOK_TIMEZONE, scheduledAt,
    scheduleStatus: missed ? "MISSED_SLOT_REVIEW_REQUIRED" : "FUTURE_SLOT_PROPOSED",
    topic: idea.topic ?? null, pillar: idea.pillar ?? null, angle: idea.angle ?? null,
    captionStarter: idea.captionStarter ?? null, researchPrompt: idea.researchPrompt ?? null,
    factualClaims: [], media: null, rightsEvidence: null,
    status: unavailable ? "NO_UNIQUE_IDEA_REVIEW_REQUIRED" : missed ? "MISSED_SLOT_REVIEW_REQUIRED" : "DRAFT_RESEARCH_REQUIRED",
    blockers: [
      "Research this slot independently; attach authoritative sources for every material factual claim.",
      "Create original media in the required aspect ratio and retain source provenance and licensing evidence.",
      "Verify commercial-use, Facebook platform-use, attribution and any wildlife-location restrictions.",
      "Complete compliance checks and authenticated human review against the final caption, media and schedule.",
      "This is a planning brief only; no Meta draft, scheduled post or publication has been created.",
      ...(missed ? ["The proposed local time has passed; select a new future slot and repeat all checks. Never backdate or batch-publish."] : []),
      ...(unavailable ? ["The idea bank has no unused distinct topic for this slot; editorial input is required."] : [])
    ],
    publishReady: false
  };
}

export function generateDailyFacebookPlan({ date, outputDir, now = new Date().toISOString(), existingDrafts = [], recentPosts = [] }) {
  validateDate(date);
  if (typeof outputDir !== "string" || !outputDir.trim()) throw new Error("A dedicated plan output directory is required");
  if (!Number.isFinite(Date.parse(now))) throw new Error("now must be a valid timestamp");
  const destination = path.resolve(outputDir);
  ensureDirectoryWithoutSymlinks(destination);
  const file = path.join(destination, date + ".plan.json");
  if (fs.existsSync(file)) {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Existing daily plan is not a regular file");
    const existing = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!isSafePlan(existing, date)) throw new Error("Existing daily plan is malformed or violates the research-only schema; refusing to overwrite");
    return { created: false, path: file, plan: existing, reason: "IDEMPOTENT_EXISTING_PLAN_PRESERVED" };
  }
  const usedDrafts = [...existingDrafts];
  const slots = [];
  for (const spec of FACEBOOK_DAILY_PLAN_SLOTS) {
    const idea = generateFacebookIdea({ date, existingDrafts: usedDrafts, recentPosts });
    const slot = createSlot(date, spec, idea, now);
    slots.push(slot);
    if (idea.available !== false) usedDrafts.push({ id: slot.id, date, topic: slot.topic, status: "DRAFT_RESEARCH_REQUIRED" });
  }
  const plan = {
    schemaVersion: 2, id: "nature-frontiers-plan-" + date,
    destination: "nature_frontiers_facebook", destinationPageId: null,
    date, timezone: FACEBOOK_TIMEZONE,
    dailyTarget: 3, dailyReelTarget: 2, dailyFeedPostTarget: 1,
    minimumIntervalMinutes: 240, slots,
    complianceRuleSet: FACEBOOK_COMPLIANCE_VERSION, policyRuleVersion: FACEBOOK_POLICY_RULE_VERSION,
    status: slots.every(slot => slot.topic) ? "RESEARCH_REQUIRED" : "EDITORIAL_INPUT_REQUIRED",
    blockers: [
      "All three slots are research-only briefs, not completed posts.",
      "No factual claims, media files, rights records, Page permissions or approvals are invented.",
      "The publisher must independently re-evaluate final content and enforce daily format caps and minimum intervals.",
      "Publishing remains disabled until the owner explicitly enables it after provider and safety verification."
    ],
    publishReady: false, publishingEnabled: false, generatedAt: now
  };
  if (!isSafePlan(plan, date)) throw new Error("Generated plan failed its own draft-only schema validation");
  const handle = fs.openSync(file, "wx", 0o600);
  try {
    fs.writeFileSync(handle, JSON.stringify(plan, null, 2) + "\n", "utf8");
    fs.fsyncSync(handle);
  } catch (error) {
    try {
      const owned = fs.fstatSync(handle), current = fs.lstatSync(file);
      if (current.isFile() && !current.isSymbolicLink() && current.dev === owned.dev && current.ino === owned.ino) fs.unlinkSync(file);
    } catch {}
    throw error;
  } finally { fs.closeSync(handle); }
  return { created: true, path: file, plan, reason: "THREE_SLOT_RESEARCH_ONLY_PLAN_CREATED_NOT_PUBLISHED" };
}

function readEditorialState() {
  const stateDir = path.resolve(process.env.DASHBOARD_STATE_DIR ?? path.join(root, "state"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  if (!fs.existsSync(statePath)) return { existingDrafts: [], recentPosts: [] };
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("Dashboard editorial state is not a JSON object");
  for (const key of ["facebookDrafts", "facebookPosts"]) if (state[key] !== undefined && !Array.isArray(state[key])) throw new Error("Dashboard editorial state has an invalid " + key + " collection");
  return { existingDrafts: state.facebookDrafts ?? [], recentPosts: state.facebookPosts ?? [] };
}

function localDateInTimezone(now) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: FACEBOOK_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return values.year + "-" + values.month + "-" + values.day;
}

function main() {
  const date = process.env.FACEBOOK_DAILY_PLAN_DATE ?? localDateInTimezone(new Date());
  const outputDir = process.env.FACEBOOK_DAILY_PLAN_DIR ?? path.join(root, "run-logs", "facebook-daily-plans");
  const editorial = readEditorialState();
  const result = generateDailyFacebookPlan({
    date, outputDir, now: process.env.FACEBOOK_DAILY_PLAN_NOW ?? new Date().toISOString(),
    existingDrafts: editorial.existingDrafts, recentPosts: editorial.recentPosts
  });
  console.log(JSON.stringify({
    created: result.created, reason: result.reason, path: result.path,
    date: result.plan.date, timezone: result.plan.timezone,
    slots: result.plan.slots.map(slot => ({ id: slot.id, mediaType: slot.mediaType, localTime: slot.localTime, scheduledAt: slot.scheduledAt, topic: slot.topic, status: slot.status })),
    publishReady: false, publishingEnabled: false
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { console.error("BLOCKED: daily Facebook plan generation failed closed:", error instanceof Error ? error.message : "unknown error"); process.exitCode = 1; }
}
