import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inventoryDashboardSources } from "../scripts/dashboard-inventory.mjs";

const root = process.cwd();
const html = fs.readFileSync(path.join(root, "public", "dashboard.html"), "utf8");
const serverSource = fs.readFileSync(path.join(root, "scripts", "dashboard-server.mjs"), "utf8");
const apiRoutes = inventoryDashboardSources(html, serverSource).routes
  .filter(route => route.path.startsWith("/api/"))
  .filter((route, index, routes) => routes.findIndex(candidate =>
    candidate.method === route.method && candidate.path === route.path) === index);

test("every declared API route rejects unauthenticated requests without mutating state or leaking paths", async (t) => {
  assert.ok(apiRoutes.length >= 30, `expected the full API route inventory, found ${apiRoutes.length}`);
  assert.ok(apiRoutes.every(route => ["GET", "POST"].includes(route.method)),
    "every API route in this application must declare an explicit supported HTTP method");

  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-api-auth-matrix-"));
  const portProbe = createServer();
  await new Promise((resolve, reject) => {
    portProbe.once("error", reject);
    portProbe.listen(0, "127.0.0.1", resolve);
  });
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));

  const token = "route-auth-test-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "route-auth-test@example.test",
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
    if (child.exitCode === null) child.kill("SIGTERM");
    await new Promise(resolve => {
      if (child.exitCode !== null) return resolve();
      child.once("exit", resolve);
      setTimeout(resolve, 1000);
    });
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard server failed to start: " + logs);

  const statePath = path.join(stateDir, "dashboard-state.json");
  const initialState = fs.readFileSync(statePath);
  const results = [];
  for (const route of apiRoutes) {
    const response = await fetch(base + route.path, {
      method: route.method,
      headers: route.method === "POST" ? { "content-type": "application/json" } : {},
      body: route.method === "POST" ? "{}" : undefined
    });
    const responseText = await response.text();
    assert.equal(response.status, 401, `${route.method} ${route.path} must reject missing operator credentials; body=${responseText}`);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/i);
    assert.doesNotMatch(responseText, /dashboard-state\.json|stateDir|\/home\/runner|\/tmp\//i,
      `${route.method} ${route.path} leaked an internal filesystem path`);
    const payload = JSON.parse(responseText);
    assert.equal(payload.error, "Operator authentication required",
      `${route.method} ${route.path} should use the consistent authentication error`);
    results.push(`${route.method} ${route.path}`);
  }

  assert.deepEqual(fs.readFileSync(statePath), initialState,
    "unauthenticated API requests must not mutate persisted dashboard state");
  assert.equal(results.length, apiRoutes.length);
});
