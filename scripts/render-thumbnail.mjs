#!/usr/bin/env node
/**
 * Create a YouTube thumbnail from a reviewed rendered Short.
 * Extracts a real frame from the supplied video and overlays a readable title.
 * Requires FFmpeg with drawtext support. Does not download, upload, or publish.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [videoArg = "media/next-short.mp4", titleArg = "", outputArg = "media/next-short-thumbnail.jpg"] = process.argv.slice(2);
const video = path.resolve(videoArg);
const output = path.resolve(outputArg);
const title = titleArg.trim();
if (!fs.existsSync(video)) {
  console.error("BLOCKED: rendered video is missing: " + video);
  process.exit(2);
}
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
fs.mkdirSync(path.dirname(output), {recursive:true});
// Escape FFmpeg drawtext filter syntax. Use a generated text file to avoid shell quoting.
const textPath = path.join(path.dirname(output), ".thumbnail-title.txt");
fs.writeFileSync(textPath, title.replace(/[\r\n]+/g, " ").replace(/\\/g, "\\\\").replace(/'/g, "\\'"), "utf8");
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
