import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseRetryAfterMs, runWorker, runWorkerCycle } from "../scripts/worker-runner.mjs";
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

test("worker accepts bracketed IPv6 loopback while retaining loopback-only HTTP policy", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    return new Response(JSON.stringify({ jobs: [], queuedCount: 0 }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  const result = await runWorkerCycle({
    baseUrl: "http://[::1]:8787",
    token,
    workerId,
    fetchImpl
  });
  assert.equal(result.discovered, 0);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "http://[::1]:8787/api/jobs/dispatchable?limit=20");
  assert.equal(requests[0].options.headers["x-worker-token"], token);
  await assert.rejects(runWorkerCycle({ baseUrl: "http://example.com", token, workerId, fetchImpl }), /restricted to loopback/);
});

test("worker refuses API redirects so scoped worker credentials cannot be forwarded", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    assert.equal(options.redirect, "error", "all worker API requests must reject redirects");
    if (options.method === "POST") throw new TypeError("fetch redirect rejected");
    return new Response(JSON.stringify({ jobs: [{ id: "redirected-job" }], queuedCount: 1 }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  await assert.rejects(
    runWorkerCycle({ baseUrl: "http://127.0.0.1:8787", token, workerId, fetchImpl }),
    error => error.code === "WORKER_DISPATCH_OUTCOME_UNCERTAIN" && error.retryable === false
  );
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.headers["x-worker-token"], token);
  assert.equal(requests[1].options.headers["x-worker-token"], token);
  assert.equal(requests[1].url, "http://127.0.0.1:8787/api/jobs/produce");
});

