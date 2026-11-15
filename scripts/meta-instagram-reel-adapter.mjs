import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

const ID = /^\d{5,30}$/;
const VERSION = /^v\d+\.\d+$/;
const graph = (version, edge) => `https://graph.facebook.com/${version}/${edge}`;
const headers = token => ({ authorization: "Bearer " + token, accept: "application/json" });

export class InstagramReelError extends Error {
  constructor(message, { status = null, code = null, uncertain = false, containerId = null, mediaId = null } = {}) {
    super(message);
    this.name = "InstagramReelError";
    Object.assign(this, { status, code, uncertain, containerId, mediaId });
  }
}
function validate({ instagramAccountId, expectedInstagramAccountId, accessToken, apiVersion }) {
  if (!ID.test(String(instagramAccountId ?? "")) || instagramAccountId !== expectedInstagramAccountId) {
    throw new InstagramReelError("Instagram professional account ID does not match the owner-verified allowlist");
  }
  if (typeof accessToken !== "string" || accessToken.length < 20) throw new InstagramReelError("Meta user access token is not configured securely");
  if (!VERSION.test(apiVersion)) throw new InstagramReelError("Meta Graph API version is invalid");
}
async function responseJson(response, { mutation = false, token = "", containerId = null, mediaId = null } = {}) {
  let data;
  try { data = await response.json(); }
  catch { throw new InstagramReelError("Meta returned an unreadable Instagram response", { status: response.status, uncertain: mutation, containerId, mediaId }); }
  if (!response.ok || data?.error) {
    const message = typeof data?.error?.message === "string"
      ? data.error.message.split(token).join("[REDACTED]").slice(0, 400)
      : "Instagram Graph API request failed";
    throw new InstagramReelError(message, { status: response.status, code: data?.error?.code ?? null, uncertain: mutation, containerId, mediaId });
  }
  return data;
}
function readPinnedFile(filePath) {
  let fd;
  try {
    const before = fs.lstatSync(filePath);
    if (!before.isFile() || before.isSymbolicLink()) throw new Error();
    fd = fs.openSync(filePath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    const opened = fs.fstatSync(fd), current = fs.lstatSync(filePath);
    if (!opened.isFile() || current.isSymbolicLink() || !current.isFile() ||
        opened.dev !== current.dev || opened.ino !== current.ino ||
        opened.dev !== before.dev || opened.ino !== before.ino) throw new Error();
    const bytes = fs.readFileSync(fd), after = fs.fstatSync(fd);
    if (after.size !== opened.size || bytes.length !== after.size) throw new Error();
    return bytes;
  } catch { throw new InstagramReelError("Instagram Reel file could not be safely pinned as an unchanged regular file"); }
  finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }
}
function inspectVideo(bytes) {
  const result = spawnSync("ffprobe", ["-v","error","-show_entries","format=duration:stream=codec_type,width,height,avg_frame_rate","-of","json","-"], {
    input: bytes, encoding: "utf8", timeout: 20000
  });
  if (result.error || result.status !== 0) throw new InstagramReelError("ffprobe is unavailable or could not inspect the Instagram Reel");
  let parsed;
  try { parsed = JSON.parse(result.stdout); } catch { throw new InstagramReelError("ffprobe returned invalid Instagram video metadata"); }
  const stream = (parsed.streams ?? []).find(x => x.codec_type === "video" && Number(x.width) > 0 && Number(x.height) > 0);
  const duration = Number(parsed.format?.duration);
  const [n,d] = String(stream?.avg_frame_rate ?? "").split("/").map(Number);
  const frameRate = d > 0 ? n / d : NaN;
  if (!stream || !Number.isFinite(duration) || !Number.isFinite(frameRate)) throw new InstagramReelError("Instagram Reel must contain a decodable video stream, duration and frame rate");
  return { width:Number(stream.width), height:Number(stream.height), durationSeconds:duration, frameRate };
}
function uploadUrl(value, version, containerId) {
  let url;
  try { url = new URL(value); } catch { throw new InstagramReelError("Meta did not return a valid Instagram resumable upload URL"); }
  if (url.protocol !== "https:" || url.hostname !== "rupload.facebook.com" || url.username || url.password ||
      url.pathname !== `/ig-api-upload/${version}/${containerId}` || url.search || url.hash) {
    throw new InstagramReelError("Instagram upload URL is outside the exact approved rupload host and path");
  }
  return url.toString();
}
function validInstagramReelPermalink(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "www.instagram.com" || url.hostname === "instagram.com") &&
      !url.username && !url.password && !url.port && !url.search && !url.hash &&
      /^\/reel\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
  } catch { return false; }
}
function validPublishedTimestamp(value) {
  return typeof value === "string" &&
    /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value));
}

