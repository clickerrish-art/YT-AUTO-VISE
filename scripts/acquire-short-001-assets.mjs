#!/usr/bin/env node
/**
 * Acquire only the four explicitly owner-approved Pexels clips for Short 001.
 * The output is a review artifact, never a production/rights approval.
 * No narration, rendering, upload, scheduling or publishing occurs.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const ROOT = process.cwd();
const REGISTER_PATH = path.join(ROOT, "content/approved-pexels-footage.json");
const OUTPUT_ROOT = path.join(ROOT, "artifacts/short-001");
const MEDIA_ROOT = path.join(OUTPUT_ROOT, "media");
const PREVIEW_ROOT = path.join(OUTPUT_ROOT, "preview");
const LICENSE_URL = "https://www.pexels.com/license/";
const APPROVED_IDS = [
  "pexels-29765785",
  "pexels-11760785",
  "pexels-11528208",
  "pexels-31702128"
];
const MAX_FILE_BYTES = 300 * 1024 * 1024;

function run(command, args, label) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    throw new Error(label + ": " + (result.error?.message || result.stderr || result.stdout || ("exit " + result.status)));
  }
  return result.stdout;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function rateValue(rate) {
  if (typeof rate !== "string") return null;
  const parts = rate.split("/").map(Number);
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1]) || parts[1] === 0) return null;
  return parts[0] / parts[1];
}

function probeMedia(file) {
  const raw = run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate",
    "-of", "json", file
  ], "ffprobe " + path.basename(file));
  const data = JSON.parse(raw);
  const video = data.streams?.find(stream => stream.codec_type === "video") ?? null;
  const durationSeconds = Number(data.format?.duration);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error("invalid media duration: " + file);
  return {
    durationSeconds,
    sizeBytes: Number(data.format?.size ?? fs.statSync(file).size),
    video: video ? {
      codec: video.codec_name,
      width: Number(video.width),
      height: Number(video.height),
      fps: rateValue(video.avg_frame_rate)
    } : null
  };
}

async function downloadPexels(asset, destination) {
  const url = new URL(asset.downloadUrl);
  if (url.protocol !== "https:" || url.hostname !== "videos.pexels.com") {
    throw new Error(asset.id + ": direct download URL must use HTTPS videos.pexels.com");
  }
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(180_000),
    headers: { "User-Agent": "SonicVhibez-Approved-Pexels-Acquisition/1.0" }
  });
  if (!response.ok || !response.body) throw new Error(asset.id + ": download returned HTTP " + response.status);
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== "https:" || finalUrl.hostname !== "videos.pexels.com") {
    throw new Error(asset.id + ": download redirect left the allowlisted Pexels media host");
  }
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination, { flags: "wx" }));
  const stat = await fsp.stat(destination);
  if (stat.size < 50_000 || stat.size > MAX_FILE_BYTES) {
    throw new Error(asset.id + ": unexpected downloaded size " + stat.size + " bytes");
  }
  const handle = await fsp.open(destination, "r");
  const signature = Buffer.alloc(12);
  await handle.read(signature, 0, 12, 0);
  await handle.close();
  if (signature.toString("ascii", 4, 8) !== "ftyp") throw new Error(asset.id + ": file is not an MP4 container");
  return { sizeBytes: stat.size, finalUrl: response.url };
}

async function main() {
  await fsp.mkdir(MEDIA_ROOT, { recursive: true });
  await fsp.mkdir(PREVIEW_ROOT, { recursive: true });
  const register = JSON.parse(await fsp.readFile(REGISTER_PATH, "utf8"));
  const byId = new Map(register.assets.map(asset => [asset.id, asset]));
  const assets = APPROVED_IDS.map(id => {
    const asset = byId.get(id);
    if (!asset) throw new Error("missing registered source " + id);
    if (asset.userApproval !== "EXPLICITLY_APPROVED") {
      throw new Error(id + ": acquisition requires explicit owner approval; in-principle approval is insufficient");
    }
    if (!asset.downloadUrl || !asset.sourceUrl || !Number.isFinite(asset.durationSeconds)
        || !Number.isInteger(asset.width) || !Number.isInteger(asset.height) || !Number.isFinite(asset.fps)) {
      throw new Error(id + ": source page, direct URL or expected media properties are incomplete");
    }
    if (new URL(asset.sourceUrl).protocol !== "https:" || new URL(asset.sourceUrl).hostname !== "www.pexels.com") {
      throw new Error(id + ": source page must be the official HTTPS Pexels site");
    }
    return asset;
  });

  const acquired = [];
  for (const asset of assets) {
    const filename = asset.id + ".mp4";
    const destination = path.join(MEDIA_ROOT, filename);
    const downloaded = await downloadPexels(asset, destination);
    const actual = probeMedia(destination);
    if (!actual.video) throw new Error(asset.id + ": no video stream");
    if (Math.abs(actual.durationSeconds - asset.durationSeconds) > 1.5) {
      throw new Error(asset.id + ": duration mismatch; source page " + asset.durationSeconds + "s, file " + actual.durationSeconds.toFixed(3) + "s");
    }
    if (actual.video.width !== asset.width || actual.video.height !== asset.height) {
      throw new Error(asset.id + ": resolution mismatch; expected " + asset.width + "x" + asset.height
        + ", got " + actual.video.width + "x" + actual.video.height);
    }
    if (actual.video.fps !== null && Math.abs(actual.video.fps - asset.fps) > 0.6) {
      throw new Error(asset.id + ": frame-rate mismatch; expected " + asset.fps + ", got " + actual.video.fps);
    }
    const previewPath = path.join(PREVIEW_ROOT, asset.id + ".jpg");
    const seek = Math.max(0.1, Math.min(actual.durationSeconds / 2, actual.durationSeconds - 0.1));
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", seek.toFixed(3), "-i", destination,
      "-frames:v", "1",
      "-vf", "scale=270:480:force_original_aspect_ratio=decrease,pad=270:480:(ow-iw)/2:(oh-ih)/2",
      "-q:v", "3", previewPath
    ], "preview frame " + asset.id);

    acquired.push({
      assetId: asset.id,
      title: asset.title,
      contributor: asset.contributor,
      ownerSelectionStatus: asset.userApproval,
      sourcePage: asset.sourceUrl,
      directDownloadUrl: asset.downloadUrl,
      pexelsLicenseReference: LICENSE_URL,
      sourcePageDurationSeconds: asset.durationSeconds,
      actual,
      downloadedBytes: downloaded.sizeBytes,
      sha256: sha256File(destination),
      mediaFile: "media/" + filename,
      previewFrame: "preview/" + asset.id + ".jpg",
      downloadedFrom: downloaded.finalUrl,
      rightsVerified: false,
      humanReviewed: false,
      releaseEligible: false
    });
  }

  const contactSheet = path.join(PREVIEW_ROOT, "short-001-contact-sheet.jpg");
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-pattern_type", "glob", "-framerate", "1",
    "-i", path.join(PREVIEW_ROOT, "pexels-*.jpg"),
    "-vf", "tile=4x1:padding=8:margin=8",
    "-frames:v", "1", contactSheet
  ], "Short 001 contact sheet");

  const manifest = {
    schemaVersion: 1,
    project: "SonicVhibez",
    contentId: "short-001-wildlife-video-storytelling",
    status: "ACQUIRED_FOR_OWNER_REVIEW_NOT_RELEASE_CLEARED",
    createdAt: new Date().toISOString(),
    sourceSelection: "Four clips explicitly approved by the owner",
    pexelsLicense: {
      url: LICENSE_URL,
      generalLicenseIsNotProofOfAllThirdPartyRights: true,
      sourceSelectionApprovalIsNotFinalReleaseApproval: true,
      standaloneUnmodifiedRedistributionAllowed: false
    },
    assets: acquired,
    previews: { contactSheet: "preview/short-001-contact-sheet.jpg" },
    release: {
      rightsConfirmed: false,
      humanComplianceReview: false,
      finalVideoHumanReview: false,
      metadataApproval: false,
      publicPublishingEnabled: false,
      privateUploadAuthorized: false,
      releaseEligible: false
    }
  };
  await fsp.writeFile(
    path.join(OUTPUT_ROOT, "short-001-acquisition-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  console.log(JSON.stringify({
    status: manifest.status,
    assetCount: acquired.length,
    totalActualSourceSeconds: acquired.reduce((sum, item) => sum + item.actual.durationSeconds, 0),
    contactSheet,
    manifest: path.join(OUTPUT_ROOT, "short-001-acquisition-manifest.json"),
    releaseEligible: false
  }, null, 2));
}

main().catch(error => {
  console.error("BLOCKED:", error.message);
  process.exit(1);
});
