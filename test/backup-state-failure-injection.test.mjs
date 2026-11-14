import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { backupState, readRegularFileNoFollow, recoverInterruptedBackup } from "../scripts/backup-state.mjs";

test("backup input reader pins a regular file and refuses a symlink", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-backup-pinned-read-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, "evidence.txt");
  const link = path.join(root, "evidence-link.txt");
  fs.writeFileSync(source, "stable evidence bytes", { mode: 0o600 });
  assert.deepEqual(readRegularFileNoFollow(source), Buffer.from("stable evidence bytes"));
  fs.symlinkSync(source, link);
  assert.throws(() => readRegularFileNoFollow(link), error =>
    error?.code === "ELOOP" || /symbolic link|too many levels/i.test(error?.message ?? ""));
});

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

  assert.equal(writes, 3, "failure must be injected at the backup payload write, after both locks are acquired");
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

function recoveryFixture(root, { pid = 2147483647, token = "12345678-1234-4234-8234-123456789abc" } = {}) {
  const stateDir = path.join(root, "state"), backupDir = path.join(root, "backups");
  fs.mkdirSync(stateDir, { recursive: true }); fs.mkdirSync(backupDir, { recursive: true });
  const outputPath = path.join(backupDir, "interrupted.json"), temporaryPath = outputPath + ".aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.tmp";
  const bytes = Buffer.from("verified recovery fixture");
  const createHash = crypto.createHash;
  const payload = { format: "sonicvhibez-state-backup", version: 1, createdAt: new Date().toISOString(), includesSecrets: false, entries: [{ target: { kind: "dashboard-state", path: "dashboard-state.json" }, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, contentBase64: bytes.toString("base64") }] };
  fs.writeFileSync(temporaryPath, JSON.stringify(payload), { mode: 0o600 });
  const lockPath = path.join(stateDir, ".restore-operation.lock");
  fs.writeFileSync(lockPath, JSON.stringify({ format: "sonicvhibez-restore-operation-lock", version: 1, token, pid, createdAt: new Date().toISOString(), operation: "backup" }), { mode: 0o600 });
  return { stateDir, backupDir, outputPath, temporaryPath, lockPath, token, lockToken: token };
}
test("interrupted backup recovery requires owner attestation and exact token", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-recover-attestation-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = recoveryFixture(root);
  assert.throws(() => recoverInterruptedBackup({ ...f, confirmOwnerStopped: false }), /explicit confirmation/);
  assert.throws(() => recoverInterruptedBackup({ ...f, lockToken: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", confirmOwnerStopped: true }), /malformed or mismatched/);
  assert.equal(fs.existsSync(f.outputPath), false); assert.equal(fs.existsSync(f.temporaryPath), true); assert.equal(fs.existsSync(f.lockPath), true);
});
test("interrupted backup recovery refuses live owner PID and malformed lock metadata", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-recover-live-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = recoveryFixture(root, { pid: process.pid });
  assert.throws(() => recoverInterruptedBackup({ ...f, confirmOwnerStopped: true }), /PID is still live/);
  fs.writeFileSync(f.lockPath, JSON.stringify({ format: "wrong", version: 1, token: f.token, pid: 2147483647, operation: "backup", createdAt: "invalid" }));
  assert.throws(() => recoverInterruptedBackup({ ...f, confirmOwnerStopped: true }), /malformed or mismatched/);
});
test("interrupted backup recovery refuses ambiguous temporary files and existing final backups", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-recover-ambiguous-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = recoveryFixture(root);
  const second = f.outputPath + ".bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.tmp"; fs.copyFileSync(f.temporaryPath, second);
  assert.throws(() => recoverInterruptedBackup({ ...f, confirmOwnerStopped: true }), /unambiguous/);
  fs.unlinkSync(second); fs.writeFileSync(f.outputPath, "existing backup");
  assert.throws(() => recoverInterruptedBackup({ ...f, confirmOwnerStopped: true }), /already exists/);
});
test("interrupted backup recovery validates checksums and refuses corrupt or unsafe entries", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-recover-corrupt-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = recoveryFixture(root); const payload = JSON.parse(fs.readFileSync(f.temporaryPath, "utf8")); payload.entries[0].contentBase64 = Buffer.from("tampered").toString("base64"); fs.writeFileSync(f.temporaryPath, JSON.stringify(payload));
  assert.throws(() => recoverInterruptedBackup({ ...f, confirmOwnerStopped: true }), /checksum or byte length mismatch/);
  assert.equal(fs.existsSync(f.outputPath), false); assert.equal(fs.existsSync(f.lockPath), true);
});
test("interrupted backup recovery atomically promotes one verified snapshot and clears its matching lock", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-recover-success-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = recoveryFixture(root); const result = recoverInterruptedBackup({ ...f, confirmOwnerStopped: true });
  assert.equal(result.path, f.outputPath); assert.equal(result.entries, 1); assert.equal(result.includesSecrets, false);
  assert.equal(fs.existsSync(f.outputPath), true); assert.equal(fs.existsSync(f.temporaryPath), false); assert.equal(fs.existsSync(f.lockPath), false);
});


