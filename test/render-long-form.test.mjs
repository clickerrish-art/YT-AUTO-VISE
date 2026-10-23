import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const script = path.join(repoRoot, "scripts", "render-long-form.mjs");

function run(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8"
  });
}

test("blocks when the long-form manifest is missing", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-long-"));
  try {
    const result = run([path.join(tmp, "missing.json"), path.join(tmp, "out.mp4")]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /manifest not found/i);
    assert.equal(fs.existsSync(path.join(tmp, "out.mp4")), false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("blocks an incomplete or unapproved manifest before invoking FFmpeg", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-long-"));
  try {
    const media = path.join(tmp, "media");
    const content = path.join(tmp, "content");
    fs.mkdirSync(media);
    fs.mkdirSync(content);
    for (const name of ["footage.mp4", "voice.wav"]) {
      fs.writeFileSync(path.join(media, name), "test-placeholder");
    }
    fs.writeFileSync(path.join(content, "captions.srt"),
      "1\n00:00:00,000 --> 00:00:01,000\nTest caption\n");
    const manifest = {
      channel: "SonicVhibez",
      targetAspectRatio: "16:9",
      footagePath: "../media/footage.mp4",
      narrationPath: "../media/voice.wav",
      captionsPath: "captions.srt",
      footageLicenseEvidence: "placeholder",
      narrationLicenseEvidence: "unknown",
      rightsConfirmed: false,
      complianceReviewed: false
    };
    const manifestPath = path.join(content, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const outputPath = path.join(tmp, "out.mp4");
    const result = run([manifestPath, outputPath]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /rightsConfirmed must be true/i);
    assert.match(result.stderr, /complianceReviewed must be true/i);
    assert.match(result.stderr, /real license\/permission record/i);
    assert.equal(fs.existsSync(outputPath), false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("blocks incorrect aspect ratio and wrong channel", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-long-"));
  try {
    const media = path.join(tmp, "media");
    const content = path.join(tmp, "content");
    fs.mkdirSync(media);
    fs.mkdirSync(content);
    fs.writeFileSync(path.join(media, "footage.mp4"), "placeholder");
    fs.writeFileSync(path.join(media, "voice.wav"), "placeholder");
    fs.writeFileSync(path.join(content, "captions.srt"),
      "1\n00:00:00,000 --> 00:00:01,000\nTest caption\n");
    const manifest = {
      channel: "WrongChannel",
      targetAspectRatio: "9:16",
      footagePath: "../media/footage.mp4",
      narrationPath: "../media/voice.wav",
      captionsPath: "captions.srt",
      footageLicenseEvidence: "verified source record 12345",
      narrationLicenseEvidence: "original recording record 12345",
      rightsConfirmed: true,
      complianceReviewed: true
    };
    const manifestPath = path.join(content, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const result = run([manifestPath, path.join(tmp, "out.mp4")]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /channel must be exactly SonicVhibez/i);
    assert.match(result.stderr, /targetAspectRatio must be "16:9"/i);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("long-form workflow embedded Python validation remains syntactically valid", () => {
  const workflowPath = path.join(repoRoot, ".github", "workflows", "generate-long-form-narration.yml");
  const workflow = fs.readFileSync(workflowPath, "utf8");
  const match = workflow.match(/python - <<'PY'\n([\s\S]*?)\n          PY/);
  assert.ok(match, "expected the workflow to contain its Python duration-validation block");
  const pythonSource = match[1].split("\n").map(line => line.startsWith("          ") ? line.slice(10) : line).join("\n") + "\n";
  const syntax = spawnSync("python", ["-c", "import ast,sys; ast.parse(sys.stdin.read())"], {
    input: pythonSource,
    encoding: "utf8"
  });
  assert.equal(syntax.status, 0, `embedded workflow Python must parse: ${syntax.stderr}`);
});
