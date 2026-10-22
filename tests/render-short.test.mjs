import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

test("renderer refuses to run without an explicitly reviewed manifest", () => {
  const result = spawnSync(process.execPath, ["scripts/render-short.mjs"], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /render manifest not found/i);
});

test("example render manifest defaults to a blocked state", () => {
  const manifest = JSON.parse(fs.readFileSync("content/render-manifest.example.json", "utf8"));
  assert.equal(manifest.channel, "SonicVhibez");
  assert.equal(manifest.rightsConfirmed, false);
  assert.equal(manifest.complianceReviewed, false);
  assert.equal(manifest.targetSeconds, 55);
});


test("renderer uses manifest-resolved absolute caption path in FFmpeg filter", () => {
  const source = fs.readFileSync("scripts/render-short.mjs", "utf8");
  assert.match(source, /const captions = path\.resolve\(path\.dirname\(manifestPath\), m\.captionsPath\)/);
  assert.match(source, /const escapedCaptions = captions/);
  assert.match(source, /subtitles='\" \+ escapedCaptions \+ \"'/);
});
