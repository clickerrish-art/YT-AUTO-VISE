#!/usr/bin/env node
/** Restore an application backup without overwriting a conflicting or newer upload ledger. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const isInvoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

function targetPath(target, { rootDir = root, stateDir = process.env.DASHBOARD_STATE_DIR ?? "state", uploadLogDir = process.env.UPLOAD_LOG_DIR ?? "run-logs", rightsDir = process.env.RIGHTS_EVIDENCE_DIR ?? "rights" } = {}) {
  const base = path.resolve(rootDir);
  const logDir = path.resolve(base, uploadLogDir);
  if (!target || typeof target.path !== "string" || target.path.includes("\\") || target.path.split("/").some(part => !part || part === "." || part === "..")) throw new Error("Backup contains an unsafe target path");
  switch (target.kind) {
    case "dashboard-state":
      if (target.path !== "dashboard-state.json") throw new Error("Invalid dashboard-state backup target");
      return path.resolve(base, stateDir, "dashboard-state.json");
    case "upload-ledger":
      if (target.path !== "upload-attempts.json") throw new Error("Invalid upload-ledger backup target");
      return path.join(logDir, "upload-attempts.json");
    case "facebook-recovery-ledger":
      if (target.path !== "facebook-recovery-ledger.jsonl") throw new Error("Invalid Facebook recovery-ledger backup target");
      return path.join(path.resolve(base, stateDir), "facebook-recovery-ledger.jsonl");
    case "upload-receipt":
      if (!/^upload-[A-Za-z0-9_-]+\.json$/.test(target.path)) throw new Error("Invalid upload-receipt backup target");
      return path.join(logDir, target.path);
    case "upload-approval":
      if (!/^[A-Za-z0-9_-]+\.json$/.test(target.path)) throw new Error("Invalid upload-approval backup target");
      return path.join(logDir, "upload-approvals", target.path);
    case "rights-evidence": {
      const allowed = target.path === "content/asset-register.json" || target.path.startsWith("rights/");
      if (!allowed) throw new Error("Rights-evidence backup target is outside the allowed evidence folders");
      const destination = path.resolve(base, target.path);
      if (target.path === "content/asset-register.json") return destination;
      const evidenceRoot = path.resolve(base, rightsDir);
      if (evidenceRoot !== base && !evidenceRoot.startsWith(base + path.sep)) throw new Error("RIGHTS_EVIDENCE_DIR must remain inside the repository root");
      const evidenceDestination = path.resolve(evidenceRoot, target.path.slice("rights/".length));
      if (evidenceDestination !== evidenceRoot && !evidenceDestination.startsWith(evidenceRoot + path.sep)) throw new Error("Rights-evidence target escapes the configured evidence directory");
      return evidenceDestination;
    }
    default:
      throw new Error("Unsupported backup target kind");
  }
}

export async function restoreState({ backupPath, rootDir = root, stateDir = process.env.DASHBOARD_STATE_DIR ?? "state", uploadLogDir = process.env.UPLOAD_LOG_DIR ?? "run-logs", rightsDir = process.env.RIGHTS_EVIDENCE_DIR ?? "rights", confirm = process.env.RESTORE_CONFIRM, overwriteState = process.env.RESTORE_OVERWRITE === "YES", now = Date.now() } = {}) {
  if (confirm !== "YES") throw new Error("Set RESTORE_CONFIRM=YES to authorize this restore operation");
  if (!backupPath) throw new Error("Provide the backup JSON path");
  const backupFile = path.resolve(backupPath);
  const backup = JSON.parse(fs.readFileSync(backupFile, "utf8"));
  if (backup.format !== "sonicvhibez-state-backup" || backup.version !== 1 || backup.includesSecrets !== false || !Array.isArray(backup.entries) || !Number.isFinite(Date.parse(backup.createdAt))) throw new Error("Backup format or schema is invalid");
  const options = { rootDir, stateDir, uploadLogDir, rightsDir };
  const prepared = [];
  const seen = new Set();
  for (const entry of backup.entries) {
    if (!entry || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") || typeof entry.contentBase64 !== "string" || !Number.isInteger(entry.bytes) || entry.bytes < 0) throw new Error("Backup entry has invalid checksum or content");
    const bytes = Buffer.from(entry.contentBase64, "base64");
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) throw new Error("Backup entry checksum/length validation failed: " + String(entry.target?.path ?? "unknown"));
    const destination = targetPath(entry.target, options);
    if (seen.has(destination)) throw new Error("Backup contains duplicate target paths");
    seen.add(destination);
    let exists = false;
    let currentSha = null;
    let currentMtime = null;
    if (fs.existsSync(destination)) {
      const stat = fs.lstatSync(destination);
      if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Restore target exists but is not a regular file: " + path.basename(destination));
      exists = true;
      currentSha = sha256(fs.readFileSync(destination));
      currentMtime = stat.mtimeMs;
    }
    if (exists && currentSha === entry.sha256) {
      prepared.push({ destination, bytes, target: entry.target, action: "UNCHANGED" });
      continue;
    }
    if (exists && entry.target.kind === "upload-ledger") throw new Error("Refusing to overwrite an existing, different upload ledger. Reconcile current remote YouTube state and preserve the newer ledger before restoring.");
    if (exists && entry.target.kind === "facebook-recovery-ledger") throw new Error("Refusing to overwrite an existing, different Facebook recovery ledger. Reconcile remote Facebook outcomes and preserve the newer ledger before restoring.");
    if (exists && entry.target.kind === "dashboard-state") {
      if (currentMtime > Date.parse(backup.createdAt)) throw new Error("Refusing to overwrite dashboard state modified after this backup was created");
      if (!overwriteState) throw new Error("Dashboard state differs from backup; set RESTORE_OVERWRITE=YES only after reviewing the backup and current state");
    }
    if (exists && entry.target.kind !== "dashboard-state") throw new Error("Restore conflict: refusing to overwrite a different existing evidence/receipt file: " + path.basename(destination));
    prepared.push({ destination, bytes, target: entry.target, action: exists ? "REPLACE_STATE" : "RESTORE_MISSING" });
  }
  if (now < Date.parse(backup.createdAt)) throw new Error("Backup timestamp is in the future; restore refused");
  const results = [];
  for (const item of prepared) {
    if (item.action === "UNCHANGED") { results.push({ target: item.target, action: item.action }); continue; }
    fs.mkdirSync(path.dirname(item.destination), { recursive: true, mode: 0o700 });
    const temp = item.destination + "." + crypto.randomUUID() + ".tmp";
    fs.writeFileSync(temp, item.bytes, { mode: 0o600, flag: "wx" });
    fs.renameSync(temp, item.destination);
    results.push({ target: item.target, action: item.action, sha256: sha256(item.bytes) });
  }
  return { status: "RESTORE_COMPLETED", backupCreatedAt: backup.createdAt, restored: results.filter(x => x.action !== "UNCHANGED").length, unchanged: results.filter(x => x.action === "UNCHANGED").length, entries: results };
}

if (isInvoked) {
  try {
    const result = await restoreState({ backupPath: process.argv[2] ? path.resolve(process.argv[2]) : undefined });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("RESTORE_BLOCKED: " + (error instanceof Error ? error.message : "restore failed"));
    process.exitCode = 1;
  }
}
