import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateFinalFacebookPayload } from "./facebook-policy-engine.mjs";
import { verifyMetaPageIdentity, verifyMetaPagePermissions, publishMetaPagePost, fetchMetaPagePost } from "./meta-page-adapter.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isoNow = now => new Date(now).toISOString();
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
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
function acquireLock(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let handle;
  try { handle = fs.openSync(file, "wx", 0o600); }
  catch { throw new Error("Facebook publisher lock already exists; do not run concurrently or remove it without reconciliation"); }
  fs.writeFileSync(handle, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }));
  fs.fsyncSync(handle);
  return () => { try { fs.closeSync(handle); } finally { try { fs.unlinkSync(file); } catch {} } };
}
function validateConfig(config) {
  if (!config || config.destination !== "nature_frontiers_facebook" || config.timezone !== "Africa/Johannesburg") throw new Error("Facebook publisher configuration destination/timezone is invalid");
  if (config.autonomousMode !== true || config.autonomousSchedulingEnabled !== true) throw new Error("Autonomous Facebook mode/scheduling is not explicitly enabled");
  if (config.emergencyStop !== false) throw new Error("Facebook emergency stop is active; no publication attempted");
  if (config.publishingEnabled !== true || config.dryRun !== false) throw new Error("Facebook live publishing is not explicitly enabled or dry-run is still active");
  if (!/^\d{5,30}$/.test(String(config.destinationPageId ?? ""))) throw new Error("A verified numeric Facebook Page ID is required");
  if (!Number.isInteger(config.dailyCap) || config.dailyCap < 1 || config.dailyCap > 1) throw new Error("Facebook daily cap must remain exactly one post per local day");
  if (!Number.isFinite(config.minimumIntervalMinutes) || config.minimumIntervalMinutes < 1200) throw new Error("Facebook minimum interval must be at least 20 hours");
}
function localDate(now, timezone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
}
function safeHistory(file) {
  if (!fs.existsSync(file)) return [];
  const value = readJson(file);
  if (!Array.isArray(value) || value.some(row => !row || typeof row !== "object" || typeof row.status !== "string")) {
    throw new Error("Persistent Facebook history is malformed; publishing blocked");
  }
  return value;
}

/**
 * Runs at the configured local preparation time. It never asks for per-post approval.
 * Durable storage must be supplied by the operator-controlled runtime, not a short-lived CI artifact.
 */
