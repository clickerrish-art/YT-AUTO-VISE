import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { evaluateFinalFacebookPayload } from "./facebook-policy-engine.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + "." + process.pid + ".tmp";
  const handle = fs.openSync(temporary, "wx", 0o600);
  try {
    fs.writeFileSync(handle, JSON.stringify(value, null, 2) + "\n", "utf8");
    fs.fsyncSync(handle);
  } finally { fs.closeSync(handle); }
  fs.renameSync(temporary, file);
}

function requireWithinRoot(candidate, baseRoot = root) {
  const resolvedBase = path.resolve(baseRoot);
  const resolved = path.resolve(resolvedBase, candidate);
  if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) throw new Error("Intake file path escapes repository root");
  return resolved;
}

/**
 * Intake only accepts evidence-complete candidate records. It does not fabricate research,
 * media, licence records, source excerpts, or captions. The publisher rechecks every queued
 * item immediately before mutation. Blocked candidates are recorded, never sent for approval.
 */
export async function runFacebookContentIntake({
  configPath = path.join(root, "config/facebook-publishing.json"),
  candidatePath = path.join(root, "content/facebook-intake-candidates.json"),
  queuePath = path.join(root, "content/facebook-autonomous-queue.json"),
  stateDir = process.env.FACEBOOK_STATE_DIR,
  fetchImpl = fetch,
  now = Date.now(),
  policyEvaluator = evaluateFinalFacebookPayload,
  rootDir = root
} = {}) {
  const activeRoot = path.resolve(rootDir);
  if (typeof stateDir !== "string" || !path.isAbsolute(stateDir)) {
    throw new Error("FACEBOOK_STATE_DIR must be an absolute durable operator-controlled directory");
  }
  const config = readJson(configPath);
  if (config.destination !== "nature_frontiers_facebook" || config.timezone !== "Africa/Johannesburg" ||
      config.autonomousMode !== true || config.autonomousSchedulingEnabled !== true ||
      config.complianceRuleSet !== "nf-facebook-autonomous-policy-2026-10-v1") {
    throw new Error("Facebook intake configuration is invalid or policy version does not match");
  }
  const candidateFile = requireWithinRoot(candidatePath, activeRoot);
  const queueFile = requireWithinRoot(queuePath, activeRoot);
  if (!fs.existsSync(candidateFile)) throw new Error("Facebook intake candidate file is missing; no content will be invented");
  const candidates = readJson(candidateFile);
  const existingQueue = fs.existsSync(queueFile) ? readJson(queueFile) : [];
  if (!Array.isArray(candidates) || !Array.isArray(existingQueue)) throw new Error("Facebook intake candidates and queue must be JSON arrays");
  const historyFile = path.join(stateDir, "facebook-history.json");
  const history = fs.existsSync(historyFile) ? readJson(historyFile) : [];
  if (!Array.isArray(history)) throw new Error("Persistent Facebook history is malformed; intake blocked");
  const queue = [...existingQueue];
  const seen = new Set(queue.map(item => item?.slotId).filter(Boolean));
  const decisions = [];
  let accepted = 0, blocked = 0, duplicate = 0;
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      decisions.push({ eligible: false, reason: "CANDIDATE_MALFORMED", checkedAt: new Date(now).toISOString() });
      blocked++;
      continue;
    }
    if (!candidate.slotId || seen.has(candidate.slotId)) {
      decisions.push({ slotId: candidate.slotId ?? null, eligible: false, reason: "DUPLICATE_INTAKE_SLOT", checkedAt: new Date(now).toISOString() });
      duplicate++;
      continue;
    }
    let decision;
    try {
      decision = await policyEvaluator(candidate, {
        expectedPageId: config.destinationPageId,
        expectedPageName: config.destinationPageName,
        allowedDomains: config.allowedDomains ?? [],
        allowedCampaignIds: config.allowedCampaignIds ?? [],
        approvedDestinations: config.approvedDestinations ?? [],
        history: [...history, ...queue],
        evidenceRoot: activeRoot,
        now: new Date(now).toISOString(),
        timezone: config.timezone,
        maxPostsPerLocalDay: config.dailyCap,
        minimumIntervalMinutes: config.minimumIntervalMinutes,
        fetchImpl
      });
    } catch {
      decision = { eligible: false, blockers: ["POLICY_ENGINE_ERROR"], warnings: [], reason: "POLICY_ENGINE_ERROR", checkedAt: new Date(now).toISOString() };
    }
    if (!decision?.eligible) {
      decisions.push({ slotId: candidate.slotId, eligible: false, contentFingerprint: decision?.contentFingerprint ?? null, policyDecision: decision, reason: decision?.reason ?? "POLICY_UNKNOWN" });
      blocked++;
      continue;
    }
    const queued = { ...candidate, intake: { acceptedAt: new Date(now).toISOString(), policyDecision: decision, contentFingerprint: decision.contentFingerprint } };
    queue.push(queued);
    seen.add(candidate.slotId);
    decisions.push({ slotId: candidate.slotId, eligible: true, contentFingerprint: decision.contentFingerprint, reason: "ELIGIBLE_FOR_PUBLISHER_RECHECK" });
    accepted++;
  }
  atomicJson(queueFile, queue);
  const summary = {
    schemaVersion: 1, checkedAt: new Date(now).toISOString(), policyRuleVersion: config.complianceRuleSet,
    candidateCount: candidates.length, accepted, blocked, duplicate, queueCount: queue.length,
    candidatesSha256: sha256(JSON.stringify(candidates)), decisions
  };
  atomicJson(path.join(stateDir, "facebook-intake-summary.json"), summary);
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runFacebookContentIntake();
    console.log(JSON.stringify({ candidateCount: result.candidateCount, accepted: result.accepted, blocked: result.blocked, duplicate: result.duplicate, queueCount: result.queueCount, policyRuleVersion: result.policyRuleVersion }, null, 2));
  } catch (error) {
    console.error("BLOCKED: Facebook content intake stopped safely:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  }
}
