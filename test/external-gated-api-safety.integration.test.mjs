import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { futureScheduleDate } from "./helpers/schedule-fixtures.mjs";
import net from "node:net";

async function availablePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", resolve); });
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

async function startDashboard({ stateDir, uploadLogDir, token }) {
  const port = await availablePort();
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "external-gate-safety-test-operator",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: uploadLogDir,
      FACEBOOK_PUBLISH_ENABLED: "NO",
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) break;
    try { if ((await fetch(base + "/healthz")).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard did not start: " + logs);
  return { child, base, headers: { "content-type": "application/json", "x-operator-token": token }, logs: () => logs };
}

async function stopDashboard(instance) {
  if (instance.child.exitCode === null && instance.child.signalCode === null) {
    instance.child.kill("SIGTERM");
    await new Promise(resolve => instance.child.once("exit", resolve));
  }
}

test("external-gated render and upload-reconciliation routes fail closed without state, audit, render or remote-upload side effects across concurrency and restart", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-gate-state-"));
  const uploadLogDir = fs.mkdtempSync(path.join(os.tmpdir(), "external-gate-uploads-"));
  const token = "external-gate-safety-test-token-" + "x".repeat(36);
  let server = await startDashboard({ stateDir, uploadLogDir, token });
  t.after(async () => {
    await stopDashboard(server);
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(uploadLogDir, { recursive: true, force: true });
  });

  const draft = {
    id: "external-gate-render-test-draft",
    title: "Controlled render gate test",
    topic: "ethical wildlife observation",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: futureScheduleDate("Saturday", 1),
    productUrl: "https://selar.com/0u19v8u99l"
  };
  const createdResponse = await fetch(server.base + "/api/drafts", {
    method: "POST", headers: server.headers, body: JSON.stringify(draft)
  });
  const created = await createdResponse.json();
  assert.equal(createdResponse.status, 201, JSON.stringify(created));
  const jobId = created.job.id;
  const statePath = path.join(stateDir, "dashboard-state.json");
  const beforeGatedOperations = fs.readFileSync(statePath);
  const beforeState = JSON.parse(beforeGatedOperations);
  const auditCount = beforeState.audit.length;

  const renderResponses = await Promise.all([1, 2].map(() =>
    fetch(server.base + "/api/jobs/produce", {
      method: "POST", headers: server.headers, body: JSON.stringify({ jobId })
    })
  ));
  assert.deepEqual(renderResponses.map(response => response.status), [409, 409]);
  const renderBodies = await Promise.all(renderResponses.map(response => response.json()));
  assert.ok(renderBodies.every(body => body.renderStarted === false && body.publishable === false && body.publishingEnabled === false));
  assert.ok(renderBodies.every(body => /approved authoring pipeline/i.test(body.error)));
  assert.deepEqual(fs.readFileSync(statePath), beforeGatedOperations, "blocked rendering must not claim the job, lease, output or audit event");

  const reconcilePayload = {
    jobId: "no-authoritative-upload-attempt",
    metadataPath: "content/render-manifest.json",
    videoPath: "scripts/worker-runner.mjs",
    approvalPath: "run-logs/upload-approvals/no-such-approval.json"
  };
  const reconcileResponses = await Promise.all([1, 2].map(() =>
    fetch(server.base + "/api/uploads/reconcile", {
      method: "POST", headers: server.headers, body: JSON.stringify(reconcilePayload)
    })
  ));
  assert.deepEqual(reconcileResponses.map(response => response.status), [409, 409]);
  const reconcileBodies = await Promise.all(reconcileResponses.map(response => response.json()));
  assert.ok(reconcileBodies.every(body => /No matching prior upload attempt exists/i.test(body.error)));
  assert.deepEqual(fs.readFileSync(statePath), beforeGatedOperations, "no-ledger reconciliation must not create audit or upload state");
  assert.equal(fs.existsSync(path.join(uploadLogDir, "upload-attempts.json")), false, "reconciliation must not invent a prior upload ledger entry");
  assert.equal(fs.readFileSync(statePath, "utf8").includes("UPLOAD_RECONCILIATION_VERIFIED"), false);
  assert.equal(fs.readFileSync(statePath, "utf8").includes("CONTENT_RENDER_STARTED"), false);
  assert.equal(JSON.parse(fs.readFileSync(statePath, "utf8")).audit.length, auditCount);

  await stopDashboard(server);
  server = await startDashboard({ stateDir, uploadLogDir, token });
  const recoveredStateResponse = await fetch(server.base + "/api/state", { headers: server.headers });
  assert.equal(recoveredStateResponse.status, 200);
  assert.deepEqual(fs.readFileSync(statePath), beforeGatedOperations, "the exact pre-operation state must survive a real server restart");

  const restartedRender = await fetch(server.base + "/api/jobs/produce", {
    method: "POST", headers: server.headers, body: JSON.stringify({ jobId })
  });
  assert.equal(restartedRender.status, 409);
  assert.equal((await restartedRender.json()).renderStarted, false);
  const restartedReconcile = await fetch(server.base + "/api/uploads/reconcile", {
    method: "POST", headers: server.headers, body: JSON.stringify(reconcilePayload)
  });
  assert.equal(restartedReconcile.status, 409);
  assert.match((await restartedReconcile.json()).error, /No matching prior upload attempt exists/i);
  assert.deepEqual(fs.readFileSync(statePath), beforeGatedOperations);
  assert.equal(fs.existsSync(path.join(uploadLogDir, "upload-attempts.json")), false);
});
