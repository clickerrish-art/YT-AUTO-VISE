import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { evaluateNextPublication, validateCadenceDecision, DEFAULT_MIN_SPACING_HOURS, DEFAULT_SCHEDULE_TIMEZONE } from "./schedule-policy.mjs";

const allowedFormats = new Set(["long_form", "short"]);
const allowedVisibility = new Set(["public", "private", "unlisted"]);
const unresolvedStates = new Set(["UPLOADING_PRIVATE", "REMOTE_ACCEPTED_RECONCILIATION_REQUIRED", "RECOVERY_REQUIRED", "UNCERTAIN", "OUTCOME_UNCERTAIN", "UPLOAD_OUTCOME_UNCERTAIN"]);


function strictIsoTimestamp(value) {
  if (typeof value !== "string") return NaN;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/);
  if (!match) return NaN;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = "", zone, sign, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText);
  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  calendar.setUTCHours(hour, minute, second, Number(fraction.padEnd(3, "0")));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day
      || calendar.getUTCHours() !== hour || calendar.getUTCMinutes() !== minute || calendar.getUTCSeconds() !== second) return NaN;
  if (zone !== "Z") {
    const offsetHour = Number(offsetHourText), offsetMinute = Number(offsetMinuteText);
    if (offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0)) return NaN;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : NaN;
}

const VERIFIED_UPLOAD_STATES = new Set(["PRIVATE_UPLOAD_VERIFIED"]);
const KNOWN_UPLOAD_STATES = new Set([
  ...unresolvedStates,
  ...VERIFIED_UPLOAD_STATES
]);

export function assertNoUnresolvedUploadAttempts(ledger) {
  if (!ledger || !Array.isArray(ledger.attempts)) throw new Error("upload attempt ledger is missing or invalid; publication history cannot be trusted");
  const unknown = ledger.attempts.filter(attempt => !KNOWN_UPLOAD_STATES.has(String(attempt?.status ?? "").toUpperCase()));
  if (unknown.length) {
    throw new Error("upload attempt ledger contains an unknown or missing status; reconcile the ledger before another upload: " +
      unknown.map(a => a?.jobId ?? a?.attemptId ?? "(unknown)").join(", "));
  }
  const unresolved = ledger.attempts.filter(attempt => unresolvedStates.has(String(attempt.status).toUpperCase()));
  if (unresolved.length) throw new Error("unresolved upload attempts require remote reconciliation before another upload: " + unresolved.map(a => a.jobId ?? a.attemptId ?? "(unknown)").join(", "));
  return true;
}

