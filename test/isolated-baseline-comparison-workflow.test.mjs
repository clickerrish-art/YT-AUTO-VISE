import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/isolated-baseline-comparison.yml", "utf8");

test("isolated baseline checks out the live main branch, not the PR merge-base SHA", () => {
  assert.match(workflow, /- name: Check out live main branch HEAD[\s\S]*?ref: main/);
  assert.doesNotMatch(workflow, /github\.event\.pull_request\.base\.sha/);
});

test("isolated baseline pins and records the exact main and candidate checkout SHAs", () => {
  assert.match(workflow, /ref: main/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.match(workflow, /main_sha="\$\(git -C baseline-main rev-parse HEAD\)"/);
  assert.match(workflow, /candidate_sha="\$\(git -C baseline-candidate rev-parse HEAD\)"/);
  assert.match(workflow, /Live main HEAD SHA:/);
  assert.match(workflow, /Candidate SHA:/);
});
