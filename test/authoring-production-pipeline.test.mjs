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
  const words = Array.from({ length: 137 }, (_, i) => "word" + i);
  const sections = [0, 1, 2].map((index) => ({
    heading: "Section " + index, purpose: "Advance the narrative " + index,
    narration: words.slice(Math.floor(index * words.length / 3), Math.floor((index + 1) * words.length / 3)).join(" "),
    visualDirection: "Reviewed source scene " + index, pacing: "Measured", soundDesign: "Natural ambience"
  }));
  const script = {
    narration: sections.map(section => section.narration).join("\n\n"),
    sections,
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
  return (command, args) => {
    if (command === "ffprobe") return { status: 0, stdout: "55.000\n", stderr: "" };
    if (args[0]?.endsWith("check-captions.mjs") || args[0]?.endsWith("validate-caption-sync.mjs")) {
      return { status: 0, stdout: "PASS: captions validated", stderr: "" };
    }
    const outputDir = args[args.indexOf("--output-dir") + 1];
    const payload = JSON.parse(fs.readFileSync(args[args.indexOf("--script-json") + 1], "utf8"));
    const transcript = payload.result.narration.replace(/\s+/gu, " ").trim() + "\n";
    const captions = "1\n00:00:00,000 --> 00:00:55,000\nReviewed narration caption text.\n";
    const audio = Buffer.from("fake audio bytes");
    fs.writeFileSync(path.join(outputDir, "narration.mp3"), audio);
    fs.writeFileSync(path.join(outputDir, "narration.txt"), transcript);
    fs.writeFileSync(path.join(outputDir, "captions.srt"), captions);
    const report = {
      format: "short", voice: "test", rate: "-5%", wordCount: transcript.trim().split(/\s+/u).length,
      scriptSha256: expectedScriptSha256, durationSeconds: 55, wordBoundaryCount: 137,
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
    const second = runAuthoringNarrationStage({ job: f.job, root: f.root, spawnSyncImpl: (command, args) => { if (command === "ffprobe") return { status: 0, stdout: "55.000\n", stderr: "" }; if (args[0]?.endsWith("check-captions.mjs") || args[0]?.endsWith("validate-caption-sync.mjs")) return { status: 0, stdout: "PASS: captions validated", stderr: "" }; throw new Error("duplicate TTS call"); } });
    assert.equal(calls, 4, "generator, independent ffprobe measurement and two caption validators run exactly once");
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
    assert.throws(() => runAuthoringNarrationStage({ job: f.job, root: f.root, spawnSyncImpl: fakeRunnerFactory({ expectedScriptSha256: f.scriptSha256, corrupt: true }) }), /audio checksum/);
  } finally { fs.rmSync(f.root, { recursive: true, force: true }); }

  const g = fixture();
  try {
    assert.throws(() => runAuthoringNarrationStage({ job: g.job, root: g.root, spawnSyncImpl: fakeRunnerFactory({ expectedScriptSha256: g.scriptSha256, invalidTiming: true }) }), /TTS word-boundary timings/);
  } finally { fs.rmSync(g.root, { recursive: true, force: true }); }
});

test("validator rejects a missing narration report", () => {
  assert.deepEqual(validateNarrationStageArtifacts({ report: null, scriptSha256: "a".repeat(64), format: "short", outputDir: "/missing" }), ["narration report must be a JSON object"]);
});
