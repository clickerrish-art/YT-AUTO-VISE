import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { backupState } from "../scripts/backup-state.mjs";
import { restoreState } from "../scripts/restore-state.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-backup-restore-"));
  const stateDir = path.join(root, "state");
  const logDir = path.join(root, "run-logs");
  const rightsDir = path.join(root, "rights");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(path.join(logDir, "upload-approvals"), { recursive: true });
  fs.mkdirSync(rightsDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, "facebook-recovery-ledger.jsonl"), JSON.stringify({ attemptId: "fb-attempt-001", remotePostId: "123456789012345_987", status: "NEEDS_RECONCILIATION" }) + "\n", { mode: 0o600 });
  fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), JSON.stringify({
    version: 1, queueItems: [], campaigns: [], jobs: [{ id: "job-001", state: "AWAITING_HUMAN_REVIEW", humanApproval: { decision: "REJECT", reviewer: "Test Operator" } }],
    audit: [{ action: "TEST_BACKUP", actor: "Test Operator" }], uploads: []
  }));
  fs.writeFileSync(path.join(logDir, "upload-attempts.json"), JSON.stringify({ version: 1, attempts: [{ attemptId: "attempt-001", jobId: "job-001", status: "RECOVERY_REQUIRED", updatedAt: "2026-10-24T00:00:00.000Z" }] }));
  fs.writeFileSync(path.join(logDir, "upload-VIDEO001.json"), JSON.stringify({ videoId: "VIDEO001", privacyStatus: "private" }));
  fs.writeFileSync(path.join(logDir, "upload-approvals", "approval001.json"), JSON.stringify({ decision: "APPROVE", reviewer: "Test Operator" }));
  fs.writeFileSync(path.join(rightsDir, "license.txt"), "TEST FIXTURE ONLY: not a real license");
  return { root, stateDir, logDir, rightsDir };
}

test("backup and restore preserve dashboard state, audit, review, upload ledger, receipt, approval and rights records", async () => {
  const source = fixture();
  const destination = fixture();
  try {
    fs.rmSync(destination.stateDir, { recursive: true, force: true });
    fs.rmSync(destination.logDir, { recursive: true, force: true });
    fs.rmSync(destination.rightsDir, { recursive: true, force: true });
    const backupPath = path.join(source.root, "backup.json");
    const made = await backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath });
    assert.equal(made.includesSecrets, false);
    const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
    assert.equal(backup.includesSecrets, false);
    assert.ok(backup.entries.some(entry => entry.target.kind === "dashboard-state"));
    assert.ok(backup.entries.some(entry => entry.target.kind === "facebook-recovery-ledger"));
    assert.ok(backup.entries.some(entry => entry.target.kind === "upload-ledger"));
    assert.ok(backup.entries.some(entry => entry.target.kind === "upload-receipt"));
    assert.ok(backup.entries.some(entry => entry.target.kind === "upload-approval"));
    assert.ok(backup.entries.some(entry => entry.target.kind === "rights-evidence"));
    const restored = await restoreState({ backupPath, rootDir: destination.root, stateDir: destination.stateDir, uploadLogDir: destination.logDir, rightsDir: destination.rightsDir, confirm: "YES" });
    assert.equal(restored.status, "RESTORE_COMPLETED");
    assert.equal(restored.restored, backup.entries.length);
    assert.match(fs.readFileSync(path.join(destination.stateDir, "facebook-recovery-ledger.jsonl"), "utf8"), /123456789012345_987/);
    const state = JSON.parse(fs.readFileSync(path.join(destination.stateDir, "dashboard-state.json"), "utf8"));
    assert.equal(state.audit[0].actor, "Test Operator");
    assert.equal(state.jobs[0].humanApproval.decision, "REJECT");
    assert.equal(JSON.parse(fs.readFileSync(path.join(destination.logDir, "upload-attempts.json"), "utf8")).attempts[0].attemptId, "attempt-001");
    assert.equal(JSON.parse(fs.readFileSync(path.join(destination.logDir, "upload-VIDEO001.json"), "utf8")).privacyStatus, "private");
    assert.equal(JSON.parse(fs.readFileSync(path.join(destination.logDir, "upload-approvals", "approval001.json"), "utf8")).decision, "APPROVE");
    assert.match(fs.readFileSync(path.join(destination.rightsDir, "license.txt"), "utf8"), /TEST FIXTURE ONLY/);
  } finally {
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  }
});

