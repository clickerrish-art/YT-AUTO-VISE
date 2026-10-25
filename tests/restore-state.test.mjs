import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { restoreState } from "../scripts/restore-state.mjs";

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

test("restore reads a regular backup file and preserves the explicit confirmation gate", async () => {
  const dir = makeTempDir();
  try {
    const backup = path.join(dir, "backup.json");
    fs.writeFileSync(backup, validEmptyBackup, { mode: 0o600 });
    const result = await restoreState({ backupPath: backup, rootDir: dir, confirm: "YES", now: Date.parse("2026-10-02T00:00:00.000Z") });
    assert.equal(result.status, "RESTORE_COMPLETED");
    assert.equal(result.restored, 0);
    await assert.rejects(
      restoreState({ backupPath: backup, rootDir: dir, confirm: "NO", now: Date.parse("2026-10-02T00:00:00.000Z") }),
      /RESTORE_CONFIRM=YES/
    );
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
