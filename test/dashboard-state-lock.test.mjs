import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("dashboard never steals an old-looking lock owned by a live process", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-lock-"));
  const port = 28000 + Math.floor(Math.random() * 10000);
  const token = "lock-test-token-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "lock-test-owner",
      DASHBOARD_STATE_DIR: stateDir,
      DASHBOARD_STATE_LOCK_TIMEOUT_MS: "150",
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const lockDir = path.join(stateDir, "dashboard-state.json.lock");
  t.after(() => {
    child.kill("SIGTERM");
    fs.rmSync(stateDir, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server did not start: " + logs);

  fs.mkdirSync(lockDir, { mode: 0o700 });
  fs.writeFileSync(path.join(lockDir, "owner.json"), JSON.stringify({
    pid: process.pid,
    ownerId: "live-test-owner-token",
    acquiredAt: new Date(Date.now() - 180_000).toISOString()
  }), { mode: 0o600, flag: "wx" });
  const old = new Date(Date.now() - 180_000);
  fs.utimesSync(lockDir, old, old);

  const response = await fetch(base + "/api/drafts", {
    method: "POST",
    headers: { "content-type": "application/json", "x-operator-token": token },
    body: JSON.stringify({
      id: "lock-protected-draft",
      title: "Lock safety test draft",
      topic: "state lock regression test",
      contentType: "long_form",
      scheduledDay: "Tuesday",
      scheduledDate: "2026-10-27",
      productUrl: "https://selar.com/0u19v8u99l"
    })
  });
  assert.equal(response.status, 400, "the busy-state error is returned as a client-safe request error");
  const responseBody = await response.json();
  assert.match(responseBody.error, /State is busy in another process/i, JSON.stringify(responseBody));
  assert.equal(fs.existsSync(lockDir), true, "the lock owned by a live process must not be removed because it looks old");
  assert.equal(fs.existsSync(path.join(lockDir, "owner.json")), true);
});
