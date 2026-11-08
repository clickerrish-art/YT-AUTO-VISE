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

  await waitForReady(instance);
  assert.equal(authFailures, 0, "every state request must carry both Access service-token headers and the operator token");
  assert.equal(revision, 2, "startup recovery must persist through the remote revisioned API");
  assert.equal(remoteState.jobs[0].status, "RECOVERY_REQUIRED");
  assert.ok(remoteState.audit.some(entry => entry.action === "DASHBOARD_STATE_BOOTSTRAPPED"));
  assert.ok(remoteState.audit.some(entry => entry.action === "DASHBOARD_STATE_SNAPSHOT_UPDATED"));
  const local = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(local.jobs[0].status, "RECOVERY_REQUIRED");
  assert.deepEqual(local, remoteState);
  const metadata = JSON.parse(fs.readFileSync(stateFile + ".cloudflare-meta.json", "utf8"));
  assert.equal(metadata.revision, 2);
});
