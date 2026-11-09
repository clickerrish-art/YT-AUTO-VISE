#!/usr/bin/env node
/**
 * Read-only authenticated SonicVhibez channel identity and uploads inventory check.
 * This script never inserts, updates, schedules, or deletes YouTube content.
 */
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";

const APPROVED_HANDLE = "sonicvhibez";
const ALLOWED_VISIBILITY = new Set(["public", "private", "unlisted"]);

function normalizeHandle(value) {
  return typeof value === "string" ? value.trim().replace(/^@/, "").toLowerCase() : "";
}

export function isApprovedSonicVhibezChannel(channel) {
  if (!channel || typeof channel.id !== "string" || !channel.id.trim()) return false;
  const title = typeof channel.snippet?.title === "string" ? channel.snippet.title.trim() : "";
  return ["SonicVhibez", "SonicVibes"].includes(title) &&
    normalizeHandle(channel.snippet?.customUrl) === APPROVED_HANDLE;
}

function requireSecret(env, name) {
  const value = env[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("missing required GitHub Actions secret: " + name);
  }
  return value.trim();
}

/** Verify the authenticated account and enumerate every uploads-playlist item.
 * Only aggregate counts are returned; private video IDs/titles are never logged.
 */
export async function verifySonicVhibezChannel({ env = process.env, youtubeFactory } = {}) {
  const clientId = requireSecret(env, "YOUTUBE_CLIENT_ID");
  const clientSecret = requireSecret(env, "YOUTUBE_CLIENT_SECRET");
  const refreshToken = requireSecret(env, "YOUTUBE_REFRESH_TOKEN");
  const configuredChannelId = requireSecret(env, "SONICVHIBEZ_CHANNEL_ID");
  let youtube;
  if (youtubeFactory) {
    youtube = youtubeFactory({ clientId, clientSecret, refreshToken });
  } else {
    const { google } = await import("googleapis");
    const oauth = new google.auth.OAuth2(clientId, clientSecret);
    oauth.setCredentials({ refresh_token: refreshToken });
    youtube = google.youtube({ version: "v3", auth: oauth });
  }

  const channelResponse = await youtube.channels.list({
    part: ["id", "snippet", "contentDetails"],
    mine: true
  });
  const channels = channelResponse?.data?.items;
  if (!Array.isArray(channels) || channels.length === 0) {
    throw new Error("YouTube OAuth returned no channel for the authenticated account");
  }
  const channel = channels.find(item => item?.id === configuredChannelId);
  if (!channel) {
    throw new Error("authenticated YouTube account does not own or manage the configured SonicVhibez channel ID");
  }
  if (!isApprovedSonicVhibezChannel(channel)) {
    throw new Error("authenticated channel ID matched, but channel title/handle did not match the approved SonicVhibez identity");
  }

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (typeof uploadsPlaylistId !== "string" || !uploadsPlaylistId.trim()) {
    throw new Error("authenticated SonicVhibez uploads playlist is unavailable");
  }

  const videoIds = [];
  const seenTokens = new Set();
  let pageToken;
  let expectedTotal;
  let pages = 0;
  let paginationComplete = false;
  while (pages < 100) {
    const response = await youtube.playlistItems.list({
      part: ["contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      ...(pageToken ? { pageToken } : {})
    });
    const data = response?.data;
    const total = data?.pageInfo?.totalResults;
    if (!Number.isSafeInteger(total) || total < 0) {
      throw new Error("uploads playlist omitted a valid total; history inventory is incomplete");
    }
    if (expectedTotal === undefined) expectedTotal = total;
    else if (expectedTotal !== total) {
      throw new Error("uploads playlist total changed during pagination; history inventory is inconsistent");
    }
    if (!Array.isArray(data.items)) {
      throw new Error("uploads playlist returned an invalid page");
    }
    for (const item of data.items) {
      const id = item?.contentDetails?.videoId;
      if (typeof id !== "string" || !id.trim()) {
        throw new Error("uploads playlist contains an item without a video ID");
      }
      videoIds.push(id);
    }
    pages += 1;
    const next = data.nextPageToken;
    if (!next) {
      paginationComplete = true;
      break;
    }
    if (seenTokens.has(next)) {
      throw new Error("uploads playlist repeated a page token; history inventory is incomplete");
    }
    seenTokens.add(next);
    pageToken = next;
  }
  if (!paginationComplete || videoIds.length !== expectedTotal) {
    throw new Error("uploads playlist pagination did not cover the reported total (maximum 5,000 items)");
  }
  if (new Set(videoIds).size !== videoIds.length) {
    throw new Error("uploads playlist contains duplicate video IDs");
  }

  const counts = { public: 0, private: 0, unlisted: 0 };
  const inventoryVideos = [];
  let verifiedVideoCount = 0;
  for (let offset = 0; offset < videoIds.length; offset += 50) {
    const batch = videoIds.slice(offset, offset + 50);
    const response = await youtube.videos.list({
      part: ["id", "snippet", "status", "contentDetails"],
      id: batch.join(",")
    });
    const items = response?.data?.items;
    if (!Array.isArray(items)) throw new Error("YouTube video details response was invalid");
    const expected = new Set(batch);
    const returned = new Set();
    for (const video of items) {
      if (!video?.id || !expected.has(video.id) || returned.has(video.id)) {
        throw new Error("YouTube video details did not match the requested uploads playlist IDs");
      }
      if (video.snippet?.channelId !== configuredChannelId) {
        throw new Error("an uploads-playlist video belongs to a different channel; refusing an incomplete or mixed history");
      }
      const visibility = video.status?.privacyStatus;
      if (!ALLOWED_VISIBILITY.has(visibility)) {
        throw new Error("a video has missing or unsupported visibility; refusing an incomplete history inventory");
      }
      returned.add(video.id);
      counts[visibility] += 1;
      inventoryVideos.push({ id: video.id, channelId: configuredChannelId, visibility, youtubePublishedAt: video.snippet?.publishedAt ?? null, scheduledPublishAt: video.status?.publishAt ?? null, duration: video.contentDetails?.duration ?? null, format: "UNCLASSIFIED_REQUIRES_OWNER_REVIEW" });
      verifiedVideoCount += 1;
    }
    if (returned.size !== expected.size) {
      throw new Error("YouTube omitted one or more requested uploads; history inventory is incomplete");
    }
  }

  if (verifiedVideoCount !== expectedTotal) {
    throw new Error("verified video count does not match the uploads playlist total");
  }
  const inventoryPathValue = env.YOUTUBE_HISTORY_INVENTORY_PATH;
  if (inventoryPathValue) {
    if (typeof inventoryPathValue !== "string" || !inventoryPathValue.trim() ||
        path.isAbsolute(inventoryPathValue) || path.normalize(inventoryPathValue).split(path.sep).includes("..")) {
      throw new Error("YOUTUBE_HISTORY_INVENTORY_PATH must be a safe repository-relative path");
    }
    const inventoryPath = path.resolve(process.cwd(), inventoryPathValue);
    const inventory = {
      schemaVersion: 1, complete: true, mode: "READ_ONLY_OWNER_REVIEW_REQUIRED",
      channelId: configuredChannelId, channelTitle: channel.snippet?.title ?? "",
      channelHandle: channel.snippet?.customUrl ?? "", verifiedAt: new Date().toISOString(),
      uploadsPlaylistPages: pages, totalUploads: verifiedVideoCount,
      visibilityCounts: counts, videos: inventoryVideos,
      reviewNotes: [
        "This is a complete read-only uploads-playlist inventory, not an owner-approved publication-history reconciliation.",
        "Classify each video's format and verify actual public publication timestamps before using it for cadence decisions.",
        "youtubePublishedAt is the YouTube API snippet timestamp; scheduledPublishAt is not an actual publication timestamp.",
        "Reconcile every local pending or uncertain upload attempt separately."
      ]
    };
    fs.mkdirSync(path.dirname(inventoryPath), { recursive: true, mode: 0o700 });
    const temporaryPath = inventoryPath + ".tmp-" + process.pid;
    fs.writeFileSync(temporaryPath, JSON.stringify(inventory, null, 2) + "\n", { mode: 0o600, flag: "wx" });
    fs.renameSync(temporaryPath, inventoryPath);
  }
  return Object.freeze({
    status: "PASS_READ_ONLY_IDENTITY_AND_INVENTORY",
    channelId: configuredChannelId,
    channelTitle: channel.snippet?.title ?? "",
    channelHandle: channel.snippet?.customUrl ?? "",
    uploadsPlaylistPages: pages,
    totalUploads: verifiedVideoCount,
    visibilityCounts: Object.freeze(counts),
    note: "Inventory completeness verified. Format classification, publication-cycle reconciliation and timestamp approval remain separate release gates."
  });
}

async function main() {
  const result = await verifySonicVhibezChannel();
  process.stdout.write([
    "PASS: authenticated YouTube account matches the owner-supplied SonicVhibez channel.",
    "Channel ID: " + result.channelId,
    "Channel title: " + result.channelTitle,
    "Channel handle: " + result.channelHandle,
    "Uploads playlist pages verified: " + result.uploadsPlaylistPages,
    "Uploads verified: " + result.totalUploads,
    "Visibility totals: public=" + result.visibilityCounts.public +
      ", private=" + result.visibilityCounts.private +
      ", unlisted=" + result.visibilityCounts.unlisted,
    result.note
  ].join("\n") + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    const message = error?.message ?? String(error);
    const safeMessage = message === "invalid_client"
      ? "Google rejected the configured OAuth client ID/secret pair (invalid_client). Verify the existing matching pair in GitHub Actions secrets; do not create another OAuth client. Secret values are never logged."
      : message;
    process.stderr.write("BLOCKED: " + safeMessage + "\n");
    process.exitCode = 2;
  });
}