test("native fetch does not forward worker credentials to a redirect destination", async t => {
  const receivedAtRedirectTarget = [];
  const redirectTarget = createServer((req, res) => {
    receivedAtRedirectTarget.push({ url: req.url, workerToken: req.headers["x-worker-token"] });
    res.end("unexpected redirect target request");
  });
  const redirectTargetUrl = await listen(redirectTarget);
  t.after(() => new Promise(resolve => redirectTarget.close(resolve)));

  const api = createServer((req, res) => {
    res.writeHead(302, { location: redirectTargetUrl + "/collect", "content-type": "application/json" });
    res.end(JSON.stringify({ jobs: [] }));
  });
  const apiUrl = await listen(api);
  t.after(() => new Promise(resolve => api.close(resolve)));

  await assert.rejects(runWorkerCycle({ baseUrl: apiUrl, token, workerId }), /fetch failed|redirect/i);
  assert.deepEqual(receivedAtRedirectTarget, [], "redirect destination must never receive the worker token or request");
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


test("continuous worker stops after HTTP 408/5xx dispatch responses with uncertain outcome", async t => {
  for (const status of [408, 503]) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-http-uncertain-"));
    const statePath = path.join(tempDir, "cooldowns.json");
    const requests = [];
    const errors = [];
    const fetchImpl = async (url, options = {}) => {
      const method = options.method ?? "GET";
      requests.push({
        method,
        url: String(url),
        body: options.body ? JSON.parse(options.body) : null
      });
      if (method === "GET") {
        return new Response(JSON.stringify({
          jobs: [
            { id: "job-outcome-unknown-" + status, state: "QUEUED" },
            { id: "job-must-not-dispatch-" + status, state: "QUEUED" }
          ],
          queuedCount: 2,
          publishingEnabled: false
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "upstream timeout" }), {
        status,
        headers: { "content-type": "application/json" }
      });
    };
    try {
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
        error => error?.code === "WORKER_DISPATCH_OUTCOME_UNCERTAIN" &&
          error.status === status && error.retryable === false
      );
      assert.deepEqual(requests.map(item => item.method), ["GET", "POST"],
        "an uncertain HTTP " + status + " response must stop the worker before another queued job is dispatched");
      assert.equal(requests[1].body.jobId, "job-outcome-unknown-" + status);
      assert.equal(errors.length, 1);
      assert.equal(errors[0].code, "WORKER_DISPATCH_OUTCOME_UNCERTAIN");
      assert.equal(errors[0].status, status);
      assert.equal(fs.existsSync(statePath), true,
        "uncertain remote outcomes must persist quarantine state");
      const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
      assert.equal(persisted.uncertainDispatches["job-outcome-unknown-" + status].code,
        "WORKER_DISPATCH_OUTCOME_UNCERTAIN");
      assert.equal(Object.hasOwn(persisted.cooldowns, "job-outcome-unknown-" + status), false,
        "uncertain remote outcomes must not be converted into a normal retry cooldown");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
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

test("worker caps an excessive HTTP-date Retry-After to the maximum cooldown", async () => {
  const retryAfter = new Date(Date.now() + 2 * 60 * 60_000).toUTCString();
  const cooldowns = new Map();
  const fetchImpl = async (url, options = {}) => {
    if ((options.method ?? "GET") === "GET") {
      return new Response(JSON.stringify({ jobs: [{ id: "job-excessive-retry-after" }], queuedCount: 1 }), {
        status: 200, headers: { "content-type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: "rate limited" }), {
      status: 429, headers: { "content-type": "application/json", "retry-after": retryAfter }
    });
  };
  const before = Date.now();
  await runWorkerCycle({ baseUrl: "http://127.0.0.1:8787", token, workerId, fetchImpl, cooldowns });
  const delayMs = cooldowns.get("job-excessive-retry-after").nextAttemptAt - before;
  assert.ok(delayMs >= 899_000, "cooldown must not be shorter than the 15-minute cap");
  assert.ok(delayMs <= 901_000, "untrusted Retry-After values must not extend cooldown beyond 15 minutes");
});

test("worker falls back safely when Retry-After is malformed or already expired", async () => {
  for (const retryAfter of ["not-a-date", new Date(Date.now() - 60_000).toUTCString()]) {
    const cooldowns = new Map();
    const fetchImpl = async (url, options = {}) => {
      if ((options.method ?? "GET") === "GET") {
        return new Response(JSON.stringify({ jobs: [{ id: "job-invalid-retry-after" }], queuedCount: 1 }), {
          status: 200, headers: { "content-type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ error: "rate limited" }), {
        status: 429, headers: { "content-type": "application/json", "retry-after": retryAfter }
      });
    };
    const before = Date.now();
    await runWorkerCycle({ baseUrl: "http://127.0.0.1:8787", token, workerId, fetchImpl, cooldowns });
    const delayMs = cooldowns.get("job-invalid-retry-after").nextAttemptAt - before;
    assert.ok(delayMs >= 29_000, "invalid or expired Retry-After must use exponential fallback");
    assert.ok(delayMs <= 31_000, "first-attempt fallback must remain bounded to 30 seconds");
  }
});

test("worker honors Retry-After when the dispatchable-job listing is rate limited", async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-list-rate-limit-"));
  const statePath = path.join(directory, "worker-backoff.json");
  let listingRequests = 0;
  let stopping = false;
  const fetchImpl = async () => {
    listingRequests += 1;
    if (listingRequests === 1) {
      return new Response(JSON.stringify({ error: "rate limited" }), {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": "2" }
      });
    }
    return new Response(JSON.stringify({ jobs: [], queuedCount: 0 }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  };
  const errors = [];
  const startedAt = Date.now();
  try {
    await runWorker({
      baseUrl: "http://127.0.0.1:8787",
      token,
      workerId,
      pollIntervalMs: 1_000,
      once: false,
      cooldownStatePath: statePath,
      fetchImpl,
      onError: error => errors.push(error),
      onCycle: () => { stopping = true; },
      shouldStop: () => stopping
    });
    assert.equal(listingRequests, 2);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].status, 429);
    assert.ok(Date.now() - startedAt >= 1_900, "the worker must wait for the server Retry-After rather than polling at its shorter interval");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("Retry-After parser clamps excessive values and safely falls back for malformed or expired dates", () => {
  const now = Date.parse("2026-11-04T12:00:00.000Z");
  assert.equal(parseRetryAfterMs("60", now), 60_000);
  assert.equal(parseRetryAfterMs("not-a-date", now), 30_000);
  assert.equal(parseRetryAfterMs(new Date(now - 60_000).toUTCString(), now), 30_000);
  assert.equal(parseRetryAfterMs(new Date(now + 2 * 60 * 60_000).toUTCString(), now), 15 * 60_000);
  assert.equal(parseRetryAfterMs("0", now), 1_000);
});


test("worker persists retry cooldown across restart and does not redispatch early", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-restart-backoff-"));
  const statePath = path.join(directory, "worker-backoff.json");
  let postCount = 0;
  let firstCycle;
  const fetchImpl = async (url, options = {}) => {
    if ((options.method ?? "GET") === "GET") {
      return new Response(JSON.stringify({
        jobs: [{ id: "job-persisted-backoff", state: "QUEUED" }],
        queuedCount: 1,
        publishingEnabled: false
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    postCount += 1;
    return new Response(JSON.stringify({ error: "rate limited" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "900" }
    });
  };
  try {
    await runWorker({
      baseUrl: "http://127.0.0.1:8787",
      token,
      workerId,
      once: true,
      pollIntervalMs: 1_000,
      cooldownStatePath: statePath,
      fetchImpl,
      onCycle: result => { firstCycle = result; }
    });
    assert.equal(postCount, 1);
    assert.equal(firstCycle.results[0].httpStatus, 429);
    const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(persisted.schemaVersion, 1);
    assert.equal(persisted.workerId, workerId);
    assert.equal(persisted.cooldowns["job-persisted-backoff"].attempts, 1);
    assert.ok(persisted.cooldowns["job-persisted-backoff"].nextAttemptAt > Date.now());

    let restartedCycle;
    await runWorker({
      baseUrl: "http://127.0.0.1:8787",
      token,
      workerId,
      once: true,
      pollIntervalMs: 1_000,
      cooldownStatePath: statePath,
      fetchImpl,
      onCycle: result => { restartedCycle = result; }
    });
    assert.equal(postCount, 1, "restart must not redispatch the job while its persisted cooldown is active");
    assert.equal(restartedCycle.deferredByBackoff, 1);
    assert.deepEqual(restartedCycle.results, []);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("worker refuses corrupt persisted cooldown state without contacting the dispatch API", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-corrupt-backoff-"));
  const statePath = path.join(directory, "worker-backoff.json");
  fs.writeFileSync(statePath, "{invalid-json");
  let requests = 0;
  try {
    await assert.rejects(runWorker({
      baseUrl: "http://127.0.0.1:8787",
      token,
      workerId,
      once: true,
      pollIntervalMs: 1_000,
      cooldownStatePath: statePath,
      fetchImpl: async () => {
        requests += 1;
        return new Response(JSON.stringify({ jobs: [] }), {
          status: 200, headers: { "content-type": "application/json" }
        });
      }
    }), /unreadable or corrupt; refusing to reset retry backoff/);
    assert.equal(requests, 0, "corrupt backoff state must fail before any dispatch request");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("separate worker processes preserve retry cooldown across an actual process restart", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-process-restart-"));
  const statePath = path.join(directory, "worker-backoff.json");
  let postCount = 0;
  const server = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url?.startsWith("/api/jobs/dispatchable")) {
      res.end(JSON.stringify({
        jobs: [{ id: "job-process-restart", state: "QUEUED" }],
        queuedCount: 1,
        publishingEnabled: false
      }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/jobs/produce") {
      postCount += 1;
      res.statusCode = 429;
      res.setHeader("retry-after", "900");
      res.end(JSON.stringify({ error: "rate limited" }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });

  const runWorkerProcess = baseUrl => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      fileURLToPath(new URL("../scripts/worker-runner.mjs", import.meta.url)),
      "--once"
    ], {
      env: {
        ...process.env,
        DASHBOARD_API_URL: baseUrl,
        DASHBOARD_WORKER_TOKEN: token,
        DASHBOARD_WORKER_ID: workerId,
        WORKER_POLL_INTERVAL_MS: "1000",
        WORKER_BACKOFF_STATE_PATH: statePath
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", chunk => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", chunk => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error("Worker child exited with code " + code + " signal " + signal + ": " + stderr));
    });
  });

  try {
    const baseUrl = await listen(server);
    const first = await runWorkerProcess(baseUrl);
    assert.match(first.stdout, /"httpStatus":429/);
    assert.equal(postCount, 1, "the first process should make exactly one rate-limited dispatch attempt");
    const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(persisted.cooldowns["job-process-restart"].attempts, 1);
    assert.ok(persisted.cooldowns["job-process-restart"].nextAttemptAt > Date.now());

    const restarted = await runWorkerProcess(baseUrl);
    assert.match(restarted.stdout, /"deferredByBackoff":1/);
    assert.equal(postCount, 1, "a fresh OS process must not redispatch during the persisted cooldown");
    assert.match(restarted.stdout, /"results":\[\]/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});



test("separate worker processes quarantine an uncertain dispatch across restart", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-worker-uncertain-process-restart-"));
  const statePath = path.join(directory, "worker-backoff.json");
  let postCount = 0;
  const server = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.method === "GET" && req.url?.startsWith("/api/jobs/dispatchable")) {
      res.end(JSON.stringify({ jobs: [{ id: "job-uncertain-restart", state: "QUEUED" }], queuedCount: 1, publishingEnabled: false }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/jobs/produce") {
      postCount += 1;
      // Simulate the server accepting the operation, then returning an ambiguous 5xx.
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "response lost after acceptance" }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
  const runWorkerProcess = baseUrl => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL("../scripts/worker-runner.mjs", import.meta.url)), "--once"], {
      env: { ...process.env, DASHBOARD_API_URL: baseUrl, DASHBOARD_WORKER_TOKEN: token, DASHBOARD_WORKER_ID: workerId,
        WORKER_POLL_INTERVAL_MS: "1000", WORKER_BACKOFF_STATE_PATH: statePath },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "", stderr = "";
    child.stdout.setEncoding("utf8").on("data", chunk => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", chunk => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
  try {
    const baseUrl = await listen(server);
    const first = await runWorkerProcess(baseUrl);
    assert.equal(first.code, 2, "the first process must stop after an uncertain dispatch outcome");
    assert.match(first.stderr, /outcome is uncertain and requires reconciliation/i);
    assert.equal(postCount, 1);
    const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
    assert.equal(persisted.uncertainDispatches["job-uncertain-restart"].code, "WORKER_DISPATCH_OUTCOME_UNCERTAIN");
    assert.ok(Number.isFinite(Date.parse(persisted.uncertainDispatches["job-uncertain-restart"].recordedAt)));

    const restarted = await runWorkerProcess(baseUrl);
    assert.equal(restarted.code, 0, restarted.stderr);
    assert.match(restarted.stdout, /"deferredByUncertainOutcome":1/);
    assert.match(restarted.stdout, /"results":\[\]/);
    assert.equal(postCount, 1, "a fresh OS process must not repeat a dispatch whose remote outcome is uncertain");
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
