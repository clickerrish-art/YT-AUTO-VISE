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
