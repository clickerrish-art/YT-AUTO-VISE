import fs from "node:fs";
import path from "node:path";

/**
 * Create a directory tree without following symlinked or non-directory
 * ancestors. Call before any recursive writes beneath a sensitive path.
 */
export function ensureSafeDirectoryPath(directory, label = "Directory") {
  if (typeof directory !== "string" || !directory.trim()) {
    throw new Error(label + " path is required");
  }
  const target = path.resolve(directory);
  const rootPath = path.parse(target).root;
  let current = rootPath;
  for (const component of path.relative(rootPath, target).split(path.sep).filter(Boolean)) {
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
    if (stat.isSymbolicLink()) {
      throw new Error(label + " path contains a symbolic link; refusing unsafe directory creation");
    }
    if (!stat.isDirectory()) {
      throw new Error(label + " path must contain only directories");
    }
  }
  return target;
}
