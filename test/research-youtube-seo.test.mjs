import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SEO_SEED_QUERIES,
  buildSeoResearchReport,
  researchSonicVhibezSeo
} from "../scripts/research-youtube-seo.mjs";

const CHANNEL_ID = "UC1111111111111111111111";
const env = {
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
  YOUTUBE_REFRESH_TOKEN: "refresh-token",
  SONICVHIBEZ_CHANNEL_ID: CHANNEL_ID
};
const channel = {
  id: CHANNEL_ID,
  snippet: { title: "SonicVibes", customUrl: "@SonicVhibez" },
  contentDetails: { relatedPlaylists: { uploads: "uploads-id" } }
};
const ids = ["video000001", "video000002"];

function fakeYoutube({ wrongIdentity = false } = {}) {
  const calls = { search: [], writes: [] };
  const api = {
    channels: {
      list: async () => ({
        data: {
          items: [wrongIdentity
            ? { ...channel, snippet: { title: "Different Channel", customUrl: "@other" } }
            : channel]
        }
      })
    },
    playlistItems: {
      list: async () => ({ data: { pageInfo: { totalResults: 0 }, items: [] } })
    },
    videos: {
      list: async args => ({
        data: {
          items: (args.id ?? "").split(",").filter(Boolean).map((id, index) => ({
            id,
            statistics: { viewCount: String(index === 0 ? 1000 : 500) }
          }))
        }
      })
    },
    search: {
      list: async args => {
        calls.search.push(args);
        return {
          data: {
            items: ids.map((videoId, index) => ({
              id: { videoId },
              snippet: {
                title: index === 0 ? "African wildlife encounter" : "Wildlife documentary in Africa",
                channelTitle: "Wildlife Research Channel",
                publishedAt: "2026-10-10T12:00:00Z"
              }
            }))
          }
        };
      }
    }
  };
  return { api, calls };
}

test("SEO report ranks the configured phrases using view evidence and never invents search volume", () => {
  const queryResults = SEO_SEED_QUERIES.map((query, index) => ({
    query,
    videos: [{
      videoId: ids[0],
      title: "African wildlife encounter",
      channelTitle: "Wildlife Research Channel",
      publishedAt: "2026-10-10T12:00:00Z",
      viewCount: index * 100
    }]
  }));
  const report = buildSeoResearchReport({
    channel: { id: CHANNEL_ID, title: "SonicVibes", handle: "@sonicvhibez" },
    queryResults,
    generatedAt: "2026-11-09T16:00:00Z"
  });
  assert.equal(report.keywordCandidates.length, SEO_SEED_QUERIES.length);
  assert.equal(report.keywordCandidates[0].phrase, SEO_SEED_QUERIES.at(-1));
  assert.equal(report.searchVolume, null);
  assert.equal(report.keywordCompetition, null);
  assert.equal(report.evidenceType, "YOUTUBE_SEARCH_RESULT_VIDEO_PERFORMANCE_PROXY_NOT_SEARCH_VOLUME");
  assert.equal(report.actions.metadataWritesPerformed, false);
  assert.equal(report.actions.brandingChanged, false);
  assert.equal(report.actions.publishingEnabled, false);
});