export async function runAutonomousFacebookPublisher({
  configPath = path.join(root, "config/facebook-publishing.json"),
  queuePath = path.join(root, "content/facebook-autonomous-queue.json"),
  stateDir = process.env.FACEBOOK_STATE_DIR,
  env = process.env,
  fetchImpl = fetch,
  now = Date.now(),
  policyEvaluator = evaluateFinalFacebookPayload,
  verifyPermissions = verifyMetaPagePermissions,
  verifyIdentity = verifyMetaPageIdentity,
  publish = publishMetaPagePost,
  readRemote = fetchMetaPagePost
} = {}) {
  const config = readJson(configPath);
  // Safe defaults are intentionally a no-op rather than an error or implicit opt-in.
  if (config?.emergencyStop !== false || config?.publishingEnabled !== true || config?.dryRun !== false) {
    return { status: "SAFE_NOOP", reason: "PUBLISHING_DISABLED_OR_EMERGENCY_STOP_ACTIVE", published: 0, skipped: 0 };
  }
  validateConfig(config);
  if (typeof stateDir !== "string" || !path.isAbsolute(stateDir)) throw new Error("FACEBOOK_STATE_DIR must be an absolute durable operator-controlled directory");
  if (!env.META_USER_ACCESS_TOKEN || !env.META_PAGE_ACCESS_TOKEN) throw new Error("Meta access tokens are missing from the secure runtime environment");
  if (!fs.existsSync(queuePath)) throw new Error("Autonomous Facebook queue is missing; no content will be invented");
  const historyPath = path.join(stateDir, "facebook-history.json");
  const ledgerPath = path.join(stateDir, "facebook-attempt-ledger.json");
  const lockPath = path.join(stateDir, "facebook-publishing.lock");
  const release = acquireLock(lockPath);
  try {
    let history = safeHistory(historyPath);
    let ledger = safeHistory(ledgerPath);
    const queue = readJson(queuePath);
    if (!Array.isArray(queue)) throw new Error("Autonomous Facebook queue must be a JSON array");
    const current = Number(now);
    const today = localDate(current, config.timezone);
    const candidates = queue.filter(item => item && item.destination === "nature_frontiers_facebook" &&
      item.destinationPageId === config.destinationPageId && item.scheduledDate === today &&
      typeof item.slotId === "string" && typeof item.scheduledAt === "string");
    let published = 0, skipped = 0;
    for (const payload of candidates) {
      if (history.some(item => item.slotId === payload.slotId) || ledger.some(item => item.slotId === payload.slotId)) {
        skipped++;
        continue;
      }
      const scheduled = Date.parse(payload.scheduledAt);
      // Run early enough to use Meta's scheduled-post API. A missed slot is skipped, never caught up.
      if (!Number.isFinite(scheduled) || current < scheduled - 45 * 60_000 || current > scheduled - 10 * 60_000) {
        const record = { slotId: payload.slotId, destination: "nature_frontiers_facebook", status: "SKIPPED_MISSED_SLOT", checkedAt: isoNow(current), reason: "SLOT_OUTSIDE_AUTOMATED_PREPARATION_WINDOW" };
        history.push(record); atomicJson(historyPath, history); skipped++; continue;
      }
      let decision;
      try {
        decision = await policyEvaluator(payload, {
          expectedPageId: config.destinationPageId, expectedPageName: config.destinationPageName,
          allowedDomains: config.allowedDomains ?? [], allowedCampaignIds: config.allowedCampaignIds ?? [],
          approvedDestinations: config.approvedDestinations ?? [], history,
          evidenceRoot: root, now: isoNow(current), timezone: config.timezone,
          maxPostsPerLocalDay: config.dailyCap, minimumIntervalMinutes: config.minimumIntervalMinutes,
          fetchImpl
        });
      } catch {
        decision = { eligible: false, blockers: ["POLICY_ENGINE_ERROR"], warnings: [], policyRuleVersion: config.complianceRuleSet, contentFingerprint: null, checkedAt: isoNow(current), reason: "POLICY_ENGINE_ERROR" };
      }
      if (!decision?.eligible) {
        const record = { slotId: payload.slotId, destination: "nature_frontiers_facebook", status: "SKIPPED_BLOCKED", checkedAt: isoNow(current), contentFingerprint: decision?.contentFingerprint ?? null, policyDecision: decision, reason: decision?.reason ?? "POLICY_UNKNOWN" };
        history.push(record); atomicJson(historyPath, history); skipped++; continue;
      }
      // Validate live destination before recording the irreversible mutation attempt.
      await verifyPermissions({
        pageId: config.destinationPageId, userAccessToken: env.META_USER_ACCESS_TOKEN,
        pageAccessToken: env.META_PAGE_ACCESS_TOKEN, apiVersion: config.apiVersion, fetchImpl
      });
      await verifyIdentity({
        pageId: config.destinationPageId, expectedPageId: config.destinationPageId,
        expectedPageName: config.destinationPageName, accessToken: env.META_PAGE_ACCESS_TOKEN,
        apiVersion: config.apiVersion, fetchImpl
      });
      const attempt = {
        kind: "FACEBOOK_PUBLISH_ATTEMPT", slotId: payload.slotId, destination: "nature_frontiers_facebook",
        status: "PUBLISHING", startedAt: isoNow(current), contentFingerprint: decision.contentFingerprint,
        policyRuleVersion: decision.policyRuleVersion, policyDecision: decision,
        payload: { caption: payload.caption, links: payload.links ?? [], mediaFingerprints: decision.mediaFingerprints }
      };
      ledger.push(attempt); atomicJson(ledgerPath, ledger);
      try {
        const adapterDraft = {
          kind: "FACEBOOK_PAGE_DRAFT", caption: payload.caption, scheduledAt: payload.scheduledAt,
          media: Array.isArray(payload.media) && payload.media.length ? payload.media[0] : null
        };
        const remote = await publish({
          draft: adapterDraft, pageId: config.destinationPageId, expectedPageId: config.destinationPageId,
          accessToken: env.META_PAGE_ACCESS_TOKEN, apiVersion: config.apiVersion,
          permissionsConfirmed: true, fetchImpl, rootDir: root, now: current
        });
        const verified = await readRemote({
          remotePostId: remote.remotePostId, expectedPageId: config.destinationPageId,
          accessToken: env.META_PAGE_ACCESS_TOKEN, apiVersion: config.apiVersion, fetchImpl
        });
        const success = ["SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED"].includes(verified.status);
        const receipt = {
          ...attempt, status: success ? verified.status : "UNCERTAIN", completedAt: new Date().toISOString(),
          remotePostId: remote.remotePostId, remoteUrl: verified.remoteUrl ?? null,
          remoteCreatedAt: verified.createdTime ?? null, scheduledPublishTime: verified.scheduledPublishTime ?? null,
          verifiedRemotely: success, reconciliation: verified.status, retryAllowed: false
        };
        ledger[ledger.length - 1] = receipt;
        history.push({ ...receipt, payload: undefined });
        atomicJson(ledgerPath, ledger); atomicJson(historyPath, history);
        if (success) published++; else skipped++;
      } catch (error) {
        const uncertain = error?.uncertain === true || error?.retryable === true || error?.name === "AbortError";
        const failed = { ...attempt, status: uncertain ? "UNCERTAIN" : "FAILED_PREMUTATION_OR_REJECTED", completedAt: new Date().toISOString(), reason: uncertain ? "REMOTE_OUTCOME_UNCERTAIN_RECONCILIATION_REQUIRED" : "META_OPERATION_FAILED_NO_AUTOMATIC_RETRY", retryAllowed: false };
        ledger[ledger.length - 1] = failed;
        history.push({ ...failed, payload: undefined });
        atomicJson(ledgerPath, ledger); atomicJson(historyPath, history); skipped++;
      }
    }
    return { status: "COMPLETED", published, skipped, date: today, destination: "nature_frontiers_facebook" };
  } finally { release(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runAutonomousFacebookPublisher();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("BLOCKED: autonomous Facebook publisher stopped safely:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  }
}
