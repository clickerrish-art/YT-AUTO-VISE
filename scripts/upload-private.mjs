#!/usr/bin/env node
/**
 * Explicitly authorized, private-only YouTube upload. Never publishes publicly.
 * A pre-upload ledger entry is written before the remote insert; uncertain outcomes
 * are quarantined for reconciliation and are never retried automatically.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { assertNoUnresolvedUploadAttempts, fetchCompleteYoutubeHistory, assertNextPublicationAllowed } from "./youtube-history-gate.mjs";
import { assertShortParentRelationship, shortParentRelationshipSha256, validateSourceSegmentsAgainstEvidence } from "./short-parent-relationship.mjs";
import { atomicWriteJson } from "./atomic-json-file.mjs";

export const APPROVED_SELAR_URL = "https://selar.com/0u19v8u99l";

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

export function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

/** Resolve an evidence path only when every component is a real, non-symlink
 * directory and the final component is a regular file. */
export function resolveRegularFileNoSymlinks(filePath, label = "Evidence file") {
  if (typeof filePath !== "string" || !filePath.trim()) throw new Error(label + " path is required");
  const absolute = path.resolve(filePath);
  const root = path.parse(absolute).root;
  const parts = absolute.slice(root.length).split(path.sep).filter(Boolean);
  let cursor = root;
  for (let index = 0; index < parts.length; index++) {
    cursor = path.join(cursor, parts[index]);
    let stat;
    try { stat = fs.lstatSync(cursor); }
    catch { throw new Error(label + " is missing or cannot be inspected"); }
    if (stat.isSymbolicLink()) throw new Error(label + " path contains a symbolic link");
    if (index < parts.length - 1 && !stat.isDirectory()) throw new Error(label + " parent path must contain only directories");
    if (index === parts.length - 1 && !stat.isFile()) throw new Error(label + " must be a regular file");
  }
  return absolute;
}

/** Resolve a production input only when it remains inside the checked-out repository. */
export function resolveRepositoryFileNoSymlinks(filePath, label = "Repository evidence file", repositoryRoot = process.cwd()) {
  const absolute = resolveRegularFileNoSymlinks(filePath, label);
  const root = path.resolve(repositoryRoot);
  const relative = path.relative(root, absolute);
  if (!relative || relative === "." || relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
    throw new Error(label + " must remain inside the repository root");
  }
  return absolute;
}
function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  atomicWriteJson(filePath, value, { mode: 0o600 });
}
function readJson(filePath, label) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch { throw new Error(label + " is missing or invalid JSON"); }
}

