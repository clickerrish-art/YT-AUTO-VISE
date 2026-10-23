import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const script = path.join(repoRoot, "scripts", "validate-asset-register.mjs");

function run(registerPath) {
  return spawnSync(process.execPath, [script, registerPath], { encoding: "utf8" });
}

test("blocks missing asset register", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-assets-"));
  try {
    const result = run(path.join(tmp, "missing.json"));
    assert.equal(result.status, 2);
    assert.match(result.stderr, /asset register not found/i);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("blocks example register with placeholders and unreviewed rights", () => {
  const result = run(path.join(repoRoot, "content", "asset-register.example.json"));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /humanApproved must be true/i);
  assert.match(result.stderr, /rightsEvidenceReviewed must be true/i);
  assert.match(result.stderr, /actual saved evidence/i);
});

test("passes complete asset register only when the saved evidence file exists", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-assets-"));
  try {
    fs.writeFileSync(path.join(tmp, "license.txt"), "Sample test license evidence for unit testing only.");
    const registerPath = path.join(tmp, "register.json");
    const register = {
      schemaVersion: 1,
      channel: "SonicVhibez",
      assets: [{
        id: "TEST-01",
        filename: "sample.mp4",
        sourceUrl: "https://media.example.org/sample",
        licenseTerms: "Test terms for automated validation only",
        dateChecked: "2026-10-23",
        requiredAttribution: ["Test attribution"],
        thirdPartyRestrictionsChecked: true,
        evidencePath: "license.txt",
        rightsEvidenceReviewed: true,
        humanApproved: true
      }]
    };
    fs.writeFileSync(registerPath, JSON.stringify(register));
    const result = run(registerPath);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /PASS: 1 asset record/i);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("blocks an approved-looking register when evidence is missing", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-assets-"));
  try {
    const registerPath = path.join(tmp, "register.json");
    const register = {
      assets: [{
        id: "TEST-02",
        filename: "sample.mp4",
        sourceUrl: "https://media.example.org/sample",
        licenseTerms: "Terms reviewed in test",
        dateChecked: "2026-10-23",
        requiredAttribution: ["Sample credit"],
        thirdPartyRestrictionsChecked: true,
        evidencePath: "missing-license.txt",
        rightsEvidenceReviewed: true,
        humanApproved: true
      }]
    };
    fs.writeFileSync(registerPath, JSON.stringify(register));
    const result = run(registerPath);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /does not point to an existing saved evidence file/i);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
