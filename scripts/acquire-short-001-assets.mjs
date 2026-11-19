#!/usr/bin/env node
/**
 * Zero-cost acquisition of the five approved/approved-in-principle Pexels
 * source clips plus the already-generated Roderic WAV for Short 001.
 * Downloads, probes, hashes and creates a contact sheet only.
 * Does not render, approve, upload, schedule or publish.
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
const NARRATION_PATH = path.join(ROOT, "content/short-001-roderic-narration-generation.json");
const OUTPUT_ROOT = path.join(ROOT, "artifacts/short-001");
const MEDIA_ROOT = path.join(OUTPUT_ROOT, "media");
const PREVIEW_ROOT = path.join(OUTPUT_ROOT, "preview");
const LICENSE_URL = "https://www.pexels.com/license/";
const SHORT_ASSET_IDS = [
  "pexels-29765785",
  "pexels-11760785",
  "pexels-11528208",
  "pexels-31702128",
  "pexels-37425422"
];
const MAX_FILE_BYTES = 300 * 1024 * 1024;

function fail(message) {
  console.error("BLOCKED:", message);
  process.exit(1);
}

function run(command, args, label) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 180_000, maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr || result.stdout || ("exit " + result.status);
    throw new Error(label + ": " + detail);
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
    "-show_entries", "format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate,sample_rate,channels",
    "-of", "json", file
  ], "ffprobe " + path.basename(file));
  const data = JSON.parse(raw);
  const video = data.streams?.find(stream => stream.codec_type === "video") ?? null;
  const audio = data.streams?.find(stream => stream.codec_type === "audio") ?? null;
  const durationSeconds = Number(data.format?.duration);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error("invalid duration in " + file);
  return {
    durationSeconds,
    sizeBytes: Number(data.format?.size ?? fs.statSync(file).size),
    video: video ? {
      codec: video.codec_name,
      width: video.width,
      height: video.height,
      fps: rateValue(video.avg_frame_rate)
    } : null,
    audio: audio ? {
      codec: audio.codec_name,
      sampleRate: Number(audio.sample_rate),
      channels: Number(audio.channels)
    } : null
  };
}

async function download(url, destination, allowedHost, label) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== allowedHost) {
    throw new Error(label + ": URL host must be exactly " + allowedHost);
  }
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(180_000),
    headers: { "User-Agent": "SonicVhibez-Free-Media-Acquisition/1.0" }
  });
  if (!response.ok || !response.body) throw new Error(label + ": HTTP " + response.status);
  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== "https:" || finalUrl.hostname !== allowedHost) {
    throw new Error(label + ": redirect left the allowlisted host");
  }
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination, { flags: "wx" }));
  const stat = await fsp.stat(destination);
  if (stat.size < 50_000 || stat.size > MAX_FILE_BYTES) {
    throw new Error(label + ": unexpected file size " + stat.size + " bytes");
  }
  return { sizeBytes: stat.size, finalUrl: response.url };
}

async function main() {
  await fsp.mkdir(MEDIA_ROOT, { recursive: true });
  await fsp.mkdir(PREVIEW_ROOT, { recursive: true });
  const register = JSON.parse(await fsp.readFile(REGISTER_PATH, "utf8"));
  const narrationEvidence = JSON.parse(await fsp.readFile(NARRATION_PATH, "utf8"));
  const byId = new Map(register.assets.map(asset => [asset.id, asset]));
  const assets = SHORT_ASSET_IDS.map(id => {
    const asset = byId.get(id);
    if (!asset) throw new Error("missing registered source " + id);
    if (!["EXPLICITLY_APPROVED", "ADDITIONAL_PEXELS_FOOTAGE_APPROVED_IN_PRINCIPLE"].includes(asset.userApproval)) {
      throw new Error(id + " has no owner-approved source-selection status");
    }
    if (!asset.downloadUrl || !asset.sourceUrl || !Number.isFinite(asset.durationSeconds)) {
      throw new Error(id + " is missing its source page, direct URL or expected duration");
    }
    if (new URL(asset.sourceUrl).hostname !== "www.pexels.com") {
      throw new Error(id + " source page is not an official Pexels page");
    }
    return asset;
  });
  const audioUrl = narrationEvidence.synthesis?.audioUrl;
  const voiceId = narrationEvidence.voice?.voiceId;
  const expectedAudioDuration = narrationEvidence.synthesis?.durationSeconds;
  if (!audioUrl || voiceId !== "b5c5b28db1ea408abc7d851202983bdb" || !Number.isFinite(expectedAudioDuration)) {
    throw new Error("Roderic narration evidence is incomplete or does not match the approved voice");
  }

  const acquiredAssets = [];
  for (const asset of assets) {
    const filename = asset.id + ".mp4";
    const destination = path.join(MEDIA_ROOT, filename);
    const downloaded = await download(asset.downloadUrl, destination, "videos.pexels.com", asset.id);
    const header = await fsp.open(destination, "r");
    const signature = Buffer.alloc(12);
    await header.read(signature, 0, 12, 0);
    await header.close();
    if (signature.toString("ascii", 4, 8) !== "ftyp") throw new Error(asset.id + ": downloaded file is not an MP4 container");
    const probe = probeMedia(destination);
    if (!probe.video) throw new Error(asset.id + ": no video stream");
    if (Math.abs(probe.durationSeconds - asset.durationSeconds) > 1.5) {
      throw new Error(asset.id + ": source duration mismatch; page=" + asset.durationSeconds + "s file=" + probe.durationSeconds.toFixed(3) + "s");
    }
    if (probe.video.width !== asset.width || probe.video.height !== asset.height) {
      throw new Error(asset.id + ": resolution mismatch; expected " + asset.width + "x" + asset.height + ", got " + probe.video.width + "x" + probe.video.height);
    }
    if (probe.video.fps !== null && Math.abs(probe.video.fps - asset.fps) > 0.6) {
      throw new Error(asset.id + ": frame-rate mismatch; expected " + asset.fps + ", got " + probe.video.fps);
    }
    const framePath = path.join(PREVIEW_ROOT, asset.id + ".jpg");
    const seek = Math.max(0.1, Math.min(probe.durationSeconds / 2, probe.durationSeconds - 0.1));
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", seek.toFixed(3), "-i", destination,
      "-frames:v", "1",
      "-vf", "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
      "-q:v", "3", framePath
    ], "preview frame " + asset.id);
    acquiredAssets.push({
      assetId: asset.id,
      title: asset.title,
      contributor: asset.contributor,
      ownerApproval: asset.userApproval,
      sourceUrl: asset.sourceUrl,
      directDownloadUrl: asset.downloadUrl,
      licenseUrl: LICENSE_URL,
      expectedSourceDurationSeconds: asset.durationSeconds,
      actual: probe,
      sizeBytes: downloaded.sizeBytes,
      sha256: sha256File(destination),
      file: "media/" + filename,
      previewFrame: "preview/" + asset.id + ".jpg",
      releaseEligible: false
    });
  }

  const audioFilename = "short-001-roderic-narration.wav";
  const audioDestination = path.join(MEDIA_ROOT, audioFilename);
  const audioDownload = await download(audioUrl, audioDestination, "resource2.heygen.ai", "Roderic narration");
  const wavHeader = await fsp.open(audioDestination, "r");
  const wavSignature = Buffer.alloc(12);
  await wavHeader.read(wavSignature, 0, 12, 0);
  await wavHeader.close();
  if (wavSignature.toString("ascii", 0, 4) !== "RIFF" || wavSignature.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Roderic narration response is not a WAV file");
  }
  const audioProbe = probeMedia(audioDestination);
  if (!audioProbe.audio || audioProbe.video) throw new Error("Roderic narration must contain audio only");
  if (Math.abs(audioProbe.durationSeconds - expectedAudioDuration) > 0.25) {
    throw new Error("Roderic audio duration mismatch; expected " + expectedAudioDuration + "s, got " + audioProbe.durationSeconds.toFixed(3) + "s");
  }

  const contactSheet = path.join(PREVIEW_ROOT, "short-001-contact-sheet.jpg");
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-pattern_type", "glob", "-framerate", "1",
    "-i", path.join(PREVIEW_ROOT, "pexels-*.jpg"),
    "-vf", "tile=5x1:padding=8:margin=8",
    "-frames:v", "1", contactSheet
  ], "Short 001 contact sheet");

  const manifest = {
    schemaVersion: 1,
    project: "SonicVhibez",
    contentId: "short-001-wildlife-video-storytelling",
    status: "ACQUIRED_FOR_REVIEW_NOT_RELEASE_CLEARED",
    createdAt: new Date().toISOString(),
    pexelsLicense: {
      url: LICENSE_URL,
      sourceSelectionApprovalIsNotFinalReleaseApproval: true,
      standaloneUnmodifiedRedistributionAllowed: false
    },
    assets: acquiredAssets,
    narration: {
      provider: "HeyGen Voice",
      voiceName: narrationEvidence.voice.name,
      voiceId,
      accountPlan: narrationEvidence.synthesis.accountPlanEvidence?.plan ?? "not recorded",
      durationSeconds: audioProbe.durationSeconds,
      sizeBytes: audioDownload.sizeBytes,
      sha256: sha256File(audioDestination),
      file: "media/" + audioFilename,
      wordTimedCaptionsPath: "content/short-001-wildlife-video-storytelling.srt",
      releaseEligible: false
    },
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
  await fsp.writeFile(path.join(OUTPUT_ROOT, "short-001-acquisition-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(JSON.stringify({
    status: manifest.status,
    assetCount: acquiredAssets.length,
    totalSourceSeconds: acquiredAssets.reduce((sum, asset) => sum + asset.actual.durationSeconds, 0),
    narrationDurationSeconds: audioProbe.durationSeconds,
    contactSheet,
    manifest: path.join(OUTPUT_ROOT, "short-001-acquisition-manifest.json"),
    releaseEligible: false
  }, null, 2));
}

main().catch(error => fail(error.message));
