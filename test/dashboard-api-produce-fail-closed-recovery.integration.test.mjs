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

test("legacy worker production remains fail-closed across concurrent retries and server restart", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-produce-recovery-"));
  const port = await reservePort();
  const operatorToken = "produce-recovery-operator-" + "o".repeat(32);
  const workerToken = "produce-recovery-worker-" + "w".repeat(32);
  const base = "http://127.0.0.1:" + port;
  const statePath = path.join(stateDir, "dashboard-state.json");
  const jobId = "legacy-no-authoring-" + process.pid;
  const workerHeaders = {
    "x-worker-token": workerToken,
    "x-worker-id": "produce-recovery-test",
    "content-type": "application/json"
  };
  let child;
  let logs = "";

  const start = async () => {
    logs = "";
    child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DASHBOARD_OPERATOR_TOKEN: operatorToken,
        DASHBOARD_WORKER_TOKEN: workerToken,
        DASHBOARD_OPERATOR_ID: "produce-recovery-test@example.test",
        DASHBOARD_STATE_DIR: stateDir,
        UPLOAD_LOG_DIR: stateDir,
        PORT: String(port),
        DASHBOARD_HOST: "127.0.0.1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    child.stdout.on("data", chunk => { logs += chunk.toString(); });
    child.stderr.on("data", chunk => { logs += chunk.toString(); });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error("Dashboard server exited: " + logs);
      try {
        if ((await fetch(base + "/healthz")).ok) return;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error("Dashboard server startup timed out: " + logs);
  };
  const stop = async () => {
    if (!child || child.exitCode !== null) return;
    const current = child;
    current.kill("SIGTERM");
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Dashboard shutdown timed out: " + logs)), 5000);
      current.once("exit", () => { clearTimeout(timer); resolve(); });
    });
  };
  const produce = async () => {
    const response = await fetch(base + "/api/jobs/produce", {
      method: "POST",
      headers: workerHeaders,
      body: JSON.stringify({ jobId })
    });
    return { status: response.status, body: await response.json() };
  };

  t.after(async () => {
    await stop().catch(() => {});
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  await start();
  const initial = JSON.parse(fs.readFileSync(statePath, "utf8"));
  initial.jobs.push({
    kind: "CONTENT_PRODUCTION",
    id: jobId,
    state: "QUEUED",
    contentType: "short",
    createdAt: "2026-11-06T00:00:00.000Z"
  });
  fs.writeFileSync(statePath, JSON.stringify(initial, null, 2) + "\n");
  const before = fs.readFileSync(statePath);

  const concurrent = await Promise.all([produce(), produce()]);
  assert.deepEqual(concurrent.map(result => result.status), [409, 409]);
  for (const result of concurrent) {
    assert.match(result.body.error, /not linked to the required approved authoring pipeline/);
    assert.equal(result.body.renderStarted, false);
    assert.equal(result.body.publishingEnabled, false);
  }
  assert.deepEqual(fs.readFileSync(statePath), before,
    "concurrent legacy-production attempts must preserve job, lease and audit state byte-for-byte");
  assert.equal(fs.existsSync(path.join(process.cwd(), "content", "job-render-manifests", jobId + ".json")), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), "media", "jobs", jobId)), false);

  await stop();
  await start();
  const afterRestart = await produce();
  assert.equal(afterRestart.status, 409);
  assert.match(afterRestart.body.error, /not linked to the required approved authoring pipeline/);
  assert.equal(afterRestart.body.renderStarted, false);
  assert.equal(afterRestart.body.publishingEnabled, false);
  assert.deepEqual(fs.readFileSync(statePath), before,
    "server restart must not convert a legacy job into an executable production job");
  assert.equal(fs.existsSync(path.join(process.cwd(), "content", "job-render-manifests", jobId + ".json")), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), "media", "jobs", jobId)), false);
});
