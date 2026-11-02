#!/usr/bin/env node
import { pathToFileURL } from "node:url";

const DEFAULT_API_URL = "http://127.0.0.1:8787";
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const MIN_POLL_INTERVAL_MS = 1_000;
const MAX_POLL_INTERVAL_MS = 60_000;

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
  const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error("Dashboard worker API returned a non-JSON response (HTTP " + response.status + ")"); }
  if (!response.ok && response.status !== 409) {
    throw new Error("Dashboard worker API request failed with HTTP " + response.status + ": " + String(payload.error ?? "request failed").slice(0, 300));
  }
  return { status: response.status, payload };
}

export async function runWorkerCycle({ baseUrl = DEFAULT_API_URL, token, workerId, fetchImpl = fetch, limit = 20 }) {
  const origin = validateConfiguration({ baseUrl, token, workerId, pollIntervalMs: DEFAULT_POLL_INTERVAL_MS });
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("worker dispatch limit must be an integer from 1 to 100");
  const headers = { "x-worker-token": token, "x-worker-id": workerId };
  const listing = await requestJson(fetchImpl, origin + "/api/jobs/dispatchable?limit=" + limit, { headers });
  if (listing.status !== 200 || !Array.isArray(listing.payload.jobs)) {
    throw new Error("Dashboard worker API returned an invalid dispatchable-job response");
  }
  const results = [];
  for (const job of listing.payload.jobs) {
    if (!job || typeof job.id !== "string" || !job.id.trim()) throw new Error("Dashboard worker API returned a job without a valid identifier");
    const dispatched = await requestJson(fetchImpl, origin + "/api/jobs/produce", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ jobId: job.id })
    }, 15 * 60_000);
    results.push({
      jobId: job.id,
      status: dispatched.status === 200 ? "SUCCEEDED" : "NOT_DISPATCHED",
      httpStatus: dispatched.status,
      state: dispatched.payload.job?.state ?? null
    });
  }
  return {
    workerId,
    discovered: listing.payload.jobs.length,
    queuedCount: Number.isInteger(listing.payload.queuedCount) ? listing.payload.queuedCount : listing.payload.jobs.length,
    queuedWithoutApprovedAuthoring: Number.isInteger(listing.payload.queuedWithoutApprovedAuthoring) ? listing.payload.queuedWithoutApprovedAuthoring : 0,
    queuedWithoutApprovedRenderPlan: Number.isInteger(listing.payload.queuedWithoutApprovedRenderPlan) ? listing.payload.queuedWithoutApprovedRenderPlan : 0,
    results,
    publishingEnabled: false
  };
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export async function runWorker({
  baseUrl = process.env.DASHBOARD_API_URL ?? DEFAULT_API_URL,
  token = process.env.DASHBOARD_WORKER_TOKEN,
  workerId = process.env.DASHBOARD_WORKER_ID ?? "sonicvhibez-render-worker",
  pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? DEFAULT_POLL_INTERVAL_MS),
  once = process.argv.includes("--once"),
  onCycle = result => console.log(JSON.stringify({ event: "worker_cycle_completed", ...result })),
  onError = error => console.error(JSON.stringify({ event: "worker_cycle_failed", message: String(error?.message ?? error).slice(0, 500) })),
  shouldStop = () => false
} = {}) {
  validateConfiguration({ baseUrl, token, workerId, pollIntervalMs });
  do {
    try {
      const result = await runWorkerCycle({ baseUrl, token, workerId });
      onCycle(result);
    } catch (error) {
      onError(error);
      if (once) throw error;
    }
    if (once || shouldStop()) break;
    await delay(pollIntervalMs);
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
