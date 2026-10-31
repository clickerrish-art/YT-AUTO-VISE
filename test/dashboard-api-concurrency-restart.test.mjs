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

function launchDashboard({ port, stateDir, token }) {
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "api-restart-acceptance@example.test",
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
  return { child, get logs() { return logs; } };
}

async function waitForReady(base, child, readLogs) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) {
      throw new Error("Dashboard exited before becoming ready: " + readLogs());
    }
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Dashboard did not become ready: " + readLogs());
}

async function stopChild(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Dashboard did not stop after SIGTERM")), 5000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

test("concurrent identical job submissions remain idempotent across a server restart", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-api-concurrency-restart-"));
  const port = await reservePort();
  const token = "api-concurrency-restart-" + "x".repeat(40);
  const base = "http://127.0.0.1:" + port;
  const statePath = path.join(stateDir, "dashboard-state.json");
  let instance = launchDashboard({ port, stateDir, token });

  t.after(async () => {
    if (instance?.child && instance.child.exitCode === null) {
      try { await stopChild(instance.child); } catch { instance.child.kill("SIGKILL"); }
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  await waitForReady(base, instance.child, () => instance.logs);

  const request = {
    idempotencyKey: "concurrent-restart-acceptance:short-2026-11-07",
    title: "Concurrent API acceptance test",
    topic: "How wildlife researchers distinguish observation from interpretation",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: "2026-11-07",
    inputReferences: ["content/short-001-wildlife-video-storytelling.md"]
  };
  const headers = {
    "content-type": "application/json",
    "x-operator-token": token
  };

  const responses = await Promise.all(Array.from({ length: 12 }, () => fetch(base + "/api/jobs", {
    method: "POST",
    headers,
    body: JSON.stringify(request)
  })));
  const bodies = await Promise.all(responses.map(async response => ({
    status: response.status,
    text: await response.text()
  })));
  for (const body of bodies) {
    assert.ok([200, 201].includes(body.status), "concurrent request returned " + body.status + ": " + body.text);
  }

  const created = bodies.filter(body => body.status === 201);
  const reused = bodies.filter(body => body.status === 200);
  assert.equal(created.length, 1, "exactly one concurrent request must create the job");
  assert.equal(reused.length, 11, "all other identical concurrent requests must reuse the created job");
  const parsed = bodies.map(body => JSON.parse(body.text));
  const jobIds = new Set(parsed.map(body => body.job?.id));
  assert.equal(jobIds.size, 1, "all concurrent responses must refer to the same job");
  assert.equal(parsed.filter(body => body.reused === false).length, 1);
  assert.equal(parsed.filter(body => body.reused === true).length, 11);

  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(persisted.jobs.filter(job => job.idempotencyKey === request.idempotencyKey).length, 1);
  assert.equal(persisted.audit.filter(event =>
    event.action === "CONTENT_JOB_QUEUED" && event.idempotencyKey === request.idempotencyKey
  ).length, 1);

  const expectedJobId = parsed[0].job.id;
  await stopChild(instance.child);
  instance = launchDashboard({ port, stateDir, token });
  await waitForReady(base, instance.child, () => instance.logs);

  const stateResponse = await fetch(base + "/api/state", {
    headers: { "x-operator-token": token }
  });
  const stateText = await stateResponse.text();
  assert.equal(stateResponse.status, 200, stateText);
  const state = JSON.parse(stateText);
  assert.ok(Array.isArray(state.jobs), "authenticated state response must expose persisted jobs");
  assert.equal(state.jobs.filter(job => job.idempotencyKey === request.idempotencyKey).length, 1);
  assert.equal(state.jobs.find(job => job.idempotencyKey === request.idempotencyKey).id, expectedJobId);
  assert.equal(state.audit.filter(event =>
    event.action === "CONTENT_JOB_QUEUED" && event.idempotencyKey === request.idempotencyKey
  ).length, 1);
  assert.equal(state.publishingEnabled, false, "restart must not enable publishing");
});
