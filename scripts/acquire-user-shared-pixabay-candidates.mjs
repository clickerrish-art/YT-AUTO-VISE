import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REGISTER_PATH = path.join(ROOT, "content/media/pixabay-user-shared-candidates-2026-11-22.json");
const OWNER_POLICY_PATH = path.join(ROOT, "content/owner-media-policy-override-2026-11-22.json");
const OUTPUT_ROOT = path.join(ROOT, "artifacts/user-shared-pixabay-candidates");
const MEDIA_DIR = path.join(OUTPUT_ROOT, "media");
const PREVIEW_DIR = path.join(OUTPUT_ROOT, "preview");
const MAX_FILE_BYTES = 500 * 1024 * 1024;
const MAX_TOTAL_BYTES = 1500 * 1024 * 1024;
const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const slug = value => value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");

function parseFps(value) {
  if (typeof value !== "string" || !value.includes("/")) return null;
  const [n, d] = value.split("/").map(Number);
  return Number.isFinite(n) && Number.isFinite(d) && d !== 0 ? n / d : null;
}

function validatePolicy() {
  const owner = readJson(OWNER_POLICY_PATH);
  assert(owner.status === "ACTIVE_WITH_ASSET_LEVEL_REVIEW_GATES", "Owner media policy override is not active.");
  assert(owner.mediaRules?.pixabayLicensedStockAllowed === true, "Owner policy does not allow Pixabay licensed video.");
  assert(owner.mediaRules?.stockVideoFootageAllowed === true, "Owner policy does not allow licensed stock video.");
  assert(owner.mediaRules?.stockPhotographsAllowed === false, "Stock photographs must remain disabled.");
  assert(owner.mediaRules?.aiGeneratedWildlifeVisualsAllowed === false, "AI-generated wildlife visuals must remain prohibited.");
}

async function fetchPage(url) {
  const parsed = new URL(url);
  assert(parsed.protocol === "https:" && (parsed.hostname === "pixabay.com" || parsed.hostname.endsWith(".pixabay.com")),
    `Refusing non-Pixabay source page: ${parsed.hostname}`);
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://pixabay.com/"
    },
    signal: AbortSignal.timeout(60000)
  });
  assert(response.ok, `Pixabay page fetch failed: HTTP ${response.status} for ${url}`);
  return response.text();
}

function extractDirectVideoUrl(html, assetId) {
  const normalized = html
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/");
  const candidates = new Set();
  const urlPattern = /(?:https?:)?\/\/cdn\.pixabay\.com\/video\/[^"'<>\s\\]+?\.mp4(?:\?[^"'<>\s\\]*)?/gi;
  for (const match of normalized.matchAll(urlPattern)) {
    const raw = match[0].startsWith("//") ? `https:${match[0]}` : match[0];
    candidates.add(raw);
  }
  const metaPattern = /<meta[^>]+(?:property|name)=["'](?:og:video|og:video:secure_url|twitter:player:stream)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
  for (const match of normalized.matchAll(metaPattern)) {
    const raw = match[1].replace(/&amp;/g, "&");
    if (/^https:\/\/cdn\.pixabay\.com\/video\//i.test(raw) && /\.mp4(?:\?|$)/i.test(raw)) candidates.add(raw);
  }
  const id = String(assetId).replace(/^pixabay-video-/, "");
  const exact = [...candidates].filter(url => {
    try {
      const parsed = new URL(url);
      return parsed.hostname === "cdn.pixabay.com" &&
        parsed.pathname.startsWith("/video/") &&
        parsed.pathname.includes(id) &&
        parsed.pathname.toLowerCase().endsWith(".mp4");
    } catch { return false; }
  });
  if (exact.length === 0) {
    throw new Error(`No exact Pixabay CDN MP4 URL for asset ${id}; page was not downloaded or guessed. Found ${candidates.size} generic video URLs.`);
  }
  const rank = url => {
    const name = url.toLowerCase();
    if (name.includes("original") || name.includes("4k")) return 4;
    if (name.includes("large")) return 3;
    if (name.includes("medium")) return 2;
    if (name.includes("small")) return 1;
    return 0;
  };
  exact.sort((a, b) => rank(b) - rank(a));
  return { url: exact[0], candidateCount: exact.length };
}

async function download(url, destination) {
  const parsed = new URL(url);
  assert(parsed.protocol === "https:" && parsed.hostname === "cdn.pixabay.com" &&
    parsed.pathname.startsWith("/video/") && parsed.pathname.toLowerCase().endsWith(".mp4"),
    `Refusing unverified Pixabay media URL: ${url}`);
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Referer": "https://pixabay.com/" },
    signal: AbortSignal.timeout(180000)
  });
  assert(response.ok && response.body, `Pixabay media download failed: HTTP ${response.status}`);
  const announced = Number(response.headers.get("content-length") ?? 0);
  assert(!announced || announced <= MAX_FILE_BYTES, "Pixabay source exceeds 500 MB per-file limit.");
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination, { flags: "wx" }));
  const bytes = fs.statSync(destination).size;
  assert(bytes > 0 && bytes <= MAX_FILE_BYTES, "Downloaded Pixabay source is empty or exceeds the 500 MB limit.");
  return bytes;
}

function probe(file) {
  const parsed = JSON.parse(execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_type,codec_name,width,height,avg_frame_rate,sample_rate,channels",
    "-show_entries", "format=duration,size",
    "-of", "json", file
  ], { encoding: "utf8" }));
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

