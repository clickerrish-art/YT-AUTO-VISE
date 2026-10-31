import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const token = "worker-finalization-race-" + "x".repeat(40);

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

function launchDashboard(port, stateDir, workerLabel) {
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "worker-finalization-race@example.test",
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
  return { child, port, workerLabel, get logs() { return logs; } };
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

test("independent dashboard processes serialize duplicate worker completion and expired-lease reaping", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-finalization-race-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  const first = launchDashboard(await reservePort(), stateDir, "process-a");
  const second = launchDashboard(await reservePort(), stateDir, "process-b");
  t.after(async () => {
    await Promise.all([stopDashboard(first), stopDashboard(second)]);
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  await Promise.all([waitForReady(first), waitForReady(second)]);
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const base = instance => "http://127.0.0.1:" + instance.port;
  const post = (instance, route, payload) => fetch(base(instance) + route, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  const createJob = async (idempotencyKey, scheduledDate, title) => {
    const response = await post(first, "/api/jobs", {
      idempotencyKey,
      title,
      topic: "A source-backed wildlife explainer for worker race acceptance",
      contentType: "short",
      scheduledDay: "Saturday",
      scheduledDate,
      inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
    });
    const body = await response.json();
    assert.ok([200, 201].includes(response.status), JSON.stringify(body));
    assert.ok(body.job?.id);
    return body.job;
  };
  const claimJob = async (jobId, workerId, leaseMs) => {
    const response = await post(first, "/api/jobs/lease/claim", { jobId, workerId, leaseMs });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return body;
  };
  const readState = () => JSON.parse(fs.readFileSync(statePath, "utf8"));

  const completionJob = await createJob(
    "worker-finalization-race:completion:2026-11-07",
    "2026-11-07",
    "Duplicate completion race"
  );
  const completionLease = await claimJob(completionJob.id, "race-worker-complete", 60_000);
  const completionPayload = {
    jobId: completionJob.id,
    leaseToken: completionLease.leaseToken,
    nextState: "FAILED",
    result: { errorDetails: { code: "RACE_TEST_FAILURE", retryable: false, message: "Controlled race test failure" } }
  };

  const completionResponses = await Promise.all([
    post(first, "/api/jobs/lease/complete", completionPayload),
    post(second, "/api/jobs/lease/complete", completionPayload)
  ]);
  const completionOutcomes = await Promise.all(completionResponses.map(async response => ({
    status: response.status,
    body: await response.json()
  })));
  assert.equal(completionOutcomes.filter(item => item.status === 200).length, 1,
    "exactly one process may complete a worker stage");
  assert.equal(completionOutcomes.filter(item => item.status >= 400 && item.status < 500).length, 1,
    "the duplicate completion must be rejected as a client conflict");
  let state = readState();
  let job = state.jobs.find(item => item.id === completionJob.id);
  assert.equal(job.state, "FAILED");
  assert.equal(job.workerLease, null);
  assert.equal(state.audit.filter(event =>
    event.action === "WORKER_STAGE_COMPLETED" && event.jobId === completionJob.id
  ).length, 1, "duplicate completion must create exactly one durable audit event");

  const reapJob = await createJob(
    "worker-finalization-race:reap:2026-11-14",
    "2026-11-14",
    "Duplicate lease reaper race"
  );
  await claimJob(reapJob.id, "race-worker-reap", 5_000);
  await new Promise(resolve => setTimeout(resolve, 5_250));

  const reapResponses = await Promise.all([
    post(first, "/api/jobs/lease/reap", { jobId: reapJob.id }),
    post(second, "/api/jobs/lease/reap", { jobId: reapJob.id })
  ]);
  const reapOutcomes = await Promise.all(reapResponses.map(async response => ({
    status: response.status,
    body: await response.json()
  })));
  assert.equal(reapOutcomes.filter(item => item.status === 200).length, 1,
    "exactly one process may reap an expired lease");
  assert.equal(reapOutcomes.filter(item => item.status === 409).length, 1,
    "the second reaper must observe that no expired lease remains");

  state = readState();
  job = state.jobs.find(item => item.id === reapJob.id);
  assert.equal(job.state, "FAILED");
  assert.equal(job.workerLease, null);
  assert.equal(job.errorDetails.code, "WORKER_LEASE_EXPIRED");
  assert.equal(state.audit.filter(event =>
    event.action === "WORKER_LEASE_EXPIRED" && event.jobId === reapJob.id
  ).length, 1, "concurrent reapers must create exactly one expiry audit event");
  assert.ok(state.jobs.every(item => item.publishingEnabled === false),
    "every persisted content job must remain non-publishable");
});
