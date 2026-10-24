import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FACEBOOK_TIMEZONE, generateFacebookIdea, chooseFacebookExperimentSlot
} from "./facebook-pipeline.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function localDateInTimezone(now) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FACEBOOK_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return values.year + "-" + values.month + "-" + values.day;
}

function readEditorialState() {
  const stateDir = path.resolve(process.env.DASHBOARD_STATE_DIR ?? path.join(root, "state"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  if (!fs.existsSync(statePath)) return { existingDrafts: [], recentPosts: [] };
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("Dashboard editorial state is not a JSON object");
  for (const key of ["facebookDrafts", "facebookPosts"]) {
    if (state[key] !== undefined && !Array.isArray(state[key])) throw new Error("Dashboard editorial state has an invalid " + key + " collection");
  }
  return { existingDrafts: state.facebookDrafts ?? [], recentPosts: state.facebookPosts ?? [] };
}

function makePackage(date, idea, slot, now) {
  return {
    schemaVersion: 1,
    id: "nature-frontiers-daily-" + date,
    destination: "nature_frontiers_facebook",
    destinationPageId: null,
    date,
    proposedPublicationTime: slot,
    timezone: FACEBOOK_TIMEZONE,
    experiment: {
      slot,
      timezone: FACEBOOK_TIMEZONE,
      assignedAt: now,
      reason: "Deterministic 08:00 vs 18:00 SAST experiment assignment; not a claim of optimal timing"
    },
    topic: idea.topic ?? null,
    pillar: idea.pillar ?? null,
    angle: idea.angle ?? null,
    captionStarter: idea.captionStarter ?? null,
    researchPrompt: idea.researchPrompt ?? null,
    factualClaims: [],
    media: null,
    rightsEvidence: null,
    complianceRuleSet: "nf-facebook-baseline-2026-10-v1",
    status: idea.available === false ? "NO_UNIQUE_IDEA_REVIEW_REQUIRED" : "DRAFT_RESEARCH_REQUIRED",
    blockers: [
      "Research the topic and add source URLs for every material factual claim.",
      "Attach a real media asset and retained licensing evidence; test fixtures are not publishable.",
      "Independently verify the exact Nature Frontiers Facebook Page ID and current permissions.",
      "Complete compliance recheck and human approval bound to the final caption, media and schedule.",
      "External Facebook publishing is disabled; this artifact is draft-only."
    ],
    publishReady: false,
    publishingEnabled: false,
    generatedAt: now
  };
}

export function generateDailyFacebookDraft({ date, outputDir, now = new Date().toISOString(), existingDrafts = [], recentPosts = [] }) {
  if (!datePattern.test(String(date))) throw new Error("date must use YYYY-MM-DD");
  const parsed = new Date(date + "T12:00:00Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error("date is invalid");
  if (typeof outputDir !== "string" || !outputDir.trim()) throw new Error("A dedicated output directory is required");
  const destination = path.resolve(outputDir);
  fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
  const file = path.join(destination, date + ".json");
  if (fs.existsSync(file)) {
    const existing = JSON.parse(fs.readFileSync(file, "utf8"));
    if (existing?.date !== date || existing?.destination !== "nature_frontiers_facebook" || existing?.publishingEnabled !== false) {
      throw new Error("Existing daily draft file is malformed or does not match the expected safe destination; refusing to overwrite");
    }
    return { created: false, path: file, package: existing, reason: "IDEMPOTENT_EXISTING_DRAFT_PRESERVED" };
  }
  const idea = generateFacebookIdea({ date, existingDrafts, recentPosts });
  const slot = chooseFacebookExperimentSlot({ date, pillar: idea.pillar ?? "educational_explainer", format: "text" });
  const draft = makePackage(date, idea, slot, now);
  // Exclusive creation prevents concurrent daily jobs from overwriting one another.
  const handle = fs.openSync(file, "wx", 0o600);
  try {
    fs.writeFileSync(handle, JSON.stringify(draft, null, 2) + "\n", "utf8");
    fs.fsyncSync(handle);
  } catch (error) {
    try { fs.unlinkSync(file); } catch {}
    throw error;
  } finally {
    fs.closeSync(handle);
  }
  return { created: true, path: file, package: draft, reason: "DAILY_DRAFT_PACKAGE_CREATED_NOT_PUBLISHED" };
}

function main() {
  const date = process.env.FACEBOOK_DAILY_DRAFT_DATE ?? localDateInTimezone(new Date());
  const outputDir = process.env.FACEBOOK_DAILY_DRAFT_DIR ?? path.join(root, "run-logs", "facebook-daily-drafts");
  const editorial = readEditorialState();
  const result = generateDailyFacebookDraft({
    date, outputDir, now: process.env.FACEBOOK_DAILY_DRAFT_NOW ?? new Date().toISOString(),
    existingDrafts: editorial.existingDrafts, recentPosts: editorial.recentPosts
  });
  console.log(JSON.stringify({
    created: result.created, reason: result.reason, path: result.path,
    date: result.package.date, destination: result.package.destination,
    topic: result.package.topic, pillar: result.package.pillar,
    proposedPublicationTime: result.package.proposedPublicationTime,
    timezone: result.package.timezone, publishReady: false, publishingEnabled: false
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) {
    console.error("BLOCKED: daily Facebook draft generation failed closed:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  }
}
