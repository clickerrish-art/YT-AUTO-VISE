import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const script = path.resolve("scripts/render-thumbnail.mjs");

test("thumbnail renderer rejects a symlinked source video", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-thumbnail-input-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const real = path.join(root, "real.mp4");
  const link = path.join(root, "linked.mp4");
  fs.writeFileSync(real, "fixture");
  fs.symlinkSync(real, link);
  const result = spawnSync(process.execPath, [script, link, "A safe title", path.join(root, "thumb.jpg")], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /contains a symbolic link/i);
});

test("thumbnail renderer rejects a symlinked output without overwriting its target", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-thumbnail-output-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const video = path.join(root, "video.mp4");
  const protectedFile = path.join(root, "protected.txt");
  const output = path.join(root, "thumbnail.jpg");
  fs.writeFileSync(video, "fixture");
  fs.writeFileSync(protectedFile, "do not overwrite");
  fs.symlinkSync(protectedFile, output);
  const result = spawnSync(process.execPath, [script, video, "A safe title", output], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /contains a symbolic link/i);
  assert.equal(fs.readFileSync(protectedFile, "utf8"), "do not overwrite");
});

test("thumbnail title sidecar is created exclusively rather than following a pre-existing path", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-thumbnail-sidecar-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const video = path.join(root, "video.mp4");
  const protectedFile = path.join(root, "protected.txt");
  const output = path.join(root, "thumbnail.jpg");
  fs.writeFileSync(video, "fixture");
  fs.writeFileSync(protectedFile, "do not overwrite");
  fs.symlinkSync(protectedFile, path.join(root, ".thumbnail-title.txt"));
  const result = spawnSync(process.execPath, [script, video, "A safe title", output], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /temporary file already exists/i);
  assert.equal(fs.readFileSync(protectedFile, "utf8"), "do not overwrite");
});
