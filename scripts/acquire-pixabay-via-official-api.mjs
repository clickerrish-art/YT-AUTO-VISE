import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const API_KEY = process.env.PIXABAY_API_KEY;
const REGISTER_PATH = path.join(ROOT, "content/media/pixabay-user-shared-candidates-2026-11-22.json");
const OWNER_POLICY_PATH = path.join(ROOT, "content/owner-media-policy-override-2026-11-22.json");
const APPROVED_POLICY_PATH = path.join(ROOT, "content/approved-pexels-footage.json");
const CACHE_PATH = path.join(ROOT, "cache/pixabay-api-cache.json");
const OUTPUT_ROOT = path.join(ROOT, "artifacts/official-api-pixabay-review");
const MEDIA_DIR = path.join(OUTPUT_ROOT, "media");
const PREVIEW_DIR = path.join(OUTPUT_ROOT, "preview");
const MAX_FILE_BYTES = 500 * 1024 * 1024;
const MAX_TOTAL_BYTES = 1500 * 1024 * 1024;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const safeSlug = value => value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");

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
function normalizedName(value) {
  return String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");
}
function loadCache() {
  try {
    const cache = readJson(CACHE_PATH);
    return cache && typeof cache === "object" ? cache : { schemaVersion: 1, assets: {} };
  } catch {
    return { schemaVersion: 1, assets: {} };
  }
}
function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}
async function fetchVideoById(id, cache) {
  const cached = cache.assets?.[id];
  if (cached?.fetchedAt && Date.now() - Date.parse(cached.fetchedAt) < CACHE_MAX_AGE_MS && cached.hit?.id === id) {
    return { hit: cached.hit, cacheUsed: true };
  }
  const url = new URL("https://pixabay.com/api/videos/");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("id", String(id));
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error(`Pixabay API returned HTTP ${response.status} for video ID ${id}`);
  const data = await response.json();
  const hit = (data.hits ?? []).find(item => Number(item.id) === Number(id));
  if (!hit) throw new Error(`Pixabay API did not return exact video ID ${id}`);
  cache.assets ??= {};
  cache.assets[id] = { fetchedAt: new Date().toISOString(), hit };
  saveCache(cache);
  return { hit, cacheUsed: false };
}
function chooseVideoVariant(videos) {
  const variants = Object.entries(videos ?? {})
    .map(([name, value]) => ({ name, ...(value ?? {}) }))
    .filter(value => value.url && value.width > 0 && value.height > 0 && value.size > 0)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height));
  assert(variants.length > 0, "Pixabay API returned no downloadable MP4 variants.");
  return variants[0];
}
async function downloadFile(url, destination) {
  const parsed = new URL(url);
  assert(parsed.protocol === "https:" && parsed.hostname === "cdn.pixabay.com" &&
    parsed.pathname.startsWith("/video/") && parsed.pathname.toLowerCase().endsWith(".mp4"),
    `Pixabay API returned an unexpected media host/path: ${parsed.hostname}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(240000) });
  assert(response.ok && response.body, `Pixabay video download failed: HTTP ${response.status}`);
  const announced = Number(response.headers.get("content-length") ?? 0);
  assert(!announced || announced <= MAX_FILE_BYTES, "Pixabay video exceeds 500 MB per-file limit.");
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination, { flags: "wx" }));
  const size = fs.statSync(destination).size;
  assert(size > 0 && size <= MAX_FILE_BYTES, "Pixabay video is empty or exceeds the 500 MB per-file limit.");
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
  assert(API_KEY, "PIXABAY_API_KEY is missing. Add it as a GitHub Actions repository secret; never paste it into chat.");
  const owner = readJson(OWNER_POLICY_PATH);
  const approved = readJson(APPROVED_POLICY_PATH).currentProductionPolicy;
  assert(owner.status === "ACTIVE_WITH_ASSET_LEVEL_REVIEW_GATES" &&
    owner.mediaRules?.pixabayLicensedStockAllowed === true &&
    owner.mediaRules?.aiGeneratedWildlifeVisualsAllowed === false &&
    approved?.pixabayAllowed === true, "Pixabay owner media policy is not active or is unsafe.");

  const register = readJson(REGISTER_PATH);
  const assets = register.assets ?? [];
  assert(assets.length === 6, "Expected exactly six user-shared Pixabay video IDs.");
  const cache = loadCache();
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const results = [];
  const errors = [];
  let totalBytes = 0;
  let cacheHits = 0;

  for (const asset of assets) {
    const id = numericId(asset.assetId);
    try {
      assert(id, `Invalid Pixabay asset ID: ${asset.assetId}`);
      const { hit, cacheUsed } = await fetchVideoById(id, cache);
      if (cacheUsed) cacheHits++;
      assert(Number(hit.id) === id, `Pixabay API returned the wrong video ID for ${id}`);
      assert(numericId(hit.pageURL) === id, `Pixabay API page URL does not match ID ${id}`);
      const apiCreator = hit.user ?? null;
      const creatorMatch = !asset.contributor || normalizedName(apiCreator) === normalizedName(asset.contributor);
      if (!creatorMatch) throw new Error(`Pixabay creator mismatch for ${id}: expected ${asset.contributor}, API returned ${apiCreator}`);

      const variant = chooseVideoVariant(hit.videos);
      const downloadUrl = new URL(variant.url);
      downloadUrl.searchParams.set("download", "1");
      const destination = path.join(MEDIA_DIR, `${safeSlug(asset.assetId)}.mp4`);
      const preview = path.join(PREVIEW_DIR, `${safeSlug(asset.assetId)}.jpg`);
      const downloadedBytes = await downloadFile(downloadUrl.toString(), destination);
      totalBytes += downloadedBytes;
      assert(totalBytes <= MAX_TOTAL_BYTES, "Pixabay acquisition exceeds the 1.5 GB total review-artifact limit.");

      const actual = probe(destination);
      assert(actual.width === Number(variant.width) && actual.height === Number(variant.height),
        `Pixabay API/ffprobe resolution mismatch for ${id}`);
      assert(Math.abs(actual.durationSeconds - Number(hit.duration)) <= 2,
        `Pixabay API/ffprobe duration mismatch for ${id}`);
      fullDecode(destination);
      makePreview(destination, preview, actual.durationSeconds);
      const sha256 = await hashFile(destination);

      results.push({
        assetId: asset.assetId,
        videoId: id,
        title: asset.title,
        contributor: apiCreator,
        sourceUrl: hit.pageURL,
        sourceTags: hit.tags,
        publishedAt: asset.publishedAt,
        editorialStatus: asset.editorialStatus,
        editorialRisk: asset.editorialRisk,
        apiDurationSeconds: hit.duration,
        selectedVariant: {
          name: variant.name,
          width: variant.width,
          height: variant.height,
          size: variant.size,
          downloadHost: downloadUrl.hostname,
          downloadPath: downloadUrl.pathname
        },
        actual,
        fileSizeBytes: downloadedBytes,
        sha256,
        mediaFile: `media/${safeSlug(asset.assetId)}.mp4`,
        previewFrame: `preview/${safeSlug(asset.assetId)}.jpg`,
        apiCacheUsed: cacheUsed,
        attributionText: `Video by ${apiCreator} on Pixabay`,
        attributionUrl: hit.pageURL,
        fullDecode: "PASS",
        technicalProbe: "PASS",
        thirdPartyRightsReviewed: false,
        humanReviewed: false,
        selectedForProduction: false,
        productionEligible: false,
        releaseEligible: false
      });
    } catch (error) {
      errors.push({ assetId: asset.assetId, title: asset.title, sourceUrl: asset.sourceUrl, error: error.message });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (results.length === 0) throw new Error(`No Pixabay assets acquired. ${errors.length} API/acquisition errors.`);
  const contactSheet = path.join(PREVIEW_DIR, "pixabay-official-api-contact-sheet.jpg");
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-pattern_type", "glob", "-framerate", "1",
    "-i", path.join(PREVIEW_DIR, "*.jpg"),
    "-vf", "tile=3x2:padding=12:margin=12",
    "-frames:v", "1", contactSheet
  ], { stdio: "pipe", timeout: 120000 });

  const manifest = {
    schemaVersion: 1,
    project: "SonicVhibez",
    createdAt: new Date().toISOString(),
    status: errors.length ? "PARTIAL_OFFICIAL_API_ACQUISITION" : "OFFICIAL_API_ACQUISITION_COMPLETE_REVIEW_ONLY",
    acquisitionMethod: "OFFICIAL_PIXABAY_API",
    apiEndpoint: "GET https://pixabay.com/api/videos/?key=...&id=...",
    apiDocumentationUrl: "https://pixabay.com/api/docs/",
    pixabayApiKeyPresent: true,
    apiCacheMaxAgeHours: 24,
    apiCacheHits: cacheHits,
    apiCachePath: "cache/pixabay-api-cache.json",
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
      "All video metadata and download links were obtained from the official Pixabay video API by exact video ID; no page scraping or guessed CDN URLs were used.",
      "API responses are cached for 24 hours as required by Pixabay API documentation; only one request per ID is made per cache window.",
      "The 111414 lion listing carries a Zoo tag; do not represent it as a wild encounter.",
      "The 173139 listing does not establish exact cobra species; no species-specific claims until visual review.",
      "The 127476 listing description links to the contributor's YouTube channel; inspect for embedded channel branding or watermark.",
      "The 127476 and 216696 primate species/age-class labels require full visual confirmation.",
      "Pixabay licence review is not third-party-rights clearance or publication approval."
    ],
    contactSheet: "preview/pixabay-official-api-contact-sheet.jpg"
  };
  fs.writeFileSync(path.join(OUTPUT_ROOT, "acquisition-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(JSON.stringify({
    status: manifest.status,
    assetCount: manifest.assetCount,
    failedCount: manifest.failedCount,
    totalActualSourceSeconds: manifest.totalActualSourceSeconds,
    totalDownloadedBytes: manifest.totalDownloadedBytes,
    fullDecodePasses: manifest.fullDecodePasses,
    apiCacheHits: manifest.apiCacheHits,
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
