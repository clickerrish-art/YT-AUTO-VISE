#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCloudflareAccessHeaders } from "./cloudflare-access-headers.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function revisionFromEtag(value) {
  const match = String(value ?? "").match(/^(?:W\/)?"?([1-9][0-9]*)"?$/);
  return match ? Number(match[1]) : null;
}
const base = process.env.DASHBOARD_STAGING_API_URL;
const token = process.env.DASHBOARD_OPERATOR_TOKEN;
const accessClientId = process.env.CLOUDFLARE_ACCESS_CLIENT_ID;
const accessClientSecret = process.env.CLOUDFLARE_ACCESS_CLIENT_SECRET;
assert(process.env.DASHBOARD_STAGING_BACKUP_RESTORE_CONFIRMATION === "YES",
  "One-time staging backup/restore confirmation is required");
assert(typeof base === "string" && base.length > 0, "DASHBOARD_STAGING_API_URL is required");
assert(typeof token === "string" && token.length >= 24, "DASHBOARD_OPERATOR_TOKEN is required");
assert(typeof accessClientId === "string" && accessClientId.length > 0, "CLOUDFLARE_ACCESS_CLIENT_ID is required");
assert(typeof accessClientSecret === "string" && accessClientSecret.length > 0, "CLOUDFLARE_ACCESS_CLIENT_SECRET is required");
const parsed = new URL(base);
assert(parsed.protocol === "https:" && parsed.hostname.endsWith(".workers.dev") &&
  !parsed.username && !parsed.password && !parsed.search && !parsed.hash,
  "Staging Worker URL must be a clean workers.dev HTTPS origin");