test("restore rolls back earlier file commits when a later destination rename fails", async () => {
  const source = fixture();
  const destination = fixture();
  const originalRename = fs.renameSync;
  let renameCalls = 0;
  try {
    fs.rmSync(destination.stateDir, { recursive: true, force: true });
    fs.rmSync(destination.logDir, { recursive: true, force: true });
    fs.rmSync(destination.rightsDir, { recursive: true, force: true });
    const backupPath = path.join(source.root, "backup.json");
    await backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath });

    const failingDestination = path.join(destination.stateDir, "facebook-recovery-ledger.jsonl");
    fs.renameSync = function (sourcePath, targetPath, ...rest) {
      renameCalls += 1;
      if (path.resolve(targetPath) === failingDestination) {
        const error = new Error("injected destination rename failure");
        error.code = "EIO";
        throw error;
      }
      return originalRename.call(this, sourcePath, targetPath, ...rest);
    };
    await assert.rejects(
      restoreState({ backupPath, rootDir: destination.root, stateDir: destination.stateDir, uploadLogDir: destination.logDir, rightsDir: destination.rightsDir, confirm: "YES" }),
      /all committed destination changes were rolled back/
    );
    assert.equal(renameCalls, 3, "the journal and first destination must commit before the second destination fails");
    assert.equal(fs.existsSync(path.join(destination.stateDir, "dashboard-state.json")), false,
      "a prior committed destination must be removed when the transaction aborts");
    assert.equal(fs.existsSync(path.join(destination.stateDir, "facebook-recovery-ledger.jsonl")), false);
    assert.equal(fs.existsSync(path.join(destination.logDir, "upload-attempts.json")), false);
  } finally {
    fs.renameSync = originalRename;
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  }
});

test("restore reinstates the original dashboard state if a later commit fails", async () => {
  const source = fixture();
  const destination = fixture();
  const originalRename = fs.renameSync;
  let renameCalls = 0;
  try {
    const destinationState = path.join(destination.stateDir, "dashboard-state.json");
    const originalState = JSON.parse(fs.readFileSync(destinationState, "utf8"));
    originalState.audit = [{ action: "PRESERVE_ORIGINAL_STATE", actor: "destination-before-restore" }];
    fs.writeFileSync(destinationState, JSON.stringify(originalState, null, 2) + "\n", { mode: 0o600 });
    const originalBytes = fs.readFileSync(destinationState);

    fs.rmSync(path.join(destination.stateDir, "facebook-recovery-ledger.jsonl"), { force: true });
    fs.rmSync(destination.logDir, { recursive: true, force: true });
    fs.rmSync(destination.rightsDir, { recursive: true, force: true });
    const backupPath = path.join(source.root, "backup.json");
    const backup = await backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath });
    // Keep this failure-injection test deterministic while preserving the real
    // stale-state guard: the destination's pre-restore state predates this backup.
    const earlierThanBackup = new Date(Date.parse(backup.createdAt) - 1000);
    fs.utimesSync(destinationState, earlierThanBackup, earlierThanBackup);

    const failingDestination = path.join(destination.stateDir, "facebook-recovery-ledger.jsonl");
    fs.renameSync = function (sourcePath, targetPath, ...rest) {
      renameCalls += 1;
      if (path.resolve(targetPath) === failingDestination) {
        const error = new Error("injected destination rename failure");
        error.code = "EIO";
        throw error;
      }
      return originalRename.call(this, sourcePath, targetPath, ...rest);
    };
    await assert.rejects(
      restoreState({ backupPath, rootDir: destination.root, stateDir: destination.stateDir, uploadLogDir: destination.logDir, rightsDir: destination.rightsDir, confirm: "YES", overwriteState: true }),
      /all committed destination changes were rolled back/
    );
    assert.equal(fs.readFileSync(destinationState).equals(originalBytes), true,
      "the exact pre-restore dashboard state must be restored byte-for-byte");
    assert.equal(fs.existsSync(failingDestination), false);
    assert.equal(fs.existsSync(path.join(destination.stateDir, ".restore-transaction.json")), false);
  } finally {
    fs.renameSync = originalRename;
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  }
  assert.ok(renameCalls >= 3, "failure must occur after the journal and dashboard-state replacement commit");
});

