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
function safeErrorCode(error) {
  const status = Number(error?.response?.status ?? error?.code);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? "REMOTE_HTTP_" + status : "REMOTE_OUTCOME_UNCERTAIN";
}

export async function uploadPrivate({ metadataPath, videoPath, approvalPath, jobId, env = process.env, youtubeFactory, now = () => new Date() }) {
  const requiredEnv = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID", "CONFIRM_PRIVATE_UPLOAD"];
  const missing = requiredEnv.filter(key => !env[key]?.trim());
  if (missing.length) throw new Error("missing required environment variables: " + missing.join(", "));
  if (env.CONFIRM_PRIVATE_UPLOAD !== "YES") throw new Error("explicit private-upload confirmation is required (CONFIRM_PRIVATE_UPLOAD=YES)");
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
  if (approval.decision !== "APPROVE" || approval.jobId !== jobId) throw new Error("approval decision and job ID must match this upload");
  if (approval.artifactSha256 !== videoSha256) throw new Error("approval artifact checksum does not match the actual MP4");
  if (approval.metadataVersion !== metadataSha256) throw new Error("approval metadata version does not match the actual metadata file");
  if (typeof approval.reviewer !== "string" || approval.reviewer.trim().length < 2) throw new Error("authenticated human reviewer identity is missing");
  if (!/^[a-f0-9]{64}$/.test(approval.rightsEvidenceSha256 ?? "")) throw new Error("rights-evidence checksum is missing");
  if (approval.publishingEnabled !== false || approval.visibility !== "private") throw new Error("approval must explicitly preserve private-only publishing");

  const metadataCheck = execFileSync(process.execPath, ["scripts/check-content.mjs", metadataPath], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (!metadataCheck.includes("PASS")) throw new Error("metadata checker did not pass");
  const mediaPreflight = execFileSync(process.execPath, ["scripts/preflight-media.mjs", videoPath, metadataPath], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (!mediaPreflight.includes("PASS:")) throw new Error("media preflight did not pass");

  const { google } = await import("googleapis");
  const oauth = new google.auth.OAuth2(env.YOUTUBE_CLIENT_ID, env.YOUTUBE_CLIENT_SECRET);
  oauth.setCredentials({ refresh_token: env.YOUTUBE_REFRESH_TOKEN });
  const youtube = youtubeFactory ? youtubeFactory(oauth) : google.youtube({ version: "v3", auth: oauth });
  const channel = await youtube.channels.list({ part: ["id", "snippet"], mine: true });
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
  if (prior) {
    if (prior.status === "PRIVATE_UPLOAD_VERIFIED") return { receipt: prior, reused: true };
    throw new Error("an existing upload attempt for this job/artifact is " + prior.status + "; reconcile with YouTube before any retry");
  }
  const attempt = {
    attemptId: crypto.randomUUID(), jobId, artifactSha256: videoSha256, metadataVersion: metadataSha256,
    channelId: matchedChannel.id, channelTitle: matchedChannel.snippet.title,
    status: "UPLOADING_PRIVATE", startedAt: now().toISOString(), remoteVideoId: null,
    publishingEnabled: false, visibility: "private"
  };
  ledger.attempts.push(attempt);
  writeJsonAtomic(ledgerPath, ledger);

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
    writeJsonAtomic(ledgerPath, ledger);
    throw new Error("Upload outcome is uncertain (" + attempt.errorCode + "); reconcile with YouTube before retrying");
  }

  const videoId = response.data.id;
  if (!videoId) {
    attempt.status = "RECOVERY_REQUIRED";
    attempt.errorCode = "REMOTE_RESPONSE_MISSING_VIDEO_ID";
    attempt.updatedAt = now().toISOString();
    writeJsonAtomic(ledgerPath, ledger);
    throw new Error("YouTube returned no video ID; reconcile before retrying");
  }
  attempt.remoteVideoId = videoId;
  attempt.status = "REMOTE_ACCEPTED_RECONCILIATION_REQUIRED";
  attempt.updatedAt = now().toISOString();
  writeJsonAtomic(ledgerPath, ledger);

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
    writeJsonAtomic(ledgerPath, ledger);
    throw new Error("YouTube may have accepted the upload, but private visibility could not be independently verified; reconcile before retrying");
  }

  const timestamp = now().toISOString();
  const receipt = {
    attemptId: attempt.attemptId, jobId, timestamp, channelId: matchedChannel.id,
    channelTitle: matchedChannel.snippet.title, videoId, privacyStatus: verified.status.privacyStatus,
    title: metadata.title, artifactSha256: videoSha256, metadataVersion: metadataSha256,
    reviewer: approval.reviewer, rightsEvidenceSha256: approval.rightsEvidenceSha256,
    remoteStatusVerified: true, publishingEnabled: false, url: "https://www.youtube.com/watch?v=" + videoId
  };
  const receiptPath = path.join(logDir, "upload-" + videoId + ".json");
  try {
    writeJsonAtomic(receiptPath, receipt);
    attempt.status = "PRIVATE_UPLOAD_VERIFIED";
    attempt.receiptPath = path.basename(receiptPath);
    attempt.verifiedAt = timestamp;
    attempt.updatedAt = timestamp;
    writeJsonAtomic(ledgerPath, ledger);
  } catch {
    attempt.status = "RECOVERY_REQUIRED";
    attempt.errorCode = "LOCAL_RECEIPT_PERSISTENCE_FAILED";
    attempt.updatedAt = now().toISOString();
    try { writeJsonAtomic(ledgerPath, ledger); } catch {}
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
