#!/usr/bin/env node
import { createCloudflareAccessHeaders } from "./cloudflare-access-headers.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
/**
 * Read-only authenticated smoke test for the deployed SonicVhibez staging Worker.
 * It never writes dashboard state, claims jobs, creates runner sessions, or publishes.
 */
const base = process.env.DASHBOARD_STAGING_API_URL;
const token = process.env.DASHBOARD_OPERATOR_TOKEN;
const accessClientId = process.env.CLOUDFLARE_ACCESS_CLIENT_ID;
const accessClientSecret = process.env.CLOUDFLARE_ACCESS_CLIENT_SECRET;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(typeof base === "string" && base.length > 0, "DASHBOARD_STAGING_API_URL is required");
assert(typeof token === "string" && token.length >= 24, "DASHBOARD_OPERATOR_TOKEN secret is required");
assert(typeof accessClientId === "string" && accessClientId.length > 0,
  "CLOUDFLARE_ACCESS_CLIENT_ID secret is required");
assert(typeof accessClientSecret === "string" && accessClientSecret.length > 0,
  "CLOUDFLARE_ACCESS_CLIENT_SECRET secret is required");

const parsed = new URL(base);
assert(parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.search && !parsed.hash,
  "Staging Worker URL must be a clean HTTPS origin");
assert(parsed.hostname.endsWith(".workers.dev"), "Refusing to test a non-workers.dev host");

async function get(path, headers = {}) {
  const response = await fetch(new URL(path, parsed.origin), {
    method: "GET",
    headers: createCloudflareAccessHeaders(accessClientId, accessClientSecret, headers),
    redirect: "error",
    signal: AbortSignal.timeout(15_000)
  });
  let body;
  try { body = await response.json(); }
  catch { throw new Error(path + " returned non-JSON HTTP " + response.status); }
  return { status: response.status, body, etag: response.headers.get("etag") };
}

const health = await get("/healthz");
assert(health.status === 200 && health.body?.status === "ok",
  "Public Worker health check failed");

const unauthenticated = await get("/api/state");
assert(unauthenticated.status === 401,
  "Unauthenticated /api/state must return HTTP 401; received " + unauthenticated.status);

const authenticated = await get("/api/state", { "x-operator-token": token });
assert(authenticated.status === 200,
  "Authenticated /api/state must return HTTP 200; received " + authenticated.status);
const payload = authenticated.body;
const state = payload?.state && typeof payload.state === "object" ? payload.state : payload;
assert(Number.isSafeInteger(Number(payload?.revision)) && Number(payload.revision) >= 1,
  "Authenticated state response is missing a valid durable revision");
const etagRevisionMatch = String(authenticated.etag ?? "").match(/^(?:W\\/)?"?([1-9][0-9]*)"?$/);
assert(etagRevisionMatch && Number(etagRevisionMatch[1]) === Number(payload.revision),
  "Authenticated Worker state ETag does not match its revision: etag=" + String(authenticated.etag ?? "missing") + ", revision=" + Number(payload.revision));
for (const key of ["queueItems", "audit", "jobs", "uploads"]) {
  assert(Array.isArray(state?.[key]), "Authenticated state response is missing array: " + key);
}
assert(state.publishingEnabled !== true && state.publicPublishingEnabled !== true &&
  state.unattendedPublishingEnabled !== true && payload.publishingEnabled !== true,
  "Staging state unexpectedly reports publishing enabled");

const backupList = await get("/api/backups", { "x-operator-token": token });
if (backupList.status !== 200 || !Array.isArray(backupList.body?.backups)) {
  const errorCode = typeof backupList.body?.code === "string" ? backupList.body.code : "none";
  const errorMessage = typeof backupList.body?.error === "string" ? backupList.body.error.slice(0, 240) : "none";
  throw new Error("Authenticated backup listing failed: HTTP " + backupList.status +
    "; code=" + errorCode + "; error=" + errorMessage +
    "; responseKeys=" + Object.keys(backupList.body ?? {}).sort().join(","));
}
assert(backupList.body.backups.length >= 1,
  "Staging must retain at least one verified backup before state-route acceptance");
