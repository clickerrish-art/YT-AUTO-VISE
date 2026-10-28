#!/usr/bin/env node
/**
 * Verify that every SRT cue fits within the expected narration/render duration.
 * This complements structural caption validation; it does not assess readability
 * or whether the words accurately match the audio.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function parseSrtTime(value) {
  const match = String(value).match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) return null;
  const [, hours, minutes, seconds, milliseconds] = match.map(Number);
  // SRT permits hours beyond 23, but minute and second fields must be clock-valid.
  if (minutes > 59 || seconds > 59) return null;
  return (((hours * 60 + minutes) * 60 + seconds) * 1000) + milliseconds;
}

export function validateCaptionSync(srt, mediaDurationSeconds, { toleranceSeconds = 0.25 } = {}) {
  const errors = [];
  if (!Number.isFinite(mediaDurationSeconds) || mediaDurationSeconds <= 0) {
    return ["expected media duration must be a finite positive number of seconds"];
  }
  if (!Number.isFinite(toleranceSeconds) || toleranceSeconds < 0 || toleranceSeconds > 1) {
    return ["caption timing tolerance must be between 0 and 1 second"];
  }
  const normalized = String(srt ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return ["caption file is empty"];
  const blocks = normalized.split(/\n\s*\n/);
  let previousEnd = 0;
  const maxEnd = mediaDurationSeconds * 1000 + toleranceSeconds * 1000;
  blocks.forEach((block, index) => {
    const lines = block.split("\n");
    if (lines.length < 3 || Number(lines[0]) !== index + 1) {
      errors.push(`cue ${index + 1}: invalid sequence or missing caption text`);
      return;
    }
    const match = lines[1].match(/^(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})$/);
    if (!match) {
      errors.push(`cue ${index + 1}: invalid SRT timestamp format`);
      return;
    }
    const start = parseSrtTime(match[1]);
    const end = parseSrtTime(match[2]);
    if (end <= start) errors.push(`cue ${index + 1}: end must follow start`);
    if (start < previousEnd) errors.push(`cue ${index + 1}: captions overlap or are out of order`);
    if (start > maxEnd) errors.push(`cue ${index + 1}: starts after the media ends`);
    if (end > maxEnd) errors.push(`cue ${index + 1}: ends after the media ends (${mediaDurationSeconds.toFixed(3)} seconds)`);
    if (!lines.slice(2).join(" ").trim()) errors.push(`cue ${index + 1}: caption text is empty`);
    previousEnd = end;
  });
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [captionPath, durationArg] = process.argv.slice(2);
  if (!captionPath || durationArg === undefined) {
    console.error("Usage: node scripts/validate-caption-sync.mjs <captions.srt> <expected-duration-seconds>");
    process.exit(2);
  }
  let source;
  try { source = fs.readFileSync(captionPath, "utf8"); }
  catch { console.error("BLOCKED: caption file cannot be read."); process.exit(2); }
  const errors = validateCaptionSync(source, Number(durationArg));
  if (errors.length) {
    console.error("BLOCKED — caption/media synchronization failed:");
    errors.forEach(error => console.error("- " + error));
    process.exit(1);
  }
  console.log("PASS: all caption cues fit within the expected media duration.");
}
