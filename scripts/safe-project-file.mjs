import fs from "node:fs";
import path from "node:path";

/**
 * Read-only guard for readiness checks. A candidate must be a regular file
 * lexically contained in the supplied trust root, with no symlink in any path
 * component. The normal caller supplies the repository root; an explicit
 * external-queue override supplies that file's parent as the trust root. This
 * prevents symlinks or path-traversal targets being treated as valid prerequisites.
 * Path-based checks cannot eliminate every TOCTOU race; sensitive consumers must
 * revalidate immediately before use and must not treat this guard as a file lock.
 */
export function isSafeRegularFileWithinRoot(rootDirectory, candidatePath) {
  if (typeof rootDirectory !== "string" || !rootDirectory.trim()
      || typeof candidatePath !== "string" || !candidatePath.trim()) return false;

  const root = path.resolve(rootDirectory);
  const candidate = path.resolve(root, candidatePath);
  const relative = path.relative(root, candidate);
  if (!relative || relative === "." || relative.startsWith(".." + path.sep)
      || relative === ".." || path.isAbsolute(relative)) return false;

  const filesystemRoot = path.parse(candidate).root;
  const components = candidate.slice(filesystemRoot.length).split(path.sep).filter(Boolean);
  let cursor = filesystemRoot;
  for (let index = 0; index < components.length; index++) {
    cursor = path.join(cursor, components[index]);
    let stat;
    try {
      stat = fs.lstatSync(cursor);
    } catch {
      return false;
    }
    if (stat.isSymbolicLink()) return false;
    if (index < components.length - 1 && !stat.isDirectory()) return false;
    if (index === components.length - 1 && !stat.isFile()) return false;
  }
  return components.length > 0;
}
