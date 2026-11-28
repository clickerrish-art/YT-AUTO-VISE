import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

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
  assert.match(readiness, /const verificationAttempts = verification\.uploadAttemptReconciliation/);
  assert.match(readiness, /verificationAttempts\?\.status === attempts\.status/);
});

test("metadata validation readiness receives the same protected YouTube secret environment", () => {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/validate.yml"), "utf8");
  const readinessStep = workflow.match(/- name: Report production blockers without publishing([\s\S]*?)(?=\n      - name:|$)/)?.[1] ?? "";
  for (const name of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) {
    assert.ok(readinessStep.includes(name + ": ${{ secrets." + name + " }}"), name + " must be passed only through the protected Actions secret context");
  }
  assert.doesNotMatch(readinessStep, /echo.*(?:YOUTUBE_CLIENT_ID|YOUTUBE_CLIENT_SECRET|YOUTUBE_REFRESH_TOKEN|SONICVHIBEZ_CHANNEL_ID)/);
});



test("readiness report gives actionable queue, narration and upload-attempt owner resolutions", () => {
  const result = spawnSync(process.execPath, [path.join(root, "scripts/production-readiness.mjs"), "--json"], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 8 * 1024 * 1024
  });
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(result.stdout);
  const queueBlockers = report.blockers.filter(item => item.message.startsWith("QUEUE IDENTITY RECONCILIATION REQUIRED"));
  assert.equal(queueBlockers.length, 0, "the explicit owner-approved canonical mapping must be accepted");
  assert.equal(report.notes.some(note => /Queue identity reconciliation: 2 owner-approved long-form mappings verified/.test(note)), true,
    "the current exact-hash mapping must be reported as verified");
  const narration = report.blockers.find(item => item.message.includes("narration rights are not cleared"));
  assert.ok(narration);
  assert.match(narration.resolution, /Speechma Andrew/);
  assert.match(narration.resolution, /manual, zero-cost browser audition/);
  assert.match(narration.resolution, /do not automate the free site/);
  const attempts = report.blockers.find(item => item.message.includes("local, workflow and owner-attested upload-attempt reconciliation"));
  assert.ok(attempts);
  assert.equal(attempts.evidence.path, "content/youtube-history-reconciliation.json");
  assert.match(attempts.evidence.observed, /Read-only remote inventory verified at/);
  assert.match(attempts.evidence.observed, /valid through 2026-11-18/);
  assert.match(attempts.resolution, /manual, local or third-party YouTube upload attempts/);
});