export function validateHistoryReconciliationSnapshot({ channelId, remoteVideos, reconciliation, reconciliationSha256 = crypto.createHash("sha256").update(JSON.stringify(reconciliation)).digest("hex"), now = new Date() }) {
  if (!channelId || !Array.isArray(remoteVideos)) throw new Error("authenticated channel and complete remote video list are required");
  if (!reconciliation || reconciliation.complete !== true || reconciliation.channelId !== channelId) throw new Error("channel history reconciliation must be complete and bound to the authenticated channel ID");
  if (!Array.isArray(reconciliation.videos)) throw new Error("channel history reconciliation must contain a videos array");
  if (!/^[a-f0-9]{64}$/.test(reconciliationSha256 ?? "")) throw new Error("channel history reconciliation document checksum is invalid");
  const nowTimestamp = now instanceof Date ? now.getTime() : strictIsoTimestamp(now);
  if (!Number.isFinite(nowTimestamp)) throw new Error("history verification time must be valid");
  const verifiedAtTimestamp = strictIsoTimestamp(reconciliation.verifiedAt);
  if (typeof reconciliation.verifiedBy !== "string" || reconciliation.verifiedBy.trim().length < 2 || !Number.isFinite(verifiedAtTimestamp)) throw new Error("channel history reconciliation needs reviewer identity and a valid verification timestamp");
  if (verifiedAtTimestamp > nowTimestamp) throw new Error("channel history reconciliation verification timestamp must not be in the future");
  const remoteById = new Map();
  for (const video of remoteVideos) {
    if (!video?.id || remoteById.has(video.id)) throw new Error("remote channel history contains a missing or duplicate video ID");
    if (video.snippet?.channelId !== channelId) throw new Error("remote video channel ID does not match the authenticated channel ID: " + video.id);
    const visibility = video.status?.privacyStatus;
    if (!allowedVisibility.has(visibility)) throw new Error("remote video has an unknown visibility: " + video.id);
    const publishAt = video.status?.publishAt;
    if (publishAt !== undefined && publishAt !== null && publishAt !== "") {
      if (visibility !== "private") throw new Error("scheduled YouTube videos must remain private until publication: " + video.id);
      const scheduledTimestamp = strictIsoTimestamp(publishAt);
      if (!Number.isFinite(scheduledTimestamp)) throw new Error("remote scheduled video has an invalid publishAt timestamp: " + video.id);
      if (scheduledTimestamp <= nowTimestamp) throw new Error("remote scheduled video has a past publishAt and requires reconciliation: " + video.id);
      remoteById.set(video.id, {
        id: video.id,
        scheduledAt: new Date(scheduledTimestamp).toISOString(),
        status: visibility,
        scheduled: true
      });
      continue;
    }
    const observedTimestamp = video.snippet?.publishedAt;
    const observedTimestampMs = strictIsoTimestamp(observedTimestamp);
    if (!Number.isFinite(observedTimestampMs)) {
      throw new Error(visibility === "private"
        ? "remote private upload is missing a valid uploadedAt timestamp: " + video.id
        : "remote video is missing an actual publication timestamp: " + video.id);
    }
    if (observedTimestampMs > nowTimestamp) {
      throw new Error(visibility === "private"
        ? "remote private upload timestamp must not be in the future: " + video.id
        : "remote video actual publication timestamp must not be in the future: " + video.id);
    }
    remoteById.set(video.id, {
      id: video.id,
      observedTimestamp: new Date(observedTimestampMs).toISOString(),
      status: visibility,
      scheduled: false
    });
  }
  const records = new Map();
  for (const item of reconciliation.videos) {
    if (!item?.id || records.has(item.id)) throw new Error("reconciled history contains a missing or duplicate video ID");
    if (!allowedFormats.has(item.format)) throw new Error("each reconciled video must be classified as long_form or short: " + item.id);
    if (!allowedVisibility.has(item.visibility)) throw new Error("reconciled history requires a known visibility for " + item.id);
    if (item.scheduledAt !== undefined && item.scheduledAt !== null && item.scheduledAt !== "") {
      if (item.visibility !== "private") throw new Error("scheduled reconciliation records must have private visibility: " + item.id);
      if (item.actualPublishedAt !== undefined && item.actualPublishedAt !== null && item.actualPublishedAt !== "") {
        throw new Error("scheduled reconciliation records cannot also claim an actual publication timestamp: " + item.id);
      }
      const scheduledTimestamp = strictIsoTimestamp(item.scheduledAt);
      if (!Number.isFinite(scheduledTimestamp) || scheduledTimestamp <= nowTimestamp) throw new Error("scheduled reconciliation record requires a valid future scheduledAt timestamp for " + item.id);
      records.set(item.id, {
        id: item.id,
        format: item.format,
        visibility: item.visibility,
        scheduledAt: new Date(scheduledTimestamp).toISOString()
      });
      continue;
    }
    if (item.visibility === "private") {
      const uploadedAt = strictIsoTimestamp(item.uploadedAt);
      if (!Number.isFinite(uploadedAt)) throw new Error("private reconciliation record requires visibility and uploadedAt for " + item.id);
      if (!["NEVER_PUBLISHED", "PREVIOUSLY_PUBLISHED"].includes(item.publicationState)) {
        throw new Error("private reconciliation record must declare publicationState NEVER_PUBLISHED or PREVIOUSLY_PUBLISHED for " + item.id);
      }
      const record = {
        id: item.id,
        format: item.format,
        visibility: item.visibility,
        uploadedAt: new Date(uploadedAt).toISOString(),
        publicationState: item.publicationState
      };
      if (item.publicationState === "PREVIOUSLY_PUBLISHED") {
        const actualPublishedAt = strictIsoTimestamp(item.actualPublishedAt);
        const evidenceReference = typeof item.publicationEvidenceReference === "string" ? item.publicationEvidenceReference.trim() : "";
        if (!Number.isFinite(actualPublishedAt) || actualPublishedAt < uploadedAt) {
          throw new Error("previously published private video requires an actualPublishedAt no earlier than uploadedAt for " + item.id);
        }
        if (evidenceReference.length < 12 || /placeholder|replace_with|todo|unknown|tbd/i.test(evidenceReference)) {
          throw new Error("previously published private video requires a real publicationEvidenceReference for " + item.id);
        }
        record.actualPublishedAt = new Date(actualPublishedAt).toISOString();
        record.publicationEvidenceReference = evidenceReference;
      } else if (
        (item.actualPublishedAt !== undefined && item.actualPublishedAt !== null && item.actualPublishedAt !== "") ||
        (item.publicationEvidenceReference !== undefined && item.publicationEvidenceReference !== null && item.publicationEvidenceReference !== "")
      ) {
        throw new Error("never-published private upload cannot claim a publication timestamp or publication evidence: " + item.id);
      }
      records.set(item.id, record);
      continue;
    }
    const actualPublishedAt = strictIsoTimestamp(item.actualPublishedAt);
    if (!Number.isFinite(actualPublishedAt)) throw new Error("reconciled history requires visibility and actualPublishedAt for " + item.id);
    records.set(item.id, {
      id: item.id,
      format: item.format,
      visibility: item.visibility,
      actualPublishedAt: new Date(actualPublishedAt).toISOString()
    });
  }
  if (remoteById.size !== records.size) throw new Error("reconciled history does not cover every remote channel video; history is incomplete");
  const history = [];
  const scheduledItems = [];
  const privateUploads = [];
  for (const [id, remote] of remoteById) {
    const record = records.get(id);
    if (!record) throw new Error("remote video is missing from reconciled history: " + id);
    if (remote.scheduled) {
      if (!record.scheduledAt || record.scheduledAt !== remote.scheduledAt || record.visibility !== remote.status) {
        throw new Error("reconciled scheduled timestamp/visibility does not match YouTube for video " + id);
      }
      scheduledItems.push({
        id,
        status: "scheduled",
        scheduledAt: remote.scheduledAt,
        format: record.format
      });
      continue;
    }
    if (remote.status === "private") {
      if (!record.uploadedAt || record.uploadedAt !== remote.observedTimestamp || record.visibility !== remote.status) {
        throw new Error("reconciled private upload timestamp/visibility does not match YouTube for video " + id);
      }
      if (record.publicationState === "PREVIOUSLY_PUBLISHED") {
        history.push({
          id,
          status: "private",
          actualPublishedAt: record.actualPublishedAt,
          format: record.format
        });
      } else {
        privateUploads.push({
          id,
          status: "private",
          uploadedAt: remote.observedTimestamp,
          format: record.format
        });
      }
      continue;
    }
    if (record.scheduledAt || record.uploadedAt || record.actualPublishedAt !== remote.observedTimestamp || record.visibility !== remote.status) {
      throw new Error("reconciled timestamp/visibility does not match YouTube for video " + id);
    }
    history.push({
      id,
      status: record.visibility,
      actualPublishedAt: remote.observedTimestamp,
      format: record.format
    });
  }
  return { history, scheduledItems, privateUploads, complete: true, channelId, verifiedAt: reconciliation.verifiedAt, verifiedBy: reconciliation.verifiedBy.trim(), reconciliationSha256 };
}