function fullDecode(file) {
  execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-i", file, "-f", "null", "-"], {
    stdio: "pipe", timeout: 180000
  });
}

function previewFrame(file, destination, durationSeconds) {
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-ss", Math.max(0, durationSeconds / 2).toFixed(3), "-i", file,
    "-frames:v", "1",
    "-vf", "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
    destination
  ], { stdio: "pipe", timeout: 60000 });
}

async function sha256File(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function main() {
  validatePolicy();
  const register = readJson(REGISTER_PATH);
  const assets = register.assets ?? [];
  assert(assets.length === 6, "Expected exactly six previously shared Pixabay candidates.");
  assert(assets.every(asset => asset.sourceFileStatus === "NOT_DOWNLOADED" && asset.sha256 === null),
    "Pixabay register shows one or more files already acquired; refusing duplicate download.");

  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const results = [];
  let totalBytes = 0;

  for (const asset of assets) {
    const id = String(asset.assetId).replace(/^pixabay-video-/, "");
    const pageHtml = await fetchPage(asset.sourceUrl);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const extracted = extractDirectVideoUrl(pageHtml, id);
    const destination = path.join(MEDIA_DIR, `${slug(asset.assetId)}.mp4`);
    const preview = path.join(PREVIEW_DIR, `${slug(asset.assetId)}.jpg`);
    const downloadedBytes = await download(extracted.url, destination);
    totalBytes += downloadedBytes;
    assert(totalBytes <= MAX_TOTAL_BYTES, "Pixabay acquisition exceeds the 1.5 GB total review-artifact limit.");

    const actual = probe(destination);
    const [expectedWidth, expectedHeight] = asset.resolution.split("x").map(Number);
    assert(actual.width === expectedWidth && actual.height === expectedHeight,
      `Resolution mismatch for ${asset.assetId}: ${actual.width}x${actual.height} vs page ${asset.resolution}`);
    const acceptedFps = asset.acceptedFps ?? [Number(asset.fps)];
    assert(acceptedFps.some(fps => Math.abs(actual.fps - fps) <= 0.1),
      `Frame-rate mismatch for ${asset.assetId}: ${actual.fps} vs accepted ${acceptedFps.join(",")}`);
    fullDecode(destination);
    previewFrame(destination, preview, actual.durationSeconds);
    const sha256 = await sha256File(destination);

    results.push({
      assetId: asset.assetId,
      contributor: asset.contributor,
      title: asset.title,
      sourceUrl: asset.sourceUrl,
      extractedDownloadUrl: extracted.url,
      extractedUrlCandidateCount: extracted.candidateCount,
      publishedAt: asset.publishedAt,
      sourcePageResolution: asset.resolution,
      sourcePageFps: asset.fps,
      actual,
      downloadedBytes,
      sha256,
      mediaFile: `media/${slug(asset.assetId)}.mp4`,
      previewFrame: `preview/${slug(asset.assetId)}.jpg`,
      listingTags: asset.listingTags,
      editorialStatus: asset.editorialStatus,
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

  const contactSheet = path.join(PREVIEW_DIR, "pixabay-user-shared-contact-sheet.jpg");
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-pattern_type", "glob", "-framerate", "1",
    "-i", path.join(PREVIEW_DIR, "*.jpg"),
    "-vf", "tile=3x2:padding=12:margin=12",
    "-frames:v", "1", contactSheet
  ], { stdio: "pipe", timeout: 60000 });

  const manifest = {
    schemaVersion: 1,
    project: "SonicVhibez",
    createdAt: new Date().toISOString(),
    sourceSelection: "Six previously shared Pixabay wildlife-video URLs. The script only downloads direct CDN MP4 URLs extracted from the corresponding public source pages; it never guesses a URL. All files are acquired for review only.",
    license: {
      platform: "Pixabay",
      licenseName: "Pixabay Content License",
      termsUrl: "https://pixabay.com/service/terms/",
      summaryUrl: "https://pixabay.com/service/license-summary/",
      termsLastUpdated: "2026-10-20",
      freeUseListingVerified: true,
      thirdPartyRightsAutomaticallyCleared: false
    },
    assetCount: results.length,
    totalActualSourceSeconds: Number(results.reduce((sum, asset) => sum + asset.actual.durationSeconds, 0).toFixed(6)),
    totalDownloadedBytes: totalBytes,
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
      "The 111414 lion listing carries a Zoo tag; it must not be represented as a wild encounter.",
      "The 173139 listing does not establish exact cobra species; no species-specific claims until visual review.",
      "The 127476 listing description links to the contributor's YouTube channel; inspect for any embedded channel branding or watermark.",
      "The 127476 and 216696 primate species/age-class labels require full visual confirmation.",
      "Pixabay licence review is not third-party-rights clearance or publication approval."
    ],
    contactSheet: "preview/pixabay-user-shared-contact-sheet.jpg"
  };
  fs.writeFileSync(path.join(OUTPUT_ROOT, "acquisition-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(JSON.stringify({
    assetCount: manifest.assetCount,
    totalActualSourceSeconds: manifest.totalActualSourceSeconds,
    totalDownloadedBytes: manifest.totalDownloadedBytes,
    fullDecodePasses: manifest.fullDecodePasses,
    assets: results.map(asset => ({
      assetId: asset.assetId,
      extractedDownloadUrl: asset.extractedDownloadUrl,
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
