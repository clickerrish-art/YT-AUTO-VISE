import fs from "node:fs";
import path from "node:path";

/** Resolve a regular input file while rejecting symlinks in every path component. */
export function resolveRegularFileNoSymlinks(filePath, baseDirectory = process.cwd(), label = "Media input") {
  if (typeof filePath !== "string" || !filePath.trim()) throw new Error(label + " path is required");
  const absolute = path.resolve(baseDirectory, filePath);
  const root = path.parse(absolute).root;
  const components = absolute.slice(root.length).split(path.sep).filter(Boolean);
  let cursor = root;
  for (let index = 0; index < components.length; index++) {
    cursor = path.join(cursor, components[index]);
    let stat;
    try { stat = fs.lstatSync(cursor); }
    catch { throw new Error(label + " is missing or cannot be inspected"); }
    if (stat.isSymbolicLink()) throw new Error(label + " path contains a symbolic link");
    if (index < components.length - 1 && !stat.isDirectory()) throw new Error(label + " parent path must contain only directories");
    if (index === components.length - 1 && !stat.isFile()) throw new Error(label + " must be a regular file");
  }
  return absolute;
}

/** Prepare a render destination without following symlinked ancestors or output files. */
export function prepareSafeRenderOutput(outputPath) {
  if (typeof outputPath !== "string" || !outputPath.trim()) throw new Error("Render output path is required");
  const absolute = path.resolve(outputPath);
  const root = path.parse(absolute).root;
  const parent = path.dirname(absolute);
  const components = path.relative(root, parent).split(path.sep).filter(Boolean);
  let cursor = root;
  for (const component of components) {
    cursor = path.join(cursor, component);
    let stat;
    try { stat = fs.lstatSync(cursor); }
    catch (error) {
      if (error?.code !== "ENOENT") throw error;
      try { fs.mkdirSync(cursor, { mode: 0o700 }); }
      catch (mkdirError) { if (mkdirError?.code !== "EEXIST") throw mkdirError; }
      stat = fs.lstatSync(cursor);
    }
    if (stat.isSymbolicLink()) throw new Error("Render output parent path contains a symbolic link");
    if (!stat.isDirectory()) throw new Error("Render output parent path must contain only directories");
  }
  try {
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error("Render output path is a symbolic link");
    if (!stat.isFile()) throw new Error("Render output path must be a regular file when it already exists");
    throw new Error("Render output already exists; refusing to overwrite retained artifact");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return absolute;
}
