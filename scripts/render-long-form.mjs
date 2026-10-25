#!/usr/bin/env node
/**
 * Render a reviewed 6–10 minute horizontal SonicVhibez video.
 * Requires FFmpeg with libass support. This script never downloads assets,
 * uploads, schedules, or publishes.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareSafeRenderOutput, resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

const [manifestArg = "content/long-form-render-manifest.json", outputArg = "media/long-form-next.mp4"] = process.argv.slice(2);
let manifestPath;
try { manifestPath = resolveRegularFileNoSymlinks(manifestArg, process.cwd(), "Long-form render manifest"); }
catch {
  console.error("BLOCKED: long-form render manifest not found or unsafe. Copy content/long-form-render-manifest.example.json and complete it after rights review.");
  process.exit(2);
}
let m;
try { m = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
catch { console.error("BLOCKED: long-form render manifest is not valid JSON."); process.exit(2); }

const required = ["footagePath", "narrationPath", "captionsPath", "footageLicenseEvidence", "narrationLicenseEvidence"];
const errors = [];
const missing = required.filter(k => typeof m[k] !== "string" || !m[k].trim());
if (missing.length) errors.push("missing required fields: " + missing.join(", "));
if (m.channel !== "SonicVhibez") errors.push("channel must be exactly SonicVhibez");
if (m.rightsConfirmed !== true) errors.push("rightsConfirmed must be true after human review");
if (m.complianceReviewed !== true) errors.push("complianceReviewed must be true after human review");
if (m.targetAspectRatio !== "16:9") errors.push('targetAspectRatio must be "16:9"');
for (const key of ["footageLicenseEvidence", "narrationLicenseEvidence"]) {
  const evidence = typeof m[key] === "string" ? m[key].trim() : "";
  if (evidence.length < 12 || /replace_with|placeholder|todo|unknown|tbd/i.test(evidence)) {
    errors.push(key + " must contain a real license/permission record reference, not a placeholder");
  }
}
const resolvedInputs = {};
for (const key of ["footagePath", "narrationPath", "captionsPath"]) {
  if (typeof m[key] === "string" && m[key].trim()) {
    try {
      resolvedInputs[key] = resolveRegularFileNoSymlinks(m[key], path.dirname(manifestPath), key);
    } catch {
      errors.push(key + " is missing, unsafe, or contains a symbolic link");
    }
  }
}
if (errors.length) {
  console.error("BLOCKED — long-form render preflight failed:");
  errors.forEach(e => console.error("- " + e));
  process.exit(1);
}
const footage = resolvedInputs.footagePath;
const narration = resolvedInputs.narrationPath;
const captions = resolvedInputs.captionsPath;
let output;
try { output = prepareSafeRenderOutput(outputArg); }
catch {
  console.error("BLOCKED: long-form render output path is unsafe or contains a symbolic link.");
  process.exit(1);
}
const probe = spawnSync("ffprobe", ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1", narration], {encoding:"utf8"});
if (probe.error || probe.status !== 0 || !Number.isFinite(Number(probe.stdout.trim()))) {
  console.error("BLOCKED: ffprobe could not read narration. Install FFmpeg and provide a valid audio file.");
  process.exit(2);
}
const duration = Number(probe.stdout.trim());
if (duration < 360 || duration > 600) {
  console.error("BLOCKED: narration must be 6–10 minutes; found " + duration.toFixed(2) + " seconds.");
  process.exit(1);
}
const captionCheck = spawnSync(process.execPath, ["scripts/check-captions.mjs", captions], {encoding:"utf8"});
if (captionCheck.status !== 0) {
  process.stderr.write(captionCheck.stderr || captionCheck.stdout || "BLOCKED: captions failed validation.\n");
  process.exit(1);
}
const captionSyncCheck = spawnSync(process.execPath, ["scripts/validate-caption-sync.mjs", captions, String(duration)], { encoding: "utf8" });
if (captionSyncCheck.stdout) process.stdout.write(captionSyncCheck.stdout);
if (captionSyncCheck.stderr) process.stderr.write(captionSyncCheck.stderr);
if (captionSyncCheck.error || captionSyncCheck.status !== 0) {
  console.error("BLOCKED: captions do not fit the narration duration; refusing to render.");
  process.exit(1);
}

const escapedCaptions = captions
  .replace(/\\/g, "\\\\")
  .replace(/:/g, "\\:")
  .replace(/'/g, "\\'")
  .replace(/,/g, "\\,")
  .replace(/\[/g, "\\[")
  .replace(/\]/g, "\\]");
const args = [
  "-y", "-stream_loop", "-1", "-i", footage, "-i", narration,
  "-shortest",
  "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,subtitles='" + escapedCaptions + "'",
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "libx264", "-preset", "medium", "-crf", "21",
  "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p",
  "-movflags", "+faststart", output
];
const rendered = spawnSync("ffmpeg", args, {stdio:"inherit"});
if (rendered.error || rendered.status !== 0) {
  console.error("BLOCKED: FFmpeg render failed. Confirm FFmpeg/libass is installed and asset paths are valid.");
  process.exit(2);
}

// A successful FFmpeg exit is not proof that the file is complete or decodable.
// Run the full export gate before emitting any success message.
const validatorPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "validate-long-form-export.mjs");
const validation = spawnSync(process.execPath, [validatorPath, output], {
  encoding: "utf8",
  timeout: 240_000
});
if (validation.stdout) process.stdout.write(validation.stdout);
if (validation.stderr) process.stderr.write(validation.stderr);
if (validation.error || validation.status !== 0) {
  console.error("BLOCKED: rendered output failed technical export validation; it must not be marked successful.");
  process.exit(validation.error?.code === "ETIMEDOUT" ? 124 : 1);
}
console.log("RENDERED AND VALIDATED: " + output + " (horizontal 16:9; duration, streams, codec, frame rate and full-file decode passed).");
console.log("Next: complete separate metadata, rights, thumbnail and human release review.");
console.log("No upload or publishing action was performed.");
