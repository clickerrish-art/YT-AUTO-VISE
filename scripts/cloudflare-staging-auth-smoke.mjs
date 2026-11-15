#!/usr/bin/env node
import { createCloudflareAccessHeaders } from "./cloudflare-access-headers.mjs";
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
  return { status: response.status, body };
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
    authenticatedRunnerStatusRead: "PASS"
  },
  runnerSessionActive: runnerStatusAuthenticated.body.active,
  publishingEnabled: false,
  writesPerformed: false
}, null, 2));
