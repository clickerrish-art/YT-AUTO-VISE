import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const renderer = path.join(repoRoot, "scripts", "render-long-form.mjs");

function runRenderer(manifestPath, outputPath) {
  return spawnSync(process.execPath, [renderer, manifestPath, outputPath], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

test("long-form renderer fails closed when manifest is missing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-long-"));
  try {
    const missing = path.join(dir, "missing.json");
    const result = runRenderer(missing, path.join(dir, "out.mp4"));
    assert.equal(result.status, 2);
    assert.match(result.stderr, /manifest not found/i);
    assert.equal(fs.existsSync(path.join(dir, "out.mp4")), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("long-form renderer fails closed on malformed manifest JSON", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-long-"));
  try {
    const manifest = path.join(dir, "manifest.json");
    fs.writeFileSync(manifest, "{not valid json");
    const result = runRenderer(manifest, path.join(dir, "out.mp4"));
    assert.equal(result.status, 2);
    assert.match(result.stderr, /not valid json/i);
    assert.equal(fs.existsSync(path.join(dir, "out.mp4")), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("long-form renderer blocks unreviewed and non-16:9 manifests before rendering", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-long-"));
  try {
    const manifest = path.join(dir, "manifest.json");
    fs.writeFileSync(manifest, JSON.stringify({
      channel: "SonicVhibez",
      targetAspectRatio: "16:9",
      footagePath: "missing-footage.mp4",
      narrationPath: "missing-narration.wav",
      captionsPath: "missing-captions.srt",
      footageLicenseEvidence: "REPLACE_WITH_VERIFIED_LICENSE_RECORD",
      narrationLicenseEvidence: "REPLACE_WITH_VERIFIED_RECORD",
      rightsConfirmed: false,
      complianceReviewed: false
    }));
    const result = runRenderer(manifest, path.join(dir, "out.mp4"));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /rightsConfirmed must be true/i);
    assert.match(result.stderr, /complianceReviewed must be true/i);
    assert.match(result.stderr, /real license\/permission record/i);
    assert.equal(fs.existsSync(path.join(dir, "out.mp4")), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("long-form renderer rejects a vertical aspect-ratio manifest", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-long-"));
  try {
    const manifest = path.join(dir, "manifest.json");
    fs.writeFileSync(manifest, JSON.stringify({
      channel: "SonicVhibez",
      targetAspectRatio: "9:16",
      footagePath: "missing-footage.mp4",
      narrationPath: "missing-narration.wav",
      captionsPath: "missing-captions.srt",
      footageLicenseEvidence: "Verified license record 12345",
      narrationLicenseEvidence: "Original narration recording 12345",
      rightsConfirmed: true,
      complianceReviewed: true
    }));
    const result = runRenderer(manifest, path.join(dir, "out.mp4"));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /targetAspectRatio must be "16:9"/i);
    assert.equal(fs.existsSync(path.join(dir, "out.mp4")), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
