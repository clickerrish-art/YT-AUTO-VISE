import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const expectedMissingLedgerError = {
  error: "No matching prior upload attempt exists. Read-only reconciliation will never create a new upload."
};
const expectedUnreadableLedgerError = {
  error: "Upload ledger is unreadable or unsafe; do not retry an uncertain upload"
};

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

function launchDashboard({ port, stateDir, token }) {
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
  return { child, get logs() { return logs; } };
}

async function waitForReady(instance, base) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (instance.child.exitCode !== null || instance.child.signalCode !== null) {
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

async function stopDashboard(instance) {
  if (!instance || instance.child.exitCode !== null || instance.child.signalCode !== null) return;
  const exited = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Dashboard did not stop after SIGTERM")), 5000);
    instance.child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  instance.child.kill("SIGTERM");
  await exited;
}

function reconcile(base, token) {
  return fetch(base + "/api/uploads/reconcile", {
    method: "POST",
    headers: { "x-operator-token": token, "content-type": "application/json" },
    body: JSON.stringify({
      jobId: "no-authoritative-upload-attempt",
      metadataPath: "config/weekly-content-plan.json",
      videoPath: "config/weekly-content-plan.json",
      approvalPath: "config/weekly-content-plan.json"
    })
  });
}

async function createHarness(t, label) {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-upload-reconcile-" + label + "-"));
  const port = await reservePort();
  const token = "upload-reconcile-fail-closed-" + label + "-" + "x".repeat(40);
  const base = "http://127.0.0.1:" + port;
  let instance = launchDashboard({ port, stateDir, token });
  t.after(async () => {
    try { await stopDashboard(instance); }
    catch { try { instance.child.kill("SIGKILL"); } catch {} }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });
  await waitForReady(instance, base);
  return {
    stateDir, port, token, base,
    get instance() { return instance; },
    async restart() {
      await stopDashboard(instance);
      instance = launchDashboard({ port, stateDir, token });
      await waitForReady(instance, base);
    }
  };
}

test("missing upload ledger refuses reconciliation concurrently and after restart without creating an attempt", async t => {
  const h = await createHarness(t, "missing-ledger");
  const statePath = path.join(h.stateDir, "dashboard-state.json");
  const ledgerPath = path.join(h.stateDir, "upload-attempts.json");
  const before = fs.readFileSync(statePath);

  const responses = await Promise.all(Array.from({ length: 6 }, () => reconcile(h.base, h.token)));
  for (const response of responses) {
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), expectedMissingLedgerError);
  }
  assert.deepEqual(fs.readFileSync(statePath), before,
    "missing prior-attempt evidence must not mutate dashboard state or append audit events");
  assert.equal(fs.existsSync(ledgerPath), false,
    "read-only reconciliation must not create an upload attempt ledger");

  await h.restart();
  assert.deepEqual(fs.readFileSync(statePath), before,
    "a process restart must preserve the no-attempt state byte-for-byte");
  const afterRestart = await reconcile(h.base, h.token);
  assert.equal(afterRestart.status, 409);
  assert.deepEqual(await afterRestart.json(), expectedMissingLedgerError);
  assert.deepEqual(fs.readFileSync(statePath), before);
  assert.equal(fs.existsSync(ledgerPath), false);
});

test("unreadable upload ledger is reported as unavailable, not misreported as no prior attempt", async t => {
  const h = await createHarness(t, "corrupt-ledger");
  const statePath = path.join(h.stateDir, "dashboard-state.json");
  const ledgerPath = path.join(h.stateDir, "upload-attempts.json");
  const corruptLedger = Buffer.from("{ this is not valid JSON }\n");
  fs.writeFileSync(ledgerPath, corruptLedger);
  const before = fs.readFileSync(statePath);

  const responses = await Promise.all(Array.from({ length: 6 }, () => reconcile(h.base, h.token)));
  for (const response of responses) {
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), expectedUnreadableLedgerError);
  }
  assert.deepEqual(fs.readFileSync(statePath), before,
    "an unreadable ledger must not mutate dashboard state or append audit events");
  assert.deepEqual(fs.readFileSync(ledgerPath), corruptLedger,
    "read-only reconciliation must not repair, replace or overwrite an uncertain attempt ledger");

  await h.restart();
  assert.deepEqual(fs.readFileSync(statePath), before,
    "a process restart must preserve state when the attempt ledger is unreadable");
  const afterRestart = await reconcile(h.base, h.token);
  assert.equal(afterRestart.status, 503);
  assert.deepEqual(await afterRestart.json(), expectedUnreadableLedgerError);
  assert.deepEqual(fs.readFileSync(statePath), before);
  assert.deepEqual(fs.readFileSync(ledgerPath), corruptLedger);
});
