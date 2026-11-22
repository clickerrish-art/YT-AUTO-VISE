import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const API_KEY = process.env.PEXELS_API_KEY;
const OUTPUT_ROOT = path.join(ROOT, "artifacts/official-api-pexels-review");
const MEDIA_DIR = path.join(OUTPUT_ROOT, "media");
const PREVIEW_DIR = path.join(OUTPUT_ROOT, "preview");
const MAX_FILE_BYTES = 500 * 1024 * 1024;
const MAX_TOTAL_BYTES = 3 * 1024 * 1024 * 1024;
const API_BASE = "https://api.pexels.com/v1/videos/videos/";

const readJson = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const safeSlug = value => value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");

function normalizedName(value) {
  return String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");
}
function parseFps(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !value.includes("/")) return Number(value) || null;
  const [n, d] = value.split("/").map(Number);
  return Number.isFinite(n) && Number.isFinite(d) && d !== 0 ? n / d : null;
}
function numericId(value) {
  const match = String(value ?? "").match(/(\d{5,})/);
  return match ? Number(match[1]) : null;
}
function buildSourceInventory() {
  const approved = readJson("content/approved-pexels-footage.json");
  const crocodile = readJson("content/media/pexels-crocodile-candidates-2026-11-22.json");
  const userShared = readJson("content/media/pexels-user-shared-candidates-2026-11-22.json");
  const byId = new Map();

  const add = (idValue, source) => {
    const id = numericId(idValue) ?? numericId(source.sourceUrl);
    if (!id || !source.sourceUrl) return;
    const existing = byId.get(id);
    if (existing) {
      existing.sourceGroups = [...new Set([...existing.sourceGroups, source.sourceGroup])];
      existing.canvaAssetId ??= source.canvaAssetId ?? null;
      existing.expectedCreator ??= source.expectedCreator ?? null;
      existing.editorialNotes = [...new Set([...existing.editorialNotes, source.editorialNotes].filter(Boolean))];
      return;
    }
    byId.set(id, {
      id,
      title: source.title ?? `Pexels video ${id}`,
      sourceUrl: source.sourceUrl,
      expectedCreator: source.expectedCreator ?? null,
      expectedDurationSeconds: source.expectedDurationSeconds ?? null,
      expectedWidth: source.expectedWidth ?? null,
      expectedHeight: source.expectedHeight ?? null,
      expectedFps: source.expectedFps ?? null,
      canvaAssetId: source.canvaAssetId ?? null,
      sourceGroups: [source.sourceGroup],
      ownerApproval: source.ownerApproval ?? null,
      editorialStatus: source.editorialStatus ?? "REVIEW_ONLY_PENDING_FULL_PLAYBACK",
      editorialExcluded: source.editorialExcluded === true,
      editorialNotes: [source.editorialNotes].filter(Boolean),
      platformLicenseReviewed: true
    });
  };

  for (const asset of approved.assets ?? []) {
    add(asset.id, {
      sourceUrl: asset.sourceUrl,
      title: asset.title,
      expectedCreator: asset.contributor,
      expectedDurationSeconds: asset.durationSeconds,
      expectedWidth: asset.width,
      expectedHeight: asset.height,
      expectedFps: asset.fps,
      sourceGroup: asset.group === "primary" ? "approved-primary" : "approved-supplemental",
      ownerApproval: asset.userApproval,
      editorialStatus: asset.currentProductionEligibility ?? "REVIEW_ONLY_PENDING_FULL_PLAYBACK",
      editorialExcluded: asset.excludedFromProduction === true,
      editorialNotes: asset.exclusionReason ?? null
    });
  }

  for (const asset of crocodile.assets ?? []) {
    if (!asset.canvaAssetId || asset.assetId === "pexels-video-20443910") continue;
    add(asset.assetId, {
      sourceUrl: asset.sourceUrl,
      title: asset.title,
      expectedCreator: asset.creator,
      expectedDurationSeconds: asset.actual?.durationSeconds ?? asset.durationSeconds,
      expectedWidth: asset.actual?.width ?? asset.width,
      expectedHeight: asset.actual?.height ?? asset.height,
      expectedFps: asset.actual?.fps ?? asset.fps,
      canvaAssetId: asset.canvaAssetId,
      sourceGroup: "crocodile-long-form",
      editorialStatus: "REVIEW_ONLY_PENDING_FULL_PLAYBACK",
      editorialNotes: asset.editorialRisk ?? null
    });
  }

  const confirmedUserShared = new Set([
    "pexels-video-8268897",
    "pexels-video-9655785",
    "pexels-video-30175165",
    "pexels-video-2835528"
  ]);
  for (const asset of userShared.assets ?? []) {
    if (!confirmedUserShared.has(asset.assetId)) continue;
    add(asset.assetId, {
      sourceUrl: asset.sourceUrl,
      title: asset.title,
      expectedCreator: asset.contributor,
      expectedDurationSeconds: asset.sourcePageDurationSeconds,
      expectedWidth: Number(asset.resolution.split("x")[0]),
      expectedHeight: Number(asset.resolution.split("x")[1]),
      expectedFps: asset.fps,
      sourceGroup: "previously-shared-user-footage",
      editorialStatus: "REVIEW_ONLY_PENDING_FULL_PLAYBACK",
      editorialNotes: asset.editorialRisk ?? null
    });
  }

  return [...byId.values()].sort((a, b) => a.id - b.id);
}

