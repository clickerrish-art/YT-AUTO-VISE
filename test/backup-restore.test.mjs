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
    assert.ok(backup.entries.some(entry => entry.target.kind === "upload-ledger"));
    assert.ok(backup.entries.some(entry => entry.target.kind === "upload-receipt"));
    assert.ok(backup.entries.some(entry => entry.target.kind === "upload-approval"));
    assert.ok(backup.entries.some(entry => entry.target.kind === "rights-evidence"));
    const restored = await restoreState({ backupPath, rootDir: destination.root, stateDir: destination.stateDir, uploadLogDir: destination.logDir, rightsDir: destination.rightsDir, confirm: "YES" });
    assert.equal(restored.status, "RESTORE_COMPLETED");
    assert.equal(restored.restored, backup.entries.length);
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
  for (const pattern of [".env", "!.env.example", "/state/", "/run-logs/", "/backups/", "/rights/", "/content/render-manifest.json", "/content/long-form-render-manifest.json", "/content/asset-register.json", "/media/next-short.mp4", "/media/long-form-next.mp4"]) assert.ok(ignore.includes(pattern), "missing .gitignore protection: " + pattern);
});
