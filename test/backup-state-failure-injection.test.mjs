import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { backupState } from "../scripts/backup-state.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-backup-failure-injection-"));
  const stateDir = path.join(root, "state");
  const uploadLogDir = path.join(root, "run-logs");
  const rightsDir = path.join(root, "rights");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(uploadLogDir, { recursive: true });
  fs.mkdirSync(rightsDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), JSON.stringify({ version: 1, jobs: [], audit: [], uploads: [] }) + "\n", { mode: 0o600 });
  fs.writeFileSync(path.join(rightsDir, "fixture-evidence.txt"), "TEST FIXTURE ONLY; not real rights evidence\n", { mode: 0o600 });
  return { root, stateDir, uploadLogDir, rightsDir };
}

test("backup handles simulated disk-full writes without publishing a partial snapshot or changing source state", async t => {
  const source = fixture();
  t.after(() => fs.rmSync(source.root, { recursive: true, force: true }));
  const outputPath = path.join(source.root, "backups", "disk-full.json");
  const statePath = path.join(source.stateDir, "dashboard-state.json");
  const beforeState = fs.readFileSync(statePath);
  const beforeRights = fs.readFileSync(path.join(source.rightsDir, "fixture-evidence.txt"));
  const originalWriteFileSync = fs.writeFileSync;
  let writes = 0;
  fs.writeFileSync = function (...args) {
    writes += 1;
    // The first write is the backup/restore operation lock, the second is the
    // dashboard-state lock owner record, and the third is the staged payload.
    if (writes === 3) {
      const error = new Error("simulated disk full while writing backup payload");
      error.code = "ENOSPC";
      throw error;
    }
    return originalWriteFileSync.apply(this, args);
  };
  try {
    await assert.rejects(
      backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.uploadLogDir, rightsDir: source.rightsDir, outputPath }),
      error => error?.code === "ENOSPC",
    );
  } finally {
    fs.writeFileSync = originalWriteFileSync;
  }

  assert.equal(writes, 2, "failure must be injected at the backup payload write, after both locks are acquired");
  assert.deepEqual(fs.readFileSync(statePath), beforeState, "disk-full backup must not mutate source state");
  assert.deepEqual(fs.readFileSync(path.join(source.rightsDir, "fixture-evidence.txt")), beforeRights);
  assert.equal(fs.existsSync(outputPath), false, "a partial backup must never appear under the final filename");
  assert.deepEqual(fs.readdirSync(path.dirname(outputPath)), [], "the failed temporary backup must be cleaned up");
  assert.equal(fs.existsSync(path.join(source.stateDir, ".restore-operation.lock")), false, "the operation lock must be released after a handled write failure");
});

test("SIGKILL during backup leaves no final snapshot and retains the lock and temporary file for operator recovery", async t => {
  const source = fixture();
  const outputPath = path.join(source.root, "backups", "interrupted.json");
  const statePath = path.join(source.stateDir, "dashboard-state.json");
  const beforeState = fs.readFileSync(statePath);
  const moduleUrl = new URL("../scripts/backup-state.mjs", import.meta.url).href;
  const childSource = `
    import fs from "node:fs";
    const { backupState } = await import(${JSON.stringify(moduleUrl)});
    const originalLink = fs.linkSync;
    fs.linkSync = function (temporary, destination, ...rest) {
      process.stdout.write(JSON.stringify({ temporary, destination }) + "\\n");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      return originalLink.call(this, temporary, destination, ...rest);
    };
    await backupState({
      rootDir: ${JSON.stringify(source.root)},
      stateDir: ${JSON.stringify(source.stateDir)},
      uploadLogDir: ${JSON.stringify(source.uploadLogDir)},
      rightsDir: ${JSON.stringify(source.rightsDir)},
      outputPath: ${JSON.stringify(outputPath)}
    });
  `;
  const child = spawn(process.execPath, ["--input-type=module", "-e", childSource], { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    if (child.exitCode === null && child.signalCode === null) await new Promise(resolve => child.once("exit", resolve));
    fs.rmSync(source.root, { recursive: true, force: true });
  });

  const deadline = Date.now() + 10_000;
  let readyRecord;
  while (Date.now() < deadline && !readyRecord && child.exitCode === null) {
    const line = stdout.split("\n").find(Boolean);
    if (line) readyRecord = JSON.parse(line);
    else await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.ok(readyRecord, "backup child did not reach the atomic-link boundary: " + stderr);
  assert.equal(readyRecord.destination, outputPath);
  assert.equal(fs.existsSync(readyRecord.temporary), true, "the staged file must exist at the injected kill boundary");
  assert.equal(fs.existsSync(outputPath), false, "the final backup must not be visible before the atomic link");

  child.kill("SIGKILL");
  const exit = await new Promise(resolve => child.once("exit", (code, signal) => resolve({ code, signal })));
  assert.equal(exit.signal, "SIGKILL");
  assert.equal(fs.existsSync(outputPath), false);
  assert.equal(fs.existsSync(readyRecord.temporary), true, "SIGKILL leaves the staged backup for explicit operator cleanup");
  const lockPath = path.join(source.stateDir, ".restore-operation.lock");
  assert.equal(fs.existsSync(lockPath), true, "SIGKILL leaves the lock so another process cannot mistake the operation for complete");
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  assert.equal(lock.pid, child.pid);
  assert.equal(lock.operation, "backup");
  assert.deepEqual(fs.readFileSync(statePath), beforeState, "interrupted backup must not modify source state");

  // The test owns the disposable fixture and has confirmed the child is dead.
  // Remove only its exact temporary file and its PID-bound lock before teardown.
  fs.unlinkSync(readyRecord.temporary);
  const remainingLock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  assert.equal(remainingLock.token, lock.token);
  assert.equal(remainingLock.pid, child.pid);
  fs.unlinkSync(lockPath);
});


test("backup refuses to snapshot while the dashboard owns its state-write lock", async t => {
  const source = fixture();
  t.after(() => fs.rmSync(source.root, { recursive: true, force: true }));
  const lockDirectory = path.join(source.stateDir, "dashboard-state.json.lock");
  fs.mkdirSync(lockDirectory, { mode: 0o700 });
  const owner = { pid: process.pid, ownerId: "live-dashboard-test-owner", acquiredAt: new Date().toISOString() };
  fs.writeFileSync(path.join(lockDirectory, "owner.json"), JSON.stringify(owner), { mode: 0o600 });

  await assert.rejects(
    backupState({
      rootDir: source.root,
      stateDir: source.stateDir,
      uploadLogDir: source.uploadLogDir,
      rightsDir: source.rightsDir,
      outputPath: path.join(source.root, "backups", "must-not-exist.json")
    }),
    error => error?.code === "DASHBOARD_STATE_BUSY"
  );

  assert.equal(fs.existsSync(path.join(source.root, "backups", "must-not-exist.json")), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(lockDirectory, "owner.json"), "utf8")), owner,
    "backup must not remove or rewrite the live dashboard lock");
  assert.equal(fs.existsSync(path.join(source.stateDir, ".restore-operation.lock")), false,
    "the backup/restore serialization lock must be released after refusing a busy dashboard state");
});
