import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { backupState } from "../scripts/backup-state.mjs";
import { restoreState } from "../scripts/restore-state.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-rollback-crash-"));
  const stateDir = path.join(root, "state");
  const logDir = path.join(root, "run-logs");
  const rightsDir = path.join(root, "rights");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(path.join(logDir, "upload-approvals"), { recursive: true });
  fs.mkdirSync(rightsDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, "facebook-recovery-ledger.jsonl"),
    JSON.stringify({ attemptId: "fixture-fb-attempt", status: "NEEDS_RECONCILIATION" }) + "\n");
  fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), JSON.stringify({
    version: 1,
    jobs: [{ id: "fixture-job", state: "AWAITING_HUMAN_REVIEW" }],
    audit: [{ action: "FIXTURE_ORIGINAL_AUDIT", actor: "rollback-crash-test" }],
    uploads: []
  }, null, 2) + "\n");
  fs.writeFileSync(path.join(logDir, "upload-attempts.json"), JSON.stringify({
    version: 1, attempts: [{ attemptId: "fixture-attempt", status: "RECOVERY_REQUIRED" }]
  }) + "\n");
  fs.writeFileSync(path.join(rightsDir, "fixture-rights.txt"), "TEST FIXTURE ONLY\n");
  return { root, stateDir, logDir, rightsDir };
}

