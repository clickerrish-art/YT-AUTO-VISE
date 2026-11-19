import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { futureScheduleDate } from "./helpers/schedule-fixtures.mjs";

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

test("queue diagnostics are authenticated, read-only, Johannesburg-aware and safe under concurrent reads", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-queue-diagnostics-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  const token = "queue-diagnostics-test-" + "x".repeat(40);
  const now = new Date().toISOString();
  const job = {
    id: "queue-diagnostics-fixture-01",
    kind: "CONTENT_PRODUCTION",
    state: "QUEUED",
    contentType: "short",
    createdAt: now,
    scheduledSlot: {
      date: futureScheduleDate("Saturday", 1),
      time: "17:00",
      timezone: "Africa/Johannesburg"
    }
  };
  fs.writeFileSync(statePath, JSON.stringify({
    version: 1,
    queueItems: [],
    campaigns: [],
    audit: [],
    jobs: [job],
    uploads: [],
    facebookDrafts: [],
    facebookPosts: [],
    facebookAttempts: []
  }, null, 2) + "\n", { mode: 0o600 });

  const port = await reservePort();
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "queue-diagnostics-operator@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
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
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await new Promise(resolve => {
        if (child.exitCode !== null || child.signalCode !== null) return resolve();
        child.once("exit", resolve);
        setTimeout(resolve, 5000);
      });
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = "http://127.0.0.1:" + port;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) break;
    try {
      if ((await fetch(base + "/healthz")).ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard failed to start: " + logs);

  const originalState = fs.readFileSync(statePath);
  const unauthenticated = await fetch(base + "/api/jobs/queue-diagnostics?limit=100");
  assert.equal(unauthenticated.status, 401);
  assert.deepEqual(fs.readFileSync(statePath), originalState,
    "unauthenticated diagnostics must not mutate durable state");

  const headers = { "x-operator-token": token };
  const invalidLimit = await fetch(base + "/api/jobs/queue-diagnostics?limit=101", { headers });
  assert.equal(invalidLimit.status, 400);
  assert.deepEqual(fs.readFileSync(statePath), originalState,
    "invalid diagnostics limits must not mutate durable state");

  const responses = await Promise.all(Array.from({ length: 4 }, () =>
    fetch(base + "/api/jobs/queue-diagnostics?limit=100", { headers })
  ));
  const payloads = await Promise.all(responses.map(async response => {
    assert.equal(response.status, 200);
    return response.json();
  }));
  for (const payload of payloads) {
    assert.equal(payload.timezone, "Africa/Johannesburg");
    assert.equal(payload.queuedCount, 1);
    assert.equal(payload.dispatchableCount, 0);
    assert.equal(payload.heldCount, 1);
    assert.equal(payload.readOnly, true);
    assert.equal(payload.publishingEnabled, false);
    assert.equal(payload.returnedCount, 1);
    assert.equal(payload.items[0].id, job.id);
    assert.equal(payload.items[0].status, "HELD");
    assert.ok(payload.items[0].blockers.includes("APPROVED_AUTHORING_MISSING"));
    assert.ok(payload.items[0].blockers.includes("APPROVED_RENDER_PLAN_MISSING"));
    assert.ok(payload.items[0].blockers.includes("SLOT_IN_FUTURE"));
    assert.equal(payload.blockerCounts.APPROVED_AUTHORING_MISSING, 1);
    assert.equal(payload.blockerCounts.APPROVED_RENDER_PLAN_MISSING, 1);
    assert.equal(payload.blockerCounts.SLOT_IN_FUTURE, 1);
  }
  assert.deepEqual(fs.readFileSync(statePath), originalState,
    "concurrent diagnostics reads must preserve state byte-for-byte");
  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.deepEqual(persisted.audit, [], "read-only diagnostics must not create audit events");
  assert.equal(persisted.jobs[0].state, "QUEUED");
});
