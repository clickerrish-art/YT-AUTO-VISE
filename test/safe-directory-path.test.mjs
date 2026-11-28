import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ensureSafeDirectoryPath } from "../scripts/safe-directory-path.mjs";

test("safe directory creation builds missing components with restrictive permissions", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "safe-directory-create-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const target = path.join(root, "run-logs", "upload-approvals");
  assert.equal(ensureSafeDirectoryPath(target, "Approval artifact"), target);
  assert.equal(fs.lstatSync(target).isDirectory(), true);
  if (process.platform !== "win32") assert.equal(fs.statSync(target).mode & 0o077, 0);
});

test("safe directory creation rejects a symlinked ancestor before creating descendants", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "safe-directory-symlink-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const outside = path.join(root, "outside");
  fs.mkdirSync(outside);
  const link = path.join(root, "run-logs");
  fs.symlinkSync(outside, link, "dir");
  const target = path.join(link, "upload-approvals");
  assert.throws(() => ensureSafeDirectoryPath(target, "Approval artifact"), /symbolic link/);
  assert.equal(fs.existsSync(path.join(outside, "upload-approvals")), false);
});

test("safe directory creation rejects a regular file in the ancestor chain", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "safe-directory-file-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, "not-a-directory");
  fs.writeFileSync(file, "preserve");
  assert.throws(() => ensureSafeDirectoryPath(path.join(file, "child"), "Approval artifact"), /only directories/);
  assert.equal(fs.readFileSync(file, "utf8"), "preserve");
});

test("dashboard approval publication uses the safe path guard rather than recursive mkdir", async () => {
  const server = fs.readFileSync(new URL("../scripts/dashboard-server.mjs", import.meta.url), "utf8");
  assert.match(server, /ensureSafeDirectoryPath\(approvalDir, "Approval artifact"\)/);
  assert.doesNotMatch(server, /fs\.mkdirSync\(approvalDir,\s*\{\s*recursive:\s*true/);
});
