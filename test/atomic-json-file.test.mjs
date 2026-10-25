import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { atomicWriteJson, atomicCreateJson } from "../scripts/atomic-json-file.mjs";

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atomic-json-state-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return { dir, file: path.join(dir, "state.json") };
}

test("atomic JSON state writer commits complete JSON with restrictive permissions", (t) => {
  const { dir, file } = fixture(t);
  atomicWriteJson(file, { version: 2, jobs: [{ id: "job-1" }] });
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { version: 2, jobs: [{ id: "job-1" }] });
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.deepEqual(fs.readdirSync(dir), ["state.json"]);
});

test("failed temporary write preserves prior committed state and cleans up temporary file", (t) => {
  const { dir, file } = fixture(t);
  fs.writeFileSync(file, JSON.stringify({ version: 1 }) + "\n", { mode: 0o600 });
  const originalWrite = fs.writeFileSync;
  t.after(() => { fs.writeFileSync = originalWrite; });
  fs.writeFileSync = function (target, ...args) {
    if (typeof target === "number") {
      const error = new Error("simulated disk write failure");
      error.code = "EIO";
      throw error;
    }
    return originalWrite.call(this, target, ...args);
  };

  assert.throws(() => atomicWriteJson(file, { version: 2 }), /simulated disk write failure/);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { version: 1 });
  assert.deepEqual(fs.readdirSync(dir), ["state.json"]);
});

test("failed atomic rename preserves prior state and removes the staged file", (t) => {
  const { dir, file } = fixture(t);
  fs.writeFileSync(file, JSON.stringify({ committed: true }) + "\n", { mode: 0o600 });
  const originalRename = fs.renameSync;
  t.after(() => { fs.renameSync = originalRename; });
  fs.renameSync = function () {
    const error = new Error("simulated rename failure");
    error.code = "EIO";
    throw error;
  };

  assert.throws(() => atomicWriteJson(file, { committed: false }), /simulated rename failure/);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { committed: true });
  assert.deepEqual(fs.readdirSync(dir), ["state.json"]);
});

test("symlink destinations are rejected without following or replacing their target", (t) => {
  const { dir, file } = fixture(t);
  const target = path.join(dir, "target.json");
  fs.writeFileSync(target, "preserve");
  fs.symlinkSync(target, file);
  assert.throws(() => atomicWriteJson(file, { unsafe: true }), /regular file/);
  assert.equal(fs.readFileSync(target, "utf8"), "preserve");
  assert.equal(fs.lstatSync(file).isSymbolicLink(), true);
});


test("atomic JSON creation initializes a new file once with restrictive permissions", (t) => {
  const { dir, file } = fixture(t);
  atomicCreateJson(file, { version: 1, jobs: [] });
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { version: 1, jobs: [] });
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.deepEqual(fs.readdirSync(dir), ["state.json"]);
});

test("atomic JSON creation never overwrites an existing state file", (t) => {
  const { dir, file } = fixture(t);
  fs.writeFileSync(file, JSON.stringify({ committed: true }) + "\\n", { mode: 0o600 });
  assert.throws(() => atomicCreateJson(file, { committed: false }), error => error.code === "EEXIST");
  assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { committed: true });
  assert.deepEqual(fs.readdirSync(dir), ["state.json"]);
});

test("atomic JSON creation rejects a symlink destination without touching its target", (t) => {
  const { dir, file } = fixture(t);
  const target = path.join(dir, "target.json");
  fs.writeFileSync(target, "preserve");
  fs.symlinkSync(target, file);
  assert.throws(() => atomicCreateJson(file, { unsafe: true }), /regular file/);
  assert.equal(fs.readFileSync(target, "utf8"), "preserve");
  assert.equal(fs.lstatSync(file).isSymbolicLink(), true);
});

test("failed exclusive link removes the staged state file and leaves destination absent", (t) => {
  const { dir, file } = fixture(t);
  const originalLink = fs.linkSync;
  t.after(() => { fs.linkSync = originalLink; });
  fs.linkSync = function () {
    const error = new Error("simulated exclusive link failure");
    error.code = "EIO";
    throw error;
  };
  assert.throws(() => atomicCreateJson(file, { version: 1 }), /simulated exclusive link failure/);
  assert.equal(fs.existsSync(file), false);
  assert.deepEqual(fs.readdirSync(dir), []);
});