test("restore recovers a committed file from an interrupted transaction journal and requires explicit retry", async () => {
  const source = fixture();
  const destination = fixture();
  try {
    const backupPath = path.join(source.root, "backup.json");
    await backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath });
    const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
    const stateEntry = backup.entries.find(entry => entry.target.kind === "dashboard-state");
    assert.ok(stateEntry, "fixture backup must contain dashboard state");

    const destinationState = path.join(destination.stateDir, "dashboard-state.json");
    fs.writeFileSync(destinationState, Buffer.from(stateEntry.contentBase64, "base64"), { mode: 0o600 });
    const journalPath = path.join(destination.stateDir, ".restore-transaction.json");
    fs.writeFileSync(journalPath, JSON.stringify({
      format: "sonicvhibez-restore-transaction",
      version: 1,
      createdAt: new Date().toISOString(),
      entries: [{
        target: { kind: "dashboard-state", path: "dashboard-state.json" },
        action: "RESTORE_MISSING",
        newSha256: stateEntry.sha256,
        tempName: "dashboard-state.json.interrupted.restore-tmp"
      }]
    }), { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath, rootDir: destination.root, stateDir: destination.stateDir, uploadLogDir: destination.logDir, rightsDir: destination.rightsDir, confirm: "YES" }),
      /rolled back safely.*rerun restore explicitly/
    );
    assert.equal(fs.existsSync(destinationState), false,
      "restart recovery must roll back the committed file from the interrupted restore");
    assert.equal(fs.existsSync(journalPath), false, "successful rollback must remove the transaction journal");
  } finally {
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  }
});

test("restore refuses to overwrite a different existing upload ledger and performs no partial restore", async () => {
  const source = fixture();
  const destination = fixture();
  try {
    const backupPath = path.join(source.root, "backup.json");
    await backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath });
    fs.rmSync(destination.stateDir, { recursive: true, force: true });
    fs.writeFileSync(path.join(destination.logDir, "upload-attempts.json"), JSON.stringify({ version: 1, attempts: [{ attemptId: "newer-attempt", status: "PRIVATE_UPLOAD_VERIFIED" }] }));
    await assert.rejects(restoreState({ backupPath, rootDir: destination.root, stateDir: destination.stateDir, uploadLogDir: destination.logDir, rightsDir: destination.rightsDir, confirm: "YES" }), /Refusing to overwrite an existing, different upload ledger/);
    assert.equal(fs.existsSync(path.join(destination.stateDir, "dashboard-state.json")), false, "preflight conflict must be detected before any writes");
    assert.equal(JSON.parse(fs.readFileSync(path.join(destination.logDir, "upload-attempts.json"), "utf8")).attempts[0].attemptId, "newer-attempt");
  } finally {
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  }
});

test("restore refuses to overwrite a newer Facebook recovery ledger", async () => {
  const source = fixture();
  const destination = fixture();
  try {
    const backupPath = path.join(source.root, "backup.json");
    await backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath });
    fs.rmSync(destination.stateDir, { recursive: true, force: true });
    fs.mkdirSync(destination.stateDir, { recursive: true });
    fs.writeFileSync(path.join(destination.stateDir, "facebook-recovery-ledger.jsonl"), JSON.stringify({ attemptId: "newer-fb-attempt", remotePostId: "123456789012345_999" }) + "\n");
    await assert.rejects(restoreState({ backupPath, rootDir: destination.root, stateDir: destination.stateDir, uploadLogDir: destination.logDir, rightsDir: destination.rightsDir, confirm: "YES" }), /Refusing to overwrite an existing, different Facebook recovery ledger/);
    assert.equal(fs.existsSync(path.join(destination.stateDir, "dashboard-state.json")), false, "preflight conflict must be detected before any writes");
  } finally {
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  }
});

test("restore rejects symlinked rights and upload-log paths before writing any state", async () => {
  for (const mode of ["rights", "upload-logs"]) {
    const source = fixture();
    const destination = fixture();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-restore-outside-"));
    try {
      const backupPath = path.join(source.root, "backup.json");
      await backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath });
      fs.rmSync(destination.stateDir, { recursive: true, force: true });
      const linkPath = mode === "rights" ? destination.rightsDir : destination.logDir;
      fs.rmSync(linkPath, { recursive: true, force: true });
      fs.symlinkSync(outside, linkPath, "dir");
      await assert.rejects(
        restoreState({ backupPath, rootDir: destination.root, stateDir: destination.stateDir, uploadLogDir: destination.logDir, rightsDir: destination.rightsDir, confirm: "YES" }),
        /symbolic link|symbolic-link|UPLOAD_LOG_DIR/i
      );
      assert.equal(fs.existsSync(path.join(destination.stateDir, "dashboard-state.json")), false, "preflight must reject the unsafe path before writing state");
      assert.deepEqual(fs.readdirSync(outside), [], "restore must not write through the symlink into the external directory");
    } finally {
      fs.rmSync(source.root, { recursive: true, force: true });
      fs.rmSync(destination.root, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  }
});