async function fetchVideo(id) {
  const response = await fetch(`${API_BASE}${id}`, {
    headers: { Authorization: API_KEY, Accept: "application/json" },
    signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error(`Pexels API returned HTTP ${response.status} for video ID ${id}`);
  return response.json();
}

async function downloadFile(url, destination) {
  const parsed = new URL(url);
  const allowedHosts = new Set(["player.vimeo.com", "videos.pexels.com", "static-videos.pexels.com"]);
  assert(parsed.protocol === "https:" && allowedHosts.has(parsed.hostname),
    `Pexels API returned an unexpected video host: ${parsed.hostname}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(240000) });
  assert(response.ok && response.body, `Pexels video download failed: HTTP ${response.status}`);
  const announced = Number(response.headers.get("content-length") ?? 0);
  assert(!announced || announced <= MAX_FILE_BYTES, "Pexels video exceeds 500 MB per-file limit.");
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination, { flags: "wx" }));
  const size = fs.statSync(destination).size;
  assert(size > 0 && size <= MAX_FILE_BYTES, "Pexels video is empty or exceeds the 500 MB per-file limit.");
  return size;
}

function probe(file) {
  const data = JSON.parse(execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_type,codec_name,width,height,avg_frame_rate,sample_rate,channels",
    "-show_entries", "format=duration,size",
    "-of", "json", file
  ], { encoding: "utf8" }));
  const video = (data.streams ?? []).find(stream => stream.codec_type === "video");
  assert(video, `No video stream in ${path.basename(file)}`);
  return {
    codec: video.codec_name ?? null,
    width: video.width ?? null,
    height: video.height ?? null,
    fps: parseFps(video.avg_frame_rate),
    durationSeconds: Number(data.format?.duration ?? 0),
    fileSizeBytes: Number(data.format?.size ?? fs.statSync(file).size),
    audioStreams: (data.streams ?? []).filter(stream => stream.codec_type === "audio").length
  };
}
function fullDecode(file) {
  execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-i", file, "-f", "null", "-"], {
    stdio: "pipe", timeout: 240000
  });
}
function makePreview(file, destination, duration) {
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-ss", Math.max(0, duration / 2).toFixed(3), "-i", file,
    "-frames:v", "1",
    "-vf", "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
    destination
  ], { stdio: "pipe", timeout: 60000 });
}
async function hashFile(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function main() {
  assert(API_KEY, "PEXELS_API_KEY is missing. Add it as a GitHub Actions repository secret; never paste it into chat.");
  const owner = readJson("content/owner-media-policy-override-2026-11-22.json");
  const policy = readJson("content/approved-pexels-footage.json").currentProductionPolicy;
  assert(owner.status === "ACTIVE_WITH_ASSET_LEVEL_REVIEW_GATES" &&
    owner.mediaRules?.pexelsLicensedStockAllowed === true &&
    owner.mediaRules?.aiGeneratedWildlifeVisualsAllowed === false &&
    policy?.pexelsAllowed === true, "Pexels owner media policy is not active or is unsafe.");

  const assets = buildSourceInventory();
  assert(assets.length >= 20, `Unexpected Pexels source inventory size: ${assets.length}`);
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const results = [];
  const errors = [];
  let totalBytes = 0;

  for (const asset of assets) {
    try {
      const video = await fetchVideo(asset.id);
      assert(Number(video.id) === asset.id, `Pexels API returned the wrong video ID for ${asset.id}`);
      const apiCreator = video.user?.name ?? null;
      const creatorMatch = !asset.expectedCreator ||
        normalizedName(apiCreator) === normalizedName(asset.expectedCreator);
      if (!creatorMatch) throw new Error(`Pexels creator mismatch for ${asset.id}: expected ${asset.expectedCreator}, API returned ${apiCreator}`);

      const files = (video.video_files ?? [])
        .filter(file => file.file_type === "video/mp4" && file.link && file.width && file.height)
        .sort((a, b) => (b.width * b.height) - (a.width * a.height) ||
          (Number(b.fps) || 0) - (Number(a.fps) || 0));
      assert(files.length > 0, `Pexels API returned no MP4 video files for ${asset.id}`);
      const chosen = files[0];
      const destination = path.join(MEDIA_DIR, `pexels-${asset.id}.mp4`);
      const preview = path.join(PREVIEW_DIR, `pexels-${asset.id}.jpg`);
      const downloadedBytes = await downloadFile(chosen.link, destination);
      totalBytes += downloadedBytes;
      assert(totalBytes <= MAX_TOTAL_BYTES, "Pexels acquisition exceeds the 3 GB total review-artifact limit.");

      const actual = probe(destination);
      assert(actual.width === chosen.width && actual.height === chosen.height,
        `Pexels API/ffprobe resolution mismatch for ${asset.id}`);
      assert(Math.abs(actual.durationSeconds - Number(video.duration)) <= 2,
        `Pexels API/ffprobe duration mismatch for ${asset.id}`);
      if (chosen.fps && actual.fps) assert(Math.abs(actual.fps - Number(chosen.fps)) <= 0.1,
        `Pexels API/ffprobe frame-rate mismatch for ${asset.id}`);
      fullDecode(destination);
      makePreview(destination, preview, actual.durationSeconds);
      const sha256 = await hashFile(destination);
      const link = new URL(chosen.link);

      results.push({
        assetId: asset.id,
        title: asset.title,
        sourceUrl: asset.sourceUrl,
        sourceGroups: asset.sourceGroups,
        canvaAssetId: asset.canvaAssetId,
        expectedCreator: asset.expectedCreator,
        apiCreator,
        creatorMatch,
        apiDurationSeconds: video.duration,
        apiSourceWidth: video.width,
        apiSourceHeight: video.height,
        selectedFile: {
          quality: chosen.quality ?? null,
          width: chosen.width,
          height: chosen.height,
          fps: chosen.fps ?? null,
          fileType: chosen.file_type,
          downloadHost: link.hostname,
          downloadPath: link.pathname
        },
        actual,
        fileSizeBytes: downloadedBytes,
        sha256,
        mediaFile: `media/pexels-${asset.id}.mp4`,
        previewFrame: `preview/pexels-${asset.id}.jpg`,
        editorialStatus: asset.editorialStatus,
        editorialExcluded: asset.editorialExcluded,
        editorialNotes: asset.editorialNotes,
        attributionText: `Video by ${apiCreator} on Pexels`,
        attributionUrl: asset.sourceUrl,
        fullDecode: "PASS",
        technicalProbe: "PASS",
        thirdPartyRightsReviewed: false,
        humanReviewed: false,
        selectedForProduction: false,
        productionEligible: false,
        releaseEligible: false
      });
    } catch (error) {
      errors.push({ assetId: asset.id, title: asset.title, sourceUrl: asset.sourceUrl, error: error.message });
    }
    await new Promise(resolve => setTimeout(resolve, 350));
  }

  if (results.length === 0) throw new Error(`No Pexels assets acquired. ${errors.length} API/acquisition errors.`);
  const columns = 4;
  const rows = Math.ceil(results.length / columns);
  const contactSheet = path.join(PREVIEW_DIR, "pexels-official-api-contact-sheet.jpg");
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-pattern_type", "glob", "-framerate", "1",
    "-i", path.join(PREVIEW_DIR, "*.jpg"),
    "-vf", `tile=${columns}x${rows}:padding=12:margin=12`,
    "-frames:v", "1", contactSheet
  ], { stdio: "pipe", timeout: 120000 });

  const manifest = {
    schemaVersion: 1,
    project: "SonicVhibez",
    createdAt: new Date().toISOString(),
    status: errors.length ? "PARTIAL_OFFICIAL_API_ACQUISITION" : "OFFICIAL_API_ACQUISITION_COMPLETE_REVIEW_ONLY",
    acquisitionMethod: "OFFICIAL_PEXELS_API",
    apiEndpoint: "GET https://api.pexels.com/v1/videos/videos/:id",
    apiDocumentationUrl: "https://www.pexels.com/api/documentation/",
    pexelsApiKeyPresent: true,
    pexelsAttributionRequiredByApi: true,
    pexelsAttributionLink: "https://www.pexels.com",
    assetCount: results.length,
    failedCount: errors.length,
    totalActualSourceSeconds: Number(results.reduce((sum, asset) => sum + asset.actual.durationSeconds, 0).toFixed(6)),
    totalDownloadedBytes: totalBytes,
    fullDecodePasses: results.filter(asset => asset.fullDecode === "PASS").length,
    assets: results,
    errors,
    release: {
      status: "REVIEW_ONLY_NOT_APPROVED",
      thirdPartyRightsReviewed: false,
      humanVisualReview: false,
      selectedForProduction: false,
      releaseEligible: false,
      publicPublishingEnabled: false
    },
    notes: [
      "All video file links were obtained from the official Pexels API; no page scraping or guessed CDN URLs were used.",
      "Pexels API guidelines require a prominent Pexels link and photographer credit when possible. Include the recorded creator credits in final descriptions/credits.",
      "An API licence response does not clear third-party people, property, logos, trademarks, audio or other rights.",
      "The enclosure-tagged lion remains editorially excluded even if its API download succeeds."
    ],
    contactSheet: "preview/pexels-official-api-contact-sheet.jpg"
  };
  fs.writeFileSync(path.join(OUTPUT_ROOT, "acquisition-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(JSON.stringify({
    status: manifest.status,
    assetCount: manifest.assetCount,
    failedCount: manifest.failedCount,
    totalActualSourceSeconds: manifest.totalActualSourceSeconds,
    fullDecodePasses: manifest.fullDecodePasses,
    assets: results.map(asset => ({
      assetId: asset.assetId,
      sha256: asset.sha256,
      fileSizeBytes: asset.fileSizeBytes,
      durationSeconds: asset.actual.durationSeconds,
      width: asset.actual.width,
      height: asset.actual.height,
      fps: asset.actual.fps,
      fullDecode: asset.fullDecode
    })),
    errors,
    release: manifest.release
  }, null, 2));
}
main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