test("interrupted backup recovery rejects symlinked lock files before reading or promotion", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-recover-lock-symlink-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const f = recoveryFixture(root);
  const originalLock = f.lockPath + ".original";
  fs.renameSync(f.lockPath, originalLock);
  fs.symlinkSync(originalLock, f.lockPath);
  assert.throws(() => recoverInterruptedBackup({ ...f, confirmOwnerStopped: true }), /unsafe lock/);
  assert.equal(fs.existsSync(f.outputPath), false);
  assert.equal(fs.existsSync(f.temporaryPath), true);
});

test("interrupted backup recovery rejects empty kinds, dot segments and NUL target paths", t => {
  for (const mutate of [
    entry => { entry.target.kind = ""; },
    entry => { entry.target.path = "nested/./dashboard-state.json"; },
    entry => { entry.target.path = "nested/\u0000dashboard-state.json"; }
  ]) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-recover-unsafe-target-"));
    try {
      const f = recoveryFixture(root);
      const payload = JSON.parse(fs.readFileSync(f.temporaryPath, "utf8"));
      mutate(payload.entries[0]);
      fs.writeFileSync(f.temporaryPath, JSON.stringify(payload));
      assert.throws(() => recoverInterruptedBackup({ ...f, confirmOwnerStopped: true }), /invalid or unsafe entry/);
      assert.equal(fs.existsSync(f.outputPath), false);
      assert.equal(fs.existsSync(f.lockPath), true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});


test("backup keeps a complete promoted snapshot when directory fsync fails after atomic publication", async t => {
  const source = fixture();
  t.after(() => fs.rmSync(source.root, { recursive: true, force: true }));
  const outputPath = path.join(source.root, "backups", "directory-sync-failure.json");
  const originalFsync = fs.fsyncSync;
  let fsyncCalls = 0;
  fs.fsyncSync = function (fd) {
    fsyncCalls += 1;
    // The operation lock, dashboard-state lock and staged payload are flushed
    // first; the fourth fsync flushes the directory after atomic promotion.
    if (fsyncCalls === 4) {
      const error = new Error("simulated directory fsync failure after backup promotion");
      error.code = "EIO";
      throw error;
    }
    return originalFsync.call(this, fd);
  };
  try {
    await assert.rejects(
      backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.uploadLogDir, rightsDir: source.rightsDir, outputPath }),
      error => error?.code === "EIO",
    );
  } finally {
    fs.fsyncSync = originalFsync;
  }

  assert.equal(fsyncCalls, 4, "failure must occur only after the staged file was flushed and linked into place");
  assert.equal(fs.existsSync(outputPath), true, "a complete atomically promoted snapshot must not be deleted after directory-sync failure");
  const payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(payload.format, "sonicvhibez-state-backup");
  assert.equal(payload.version, 1);
  assert.equal(payload.includesSecrets, false);
  assert.ok(payload.entries.length > 0);
  for (const entry of payload.entries) {
    const bytes = Buffer.from(entry.contentBase64, "base64");
    assert.equal(bytes.length, entry.bytes);
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), entry.sha256);
  }
  assert.deepEqual(fs.readdirSync(path.dirname(outputPath)), [path.basename(outputPath)],
    "no staged temporary file may remain beside the promoted snapshot");
  assert.equal(fs.existsSync(path.join(source.stateDir, ".restore-operation.lock")), false,
    "the operation lock must be released even when directory durability confirmation fails");
});
