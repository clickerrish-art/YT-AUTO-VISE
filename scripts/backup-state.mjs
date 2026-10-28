#!/usr/bin/env node
/** Create a checksummed, secret-excluding backup of app state, upload evidence, and retained rights records. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const isInvoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

/**
 * Reject symlinks in every visible path component before reading backup inputs.
 * This is a path-based guard, not a complete defence against concurrent ancestor
 * replacement; run backups in an isolated, owner-controlled filesystem.
 */
function assertNoSymlinkComponents(filePath, label = "backup input") {
  const absolute = path.resolve(filePath);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  const parts = path.relative(parsed.root, absolute).split(path.sep).filter(Boolean);
  for (let index = 0; index < parts.length; index++) {
    current = path.join(current, parts[index]);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error?.code === "ENOENT") throw new Error("Backup " + label + " path is missing");
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error("Backup refuses symbolic links in " + label + " path");
    if (index < parts.length - 1 && !stat.isDirectory()) {
      throw new Error("Backup " + label + " path contains a non-directory component");
    }
  }
}

function collectFiles(dir, relativePrefix, output, { maxBytes = 10 * 1024 * 1024 } = {}) {
  if (!fs.existsSync(dir)) return;
  assertNoSymlinkComponents(dir, "rights-evidence input");
  const stat = fs.lstatSync(dir);
  if (stat.isSymbolicLink()) throw new Error("Backup refuses symbolic-link directories: " + relativePrefix);
  if (!stat.isDirectory()) throw new Error("Backup path must be a directory: " + relativePrefix);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    const relative = path.posix.join(relativePrefix, entry.name);
    assertNoSymlinkComponents(absolute, "rights-evidence file");
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

async function backupStateUnlocked({ rootDir = root, stateDir = process.env.DASHBOARD_STATE_DIR ?? "state", uploadLogDir = process.env.UPLOAD_LOG_DIR ?? "run-logs", rightsDir = process.env.RIGHTS_EVIDENCE_DIR ?? "rights", outputPath } = {}) {
  const base = path.resolve(rootDir);
  const stateFile = path.resolve(base, stateDir, "dashboard-state.json");
  const logDir = path.resolve(base, uploadLogDir);
  const entries = [];
  const add = (absolute, target, maxBytes = 10 * 1024 * 1024) => {
    if (!fs.existsSync(absolute)) return;
    assertNoSymlinkComponents(absolute, "state/evidence input");
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Backup accepts only regular files: " + absolute);
    if (stat.size > maxBytes) throw new Error("Backup file exceeds 10 MiB limit: " + path.basename(absolute));
    const bytes = fs.readFileSync(absolute);
    entries.push({ target, sha256: sha256(bytes), bytes: bytes.length, contentBase64: bytes.toString("base64") });
  };
  add(stateFile, { kind: "dashboard-state", path: "dashboard-state.json" });
  add(path.join(path.dirname(stateFile), "facebook-recovery-ledger.jsonl"), { kind: "facebook-recovery-ledger", path: "facebook-recovery-ledger.jsonl" });
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
  assertNoSymlinkComponents(path.dirname(destination), "backup output directory");
  const temp = destination + "." + crypto.randomUUID() + ".tmp";
  let fd;
  let linked = false;
  try {
    fd = fs.openSync(temp, "wx", 0o600);
    fs.writeFileSync(fd, encoded);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;

    // linkSync creates the final name atomically without replacing an existing
    // backup. renameSync would silently overwrite an operator-supplied path.
    fs.linkSync(temp, destination);
    linked = true;
    fs.unlinkSync(temp);

    // Persist the directory entry on POSIX filesystems before reporting success.
    // Some platforms do not permit opening/fsyncing directories, so Windows
    // relies on the flushed file plus atomic same-directory link operation.
    if (process.platform !== "win32") {
      const directoryFd = fs.openSync(path.dirname(destination), fs.constants.O_RDONLY);
      try { fs.fsyncSync(directoryFd); }
      finally { fs.closeSync(directoryFd); }
    }
  } catch (error) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
    try { fs.unlinkSync(temp); } catch {}
    if (error?.code === "EEXIST" && !linked) {
      throw new Error("Backup destination already exists; refusing to overwrite an existing backup", { cause: error });
    }
    throw error;
  }
  return { path: destination, createdAt: payload.createdAt, entries: entries.length, sha256: sha256(Buffer.from(encoded)), includesSecrets: false };
}


/**
 * Serialize backups with restores so a backup cannot capture a partially
 * committed restore transaction. The legacy lock filename is shared with
 * restore-state.mjs; lock ownership is token-checked and never stolen.
 */
export async function backupState(options = {}) {
  const rootDir = options.rootDir ?? root;
  const stateDir = options.stateDir ?? process.env.DASHBOARD_STATE_DIR ?? "state";
  const stateRoot = path.resolve(rootDir, stateDir);

  const assertNoSymlinksAllowMissing = filePath => {
    const absolute = path.resolve(filePath);
    const parsed = path.parse(absolute);
    let current = parsed.root;
    const parts = path.relative(parsed.root, absolute).split(path.sep).filter(Boolean);
    for (let index = 0; index < parts.length; index++) {
      current = path.join(current, parts[index]);
      let stat;
      try { stat = fs.lstatSync(current); }
      catch (error) {
        if (error?.code === "ENOENT") return;
        throw error;
      }
      if (stat.isSymbolicLink()) throw new Error("Backup refuses symbolic links in state-operation lock path");
      if (index < parts.length - 1 && !stat.isDirectory()) {
        throw new Error("Backup state-operation lock path contains a non-directory component");
      }
    }
  };

  assertNoSymlinksAllowMissing(stateRoot);
  fs.mkdirSync(stateRoot, { recursive: true, mode: 0o700 });
  assertNoSymlinksAllowMissing(stateRoot);
  const stateStat = fs.lstatSync(stateRoot);
  if (stateStat.isSymbolicLink() || !stateStat.isDirectory()) {
    throw new Error("Backup state directory must be a real directory, not a symlink or special file");
  }

  const lockPath = path.join(stateRoot, ".restore-operation.lock");
  const token = crypto.randomUUID();
  let fd;
  try {
    fd = fs.openSync(lockPath, "wx", 0o600);
    fs.writeFileSync(fd, JSON.stringify({
      format: "sonicvhibez-restore-operation-lock",
      version: 1,
      token,
      pid: process.pid,
      createdAt: new Date().toISOString(),
      operation: "backup"
    }));
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
  } catch (error) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
    if (error?.code === "EEXIST") {
      throw new Error("Another backup or restore operation holds the state-operation lock; inspect the owner before retrying");
    }
    try {
      const lockStat = fs.lstatSync(lockPath);
      if (lockStat.isFile() && !lockStat.isSymbolicLink() && JSON.parse(fs.readFileSync(lockPath, "utf8")).token === token) {
        fs.unlinkSync(lockPath);
      }
    } catch {}
    throw error;
  }

  try {
    return await backupStateUnlocked(options);
  } finally {
    try {
      const lockStat = fs.lstatSync(lockPath);
      if (!lockStat.isSymbolicLink() && lockStat.isFile()) {
        const current = JSON.parse(fs.readFileSync(lockPath, "utf8"));
        if (current.format === "sonicvhibez-restore-operation-lock" && current.token === token) {
          fs.unlinkSync(lockPath);
        }
      }
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw new Error("Backup finished but its state-operation lock could not be safely cleared; inspect the lock before retrying", { cause: error });
      }
    }
  }
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
