import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { runWorkerCycle } from "../scripts/worker-runner.mjs";

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
    { jobId: "job-two", status: "NOT_DISPATCHED", httpStatus: 409, state: null }
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