/** Cross-process exclusive upload lock. A crash leaves a stale lock that fails closed. */
export function acquireExclusiveUploadLock(lockPath, { jobId, now = () => new Date() } = {}) {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  let fd;
  try {
    fd = fs.openSync(lockPath, "wx", 0o600);
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, jobId, startedAt: now().toISOString() }) + "\n");
    fs.fsyncSync(fd);
  } catch (error) {
    if (fd !== undefined) { try { fs.closeSync(fd); } catch {} }
    if (error?.code === "EEXIST") throw new Error("another upload operation is active or left a stale lock; reconcile the attempt ledger and inspect the lock before any retry");
    throw error;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    try { fs.closeSync(fd); } catch {}
    try { fs.unlinkSync(lockPath); } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  };
}
export function validateUploadApproval(approval, { jobId, artifactSha256, metadataVersion, channelId, contentType }) {
  if (approval?.decision !== "APPROVE" || approval.jobId !== jobId) throw new Error("approval decision and job ID must match this upload");
  if (contentType && approval.contentType && contentType !== approval.contentType) throw new Error("approval content format does not match upload metadata");
  const approvedFormat = contentType ?? approval.contentType ?? "long_form";
  if (approvedFormat === "short") {
    if (approval.contentType !== "short") throw new Error("Short upload approval must explicitly identify contentType=short");
    assertShortParentRelationship(approval.shortParentRelationship, { childContentId: jobId, childMediaSha256: artifactSha256, childMetadataSha256: metadataVersion, channelId, requireNativeRelatedVideoVerified: true, allowPrivateParent: false });
    const relationshipSha256 = shortParentRelationshipSha256(approval.shortParentRelationship);
    if (approval.shortParentRelationshipSha256 !== relationshipSha256) throw new Error("approval does not bind the exact Short-to-parent relationship");
  }
  if (!approval.rightsEvidence || typeof approval.rightsEvidence !== "object" || Array.isArray(approval.rightsEvidence)) throw new Error("structured rights evidence is required in the approval record");
  const actualRightsEvidenceSha256 = crypto.createHash("sha256").update(JSON.stringify(approval.rightsEvidence)).digest("hex");
  if (approval.rightsEvidenceSha256 !== actualRightsEvidenceSha256) throw new Error("rights evidence checksum does not match the approval-bound rights record");
  const evidenceAssets = Array.isArray(approval.rightsEvidence.assets) ? approval.rightsEvidence.assets : [approval.rightsEvidence];
  if (!evidenceAssets.length) throw new Error("approval must include at least one rights-evidence asset record");
  for (const evidence of evidenceAssets) {
    if (!evidence || typeof evidence !== "object" || typeof evidence.assetPath !== "string" || typeof evidence.licenseEvidenceLocation !== "string") throw new Error("rights evidence must bind each source asset and retained license evidence file");
    if (!/^[a-f0-9]{64}$/.test(evidence.assetSha256 ?? "") || !/^[a-f0-9]{64}$/.test(evidence.licenseEvidenceSha256 ?? "")) throw new Error("rights evidence must contain source and license-evidence SHA-256 checksums");
    if (!Array.isArray(evidence.permittedUses) || !evidence.permittedUses.includes("YouTube")) throw new Error("rights evidence must explicitly permit YouTube use");
    if (evidence.verificationStatus !== "VERIFIED" || typeof evidence.verifiedBy !== "string" || !evidence.verifiedBy.trim() || !Number.isFinite(strictIsoTimestamp(evidence.verifiedAt))) throw new Error("rights evidence must retain reviewer identity, VERIFIED status, and a valid verification timestamp");
  }
  if (approval.artifactSha256 !== artifactSha256) throw new Error("approval artifact checksum does not match the actual MP4");
  if (approval.metadataVersion !== metadataVersion) throw new Error("approval metadata version does not match the actual metadata file");
  if (typeof approval.reviewer !== "string" || approval.reviewer.trim().length < 2) throw new Error("authenticated human reviewer identity is missing");
  if (!/^[a-f0-9]{64}$/.test(approval.rightsEvidenceSha256 ?? "")) throw new Error("rights-evidence checksum is missing");
  if (approval.publishingEnabled !== false || approval.visibility !== "private") throw new Error("approval must explicitly preserve private-only publishing");
  if (!Array.isArray(approval.relatedArtifacts) || !approval.relatedArtifacts.some(item => item?.sha256 === artifactSha256)) throw new Error("approval must bind the complete reviewed artifact set, including the uploaded MP4");
  if (!approval.relatedArtifacts.some(item => typeof item?.path === "string" && /\.(jpg|jpeg|png|webp)$/i.test(item.path) && /^[a-f0-9]{64}$/.test(item.sha256 ?? ""))) throw new Error("approval must include the reviewed thumbnail checksum");
  if (!approval.relatedArtifacts.some(item => typeof item?.path === "string" && /\.srt$/i.test(item.path) && /^[a-f0-9]{64}$/.test(item.sha256 ?? ""))) throw new Error("approval must include the final reviewed captions checksum");
  if (!approval.relatedArtifacts.some(item => typeof item?.path === "string" && /\.json$/i.test(item.path) && item.sha256 === metadataVersion)) throw new Error("approval must bind the exact metadata JSON checksum");
  return true;
}
export function verifyRetainedRightsEvidence(approval, { repositoryRoot } = {}) {
  if (!approval?.rightsEvidence || typeof approval.rightsEvidence !== "object" || Array.isArray(approval.rightsEvidence)) throw new Error("structured rights evidence is required");
  const evidenceAssets = Array.isArray(approval.rightsEvidence.assets) ? approval.rightsEvidence.assets : [approval.rightsEvidence];
  if (!evidenceAssets.length) throw new Error("at least one rights-evidence asset record is required");
  for (const evidence of evidenceAssets) {
    if (!evidence || typeof evidence !== "object" || typeof evidence.assetPath !== "string" || typeof evidence.licenseEvidenceLocation !== "string") throw new Error("rights evidence must bind each source asset and retained license evidence file");
    if (!/^[a-f0-9]{64}$/.test(evidence.assetSha256 ?? "") || !/^[a-f0-9]{64}$/.test(evidence.licenseEvidenceSha256 ?? "")) throw new Error("rights evidence must contain source and license-evidence SHA-256 checksums");
    if (!Array.isArray(evidence.permittedUses) || !evidence.permittedUses.includes("YouTube")) throw new Error("rights evidence must explicitly permit YouTube use");
    if (evidence.verificationStatus !== "VERIFIED" || typeof evidence.verifiedBy !== "string" || !evidence.verifiedBy.trim() || !Number.isFinite(strictIsoTimestamp(evidence.verifiedAt))) throw new Error("rights evidence must retain reviewer identity, VERIFIED status, and a valid verification timestamp");
    const resolveEvidence = repositoryRoot
      ? (filePath, label) => resolveRepositoryFileNoSymlinks(filePath, label, repositoryRoot)
      : resolveRegularFileNoSymlinks;
    const assetFile = resolveEvidence(evidence.assetPath, "Rights-evidence source asset");
    const licenseFile = resolveEvidence(evidence.licenseEvidenceLocation, "Retained license evidence");
    if (sha256File(assetFile) !== evidence.assetSha256) throw new Error("rights-evidence source asset is missing or its checksum changed: " + path.basename(assetFile));
    if (fs.statSync(licenseFile).size <= 0 || sha256File(licenseFile) !== evidence.licenseEvidenceSha256) throw new Error("retained license evidence is missing, empty, or its checksum changed: " + path.basename(licenseFile));
  }
  return true;
}

