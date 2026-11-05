import test from "node:test";
import { spawn, spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import http from "node:http";
import { applyWorkerQuarantineRelease, assertWorkerStoppedForQuarantineRelease, runWorker } from "../scripts/worker-runner.mjs";
import {
  createWorkerQuarantineReleaseReceipt,
  verifyWorkerQuarantineReleaseReceipt
} from "../scripts/worker-quarantine-release.mjs";

const keyPair = crypto.generateKeyPairSync("ed25519");
const privateKeyPem = keyPair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const publicKeyPem = keyPair.publicKey.export({ type: "spki", format: "pem" }).toString();
const binding = {
  workerId: "render-worker-01",
  jobId: "job-uncertain-123",
  attemptId: "attempt-456",
  artifactSha256: "a".repeat(64),
  privateKeyPem,
  publicKeyPem,
  nowMs: Date.parse("2026-11-05T18:00:00.000Z"),
  nonce: "b".repeat(48)
};

test("Ed25519-signed quarantine release receipt verifies exact worker, job, attempt and artifact", () => {
  const receipt = createWorkerQuarantineReleaseReceipt(binding);
  assert.equal(verifyWorkerQuarantineReleaseReceipt(receipt, binding).nonce, binding.nonce);
  assert.equal(receipt.expiresAt, "2026-11-05T18:05:00.000Z");
});

test("receipt rejects tampering, wrong binding, wrong public key and expiry", () => {
  const receipt = createWorkerQuarantineReleaseReceipt(binding);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt({ ...receipt, jobId: "other-job" }, binding), /does not bind/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, workerId: "other-worker" }), /does not bind/i);
  const other = crypto.generateKeyPairSync("ed25519");
  const wrongPublicKeyPem = other.publicKey.export({ type: "spki", format: "pem" }).toString();
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, publicKeyPem: wrongPublicKeyPem }), /signature is invalid/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, nowMs: binding.nowMs + 300_001 }), /expired/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, attemptId: "other-attempt" }), /does not bind/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, publicKeyPem: privateKeyPem }), /PUBLIC key is not configured/i);
});

test("receipt creation rejects malformed identities and missing or malformed private keys", () => {
  assert.throws(() => createWorkerQuarantineReleaseReceipt({ ...binding, privateKeyPem: "" }), /private key is not configured/i);
  assert.throws(() => createWorkerQuarantineReleaseReceipt({ ...binding, privateKeyPem: "not a key" }), /private key|decoder/i);
  assert.throws(() => createWorkerQuarantineReleaseReceipt({ ...binding, artifactSha256: "bad" }), /fields are invalid/i);
});

test("worker consumes a signed release once and persists the nonce against replay", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-release-consume-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const statePath = path.join(dir, "cooldowns.json");
  const state = {
    schemaVersion: 1,
    workerId: binding.workerId,
    updatedAt: new Date(binding.nowMs).toISOString(),
    cooldowns: {},
    uncertainDispatches: {
      [binding.jobId]: { code: "WORKER_DISPATCH_OUTCOME_UNCERTAIN", recordedAt: new Date(binding.nowMs - 1000).toISOString() }
    },
    consumedReleaseNonces: []
  };
  fs.writeFileSync(statePath, JSON.stringify(state), { mode: 0o600 });
  const receipt = createWorkerQuarantineReleaseReceipt(binding);
  const released = applyWorkerQuarantineRelease({
    statePath, workerId: binding.workerId, jobId: binding.jobId, attemptId: binding.attemptId, artifactSha256: binding.artifactSha256, publicKeyPem, receipt, nowMs: binding.nowMs
  });
  assert.equal(released.released, true);
  let persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(Object.hasOwn(persisted.uncertainDispatches, binding.jobId), false);
  assert.ok(persisted.consumedReleaseNonces.includes(binding.nonce));

  persisted.uncertainDispatches[binding.jobId] = {
    code: "WORKER_DISPATCH_OUTCOME_UNCERTAIN",
    recordedAt: new Date(binding.nowMs).toISOString()
  };
  fs.writeFileSync(statePath, JSON.stringify(persisted), { mode: 0o600 });
  assert.throws(() => applyWorkerQuarantineRelease({
    statePath, workerId: binding.workerId, jobId: binding.jobId, attemptId: binding.attemptId, artifactSha256: binding.artifactSha256, publicKeyPem, receipt, nowMs: binding.nowMs
  }), /already been consumed/i);
});

test("quarantine release refuses to race a running worker process", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-release-lock-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const statePath = path.join(dir, "cooldowns.json");
  fs.writeFileSync(statePath + ".process.lock", JSON.stringify({ pid: process.pid }));
  assert.throws(() => assertWorkerStoppedForQuarantineRelease(statePath), /Stop the worker process/i);
});