test("restart recovery completes rollback after process death during rollback-temp fsync", async t => {
  const source = fixture();
  const destination = fixture();
  t.after(() => {
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  });

  const backupPath = path.join(source.root, "backup.json");
  await backupState({
    rootDir: source.root,
    stateDir: source.stateDir,
    uploadLogDir: source.logDir,
    rightsDir: source.rightsDir,
    outputPath: backupPath
  });

  const destinationState = path.join(destination.stateDir, "dashboard-state.json");
  const state = JSON.parse(fs.readFileSync(destinationState, "utf8"));
  state.audit = [{ action: "PRESERVE_EXACT_PRE_RESTORE_AUDIT", actor: "destination-before-restore" }];
  state.jobs[0].state = "OPERATOR_REVIEW_REQUIRED";
  fs.writeFileSync(destinationState, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
  const originalStateBytes = fs.readFileSync(destinationState);
  const originalAudit = JSON.parse(originalStateBytes.toString("utf8")).audit;

  // Force the restore to commit dashboard state, then fail on the next ledger
  // destination. This enters the rollback path after its durable journal exists.
  fs.rmSync(path.join(destination.stateDir, "facebook-recovery-ledger.jsonl"), { force: true });
  fs.rmSync(destination.logDir, { recursive: true, force: true });
  fs.rmSync(destination.rightsDir, { recursive: true, force: true });
  const earlierThanBackup = new Date(Date.parse(JSON.parse(fs.readFileSync(backupPath, "utf8")).createdAt) - 1000);
  fs.utimesSync(destinationState, earlierThanBackup, earlierThanBackup);

  const restoreModule = new URL("../scripts/restore-state.mjs", import.meta.url).href;
  const childSource = `
    import fs from "node:fs";
    import path from "node:path";
    const moduleUrl = ${JSON.stringify(restoreModule)};
    const rootDir = ${JSON.stringify(destination.root)};
    const failingDestination = ${JSON.stringify(path.join(destination.stateDir, "facebook-recovery-ledger.jsonl"))};
    const originalOpen = fs.openSync;
    const originalFsync = fs.fsyncSync;
    const originalRename = fs.renameSync;
    const openedPaths = new Map();
    fs.openSync = function (filePath, ...args) {
      const fd = originalOpen.call(this, filePath, ...args);
      if (typeof filePath === "string") openedPaths.set(fd, filePath);
      return fd;
    };
    fs.fsyncSync = function (fd, ...args) {
      const openedPath = openedPaths.get(fd);
      if (openedPath && openedPath.endsWith(".rollback-tmp")) {
        process.stdout.write("ROLLBACK_TEMP_READY\\n");
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      }
      return originalFsync.call(this, fd, ...args);
    };
    fs.renameSync = function (from, to, ...args) {
      if (path.resolve(String(to)) === failingDestination) {
        const error = new Error("injected later destination rename failure");
        error.code = "EIO";
        throw error;
      }
      return originalRename.call(this, from, to, ...args);
    };
    const { restoreState } = await import(moduleUrl);
    await restoreState({
      backupPath: ${JSON.stringify(backupPath)},
      rootDir,
      confirm: "YES",
      overwriteState: true
    });
  `;

  const child = spawn(process.execPath, ["--input-type=module", "-e", childSource], {
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    if (child.exitCode === null && child.signalCode === null) {
      await new Promise(resolve => child.once("exit", resolve));
    }
  });

  const deadline = Date.now() + 10000;
  while (!stdout.includes("ROLLBACK_TEMP_READY") && Date.now() < deadline &&
         child.exitCode === null && child.signalCode === null) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.ok(stdout.includes("ROLLBACK_TEMP_READY"),
    "child did not reach rollback-temp fsync boundary; stderr: " + stderr);
  const journalPath = path.join(destination.stateDir, ".restore-transaction.json");
  const lockPath = path.join(destination.stateDir, ".restore-operation.lock");
  const rollbackTemps = fs.readdirSync(destination.stateDir).filter(name => name.endsWith(".rollback-tmp"));
  assert.equal(fs.existsSync(journalPath), true, "journal must remain at the crash boundary");
  assert.equal(fs.existsSync(lockPath), true, "operation lock must remain at the crash boundary");
  assert.equal(rollbackTemps.length, 1, "the deterministic rollback temp must exist at the crash boundary");

  child.kill("SIGKILL");
  const exit = await new Promise(resolve => child.once("exit", (code, signal) => resolve({ code, signal })));
  assert.equal(exit.signal, "SIGKILL", "the child must be killed while rollback-temp fsync is blocked");

  // The fixture is isolated and the child is confirmed dead. Model the operator
  // removing only the stale lock before restart recovery; leave journal and temp.
  fs.unlinkSync(lockPath);

  // Interrupt recovery itself at the same durable-temp fsync boundary. This
  // exercises a second process death while replaying the original journal,
  // rather than only a single crash followed by in-process retries.
  const repeatedRollbackTempPath = path.join(destination.stateDir, rollbackTemps[0]);
  fs.writeFileSync(repeatedRollbackTempPath, Buffer.from("partial rollback bytes"));
  const recoveryChildSource = `
    import fs from "node:fs";
    const moduleUrl = ${JSON.stringify(restoreModule)};
    const rootDir = ${JSON.stringify(destination.root)};
    const rollbackTempPath = ${JSON.stringify(path.join(destination.stateDir, rollbackTemps[0]))};
    const originalOpen = fs.openSync;
    const originalFsync = fs.fsyncSync;
    const openedPaths = new Map();
    fs.openSync = function (filePath, ...args) {
      const fd = originalOpen.call(this, filePath, ...args);
      if (typeof filePath === "string") openedPaths.set(fd, filePath);
      return fd;
    };
    fs.fsyncSync = function (fd, ...args) {
      if (openedPaths.get(fd) === rollbackTempPath) {
        process.stdout.write("RECOVERY_ROLLBACK_TEMP_READY\\n");
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
      }
      return originalFsync.call(this, fd, ...args);
    };
    const { restoreState } = await import(moduleUrl);
    await restoreState({
      backupPath: ${JSON.stringify(backupPath)},
      rootDir,
      confirm: "YES",
      overwriteState: true
    });
  `;
  const recoveryChild = spawn(process.execPath, ["--input-type=module", "-e", recoveryChildSource], {
    stdio: ["ignore", "pipe", "pipe"]
  });
  let recoveryStdout = "";
  let recoveryStderr = "";
  recoveryChild.stdout.setEncoding("utf8");
  recoveryChild.stderr.setEncoding("utf8");
  recoveryChild.stdout.on("data", chunk => { recoveryStdout += chunk; });
  recoveryChild.stderr.on("data", chunk => { recoveryStderr += chunk; });
  const recoveryDeadline = Date.now() + 10000;
  while (!recoveryStdout.includes("RECOVERY_ROLLBACK_TEMP_READY") &&
         Date.now() < recoveryDeadline &&
         recoveryChild.exitCode === null && recoveryChild.signalCode === null) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.ok(recoveryStdout.includes("RECOVERY_ROLLBACK_TEMP_READY"),
    "second process did not reach recovery rollback-temp fsync; stderr: " + recoveryStderr);
  assert.equal(fs.existsSync(journalPath), true, "journal must survive the second crash boundary");
  assert.equal(fs.existsSync(lockPath), true, "second recovery process must hold the operation lock");
  recoveryChild.kill("SIGKILL");
  const recoveryExit = await new Promise(resolve =>
    recoveryChild.once("exit", (code, signal) => resolve({ code, signal })));
  assert.equal(recoveryExit.signal, "SIGKILL",
    "second recovery process must be killed while rollback-temp fsync is blocked");
  fs.unlinkSync(lockPath);
  assert.equal(fs.existsSync(journalPath), true, "repeated interruption must retain the recovery journal");
  assert.equal(fs.existsSync(repeatedRollbackTempPath), true,
    "repeated interruption must leave the journal-owned rollback temp for the next restart");

  // Simulate a torn rollback temp from the killed process, then inject ENOSPC
  // while recovery rebuilds it from the durable journal. Recovery must fail
  // closed, retain the journal, and permit a later clean retry.
  const rollbackTempPath = path.join(destination.stateDir, rollbackTemps[0]);
  fs.writeFileSync(rollbackTempPath, Buffer.from("partial rollback bytes"));
  const originalOpen = fs.openSync;
  const originalWriteFile = fs.writeFileSync;
  const openedPaths = new Map();
  let diskFullInjected = false;
  fs.openSync = function (filePath, ...args) {
    const fd = originalOpen.call(this, filePath, ...args);
    if (typeof filePath === "string") openedPaths.set(fd, filePath);
    return fd;
  };
  fs.writeFileSync = function (target, ...args) {
    if (typeof target === "number" && openedPaths.get(target) === rollbackTempPath && !diskFullInjected) {
      diskFullInjected = true;
      const error = new Error("injected ENOSPC while rebuilding rollback temp");
      error.code = "ENOSPC";
      throw error;
    }
    return originalWriteFile.call(this, target, ...args);
  };
  try {
    await assert.rejects(
      restoreState({ backupPath, rootDir: destination.root, confirm: "YES", overwriteState: true }),
      error => error?.code === "ENOSPC"
    );
  } finally {
    fs.openSync = originalOpen;
    fs.writeFileSync = originalWriteFile;
  }
  assert.equal(diskFullInjected, true, "recovery must reach the rollback-temp write before ENOSPC is injected");
  assert.equal(fs.existsSync(journalPath), true, "failed recovery must retain its durable journal");
  assert.equal(fs.existsSync(rollbackTempPath), false, "failed rollback-temp write must clean its partial temporary file");
  assert.equal(fs.existsSync(lockPath), false, "failed recovery must release only its own operation lock");

  // Repeat with a permissions failure at the deterministic rollback-temp
  // creation boundary. The journal must survive and a later restart must retry.
  const originalOpenForPermissionFailure = fs.openSync;
  let permissionFailureInjected = false;
  fs.openSync = function (filePath, ...args) {
    if (filePath === rollbackTempPath && !permissionFailureInjected) {
      permissionFailureInjected = true;
      const error = new Error("injected EACCES while creating rollback temp");
      error.code = "EACCES";
      throw error;
    }
    return originalOpenForPermissionFailure.call(this, filePath, ...args);
  };
  try {
    await assert.rejects(
      restoreState({ backupPath, rootDir: destination.root, confirm: "YES", overwriteState: true }),
      error => error?.code === "EACCES"
    );
  } finally {
    fs.openSync = originalOpenForPermissionFailure;
  }
  assert.equal(permissionFailureInjected, true, "recovery must reach rollback-temp creation before EACCES is injected");
  assert.equal(fs.existsSync(journalPath), true, "permission failure must retain the durable journal");
  assert.equal(fs.existsSync(rollbackTempPath), false, "permission failure must not leave a partial rollback temp");
  assert.equal(fs.existsSync(lockPath), false, "permission failure must release only its own operation lock");

  // Inject EACCES at the final rollback rename, after the recovery bytes
  // have been written and fsynced. The journal must survive this commit failure.
  const originalRenameForPermissionFailure = fs.renameSync;
  let destinationRenameDenied = false;
  fs.renameSync = function (from, to, ...args) {
    if (from === rollbackTempPath && to === destinationState && !destinationRenameDenied) {
      destinationRenameDenied = true;
      const error = new Error("injected EACCES replacing dashboard state during rollback");
      error.code = "EACCES";
      throw error;
    }
    return originalRenameForPermissionFailure.call(this, from, to, ...args);
  };
  try {
    await assert.rejects(
      restoreState({ backupPath, rootDir: destination.root, confirm: "YES", overwriteState: true }),
      error => error?.code === "EACCES"
    );
  } finally {
    fs.renameSync = originalRenameForPermissionFailure;
  }
  assert.equal(destinationRenameDenied, true, "recovery must reach the destination rollback rename");
  assert.equal(fs.existsSync(journalPath), true, "destination permission failure must retain the journal");
  assert.equal(fs.existsSync(rollbackTempPath), false, "failed rollback rename must clean its temporary file");
  assert.equal(fs.existsSync(lockPath), false, "failed rollback rename must release its operation lock");

  await assert.rejects(
    restoreState({ backupPath, rootDir: destination.root, confirm: "YES", overwriteState: true }),
    /rolled back safely.*rerun restore explicitly/i
  );

  assert.deepEqual(fs.readFileSync(destinationState), originalStateBytes,
    "restart recovery must restore the exact pre-restore dashboard state bytes");
  assert.deepEqual(JSON.parse(fs.readFileSync(destinationState, "utf8")).audit, originalAudit,
    "the original audit trail must remain byte-for-byte represented in restored state");
  assert.equal(fs.existsSync(journalPath), false, "successful restart recovery must remove the journal");
  assert.equal(fs.existsSync(lockPath), false, "restart recovery must release its operation lock");
  assert.deepEqual(
    fs.readdirSync(destination.stateDir).filter(name =>
      name.endsWith(".restore-tmp") || name.endsWith(".rollback-tmp")),
    [],
    "restart recovery must clean all transaction temporary files"
  );
});


test("restart recovery rolls back a process death after destination rename and before directory fsync", async t => {
  const source = fixture();
  const destination = fixture();
  t.after(() => {
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  });

  const backupPath = path.join(source.root, "backup.json");
  await backupState({
    rootDir: source.root,
    stateDir: source.stateDir,
    uploadLogDir: source.logDir,
    rightsDir: source.rightsDir,
    outputPath: backupPath
  });
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  const backedUpState = backup.entries.find(entry => entry.target.kind === "dashboard-state");
  assert.ok(backedUpState, "fixture backup must include dashboard state");
  const expectedCommittedSha = backedUpState.sha256;

  const destinationState = path.join(destination.stateDir, "dashboard-state.json");
  const originalStateBytes = fs.readFileSync(destinationState);
  const originalAudit = JSON.parse(originalStateBytes.toString("utf8")).audit;
  const olderThanBackup = new Date(Date.parse(backup.createdAt) - 1000);
  fs.utimesSync(destinationState, olderThanBackup, olderThanBackup);

  const restoreModule = new URL("../scripts/restore-state.mjs", import.meta.url).href;
  const childSource = `
    import fs from "node:fs";
    import crypto from "node:crypto";
    const moduleUrl = ${JSON.stringify(restoreModule)};
    const rootDir = ${JSON.stringify(destination.root)};
    const stateDir = ${JSON.stringify(destination.stateDir)};
    const destinationState = ${JSON.stringify(destinationState)};
    const expectedCommittedSha = ${JSON.stringify(expectedCommittedSha)};
    const originalOpen = fs.openSync;
    const originalFsync = fs.fsyncSync;
    const openedPaths = new Map();
    fs.openSync = function (filePath, ...args) {
      const fd = originalOpen.call(this, filePath, ...args);
      if (typeof filePath === "string") openedPaths.set(fd, filePath);
      return fd;
    };
    fs.fsyncSync = function (fd, ...args) {
      if (openedPaths.get(fd) === stateDir && fs.existsSync(destinationState)) {
        const currentSha = crypto.createHash("sha256").update(fs.readFileSync(destinationState)).digest("hex");
        if (currentSha === expectedCommittedSha) {
          process.stdout.write("DESTINATION_RENAMED_BEFORE_DIRECTORY_FSYNC\\n");
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
        }
      }
      return originalFsync.call(this, fd, ...args);
    };
    const { restoreState } = await import(moduleUrl);
    await restoreState({
      backupPath: ${JSON.stringify(backupPath)},
      rootDir,
      confirm: "YES",
      overwriteState: true
    });
  `;

  const child = spawn(process.execPath, ["--input-type=module", "-e", childSource], {
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    if (child.exitCode === null && child.signalCode === null) {
      await new Promise(resolve => child.once("exit", resolve));
    }
  });

  const deadline = Date.now() + 10000;
  while (!stdout.includes("DESTINATION_RENAMED_BEFORE_DIRECTORY_FSYNC") &&
         Date.now() < deadline && child.exitCode === null && child.signalCode === null) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.ok(stdout.includes("DESTINATION_RENAMED_BEFORE_DIRECTORY_FSYNC"),
    "child did not reach the post-rename/pre-directory-fsync boundary; stderr: " + stderr);
  assert.equal(fs.readFileSync(destinationState).length > 0, true,
    "the destination must contain the committed replacement at the crash boundary");

  const journalPath = path.join(destination.stateDir, ".restore-transaction.json");
  const lockPath = path.join(destination.stateDir, ".restore-operation.lock");
  assert.equal(fs.existsSync(journalPath), true, "durable rollback journal must exist before destination mutation");
  assert.equal(fs.existsSync(lockPath), true, "restore operation lock must remain held at the crash boundary");
  assert.equal(
    fs.readFileSync(destinationState).toString("utf8"),
    Buffer.from(backedUpState.contentBase64, "base64").toString("utf8"),
    "destination rename must have installed the backup state before directory fsync is interrupted"
  );

  child.kill("SIGKILL");
  const exit = await new Promise(resolve => child.once("exit", (code, signal) => resolve({ code, signal })));
  assert.equal(exit.signal, "SIGKILL", "the child must die after rename and before directory fsync");
  fs.unlinkSync(lockPath);

  await assert.rejects(
    restoreState({ backupPath, rootDir: destination.root, confirm: "YES", overwriteState: true }),
    /rolled back safely.*rerun restore explicitly/i
  );
  assert.deepEqual(fs.readFileSync(destinationState), originalStateBytes,
    "restart recovery must restore exact pre-restore bytes after the interrupted commit rename");
  assert.deepEqual(JSON.parse(fs.readFileSync(destinationState, "utf8")).audit, originalAudit,
    "restart recovery must preserve the pre-restore audit trail");
  assert.equal(fs.existsSync(journalPath), false, "successful restart recovery must remove the transaction journal");
  assert.equal(fs.existsSync(lockPath), false, "restart recovery must release its operation lock");
  assert.deepEqual(
    fs.readdirSync(destination.stateDir).filter(name =>
      name.endsWith(".restore-tmp") || name.endsWith(".rollback-tmp")),
    [],
    "restart recovery must remove all staged and rollback temporary files"
  );
});
