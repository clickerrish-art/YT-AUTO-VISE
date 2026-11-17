import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateFinalFacebookPayload, FACEBOOK_POLICY_RULE_VERSION } from "./facebook-policy-engine.mjs";
import { verifyMetaPageIdentity, verifyMetaPagePermissions, publishMetaPagePost, fetchMetaPagePost, reconcileMetaPagePost } from "./meta-page-adapter.mjs";
import { createMetaPageReel, reconcileMetaPageReel } from "./meta-page-reel-adapter.mjs";
import { createMetaRateLimitGuard } from "./meta-rate-limit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isoNow = now => new Date(now).toISOString();
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
function fsyncDirectory(directory) {
  // A flushed temporary file plus rename is not crash-durable until the parent
  // directory entry is flushed. Preserve the ledger transition before any
  // subsequent remote mutation or queue removal is treated as complete.
  if (process.platform === "win32") return;
  let directoryFd;
  try {
    directoryFd = fs.openSync(directory, fs.constants.O_RDONLY);
    fs.fsyncSync(directoryFd);
  } finally {
    if (directoryFd !== undefined) fs.closeSync(directoryFd);
  }
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + "." + process.pid + ".tmp";
  const handle = fs.openSync(temporary, "wx", 0o600);
  try {
    fs.writeFileSync(handle, JSON.stringify(value, null, 2) + "\n", "utf8");
    fs.fsyncSync(handle);
  } finally { fs.closeSync(handle); }
  fs.renameSync(temporary, file);
  fsyncDirectory(path.dirname(file));
}
function acquireLock(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let handle;
  try { handle = fs.openSync(file, "wx", 0o600); }
  catch { throw new Error("Facebook publisher lock already exists; do not run concurrently or remove it without reconciliation"); }
  try {
    fs.writeFileSync(handle, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }));
    fs.fsyncSync(handle);
  } catch (error) {
    // Remove only the exact inode created by this acquisition. If another
    // actor replaced the path, leave it untouched for operator inspection.
    try {
      const owned = fs.fstatSync(handle);
      const current = fs.lstatSync(file);
      if (current.isFile() && !current.isSymbolicLink() &&
          current.dev === owned.dev && current.ino === owned.ino) fs.unlinkSync(file);
    } catch {}
    try { fs.closeSync(handle); } catch {}
    throw error;
  }
  return () => {
    // A stale-lock cleanup or another actor may have replaced the path while this
    // publisher was running. Never unlink a lock inode we did not create.
    let owned = null;
    try { owned = fs.fstatSync(handle); } catch {}
    try { fs.closeSync(handle); } finally {
      try {
        const current = fs.lstatSync(file);
        if (owned && current.isFile() && !current.isSymbolicLink() &&
            current.dev === owned.dev && current.ino === owned.ino) fs.unlinkSync(file);
      } catch {}
    }
  };
}
function validateConfig(config) {
  if (!config || config.destination !== "nature_frontiers_facebook" || config.timezone !== "Africa/Johannesburg") throw new Error("Facebook publisher configuration destination/timezone is invalid");
  if (config.autonomousMode !== true || config.autonomousSchedulingEnabled !== true) throw new Error("Autonomous Facebook mode/scheduling is not explicitly enabled");
  if (config.complianceRuleSet !== FACEBOOK_POLICY_RULE_VERSION) throw new Error("Facebook publisher policy rule version does not match the policy engine");
  if (config.emergencyStop !== false) throw new Error("Facebook emergency stop is active; no publication attempted");
  if (config.publishingEnabled !== true || config.dryRun !== false) throw new Error("Facebook live publishing is not explicitly enabled or dry-run is still active");
  if (!/^\d{5,30}$/.test(String(config.destinationPageId ?? ""))) throw new Error("A verified numeric Facebook Page ID is required");
  if (config.dailyCap !== 3 || config.dailyReelCap !== 2 || config.dailyFeedPostCap !== 1) throw new Error("Nature Frontiers cadence must remain capped at two Reels and one feed post per Johannesburg day");
  if (!Number.isFinite(config.minimumIntervalMinutes) || config.minimumIntervalMinutes < 240) throw new Error("Facebook minimum interval must be at least four hours");
}
function localDate(now, timezone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
}
const FACEBOOK_HISTORY_STATUSES = new Set([
  "SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED", "UNCERTAIN", "FAILED_PREMUTATION_OR_REJECTED",
  "HELD_PRIOR_OUTCOME_REQUIRES_RECONCILIATION", "HELD_MISSED_SLOT", "HELD_UNSUPPORTED_MEDIA_TYPE",
  "HELD_POLICY_BLOCKED", "HELD_CONNECTION_BLOCKED", "HELD_UNCERTAIN_REMOTE_OUTCOME",
  "HELD_OPERATION_FAILED", "SKIPPED_BLOCKED"
]);
const FACEBOOK_LEDGER_STATUSES = new Set([
  "PUBLISHING", "UNCERTAIN", "SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED", "FAILED_PREMUTATION_OR_REJECTED"
]);
const FACEBOOK_HELD_STATUSES = new Set([
  "HELD_PRIOR_OUTCOME_REQUIRES_RECONCILIATION", "HELD_MISSED_SLOT", "HELD_UNSUPPORTED_MEDIA_TYPE",
  "HELD_POLICY_BLOCKED", "HELD_CONNECTION_BLOCKED", "HELD_UNCERTAIN_REMOTE_OUTCOME",
  "HELD_OPERATION_FAILED", "RELEASED"
]);

