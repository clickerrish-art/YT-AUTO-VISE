import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("dashboard runs only allowlisted real validation commands and persists results", { skip: process.env.DASHBOARD_TEST_CHILD === "1" }, async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-tasks-"));
  fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), JSON.stringify({ version: 1, queueItems: [], audit: [], jobs: [{ id: "interrupted-1", kind: "VALIDATION_TASK", taskId: "validate-schedule", status: "RUNNING" }, { id: "upload-interrupted-1", kind: "CONTENT_PRODUCTION", title: "Uncertain upload", state: "UPLOADING_PRIVATE", transitionHistory: [], attemptCount: 1 }], uploads: [] }));
  const port = 28000 + Math.floor(Math.random() * 10000);
  const token = "task-test-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_OPERATOR_ID: "test-task-operator", DASHBOARD_STATE_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => { child.kill("SIGTERM"); fs.rmSync(stateDir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) break;
    try { if ((await fetch(base + "/healthz")).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server did not start: " + logs);
  const readinessResponse = await fetch(base + "/readyz");
  assert.equal(readinessResponse.status, 503, "production readiness must report missing owner prerequisites");
  const readiness = await readinessResponse.json();
  assert.equal(readiness.ready, false);
  assert.equal(readiness.publishingEnabled, false);
  assert.ok(Array.isArray(readiness.blockers));
  assert.ok(readiness.blockers.length > 0);
  const port2 = port + 10_000;
  const child2 = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_OPERATOR_ID: "test-task-operator", DASHBOARD_STATE_DIR: stateDir, PORT: String(port2), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs2 = "";
  child2.stdout.on("data", chunk => { logs2 += chunk.toString(); });
  child2.stderr.on("data", chunk => { logs2 += chunk.toString(); });
  t.after(() => child2.kill("SIGTERM"));
  const base2 = `http://127.0.0.1:${port2}`;
  let ready2 = false;
  for (let i = 0; i < 60; i++) {
    if (child2.exitCode !== null) break;
    try { if ((await fetch(base2 + "/healthz")).ok) { ready2 = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready2, true, "second process did not start: " + logs2);
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const recoveredState = await fetch(base + "/api/state", { headers });
  assert.equal(recoveredState.status, 200);
  const recoveredBody = await recoveredState.json();
  assert.equal(recoveredBody.jobs.find(job => job.id === "interrupted-1").status, "RECOVERY_REQUIRED");
  assert.ok(recoveredBody.audit.some(event => event.action === "TASK_INTERRUPTED_RECOVERY_REQUIRED" && event.jobId === "interrupted-1"));
  const uncertainUpload = recoveredBody.jobs.find(job => job.id === "upload-interrupted-1");
  assert.equal(uncertainUpload.state, "RECOVERY_REQUIRED");
  assert.match(uncertainUpload.errorDetails.message, /Reconcile with YouTube before any retry/);
  assert.equal(recoveredBody.campaignValidation.ok, true);
  assert.equal(recoveredBody.campaigns.find(campaign => campaign.type === "safari_affiliate").status, "INACTIVE");
  assert.equal(recoveredBody.campaigns.find(campaign => campaign.type === "safari_affiliate").destinationUrl, "");
  const jobInput = { idempotencyKey: "test-job:001", title: "Wildlife storytelling", topic: "How to plan a wildlife documentary", contentType: "short", scheduledDay: "Saturday", scheduledDate: "2026-10-24", inputReferences: ["content/short-001-wildlife-video-storytelling.md"] };
  const createJob = await fetch(base + "/api/jobs", { method: "POST", headers, body: JSON.stringify(jobInput) });
  const createdJobText = await createJob.text();
  assert.equal(createJob.status, 201, createdJobText);
  const createdJob = JSON.parse(createdJobText).job;
  assert.equal(createdJob.state, "QUEUED");
  assert.equal(createdJob.publishingEnabled, false);
  const duplicateJob = await fetch(base + "/api/jobs", { method: "POST", headers, body: JSON.stringify(jobInput) });
  assert.equal(duplicateJob.status, 200);
  assert.equal((await duplicateJob.json()).reused, true);
  const repeatedScheduleEvent = await fetch(base + "/api/jobs", { method: "POST", headers, body: JSON.stringify({ ...jobInput, idempotencyKey: "schedule-event:retry" }) });
  assert.equal(repeatedScheduleEvent.status, 200);
  const repeatedScheduleBody = await repeatedScheduleEvent.json();
  assert.equal(repeatedScheduleBody.reservationReused, true, "same dated slot and same content must reuse the original reservation");
  assert.equal(repeatedScheduleBody.job.id, createdJob.id);
  const conflictingJob = await fetch(base + "/api/jobs", { method: "POST", headers, body: JSON.stringify({ ...jobInput, topic: "Different inputs" }) });
  assert.equal(conflictingJob.status, 409);
  const slotConflict = await fetch(base + "/api/jobs", { method: "POST", headers, body: JSON.stringify({ ...jobInput, idempotencyKey: "test-job:other", title: "Conflicting slot" }) });
  assert.equal(slotConflict.status, 409, "different jobs must not reserve the same dated slot");
  const concurrentInput = { ...jobInput, idempotencyKey: "test-job:concurrent", scheduledDate: "2026-10-31", title: "Concurrent duplicate" };
  const concurrent = await Promise.all([fetch(base + "/api/jobs", { method: "POST", headers, body: JSON.stringify(concurrentInput) }), fetch(base2 + "/api/jobs", { method: "POST", headers, body: JSON.stringify(concurrentInput) })]);
  assert.deepEqual(concurrent.map(response => response.status).sort(), [200, 201]);
  const concurrentBodies = await Promise.all(concurrent.map(response => response.json()));
  assert.equal(concurrentBodies[0].job.id, concurrentBodies[1].job.id, "concurrent identical requests must reuse one job");
  const transition = await fetch(base + "/api/jobs/transition", { method: "POST", headers, body: JSON.stringify({ jobId: createdJob.id, nextState: "GENERATING", reason: "Test transition" }) });
  const transitionText = await transition.text();
  assert.equal(transition.status, 200, transitionText);
  assert.equal(JSON.parse(transitionText).job.state, "GENERATING");
  const unsafeTransition = await fetch(base + "/api/jobs/transition", { method: "POST", headers, body: JSON.stringify({ jobId: createdJob.id, nextState: "UPLOADING_PRIVATE", reason: "Must remain guarded" }) });
  assert.equal(unsafeTransition.status, 400);
  const denied = await fetch(base + "/api/tasks/run", { method: "POST", headers, body: JSON.stringify({ taskId: "upload:private" }) });
  assert.equal(denied.status, 400, "arbitrary commands must not be executable");
  const response = await fetch(base + "/api/tasks/run", { method: "POST", headers, body: JSON.stringify({ taskId: "validate-schedule" }) });
  const responseText = await response.text();
  assert.equal(response.status, 200, responseText);
  const result = JSON.parse(responseText);
  assert.equal(result.publicPublishingEnabled, false);
  assert.equal(result.job.status, "SUCCEEDED", result.job.output);
  assert.equal(result.job.exitCode, 0);
  const saved = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.ok(saved.jobs.some(job => job.id === result.job.id && job.status === "SUCCEEDED"));
  assert.ok(saved.audit.some(event => event.action === "VALIDATION_TASK_SUCCEEDED" && event.jobId === result.job.id));
  assert.equal(saved.jobs.find(job => job.id === result.job.id).publishingEnabled, false);
  const campaignCheck = await fetch(base + "/api/tasks/run", { method: "POST", headers, body: JSON.stringify({ taskId: "validate-campaigns" }) });
  const campaignText = await campaignCheck.text();
  assert.equal(campaignCheck.status, 200, campaignText);
  const campaignResult = JSON.parse(campaignText);
  assert.equal(campaignResult.job.status, "SUCCEEDED", campaignResult.job.output);
  assert.match(campaignResult.job.output, /Selar and Safari campaign records are isolated/);

  // Two independent dashboard processes share one durable state directory.
  // A long-running allowlisted task must be claimed once; the other process
  // must see the persisted RUNNING record rather than launching a duplicate.
  const duplicateTaskRequests = await Promise.all([
    fetch(base + "/api/tasks/run", { method: "POST", headers, body: JSON.stringify({ taskId: "test-suite" }) }),
    fetch(base2 + "/api/tasks/run", { method: "POST", headers, body: JSON.stringify({ taskId: "test-suite" }) })
  ]);
  assert.deepEqual(duplicateTaskRequests.map(response => response.status).sort(), [200, 409]);
  const duplicateTaskBodies = await Promise.all(duplicateTaskRequests.map(response => response.json()));
  const rejectedDuplicate = duplicateTaskBodies.find(body => body.error);
  assert.match(rejectedDuplicate.error, /durable RUNNING record|already running/i);
  assert.equal(rejectedDuplicate.retryAllowed, false);
  const afterConcurrentTasks = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  const testSuiteJobs = afterConcurrentTasks.jobs.filter(job => job.kind === "VALIDATION_TASK" && job.taskId === "test-suite");
  assert.equal(testSuiteJobs.length, 1, "concurrent task submissions must create one durable task record");
  assert.equal(testSuiteJobs[0].status, "SUCCEEDED", testSuiteJobs[0].output);
  assert.ok(afterConcurrentTasks.audit.some(event => event.action === "VALIDATION_TASK_SUCCEEDED" && event.jobId === testSuiteJobs[0].id));
});
