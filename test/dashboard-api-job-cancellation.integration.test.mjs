import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { futureScheduleDate } from "./helpers/schedule-fixtures.mjs";

const root = process.cwd();
const token = "job-cancellation-acceptance-" + "x".repeat(40);
const operatorId = "job-cancel-owner@example.test";

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
      DASHBOARD_OPERATOR_ID: operatorId,
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
  const exited = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Dashboard did not stop after SIGTERM")), 5000);
    instance.child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  instance.child.kill("SIGTERM");
  await exited;
}

test("job transition API safely cancels queued work, rejects active leases, audits and persists restart", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-job-cancellation-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  let instance = launchDashboard(await reservePort(), stateDir);
  t.after(async () => {
    await stopDashboard(instance);
    fs.rmSync(stateDir, { recursive: true, force: true });
  });
  await waitForReady(instance);

  const base = () => "http://127.0.0.1:" + instance.port;
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const post = (route, payload) => fetch(base() + route, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  const createJob = async (idempotencyKey, scheduledDate, title) => {
    const response = await post("/api/jobs", {
      idempotencyKey,
      title,
      topic: "A source-backed wildlife explainer for safe cancellation acceptance",
      contentType: "short",
      scheduledDay: "Saturday",
      scheduledDate,
      inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
    });
    const body = await response.json();
    assert.ok([200, 201].includes(response.status), JSON.stringify(body));
    return body.job;
  };

  const queued = await createJob(
    "job-cancel-queued:future-slot-1",
    futureScheduleDate("Saturday", 1),
    "Queued job cancellation acceptance"
  );
  const leased = await createJob(
    "job-cancel-leased:future-slot-2",
    futureScheduleDate("Saturday", 2),
    "Active lease cancellation rejection"
  );
  const claimResponse = await post("/api/jobs/lease/claim", {
    jobId: leased.id,
    workerId: "cancellation-test-worker",
    leaseMs: 60_000
  });
  const claim = await claimResponse.json();
  assert.equal(claimResponse.status, 200, JSON.stringify(claim));

  const beforeActiveSlotConflict = fs.readFileSync(statePath);
  const activeSlotConflict = await post("/api/jobs", {
    idempotencyKey: "job-cancel-active-slot-conflict",
    title: "An active job must retain its publication slot",
    topic: "A source-backed wildlife explainer for safe cancellation acceptance",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: futureScheduleDate("Saturday", 2),
    inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
  });
  const activeSlotConflictBody = await activeSlotConflict.json();
  assert.equal(activeSlotConflict.status, 409, JSON.stringify(activeSlotConflictBody));
  assert.deepEqual(fs.readFileSync(statePath), beforeActiveSlotConflict,
    "an active job must continue reserving its date and a rejected collision must not mutate state");

  const beforeRejectedCancel = fs.readFileSync(statePath);
  const rejected = await post("/api/jobs/transition", {
    jobId: leased.id,
    nextState: "CANCELLED",
    reason: "Must not interrupt an active worker"
  });
  assert.equal(rejected.status, 400, await rejected.text());
  assert.deepEqual(fs.readFileSync(statePath), beforeRejectedCancel,
    "rejected cancellation must not mutate job state or audit history");

  // Simulate an in-flight provider-backed authoring stage in durable state.
  // Cancellation must not mark the job terminal while that operation can still finish.
  const activeAuthoring = await createJob(
    "job-cancel-authoring:future-slot-3",
    futureScheduleDate("Saturday", 3),
    "Active authoring cancellation rejection"
  );
  let seededState = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const activeAuthoringIndex = seededState.jobs.findIndex(job => job.id === activeAuthoring.id);
  seededState.jobs[activeAuthoringIndex].authoring = {
    status: "GENERATING",
    fingerprint: "a".repeat(64),
    requestedAt: new Date().toISOString(),
    publishable: false
  };
  fs.writeFileSync(statePath, JSON.stringify(seededState, null, 2) + "\n");
  const beforeActiveAuthoringCancel = fs.readFileSync(statePath);
  const activeAuthoringCancel = await post("/api/jobs/transition", {
    jobId: activeAuthoring.id,
    nextState: "CANCELLED",
    reason: "Must not interrupt provider-backed authoring"
  });
  assert.equal(activeAuthoringCancel.status, 400, await activeAuthoringCancel.text());
  assert.deepEqual(fs.readFileSync(statePath), beforeActiveAuthoringCancel,
    "active authoring cancellation must preserve state and audit history byte-for-byte");

  const cancelledResponse = await post("/api/jobs/transition", {
    jobId: queued.id,
    nextState: "CANCELLED",
    reason: "Operator withdrew the content request"
  });
  const cancelledBody = await cancelledResponse.json();
  assert.equal(cancelledResponse.status, 200, JSON.stringify(cancelledBody));
  assert.equal(cancelledBody.job.state, "CANCELLED");
  assert.equal(cancelledBody.job.cancelledBy, operatorId);
  assert.equal(cancelledBody.job.cancelReason, "Operator withdrew the content request");
  assert.equal(cancelledBody.job.cancelledAt, cancelledBody.job.completedAt);
  assert.equal(cancelledBody.job.nextRetryAt, null);
  assert.equal(cancelledBody.publishingEnabled, false);

  const replacement = await createJob(
    "job-cancel-reuse:future-slot-1",
    futureScheduleDate("Saturday", 1),
    "Replacement job after explicit cancellation"
  );
  assert.equal(replacement.scheduledSlot.date, futureScheduleDate("Saturday", 1),
    "a cancelled direct job must release its unshared publication reservation");

  let state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(state.jobs.find(job => job.id === queued.id).state, "CANCELLED");
  assert.equal(state.jobs.find(job => job.id === leased.id).state, "GENERATING");
  assert.equal(state.audit.filter(event =>
    event.action === "CONTENT_JOB_CANCELLED" && event.jobId === queued.id
  ).length, 1);
  assert.equal(state.audit.filter(event =>
    event.action === "CONTENT_JOB_CANCELLED" && event.jobId === leased.id
  ).length, 0);
  assert.equal(state.jobs.every(job => job.publishingEnabled === false), true);

  await stopDashboard(instance);
  instance = launchDashboard(await reservePort(), stateDir);
  await waitForReady(instance);
  const recoveredResponse = await fetch(base() + "/api/state", {
    headers: { "x-operator-token": token }
  });
  const recovered = await recoveredResponse.json();
  assert.equal(recoveredResponse.status, 200);
  assert.equal(recovered.jobs.find(job => job.id === queued.id).state, "CANCELLED");
  assert.equal(recovered.jobs.find(job => job.id === queued.id).cancelledBy, operatorId);
  assert.equal(recovered.audit.filter(event =>
    event.action === "CONTENT_JOB_CANCELLED" && event.jobId === queued.id
  ).length, 1);
  assert.equal(recovered.publishingEnabled, false);
});
