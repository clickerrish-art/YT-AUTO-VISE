import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REGISTER_PATH = path.join(ROOT, "content/media/pexels-user-shared-candidates-2026-11-22.json");
const OWNER_POLICY_PATH = path.join(ROOT, "content/owner-media-policy-override-2026-11-22.json");
const APPROVED_POLICY_PATH = path.join(ROOT, "content/approved-pexels-footage.json");
const OUTPUT_ROOT = path.join(ROOT, "artifacts/previously-shared-pexels-candidates");
const MEDIA_DIR = path.join(OUTPUT_ROOT, "media");
const PREVIEW_DIR = path.join(OUTPUT_ROOT, "preview");
const MAX_FILE_BYTES = 500 * 1024 * 1024;

const SELECTED_IDS = [
  "pexels-video-8268897",
  "pexels-video-9655785",
  "pexels-video-30175165",
  "pexels-video-2835528"
];

const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const safeSlug = value => value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");

function parseFps(value) {
  if (typeof value !== "string" || !value.includes("/")) return null;
  const [numerator, denominator] = value.split("/").map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

function probe(file) {
  const raw = execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_type,codec_name,width,height,avg_frame_rate,sample_rate,channels",
    "-show_entries", "format=duration,size",
    "-of", "json", file
  ], { encoding: "utf8" });
  const parsed = JSON.parse(raw);
  const video = (parsed.streams ?? []).find(stream => stream.codec_type === "video");
  assert(video, `No video stream in ${path.basename(file)}`);
  return {
    codec: video.codec_name ?? null,
    width: video.width ?? null,
    height: video.height ?? null,
    fps: parseFps(video.avg_frame_rate),
    durationSeconds: Number(parsed.format?.duration ?? 0),
    fileSizeBytes: Number(parsed.format?.size ?? fs.statSync(file).size),
    audioStreams: (parsed.streams ?? []).filter(stream => stream.codec_type === "audio").length
  };
}

