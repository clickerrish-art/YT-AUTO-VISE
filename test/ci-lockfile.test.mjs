import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL("package.json", root), "utf8"));
const lock = JSON.parse(fs.readFileSync(new URL("package-lock.json", root), "utf8"));
const validationWorkflow = fs.readFileSync(new URL(".github/workflows/validate.yml", root), "utf8");

test("metadata validation installs the checked-in dependency lockfile reproducibly", () => {
  assert.match(validationWorkflow, /- run: npm ci --ignore-scripts\b/);
  assert.doesNotMatch(validationWorkflow, /- run: npm install --ignore-scripts\b/);
});

test("package manifest and lockfile root metadata agree", () => {
  assert.equal(lock.name, manifest.name);
  assert.equal(lock.version, manifest.version);
  assert.deepEqual(lock.packages?.[""]?.dependencies ?? {}, manifest.dependencies ?? {});
  assert.deepEqual(lock.packages?.[""]?.engines ?? {}, manifest.engines ?? {});
});
