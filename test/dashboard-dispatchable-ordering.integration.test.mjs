import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function reservePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

async function fetchDashboard(url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("connection", "close");
  return fetch(url, { ...options, headers });
}

function approvedQueuedJob(id, createdAt, date, time = "17:00") {
  return {
    id,
    kind: "CONTENT_PRODUCTION",
    state: "QUEUED",
    contentType: "short",
    createdAt,
    scheduledSlot: { date, time, timezone: "Africa/Johannesburg" },
    authoring: {
      productionPlan: {
        status: "APPROVED_PLAN_ONLY",
        review: { decision: "APPROVE", approvalSha256: "a".repeat(64) }
      }
    }
  };
}

test("dispatchable jobs sort by valid Johannesburg slots and use creation time for invalid legacy slots", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dispatchable-order-"));
  const stateFile = path.join(stateDir, "dashboard-state.json");
  const state = {
    version: 1,
    queueItems: [],
    campaigns: [],
    audit: [],
    jobs: [
      // Creation order deliberately disagrees with the valid scheduled-slot order.
      approvedQueuedJob("slot-later", "2026-10-01T08:00:00.000Z", "2026-11-10"),
      approvedQueuedJob("slot-earlier", "2026-12-15T08:00:00.000Z", "2026-11-05"),
      // November 31 is not a real calendar date. It must fall back to createdAt,
      // rather than Date.parse silently normalizing it into December.
      approvedQueuedJob("invalid-slot", "2026-10-15T08:00:00.000Z", "2026-11-31")
    ],
    uploads: [],
    facebookDrafts: [],
    facebookPosts: [],
    facebookAttempts: []
  };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
  const port = await reservePort();
  const token = "dispatchable-test-token-" + "x".repeat(32);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "dispatchable-test-owner@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(resolve => child.once("exit", resolve));
      child.kill("SIGTERM");
      await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 1500))]);
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetchDashboard(base + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard failed to start: " + logs);

  const beforeRead = fs.readFileSync(stateFile);
  const response = await fetchDashboard(base + "/api/jobs/dispatchable?limit=10", {
    headers: { "x-operator-token": token }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.jobs.map(job => job.id), ["invalid-slot", "slot-earlier", "slot-later"]);
  assert.equal(body.queuedCount, 3);
  assert.equal(body.publishingEnabled, false);
  assert.equal(body.readOnly, true);
  assert.deepEqual(fs.readFileSync(stateFile), beforeRead, "the dispatchable read must not mutate persisted state");
});
