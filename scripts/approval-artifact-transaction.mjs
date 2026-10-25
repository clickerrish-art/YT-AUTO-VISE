import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Commit an approval artifact only after its corresponding durable application
 * state has been saved. The final path is created exclusively with a hard link,
 * so an existing approval cannot be silently overwritten.
 */
export function commitApprovalArtifact({ destination, record, persistState }) {
  if (typeof destination !== "string" || !destination.trim()) throw new Error("approval artifact destination is required");
  if (typeof persistState !== "function") throw new Error("approval state persistence callback is required");
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("approval artifact record must be an object");

  const target = path.resolve(destination);
  const parent = path.dirname(target);
  fs.mkdirSync(parent, { recursive: true, mode: 0o700 });

  let cursor = path.parse(target).root;
  const parts = path.relative(cursor, target).split(path.sep).filter(Boolean);
  for (let index = 0; index < parts.length; index++) {
    cursor = path.join(cursor, parts[index]);
    let stat;
    try { stat = fs.lstatSync(cursor); }
    catch (error) {
      if (error?.code === "ENOENT" && index === parts.length - 1) continue;
      if (error?.code === "ENOENT") throw new Error("approval artifact path has a missing component");
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error("approval artifact path contains a symbolic link");
    if (index < parts.length - 1 && !stat.isDirectory()) throw new Error("approval artifact parent path must contain only directories");
    if (index === parts.length - 1) throw new Error("approval artifact already exists; refusing to overwrite an existing approval");
  }

  const temporary = path.join(parent, "." + path.basename(target) + "." + crypto.randomUUID() + ".tmp");
  let fd;
  let published = false;
  try {
    fd = fs.openSync(temporary, "wx", 0o600);
    fs.writeFileSync(fd, JSON.stringify(record, null, 2) + "\n", "utf8");
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;

    // If this throws, no final approval file is made available to the uploader.
    persistState();

    // link() is exclusive: EEXIST fails instead of replacing a concurrent file.
    fs.linkSync(temporary, target);
    published = true;
    fs.unlinkSync(temporary);
    try {
      const dirFd = fs.openSync(parent, "r");
      try { fs.fsyncSync(dirFd); } finally { fs.closeSync(dirFd); }
    } catch (error) {
      // Some platforms do not support fsync on directory handles. The file and
      // parent directory entry have still been created; do not hide other errors.
      if (!["EINVAL", "ENOTSUP", "EISDIR", "EPERM"].includes(error?.code)) throw error;
    }
    return target;
  } catch (error) {
    if (fd !== undefined) { try { fs.closeSync(fd); } catch {} }
    // A failure after link() must not leave a final-looking approval artifact
    // behind while the caller receives an error. We created this path exclusively,
    // so removing it cannot delete a pre-existing approval.
    if (published) {
      try { fs.unlinkSync(target); } catch (rollbackError) {
        if (rollbackError?.code !== "ENOENT") throw new Error("approval publication failed and final artifact rollback also failed: " + rollbackError.message, { cause: error });
      }
    }
    try { fs.unlinkSync(temporary); } catch (cleanupError) { if (cleanupError?.code !== "ENOENT") throw cleanupError; }
    throw error;
  }
}
