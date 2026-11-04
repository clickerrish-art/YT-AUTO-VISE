#!/usr/bin/env node
import { pathToFileURL } from "node:url";
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
    if (error?.code === "ENOENT") return new Map();
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
  return cooldowns;
}

function persistCooldowns(statePath, workerId, cooldowns) {
  const records = Object.fromEntries([...cooldowns.entries()].map(([jobId, value]) => [jobId, {
    attempts: value.attempts,
    nextAttemptAt: value.nextAttemptAt
  }]));
  atomicWriteJson(statePath, {
    schemaVersion: COOLDOWN_SCHEMA_VERSION,
    workerId,
    updatedAt: new Date().toISOString(),
    cooldowns: records
  }, { mode: 0o600 });
}

function validateConfiguration({ baseUrl, token, workerId, pollIntervalMs }) {
  let parsed;
  try { parsed = new URL(baseUrl); }
  catch { throw new Error("DASHBOARD_API_URL must be a valid absolute URL"); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("DASHBOARD_API_URL must be an HTTP(S) origin without embedded credentials, query or fragment");
  }
  if (parsed.protocol === "http:" && !["127.0.0.1", "::1", "localhost"].includes(parsed.hostname)) {
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
    response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
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
    if (options.method === "POST" && response.status >= 500) {
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
    throw error;
  }
  return { status: response.status, payload };
}

export async function runWorkerCycle({ baseUrl = DEFAULT_API_URL, token, workerId, fetchImpl = fetch, limit = 20, cooldowns = new Map(), onCooldownsChanged = () => {}, shouldStop = () => false }) {
  const origin = validateConfiguration({ baseUrl, token, workerId, pollIntervalMs: DEFAULT_POLL_INTERVAL_MS });
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("worker dispatch limit must be an integer from 1 to 100");
  const headers = { "x-worker-token": token, "x-worker-id": workerId };
  const listing = await requestJson(fetchImpl, origin + "/api/jobs/dispatchable?limit=" + limit, { headers });
  if (listing.status !== 200 || !Array.isArray(listing.payload.jobs)) {
    throw new Error("Dashboard worker API returned an invalid dispatchable-job response");
  }
  const eligibleJobs = listing.payload.jobs.filter(job => {
    const cooldown = cooldowns.get(job?.id);
    return !cooldown || cooldown.nextAttemptAt <= Date.now();
  });
  const deferredByBackoff = listing.payload.jobs.length - eligibleJobs.length;
  const results = [];
  let stoppedBeforeDispatch = false;
  for (const job of eligibleJobs) {
    if (shouldStop()) {
      stoppedBeforeDispatch = true;
      break;
    }
    if (!job || typeof job.id !== "string" || !job.id.trim()) throw new Error("Dashboard worker API returned a job without a valid identifier");
    const dispatched = await requestJson(fetchImpl, origin + "/api/jobs/produce", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ jobId: job.id })
    }, 15 * 60_000);
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
  const cooldowns = loadCooldowns(statePath, workerId);
  const persist = () => {
    try {
      persistCooldowns(statePath, workerId, cooldowns);
    } catch (cause) {
      const error = new Error("Worker retry backoff could not be persisted; stopping to avoid an early redispatch", { cause });
      error.code = "WORKER_BACKOFF_PERSISTENCE_FAILED";
      throw error;
    }
  };
  do {
    try {
      const result = await runWorkerCycle({ baseUrl, token, workerId, fetchImpl, cooldowns, onCooldownsChanged: persist, shouldStop });
      onCycle(result);
    } catch (error) {
      onError(error);
      if (once || error?.code === "WORKER_BACKOFF_PERSISTENCE_FAILED" || error?.retryable === false) throw error;
    }
    if (once || shouldStop()) break;
    await waitForNextCycle(pollIntervalMs, shouldStop);
  } while (!shouldStop());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let stopping = false;
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { stopping = true; });
  runWorker({ shouldStop: () => stopping }).catch(error => {
    console.error("BLOCKED: " + String(error?.message ?? error));
    process.exitCode = 2;
  });
}
