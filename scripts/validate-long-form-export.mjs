#!/usr/bin/env node
/**
 * Technical export gate for completed long-form videos.
 * This does not approve copyright, factual accuracy, editorial quality, or publication.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [mediaArg = "media/long-form-next.mp4"] = process.argv.slice(2);
const mediaPath = path.resolve(mediaArg);
if (!fs.existsSync(mediaPath) || !fs.statSync(mediaPath).isFile() || fs.statSync(mediaPath).size === 0) {
  console.error("BLOCKED: export file is missing or empty: " + mediaPath);
  process.exit(2);
}
const probe = spawnSync("ffprobe", [
  "-v", "error",
  "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate",
  "-of", "json", mediaPath
], { encoding: "utf8" });
if (probe.error || probe.status !== 0) {
  console.error("BLOCKED: ffprobe could not inspect the export. Install FFmpeg and provide a readable MP4.");
  process.exit(2);
}
let data;
try { data = JSON.parse(probe.stdout); }
catch { console.error("BLOCKED: ffprobe returned invalid JSON."); process.exit(2); }
const streams = Array.isArray(data.streams) ? data.streams : [];
const video = streams.find(s => s.codec_type === "video");
const audio = streams.find(s => s.codec_type === "audio");
const duration = Number(data.format?.duration);
const errors = [];
if (!Number.isFinite(duration) || duration < 360 || duration > 600) {
  errors.push("duration must be 6–10 minutes; found " + (Number.isFinite(duration) ? duration.toFixed(2) + " seconds" : "unknown"));
}
if (!video) errors.push("video stream is missing");
else {
  if (video.width !== 1920 || video.height !== 1080) errors.push("video must be 1920×1080; found " + video.width + "×" + video.height);
  if (video.codec_name !== "h264") errors.push("video codec must be H.264; found " + video.codec_name);
  const rateParts = String(video.avg_frame_rate ?? "").split("/").map(Number);
  const fps = rateParts.length === 2 && rateParts[1] > 0 ? rateParts[0] / rateParts[1] : NaN;
  if (!Number.isFinite(fps) || fps < 23.9 || fps > 60) {
    errors.push("video frame rate must be between 23.9 and 60 fps; found " + (Number.isFinite(fps) ? fps.toFixed(3) : "unknown"));
  }
}
if (!audio) errors.push("audio stream is missing");
else if (audio.codec_name !== "aac") errors.push("audio codec must be AAC; found " + audio.codec_name);
if (errors.length) {
  console.error("BLOCKED — export technical validation failed:");
  errors.forEach(e => console.error("- " + e));
  process.exit(1);
}

// ffprobe can read metadata from a damaged file; decode the complete stream to catch corruption.
const decode = spawnSync("ffmpeg", [
  "-v", "error", "-xerror", "-i", mediaPath, "-f", "null", "-"
], { encoding: "utf8" });
if (decode.error || decode.status !== 0) {
  console.error("BLOCKED: full-file FFmpeg decode failed; export may be corrupt.");
  const detail = (decode.stderr || "").trim();
  if (detail) console.error(detail.slice(0, 1200));
  process.exit(1);
}
console.log("PASS: long-form export technical checks passed.");
console.log("Duration: " + (duration / 60).toFixed(2) + " minutes | Resolution: 1920×1080 | Video: H.264 | Audio: AAC | FPS: " + (Number(video.avg_frame_rate.split("/")[0]) / Number(video.avg_frame_rate.split("/")[1])).toFixed(2));
console.log("Full-file decode passed. Human review is still required for factual accuracy, rights, captions, thumbnail, disclosures, and channel identity.");
