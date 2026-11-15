import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

const PAGE_ID = /^\d{5,30}$/;
const API_VERSION = /^v\d+\.\d+$/;
const TOKEN_MIN = 20;
const graph = (version, edge) => `https://graph.facebook.com/${version}/${edge}`;
const auth = token => ({ authorization: "Bearer " + token, accept: "application/json" });

export class MetaPageReelError extends Error {
  constructor(message, { status = null, code = null, uncertain = false, remoteVideoId = null } = {}) {
    super(message);
    this.name = "MetaPageReelError";
    this.status = status;
    this.code = code;
    this.uncertain = uncertain;
    this.remoteVideoId = remoteVideoId;
  }
}
function validate({ pageId, expectedPageId, accessToken, apiVersion }) {
  if (!PAGE_ID.test(String(pageId ?? "")) || pageId !== expectedPageId) throw new MetaPageReelError("Facebook Page ID does not match the owner-verified allowlist");
  if (typeof accessToken !== "string" || accessToken.length < TOKEN_MIN) throw new MetaPageReelError("Meta Page access token is not configured securely");
  if (!API_VERSION.test(apiVersion)) throw new MetaPageReelError("Meta Graph API version is invalid");
}
async function readJson(response, { mutation = false, remoteVideoId = null } = {}) {
  let data;
  try { data = await response.json(); }
  catch { throw new MetaPageReelError("Meta returned an unreadable Reel response", { status: response.status, uncertain: mutation, remoteVideoId }); }
  if (!response.ok || data?.error) throw new MetaPageReelError(
    typeof data?.error?.message === "string" ? data.error.message.slice(0, 400) : "Meta Reel request failed",
    { status: response.status, code: data?.error?.code ?? null, uncertain: mutation, remoteVideoId }
  );
  return data;
}
function inspectVideo(filePath) {
  const result = spawnSync("ffprobe", ["-v","error","-show_entries","format=duration:stream=codec_type,width,height","-of","json",filePath], { encoding:"utf8", timeout:20000 });
  if (result.error || result.status !== 0) throw new MetaPageReelError("ffprobe is unavailable or could not inspect the Reel video");
  let parsed;
  try { parsed = JSON.parse(result.stdout); } catch { throw new MetaPageReelError("ffprobe returned invalid video inspection data"); }
  const stream = (parsed.streams ?? []).find(item => item.codec_type === "video" && Number(item.width) > 0 && Number(item.height) > 0);
  const duration = Number(parsed.format?.duration);
  if (!stream || !Number.isFinite(duration) || duration <= 0) throw new MetaPageReelError("Reel video must contain a decodable video stream and positive duration");
  return { width:Number(stream.width), height:Number(stream.height), durationSeconds:duration };
}
function validateUploadUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new MetaPageReelError("Meta did not return a valid Reel upload URL"); }
  if (url.protocol !== "https:" || url.hostname !== "rupload.facebook.com" || url.username || url.password || !url.pathname.startsWith("/video-upload/") || url.search) {
    throw new MetaPageReelError("Meta returned an upload URL outside the approved rupload host/path");
  }
  return url.toString();
}

/**
 * Upload a locally registered, checksum-bound video as a Facebook Page Reel.
 * Defaults to DRAFT. PUBLISHED requires explicit approval and live publishing switches.
 * Never retries a mutation: uncertain outcomes retain the remote video ID for reconciliation.
 */
