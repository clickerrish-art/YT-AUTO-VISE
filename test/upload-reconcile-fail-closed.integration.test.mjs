import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();

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

test("upload reconciliation refuses to invent a remote attempt or start a new upload", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-upload-reconcile-"));
  const port = await reservePort();
  const token = "upload-reconcile-fail-closed-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "upload-reconcile-test@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      YOUTUBE_CLIENT_ID: "",
      YOUTUBE_CLIENT_SECRET: "",
      YOUTUBE_REFRESH_TOKEN: "",
      SONICVHIBEZ_CHANNEL_ID: "",
      YOUTUBE_EMERGENCY_STOP: "YES"
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
      setTimeout(resolve, 1500);
    });
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = "http://127.0.0.1:" + port;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard server failed to start: " + logs);

  const statePath = path.join(stateDir, "dashboard-state.json");
  const ledgerPath = path.join(stateDir, "upload-attempts.json");
  const before = fs.readFileSync(statePath);
  const response = await fetch(base + "/api/uploads/reconcile", {
    method: "POST",
    headers: { "x-operator-token": token, "content-type": "application/json" },
    body: JSON.stringify({
      jobId: "no-authoritative-upload-attempt",
      metadataPath: "config/weekly-content-plan.json",
      videoPath: "config/weekly-content-plan.json",
      approvalPath: "config/weekly-content-plan.json"
    })
  });
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "No matching prior upload attempt exists. Read-only reconciliation will never create a new upload."
  });
  assert.deepEqual(fs.readFileSync(statePath), before,
    "missing remote attempt evidence must not mutate dashboard state or append audit events");
  assert.equal(fs.existsSync(ledgerPath), false,
    "read-only reconciliation must not create an upload attempt ledger");
});