test("monthly research verifies the real channel and writes JSON plus Markdown review artifacts", async () => {
  const { api, calls } = fakeYoutube();
  const directory = fs.mkdtempSync(path.join(process.cwd(), ".tmp-sonic-seo-"));
  try {
    const result = await researchSonicVhibezSeo({
      env,
      youtubeFactory: () => api,
      now: new Date("2026-11-09T16:00:00Z"),
      outputDir: path.relative(process.cwd(), directory)
    });
    assert.equal(result.status, "PASS_READ_ONLY_SEO_RESEARCH");
    assert.equal(result.candidateCount, SEO_SEED_QUERIES.length);
    assert.equal(result.metadataWritesPerformed, false);
    assert.equal(calls.search.length, SEO_SEED_QUERIES.length);
    for (const [index, args] of calls.search.entries()) {
      assert.equal(args.q, SEO_SEED_QUERIES[index]);
      assert.equal(args.regionCode, "ZA");
      assert.equal(args.relevanceLanguage, "en");
      assert.equal(args.order, "viewCount");
      assert.equal(args.type, "video");
      assert.equal(args.maxResults, 10);
      assert.equal(args.publishedAfter, "2026-08-11T16:00:00.000Z");
    }
    const json = JSON.parse(fs.readFileSync(result.jsonPath, "utf8"));
    const markdown = fs.readFileSync(result.markdownPath, "utf8");
    assert.equal(json.channel.id, CHANNEL_ID);
    assert.equal(json.keywordCandidates.length, SEO_SEED_QUERIES.length);
    assert.match(markdown, /NOT monthly search-volume estimates/);
    assert.match(markdown, /No channel branding or YouTube metadata was changed/);
    assert.equal(fs.readdirSync(directory).length, 2);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("SEO research refuses an unverified channel before running YouTube search", async () => {
  const { api, calls } = fakeYoutube({ wrongIdentity: true });
  await assert.rejects(
    researchSonicVhibezSeo({ env, youtubeFactory: () => api }),
    /title\/handle did not match the approved SonicVhibez identity/
  );
  assert.equal(calls.search.length, 0);
});

test("SEO research requires all existing read-only OAuth secrets", async () => {
  await assert.rejects(
    researchSonicVhibezSeo({ env: { ...env, YOUTUBE_CLIENT_SECRET: "" }, youtubeFactory: () => ({}) }),
    /missing required GitHub Actions secret: YOUTUBE_CLIENT_SECRET/
  );
});

test("SEO research rejects an unsafe output directory", async () => {
  const { api } = fakeYoutube();
  await assert.rejects(
    researchSonicVhibezSeo({
      env,
      youtubeFactory: () => api,
      outputDir: "../outside"
    }),
    /SEO_REPORT_DIR must be a safe repository-relative directory/
  );
});


test("SEO ranking excludes obvious comedy and skit results from wildlife relevance totals", () => {
  const queryResults = SEO_SEED_QUERIES.map((query, index) => ({
    query,
    videos: index === 0 ? [
      {
        videoId: ids[0],
        title: "Lion and crocodile African wildlife documentary",
        channelTitle: "Wildlife Research Channel",
        publishedAt: "2026-10-10T12:00:00Z",
        viewCount: 1000
      },
      {
        videoId: ids[1],
        title: "Funny animal encounters skit #comedy",
        channelTitle: "Comedy Channel",
        publishedAt: "2026-10-10T12:00:00Z",
        viewCount: 50000
      }
    ] : [{
      videoId: ids[0],
      title: "African wildlife documentary",
      channelTitle: "Wildlife Research Channel",
      publishedAt: "2026-10-10T12:00:00Z",
      viewCount: 100
    }]
  }));
  const report = buildSeoResearchReport({
    channel: { id: CHANNEL_ID, title: "SonicVibes", handle: "@sonicvhibez" },
    queryResults,
    generatedAt: "2026-11-09T16:00:00Z"
  });
  const first = report.keywordCandidates.find(item => item.phrase === SEO_SEED_QUERIES[0]);
  assert.equal(first.resultsCount, 2);
  assert.equal(first.titleSignalResultsCount, 1);
  assert.equal(first.excludedResultsCount, 1);
  assert.equal(first.combinedTitleSignalViews, 1000);
  assert.equal(first.excludedSampleVideos[0].title, "Funny animal encounters skit #comedy");
});

test("Google OAuth failures give precise recovery guidance without exposing secrets", () => {
  assert.match(describeSeoResearchFailure({ message: "invalid_grant" }), /replace YOUTUBE_REFRESH_TOKEN/);
  assert.match(describeSeoResearchFailure({ response: { data: { error: "invalid_client" } } }), /YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET/);
  assert.match(describeSeoResearchFailure(new Error("network unavailable")), /network unavailable/);
});