test("restore requires explicit authorization and validates backup checksums", async () => {
  const source = fixture();
  try {
    const backupPath = path.join(source.root, "backup.json");
    await backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath });
    await assert.rejects(restoreState({ backupPath, rootDir: source.root, stateDir: path.join(source.root, "fresh-state"), uploadLogDir: path.join(source.root, "fresh-logs"), rightsDir: path.join(source.root, "fresh-rights") }), /RESTORE_CONFIRM=YES/);
    const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
    backup.entries[0].contentBase64 = Buffer.from("tampered").toString("base64");
    fs.writeFileSync(backupPath, JSON.stringify(backup));
    await assert.rejects(restoreState({ backupPath, rootDir: source.root, stateDir: path.join(source.root, "fresh-state"), uploadLogDir: path.join(source.root, "fresh-logs"), rightsDir: path.join(source.root, "fresh-rights"), confirm: "YES" }), /checksum\/length validation failed/);
  } finally { fs.rmSync(source.root, { recursive: true, force: true }); }
});


test("local secrets, state, upload evidence, backups and generated media are ignored by Git", () => {
  const ignore = fs.readFileSync(".gitignore", "utf8");
  for (const pattern of [".env", "!.env.example", "/state/", "/run-logs/", "/backups/", "/rights/", "/content/render-manifest.json", "/content/long-form-render-manifest.json", "/content/asset-register.json", "/media/", "/media/next-short.mp4", "/media/long-form-next.mp4"]) assert.ok(ignore.includes(pattern), "missing .gitignore protection: " + pattern);
});


test("backup refuses symlinked root, state and upload-log path components", async () => {
  for (const mode of ["root", "state", "logs"]) {
    const source = fixture();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-backup-outside-"));
    const linkedRoot = path.join(path.dirname(source.root), path.basename(source.root) + "-linked");
    try {
      if (mode === "root") {
        fs.symlinkSync(source.root, linkedRoot, "dir");
        await assert.rejects(
          backupState({ rootDir: linkedRoot, stateDir: "state", uploadLogDir: "run-logs", rightsDir: "rights", outputPath: path.join(source.root, "backup.json") }),
          /symbolic links in .* path/i
        );
      } else if (mode === "state") {
        fs.rmSync(source.stateDir, { recursive: true, force: true });
        fs.writeFileSync(path.join(outside, "dashboard-state.json"), JSON.stringify({ jobs: [] }));
        fs.symlinkSync(outside, source.stateDir, "dir");
        await assert.rejects(
          backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: path.join(source.root, "backup.json") }),
          /symbolic links in .* path/i
        );
      } else {
        fs.rmSync(source.logDir, { recursive: true, force: true });
        fs.writeFileSync(path.join(outside, "upload-attempts.json"), JSON.stringify({ attempts: [] }));
        fs.symlinkSync(outside, source.logDir, "dir");
        await assert.rejects(
          backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: path.join(source.root, "backup.json") }),
          /symbolic links in .* path/i
        );
      }
    } finally {
      fs.rmSync(linkedRoot, { recursive: true, force: true });
      fs.rmSync(source.root, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  }
});



test("backup refuses to overwrite an existing destination and preserves its bytes", async () => {
  const source = fixture();
  try {
    const backupPath = path.join(source.root, "backup.json");
    const original = Buffer.from("operator-owned backup: preserve exactly\\n");
    fs.writeFileSync(backupPath, original, { mode: 0o600 });
    await assert.rejects(
      backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath }),
      /Backup destination already exists; refusing to overwrite an existing backup/
    );
    assert.deepEqual(fs.readFileSync(backupPath), original,
      "an explicit output path must never replace an existing backup");
    assert.equal(fs.readdirSync(source.root).some(name => name.endsWith(".tmp")), false,
      "failed exclusive creation must clean up its temporary file");
  } finally {
    fs.rmSync(source.root, { recursive: true, force: true });
  }
});


