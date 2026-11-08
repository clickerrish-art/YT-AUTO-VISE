import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runWorker, readCooldownStateFile, parseRetryAfterMs } from "../scripts/worker-runner.mjs";

const token = "worker-backoff-test-token-" + "x".repeat(32);
const workerId = "worker-backoff-restart-test";

test("Retry-After parser supports delta seconds and HTTP dates with bounded fallback", () => {
  const now = Date.parse("2026-11-07T12:00:00.000Z");
  assert.equal(parseRetryAfterMs("60", now), 60_000);
  assert.equal(parseRetryAfterMs("2026-11-07T12:01:30.000Z", now), 90_000);
  assert.equal(parseRetryAfterMs("invalid", now), 30_000);
  assert.equal(parseRetryAfterMs("0", now), 1_000);
  assert.equal(parseRetryAfterMs("99999", now), 15 * 60_000);
});


async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return "http://127.0.0.1:" + server.address().port;
}

test("worker persists retry backoff across process restarts and does not immediately redispatch a blocked job", async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-backoff-"));
  const statePath = path.join(directory, "worker-backoff.json");
  let produceRequests = 0;
  const server = createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url?.startsWith("/api/jobs/dispatchable")) {
      const jobs = produceRequests === 0 ? [{ id: "job-awaiting-render-prerequisites" }] : [];
      res.end(JSON.stringify({ jobs, queuedCount: jobs.length }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/jobs/produce") {
      produceRequests += 1;
      res.writeHead(409, { "retry-after": "60", "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Authoring job failed render preflight", detail: "Approved scene evidence is missing", jobState: "FAILED", retryable: true, requiresOperatorRetry: true, deadLettered: false, publishable: false, publishingEnabled: false }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
  const baseUrl = await listen(server);
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const firstCycles = [];
  await runWorker({ baseUrl, token, workerId, once: true, cooldownStatePath: statePath, onCycle: value => firstCycles.push(value) });
  assert.equal(produceRequests, 1);
  assert.equal(firstCycles[0].results[0].httpStatus, 409);
  assert.equal(firstCycles[0].results[0].responseError, "Approved scene evidence is missing");
  assert.equal(firstCycles[0].results[0].jobState, "FAILED");
  assert.equal(firstCycles[0].results[0].retryable, true);
  assert.equal(firstCycles[0].results[0].requiresOperatorRetry, true);
  assert.equal(firstCycles[0].results[0].deadLettered, false);
  assert.equal(firstCycles[0].results[0].publishable, false);
  assert.equal(firstCycles[0].results[0].status, "OPERATOR_REQUIRED");
  assert.equal(Object.hasOwn(firstCycles[0].results[0], "retryAfterMs"), false,
    "operator-only remediation must not be represented as a timed automatic retry");
  const saved = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(saved.schemaVersion, 1);
  assert.equal(saved.workerId, workerId);
  assert.equal(Object.hasOwn(saved.cooldowns, "job-awaiting-render-prerequisites"), false,
    "the dashboard has removed this job from automatic dispatch; no local retry cooldown should be written");
  assert.equal(fs.statSync(statePath).mode & 0o777, 0o600, "retry state must be private to the worker account");

  const restartedCycles = [];
  await runWorker({ baseUrl, token, workerId, once: true, cooldownStatePath: statePath, onCycle: value => restartedCycles.push(value) });
  assert.equal(restartedCycles[0].deferredByBackoff, 0);
  assert.deepEqual(restartedCycles[0].results, []);
  assert.equal(produceRequests, 1, "the dashboard must keep an operator-blocked job out of automatic dispatch after restart");
});

test("worker refuses corrupt or symlinked retry state instead of resetting backoff", async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-backoff-unsafe-"));
  const statePath = path.join(directory, "worker-backoff.json");
  const targetPath = path.join(directory, "target.json");
  const server = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ jobs: [], queuedCount: 0 }));
  });
  const baseUrl = await listen(server);
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  fs.writeFileSync(statePath, "{not-json");
  await assert.rejects(
    runWorker({ baseUrl, token, workerId, once: true, cooldownStatePath: statePath, onCycle: () => assert.fail("corrupt state must fail before polling") }),
    /corrupt|unreadable/i,
  );

  fs.rmSync(statePath);
  fs.writeFileSync(targetPath, JSON.stringify({ schemaVersion: 1, workerId, cooldowns: {} }));
  fs.symlinkSync(targetPath, statePath);
  await assert.rejects(
    runWorker({ baseUrl, token, workerId, once: true, cooldownStatePath: statePath, onCycle: () => assert.fail("symlinked state must fail before polling") }),
    /regular file|unsafe path/i,
  );
});

