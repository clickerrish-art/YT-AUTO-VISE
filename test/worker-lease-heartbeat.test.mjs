import test from "node:test";
import assert from "node:assert/strict";
import { startWorkerLeaseHeartbeat } from "../scripts/worker-lease-heartbeat.mjs";

function manualScheduler() {
  const pending = [];
  return {
    pending,
    schedule(callback, delay) {
      const task = { callback, delay, cancelled: false };
      pending.push(task);
      return task;
    },
    cancel(task) { task.cancelled = true; },
    async runNext() {
      const task = pending.shift();
      assert.ok(task, "expected a scheduled heartbeat");
      if (!task.cancelled) await task.callback();
    }
  };
}

test("worker lease heartbeat renews serially and stops scheduling after shutdown", async () => {
  const scheduler = manualScheduler();
  const calls = [];
  const heartbeat = startWorkerLeaseHeartbeat({
    intervalMs: 30_000,
    schedule: scheduler.schedule,
    cancel: scheduler.cancel,
    heartbeat: async () => { calls.push("renewed"); }
  });
  assert.equal(scheduler.pending.length, 1);
  assert.equal(scheduler.pending[0].delay, 30_000);
  await scheduler.runNext();
  assert.deepEqual(calls, ["renewed"]);
  assert.equal(scheduler.pending.length, 1);
  await heartbeat.stop();
  assert.equal(scheduler.pending[0].cancelled, true);
  assert.equal(await heartbeat.stop(), null);
});

test("worker lease heartbeat fails closed and invokes the abort callback once", async () => {
  const scheduler = manualScheduler();
  const expected = new Error("lease token is stale");
  const failures = [];
  const heartbeat = startWorkerLeaseHeartbeat({
    intervalMs: 1_000,
    schedule: scheduler.schedule,
    cancel: scheduler.cancel,
    heartbeat: async () => { throw expected; },
    onFailure: error => failures.push(error)
  });
  await scheduler.runNext();
  assert.equal(heartbeat.failure, expected);
  assert.deepEqual(failures, [expected]);
  assert.equal(scheduler.pending.length, 0, "failed renewal must not schedule another heartbeat");
  assert.equal(await heartbeat.stop(), expected);
});

test("worker heartbeat shutdown waits for an in-flight renewal and never reschedules it", async () => {
  const pending = [];
  let resolveRenewal;
  let started;
  const startedPromise = new Promise(resolve => { started = resolve; });
  const renewal = new Promise(resolve => { resolveRenewal = resolve; });
  const heartbeat = startWorkerLeaseHeartbeat({
    intervalMs: 1_000,
    schedule(callback, delay) {
      const task = { callback, delay, cancelled: false };
      pending.push(task);
      return task;
    },
    cancel(task) { task.cancelled = true; },
    heartbeat: async () => {
      started();
      await renewal;
    }
  });
  const tick = pending.shift();
  const runningTick = tick.callback();
  await startedPromise;
  let stopped = false;
  const stopping = heartbeat.stop().then(error => {
    stopped = true;
    return error;
  });
  await Promise.resolve();
  assert.equal(stopped, false, "stop must wait for the in-flight lease renewal to settle");
  resolveRenewal();
  await runningTick;
  assert.equal(await stopping, null);
  assert.equal(stopped, true);
  assert.equal(pending.length, 0, "shutdown must prevent another heartbeat from being scheduled");
});
