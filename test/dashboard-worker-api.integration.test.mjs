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
  const localTime = minutesAgo => new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).format(new Date(Date.now() - minutesAgo * 60_000));
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
      scheduledSlot: { date: today, time: localTime(15), timezone: "Africa/Johannesburg" },
      authoring: { productionPlan: approvedPlan }
    },
    {
      kind: "CONTENT_PRODUCTION",
      id: "queued-approved-later-slot",
      state: "QUEUED",
      contentType: "long_form",
      createdAt: "2026-11-02T17:59:00.000Z",
      scheduledSlot: { date: today, time: localTime(5), timezone: "Africa/Johannesburg" },
      authoring: { productionPlan: structuredClone(approvedPlan) }
    },
    {
      kind: "CONTENT_PRODUCTION",
      id: "queued-approved-earlier-slot",
      state: "QUEUED",
      contentType: "long_form",
      createdAt: "2026-11-02T18:02:00.000Z",
      scheduledSlot: { date: today, time: localTime(10), timezone: "Africa/Johannesburg" },
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

  const operatorState = await fetch(base + "/api/state", { headers: workerHeaders });
  assert.equal(operatorState.status, 401, "worker credential must not grant general operator API access");
  const ownerState = await fetch(base + "/api/state", { headers: { "x-operator-token": operatorToken } });
  assert.equal(ownerState.status, 200);
  assert.equal(fs.readFileSync(statePath).toString(), before.toString());
});
