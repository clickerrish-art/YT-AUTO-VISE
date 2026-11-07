#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { atomicWriteJson } from "./atomic-json-file.mjs";
import { ensureSafeDirectoryPath } from "./safe-directory-path.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workerId = process.env.DASHBOARD_WORKER_ID ?? "sonicvhibez-render-worker";
const baseUrl = process.env.DASHBOARD_API_URL ?? "https://sonicvhibez-durable-state-staging.kajiboye44.workers.dev";
const token = process.env.DASHBOARD_WORKER_TOKEN;
const stateDir = path.resolve(process.env.DASHBOARD_STATE_DIR ?? path.join(root, "state"));
const stateFile = path.join(stateDir, "dashboard-state.json");
const snapshotMetaFile = path.join(stateDir, ".cloudflare-runner-snapshot.json");
const backoffDir = ensureSafeDirectoryPath(path.resolve(process.env.WORKER_STATE_DIR ?? path.join(root, "run-logs")), "Worker state directory");
const workerHash = crypto.createHash("sha256").update(workerId).digest("hex").slice(0, 20);
const backoffFile = path.join(backoffDir, "worker-backoff-" + workerHash + ".json");
const backoffMetaFile = path.join(backoffDir, "worker-backoff-" + workerHash + ".revision.json");

function configuration() {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("DASHBOARD_API_URL must be an HTTPS origin without credentials, path, query or fragment");
  }
  if (typeof token !== "string" || token.length < 24) throw new Error("DASHBOARD_WORKER_TOKEN must be configured with at least 24 characters");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(workerId)) throw new Error("DASHBOARD_WORKER_ID is invalid");
  return parsed.origin;
}

async function requestJson(route, options = {}) {
  const origin = configuration();
  const response = await fetch(origin + route, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-worker-token": token,
      "x-worker-id": workerId,
      ...options.headers
    },
    redirect: "error",
    signal: AbortSignal.timeout(30_000)
  });
  let payload;
  try { payload = await response.json(); }
  catch (cause) { throw new Error("Cloudflare runner API returned unreadable JSON (HTTP " + response.status + ")", { cause }); }
  if (!response.ok) {
    const error = new Error(payload?.error ?? "Cloudflare runner API failed with HTTP " + response.status);
    error.status = response.status;
    error.code = payload?.code;
    throw error;
  }
  return payload;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJsonFile(filePath) {
  const stat = fs.lstatSync(filePath);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Refusing unsafe runner state file: " + filePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function pullSnapshot() {
  ensureSafeDirectoryPath(stateDir, "Dashboard state directory");
  const payload = await requestJson("/api/runner/snapshot");
  if (!Number.isSafeInteger(payload.revision) || payload.revision < 1 ||
      !payload.state || payload.state.version !== 1 || payload.state.publishingEnabled === true) {
    throw new Error("Cloudflare returned an invalid or unsafe dashboard snapshot");
  }
  atomicWriteJson(stateFile, payload.state, { mode: 0o600 });
  atomicWriteJson(snapshotMetaFile, {
    schemaVersion: 1,
    revision: payload.revision,
    updatedAt: payload.updatedAt,
    stateSha256: sha256(JSON.stringify(payload.state))
  }, { mode: 0o600 });
  console.log(JSON.stringify({ event: "cloudflare_snapshot_pulled", revision: payload.revision, stateSha256: sha256(JSON.stringify(payload.state)), publishingEnabled: false }));
}

async function pushSnapshot() {
  const meta = readJsonFile(snapshotMetaFile);
  const state = readJsonFile(stateFile);
  if (meta.schemaVersion !== 1 || !Number.isSafeInteger(meta.revision) || meta.revision < 1 ||
      sha256(JSON.stringify(state)) === "" || state.version !== 1 || state.publishingEnabled === true) {
    throw new Error("Local runner snapshot metadata or state is invalid");
  }
  const payload = await requestJson("/api/runner/snapshot", {
    method: "PUT",
    headers: { "if-match": '"' + meta.revision + '"' },
    body: JSON.stringify({ state })
  });
  console.log(JSON.stringify({ event: "cloudflare_snapshot_committed", previousRevision: meta.revision, revision: payload.revision, publishingEnabled: false }));
}

async function pullBackoff() {
  const payload = await requestJson("/api/runner/backoff?workerId=" + encodeURIComponent(workerId));
  if (payload.workerId !== workerId || !Number.isSafeInteger(payload.revision) || payload.revision < 0) {
    throw new Error("Cloudflare returned invalid worker backoff metadata");
  }
  const state = payload.state ?? {
    schemaVersion: 1, workerId, updatedAt: new Date(0).toISOString(),
    cooldowns: {}, uncertainDispatches: {}, consumedReleaseNonces: []
  };
  if (state.schemaVersion !== 1 || state.workerId !== workerId || !state.cooldowns || !state.uncertainDispatches || !Array.isArray(state.consumedReleaseNonces)) {
    throw new Error("Cloudflare worker backoff record is invalid");
  }
  atomicWriteJson(backoffFile, state, { mode: 0o600 });
  atomicWriteJson(backoffMetaFile, { schemaVersion: 1, workerId, revision: payload.revision }, { mode: 0o600 });
  console.log(JSON.stringify({ event: "cloudflare_backoff_pulled", workerId, revision: payload.revision, quarantinedJobs: Object.keys(state.uncertainDispatches).length }));
}

async function pushBackoff() {
  const meta = readJsonFile(backoffMetaFile);
  const state = readJsonFile(backoffFile);
  if (meta.schemaVersion !== 1 || meta.workerId !== workerId || !Number.isSafeInteger(meta.revision) || meta.revision < 0) {
    throw new Error("Local runner backoff revision metadata is invalid");
  }
  const payload = await requestJson("/api/runner/backoff", {
    method: "PUT",
    body: JSON.stringify({ workerId, expectedRevision: meta.revision, state })
  });
  atomicWriteJson(backoffMetaFile, { schemaVersion: 1, workerId, revision: payload.revision }, { mode: 0o600 });
  console.log(JSON.stringify({ event: "cloudflare_backoff_committed", workerId, revision: payload.revision, quarantinedJobs: Object.keys(state.uncertainDispatches ?? {}).length }));
}

const command = process.argv[2];
try {
  if (command === "pull-snapshot") await pullSnapshot();
  else if (command === "push-snapshot") await pushSnapshot();
  else if (command === "pull-backoff") await pullBackoff();
  else if (command === "push-backoff") await pushBackoff();
  else throw new Error("Usage: node scripts/cloudflare-runner-bridge.mjs <pull-snapshot|push-snapshot|pull-backoff|push-backoff>");
} catch (error) {
  console.error("BLOCKED: " + String(error?.message ?? error).slice(0, 1000));
  process.exitCode = 2;
}
