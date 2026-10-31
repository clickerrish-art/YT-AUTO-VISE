import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inventoryDashboardSources } from "../scripts/dashboard-inventory.mjs";

const root = process.cwd();

test("every authenticated API route handles an empty request safely without a server error or state mutation", async (t) => {
  const html = fs.readFileSync(path.join(root, "public", "dashboard.html"), "utf8");
  const serverSource = fs.readFileSync(path.join(root, "scripts", "dashboard-server.mjs"), "utf8");
  const routes = [...new Map(inventoryDashboardSources(html, serverSource).routes
    .filter(route => route.path.startsWith("/api/"))
    .map(route => [route.method + " " + route.path, route])).values()];
  assert.ok(routes.length >= 30, \`expected a complete API route inventory, found \${routes.length}\`);
  assert.ok(routes.every(route => ["GET", "POST"].includes(route.method)),
    "every API route must declare an explicit supported HTTP method");

  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-api-negative-matrix-"));
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));

  const token = "api-negative-matrix-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "api-negative-matrix@example.test",
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

  const base = \`http://127.0.0.1:\${port}\`;
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
  const before = fs.readFileSync(statePath);
  const outcomes = [];
  for (const route of routes) {
    const response = await fetch(base + route.path, {
      method: route.method,
      headers: route.method === "POST"
        ? { "x-operator-token": token, "content-type": "application/json" }
        : { "x-operator-token": token },
      body: route.method === "POST" ? "{}" : undefined
    });
    const responseText = await response.text();
    assert.ok(response.status < 500,
      \`authenticated empty request must not produce a server error for \${route.method} \${route.path}; status=\${response.status}; body=\${responseText}\`);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/i,
      \`\${route.method} \${route.path} must return the documented JSON API envelope for this invalid/empty request\`);
    assert.doesNotMatch(responseText, /dashboard-state\.json|stateDir|\/home\/runner|\/tmp\//i,
      \`\${route.method} \${route.path} leaked an internal filesystem path\`);
    outcomes.push({ route: route.method + " " + route.path, status: response.status });
  }

  assert.deepEqual(fs.readFileSync(statePath), before,
    "invalid/empty authenticated requests must not mutate persisted dashboard state");
  assert.equal(outcomes.length, routes.length);
});
