import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { runWorker, runWorkerCycle } from "../scripts/worker-runner.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const token = "worker-test-token-" + "x".repeat(32);
const workerId = "worker-integration-test";

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return "http://127.0.0.1:" + server.address().port;
}

test("worker dispatches listed jobs sequentially and records fail-closed conflicts", async t => {
  const requests = [];
  const server = createServer(async (req, res) => {
    requests.push({ method: req.method, url: req.url, workerToken: req.headers["x-worker-token"], workerId: req.headers["x-worker-id"] });
    res.setHeader("content-type", "application/json");
    if (req.url.startsWith("/api/jobs/dispatchable")) {
      res.end(JSON.stringify({
        jobs: [
          { id: "job-one", state: "QUEUED", contentType: "short" },
          { id: "job-two", state: "QUEUED", contentType: "long_form" }
        ],
        queuedCount: 3,
        queuedWithoutApprovedAuthoring: 1,
        queuedWithoutApprovedRenderPlan: 2,
        publishingEnabled: false
      }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/jobs/produce") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const jobId = JSON.parse(body).jobId;
      if (jobId === "job-two") {
        res.statusCode = 409;
        res.end(JSON.stringify({ error: "renderer prerequisites are not satisfied", publishingEnabled: false }));
      } else {
        res.end(JSON.stringify({ job: { id: jobId, state: "GENERATED" }, publishingEnabled: false }));
      }
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
  const baseUrl = await listen(server);
  t.after(() => new Promise(resolve => server.close(resolve)));

  const cooldowns = new Map();
  const result = await runWorkerCycle({ baseUrl, token, workerId, cooldowns });
  assert.equal(result.discovered, 2);
  assert.equal(result.queuedCount, 3);
  assert.equal(result.queuedWithoutApprovedAuthoring, 1);
  assert.equal(result.queuedWithoutApprovedRenderPlan, 2);
  assert.equal(result.deferredByBackoff, 0);
  assert.deepEqual(result.results, [
    { jobId: "job-one", status: "SUCCEEDED", httpStatus: 200, state: "GENERATED" },
    { jobId: "job-two", status: "NOT_DISPATCHED", httpStatus: 409, state: null, retryAfterMs: 30_000 }
  ]);
  assert.equal(result.publishingEnabled, false);
  assert.deepEqual(requests.map(item => item.method + " " + item.url.split("?")[0]), [
    "GET /api/jobs/dispatchable",
    "POST /api/jobs/produce",
    "POST /api/jobs/produce"
  ]);
  assert.ok(requests.every(item => item.workerToken === token && item.workerId === workerId));

  const requestsBeforeCooldownCycle = requests.length;
  const secondCycle = await runWorkerCycle({ baseUrl, token, workerId, cooldowns });
  assert.equal(secondCycle.deferredByBackoff, 1, "a preflight conflict must not be retried on every polling interval");
  assert.equal(secondCycle.results.some(item => item.jobId === "job-two"), false);
  assert.equal(requests.slice(requestsBeforeCooldownCycle).some(item => item.url === "/api/jobs/produce" && item.method === "POST"), true);
  assert.equal(cooldowns.get("job-two").attempts, 1);
  assert.ok(cooldowns.get("job-two").nextAttemptAt > Date.now());
});

test("worker rejects unencrypted non-loopback API destinations before sending credentials", async () => {
  await assert.rejects(runWorkerCycle({ baseUrl: "http://example.com", token, workerId }), /restricted to loopback/);
});

test("worker requires a strong scoped credential and valid worker identity", async () => {
  await assert.rejects(runWorkerCycle({ baseUrl: "http://127.0.0.1:8787", token: "short", workerId }), /at least 24 characters/);
  await assert.rejects(runWorkerCycle({ baseUrl: "http://127.0.0.1:8787", token, workerId: "x" }), /safe 2–120 character identifier/);
});

test("worker fails closed when the dispatch API rejects its credential", async t => {
  const server = createServer((req, res) => {
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Worker authentication rejected" }));
  });
  const baseUrl = await listen(server);
  t.after(() => new Promise(resolve => server.close(resolve)));
  await assert.rejects(runWorkerCycle({ baseUrl, token, workerId }), /HTTP 401/);
});


test("worker stops its polling wait promptly after a shutdown signal", async t => {
  const server = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ jobs: [], queuedCount: 0, queuedWithoutApprovedAuthoring: 0, queuedWithoutApprovedRenderPlan: 0 }));
  });
  const baseUrl = await listen(server);
  t.after(() => new Promise(resolve => server.close(resolve)));
  let stopping = false;
  let cycles = 0;
  const startedAt = Date.now();
  await runWorker({
    baseUrl,
    token,
    workerId,
    pollIntervalMs: 60_000,
    once: false,
    onCycle: () => {
      cycles += 1;
      setTimeout(() => { stopping = true; }, 25);
    },
    shouldStop: () => stopping
  });
  assert.equal(cycles, 1);
  assert.ok(Date.now() - startedAt < 1_000, "worker shutdown should not wait for the full polling interval");
});

