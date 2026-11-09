#!/usr/bin/env node
/**
 * Guarded, owner-approved YouTube metadata update.
 * This can update only title/description/tags on one explicitly approved
 * existing SonicVhibez video. It cannot upload, publish, schedule, or change
 * privacy, thumbnails, channel branding, or any other video.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { verifySonicVhibezChannel } from "./verify-youtube-channel.mjs";

const HANDLE = "sonicvhibez";
const MAX_APPROVAL_AGE_MS = 31 * 24 * 60 * 60 * 1000;

function required(env, key) {
  const value = env[key];
  if (typeof value !== "string" || !value.trim()) throw new Error("missing required GitHub Actions secret: " + key);
  return value.trim();
}
function safeJson(file, label) {
  if (typeof file !== "string" || !file.trim() || path.isAbsolute(file) || path.normalize(file).split(path.sep).includes("..")) {
    throw new Error(label + " must be a safe repository-relative path");
  }
  const full = path.resolve(process.cwd(), file);
  const stat = fs.lstatSync(full);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(label + " must be a regular non-symlink file");
  return JSON.parse(fs.readFileSync(full, "utf8"));
}
export function canonicalSnippet(snippet) {
  return {
    title: String(snippet?.title ?? ""),
    description: String(snippet?.description ?? ""),
    tags: Array.isArray(snippet?.tags) ? snippet.tags.map(String) : [],
    categoryId: String(snippet?.categoryId ?? "")
  };
}
export function snippetSha256(snippet) {
  return crypto.createHash("sha256").update(JSON.stringify(canonicalSnippet(snippet))).digest("hex");
}
export function validateSeoMetadataApproval(approval, { channelId, now = new Date() } = {}) {
  if (!approval || approval.schemaVersion !== 1 || approval.status !== "APPROVED") throw new Error("SEO metadata approval must be schemaVersion=1 and status=APPROVED");
  if (approval.channelId !== channelId || approval.channelHandle?.replace(/^@/, "").toLowerCase() !== HANDLE) throw new Error("SEO approval is not bound to the verified SonicVhibez channel");
  if (typeof approval.videoId !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(approval.videoId)) throw new Error("SEO approval must identify exactly one existing YouTube video ID");
  if (typeof approval.approvedBy !== "string" || approval.approvedBy.trim().length < 2) throw new Error("SEO approval requires a named human reviewer");
  const approvedAt = Date.parse(approval.approvedAt);
  const expiresAt = Date.parse(approval.expiresAt);
  if (!Number.isFinite(approvedAt) || !Number.isFinite(expiresAt) || approvedAt > now.getTime() || expiresAt <= now.getTime() ||
      expiresAt <= approvedAt || expiresAt - approvedAt > MAX_APPROVAL_AGE_MS) {
    throw new Error("SEO approval timestamps are invalid, expired, future-dated, or exceed the 31-day approval window");
  }
  if (!/^[a-f0-9]{64}$/.test(approval.expectedCurrentSha256 ?? "")) throw new Error("SEO approval must bind the exact current remote metadata SHA-256");
  const desired = approval.desired;
  if (!desired || typeof desired !== "object" || Array.isArray(desired) ||
      typeof desired.title !== "string" || desired.title.trim().length < 5 || desired.title.length > 100 ||
      typeof desired.description !== "string" || desired.description.length > 5000 ||
      !Array.isArray(desired.tags) || desired.tags.length < 1 || desired.tags.length > 30 ||
      desired.tags.some(tag => typeof tag !== "string" || !tag.trim() || tag.length > 100) ||
      new Set(desired.tags.map(tag => tag.toLowerCase())).size !== desired.tags.length) {
    throw new Error("SEO approval desired metadata is invalid (title, description, or unique tags)");
  }
  if (approval.evidence?.searchVolume !== null && approval.evidence?.searchVolume !== undefined) {
    throw new Error("Do not claim a search-volume figure unless an independently verifiable provider/source is recorded; YouTube Data API results do not supply search volume");
  }
  if (approval.evidence?.volumeClaimPerMinute !== undefined) {
    throw new Error("unsupported per-minute keyword search-volume claims are prohibited");
  }
  return Object.freeze({
    videoId: approval.videoId,
    expectedCurrentSha256: approval.expectedCurrentSha256,
    desired: Object.freeze({ title: desired.title.trim(), description: desired.description, tags: [...desired.tags] }),
    approvalId: String(approval.approvalId ?? ""),
    approvedBy: approval.approvedBy.trim()
  });
}

export async function updateApprovedYoutubeSeo({
  env = process.env,
  approvalPath = "config/seo-metadata-approval.json",
  youtubeFactory,
  now = new Date(),
  dryRun = env.SEO_METADATA_DRY_RUN !== "NO"
} = {}) {
  if (env.SEO_METADATA_WRITE_ENABLED !== "YES") throw new Error("SEO_METADATA_WRITE_ENABLED must be YES; metadata writes are disabled by default");
  if (!dryRun && env.SEO_METADATA_LIVE_CONFIRM !== "YES") throw new Error("SEO_METADATA_LIVE_CONFIRM must be YES for a live metadata write");
  const clientId = required(env, "YOUTUBE_CLIENT_ID");
  const clientSecret = required(env, "YOUTUBE_CLIENT_SECRET");
  const refreshToken = required(env, "YOUTUBE_REFRESH_TOKEN");
  const channelId = required(env, "SONICVHIBEZ_CHANNEL_ID");
  const approval = validateSeoMetadataApproval(safeJson(approvalPath, "SEO approval file"), { channelId, now });
  let youtube;
  if (youtubeFactory) youtube = youtubeFactory({ clientId, clientSecret, refreshToken });
  else {
    const { google } = await import("googleapis");
    const oauth = new google.auth.OAuth2(clientId, clientSecret);
    oauth.setCredentials({ refresh_token: refreshToken });
    youtube = google.youtube({ version: "v3", auth: oauth });
  }

  const identity = await verifySonicVhibezChannel({ env, youtubeFactory: () => youtube });
  if (identity.status !== "PASS_READ_ONLY_IDENTITY_AND_INVENTORY" || identity.channelId !== channelId) {
    throw new Error("refusing SEO metadata update because complete authenticated SonicVhibez identity/history verification did not pass");
  }
  const response = await youtube.videos.list({ part: ["id", "snippet", "status"], id: approval.videoId });
  const current = response?.data?.items?.find(item => item?.id === approval.videoId);
  if (!current || current.snippet?.channelId !== channelId) throw new Error("approved video does not exist on the verified SonicVhibez channel");
  const before = canonicalSnippet(current.snippet);
  if (snippetSha256(before) !== approval.expectedCurrentSha256) throw new Error("remote video metadata changed since approval; refusing stale or conflicting SEO write");
  const nextSnippet = { ...current.snippet, ...approval.desired };
  // Keep category and every other existing snippet field; the API request is
  // restricted to part=snippet and contains no status/privacy fields.
  if (dryRun) return Object.freeze({ status: "PASS_SEO_METADATA_DRY_RUN", videoId: approval.videoId, channelId, beforeSha256: approval.expectedCurrentSha256, proposedSha256: snippetSha256(nextSnippet), writesPerformed: false, privacyStatus: current.status?.privacyStatus ?? null });

  const write = await youtube.videos.update({ part: ["snippet"], requestBody: { id: approval.videoId, snippet: nextSnippet } });
  if (write?.data?.id !== approval.videoId) throw new Error("YouTube metadata update response did not identify the approved video; verify remotely before retrying");
  const verifiedResponse = await youtube.videos.list({ part: ["id", "snippet", "status"], id: approval.videoId });
  const verified = verifiedResponse?.data?.items?.find(item => item?.id === approval.videoId);
  if (!verified || verified.snippet?.channelId !== channelId ||
      snippetSha256(verified.snippet) !== snippetSha256(nextSnippet) ||
      verified.status?.privacyStatus !== current.status?.privacyStatus) {
    throw new Error("post-write verification failed; do not retry until the exact remote metadata and privacy state are reconciled");
  }
  return Object.freeze({ status: "PASS_SEO_METADATA_UPDATED_AND_VERIFIED", videoId: approval.videoId, channelId, beforeSha256: approval.expectedCurrentSha256, afterSha256: snippetSha256(verified.snippet), writesPerformed: true, privacyStatus: verified.status?.privacyStatus ?? null });
}

async function main() {
  const result = await updateApprovedYoutubeSeo();
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write("BLOCKED: " + (error?.message ?? String(error)) + "\n");
    process.exitCode = 2;
  });
}