test("quarantine release serializes consumers and fails closed on an existing release lock", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-release-serialization-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const statePath = path.join(dir, "cooldowns.json");
  const state = {
    schemaVersion: 1,
    workerId: binding.workerId,
    updatedAt: new Date(binding.nowMs).toISOString(),
    cooldowns: {},
    uncertainDispatches: {
      [binding.jobId]: { code: "WORKER_DISPATCH_OUTCOME_UNCERTAIN", recordedAt: new Date(binding.nowMs - 1000).toISOString() }
    },
    consumedReleaseNonces: []
  };
  fs.writeFileSync(statePath, JSON.stringify(state), { mode: 0o600 });
  fs.writeFileSync(statePath + ".release.lock", JSON.stringify({ pid: process.pid }), { mode: 0o600 });
  const receipt = createWorkerQuarantineReleaseReceipt(binding);
  assert.throws(() => applyWorkerQuarantineRelease({
    statePath, workerId: binding.workerId, jobId: binding.jobId, attemptId: binding.attemptId,
    artifactSha256: binding.artifactSha256, publicKeyPem, receipt, nowMs: binding.nowMs
  }), /release is already in progress|stale release lock/i);
  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.ok(Object.hasOwn(persisted.uncertainDispatches, binding.jobId), "quarantine must remain intact when release lock acquisition fails");
  assert.deepEqual(persisted.consumedReleaseNonces, []);
});

test("worker startup preserves a process lock owned by another worker", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-existing-process-lock-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const worker = "existing-process-lock-test";
  const identity = crypto.createHash("sha256").update(worker).digest("hex").slice(0, 20);
  const statePath = path.join(dir, "worker-backoff-" + identity + ".json");
  const lockContents = JSON.stringify({ pid: process.pid, owner: "existing-worker" });
  fs.writeFileSync(statePath + ".process.lock", lockContents, { mode: 0o600 });
  await assert.rejects(runWorker({
    baseUrl: "http://127.0.0.1:8787",
    token: "worker-token-for-lock-test-123456",
    workerId: worker,
    once: true,
    stateDirectory: dir,
    fetchImpl: async () => new Response(JSON.stringify({ jobs: [] }), { status: 200 })
  }), /already locked/i);
  assert.equal(fs.readFileSync(statePath + ".process.lock", "utf8"), lockContents, "failed startup must not unlink another worker's lock");
});

test("worker startup refuses an active quarantine release lock", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-start-release-lock-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const worker = "release-startup-test-worker";
  const identity = crypto.createHash("sha256").update(worker).digest("hex").slice(0, 20);
  const statePath = path.join(dir, "worker-backoff-" + identity + ".json");
  fs.writeFileSync(statePath + ".release.lock", JSON.stringify({ pid: process.pid }), { mode: 0o600 });
  let fetchCalled = false;
  await assert.rejects(runWorker({
    baseUrl: "http://127.0.0.1:8787",
    token: "worker-token-for-lock-test-123456",
    workerId: worker,
    once: true,
    stateDirectory: dir,
    fetchImpl: async () => { fetchCalled = true; return new Response(JSON.stringify({ jobs: [] }), { status: 200 }); }
  }), /already locked|quarantine release is in progress/i);
  assert.equal(fetchCalled, false, "worker must not contact the dashboard while release lock is held");
  assert.equal(fs.existsSync(statePath + ".process.lock"), false, "failed worker startup must not leave a stale process lock");
});

test("worker process lock is created and released around its cycle", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-process-lock-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const worker = "release-lock-test-worker";
  const identity = crypto.createHash("sha256").update(worker).digest("hex").slice(0, 20);
  const lockPath = path.join(dir, "worker-backoff-" + identity + ".json.process.lock");
  let lockObservedDuringCycle = false;
  await runWorker({
    baseUrl: "http://127.0.0.1:8787",
    token: "worker-token-for-lock-test-123456",
    workerId: worker,
    once: true,
    stateDirectory: dir,
    fetchImpl: async () => {
      lockObservedDuringCycle = fs.existsSync(lockPath);
      return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
    }
  });
  assert.equal(lockObservedDuringCycle, true, "worker must hold its process lock while dispatch state is in use");
  assert.equal(fs.existsSync(lockPath), false, "worker must release its process lock after a clean cycle");
});