test("worker stops after a dispatch conflict when retry-backoff persistence fails", async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-backoff-write-failure-"));
  const stateDirectory = path.join(directory, "worker-state");
  fs.mkdirSync(stateDirectory);
  let produceRequests = 0;
  const server = createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url?.startsWith("/api/jobs/dispatchable")) {
      res.end(JSON.stringify({ jobs: [{ id: "job-blocked-by-render-prerequisites" }], queuedCount: 1 }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/jobs/produce") {
      produceRequests += 1;
      // Make the cooldown-state parent unusable after the worker has loaded its
      // initial state but before it attempts to persist the 409 backoff.
      // Preserve the active process lock while making the configured state parent unusable.
      fs.renameSync(stateDirectory, stateDirectory + ".held");
      fs.writeFileSync(stateDirectory, "parent directory replaced during dispatch");
      res.statusCode = 409;
      res.end(JSON.stringify({ error: "render prerequisites are not satisfied", publishingEnabled: false }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
  const baseUrl = await listen(server);
  const errors = [];
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  await assert.rejects(
    runWorker({
      baseUrl,
      token,
      workerId,
      once: false,
      pollIntervalMs: 1_000,
      stateDirectory,
      cooldownStatePath: path.join(stateDirectory, "worker-backoff.json"),
      onError: error => errors.push(error),
      shouldStop: () => produceRequests >= 2
    }),
    error => error?.code === "WORKER_BACKOFF_PERSISTENCE_FAILED"
  );

  assert.equal(produceRequests, 1, "the worker must stop rather than retrying before a cooldown can be persisted");
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "WORKER_BACKOFF_PERSISTENCE_FAILED");
});


test("worker retains its process lock when uncertain dispatch quarantine cannot be persisted", async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-uncertain-write-failure-"));
  const stateDirectory = path.join(directory, "worker-state");
  fs.mkdirSync(stateDirectory);
  const statePath = path.join(stateDirectory, "worker-backoff.json");
  let produceRequests = 0;
  const server = createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url?.startsWith("/api/jobs/dispatchable")) {
      res.end(JSON.stringify({ jobs: [{ id: "job-uncertain-dispatch" }], queuedCount: 1 }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/jobs/produce") {
      produceRequests += 1;
      // Simulate the API accepting the POST while the worker loses its durable
      // state directory before the response can be observed.
      fs.renameSync(stateDirectory, stateDirectory + ".held");
      fs.writeFileSync(stateDirectory, "state directory replaced during uncertain dispatch");
      req.socket.destroy();
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
  const baseUrl = await listen(server);
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  await assert.rejects(
    runWorker({
      baseUrl, token, workerId, once: false, pollIntervalMs: 1_000,
      stateDirectory, cooldownStatePath: statePath
    }),
    error => error?.code === "WORKER_BACKOFF_PERSISTENCE_FAILED"
  );
  assert.equal(produceRequests, 1, "an uncertain POST must never be automatically repeated");
  const retainedLockPath = stateDirectory + ".held/worker-backoff.json.process.lock";
  assert.equal(fs.existsSync(retainedLockPath), true,
    "the process lock must remain with the renamed state directory as a fail-closed fence when quarantine persistence fails");
  await assert.rejects(
    runWorker({
      baseUrl, token, workerId, once: true,
      stateDirectory: stateDirectory + ".held",
      cooldownStatePath: path.join(stateDirectory + ".held", "worker-backoff.json")
    }),
    /already locked|quarantine release/i,
    "a restart must not clear the retained uncertainty fence"
  );
});

test("worker persists Retry-After backoff after HTTP 429 and honors it after restart", async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-rate-limit-"));
  const statePath = path.join(directory, "worker-backoff.json");
  let produceRequests = 0;
  const server = createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url?.startsWith("/api/jobs/dispatchable")) {
      res.end(JSON.stringify({ jobs: [{ id: "job-rate-limited" }], queuedCount: 1 }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/jobs/produce") {
      produceRequests += 1;
      res.writeHead(429, { "retry-after": "60", "content-type": "application/json" });
      res.end(JSON.stringify({ error: "rate limited", publishingEnabled: false }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
  const baseUrl = await listen(server);
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const firstCycles = [];
  await runWorker({ baseUrl, token, workerId, once: true, cooldownStatePath: statePath, onCycle: value => firstCycles.push(value) });
  assert.equal(produceRequests, 1);
  assert.equal(firstCycles[0].results[0].httpStatus, 429);
  assert.equal(firstCycles[0].results[0].status, "NOT_DISPATCHED");
  assert.ok(firstCycles[0].results[0].retryAfterMs >= 60_000);
  const saved = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(saved.cooldowns["job-rate-limited"].attempts, 1);
  assert.ok(saved.cooldowns["job-rate-limited"].nextAttemptAt >= Date.now() + 59_000);

  const restartedCycles = [];
  await runWorker({ baseUrl, token, workerId, once: true, cooldownStatePath: statePath, onCycle: value => restartedCycles.push(value) });
  assert.equal(restartedCycles[0].deferredByBackoff, 1);
  assert.deepEqual(restartedCycles[0].results, []);
  assert.equal(produceRequests, 1, "restart must honor the provider's Retry-After window");
});


test("worker cooldown reader pins a regular file and refuses final-component symlinks", t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-state-reader-"));
  const statePath = path.join(directory, "worker-backoff.json");
  const targetPath = path.join(directory, "target.json");
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const state = JSON.stringify({ schemaVersion: 1, workerId, cooldowns: {} });
  fs.writeFileSync(statePath, state, { mode: 0o600 });
  assert.equal(readCooldownStateFile(statePath), state);
  fs.renameSync(statePath, targetPath);
  fs.symlinkSync(targetPath, statePath);
  assert.throws(() => readCooldownStateFile(statePath), error =>
    error?.code === "ELOOP" || /symbolic link|too many levels/i.test(error?.message ?? ""));
});


test("worker cooldown reader rejects a symlinked parent directory", t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-state-parent-"));
  const outside = path.join(directory, "outside");
  const linked = path.join(directory, "linked");
  fs.mkdirSync(outside);
  const targetPath = path.join(outside, "worker-backoff.json");
  const state = JSON.stringify({ schemaVersion: 1, workerId, cooldowns: {} });
  fs.writeFileSync(targetPath, state, { mode: 0o600 });
  fs.symlinkSync(outside, linked, "dir");
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  assert.throws(() => readCooldownStateFile(path.join(linked, "worker-backoff.json")), /symbolic link/i);
});
