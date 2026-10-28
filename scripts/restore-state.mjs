#!/usr/bin/env node
/** Restore an application backup without overwriting a conflicting or newer upload ledger. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { atomicWriteJson } from "./atomic-json-file.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const isInvoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

/**
 * Read a backup only from a regular file whose visible path contains no symlinks.
 * O_NOFOLLOW protects the final component on platforms that support it; component
 * checks additionally reject symlinked ancestors. Filesystem races in ancestor
 * components cannot be eliminated portably with path-based Node APIs and remain
 * an operational isolation requirement.
 */
function readBackupFileNoSymlinks(filePath) {
  const absolute = path.resolve(filePath);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  const parts = path.relative(parsed.root, absolute).split(path.sep).filter(Boolean);
  for (let index = 0; index < parts.length; index++) {
    current = path.join(current, parts[index]);
    let stat;
    try { stat = fs.lstatSync(current); }
    catch (error) {
      if (error?.code === "ENOENT") throw new Error("Backup file or path component is missing");
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error("Restore refuses a symbolic link in the backup file path");
    const isFinal = index === parts.length - 1;
    if (!isFinal && !stat.isDirectory()) throw new Error("Backup path contains a non-directory component");
    if (isFinal && !stat.isFile()) throw new Error("Backup source must be a regular file");
  }
  const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0);
  const fd = fs.openSync(absolute, flags);
  try {
    if (!fs.fstatSync(fd).isFile()) throw new Error("Backup source must be a regular file");
    return fs.readFileSync(fd, "utf8");
  } finally {
    fs.closeSync(fd);
  }
}

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

function assertNoSymlinkComponents(anchor, destination) {
  const resolvedAnchor = path.resolve(anchor);
  const resolvedDestination = path.resolve(destination);
  if (resolvedDestination !== resolvedAnchor && !resolvedDestination.startsWith(resolvedAnchor + path.sep)) {
    throw new Error("Restore destination escapes its trusted directory");
  }

  // Inspect the entire path from the filesystem root, not just descendants of the
  // configured anchor. Otherwise a symlinked rootDir/parent could redirect a path
  // whose lexical destination still appears to be inside the anchor.
  const parsed = path.parse(resolvedDestination);
  let current = parsed.root;
  const parts = path.relative(parsed.root, resolvedDestination).split(path.sep).filter(Boolean);
  for (let index = 0; index < parts.length; index++) {
    current = path.join(current, parts[index]);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      throw new Error("Restore refuses symbolic links in destination paths");
    }
    if (index < parts.length - 1 && !stat.isDirectory()) {
      throw new Error("Restore destination has a non-directory path component");
    }
  }
}

function safeRestoreAnchor(target, options, destination) {
  const base = path.resolve(options.rootDir);
  const stateRoot = path.resolve(base, options.stateDir);
  const logRoot = path.resolve(base, options.uploadLogDir);
  if (target.kind === "dashboard-state" || target.kind === "facebook-recovery-ledger") {
    return destination === stateRoot || destination.startsWith(stateRoot + path.sep) ? stateRoot : base;
  }
  if (target.kind === "upload-ledger" || target.kind === "upload-receipt" || target.kind === "upload-approval") {
    if (logRoot !== base && !logRoot.startsWith(base + path.sep)) {
      throw new Error("UPLOAD_LOG_DIR must remain inside the repository root for restore");
    }
    return base;
  }
  return base;
}

const RESTORE_JOURNAL_NAME = ".restore-transaction.json";

function restoreJournalPath(options) {
  const base = path.resolve(options.rootDir);
  const stateRoot = path.resolve(base, options.stateDir);
  const destination = path.join(stateRoot, RESTORE_JOURNAL_NAME);
  assertNoSymlinkComponents(stateRoot, destination);
  return destination;
}

function writeDurableBytes(destination, bytes) {
  const temp = destination + "." + crypto.randomUUID() + ".rollback-tmp";
  let fd;
  try {
    fd = fs.openSync(temp, "wx", 0o600);
    fs.writeFileSync(fd, bytes);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(temp, destination);
  } catch (error) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
    try { fs.unlinkSync(temp); } catch {}
    throw error;
  }
}

/**
 * Roll back a restore interrupted after its durable journal was written.
 * Recovery only mutates destinations whose current bytes still match the
 * journal's expected transaction output; unexpected operator changes stop
 * recovery and leave the journal for manual reconciliation.
 */
