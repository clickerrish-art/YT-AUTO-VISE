import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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

