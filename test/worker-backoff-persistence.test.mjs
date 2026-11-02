import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runWorker } from "../scripts/worker-runner.mjs";

const token = "worker-backoff-test-token-" + "x".repeat(32);
const workerId = "worker-backoff-restart-test";

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
      res.end(JSON.stringify({ jobs: [{ id: "job-awaiting-render-prerequisites" }], queuedCount: 1 }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/jobs/produce") {
      produceRequests += 1;
      res.statusCode = 409;
      res.end(JSON.stringify({ error: "render prerequisites are not satisfied", publishingEnabled: false }));
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
  const saved = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(saved.schemaVersion, 1);
  assert.equal(saved.workerId, workerId);
  assert.equal(saved.cooldowns["job-awaiting-render-prerequisites"].attempts, 1);
  assert.ok(saved.cooldowns["job-awaiting-render-prerequisites"].nextAttemptAt > Date.now());
  assert.equal(fs.statSync(statePath).mode & 0o777, 0o600, "retry state must be private to the worker account");

  const restartedCycles = [];
  await runWorker({ baseUrl, token, workerId, once: true, cooldownStatePath: statePath, onCycle: value => restartedCycles.push(value) });
  assert.equal(restartedCycles[0].deferredByBackoff, 1);
  assert.deepEqual(restartedCycles[0].results, []);
  assert.equal(produceRequests, 1, "restart must not immediately retry a still-blocked job");
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
