import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();

async function startDashboard(t) {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-api-boundary-"));
  const portProbe = createServer();
  await new Promise((resolve, reject) => {
    portProbe.once("error", reject);
    portProbe.listen(0, "127.0.0.1", resolve);
  });
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));

  const token = "request-boundary-test-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "request-boundary-test@example.test",
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
    if (child.exitCode === null) child.kill("SIGTERM");
    await new Promise(resolve => {
      if (child.exitCode !== null) return resolve();
      child.once("exit", resolve);
      setTimeout(resolve, 1000);
    });
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard server failed to start: " + logs);
  return { base, token, statePath: path.join(stateDir, "dashboard-state.json") };
}

test("dashboard rejects malformed JSON, unsupported content types, and oversized bodies without state mutation", async t => {
  const { base, token, statePath } = await startDashboard(t);
  const initialState = fs.readFileSync(statePath);

  const cases = [
    {
      name: "malformed JSON",
      headers: { "content-type": "application/json", "x-operator-token": token },
      body: "{",
      expectedStatus: 400,
      expectedMessage: /valid JSON/i
    },
    {
      name: "unsupported media type",
      headers: { "content-type": "text/plain", "x-operator-token": token },
      body: "{}",
      expectedStatus: 415,
      expectedMessage: /application\/json/i
    },
    {
      name: "body exceeding 16 KiB",
      headers: { "content-type": "application/json", "x-operator-token": token },
      body: JSON.stringify({ padding: "x".repeat(16_500) }),
      expectedStatus: 413,
      expectedMessage: /exceeds 16KB/i
    }
  ];

  for (const item of cases) {
    const response = await fetch(base + "/api/jobs", {
      method: "POST",
      headers: item.headers,
      body: item.body
    });
    const responseText = await response.text();
    assert.equal(response.status, item.expectedStatus, `${item.name}: ${responseText}`);
    const payload = JSON.parse(responseText);
    assert.match(payload.error, item.expectedMessage, item.name);
    assert.ok(!responseText.includes(statePath), `${item.name} must not disclose the state-file path`);
    assert.deepEqual(fs.readFileSync(statePath), initialState,
      `${item.name} must not mutate persisted state`);
  }
});


test("authorized content-job creation persists one audit event and enforces idempotency", async t => {
  const { base, token, statePath } = await startDashboard(t);
  const request = {
    idempotencyKey: "api-integration:short-2026-11-07",
    title: "Wildlife storytelling integration test",
    topic: "How to plan a wildlife documentary",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: "2026-11-07",
    inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
  };
  const headers = { "content-type": "application/json", "x-operator-token": token };

  const createdResponse = await fetch(base + "/api/jobs", {
    method: "POST", headers, body: JSON.stringify(request)
  });
  const createdText = await createdResponse.text();
  assert.equal(createdResponse.status, 201, createdText);
  const created = JSON.parse(createdText);
  assert.equal(created.reused, false);
  assert.equal(created.publishingEnabled, false);
  assert.equal(created.job.state, "QUEUED");
  assert.equal(created.job.scheduledSlot.timezone, "Africa/Johannesburg");

  const persistedOnce = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(persistedOnce.jobs.filter(job => job.idempotencyKey === request.idempotencyKey).length, 1);
  assert.equal(persistedOnce.audit.filter(event => event.action === "CONTENT_JOB_QUEUED" && event.idempotencyKey === request.idempotencyKey).length, 1);

  const repeatedResponse = await fetch(base + "/api/jobs", {
    method: "POST", headers, body: JSON.stringify(request)
  });
  const repeatedText = await repeatedResponse.text();
  assert.equal(repeatedResponse.status, 200, repeatedText);
  const repeated = JSON.parse(repeatedText);
  assert.equal(repeated.reused, true);
  assert.equal(repeated.job.id, created.job.id);

  const conflictingResponse = await fetch(base + "/api/jobs", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...request, topic: "A different topic using the same key" })
  });
  const conflictingText = await conflictingResponse.text();
  assert.equal(conflictingResponse.status, 409, conflictingText);

  const persistedFinal = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(persistedFinal.jobs.filter(job => job.idempotencyKey === request.idempotencyKey).length, 1);
  assert.equal(persistedFinal.audit.filter(event => event.action === "CONTENT_JOB_QUEUED" && event.idempotencyKey === request.idempotencyKey).length, 1);
  assert.equal(persistedFinal.jobs.find(job => job.id === created.job.id).topic, request.topic);
});


test("authorized read-only dashboard API routes return structured responses without state mutation", async t => {
  const { base, token, statePath } = await startDashboard(t);
  const initialState = fs.readFileSync(statePath);
  const routes = [
    { path: "/api/state", expectedStatus: 200, assertPayload: payload => assert.equal(payload.publishingEnabled, false) },
    { path: "/api/facebook/idea?date=2026-10-31", expectedStatus: 200, assertPayload: payload => assert.equal(payload.publishReady, false) },
    { path: "/api/facebook/state", expectedStatus: 200 },
    { path: "/api/facebook/autonomous-status", expectedStatus: 200 },
    { path: "/api/tasks", expectedStatus: 200, assertPayload: payload => assert.equal(payload.publicPublishingEnabled, false) },
    { path: "/api/jobs/narration/review", expectedStatus: 400 },
    { path: "/api/jobs/narration/audio", expectedStatus: 400 }
  ];

  for (const route of routes) {
    const response = await fetch(base + route.path, {
      headers: { "x-operator-token": token }
    });
    const responseText = await response.text();
    assert.equal(response.status, route.expectedStatus, `${route.path}: ${responseText}`);
    const payload = JSON.parse(responseText);
    assert.equal(typeof payload, "object", `${route.path} should return JSON`);
    if (route.assertPayload) route.assertPayload(payload);
    assert.ok(!responseText.includes(statePath), `${route.path} must not disclose the state-file path`);
    assert.deepEqual(fs.readFileSync(statePath), initialState,
      `${route.path} must remain read-only`);
  }
});


test("new schedule reservation fails closed when an existing reserved queue item has no scheduled date", async t => {
  const { base, token, statePath } = await startDashboard(t);
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  state.queueItems.push({
    id: "legacy-missing-schedule-date",
    reservationType: "SCHEDULED_SLOT",
    status: "DRAFT_REVIEW_REQUIRED"
  });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
  const beforeRequest = fs.readFileSync(statePath);

  const response = await fetch(base + "/api/jobs", {
    method: "POST",
    headers: { "content-type": "application/json", "x-operator-token": token },
    body: JSON.stringify({
      idempotencyKey: "missing-reservation-date-regression:2027-04-06",
      title: "Schedule safety regression test",
      topic: "Fail closed when an existing reservation has no date",
      contentType: "long_form",
      scheduledDay: "Tuesday",
      scheduledDate: "2027-04-06",
      inputReferences: []
    })
  });
  const responseText = await response.text();
  assert.equal(response.status, 409, responseText);
  const payload = JSON.parse(responseText);
  assert.match(payload.error, /schedule conflicts with an existing reservation/i);
  assert.ok(payload.blockers.some(message => /legacy-missing-schedule-date.*missing scheduledAt/i.test(message)),
    "response must identify the malformed reservation as the blocking cause");
  assert.equal(payload.publishingEnabled, false);
  assert.deepEqual(fs.readFileSync(statePath), beforeRequest,
    "blocked scheduling must not create a job, queue item or audit event");
});