async function download(url, destination) {
  const parsed = new URL(url);
  assert(parsed.protocol === "https:" && parsed.hostname === "videos.pexels.com",
    `Refusing non-Pexels media host: ${parsed.hostname}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
  assert(response.ok && response.body, `Pexels download failed: HTTP ${response.status}`);
  const announced = Number(response.headers.get("content-length") ?? 0);
  assert(!announced || announced <= MAX_FILE_BYTES, "Pexels source exceeds the 500 MB per-file review limit.");
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination, { flags: "wx" }));
  const size = fs.statSync(destination).size;
  assert(size > 0 && size <= MAX_FILE_BYTES, "Downloaded Pexels source is empty or exceeds the 500 MB review limit.");
  return size;
}

async function sha256File(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

function fullDecode(file) {
  execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-i", file, "-f", "null", "-"], {
    stdio: "pipe",
    timeout: 180000
  });
}

function makePreviewFrame(file, destination, durationSeconds) {
  const seek = Math.max(0, durationSeconds / 2).toFixed(3);
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-ss", seek, "-i", file,
    "-frames:v", "1",
    "-vf", "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
    destination
  ], { stdio: "pipe", timeout: 60000 });
}

function validatePolicy() {
  const owner = readJson(OWNER_POLICY_PATH);
  const approved = readJson(APPROVED_POLICY_PATH);
  const current = approved.currentProductionPolicy ?? {};
  assert(owner.status === "ACTIVE_WITH_ASSET_LEVEL_REVIEW_GATES", "Owner Pexels/Pixabay media override is not active.");
  assert(owner.mediaRules?.pexelsLicensedStockAllowed === true, "Owner policy does not allow Pexels video footage.");
  assert(owner.mediaRules?.stockVideoFootageAllowed === true, "Owner policy does not allow licensed stock video.");
  assert(owner.mediaRules?.stockPhotographsAllowed === false, "Stock photographs must remain disabled.");
  assert(owner.mediaRules?.aiGeneratedWildlifeVisualsAllowed === false, "AI wildlife visuals must remain prohibited.");
  assert(current.stockMediaAllowed === true && current.pexelsAllowed === true &&
    current.aiGeneratedWildlifeVisualsAllowed === false, "Approved Pexels policy register is missing or unsafe.");
}

async function main() {
  validatePolicy();
  const register = readJson(REGISTER_PATH);
  const skippedExisting = [];
  const assets = SELECTED_IDS.map(id => {
    const asset = register.assets.find(candidate => candidate.assetId === id);
    assert(asset, `Required user-shared Pexels asset is missing from register: ${id}`);
    if (asset.sourceFileStatus === "ACQUIRED_IN_REVIEW_ARTIFACT_SHA256_AND_FULL_DECODE_PASS" &&
        asset.acquisitionArtifactId && /^[a-f0-9]{64}$/i.test(asset.sha256 ?? "")) {
      skippedExisting.push({
        assetId: asset.assetId,
        title: asset.title,
        sourceFileStatus: asset.sourceFileStatus,
        acquisitionArtifactId: asset.acquisitionArtifactId,
        acquisitionWorkflowRunId: asset.acquisitionWorkflowRunId ?? null,
        sha256: asset.sha256,
        actual: asset.actual ?? null,
        mediaFile: asset.mediaFile ?? null,
        releaseEligible: false
      });
      return null;
    }
    assert(asset.sourceFileStatus === "NOT_DOWNLOADED", `Asset status is neither pending nor safely acquired: ${id}`);
    assert(asset.downloadUrl, `Exact Pexels direct download URL is missing: ${id}`);
    assert(asset.sourceMatchStatus !== "POSSIBLE_MATCH_NOT_CONFIRMED_DURATION_MISMATCH",
      `Unconfirmed source match cannot enter automatic acquisition: ${id}`);
    return asset;
  }).filter(Boolean);
  assert(assets.length + skippedExisting.length === 4, "Expected four confirmed user-shared non-crocodile Pexels sources.");

  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const results = [];

  for (const asset of assets) {
    const sourcePage = new URL(asset.sourceUrl);
    assert(sourcePage.protocol === "https:" &&
      (sourcePage.hostname === "pexels.com" || sourcePage.hostname.endsWith(".pexels.com")),
      `Invalid Pexels source page for ${asset.assetId}`);

    const slug = safeSlug(asset.assetId);
    const destination = path.join(MEDIA_DIR, `${slug}.mp4`);
    const preview = path.join(PREVIEW_DIR, `${slug}.jpg`);
    const downloadedBytes = await download(asset.downloadUrl, destination);
    const actual = probe(destination);
    const [expectedWidth, expectedHeight] = asset.resolution.split("x").map(Number);
    const expectedDuration = Number(asset.sourcePageDurationSeconds);
    const allowedFps = asset.acceptedDownloadFps ?? [asset.downloadUrlAdvertisedFps];

    assert(actual.width === expectedWidth && actual.height === expectedHeight,
      `Resolution mismatch for ${asset.assetId}: ${actual.width}x${actual.height}`);
    assert(Math.abs(actual.durationSeconds - expectedDuration) <= 2,
      `Duration mismatch for ${asset.assetId}: ${actual.durationSeconds}s vs page ${expectedDuration}s`);
    assert(allowedFps.some(fps => Math.abs(actual.fps - fps) <= 0.05),
      `Frame-rate mismatch for ${asset.assetId}: actual ${actual.fps}; accepted ${allowedFps.join(",")}`);

    fullDecode(destination);
    makePreviewFrame(destination, preview, actual.durationSeconds);
    const sha256 = await sha256File(destination);

    results.push({
      assetId: asset.assetId,
      contributor: asset.contributor,
      title: asset.title,
      sourceUrl: asset.sourceUrl,
      downloadUrl: asset.downloadUrl,
      sourcePageDurationSeconds: expectedDuration,
      sourcePageResolution: asset.resolution,
      sourcePageFps: asset.fps,
      downloadUrlAdvertisedFps: asset.downloadUrlAdvertisedFps,
      acceptedDownloadFps: allowedFps,
      fpsMetadataMismatch: Number(asset.fps) !== Number(asset.downloadUrlAdvertisedFps),
      actual,
      downloadedBytes,
      sha256,
      mediaFile: `media/${slug}.mp4`,
      previewFrame: `preview/${slug}.jpg`,
      sourceMatchStatus: asset.sourceMatchStatus,
      editorialRisk: asset.editorialRisk,
      platformLicenseReviewed: true,
      thirdPartyRightsReviewed: false,
      humanReviewed: false,
      selectedForProduction: false,
      productionEligible: false,
      releaseEligible: false,
      fullDecode: "PASS",
      technicalProbe: "PASS"
    });
  }

  let contactSheet = null;
  if (results.length > 0) {
    contactSheet = path.join(PREVIEW_DIR, "previously-shared-pexels-contact-sheet.jpg");
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-pattern_type", "glob", "-framerate", "1",
      "-i", path.join(PREVIEW_DIR, "*.jpg"),
      "-vf", "tile=4x1:padding=12:margin=12",
      "-frames:v", "1", contactSheet
    ], { stdio: "pipe", timeout: 60000 });
  }

  const manifest = {
    schemaVersion: 1,
    project: "SonicVhibez",
    createdAt: new Date().toISOString(),
    sourceSelection: "Four previously shared Pexels wildlife clips with confirmed creator/subject source-page matches. Possible Magda Ehlers meerkat match 33260728 is excluded pending source identity reconciliation. Crocodile 30026544 is already in the separate crocodile acquisition artifact and is not duplicated.",
    license: {
      platform: "Pexels",
      licenseName: "Pexels License",
      licenseUrl: "https://www.pexels.com/license/",
      freeUseListingVerified: true,
      thirdPartyRightsAutomaticallyCleared: false
    },
    assetCount: results.length,
    alreadyAcquiredCount: skippedExisting.length,
    alreadyAcquiredAssets: skippedExisting,
    newAssetsAcquired: results.length > 0,
    totalActualSourceSeconds: Number(results.reduce((sum, asset) => sum + asset.actual.durationSeconds, 0).toFixed(6)),
    fullDecodePasses: results.filter(asset => asset.fullDecode === "PASS").length,
    assets: results,
    release: {
      status: "REVIEW_ONLY_NOT_APPROVED",
      thirdPartyRightsReviewed: false,
      humanVisualReview: false,
      selectedForProduction: false,
      releaseEligible: false,
      publicPublishingEnabled: false
    },
    notes: [
      "All original MP4s are retained unchanged; review copies and contact sheet are separate.",
      "Two Pexels pages list 50fps while their direct CDN filenames advertise 25fps. The actual frame rate is recorded from ffprobe; no retiming or relabelling is performed.",
      "The PMA Rakson elephant page tags suggest Asian elephant context. Do not narrate as African elephant without species confirmation.",
      "Platform licence review is not third-party-rights clearance or publication approval."
    ],
    contactSheet: contactSheet ? "preview/previously-shared-pexels-contact-sheet.jpg" : null
  };

  fs.writeFileSync(path.join(OUTPUT_ROOT, "acquisition-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, "new_assets=" + String(results.length > 0) + "\n");
  }
  console.log(JSON.stringify({
    assetCount: manifest.assetCount,
    alreadyAcquiredCount: manifest.alreadyAcquiredCount,
    newAssetsAcquired: manifest.newAssetsAcquired,
    totalActualSourceSeconds: manifest.totalActualSourceSeconds,
    fullDecodePasses: manifest.fullDecodePasses,
    assets: results.map(asset => ({
      assetId: asset.assetId,
      sha256: asset.sha256,
      fileSizeBytes: asset.actual.fileSizeBytes,
      durationSeconds: asset.actual.durationSeconds,
      width: asset.actual.width,
      height: asset.actual.height,
      fps: asset.actual.fps,
      fullDecode: asset.fullDecode
    })),
    contactSheet: manifest.contactSheet,
    release: manifest.release
  }, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
