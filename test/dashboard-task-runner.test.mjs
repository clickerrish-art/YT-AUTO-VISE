import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("dashboard runs only allowlisted real validation commands and persists results", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-tasks-"));
  const port = 28000 + Math.floor(Math.random() * 10000);
  const token = "task-test-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_STATE_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
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
  const headers = { "content-type": "application/json", "x-operator-token": token };
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
});
