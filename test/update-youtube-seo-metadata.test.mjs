import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalSnippet,
  snippetSha256,
  validateSeoMetadataApproval,
  updateApprovedYoutubeSeo
} from "../scripts/update-youtube-seo-metadata.mjs";

const channelId = "UC1111111111111111111111";
const videoId = "abcdefghijk";
const now = new Date("2026-11-09T12:00:00.000Z");
const env = {
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
  YOUTUBE_REFRESH_TOKEN: "refresh-token",
  SONICVHIBEZ_CHANNEL_ID: channelId,
  SEO_METADATA_WRITE_ENABLED: "YES",
  SEO_METADATA_DRY_RUN: "YES"
};
const currentSnippet = {
  channelId,
  title: "Existing approved wildlife title",
  description: "Existing description",
  tags: ["wildlife", "nature"],
  categoryId: "15"
};
function approval(overrides = {}) {
  return {
    schemaVersion: 1,
    status: "APPROVED",
    approvalId: "SEO-APPROVAL-001",
    approvedBy: "Channel owner",
    approvedAt: "2026-11-09T11:00:00.000Z",
    expiresAt: "2026-11-20T11:00:00.000Z",
    channelId,
    channelHandle: "@SonicVhibez",
    videoId,
    expectedCurrentSha256: snippetSha256(currentSnippet),
    desired: {
      title: "African wildlife: the hidden behaviour",
      description: "A carefully verified wildlife story.",
      tags: ["African wildlife", "wildlife documentary", "animal behaviour"]
    },
    evidence: { searchVolume: null, sources: ["https://www.youtube.com/results?search_query=African+wildlife"] },
    ...overrides
  };
}
function fakeYoutube() {
  const calls = { updates: [], lists: [] };
  const api = {
    channels: { list: async () => ({ data: { items: [{
      id: channelId,
      snippet: { title: "SonicVibes", customUrl: "@SonicVhibez" },
      contentDetails: { relatedPlaylists: { uploads: "uploads" } }
    }] } }) },
    playlistItems: { list: async () => ({ data: { pageInfo: { totalResults: 0 }, items: [] } }) },
    videos: {
      list: async args => {
        calls.lists.push(args);
        return { data: { items: [{
          id: videoId,
          snippet: { ...remoteSnippet },
          status: { privacyStatus: "private" }
        }] } };
      },
      update: async args => { calls.updates.push(args); remoteSnippet = { ...args.requestBody.snippet, channelId }; return { data: { id: videoId } }; }
    }
  };
  return { api, calls };
}

test("approval is bound to the exact channel, video, reviewer, expiry and current metadata", () => {
  const valid = validateSeoMetadataApproval(approval(), { channelId, now });
  assert.equal(valid.videoId, videoId);
  assert.equal(valid.desired.tags.length, 3);
  assert.throws(() => validateSeoMetadataApproval(approval({ channelId: "UC2222222222222222222222" }), { channelId, now }), /not bound/);
  assert.throws(() => validateSeoMetadataApproval(approval({ expiresAt: "2026-11-08T00:00:00Z" }), { channelId, now }), /expired/);
  assert.throws(() => validateSeoMetadataApproval(approval({ evidence: { volumeClaimPerMinute: 1000000 } }), { channelId, now }), /per-minute/);
  assert.throws(() => validateSeoMetadataApproval(approval({ expectedCurrentSha256: "stale" }), { channelId, now }), /SHA-256/);
});

test("SEO metadata dry run verifies SonicVhibez and proposes only snippet metadata without writing", async () => {
  const file = path.join(process.cwd(), ".tmp-seo-approval-" + process.pid + ".json");
  fs.writeFileSync(file, JSON.stringify(approval()), { flag: "wx" });
  const { api, calls } = fakeYoutube();
  try {
    const result = await updateApprovedYoutubeSeo({
      env,
      approvalPath: path.basename(file),
      youtubeFactory: () => api,
      now,
      dryRun: true
    });
    assert.equal(result.status, "PASS_SEO_METADATA_DRY_RUN");
    assert.equal(result.writesPerformed, false);
    assert.equal(result.privacyStatus, "private");
    assert.equal(calls.updates.length, 0);
  } finally {
    fs.rmSync(file, { force: true });
  }
});

test("live metadata writes require a separate explicit live confirmation", async () => {
  await assert.rejects(
    updateApprovedYoutubeSeo({ env: { ...env, SEO_METADATA_DRY_RUN: "NO" }, approvalPath: "missing.json", youtubeFactory: () => ({}), now, dryRun: false }),
    /SEO_METADATA_LIVE_CONFIRM must be YES/
  );
});

test("canonical metadata hash is stable and includes tags and category", () => {
  assert.equal(snippetSha256(canonicalSnippet(currentSnippet)), snippetSha256(currentSnippet));
  assert.notEqual(snippetSha256(currentSnippet), snippetSha256({ ...currentSnippet, tags: ["changed"] }));
});

test("live update writes only snippet fields and verifies the exact result without touching privacy", async () => {
  const file = path.join(process.cwd(), ".tmp-seo-live-approval-" + process.pid + ".json");
  fs.writeFileSync(file, JSON.stringify(approval()), { flag: "wx" });
  const { api, calls } = fakeYoutube();
  try {
    const result = await updateApprovedYoutubeSeo({
      env: { ...env, SEO_METADATA_LIVE_CONFIRM: "YES", SEO_METADATA_DRY_RUN: "NO" },
      approvalPath: path.basename(file),
      youtubeFactory: () => api,
      now,
      dryRun: false
    });
    assert.equal(result.status, "PASS_SEO_METADATA_UPDATED_AND_VERIFIED");
    assert.equal(result.writesPerformed, true);
    assert.equal(result.privacyStatus, "private");
    assert.equal(calls.updates.length, 1);
    assert.deepEqual(calls.updates[0].part, ["snippet"]);
    assert.equal("status" in calls.updates[0].requestBody, false);
    assert.equal(calls.updates[0].requestBody.snippet.title, approval().desired.title);
    assert.equal(calls.updates[0].requestBody.snippet.categoryId, "15");
  } finally {
    fs.rmSync(file, { force: true });
  }
});