for (const backup of backupList.body.backups) {
  assert(typeof backup.backup_id === "string" && backup.backup_id.length > 0,
    "Backup listing contains an invalid backup ID");
  assert(Number.isSafeInteger(Number(backup.source_revision)) && Number(backup.source_revision) >= 1,
    "Backup listing contains an invalid source revision");
  assert(/^[a-f0-9]{64}$/.test(backup.sha256 ?? ""),
    "Backup listing contains an invalid SHA-256 digest");
  assert(typeof backup.created_at === "string" && Number.isFinite(Date.parse(backup.created_at)),
    "Backup listing contains an invalid creation timestamp");
  assert(!Object.hasOwn(backup, "state_json"),
    "Backup listing must not expose the persisted state snapshot");
}

const runnerStatusUnauthenticated = await get("/api/runner/session/status");
assert(runnerStatusUnauthenticated.status === 401,
  "Unauthenticated runner session status must return HTTP 401; received " + runnerStatusUnauthenticated.status);
const runnerStatusAuthenticated = await get("/api/runner/session/status", { "x-operator-token": token });
assert(runnerStatusAuthenticated.status === 200 && typeof runnerStatusAuthenticated.body?.active === "boolean",
  "Authenticated runner session status failed; received HTTP " + runnerStatusAuthenticated.status);

// Start the real Node dashboard against the staging Worker with a fresh temporary
// local directory. Refuse to start if startup recovery could mutate remote state.
assert(state.jobs.length === 0, "Staging contains content jobs; refusing to run startup recovery smoke");
assert(!(state.facebookAttempts ?? []).some(item => ["SUBMITTING", "REMOTE_SCHEDULED_UNVERIFIED"].includes(item.status)),
  "Staging contains an uncertain Meta attempt; refusing to run startup recovery smoke");
assert(!(state.campaigns ?? []).some(item => item.type === "safari_affiliate" &&
  (item.status !== "INACTIVE" || item.destinationUrl !== "" || item.ownerApproved !== false ||
   item.destinationValidation !== "not_verified" || item.disclosureText !== "" ||
   ["pendingDestinationUrl", "pendingDisclosureText", "pendingDestinationVersion", "approval"].some(key => Object.hasOwn(item, key)))),
  "Staging contains a non-compliant Safari campaign; refusing to run startup recovery smoke");

function startLocalDashboard(stateDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DASHBOARD_HOST: "127.0.0.1",
        PORT: "0",
        DASHBOARD_STATE_DIR: stateDir,
        DASHBOARD_OPERATOR_TOKEN: token,
        DASHBOARD_OPERATOR_ID: "staging-smoke-operator",
        DASHBOARD_STATE_API_URL: parsed.origin,
        DASHBOARD_STATE_OPERATOR_TOKEN: token,
        DASHBOARD_STATE_ACCESS_CLIENT_ID: accessClientId,
        DASHBOARD_STATE_ACCESS_CLIENT_SECRET: accessClientSecret
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let pending = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error("Node dashboard did not become ready within 15 seconds"));
    }, 15_000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => {
      pending += chunk;
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.includes('"event":"dashboard_started"')) continue;
        try {
          const started = JSON.parse(line);
          if (!Number.isInteger(started.port) || started.port < 1 || started.port > 65535) {
            throw new Error("Node dashboard returned an invalid loopback port");
          }
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          resolve({ child, port: started.port });
        } catch (error) {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          child.kill("SIGTERM");
          reject(error);
        }
      }
    });
    child.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(-2000); });
    child.once("exit", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error("Node dashboard exited before readiness (code=" + code + ", signal=" + signal +
        "); diagnostic=" + stderr.replace(/\s+/g, " ").slice(-500)));
    });
    child.once("error", error => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error("Node dashboard could not start: " + error.message));
    });
  });
}