function safeHistory(file, label, allowedStatuses) {
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error("Persistent Facebook " + label + " path must be a regular non-symlink file; publishing blocked");
  }
  const value = readJson(file);
  if (!Array.isArray(value) || value.some(row =>
    !row || typeof row !== "object" || Array.isArray(row) || !allowedStatuses.has(row.status)
  )) {
    throw new Error("Persistent Facebook " + label + " contains malformed or unknown status data; publishing blocked");
  }
  return value;
}

/**
 * Runs at the configured local preparation time. Every candidate must carry a valid HMAC-signed
 * human approval bound to the exact final payload; the publisher independently rechecks it.
 * Durable storage must be supplied by the operator-controlled runtime, not a short-lived CI artifact.
 */
export async function runAutonomousFacebookPublisher({
  configPath = path.join(root, "config/facebook-publishing.json"),
  queuePath = null,
  rootDir = root,
  stateDir = process.env.FACEBOOK_STATE_DIR,
  env = process.env,
  fetchImpl = fetch,
  now = Date.now(),
  policyEvaluator = evaluateFinalFacebookPayload,
  verifyPermissions = verifyMetaPagePermissions,
  verifyIdentity = verifyMetaPageIdentity,
  publish = publishMetaPagePost,
  readRemote = fetchMetaPagePost,
  reconcileRemote = reconcileMetaPagePost,
  publishReel = createMetaPageReel,
  reconcileReel = reconcileMetaPageReel
} = {}) {
  const activeRoot = path.resolve(rootDir);
  queuePath = String(env.FACEBOOK_AUTONOMOUS_QUEUE_PATH ?? "").trim() || queuePath || (path.isAbsolute(String(stateDir ?? "")) ? path.join(stateDir, "facebook-autonomous-queue.json") : path.join(activeRoot, "content/facebook-autonomous-queue.json"));
  const config = readJson(configPath);
  let campaignRegistry = [];
  try {
    const campaignConfig = readJson(path.join(activeRoot, "config/campaigns.json"));
    if (Array.isArray(campaignConfig.campaigns)) campaignRegistry = campaignConfig.campaigns;
  } catch {
    // Missing or malformed campaign registry must fail closed for commercial payloads.
    campaignRegistry = [];
  }
  // Safe defaults are intentionally a no-op rather than an error or implicit opt-in.
  if (config?.emergencyStop !== false || config?.publishingEnabled !== true || config?.dryRun !== false || env.FACEBOOK_PUBLISH_ENABLED !== "YES") {
    return { status: "SAFE_NOOP", reason: "PUBLISHING_DISABLED_ENV_SWITCH_OR_EMERGENCY_STOP_ACTIVE", published: 0, skipped: 0 };
  }
  validateConfig(config);
  if (typeof stateDir !== "string" || !path.isAbsolute(stateDir)) throw new Error("FACEBOOK_STATE_DIR must be an absolute durable operator-controlled directory");
  if (!/^\d{5,30}$/.test(String(env.NATURE_FRONTIERS_FACEBOOK_PAGE_ID ?? "")) || env.NATURE_FRONTIERS_FACEBOOK_PAGE_ID !== config.destinationPageId) throw new Error("NATURE_FRONTIERS_FACEBOOK_PAGE_ID must exactly match the configured Nature Frontiers Page ID");
  if (!env.META_USER_ACCESS_TOKEN) throw new Error("Meta user access token is missing from the secure runtime environment");
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const resolvedQueuePath = path.resolve(activeRoot, queuePath);
  const canonicalRoot = fs.realpathSync(activeRoot);
  const canonicalStateDir = fs.realpathSync(stateDir);
  const within = (candidate, base) => candidate === base || candidate.startsWith(base + path.sep);
  if (!within(resolvedQueuePath, canonicalRoot) && !within(resolvedQueuePath, canonicalStateDir)) throw new Error("Autonomous Facebook queue path escapes approved repository/state roots");
  if (!fs.existsSync(resolvedQueuePath)) throw new Error("Autonomous Facebook queue is missing; run evidence intake first");
  const canonicalQueuePath = fs.realpathSync(resolvedQueuePath);
  if (!within(canonicalQueuePath, canonicalRoot) && !within(canonicalQueuePath, canonicalStateDir)) throw new Error("Autonomous Facebook queue symlink escapes approved repository/state roots");
  queuePath = canonicalQueuePath;
  const stateFile = name => {
    if (typeof name !== "string" || !name.trim() || path.isAbsolute(name) ||
        name.includes("\\") || name.split("/").some(part => !part || part === "." || part === "..")) {
      throw new Error("Facebook state filenames must be safe relative paths within FACEBOOK_STATE_DIR");
    }
    const base = fs.realpathSync(path.resolve(stateDir));
    const resolved = path.resolve(base, name);
    if (resolved !== base && !resolved.startsWith(base + path.sep)) throw new Error("Facebook state file escapes FACEBOOK_STATE_DIR");
    const parts = path.relative(base, resolved).split(path.sep).filter(Boolean);
    let current = base;
    for (let index = 0; index < parts.length; index++) {
      current = path.join(current, parts[index]);
      let stat;
      try {
        stat = fs.lstatSync(current);
      } catch (error) {
        if (error?.code === "ENOENT") break;
        throw error;
      }
      if (stat.isSymbolicLink()) {
        throw new Error("Facebook state file path contains a symbolic link; publishing blocked");
      }
      if (index < parts.length - 1 && !stat.isDirectory()) {
        throw new Error("Facebook state file path contains a non-directory component");
      }
    }
    return resolved;
  };
  const historyPath = stateFile(config.historyFile ?? "facebook-history.json");
  const ledgerPath = stateFile(config.attemptLedgerFile ?? "facebook-attempt-ledger.json");
  const heldItemsPath = stateFile(config.heldItemsFile ?? "facebook-held-items.json");
  const lockPath = stateFile(config.lockFile ?? "facebook-publishing.lock");
  const rateLimitStatePath = stateFile("meta-rate-limit-state.json");
  if (new Set([historyPath, ledgerPath, heldItemsPath, lockPath, rateLimitStatePath]).size !== 5) {
    throw new Error("Facebook history, attempt ledger, held-items ledger and lock must use distinct paths");
  }
  const release = acquireLock(lockPath);
  const guardedFetch = createMetaRateLimitGuard({ fetchImpl, stateFile: rateLimitStatePath, now: () => Number(now) });
  try {
    let history = safeHistory(historyPath, "history", FACEBOOK_HISTORY_STATUSES);
    let ledger = safeHistory(ledgerPath, "attempt ledger", FACEBOOK_LEDGER_STATUSES);
    let heldItems = safeHistory(heldItemsPath, "held-items ledger", FACEBOOK_HELD_STATUSES);
    const queue = readJson(queuePath);
    if (!Array.isArray(queue)) throw new Error("Autonomous Facebook queue must be a JSON array");
    const current = Number(now);
    const today = localDate(current, config.timezone);
    const runStartedAt = isoNow(current);
    let published = 0, skipped = 0;

    // Derive a short-lived Page token only when interrupted mutations need reconciliation.
    // The token is obtained from the exact managed Page response and is never persisted or logged.
    let recoveryPageToken = "";
    if (ledger.some(row => row && ["PUBLISHING", "UNCERTAIN"].includes(row.status))) {
      try {
        const recoveryPermissions = await verifyPermissions({
          pageId: config.destinationPageId, userAccessToken: env.META_USER_ACCESS_TOKEN,
          apiVersion: config.apiVersion, fetchImpl: guardedFetch
        });
        if (recoveryPermissions?.permissionsVerified === true &&
            typeof recoveryPermissions.pageAccessToken === "string" && recoveryPermissions.pageAccessToken.length >= 20) {
          recoveryPageToken = recoveryPermissions.pageAccessToken;
        }
      } catch { /* unresolved attempts remain blocked below; never retry a remote mutation */ }
    }
    // Recover interrupted mutations before selecting new work. A PUBLISHING ledger entry
    // means the previous process may have reached Meta; it must never be retried blindly.
    for (let index = 0; index < ledger.length; index++) {
      const priorAttempt = ledger[index];
      if (!priorAttempt || !["PUBLISHING", "UNCERTAIN"].includes(priorAttempt.status)) continue;
      if (priorAttempt.status === "PUBLISHING") {
        ledger[index] = { ...priorAttempt, status: "UNCERTAIN", reason: "PROCESS_RESTARTED_DURING_PUBLISH_RECONCILIATION_REQUIRED", retryAllowed: false };
        atomicJson(ledgerPath, ledger);
      }
      const attempt = ledger[index];
      const caption = attempt.payload?.caption;
      const scheduledAt = attempt.scheduledAt ?? attempt.payload?.scheduledAt;
      if (typeof caption !== "string" || !scheduledAt || !attempt.startedAt) {
        ledger[index] = { ...attempt, status: "UNCERTAIN", reason: "RECONCILIATION_FIELDS_MISSING_NO_RETRY", retryAllowed: false };
        atomicJson(ledgerPath, ledger);
        continue;
      }
      let reconciliation;
      try {
        if (recoveryPageToken.length < 20) throw new Error("No runtime-derived Page token available for reconciliation");
        if (attempt.kind === "FACEBOOK_PAGE_REEL_PUBLISH_ATTEMPT") {
          reconciliation = attempt.remoteVideoId
            ? await reconcileReel({
                remoteVideoId:attempt.remoteVideoId, expectedPageId:config.destinationPageId,
                accessToken:recoveryPageToken, apiVersion:config.apiVersion,
                scheduledAt, fetchImpl: guardedFetch
              })
            : { outcome:"UNRESOLVED", reason:"REEL_REMOTE_VIDEO_ID_NOT_DURABLY_RECORDED_NO_RETRY" };
        } else {
          reconciliation = await reconcileRemote({
            pageId: config.destinationPageId, expectedPageId: config.destinationPageId,
            accessToken: recoveryPageToken, apiVersion: config.apiVersion,
            caption, scheduledAt, attemptStartedAt: attempt.startedAt,
            remotePostId: attempt.remotePostId ?? null, fetchImpl: guardedFetch
          });
        }
      } catch {
        reconciliation = { outcome: "UNRESOLVED", reason: "STARTUP_RECONCILIATION_FAILED", matches: [] };
      }
      if (reconciliation?.outcome === "CONFIRMED" &&
          ["SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED"].includes(reconciliation.receipt?.status)) {
        const recovered = {
          ...attempt, status: reconciliation.receipt.status, completedAt: new Date().toISOString(),
          remotePostId: reconciliation.receipt.remotePostId, remoteUrl: reconciliation.receipt.remoteUrl ?? null,
          remoteCreatedAt: reconciliation.receipt.createdTime ?? null,
          scheduledPublishTime: reconciliation.receipt.scheduledPublishTime ?? null,
          verifiedRemotely: true, reconciliation, retryAllowed: false,
          recoveryReason: "INTERRUPTED_ATTEMPT_RECONCILED_BEFORE_NEW_WORK"
        };
        ledger[index] = recovered;
        history.push({ ...recovered, payload: undefined });
      } else {
        ledger[index] = { ...attempt, status: "UNCERTAIN", reconciliation, retryAllowed: false,
          reason: reconciliation?.reason ?? "REMOTE_OUTCOME_UNRESOLVED_NO_RETRY" };
      }
      atomicJson(ledgerPath, ledger);
      atomicJson(historyPath, history);
    }

    const candidates = queue.filter(item => item && item.destination === "nature_frontiers_facebook" &&
      item.destinationPageId === config.destinationPageId && item.scheduledDate === today &&
      typeof item.slotId === "string" && typeof item.scheduledAt === "string");
    const removeQueuedSlot = slotId => {
      const index = queue.findIndex(item => item?.slotId === slotId);
      if (index >= 0) { queue.splice(index, 1); atomicJson(queuePath, queue); }
    };
    const holdQueuedSlot = (payload, status, reason, decision = null, attempt = null) => {
      const existingIndex = heldItems.findIndex(item => item?.slotId === payload.slotId && item.status !== "RELEASED");
      const existing = existingIndex >= 0 ? heldItems[existingIndex] : null;
      const contentFingerprint = decision?.contentFingerprint ?? attempt?.contentFingerprint ?? existing?.contentFingerprint ?? null;
      if (existing && JSON.stringify(existing.payload) !== JSON.stringify(payload)) {
        throw new Error("Held Facebook slot payload changed; manual reconciliation required");
      }
      if (existing?.contentFingerprint && contentFingerprint && existing.contentFingerprint !== contentFingerprint) {
        throw new Error("Held Facebook slot has a conflicting content fingerprint; manual reconciliation required");
      }
      const heldRecord = {
        ...(existing ?? {}), slotId: payload.slotId, destination: payload.destination,
        status, heldAt: existing?.heldAt ?? isoNow(current), updatedAt: isoNow(current), reason,
        contentFingerprint, policyDecision: decision ?? existing?.policyDecision ?? null,
        attempt: attempt ?? existing?.attempt ?? null, payload
      };
      if (existingIndex >= 0) heldItems[existingIndex] = heldRecord;
      else heldItems.push(heldRecord);
      // Persist the complete original candidate before writing history or draining
      // the active queue. A failed hold write must leave the queue item untouched.
      atomicJson(heldItemsPath, heldItems);
      history.push({
        slotId: payload.slotId, destination: payload.destination, status,
        checkedAt: isoNow(current), contentFingerprint, policyDecision: decision ?? null,
        reason, heldItemPath: path.basename(heldItemsPath)
      });
      atomicJson(historyPath, history);
      removeQueuedSlot(payload.slotId);
    };
    for (const payload of candidates) {
      const existingHold = heldItems.find(item => item?.slotId === payload.slotId && item.status !== "RELEASED");
      if (existingHold) {
        // The full payload is already durably held. A changed duplicate is an
        // ambiguity, not permission to discard either version.
        if (JSON.stringify(existingHold.payload) !== JSON.stringify(payload)) {
          throw new Error("Active held Facebook slot conflicts with a different queued payload; manual reconciliation required");
        }
        // Drain only an exact stale duplicate; never call Meta again until release.
        removeQueuedSlot(payload.slotId);
        skipped++;
        continue;
      }
      const releasedHold = heldItems.some(item => item?.slotId === payload.slotId && item.status === "RELEASED");
      const priorHistory = history.filter(item => item.slotId === payload.slotId &&
        !(releasedHold && String(item.status ?? "").startsWith("HELD_"))).at(-1) ?? null;
      const priorLedger = ledger.filter(item => item.slotId === payload.slotId).at(-1) ?? null;
      if (priorHistory || priorLedger) {
        const verified = ["SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED"].includes(priorHistory?.status) ||
          ["SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED"].includes(priorLedger?.status);
        if (verified) removeQueuedSlot(payload.slotId);
        else holdQueuedSlot(payload, "HELD_PRIOR_OUTCOME_REQUIRES_RECONCILIATION",
          "PRIOR_UNVERIFIED_HISTORY_OR_LEDGER_REQUIRES_MANUAL_REVIEW", priorHistory?.policyDecision ?? null, priorLedger ?? null);
        skipped++;
        continue;
      }
      const scheduled = Date.parse(payload.scheduledAt);
      // Run early enough to use Meta's scheduled-post API. A missed slot is skipped, never caught up.
      if (!Number.isFinite(scheduled) || current < scheduled - 45 * 60_000 || current > scheduled - 10 * 60_000) {
        holdQueuedSlot(payload, "HELD_MISSED_SLOT", "SLOT_OUTSIDE_AUTOMATED_PREPARATION_WINDOW");
        skipped++; continue;
      }
      let decision;
      try {
        decision = await policyEvaluator(payload, {
          expectedPageId: config.destinationPageId, expectedPageName: config.destinationPageName,
          allowedDomains: config.allowedDomains ?? [], allowedCampaignIds: config.allowedCampaignIds ?? [],
          approvedDestinations: config.approvedDestinations ?? [], campaignRegistry, history: [...history, ...ledger],
          evidenceRoot: activeRoot, now: isoNow(current), timezone: config.timezone,
          mediaHistoryReconciled: config.mediaHistoryReconciled === true,
          maxPostsPerLocalDay: config.dailyCap, maxReelsPerLocalDay: config.dailyReelCap,
          maxFeedPostsPerLocalDay: config.dailyFeedPostCap, minimumIntervalMinutes: config.minimumIntervalMinutes,
          fetchImpl: guardedFetch
        });
      } catch {
        decision = { eligible: false, blockers: ["POLICY_ENGINE_ERROR"], warnings: [], policyRuleVersion: config.complianceRuleSet, contentFingerprint: null, checkedAt: isoNow(current), reason: "POLICY_ENGINE_ERROR" };
      }
      if (decision?.policyRuleVersion !== FACEBOOK_POLICY_RULE_VERSION) {
        decision = {
          ...(decision && typeof decision === "object" ? decision : {}),
          eligible: false,
          blockers: [...new Set([...(Array.isArray(decision?.blockers) ? decision.blockers : []), "POLICY_RULE_VERSION_MISMATCH"])],
          policyRuleVersion: decision?.policyRuleVersion ?? null,
          reason: "POLICY_RULE_VERSION_MISMATCH"
        };
      }
      if (payload.mediaType != null && !["feed_post","reel"].includes(payload.mediaType)) {
        holdQueuedSlot(payload, "HELD_UNSUPPORTED_MEDIA_TYPE", "UNSUPPORTED_MEDIA_TYPE", decision);
        skipped++; continue;
      }
      if (!decision?.eligible) {
        holdQueuedSlot(payload, "HELD_POLICY_BLOCKED", decision?.reason ?? "POLICY_UNKNOWN", decision);
        skipped++; continue;
      }
      // Validate the live destination before mutation. Connection failures become an
      // auditable automatic skip; no owner override or publish request is attempted.
      let permissionVerification;
      let pageAccessToken = "";
      try {
        permissionVerification = await verifyPermissions({
          pageId: config.destinationPageId, userAccessToken: env.META_USER_ACCESS_TOKEN,
          apiVersion: config.apiVersion, fetchImpl: guardedFetch
        });
        if (permissionVerification?.permissionsVerified !== true ||
            typeof permissionVerification.pageAccessToken !== "string" || permissionVerification.pageAccessToken.length < 20) {
          throw new Error("Permission check did not derive a valid Page token for the exact Page");
        }
        pageAccessToken = permissionVerification.pageAccessToken;
        await verifyIdentity({
          pageId: config.destinationPageId, expectedPageId: config.destinationPageId,
          expectedPageName: config.destinationPageName, accessToken: pageAccessToken,
          apiVersion: config.apiVersion, fetchImpl: guardedFetch
        });
      } catch {
        holdQueuedSlot(payload, "HELD_CONNECTION_BLOCKED",
          "META_PAGE_IDENTITY_OR_PERMISSION_CHECK_FAILED_NO_MUTATION", decision);
        skipped++;
        continue;
      }
      const isReel = payload.mediaType === "reel";
      const attempt = {
        kind: isReel ? "FACEBOOK_PAGE_REEL_PUBLISH_ATTEMPT" : "FACEBOOK_PUBLISH_ATTEMPT", slotId: payload.slotId, destination: "nature_frontiers_facebook",
        status: "PUBLISHING", startedAt: isoNow(current), scheduledAt: payload.scheduledAt, mediaType: payload.mediaType ?? "feed_post", contentFingerprint: decision.contentFingerprint,
        policyRuleVersion: decision.policyRuleVersion, policyDecision: decision,
        payload: { caption: payload.caption, scheduledAt: payload.scheduledAt, mediaType: payload.mediaType ?? "feed_post", links: payload.links ?? [], mediaFingerprints: decision.mediaFingerprints }
      };
      ledger.push(attempt); atomicJson(ledgerPath, ledger);
      let remote = null;
      try {
        if (isReel) {
          const adapterDraft = {
            kind:"FACEBOOK_PAGE_REEL_DRAFT", caption:payload.caption,
            media:Array.isArray(payload.media) && payload.media.length ? payload.media[0] : null
          };
          remote = await publishReel({
            draft:adapterDraft, pageId:config.destinationPageId, expectedPageId:config.destinationPageId,
            accessToken:pageAccessToken, apiVersion:config.apiVersion,
            permissionsVerified:permissionVerification.permissionsVerified, approvalVerified:true,
            publishingEnabled:true, dryRun:false, emergencyStop:false,
            videoState:"SCHEDULED", scheduledPublishAt:payload.scheduledAt,
            fetchImpl: guardedFetch, rootDir:activeRoot, now:()=>current,
            onRemoteVideoId:async ({remoteVideoId})=>{
              const index=ledger.length-1;
              ledger[index]={...ledger[index],remoteVideoId};
              atomicJson(ledgerPath,ledger);
            }
          });
        } else {
          const adapterDraft = {
            kind: "FACEBOOK_PAGE_DRAFT", caption: payload.caption, scheduledAt: payload.scheduledAt,
            media: Array.isArray(payload.media) && payload.media.length ? payload.media[0] : null
          };
          remote = await publish({
            draft: adapterDraft, pageId: config.destinationPageId, expectedPageId: config.destinationPageId,
            accessToken: pageAccessToken, apiVersion: config.apiVersion,
            permissionsVerified: permissionVerification.permissionsVerified, fetchImpl: guardedFetch, rootDir: activeRoot, now: current
          });
        }
        const verified = isReel
          ? await reconcileReel({
              remoteVideoId:remote.remoteVideoId, expectedPageId:config.destinationPageId,
              accessToken:pageAccessToken, apiVersion:config.apiVersion, scheduledAt:payload.scheduledAt, fetchImpl: guardedFetch
            })
          : await readRemote({
              remotePostId: remote.remotePostId, expectedPageId: config.destinationPageId,
              accessToken: pageAccessToken, apiVersion: config.apiVersion, fetchImpl: guardedFetch
            });
        const success = isReel ? verified?.outcome === "CONFIRMED" && ["SCHEDULED_VERIFIED","PUBLISHED_VERIFIED"].includes(verified.receipt?.status) : ["SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED"].includes(verified.status);
        const receipt = {
          ...attempt,
          status: success ? (isReel ? verified.receipt.status : verified.status) : "UNCERTAIN",
          completedAt: new Date().toISOString(),
          remotePostId: isReel ? (verified?.receipt?.remotePostId ?? remote.remoteVideoId) : remote.remotePostId,
          remoteVideoId: isReel ? remote.remoteVideoId : undefined,
          remoteUrl: isReel ? (verified?.receipt?.remoteUrl ?? null) : (verified.remoteUrl ?? null),
          remoteCreatedAt: isReel ? (verified?.receipt?.createdTime ?? null) : (verified.createdTime ?? null),
          scheduledPublishTime: isReel ? (verified?.receipt?.scheduledPublishTime ?? null) : (verified.scheduledPublishTime ?? null),
          verifiedRemotely: success, reconciliation: isReel ? verified : verified.status, retryAllowed: false
        };
        ledger[ledger.length - 1] = receipt;
        history.push({ ...receipt, payload: undefined });
        atomicJson(ledgerPath, ledger); atomicJson(historyPath, history);
        if (success) {
          removeQueuedSlot(payload.slotId);
          published++;
        } else {
          holdQueuedSlot(payload, "HELD_UNCERTAIN_REMOTE_OUTCOME",
            "REMOTE_OUTCOME_UNCERTAIN_RECONCILIATION_REQUIRED", decision, receipt);
          skipped++;
        }
      } catch (error) {
        const uncertain = error?.uncertain === true || error?.retryable === true || error?.name === "AbortError" || Boolean(remote?.remotePostId || remote?.remoteVideoId || ledger[ledger.length - 1]?.remoteVideoId);
        let reconciliation = null;
        if (uncertain) {
          try {
            reconciliation = isReel
              ? ((remote?.remoteVideoId ?? ledger[ledger.length - 1]?.remoteVideoId)
                  ? await reconcileReel({
                      remoteVideoId:remote?.remoteVideoId ?? ledger[ledger.length - 1]?.remoteVideoId,
                      expectedPageId:config.destinationPageId, accessToken:pageAccessToken,
                      apiVersion:config.apiVersion, scheduledAt:payload.scheduledAt, fetchImpl: guardedFetch
                    })
                  : { outcome:"UNRESOLVED", reason:"REEL_REMOTE_VIDEO_ID_NOT_DURABLY_RECORDED_NO_RETRY" })
              : await reconcileRemote({
                  pageId: config.destinationPageId, expectedPageId: config.destinationPageId,
                  accessToken: pageAccessToken, apiVersion: config.apiVersion,
                  caption: payload.caption, scheduledAt: payload.scheduledAt, attemptStartedAt: attempt.startedAt,
                  remotePostId: remote?.remotePostId ?? null, fetchImpl: guardedFetch
                });
          } catch {
            reconciliation = { outcome: "UNRESOLVED", reason: "RECONCILIATION_FAILED", matches: [] };
          }
        }
        if (reconciliation?.outcome === "CONFIRMED" &&
            ["SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED"].includes(reconciliation.receipt?.status)) {
          const recovered = {
            ...attempt, status: reconciliation.receipt.status, completedAt: new Date().toISOString(),
            remotePostId: reconciliation.receipt.remotePostId, remoteVideoId: remote?.remoteVideoId ?? ledger[ledger.length - 1]?.remoteVideoId ?? attempt.remoteVideoId ?? null, remoteUrl: reconciliation.receipt.remoteUrl ?? null,
            remoteCreatedAt: reconciliation.receipt.createdTime ?? null,
            scheduledPublishTime: reconciliation.receipt.scheduledPublishTime ?? null,
            verifiedRemotely: true, reconciliation, retryAllowed: false,
            recoveryReason: "REMOTE_RECEIPT_RECOVERED_AFTER_UNCERTAIN_MUTATION"
          };
          ledger[ledger.length - 1] = recovered;
          history.push({ ...recovered, payload: undefined });
          atomicJson(ledgerPath, ledger); atomicJson(historyPath, history); removeQueuedSlot(payload.slotId); published++;
          continue;
        }
        const failed = {
          ...attempt, status: uncertain ? "UNCERTAIN" : "FAILED_PREMUTATION_OR_REJECTED",
          completedAt: new Date().toISOString(), remotePostId: remote?.remotePostId ?? null,
          reason: uncertain ? "REMOTE_OUTCOME_UNCERTAIN_RECONCILIATION_REQUIRED" : "META_OPERATION_FAILED_NO_AUTOMATIC_RETRY",
          reconciliation, retryAllowed: false
        };
        ledger[ledger.length - 1] = failed;
        history.push({ ...failed, payload: undefined });
        atomicJson(ledgerPath, ledger); atomicJson(historyPath, history);
        holdQueuedSlot(payload, uncertain ? "HELD_UNCERTAIN_REMOTE_OUTCOME" : "HELD_OPERATION_FAILED", failed.reason, decision, failed);
        skipped++;
      }
    }
    const summary = {
      status: "COMPLETED", destination: "nature_frontiers_facebook", timezone: config.timezone,
      startedAt: runStartedAt, completedAt: new Date().toISOString(), date: today,
      published, skipped, queueCount: queue.length,
      heldItemsCount: heldItems.filter(item => item.status !== "RELEASED").length,
      heldItems: heldItems.filter(item => item.status !== "RELEASED").slice(-20).map(item => ({
        slotId: item.slotId, status: item.status, reason: item.reason, heldAt: item.heldAt
      })),
      lastRemoteReceipt: [...history].reverse().find(item => ["SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED"].includes(item.status)) ?? null,
      blockedPosts: history.filter(item => String(item.status ?? "").startsWith("HELD_") || item.status === "SKIPPED_BLOCKED").slice(-20).map(item => ({
        slotId: item.slotId ?? null, status: item.status, reason: item.reason ?? null,
        blockers: item.policyDecision?.blockers ?? [], checkedAt: item.checkedAt ?? null
      })),
      uncertainAttempts: ledger.filter(item => item.status === "UNCERTAIN").slice(-20).map(item => ({
        slotId: item.slotId ?? null, status: item.status, reason: item.reason ?? null,
        remotePostId: item.remotePostId ?? null, reconciliation: item.reconciliation ?? null
      }))
    };
    atomicJson(path.join(stateDir, "facebook-run-summary.json"), summary);
    return summary;
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