export function validateHistoryReconciliation(args) {
  return validateHistoryReconciliationSnapshot(args).history;
}

/**
 * Read the exact reviewed document through a pinned descriptor. Reject symlinks,
 * path replacement and mutation while reading so the checksum and parsed JSON
 * refer to the same stable regular-file bytes.
 */
export function readRegularFileNoFollow(filePath) {
  if (typeof filePath !== "string" || !filePath.trim()) throw new Error("History reconciliation path is required");
  if (typeof fs.constants.O_NOFOLLOW !== "number") {
    throw new Error("This platform cannot guarantee symlink rejection for channel-history evidence");
  }
  const absolute = path.resolve(filePath);
  const fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const before = fs.fstatSync(fd);
    const currentPath = fs.lstatSync(absolute);
    if (!before.isFile() || !currentPath.isFile() || currentPath.isSymbolicLink() ||
        before.dev !== currentPath.dev || before.ino !== currentPath.ino) {
      throw new Error("Channel-history evidence path changed while opening");
    }
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd);
    const pathAfter = fs.lstatSync(absolute);
    if (!pathAfter.isFile() || pathAfter.isSymbolicLink() ||
        after.dev !== before.dev || after.ino !== before.ino ||
        pathAfter.dev !== before.dev || pathAfter.ino !== before.ino ||
        after.size !== before.size || bytes.length !== before.size ||
        after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) {
      throw new Error("Channel-history evidence changed while being read");
    }
    return bytes;
  } finally {
    fs.closeSync(fd);
  }
}

