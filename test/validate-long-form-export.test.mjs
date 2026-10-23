import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const validator = path.join(repoRoot, "scripts", "validate-long-form-export.mjs");

function fixture(t, probeOutput) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-export-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  const ffprobe = path.join(bin, process.platform === "win32" ? "ffprobe.cmd" : "ffprobe");
  if (process.platform === "win32") {
    fs.writeFileSync(ffprobe, "@echo off\necho " + JSON.stringify(probeOutput) + "\n");
  } else {
    fs.writeFileSync(ffprobe, "#!/bin/sh\nprintf '%s' '" + JSON.stringify(probeOutput).replace(/'/g, "'\\''") + "'\n");
    fs.chmodSync(ffprobe, 0o755);
  }
  const media = path.join(dir, "sample.mp4");
  fs.writeFileSync(media, "test file");
  return { dir, media, env: { ...process.env, PATH: bin + path.delimiter + process.env.PATH } };
}

function run(media, env) {
  return spawnSync(process.execPath, [validator, media], { encoding: "utf8", env });
}

const validProbe = {
  format: { duration: "400.0" },
  streams: [
    { codec_type: "video", codec_name: "h264", width: 1920, height: 1080 },
    { codec_type: "audio", codec_name: "aac" }
  ]
};

test("blocks a missing or empty export", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-export-"));
  try {
    const result = run(path.join(dir, "missing.mp4"), process.env);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /missing or empty/i);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("passes a valid 6–10 minute 1080p H.264/AAC export", t => {
  const f = fixture(t, validProbe);
  const result = run(f.media, f.env);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /technical checks passed/i);
  assert.match(result.stdout, /Human review is still required/i);
});

test("blocks wrong resolution and short duration", t => {
  const bad = structuredClone(validProbe);
  bad.format.duration = "120";
  bad.streams[0].width = 1280;
  const f = fixture(t, bad);
  const result = run(f.media, f.env);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /duration must be 6–10 minutes/i);
  assert.match(result.stderr, /1920×1080/i);
});

test("blocks exports without an audio stream", t => {
  const bad = { format: { duration: "400" }, streams: [{ codec_type: "video", codec_name: "h264", width: 1920, height: 1080 }] };
  const f = fixture(t, bad);
  const result = run(f.media, f.env);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /audio stream is missing/i);
});