function recoverInterruptedRestore(options) {
  const journalPath = restoreJournalPath(options);
  if (!fs.existsSync(journalPath)) return { recovered: false };
  const journal = JSON.parse(readBackupFileNoSymlinks(journalPath));
  if (journal.format !== "sonicvhibez-restore-transaction" || journal.version !== 1 || !Array.isArray(journal.entries)) {
    throw new Error("Interrupted restore journal is invalid; manual recovery is required");
  }

  for (const entry of [...journal.entries].reverse()) {
    if (!entry || !["RESTORE_MISSING", "REPLACE_STATE"].includes(entry.action) || !/^[a-f0-9]{64}$/.test(entry.newSha256 ?? "")) {
      throw new Error("Interrupted restore journal entry is invalid; manual recovery is required");
    }
    const destination = targetPath(entry.target, options);
    assertNoSymlinkComponents(safeRestoreAnchor(entry.target, options, destination), destination);
    const tempName = entry.tempName;
    if (typeof tempName !== "string" || path.basename(tempName) !== tempName ||
        !tempName.startsWith(path.basename(destination) + ".") || !tempName.endsWith(".restore-tmp")) {
      throw new Error("Interrupted restore journal contains an unsafe temporary path");
    }
    const temp = path.join(path.dirname(destination), tempName);
    assertNoSymlinkComponents(safeRestoreAnchor(entry.target, options, destination), temp);

    let exists = fs.existsSync(destination);
    let currentSha = null;
    if (exists) {
      const stat = fs.lstatSync(destination);
      if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Interrupted restore destination is not a regular file; manual recovery is required");
      currentSha = sha256(fs.readFileSync(destination));
    }

    if (entry.action === "RESTORE_MISSING") {
      if (exists && currentSha === entry.newSha256) fs.unlinkSync(destination);
      else if (exists) throw new Error("Interrupted restore found unexpected destination contents; manual recovery is required: " + path.basename(destination));
    } else {
      if (!/^[a-f0-9]{64}$/.test(entry.originalSha256 ?? "") || typeof entry.originalBase64 !== "string") {
        throw new Error("Interrupted replacement journal lacks original state; manual recovery is required");
      }
      const originalBytes = Buffer.from(entry.originalBase64, "base64");
      if (sha256(originalBytes) !== entry.originalSha256) throw new Error("Interrupted replacement journal original-state checksum is invalid");
      if (exists && currentSha === entry.newSha256) writeDurableBytes(destination, originalBytes);
      else if (exists && currentSha === entry.originalSha256) { /* already rolled back */ }
      else if (!exists) writeDurableBytes(destination, originalBytes);
      else throw new Error("Interrupted restore found unexpected replacement contents; manual recovery is required: " + path.basename(destination));
    }

    try {
      const tempStat = fs.lstatSync(temp);
      if (tempStat.isSymbolicLink() || !tempStat.isFile()) throw new Error("Interrupted restore temporary path is not a regular file");
      fs.unlinkSync(temp);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  fs.unlinkSync(journalPath);
  return { recovered: true, entries: journal.entries.length };
}

async function restoreStateUnlocked({ backupPath, rootDir = root, stateDir = process.env.DASHBOARD_STATE_DIR ?? "state", uploadLogDir = process.env.UPLOAD_LOG_DIR ?? "run-logs", rightsDir = process.env.RIGHTS_EVIDENCE_DIR ?? "rights", confirm = process.env.RESTORE_CONFIRM, overwriteState = process.env.RESTORE_OVERWRITE === "YES", now = Date.now() } = {}) {
  if (confirm !== "YES") throw new Error("Set RESTORE_CONFIRM=YES to authorize this restore operation");
  if (!backupPath) throw new Error("Provide the backup JSON path");
  const options = { rootDir, stateDir, uploadLogDir, rightsDir };
  // If a previous process died during commit, reconcile its journal before
  // starting another restore so the state never silently remains half-applied.
  // Stop after recovery: require an explicit second invocation before retrying
  // the requested restore, so an operator can inspect the recovered state.
  const interruptedRestore = recoverInterruptedRestore(options);
  if (interruptedRestore.recovered) {
    throw new Error("An interrupted restore was rolled back safely; inspect the recovered state and rerun restore explicitly if still required");
  }
  const backupFile = path.resolve(backupPath);
  const backup = JSON.parse(readBackupFileNoSymlinks(backupFile));
  if (backup.format !== "sonicvhibez-state-backup" || backup.version !== 1 || backup.includesSecrets !== false || !Array.isArray(backup.entries) || !Number.isFinite(Date.parse(backup.createdAt))) throw new Error("Backup format or schema is invalid");
  if (backup.entries.length === 0) throw new Error("Backup contains no entries; refusing a no-op restore");
  const prepared = [];
  const seen = new Set();
  for (const entry of backup.entries) {
    if (!entry || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") || typeof entry.contentBase64 !== "string" || !Number.isInteger(entry.bytes) || entry.bytes < 0) throw new Error("Backup entry has invalid checksum or content");
    const bytes = Buffer.from(entry.contentBase64, "base64");
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) throw new Error("Backup entry checksum/length validation failed: " + String(entry.target?.path ?? "unknown"));
    const destination = targetPath(entry.target, options);
    assertNoSymlinkComponents(safeRestoreAnchor(entry.target, options, destination), destination);
    if (seen.has(destination)) throw new Error("Backup contains duplicate target paths");
    seen.add(destination);
    let exists = false;
    let currentSha = null;
    let currentMtime = null;
    let originalBytes = null;
    if (fs.existsSync(destination)) {
      const stat = fs.lstatSync(destination);
      if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Restore target exists but is not a regular file: " + path.basename(destination));
      exists = true;
      originalBytes = fs.readFileSync(destination);
      currentSha = sha256(originalBytes);
      currentMtime = stat.mtimeMs;
    }
    if (exists && currentSha === entry.sha256) {
      prepared.push({ destination, bytes, originalBytes, target: entry.target, action: "UNCHANGED" });
      continue;
    }
    if (exists && entry.target.kind === "upload-ledger") throw new Error("Refusing to overwrite an existing, different upload ledger. Reconcile current remote YouTube state and preserve the newer ledger before restoring.");
    if (exists && entry.target.kind === "facebook-recovery-ledger") throw new Error("Refusing to overwrite an existing, different Facebook recovery ledger. Reconcile remote Facebook outcomes and preserve the newer ledger before restoring.");
    if (exists && entry.target.kind === "dashboard-state") {
      if (currentMtime > Date.parse(backup.createdAt)) throw new Error("Refusing to overwrite dashboard state modified after this backup was created");
      if (!overwriteState) throw new Error("Dashboard state differs from backup; set RESTORE_OVERWRITE=YES only after reviewing the backup and current state");
    }
    if (exists && entry.target.kind !== "dashboard-state") throw new Error("Restore conflict: refusing to overwrite a different existing evidence/receipt file: " + path.basename(destination));
    prepared.push({ destination, bytes, originalBytes, target: entry.target, action: exists ? "REPLACE_STATE" : "RESTORE_MISSING" });
  }
  if (now < Date.parse(backup.createdAt)) throw new Error("Backup timestamp is in the future; restore refused");
  // Stage every changed entry before the first destination is replaced. A staging
  // failure therefore cannot leave a subset of the restored files committed.
  const staged = [];
  const committed = [];
  const results = [];
  try {
    for (const item of prepared) {
      if (item.action === "UNCHANGED") {
        results.push({ target: item.target, action: item.action });
        continue;
      }
      fs.mkdirSync(path.dirname(item.destination), { recursive: true, mode: 0o700 });
      assertNoSymlinkComponents(safeRestoreAnchor(item.target, options, item.destination), path.dirname(item.destination));
      const temp = item.destination + "." + crypto.randomUUID() + ".restore-tmp";
      const stagedItem = { ...item, temp };
      // Register the temporary path before opening it so even a partial write
      // or fsync failure is covered by the cleanup path.
      staged.push(stagedItem);
      let fd;
      try {
        fd = fs.openSync(temp, "wx", 0o600);
        fs.writeFileSync(fd, item.bytes);
        fs.fsyncSync(fd);
      } finally {
        if (fd !== undefined) fs.closeSync(fd);
      }
    }

    // Persist a recovery journal before the first destination mutation. It
    // records the expected output hashes and original bytes for the only kind
    // of existing state file this restore is allowed to replace.
    const journalPath = restoreJournalPath(options);
    fs.mkdirSync(path.dirname(journalPath), { recursive: true, mode: 0o700 });
    atomicWriteJson(journalPath, {
      format: "sonicvhibez-restore-transaction",
      version: 1,
      createdAt: new Date().toISOString(),
      entries: staged.map(item => ({
        target: item.target,
        action: item.action,
        newSha256: sha256(item.bytes),
        tempName: path.basename(item.temp),
        ...(item.action === "REPLACE_STATE" ? {
          originalSha256: sha256(item.originalBytes),
          originalBase64: item.originalBytes.toString("base64")
        } : {})
      }))
    });

    // Commit only after every replacement file is staged, flushed and journaled.
    for (const item of staged) {
      // Recheck the destination immediately before mutation to detect ordinary
      // concurrent replacement. This path-based check cannot eliminate every
      // hostile ancestor TOCTOU race; run restores in a controlled state dir.
      assertNoSymlinkComponents(safeRestoreAnchor(item.target, options, item.destination), path.dirname(item.destination));
      if (item.action === "RESTORE_MISSING" && fs.existsSync(item.destination)) {
        throw new Error("Restore destination appeared during commit; refusing to overwrite: " + path.basename(item.destination));
      }
      if (item.action === "REPLACE_STATE") {
        const current = fs.lstatSync(item.destination);
        if (current.isSymbolicLink() || !current.isFile() || sha256(fs.readFileSync(item.destination)) !== sha256(item.originalBytes)) {
          throw new Error("Restore destination changed during commit; refusing to overwrite: " + path.basename(item.destination));
        }
      }
      fs.renameSync(item.temp, item.destination);
      item.committed = true;
      committed.push(item);
      results.push({ target: item.target, action: item.action, sha256: sha256(item.bytes) });
    }
  } catch (error) {
    let recoveryError = null;
    try {
      recoverInterruptedRestore(options);
    } catch (caught) {
      recoveryError = caught;
    }
    if (recoveryError) {
      // Keep the durable journal and any remaining staged files so the next
      // confirmed restore invocation can retry recovery safely.
      throw new Error("Restore failed and recovery journal was retained for operator recovery: " + recoveryError.message, { cause: error });
    }
    for (const item of staged) {
      try { fs.unlinkSync(item.temp); } catch (cleanupError) {
        if (cleanupError?.code !== "ENOENT") {
          throw new Error("Restore rolled back but temporary-file cleanup failed: " + cleanupError.message, { cause: error });
        }
      }
    }
    throw new Error("Restore failed; all committed destination changes were rolled back: " + error.message, { cause: error });
  }

  const journalPath = restoreJournalPath(options);
  fs.unlinkSync(journalPath);
  return { status: "RESTORE_COMPLETED", backupCreatedAt: backup.createdAt, restored: results.filter(x => x.action !== "UNCHANGED").length, unchanged: results.filter(x => x.action === "UNCHANGED").length, entries: results };
}


const RESTORE_OPERATION_LOCK_NAME = ".restore-operation.lock";

/**
 * Serialize restore/recovery across processes sharing the state directory.
 * A pre-existing lock is intentionally fail-closed: operators must establish
 * whether its owner is still active before removing it. Never steal a lock
 * based only on age because a slow restore may still be committing files.
 */
export async function restoreState(options = {}) {
  const rootDir = options.rootDir ?? root;
  const stateDir = options.stateDir ?? process.env.DASHBOARD_STATE_DIR ?? "state";
  const stateRoot = path.resolve(rootDir, stateDir);
  assertNoSymlinkComponents(path.dirname(stateRoot), stateRoot);
  fs.mkdirSync(stateRoot, { recursive: true, mode: 0o700 });
  assertNoSymlinkComponents(path.dirname(stateRoot), stateRoot);
  const stateStat = fs.lstatSync(stateRoot);
  if (stateStat.isSymbolicLink() || !stateStat.isDirectory()) {
    throw new Error("Restore state directory must be a real directory, not a symlink or special file");
  }

  const lockPath = path.join(stateRoot, RESTORE_OPERATION_LOCK_NAME);
  const token = crypto.randomUUID();
  let fd;
  try {
    fd = fs.openSync(lockPath, "wx", 0o600);
    fs.writeFileSync(fd, JSON.stringify({
      format: "sonicvhibez-restore-operation-lock",
      version: 1,
      token,
      pid: process.pid,
      createdAt: new Date().toISOString()
    }));
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
  } catch (error) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
    if (error?.code === "EEXIST") {
      throw new Error("Another backup or restore operation holds the shared state-operation lock; inspect the lock owner and recover or remove a confirmed stale lock before retrying");
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
    return await restoreStateUnlocked({ ...options, rootDir, stateDir });
  } finally {
    // Remove only the exact lock this invocation created; never delete a
    // replaced lock or an operator's recovery artifact.
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
        throw new Error("Restore finished but its operation lock could not be safely cleared; inspect the lock before retrying", { cause: error });
      }
    }
  }
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
