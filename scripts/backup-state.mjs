#!/usr/bin/env node
/** Create a checksummed, secret-excluding backup of app state, upload evidence, and retained rights records. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { acquireDashboardStateFileLock } from "./dashboard-state-file-lock.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const isInvoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

/**
 * Create an output directory one component at a time, checking each existing
 * ancestor before creating descendants. Recursive mkdir can follow a symlink
 * and create directories outside the requested tree before a later check fails.
 */
function ensureSafeDirectoryPath(directory) {
  const target = path.resolve(directory);
  const parsed = path.parse(target);
  let current = parsed.root;
  for (const component of path.relative(parsed.root, target).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      try {
        fs.mkdirSync(current, { mode: 0o700 });
      } catch (mkdirError) {
        if (mkdirError?.code !== "EEXIST") throw mkdirError;
      }
      stat = fs.lstatSync(current);
    }
    if (stat.isSymbolicLink()) throw new Error("Backup output directory contains a symbolic link; refusing an unintended destination");
    if (!stat.isDirectory()) throw new Error("Backup output path must contain only directories");
  }
}

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

/**
 * Read a regular backup input through a pinned descriptor. O_NOFOLLOW blocks
 * final-component symlink swaps; inode and metadata checks ensure the path
 * still names the same unchanged file after the descriptor read.
 */
