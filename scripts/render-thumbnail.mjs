#!/usr/bin/env node
/**
 * Create a YouTube thumbnail from a reviewed rendered Short.
 * Extracts a real frame from the supplied video and overlays a readable title.
 * Requires FFmpeg with drawtext support. Does not download, upload, or publish.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { prepareSafeRenderOutput, resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

const [videoArg = "media/next-short.mp4", titleArg = "", outputArg = "media/next-short-thumbnail.jpg"] = process.argv.slice(2);
let video;
let output;
try {
  video = resolveRegularFileNoSymlinks(videoArg, process.cwd(), "Thumbnail source video");
  output = prepareSafeRenderOutput(outputArg);
} catch {
  console.error("BLOCKED: thumbnail source or output path is missing, unsafe, or contains a symbolic link.");
  process.exit(2);
}
const title = titleArg.trim();
if (!title || title.length > 90) {
  console.error("BLOCKED: provide a clear thumbnail title of 1–90 characters.");
  process.exit(2);
}
const probe = spawnSync("ffprobe", ["-v","error","-show_entries","stream=codec_type,width,height","-of","json",video], {encoding:"utf8"});
if (probe.status !== 0) {
  console.error("BLOCKED: ffprobe could not inspect the rendered video.");
  process.exit(2);
}
let streams;
try { streams = JSON.parse(probe.stdout).streams ?? []; }
catch { console.error("BLOCKED: ffprobe returned invalid metadata."); process.exit(2); }
const videoStream = streams.find(s => s.codec_type === "video");
if (!videoStream || !videoStream.width || !videoStream.height) {
  console.error("BLOCKED: input has no readable video stream.");
  process.exit(1);
}

// Escape FFmpeg drawtext filter syntax. Use a generated text file to avoid shell quoting.
const textPath = path.join(path.dirname(output), ".thumbnail-title.txt");
const safeTitle = title.replace(/[\r\n]+/g, " ").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
let titleFd;
try {
  titleFd = fs.openSync(textPath, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, 0o600);
  fs.writeFileSync(titleFd, safeTitle, "utf8");
  fs.closeSync(titleFd);
  titleFd = undefined;
} catch {
  if (titleFd !== undefined) { try { fs.closeSync(titleFd); } catch {} }
  console.error("BLOCKED: thumbnail title temporary file already exists or cannot be created safely.");
  process.exit(2);
}
const escapedTextPath = textPath.replace(/\\/g, "\\\\").replace(/:/g, "\\:");
const filter = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,drawbox=x=0:y=440:w=1280:h=280:color=black@0.62:t=fill,drawtext=textfile='" + escapedTextPath + "':fontcolor=white:fontsize=58:font='DejaVu Sans':borderw=3:bordercolor=black:line_spacing=8:x=60:y=470:fix_bounds=true";
const result = spawnSync("ffmpeg", ["-y","-ss","1.5","-i",video,"-frames:v","1","-vf",filter,"-q:v","2",output], {stdio:"inherit"});
try { fs.unlinkSync(textPath); } catch {}
if (result.error || result.status !== 0 || !fs.existsSync(output)) {
  console.error("BLOCKED: thumbnail render failed; verify FFmpeg drawtext and DejaVu Sans support.");
  process.exit(2);
}
console.log("CREATED: " + output + " (1280x720 JPEG from reviewed video frame).");
console.log("Inspect text placement and frame quality before using the thumbnail. No upload or publishing was performed.");