function validateDraft(draft) {
  if (!draft || draft.kind !== "INSTAGRAM_REEL_DRAFT" || typeof draft.caption !== "string" || !draft.caption.trim() ||
      typeof draft.media?.path !== "string" || !/^[a-f0-9]{64}$/.test(draft.media?.sha256 ?? "")) {
    throw new InstagramReelError("A captioned, checksum-bound Instagram Reel draft is required");
  }
}

/** Verify granted publishing scopes and the exact Instagram professional account identity. */
export async function verifyInstagramBusinessAccount({
  instagramAccountId, expectedInstagramAccountId, facebookPageId, expectedFacebookPageId, accessToken, apiVersion = "v26.0", fetchImpl = fetch, timeoutMs = 10000
}) {
  validate({ instagramAccountId, expectedInstagramAccountId, accessToken, apiVersion });
  let response;
  try {
    response = await fetchImpl(graph(apiVersion, "me?fields=id"), {
      method:"GET", headers:headers(accessToken), redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw new InstagramReelError("Meta user identity check failed before a response; Instagram publishing remains blocked"); }
  const user = await responseJson(response, { token:accessToken });
  if (!ID.test(String(user.id ?? ""))) throw new InstagramReelError("Meta did not return a valid numeric user identity");
  try {
    response = await fetchImpl(graph(apiVersion, encodeURIComponent(user.id) + "/permissions"), {
      method:"GET", headers:headers(accessToken), redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw new InstagramReelError("Meta permission check failed before a response; Instagram publishing remains blocked"); }
  const permissions = await responseJson(response, { token:accessToken });
  const granted = new Set((permissions.data ?? []).filter(x => x?.status === "granted").map(x => x.permission));
  const required = ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"];
  const missing = required.filter(x => !granted.has(x));
  if (missing.length) throw new InstagramReelError("Required Instagram permissions are missing or not granted: " + missing.join(", "));
  try {
    response = await fetchImpl(graph(apiVersion, encodeURIComponent(instagramAccountId) + "?fields=id,username,account_type"), {
      method:"GET", headers:headers(accessToken), redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw new InstagramReelError("Instagram professional account identity could not be verified"); }
  const account = await responseJson(response, { token:accessToken });
  if (account.id !== expectedInstagramAccountId || !["BUSINESS","CREATOR","MEDIA_CREATOR"].includes(String(account.account_type ?? "").toUpperCase())) {
    throw new InstagramReelError("The configured Instagram account is not the exact verified professional account");
  }
  if (!ID.test(String(facebookPageId ?? "")) || facebookPageId !== expectedFacebookPageId) {
    throw new InstagramReelError("The linked Facebook Page ID does not match the owner-verified Nature Frontiers Page");
  }
  try {
    response = await fetchImpl(graph(apiVersion, encodeURIComponent(facebookPageId) + "?fields=id,instagram_business_account{id,username}"), {
      method:"GET", headers:headers(accessToken), redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw new InstagramReelError("The Nature Frontiers Page-to-Instagram account link could not be verified"); }
  const page = await responseJson(response, { token:accessToken });
  if (page.id !== expectedFacebookPageId || page.instagram_business_account?.id !== expectedInstagramAccountId) {
    throw new InstagramReelError("The configured Instagram professional account is not linked to the exact Nature Frontiers Facebook Page");
  }
  return { verified:true, instagramAccountId:account.id, facebookPageId:page.id, username:account.username ?? null, accountType:account.account_type, grantedPermissions:required, verifiedAt:new Date().toISOString(), apiVersion };
}

/**
 * Upload and immediately publish one approved Instagram Reel.
 * Instagram Graph API publishing is immediate; this adapter deliberately does not pretend
 * to schedule a future publication. A caller must invoke it inside its approved dispatch window.
 * All mutations are single-attempt; uncertain outcomes must be reconciled, never retried blindly.
 */
export async function publishInstagramReel({
  draft, instagramAccountId, expectedInstagramAccountId, accessToken, apiVersion = "v26.0",
  accountVerified = false, approvalVerified = false, publishingEnabled = false, dryRun = true, emergencyStop = true,
  shareToFeed = true, resumableUploadSupported = false, onContainerId = null, onMediaId = null, fetchImpl = fetch,
  rootDir = process.cwd(), inspect = inspectVideo, wait = ms => new Promise(resolve => setTimeout(resolve, ms)), timeoutMs = 60000
}) {
  validate({ instagramAccountId, expectedInstagramAccountId, accessToken, apiVersion });
  validateDraft(draft);
  if (accountVerified !== true) throw new InstagramReelError("Exact Instagram professional account and permissions were not verified");
  if (approvalVerified !== true) throw new InstagramReelError("Instagram Reel publication requires verified editorial approval");
  if (resumableUploadSupported !== true) throw new InstagramReelError("Resumable upload requires a verified Facebook Login for Business integration");
  if (publishingEnabled !== true || dryRun !== false || emergencyStop !== false) {
    throw new InstagramReelError("Instagram publication requires live publishing enabled, dry-run disabled and emergency stop cleared");
  }
  if (typeof shareToFeed !== "boolean") throw new InstagramReelError("shareToFeed must be an explicit boolean");
  let absolute;
  try { absolute = resolveRegularFileNoSymlinks(draft.media.path, rootDir, "Instagram Reel video"); }
  catch { throw new InstagramReelError("Instagram Reel file is missing, unsafe, unreadable or not a regular file"); }
  const root = path.resolve(rootDir);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) throw new InstagramReelError("Instagram Reel path escapes the configured repository root");
  const bytes = readPinnedFile(absolute);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  if (!bytes.length || sha256 !== draft.media.sha256) throw new InstagramReelError("Instagram Reel checksum does not match the reviewed draft");
  const media = inspect(bytes);
  if (!media || media.durationSeconds < 4 || media.durationSeconds > 90) throw new InstagramReelError("Instagram Reel duration must be between 4 and 90 seconds");
  if (media.width < 540 || media.height < 960 || Math.abs(media.width / media.height - 9/16) > 0.005) {
    throw new InstagramReelError("Instagram Reel must meet the minimum 540x960 portrait 9:16 dimensions");
  }
  if (!Number.isFinite(media.frameRate) || media.frameRate < 23) throw new InstagramReelError("Instagram Reel frame rate must be at least 23 fps");

  let created;
  try {
    const form = new URLSearchParams({ media_type:"REELS", upload_type:"resumable", caption:draft.caption, share_to_feed:String(shareToFeed) });
    const response = await fetchImpl(graph(apiVersion, encodeURIComponent(instagramAccountId) + "/media"), {
      method:"POST", headers:{...headers(accessToken),"content-type":"application/x-www-form-urlencoded"}, body:form,
      redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
    created = await responseJson(response, { mutation:true, token:accessToken });
  } catch (error) {
    if (error instanceof InstagramReelError) throw error;
    throw new InstagramReelError("Instagram container creation ended without a definitive response; do not retry", { uncertain:true });
  }
  const containerId = String(created.id ?? "");
  if (!ID.test(containerId)) throw new InstagramReelError("Meta did not return a valid Instagram container ID; reconcile before retry", { uncertain:true });
  if (typeof onContainerId === "function") {
    try { await onContainerId({ containerId, instagramAccountId, createdAt:new Date().toISOString() }); }
    catch { throw new InstagramReelError("Instagram container ID could not be durably recorded; stop and reconcile before any retry", { uncertain:true, containerId }); }
  }
  const endpoint = `https://rupload.facebook.com/ig-api-upload/${apiVersion}/${containerId}`;
  let acceptedUrl;
  try { acceptedUrl = uploadUrl(endpoint, apiVersion, containerId); }
  catch (error) { throw new InstagramReelError(error.message, { uncertain:true, containerId }); }
  let uploaded;
  try {
    uploaded = await fetchImpl(acceptedUrl, {
      method:"POST", headers:{ authorization:"OAuth " + accessToken, offset:"0", file_size:String(bytes.length), "content-type":"application/octet-stream" },
      body:bytes, redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
  } catch { throw new InstagramReelError("Instagram binary upload ended without a definitive response; do not retry; reconcile this container", { uncertain:true, containerId }); }
  const uploadResult = await responseJson(uploaded, { mutation:true, token:accessToken, containerId });
  if (uploadResult.success !== true) throw new InstagramReelError("Meta did not confirm Instagram binary receipt; reconcile before any retry", { uncertain:true, containerId });

  let statusCode = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await wait(60_000);
    let response;
    try {
      response = await fetchImpl(graph(apiVersion, encodeURIComponent(containerId) + "?fields=id,status_code"), {
        method:"GET", headers:headers(accessToken), redirect:"error", signal:AbortSignal.timeout(timeoutMs)
      });
    } catch { throw new InstagramReelError("Instagram container processing status is unavailable; do not publish or retry", { uncertain:true, containerId }); }
    const status = await responseJson(response, { token:accessToken, containerId });
    if (status.id !== containerId) throw new InstagramReelError("Instagram container status ID mismatch", { uncertain:true, containerId });
    statusCode = String(status.status_code ?? "").toUpperCase();
    if (statusCode === "FINISHED") break;
    if (["ERROR","EXPIRED"].includes(statusCode)) throw new InstagramReelError("Instagram container processing ended with status " + statusCode, { containerId });
    if (statusCode !== "IN_PROGRESS") throw new InstagramReelError("Instagram container returned an unknown processing status; fail closed", { uncertain:true, containerId });
  }
  if (statusCode !== "FINISHED") throw new InstagramReelError("Instagram container did not reach FINISHED within the bounded processing checks; do not publish or retry", { uncertain:true, containerId });

  let published;
  try {
    const form = new URLSearchParams({ creation_id:containerId });
    const response = await fetchImpl(graph(apiVersion, encodeURIComponent(instagramAccountId) + "/media_publish"), {
      method:"POST", headers:{...headers(accessToken),"content-type":"application/x-www-form-urlencoded"}, body:form,
      redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
    published = await responseJson(response, { mutation:true, token:accessToken, containerId });
  } catch (error) {
    if (error instanceof InstagramReelError) throw error;
    throw new InstagramReelError("Instagram publish outcome is uncertain; reconcile the container and do not retry", { uncertain:true, containerId });
  }
  const mediaId = String(published.id ?? "");
  if (!ID.test(mediaId)) throw new InstagramReelError("Instagram did not return a valid published media ID; outcome is uncertain and must be reconciled", { uncertain:true, containerId });
  if (typeof onMediaId === "function") {
    try { await onMediaId({ containerId, mediaId, publishedAt:new Date().toISOString() }); }
    catch { throw new InstagramReelError("Published Instagram media ID could not be durably recorded; do not retry", { uncertain:true, containerId, mediaId }); }
  }
  let verified;
  try {
    const response = await fetchImpl(graph(apiVersion, encodeURIComponent(mediaId) + "?fields=id,media_type,media_product_type,permalink,timestamp"), {
      method:"GET", headers:headers(accessToken), redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
    verified = await responseJson(response, { token:accessToken, containerId, mediaId });
  } catch { throw new InstagramReelError("Instagram publication read-back failed; outcome remains unresolved", { uncertain:true, containerId, mediaId }); }
  if (verified.id !== mediaId || verified.media_type !== "VIDEO" || verified.media_product_type !== "REELS" || !validInstagramReelPermalink(verified.permalink) || !validPublishedTimestamp(verified.timestamp)) {
    throw new InstagramReelError("Instagram published media read-back did not confirm the expected Reel identity and permalink", { uncertain:true, containerId, mediaId });
  }
  return { status:"PUBLISHED_VERIFIED", instagramAccountId, containerId, mediaId, permalink:verified.permalink,
    publishedAt:verified.timestamp ?? null, media, sha256, uploadedBytes:bytes.length, verifiedRemotely:true };
}

/** Reconcile a persisted Instagram media ID; never creates a container or republishes. */
export async function reconcileInstagramReel({ mediaId, containerId = null, instagramAccountId, expectedInstagramAccountId, accessToken, apiVersion = "v26.0", fetchImpl = fetch, timeoutMs = 10000 }) {
  validate({ instagramAccountId, expectedInstagramAccountId, accessToken, apiVersion });
  if (!ID.test(String(mediaId ?? ""))) return { outcome:"UNRESOLVED", reason:"INSTAGRAM_MEDIA_ID_MISSING_NO_RETRY", containerId };
  try {
    const response = await fetchImpl(graph(apiVersion, encodeURIComponent(mediaId) + "?fields=id,media_type,media_product_type,permalink,timestamp"), {
      method:"GET", headers:headers(accessToken), redirect:"error", signal:AbortSignal.timeout(timeoutMs)
    });
    const data = await responseJson(response, { token:accessToken, containerId, mediaId });
    if (data.id !== mediaId || data.media_type !== "VIDEO" || data.media_product_type !== "REELS" || !validInstagramReelPermalink(data.permalink) || !validPublishedTimestamp(data.timestamp)) {
      return { outcome:"UNRESOLVED", reason:"INSTAGRAM_MEDIA_READBACK_MISMATCH", mediaId, containerId };
    }
    return { outcome:"CONFIRMED", receipt:{ status:"PUBLISHED_VERIFIED", mediaId, containerId, permalink:data.permalink, publishedAt:data.timestamp ?? null } };
  } catch {
    return { outcome:"UNRESOLVED", reason:"INSTAGRAM_MEDIA_READBACK_FAILED_NO_RETRY", mediaId, containerId };
  }
}