export async function createMetaPageReel({
  draft, pageId, expectedPageId, accessToken, apiVersion = "v26.0",
  permissionsVerified = false, approvalVerified = false,
  publishingEnabled = false, dryRun = true, emergencyStop = true,
  videoState = "DRAFT", fetchImpl = fetch, rootDir = process.cwd(),
  inspect = inspectVideo, timeoutMs = 60000
}) {
  validate({ pageId, expectedPageId, accessToken, apiVersion });
  if (permissionsVerified !== true) throw new MetaPageReelError("Live Meta Page permissions were not verified");
  if (!draft || draft.kind !== "FACEBOOK_PAGE_REEL_DRAFT" || typeof draft.caption !== "string" || !draft.caption.trim() ||
      typeof draft.media?.path !== "string" || !/^[a-f0-9]{64}$/.test(draft.media?.sha256 ?? "")) {
    throw new MetaPageReelError("A captioned, checksum-bound Facebook Page Reel draft is required");
  }
  if (!["DRAFT","PUBLISHED"].includes(videoState)) throw new MetaPageReelError("Reel state must be DRAFT or PUBLISHED");
  if (videoState === "PUBLISHED" && (approvalVerified !== true || publishingEnabled !== true || dryRun !== false || emergencyStop !== false)) {
    throw new MetaPageReelError("Publishing a Reel requires verified editorial approval, live publishing enabled, dry-run disabled and emergency stop cleared");
  }
  let absolute, bytes;
  try { absolute = resolveRegularFileNoSymlinks(draft.media.path, rootDir, "Facebook Reel video"); bytes = fs.readFileSync(absolute); }
  catch { throw new MetaPageReelError("Reel video is missing, unsafe, unreadable or not a regular file"); }
  if (!bytes.length || crypto.createHash("sha256").update(bytes).digest("hex") !== draft.media.sha256) throw new MetaPageReelError("Reel video checksum does not match the reviewed draft");
  const media = inspect(absolute);
  if (!media || !Number.isFinite(media.durationSeconds) || media.durationSeconds <= 0) throw new MetaPageReelError("Reel video inspection did not establish a valid duration");
  const startForm = new URLSearchParams({ upload_phase:"START" });
  let start;
  try {
    start = await fetchImpl(graph(apiVersion, encodeURIComponent(pageId) + "/video_reels"), {
      method:"POST", headers:{...auth(accessToken),"content-type":"application/x-www-form-urlencoded"}, body:startForm,
      redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw new MetaPageReelError("Reel upload initialization ended without a definitive response; reconcile before retry", { uncertain:true }); }
  const started = await readJson(start, { mutation:true });
  const videoId = typeof started.video_id === "string" ? started.video_id : "";
  if (!/^\d{5,30}$/.test(videoId)) throw new MetaPageReelError("Meta did not return a valid Reel video ID; reconcile the initialization before retry");
  let uploadUrl;
  try { uploadUrl = validateUploadUrl(started.upload_url); }
  catch (error) { throw new MetaPageReelError(error.message, { uncertain:true, remoteVideoId:videoId }); }
  let uploaded;
  try {
    uploaded = await fetchImpl(uploadUrl, {
      method:"POST",
      headers:{ authorization:"OAuth " + accessToken, offset:"0", file_size:String(bytes.length), "content-type":"application/octet-stream" },
      body:bytes, redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw new MetaPageReelError("Reel binary upload ended without a definitive response; do not retry; reconcile this video ID", { uncertain:true, remoteVideoId:videoId }); }
  const uploadResult = await readJson(uploaded, { mutation:true, remoteVideoId:videoId });
  if (uploadResult.success !== true) throw new MetaPageReelError("Meta did not confirm receipt of the Reel binary; reconcile before any retry", { uncertain:true, remoteVideoId:videoId });
  const finishForm = new URLSearchParams({
    upload_phase:"FINISH", video_id:videoId, video_state:videoState, description:draft.caption
  });
  let finished;
  try {
    finished = await fetchImpl(graph(apiVersion, encodeURIComponent(pageId) + "/video_reels"), {
      method:"POST", headers:{...auth(accessToken),"content-type":"application/x-www-form-urlencoded"}, body:finishForm,
      redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw new MetaPageReelError("Reel finalization ended without a definitive response; reconcile this video ID before retry", { uncertain:true, remoteVideoId:videoId }); }
  const finishResult = await readJson(finished, { mutation:true, remoteVideoId:videoId });
  if (finishResult.success !== true) throw new MetaPageReelError("Meta did not confirm Reel finalization; reconcile before any retry", { uncertain:true, remoteVideoId:videoId });
  return {
    status: videoState === "DRAFT" ? "REMOTE_DRAFT_UNVERIFIED" : "REMOTE_PUBLISHED_UNVERIFIED",
    remoteVideoId:videoId, pageId, apiVersion, videoState, media,
    sha256:draft.media.sha256, uploadedBytes:bytes.length,
    createdAt:new Date().toISOString(), verifiedRemotely:false
  };
}

/** Read the remote processing/publication phases; a missing response is never treated as failure-to-publish. */
export async function fetchMetaPageReelStatus({ remoteVideoId, expectedPageId, accessToken, apiVersion = "v26.0", fetchImpl = fetch, timeoutMs = 10000 }) {
  validate({ pageId:expectedPageId, expectedPageId, accessToken, apiVersion });
  if (!/^\d{5,30}$/.test(String(remoteVideoId ?? ""))) throw new MetaPageReelError("A numeric remote Reel video ID is required");
  let response;
  try {
    response = await fetchImpl(graph(apiVersion, encodeURIComponent(remoteVideoId) + "?fields=id,status"), {
      method:"GET", headers:auth(accessToken), redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw new MetaPageReelError("Remote Reel status could not be read; outcome remains unresolved", { uncertain:true, remoteVideoId }); }
  const data = await readJson(response);
  if (data.id !== remoteVideoId || !data.status || typeof data.status !== "object") throw new MetaPageReelError("Meta Reel status response did not match the requested video ID");
  return { remoteVideoId, status:data.status, checkedAt:new Date().toISOString(), verifiedRemotely:true };
}
