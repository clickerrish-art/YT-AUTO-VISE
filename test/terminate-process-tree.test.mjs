import test from "node:test";
import assert from "node:assert/strict";
import { terminateProcessTree } from "../scripts/terminate-process-tree.mjs";

test("POSIX process-tree termination signals the detached renderer process group", () => {
  const calls = [];
  const child = { pid: 4321, kill: signal => { calls.push(["child", signal]); return true; } };
  assert.equal(terminateProcessTree(child, "SIGTERM", {
    platform: "linux",
    kill: (pid, signal) => calls.push([pid, signal])
  }), true);
  assert.deepEqual(calls, [[-4321, "SIGTERM"]]);
});

test("POSIX process-tree termination falls back to the child if the group has exited", () => {
  const calls = [];
  const child = { pid: 4321, kill: signal => { calls.push(["child", signal]); return true; } };
  const kill = () => { const error = new Error("no such process group"); error.code = "ESRCH"; throw error; };
  assert.equal(terminateProcessTree(child, "SIGKILL", { platform: "linux", kill }), true);
  assert.deepEqual(calls, [["child", "SIGKILL"]]);
});

test("Windows process-tree termination uses taskkill for the complete renderer tree", () => {
  const calls = [];
  const child = { pid: 9876 };
  const killer = { unref() { calls.push("unref"); } };
  assert.equal(terminateProcessTree(child, "SIGKILL", {
    platform: "win32",
    spawnImpl: (...args) => { calls.push(args); return killer; }
  }), true);
  assert.deepEqual(calls, [
    ["taskkill", ["/pid", "9876", "/t", "/f"], { windowsHide: true, stdio: "ignore" }],
    "unref"
  ]);
});

test("invalid child handles and unsupported signals are rejected safely", () => {
  assert.equal(terminateProcessTree(null), false);
  assert.equal(terminateProcessTree({ pid: 0 }), false);
  assert.throws(() => terminateProcessTree({ pid: 12 }, "SIGINT"), /Unsupported/);
});
