import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "cloudflare-artifact-sync.mjs");

function createHarness(expectedSha256) {
  const directory = fs.mkdtempSync(path.join(root, "test", ".cloudflare-artifact-sync-"));
  const bytes = Buffer.from("verified SonicVhibez artifact bytes");
  const artifactPath = path.join(directory, "video.mp4");
  const tracePath = path.join(directory, "fetch-trace.log");
  const preloaderPath = path.join(directory, "mock-fetch.mjs");
  fs.writeFileSync(artifactPath, bytes);
  const sourcePath = path.relative(root, artifactPath).split(path.sep).join("/");
  const actualSha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  fs.writeFileSync(path.join(directory, "dashboard-state.json"), JSON.stringify({
    version: 1,
    jobs: [{
      id: "artifact-sync-job",
      state: "GENERATED",
      outputArtifacts: [{ path: sourcePath, sha256: expectedSha256 ?? actualSha256 }]
    }]
  }));

  fs.writeFileSync(preloaderPath, `
import fs from "node:fs";
import crypto from "node:crypto";
let upload = null;
const tracePath = process.env.MOCK_TRACE_FILE;
const originalFetch = globalThis.fetch;
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { "content-type": "application/json" }
});
globalThis.fetch = async (input, init = {}) => {
  const rawUrl = input instanceof URL ? input.href : (typeof input === "string" ? input : input.url);
  const url = new URL(rawUrl);
  const method = String(init.method ?? "GET").toUpperCase();
  fs.appendFileSync(tracePath, method + " " + url.pathname + url.search + "\\n");

  if (url.hostname === "token.actions.githubusercontent.com") {
    return json({ value: "x".repeat(160) });
  }
  if (!url.hostname.endsWith(".workers.dev")) return originalFetch(input, init);

  if (url.pathname === "/api/runner/artifacts" && method === "GET") {
    return json({ artifacts: [] });
  }
  if (url.pathname === "/api/runner/artifacts/create" && method === "POST") {
    upload = JSON.parse(init.body);
    return json({
      artifactId: "artifact-sync-test-id",
      uploadId: "artifact-sync-test-upload",
      partSizeBytes: 8 * 1024 * 1024,
      expectedParts: 1,
      uploadedParts: []
    });
  }
  if (url.pathname === "/api/runner/artifacts/part" && method === "PUT") {
    const part = Buffer.from(init.body);
    const actualMd5 = crypto.createHash("md5").update(part).digest("hex");
    const suppliedMd5 = init.headers?.["x-part-md5"];
    if (actualMd5 !== suppliedMd5) return json({ error: "part MD5 mismatch" }, 400);
    return json({
      md5Verified: true,
      partNumber: Number(url.searchParams.get("partNumber")),
      etag: actualMd5
    });
  }
  if (url.pathname === "/api/runner/artifacts/complete" && method === "POST") {
    const body = JSON.parse(init.body);
    if (!upload || body.artifactId !== "artifact-sync-test-id") {
      return json({ error: "unknown upload session" }, 409);
    }
    return json({
      status: "READY",
      artifactId: "artifact-sync-test-id",
      objectKey: "private/artifact-sync-job/video.mp4",
      sha256: upload.sha256,
      sizeBytes: upload.sizeBytes
    });
  }
  return json({ error: "unexpected mock route: " + method + " " + url.pathname }, 404);
};
`);

  const env = {
    ...process.env,
    ACTIONS_ID_TOKEN_REQUEST_URL: "https://token.actions.githubusercontent.com/_services/token",
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: "test-actions-oidc-request-token",
    DASHBOARD_API_URL: "https://sonicvhibez-durable-state-staging.kajiboye44.workers.dev",
    DASHBOARD_WORKER_ID: "sync-test-worker",
    DASHBOARD_STATE_DIR: directory,
    MOCK_TRACE_FILE: tracePath,
    NODE_OPTIONS: "--import=" + preloaderPath
  };
  return { directory, tracePath, env, bytes, actualSha256 };
}

function runSync(harness) {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    env: harness.env,
    encoding: "utf8",
    timeout: 30_000
  });
}

test("Cloudflare artifact sync verifies the source hash, multipart receipt and final durable receipt", () => {
  const harness = createHarness();
  try {
    const result = runSync(harness);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /artifact_durably_stored/);
    assert.match(result.stdout, /artifact_sync_complete/);
    const trace = fs.readFileSync(harness.tracePath, "utf8");
    assert.match(trace, /GET \/api\/runner\/artifacts\?jobId=artifact-sync-job/);
    assert.match(trace, /POST \/api\/runner\/artifacts\/create/);
    assert.match(trace, /PUT \/api\/runner\/artifacts\/part\?artifactId=artifact-sync-test-id&partNumber=1/);
    assert.match(trace, /POST \/api\/runner\/artifacts\/complete/);
  } finally {
    fs.rmSync(harness.directory, { recursive: true, force: true });
  }
});

test("Cloudflare artifact sync refuses bytes whose SHA-256 differs from the generated job receipt", () => {
  const harness = createHarness("0".repeat(64));
  try {
    const result = runSync(harness);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Artifact bytes do not match the exact generated job SHA-256/);
    const trace = fs.readFileSync(harness.tracePath, "utf8");
    assert.doesNotMatch(trace, /\/api\/runner\/artifacts\/create/);
    assert.doesNotMatch(trace, /\/api\/runner\/artifacts\/part/);
    assert.doesNotMatch(trace, /\/api\/runner\/artifacts\/complete/);
  } finally {
    fs.rmSync(harness.directory, { recursive: true, force: true });
  }
});
