import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

test("renderer refuses to run when the working project has no explicitly reviewed manifest", () => {
  const emptyProject = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-render-short-"));
  try {
    const rendererPath = path.resolve("scripts/render-short.mjs");
    const result = spawnSync(process.execPath, [rendererPath], {
      cwd: emptyProject,
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /render manifest not found/i);
  } finally {
    fs.rmSync(emptyProject, { recursive: true, force: true });
  }
});

test("example render manifest defaults to a blocked state", () => {
  const manifest = JSON.parse(fs.readFileSync("content/render-manifest.example.json", "utf8"));
  assert.equal(manifest.channel, "SonicVhibez");
  assert.equal(manifest.rightsConfirmed, false);
  assert.equal(manifest.complianceReviewed, false);
  assert.equal(manifest.targetSeconds, 55);
});


test("renderer accepts any integer target from 50 through 60 seconds", () => {
  const source = fs.readFileSync("scripts/render-short.mjs", "utf8");
  assert.match(source, /Number\.isInteger\(m\.targetSeconds\).*m\.targetSeconds < 50.*m\.targetSeconds > 60/);
  assert.match(source, /targetSeconds must be an integer from 50 to 60/);
});

test("renderer uses manifest-resolved absolute caption path in FFmpeg filter", () => {
  const source = fs.readFileSync("scripts/render-short.mjs", "utf8");
  assert.ok(source.includes("resolvedInputs.captionsPath"));
  assert.ok(source.includes("resolveRegularFileNoSymlinks"));
  assert.match(source, /const escapedCaptions = captions/);
  assert.match(source, /subtitles='\" \+ escapedCaptions \+ \"'/);
});

test("renderer rejects placeholder license evidence", () => {
  const source = fs.readFileSync("scripts/render-short.mjs", "utf8");
  assert.match(source, /must contain a real license\/permission record reference/);
  assert.match(source, /replace_with|placeholder|todo|unknown|tbd/i);
  const manifest = JSON.parse(fs.readFileSync("content/render-manifest.example.json", "utf8"));
  assert.match(manifest.footageLicenseEvidence, /REPLACE_WITH/);
  assert.equal(manifest.rightsConfirmed, false);
});


test("Short and long-form renderers require original creator-captured wildlife provenance", () => {
  for (const path of ["scripts/render-short.mjs", "scripts/render-long-form.mjs"]) {
    const source = fs.readFileSync(path, "utf8");
    assert.match(source, /footageOrigin !== "creator_captured_original"/);
    assert.match(source, /creatorCapturedOriginal !== true/);
    assert.match(source, /originalCreatorCapturedMediaRequired !== true/);
    assert.match(source, /containsAIWildlifeVisuals !== false/);
    assert.match(source, /footageSourceManifest/);
    assert.match(source, /captureEvidencePath/);
  }
  const short = JSON.parse(fs.readFileSync("content/render-manifest.example.json", "utf8"));
  const long = JSON.parse(fs.readFileSync("content/long-form-render-manifest.example.json", "utf8"));
  for (const manifest of [short, long]) {
    assert.equal(manifest.footageOrigin, "creator_captured_original");
    assert.equal(manifest.originalCreatorCapturedMediaRequired, true);
    assert.equal(manifest.aiGeneratedWildlifeVisualsAllowed, false);
    assert.equal(manifest.containsAIWildlifeVisuals, false);
    assert.equal(manifest.rightsConfirmed, false);
  }
});
