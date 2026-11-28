#!/usr/bin/env node
/**
 * Read-only monthly YouTube SEO research for SonicVhibez.
 * Uses public YouTube search-result performance as a relevance proxy, NOT search-volume data.
 * It never changes channel branding, video metadata, schedules, privacy or publication state.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { verifySonicVhibezChannel } from "./verify-youtube-channel.mjs";

export const SEO_QUERY_PROFILES = Object.freeze({
  "Nile crocodile": Object.freeze({ contentTrack: "long-form-001", intent: "Nile crocodile species and behaviour", exactTitleSignal: /\b(nile crocodile|crocodylus niloticus)\b/i, relatedTitleSignal: /\b(crocodiles?|crocodylus)\b/i }),
  "Crocodylus niloticus": Object.freeze({ contentTrack: "long-form-001", intent: "Scientific species name and species-specific results", exactTitleSignal: /\b(crocodylus niloticus|nile crocodile)\b/i, relatedTitleSignal: /\b(crocodylus|crocodiles?)\b/i }),
  "crocodile senses": Object.freeze({ contentTrack: "long-form-001", intent: "Crocodile sensory systems and detection behaviour", exactTitleSignal: /\b(crocodiles?|crocodylus)\b/i, exactIntentSignal: /\b(sense|senses|sensory|detect|detection|feel|waves?|surface)\b/i, relatedTitleSignal: /\b(crocodiles?|crocodylus)\b/i }),
  "water surface waves crocodile": Object.freeze({ contentTrack: "long-form-001", intent: "Water-surface wave detection and sensory research", exactTitleSignal: /\b(crocodiles?|crocodylus)\b/i, exactIntentSignal: /\b(waves?|surface|sense|senses|detect|detection|movement)\b/i, relatedTitleSignal: /\b(crocodiles?|crocodylus)\b/i }),
  "African wildlife documentary": Object.freeze({ contentTrack: "long-form-001", intent: "Broader African wildlife documentary context", exactTitleSignal: /\b(africa|african)\b/i, exactIntentSignal: /\b(wildlife|documentary|nature)\b/i, relatedTitleSignal: /\b(africa|african|safari|wildlife|documentary|nature)\b/i }),
  "wildlife video storytelling": Object.freeze({ contentTrack: "short-001", intent: "Creator-education storytelling and shot structure", exactTitleSignal: /\b(wildlife|animals?|nature|elephants?|lions?|crocodiles?|birds?|safari)\b/i, exactIntentSignal: /(?=.*\b(story|stories|storytelling|narrative)\b)(?=.*\b(video|film|shots?|documentary)\b)/i, relatedTitleSignal: /\b(wildlife|animals?|nature|elephants?|lions?|crocodiles?|birds?|safari)\b/i }),
  "wildlife filmmaking tips": Object.freeze({ contentTrack: "short-001", intent: "Creator-education wildlife filming and camera technique", exactTitleSignal: /\b(wildlife|animals?|nature|elephants?|lions?|crocodiles?|birds?|safari)\b/i, exactIntentSignal: /(?=.*\b(film|filming|filmmaking|camera|videography|photography)\b)(?=.*\b(tips|how to|guide|tutorial|beginners?|up close|focusing)\b)/i, relatedTitleSignal: /\b(wildlife|animals?|nature|elephants?|lions?|crocodiles?|birds?|safari)\b/i })
});
export const SEO_SEED_QUERIES = Object.freeze(Object.keys(SEO_QUERY_PROFILES));
const WINDOW_DAYS = 90;
const MAX_RESULTS_PER_QUERY = 10;

export function describeSeoResearchFailure(error) {
  const code = String(error?.response?.data?.error ?? error?.code ?? error?.message ?? error);
  if (code.includes("invalid_grant")) {
    return "Google OAuth rejected the stored refresh token (invalid_grant). Re-authorize the existing OAuth client with the required YouTube scopes, then replace YOUTUBE_REFRESH_TOKEN in GitHub Actions secrets. Do not create a new OAuth client or share the token in chat.";
  }
  if (code.includes("invalid_client")) {
    return "Google OAuth rejected the client credentials (invalid_client). Correct the matching existing YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET GitHub Actions secrets; the YouTube channel ID is not the OAuth client ID.";
  }
  return error?.message ?? String(error);
}

function required(env, key) {
  const value = env[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("missing required GitHub Actions secret: " + key);
  }
  return value.trim();
}

function normalizeSeoRegionCode(value) {
  if (value === undefined || value === null || value === "") return null;
  const regionCode = String(value).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(regionCode)) {
    throw new Error("SEO_REGION_CODE must be an ISO 3166-1 alpha-2 country code; leave it unset for global research");
  }
  return regionCode;
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
    "# SonicVhibez monthly YouTube SEO research", "",
    "- Generated: " + report.generatedAt,
    "- Channel: " + report.channel.title + " (" + report.channel.handle + ")",
    "- Channel ID: " + report.channel.id,
    "- Market: " + (report.market.regionCode ? (report.market.regionCode === "ZA" ? "South Africa (ZA)" : report.market.regionCode) + ", English-language relevance" : "Global (no region filter), English-language relevance"),
    "- Research window: last " + report.windowDays + " days",
    "- Evidence: YouTube search-result video performance proxy", "",
    "> These rankings are NOT monthly search-volume estimates and do not prove how many people searched for a phrase. They summarize view counts for recent videos returned by YouTube search. Exact/related title matches are heuristic only; review the actual video before using any phrase.", "",
    "## Candidate search phrases", "",
    "| Rank | Content track | Phrase | Results | Exact title matches | Related title matches | Excluded | Exact-title views | Related-title views |",
    "|---:|---|---|---:|---:|---:|---:|---:|---:|"
  ];
  for (const item of report.keywordCandidates) {
    lines.push("| " + item.rank + " | " + item.contentTrack + " | " + item.phrase + " | " + item.resultsCount + " | " + item.exactTitleSignalResultsCount + " | " + item.relatedTitleSignalResultsCount + " | " + item.excludedResultsCount + " | " + item.combinedExactTitleViews + " | " + item.combinedRelatedTitleViews + " |");
  }
  for (const track of ["long-form-001", "short-001"]) {
    lines.push("", "## " + (track === "long-form-001" ? "Long-form 001 — Nile crocodile documentary" : "Short 001 — creator education"));
    for (const item of report.keywordCandidates.filter(candidate => candidate.contentTrack === track)) {
      lines.push("", "### " + item.phrase, "", "Intent: " + item.intent);
      if (!item.sampleExactTitleVideos.length) lines.push("- No exact title matches were returned; do not treat this phrase as proven demand.");
      for (const video of item.sampleExactTitleVideos) lines.push("- EXACT: [" + video.title.replace(/[\[\]]/g, "") + "](https://www.youtube.com/watch?v=" + video.videoId + ") — " + video.viewCount + " views; published " + video.publishedAt + "; channel: " + video.channelTitle);
      for (const video of item.sampleRelatedTitleVideos) lines.push("- RELATED ONLY (species/intent not confirmed by title): [" + video.title.replace(/[\[\]]/g, "") + "](https://www.youtube.com/watch?v=" + video.videoId + ") — " + video.viewCount + " views; channel: " + video.channelTitle);
      if (item.excludedSampleVideos.length) lines.push("- Excluded from relevance totals (off-topic or quality review): " + item.excludedSampleVideos.map(video => video.title).join("; "));
    }
  }
  lines.push("", "## Recommended use", "",
    "- Exact-title and related-title signals are separate; related titles must not be described as exact species or intent matches.",
    "- Use a phrase only when it accurately describes the actual footage and story.",
    "- Title matching is a heuristic only; it does not verify the video's footage or transcript.",
    "- Treat this as a research shortlist, not permission to edit titles, descriptions, tags or channel keywords.",
    "- Do not add 4K, species, location, rescue, attack or other factual claims unless the footage verifies them.",
    "- Potential AI/synthetic-source signals are excluded from positive view totals and require manual review.",
    "- No channel branding or YouTube metadata was changed.",
    "- Monthly search volume and keyword competition are unavailable from this YouTube API report; do not infer or invent either metric.", "");
  return lines.join("\n");
}

export function buildSeoResearchReport({ channel, queryResults, generatedAt, windowDays = WINDOW_DAYS, regionCode = null }) {
  if (!channel || typeof channel.id !== "string" || !channel.id.trim() || channel.handle?.replace(/^@/, "").toLowerCase() !== "sonicvhibez") throw new Error("SEO report requires the verified SonicVhibez channel identity");
  if (!Array.isArray(queryResults) || queryResults.length !== SEO_SEED_QUERIES.length) throw new Error("SEO research must contain one result set for every configured seed query");
  const normalizedRegionCode = normalizeSeoRegionCode(regionCode);
  const offTopicTitleSignal = /\b(anime|luffy|manga|skit|funny|hilarious|comedy|ranking|reaction|meme|prank|gaming|gameplay|cartoon|duet|coffee|feces|poop|kopi|expensive)\b/i;
  const candidates = queryResults.map((entry, index) => {
    const profile = SEO_QUERY_PROFILES[SEO_SEED_QUERIES[index]];
    if (entry.query !== SEO_SEED_QUERIES[index] || !Array.isArray(entry.videos) || !profile) throw new Error("SEO search result set does not match the configured query sequence");
    const videos = entry.videos.map(video => ({
      videoId: String(video.videoId ?? ""), title: String(video.title ?? "").trim(),
      channelTitle: String(video.channelTitle ?? ""), publishedAt: String(video.publishedAt ?? ""),
      viewCount: Number.isSafeInteger(video.viewCount) && video.viewCount >= 0 ? video.viewCount : 0
    })).filter(video => /^[A-Za-z0-9_-]{11}$/.test(video.videoId) && video.title);
    const classified = videos.map(video => {
      const qualityFlags = /\bai\b|ai[-_ ]generated/i.test(video.channelTitle + " " + video.title) ? ["POTENTIAL_AI_OR_SYNTHETIC_SOURCE_REQUIRES_MANUAL_REVIEW"] : [];
      const offTopic = offTopicTitleSignal.test(video.title);
      const exact = !offTopic && profile.exactTitleSignal.test(video.title) && (!profile.exactIntentSignal || profile.exactIntentSignal.test(video.title));
      const related = !offTopic && !exact && profile.relatedTitleSignal.test(video.title);
      const relevanceClass = offTopic ? "OFF_TOPIC" : exact ? "EXACT_TITLE_MATCH" : related ? "RELATED_TITLE_ONLY" : "NO_TITLE_SIGNAL";
      return { ...video, relevanceClass, qualityFlags, eligibleForSignalTotals: qualityFlags.length === 0 && (exact || related) };
    });
    const exactMatches = classified.filter(video => video.relevanceClass === "EXACT_TITLE_MATCH" && video.eligibleForSignalTotals);
    const relatedMatches = classified.filter(video => video.relevanceClass === "RELATED_TITLE_ONLY" && video.eligibleForSignalTotals);
    const excluded = classified.filter(video => video.relevanceClass === "OFF_TOPIC" || video.qualityFlags.length > 0);
    const unmatched = classified.filter(video => video.relevanceClass === "NO_TITLE_SIGNAL" && video.qualityFlags.length === 0);
    return {
      phrase: entry.query, contentTrack: profile.contentTrack, intent: profile.intent,
      resultsCount: classified.length, exactTitleSignalResultsCount: exactMatches.length,
      relatedTitleSignalResultsCount: relatedMatches.length, excludedResultsCount: excluded.length,
      unmatchedResultsCount: unmatched.length,
      combinedExactTitleViews: exactMatches.reduce((sum, video) => sum + video.viewCount, 0),
      combinedRelatedTitleViews: relatedMatches.reduce((sum, video) => sum + video.viewCount, 0),
      topExactTitleViews: exactMatches.reduce((max, video) => Math.max(max, video.viewCount), 0),
      topRelatedTitleViews: relatedMatches.reduce((max, video) => Math.max(max, video.viewCount), 0),
      sampleExactTitleVideos: exactMatches.slice(0, 5), sampleRelatedTitleVideos: relatedMatches.slice(0, 5),
      excludedSampleVideos: excluded.slice(0, 5), unmatchedSampleVideos: unmatched.slice(0, 3),
      relevanceStatus: exactMatches.length ? "EXACT_TITLE_MATCH_REQUIRES_MANUAL_REVIEW" : relatedMatches.length ? "RELATED_TITLE_ONLY_NO_EXACT_SPECIES_OR_INTENT_MATCH" : "NO_TITLE_MATCHES_RETURNED",
      videos: classified
    };
  }).sort((a, b) => b.exactTitleSignalResultsCount - a.exactTitleSignalResultsCount || b.combinedExactTitleViews - a.combinedExactTitleViews || b.relatedTitleSignalResultsCount - a.relatedTitleSignalResultsCount || b.combinedRelatedTitleViews - a.combinedRelatedTitleViews);
  return Object.freeze({
    schemaVersion: 2, generatedAt: new Date(generatedAt).toISOString(),
    channel: { id: channel.id, title: channel.title, handle: channel.handle },
    market: { regionCode: normalizedRegionCode, scope: normalizedRegionCode ? "COUNTRY" : "GLOBAL", relevanceLanguage: "en" },
    windowDays, evidenceType: "YOUTUBE_SEARCH_RESULT_VIDEO_PERFORMANCE_PROXY_NOT_SEARCH_VOLUME",
    searchVolume: null, keywordCompetition: null,
    relevanceFilter: "Query-specific exact-title and related-title signals are reported separately. Off-topic entertainment and potential AI/synthetic-source results are excluded from positive view totals; all matches require manual review.",
    keywordCandidates: candidates.map(({ videos, ...candidate }, index) => ({ rank: index + 1, ...candidate })),
    queryResults: candidates.map(candidate => ({ query: candidate.phrase, contentTrack: candidate.contentTrack, resultsCount: candidate.resultsCount, videos: candidate.videos })),
    actions: { metadataWritesPerformed: false, brandingChanged: false, publishingEnabled: false, ownerReviewRequired: true },
    limitations: [
      "YouTube search result view counts are not monthly keyword search volume.",
      "This report does not measure keyword competition or guarantee ranking.",
      "Exact/related title matching is heuristic and does not verify footage, transcript, species, location or rights.",
      "Candidates must match the actual footage and be approved before metadata use."
    ]
  });
}

export async function researchSonicVhibezSeo({
  env = process.env,
  youtubeFactory,
  oauthFactory,
  now = new Date(),
  outputDir = "artifacts/seo/monthly"
} = {}) {
  const clientId = required(env, "YOUTUBE_CLIENT_ID");
  const clientSecret = required(env, "YOUTUBE_CLIENT_SECRET");
  const refreshToken = required(env, "YOUTUBE_REFRESH_TOKEN");
  const configuredChannelId = required(env, "SONICVHIBEZ_CHANNEL_ID");
  let youtube;
  let oauth;
  if (youtubeFactory) {
    youtube = youtubeFactory({ clientId, clientSecret, refreshToken });
  } else {
    // Load the production client only for real API access. Reuse the same
    // OAuth client for the mandatory scope check and the YouTube API client.
    const { google } = await import("googleapis");
    oauth = new google.auth.OAuth2(clientId, clientSecret);
    oauth.setCredentials({ refresh_token: refreshToken });
    youtube = google.youtube({ version: "v3", auth: oauth });
  }

  const verifiedOAuthFactory = oauthFactory ?? (oauth ? () => oauth : undefined);
  const identity = await verifySonicVhibezChannel({
    env,
    youtubeFactory: () => youtube,
    ...(verifiedOAuthFactory ? { oauthFactory: verifiedOAuthFactory } : {})
  });
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

  const regionCode = normalizeSeoRegionCode(env.SEO_REGION_CODE);
  const publishedAfter = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const queryResults = [];
  for (const query of SEO_SEED_QUERIES) {
    const response = await youtube.search.list({
      part: ["snippet"],
      type: "video",
      q: query,
      ...(regionCode ? { regionCode } : {}),
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
    windowDays: WINDOW_DAYS,
    regionCode
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
    process.stderr.write("BLOCKED: " + describeSeoResearchFailure(error) + "\n");
    process.exitCode = 2;
  });
}
