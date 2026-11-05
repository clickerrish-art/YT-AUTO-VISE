import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { futureScheduleDate } from "./helpers/schedule-fixtures.mjs";

const root = process.cwd();
const token = "dispatch-order-acceptance-" + "x".repeat(40);

async function reservePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  return port;
}

function launchDashboard(port, stateDir) {
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "dispatch-order@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      DASHBOARD_WORKER_TOKEN: "dispatch-worker-" + "y".repeat(40),
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
  return { child, port, get logs() { return logs; } };
}

async function waitForReady(instance) {
  const base = "http://127.0.0.1:" + instance.port;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (instance.child.exitCode !== null || instance.child.signalCode !== null) {
      throw new Error("Dashboard exited before becoming ready: " + instance.logs);
    }
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Dashboard did not become ready: " + instance.logs);
}

async function stopDashboard(instance) {
  if (!instance || instance.child.exitCode !== null || instance.child.signalCode !== null) return;
  const exited = new Promise(resolve => instance.child.once("exit", resolve));
  instance.child.kill("SIGTERM");
  await exited;
}

function approvedPlan() {
  return {
    status: "APPROVED_PLAN_ONLY",
    review: { decision: "APPROVE", approvalSha256: "a".repeat(64) }
  };
}

function job(id, {
  scheduledDate,
  scheduledTime = "17:00",
  timezone = "Africa/Johannesburg",
  createdAt = "2026-11-05T12:00:00.000Z",
  state = "QUEUED",
  approved = true
} = {}) {
  return {
    id,
    kind: "CONTENT_PRODUCTION",
    state,
    contentType: "short",
    createdAt,
    scheduledSlot: scheduledDate ? { date: scheduledDate, time: scheduledTime, timezone } : null,
    authoring: approved ? { productionPlan: approvedPlan() } : null,
    publishingEnabled: false
  };
}

test("dispatchable queue is read-only, approval-gated, ordered by scheduled instant and stable on ties", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dispatch-order-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  let instance;
  t.after(async () => {
    await stopDashboard(instance);
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  instance = launchDashboard(await reservePort(), stateDir);
  await waitForReady(instance);
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const saturday = futureScheduleDate("Saturday", 1);
  const tuesday = futureScheduleDate("Tuesday", 2);
  const fixedCreatedAt = "2026-11-05T12:00:00.000Z";

  state.jobs = [
    job("job-later-slot", { scheduledDate: tuesday, createdAt: "2026-11-05T08:00:00.000Z" }),
    job("job-earlier-slot", { scheduledDate: saturday, createdAt: "2026-11-05T15:00:00.000Z" }),
    job("job-tie-z", { scheduledDate: saturday, scheduledTime: "18:00", createdAt: fixedCreatedAt }),
    job("job-tie-a", { scheduledDate: saturday, scheduledTime: "18:00", createdAt: fixedCreatedAt }),
    job("job-malformed-slot", { scheduledDate: saturday, scheduledTime: "not-a-time", timezone: "UTC", createdAt: "2026-11-05T11:00:00.000Z" }),
    job("job-no-slot", { createdAt: "2026-11-05T10:00:00.000Z" }),
    job("job-unapproved", { scheduledDate: saturday, createdAt: "2026-11-05T07:00:00.000Z", approved: false }),
    job("job-not-queued", { scheduledDate: saturday, state: "GENERATING" })
  ];
  state.audit = [{ id: "seed-audit", action: "SCHEDULER_FIXTURE", at: fixedCreatedAt, actor: "test" }];
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
  const before = fs.readFileSync(statePath);

  const base = "http://127.0.0.1:" + instance.port;
  const response = await fetch(base + "/api/jobs/dispatchable?limit=20", {
    headers: { "x-worker-token": "dispatch-worker-" + "y".repeat(40), "x-worker-id": "dispatch-order-worker" }
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.readOnly, true);
  assert.equal(body.publishingEnabled, false);
  assert.equal(body.queuedCount, 7, "all queued jobs are counted, including jobs held behind approval");
  assert.equal(body.queuedWithoutApprovedRenderPlan, 1);
  assert.equal(body.dispatchableCount, 4);
  assert.equal(body.queuedWithoutValidSlot, 2);
  assert.deepEqual(body.jobs.map(item => item.id), [
    "job-earlier-slot",
    "job-tie-a",
    "job-tie-z",
    "job-later-slot"
  ], "only valid explicit Johannesburg slots are dispatchable; malformed or absent slots remain held");
  assert.deepEqual(fs.readFileSync(statePath), before,
    "dispatch discovery must not mutate durable job state or audit history");

  const limited = await fetch(base + "/api/jobs/dispatchable?limit=3", {
    headers: { "x-worker-token": "dispatch-worker-" + "y".repeat(40), "x-worker-id": "dispatch-order-worker" }
  });
  const limitedBody = await limited.json();
  assert.equal(limited.status, 200, JSON.stringify(limitedBody));
  assert.deepEqual(limitedBody.jobs.map(item => item.id), body.jobs.slice(0, 3).map(item => item.id),
    "the requested limit must return a stable prefix of the approved, valid-slot dispatch queue");
  assert.deepEqual(fs.readFileSync(statePath), before,
    "repeated and limited dispatch discovery must remain byte-for-byte read-only");
});
