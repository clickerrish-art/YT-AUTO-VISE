#!/usr/bin/env node
/** Measure the rendered MP4 audio; a pre-render report is not proof of output loudness. */
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";
import { getAudioProfile } from "./content-quality-gates.mjs";

export function parseLoudnormReport(stderr) {
  const matches = String(stderr ?? "").match(/\{\s*"input_i"[\s\S]*?\}/g);
  if (!matches?.length) return null;
  try {
    const data = JSON.parse(matches[matches.length - 1]);
    const integratedLufs = Number(data.input_i);
    const truePeakDbtp = Number(data.input_tp);
    const loudnessRange = Number(data.input_lra);
    if (![integratedLufs, truePeakDbtp, loudnessRange].every(Number.isFinite)) return null;
    return { integratedLufs, truePeakDbtp, loudnessRange };
  } catch {
    return null;
  }
}

export function validateRenderedAudioMetrics(metrics, profileName, { loudnessTolerance = 3, truePeakTolerance = 0.2 } = {}) {
  const profile = getAudioProfile(profileName);
  const errors = [];
  if (!metrics || !Number.isFinite(metrics.integratedLufs)) errors.push("rendered integrated loudness could not be measured");
  else if (Math.abs(metrics.integratedLufs - profile.narrationTargetLufs) > loudnessTolerance) errors.push("rendered integrated loudness is outside profile tolerance");
  if (!metrics || !Number.isFinite(metrics.truePeakDbtp)) errors.push("rendered true peak could not be measured");
  else if (metrics.truePeakDbtp > profile.truePeakDbtpMax + truePeakTolerance) errors.push("rendered true peak exceeds profile limit");
  return { valid: errors.length === 0, errors, profile, metrics };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mediaArg, profileName] = process.argv.slice(2);
  if (!mediaArg || !profileName) {
    console.error("Usage: node scripts/validate-rendered-audio.mjs <rendered.mp4> <audio-profile>");
    process.exit(2);
  }
  let mediaPath;
  try { mediaPath = resolveRegularFileNoSymlinks(mediaArg, process.cwd(), "Rendered audio input"); }
  catch { console.error("BLOCKED: rendered MP4 is missing or unsafe."); process.exit(2); }
  let profile;
  try { profile = getAudioProfile(profileName); }
  catch (error) { console.error("BLOCKED: " + error.message); process.exit(2); }
  const measured = spawnSync("ffmpeg", [
    "-hide_banner", "-v", "error", "-i", mediaPath, "-vn",
    "-af", "loudnorm=I=" + profile.narrationTargetLufs + ":TP=" + profile.truePeakDbtpMax + ":LRA=" + profile.loudnessRangeTarget + ":print_format=json",
    "-f", "null", "-"
  ], { encoding: "utf8", timeout: 90_000 });
  if (measured.error || measured.status !== 0) {
    console.error("BLOCKED: FFmpeg could not measure the rendered audio stream.");
    process.exit(1);
  }
  const metrics = parseLoudnormReport(measured.stderr);
  const result = validateRenderedAudioMetrics(metrics, profileName);
  if (!result.valid) {
    console.error("BLOCKED — rendered audio quality failed:");
    result.errors.forEach(error => console.error("- " + error));
    process.exit(1);
  }
  console.log("PASS: rendered audio profile " + profileName + " — integrated loudness " + metrics.integratedLufs.toFixed(2) + " LUFS, true peak " + metrics.truePeakDbtp.toFixed(2) + " dBTP.");
}
