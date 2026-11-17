#!/usr/bin/env node
/**
 * Apply the supplied Nature Frontiers logo as a real video overlay.
 * This does NOT remove third-party watermarks and does NOT approve an asset.
 * A separate full-video human watermark/brand review remains mandatory.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logo = path.join(root, "brand", "nature-frontiers-logo.png");
const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  console.error("Usage: node scripts/brand-nature-frontiers-video.mjs <input.mp4> <output.mp4>");
  process.exit(2);
}
let input, output;
try {
  input = resolveRegularFileNoSymlinks(inputArg, process.cwd(), "Input video");
  output = path.resolve(outputArg);
  if (!output.startsWith(root + path.sep) || output === input) throw new Error("output must be a distinct file inside this repository");
  if (fs.existsSync(output)) throw new Error("refusing to overwrite an existing output");
  if (!fs.existsSync(logo) || !fs.lstatSync(logo).isFile() || fs.lstatSync(logo).isSymbolicLink()) throw new Error("authoritative Nature Frontiers logo is missing or unsafe");
} catch (error) {
  console.error("BLOCKED: " + error.message);
  process.exit(2);
}
fs.mkdirSync(path.dirname(output), { recursive: true });
const args = [
  "-hide_banner", "-v", "error", "-xerror", "-i", input, "-i", logo,
  "-filter_complex", "[1:v]scale=180:-1[brand];[0:v][brand]overlay=x=W-w-48:y=H-h-48:format=auto:shortest=1",
  "-map", "0:v:0", "-map", "0:a?", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
  "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", output
];
const render = spawnSync(process.env.FFMPEG_PATH || "ffmpeg", args, { encoding: "utf8", timeout: 600000, maxBuffer: 2 * 1024 * 1024 });
if (render.error || render.status !== 0 || !fs.existsSync(output) || fs.statSync(output).size === 0) {
  try { if (fs.existsSync(output)) fs.unlinkSync(output); } catch {}
  console.error("BLOCKED: FFmpeg logo overlay failed; no approved output was produced.");
  if (render.stderr) process.stderr.write(render.stderr);
  process.exit(1);
}
const sha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const manifest = {
  schemaVersion: "1.0.0",
  brand: "Nature Frontiers",
  inputPath: path.relative(root, input).split(path.sep).join("/"),
  outputPath: path.relative(root, output).split(path.sep).join("/"),
  outputSha256: sha256(output),
  logoPath: "brand/nature-frontiers-logo.png",
  logoSha256: sha256(logo),
  overlay: { position: "bottom-right", marginPixels: 48, widthPixels: 180, aspectRatioPreserved: true },
  watermarkReview: { status: "PENDING_FULL_VIDEO_HUMAN_REVIEW", reviewer: null, reviewedAt: null, reviewedOutputSha256: null },
  publicationStatus: "HOLD"
};
fs.writeFileSync(output + ".brand-review.json", JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
console.log("PASS: Nature Frontiers logo overlaid. Output SHA-256: " + manifest.outputSha256);
console.log("HOLD: no watermark-free claim or publishing approval is made. Complete full-video human review and record approval against this exact SHA-256.");
