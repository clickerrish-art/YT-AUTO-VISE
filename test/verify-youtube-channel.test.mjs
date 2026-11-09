import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isApprovedSonicVhibezChannel,
  verifySonicVhibezChannel
} from "../scripts/verify-youtube-channel.mjs";

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

test("channel identity requires the authenticated ID plus exact SonicVhibez handle/title, without a hard-coded ID", () => {
  assert.equal(isApprovedSonicVhibezChannel(channel), true);
  assert.equal(isApprovedSonicVhibezChannel({ ...channel, id: "UC2222222222222222222222" }), true);
  assert.equal(isApprovedSonicVhibezChannel({ ...channel, id: "UC0000000000000000000000" }), true);
  assert.equal(isApprovedSonicVhibezChannel({ ...channel, snippet: { title: "Unrelated", customUrl: "@sonicvhibez" } }), false);
  assert.equal(isApprovedSonicVhibezChannel({ ...channel, snippet: { title: "SonicVibes", customUrl: "@other" } }), false);
});

test("read-only verification checks every page and every video without exposing IDs", async () => {
  const ids = Array.from({ length: 51 }, (_, i) => "video-" + i);
  const calls = [];
  const youtube = {
    channels: { list: async args => {
      assert.deepEqual(args.mine, true);
      return { data: { items: [channel] } };
    } },
    playlistItems: { list: async args => {
      calls.push(args);
      return args.pageToken
        ? { data: { pageInfo: { totalResults: 51 }, items: [{ contentDetails: { videoId: ids[50] } }] } }
        : { data: { pageInfo: { totalResults: 51 }, nextPageToken: "page-2", items: ids.slice(0, 50).map(videoId => ({ contentDetails: { videoId } })) } };
    } },
    videos: { list: async ({ id }) => ({
      data: { items: id.split(",").map(videoId => ({
        id: videoId,
        snippet: { channelId: CHANNEL_ID },
        status: { privacyStatus: videoId === "video-50" ? "unlisted" : "private" }
      })) }
    }) }
  };
  const result = await verifySonicVhibezChannel({ env, youtubeFactory: () => youtube });
  assert.equal(result.status, "PASS_READ_ONLY_IDENTITY_AND_INVENTORY");
  assert.equal(result.totalUploads, 51);
  assert.deepEqual(result.visibilityCounts, { public: 0, private: 50, unlisted: 1 });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].pageToken, "page-2");
  assert.equal(JSON.stringify(result).includes("video-"), false);
});

test("read-only verification refuses a different authenticated channel before reading uploads", async () => {
  const youtube = {
    channels: { list: async () => ({ data: { items: [{ ...channel, id: "UC0000000000000000000000" }] } }) },
    playlistItems: { list: async () => { throw new Error("must not enumerate another channel"); } }
  };
  await assert.rejects(
    verifySonicVhibezChannel({ env, youtubeFactory: () => youtube }),
    /does not own or manage the configured SonicVhibez channel ID/
  );
});

test("read-only verification fails closed when pagination or video details are incomplete", async () => {
  const badPage = {
    channels: { list: async () => ({ data: { items: [channel] } }) },
    playlistItems: { list: async () => ({ data: { pageInfo: { totalResults: 2 }, items: [{ contentDetails: { videoId: "one" } }] } }) },
    videos: { list: async () => ({ data: { items: [] } }) }
  };
  await assert.rejects(verifySonicVhibezChannel({ env, youtubeFactory: () => badPage }), /pagination did not cover/);

  const missingVideo = {
    channels: { list: async () => ({ data: { items: [channel] } }) },
    playlistItems: { list: async () => ({ data: { pageInfo: { totalResults: 1 }, items: [{ contentDetails: { videoId: "one" } }] } }) },
    videos: { list: async () => ({ data: { items: [] } }) }
  };
  await assert.rejects(verifySonicVhibezChannel({ env, youtubeFactory: () => missingVideo }), /omitted one or more/);
});

test("read-only verification rejects a mismatched configured channel ID and missing secrets", async () => {
  await assert.rejects(
    verifySonicVhibezChannel({
      env: { ...env, SONICVHIBEZ_CHANNEL_ID: "UC0000000000000000000000" },
      youtubeFactory: () => ({ channels: { list: async () => ({ data: { items: [channel] } }) } })
    }),
    /does not own or manage the configured SonicVhibez channel ID/
  );
  await assert.rejects(
    verifySonicVhibezChannel({ env: { ...env, YOUTUBE_REFRESH_TOKEN: "" } }),
    /missing required GitHub Actions secret: YOUTUBE_REFRESH_TOKEN/
  );
});

 
test("read-only verification writes a complete owner-review inventory artifact without logging private IDs", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-youtube-inventory-"));
  const inventoryPath = path.join(directory, "inventory.json");
  const youtube = {
    channels: { list: async () => ({ data: { items: [channel] } }) },
    playlistItems: { list: async () => ({ data: { pageInfo: { totalResults: 2 }, items: [
      { contentDetails: { videoId: "private-video-1" } },
      { contentDetails: { videoId: "public-video-2" } }
    ] } }) },
    videos: { list: async () => ({ data: { items: [
      { id: "private-video-1", snippet: { channelId: CHANNEL_ID, publishedAt: "2026-10-01T10:00:00Z" }, status: { privacyStatus: "private" }, contentDetails: { duration: "PT55S" } },
      { id: "public-video-2", snippet: { channelId: CHANNEL_ID, publishedAt: "2026-10-04T10:00:00Z" }, status: { privacyStatus: "public" }, contentDetails: { duration: "PT8M" } }
    ] } }) }
  };
  try {
    const result = await verifySonicVhibezChannel({ env: { ...env, YOUTUBE_HISTORY_INVENTORY_PATH: inventoryPath }, youtubeFactory: () => youtube });
    assert.equal(result.totalUploads, 2);
    const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
    assert.equal(inventory.complete, true);
    assert.equal(inventory.mode, "READ_ONLY_OWNER_REVIEW_REQUIRED");
    assert.equal(inventory.videos.length, 2);
    assert.equal(inventory.videos[0].format, "UNCLASSIFIED_REQUIRES_OWNER_REVIEW");
    assert.equal(inventory.videos[0].duration, "PT55S");
    assert.match(inventory.verifiedAt, /^\\d{4}-\\d{2}-\\d{2}T/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