async function stopLocalDashboard(child) {
  if (!child || child.exitCode !== null) return;
  await new Promise(resolve => {
    let done = false;
    let timer;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    child.once("exit", finish);
    child.kill("SIGTERM");
    timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish();
    }, 8_000);
  });
}

async function getLocal(localBase, pathname, authenticated = true) {
  const response = await fetch(new URL(pathname, localBase), {
    method: "GET",
    headers: authenticated ? { "x-operator-token": token } : {},
    redirect: "error",
    signal: AbortSignal.timeout(15_000)
  });
  let body;
  try { body = await response.json(); }
  catch { throw new Error("Local dashboard " + pathname + " returned non-JSON HTTP " + response.status); }
  return { status: response.status, body };
}

const stateBeforeNode = JSON.stringify({ revision: payload.revision, updatedAt: payload.updatedAt, state });
const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-staging-node-smoke-"));
let localDashboard;
let nodeDashboardChecks = null;
try {
  localDashboard = await startLocalDashboard(stateDir);
  const localBase = "http://127.0.0.1:" + localDashboard.port;
  const localUnauthenticated = await getLocal(localBase, "/api/state", false);
  assert(localUnauthenticated.status === 401,
    "Local Node dashboard must reject unauthenticated state reads; received HTTP " + localUnauthenticated.status);
  const localState = await getLocal(localBase, "/api/state");
  assert(localState.status === 200 && Array.isArray(localState.body?.queueItems) &&
    Array.isArray(localState.body?.jobs) && Array.isArray(localState.body?.audit) &&
    localState.body?.publishingEnabled === false,
    "Local Node dashboard could not read authenticated Cloudflare-backed state");
  const localBackups = await getLocal(localBase, "/api/state/backups");
  assert(localBackups.status === 200 && Array.isArray(localBackups.body?.backups) &&
    Number(localBackups.body?.revision) === Number(payload.revision),
    "Local Node dashboard could not read the Cloudflare-backed backup inventory");
  assert(localBackups.body.backups.length >= 1,
    "Local Node dashboard did not receive the retained staging backup");
  nodeDashboardChecks = {
    unauthenticatedStateRejected: "PASS",
    authenticatedCloudflareStateRead: "PASS",
    authenticatedCloudflareBackupList: "PASS",
    durableRevision: Number(localBackups.body.revision),
    retainedBackupCount: localBackups.body.backups.length,
    publishingDisabled: "PASS"
  };
} finally {
  if (localDashboard) await stopLocalDashboard(localDashboard.child);
  fs.rmSync(stateDir, { recursive: true, force: true });
}
const stateAfterNode = await get("/api/state", { "x-operator-token": token });
assert(stateAfterNode.status === 200 &&
  JSON.stringify({ revision: stateAfterNode.body.revision, updatedAt: stateAfterNode.body.updatedAt, state: stateAfterNode.body.state }) === stateBeforeNode,
  "Read-only Node dashboard smoke unexpectedly changed remote Cloudflare state");

console.log(JSON.stringify({
  result: "PASS",
  target: parsed.origin,
  checks: {
    cloudflareAccessServiceToken: "PASS",
    publicHealth: "PASS",
    unauthenticatedStateRejected: "PASS",
    authenticatedStateRead: "PASS",
    durableRevision: Number(payload.revision),
    requiredStateCollections: "PASS",
    backupListing: "PASS",
    retainedBackupCount: backupList.body.backups.length,
    publishingDisabled: "PASS",
    unauthenticatedRunnerStatusRejected: "PASS",
    authenticatedRunnerStatusRead: "PASS",
    nodeDashboardCloudflareIntegration: nodeDashboardChecks,
    remoteStateUnchanged: "PASS"
  },
  runnerSessionActive: runnerStatusAuthenticated.body.active,
  publishingEnabled: false,
  writesPerformed: false
}, null, 2));
