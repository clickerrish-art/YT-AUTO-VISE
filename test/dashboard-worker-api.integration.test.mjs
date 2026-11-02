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
  const before = fs.readFileSync(statePath);
  const workerHeaders = { "x-worker-token": workerToken, "x-worker-id": "worker-api-test" };
  const dispatchable = await fetch(base + "/api/jobs/dispatchable", { headers: workerHeaders });
  assert.equal(dispatchable.status, 200);
  const payload = await dispatchable.json();
  assert.deepEqual(payload.jobs, []);
  assert.equal(payload.publishingEnabled, false);
  assert.equal(payload.readOnly, true);
  assert.equal(fs.readFileSync(statePath).toString(), before.toString(), "dispatch listing must not mutate persisted state");

  const operatorState = await fetch(base + "/api/state", { headers: workerHeaders });
  assert.equal(operatorState.status, 401, "worker credential must not grant general operator API access");
  const ownerState = await fetch(base + "/api/state", { headers: { "x-operator-token": operatorToken } });
  assert.equal(ownerState.status, 200);
  assert.equal(fs.readFileSync(statePath).toString(), before.toString());
});
