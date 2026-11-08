import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { restoreState, readBackupFileNoSymlinks } from "../scripts/restore-state.mjs";
import { backupState } from "../scripts/backup-state.mjs";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sonic-restore-symlink-"));
}

const validEmptyBackup = JSON.stringify({
  format: "sonicvhibez-state-backup",
  version: 1,
  includesSecrets: false,
  createdAt: "2026-10-01T00:00:00.000Z",
  entries: []
});

test("restore backup reader pins regular-file contents and rejects symlinks", () => {
  const dir = makeTempDir();
  try {
    const real = path.join(dir, "stable.json");
    const link = path.join(dir, "linked.json");
    fs.writeFileSync(real, validEmptyBackup, { mode: 0o600 });
    assert.equal(readBackupFileNoSymlinks(real), validEmptyBackup);
    fs.symlinkSync(real, link);
    assert.throws(() => readBackupFileNoSymlinks(link), /symbolic link|too many levels/i);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("restore refuses a backup file that is itself a symbolic link", async () => {
  const dir = makeTempDir();
  try {
    const real = path.join(dir, "real-backup.json");
    const link = path.join(dir, "backup.json");
    fs.writeFileSync(real, validEmptyBackup);
    fs.symlinkSync(real, link);
    await assert.rejects(
      restoreState({ backupPath: link, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-02T00:00:00.000Z") }),
      /symbolic link in the backup file path/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("restore refuses a backup whose parent directory is a symbolic link", async () => {
  const dir = makeTempDir();
  try {
    const realDir = path.join(dir, "real");
    const linkedDir = path.join(dir, "linked");
    fs.mkdirSync(realDir);
    fs.writeFileSync(path.join(realDir, "backup.json"), validEmptyBackup);
    fs.symlinkSync(realDir, linkedDir, "dir");
    await assert.rejects(
      restoreState({ backupPath: path.join(linkedDir, "backup.json"), rootDir: dir, confirm: "YES", now: Date.parse("2026-10-02T00:00:00.000Z") }),
      /symbolic link in the backup file path/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("restore refuses an empty backup and preserves the explicit confirmation gate", async () => {
  const dir = makeTempDir();
  try {
    const backup = path.join(dir, "backup.json");
    fs.writeFileSync(backup, validEmptyBackup, { mode: 0o600 });
    await assert.rejects(
      restoreState({ backupPath: backup, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-02T00:00:00.000Z") }),
      /Backup contains no entries/
    );
    assert.equal(fs.existsSync(path.join(dir, "state", ".restore-operation.lock")), false,
      "the operation lock is released after validation failure");
    await assert.rejects(
      restoreState({ backupPath: backup, rootDir: dir, confirm: "NO", now: Date.parse("2026-10-02T00:00:00.000Z") }),
      /RESTORE_CONFIRM=YES/
    );
    assert.equal(fs.existsSync(path.join(dir, "state", ".restore-operation.lock")), false,
      "the operation lock is released after confirmation failure");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("restore refuses a symlinked rootDir ancestor before creating destination directories", async () => {
  const crypto = await import("node:crypto");
  const dir = makeTempDir();
  try {
    const realRoot = path.join(dir, "real-root");
    const linkedRoot = path.join(dir, "linked-root");
    fs.mkdirSync(realRoot);
    fs.symlinkSync(realRoot, linkedRoot, "dir");
    const stateBytes = Buffer.from(JSON.stringify({ version: 1, jobs: [] }));
    const backup = {
      format: "sonicvhibez-state-backup",
      version: 1,
      includesSecrets: false,
      createdAt: "2026-10-01T00:00:00.000Z",
      entries: [{
        target: { kind: "dashboard-state", path: "dashboard-state.json" },
        contentBase64: stateBytes.toString("base64"),
        bytes: stateBytes.length,
        sha256: crypto.createHash("sha256").update(stateBytes).digest("hex")
      }]
    };
    const backupPath = path.join(dir, "backup.json");
    fs.writeFileSync(backupPath, JSON.stringify(backup));
    await assert.rejects(
      restoreState({ backupPath, rootDir: linkedRoot, confirm: "YES", now: Date.parse("2026-10-02T00:00:00.000Z") }),
      /symbolic links in destination paths/
    );
    assert.equal(fs.existsSync(path.join(realRoot, "state")), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("restore fails closed when another process already holds the operation lock", async () => {
  const dir = makeTempDir();
  try {
    const backup = path.join(dir, "backup.json");
    fs.writeFileSync(backup, validEmptyBackup, { mode: 0o600 });
    const stateDir = path.join(dir, "state");
    fs.mkdirSync(stateDir, { mode: 0o700 });
    const lockPath = path.join(stateDir, ".restore-operation.lock");
    const existingLock = JSON.stringify({
      format: "sonicvhibez-restore-operation-lock",
      version: 1,
      token: "other-process-token",
      pid: 999999,
      createdAt: "2026-10-28T00:00:00.000Z"
    });
    fs.writeFileSync(lockPath, existingLock, { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath: backup, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-29T00:00:00.000Z") }),
      /Another backup or restore operation holds the shared state-operation lock/
    );
    assert.equal(fs.readFileSync(lockPath, "utf8"), existingLock,
      "a competing invocation must not steal or rewrite another process's lock");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("restore recovery validates the entire journal before mutating duplicate destinations", async () => {
  const crypto = await import("node:crypto");
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    const logDir = path.join(dir, "run-logs");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });
    const destination = path.join(logDir, "upload-attempts.json");
    const newBytes = Buffer.from("simulated-restored-content");
    const newSha256 = crypto.createHash("sha256").update(newBytes).digest("hex");
    // This is a valid partially committed output for the first entry: recovery
    // would delete it unless the duplicate later entry is detected first.
    fs.writeFileSync(destination, newBytes);
    const target = { kind: "upload-ledger", path: "upload-attempts.json" };
    const journalPath = path.join(stateDir, ".restore-transaction.json");
    const journal = {
      format: "sonicvhibez-restore-transaction",
      version: 1,
      createdAt: "2026-10-29T00:00:00.000Z",
      entries: [
        { target, action: "RESTORE_MISSING", newSha256, tempName: "upload-attempts.json.first.restore-tmp" },
        { target, action: "RESTORE_MISSING", newSha256, tempName: "upload-attempts.json.second.restore-tmp" }
      ]
    };
    fs.writeFileSync(journalPath, JSON.stringify(journal), { mode: 0o600 });
    const backupPath = path.join(dir, "backup.json");
    fs.writeFileSync(backupPath, validEmptyBackup, { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-30T00:00:00.000Z") }),
      /duplicate destinations/
    );
    assert.deepEqual(fs.readFileSync(destination), newBytes,
      "recovery must validate every journal entry before changing any destination");
    assert.equal(fs.existsSync(journalPath), true,
      "the invalid recovery journal must remain available for operator investigation");
    assert.equal(fs.existsSync(path.join(stateDir, ".restore-operation.lock")), false,
      "the operation lock is released after fail-closed journal validation");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("restore refuses to replace dashboard state while the live dashboard holds its write lock", async () => {
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    const stateFile = path.join(stateDir, "dashboard-state.json");
    const originalState = JSON.stringify({ version: 1, jobs: [{ id: "preserve-me" }], audit: [] });
    fs.writeFileSync(stateFile, originalState, { mode: 0o600 });
    const backupPath = path.join(dir, "backup.json");
    fs.writeFileSync(backupPath, validEmptyBackup, { mode: 0o600 });

    const lockDirectory = stateFile + ".lock";
    fs.mkdirSync(lockDirectory, { mode: 0o700 });
    const owner = { pid: process.pid, ownerId: "live-dashboard-test-owner", acquiredAt: new Date().toISOString() };
    fs.writeFileSync(path.join(lockDirectory, "owner.json"), JSON.stringify(owner), { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-02T00:00:00.000Z") }),
      error => error?.code === "DASHBOARD_STATE_BUSY"
    );

    assert.equal(fs.readFileSync(stateFile, "utf8"), originalState,
      "restore must not overwrite state while the dashboard may have an in-flight mutation");
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(lockDirectory, "owner.json"), "utf8")), owner,
      "restore must not remove or rewrite the live dashboard lock");
    assert.equal(fs.existsSync(path.join(stateDir, ".restore-operation.lock")), false,
      "the backup/restore serialization lock must be released after refusing a busy dashboard state");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a fresh restore invocation rolls back an interrupted missing-file commit", async () => {
  const crypto = await import("node:crypto");
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    const logDir = path.join(dir, "run-logs");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });

    const destination = path.join(logDir, "upload-attempts.json");
    const partiallyRestored = Buffer.from(JSON.stringify({ attempts: [{ id: "interrupted" }] }));
    fs.writeFileSync(destination, partiallyRestored, { mode: 0o600 });
    const journalPath = path.join(stateDir, ".restore-transaction.json");
    fs.writeFileSync(journalPath, JSON.stringify({
      format: "sonicvhibez-restore-transaction",
      version: 1,
      createdAt: "2026-10-29T00:00:00.000Z",
      entries: [{
        target: { kind: "upload-ledger", path: "upload-attempts.json" },
        action: "RESTORE_MISSING",
        newSha256: crypto.createHash("sha256").update(partiallyRestored).digest("hex"),
        tempName: "upload-attempts.json.interrupted.restore-tmp"
      }]
    }), { mode: 0o600 });
    const backupPath = path.join(dir, "backup.json");
    fs.writeFileSync(backupPath, validEmptyBackup, { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-30T00:00:00.000Z") }),
      /interrupted restore was rolled back safely/i
    );

    assert.equal(fs.existsSync(destination), false,
      "a file created by the interrupted restore must be removed on restart");
    assert.equal(fs.existsSync(journalPath), false,
      "the completed rollback must remove its transaction journal");
    assert.equal(fs.existsSync(path.join(stateDir, ".restore-operation.lock")), false,
      "the recovery invocation must release its operation lock");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a fresh restore invocation restores byte-exact dashboard state after an interrupted replacement", async () => {
  const crypto = await import("node:crypto");
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    const destination = path.join(stateDir, "dashboard-state.json");
    const originalBytes = Buffer.from(JSON.stringify({ version: 1, jobs: [{ id: "before" }], audit: [] }));
    const partiallyRestored = Buffer.from(JSON.stringify({ version: 1, jobs: [{ id: "from-backup" }], audit: [] }));
    fs.writeFileSync(destination, partiallyRestored, { mode: 0o600 });

    const tempName = "dashboard-state.json.interrupted.restore-tmp";
    const journalPath = path.join(stateDir, ".restore-transaction.json");
    fs.writeFileSync(journalPath, JSON.stringify({
      format: "sonicvhibez-restore-transaction",
      version: 1,
      createdAt: "2026-10-29T00:00:00.000Z",
      entries: [{
        target: { kind: "dashboard-state", path: "dashboard-state.json" },
        action: "REPLACE_STATE",
        newSha256: crypto.createHash("sha256").update(partiallyRestored).digest("hex"),
        originalSha256: crypto.createHash("sha256").update(originalBytes).digest("hex"),
        originalBase64: originalBytes.toString("base64"),
        tempName,
        rollbackTempName: tempName.replace(".restore-tmp", ".rollback-tmp")
      }]
    }), { mode: 0o600 });
    const backupPath = path.join(dir, "backup.json");
    fs.writeFileSync(backupPath, validEmptyBackup, { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-30T00:00:00.000Z") }),
      /interrupted restore was rolled back safely/i
    );

    assert.deepEqual(fs.readFileSync(destination), originalBytes,
      "recovery must restore the exact pre-transaction dashboard-state bytes");
    assert.equal(fs.existsSync(journalPath), false,
      "the completed rollback must remove its transaction journal");
    assert.equal(fs.existsSync(path.join(stateDir, ".restore-operation.lock")), false,
      "the recovery invocation must release its operation lock");
    assert.equal(fs.existsSync(path.join(stateDir, tempName)), false,
      "the interrupted staging file must not remain after recovery");
    assert.equal(fs.existsSync(path.join(stateDir, tempName.replace(".restore-tmp", ".rollback-tmp"))), false,
      "the rollback staging file must not remain after recovery");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});



test("a fresh restore invocation completes rollback when the original-state temp was fsynced before a crash", async () => {
  const crypto = await import("node:crypto");
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    const destination = path.join(stateDir, "dashboard-state.json");
    const originalBytes = Buffer.from(JSON.stringify({
      version: 1,
      jobs: [{ id: "preserve-original-after-crash" }],
      audit: [{ event: "BEFORE_RESTORE" }]
    }));
    const replacementBytes = Buffer.from(JSON.stringify({
      version: 1,
      jobs: [{ id: "partially-restored" }],
      audit: []
    }));
    const originalSha256 = crypto.createHash("sha256").update(originalBytes).digest("hex");
    const tempName = "dashboard-state.json.interrupted.restore-tmp";
    const rollbackTempName = "dashboard-state.json.interrupted.rollback-tmp";
    const journalPath = path.join(stateDir, ".restore-transaction.json");

    // Model the crash window after the rollback bytes were written and fsynced,
    // but before rename(rollbackTemp, destination) completed.
    fs.writeFileSync(path.join(stateDir, rollbackTempName), originalBytes, { mode: 0o600 });
    fs.writeFileSync(journalPath, JSON.stringify({
      format: "sonicvhibez-restore-transaction",
      version: 1,
      createdAt: "2026-10-29T00:00:00.000Z",
      entries: [{
        target: { kind: "dashboard-state", path: "dashboard-state.json" },
        action: "REPLACE_STATE",
        newSha256: crypto.createHash("sha256").update(replacementBytes).digest("hex"),
        originalSha256,
        originalBase64: originalBytes.toString("base64"),
        tempName,
        rollbackTempName
      }]
    }), { mode: 0o600 });

    const backupPath = path.join(dir, "backup.json");
    fs.writeFileSync(backupPath, validEmptyBackup, { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-30T00:00:00.000Z") }),
      /interrupted restore was rolled back safely/i
    );

    assert.deepEqual(fs.readFileSync(destination), originalBytes,
      "recovery must promote the already-durable rollback temp without rebuilding or losing original bytes");
    assert.equal(fs.existsSync(journalPath), false,
      "the recovery journal is removed only after rollback is complete");
    assert.equal(fs.existsSync(path.join(stateDir, rollbackTempName)), false,
      "the promoted rollback temp must no longer remain");
    assert.equal(fs.existsSync(path.join(stateDir, tempName)), false,
      "the interrupted restore staging temp must not remain");
    assert.equal(fs.existsSync(path.join(stateDir, ".restore-operation.lock")), false,
      "the recovery operation lock must be released after the completed rollback");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("restart rolls back an interrupted multi-file restore across upload and Facebook ledgers", async () => {
  const crypto = await import("node:crypto");
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    const logDir = path.join(dir, "run-logs");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });
    const entries = [
      {
        target: { kind: "upload-ledger", path: "upload-attempts.json" },
        destination: path.join(logDir, "upload-attempts.json"),
        bytes: Buffer.from(JSON.stringify({ attempts: [{ id: "partial-upload-restore" }] })),
        tempName: "upload-attempts.json.multi.restore-tmp"
      },
      {
        target: { kind: "facebook-recovery-ledger", path: "facebook-recovery-ledger.jsonl" },
        destination: path.join(stateDir, "facebook-recovery-ledger.jsonl"),
        bytes: Buffer.from(JSON.stringify({ event: "partial-facebook-recovery" }) + "\n"),
        tempName: "facebook-recovery-ledger.jsonl.multi.restore-tmp"
      }
    ];
    for (const entry of entries) {
      fs.writeFileSync(entry.destination, entry.bytes, { mode: 0o600 });
    }
    const journalPath = path.join(stateDir, ".restore-transaction.json");
    fs.writeFileSync(journalPath, JSON.stringify({
      format: "sonicvhibez-restore-transaction",
      version: 1,
      createdAt: "2026-10-29T00:00:00.000Z",
      entries: entries.map(entry => ({
        target: entry.target,
        action: "RESTORE_MISSING",
        newSha256: crypto.createHash("sha256").update(entry.bytes).digest("hex"),
        tempName: entry.tempName
      }))
    }), { mode: 0o600 });
    const backupPath = path.join(dir, "backup.json");
    fs.writeFileSync(backupPath, validEmptyBackup, { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-30T00:00:00.000Z") }),
      /interrupted restore was rolled back safely/i
    );
    for (const entry of entries) {
      assert.equal(fs.existsSync(entry.destination), false,
        entry.target.kind + " created by the interrupted transaction must be rolled back");
    }
    assert.equal(fs.existsSync(journalPath), false,
      "the multi-file journal is removed only after every destination has been rolled back");
    assert.equal(fs.existsSync(path.join(stateDir, ".restore-operation.lock")), false,
      "the shared operation lock is released after recovery");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("restore preserves a newer upload ledger instead of replacing it from backup", async () => {
  const crypto = await import("node:crypto");
  const dir = makeTempDir();
  try {
    const logDir = path.join(dir, "run-logs");
    fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });
    const destination = path.join(logDir, "upload-attempts.json");
    const current = Buffer.from(JSON.stringify({ attempts: [{ id: "newer-remote-attempt" }] }));
    const older = Buffer.from(JSON.stringify({ attempts: [{ id: "older-backup-attempt" }] }));
    fs.writeFileSync(destination, current, { mode: 0o600 });
    const backup = {
      format: "sonicvhibez-state-backup",
      version: 1,
      includesSecrets: false,
      createdAt: "2026-10-01T00:00:00.000Z",
      entries: [{
        target: { kind: "upload-ledger", path: "upload-attempts.json" },
        contentBase64: older.toString("base64"),
        bytes: older.length,
        sha256: crypto.createHash("sha256").update(older).digest("hex")
      }]
    };
    const backupPath = path.join(dir, "backup.json");
    fs.writeFileSync(backupPath, JSON.stringify(backup), { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-02T00:00:00.000Z") }),
      /Refusing to overwrite an existing, different upload ledger/
    );
    assert.deepEqual(fs.readFileSync(destination), current,
      "the existing upload-attempt history must remain byte-exact");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("restore preserves a newer Facebook recovery ledger instead of replacing it from backup", async () => {
  const crypto = await import("node:crypto");
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    const destination = path.join(stateDir, "facebook-recovery-ledger.jsonl");
    const current = Buffer.from(JSON.stringify({ event: "newer-provider-readback" }) + "\n");
    const older = Buffer.from(JSON.stringify({ event: "older-draft-attempt" }) + "\n");
    fs.writeFileSync(destination, current, { mode: 0o600 });
    const backup = {
      format: "sonicvhibez-state-backup",
      version: 1,
      includesSecrets: false,
      createdAt: "2026-10-01T00:00:00.000Z",
      entries: [{
        target: { kind: "facebook-recovery-ledger", path: "facebook-recovery-ledger.jsonl" },
        contentBase64: older.toString("base64"),
        bytes: older.length,
        sha256: crypto.createHash("sha256").update(older).digest("hex")
      }]
    };
    const backupPath = path.join(dir, "backup.json");
    fs.writeFileSync(backupPath, JSON.stringify(backup), { mode: 0o600 });

    await assert.rejects(
      restoreState({ backupPath, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-02T00:00:00.000Z") }),
      /Refusing to overwrite an existing, different Facebook recovery ledger/
    );
    assert.deepEqual(fs.readFileSync(destination), current,
      "the existing Facebook recovery history must remain byte-exact");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("backup refuses to run while a restore owns the shared operation lock", async () => {
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    const lockPath = path.join(stateDir, ".restore-operation.lock");
    const owner = {
      format: "sonicvhibez-restore-operation-lock",
      version: 1,
      token: "active-restore-owner-token",
      pid: 12345,
      createdAt: "2026-10-29T00:00:00.000Z",
      operation: "restore"
    };
    fs.writeFileSync(lockPath, JSON.stringify(owner), { mode: 0o600 });

    await assert.rejects(
      backupState({ rootDir: dir }),
      /Another backup or restore operation holds the state-operation lock/
    );
    assert.deepEqual(JSON.parse(fs.readFileSync(lockPath, "utf8")), owner,
      "backup must not steal, rewrite or remove a restore-owned lock");
    assert.equal(fs.readdirSync(stateDir).includes(".restore-transaction.json"), false,
      "a blocked backup must not create or alter a restore journal");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("backup rejects an empty symlinked upload-log directory instead of silently omitting evidence", async () => {
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    const externalLogs = path.join(dir, "external-empty-logs");
    const logLink = path.join(dir, "run-logs");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(externalLogs, { mode: 0o700 });
    const stateBytes = Buffer.from(JSON.stringify({ version: 1, jobs: [], uploads: [] }));
    fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), stateBytes, { mode: 0o600 });
    fs.symlinkSync(externalLogs, logLink, "dir");
    const outputPath = path.join(dir, "backup.json");

    await assert.rejects(
      backupState({ rootDir: dir, stateDir: "state", uploadLogDir: "run-logs", rightsDir: "rights", outputPath }),
      /symbolic link in upload-log input path|upload-log input must be a real directory/i
    );
    assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), stateBytes,
      "backup validation must not mutate dashboard state");
    assert.equal(fs.existsSync(outputPath), false,
      "a backup must not be reported or left behind when its evidence directory is unsafe");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("backup rejects an empty symlinked upload-approvals directory instead of silently omitting approvals", async () => {
  const dir = makeTempDir();
  try {
    const stateDir = path.join(dir, "state");
    const logDir = path.join(dir, "run-logs");
    const externalApprovals = path.join(dir, "external-empty-approvals");
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(logDir, { mode: 0o700 });
    fs.mkdirSync(externalApprovals, { mode: 0o700 });
    const stateBytes = Buffer.from(JSON.stringify({ version: 1, jobs: [], uploads: [] }));
    fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), stateBytes, { mode: 0o600 });
    fs.symlinkSync(externalApprovals, path.join(logDir, "upload-approvals"), "dir");
    const outputPath = path.join(dir, "backup.json");

    await assert.rejects(
      backupState({ rootDir: dir, stateDir: "state", uploadLogDir: "run-logs", rightsDir: "rights", outputPath }),
      /symbolic link in upload-approval input path|upload-approval input must be a real directory/i
    );
    assert.deepEqual(fs.readFileSync(path.join(stateDir, "dashboard-state.json")), stateBytes,
      "backup validation must not mutate dashboard state");
    assert.equal(fs.existsSync(outputPath), false,
      "a backup must not silently omit an unsafe approvals directory");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
