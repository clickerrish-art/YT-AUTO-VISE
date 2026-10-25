import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { prepareSafeRenderOutput, resolveRegularFileNoSymlinks } from "../scripts/safe-media-path.mjs";

test("accepts a regular render input and creates a missing output parent safely", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-safe-media-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const input = path.join(root, "voice.wav");
  fs.writeFileSync(input, "audio");
  assert.equal(resolveRegularFileNoSymlinks("voice.wav", root, "Narration"), input);
  const output = prepareSafeRenderOutput(path.join(root, "new", "nested", "output.mp4"));
  assert.equal(output, path.join(root, "new", "nested", "output.mp4"));
  assert.equal(fs.statSync(path.dirname(output)).isDirectory(), true);
});

test("rejects symlinked manifest/source inputs even when the target is inside the same tree", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-safe-media-input-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const target = path.join(root, "real.wav");
  const link = path.join(root, "linked.wav");
  fs.writeFileSync(target, "audio");
  fs.symlinkSync(target, link);
  assert.throws(() => resolveRegularFileNoSymlinks(link, root, "Narration"), /symbolic link/i);
});

test("rejects a symlinked output target without touching its destination", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-safe-media-output-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const protectedFile = path.join(root, "protected.txt");
  const outputLink = path.join(root, "output.mp4");
  fs.writeFileSync(protectedFile, "do not overwrite");
  fs.symlinkSync(protectedFile, outputLink);
  assert.throws(() => prepareSafeRenderOutput(outputLink), /symbolic link/i);
  assert.equal(fs.readFileSync(protectedFile, "utf8"), "do not overwrite");
});

test("rejects a symlinked output parent before creating a child file", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-safe-media-parent-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const protectedDir = path.join(root, "protected");
  const linkedDir = path.join(root, "linked");
  fs.mkdirSync(protectedDir);
  fs.symlinkSync(protectedDir, linkedDir, "dir");
  assert.throws(() => prepareSafeRenderOutput(path.join(linkedDir, "out.mp4")), /symbolic link/i);
  assert.equal(fs.existsSync(path.join(protectedDir, "out.mp4")), false);
});
