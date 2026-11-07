import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function reservePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

test("scoped worker credential can only read dispatchable jobs and cannot access operator state", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-api-"));
  const port = await reservePort();
  const operatorToken = "operator-test-token-" + "o".repeat(32);
  const workerToken = "worker-test-token-" + "w".repeat(32);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: operatorToken,
      DASHBOARD_WORKER_TOKEN: workerToken,
      DASHBOARD_OPERATOR_ID: "test-owner@example.test",
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
    child.kill("SIGTERM");
    await new Promise(resolve => child.exitCode !== null ? resolve() : child.once("exit", resolve));
    fs.rmSync(stateDir, { recursive: true, force: true });
  });
  const base = "http://127.0.0.1:" + port;
  let started = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) { started = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(started, true, "dashboard failed to start: " + logs);

  const statePath = path.join(stateDir, "dashboard-state.json");
  const initialState = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const approvedPlan = {
    status: "APPROVED_PLAN_ONLY",
    review: { decision: "APPROVE", approvalSha256: "a".repeat(64) }
  };
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(now);
  const localNowParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(now);
  const localNowMinutes = Number(localNowParts.find(part => part.type === "hour").value) * 60 +
    Number(localNowParts.find(part => part.type === "minute").value);
  const localTime = minutesAgo => {
    const minuteOfDay = localNowMinutes - minutesAgo;
    assert.ok(minuteOfDay >= 0, "test must run after the first three minutes of the Johannesburg day");
    return String(Math.floor(minuteOfDay / 60)).padStart(2, "0") + ":" +
      String(minuteOfDay % 60).padStart(2, "0");
  };
  initialState.jobs.push(
    {
      kind: "CONTENT_PRODUCTION",
      id: "queued-without-approved-plan",
      state: "QUEUED",
      contentType: "short",
      createdAt: "2026-11-02T18:00:00.000Z",
      authoring: { productionPlan: { status: "DRAFT" } }
    },
    {
      kind: "CONTENT_PRODUCTION",
      id: "queued-with-approved-plan",
      state: "QUEUED",
      contentType: "short",
      createdAt: "2026-11-02T18:01:00.000Z",
      scheduledSlot: { date: today, time: localTime(3), timezone: "Africa/Johannesburg" },
      authoring: { productionPlan: approvedPlan }
    },
    {
      kind: "CONTENT_PRODUCTION",
      id: "queued-approved-later-slot",
      state: "QUEUED",
      contentType: "long_form",
      createdAt: "2026-11-02T17:59:00.000Z",
      scheduledSlot: { date: today, time: localTime(1), timezone: "Africa/Johannesburg" },
      authoring: { productionPlan: structuredClone(approvedPlan) }
    },
    {
      kind: "CONTENT_PRODUCTION",
      id: "queued-approved-earlier-slot",
      state: "QUEUED",
      contentType: "long_form",
      createdAt: "2026-11-02T18:02:00.000Z",
      scheduledSlot: { date: today, time: localTime(2), timezone: "Africa/Johannesburg" },
      authoring: { productionPlan: structuredClone(approvedPlan) }
    },
    {
      kind: "CONTENT_PRODUCTION",
      id: "queued-legacy-without-authoring",
      state: "QUEUED",
      contentType: "short",
      createdAt: "2026-11-02T18:03:00.000Z",
      scheduledSlot: { date: today, time: localTime(1), timezone: "Africa/Johannesburg" }
    }
  );
  fs.writeFileSync(statePath, JSON.stringify(initialState, null, 2) + "\n");
  const before = fs.readFileSync(statePath);
  const workerHeaders = { "x-worker-token": workerToken, "x-worker-id": "worker-api-test" };
  const dispatchable = await fetch(base + "/api/jobs/dispatchable", { headers: workerHeaders });
  assert.equal(dispatchable.status, 200);
  const payload = await dispatchable.json();
  assert.deepEqual(payload.jobs, [
    {
      id: "queued-with-approved-plan",
      contentType: "short",
      state: "QUEUED",
      createdAt: "2026-11-02T18:01:00.000Z"
    },
    {
      id: "queued-approved-earlier-slot",
      contentType: "long_form",
      state: "QUEUED",
      createdAt: "2026-11-02T18:02:00.000Z"
    },
    {
      id: "queued-approved-later-slot",
      contentType: "long_form",
      state: "QUEUED",
      createdAt: "2026-11-02T17:59:00.000Z"
    }
  ], "approved jobs must be dispatched by scheduled Africa/Johannesburg slot, not insertion or creation order");
  assert.equal(payload.queuedCount, 5);
  assert.equal(payload.queuedWithoutApprovedRenderPlan, 2);
  assert.equal(payload.dispatchableCount, 3);
  assert.equal(payload.queuedWithoutValidSlot, 1);
  const limited = await fetch(base + "/api/jobs/dispatchable?limit=2", { headers: workerHeaders });
  const limitedPayload = await limited.json();
  assert.equal(limited.status, 200);
  assert.deepEqual(limitedPayload.jobs.map(job => job.id), [
    "queued-with-approved-plan",
    "queued-approved-earlier-slot"
  ], "the dispatch limit must apply after chronological ordering");
  assert.equal(payload.publishingEnabled, false);
  assert.equal(payload.readOnly, true);

  const queueDiagnostics = await fetch(base + "/api/jobs/queue-diagnostics?limit=10", {
    headers: { "x-operator-token": operatorToken }
  });
  assert.equal(queueDiagnostics.status, 200, "queue diagnostics must be available to the authenticated operator");
  const diagnostics = await queueDiagnostics.json();
  assert.equal(diagnostics.queuedCount, 5);
  assert.equal(diagnostics.dispatchableCount, 3);
  assert.equal(diagnostics.heldCount, 2);
  assert.equal(diagnostics.publishingEnabled, false);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.timezone, "Africa/Johannesburg");
  const byId = Object.fromEntries(diagnostics.items.map(item => [item.id, item]));
  assert.equal(byId["queued-with-approved-plan"].status, "DISPATCHABLE");
  assert.equal(byId["queued-without-approved-plan"].status, "HELD");
  assert.ok(byId["queued-without-approved-plan"].blockers.includes("APPROVED_RENDER_PLAN_MISSING"));
  assert.equal(byId["queued-legacy-without-authoring"].status, "HELD");
  assert.ok(byId["queued-legacy-without-authoring"].blockers.includes("APPROVED_AUTHORING_MISSING"));
  assert.ok(byId["queued-legacy-without-authoring"].blockers.includes("APPROVED_RENDER_PLAN_MISSING"));
  const workerDiagnostics = await fetch(base + "/api/jobs/queue-diagnostics", { headers: workerHeaders });
  assert.equal(workerDiagnostics.status, 401, "worker credentials must not expose operator queue diagnostics");
  const limitedDiagnostics = await fetch(base + "/api/jobs/queue-diagnostics?limit=2", {
    headers: { "x-operator-token": operatorToken }
  });
  const limitedBody = await limitedDiagnostics.json();
  assert.equal(limitedDiagnostics.status, 200);
  assert.equal(limitedBody.returnedCount, 2);
  assert.equal(limitedBody.truncated, true);
  assert.equal(fs.readFileSync(statePath).toString(), before.toString(),
    "queue diagnostics must remain read-only and leave persisted state byte-for-byte unchanged");

  const concurrentReads = await Promise.all(Array.from({ length: 4 }, () =>
    fetch(base + "/api/jobs/dispatchable", { headers: workerHeaders }).then(async response => ({
      status: response.status,
      body: await response.json()
    }))
  ));
  assert.ok(concurrentReads.every(result => result.status === 200));
  assert.ok(concurrentReads.every(result => JSON.stringify(result.body) === JSON.stringify(payload)),
    "concurrent dispatch listings must return the same read-only view");
  assert.equal(fs.readFileSync(statePath).toString(), before.toString(), "concurrent dispatch listings must not mutate persisted state");

  const invalidLimit = await fetch(base + "/api/jobs/dispatchable?limit=101", { headers: workerHeaders });
  assert.equal(invalidLimit.status, 400, "worker dispatch query must enforce its bounded result limit");
  const invalidWorkerIdentity = await fetch(base + "/api/jobs/dispatchable", {
    headers: { "x-worker-token": workerToken, "x-worker-id": "x" }
  });
  assert.equal(invalidWorkerIdentity.status, 400, "worker operations must require a valid worker identity");
  const unsupportedWorkerOperation = await fetch(base + "/api/jobs/lease/claim", {
    method: "POST",
    headers: { ...workerHeaders, "content-type": "application/json" },
    body: JSON.stringify({ jobId: "not-authorized", workerId: "worker-api-test" })
  });
  assert.equal(unsupportedWorkerOperation.status, 401, "worker credentials must not grant direct lease or general operator operations");
  const unknownProductionJob = await fetch(base + "/api/jobs/produce", {
    method: "POST",
    headers: { ...workerHeaders, "content-type": "application/json" },
    body: JSON.stringify({ jobId: "unknown-production-job" })
  });
  assert.equal(unknownProductionJob.status, 404, "scoped worker dispatch must return 404 for an unknown job");
  const unapprovedLegacyProduction = await fetch(base + "/api/jobs/produce", {
    method: "POST",
    headers: { ...workerHeaders, "content-type": "application/json" },
    body: JSON.stringify({ jobId: "queued-legacy-without-authoring" })
  });
  assert.equal(unapprovedLegacyProduction.status, 409,
    "a queued job without the approved authoring pipeline must not start rendering");
  assert.match((await unapprovedLegacyProduction.json()).error,
    /not linked to the required approved authoring pipeline/);
  assert.equal(fs.readFileSync(statePath).toString(), before.toString(),
    "blocked production without approved authoring must not mutate job state, audit or worker lease");
  assert.equal(fs.existsSync(path.join(process.cwd(), "content", "job-render-manifests", "queued-legacy-without-authoring.json")), false,
    "blocked production must not create a render manifest");
  assert.equal(fs.existsSync(path.join(process.cwd(), "media", "jobs", "queued-legacy-without-authoring")), false,
    "blocked production must not create a per-job media directory");

  // A retained output or manifest is evidence of a previous/partial render.
  // It must move the job out of QUEUED so the worker cannot poll it forever.
  const recoveryJobs = [
    {
      kind: "CONTENT_PRODUCTION", id: "recovery-output-job", state: "QUEUED",
      contentType: "short", createdAt: "2026-11-07T10:00:00.000Z",
      scheduledSlot: { date: today, time: localTime(3), timezone: "Africa/Johannesburg" },
      authoring: { productionPlan: structuredClone(approvedPlan) },
      transitionHistory: [{ from: null, to: "QUEUED", at: new Date().toISOString(), actor: "test", reason: "fixture" }],
      attemptCount: 0, retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true }
    },
    {
      kind: "CONTENT_PRODUCTION", id: "recovery-manifest-job", state: "QUEUED",
      contentType: "short", createdAt: "2026-11-07T10:01:00.000Z",
      scheduledSlot: { date: today, time: localTime(3), timezone: "Africa/Johannesburg" },
      authoring: { productionPlan: structuredClone(approvedPlan) },
      transitionHistory: [{ from: null, to: "QUEUED", at: new Date().toISOString(), actor: "test", reason: "fixture" }],
      attemptCount: 0, retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true }
    }
  ];
  const recoveryState = JSON.parse(fs.readFileSync(statePath, "utf8"));
  recoveryState.jobs.push(...recoveryJobs);
  fs.writeFileSync(statePath, JSON.stringify(recoveryState, null, 2) + "\n");
  const outputDirectory = path.join(process.cwd(), "media", "jobs", "recovery-output-job");
  const manifestDirectory = path.join(process.cwd(), "content", "job-render-manifests");
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.mkdirSync(manifestDirectory, { recursive: true });
  const retainedOutput = path.join(outputDirectory, "final.mp4");
  const retainedManifest = path.join(manifestDirectory, "recovery-manifest-job.json");
  fs.writeFileSync(retainedOutput, "retained render evidence");
  fs.writeFileSync(retainedManifest, JSON.stringify({ retained: true }));
  t.after(() => {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
    fs.rmSync(retainedManifest, { force: true });
  });

  for (const [jobId, expectedArtifact] of [
    ["recovery-output-job", "media/jobs/recovery-output-job/final.mp4"],
    ["recovery-manifest-job", "content/job-render-manifests/recovery-manifest-job.json"]
  ]) {
    const response = await fetch(base + "/api/jobs/produce", {
      method: "POST",
      headers: { ...workerHeaders, "content-type": "application/json" },
      body: JSON.stringify({ jobId })
    });
    assert.equal(response.status, 409);
    const payload = await response.json();
    assert.equal(payload.jobState, "FAILED");
    assert.equal(payload.recoveryRequired, true);
    assert.equal(payload.requiresOperatorRetry, true);
    assert.equal(payload.retryAllowed, false);
    assert.equal(payload.artifactPath, expectedArtifact);
  }
  const afterRecovery = JSON.parse(fs.readFileSync(statePath, "utf8"));
  for (const jobId of ["recovery-output-job", "recovery-manifest-job"]) {
    const job = afterRecovery.jobs.find(item => item.id === jobId);
    assert.equal(job.state, "FAILED", "retained render evidence must remove the job from automatic dispatch");
    assert.equal(job.errorDetails.code.startsWith("RENDER_"), true);
    assert.equal(job.errorDetails.retryable, true, "a retry may be authorized only after operator reconciliation");
    assert.equal(job.errorDetails.retryableAfterOperatorReview, true);
    assert.ok(afterRecovery.audit.some(item => item.action === "CONTENT_RENDER_RECOVERY_REQUIRED" && item.jobId === jobId));
  }
  const remainingDispatchable = await fetch(base + "/api/jobs/dispatchable", { headers: workerHeaders });
  const remainingJobs = (await remainingDispatchable.json()).jobs;
  assert.equal(remainingJobs.some(item => item.id.startsWith("recovery-")), false,
    "recovery-required jobs must no longer be returned to the worker poller");

  const operatorState = await fetch(base + "/api/state", { headers: workerHeaders });
  assert.equal(operatorState.status, 401, "worker credential must not grant general operator API access");
  const ownerState = await fetch(base + "/api/state", { headers: { "x-operator-token": operatorToken } });
  assert.equal(ownerState.status, 200);
  const ownerPayload = await ownerState.json();
  assert.ok(ownerPayload.jobs.some(item => item.id === "recovery-output-job" && item.state === "FAILED"));
  assert.ok(ownerPayload.jobs.some(item => item.id === "recovery-manifest-job" && item.state === "FAILED"));
});
