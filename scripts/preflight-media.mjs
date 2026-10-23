#!/usr/bin/env node
/**
 * Preflight for a locally rendered SonicVhibez Short.
 * Requires ffprobe (FFmpeg) and a reviewed MP4. This script does not upload.
 */
import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const [mediaArg, metadataArg] = process.argv.slice(2);
if (!mediaArg || !metadataArg) {
  console.error('Usage: node scripts/preflight-media.mjs <video.mp4> <metadata.json>');
  process.exit(2);
}
const media = path.resolve(mediaArg);
const metadataPath = path.resolve(metadataArg);
if (!existsSync(media) || !existsSync(metadataPath)) {
  console.error('BLOCKED: video or metadata file does not exist.');
  process.exit(2);
}
const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
if (metadata.channel !== 'SonicVhibez' || metadata.visibility !== 'private') {
  console.error('BLOCKED: target must be SonicVhibez and initial visibility must be private.');
  process.exit(1);
}
if (typeof metadata.title !== 'string' || !metadata.title.trim() || typeof metadata.description !== 'string' || !metadata.description.trim() || !Array.isArray(metadata.tags) || metadata.tags.length < 3) {
  console.error('BLOCKED: metadata must contain a title, description and at least three tags.');
  process.exit(1);
}
if (metadata.rightsConfirmed !== true || metadata.complianceReviewed !== true) {
  console.error('BLOCKED: rightsConfirmed and complianceReviewed must both be true after human review.');
  process.exit(1);
}
const probe = spawnSync('ffprobe', [
  '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height',
  '-of', 'json', media
], { encoding: 'utf8' });
if (probe.error || probe.status !== 0) {
  console.error('BLOCKED: ffprobe is unavailable or could not read the media. Install FFmpeg and retry.');
  process.exit(2);
}
let info;
try { info = JSON.parse(probe.stdout); } catch {
  console.error('BLOCKED: ffprobe returned invalid data.');
  process.exit(2);
}
const duration = Number(info.format?.duration);
const fileBytes = statSync(media).size;
const streams = info.streams ?? [];
const video = streams.find(s => s.codec_type === 'video');
const audio = streams.some(s => s.codec_type === 'audio');
const errors = [];
if (!Number.isFinite(duration) || duration < 50 || duration > 60) errors.push(`duration must be 50–60 seconds (found ${duration.toFixed?.(2) ?? 'unknown'}s)`);
if (!Number.isFinite(fileBytes) || fileBytes < 100_000) errors.push(`media file is empty or suspiciously small (${fileBytes} bytes)`);
if (!video) errors.push('video stream is missing');
else if (!(video.height > video.width) || Math.abs(video.width / video.height - 9 / 16) > 0.005) errors.push(`video must use 9:16 vertical framing (found ${video.width}x${video.height})`);
if (!audio) errors.push('audio/narration track is missing');
// Decode the complete file to catch truncated or corrupt media, not just a readable header.
const decode = spawnSync('ffmpeg', ['-v', 'error', '-i', media, '-f', 'null', '-'], { encoding: 'utf8', timeout: 120_000 });
if (decode.error || decode.status !== 0) errors.push('full media decode failed; file may be truncated or corrupt');
const audioStats = spawnSync('ffmpeg', ['-hide_banner', '-i', media, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8', timeout: 30_000 });
const audioReport = String(audioStats.stderr ?? '');
if (audioStats.error || audioStats.status !== 0) errors.push('audio loudness inspection failed');
else if (/mean_volume:\s*-inf\s*dB/i.test(audioReport) || !/mean_volume:\s*-?\d+(?:\.\d+)?\s*dB/i.test(audioReport)) errors.push('audio track appears silent or has no measurable mean volume');
if (errors.length) {
  console.error('BLOCKED: media preflight failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`PASS: ${path.basename(media)} is ${duration.toFixed(2)}s, vertical, and contains audio.`);
console.log('Reminder: technical checks do not verify factual accuracy, voice consent, licenses, or visual quality.');