async function readCompleteYoutubeHistoryInputs(youtube, channel, reconciliationPath, channelId) {
  if (!channelId || channel?.id !== channelId) {
    throw new Error("authenticated channel object does not match the configured SonicVhibez channel ID; refusing to inspect another uploads playlist");
  }
  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (typeof uploadsPlaylistId !== "string" || !uploadsPlaylistId.trim()) {
    throw new Error("authenticated SonicVhibez uploads playlist is unavailable; cannot verify complete channel history");
  }
  const playlistItems = [];
  const seenPageTokens = new Set();
  let pageToken;
  let expectedTotal = null;
  let paginationComplete = false;
  for (let page = 0; page < 100; page++) {
    const response = await youtube.playlistItems.list({
      part: ["contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      ...(pageToken ? { pageToken } : {})
    });
    const data = response?.data;
    const reportedTotal = data?.pageInfo?.totalResults;
    if (!Number.isSafeInteger(reportedTotal) || reportedTotal < 0) {
      throw new Error("YouTube uploads playlist response omitted a valid pageInfo.totalResults; history completeness cannot be verified");
    }
    if (expectedTotal === null) expectedTotal = reportedTotal;
    else if (reportedTotal !== expectedTotal) {
      throw new Error("YouTube uploads playlist total changed during pagination; history snapshot is inconsistent");
    }
    if (!Array.isArray(data.items)) {
      throw new Error("YouTube uploads playlist returned an invalid page; refusing incomplete history");
    }
    for (const [index, item] of data.items.entries()) {
      const videoId = item?.contentDetails?.videoId;
      if (typeof videoId !== "string" || !videoId.trim()) {
        throw new Error("YouTube uploads playlist item " + (playlistItems.length + index) + " is missing its remote video ID");
      }
      playlistItems.push(videoId);
    }
    const nextPageToken = data.nextPageToken;
    if (!nextPageToken) {
      paginationComplete = true;
      break;
    }
    if (seenPageTokens.has(nextPageToken)) {
      throw new Error("YouTube uploads playlist repeated a pagination token; refusing an incomplete history snapshot");
    }
    seenPageTokens.add(nextPageToken);
    pageToken = nextPageToken;
    if (page === 99) {
      throw new Error("channel history exceeded the 5,000-item verification bound; refusing incomplete history");
    }
  }
  if (!paginationComplete || playlistItems.length !== expectedTotal) {
    throw new Error("YouTube uploads playlist pagination did not cover its reported total; history is incomplete");
  }
  if (new Set(playlistItems).size !== playlistItems.length) {
    throw new Error("uploads playlist contains duplicate video IDs; history requires reconciliation");
  }
  const remoteVideos = [];
  for (let offset = 0; offset < playlistItems.length; offset += 50) {
    const ids = playlistItems.slice(offset, offset + 50);
    const response = await youtube.videos.list({ part: ["id", "snippet", "status"], id: ids.join(",") });
    const returned = response?.data?.items;
    if (!Array.isArray(returned)) {
      throw new Error("YouTube video details response was invalid; history is incomplete");
    }
    const requestedIds = new Set(ids);
    const returnedIds = new Set();
    for (const video of returned) {
      if (typeof video?.id !== "string" || !requestedIds.has(video.id) || returnedIds.has(video.id)) {
        throw new Error("YouTube video details did not match the requested playlist video IDs; history is incomplete");
      }
      returnedIds.add(video.id);
    }
    if (returnedIds.size !== requestedIds.size) {
      throw new Error("YouTube video details omitted one or more requested playlist video IDs; history is incomplete");
    }
    remoteVideos.push(...returned);
  }
  if (remoteVideos.length !== playlistItems.length) {
    throw new Error("YouTube did not return every upload-playlist video; history is incomplete");
  }
  let reconciliation, reconciliationSha256;
  try {
    const reconciliationBytes = readRegularFileNoFollow(reconciliationPath);
    reconciliationSha256 = crypto.createHash("sha256").update(reconciliationBytes).digest("hex");
    reconciliation = JSON.parse(reconciliationBytes.toString("utf8"));
  } catch { throw new Error("CHANNEL_HISTORY_RECONCILIATION_PATH is missing, unsafe or invalid; complete owner-reviewed history is required"); }
  return { remoteVideos, reconciliation, reconciliationSha256 };
}

export async function fetchCompleteYoutubeHistorySnapshot(youtube, channel, reconciliationPath, channelId, options = {}) {
  const { remoteVideos, reconciliation, reconciliationSha256 } = await readCompleteYoutubeHistoryInputs(youtube, channel, reconciliationPath, channelId);
  return validateHistoryReconciliationSnapshot({ channelId, remoteVideos, reconciliation, reconciliationSha256, ...options });
}

export async function fetchCompleteYoutubeHistory(youtube, channel, reconciliationPath, channelId) {
  return (await fetchCompleteYoutubeHistorySnapshot(youtube, channel, reconciliationPath, channelId)).history;
}

export function assertNextPublicationAllowed({ history, pendingAttempts, scheduledItems = [], proposedAt, jobId, format, timeZone, minSpacingHours } = {}) {
  let policy = {};
  try {
    policy = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "config/weekly-content-plan.json"), "utf8"));
  } catch {
    throw new Error("authoritative publication schedule is missing or invalid; refusing to use a fallback upload spacing policy");
  }
  const configuredSpacing = policy.minimumPublicationSpacingHours;
  const configuredFormats = policy.publicationCycle?.formats;
  if (!Number.isFinite(configuredSpacing) || configuredSpacing <= 0 || configuredSpacing > 8760
      || policy.publicationCycle?.minimumHoursBetweenConsecutivePublications !== configuredSpacing
      || policy.publicationCycle?.minimumCycleHours !== configuredSpacing * (Array.isArray(configuredFormats) ? configuredFormats.length : 0)
      || JSON.stringify(configuredFormats) !== JSON.stringify(["long_form", "long_form", "short"])) {
    throw new Error("authoritative publication schedule has inconsistent spacing/cycle values; refusing upload");
  }
  const result = evaluateNextPublication({
    history, historyVerified: true, pendingAttempts, scheduledItems, proposedAt, jobId, format,
    timeZone: timeZone ?? policy.timezone ?? DEFAULT_SCHEDULE_TIMEZONE,
    minSpacingHours: minSpacingHours ?? configuredSpacing ?? DEFAULT_MIN_SPACING_HOURS
  });
  if (!result.valid) throw new Error("rolling publication cycle gate blocked upload: " + result.errors.join("; "));
  const cadenceDecision = validateCadenceDecision(policy.cadenceDecision, configuredSpacing);
  if (!cadenceDecision.valid) {
    throw new Error("owner-approved cadence decision blocks private upload: " + cadenceDecision.errors.join("; "));
  }
  return result;
}
