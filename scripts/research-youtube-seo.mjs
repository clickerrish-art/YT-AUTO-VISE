#!/usr/bin/env node
/**
 * Read-only monthly YouTube SEO research for SonicVhibez.
 * Uses public YouTube search-result performance as a relevance proxy, NOT search-volume data.
 * It never changes channel branding, video metadata, schedules, privacy or publication state.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";
import { verifySonicVhibezChannel } from "./verify-youtube-channel.mjs";

export const SEO_SEED_QUERIES = Object.freeze([
  "wildlife documentary",
  "animal documentary",
  "wild animals",
  "African wildlife",
  "animal encounters"
]);
const WINDOW_DAYS = 90;
const MAX_RESULTS_PER_QUERY = 10;

function required(env, key) {
  const value = env[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("missing required GitHub Actions secret: " + key);
  }
  return value.trim();
}

function safeOutputDirectory(value) {
  if (typeof value !== "string" || !value.trim() || path.isAbsolute(value) ||
      path.normalize(value).split(path.sep).includes("..")) {
    throw new Error("SEO_REPORT_DIR must be a safe repository-relative directory");
  }
  return path.resolve(process.cwd(), value);
}

function formatMarkdown(report) {
  const lines = [
    "# SonicVhibez monthly YouTube SEO research",
    "",
    "- Generated: " + report.generatedAt,
    "- Channel: " + report.channel.title + " (" + report.channel.handle + ")",
    "- Channel ID: " + report.channel.id,
    "- Market: South Africa (ZA), English-language relevance",
    "- Research window: last " + report.windowDays + " days",
    "- Evidence: YouTube search-result video performance proxy",
    "",
    "> These rankings are NOT monthly search-volume estimates and do not prove how many people searched for a phrase. They summarize view counts for recent videos returned by YouTube search. Title matches are heuristic only; review the actual video before using any phrase.",
    "",
    "## Candidate search phrases",
    "",
    "| Rank | Phrase | Results | Title matches | Filtered | Combined title-signal views | Top title-signal views |",
    "|---:|---|---:|---:|---:|---:|---:|"
  ];
  for (const item of report.keywordCandidates) {
    lines.push("| " + item.rank + " | " + item.phrase + " | " + item.resultsCount +
      " | " + item.titleSignalResultsCount + " | " + item.excludedResultsCount +
      " | " + item.combinedTitleSignalViews + " | " + item.topTitleSignalViews + " |");
  }
  lines.push("", "## Evidence and review");
  for (const item of report.keywordCandidates) {
    lines.push("", "### " + item.phrase);
    if (!item.sampleTitleSignalVideos.length) {
      lines.push("- No title-signal wildlife results were returned for this phrase.");
    }
    for (const video of item.sampleTitleSignalVideos) {
      lines.push("- [" + video.title.replace(/[\[\]]/g, "") + "](https://www.youtube.com/watch?v=" +
        video.videoId + ") — " + video.viewCount + " views; published " + video.publishedAt +
        "; channel: " + video.channelTitle);
    }
    if (item.excludedSampleVideos.length) {
      lines.push("- Filtered by off-topic title signals (manual review still advised): " +
        item.excludedSampleVideos.map(video => video.title).join("; "));
    }
  }
  lines.push(
    "",
    "## Recommended use",
    "",
    "- Use a phrase only when it accurately describes the actual footage and story.",
    "- Title matching is a heuristic only; it does not verify the video's footage or transcript.",
    "- Treat this as a research shortlist, not permission to edit titles, descriptions, tags or channel keywords.",
    "- Do not add 4K, species, location, rescue, attack or other factual claims unless the footage verifies them.",
    "- No channel branding or YouTube metadata was changed.",
    "- Monthly search volume and keyword competition are unavailable from this YouTube API report; do not infer or invent either metric.",
    ""
  );
  return lines.join("\n");
}

export function buildSeoResearchReport({ channel, queryResults, generatedAt, windowDays = WINDOW_DAYS }) {
  if (!channel || typeof channel.id !== "string" || !channel.id.trim() ||
      channel.handle?.replace(/^@/, "").toLowerCase() !== "sonicvhibez") {
    throw new Error("SEO report requires the verified SonicVhibez channel identity");
  }
  if (!Array.isArray(queryResults) || queryResults.length !== SEO_SEED_QUERIES.length) {
    throw new Error("SEO research must contain one result set for every configured seed query");
  }
  const wildlifeTitleSignal = /\b(wildlife|wild|animals?|safari|lions?|elephants?|crocodiles?|hippos?|leopards?|zebras?|rhinos?|buffalo(?:es)?|giraffes?|cheetahs?|hyenas?|pangolins?|mambas?|meerkats?|predators?|birds?|snakes?|turtles?|whales?|sharks?|bears?|wolves?|foxes?|monkeys?|gorillas?|chimpanzees?|baboons?|bisons?|owls?|mammals?|silverbacks?|parrots?|deer|antelopes?|dogs?|cats?|chicks?)\b/i;
  const offTopicTitleSignal = /\b(skit|funny|hilarious|comedy|ranking|reaction|meme|prank|gaming|cartoon|gameplay|coffee|feces|poop|kopi|expensive)\b/i;
  const candidates = queryResults.map((entry, index) => {
    if (entry.query !== SEO_SEED_QUERIES[index] || !Array.isArray(entry.videos)) {
      throw new Error("SEO search result set does not match the configured query sequence");
    }
    const videos = entry.videos.map(video => ({
      videoId: String(video.videoId ?? ""),
      title: String(video.title ?? "").trim(),
      channelTitle: String(video.channelTitle ?? "").trim(),
      publishedAt: String(video.publishedAt ?? ""),
      viewCount: Number.isSafeInteger(video.viewCount) && video.viewCount >= 0 ? video.viewCount : 0
    })).filter(video => /^[A-Za-z0-9_-]{11}$/.test(video.videoId) && video.title);
    const titleMatches = videos.filter(video => wildlifeTitleSignal.test(video.title) && !offTopicTitleSignal.test(video.title));
    const excluded = videos.filter(video => !titleMatches.includes(video));
    return {
      phrase: entry.query,
      resultsCount: videos.length,
      titleSignalResultsCount: titleMatches.length,
      excludedResultsCount: excluded.length,
      combinedTitleSignalViews: titleMatches.reduce((sum, video) => sum + video.viewCount, 0),
      topTitleSignalViews: titleMatches.reduce((max, video) => Math.max(max, video.viewCount), 0),
      sampleTitleSignalVideos: titleMatches.slice(0, 5),
      excludedSampleVideos: excluded.slice(0, 3),
      relevanceStatus: "TITLE_SIGNAL_ONLY_REQUIRES_OWNER_REVIEW"
    };
  }).sort((a, b) => b.combinedTitleSignalViews - a.combinedTitleSignalViews || b.titleSignalResultsCount - a.titleSignalResultsCount)
    .map((item, index) => ({ rank: index + 1, ...item }));
  return Object.freeze({
    schemaVersion: 1,
    generatedAt: new Date(generatedAt).toISOString(),
    channel: { id: channel.id, title: channel.title, handle: channel.handle },
    market: { regionCode: "ZA", relevanceLanguage: "en" },
    windowDays,
    evidenceType: "YOUTUBE_SEARCH_RESULT_VIDEO_PERFORMANCE_PROXY_NOT_SEARCH_VOLUME",
    searchVolume: null,
    keywordCompetition: null,
    relevanceFilter: "Title contains wildlife/animal/species signals and excludes obvious off-topic entertainment/non-wildlife signals; this is a heuristic, not content verification.",
    keywordCandidates: candidates,
    actions: {
      metadataWritesPerformed: false,
      brandingChanged: false,
      publishingEnabled: false,
      ownerReviewRequired: true
    },
    limitations: [
      "YouTube search result view counts are not monthly keyword search volume.",
      "This report does not measure keyword competition or guarantee ranking.",
      "Candidates must match the actual footage and be approved before metadata use."
    ]
  });
}

export async function researchSonicVhibezSeo({
  env = process.env,
  youtubeFactory,
  now = new Date(),
  outputDir = "artifacts/seo/monthly"
} = {}) {
  const clientId = required(env, "YOUTUBE_CLIENT_ID");
  const clientSecret = required(env, "YOUTUBE_CLIENT_SECRET");
  const refreshToken = required(env, "YOUTUBE_REFRESH_TOKEN");
  const configuredChannelId = required(env, "SONICVHIBEZ_CHANNEL_ID");
  let youtube;
  if (youtubeFactory) {
    youtube = youtubeFactory({ clientId, clientSecret, refreshToken });
  } else {
    const oauth = new google.auth.OAuth2(clientId, clientSecret);
    oauth.setCredentials({ refresh_token: refreshToken });
    youtube = google.youtube({ version: "v3", auth: oauth });
  }

  const identity = await verifySonicVhibezChannel({ env, youtubeFactory: () => youtube });
  if (identity.status !== "PASS_READ_ONLY_IDENTITY_AND_INVENTORY" ||
      identity.channelId !== configuredChannelId) {
    throw new Error("refusing SEO research because read-only SonicVhibez identity/history verification did not pass");
  }
  const channelResponse = await youtube.channels.list({
    part: ["id", "snippet"],
    mine: true
  });
  const channel = channelResponse?.data?.items?.find(item => item?.id === configuredChannelId);
  if (!channel || !["SonicVhibez", "SonicVibes"].includes(channel.snippet?.title) ||
      channel.snippet?.customUrl?.replace(/^@/, "").toLowerCase() !== "sonicvhibez") {
    throw new Error("authenticated channel identity changed during SEO research; refusing to continue");
  }

  const publishedAfter = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const queryResults = [];
  for (const query of SEO_SEED_QUERIES) {
    const response = await youtube.search.list({
      part: ["snippet"],
      type: "video",
      q: query,
      regionCode: "ZA",
      relevanceLanguage: "en",
      order: "viewCount",
      publishedAfter,
      maxResults: MAX_RESULTS_PER_QUERY
    });
    const items = response?.data?.items;
    if (!Array.isArray(items)) throw new Error("YouTube search returned an invalid result set for: " + query);
    const ids = [...new Set(items.map(item => item?.id?.videoId).filter(id => typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id)))];
    const statsById = new Map();
    for (let offset = 0; offset < ids.length; offset += 50) {
      const batch = ids.slice(offset, offset + 50);
      const stats = await youtube.videos.list({ part: ["statistics"], id: batch.join(",") });
      for (const video of stats?.data?.items ?? []) {
        if (batch.includes(video.id)) {
          const raw = video.statistics?.viewCount;
          const count = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : 0;
          statsById.set(video.id, Number.isSafeInteger(count) ? count : 0);
        }
      }
    }
    queryResults.push({
      query,
      videos: items.map(item => ({
        videoId: item?.id?.videoId,
        title: item?.snippet?.title,
        channelTitle: item?.snippet?.channelTitle,
        publishedAt: item?.snippet?.publishedAt,
        viewCount: statsById.get(item?.id?.videoId) ?? 0
      }))
    });
  }

  const report = buildSeoResearchReport({
    channel: {
      id: channel.id,
      title: channel.snippet.title,
      handle: channel.snippet.customUrl
    },
    queryResults,
    generatedAt: now,
    windowDays: WINDOW_DAYS
  });
  const directory = safeOutputDirectory(outputDir);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const month = report.generatedAt.slice(0, 7);
  const jsonPath = path.join(directory, "sonicvhibez-seo-" + month + ".json");
  const markdownPath = path.join(directory, "sonicvhibez-seo-" + month + ".md");
  for (const [target, content] of [
    [jsonPath, JSON.stringify(report, null, 2) + "\n"],
    [markdownPath, formatMarkdown(report)]
  ]) {
    const temporary = target + ".tmp-" + process.pid;
    fs.writeFileSync(temporary, content, { encoding: "utf8", mode: 0o600, flag: "wx" });
    fs.renameSync(temporary, target);
  }
  return Object.freeze({
    status: "PASS_READ_ONLY_SEO_RESEARCH",
    channelId: report.channel.id,
    candidateCount: report.keywordCandidates.length,
    jsonPath,
    markdownPath,
    metadataWritesPerformed: false,
    evidenceType: report.evidenceType
  });
}

async function main() {
  const result = await researchSonicVhibezSeo();
  process.stdout.write([
    "PASS: read-only SonicVhibez monthly SEO research completed.",
    "Candidate phrases: " + result.candidateCount,
    "JSON: " + result.jsonPath,
    "Markdown: " + result.markdownPath,
    "Evidence: YouTube search-result performance proxy, not search volume.",
    "No metadata, branding, privacy, schedule or publication state was changed."
  ].join("\n") + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write("BLOCKED: " + (error?.message ?? String(error)) + "\n");
    process.exitCode = 2;
  });
}
