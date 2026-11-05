import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { futureScheduleDate } from "./helpers/schedule-fixtures.mjs";

const root = process.cwd();
const token = "worker-lease-lifecycle-" + "x".repeat(40);

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
      DASHBOARD_OPERATOR_ID: "worker-lease-lifecycle@example.test",
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
  const exited = new Promise(resolve => instance.child.once("exit", resolve));
  instance.child.kill("SIGTERM");
  await exited;
}

test("worker lease heartbeat, completion fencing, expiry reaping and restart persistence use the real dashboard API", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-lease-lifecycle-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  let instance;
  t.after(async () => {
    await stopDashboard(instance);
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const port = await reservePort();
  instance = launchDashboard(port, stateDir);
  await waitForReady(instance);

  const base = "http://127.0.0.1:" + port;
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const post = async (route, payload) => fetch(base + route, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  const createJob = async (idempotencyKey, scheduledDate, title) => {
    const response = await post("/api/jobs", {
      idempotencyKey,
      title,
      topic: "A source-backed wildlife research explainer for worker lifecycle acceptance",
      contentType: "short",
      scheduledDay: "Saturday",
      scheduledDate,
      inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
    });
    const body = await response.json();
    assert.ok([200, 201].includes(response.status), JSON.stringify(body));
    assert.ok(body.job?.id, "job creation must return a durable job identifier");
    return body.job;
  };
  const claimJob = async (jobId, workerId, leaseMs) => {
    const response = await post("/api/jobs/lease/claim", { jobId, workerId, leaseMs });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.ok(body.leaseToken);
    return body;
  };
  const readPersisted = () => JSON.parse(fs.readFileSync(statePath, "utf8"));

  const completedJob = await createJob(
    "lease-lifecycle-heartbeat-complete:future-slot-1",
    futureScheduleDate("Saturday", 1),
    "Worker heartbeat and completion acceptance"
  );
  const claim = await claimJob(completedJob.id, "lifecycle-worker-alpha", 60_000);
  const originalExpiry = Date.parse(claim.job.workerLease.expiresAt);

  const heartbeatResponse = await post("/api/jobs/lease/heartbeat", {
    jobId: completedJob.id,
    leaseToken: claim.leaseToken,
    leaseMs: 120_000
  });
  const heartbeat = await heartbeatResponse.json();
  assert.equal(heartbeatResponse.status, 200, JSON.stringify(heartbeat));
  assert.equal(heartbeat.job.workerLease.workerId, "lifecycle-worker-alpha");
  assert.ok(Date.parse(heartbeat.job.workerLease.expiresAt) > originalExpiry,
    "a valid heartbeat must extend the durable lease expiry");
  assert.equal(heartbeat.publishingEnabled, false);

  let persisted = readPersisted();
  let persistedJob = persisted.jobs.find(job => job.id === completedJob.id);
  assert.equal(persistedJob.workerLease.expiresAt, heartbeat.job.workerLease.expiresAt);
  assert.equal(persisted.audit.filter(event => event.action === "WORKER_LEASE_HEARTBEAT" && event.jobId === completedJob.id).length, 1);

  const beforeRejectedHeartbeat = fs.readFileSync(statePath);
  const rejectedHeartbeat = await post("/api/jobs/lease/heartbeat", {
    jobId: completedJob.id,
    leaseToken: "not-the-worker-lease-token",
    leaseMs: 120_000
  });
  assert.equal(rejectedHeartbeat.ok, false, "a stale or incorrect lease token must be rejected");
  assert.deepEqual(fs.readFileSync(statePath), beforeRejectedHeartbeat,
    "a rejected heartbeat must not mutate durable state or append audit history");

  const completionResponse = await post("/api/jobs/lease/complete", {
    jobId: completedJob.id,
    leaseToken: claim.leaseToken,
    nextState: "FAILED",
    result: {
      errorDetails: {
        code: "CONTROLLED_WORKER_FAILURE",
        retryable: false,
        message: "Controlled failure used to verify lease release"
      }
    }
  });
  const completion = await completionResponse.json();
  assert.equal(completionResponse.status, 200, JSON.stringify(completion));
  assert.equal(completion.job.state, "FAILED");
  assert.equal(completion.job.workerLease, null);
  assert.equal(completion.publishingEnabled, false);
  assert.ok(completion.job.leaseHistory.some(entry =>
    entry.action === "RELEASED" && entry.workerId === "lifecycle-worker-alpha"));

  persisted = readPersisted();
  persistedJob = persisted.jobs.find(job => job.id === completedJob.id);
  assert.equal(persistedJob.state, "FAILED");
  assert.equal(persistedJob.workerLease, null);
  assert.equal(persisted.audit.filter(event => event.action === "WORKER_STAGE_COMPLETED" && event.jobId === completedJob.id).length, 1);

  const staleCompletionBytes = fs.readFileSync(statePath);
  const staleCompletion = await post("/api/jobs/lease/complete", {
    jobId: completedJob.id,
    leaseToken: claim.leaseToken,
    nextState: "FAILED",
    result: { errorDetails: { retryable: false, message: "duplicate completion" } }
  });
  assert.equal(staleCompletion.ok, false, "a released lease must not complete the same stage twice");
  assert.deepEqual(fs.readFileSync(statePath), staleCompletionBytes,
    "a duplicate completion must not alter the completed job or its audit history");

  const expiringJob = await createJob(
    "lease-lifecycle-expiry-reap:future-slot-2",
    futureScheduleDate("Saturday", 2),
    "Worker lease expiry and reaping acceptance"
  );
  await claimJob(expiringJob.id, "lifecycle-worker-bravo", 5_000);

  const beforeEarlyReap = fs.readFileSync(statePath);
  const earlyReapResponse = await post("/api/jobs/lease/reap", { jobId: expiringJob.id });
  assert.equal(earlyReapResponse.status, 409, await earlyReapResponse.text());
  assert.deepEqual(fs.readFileSync(statePath), beforeEarlyReap,
    "an active lease must not be reaped or audited");

  await new Promise(resolve => setTimeout(resolve, 5_250));
  const reapResponse = await post("/api/jobs/lease/reap", { jobId: expiringJob.id });
  const reaped = await reapResponse.json();
  assert.equal(reapResponse.status, 200, JSON.stringify(reaped));
  assert.equal(reaped.job.state, "FAILED");
  assert.equal(reaped.job.workerLease, null);
  assert.equal(reaped.job.errorDetails.code, "WORKER_LEASE_EXPIRED");
  assert.equal(reaped.job.errorDetails.retryable, true);

  persisted = readPersisted();
  persistedJob = persisted.jobs.find(job => job.id === expiringJob.id);
  assert.equal(persistedJob.state, "FAILED");
  assert.equal(persistedJob.workerLease, null);
  assert.equal(persisted.audit.filter(event => event.action === "WORKER_LEASE_EXPIRED" && event.jobId === expiringJob.id).length, 1);

  const retryJob = await createJob(
    "lease-lifecycle-operator-retry:future-slot-3",
    futureScheduleDate("Saturday", 3),
    "Operator-authorized retry and dead-letter recovery acceptance"
  );
  const firstRetryClaim = await claimJob(retryJob.id, "retry-worker-first", 60_000);
  const firstFailureResponse = await post("/api/jobs/lease/complete", {
    jobId: retryJob.id,
    leaseToken: firstRetryClaim.leaseToken,
    nextState: "FAILED",
    result: { errorDetails: { code: "TRANSIENT_RENDER_FAILURE", retryable: true, message: "First controlled retryable failure" } }
  });
  const firstFailure = await firstFailureResponse.json();
  assert.equal(firstFailureResponse.status, 200, JSON.stringify(firstFailure));
  assert.equal(firstFailure.job.state, "FAILED");
  assert.equal(firstFailure.job.errorDetails.retryable, true);

  // Move only the isolated fixture's backoff timestamp into the past so this
  // integration test remains fast while exercising the real operator API.
  persisted = readPersisted();
  persisted.jobs.find(job => job.id === retryJob.id).nextRetryAt = new Date(Date.now() - 1_000).toISOString();
  fs.writeFileSync(statePath, JSON.stringify(persisted, null, 2) + "\n", { mode: 0o600 });

  const beforeUnauthorizedRetry = fs.readFileSync(statePath);
  const workerAttemptedRetry = await post("/api/jobs/lease/claim", {
    jobId: retryJob.id,
    workerId: "retry-worker-without-approval",
    leaseMs: 60_000
  });
  assert.equal(workerAttemptedRetry.status, 400);
  assert.deepEqual(fs.readFileSync(statePath), beforeUnauthorizedRetry,
    "a worker must not bypass the operator retry requirement after backoff");

  const operatorRetryResponse = await post("/api/jobs/retry", {
    jobId: retryJob.id,
    reason: "Reviewed retained failure evidence and approved the bounded retry"
  });
  const operatorRetry = await operatorRetryResponse.json();
  assert.equal(operatorRetryResponse.status, 200, JSON.stringify(operatorRetry));
  assert.equal(operatorRetry.retryAuthorized, true);
  assert.equal(operatorRetry.job.state, "QUEUED");
  assert.equal(operatorRetry.job.retryAuthorizations.length, 1);
  assert.equal(operatorRetry.job.retryAuthorizations[0].actor, "worker-lease-lifecycle@example.test");
  persisted = readPersisted();
  assert.equal(persisted.audit.filter(event => event.action === "CONTENT_JOB_RETRY_AUTHORIZED" && event.jobId === retryJob.id).length, 1);

  const secondRetryClaim = await claimJob(retryJob.id, "retry-worker-second", 60_000);
  const secondFailureResponse = await post("/api/jobs/lease/complete", {
    jobId: retryJob.id,
    leaseToken: secondRetryClaim.leaseToken,
    nextState: "FAILED",
    result: { errorDetails: { code: "TRANSIENT_RENDER_FAILURE", retryable: true, message: "Second controlled retryable failure" } }
  });
  const secondFailure = await secondFailureResponse.json();
  assert.equal(secondFailureResponse.status, 200, JSON.stringify(secondFailure));
  assert.equal(secondFailure.job.state, "DEAD_LETTER");
  assert.equal(secondFailure.job.deadLetter.reasonCode, "MAX_ATTEMPTS_EXHAUSTED");
  assert.equal(secondFailure.job.errorDetails.retryableAfterOperatorReview, true);
  assert.equal(secondFailure.job.workerLease, null);
  persisted = readPersisted();
  assert.equal(persisted.audit.filter(event => event.action === "CONTENT_JOB_DEAD_LETTERED" && event.jobId === retryJob.id).length, 1);

  const beforeRejectedOverride = fs.readFileSync(statePath);
  const rejectedOverride = await post("/api/jobs/retry", {
    jobId: retryJob.id,
    reason: "Reviewed dead-letter evidence but did not authorize an override"
  });
  assert.equal(rejectedOverride.status, 400);
  assert.deepEqual(fs.readFileSync(statePath), beforeRejectedOverride,
    "an exhausted retry limit must not be bypassed without an explicit override");

  const overrideResponse = await post("/api/jobs/retry", {
    jobId: retryJob.id,
    reason: "Reviewed dead-letter evidence and explicitly approved one final attempt",
    overrideRetryLimit: true
  });
  const override = await overrideResponse.json();
  assert.equal(overrideResponse.status, 200, JSON.stringify(override));
  assert.equal(override.job.state, "QUEUED");
  assert.equal(override.job.retryPolicy.maxAttempts, 3);
  assert.equal(override.job.retryAuthorizations.length, 2);
  assert.equal(override.job.retryAuthorizations[1].overrideRetryLimit, true);
  persisted = readPersisted();
  assert.equal(persisted.audit.filter(event => event.action === "CONTENT_JOB_DEAD_LETTER_RECOVERED" && event.jobId === retryJob.id).length, 1);

  const finalRetryClaim = await claimJob(retryJob.id, "retry-worker-final", 60_000);
  const finalFailureResponse = await post("/api/jobs/lease/complete", {
    jobId: retryJob.id,
    leaseToken: finalRetryClaim.leaseToken,
    nextState: "FAILED",
    result: { errorDetails: { code: "TRANSIENT_RENDER_FAILURE", retryable: true, message: "Final explicitly authorized attempt failed" } }
  });
  const finalFailure = await finalFailureResponse.json();
  assert.equal(finalFailureResponse.status, 200, JSON.stringify(finalFailure));
  assert.equal(finalFailure.job.state, "DEAD_LETTER");
  assert.equal(finalFailure.job.deadLetterHistory.length, 2);
  assert.equal(finalFailure.job.retryPolicy.maxAttempts, 3);
  persisted = readPersisted();
  assert.equal(persisted.audit.filter(event => event.action === "CONTENT_JOB_DEAD_LETTERED" && event.jobId === retryJob.id).length, 2);
  assert.equal(persisted.audit.filter(event => event.action === "CONTENT_JOB_RETRY_AUTHORIZED" && event.jobId === retryJob.id).length, 2);

  await stopDashboard(instance);
  instance = launchDashboard(await reservePort(), stateDir);
  await waitForReady(instance);

  const recoveredResponse = await fetch("http://127.0.0.1:" + instance.port + "/api/state", {
    headers: { "x-operator-token": token }
  });
  const recovered = await recoveredResponse.json();
  assert.equal(recoveredResponse.status, 200);
  assert.equal(recovered.jobs.find(job => job.id === completedJob.id).state, "FAILED");
  assert.equal(recovered.jobs.find(job => job.id === expiringJob.id).state, "FAILED");
  assert.equal(recovered.jobs.find(job => job.id === completedJob.id).workerLease, null);
  assert.equal(recovered.jobs.find(job => job.id === expiringJob.id).workerLease, null);
  assert.equal(recovered.publishingEnabled, false);
});
