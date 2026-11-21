import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const workflow = fs.readFileSync(
  path.join(process.cwd(), ".github", "workflows", "validate-automation.yml"),
  "utf8"
);

test("automation CI requires the committed lockfile and fails closed on audit errors", () => {
  assert.match(workflow, /test -f package-lock\.json/);
  assert.match(workflow, /npm ci --ignore-scripts/);
  assert.doesNotMatch(workflow, /npm install --ignore-scripts/);
  assert.match(workflow, /npm audit --json/);
  assert.match(workflow, /if \(total > 0\)/);
  assert.match(workflow, /if \(auditStatus !== 0\)/);
  assert.match(workflow, /zero known vulnerabilities/);
});

test("automation CI runs on the implementation branch and sees test-directory changes", () => {
  assert.match(workflow, /branches: \[main, codex\/marketing-machine-audit-fixes\]/);
  assert.ok(workflow.includes('      - "test/**"'));
  assert.ok(workflow.includes('      - "tests/**"'));
});
