import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const validator = path.resolve("scripts/validate-short-export.mjs");
const good = {
  format: { duration: "55.2" },
  streams: [
    { codec_type: "video", codec_name: "h264", width: 1080, height: 1920, avg_frame_rate: "30/1" },
    { codec_type: "audio", codec_name: "aac" }
  ]
};

function fixture(t, probe = good, decodeFails = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-short-export-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  const ffprobe = path.join(bin, "ffprobe");
  const ffmpeg = path.join(bin, "ffmpeg");
  fs.writeFileSync(ffprobe, "#!/bin/sh\nprintf '%s' '" + JSON.stringify(probe).replace(/'/g, "'\\''") + "'\n");
  fs.writeFileSync(ffmpeg, "#!/bin/sh\ncase \" $* \" in *volumedetect*) echo 'mean_volume: -18.0 dB' >&2; exit 0;; esac\nexit " + (decodeFails ? "1" : "0") + "\n");
  fs.chmodSync(ffprobe, 0o755);
  fs.chmodSync(ffmpeg, 0o755);
  const media = path.join(dir, "sample.mp4");
  fs.writeFileSync(media, Buffer.alloc(150_000, 1));
  return { media, env: { ...process.env, PATH: bin + path.delimiter + process.env.PATH } };
}

test("validates a complete vertical Short with audible audio and full decode", t => {
  const f = fixture(t);
  const result = spawnSync(process.execPath, [validator, f.media], { encoding: "utf8", env: f.env });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /technical validation/i);
  assert.match(result.stdout, /1080×1920/);
});

test("blocks a wrong-duration or landscape export", t => {
  const probe = structuredClone(good);
  probe.format.duration = "61.0";
  probe.streams[0].width = 1920;
  probe.streams[0].height = 1080;
  const f = fixture(t, probe);
  const result = spawnSync(process.execPath, [validator, f.media], { encoding: "utf8", env: f.env });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /50–60 seconds/);
  assert.match(result.stderr, /1080×1920 vertical/);
});

test("blocks a Short export with unsupported or missing frame rate", t => {
  const probe = structuredClone(good);
  probe.streams[0].avg_frame_rate = "0/0";
  const f = fixture(t, probe);
  const result = spawnSync(process.execPath, [validator, f.media], { encoding: "utf8", env: f.env });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /frame rate must be between 23.9 and 60 fps/i);
});

test("blocks an export whose full-file decode fails", t => {
  const f = fixture(t, good, true);
  const result = spawnSync(process.execPath, [validator, f.media], { encoding: "utf8", env: f.env });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /full-file FFmpeg decode failed/);
});

test("renderer wires technical validation before its success message", () => {
  const source = fs.readFileSync(path.resolve("scripts/render-short.mjs"), "utf8");
  assert.ok(source.indexOf("validate-short-export.mjs") >= 0);
  assert.ok(source.indexOf("rendered Short failed technical export validation") > source.indexOf("validate-short-export.mjs"));
  assert.ok(source.indexOf("RENDERED AND VALIDATED:") > source.indexOf("rendered Short failed technical export validation"));
  assert.match(source, /validation\.status !== 0/);
});

test("rejects a symlinked Short export before invoking media tools", t => {
  const f = fixture(t);
  const link = path.join(path.dirname(f.media), "linked.mp4");
  fs.symlinkSync(f.media, link);
  const result = spawnSync(process.execPath, [validator, link], { encoding: "utf8", env: f.env });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /contains a symbolic link/i);
});

test("dashboard job validation runs the strict format-specific export gate before marking validation passed", () => {
  const dashboard = fs.readFileSync(path.resolve("scripts/dashboard-server.mjs"), "utf8");
  const start = dashboard.indexOf('url.pathname === "/api/jobs/validate"');
  const end = dashboard.indexOf('url.pathname === "/api/jobs/rights/verify"', start);
  assert.ok(start >= 0 && end > start, "validation route must be present");
  const route = dashboard.slice(start, end);
  assert.match(route, /scripts\/validate-short-export\.mjs/);
  assert.match(route, /scripts\/validate-long-form-export\.mjs/);
  assert.match(route, /exportValidation\.status !== 0/);
  assert.ok(route.indexOf("exportValidation.status !== 0") < route.indexOf("validationResults = { passed: true"));
});
