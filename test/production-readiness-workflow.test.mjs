import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expected = new Map([
  [".github/workflows/production-readiness.yml", { checkout: 7, setupNode: 6, uploadArtifact: 6 }],
  [".github/workflows/queue-readiness.yml", { checkout: 7, setupNode: 7, uploadArtifact: 6 }],
  [".github/workflows/branch-reconciliation-inventory.yml", { checkout: 7, uploadArtifact: 6 }],
  [".github/workflows/isolated-baseline-comparison.yml", { checkout: 7, setupNode: 6, uploadArtifact: 6 }]
]);

test("critical CI workflows use Node 24-compatible maintained action runtimes", () => {
  for (const [relativePath, versions] of expected) {
    const workflow = fs.readFileSync(path.join(root, relativePath), "utf8");
    if (versions.checkout) assert.match(workflow, new RegExp("uses:\\s*actions/checkout@v" + versions.checkout + "\\b"), relativePath);
    if (versions.setupNode) assert.match(workflow, new RegExp("uses:\\s*actions/setup-node@v" + versions.setupNode + "\\b"), relativePath);
    if (versions.uploadArtifact) assert.match(workflow, new RegExp("uses:\\s*actions/upload-artifact@v" + versions.uploadArtifact + "\\b"), relativePath);
    assert.match(workflow, /node-version:\s*["']?24\b/);
    assert.doesNotMatch(
      workflow,
      /uses:\s*actions\/(?:checkout|setup-node|upload-artifact)@v(?:1|2|3|4|5)\b/,
      relativePath + " must not regress to a Node 20 action runtime"
    );
  }
});