export function readRegularFileNoFollow(filePath) {
  if (typeof fs.constants.O_NOFOLLOW !== "number") {
    throw new Error("Backup requires O_NOFOLLOW support to read evidence safely");
  }
  const absolute = path.resolve(filePath);
  const flags = fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW;
  const fd = fs.openSync(absolute, flags);
  try {
    const openedBefore = fs.fstatSync(fd, { bigint: true });
    if (!openedBefore.isFile()) throw new Error("Backup accepts only regular files: " + absolute);
    const pathBefore = fs.lstatSync(absolute, { bigint: true });
    const sameIdentity = (left, right) => left.dev === right.dev && left.ino === right.ino;
    if (pathBefore.isSymbolicLink() || !pathBefore.isFile() || !sameIdentity(openedBefore, pathBefore)) {
      throw new Error("Backup input changed while it was being opened; refusing an inconsistent snapshot");
    }
    const bytes = fs.readFileSync(fd);
    const openedAfter = fs.fstatSync(fd, { bigint: true });
    const pathAfter = fs.lstatSync(absolute, { bigint: true });
    const unchanged = sameIdentity(openedBefore, openedAfter)
      && sameIdentity(openedAfter, pathAfter)
      && openedBefore.size === openedAfter.size
      && openedBefore.mtimeNs === openedAfter.mtimeNs
      && openedBefore.ctimeNs === openedAfter.ctimeNs
      && bytes.length === Number(openedAfter.size)
      && !pathAfter.isSymbolicLink()
      && pathAfter.isFile();
    if (!unchanged) throw new Error("Backup input changed during read; refusing an inconsistent snapshot");
    return bytes;
  } finally {
    fs.closeSync(fd);
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
    const bytes = readRegularFileNoFollow(absolute);
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
    const bytes = readRegularFileNoFollow(absolute);
    entries.push({ target, sha256: sha256(bytes), bytes: bytes.length, contentBase64: bytes.toString("base64") });
  };
  add(stateFile, { kind: "dashboard-state", path: "dashboard-state.json" });
  add(path.join(path.dirname(stateFile), "facebook-recovery-ledger.jsonl"), { kind: "facebook-recovery-ledger", path: "facebook-recovery-ledger.jsonl" });
  add(path.join(logDir, "upload-attempts.json"), { kind: "upload-ledger", path: "upload-attempts.json" });
  let logDirStat;
  try {
    logDirStat = fs.lstatSync(logDir);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (logDirStat) {
    assertNoSymlinkComponents(logDir, "upload-log input");
    if (logDirStat.isSymbolicLink() || !logDirStat.isDirectory()) {
      throw new Error("Backup upload-log input must be a real directory, not a symlink or special file");
    }
    for (const name of fs.readdirSync(logDir)) {
      if (/^upload-[A-Za-z0-9_-]+\\.json$/.test(name) && name !== "upload-attempts.json") add(path.join(logDir, name), { kind: "upload-receipt", path: name });
    }
    const approvals = path.join(logDir, "upload-approvals");
    let approvalsStat;
    try {
      approvalsStat = fs.lstatSync(approvals);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (approvalsStat) {
      assertNoSymlinkComponents(approvals, "upload-approval input");
      if (approvalsStat.isSymbolicLink() || !approvalsStat.isDirectory()) {
        throw new Error("Backup upload-approval input must be a real directory, not a symlink or special file");
      }
      for (const name of fs.readdirSync(approvals)) {
        if (!/^[A-Za-z0-9_-]+\\.json$/.test(name)) continue;
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
  ensureSafeDirectoryPath(path.dirname(destination));
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

  let releaseDashboardStateLock;
  try {
    releaseDashboardStateLock = acquireDashboardStateFileLock(path.join(stateRoot, "dashboard-state.json"));
    const interruptedRestoreJournal = path.join(stateRoot, ".restore-transaction.json");
    try {
      const journalStat = fs.lstatSync(interruptedRestoreJournal);
      if (journalStat.isSymbolicLink() || !journalStat.isFile()) {
        throw new Error("An interrupted restore journal path is unsafe; inspect state and recover before creating a backup");
      }
      throw new Error("An interrupted restore journal exists; run restore recovery and inspect the recovered state before creating a backup snapshot");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    return await backupStateUnlocked(options);
  } finally {
    try {
      releaseDashboardStateLock?.();
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
}

/** Explicitly promote one verified temporary backup after operator-confirmed process death. */
export function recoverInterruptedBackup({ rootDir = root, stateDir = process.env.DASHBOARD_STATE_DIR ?? "state", outputPath, temporaryPath, lockToken, confirmOwnerStopped = false } = {}) {
  if (confirmOwnerStopped !== true) throw new Error("Recovery requires explicit confirmation that the backup owner has been stopped");
  if (typeof lockToken !== "string" || !/^[0-9a-f-]{36}$/i.test(lockToken)) throw new Error("Recovery requires the exact backup lock token");
  if (!outputPath || !temporaryPath) throw new Error("Recovery requires exact final and temporary paths");
  const stateRoot = path.resolve(rootDir, stateDir), destination = path.resolve(outputPath), temporary = path.resolve(temporaryPath);
  const lockPath = path.join(stateRoot, ".restore-operation.lock");
  const tempSuffix = path.basename(temporary).slice(path.basename(destination).length + 1);
  if (path.dirname(destination) !== path.dirname(temporary) || !path.basename(temporary).startsWith(path.basename(destination) + ".") || tempSuffix.length !== 40 || tempSuffix.slice(36) !== ".tmp" || !/^[0-9a-f-]{36}$/.test(tempSuffix.slice(0, 36))) throw new Error("Temporary backup must be the UUID-named sibling of the final backup");
  assertNoSymlinkComponents(stateRoot, "recovery state directory");
  assertNoSymlinkComponents(path.dirname(destination), "recovery output directory");
  for (const [file, label] of [[lockPath, "lock"], [temporary, "temporary backup"]]) { const st = fs.lstatSync(file); if (st.isSymbolicLink() || !st.isFile()) throw new Error("Recovery refuses unsafe " + label); }
  try { fs.lstatSync(destination); throw new Error("Recovery destination already exists; refusing overwrite"); } catch (e) { if (e?.code !== "ENOENT") throw e; }
  const lockStat = fs.lstatSync(lockPath, { bigint: true });
  const lockRaw = readRegularFileNoFollow(lockPath);
  const lockAfterRead = fs.lstatSync(lockPath, { bigint: true });
  if (lockAfterRead.isSymbolicLink() || !lockAfterRead.isFile() || lockStat.dev !== lockAfterRead.dev || lockStat.ino !== lockAfterRead.ino) throw new Error("Recovery lock changed while being read");
  const lock = JSON.parse(lockRaw.toString("utf8"));
  if (!lock || lock.format !== "sonicvhibez-restore-operation-lock" || lock.version !== 1 || lock.operation !== "backup" || lock.token !== lockToken || !Number.isSafeInteger(lock.pid) || lock.pid < 1 || !Number.isFinite(Date.parse(lock.createdAt))) throw new Error("Recovery lock metadata is malformed or mismatched");
  try { process.kill(lock.pid, 0); throw new Error("Recovery owner PID is still live; refusing recovery"); } catch (e) { if (e?.code !== "ESRCH") throw e; }
  const prefix = path.basename(destination) + ".", candidates = fs.readdirSync(path.dirname(destination)).filter(n => n.startsWith(prefix) && n.endsWith(".tmp"));
  if (candidates.length !== 1 || candidates[0] !== path.basename(temporary)) throw new Error("Recovery requires exactly one unambiguous temporary backup");
  const raw = readRegularFileNoFollow(temporary), payload = JSON.parse(raw.toString("utf8"));
  if (!payload || payload.format !== "sonicvhibez-state-backup" || payload.version !== 1 || payload.includesSecrets !== false || !Number.isFinite(Date.parse(payload.createdAt)) || !Array.isArray(payload.entries) || !payload.entries.length) throw new Error("Temporary file is not a valid secret-excluding backup");
  const seen = new Set();
  for (const entry of payload.entries) {
    const p = entry?.target?.path, b64 = entry?.contentBase64;
    if (!entry.target || typeof entry.target.kind !== "string" || !entry.target.kind || typeof p !== "string" || !p || p.includes("\u0000") || path.posix.isAbsolute(p) || (p.includes(String.fromCharCode(92)) || p.split("/").some(x => !x || x === "." || x === "..")) || !/^[a-f0-9]{64}$/.test(entry.sha256) || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || typeof b64 !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b64)) throw new Error("Backup contains an invalid or unsafe entry");
    const id = entry.target.kind + ":" + p; if (seen.has(id)) throw new Error("Backup contains duplicate target entries"); seen.add(id);
    const bytes = Buffer.from(b64, "base64"); if (bytes.length !== entry.bytes || bytes.toString("base64") !== b64 || sha256(bytes) !== entry.sha256) throw new Error("Backup entry checksum or byte length mismatch");
  }
  fs.linkSync(temporary, destination); fs.unlinkSync(temporary);
  if (process.platform !== "win32") { const fd = fs.openSync(path.dirname(destination), fs.constants.O_RDONLY); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } }
  const currentStat = fs.lstatSync(lockPath, { bigint: true });
  if (currentStat.isSymbolicLink() || !currentStat.isFile() || currentStat.dev !== lockStat.dev || currentStat.ino !== lockStat.ino) throw new Error("Backup promoted but lock file identity changed; inspect manually");
  const current = JSON.parse(readRegularFileNoFollow(lockPath).toString("utf8"));
  if (current.token !== lockToken || current.pid !== lock.pid || current.operation !== "backup" || current.createdAt !== lock.createdAt) throw new Error("Backup promoted but lock ownership changed; inspect manually");
  const finalLockStat = fs.lstatSync(lockPath, { bigint: true });
  if (finalLockStat.isSymbolicLink() || !finalLockStat.isFile() || finalLockStat.dev !== lockStat.dev || finalLockStat.ino !== lockStat.ino) throw new Error("Backup promoted but lock file identity changed; inspect manually");
  fs.unlinkSync(lockPath); return { path: destination, createdAt: payload.createdAt, entries: payload.entries.length, sha256: sha256(raw), includesSecrets: false };
}

if (isInvoked) {
  try {
    let result;
    if (process.argv[2] === "--recover") {
      if (process.argv[6] !== "--confirm-owner-stopped") throw new Error("Usage: npm run backup:recover -- <final-path> <temporary-path> <lock-token> --confirm-owner-stopped");
      result = recoverInterruptedBackup({ outputPath: process.argv[3], temporaryPath: process.argv[4], lockToken: process.argv[5], confirmOwnerStopped: true });
      console.log(JSON.stringify({ status: "INTERRUPTED_BACKUP_RECOVERED", ...result }, null, 2));
    } else {
      result = await backupState({ outputPath: process.argv[2] ? path.resolve(process.argv[2]) : undefined });
      console.log(JSON.stringify({ status: "BACKUP_CREATED", ...result }, null, 2));
    }
  } catch (error) { console.error("BACKUP_BLOCKED: " + (error instanceof Error ? error.message : "backup failed")); process.exitCode = 1; }
}
