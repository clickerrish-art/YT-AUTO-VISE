import fs from "node:fs";
import path from "node:path";
import { evaluateNextPublication } from "./schedule-policy.mjs";

const allowedFormats = new Set(["long_form", "short"]);
const allowedVisibility = new Set(["public", "private", "unlisted"]);
const unresolvedStates = new Set(["UPLOADING_PRIVATE", "REMOTE_ACCEPTED_RECONCILIATION_REQUIRED", "RECOVERY_REQUIRED", "UNCERTAIN", "OUTCOME_UNCERTAIN"]);

export function assertNoUnresolvedUploadAttempts(ledger) {
  if (!ledger || !Array.isArray(ledger.attempts)) throw new Error("upload attempt ledger is missing or invalid; publication history cannot be trusted");
  const unresolved = ledger.attempts.filter(attempt => unresolvedStates.has(String(attempt?.status ?? "").toUpperCase()));
  if (unresolved.length) throw new Error("unresolved upload attempts require remote reconciliation before another upload: " + unresolved.map(a => a.jobId ?? a.attemptId ?? "(unknown)").join(", "));
  return true;
}

export function validateHistoryReconciliation({ channelId, remoteVideos, reconciliation }) {
  if (!channelId || !Array.isArray(remoteVideos)) throw new Error("authenticated channel and complete remote video list are required");
  if (!reconciliation || reconciliation.complete !== true || reconciliation.channelId !== channelId) throw new Error("channel history reconciliation must be complete and bound to the authenticated channel ID");
  if (typeof reconciliation.verifiedBy !== "string" || reconciliation.verifiedBy.trim().length < 2 || !Number.isFinite(Date.parse(reconciliation.verifiedAt ?? ""))) throw new Error("channel history reconciliation needs reviewer identity and a valid verification timestamp");
  if (!Array.isArray(reconciliation.videos)) throw new Error("channel history reconciliation must contain a videos array");
  const remoteById = new Map();
  for (const video of remoteVideos) {
    if (!video?.id || remoteById.has(video.id)) throw new Error("remote channel history contains a missing or duplicate video ID");
    const actualPublishedAt = video.snippet?.publishedAt;
    const visibility = video.status?.privacyStatus;
    if (!Number.isFinite(Date.parse(actualPublishedAt ?? "")) || !allowedVisibility.has(visibility)) throw new Error("remote video is missing an actual publication timestamp or known visibility: " + video.id);
    remoteById.set(video.id, { id: video.id, actualPublishedAt: new Date(actualPublishedAt).toISOString(), status: visibility });
  }
  const records = new Map();
  for (const item of reconciliation.videos) {
    if (!item?.id || records.has(item.id)) throw new Error("reconciled history contains a missing or duplicate video ID");
    if (!allowedFormats.has(item.format)) throw new Error("each reconciled video must be classified as long_form or short: " + item.id);
    if (!allowedVisibility.has(item.visibility) || !Number.isFinite(Date.parse(item.actualPublishedAt ?? ""))) throw new Error("reconciled history requires visibility and actualPublishedAt for " + item.id);
    records.set(item.id, item);
  }
  if (remoteById.size !== records.size) throw new Error("reconciled history does not cover every remote channel video; history is incomplete");
  for (const [id, remote] of remoteById) {
    const record = records.get(id);
    if (!record) throw new Error("remote video is missing from reconciled history: " + id);
    if (new Date(record.actualPublishedAt).toISOString() !== remote.actualPublishedAt || record.visibility !== remote.status) throw new Error("reconciled timestamp/visibility does not match YouTube for video " + id);
  }
  return [...records.values()].map(item => ({ id: item.id, status: item.visibility, actualPublishedAt: new Date(item.actualPublishedAt).toISOString(), format: item.format }));
}

export async function fetchCompleteYoutubeHistory(youtube, channel, reconciliationPath, channelId) {
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error("authenticated SonicVhibez uploads playlist is unavailable; cannot verify complete channel history");
  const playlistItems = [];
  let pageToken;
  for (let page = 0; page < 100; page++) {
    const response = await youtube.playlistItems.list({ part: ["contentDetails"], playlistId: uploadsPlaylistId, maxResults: 50, ...(pageToken ? { pageToken } : {}) });
    playlistItems.push(...(response.data.items ?? []).map(item => item.contentDetails?.videoId).filter(Boolean));
    pageToken = response.data.nextPageToken;
    if (!pageToken) break;
    if (page === 99) throw new Error("channel history exceeded the 5,000-item verification bound; refusing incomplete history");
  }
  if (new Set(playlistItems).size !== playlistItems.length) throw new Error("uploads playlist contains duplicate video IDs; history requires reconciliation");
  const remoteVideos = [];
  for (let offset = 0; offset < playlistItems.length; offset += 50) {
    const ids = playlistItems.slice(offset, offset + 50);
    if (!ids.length) continue;
    const response = await youtube.videos.list({ part: ["id", "snippet", "status"], id: ids.join(",") });
    remoteVideos.push(...(response.data.items ?? []));
  }
  if (remoteVideos.length !== playlistItems.length) throw new Error("YouTube did not return every upload-playlist video; history is incomplete");
  let reconciliation;
  try { reconciliation = JSON.parse(fs.readFileSync(path.resolve(reconciliationPath), "utf8")); }
  catch { throw new Error("CHANNEL_HISTORY_RECONCILIATION_PATH is missing or invalid; complete owner-reviewed history is required"); }
  return validateHistoryReconciliation({ channelId, remoteVideos, reconciliation });
}

export function assertNextPublicationAllowed({ history, pendingAttempts, proposedAt, jobId, format }) {
  const result = evaluateNextPublication({ history, historyVerified: true, pendingAttempts, proposedAt, jobId, format });
  if (!result.valid) throw new Error("rolling publication cycle gate blocked upload: " + result.errors.join("; "));
  return result;
}
