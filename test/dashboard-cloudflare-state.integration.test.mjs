import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const dashboardToken = "dashboard-integration-token-" + "d".repeat(32);
const stateToken = "cloudflare-state-operator-token-" + "s".repeat(32);
const accessId = "cloudflare-access-client-id-test";
const accessSecret = "cloudflare-access-client-secret-test";

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

async function waitForReady(instance) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (instance.child.exitCode !== null) throw new Error("Dashboard exited before readiness: " + instance.logs);
    let started;
    for (const line of instance.logs.split(/\r?\n/)) {
      try {
        const event = JSON.parse(line);
        if (event.event === "dashboard_started" && Number.isInteger(event.port) && event.port > 0) {
          started = event;
          break;
        }
      } catch {}
    }
    if (started) {
      const base = "http://127.0.0.1:" + started.port;
      try {
        const response = await fetch(base + "/healthz");
        if (response.ok) return base;
      } catch {}
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Dashboard did not become ready: " + instance.logs);
}

async function stopChild(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Dashboard did not stop")), 5000);
    child.once("exit", () => { clearTimeout(timeout); resolve(); });
  });
}

test("dashboard startup recovers local work through authenticated Cloudflare persistence", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-cloudflare-integration-"));
  const stateFile = path.join(stateDir, "dashboard-state.json");
  const initialState = {
    version: 1, queueItems: [], campaigns: [], audit: [],
    jobs: [{ id: "interrupted-task", taskId: "interrupted-task", status: "RUNNING" }],
    uploads: [], facebookDrafts: [], facebookPosts: [], facebookAttempts: [],
    publishingEnabled: false
  };
  fs.writeFileSync(stateFile, JSON.stringify(initialState), { mode: 0o600 });

  let remoteState = null;
  let revision = 0;
  let authFailures = 0;
  let restoreRequests = 0;
  const backups = [];
  const stateServer = http.createServer(async (req, res) => {
    try {
      if (req.headers["x-operator-token"] !== stateToken ||
          req.headers["cf-access-client-id"] !== accessId ||
          req.headers["cf-access-client-secret"] !== accessSecret) {
        authFailures++;
        send(res, 401, { error: "Unauthorized" });
        return;
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      const body = raw ? JSON.parse(raw) : undefined;

      if (req.method === "GET" && req.url === "/api/state") {
        if (!remoteState) send(res, 503, { code: "STATE_NOT_INITIALIZED", error: "not initialized" });
        else send(res, 200, { revision, updatedAt: "2026-11-08T00:00:00.000Z", state: remoteState }, { etag: '"' + revision + '"' });
        return;
      }
      if (req.method === "POST" && req.url === "/api/state/bootstrap") {
        if (remoteState) { send(res, 409, { error: "already initialized" }); return; }
        revision = 1;
        remoteState = { ...body, audit: [...body.audit, { id: "bootstrap", action: "DASHBOARD_STATE_BOOTSTRAPPED", actor: "integration-operator" }] };
        send(res, 201, { revision, updatedAt: "2026-11-08T00:00:00.000Z", state: remoteState }, { etag: '"1"' });
        return;
      }
      if (req.method === "GET" && req.url === "/api/backups") {
        send(res, 200, { backups: backups.map(item => ({
          backup_id: item.backupId, source_revision: item.sourceRevision, sha256: item.sha256,
          created_at: item.createdAt, reason: item.reason
        })) });
        return;
      }
      if (req.method === "POST" && req.url === "/api/backups") {
        const receipt = {
          backupId: "backup-" + (backups.length + 1), sourceRevision: revision,
          sha256: "a".repeat(64), createdAt: "2026-11-08T00:02:00.000Z",
          reason: "OPERATOR_REQUESTED:integration-operator", state: JSON.parse(JSON.stringify(remoteState))
        };
        backups.push(receipt);
        const { state: _snapshot, ...publicReceipt } = receipt;
        send(res, 201, publicReceipt);
        return;
      }
      if (req.method === "POST" && req.url === "/api/backups/restore") {
        restoreRequests++;
        const backup = backups.find(item => item.backupId === body?.backupId);
        if (!backup) { send(res, 404, { error: "Backup not found" }); return; }
        if (Number(body.expectedRevision) !== revision) { send(res, 409, { code: "REVISION_CONFLICT", error: "reload" }); return; }
        revision++;
        remoteState = {
          ...JSON.parse(JSON.stringify(backup.state)),
          audit: [...backup.state.audit, { id: "restore-" + revision, action: "DASHBOARD_STATE_RESTORED", backupId: body.backupId }]
        };
        send(res, 200, { revision, updatedAt: "2026-11-08T00:02:00.000Z", state: remoteState }, { etag: '"' + revision + '"' });
        return;
      }
      if (req.method === "PUT" && req.url === "/api/state") {
        if (!remoteState || Number(req.headers["if-match"]) !== revision) {
          send(res, 409, { code: "REVISION_CONFLICT", error: "reload" });
          return;
        }
        const previousRevision = revision;
        revision++;
        remoteState = {
          ...body,
          audit: [...body.audit, { id: "snapshot-" + revision, action: "DASHBOARD_STATE_SNAPSHOT_UPDATED", previousRevision }]
        };
        send(res, 200, { revision, updatedAt: "2026-11-08T00:01:00.000Z", state: remoteState }, { etag: '"' + revision + '"' });
        return;
      }
      send(res, 404, { error: "Not found" });
    } catch (error) {
      send(res, 500, { error: String(error?.message ?? error) });
    }
  });
  await new Promise(resolve => stateServer.listen(0, "127.0.0.1", resolve));
  const stateUrl = "http://127.0.0.1:" + stateServer.address().port;

  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: dashboardToken,
      DASHBOARD_OPERATOR_ID: "integration-operator",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: "0",
      DASHBOARD_HOST: "127.0.0.1",
      DASHBOARD_STATE_API_URL: stateUrl,
      DASHBOARD_STATE_OPERATOR_TOKEN: stateToken,
      DASHBOARD_STATE_ACCESS_CLIENT_ID: accessId,
      DASHBOARD_STATE_ACCESS_CLIENT_SECRET: accessSecret,
      META_PAGE_ACCESS_TOKEN: "",
      META_USER_ACCESS_TOKEN: "",
      NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "",
      FACEBOOK_PUBLISH_ENABLED: "",
      YOUTUBE_CLIENT_ID: "",
      YOUTUBE_CLIENT_SECRET: "",
      YOUTUBE_REFRESH_TOKEN: "",
      SONICVHIBEZ_CHANNEL_ID: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const instance = { child, get logs() { return logs; } };

  t.after(async () => {
    if (child.exitCode === null) {
      try { await stopChild(child); } catch { child.kill("SIGKILL"); }
    }
    await new Promise(resolve => stateServer.close(resolve));
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = await waitForReady(instance);
  assert.equal(authFailures, 0, "every state request must carry both Access service-token headers and the operator token");
  assert.equal(revision, 2, "startup recovery must persist through the remote revisioned API");
  assert.equal(remoteState.jobs[0].status, "RECOVERY_REQUIRED");
  assert.ok(remoteState.audit.some(entry => entry.action === "DASHBOARD_STATE_BOOTSTRAPPED"));
  assert.ok(remoteState.audit.some(entry => entry.action === "DASHBOARD_STATE_SNAPSHOT_UPDATED"));
  const local = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(local.jobs[0].status, "RECOVERY_REQUIRED");
  assert.deepEqual(local, remoteState);
  const headers = { "x-operator-token": dashboardToken };
  const backupResponse = await fetch(base + "/api/state/backup", { method: "POST", headers });
  assert.equal(backupResponse.status, 201);
  const backup = await backupResponse.json();
  assert.equal(backup.sourceRevision, 2);
  const listResponse = await fetch(base + "/api/state/backups", { headers });
  assert.equal(listResponse.status, 200);
  const listed = await listResponse.json();
  assert.equal(listed.backups.length, 1);
  assert.equal(listed.backups[0].backup_id, backup.backupId);
  const unconfirmed = await fetch(base + "/api/state/restore", {
    method: "POST", headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ backupId: backup.backupId, expectedRevision: 2 })
  });
  assert.equal(unconfirmed.status, 400, "restore must require an explicit confirmation flag");
  assert.equal(revision, 2, "unconfirmed restore must not contact or mutate the remote state");
  const invalidRestoreBodies = [
    { backupId: " ", expectedRevision: 2, confirmRestore: true },
    { backupId: backup.backupId, expectedRevision: 0, confirmRestore: true },
    { backupId: backup.backupId, expectedRevision: 2.5, confirmRestore: true },
    { backupId: backup.backupId, expectedRevision: "2", confirmRestore: true },
    { backupId: backup.backupId, expectedRevision: 2, confirmRestore: false }
  ];
  for (const body of invalidRestoreBodies) {
    const response = await fetch(base + "/api/state/restore", {
      method: "POST", headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(response.status, 400, "invalid restore input must be rejected before remote mutation");
  }
  const staleRestore = await fetch(base + "/api/state/restore", {
    method: "POST", headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ backupId: backup.backupId, expectedRevision: 1, confirmRestore: true })
  });
  assert.equal(staleRestore.status, 409, "stale revision must be rejected before remote mutation");
  assert.equal(restoreRequests, 0, "invalid and stale restore requests must never reach the remote restore endpoint");
  assert.equal(revision, 2, "invalid and stale restore requests must leave the remote revision unchanged");
  const restoreResponse = await fetch(base + "/api/state/restore", {
    method: "POST", headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ backupId: backup.backupId, expectedRevision: 2, confirmRestore: true })
  });
  assert.equal(restoreResponse.status, 200);
  const restoreReceipt = await restoreResponse.json();
  assert.equal(restoreReceipt.revision, 3);
  assert.equal(restoreRequests, 1, "only the explicitly confirmed valid restore may reach the remote endpoint");
  assert.equal(remoteState.audit.at(-1).action, "DASHBOARD_STATE_RESTORED");
  assert.equal(remoteState.audit.at(-1).backupId, backup.backupId);
  const restoredLocal = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.deepEqual(restoredLocal, remoteState);
  const metadata = JSON.parse(fs.readFileSync(stateFile + ".cloudflare-meta.json", "utf8"));
  assert.equal(metadata.revision, 3);
});


