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

test("authenticated dashboard read endpoints return real state without mutating durable state or enabling publication", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-api-readonly-"));
  const port = await reservePort();
  const token = "api-readonly-acceptance-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "api-readonly-acceptance@example.test",
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
  const before = fs.readFileSync(statePath);
  const cases = [
    { path: "/api/state", check: payload => {
      assert.ok(Array.isArray(payload.queueItems), "state endpoint must return queueItems");
      assert.ok(Array.isArray(payload.jobs), "state endpoint must return jobs");
      assert.ok(Array.isArray(payload.audit), "state endpoint must return audit history");
      assert.equal(payload.publishingEnabled, false, "state endpoint must report public publishing disabled");
    } },
    { path: "/api/facebook/idea?date=2026-11-01", check: payload => {
      assert.equal(typeof payload.idea?.title, "string");
      assert.equal(payload.publishingEnabled, false);
      assert.equal(payload.publishReady, false);
    } },
    { path: "/api/facebook/state", check: payload => {
      assert.ok(Array.isArray(payload.blockers), "Facebook state must expose actionable blockers");
      assert.equal(payload.publishingEnabled, false);
    } },
    { path: "/api/facebook/autonomous-status", check: payload => {
      assert.equal(payload.publishingEnabled, false);
      assert.equal(payload.dryRun, true);
      assert.ok(Array.isArray(payload.blockers), "autonomous status must expose blockers");
    } },
    { path: "/api/tasks", check: payload => {
      assert.ok(Array.isArray(payload.tasks), "task endpoint must return the allowlisted task inventory");
      assert.equal(payload.publicPublishingEnabled, false);
    } }
  ];

  for (const item of cases) {
    const response = await fetch(base + item.path, {
      method: "GET",
      headers: { "x-operator-token": token }
    });
    const responseText = await response.text();
    assert.equal(response.status, 200, "GET " + item.path + ": " + responseText);
    assert.match(response.headers.get("content-type") ?? "", /application\\/json/i);
    assert.doesNotMatch(responseText, /dashboard-state\\.json|stateDir|\/home\/runner|\/tmp\//i,
      "GET " + item.path + " must not disclose filesystem paths");
    const payload = JSON.parse(responseText);
    assert.ok(payload && typeof payload === "object" && !Array.isArray(payload),
      "GET " + item.path + " must return a JSON object");
    item.check(payload);
  }

  assert.deepEqual(fs.readFileSync(statePath), before,
    "read-only dashboard endpoints must not mutate durable state or append audit events");
});
