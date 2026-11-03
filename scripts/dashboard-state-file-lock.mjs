import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Acquire the same directory lock used by dashboard-server.mjs for writes to
 * dashboard-state.json. Backups and restores must not race live API mutations.
 * Existing or malformed locks fail closed; only the dashboard's normal stale
 * PID reaper or an operator may resolve them.
 */
export function acquireDashboardStateFileLock(stateFile) {
  if (typeof stateFile !== "string" || !stateFile.trim()) {
    throw new Error("Dashboard state file path is required for the shared state lock");
  }
  const lockDirectory = path.resolve(stateFile) + ".lock";
  const ownerPath = path.join(lockDirectory, "owner.json");
  const ownerId = crypto.randomUUID();
  const owner = { pid: process.pid, ownerId, acquiredAt: new Date().toISOString() };

  try {
    fs.mkdirSync(lockDirectory, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") {
      const busy = new Error("Dashboard state is busy in another process; backup/restore must wait until the active state operation finishes");
      busy.code = "DASHBOARD_STATE_BUSY";
      throw busy;
    }
    throw error;
  }

  let fd;
  try {
    fd = fs.openSync(ownerPath, "wx", 0o600);
    fs.writeFileSync(fd, JSON.stringify(owner));
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
  } catch (error) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
    try { fs.rmdirSync(lockDirectory); } catch {}
    throw error;
  }

  let released = false;
  return () => {
    if (released) return;
    const stat = fs.lstatSync(lockDirectory);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error("Dashboard state lock path changed before release; operator inspection is required");
    }
    const current = JSON.parse(fs.readFileSync(ownerPath, "utf8"));
    if (current.pid !== owner.pid || current.ownerId !== ownerId) {
      throw new Error("Dashboard state lock ownership changed before release; refusing to remove another process's lock");
    }
    fs.rmSync(lockDirectory, { recursive: true });
    released = true;
  };
}
