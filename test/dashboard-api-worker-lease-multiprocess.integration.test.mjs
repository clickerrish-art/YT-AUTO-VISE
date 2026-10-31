import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const token = "worker-lease-multiprocess-" + "x".repeat(40);

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
      DASHBOARD_OPERATOR_ID: "worker-lease-acceptance@example.test",
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
    if (instance.child.exitCode !== null) {
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

async function killAbruptly(instance) {
  if (!instance || instance.child.exitCode !== null || instance.child.signalCode !== null) return;
  const exited = new Promise(resolve => instance.child.once("exit", resolve));
  instance.child.kill("SIGKILL");
  await exited;
}

test("two independent dashboard processes cannot claim the same worker job and restart requires reconciliation", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-lease-multiprocess-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  const firstPort = await reservePort();
  const secondPort = await reservePort();
  const first = launchDashboard(firstPort, stateDir);
  let second;
  let recovery;
  t.after(async () => {
    await killAbruptly(first);
    await killAbruptly(second);
    await killAbruptly(recovery);
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  await waitForReady(first);
  second = launchDashboard(secondPort, stateDir);
  await waitForReady(second);

  const headers = { "content-type": "application/json", "x-operator-token": token };
  const createResponse = await fetch("http://127.0.0.1:" + firstPort + "/api/jobs", {
    method: "POST",
    headers,
    body: JSON.stringify({
      idempotencyKey: "multiprocess-worker-lease:short:2026-11-07",
      title: "Worker lease concurrency acceptance",
      topic: "How wildlife researchers distinguish observation from interpretation",
      contentType: "short",
      scheduledDay: "Saturday",
      scheduledDate: "2026-11-07",
      inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
    })
  });
  const created = await createResponse.json();
  assert.ok([200, 201].includes(createResponse.status), JSON.stringify(created));
  const jobId = created.job.id;
  assert.ok(jobId);

  const claim = (instance, workerId) => fetch("http://127.0.0.1:" + instance.port + "/api/jobs/lease/claim", {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId, workerId, leaseMs: 60_000 })
  });
  const responses = await Promise.all([
    claim(first, "worker-process-alpha"),
    claim(second, "worker-process-bravo")
  ]);
  const outcomes = await Promise.all(responses.map(async response => ({
    status: response.status,
    body: await response.json()
  })));
  const successes = outcomes.filter(item => item.status === 200);
  const rejected = outcomes.filter(item => item.status !== 200);
  assert.equal(successes.length, 1, "exactly one independent process must acquire the lease");
  assert.equal(rejected.length, 1, "the competing process must be rejected");
  assert.match(rejected[0].body.error ?? "", /active worker lease|busy in another process/i);

  const winnerId = successes[0].body.job.workerLease.workerId;
  assert.ok(["worker-process-alpha", "worker-process-bravo"].includes(winnerId));
  assert.equal(typeof successes[0].body.leaseToken, "string");
  assert.ok(successes[0].body.leaseToken.length >= 20);

  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const persistedJob = persisted.jobs.find(job => job.id === jobId);
  assert.equal(persistedJob.state, "GENERATING");
  assert.equal(persistedJob.workerLease.workerId, winnerId);
  assert.equal(persisted.audit.filter(event => event.action === "WORKER_LEASE_CLAIMED" && event.jobId === jobId).length, 1);

  // Kill both application processes without graceful shutdown. A fresh process
  // must not treat the interrupted GENERATING stage as safe to retry.
  await Promise.all([killAbruptly(first), killAbruptly(second)]);
  recovery = launchDashboard(await reservePort(), stateDir);
  await waitForReady(recovery);

  const stateResponse = await fetch("http://127.0.0.1:" + recovery.port + "/api/state", {
    headers: { "x-operator-token": token }
  });
  const stateText = await stateResponse.text();
  assert.equal(stateResponse.status, 200, stateText);
  const recoveredState = JSON.parse(stateText);
  const recoveredJob = recoveredState.jobs.find(job => job.id === jobId);
  assert.equal(recoveredJob.state, "RECOVERY_REQUIRED");
  assert.equal(recoveredJob.workerLease, null);
  assert.equal(recoveredJob.errorDetails.code, "INTERRUPTED_DURING_ACTIVE_STAGE");
  assert.equal(recoveredState.audit.filter(event => event.action === "WORKER_LEASE_CLAIMED" && event.jobId === jobId).length, 1);
  assert.equal(recoveredState.audit.filter(event => event.action === "CONTENT_JOB_RECOVERY_REQUIRED" && event.jobId === jobId).length, 1);
  assert.equal(recoveredState.publishingEnabled, false);
});