async function getWorker(pathname, authenticated = true) {
  const headers = authenticated ? { "x-operator-token": token } : {};
  const response = await fetch(new URL(pathname, parsed.origin), {
    method: "GET",
    headers: createCloudflareAccessHeaders(accessClientId, accessClientSecret, headers),
    redirect: "error",
    signal: AbortSignal.timeout(15_000)
  });
  let body;
  try { body = await response.json(); }
  catch { throw new Error("Worker " + pathname + " returned non-JSON HTTP " + response.status); }
  return { status: response.status, body, etag: response.headers.get("etag") };
}
function validateBackupList(backups) {
  assert(Array.isArray(backups), "Backup inventory must be an array");
  for (const backup of backups) {
    assert(typeof backup.backup_id === "string" && backup.backup_id.length > 0, "Backup ID is invalid");
    assert(Number.isSafeInteger(Number(backup.source_revision)) && Number(backup.source_revision) >= 1, "Backup source revision is invalid");
    assert(/^[a-f0-9]{64}$/.test(backup.sha256 ?? ""), "Backup SHA-256 is invalid");
    assert(typeof backup.created_at === "string" && Number.isFinite(Date.parse(backup.created_at)), "Backup timestamp is invalid");
    assert(typeof backup.reason === "string", "Backup reason is invalid");
    assert(!Object.hasOwn(backup, "state_json"), "Backup inventory must not expose state_json");
  }
}
function startDashboard(stateDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DASHBOARD_HOST: "127.0.0.1",
        PORT: "0",
        DASHBOARD_STATE_DIR: stateDir,
        DASHBOARD_OPERATOR_TOKEN: token,
        DASHBOARD_OPERATOR_ID: "staging-backup-restore-smoke",
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
            throw new Error("Node dashboard returned an invalid port");
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
async function stopDashboard(child) {
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
async function localRequest(localBase, pathname, method = "GET", body, authenticated = true) {
  const response = await fetch(new URL(pathname, localBase), {
    method,
    headers: {
      ...(authenticated ? { "x-operator-token": token } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: "error",
    signal: AbortSignal.timeout(20_000)
  });
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error("Local dashboard " + method + " " + pathname + " returned non-JSON HTTP " + response.status); }
  return { status: response.status, body: payload };
}
function assertSafeStartupState(state) {
  assert(state && typeof state === "object" && state.publishingEnabled !== true &&
    state.publicPublishingEnabled !== true && state.unattendedPublishingEnabled !== true,
    "Staging publishing must remain disabled");
  assert(Array.isArray(state.jobs) && state.jobs.length === 0,
    "Staging has content jobs; refusing to start recovery during this test");
  assert(!(state.facebookAttempts ?? []).some(item =>
    ["SUBMITTING", "REMOTE_SCHEDULED_UNVERIFIED"].includes(item.status)),
    "Staging has an uncertain Meta attempt; refusing to start recovery during this test");
  assert(!(state.campaigns ?? []).some(item => item.type === "safari_affiliate" &&
    (item.status !== "INACTIVE" || item.destinationUrl !== "" || item.ownerApproved !== false ||
     item.destinationValidation !== "not_verified" || item.disclosureText !== "" ||
     ["pendingDestinationUrl", "pendingDisclosureText", "pendingDestinationVersion", "approval"].some(key => Object.hasOwn(item, key)))),
    "Staging has a non-compliant Safari campaign; refusing to start recovery during this test");
}

const beforeResponse = await getWorker("/api/state");
assert(beforeResponse.status === 200, "Pre-test Cloudflare state read failed");
const beforePayload = beforeResponse.body;
const beforeState = beforePayload.state;
const beforeRevision = Number(beforePayload.revision);
assert(Number.isSafeInteger(beforeRevision) && beforeRevision >= 1 &&
  revisionFromEtag(beforeResponse.etag) === beforeRevision,
  "Pre-test state revision/ETag is invalid");
assertSafeStartupState(beforeState);
const beforeBackupsResponse = await getWorker("/api/backups");
assert(beforeBackupsResponse.status === 200, "Pre-test backup inventory read failed");
validateBackupList(beforeBackupsResponse.body?.backups);
assert(beforeBackupsResponse.body.backups.length >= 1, "A pre-existing safety backup is required");
const runnerStatus = await getWorker("/api/runner/session/status");
assert(runnerStatus.status === 200 && runnerStatus.body?.active === false,
  "A staging runner session is active or its status cannot be verified; refusing state mutation");

const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-staging-backup-restore-"));
fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), JSON.stringify(beforeState),
  { encoding: "utf8", mode: 0o600, flag: "wx" });
let dashboard;
let secondDashboard;
let createdBackupId = null;
try {
  dashboard = await startDashboard(stateDir);
  const localBase = "http://127.0.0.1:" + dashboard.port;
  const beforeLocal = await localRequest(localBase, "/api/state");
  assert(beforeLocal.status === 200 && beforeLocal.body?.publishingEnabled === false,
    "Node dashboard could not read the pre-test state");
  const preList = await localRequest(localBase, "/api/state/backups");
  assert(preList.status === 200 && Number(preList.body?.revision) === beforeRevision,
    "Node dashboard could not read the pre-test backup inventory");
  validateBackupList(preList.body.backups);

  const created = await localRequest(localBase, "/api/state/backup", "POST", {});
  assert(created.status === 201, "Node backup creation failed with HTTP " + created.status);
  assert(typeof created.body?.backupId === "string" && created.body.backupId.length > 0,
    "Node backup creation returned no backup ID");
  createdBackupId = created.body.backupId;
  assert(Number(created.body.sourceRevision) === beforeRevision &&
    /^[a-f0-9]{64}$/.test(created.body.sha256 ?? "") &&
    Number.isFinite(Date.parse(created.body.createdAt ?? "")),
    "Node backup creation returned an invalid receipt");

  const afterCreateList = await localRequest(localBase, "/api/state/backups");
  assert(afterCreateList.status === 200 && Number(afterCreateList.body?.revision) === beforeRevision,
    "Backup creation unexpectedly changed the dashboard state revision");
  validateBackupList(afterCreateList.body.backups);
  assert(afterCreateList.body.backups.some(item => item.backup_id === createdBackupId),
    "Created backup is not visible in the durable backup inventory");

  const restore = await localRequest(localBase, "/api/state/restore", "POST", {
    backupId: createdBackupId,
    expectedRevision: beforeRevision,
    confirmRestore: true
  });
  assert(restore.status === 200 && restore.body?.restored === true &&
    restore.body.backupId === createdBackupId &&
    Number(restore.body.revision) === beforeRevision + 1 &&
    restore.body.publishingEnabled === false && Number(restore.body.jobCount) === 0,
    "Node restore did not return the expected monotonic, publishing-disabled receipt");

  const afterRestore = await getWorker("/api/state");
  assert(afterRestore.status === 200 && Number(afterRestore.body?.revision) === beforeRevision + 1 &&
    revisionFromEtag(afterRestore.etag) === beforeRevision + 1,
    "Cloudflare did not persist the restored state at the next revision");
  const afterState = afterRestore.body.state;
  assertSafeStartupState(afterState);
  const receipt = afterState.audit?.at(-1);
  assert(receipt?.action === "DASHBOARD_STATE_RESTORED" && receipt.backupId === createdBackupId,
    "Durable restore audit receipt is missing or does not identify the exact backup");
  const withoutRestoreReceipt = { ...afterState, audit: afterState.audit.slice(0, -1) };
  assert(JSON.stringify(withoutRestoreReceipt) === JSON.stringify(beforeState),
    "Restore did not reproduce the exact pre-test state before its single audit receipt");

  const afterRestoreList = await localRequest(localBase, "/api/state/backups");
  assert(afterRestoreList.status === 200 && Number(afterRestoreList.body?.revision) === beforeRevision + 1,
    "Node dashboard did not observe the restored revision");
  validateBackupList(afterRestoreList.body.backups);
  assert(afterRestoreList.body.backups.length >= beforeBackupsResponse.body.backups.length + 2,
    "Expected both the explicit and automatic pre-restore backups to be retained");
  assert(afterRestoreList.body.backups.some(item => item.backup_id === createdBackupId),
    "The explicit pre-restore backup was not retained");

  await stopDashboard(dashboard.child);
  dashboard = null;

  secondDashboard = await startDashboard(stateDir);
  const restartedBase = "http://127.0.0.1:" + secondDashboard.port;
  const restartedState = await localRequest(restartedBase, "/api/state");
  assert(restartedState.status === 200 && restartedState.body?.publishingEnabled === false &&
    JSON.stringify(restartedState.body.queueItems) === JSON.stringify(beforeState.queueItems) &&
    JSON.stringify(restartedState.body.jobs) === JSON.stringify(beforeState.jobs),
    "Node dashboard did not recover the restored state after restart");
  const restartedBackups = await localRequest(restartedBase, "/api/state/backups");
  assert(restartedBackups.status === 200 && Number(restartedBackups.body?.revision) === beforeRevision + 1,
    "Node dashboard did not recover the durable revision after restart");
  validateBackupList(restartedBackups.body.backups);
  assert(restartedBackups.body.backups.length === afterRestoreList.body.backups.length,
    "Backup inventory changed during read-only restart recovery");
  await stopDashboard(secondDashboard.child);
  secondDashboard = null;

  const finalState = await getWorker("/api/state");
  const finalBackups = await getWorker("/api/backups");
  assert(finalState.status === 200 && Number(finalState.body?.revision) === beforeRevision + 1 &&
    JSON.stringify(finalState.body.state) === JSON.stringify(afterState),
    "Remote state changed after restart recovery");
  validateBackupList(finalBackups.body?.backups);
  assert(finalBackups.body.backups.length === afterRestoreList.body.backups.length,
    "Remote backup inventory changed after restart recovery");

  console.log(JSON.stringify({
    result: "PASS",
    target: parsed.origin,
    initialRevision: beforeRevision,
    restoredRevision: beforeRevision + 1,
    explicitBackupCreated: true,
    explicitBackupRetained: true,
    automaticPreRestoreBackupRetained: true,
    restoreAuditReceipt: "PASS",
    exactPreTestStateRestored: "PASS",
    nodeDashboardRestartRecovery: "PASS",
    remoteStateStableAfterRestart: "PASS",
    retainedBackupCount: finalBackups.body.backups.length,
    publishingEnabled: false,
    contentJobs: 0,
    writesPerformed: true,
    note: "Staging-only test. One explicit backup, one automatic pre-restore backup and one DASHBOARD_STATE_RESTORED audit receipt were added; queued content and publishing settings were preserved."
  }, null, 2));
} finally {
  if (dashboard) await stopDashboard(dashboard.child);
  if (secondDashboard) await stopDashboard(secondDashboard.child);
  fs.rmSync(stateDir, { recursive: true, force: true });
}
