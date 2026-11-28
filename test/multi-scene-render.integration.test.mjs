import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createDeterministicEditPlan } from "../scripts/content-quality-gates.mjs";
import { buildMultiSceneVideoGraph } from "../scripts/multi-scene-render.mjs";

test("FFmpeg renders and fully decodes a real two-scene timeline with captions", t => {
  const version = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (version.error?.code === "ENOENT") { t.skip("FFmpeg is installed explicitly in the automation and isolated-baseline workflows; other workflows may not include it."); return; }
  assert.equal(version.status, 0, version.stderr || "FFmpeg version check failed");
  const probeVersion = spawnSync("ffprobe", ["-version"], { encoding: "utf8" });
  if (probeVersion.error?.code === "ENOENT") { t.skip("ffprobe is unavailable in this workflow."); return; }
  assert.equal(probeVersion.status, 0, probeVersion.stderr || "ffprobe version check failed");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "multi-scene-render-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const first = path.join(dir, "first.mp4"), second = path.join(dir, "second.mp4");
  const captions = path.join(dir, "captions.srt"), output = path.join(dir, "timeline.mp4");
  for (const [file, colour] of [[first, "red"], [second, "blue"]]) {
    const created = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "color=c=" + colour + ":s=320x180:r=30:d=1", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", file], { encoding: "utf8", timeout: 30000 });
    assert.equal(created.status, 0, created.stderr || "could not create synthetic renderer test clip");
  }
  fs.writeFileSync(captions, "1\n00:00:00,000 --> 00:00:01,900\nTest caption\n", "utf8");
  const scenes = [
    { assetId: "first", sourceSha256: "a".repeat(64), rightsStatus: "VERIFIED", editorialPurpose: "Establish opening", startSeconds: 0, endSeconds: 1 },
    { assetId: "second", sourceSha256: "b".repeat(64), rightsStatus: "VERIFIED", editorialPurpose: "Provide the next beat", startSeconds: 0, endSeconds: 1 }
  ];
  const editPlan = createDeterministicEditPlan({ seed: 7, scenes, profile: { framing: ["fit"], transitions: ["cut"] } });
  const graph = buildMultiSceneVideoGraph({
    editPlan,
    sceneTimeline: [{ assetId: "first", path: first, startSeconds: 0, endSeconds: 1 }, { assetId: "second", path: second, startSeconds: 0, endSeconds: 1 }],
    captionsFilter: captions, width: 320, height: 180, narrationDurationSeconds: 2, fps: 30
  });
  const rendered = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y", "-i", first, "-i", second,
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
    "-filter_complex", graph.filterComplex, "-map", graph.outputLabel, "-map", "2:a:0",
    "-t", "2", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest", output
  ], { encoding: "utf8", timeout: 60000 });
  assert.equal(rendered.status, 0, rendered.stderr || "FFmpeg could not render the validated scene graph");
  const probed = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", output], { encoding: "utf8" });
  assert.equal(probed.status, 0, probed.stderr || "ffprobe could not read the rendered timeline");
  assert.ok(Math.abs(Number(probed.stdout.trim()) - 2) <= 0.1, "rendered timeline should be two seconds");
  const decoded = spawnSync("ffmpeg", ["-v", "error", "-i", output, "-f", "null", "-"], { encoding: "utf8", timeout: 30000 });
  assert.equal(decoded.status, 0, decoded.stderr || "rendered timeline failed full decode");
});
