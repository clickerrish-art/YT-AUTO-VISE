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

test("concurrent authenticated read-only API requests preserve state and audit history", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-api-read-concurrency-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  const port = await reservePort();
  const token = "api-read-concurrency-" + "x".repeat(40);
  const base = "http://127.0.0.1:" + port;
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "api-read-concurrency@example.test",
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

  t.after(async () => {
    if (child.exitCode === null) {
      try { await stopChild(child); } catch { child.kill("SIGKILL"); }
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

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
  assert.equal(fs.existsSync(statePath), true, "server must initialize isolated durable state");

  const before = fs.readFileSync(statePath);
  const headers = { "x-operator-token": token };
  const cases = [
    {
      path: "/api/state",
      check(payload) {
        assert.ok(Array.isArray(payload.jobs));
        assert.ok(Array.isArray(payload.queueItems));
        assert.ok(Array.isArray(payload.audit));
        assert.equal(payload.publishingEnabled, false);
      }
    },
    {
      path: "/api/facebook/idea?date=2026-11-01",
      check(payload) {
        assert.equal(typeof payload.idea?.topic, "string");
        assert.equal(payload.publishingEnabled, false);
        assert.equal(payload.publishReady, false);
      }
    },
    {
      path: "/api/facebook/state",
      check(payload) {
        assert.ok(Array.isArray(payload.blockers));
        assert.equal(payload.publishingEnabled, false);
      }
    },
    {
      path: "/api/facebook/autonomous-status",
      check(payload) {
        assert.equal(payload.publishingEnabled, false);
        assert.equal(payload.dryRun, true);
        assert.ok(Array.isArray(payload.blockers));
      }
    },
    {
      path: "/api/tasks",
      check(payload) {
        assert.ok(Array.isArray(payload.tasks));
        assert.equal(payload.publicPublishingEnabled, false);
      }
    }
  ];

  // Four simultaneous reads per endpoint exercise the real server's shared
  // state loader and request handling without introducing write operations.
  const requests = cases.flatMap(item =>
    Array.from({ length: 4 }, () => ({ item, promise: fetch(base + item.path, { headers }) }))
  );
  const responses = await Promise.all(requests.map(async request => ({
    item: request.item,
    response: await request.promise
  })));

  for (const { item, response } of responses) {
    const responseText = await response.text();
    assert.equal(response.status, 200, "GET " + item.path + ": " + responseText);
    assert.ok((response.headers.get("content-type") ?? "").includes("application/json"));
    const payload = JSON.parse(responseText);
    assert.ok(payload && typeof payload === "object" && !Array.isArray(payload));
    item.check(payload);
    for (const forbidden of ["dashboard-state.json", "stateDir", "/home/runner", "/tmp/"]) {
      assert.equal(responseText.includes(forbidden), false,
        "GET " + item.path + " must not disclose " + forbidden);
    }
  }

  assert.deepEqual(fs.readFileSync(statePath), before,
    "concurrent read-only requests must not mutate durable state or append audit events");
});
