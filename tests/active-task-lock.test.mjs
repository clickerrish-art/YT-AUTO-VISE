import test from "node:test";
import assert from "node:assert/strict";
import { runExclusiveTask } from "../scripts/active-task-lock.mjs";

test("exclusive task lock is released after successful completion", async () => {
  const active = new Set();
  const result = await runExclusiveTask(active, "reconcile:job-1", async () => "verified");
  assert.deepEqual(result, { acquired: true, value: "verified" });
  assert.equal(active.has("reconcile:job-1"), false);
});

test("exclusive task lock rejects overlapping work without running it", async () => {
  const active = new Set(["reconcile:job-1"]);
  let called = false;
  const result = await runExclusiveTask(active, "reconcile:job-1", async () => { called = true; });
  assert.deepEqual(result, { acquired: false });
  assert.equal(called, false);
  assert.equal(active.has("reconcile:job-1"), true);
});

test("exclusive task lock is always released when work throws", async () => {
  const active = new Set();
  await assert.rejects(
    runExclusiveTask(active, "reconcile:job-1", async () => { throw new Error("simulated spawn failure"); }),
    /simulated spawn failure/
  );
  assert.equal(active.has("reconcile:job-1"), false);
  const retry = await runExclusiveTask(active, "reconcile:job-1", async () => "retry");
  assert.deepEqual(retry, { acquired: true, value: "retry" });
});
