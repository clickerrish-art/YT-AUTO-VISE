import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

test("dashboard stops background lease reaping and exits naturally on SIGTERM", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-shutdown-"));
  const port = await reservePort();
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: "shutdown-test-" + "x".repeat(40),
      DASHBOARD_OPERATOR_ID: "shutdown-test@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", chunk => { output += chunk.toString(); });
  child.stderr.on("data", chunk => { output += chunk.toString(); });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.equal(ready, true, `dashboard failed to start: ${output}`);

  child.kill("SIGTERM");
  const result = await new Promise(resolve => {
    const timer = setTimeout(() => resolve(null), 5_000);
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    });
  });
  assert.ok(result, `dashboard did not exit naturally after SIGTERM: ${output}`);
  assert.equal(result.signal, null, "graceful shutdown must not rely on a forced process signal");
  assert.equal(result.code, 0);
  assert.match(output, /"event":"dashboard_stopped"/);
});
