import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isSafeRegularFileWithinRoot } from "../scripts/safe-project-file.mjs";

test("readiness file guard accepts regular project files only", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "safe-project-file-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "content"));
  fs.writeFileSync(path.join(root, "content", "manifest.json"), "{}");
  fs.mkdirSync(path.join(root, "content", "folder"));
  assert.equal(isSafeRegularFileWithinRoot(root, "content/manifest.json"), true);
  assert.equal(isSafeRegularFileWithinRoot(root, "content/folder"), false);
  assert.equal(isSafeRegularFileWithinRoot(root, "content/missing.json"), false);
});

test("readiness file guard rejects traversal outside the project root", (t) => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "safe-project-parent-"));
  const root = path.join(parent, "project");
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(parent, "outside.json"), "{}");
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  assert.equal(isSafeRegularFileWithinRoot(root, "../outside.json"), false);
  assert.equal(isSafeRegularFileWithinRoot(root, path.join(parent, "outside.json")), false);
});

test("readiness file guard rejects symlinked files and symlinked ancestors", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "safe-project-symlink-"));
  const outside = path.join(root, "outside");
  const content = path.join(root, "content");
  fs.mkdirSync(outside);
  fs.mkdirSync(content);
  fs.writeFileSync(path.join(outside, "secret.json"), "{}");
  fs.writeFileSync(path.join(content, "real.json"), "{}");
  try {
    fs.symlinkSync(path.join(content, "real.json"), path.join(content, "linked.json"));
    fs.symlinkSync(outside, path.join(root, "linked-dir"), "dir");
  } catch (error) {
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    if (["EPERM", "EACCES", "ENOTSUP"].includes(error.code)) return t.skip("symlinks are not supported in this environment");
    throw error;
  }
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(isSafeRegularFileWithinRoot(root, "content/linked.json"), false);
  assert.equal(isSafeRegularFileWithinRoot(root, "linked-dir/secret.json"), false);
});
