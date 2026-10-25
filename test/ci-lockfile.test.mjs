import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL("package.json", root), "utf8"));
const lock = JSON.parse(fs.readFileSync(new URL("package-lock.json", root), "utf8"));
const validationWorkflow = fs.readFileSync(new URL(".github/workflows/validate.yml", root), "utf8");
const privateUploadWorkflow = fs.readFileSync(new URL(".github/workflows/upload-private.yml", root), "utf8");

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


test("private upload workflow installs from the lockfile and uses the built-in Actions token for ledger restore", () => {
  assert.match(privateUploadWorkflow, /run: npm ci --ignore-scripts\b/);
  assert.doesNotMatch(privateUploadWorkflow, /run: npm install\s/);
  assert.match(privateUploadWorkflow, /github-token: \$\{\{ github\.token \}\}/);
  assert.doesNotMatch(privateUploadWorkflow, /github-token: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
});
