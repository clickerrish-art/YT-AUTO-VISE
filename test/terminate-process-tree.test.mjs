import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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

if (process.platform !== "win32") {
  test("POSIX termination stops a real detached renderer and its FFmpeg-like descendant", async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "renderer-process-tree-"));
    const marker = path.join(directory, "descendant-terminated.txt");
    const descendantSource = `
      const fs = require("node:fs");
      process.on("SIGTERM", () => {
        fs.writeFileSync(${JSON.stringify(marker)}, "terminated");
        process.exit(0);
      });
      setInterval(() => {}, 1000);
    `;
    const parentSource = `
      const { spawn } = require("node:child_process");
      const descendant = spawn(process.execPath, ["-e", ${JSON.stringify(descendantSource)}], { stdio: "ignore" });
      process.stdout.write(String(descendant.pid) + "\\n");
      setInterval(() => {}, 1000);
    `;
    const parent = spawn(process.execPath, ["-e", parentSource], {
      detached: true,
      stdio: ["ignore", "pipe", "ignore"]
    });
    let output = "";
    let resolvePid;
    let rejectPid;
    const pidPromise = new Promise((resolve, reject) => {
      resolvePid = resolve;
      rejectPid = reject;
    });
    parent.stdout.setEncoding("utf8");
    parent.stdout.on("data", chunk => {
      output += chunk;
      const line = output.split("\\n")[0].trim();
      if (line) resolvePid(Number(line));
    });
    parent.once("error", rejectPid);
    parent.once("close", code => {
      if (!output.trim()) rejectPid(new Error("Renderer parent exited before reporting its descendant PID (code " + code + ")"));
    });
    t.after(() => {
      try { process.kill(-parent.pid, "SIGKILL"); } catch {}
      fs.rmSync(directory, { recursive: true, force: true });
    });

    const descendantPid = await Promise.race([
      pidPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Descendant did not start")), 3000))
    ]);
    assert.ok(Number.isInteger(descendantPid) && descendantPid > 0);
    terminateProcessTree(parent, "SIGTERM");
    await new Promise(resolve => parent.once("close", resolve));
    const deadline = Date.now() + 3000;
    while (!fs.existsSync(marker) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.equal(fs.readFileSync(marker, "utf8"), "terminated",
      "the renderer descendant must receive the process-group termination signal too");
  });
}
