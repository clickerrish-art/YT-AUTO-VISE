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
