#!/usr/bin/env node
/**
 * Render one reviewed 50–60 second vertical Short from licensed footage,
 * a narration file and SRT captions. Requires FFmpeg with libass support.
 * This script never downloads assets, uploads, schedules, or publishes.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [manifestArg = "content/render-manifest.json", outputArg = "media/next-short.mp4"] = process.argv.slice(2);
const manifestPath = path.resolve(manifestArg);
if (!fs.existsSync(manifestPath)) {
  console.error("BLOCKED: render manifest not found. Copy content/render-manifest.example.json and fill it in after rights review.");
  process.exit(2);
}
let m;
try { m = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
catch { console.error("BLOCKED: render manifest is not valid JSON."); process.exit(2); }

const required = ["footagePath", "narrationPath", "captionsPath", "footageLicenseEvidence", "narrationLicenseEvidence"];
const missing = required.filter(k => typeof m[k] !== "string" || !m[k].trim());
const errors = [];
if (missing.length) errors.push("missing required fields: " + missing.join(", "));
if (m.channel !== "SonicVhibez") errors.push("channel must be exactly SonicVhibez");
if (m.rightsConfirmed !== true) errors.push("rightsConfirmed must be true after human review");
if (m.complianceReviewed !== true) errors.push("complianceReviewed must be true after human review");
if (m.targetSeconds !== 55) errors.push("targetSeconds must be 55");
for (const key of ["footageLicenseEvidence", "narrationLicenseEvidence"]) {
  const evidence = typeof m[key] === "string" ? m[key].trim() : "";
  if (evidence.length < 12 || /replace_with|placeholder|todo|unknown|tbd/i.test(evidence)) {
    errors.push(key + " must contain a real license/permission record reference, not a placeholder");
  }
}
for (const key of ["footagePath", "narrationPath", "captionsPath"]) {
  if (typeof m[key] === "string" && m[key].trim() && !fs.existsSync(path.resolve(path.dirname(manifestPath), m[key]))) {
    errors.push(key + " does not exist relative to the manifest directory: " + m[key]);
  }
}
if (errors.length) {
  console.error("BLOCKED — render preflight failed:");
  errors.forEach(e => console.error("- " + e));
  process.exit(1);
}
const footage = path.resolve(path.dirname(manifestPath), m.footagePath);
const narration = path.resolve(path.dirname(manifestPath), m.narrationPath);
const captions = path.resolve(path.dirname(manifestPath), m.captionsPath);
const output = path.resolve(outputArg);
const probe = spawnSync("ffprobe", ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1", narration], {encoding:"utf8"});
if (probe.error || probe.status !== 0 || !Number.isFinite(Number(probe.stdout.trim()))) {
  console.error("BLOCKED: ffprobe could not read narration. Install FFmpeg and provide a valid audio file.");
  process.exit(2);
}
if (Number(probe.stdout.trim()) < 50 || Number(probe.stdout.trim()) > 60) {
  console.error("BLOCKED: narration duration must be 50–60 seconds; found " + Number(probe.stdout.trim()).toFixed(2) + " seconds.");
  process.exit(1);
}
const captionCheck = spawnSync(process.execPath, ["scripts/check-captions.mjs", captions], {encoding:"utf8"});
if (captionCheck.status !== 0) {
  process.stderr.write(captionCheck.stderr || captionCheck.stdout || "BLOCKED: captions failed validation.\n");
  process.exit(1);
}
fs.mkdirSync(path.dirname(output), {recursive:true});
// FFmpeg resolves subtitle paths from the process working directory, not the
// manifest directory. Use the already-resolved absolute path so manifests in
// content/ work reliably, and escape filter-graph special characters.
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
  "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,subtitles='" + escapedCaptions + "'",
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "libx264", "-preset", "medium", "-crf", "21",
  "-c:a", "aac", "-b:a", "160k", "-pix_fmt", "yuv420p",
  "-movflags", "+faststart", output
];
const rendered = spawnSync("ffmpeg", args, {stdio:"inherit"});
if (rendered.error || rendered.status !== 0) {
  console.error("BLOCKED: FFmpeg render failed. Confirm FFmpeg/libass is installed and asset paths are valid.");
  process.exit(2);
}

// Never trust the renderer exit code alone: verify the produced bytes, streams,
// exact vertical framing, duration, full decode and measurable audio first.
const validatorPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "validate-short-export.mjs");
const validation = spawnSync(process.execPath, [validatorPath, output], {
  encoding: "utf8",
  timeout: 180_000
});
if (validation.stdout) process.stdout.write(validation.stdout);
if (validation.stderr) process.stderr.write(validation.stderr);
if (validation.error || validation.status !== 0) {
  console.error("BLOCKED: rendered Short failed technical export validation; it must not be marked successful.");
  process.exit(validation.error?.code === "ETIMEDOUT" ? 124 : 1);
}
console.log("RENDERED AND VALIDATED: " + output + " (50–60 seconds, 1080×1920, audio and full-file decode passed).");
console.log("Next: run npm run preflight:media -- " + output + " <reviewed-metadata.json> for the separate metadata gate.");
console.log("No upload or publishing action was performed.");