test("worker stops dispatching remaining jobs when shutdown is requested during an active dispatch", async t => {
  const dispatched = [];
  let stopping = false;
  const server = createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url?.startsWith("/api/jobs/dispatchable")) {
      res.end(JSON.stringify({ jobs: [{ id: "job-one" }, { id: "job-two" }], queuedCount: 2 }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/jobs/produce") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const jobId = JSON.parse(body).jobId;
      dispatched.push(jobId);
      // Simulate SIGTERM arriving while the first dispatch is in flight.
      stopping = true;
      res.end(JSON.stringify({ job: { id: jobId, state: "GENERATED" }, publishingEnabled: false }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
  const baseUrl = await listen(server);
  t.after(() => new Promise(resolve => server.close(resolve)));

  const result = await runWorkerCycle({
    baseUrl,
    token,
    workerId,
    cooldowns: new Map(),
    shouldStop: () => stopping
  });

  assert.deepEqual(dispatched, ["job-one"], "shutdown must prevent the next queued job from being dispatched");
  assert.equal(result.results.length, 1);
  assert.equal(result.stoppedBeforeDispatch, true);
  assert.equal(result.undispatchedAfterStop, 1);
});

test("continuous worker stops after a non-retryable API authorization failure", async t => {
  let polls = 0;
  const errors = [];
  const server = createServer((req, res) => {
    polls += 1;
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Worker authentication rejected" }));
  });
  const baseUrl = await listen(server);
  t.after(() => new Promise(resolve => server.close(resolve)));

  await assert.rejects(
    runWorker({
      baseUrl,
      token,
      workerId,
      once: false,
      pollIntervalMs: 1_000,
      onError: error => errors.push(error),
      shouldStop: () => false
    }),
    error => error?.code === "WORKER_API_HTTP_401" && error.retryable === false
  );
  assert.equal(polls, 1, "invalid worker credentials must not cause an endless polling loop");
  assert.equal(errors.length, 1);
});


test("continuous worker stops after a render dispatch transport failure with an uncertain outcome", async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-uncertain-"));
  const statePath = path.join(tempDir, "cooldowns.json");
  const requests = [];
  const errors = [];
  const fetchImpl = async (url, options = {}) => {
    const method = options.method ?? "GET";
    requests.push({ method, url: String(url) });
    if (method === "GET") {
      return new Response(JSON.stringify({
        jobs: [{ id: "job-outcome-unknown", state: "QUEUED" }],
        queuedCount: 1,
        publishingEnabled: false
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw new TypeError("connection closed after request submission");
  };
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  await assert.rejects(
    runWorker({
      baseUrl: "http://127.0.0.1:8787",
      token,
      workerId,
      once: false,
      pollIntervalMs: 1_000,
      cooldownStatePath: statePath,
      fetchImpl,
      onError: error => errors.push(error),
      shouldStop: () => false
    }),
    error => error?.code === "WORKER_DISPATCH_OUTCOME_UNCERTAIN" && error.retryable === false
  );
  assert.deepEqual(requests.map(item => item.method), ["GET", "POST"]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "WORKER_DISPATCH_OUTCOME_UNCERTAIN");
});


test("continuous worker stops after a successful-status dispatch returns an unreadable response", async t => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-unreadable-"));
  const statePath = path.join(tempDir, "cooldowns.json");
  const requests = [];
  const errors = [];
  const fetchImpl = async (url, options = {}) => {
    const method = options.method ?? "GET";
    requests.push({ method, url: String(url) });
    if (method === "GET") {
      return new Response(JSON.stringify({
        jobs: [{ id: "job-response-unreadable", state: "QUEUED" }],
        queuedCount: 1,
        publishingEnabled: false
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response("dispatch accepted but response body is not JSON", {
      status: 200,
      headers: { "content-type": "text/plain" }
    });
  };
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  await assert.rejects(
    runWorker({
      baseUrl: "http://127.0.0.1:8787",
      token,
      workerId,
      once: false,
      pollIntervalMs: 1_000,
      cooldownStatePath: statePath,
      fetchImpl,
      onError: error => errors.push(error),
      shouldStop: () => false
    }),
    error => error?.code === "WORKER_DISPATCH_OUTCOME_UNCERTAIN" && error.retryable === false
  );
  assert.deepEqual(requests.map(item => item.method), ["GET", "POST"]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "WORKER_DISPATCH_OUTCOME_UNCERTAIN");
});


test("worker honors an HTTP-date Retry-After value from the dispatch API", async () => {
  const retryAt = Date.now() + 60_000;
  const retryAfter = new Date(retryAt).toUTCString();
  const cooldowns = new Map();
  const fetchImpl = async (url, options = {}) => {
    if ((options.method ?? "GET") === "GET") {
      return new Response(JSON.stringify({ jobs: [{ id: "job-http-date-rate-limit" }], queuedCount: 1 }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: "rate limited" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": retryAfter }
    });
  };
  const result = await runWorkerCycle({ baseUrl: "http://127.0.0.1:8787", token, workerId, fetchImpl, cooldowns });
  const cooldown = cooldowns.get("job-http-date-rate-limit");
  assert.equal(result.results[0].httpStatus, 429);
  assert.equal(result.results[0].status, "NOT_DISPATCHED");
  assert.ok(cooldown.nextAttemptAt >= retryAt - 1_000, "HTTP-date Retry-After must be honored");
  assert.ok(cooldown.nextAttemptAt <= retryAt + 1_000, "HTTP-date Retry-After must not be extended unnecessarily");
});
