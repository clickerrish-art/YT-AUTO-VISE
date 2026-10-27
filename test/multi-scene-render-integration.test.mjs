import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createDeterministicEditPlan } from "../scripts/content-quality-gates.mjs";
import { buildMultiSceneVideoGraph } from "../scripts/multi-scene-render.mjs";

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 60_000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout || command + " failed");
  return result.stdout;
}

function averageRgb(frame) {
  assert.equal(frame.length, 320 * 180 * 3, "decoded frame must have the expected RGB dimensions");
  const sum = [0, 0, 0];
  for (let i = 0; i < frame.length; i += 3) {
    sum[0] += frame[i];
    sum[1] += frame[i + 1];
    sum[2] += frame[i + 2];
  }
  return sum.map(value => value / (frame.length / 3));
}

test("FFmpeg assembles distinct approved scene inputs into a fully decodable multi-scene export", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "multi-scene-render-integration-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const first = path.join(root, "scene-red.mp4");
  const second = path.join(root, "scene-blue.mp4");
  const narration = path.join(root, "narration.wav");
  const captions = path.join(root, "captions.srt");
  const output = path.join(root, "assembled.mp4");

  run("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=c=red:s=320x180:r=10:d=1.2", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-t", "1.2", first]);
  run("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=320x180:r=10:d=1.2", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-t", "1.2", second]);
  run("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=2.4", "-c:a", "pcm_s16le", narration]);
  fs.writeFileSync(captions, "1\n00:00:00,000 --> 00:00:02,400\nIntegration test caption\n", "utf8");

  const sceneTimeline = [
    { assetId: "scene-red", path: first, startSeconds: 0, endSeconds: 1.2 },
    { assetId: "scene-blue", path: second, startSeconds: 0, endSeconds: 1.2 }
  ];
  const editPlan = createDeterministicEditPlan({
    seed: 3,
    scenes: [
      { assetId: "scene-red", sourceSha256: "a".repeat(64), rightsStatus: "VERIFIED", editorialPurpose: "Establish first scene", startSeconds: 0, endSeconds: 1.2 },
      { assetId: "scene-blue", sourceSha256: "b".repeat(64), rightsStatus: "VERIFIED", editorialPurpose: "Transition to second scene", startSeconds: 0, endSeconds: 1.2 }
    ],
    profile: { framing: ["fit"], transitions: ["cut"], transitionDurationSeconds: 0.2 }
  });
  editPlan.scenes[0].transitionToNext = "cut";
  const graph = buildMultiSceneVideoGraph({
    editPlan,
    sceneTimeline,
    captionsFilter: captions,
    width: 320,
    height: 180,
    narrationDurationSeconds: 2.4,
    transitionDurationSeconds: 0.2,
    fps: 10
  });

  run("ffmpeg", [
    "-v", "error", "-i", first, "-i", second, "-i", narration,
    "-filter_complex", graph.filterComplex, "-map", graph.outputLabel, "-map", "2:a:0",
    "-shortest", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
    "-c:a", "aac", "-pix_fmt", "yuv420p", "-movflags", "+faststart", output
  ]);

  const probe = JSON.parse(run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height",
    "-of", "json", output
  ]));
  assert.equal(probe.streams.find(stream => stream.codec_type === "video")?.width, 320);
  assert.equal(probe.streams.find(stream => stream.codec_type === "video")?.height, 180);
  assert.ok(probe.streams.some(stream => stream.codec_type === "audio"), "render must retain narration audio");
  assert.ok(Math.abs(Number(probe.format.duration) - 2.4) < 0.25, "render duration should match both scenes and narration");
  run("ffmpeg", ["-v", "error", "-i", output, "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"]);

  const firstFrame = spawnSync("ffmpeg", ["-v", "error", "-ss", "0.4", "-i", output, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], { timeout: 30_000 });
  assert.ifError(firstFrame.error);
  assert.equal(firstFrame.status, 0, firstFrame.stderr?.toString() || "failed to decode first scene");
  const lastFrame = spawnSync("ffmpeg", ["-v", "error", "-ss", "1.8", "-i", output, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], { timeout: 30_000 });
  assert.ifError(lastFrame.error);
  assert.equal(lastFrame.status, 0, lastFrame.stderr?.toString() || "failed to decode second scene");

  const firstRgb = averageRgb(firstFrame.stdout);
  const lastRgb = averageRgb(lastFrame.stdout);
  assert.ok(firstRgb[0] > firstRgb[2] * 1.5, "first scene must visibly retain the red source");
  assert.ok(lastRgb[2] > lastRgb[0] * 1.5, "second scene must visibly retain the blue source");
});
