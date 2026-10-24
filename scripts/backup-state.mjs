#!/usr/bin/env node
/** Create a checksummed, secret-excluding backup of app state, upload evidence, and retained rights records. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const isInvoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

function collectFiles(dir, relativePrefix, output, { maxBytes = 10 * 1024 * 1024 } = {}) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.lstatSync(dir);
  if (stat.isSymbolicLink()) throw new Error("Backup refuses symbolic-link directories: " + relativePrefix);
  if (!stat.isDirectory()) throw new Error("Backup path must be a directory: " + relativePrefix);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    const relative = path.posix.join(relativePrefix, entry.name);
    const itemStat = fs.lstatSync(absolute);
    if (itemStat.isSymbolicLink()) throw new Error("Backup refuses symbolic links: " + relative);
    if (itemStat.isDirectory()) {
      collectFiles(absolute, relative, output, { maxBytes });
      continue;
    }
    if (!itemStat.isFile()) continue;
    if (itemStat.size > maxBytes) throw new Error("Backup file exceeds 10 MiB limit: " + relative);
    const bytes = fs.readFileSync(absolute);
    output.push({ target: { kind: "rights-evidence", path: relative }, sha256: sha256(bytes), bytes: bytes.length, contentBase64: bytes.toString("base64") });
  }
}

export async function backupState({ rootDir = root, stateDir = process.env.DASHBOARD_STATE_DIR ?? "state", uploadLogDir = process.env.UPLOAD_LOG_DIR ?? "run-logs", rightsDir = process.env.RIGHTS_EVIDENCE_DIR ?? "rights", outputPath } = {}) {
  const base = path.resolve(rootDir);
  const stateFile = path.resolve(base, stateDir, "dashboard-state.json");
  const logDir = path.resolve(base, uploadLogDir);
  const entries = [];
  const add = (absolute, target, maxBytes = 10 * 1024 * 1024) => {
    if (!fs.existsSync(absolute)) return;
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Backup accepts only regular files: " + absolute);
    if (stat.size > maxBytes) throw new Error("Backup file exceeds 10 MiB limit: " + path.basename(absolute));
    const bytes = fs.readFileSync(absolute);
    entries.push({ target, sha256: sha256(bytes), bytes: bytes.length, contentBase64: bytes.toString("base64") });
  };
  add(stateFile, { kind: "dashboard-state", path: "dashboard-state.json" });
  add(path.join(logDir, "upload-attempts.json"), { kind: "upload-ledger", path: "upload-attempts.json" });
  if (fs.existsSync(logDir)) {
    for (const name of fs.readdirSync(logDir)) {
      if (/^upload-[A-Za-z0-9_-]+\.json$/.test(name) && name !== "upload-attempts.json") add(path.join(logDir, name), { kind: "upload-receipt", path: name });
    }
    const approvals = path.join(logDir, "upload-approvals");
    if (fs.existsSync(approvals)) {
      for (const name of fs.readdirSync(approvals)) {
        if (!/^[A-Za-z0-9_-]+\.json$/.test(name)) continue;
        add(path.join(approvals, name), { kind: "upload-approval", path: name });
      }
    }
  }
  const absoluteRights = path.resolve(base, rightsDir);
  if (absoluteRights !== base && !absoluteRights.startsWith(base + path.sep)) throw new Error("RIGHTS_EVIDENCE_DIR must be inside the repository root");
  collectFiles(absoluteRights, "rights", entries);
  add(path.join(base, "content", "asset-register.json"), { kind: "rights-evidence", path: "content/asset-register.json" });
  if (!entries.length) throw new Error("No state, upload ledger, receipts, approvals or retained rights evidence were found; nothing to back up");
  const payload = {
    format: "sonicvhibez-state-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    includesSecrets: false,
    entries: entries.sort((a, b) => (a.target.kind + ":" + a.target.path).localeCompare(b.target.kind + ":" + b.target.path))
  };
  const encoded = JSON.stringify(payload, null, 2) + "\n";
  const destination = path.resolve(outputPath ?? path.join(base, "backups", "sonicvhibez-state-backup-" + payload.createdAt.replace(/[:.]/g, "-") + ".json"));
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  const temp = destination + "." + crypto.randomUUID() + ".tmp";
  fs.writeFileSync(temp, encoded, { mode: 0o600, flag: "wx" });
  fs.renameSync(temp, destination);
  return { path: destination, createdAt: payload.createdAt, entries: entries.length, sha256: sha256(Buffer.from(encoded)), includesSecrets: false };
}

if (isInvoked) {
  try {
    const result = await backupState({ outputPath: process.argv[2] ? path.resolve(process.argv[2]) : undefined });
    console.log(JSON.stringify({ status: "BACKUP_CREATED", ...result }, null, 2));
  } catch (error) {
    console.error("BACKUP_BLOCKED: " + (error instanceof Error ? error.message : "backup failed"));
    process.exitCode = 1;
  }
}
