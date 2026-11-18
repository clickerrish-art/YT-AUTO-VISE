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
    if (versions.setupNode) {
      assert.match(workflow, new RegExp("uses:\\s*actions/setup-node@v" + versions.setupNode + "\\b"), relativePath);
      assert.match(workflow, /node-version:\s*["']?24\b/, relativePath + " must explicitly select Node 24");
    }
    if (versions.uploadArtifact) assert.match(workflow, new RegExp("uses:\\s*actions/upload-artifact@v" + versions.uploadArtifact + "\\b"), relativePath);
    assert.doesNotMatch(
      workflow,
      /uses:\s*actions\/(?:checkout|setup-node|upload-artifact)@v(?:1|2|3|4|5)\b/,
      relativePath + " must not regress to a Node 20 action runtime"
    );
  }
});

test("YouTube verification mirrors the owner-attested upload-attempt ledger", () => {
  const verification = JSON.parse(fs.readFileSync(path.join(root, "content/youtube-channel-verification-status.json"), "utf8"));
  const reconciliation = JSON.parse(fs.readFileSync(path.join(root, "content/youtube-history-reconciliation.json"), "utf8"));
  const ledger = reconciliation.uploadAttemptReconciliation;
  const mirrored = verification.uploadAttemptReconciliation;
  assert.equal(mirrored.status, ledger.status);
  assert.equal(mirrored.inspectedAt, ledger.inspectedAt);
  assert.equal(mirrored.evidence.automatedLedgerValidation.runId, ledger.evidence.automatedLedgerValidation.runId);
  assert.equal(mirrored.ownerAttestation.status, ledger.ownerAttestation.status);
  const readiness = fs.readFileSync(path.join(root, "scripts/production-readiness.mjs"), "utf8");
  assert.match(readiness, /const verificationAttempts = verification\\.uploadAttemptReconciliation/);
  assert.match(readiness, /verificationAttempts\\?\\.status === attempts\\.status/);
});
