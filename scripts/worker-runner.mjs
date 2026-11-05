#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { verifyWorkerQuarantineReleaseReceipt } from "./worker-quarantine-release.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { atomicWriteJson } from "./atomic-json-file.mjs";
import { ensureSafeDirectoryPath } from "./safe-directory-path.mjs";

const DEFAULT_API_URL = "http://127.0.0.1:8787";
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const MIN_POLL_INTERVAL_MS = 1_000;
const MAX_POLL_INTERVAL_MS = 60_000;
const COOLDOWN_SCHEMA_VERSION = 1;

export function parseRetryAfterMs(retryAfter, now = Date.now()) {
  const seconds = retryAfter && /^\d+(?:\.\d+)?$/.test(retryAfter) ? Number(retryAfter) : NaN;
  const dateDelay = retryAfter && !Number.isFinite(seconds) ? Date.parse(retryAfter) - now : NaN;
  const requestedDelay = Number.isFinite(seconds)
    ? seconds * 1_000
    : Number.isFinite(dateDelay) && dateDelay > 0 ? dateDelay : 30_000;
  return Math.max(1_000, Math.min(15 * 60_000, requestedDelay));
}

function cooldownStatePath(workerId, configuredPath, stateDirectory) {
  if (configuredPath !== undefined && configuredPath !== null && String(configuredPath).trim()) {
    const target = path.resolve(String(configuredPath));
    ensureSafeDirectoryPath(path.dirname(target), "Worker cooldown state parent directory");
    return target;
  }
  const directory = ensureSafeDirectoryPath(path.resolve(stateDirectory ?? "run-logs"), "Worker cooldown state directory");
  const identity = crypto.createHash("sha256").update(workerId).digest("hex").slice(0, 20);
  return path.join(directory, "worker-backoff-" + identity + ".json");
}

