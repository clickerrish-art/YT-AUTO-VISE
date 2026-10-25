#!/usr/bin/env node
/**
 * Technical export gate for a finished vertical Short. This is not a rights,
 * editorial, metadata, or publication approval.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

if (!process.argv[2]) {
  console.error("Usage: node scripts/validate-short-export.mjs <video.mp4>");
  process.exit(2);
}
let mediaPath;
try { mediaPath = resolveRegularFileNoSymlinks(process.argv[2], process.cwd(), "Short export"); }
catch {
  console.error("BLOCKED: Short export is missing, unsafe, or contains a symbolic link.");
  process.exit(2);
}
if (fs.statSync(mediaPath).size < 100_000) {
  console.error("BLOCKED: Short export is suspiciously small.");
  process.exit(2);
}
const probe = spawnSync("ffprobe", [
  "-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate",
  "-of", "json", mediaPath
], { encoding: "utf8", timeout: 15_000 });
if (probe.error || probe.status !== 0) {
  console.error("BLOCKED: ffprobe could not inspect the Short export.");
  process.exit(2);
}
let data;
try { data = JSON.parse(probe.stdout); }
catch { console.error("BLOCKED: ffprobe returned invalid JSON."); process.exit(2); }
const streams = Array.isArray(data.streams) ? data.streams : [];
const video = streams.find(stream => stream.codec_type === "video");
const audio = streams.find(stream => stream.codec_type === "audio");
const duration = Number(data.format?.duration);
const errors = [];
if (!Number.isFinite(duration) || duration < 50 || duration > 60) {
  errors.push("duration must be 50–60 seconds; found " + (Number.isFinite(duration) ? duration.toFixed(2) + " seconds" : "unknown"));
}
if (!video) errors.push("video stream is missing");
else {
  if (video.width !== 1080 || video.height !== 1920) errors.push("video must be 1080×1920 vertical; found " + video.width + "×" + video.height);
  if (video.codec_name !== "h264") errors.push("video codec must be H.264; found " + video.codec_name);
}
if (!audio) errors.push("audio/narration stream is missing");
else if (audio.codec_name !== "aac") errors.push("audio codec must be AAC; found " + audio.codec_name);
if (errors.length) {
  console.error("BLOCKED — Short export technical validation failed:");
  errors.forEach(error => console.error("- " + error));
  process.exit(1);
}
const decode = spawnSync("ffmpeg", ["-v", "error", "-xerror", "-i", mediaPath, "-f", "null", "-"], {
  encoding: "utf8", timeout: 120_000
});
if (decode.error || decode.status !== 0) {
  console.error("BLOCKED: full-file FFmpeg decode failed; Short may be truncated or corrupt.");
  process.exit(1);
}
const audioStats = spawnSync("ffmpeg", ["-hide_banner", "-i", mediaPath, "-vn", "-af", "volumedetect", "-f", "null", "-"], {
  encoding: "utf8", timeout: 30_000
});
const audioReport = String(audioStats.stderr ?? "");
if (audioStats.error || audioStats.status !== 0 ||
    /mean_volume:\s*-inf\s*dB/i.test(audioReport) ||
    !/mean_volume:\s*-?\d+(?:\.\d+)?\s*dB/i.test(audioReport)) {
  console.error("BLOCKED: audio is silent or its loudness could not be measured.");
  process.exit(1);
}
console.log("PASS: Short export technical validation.");
console.log("Duration: " + duration.toFixed(2) + " seconds | Resolution: 1080×1920 | Video: H.264 | Audio: AAC | Full-file decode and measurable audio passed.");
console.log("Human review, rights verification, captions, thumbnail and metadata checks remain separate gates.");
