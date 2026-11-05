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


const baselineWorkflow = fs.readFileSync(new URL(".github/workflows/isolated-baseline-comparison.yml", root), "utf8");

test("isolated baseline runs once per PR update and bounds free-runner dependency installation", () => {
  assert.match(baselineWorkflow, /^  workflow_dispatch:/m);
  assert.match(baselineWorkflow, /^  pull_request:/m);
  assert.doesNotMatch(baselineWorkflow, /^  push:/m,
    "the PR-scoped baseline must not queue a duplicate push run for the same candidate SHA");
  assert.match(baselineWorkflow, /timeout 600s sudo apt-get update/);
  assert.match(baselineWorkflow, /timeout 600s sudo apt-get install/);
  assert.match(baselineWorkflow, /timeout 600s npm ci --ignore-scripts/);
  assert.match(baselineWorkflow, /timeout 600s npm install --ignore-scripts/);
  assert.match(baselineWorkflow, /timeout 300s python -m pip install/);
});
