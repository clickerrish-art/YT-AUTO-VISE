import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SEO_SEED_QUERIES, buildSeoResearchReport, describeSeoResearchFailure, researchSonicVhibezSeo } from "../scripts/research-youtube-seo.mjs";

const env = { YOUTUBE_CLIENT_ID: "client-id", YOUTUBE_CLIENT_SECRET: "client-secret", YOUTUBE_REFRESH_TOKEN: "refresh-token", SONICVHIBEZ_CHANNEL_ID: "UCSlkuPfHH78oGC1o418HV4w" };
const channel = { id: env.SONICVHIBEZ_CHANNEL_ID, title: "SonicVhibez", handle: "@sonicvhibez" };
const exactTitles = {
  "Nile crocodile": "Nile Crocodile: The Hidden Waterline Ambush",
  "Crocodylus niloticus": "Crocodylus niloticus in the wild",
  "crocodile senses": "How Nile Crocodiles Sense Prey Through Water",
  "water surface waves crocodile": "Crocodile Detects Water Surface Waves",
  "African wildlife documentary": "African Wildlife Documentary: River Giants",
  "wildlife video storytelling": "Wildlife Storytelling in Three Clear Shots",
  "wildlife filmmaking tips": "How to Film Wildlife Up Close: Camera Tips"
};
const makeResults = () => SEO_SEED_QUERIES.map((query, index) => ({
  query, videos: [{ videoId: "video" + String(index + 1).padStart(6, "0"), title: exactTitles[query], channelTitle: "Field Guide", publishedAt: "2026-11-01T00:00:00Z", viewCount: (index + 1) * 100 }]
}));