test("worker CLI consumes an operator-signed receipt handoff with only its public key", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-release-handoff-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const workerId = "handoff-worker-01";
  const jobId = "handoff-job-123";
  const attemptId = "handoff-attempt-456";
  const artifactSha256 = "c".repeat(64);
  const statePath = path.join(dir, "worker-state.json");
  fs.writeFileSync(statePath, JSON.stringify({
    schemaVersion: 1, workerId, updatedAt: new Date().toISOString(),
    cooldowns: {},
    uncertainDispatches: {
      [jobId]: { code: "WORKER_DISPATCH_OUTCOME_UNCERTAIN", recordedAt: new Date().toISOString() }
    },
    consumedReleaseNonces: []
  }), { mode: 0o600 });
  const receipt = createWorkerQuarantineReleaseReceipt({
    workerId, jobId, attemptId, artifactSha256, privateKeyPem, nowMs: Date.now()
  });
  const receiptPath = path.join(dir, "release-receipt.json");
  fs.writeFileSync(receiptPath, JSON.stringify(receipt), { mode: 0o600 });
  const scriptPath = path.join(process.cwd(), "scripts", "worker-runner.mjs");
  const result = spawnSync(process.execPath, [scriptPath, "--consume-quarantine-release", "--receipt-file", receiptPath], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      DASHBOARD_WORKER_ID: workerId,
      WORKER_BACKOFF_STATE_PATH: statePath,
      DASHBOARD_QUARANTINE_SIGNING_PUBLIC_KEY: publicKeyPem,
      DASHBOARD_WORKER_TOKEN: ""
    }
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(Object.hasOwn(persisted.uncertainDispatches, jobId), false);
  assert.ok(persisted.consumedReleaseNonces.includes(receipt.nonce));
  assert.match(result.stdout, /"publishingEnabled":false/);
});


test("worker CLI rejects a symlinked release receipt without changing quarantine state", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-release-symlink-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const workerId = "symlink-worker-01";
  const jobId = "symlink-job-123";
  const statePath = path.join(dir, "worker-state.json");
  const state = {
    schemaVersion: 1, workerId, updatedAt: new Date().toISOString(),
    cooldowns: {},
    uncertainDispatches: {
      [jobId]: { code: "WORKER_DISPATCH_OUTCOME_UNCERTAIN", recordedAt: new Date().toISOString() }
    },
    consumedReleaseNonces: []
  };
  fs.writeFileSync(statePath, JSON.stringify(state), { mode: 0o600 });
  const legitimatePath = path.join(dir, "legitimate-receipt.json");
  fs.writeFileSync(legitimatePath, JSON.stringify(createWorkerQuarantineReleaseReceipt({
    workerId, jobId, attemptId: "symlink-attempt-123", artifactSha256: "d".repeat(64), privateKeyPem
  })), { mode: 0o600 });
  const symlinkPath = path.join(dir, "receipt-link.json");
  fs.symlinkSync(legitimatePath, symlinkPath);
  const result = spawnSync(process.execPath, [
    path.join(process.cwd(), "scripts", "worker-runner.mjs"),
    "--consume-quarantine-release", "--receipt-file", symlinkPath
  ], {
    cwd: process.cwd(), encoding: "utf8",
    env: {
      ...process.env, DASHBOARD_WORKER_ID: workerId,
      WORKER_BACKOFF_STATE_PATH: statePath,
      DASHBOARD_QUARANTINE_SIGNING_PUBLIC_KEY: publicKeyPem,
      DASHBOARD_WORKER_TOKEN: ""
    }
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /symbolic link|too many levels of symbolic links|ELOOP/i);
  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.ok(Object.hasOwn(persisted.uncertainDispatches, jobId));
  assert.deepEqual(persisted.consumedReleaseNonces, []);
});


test("operator CLI requests, verifies and securely writes a signed release handoff without worker state access", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "operator-release-handoff-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const workerId = "remote-worker-01";
  const jobId = "remote-job-123";
  const attemptId = "remote-attempt-456";
  const artifactSha256 = "e".repeat(64);
  const receipt = createWorkerQuarantineReleaseReceipt({
    workerId, jobId, attemptId, artifactSha256, privateKeyPem
  });
  const server = http.createServer((req, res) => {
    assert.equal(req.method, "POST");
    assert.equal(req.url, "/api/worker/quarantine-release");
    assert.equal(req.headers["x-operator-token"], "operator-token-012345678901234567");
    assert.equal(req.headers["x-quarantine-release-token"], "release-token-012345678901234567");
    let body = "";
    req.setEncoding("utf8");
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      assert.deepEqual(JSON.parse(body), { workerId, jobId });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ receipt, publishingEnabled: false }));
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const address = server.address();
  const outputPath = path.join(dir, "handoff", "receipt.json");
  fs.mkdirSync(path.dirname(outputPath), { mode: 0o700 });
  const child = spawn(process.execPath, [
    path.join(process.cwd(), "scripts", "worker-runner.mjs"),
    "--issue-quarantine-release",
    "--worker-id", workerId,
    "--job-id", jobId,
    "--attempt-id", attemptId,
    "--artifact-sha256", artifactSha256,
    "--receipt-output", outputPath
  ], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DASHBOARD_API_URL: `http://127.0.0.1:${address.port}`,
      DASHBOARD_OPERATOR_TOKEN: "operator-token-012345678901234567",
      DASHBOARD_QUARANTINE_RELEASE_TOKEN: "release-token-012345678901234567",
      DASHBOARD_QUARANTINE_SIGNING_PUBLIC_KEY: publicKeyPem
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  const result = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (status, signal) => resolve({ status, signal, stdout, stderr }));
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const saved = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.deepEqual(saved, receipt);
  assert.equal(fs.statSync(outputPath).mode & 0o777, 0o600);
  assert.match(result.stdout, /"publishingEnabled":false/);
});