function safeErrorCode(error) {
  const status = Number(error?.response?.status ?? error?.code);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? "REMOTE_HTTP_" + status : "REMOTE_OUTCOME_UNCERTAIN";
}

export function assertReconciliationOnlyHasPriorAttempt(reconcileOnly, prior) {
  if (reconcileOnly && !prior) throw new Error("reconciliation-only mode refuses to create a new upload attempt");
  return true;
}

export function validateOneShotUploadAuthorization(record, {
  jobId, artifactSha256, metadataSha256, approvalSha256, channelId, now = new Date()
} = {}) {
  if (!record || record.decision !== "AUTHORIZE_ONE_PRIVATE_UPLOAD") throw new Error("a separate one-shot private-upload authorization is required");
  if (typeof record.authorizationId !== "string" || !/^[A-Za-z0-9:_-]{8,120}$/.test(record.authorizationId)) throw new Error("one-shot authorization requires a stable unique authorizationId");
  if (record.jobId !== jobId || record.artifactSha256 !== artifactSha256 || record.metadataSha256 !== metadataSha256 || record.approvalSha256 !== approvalSha256 || record.channelId !== channelId) throw new Error("one-shot authorization must bind the exact job, final video, metadata, approval and verified channel");
  if (record.visibility !== "private" || record.publishingEnabled !== false) throw new Error("one-shot authorization must explicitly restrict the operation to private visibility");
  if (typeof record.operator !== "string" || record.operator.trim().length < 2 || record.operator.length > 120) throw new Error("one-shot authorization requires the approving operator identity");
  const authorizedAt = strictIsoTimestamp(record.authorizedAt);
  const nowMs = now instanceof Date ? now.getTime() : strictIsoTimestamp(now);
  if (!Number.isFinite(authorizedAt) || !Number.isFinite(nowMs) || authorizedAt > nowMs + 5 * 60_000 || nowMs - authorizedAt > 24 * 60 * 60_000) throw new Error("one-shot authorization timestamp must be valid, not future-dated and no older than 24 hours");
  return { authorizationId: record.authorizationId, operator: record.operator.trim(), authorizedAt: new Date(authorizedAt).toISOString() };
}

