#!/usr/bin/env node
/**
 * Read-only authenticated SonicVhibez channel identity and uploads inventory check.
 * This script never inserts, updates, schedules, or deletes YouTube content.
 */
import { pathToFileURL } from "node:url";

export const APPROVED_SONICVHIBEZ_CHANNEL_ID = "UCSlkuPfHH78oGC1o418HV4w";
const APPROVED_HANDLE = "sonicvhibez";
const ALLOWED_VISIBILITY = new Set(["public", "private", "unlisted"]);

function normalizeHandle(value) {
  return typeof value === "string" ? value.trim().replace(/^@/, "").toLowerCase() : "";
}

export function isApprovedSonicVhibezChannel(channel) {
  if (!channel || channel.id !== APPROVED_SONICVHIBEZ_CHANNEL_ID) return false;
  if (channel.snippet?.title === "SonicVhibez") return true;
  return channel.snippet?.title === "SonicVibes" &&
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
  if (configuredChannelId !== APPROVED_SONICVHIBEZ_CHANNEL_ID) {
    throw new Error("SONICVHIBEZ_CHANNEL_ID does not match the owner-supplied Studio channel ID");
  }

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
      verifiedVideoCount += 1;
    }
    if (returned.size !== expected.size) {
      throw new Error("YouTube omitted one or more requested uploads; history inventory is incomplete");
    }
  }

  if (verifiedVideoCount !== expectedTotal) {
    throw new Error("verified video count does not match the uploads playlist total");
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
    process.stderr.write("BLOCKED: " + (error?.message ?? String(error)) + "\n");
    process.exitCode = 2;
  });
}
