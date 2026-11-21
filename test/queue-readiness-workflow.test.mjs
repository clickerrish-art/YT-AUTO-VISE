import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const workflow = fs.readFileSync(
  path.join(process.cwd(), ".github", "workflows", "queue-readiness.yml"),
  "utf8"
);

test("queue readiness confines replenishment to its existing isolated proposal trust root", () => {
  const marker = "      - name: Replenish draft topics in the isolated proposal only";
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, "the isolated queue proposal step must exist");
  const end = workflow.indexOf("\n      - name:", start + marker.length);
  const step = workflow.slice(start, end < 0 ? workflow.length : end);

  assert.match(step, /QUEUE_TRUST_ROOT:\s*\$\{\{\s*runner\.temp\s*\}\}\/queue-proposal/);
  assert.match(step, /QUEUE_PATH:\s*queue\.json/);
  assert.match(step, /run:\s*node scripts\/replenish-queue\.mjs/);

  const proposalCreation = workflow.indexOf('mkdir -p "$RUNNER_TEMP/queue-proposal"');
  const proposalCopy = workflow.indexOf('cp content/queue.json "$RUNNER_TEMP/queue-proposal/queue.json"');
  assert.ok(proposalCreation >= 0 && proposalCreation < start,
    "the explicit queue trust root must exist before the worker runs");
  assert.ok(proposalCopy >= 0 && proposalCopy < start,
    "replenishment must operate on a copy, not the repository queue");
  assert.match(workflow, /permissions:\s*\n\s+contents:\s*read/);
});

test("queue readiness CI covers the implementation branch and all queue/dispatch regression suites", () => {
  assert.match(workflow, /push:\\s*\\n\\s+branches:\s*\\[main, codex\\/marketing-machine-audit-fixes\\]/);
  for (const requiredPath of [
    '      - "test/**"',
    '      - "tests/**"',
    '      - "scripts/dashboard-server.mjs"',
    '      - "scripts/worker-runner.mjs"',
    '      - "scripts/queue-identity-policy.mjs"'
  ]) {
    assert.ok(workflow.includes(requiredPath), "CI path filter must include " + requiredPath);
  }
  assert.match(workflow, /run repository regression tests|Run repository regression tests/i);
  assert.match(workflow, /run: node --test/);
});