function fakeYoutube({ wrongIdentity = false } = {}) {
  const calls = { search: [], videos: [] };
  const ids = ["video000001", "video000002", "video000003"];
  const fixtures = {
    "Nile crocodile": [
      { id: ids[0], title: "Nile Crocodile: A Waterline Ambush", channel: "Wildlife Field Notes" },
      { id: ids[1], title: "The Silverback Protected His Troop", channel: "Wildlife Field Notes" },
      { id: ids[2], title: "Nile Crocodile Hunting", channel: "AI TIM£ £xploreR" }
    ],
    "Crocodylus niloticus": [{ id: ids[0], title: "Crocodylus niloticus in the wild", channel: "Nature Science" }],
    "crocodile senses": [
      { id: ids[0], title: "How Crocodiles Sense Prey Through Water", channel: "Nature Science" },
      { id: ids[1], title: "Crocodile losing to Luffy makes no sense", channel: "Anime Clips" }
    ],
    "water surface waves crocodile": [{ id: ids[0], title: "Crocodile Detects Water Surface Waves", channel: "Nature Science" }],
    "African wildlife documentary": [{ id: ids[0], title: "African Wildlife Documentary: River Giants", channel: "Nature Science" }],
    "wildlife video storytelling": [{ id: ids[0], title: "Wildlife Storytelling in Three Clear Shots", channel: "Creator School" }],
    "wildlife filmmaking tips": [{ id: ids[0], title: "How to Film Wildlife Up Close: Camera Tips", channel: "Creator School" }]
  };
  const api = {
    channels: { list: async () => ({ data: { items: [{
      id: env.SONICVHIBEZ_CHANNEL_ID,
      snippet: { title: wrongIdentity ? "Different Channel" : "SonicVhibez", customUrl: wrongIdentity ? "@other" : "@sonicvhibez" },
      contentDetails: { relatedPlaylists: { uploads: "uploads-playlist" } }
    }] } }) },
    playlistItems: { list: async () => ({ data: { pageInfo: { totalResults: 0 }, items: [] } }) },
    videos: { list: async args => {
      calls.videos.push(args);
      return { data: { items: (args.id ?? "").split(",").map((id, index) => ({ id, statistics: { viewCount: String(index === 0 ? 1000 : 500) } })) } };
    } },
    search: { list: async args => {
      calls.search.push(args);
      return { data: { items: (fixtures[args.q] ?? []).map(row => ({
        id: { videoId: row.id }, snippet: { title: row.title, channelTitle: row.channel, publishedAt: "2026-11-01T00:00:00Z" }
      })) } };
    } }
  };
  return { api, calls };
}
const fakeOAuthFactory = () => ({
  setCredentials() {},
  getAccessToken: async () => ({ token: "access-token" }),
  getTokenInfo: async () => ({ scopes: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/youtube.upload"] })
});

test("SEO research ranks query-specific title signals and keeps each content track separate", () => {
  const report = buildSeoResearchReport({ channel, queryResults: makeResults(), generatedAt: "2026-11-09T16:00:00Z" });
  assert.equal(report.keywordCandidates.length, SEO_SEED_QUERIES.length);
  assert.equal(report.keywordCandidates[0].phrase, "wildlife filmmaking tips");
  assert.equal(report.keywordCandidates[0].contentTrack, "short-001");
  assert.equal(report.keywordCandidates.at(-1).contentTrack, "long-form-001");
  assert.equal(report.searchVolume, null);
  assert.equal(report.keywordCompetition, null);
  assert.equal(report.market.regionCode, null);
  assert.equal(report.market.scope, "GLOBAL");
  assert.equal(report.queryResults.length, SEO_SEED_QUERIES.length);
  assert.equal(report.queryResults[0].videos[0].relevanceClass, "EXACT_TITLE_MATCH");
  assert.equal(report.actions.metadataWritesPerformed, false);
});

test("Nile crocodile relevance excludes generic wildlife titles and keeps generic crocodile titles separate", () => {
  const results = makeResults();
  results[0].videos = [
    { videoId: "video000001", title: "Nile Crocodile Hunting", channelTitle: "Wildlife Notes", publishedAt: "2026-11-01T00:00:00Z", viewCount: 1000 },
    { videoId: "video000002", title: "Crocodile in an African River", channelTitle: "Nature Notes", publishedAt: "2026-11-01T00:00:00Z", viewCount: 500 },
    { videoId: "video000003", title: "The Silverback Protected His Troop", channelTitle: "Wildlife Notes", publishedAt: "2026-11-01T00:00:00Z", viewCount: 9000 }
  ];
  const report = buildSeoResearchReport({ channel, queryResults: results, generatedAt: "2026-11-09T16:00:00Z" });
  const candidate = report.keywordCandidates.find(item => item.phrase === "Nile crocodile");
  assert.equal(candidate.exactTitleSignalResultsCount, 1);
  assert.equal(candidate.relatedTitleSignalResultsCount, 1);
  assert.equal(candidate.unmatchedResultsCount, 1);
  assert.equal(candidate.combinedExactTitleViews, 1000);
  assert.equal(candidate.combinedRelatedTitleViews, 500);
  assert.ok(candidate.unmatchedSampleVideos.some(video => video.title.includes("Silverback")));
});

test("off-topic entertainment and potential AI sources are excluded from positive view totals", () => {
  const results = makeResults();
  results[0].videos = [
    { videoId: "video000001", title: "Nile Crocodile Hunting", channelTitle: "Wildlife Notes", publishedAt: "2026-11-01T00:00:00Z", viewCount: 1000 },
    { videoId: "video000002", title: "Crocodile losing to Luffy makes no sense", channelTitle: "Anime Clips", publishedAt: "2026-11-01T00:00:00Z", viewCount: 8000 },
    { videoId: "video000003", title: "Nile Crocodile Attack", channelTitle: "AI TIM£ £xploreR", publishedAt: "2026-11-01T00:00:00Z", viewCount: 9000 }
  ];
  const report = buildSeoResearchReport({ channel, queryResults: results, generatedAt: "2026-11-09T16:00:00Z" });
  const candidate = report.keywordCandidates.find(item => item.phrase === "Nile crocodile");
  assert.equal(candidate.exactTitleSignalResultsCount, 1);
  assert.equal(candidate.excludedResultsCount, 2);
  assert.equal(candidate.combinedExactTitleViews, 1000);
  assert.ok(candidate.excludedSampleVideos.some(video => video.title.includes("Luffy")));
  assert.ok(candidate.excludedSampleVideos.some(video => video.qualityFlags.includes("POTENTIAL_AI_OR_SYNTHETIC_SOURCE_REQUIRES_MANUAL_REVIEW")));
});

test("monthly research uses global English-language search by default and never writes metadata", async () => {
  const { api, calls } = fakeYoutube();
  const directory = fs.mkdtempSync(path.join(process.cwd(), ".tmp-sonic-seo-"));
  try {
    const result = await researchSonicVhibezSeo({ env, youtubeFactory: () => api, oauthFactory: fakeOAuthFactory, now: new Date("2026-11-09T16:00:00Z"), outputDir: path.relative(process.cwd(), directory) });
    assert.equal(result.status, "PASS_READ_ONLY_SEO_RESEARCH");
    assert.equal(calls.search.length, SEO_SEED_QUERIES.length);
    assert.ok(calls.search.every(args => args.regionCode === undefined));
    assert.ok(calls.search.every(args => args.relevanceLanguage === "en"));
    const json = JSON.parse(fs.readFileSync(result.jsonPath, "utf8"));
    const markdown = fs.readFileSync(result.markdownPath, "utf8");
    assert.equal(json.keywordCandidates.length, SEO_SEED_QUERIES.length);
    assert.equal(json.queryResults.length, SEO_SEED_QUERIES.length);
    assert.equal(json.market.scope, "GLOBAL");
    assert.equal(json.market.regionCode, null);
    assert.equal(json.actions.metadataWritesPerformed, false);
    assert.match(markdown, /Global \(no region filter\)/);
    assert.match(markdown, /NOT monthly search-volume estimates/);
    assert.match(markdown, /Long-form 001 — Nile crocodile documentary/);
    assert.match(markdown, /Short 001 — creator education/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("an explicitly configured SEO_REGION_CODE applies a country filter without changing the global default", async () => {
  const { api, calls } = fakeYoutube();
  const directory = fs.mkdtempSync(path.join(process.cwd(), ".tmp-sonic-seo-za-"));
  try {
    const result = await researchSonicVhibezSeo({ env: { ...env, SEO_REGION_CODE: "za" }, youtubeFactory: () => api, oauthFactory: fakeOAuthFactory, now: new Date("2026-11-09T16:00:00Z"), outputDir: path.relative(process.cwd(), directory) });
    assert.equal(result.status, "PASS_READ_ONLY_SEO_RESEARCH");
    assert.ok(calls.search.every(args => args.regionCode === "ZA"));
    const json = JSON.parse(fs.readFileSync(result.jsonPath, "utf8"));
    assert.equal(json.market.regionCode, "ZA");
    assert.equal(json.market.scope, "COUNTRY");
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("invalid SEO_REGION_CODE fails closed before search calls", async () => {
  const { api, calls } = fakeYoutube();
  await assert.rejects(researchSonicVhibezSeo({ env: { ...env, SEO_REGION_CODE: "SOUTH AFRICA" }, youtubeFactory: () => api, oauthFactory: fakeOAuthFactory }), /SEO_REGION_CODE must be an ISO 3166-1 alpha-2 country code/);
  assert.equal(calls.search.length, 0);
});

test("SEO research refuses an unverified channel before running YouTube search", async () => {
  const { api, calls } = fakeYoutube({ wrongIdentity: true });
  await assert.rejects(researchSonicVhibezSeo({ env, youtubeFactory: () => api, oauthFactory: fakeOAuthFactory }), /title\/handle did not match the approved SonicVhibez identity/);
  assert.equal(calls.search.length, 0);
});

test("SEO research failure explains OAuth invalid_grant without exposing credentials", () => {
  const message = describeSeoResearchFailure({ response: { data: { error: "invalid_grant" } } });
  assert.match(message, /Re-authorize the existing OAuth client/);
  assert.doesNotMatch(message, /refresh-token|client-secret/);
});
