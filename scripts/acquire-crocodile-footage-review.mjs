#!/usr/bin/env node
/** Acquire five owner-selected Pexels Nile-crocodile source clips for review.
 * This is zero-cost source intake only: no edit, narration, upload, scheduling or publication.
 * Every acquired asset remains rights-unverified and release-ineligible until human review.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const ROOT = process.cwd();
const OUTPUT_ROOT = path.join(ROOT, "artifacts/long-form-001/pexels-candidates");
const MEDIA_ROOT = path.join(OUTPUT_ROOT, "media");
const PREVIEW_ROOT = path.join(OUTPUT_ROOT, "preview");
const LICENSE_URL = "https://www.pexels.com/license/";
const MAX_FILE_BYTES = 500 * 1024 * 1024;
const ASSETS = [
  { id: "pexels-30026544", creator: "Johnny Tilly", title: "Crocodile Resting on Riverbank in South Africa", sourceUrl: "https://www.pexels.com/video/crocodile-resting-on-riverbank-in-south-africa-30026544/", downloadUrl: "https://videos.pexels.com/video-files/30026544/12882200_1920_1080_25fps.mp4", durationSeconds: 36, width: 1920, height: 1080, fps: 25, canvaAssetId: "VAHbmcWc8lU", geography: "South Africa" },
  { id: "pexels-31702202", creator: "MC G'Zay", title: "Close-Up of Nile Crocodile in African Waters", sourceUrl: "https://www.pexels.com/video/close-up-of-nile-crocodile-in-african-waters-31702202/", downloadUrl: "https://videos.pexels.com/video-files/31702202/13507702_1080_1920_30fps.mp4", durationSeconds: 10, width: 1080, height: 1920, fps: 30, canvaAssetId: "VAHbmQ28Quo", geography: "Africa; exact location not stated" },
  { id: "pexels-31702221", creator: "MC G'Zay", title: "Majestic Nile Crocodile Basking on Riverbank", sourceUrl: "https://www.pexels.com/video/majestic-nile-crocodile-basking-on-riverbank-31702221/", downloadUrl: "https://videos.pexels.com/video-files/31702221/13507698_1080_1920_30fps.mp4", durationSeconds: 17, width: 1080, height: 1920, fps: 30, canvaAssetId: "VAHbmRm73VM", geography: "Kenya" },
  { id: "pexels-31702245", creator: "MC G'Zay", title: "Wild Nile Crocodile in Natural Habitat", sourceUrl: "https://www.pexels.com/video/wild-nile-crocodile-in-natural-habitat-31702245/", downloadUrl: "https://videos.pexels.com/video-files/31702245/13507640_1080_1920_30fps.mp4", durationSeconds: 13, width: 1080, height: 1920, fps: 30, canvaAssetId: "VAHbmXxvw3E", geography: "Africa; exact location not stated" },
  { id: "pexels-31998380", creator: "Floating Rabbit", title: "Aerial View of Crocodiles in Lower Zambezi River", sourceUrl: "https://www.pexels.com/video/aerial-view-of-crocodiles-in-lower-zambezi-river-31998380/", downloadUrl: "https://videos.pexels.com/video-files/31998380/13636751_3840_2160_30fps.mp4", durationSeconds: 60, width: 3840, height: 2160, fps: 30, canvaAssetId: "VAHbmVmwByo", geography: "Lower Zambezi, Zambia" }
];

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 240_000, maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(label + ": " + (result.error?.message || result.stderr || result.stdout || ("exit " + result.status)));
  return result.stdout;
}
function sha256File(file) {
  const digest = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  const buffer = Buffer.alloc(8 * 1024 * 1024);
  try { let bytes; while ((bytes = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) digest.update(buffer.subarray(0, bytes)); }
  finally { fs.closeSync(fd); }
  return digest.digest("hex");
}
function rateValue(rate) {
  if (typeof rate !== "string") return null;
  const parts = rate.split("/").map(Number);
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1]) || parts[1] === 0) return null;
  return parts[0] / parts[1];
}
function probe(file) {
  const raw = run("ffprobe", ["-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate","-of","json",file], "ffprobe " + path.basename(file));
  const data = JSON.parse(raw);
  const video = data.streams?.find(s => s.codec_type === "video");
  const durationSeconds = Number(data.format?.duration);
  if (!video || !Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error("Invalid video stream or duration: " + file);
  return { durationSeconds, sizeBytes: Number(data.format?.size ?? fs.statSync(file).size), video: { codec: video.codec_name, width: Number(video.width), height: Number(video.height), fps: rateValue(video.avg_frame_rate) } };
}
async function download(asset, destination) {
  const url = new URL(asset.downloadUrl);
  if (url.protocol !== "https:" || url.hostname !== "videos.pexels.com") throw new Error(asset.id + ": direct URL is not on the allowlisted Pexels media host");
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(240_000), headers: { "User-Agent": "SonicVhibez-Pexels-Review-Acquisition/1.0" } });
  if (!response.ok || !response.body) throw new Error(asset.id + ": download returned HTTP " + response.status);
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== "https:" || finalUrl.hostname !== "videos.pexels.com") throw new Error(asset.id + ": redirect left the allowlisted Pexels media host");
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination, { flags: "wx" }));
  const size = (await fsp.stat(destination)).size;
  if (size < 50_000 || size > MAX_FILE_BYTES) throw new Error(asset.id + ": unexpected size " + size);
  const fd = await fsp.open(destination, "r"); const signature = Buffer.alloc(12); await fd.read(signature, 0, 12, 0); await fd.close();
  if (signature.toString("ascii", 4, 8) !== "ftyp") throw new Error(asset.id + ": downloaded file is not an MP4 container");
  return { sizeBytes: size, finalUrl: response.url };
}
async function main() {
  const owner = JSON.parse(await fsp.readFile(path.join(ROOT, "content/owner-media-policy-override-2026-11-22.json"), "utf8"));
  if (owner.status !== "ACTIVE_WITH_ASSET_LEVEL_REVIEW_GATES" || owner.mediaRules.pexelsLicensedStockAllowed !== true || owner.mediaRules.aiGeneratedWildlifeVisualsAllowed !== false) throw new Error("Owner media policy missing or unsafe");
  await fsp.mkdir(MEDIA_ROOT, { recursive: true }); await fsp.mkdir(PREVIEW_ROOT, { recursive: true });
  const acquired = [];
  for (const asset of ASSETS) {
    const file = path.join(MEDIA_ROOT, asset.id + ".mp4");
    const fetched = await download(asset, file);
    const actual = probe(file);
    if (Math.abs(actual.durationSeconds - asset.durationSeconds) > 1.5) throw new Error(asset.id + ": duration mismatch; expected " + asset.durationSeconds + "s, got " + actual.durationSeconds.toFixed(3) + "s");
    if (actual.video.width !== asset.width || actual.video.height !== asset.height) throw new Error(asset.id + ": resolution mismatch; expected " + asset.width + "x" + asset.height + ", got " + actual.video.width + "x" + actual.video.height);
    if (actual.video.fps !== null && Math.abs(actual.video.fps - asset.fps) > 0.6) throw new Error(asset.id + ": frame-rate mismatch; expected " + asset.fps + ", got " + actual.video.fps);
    run("ffmpeg", ["-hide_banner","-v","error","-i",file,"-f","null","-"], "full decode " + asset.id);
    const preview = path.join(PREVIEW_ROOT, asset.id + ".jpg");
    run("ffmpeg", ["-hide_banner","-v","error","-y","-ss",String(Math.max(0.1,Math.min(actual.durationSeconds/2,actual.durationSeconds-0.1))),"-i",file,"-frames:v","1","-vf","scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2","-q:v","3",preview], "preview frame " + asset.id);
    acquired.push({ ...asset, directDownloadUrl: asset.downloadUrl, pexelsLicenseReference: LICENSE_URL, actual, downloadedBytes: fetched.sizeBytes, downloadedFrom: fetched.finalUrl, sha256: sha256File(file), mediaFile: "media/" + path.basename(file), previewFrame: "preview/" + path.basename(preview), fullDecode: "PASS", rightsVerified: false, humanReviewed: false, thirdPartyRightsReviewed: false, releaseEligible: false });
  }
  const contact = path.join(PREVIEW_ROOT, "crocodile-candidates-contact-sheet.jpg");
  run("ffmpeg", ["-hide_banner","-v","error","-y","-pattern_type","glob","-framerate","1","-i",path.join(PREVIEW_ROOT,"pexels-*.jpg"),"-vf","tile=5x1:padding=8:margin=8","-frames:v","1",contact], "contact sheet");
  const manifest = { schemaVersion:1, project:"SonicVhibez", contentId:"long-form-001-nile-crocodile", status:"ACQUIRED_FOR_REVIEW_NOT_RELEASE_CLEARED", createdAt:new Date().toISOString(), sourceSelection:"Five owner-selected Pexels crocodile candidates imported into Canva and now acquired for exact-file verification.", license:{ name:"Pexels License", url:LICENSE_URL, evidencePath:"content/media/pexels-license-evidence-2026-11-22.md", commercialUseSubjectToTerms:true, attributionRequired:false, thirdPartyRightsReviewed:false, standaloneUnmodifiedRedistributionAllowed:false }, ownerPolicyEvidence:"content/owner-media-policy-override-2026-11-22.json", assets:acquired, previews:{contactSheet:"preview/crocodile-candidates-contact-sheet.jpg"}, editorialWarning:"Do not combine South Africa, Kenya and Zambia footage as one location or encounter. The exact location of any clip must match the source metadata. Full human review is required.", release:{rightsConfirmed:false,humanComplianceReview:false,finalVideoHumanReview:false,metadataApproval:false,publicPublishingEnabled:false,privateUploadAuthorized:false,releaseEligible:false} };
  await fsp.writeFile(path.join(OUTPUT_ROOT,"acquisition-manifest.json"),JSON.stringify(manifest,null,2)+"\n");
  console.log(JSON.stringify({status:manifest.status,assetCount:acquired.length,totalSourceSeconds:acquired.reduce((s,a)=>s+a.actual.durationSeconds,0),fullDecodePasses:acquired.filter(a=>a.fullDecode==="PASS").length,contactSheet:contact,manifest:path.join(OUTPUT_ROOT,"acquisition-manifest.json"),releaseEligible:false},null,2));
}
main().catch(error => { console.error("BLOCKED:",error.message); process.exit(1); });
