import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Atomically replace a JSON state file, flushing file contents before rename
 * and the containing directory afterward. A failed pre-rename write preserves
 * the previously committed state and removes its temporary file.
 */
export function atomicWriteJson(destination, value, { mode = 0o600 } = {}) {
  if (typeof destination !== "string" || !destination.trim()) {
    throw new Error("JSON state destination is required");
  }
  const target = path.resolve(destination);
  const parent = path.dirname(target);
  const parentStat = fs.lstatSync(parent);
  if (parentStat.isSymbolicLink() || !parentStat.isDirectory()) {
    throw new Error("JSON state parent must be a real directory");
  }
  try {
    const targetStat = fs.lstatSync(target);
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
      throw new Error("JSON state destination must be a regular file");
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const temporary = path.join(parent, "." + path.basename(target) + "." + crypto.randomUUID() + ".tmp");
  let fd;
  let renamed = false;
  try {
    fd = fs.openSync(temporary, "wx", mode);
    fs.writeFileSync(fd, JSON.stringify(value, null, 2) + "\n", "utf8");
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(temporary, target);
    renamed = true;

    let directoryFd;
    try {
      directoryFd = fs.openSync(parent, "r");
      fs.fsyncSync(directoryFd);
    } catch (error) {
      if (!["EINVAL", "ENOTSUP", "EISDIR", "EPERM"].includes(error?.code)) throw error;
    } finally {
      if (directoryFd !== undefined) fs.closeSync(directoryFd);
    }
  } catch (error) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
    if (!renamed) {
      try { fs.unlinkSync(temporary); } catch (cleanupError) {
        if (cleanupError?.code !== "ENOENT") {
          throw new Error("JSON state write failed and temporary-file cleanup also failed: " + cleanupError.message, { cause: error });
        }
      }
    }
    throw error;
  }
}


/**
 * Create a JSON file exactly once. Unlike atomicWriteJson, this never replaces
 * an existing destination; it is intended for first-start state initialization
 * where concurrent server starts must not overwrite state created by a peer.
 */
export function atomicCreateJson(destination, value, { mode = 0o600 } = {}) {
  if (typeof destination !== "string" || !destination.trim()) {
    throw new Error("JSON state destination is required");
  }
  const target = path.resolve(destination);
  const parent = path.dirname(target);
  const parentStat = fs.lstatSync(parent);
  if (parentStat.isSymbolicLink() || !parentStat.isDirectory()) {
    throw new Error("JSON state parent must be a real directory");
  }
  try {
    const targetStat = fs.lstatSync(target);
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
      throw new Error("JSON state destination must be a regular file");
    }
    const error = new Error("JSON state destination already exists");
    error.code = "EEXIST";
    throw error;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const temporary = path.join(parent, "." + path.basename(target) + "." + crypto.randomUUID() + ".tmp");
  let fd;
  let linked = false;
  try {
    fd = fs.openSync(temporary, "wx", mode);
    fs.writeFileSync(fd, JSON.stringify(value, null, 2) + "\n", "utf8");
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    // A hard link creates the final name exclusively; it cannot overwrite a
    // peer's state file if two processes initialize concurrently.
    fs.linkSync(temporary, target);
    linked = true;
    fs.unlinkSync(temporary);
    let directoryFd;
    try {
      directoryFd = fs.openSync(parent, "r");
      fs.fsyncSync(directoryFd);
    } catch (error) {
      if (!["EINVAL", "ENOTSUP", "EISDIR", "EPERM"].includes(error?.code)) throw error;
    } finally {
      if (directoryFd !== undefined) fs.closeSync(directoryFd);
    }
  } catch (error) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
    try { fs.unlinkSync(temporary); } catch (cleanupError) {
      if (cleanupError?.code !== "ENOENT") {
        throw new Error("JSON state creation failed and temporary-file cleanup also failed: " + cleanupError.message, { cause: error });
      }
    }
    // If directory durability failed after the exclusive link, preserve the
    // committed target and report the uncertain durability outcome.
    if (linked && !fs.existsSync(target)) {
      throw new Error("JSON state creation failed after linking and the committed file is missing", { cause: error });
    }
    throw error;
  }
}
