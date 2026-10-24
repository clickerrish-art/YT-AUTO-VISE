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

export const APPROVED_SELAR_URL = "https://selar.com/0u19v8u99l";
export function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}
function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temp = filePath + "." + crypto.randomUUID() + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  fs.renameSync(temp, filePath);
}
function readJson(filePath, label) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch { throw new Error(label + " is missing or invalid JSON"); }
}
export function validateUploadApproval(approval, { jobId, artifactSha256, metadataVersion }) {
  if (approval?.decision !== "APPROVE" || approval.jobId !== jobId) throw new Error("approval decision and job ID must match this upload");
  if (!approval.rightsEvidence || typeof approval.rightsEvidence !== "object" || Array.isArray(approval.rightsEvidence)) throw new Error("structured rights evidence is required in the approval record");
  const actualRightsEvidenceSha256 = crypto.createHash("sha256").update(JSON.stringify(approval.rightsEvidence)).digest("hex");
  if (approval.rightsEvidenceSha256 !== actualRightsEvidenceSha256) throw new Error("rights evidence checksum does not match the approval-bound rights record");
  const evidenceAssets = Array.isArray(approval.rightsEvidence.assets) ? approval.rightsEvidence.assets : [approval.rightsEvidence];
  if (!evidenceAssets.length) throw new Error("approval must include at least one rights-evidence asset record");
  for (const evidence of evidenceAssets) {
    if (!evidence || typeof evidence !== "object" || typeof evidence.assetPath !== "string" || typeof evidence.licenseEvidenceLocation !== "string") throw new Error("rights evidence must bind each source asset and retained license evidence file");
    if (!/^[a-f0-9]{64}$/.test(evidence.assetSha256 ?? "") || !/^[a-f0-9]{64}$/.test(evidence.licenseEvidenceSha256 ?? "")) throw new Error("rights evidence must contain source and license-evidence SHA-256 checksums");
    if (!Array.isArray(evidence.permittedUses) || !evidence.permittedUses.includes("YouTube")) throw new Error("rights evidence must explicitly permit YouTube use");
    if (evidence.verificationStatus !== "VERIFIED" || typeof evidence.verifiedBy !== "string" || !evidence.verifiedBy.trim() || !Number.isFinite(Date.parse(evidence.verifiedAt ?? ""))) throw new Error("rights evidence must retain reviewer identity, VERIFIED status, and a valid verification timestamp");
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
export function verifyRetainedRightsEvidence(approval) {
  if (!approval?.rightsEvidence || typeof approval.rightsEvidence !== "object" || Array.isArray(approval.rightsEvidence)) throw new Error("structured rights evidence is required");
  const evidenceAssets = Array.isArray(approval.rightsEvidence.assets) ? approval.rightsEvidence.assets : [approval.rightsEvidence];
  if (!evidenceAssets.length) throw new Error("at least one rights-evidence asset record is required");
  for (const evidence of evidenceAssets) {
    if (!evidence || typeof evidence !== "object" || typeof evidence.assetPath !== "string" || typeof evidence.licenseEvidenceLocation !== "string") throw new Error("rights evidence must bind each source asset and retained license evidence file");
    const assetFile = path.resolve(evidence.assetPath);
    const licenseFile = path.resolve(evidence.licenseEvidenceLocation);
    if (!/^[a-f0-9]{64}$/.test(evidence.assetSha256 ?? "") || !/^[a-f0-9]{64}$/.test(evidence.licenseEvidenceSha256 ?? "")) throw new Error("rights evidence must contain source and license-evidence SHA-256 checksums");
    if (!Array.isArray(evidence.permittedUses) || !evidence.permittedUses.includes("YouTube")) throw new Error("rights evidence must explicitly permit YouTube use");
    if (evidence.verificationStatus !== "VERIFIED" || typeof evidence.verifiedBy !== "string" || !evidence.verifiedBy.trim() || !Number.isFinite(Date.parse(evidence.verifiedAt ?? ""))) throw new Error("rights evidence must retain reviewer identity, VERIFIED status, and a valid verification timestamp");
    if (!fs.existsSync(assetFile) || !fs.statSync(assetFile).isFile() || sha256File(assetFile) !== evidence.assetSha256) throw new Error("rights-evidence source asset is missing or its checksum changed: " + path.basename(assetFile));
    if (!fs.existsSync(licenseFile) || !fs.statSync(licenseFile).isFile() || fs.statSync(licenseFile).size <= 0 || sha256File(licenseFile) !== evidence.licenseEvidenceSha256) throw new Error("retained license evidence is missing, empty, or its checksum changed: " + path.basename(licenseFile));
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

export async function uploadPrivate({ metadataPath, videoPath, approvalPath, jobId, env = process.env, youtubeFactory, now = () => new Date(), preflightRunner = (args, runEnv) => execFileSync(process.execPath, args, { env: runEnv, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), persistJson = writeJsonAtomic }) {
  const reconcileOnly = env.RECONCILE_ONLY === "YES";
  const requiredEnv = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID", ...(reconcileOnly ? [] : ["CONFIRM_PRIVATE_UPLOAD"])];
  const missing = requiredEnv.filter(key => !env[key]?.trim());
  if (missing.length) throw new Error("missing required environment variables: " + missing.join(", "));
  if (!reconcileOnly && env.CONFIRM_PRIVATE_UPLOAD !== "YES") throw new Error("explicit private-upload confirmation is required (CONFIRM_PRIVATE_UPLOAD=YES)");
  if (!jobId || !/^[A-Za-z0-9][A-Za-z0-9:_-]{2,119}$/.test(jobId)) throw new Error("a stable JOB_ID is required");
  if (!fs.existsSync(metadataPath)) throw new Error("metadata file not found");
  if (!fs.existsSync(videoPath) || path.extname(videoPath).toLowerCase() !== ".mp4") throw new Error("provide an existing MP4 video file");
  if (!approvalPath || !fs.existsSync(approvalPath)) throw new Error("an artifact-bound UPLOAD_APPROVAL_PATH is required");

  const metadata = readJson(metadataPath, "Metadata");
  const approval = readJson(approvalPath, "Upload approval");
  const videoSha256 = sha256File(videoPath);
  const metadataSha256 = sha256File(metadataPath);
  if (metadata.channel !== "SonicVhibez" || metadata.channelId !== env.SONICVHIBEZ_CHANNEL_ID) throw new Error("metadata must target the configured SonicVhibez channel");
  if (metadata.visibility !== "private") throw new Error("uploader only permits private uploads");
  if (metadata.productUrl !== APPROVED_SELAR_URL) throw new Error("metadata must use the exact approved Selar destination");
  if (metadata.rightsConfirmed !== true || metadata.complianceReviewed !== true) throw new Error("metadata rights and compliance gates must be explicitly reviewed");
  if (metadata.status !== "READY_FOR_PRIVATE_UPLOAD") throw new Error("metadata status must be READY_FOR_PRIVATE_UPLOAD");
  validateUploadApproval(approval, { jobId, artifactSha256: videoSha256, metadataVersion: metadataSha256 });
  const relatedArtifacts = approval.relatedArtifacts;
  verifyRetainedRightsEvidence(approval);
  const uploadedArtifactIsBound = relatedArtifacts.some(item => path.resolve(item.path) === path.resolve(videoPath) && item.sha256 === videoSha256);
  if (!uploadedArtifactIsBound) throw new Error("approval artifact set must include the exact MP4 being uploaded");
  for (const item of relatedArtifacts) {
    if (!item || typeof item.path !== "string" || !/^[a-f0-9]{64}$/.test(item.sha256 ?? "") || !fs.existsSync(item.path) || !fs.statSync(item.path).isFile()) {
      throw new Error("every approval-bound artifact must exist as a file with a SHA-256 checksum");
    }
    if (sha256File(item.path) !== item.sha256) throw new Error("approval-bound artifact checksum changed: " + path.basename(item.path));
  }

  const captionArtifact = relatedArtifacts.find(item => typeof item?.path === "string" && /\.srt$/i.test(item.path));
  if (!captionArtifact) throw new Error("approval must include a final reviewed SRT captions file");
  const captionsCheck = preflightRunner(["scripts/check-captions.mjs", captionArtifact.path], env);
  if (!captionsCheck.includes("PASS:")) throw new Error("final approved captions did not pass the caption validator");
  const metadataCheck = preflightRunner(["scripts/check-content.mjs", metadataPath], env);
  if (!metadataCheck.includes("PASS")) throw new Error("metadata checker did not pass");
  const mediaPreflight = preflightRunner(["scripts/preflight-media.mjs", videoPath, metadataPath], env);
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

  const logDir = path.resolve(env.UPLOAD_LOG_DIR ?? "run-logs");
  const ledgerPath = path.join(logDir, "upload-attempts.json");
  fs.mkdirSync(logDir, { recursive: true });
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

  // Live uploads require independently reconciled channel history and no unresolved inserts.
  // Injected clients are reserved for unit tests and never prove live acceptance.
  let cycleGate = null;
  let cycleHistoryLength = null;
  if (!youtubeFactory) {
    assertNoUnresolvedUploadAttempts(ledger);
    const history = await fetchCompleteYoutubeHistory(youtube, matchedChannel, env.CHANNEL_HISTORY_RECONCILIATION_PATH, expectedChannelId);
    const format = metadata.contentType ?? metadata.format;
    if (!["long_form", "short"].includes(format)) throw new Error("metadata must explicitly identify contentType as long_form or short for rolling cycle enforcement");
    cycleHistoryLength = history.length;
    cycleGate = assertNextPublicationAllowed({ history, pendingAttempts: ledger.attempts, proposedAt: now().toISOString(), jobId, format });
  }
  const attempt = {
    attemptId: crypto.randomUUID(), jobId, artifactSha256: videoSha256, metadataVersion: metadataSha256,
    channelId: matchedChannel.id, channelTitle: matchedChannel.snippet.title,
    format: metadata.contentType ?? metadata.format ?? null,
    cycleIndex: cycleGate ? (cycleHistoryLength % 3) : null,
    previousActualPublishedAt: cycleGate?.latestActualAt ?? null,
    status: "UPLOADING_PRIVATE", startedAt: now().toISOString(), remoteVideoId: null,
    publishingEnabled: false, visibility: "private"
  };
  ledger.attempts.push(attempt);
  persistJson(ledgerPath, ledger);

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
      media: { body: fs.createReadStream(videoPath) }
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
