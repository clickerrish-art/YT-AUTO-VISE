import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/production-readiness.yml"), "utf8");

test("production readiness workflow uses Node 24-compatible maintained actions", () => {
  assert.match(workflow, /uses:\s*actions\/checkout@v7\b/);
  assert.match(workflow, /uses:\s*actions\/setup-node@v6\b/);
  assert.match(workflow, /uses:\s*actions\/upload-artifact@v6\b/);
  assert.match(workflow, /node-version:\s*24\b/);
  assert.doesNotMatch(
    workflow,
    /uses:\s*actions\/(?:checkout|setup-node|upload-artifact)@v(?:1|2|3|4|5)\b/,
    "the production-readiness job must not regress to a Node 20 action runtime"
  );
});
