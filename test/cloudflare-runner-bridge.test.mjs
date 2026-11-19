import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "cloudflare-runner-bridge.mjs");

function createHarness({ includeAccess = true } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cloudflare-runner-bridge-"));
  const tracePath = path.join(directory, "fetch-trace.log");
  const preloaderPath = path.join(directory, "mock-fetch.mjs");
  fs.writeFileSync(preloaderPath, `
import fs from "node:fs";
const tracePath = process.env.MOCK_TRACE_FILE;
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "content-type": "application/json" }
});
globalThis.fetch = async (input, init = {}) => {
  const rawUrl = input instanceof URL ? input.href : (typeof input === "string" ? input : input.url);
  const url = new URL(rawUrl);
  const method = String(init.method ?? "GET").toUpperCase();
  fs.appendFileSync(tracePath, method + " " + url.hostname + url.pathname + "\\n");
  if (url.hostname === "pipelines.actions.githubusercontent.com") {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const claims = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 })).toString("base64url");
    const signature = Buffer.alloc(100, 7).toString("base64url");
    return json({ value: header + "." + claims + "." + signature });
  }
  if (url.hostname.endsWith(".workers.dev")) {
    if (init.headers?.["cf-access-client-id"] !== process.env.DASHBOARD_STATE_ACCESS_CLIENT_ID ||
        init.headers?.["cf-access-client-secret"] !== process.env.DASHBOARD_STATE_ACCESS_CLIENT_SECRET) {
      return json({ error: "Cloudflare Access headers missing" }, 401);
    }
    if (!String(init.headers?.authorization ?? "").startsWith("Bearer ")) return json({ error: "GitHub OIDC bearer missing" }, 401);
    if (init.headers?.["x-worker-id"] !== "bridge-test-worker") return json({ error: "Worker identity missing" }, 400);
    if (url.pathname === "/api/runner/ready" && method === "GET") {
      return json({ ready: true, storageProvider: "R2", usedBytes: 1024, remainingBytes: 3 * 1024 * 1024 * 1024 });
    }
  }
  return json({ error: "unexpected mock route" }, 404);
};
`);
  const env = {
    ...process.env,
    ACTIONS_ID_TOKEN_REQUEST_URL: "https://pipelines.actions.githubusercontent.com/_services/token",
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: "test-oidc-request-token",
    DASHBOARD_API_URL: "https://sonicvhibez-durable-state-staging.kajiboye44.workers.dev",
    DASHBOARD_WORKER_ID: "bridge-test-worker",
    DASHBOARD_STATE_ACCESS_CLIENT_ID: includeAccess ? "test-service-token-id.access" : "",
    DASHBOARD_STATE_ACCESS_CLIENT_SECRET: includeAccess ? "test-service-token-secret" : "",
    DASHBOARD_STATE_DIR: directory,
    WORKER_STATE_DIR: path.join(directory, "runner-state"),
    MOCK_TRACE_FILE: tracePath,
    NODE_OPTIONS: "--import=" + preloaderPath
  };
  return { directory, tracePath, env };
}

function run(harness) {
  return spawnSync(process.execPath, [script, "verify-storage"], {
    cwd: root, env: harness.env, encoding: "utf8", timeout: 30_000
  });
}

test("Cloudflare runner bridge sends Access service-token and GitHub OIDC headers", () => {
  const harness = createHarness();
  try {
    const result = run(harness);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /cloudflare_artifact_storage_ready/);
    const trace = fs.readFileSync(harness.tracePath, "utf8");
    assert.match(trace, /GET sonicvhibez-durable-state-staging\.kajiboye44\.workers\.dev\/api\/runner\/ready/);
    assert.doesNotMatch(result.stdout + result.stderr, /test-service-token-secret|test-oidc-request-token/);
  } finally {
    fs.rmSync(harness.directory, { recursive: true, force: true });
  }
});

test("Cloudflare runner bridge fails closed before network access without Access credentials", () => {
  const harness = createHarness({ includeAccess: false });
  try {
    const result = run(harness);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Both DASHBOARD_STATE_ACCESS_CLIENT_ID and DASHBOARD_STATE_ACCESS_CLIENT_SECRET are required/);
    assert.equal(fs.existsSync(harness.tracePath), false);
  } finally {
    fs.rmSync(harness.directory, { recursive: true, force: true });
  }
});