function loadCooldowns(statePath, workerId) {
  let stat;
  try {
    stat = fs.lstatSync(statePath);
  } catch (error) {
    if (error?.code === "ENOENT") return { cooldowns: new Map(), uncertainDispatches: new Map(), consumedReleaseNonces: new Set() };
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error("Worker cooldown state must be a regular file; refusing an unsafe path");
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (error) {
    throw new Error("Worker cooldown state is unreadable or corrupt; refusing to reset retry backoff", { cause: error });
  }
  if (parsed?.schemaVersion !== COOLDOWN_SCHEMA_VERSION || parsed.workerId !== workerId ||
      !parsed.cooldowns || typeof parsed.cooldowns !== "object" || Array.isArray(parsed.cooldowns)) {
    throw new Error("Worker cooldown state has an unsupported schema or belongs to a different worker");
  }
  const cooldowns = new Map();
  for (const [jobId, value] of Object.entries(parsed.cooldowns)) {
    if (!jobId || !value || !Number.isInteger(value.attempts) || value.attempts < 1 || value.attempts > 20 ||
        !Number.isSafeInteger(value.nextAttemptAt) || value.nextAttemptAt <= 0) {
      throw new Error("Worker cooldown state contains an invalid retry record; refusing to retry jobs early");
    }
    cooldowns.set(jobId, { attempts: value.attempts, nextAttemptAt: value.nextAttemptAt });
  }
  const uncertainDispatches = new Map();
  const storedNonces = parsed.consumedReleaseNonces ?? [];
  if (!Array.isArray(storedNonces) || storedNonces.length > 1000000 || storedNonces.some(value => typeof value !== "string" || !/^[a-f0-9]{48}$/.test(value))) {
    throw new Error("Worker consumed release nonce state is invalid; refusing quarantine release");
  }
  const consumedReleaseNonces = new Set(storedNonces);
  const storedUncertain = parsed.uncertainDispatches ?? {};
  if (!storedUncertain || typeof storedUncertain !== "object" || Array.isArray(storedUncertain)) {
    throw new Error("Worker uncertain-dispatch state is invalid; refusing to redispatch quarantined jobs");
  }
  for (const [jobId, value] of Object.entries(storedUncertain)) {
    if (!jobId || !value || value.code !== "WORKER_DISPATCH_OUTCOME_UNCERTAIN" ||
        typeof value.recordedAt !== "string" || !Number.isFinite(Date.parse(value.recordedAt))) {
      throw new Error("Worker uncertain-dispatch state contains an invalid quarantine record; refusing to redispatch");
    }
    uncertainDispatches.set(jobId, value);
  }
  return { cooldowns, uncertainDispatches, consumedReleaseNonces };
}

function persistCooldowns(statePath, workerId, cooldowns, uncertainDispatches = new Map(), consumedReleaseNonces = new Set()) {
  const records = Object.fromEntries([...cooldowns.entries()].map(([jobId, value]) => [jobId, {
    attempts: value.attempts,
    nextAttemptAt: value.nextAttemptAt
  }]));
  const quarantined = Object.fromEntries([...uncertainDispatches.entries()]);
  atomicWriteJson(statePath, {
    schemaVersion: COOLDOWN_SCHEMA_VERSION,
    workerId,
    updatedAt: new Date().toISOString(),
    cooldowns: records,
    uncertainDispatches: quarantined,
    consumedReleaseNonces: [...consumedReleaseNonces]
  }, { mode: 0o600 });
}

export function assertWorkerStoppedForQuarantineRelease(statePath) {
  if (fs.existsSync(statePath + ".process.lock")) {
    throw new Error("Stop the worker process before releasing its quarantine; worker state is locked");
  }
}

export function applyWorkerQuarantineRelease({
  statePath, workerId, jobId, attemptId, artifactSha256, receipt, publicKeyPem, nowMs = Date.now()
}) {
  assertWorkerStoppedForQuarantineRelease(statePath);
  const releaseLockPath = statePath + ".release.lock";
  let releaseLockFd;
  try {
    releaseLockFd = fs.openSync(releaseLockPath, "wx", 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error("Another quarantine release is already in progress, or a stale release lock requires operator inspection");
    }
    throw error;
  }
  try {
    fs.writeFileSync(releaseLockFd, JSON.stringify({
      pid: process.pid,
      workerId,
      jobId,
      startedAt: new Date().toISOString()
    }));
    assertWorkerStoppedForQuarantineRelease(statePath);
    const state = loadCooldowns(statePath, workerId);
    if (!state.uncertainDispatches.has(jobId)) {
      throw new Error("Exact job is not currently quarantined by this worker");
    }
    const verified = verifyWorkerQuarantineReleaseReceipt(receipt, {
      workerId, jobId, attemptId, artifactSha256, publicKeyPem, nowMs
    });
    if (state.consumedReleaseNonces.has(verified.nonce)) {
      throw new Error("Quarantine release receipt nonce has already been consumed");
    }
    state.uncertainDispatches.delete(jobId);
    state.consumedReleaseNonces.add(verified.nonce);
    persistCooldowns(statePath, workerId, state.cooldowns, state.uncertainDispatches, state.consumedReleaseNonces);
    return { workerId, jobId, attemptId, artifactSha256, released: true, nonceConsumed: true };
  } finally {
    if (releaseLockFd !== undefined) fs.closeSync(releaseLockFd);
    try { fs.unlinkSync(releaseLockPath); }
    catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

export function inspectWorkerState({
  workerId = process.env.DASHBOARD_WORKER_ID ?? "sonicvhibez-render-worker",
  cooldownStatePath: configuredCooldownStatePath = process.env.WORKER_BACKOFF_STATE_PATH,
  stateDirectory = process.env.WORKER_STATE_DIR ?? "run-logs"
} = {}) {
  if (typeof workerId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(workerId)) {
    throw new Error("DASHBOARD_WORKER_ID must be a safe 2–120 character identifier");
  }
  const statePath = cooldownStatePath(workerId, configuredCooldownStatePath, stateDirectory);
  const state = loadCooldowns(statePath, workerId);
  return {
    workerId,
    uncertainDispatches: [...state.uncertainDispatches.entries()].map(([jobId, record]) => ({ jobId, ...record })),
    cooldownCount: state.cooldowns.size,
    publishingEnabled: false
  };
}

export async function reconcileDashboardUpload({
  baseUrl = process.env.DASHBOARD_API_URL ?? DEFAULT_API_URL,
  operatorToken = process.env.DASHBOARD_OPERATOR_TOKEN,
  jobId, metadataPath, videoPath, approvalPath, fetchImpl = fetch
} = {}) {
  const inspected = await inspectDashboardReconciliation({ baseUrl, operatorToken, jobId, fetchImpl });
  for (const [name, value] of Object.entries({ metadataPath, videoPath, approvalPath })) {
    if (typeof value !== "string" || !value.trim() || value.length > 500 || value.startsWith("/") || value.includes("\\") || value.split("/").some(part => !part || part === "." || part === "..")) {
      throw new Error(name + " must be a safe repository-relative path");
    }
  }
  if (!inspected.dashboardJobVisible) throw new Error("Dashboard job is not visible; remote reconciliation is blocked");
  if (!inspected.uploadAttempts.length || !inspected.uploadAttempts.some(item => item.artifactSha256)) {
    throw new Error("Dashboard has no matching upload attempt evidence; remote reconciliation is blocked");
  }
  const parsed = new URL(baseUrl);
  let response;
  try {
    response = await fetchImpl(new URL("/api/uploads/reconcile", parsed.origin), {
      method: "POST",
      headers: { "x-operator-token": operatorToken, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jobId, metadataPath, videoPath, approvalPath }),
      redirect: "error", signal: AbortSignal.timeout(75_000)
    });
  } catch (cause) {
    throw new Error("Authenticated upload reconciliation request failed; quarantine remains in place", { cause });
  }
  let payload;
  try { payload = await response.json(); }
  catch (cause) { throw new Error("Upload reconciliation returned unreadable JSON; quarantine remains in place", { cause }); }
  const verified = response.status === 200 && payload?.reconciliation?.status === "SUCCEEDED" &&
    payload?.uploadAttemptCreated === false && payload?.publishingEnabled === false;
  return {
    jobId, httpStatus: response.status, verified,
    reconciliation: payload?.reconciliation ?? null,
    uploadAttemptCreated: payload?.uploadAttemptCreated ?? null,
    publishingEnabled: payload?.publishingEnabled === true,
    quarantineReleased: false,
    quarantineReleasePermitted: false,
    dashboardCorrelation: inspected,
    responseError: payload?.error ?? null,
    limitation: verified ? "Remote private upload identity and visibility were reverified. Worker quarantine is released only after the dashboard issues a short-lived operator-authorized signature and the worker consumes its one-time nonce." : "Remote reconciliation did not return a verified success. Worker quarantine remains in place."
  };
}

export async function inspectDashboardReconciliation({
  baseUrl = process.env.DASHBOARD_API_URL ?? DEFAULT_API_URL,
  operatorToken = process.env.DASHBOARD_OPERATOR_TOKEN,
  jobId,
  fetchImpl = fetch
} = {}) {
  if (typeof jobId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{1,159}$/.test(jobId)) {
    throw new Error("A safe exact jobId is required for dashboard reconciliation inspection");
  }
  let parsed;
  try { parsed = new URL(baseUrl); }
  catch { throw new Error("DASHBOARD_API_URL must be a valid absolute URL"); }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash ||
      (parsed.protocol === "http:" && !["127.0.0.1", "::1", "localhost"].includes(hostname))) {
    throw new Error("Dashboard reconciliation requires HTTPS or a loopback HTTP URL without embedded credentials, query or fragment");
  }
  if (typeof operatorToken !== "string" || operatorToken.length < 24) {
    throw new Error("DASHBOARD_OPERATOR_TOKEN must contain at least 24 characters for read-only reconciliation inspection");
  }
  let response;
  try {
    response = await fetchImpl(new URL("/api/state", parsed.origin), {
      method: "GET", headers: { "x-operator-token": operatorToken, accept: "application/json" },
      redirect: "error", signal: AbortSignal.timeout(15_000)
    });
  } catch (cause) {
    throw new Error("Dashboard reconciliation inspection could not reach the authenticated state endpoint", { cause });
  }
  let payload;
  try { payload = await response.json(); }
  catch (cause) { throw new Error("Dashboard reconciliation endpoint returned unreadable JSON", { cause }); }
  if (!response.ok) throw new Error("Dashboard reconciliation endpoint returned HTTP " + response.status);
  if (!payload || !Array.isArray(payload.jobs) || !payload.uploadLedger || !Array.isArray(payload.uploadLedger.attempts)) {
    throw new Error("Dashboard state response is incomplete; reconciliation evidence is unavailable");
  }
  const job = payload.jobs.find(item => item?.id === jobId) ?? null;
  const attempts = payload.uploadLedger.attempts.filter(item => item?.jobId === jobId).map(item => ({
    attemptId: item.attemptId ?? null,
    status: item.status ?? null,
    remoteVideoId: item.remoteVideoId ?? null,
    artifactSha256: item.artifactSha256 ?? null,
    startedAt: item.startedAt ?? null,
    finishedAt: item.finishedAt ?? null
  }));
  const uploads = Array.isArray(payload.uploads) ? payload.uploads.filter(item => item?.jobId === jobId).map(item => ({
    status: item.status ?? null, remoteVideoId: item.remoteVideoId ?? null,
    artifactSha256: item.artifactSha256 ?? null, createdAt: item.createdAt ?? null
  })) : [];
  return {
    jobId,
    dashboardJobVisible: Boolean(job),
    dashboardJob: job ? {
      state: job.state ?? null,
      updatedAt: job.updatedAt ?? null,
      errorCode: job.errorDetails?.code ?? null,
      workerLease: job.workerLease ? { workerId: job.workerLease.workerId ?? null, acquiredAt: job.workerLease.acquiredAt ?? null } : null,
      lastLeaseEvent: Array.isArray(job.leaseHistory) ? job.leaseHistory.at(-1) ?? null : null
    } : null,
    uploadAttempts: attempts,
    uploadRecords: uploads,
    dashboardPublishingEnabled: payload.publishingEnabled === true,
    remoteEffectVerified: false,
    quarantineReleasePermitted: false,
    limitation: job ? "Dashboard correlation is read-only. Remote YouTube state and exact artifact identity still require authoritative reconciliation; quarantine remains in place." : "Job is not present in the dashboard's bounded state response. No inference about remote effects is permitted; quarantine remains in place."
  };
}

function validateConfiguration({ baseUrl, token, workerId, pollIntervalMs }) {
  let parsed;
  try { parsed = new URL(baseUrl); }
  catch { throw new Error("DASHBOARD_API_URL must be a valid absolute URL"); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("DASHBOARD_API_URL must be an HTTP(S) origin without embedded credentials, query or fragment");
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (parsed.protocol === "http:" && !["127.0.0.1", "::1", "localhost"].includes(hostname)) {
    throw new Error("Unencrypted worker API connections are restricted to loopback");
  }
  if (typeof token !== "string" || token.length < 24) throw new Error("DASHBOARD_WORKER_TOKEN must contain at least 24 characters");
  if (typeof workerId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(workerId)) {
    throw new Error("DASHBOARD_WORKER_ID must be a safe 2–120 character identifier");
  }
  if (!Number.isInteger(pollIntervalMs) || pollIntervalMs < MIN_POLL_INTERVAL_MS || pollIntervalMs > MAX_POLL_INTERVAL_MS) {
    throw new Error("WORKER_POLL_INTERVAL_MS must be an integer from 1000 to 60000");
  }
  return parsed.origin;
}

async function requestJson(fetchImpl, url, options, timeoutMs = 15_000) {
  let response;
  try {
    response = await fetchImpl(url, { ...options, redirect: "error", signal: AbortSignal.timeout(timeoutMs) });
  } catch (cause) {
    if (options.method === "POST") {
      const error = new Error("Worker dispatch transport failed after submission; outcome is uncertain and requires reconciliation", { cause });
      error.code = "WORKER_DISPATCH_OUTCOME_UNCERTAIN";
      error.retryable = false;
      throw error;
    }
    throw cause;
  }
  let payload;
  try { payload = await response.json(); }
  catch (cause) {
    const error = new Error("Dashboard worker API returned a non-JSON response (HTTP " + response.status + ")", { cause });
    if (options.method === "POST") {
      error.message = "Worker dispatch returned an unreadable response (HTTP " + response.status + "); outcome is uncertain and requires reconciliation";
      error.code = "WORKER_DISPATCH_OUTCOME_UNCERTAIN";
      error.retryable = false;
    }
    throw error;
  }
  if (!response.ok && response.status !== 409) {
    const uncertainDispatch = options.method === "POST" && (response.status === 408 || response.status >= 500);
    const error = new Error(uncertainDispatch
      ? "Worker dispatch returned HTTP " + response.status + "; outcome is uncertain and requires reconciliation"
      : "Dashboard worker API request failed with HTTP " + response.status + ": " + String(payload.error ?? "request failed").slice(0, 300));
    error.code = uncertainDispatch ? "WORKER_DISPATCH_OUTCOME_UNCERTAIN" : "WORKER_API_HTTP_" + response.status;
    error.status = response.status;
    error.retryable = !uncertainDispatch && (response.status === 408 || response.status === 429 || response.status >= 500);
    if (response.status === 429) {
      error.retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
    }
    throw error;
  }
  return { status: response.status, payload };
}

export async function runWorkerCycle({ baseUrl = DEFAULT_API_URL, token, workerId, fetchImpl = fetch, limit = 20, cooldowns = new Map(), uncertainDispatches = new Map(), onCooldownsChanged = () => {}, onUncertainDispatchesChanged = () => {}, shouldStop = () => false }) {
  const origin = validateConfiguration({ baseUrl, token, workerId, pollIntervalMs: DEFAULT_POLL_INTERVAL_MS });
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("worker dispatch limit must be an integer from 1 to 100");
  const headers = { "x-worker-token": token, "x-worker-id": workerId };
  const listing = await requestJson(fetchImpl, origin + "/api/jobs/dispatchable?limit=" + limit, { headers });
  if (listing.status !== 200 || !Array.isArray(listing.payload.jobs)) {
    throw new Error("Dashboard worker API returned an invalid dispatchable-job response");
  }
  const eligibleJobs = listing.payload.jobs.filter(job => {
    if (uncertainDispatches.has(job?.id)) return false;
    const cooldown = cooldowns.get(job?.id);
    return !cooldown || cooldown.nextAttemptAt <= Date.now();
  });
  const deferredByUncertainOutcome = listing.payload.jobs.filter(job => uncertainDispatches.has(job?.id)).length;
  const deferredByBackoff = listing.payload.jobs.length - eligibleJobs.length - deferredByUncertainOutcome;
  const results = [];
  let stoppedBeforeDispatch = false;
  for (const job of eligibleJobs) {
    if (shouldStop()) {
      stoppedBeforeDispatch = true;
      break;
    }
    if (!job || typeof job.id !== "string" || !job.id.trim()) throw new Error("Dashboard worker API returned a job without a valid identifier");
    let dispatched;
    try {
      dispatched = await requestJson(fetchImpl, origin + "/api/jobs/produce", {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ jobId: job.id })
      }, 15 * 60_000);
    } catch (error) {
      if (error?.code === "WORKER_DISPATCH_OUTCOME_UNCERTAIN") {
        uncertainDispatches.set(job.id, {
          code: "WORKER_DISPATCH_OUTCOME_UNCERTAIN",
          recordedAt: new Date().toISOString()
        });
        onUncertainDispatchesChanged(uncertainDispatches);
        throw error;
      }
      if (error?.status !== 429 || error.retryable !== true) throw error;
      const attempts = Math.min(20, (cooldowns.get(job.id)?.attempts ?? 0) + 1);
      const fallbackDelayMs = Math.min(15 * 60_000, 30_000 * (2 ** Math.max(0, attempts - 1)));
      const delayMs = Math.max(error.retryAfterMs ?? 0, fallbackDelayMs);
      cooldowns.set(job.id, { attempts, nextAttemptAt: Date.now() + delayMs });
      onCooldownsChanged(cooldowns);
      results.push({ jobId: job.id, status: "NOT_DISPATCHED", httpStatus: 429, state: null, retryAfterMs: delayMs });
      continue;
    }
    if (dispatched.status === 200) {
      cooldowns.delete(job.id);
      onCooldownsChanged(cooldowns);
    } else {
      const attempts = Math.min(20, (cooldowns.get(job.id)?.attempts ?? 0) + 1);
      const delayMs = Math.min(15 * 60_000, 30_000 * (2 ** Math.max(0, attempts - 1)));
      cooldowns.set(job.id, { attempts, nextAttemptAt: Date.now() + delayMs });
      onCooldownsChanged(cooldowns);
    }
    results.push({
      jobId: job.id,
      status: dispatched.status === 200 ? "SUCCEEDED" : "NOT_DISPATCHED",
      httpStatus: dispatched.status,
      state: dispatched.payload.job?.state ?? null,
      ...(dispatched.status === 409 ? { retryAfterMs: Math.min(15 * 60_000, 30_000 * (2 ** Math.max(0, (cooldowns.get(job.id)?.attempts ?? 1) - 1))) } : {})
    });
  }
  return {
    workerId,
    discovered: listing.payload.jobs.length,
    queuedCount: Number.isInteger(listing.payload.queuedCount) ? listing.payload.queuedCount : listing.payload.jobs.length,
    queuedWithoutApprovedAuthoring: Number.isInteger(listing.payload.queuedWithoutApprovedAuthoring) ? listing.payload.queuedWithoutApprovedAuthoring : 0,
    queuedWithoutApprovedRenderPlan: Number.isInteger(listing.payload.queuedWithoutApprovedRenderPlan) ? listing.payload.queuedWithoutApprovedRenderPlan : 0,
    deferredByBackoff,
    deferredByUncertainOutcome,
    results,
    stoppedBeforeDispatch,
    undispatchedAfterStop: stoppedBeforeDispatch ? eligibleJobs.length - results.length : 0,
    publishingEnabled: false
  };
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitForNextCycle(milliseconds, shouldStop) {
  const deadline = Date.now() + milliseconds;
  while (!shouldStop()) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return;
    await delay(Math.min(250, remaining));
  }
}