test("dashboard issues a signed quarantine release only for a terminal verified private upload and audits issuance", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-quarantine-release-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const portProbe = http.createServer();
  await new Promise((resolve, reject) => {
    portProbe.once("error", reject);
    portProbe.listen(0, "127.0.0.1", resolve);
  });
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));

  const operatorToken = "dashboard-release-operator-token-" + "x".repeat(40);
  const releaseToken = "dashboard-release-separate-token-" + "y".repeat(40);
  const workerId = "verified-worker-01";
  const jobId = "verified-private-job-123";
  const attemptId = "verified-attempt-456";
  const artifactSha256 = "f".repeat(64);
  const channelId = "UC" + "s".repeat(22);
  const remoteVideoId = "remote-private-video-789";
  const actualPublishedAt = "2026-11-05T17:00:00.000Z";
  const statePath = path.join(dir, "dashboard-state.json");
  fs.writeFileSync(statePath, JSON.stringify({
    version: 1, queueItems: [], campaigns: [], audit: [],
    jobs: [{
      id: jobId, kind: "CONTENT_PRODUCTION", state: "PRIVATE_UPLOAD_VERIFIED",
      uploadReceipt: {
        jobId, attemptId, artifactSha256, videoId: remoteVideoId,
        channelId, channelTitle: "SonicVhibez", privacyStatus: "private",
        remoteStatusVerified: true, publishingEnabled: false, actualPublishedAt
      }
    }],
    uploads: [], facebookDrafts: [], facebookPosts: [], facebookAttempts: []
  }) + "\n", { mode: 0o600 });
  fs.writeFileSync(path.join(dir, "upload-attempts.json"), JSON.stringify({
    attempts: [{
      attemptId, jobId, artifactSha256, status: "PRIVATE_UPLOAD_VERIFIED",
      remoteVideoId, channelId, channelTitle: "SonicVhibez",
      visibility: "private", publishingEnabled: false
    }]
  }) + "\n", { mode: 0o600 });

  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: operatorToken,
      DASHBOARD_OPERATOR_ID: "release-test-operator@example.test",
      DASHBOARD_QUARANTINE_RELEASE_TOKEN: releaseToken,
      DASHBOARD_QUARANTINE_SIGNING_PRIVATE_KEY: privateKeyPem,
      DASHBOARD_STATE_DIR: dir,
      UPLOAD_LOG_DIR: dir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      SONICVHIBEZ_CHANNEL_ID: channelId,
      YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "",
      YOUTUBE_EMERGENCY_STOP: "YES"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await new Promise(resolve => {
        if (child.exitCode !== null || child.signalCode !== null) return resolve();
        child.once("exit", resolve);
        setTimeout(resolve, 5000);
      });
    }
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  });

  const base = "http://127.0.0.1:" + port;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null || child.signalCode !== null) break;
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard failed to start: " + logs);

  const response = await fetch(base + "/api/worker/quarantine-release", {
    method: "POST",
    headers: {
      "x-operator-token": operatorToken,
      "x-quarantine-release-token": releaseToken,
      "content-type": "application/json"
    },
    body: JSON.stringify({ workerId, jobId })
  });
  assert.equal(response.status, 200, await response.clone().text());
  const payload = await response.json();
  assert.equal(payload.publishingEnabled, false);
  assert.equal(verifyWorkerQuarantineReleaseReceipt(payload.receipt, {
    workerId, jobId, attemptId, artifactSha256, publicKeyPem
  }).jobId, jobId);

  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const audit = persisted.audit.filter(item => item.action === "WORKER_QUARANTINE_RELEASE_RECEIPT_ISSUED");
  assert.equal(audit.length, 1);
  assert.equal(audit[0].jobId, jobId);
  assert.equal(audit[0].workerId, workerId);
  assert.equal(audit[0].attemptId, attemptId);
  assert.equal(audit[0].artifactSha256, artifactSha256);
  assert.equal(persisted.jobs[0].state, "PRIVATE_UPLOAD_VERIFIED");
  assert.equal(fs.existsSync(path.join(dir, "worker-backoff-" + crypto.createHash("sha256").update(workerId).digest("hex").slice(0, 20) + ".json")), false,
    "dashboard issuance must not mutate worker quarantine state");
});
