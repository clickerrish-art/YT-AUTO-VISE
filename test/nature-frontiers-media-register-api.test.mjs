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

test("Nature Frontiers media-register API enforces operator auth and returns the live read-only register", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "nature-frontiers-register-api-"));
  const port = await reservePort();
  const token = "nature-frontiers-test-token-" + "x".repeat(32);
  const child = spawn(process.execPath, [path.join(process.cwd(), "scripts", "dashboard-server.mjs")], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "media-register-test-operator",
      DASHBOARD_STATE_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1"
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
      setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 2_000).unref();
    });
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(base + "/healthz", { headers: { connection: "close" } });
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard server did not start: " + logs);

  const unauthorized = await fetch(base + "/api/nature-frontiers/media-register", {
    headers: { connection: "close" }
  });
  assert.equal(unauthorized.status, 401);
  assert.match((await unauthorized.json()).error, /authentication required/i);

  const response = await fetch(base + "/api/nature-frontiers/media-register", {
    headers: { "x-operator-token": token, connection: "close" }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.brand, "Nature Frontiers");
  assert.equal(body.registerId, "nature-frontiers-media");
  assert.equal(body.timezone, "Africa/Johannesburg");
  assert.equal(body.sourceOfTruth, "versioned-local-json");
  assert.equal(body.readOnly, true);
  assert.equal(body.publishingEnabled, false);
  assert.ok(body.assetCount > 0);
  assert.equal(body.assets.length, body.assetCount);
  const asset = body.assets.find(item => item.id === "nf-pex-giraffe-5220275");
  assert.ok(asset, "the API should return the actual registered asset");
  assert.equal(asset.source.provider, "Pexels");
  assert.equal(asset.rights.reviewStatus, "not_assessed");
  assert.equal(asset.inspection.status, "not_inspected");
  assert.equal(asset.approval.status, "pending");
  assert.equal(asset.usage.published, false);
  assert.ok(Array.isArray(body.validation.errors));
  assert.equal(typeof body.validation.ok, "boolean");
  assert.equal(Object.hasOwn(body, "stateFile"), false);
});
