import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createContentJob, deadLetterExhaustedJob } from "../scripts/content-job-lifecycle.mjs";
import { futureScheduleDate } from "./helpers/schedule-fixtures.mjs";

const root = process.cwd();
const token = "job-retry-acceptance-" + "x".repeat(40);
const operatorId = "job-retry-owner@example.test";

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
    const timeout = setTimeout(() => reject(new Error("Dashboard did not stop after SIGTERM: " + instance.logs)), 5000);
    instance.child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  instance.child.kill("SIGTERM");
  await exited;
}

test("operator retry API authorizes one reviewed failed job, audits once and persists across restart", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-job-retry-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  const now = new Date().toISOString();
  const job = createContentJob({
    idempotencyKey: "job-retry-api:future-slot",
    title: "Retry authorization integration fixture",
    topic: "A test-only failed job for operator retry acceptance",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: futureScheduleDate("Saturday", 1),
    inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
  }, now);
  job.state = "FAILED";
  job.startedAt = now;
  job.completedAt = now;
  job.updatedAt = now;
  job.attemptCount = 1;
  job.errorDetails = {
    code: "TEST_RENDER_FAILURE",
    message: "A test-only retryable render failure.",
    retryable: true
  };
  job.nextRetryAt = null;
  job.transitionHistory.push({
    from: "QUEUED",
    to: "FAILED",
    at: now,
    actor: "test-worker",
    reason: "Test-only render failure"
  });

  const exhausted = createContentJob({
    idempotencyKey: "job-retry-api:dead-letter-slot",
    title: "Dead-letter retry authorization integration fixture",
    topic: "A test-only exhausted job for one-attempt override acceptance",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: futureScheduleDate("Saturday", 2),
    inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
  }, now);
  exhausted.state = "FAILED";
  exhausted.startedAt = now;
  exhausted.completedAt = now;
  exhausted.updatedAt = now;
  exhausted.attemptCount = exhausted.retryPolicy.maxAttempts;
  exhausted.errorDetails = {
    code: "TEST_RENDER_FAILURE_EXHAUSTED",
    message: "A test-only exhausted render failure.",
    retryable: false,
    retryableAfterOperatorReview: true,
    retryLimitReached: true
  };
  exhausted.transitionHistory.push({
    from: "QUEUED",
    to: "FAILED",
    at: now,
    actor: "test-worker",
    reason: "Test-only retry limit exhausted"
  });
  const deadLetterJob = deadLetterExhaustedJob(exhausted, Date.parse(now));
  const concurrentJob = structuredClone(job);
  concurrentJob.id = job.id + "-concurrent";
  concurrentJob.idempotencyKey = "job-retry-api:concurrent-authorization";
  concurrentJob.title = "Concurrent retry authorization integration fixture";


  fs.writeFileSync(statePath, JSON.stringify({
    version: 1,
    queueItems: [],
    campaigns: [],
    audit: [],
    jobs: [job, deadLetterJob, concurrentJob],
    uploads: [],
    facebookDrafts: [],
    facebookPosts: [],
    facebookAttempts: []
  }, null, 2) + "\n");

  const port = await reservePort();
  const base = "http://127.0.0.1:" + port;
  let instance = launchDashboard(port, stateDir);
  t.after(async () => {
    await stopDashboard(instance).catch(() => {});
    fs.rmSync(stateDir, { recursive: true, force: true });
  });
  await waitForReady(instance);

  const headers = { "content-type": "application/json", "x-operator-token": token };
  const post = async (payload, authenticated = true) => {
    const response = await fetch(base + "/api/jobs/retry", {
      method: "POST",
      headers: authenticated ? headers : { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { status: response.status, body: await response.json() };
  };

  const before = fs.readFileSync(statePath);
  const unauthorized = await post({ jobId: job.id, reason: "Reviewed failure and safe to retry." }, false);
  assert.equal(unauthorized.status, 401);
  assert.deepEqual(fs.readFileSync(statePath), before, "unauthorized retry must not mutate durable state");

  const invalidReason = await post({ jobId: job.id, reason: "retry" });
  assert.equal(invalidReason.status, 400);
  assert.deepEqual(fs.readFileSync(statePath), before, "invalid review reason must not mutate durable state");

  const authorized = await post({
    jobId: job.id,
    reason: "Reviewed the retained test failure; retry is safe.",
    overrideRetryLimit: false
  });
  assert.equal(authorized.status, 200, JSON.stringify(authorized.body));
  assert.equal(authorized.body.retryAuthorized, true);
  assert.equal(authorized.body.publishingEnabled, false);
  assert.equal(authorized.body.job.state, "QUEUED");
  assert.equal(authorized.body.job.attemptCount, 1, "manual authorization must not pretend an attempt already ran");
  assert.equal(authorized.body.job.nextRetryAt, null);
  assert.equal(authorized.body.job.retryAuthorizations.length, 1);
  assert.deepEqual(authorized.body.job.retryAuthorizations[0], {
    actor: operatorId,
    reason: "Reviewed the retained test failure; retry is safe.",
    at: authorized.body.job.retryAuthorizations[0].at,
    attemptCount: 1,
    previousMaxAttempts: 2,
    overrideRetryLimit: false
  });
  assert.equal(Number.isFinite(Date.parse(authorized.body.job.retryAuthorizations[0].at)), true);

  const deadLetterAuthorization = await post({
    jobId: deadLetterJob.id,
    reason: "Reviewed exhausted failure evidence; authorize exactly one additional attempt.",
    overrideRetryLimit: true
  });
  assert.equal(deadLetterAuthorization.status, 200, JSON.stringify(deadLetterAuthorization.body));
  assert.equal(deadLetterAuthorization.body.retryAuthorized, true);
  assert.equal(deadLetterAuthorization.body.job.state, "QUEUED");
  assert.equal(deadLetterAuthorization.body.job.attemptCount, 2);
  assert.equal(deadLetterAuthorization.body.job.retryPolicy.maxAttempts, 3,
    "an exhausted dead-letter override must add exactly one authorized attempt");
  assert.equal(deadLetterAuthorization.body.job.retryAuthorizations.at(-1).overrideRetryLimit, true);


  const concurrentPayload = {
    jobId: concurrentJob.id,
    reason: "Concurrent requests reviewed; authorize at most one retry."
  };
  const concurrentResults = await Promise.all([
    post(concurrentPayload),
    post(concurrentPayload)
  ]);
  assert.equal(concurrentResults.filter(result => result.status === 200).length, 1,
    "concurrent retry requests must grant exactly one authorization");
  assert.equal(concurrentResults.filter(result => result.status !== 200).length, 1,
    "the duplicate concurrent retry request must be rejected");
  assert.equal(concurrentResults.every(result => result.body.publishingEnabled === false), true);

  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(persisted.jobs.find(item => item.id === job.id).state, "QUEUED");
  assert.equal(persisted.jobs.find(item => item.id === deadLetterJob.id).state, "QUEUED");
  assert.equal(persisted.jobs.find(item => item.id === deadLetterJob.id).retryPolicy.maxAttempts, 3);
  assert.equal(persisted.jobs.find(item => item.id === concurrentJob.id).state, "QUEUED");
  assert.equal(persisted.jobs.find(item => item.id === concurrentJob.id).retryAuthorizations.length, 1);
  assert.equal(persisted.audit.filter(event =>
    event.action === "CONTENT_JOB_RETRY_AUTHORIZED" && event.jobId === concurrentJob.id
  ).length, 1, "concurrent duplicate requests must not duplicate retry audit records");
  assert.equal(persisted.audit.filter(event =>
    event.action === "CONTENT_JOB_RETRY_AUTHORIZED" && event.jobId === job.id
  ).length, 1);
  assert.equal(persisted.audit.find(event =>
    event.action === "CONTENT_JOB_RETRY_AUTHORIZED" && event.jobId === job.id
  ).actor, operatorId);
  assert.equal(persisted.audit.filter(event =>
    event.action === "CONTENT_JOB_RETRY_AUTHORIZED" && event.jobId === deadLetterJob.id
  ).length, 1);
  assert.equal(persisted.audit.filter(event =>
    event.action === "CONTENT_JOB_DEAD_LETTER_RECOVERED" && event.jobId === deadLetterJob.id
  ).length, 1);

  await stopDashboard(instance);
  instance = launchDashboard(port, stateDir);
  await waitForReady(instance);
  const recoveredResponse = await fetch(base + "/api/state", { headers: { "x-operator-token": token } });
  const recovered = await recoveredResponse.json();
  assert.equal(recoveredResponse.status, 200);
  const recoveredJob = recovered.jobs.find(item => item.id === job.id);
  assert.equal(recoveredJob.state, "QUEUED");
  assert.equal(recoveredJob.retryAuthorizations.length, 1);
  assert.equal(recovered.audit.filter(event =>
    event.action === "CONTENT_JOB_RETRY_AUTHORIZED" && event.jobId === job.id
  ).length, 1);
  const recoveredConcurrent = recovered.jobs.find(item => item.id === concurrentJob.id);
  assert.equal(recoveredConcurrent.state, "QUEUED");
  assert.equal(recoveredConcurrent.retryAuthorizations.length, 1);
  assert.equal(recovered.audit.filter(event =>
    event.action === "CONTENT_JOB_RETRY_AUTHORIZED" && event.jobId === concurrentJob.id
  ).length, 1);
  const recoveredDeadLetter = recovered.jobs.find(item => item.id === deadLetterJob.id);
  assert.equal(recoveredDeadLetter.state, "QUEUED");
  assert.equal(recoveredDeadLetter.retryPolicy.maxAttempts, 3);
  assert.equal(recoveredDeadLetter.retryAuthorizations.at(-1).overrideRetryLimit, true);
  assert.equal(recovered.audit.filter(event =>
    event.action === "CONTENT_JOB_DEAD_LETTER_RECOVERED" && event.jobId === deadLetterJob.id
  ).length, 1);
  assert.equal(recovered.publishingEnabled, false);
});


test("concurrent duplicate retry authorization commits exactly once and returns conflict to the stale request", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-job-retry-race-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  const now = new Date().toISOString();
  const job = createContentJob({
    idempotencyKey: "job-retry-race:future-slot",
    title: "Concurrent retry authorization fixture",
    topic: "A test-only failed job for duplicate operator retry acceptance",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: futureScheduleDate("Saturday", 1),
    inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
  }, now);
  job.state = "FAILED";
  job.startedAt = now;
  job.completedAt = now;
  job.updatedAt = now;
  job.attemptCount = 1;
  job.nextRetryAt = null;
  job.errorDetails = {
    code: "TEST_RENDER_FAILURE",
    message: "A test-only retryable render failure.",
    retryable: true
  };
  job.transitionHistory.push({
    from: "QUEUED",
    to: "FAILED",
    at: now,
    actor: "test-worker",
    reason: "Test-only render failure"
  });
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
  }, null, 2) + "\n");

  const port = await reservePort();
  const base = "http://127.0.0.1:" + port;
  let instance = launchDashboard(port, stateDir);
  t.after(async () => {
    await stopDashboard(instance).catch(() => {});
    fs.rmSync(stateDir, { recursive: true, force: true });
  });
  await waitForReady(instance);

  const postRetry = async () => {
    const response = await fetch(base + "/api/jobs/retry", {
      method: "POST",
      headers: { "content-type": "application/json", "x-operator-token": token },
      body: JSON.stringify({
        jobId: job.id,
        reason: "Reviewed the retained failure; one retry is safe.",
        overrideRetryLimit: false
      })
    });
    return { status: response.status, body: await response.json() };
  };

  const outcomes = await Promise.all([postRetry(), postRetry()]);
  assert.deepEqual(outcomes.map(item => item.status).sort((a, b) => a - b), [200, 409],
    "one concurrent request must authorize the retry and the stale duplicate must receive HTTP 409");
  const winner = outcomes.find(item => item.status === 200);
  const conflict = outcomes.find(item => item.status === 409);
  assert.equal(winner.body.retryAuthorized, true);
  assert.equal(winner.body.publishingEnabled, false);
  assert.match(conflict.body.error, /Only failed or dead-letter jobs can receive retry authorization/i);

  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const saved = persisted.jobs.find(item => item.id === job.id);
  assert.equal(saved.state, "QUEUED");
  assert.equal(saved.retryAuthorizations.length, 1);
  assert.equal(persisted.audit.filter(item =>
    item.action === "CONTENT_JOB_RETRY_AUTHORIZED" && item.jobId === job.id
  ).length, 1, "a duplicate request must not create a second retry authorization audit event");

  await stopDashboard(instance);
  instance = launchDashboard(port, stateDir);
  await waitForReady(instance);
  const recoveredResponse = await fetch(base + "/api/state", { headers: { "x-operator-token": token } });
  const recovered = await recoveredResponse.json();
  assert.equal(recoveredResponse.status, 200);
  const recoveredJob = recovered.jobs.find(item => item.id === job.id);
  assert.equal(recoveredJob.state, "QUEUED");
  assert.equal(recoveredJob.retryAuthorizations.length, 1);
  assert.equal(recovered.audit.filter(item =>
    item.action === "CONTENT_JOB_RETRY_AUTHORIZED" && item.jobId === job.id
  ).length, 1);
  assert.equal(recovered.publishingEnabled, false);
});