export async function runWorker({
  baseUrl = process.env.DASHBOARD_API_URL ?? DEFAULT_API_URL,
  token = process.env.DASHBOARD_WORKER_TOKEN,
  workerId = process.env.DASHBOARD_WORKER_ID ?? "sonicvhibez-render-worker",
  pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? DEFAULT_POLL_INTERVAL_MS),
  once = process.argv.includes("--once"),
  onCycle = result => console.log(JSON.stringify({ event: "worker_cycle_completed", ...result })),
  onError = error => console.error(JSON.stringify({ event: "worker_cycle_failed", message: String(error?.message ?? error).slice(0, 500) })),
  shouldStop = () => false,
  cooldownStatePath: configuredCooldownStatePath = process.env.WORKER_BACKOFF_STATE_PATH,
  stateDirectory = process.env.WORKER_STATE_DIR ?? "run-logs",
  fetchImpl = fetch
} = {}) {
  validateConfiguration({ baseUrl, token, workerId, pollIntervalMs });
  const statePath = cooldownStatePath(workerId, configuredCooldownStatePath, stateDirectory);
  const lockPath = statePath + ".process.lock";
  let lockFd;
  try {
    lockFd = fs.openSync(lockPath, "wx", 0o600);
    fs.writeFileSync(lockFd, JSON.stringify({ pid: process.pid, workerId, startedAt: new Date().toISOString() }));
    if (fs.existsSync(statePath + ".release.lock")) {
      throw new Error("A quarantine release is in progress or requires operator inspection; worker startup is blocked");
    }
  } catch (error) {
    if (lockFd !== undefined) {
      fs.closeSync(lockFd);
      try { fs.unlinkSync(lockPath); } catch (cleanupError) {
        if (cleanupError?.code !== "ENOENT") throw cleanupError;
      }
    }
    throw new Error("Worker state is already locked or a quarantine release is in progress; inspect the state locks before continuing", { cause: error });
  }
  try {
    const persistedState = loadCooldowns(statePath, workerId);
    const cooldowns = persistedState.cooldowns;
    const uncertainDispatches = persistedState.uncertainDispatches;
    const consumedReleaseNonces = persistedState.consumedReleaseNonces;
    const persist = () => {
      try {
        persistCooldowns(statePath, workerId, cooldowns, uncertainDispatches, consumedReleaseNonces);
      } catch (cause) {
        const error = new Error("Worker retry backoff could not be persisted; stopping to avoid an early redispatch", { cause });
        error.code = "WORKER_BACKOFF_PERSISTENCE_FAILED";
        throw error;
      }
    };
    do {
      let nextWaitMs = pollIntervalMs;
      try {
        const result = await runWorkerCycle({ baseUrl, token, workerId, fetchImpl, cooldowns, uncertainDispatches, onCooldownsChanged: persist, onUncertainDispatchesChanged: persist, shouldStop });
        onCycle(result);
      } catch (error) {
        onError(error);
        if (error?.status === 429 && error?.retryable === true) {
          nextWaitMs = Math.max(pollIntervalMs, error.retryAfterMs ?? 0);
        }
        if (once || error?.code === "WORKER_BACKOFF_PERSISTENCE_FAILED" || error?.retryable === false) throw error;
      }
      if (once || shouldStop()) break;
      await waitForNextCycle(nextWaitMs, shouldStop);
    } while (!shouldStop());
  } finally {
    try { fs.closeSync(lockFd); } catch {}
    try { fs.unlinkSync(lockPath); } catch {}
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--inspect-uncertain")) {
    try {
      console.log(JSON.stringify(inspectWorkerState()));
    } catch (error) {
      console.error("BLOCKED: " + String(error?.message ?? error));
      process.exitCode = 2;
    }
  } else if (process.argv.includes("--consume-quarantine-release")) {
    try {
      const args = process.argv.slice(2);
      const value = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
      const receiptPath = value("--receipt-file");
      if (!receiptPath) throw new Error("--receipt-file is required for signed quarantine release consumption");
      const resolvedReceiptPath = path.resolve(receiptPath);
      let receiptFd;
      let receiptText;
      try {
        // O_NOFOLLOW closes the lstat/read symlink-swap window for the signed handoff file.
        receiptFd = fs.openSync(resolvedReceiptPath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
        const receiptStat = fs.fstatSync(receiptFd);
        if (!receiptStat.isFile() || receiptStat.size > 64 * 1024) {
          throw new Error("Quarantine release receipt must be a regular file no larger than 64 KiB");
        }
        receiptText = fs.readFileSync(receiptFd, "utf8");
      } finally {
        if (receiptFd !== undefined) fs.closeSync(receiptFd);
      }
      const receipt = JSON.parse(receiptText);
      const local = inspectWorkerState();
      if (typeof receipt?.jobId !== "string" ||
          !local.uncertainDispatches.some(record => record.jobId === receipt.jobId)) {
        throw new Error("Signed receipt does not identify a job currently quarantined by this worker");
      }
      const statePath = cooldownStatePath(
        local.workerId,
        process.env.WORKER_BACKOFF_STATE_PATH,
        process.env.WORKER_STATE_DIR ?? "run-logs"
      );
      assertWorkerStoppedForQuarantineRelease(statePath);
      const publicKeyPem = process.env.DASHBOARD_QUARANTINE_SIGNING_PUBLIC_KEY;
      if (!publicKeyPem?.trim()) {
        throw new Error("DASHBOARD_QUARANTINE_SIGNING_PUBLIC_KEY is required; workers receive only the dashboard verification public key");
      }
      const release = applyWorkerQuarantineRelease({
        statePath, workerId: local.workerId, jobId: receipt.jobId,
        attemptId: receipt.attemptId, artifactSha256: receipt.artifactSha256,
        receipt, publicKeyPem
      });
      console.log(JSON.stringify({ workerId: local.workerId, quarantineRelease: release, publishingEnabled: false }));
    } catch (error) {
      console.error("BLOCKED: " + String(error?.message ?? error));
      process.exitCode = 2;
    }
  } else if (process.argv.includes("--reconcile-uncertain")) {
    try {
      const args = process.argv.slice(2);
      const value = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
      const jobId = value("--job-id");
      if (!jobId) throw new Error("--job-id is required for a single-job reconciliation");
      const local = inspectWorkerState();
      if (!local.uncertainDispatches.some(record => record.jobId === jobId)) throw new Error("The exact job is not present in this worker's uncertain-dispatch quarantine");
      const statePath = cooldownStatePath(
        local.workerId,
        process.env.WORKER_BACKOFF_STATE_PATH,
        process.env.WORKER_STATE_DIR ?? "run-logs"
      );
      assertWorkerStoppedForQuarantineRelease(statePath);
      const metadataPath = value("--metadata");
      const videoPath = value("--video");
      const approvalPath = value("--approval");
      const report = await reconcileDashboardUpload({ jobId, metadataPath, videoPath, approvalPath });
      if (report.verified) {
        const operatorToken = process.env.DASHBOARD_OPERATOR_TOKEN;
        const releaseToken = process.env.DASHBOARD_QUARANTINE_RELEASE_TOKEN;
        const verificationPublicKey = process.env.DASHBOARD_QUARANTINE_SIGNING_PUBLIC_KEY;
        if (!releaseToken || releaseToken.length < 24) {
          throw new Error("DASHBOARD_QUARANTINE_RELEASE_TOKEN is an operator-only credential; configure it only on the authorized reconciliation host");
        }
        if (!verificationPublicKey?.trim()) {
          throw new Error("DASHBOARD_QUARANTINE_SIGNING_PUBLIC_KEY is required; the dashboard private signing key must never be installed on the worker");
        }
        const videoSha256 = crypto.createHash("sha256").update(fs.readFileSync(path.resolve(videoPath))).digest("hex");
        const exactAttempts = report.dashboardCorrelation.uploadAttempts.filter(item => item.artifactSha256 === videoSha256);
        if (exactAttempts.length !== 1 || !exactAttempts[0].attemptId) {
          throw new Error("Dashboard correlation does not identify exactly one attempt for the reconciled artifact; quarantine remains");
        }
        const baseUrl = process.env.DASHBOARD_API_URL ?? DEFAULT_API_URL;
        const parsed = new URL(baseUrl);
        const response = await fetch(new URL("/api/worker/quarantine-release", parsed.origin), {
          method: "POST",
          headers: { "x-operator-token": operatorToken, "x-quarantine-release-token": releaseToken, "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ workerId: local.workerId, jobId }),
          redirect: "error", signal: AbortSignal.timeout(15_000)
        });
        let payload;
        try { payload = await response.json(); }
        catch (cause) { throw new Error("Signed quarantine release endpoint returned unreadable JSON; quarantine remains", { cause }); }
        if (!response.ok || !payload?.receipt || payload.publishingEnabled !== false) {
          throw new Error("Dashboard did not issue a signed quarantine release receipt; quarantine remains");
        }
        const release = applyWorkerQuarantineRelease({
          statePath, workerId: local.workerId, jobId,
          attemptId: exactAttempts[0].attemptId, artifactSha256: videoSha256,
          receipt: payload.receipt, publicKeyPem: verificationPublicKey
        });
        report.quarantineReleased = release.released;
        report.quarantineRelease = release;
      }
      console.log(JSON.stringify({ workerId: local.workerId, report }));
      if (!report.verified || !report.quarantineReleased) process.exitCode = 2;
    } catch (error) {
      console.error("BLOCKED: " + String(error?.message ?? error));
      process.exitCode = 2;
    }
  } else {
    let stopping = false;
    for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { stopping = true; });
    runWorker({ shouldStop: () => stopping }).catch(error => {
      console.error("BLOCKED: " + String(error?.message ?? error));
      process.exitCode = 2;
    });
  }
}
