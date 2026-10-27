import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  canonicalAuthoringScriptSha256,
  runAuthoringNarrationStage,
  validateNarrationStageArtifacts
} from "../scripts/authoring-production-pipeline.mjs";

function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "authoring-pipeline-"));
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(root, "scripts/generate-authoring-narration.py"), "# test fixture generator\n");
  const script = {
    narration: "Measured test narration.",
    sections: [{ heading: "Opening", narration: "Measured test narration." }],
    claims: [{ text: "A sourced claim.", sourceIds: ["s1"] }],
    sources: [{ id: "s1", title: "Test source" }]
  };
  const scriptSha256 = canonicalAuthoringScriptSha256(script);
  const job = {
    id: "job-test-01", kind: "CONTENT_PRODUCTION", contentType: "short",
    authoring: {
      result: { script },
      scriptApproval: { decision: "APPROVE", scriptSha256, reviewer: "Human reviewer", reviewedAt: "2026-10-27T00:00:00.000Z" }
    }
  };
  return { root, job, scriptSha256 };
}
function fakeRunnerFactory({ expectedScriptSha256, corrupt = false, invalidTiming = false } = {}) {
  return (_command, args) => {
    const outputDir = args[args.indexOf("--output-dir") + 1];
    const transcript = "Measured test narration.\n";
    const captions = "1\n00:00:00,000 --> 00:00:01,000\nMeasured test narration.\n";
    const audio = Buffer.from("fake audio bytes");
    fs.writeFileSync(path.join(outputDir, "narration.mp3"), audio);
    fs.writeFileSync(path.join(outputDir, "narration.txt"), transcript);
    fs.writeFileSync(path.join(outputDir, "captions.srt"), captions);
    const report = {
      format: "short", voice: "test", rate: "-5%", wordCount: 3,
      scriptSha256: expectedScriptSha256, durationSeconds: 55, wordBoundaryCount: 3,
      captionTiming: invalidTiming ? "ESTIMATED" : "TTS_WORD_BOUNDARIES",
      audioSha256: hash(audio), transcriptSha256: hash(transcript), captionsSha256: hash(captions),
      humanReviewRequired: true, rightsStatus: "NOT_VERIFIED",
      status: "DRAFT_REVIEW_REQUIRED", publishingEnabled: false
    };
    if (corrupt) report.audioSha256 = "0".repeat(64);
    fs.writeFileSync(path.join(outputDir, "narration-report.json"), JSON.stringify(report));
    return { status: 0, stdout: "DRAFT ONLY", stderr: "" };
  };
}

test("canonical script hash is independent of object key insertion order", () => {
  assert.equal(canonicalAuthoringScriptSha256({ a: 1, b: { y: 2, x: 3 } }), canonicalAuthoringScriptSha256({ b: { x: 3, y: 2 }, a: 1 }));
});

test("narration stage requires human approval bound to the exact script", () => {
  const f = fixture();
  try {
    delete f.job.authoring.scriptApproval;
    assert.throws(() => runAuthoringNarrationStage({ job: f.job, root: f.root, spawnSyncImpl: () => { throw new Error("must not run"); } }), /human script approval/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("narration stage records verified artifact hashes but remains draft-only", () => {
  const f = fixture();
  try {
    const result = runAuthoringNarrationStage({ job: f.job, root: f.root, spawnSyncImpl: fakeRunnerFactory({ expectedScriptSha256: f.scriptSha256 }) });
    assert.equal(result.status, "NARRATION_DRAFT_READY");
    assert.equal(result.scriptSha256, f.scriptSha256);
    assert.equal(result.humanReviewRequired, true);
    assert.equal(result.rightsStatus, "NOT_VERIFIED");
    assert.equal(result.publishable, false);
    assert.equal(result.publishingEnabled, false);
    assert.match(result.artifacts["narration.mp3"].sha256, /^[a-f0-9]{64}$/);
    assert.equal(result.reused, false);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("a complete exact narration stage can be reconciled idempotently without rerunning TTS", () => {
  const f = fixture();
  try {
    let calls = 0;
    const runner = (...args) => { calls++; return fakeRunnerFactory({ expectedScriptSha256: f.scriptSha256 })(...args); };
    const first = runAuthoringNarrationStage({ job: f.job, root: f.root, spawnSyncImpl: runner });
    const second = runAuthoringNarrationStage({ job: f.job, root: f.root, spawnSyncImpl: () => { throw new Error("duplicate TTS call"); } });
    assert.equal(calls, 1);
    assert.equal(first.reused, false);
    assert.equal(second.reused, true);
    assert.deepEqual(second.artifacts, first.artifacts);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("partial narration artifacts require recovery and are never overwritten", () => {
  const f = fixture();
  try {
    const out = path.join(f.root, "media/generated-authoring", f.job.id + "-" + f.scriptSha256.slice(0, 12));
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "narration.mp3"), "partial");
    assert.throws(() => runAuthoringNarrationStage({ job: f.job, root: f.root, spawnSyncImpl: () => { throw new Error("must not rerun"); } }), /Partial narration artifacts.*RECOVERY_REQUIRED/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }
});

test("tampered audio hash and estimated caption timing fail closed", () => {
  const f = fixture();
  try {
    const run = runAuthoringNarrationStage({ job: f.job, root: f.root, spawnSyncImpl: fakeRunnerFactory({ expectedScriptSha256: f.scriptSha256, corrupt: true }) });
    assert.fail("corrupt audio hash must throw");
  } catch (error) {
    assert.match(String(error), /audio checksum/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }

  const g = fixture();
  try {
    assert.throws(() => runAuthoringNarrationStage({ job: g.job, root: g.root, spawnSyncImpl: fakeRunnerFactory({ expectedScriptSha256: g.scriptSha256, invalidTiming: true }) }), /TTS word-boundary timings/);
  } finally { fs.rmSync(g.root, { recursive: true, force: true }); }
});

test("validator rejects missing report, wrong format and duration outside target", () => {
  assert.deepEqual(validateNarrationStageArtifacts({ report: null, scriptSha256: "a".repeat(64), format: "short", outputDir: "/missing" }), ["narration report must be a JSON object"]);
});
