import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "brand-nature-frontiers-video.mjs");
const brandDir = path.join(root, "brand");
const logo = path.join(brandDir, "nature-frontiers-logo-transparent.png");

test("Nature Frontiers branding supports clear corners and records the exact position", t => {
  const temp = fs.mkdtempSync(path.join(root, ".tmp-brand-test-"));
  const hadBrandDir = fs.existsSync(brandDir);
  const hadLogo = fs.existsSync(logo);
  if (!hadLogo) {
    fs.mkdirSync(brandDir, { recursive: true });
    fs.writeFileSync(logo, "test-only transparent logo fixture");
  }
  t.after(() => {
    fs.rmSync(temp, { recursive: true, force: true });
    if (!hadLogo) {
      fs.rmSync(logo, { force: true });
      if (!hadBrandDir) {
        try { fs.rmdirSync(brandDir); } catch {}
      }
    }
  });

  const input = path.join(temp, "input.mp4");
  const fakeFfmpeg = path.join(temp, "fake-ffmpeg.cjs");
  fs.writeFileSync(input, "test input video");
  fs.writeFileSync(fakeFfmpeg, `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.writeFileSync(process.env.FAKE_FFMPEG_CAPTURE, JSON.stringify(args));
fs.writeFileSync(args.at(-1), "test output video");
`);
  fs.chmodSync(fakeFfmpeg, 0o755);

  const run = (name, position) => {
    const output = path.join(temp, name + ".mp4");
    const capture = path.join(temp, name + ".args.json");
    const env = { ...process.env, FFMPEG_PATH: fakeFfmpeg, FAKE_FFMPEG_CAPTURE: capture };
    if (position) env.NATURE_FRONTIERS_LOGO_POSITION = position;
    else delete env.NATURE_FRONTIERS_LOGO_POSITION;
    const result = spawnSync(process.execPath, [script, input, output], {
      cwd: root, env, encoding: "utf8"
    });
    return { output, capture, result };
  };

  const topRight = run("top-right", "top-right");
  assert.equal(topRight.result.status, 0, topRight.result.stderr);
  const topManifest = JSON.parse(fs.readFileSync(topRight.output + ".brand-review.json", "utf8"));
  assert.equal(topManifest.overlay.position, "top-right");
  const topArgs = JSON.parse(fs.readFileSync(topRight.capture, "utf8"));
  const topGraph = topArgs[topArgs.indexOf("-filter_complex") + 1];
  assert.match(topGraph, /overlay=x=W-w-24:y=24/);

  const defaultPosition = run("default-position");
  assert.equal(defaultPosition.result.status, 0, defaultPosition.result.stderr);
  const defaultManifest = JSON.parse(fs.readFileSync(defaultPosition.output + ".brand-review.json", "utf8"));
  assert.equal(defaultManifest.overlay.position, "bottom-right");
  const defaultArgs = JSON.parse(fs.readFileSync(defaultPosition.capture, "utf8"));
  const defaultGraph = defaultArgs[defaultArgs.indexOf("-filter_complex") + 1];
  assert.match(defaultGraph, /overlay=x=W-w-24:y=H-h-24/);

  const invalid = run("invalid", "center");
  assert.equal(invalid.result.status, 2);
  assert.match(invalid.result.stderr, /NATURE_FRONTIERS_LOGO_POSITION must be one of/);
  assert.equal(fs.existsSync(invalid.output), false);
});
