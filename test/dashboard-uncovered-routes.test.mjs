import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "node:http";

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

async function request(url, options = {}) {
  const headers = new Headers(options.headers ?? {});
  headers.set("connection", "close");
  return fetch(url, { ...options, headers, signal: AbortSignal.timeout(5000) });
}

test("uncovered dashboard routes expose safe reads and fail closed without durable provider state", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-route-acceptance-"));
  const port = await reservePort();
  const operatorToken = "route-acceptance-operator-" + "x".repeat(32);
  const workerToken = "route-acceptance-worker-" + "y".repeat(32);
  const child = spawn(process.execPath, [path.join(process.cwd(), "scripts", "dashboard-server.mjs")], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: operatorToken,
      DASHBOARD_WORKER_TOKEN: workerToken,
      DASHBOARD_OPERATOR_ID: "route-acceptance@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      FACEBOOK_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      DASHBOARD_STATE_API_URL: "",
      DASHBOARD_STATE_OPERATOR_TOKEN: "",
      DASHBOARD_STATE_ACCESS_CLIENT_ID: "",
      DASHBOARD_STATE_ACCESS_CLIENT_SECRET: "",
      CLOUDFLARE_ACCOUNT_ID: "",
      CLOUDFLARE_DATABASE_ID: "",
      CLOUDFLARE_API_TOKEN: "",
      CLOUDFLARE_D1_DATABASE_ID: "",
      CLOUDFLARE_R2_BUCKET: "",
      CLOUDFLARE_WORKER_URL: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => {
    child.kill("SIGTERM");
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await request(base + "/healthz");
      if (response.status === 200) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.equal(ready, true, "dashboard must start before route acceptance; logs: " + logs);

  const operatorHeaders = {
    "content-type": "application/json",
    "x-operator-token": operatorToken
  };
  const baselineResponse = await request(base + "/api/state", { headers: operatorHeaders });
  assert.equal(baselineResponse.status, 200);
  const baseline = await baselineResponse.json();

  const dispatchableResponse = await request(base + "/api/jobs/dispatchable?limit=20", {
    headers: { "x-worker-token": workerToken, "x-worker-id": "route-acceptance-worker" }
  });
  assert.equal(dispatchableResponse.status, 200);
  const dispatchable = await dispatchableResponse.json();
  assert.deepEqual(dispatchable.jobs, []);
  assert.equal(dispatchable.readOnly, true);
  assert.equal(dispatchable.publishingEnabled, false);

  const invalidDispatchLimit = await request(base + "/api/jobs/dispatchable?limit=101", {
    headers: { "x-worker-token": workerToken, "x-worker-id": "route-acceptance-worker" }
  });
  assert.equal(invalidDispatchLimit.status, 400);

  const diagnosticsResponse = await request(base + "/api/jobs/queue-diagnostics", { headers: operatorHeaders });
  assert.equal(diagnosticsResponse.status, 200);
  const diagnostics = await diagnosticsResponse.json();
  assert.equal(diagnostics.timezone, "Africa/Johannesburg");
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.publishingEnabled, false);
  assert.equal(diagnostics.queuedCount, 0);
  assert.deepEqual(diagnostics.items, []);

  const invalidDiagnosticsLimit = await request(base + "/api/jobs/queue-diagnostics?limit=0", { headers: operatorHeaders });
  assert.equal(invalidDiagnosticsLimit.status, 400);

  const retryUnknown = await request(base + "/api/jobs/retry", {
    method: "POST", headers: operatorHeaders,
    body: JSON.stringify({ jobId: "missing-route-acceptance-job", reason: "Verify unknown retry target" })
  });
  assert.equal(retryUnknown.status, 404);

  const recoveryUnknown = await request(base + "/api/jobs/render-recovery/reconcile", {
    method: "POST", headers: operatorHeaders,
    body: JSON.stringify({ jobId: "missing-route-acceptance-job", reason: "Verify unknown recovery target" })
  });
  assert.equal(recoveryUnknown.status, 404);

  const missingBundleId = await request(base + "/api/jobs/review/bundle", { headers: operatorHeaders });
  assert.equal(missingBundleId.status, 400);
  const unknownBundle = await request(base + "/api/jobs/review/bundle?jobId=missing-route-acceptance-job", { headers: operatorHeaders });
  assert.equal(unknownBundle.status, 404);

  const missingPreview = await request(base + "/api/jobs/review/preview", { headers: operatorHeaders });
  assert.equal(missingPreview.status, 400);
  const unknownPreview = await request(base + "/api/jobs/review/preview?jobId=missing-route-acceptance-job&kind=video&sha256=${"a".repeat(64)}", { headers: operatorHeaders });
  assert.equal(unknownPreview.status, 404);

  const mediaRegisterResponse = await request(base + "/api/nature-frontiers/media-register", { headers: operatorHeaders });
  assert.equal(mediaRegisterResponse.status, 200, await mediaRegisterResponse.text());
  const mediaRegister = await mediaRegisterResponse.json();
  assert.equal(mediaRegister.brand, "Nature Frontiers");
  assert.equal(mediaRegister.readOnly, true);
  assert.equal(mediaRegister.providerMutationAttempted, false);
  assert.equal(mediaRegister.publishingEnabled, false);

  for (const [route, method, body] of [
    ["/api/state/backups", "GET", undefined],
    ["/api/state/backup", "POST", "{}"],
    ["/api/state/restore", "POST", JSON.stringify({ confirmRestore: true, backupId: "not-configured", expectedRevision: 1 })]
  ]) {
    const response = await request(base + route, {
      method,
      headers: operatorHeaders,
      ...(body === undefined ? {} : { body })
    });
    assert.equal(response.status, 503, `${method} ${route} must fail closed when Cloudflare durable state is not configured`);
    const payload = await response.json();
    assert.match(payload.error, /Cloudflare state sync is not configured/i);
    assert.equal(JSON.stringify(payload).includes(operatorToken), false);
  }

  const afterResponse = await request(base + "/api/state", { headers: operatorHeaders });
  assert.equal(afterResponse.status, 200);
  const after = await afterResponse.json();
  assert.deepEqual(after, baseline, "read-only and rejected route requests must not mutate dashboard state");
});