export async function uploadPrivate({ metadataPath, videoPath, approvalPath, jobId, env = process.env, youtubeFactory, now = () => new Date(), preflightRunner = (args, runEnv) => execFileSync(process.execPath, args, { env: runEnv, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), persistJson = writeJsonAtomic }) {
  const reconcileOnly = env.RECONCILE_ONLY === "YES";
  const requiredEnv = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID", ...(reconcileOnly ? [] : ["CONFIRM_PRIVATE_UPLOAD"])];
  const missing = requiredEnv.filter(key => !env[key]?.trim());
  if (missing.length) throw new Error("missing required environment variables: " + missing.join(", "));
  if (!reconcileOnly && env.CONFIRM_PRIVATE_UPLOAD !== "YES") throw new Error("explicit private-upload confirmation is required (CONFIRM_PRIVATE_UPLOAD=YES)");
  // Reconciliation is read-only and remains available during an incident. Any new
  // remote insert requires an explicit stop release; unset or malformed values fail closed.
  if (!reconcileOnly && env.YOUTUBE_EMERGENCY_STOP !== "false") {
    throw new Error("YouTube emergency stop is active or unset; private upload is blocked");
  }
  if (!jobId || !/^[A-Za-z0-9][A-Za-z0-9:_-]{2,119}$/.test(jobId)) throw new Error("a stable JOB_ID is required");
  const resolveInputFile = youtubeFactory ? resolveRegularFileNoSymlinks : resolveRepositoryFileNoSymlinks;
  const safeMetadataPath = resolveInputFile(metadataPath, "Metadata file");
  const safeVideoPath = resolveInputFile(videoPath, "Video file");
  const safeApprovalPath = resolveInputFile(approvalPath, "Upload approval file");
  if (path.extname(safeVideoPath).toLowerCase() !== ".mp4") throw new Error("provide an existing MP4 video file");

  const metadata = readJson(safeMetadataPath, "Metadata");
  const approval = readJson(safeApprovalPath, "Upload approval");
  const videoSha256 = sha256File(safeVideoPath);
  const metadataSha256 = sha256File(safeMetadataPath);
  const approvalSha256 = sha256File(safeApprovalPath);
  if (metadata.channel !== "SonicVhibez" || metadata.channelId !== env.SONICVHIBEZ_CHANNEL_ID) throw new Error("metadata must target the configured SonicVhibez channel");
  if (metadata.visibility !== "private") throw new Error("uploader only permits private uploads");
  if (metadata.productUrl !== APPROVED_SELAR_URL) throw new Error("metadata must use the exact approved Selar destination");
  if (metadata.rightsConfirmed !== true || metadata.complianceReviewed !== true) throw new Error("metadata rights and compliance gates must be explicitly reviewed");
  if (metadata.status !== "READY_FOR_PRIVATE_UPLOAD") throw new Error("metadata status must be READY_FOR_PRIVATE_UPLOAD");
  validateUploadApproval(approval, { jobId, artifactSha256: videoSha256, metadataVersion: metadataSha256, channelId: env.SONICVHIBEZ_CHANNEL_ID, contentType: metadata.contentType ?? metadata.format });
  const relatedArtifacts = approval.relatedArtifacts;
  verifyRetainedRightsEvidence(approval, youtubeFactory ? {} : { repositoryRoot: process.cwd() });
  const uploadedArtifactIsBound = relatedArtifacts.some(item => path.resolve(item.path) === safeVideoPath && item.sha256 === videoSha256);
  if (!uploadedArtifactIsBound) throw new Error("approval artifact set must include the exact MP4 being uploaded");
  for (const item of relatedArtifacts) {
    if (!item || typeof item.path !== "string" || !/^[a-f0-9]{64}$/.test(item.sha256 ?? "")) {
      throw new Error("every approval-bound artifact must exist as a file with a SHA-256 checksum");
    }
    const safeArtifactPath = resolveInputFile(item.path, "Approval-bound artifact");
    if (sha256File(safeArtifactPath) !== item.sha256) throw new Error("approval-bound artifact checksum changed: " + path.basename(safeArtifactPath));
  }

  const captionArtifact = relatedArtifacts.find(item => typeof item?.path === "string" && /\.srt$/i.test(item.path));
  if (!captionArtifact) throw new Error("approval must include a final reviewed SRT captions file");
  const captionsCheck = preflightRunner(["scripts/check-captions.mjs", captionArtifact.path], env);
  if (!captionsCheck.includes("PASS:")) throw new Error("final approved captions did not pass the caption validator");
  const metadataCheck = preflightRunner(["scripts/check-content.mjs", safeMetadataPath], env);
  if (!metadataCheck.includes("PASS")) throw new Error("metadata checker did not pass");
  const mediaPreflight = preflightRunner(["scripts/preflight-media.mjs", safeVideoPath, safeMetadataPath], env);
  if (!mediaPreflight.includes("PASS:")) throw new Error("media preflight did not pass");

  let youtube;
  if (youtubeFactory) {
    // Dependency-injected API client is used by isolated tests; production always
    // constructs the authenticated official Google client below.
    youtube = youtubeFactory(null);
  } else {
    const { google } = await import("googleapis");
    const oauth = new google.auth.OAuth2(env.YOUTUBE_CLIENT_ID, env.YOUTUBE_CLIENT_SECRET);
    oauth.setCredentials({ refresh_token: env.YOUTUBE_REFRESH_TOKEN });
    youtube = google.youtube({ version: "v3", auth: oauth });
  }
  const channel = await youtube.channels.list({ part: ["id", "snippet", "contentDetails"], mine: true });
  const authenticatedChannels = channel.data.items ?? [];
  const expectedChannelId = env.SONICVHIBEZ_CHANNEL_ID;
  const matchedChannel = authenticatedChannels.find(item => item.id === expectedChannelId);
  if (!matchedChannel || metadata.channelId !== expectedChannelId) throw new Error("authenticated YouTube channel ID does not match configured SonicVhibez channel ID");
  if (matchedChannel.snippet?.title !== "SonicVhibez") throw new Error("authenticated channel is not exactly SonicVhibez");
  if ((metadata.contentType ?? metadata.format) === "short") {
    const relationship = approval.shortParentRelationship;
    if (metadata.parentContentId !== relationship.parentContentId || metadata.parentVideoId !== relationship.parentRemoteVideoId || metadata.parentVideoUrl !== relationship.parentCanonicalUrl) {
      throw new Error("Short metadata must bind the exact approved parent content ID, remote video ID, canonical URL and relationship hash");
    }
    let parentRemote;
    try {
      const parentResponse = await youtube.videos.list({ part: ["id", "snippet", "status"], id: relationship.parentRemoteVideoId });
      parentRemote = (parentResponse.data.items ?? []).find(item => item.id === relationship.parentRemoteVideoId);
    } catch {
      throw new Error("Exact Short parent could not be independently reconciled with YouTube; do not upload");
    }
    if (!parentRemote || parentRemote.snippet?.channelId !== expectedChannelId || parentRemote.snippet?.title !== relationship.parentRemoteTitle || parentRemote.status?.privacyStatus !== relationship.parentPrivacyStatus) {
      throw new Error("Exact Short parent remote ID, channel, title or privacy state no longer matches approval; do not upload");
    }
  }

  const logDir = path.resolve(env.UPLOAD_LOG_DIR ?? "run-logs");
  const ledgerPath = path.join(logDir, "upload-attempts.json");
  fs.mkdirSync(logDir, { recursive: true });
  const releaseUploadLock = acquireExclusiveUploadLock(path.join(logDir, "upload-operation.lock"), { jobId, now });
  try {
  let ledger = { version: 1, attempts: [] };
  if (fs.existsSync(ledgerPath)) ledger = readJson(ledgerPath, "Upload attempt ledger");
  if (!Array.isArray(ledger.attempts)) throw new Error("Upload attempt ledger has an invalid schema");
  const prior = ledger.attempts.find(a => a.jobId === jobId && a.artifactSha256 === videoSha256);
  assertReconciliationOnlyHasPriorAttempt(reconcileOnly, prior);
  if (prior) {
    if (!prior.remoteVideoId) {
      throw new Error("an existing upload attempt is " + prior.status + " without an authoritative remote video ID; reconcile manually with YouTube before any retry");
    }
    let remoteItem;
    try {
      const remote = await youtube.videos.list({ part: ["id", "snippet", "status"], id: prior.remoteVideoId });
      remoteItem = (remote.data.items ?? []).find(candidate => candidate.id === prior.remoteVideoId);
    } catch {
      prior.status = "RECOVERY_REQUIRED";
      prior.errorCode = "REMOTE_RECONCILIATION_FAILED";
      prior.updatedAt = now().toISOString();
      persistJson(ledgerPath, ledger);
      throw new Error("Existing upload outcome could not be reconciled with YouTube; do not retry");
    }
    if (!remoteItem || remoteItem.status?.privacyStatus !== "private" || remoteItem.snippet?.channelId !== expectedChannelId) {
      prior.status = "RECOVERY_REQUIRED";
      prior.errorCode = "REMOTE_PRIVACY_OR_CHANNEL_MISMATCH";
      prior.updatedAt = now().toISOString();
      persistJson(ledgerPath, ledger);
      throw new Error("Existing remote video is missing or not verified private on SonicVhibez; do not retry");
    }
    const timestamp = now().toISOString();
    const receipt = {
      attemptId: prior.attemptId, jobId, timestamp, channelId: expectedChannelId,
      channelTitle: matchedChannel.snippet.title, videoId: prior.remoteVideoId,
      privacyStatus: remoteItem.status.privacyStatus, title: metadata.title,
      format: metadata.contentType ?? metadata.format ?? null,
      actualPublishedAt: remoteItem.snippet?.publishedAt ?? prior.startedAt,
      artifactSha256: videoSha256, metadataVersion: metadataSha256, reviewer: approval.reviewer,
      rightsEvidenceSha256: approval.rightsEvidenceSha256, remoteStatusVerified: true,
      publishingEnabled: false, url: "https://www.youtube.com/watch?v=" + prior.remoteVideoId
    };
    const receiptPath = path.join(logDir, "upload-" + prior.remoteVideoId + ".json");
    persistJson(receiptPath, receipt);
    prior.status = "PRIVATE_UPLOAD_VERIFIED";
    prior.actualPublishedAt = remoteItem.snippet?.publishedAt ?? prior.startedAt;
    prior.format = metadata.contentType ?? metadata.format ?? prior.format ?? null;
    prior.receiptPath = path.basename(receiptPath);
    prior.verifiedAt = timestamp;
    prior.updatedAt = timestamp;
    persistJson(ledgerPath, ledger);
    return { receipt, reused: true };
  }

  // Live uploads require a separate one-shot authorization bound to every final artifact.
  // Injected clients are reserved for isolated tests and never prove live acceptance.
  let oneShotAuthorization = null;
  if (!youtubeFactory && !reconcileOnly) {
    const authorizationPath = env.PRIVATE_UPLOAD_AUTHORIZATION_PATH;
    if (!authorizationPath || !fs.existsSync(authorizationPath)) throw new Error("PRIVATE_UPLOAD_AUTHORIZATION_PATH is required for a live one-shot upload");
    const safeAuthorizationPath = resolveRepositoryFileNoSymlinks(authorizationPath, "One-shot private-upload authorization");
    const record = readJson(safeAuthorizationPath, "One-shot private-upload authorization");
    oneShotAuthorization = validateOneShotUploadAuthorization(record, {
      jobId, artifactSha256: videoSha256, metadataSha256, approvalSha256,
      channelId: expectedChannelId, now: now()
    });
    if (ledger.attempts.some(item => item.authorizationId === oneShotAuthorization.authorizationId)) throw new Error("one-shot authorization was already consumed by an upload attempt; issue a new authorization only after reviewing the prior outcome");
  }

  // Live uploads require independently reconciled channel history and no unresolved inserts.
  let cycleGate = null;
  let cycleHistoryLength = null;
  if (!youtubeFactory) {
    assertNoUnresolvedUploadAttempts(ledger);
    const safeHistoryPath = resolveRepositoryFileNoSymlinks(env.CHANNEL_HISTORY_RECONCILIATION_PATH, "Channel history reconciliation");
    const history = await fetchCompleteYoutubeHistory(youtube, matchedChannel, safeHistoryPath, expectedChannelId);
    const format = metadata.contentType ?? metadata.format;
    if (!["long_form", "short"].includes(format)) throw new Error("metadata must explicitly identify contentType as long_form or short for rolling cycle enforcement");
    cycleHistoryLength = history.length;
    cycleGate = assertNextPublicationAllowed({ history, pendingAttempts: ledger.attempts, proposedAt: now().toISOString(), jobId, format });
  }
  const attempt = {
    attemptId: crypto.randomUUID(), jobId, artifactSha256: videoSha256, metadataVersion: metadataSha256,
    authorizationId: oneShotAuthorization?.authorizationId ?? null,
    authorizedOperator: oneShotAuthorization?.operator ?? null,
    parentContentId: (metadata.contentType ?? metadata.format) === "short" ? approval.shortParentRelationship.parentContentId : null,
    parentRemoteVideoId: (metadata.contentType ?? metadata.format) === "short" ? approval.shortParentRelationship.parentRemoteVideoId : null,
    shortParentRelationshipSha256: (metadata.contentType ?? metadata.format) === "short" ? approval.shortParentRelationshipSha256 : null,
    channelId: matchedChannel.id, channelTitle: matchedChannel.snippet.title,
    format: metadata.contentType ?? metadata.format ?? null,
    cycleIndex: cycleGate ? (cycleHistoryLength % 3) : null,
    previousActualPublishedAt: cycleGate?.latestActualAt ?? null,
    status: "UPLOADING_PRIVATE", startedAt: now().toISOString(), remoteVideoId: null,
    publishingEnabled: false, visibility: "private"
  };
  ledger.attempts.push(attempt);
  persistJson(ledgerPath, ledger);

  // Revalidate the exact approved inputs and Short parent immediately before
  // the irreversible remote insert. A failed recheck records recovery and sends
  // no upload request; the operator must reconcile/reapprove rather than retry.
  try {
    if (sha256File(safeVideoPath) !== videoSha256 || sha256File(safeMetadataPath) !== metadataSha256 || sha256File(safeApprovalPath) !== approvalSha256) {
      throw new Error("video, metadata or approval hash changed after initial validation");
    }
    for (const item of relatedArtifacts) {
      const safeArtifactPath = resolveInputFile(item.path, "Approval-bound artifact");
      if (sha256File(safeArtifactPath) !== item.sha256) throw new Error("approval-bound artifact changed: " + path.basename(safeArtifactPath));
    }
    const finalChannel = await youtube.channels.list({ part: ["id", "snippet"], mine: true });
    const finalChannelMatch = (finalChannel.data.items ?? []).find(item => item.id === expectedChannelId && item.snippet?.title === "SonicVhibez");
    if (!finalChannelMatch || matchedChannel.id !== expectedChannelId) throw new Error("authenticated SonicVhibez channel identity changed before upload");
    if ((metadata.contentType ?? metadata.format) === "short") {
      const relationship = approval.shortParentRelationship;
      const sourceEvidencePath = resolveInputFile(relationship.parentSourceEvidencePath, "Parent source-quality evidence");
      if (sha256File(sourceEvidencePath) !== relationship.parentSourceEvidenceSha256) throw new Error("parent source-quality evidence changed after approval");
      const sourceEvidence = readJson(sourceEvidencePath, "Parent source-quality evidence");
      const sourceSegmentErrors = validateSourceSegmentsAgainstEvidence(relationship.sourceSegments, sourceEvidence);
      if (sourceSegmentErrors.length) throw new Error("parent source segments no longer match approved evidence: " + sourceSegmentErrors.join("; "));
      const parentResponse = await youtube.videos.list({ part: ["id", "snippet", "status"], id: relationship.parentRemoteVideoId });
      const currentParent = (parentResponse.data.items ?? []).find(item => item.id === relationship.parentRemoteVideoId);
      if (!currentParent || currentParent.snippet?.channelId !== expectedChannelId || currentParent.snippet?.title !== relationship.parentRemoteTitle || currentParent.status?.privacyStatus !== relationship.parentPrivacyStatus) {
        throw new Error("exact approved parent remote state changed immediately before upload");
      }
    }
  } catch (error) {
    attempt.status = "RECOVERY_REQUIRED";
    attempt.errorCode = "PRE_UPLOAD_REVALIDATION_FAILED";
    attempt.updatedAt = now().toISOString();
    persistJson(ledgerPath, ledger);
    throw new Error("Pre-upload revalidation failed; no upload request was sent. Reconcile and reapprove before retrying: " + (error instanceof Error ? error.message : "revalidation failed"));
  }

  let response;
  try {
    response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title: metadata.title, description: metadata.description, tags: metadata.tags, categoryId: "27" },
        status: {
          privacyStatus: "private",
          selfDeclaredMadeForKids: false,
          containsSyntheticMedia: metadata.containsSyntheticMedia === true,
          paidProductPlacementDetails: { hasPaidProductPlacement: metadata.hasPaidPromotion === true }
        }
      },
      media: { body: fs.createReadStream(safeVideoPath) }
    });
  } catch (error) {
    attempt.status = "RECOVERY_REQUIRED";
    attempt.errorCode = safeErrorCode(error);
    attempt.updatedAt = now().toISOString();
    persistJson(ledgerPath, ledger);
    throw new Error("Upload outcome is uncertain (" + attempt.errorCode + "); reconcile with YouTube before retrying");
  }

  const videoId = response.data.id;
  if (!videoId) {
    attempt.status = "RECOVERY_REQUIRED";
    attempt.errorCode = "REMOTE_RESPONSE_MISSING_VIDEO_ID";
    attempt.updatedAt = now().toISOString();
    persistJson(ledgerPath, ledger);
    throw new Error("YouTube returned no video ID; reconcile before retrying");
  }
  attempt.remoteVideoId = videoId;
  attempt.status = "REMOTE_ACCEPTED_RECONCILIATION_REQUIRED";
  attempt.updatedAt = now().toISOString();
  persistJson(ledgerPath, ledger);

  let verified;
  try {
    const remote = await youtube.videos.list({ part: ["id", "snippet", "status"], id: videoId });
    const item = (remote.data.items ?? []).find(candidate => candidate.id === videoId);
    if (!item || item.status?.privacyStatus !== "private" || item.snippet?.channelId !== expectedChannelId) {
      throw new Error("remote privacy or channel verification failed");
    }
    verified = item;
  } catch {
    attempt.status = "RECOVERY_REQUIRED";
    attempt.errorCode = "REMOTE_PRIVACY_VERIFICATION_FAILED";
    attempt.updatedAt = now().toISOString();
    persistJson(ledgerPath, ledger);
    throw new Error("YouTube may have accepted the upload, but private visibility could not be independently verified; reconcile before retrying");
  }

  const timestamp = now().toISOString();
  const receipt = {
    attemptId: attempt.attemptId, jobId, timestamp, channelId: matchedChannel.id,
    channelTitle: matchedChannel.snippet.title, videoId, privacyStatus: verified.status.privacyStatus,
    title: metadata.title, format: metadata.contentType ?? metadata.format ?? null,
    actualPublishedAt: verified.snippet?.publishedAt ?? timestamp,
    parentContentId: (metadata.contentType ?? metadata.format) === "short" ? approval.shortParentRelationship.parentContentId : null,
    parentRemoteVideoId: (metadata.contentType ?? metadata.format) === "short" ? approval.shortParentRelationship.parentRemoteVideoId : null,
    shortParentRelationshipSha256: (metadata.contentType ?? metadata.format) === "short" ? approval.shortParentRelationshipSha256 : null,
    nativeRelatedVideoStatus: (metadata.contentType ?? metadata.format) === "short" ? approval.shortParentRelationship.nativeRelatedVideo.status : null,
    artifactSha256: videoSha256, metadataVersion: metadataSha256,
    reviewer: approval.reviewer, rightsEvidenceSha256: approval.rightsEvidenceSha256,
    remoteStatusVerified: true, publishingEnabled: false, url: "https://www.youtube.com/watch?v=" + videoId
  };
  const receiptPath = path.join(logDir, "upload-" + videoId + ".json");
  try {
    persistJson(receiptPath, receipt);
    attempt.status = "PRIVATE_UPLOAD_VERIFIED";
    attempt.actualPublishedAt = verified.snippet?.publishedAt ?? timestamp;
    attempt.receiptPath = path.basename(receiptPath);
    attempt.verifiedAt = timestamp;
    attempt.updatedAt = timestamp;
    persistJson(ledgerPath, ledger);
  } catch {
    attempt.status = "RECOVERY_REQUIRED";
    attempt.errorCode = "LOCAL_RECEIPT_PERSISTENCE_FAILED";
    attempt.updatedAt = now().toISOString();
    try { persistJson(ledgerPath, ledger); } catch {}
    throw new Error("YouTube video exists but local receipt persistence failed; reconcile the existing remote video before retrying");
  }
  return { receipt, reused: false };
  } finally {
    releaseUploadLock();
  }
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invoked) {
  const metadataPath = process.argv[2] ?? process.env.METADATA_PATH ?? "content/next-short.json";
  const videoPath = process.argv[3] ?? process.env.VIDEO_PATH ?? "media/next-short.mp4";
  const approvalPath = process.env.UPLOAD_APPROVAL_PATH;
  const jobId = process.env.JOB_ID;
  try {
    const result = await uploadPrivate({ metadataPath, videoPath, approvalPath, jobId });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("BLOCKED: " + (error instanceof Error ? error.message : "private upload failed"));
    process.exitCode = 1;
  }
}