test("backup fails closed when a restore already holds the shared state-operation lock", async () => {
  const source = fixture();
  try {
    const lockPath = path.join(source.stateDir, ".restore-operation.lock");
    const lockBytes = Buffer.from(JSON.stringify({
      format: "sonicvhibez-restore-operation-lock",
      version: 1,
      token: "restore-process-token",
      pid: 12345,
      createdAt: "2026-10-28T00:00:00.000Z"
    }));
    fs.writeFileSync(lockPath, lockBytes, { mode: 0o600 });
    const backupPath = path.join(source.root, "must-not-exist.json");

    await assert.rejects(
      backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath }),
      /Another backup or restore operation holds the state-operation lock/
    );
    assert.deepEqual(fs.readFileSync(lockPath), lockBytes,
      "backup must not steal or rewrite the restore process's lock");
    assert.equal(fs.existsSync(backupPath), false,
      "backup must not read and persist a potentially partial restore snapshot");
  } finally {
    fs.rmSync(source.root, { recursive: true, force: true });
  }
});


test("backup releases its shared operation lock after a validation failure", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-backup-empty-"));
  const stateDir = path.join(root, "state");
  try {
    await assert.rejects(
      backupState({
        rootDir: root,
        stateDir,
        uploadLogDir: path.join(root, "logs"),
        rightsDir: path.join(root, "rights"),
        outputPath: path.join(root, "backup.json")
      }),
      /No state, upload ledger, receipts, approvals or retained rights evidence were found/
    );
    assert.equal(fs.existsSync(path.join(stateDir, ".restore-operation.lock")), false,
      "a failed backup must not strand the shared backup/restore lock");
    assert.equal(fs.existsSync(path.join(root, "backup.json")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});


test("separate process holding the shared operation lock blocks backup without altering its lock", async () => {
  const source = fixture();
  const lockPath = path.join(source.stateDir, ".restore-operation.lock");
  const token = "separate-process-restore-owner";
  const childSource = [
    "import fs from 'node:fs';",
    "const lockPath = process.argv[1];",
    "const token = process.argv[2];",
    "const fd = fs.openSync(lockPath, 'wx', 0o600);",
    "fs.writeFileSync(fd, JSON.stringify({ format: 'sonicvhibez-restore-operation-lock', version: 1, token, pid: process.pid, createdAt: new Date().toISOString(), operation: 'restore-test' }));",
    "fs.fsyncSync(fd);",
    "process.stdout.write('LOCK_READY\\n');",
    "process.stdin.setEncoding('utf8');",
    "process.stdin.on('data', () => { try { fs.closeSync(fd); const current = JSON.parse(fs.readFileSync(lockPath, 'utf8')); if (current.token === token) fs.unlinkSync(lockPath); } finally { process.exit(0); } });"
  ].join("\n");
  const child = spawn(process.execPath, ["--input-type=module", "-e", childSource, lockPath, token], {
    stdio: ["pipe", "pipe", "pipe"]
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", chunk => { stderr += chunk; });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out waiting for child process to acquire operation lock")), 5000);
      child.once("error", error => { clearTimeout(timeout); reject(error); });
      child.stdout.setEncoding("utf8");
      let output = "";
      child.stdout.on("data", chunk => {
        output += chunk;
        if (output.includes("LOCK_READY")) {
          clearTimeout(timeout);
          resolve();
        }
      });
      child.once("exit", code => {
        clearTimeout(timeout);
        if (code !== 0) reject(new Error("Lock-owning child exited before readiness: " + code + " " + stderr));
      });
    });

    const lockBytes = fs.readFileSync(lockPath);
    const backupPath = path.join(source.root, "blocked-cross-process-backup.json");
    await assert.rejects(
      backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath }),
      /Another backup or restore operation holds the state-operation lock/
    );
    assert.deepEqual(fs.readFileSync(lockPath), lockBytes, "backup must not alter the other process's lock");
    assert.equal(fs.existsSync(backupPath), false, "backup must not create a snapshot during another process's operation");
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.stdin.end("release\\n");
      await new Promise(resolve => child.once("exit", resolve));
    }
    fs.rmSync(source.root, { recursive: true, force: true });
  }
});