test("Cloudflare backup and restore routes fail closed without remote configuration and never mutate local state", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-cloudflare-unconfigured-"));
  const stateFile = path.join(stateDir, "dashboard-state.json");
  const initialState = {
    version: 1, queueItems: [], campaigns: [], audit: [], jobs: [], uploads: [],
    facebookDrafts: [], facebookPosts: [], facebookAttempts: [], publishingEnabled: false
  };
  fs.writeFileSync(stateFile, JSON.stringify(initialState), { mode: 0o600 });
  const before = fs.readFileSync(stateFile);

  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: dashboardToken,
      DASHBOARD_OPERATOR_ID: "integration-operator",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: "0",
      DASHBOARD_HOST: "127.0.0.1",
      DASHBOARD_STATE_API_URL: "",
      DASHBOARD_STATE_OPERATOR_TOKEN: "",
      DASHBOARD_STATE_ACCESS_CLIENT_ID: "",
      DASHBOARD_STATE_ACCESS_CLIENT_SECRET: "",
      META_PAGE_ACCESS_TOKEN: "",
      META_USER_ACCESS_TOKEN: "",
      NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "",
      FACEBOOK_PUBLISH_ENABLED: "",
      YOUTUBE_CLIENT_ID: "",
      YOUTUBE_CLIENT_SECRET: "",
      YOUTUBE_REFRESH_TOKEN: "",
      SONICVHIBEZ_CHANNEL_ID: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const instance = { child, get logs() { return logs; } };

  t.after(async () => {
    if (child.exitCode === null) {
      try { await stopChild(child); } catch { child.kill("SIGKILL"); }
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = await waitForReady(instance);
  const headers = { "x-operator-token": dashboardToken };
  const listing = await fetch(base + "/api/state/backups", { headers });
  assert.equal(listing.status, 503, "backup listing must fail closed when Cloudflare state is not configured");
  const creation = await fetch(base + "/api/state/backup", { method: "POST", headers });
  assert.equal(creation.status, 503, "backup creation must fail closed when Cloudflare state is not configured");
  const restore = await fetch(base + "/api/state/restore", {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ backupId: "backup-1", expectedRevision: 1, confirmRestore: true })
  });
  assert.equal(restore.status, 503, "restore must fail closed when Cloudflare state is not configured");
  assert.deepEqual(fs.readFileSync(stateFile), before, "unconfigured backup/restore requests must not alter local state");
  assert.equal(fs.existsSync(stateFile + ".cloudflare-meta.json"), false, "unconfigured routes must not create remote revision metadata");
  assert.equal(fs.existsSync(stateFile + ".cloudflare-pending.json"), false, "unconfigured routes must not create pending remote mutations");
});