test("backup refuses to snapshot state while an interrupted restore journal remains", async () => {
  const source = fixture();
  const journalPath = path.join(source.stateDir, ".restore-transaction.json");
  const backupPath = path.join(source.root, "must-not-capture-partial-restore.json");
  try {
    fs.writeFileSync(journalPath, JSON.stringify({
      format: "sonicvhibez-restore-transaction",
      version: 1,
      entries: [{ destination: "in-progress" }]
    }), { mode: 0o600 });
    await assert.rejects(
      backupState({ rootDir: source.root, stateDir: source.stateDir, uploadLogDir: source.logDir, rightsDir: source.rightsDir, outputPath: backupPath }),
      /An interrupted restore journal exists; run restore recovery/
    );
    assert.equal(fs.existsSync(backupPath), false,
      "backup must not preserve an uncertain, potentially partially restored state");
    assert.equal(fs.existsSync(path.join(source.stateDir, ".restore-operation.lock")), false,
      "the failed backup must release its own lock");
    assert.equal(fs.existsSync(journalPath), true,
      "backup must preserve the recovery journal for restoreState to inspect");
  } finally {
    fs.rmSync(source.root, { recursive: true, force: true });
  }
});


test("backup refuses symlinked output ancestors before creating nested directories", async () => {
  const source = fixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-backup-outside-"));
  const linkedParent = path.join(source.root, "linked-output");
  fs.symlinkSync(outside, linkedParent, "dir");
  const outputPath = path.join(linkedParent, "nested", "backup.json");
  try {
    await assert.rejects(
      backupState({
        rootDir: source.root,
        stateDir: source.stateDir,
        uploadLogDir: source.logDir,
        rightsDir: source.rightsDir,
        outputPath
      }),
      /output directory contains a symbolic link/i
    );
    assert.equal(fs.existsSync(path.join(outside, "nested")), false,
      "a rejected symlinked output path must not create directories outside the requested tree");
    assert.equal(fs.existsSync(path.join(source.stateDir, ".restore-operation.lock")), false,
      "the shared operation lock must be released after output-path validation fails");
  } finally {
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});


test("a killed restore process leaves a journal that is safely rolled back after operator-confirmed lock cleanup", async () => {
  const source = fixture();
  const destination = fixture();
  try {
    const backupPath = path.join(source.root, "backup.json");
    const backup = await backupState({
      rootDir: source.root,
      stateDir: source.stateDir,
      uploadLogDir: source.logDir,
      rightsDir: source.rightsDir,
      outputPath: backupPath
    });
    const destinationState = path.join(destination.stateDir, "dashboard-state.json");
    const modified = JSON.parse(fs.readFileSync(destinationState, "utf8"));
    modified.audit = [{ action: "PRE_RESTORE_STATE_TO_PRESERVE", actor: "crash-test" }];
    fs.writeFileSync(destinationState, JSON.stringify(modified, null, 2) + "\n", { mode: 0o600 });
    const originalBytes = fs.readFileSync(destinationState);
    const earlierThanBackup = new Date(Date.parse(backup.createdAt) - 1000);
    fs.utimesSync(destinationState, earlierThanBackup, earlierThanBackup);

    const restoreModule = new URL("../scripts/restore-state.mjs", import.meta.url).href;
    const childScript = `
      import fs from "node:fs";
      import path from "node:path";
      const { restoreState } = await import(${JSON.stringify(restoreModule)});
      const rename = fs.renameSync;
      fs.renameSync = function (source, target, ...rest) {
        const result = rename.call(this, source, target, ...rest);
        if (path.basename(target) === "dashboard-state.json") process.exit(86);
        return result;
      };
      await restoreState({
        backupPath: ${JSON.stringify(backupPath)},
        rootDir: ${JSON.stringify(destination.root)},
        confirm: "YES",
        overwriteState: true
      });
    `;
    const child = spawn(process.execPath, ["--input-type=module", "-e", childScript], { encoding: "utf8" });
    const exitCode = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
    assert.equal(exitCode, 86, "the child must terminate immediately after committing the dashboard-state replacement");

    const journalPath = path.join(destination.stateDir, ".restore-transaction.json");
    const lockPath = path.join(destination.stateDir, ".restore-operation.lock");
    assert.equal(fs.existsSync(journalPath), true, "the durable transaction journal must survive process termination");
    assert.equal(fs.existsSync(lockPath), true, "the abandoned lock must remain for explicit operator inspection");
    assert.notDeepEqual(fs.readFileSync(destinationState), originalBytes,
      "the child should have committed the replacement before terminating");

    // The child has exited and its PID is no longer running. Only now does the
    // test model an operator confirming that it is safe to remove the stale lock.
    fs.unlinkSync(lockPath);
    await assert.rejects(
      restoreState({
        backupPath,
        rootDir: destination.root,
        confirm: "YES",
        overwriteState: true
      }),
      /rolled back safely.*rerun restore explicitly/
    );
    assert.deepEqual(fs.readFileSync(destinationState), originalBytes,
      "restart recovery must restore the exact pre-transaction state bytes");
    assert.equal(fs.existsSync(journalPath), false, "successful recovery must clear the transaction journal");
    assert.equal(fs.existsSync(lockPath), false, "the recovery invocation must release its own lock");
  } finally {
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  }
});


test("restore flushes destination directory entries before deleting its recovery journal", async () => {
  const source = fixture();
  const destination = fixture();
  const events = [];
  const directoryByFd = new Map();
  const originalOpen = fs.openSync;
  const originalClose = fs.closeSync;
  const originalFsync = fs.fsyncSync;
  const originalRename = fs.renameSync;
  const originalUnlink = fs.unlinkSync;
  try {
    const backupPath = path.join(source.root, "backup.json");
    await backupState({
      rootDir: source.root,
      stateDir: source.stateDir,
      uploadLogDir: source.logDir,
      rightsDir: source.rightsDir,
      outputPath: backupPath
    });
    fs.rmSync(destination.stateDir, { recursive: true, force: true });
    fs.rmSync(destination.logDir, { recursive: true, force: true });
    fs.rmSync(destination.rightsDir, { recursive: true, force: true });

    fs.openSync = function (file, ...args) {
      const fd = originalOpen.call(this, file, ...args);
      try {
        if (fs.fstatSync(fd).isDirectory()) directoryByFd.set(fd, path.resolve(String(file)));
      } catch {}
      return fd;
    };
    fs.closeSync = function (fd, ...args) {
      directoryByFd.delete(fd);
      return originalClose.call(this, fd, ...args);
    };
    fs.fsyncSync = function (fd, ...args) {
      const directory = directoryByFd.get(fd);
      if (directory) events.push({ type: "directory-fsync", path: directory });
      return originalFsync.call(this, fd, ...args);
    };
    fs.renameSync = function (from, to, ...args) {
      const result = originalRename.call(this, from, to, ...args);
      if (path.basename(String(to)) !== ".restore-transaction.json" &&
          !String(to).endsWith(".restore-tmp") &&
          !String(to).endsWith(".rollback-tmp")) {
        events.push({ type: "destination-rename", path: path.resolve(String(to)) });
      }
      return result;
    };
    fs.unlinkSync = function (file, ...args) {
      const result = originalUnlink.call(this, file, ...args);
      if (path.basename(String(file)) === ".restore-transaction.json") {
        events.push({ type: "journal-unlink", path: path.resolve(String(file)) });
      }
      return result;
    };

    const result = await restoreState({
      backupPath,
      rootDir: destination.root,
      stateDir: destination.stateDir,
      uploadLogDir: destination.logDir,
      rightsDir: destination.rightsDir,
      confirm: "YES"
    });
    assert.equal(result.status, "RESTORE_COMPLETED");

    const journalRemovalIndex = events.findIndex(event => event.type === "journal-unlink");
    assert.notEqual(journalRemovalIndex, -1, "successful restore must remove its journal");
    const committed = events.map((event, index) => ({ ...event, index }))
      .filter(event => event.type === "destination-rename");
    assert.ok(committed.length > 0, "fixture must exercise destination commits");
    for (const commit of committed) {
      assert.ok(events.some((event, index) =>
        index > commit.index &&
        index < journalRemovalIndex &&
        event.type === "directory-fsync" &&
        event.path === path.dirname(commit.path)
      ), "destination directory must be flushed after commit and before journal removal: " + commit.path);
    }
    assert.ok(events.some((event, index) =>
      index > journalRemovalIndex &&
      event.type === "directory-fsync" &&
      event.path === destination.stateDir
    ), "journal directory must be flushed after journal removal");
  } finally {
    fs.openSync = originalOpen;
    fs.closeSync = originalClose;
    fs.fsyncSync = originalFsync;
    fs.renameSync = originalRename;
    fs.unlinkSync = originalUnlink;
    fs.rmSync(source.root, { recursive: true, force: true });
    fs.rmSync(destination.root, { recursive: true, force: true });
  }
});
