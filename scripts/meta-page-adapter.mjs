import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PAGE_ID_PATTERN = /^\d{5,30}$/;
const API_VERSION_PATTERN = /^v\d+\.\d+$/;
const IMAGE_TYPES = new Map([
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".png", "image/png"],
  [".gif", "image/gif"], [".bmp", "image/bmp"], [".tif", "image/tiff"], [".tiff", "image/tiff"]
]);

export class MetaPageApiError extends Error {
  constructor(message, { status = null, code = null, retryable = false, uncertain = false } = {}) {
    super(message);
    this.name = "MetaPageApiError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.uncertain = uncertain;
  }
}

function safeApiMessage(data, token) {
  let message = typeof data?.error?.message === "string" ? data.error.message : "Meta Graph API request failed";
  if (token) message = message.split(token).join("[REDACTED]");
  return message.slice(0, 500);
}
async function parseResponse(response, token, { mutation = false } = {}) {
  let data;
  try { data = await response.json(); } catch { throw new MetaPageApiError("Meta Graph API returned an unreadable response", { status: response.status, retryable: response.status >= 500, uncertain: mutation }); }
  if (!response.ok || data?.error) {
    const code = data?.error?.code ?? null;
    const message = safeApiMessage(data, token);
    throw new MetaPageApiError(message, {
      status: response.status, code,
      retryable: response.status === 429 || response.status >= 500,
      uncertain: mutation && (response.status >= 500 || response.status === 429)
    });
  }
  return data;
}
function validateConfig({ pageId, expectedPageId, accessToken, apiVersion = "v26.0" }) {
  if (!PAGE_ID_PATTERN.test(String(pageId ?? "")) || pageId !== expectedPageId) throw new MetaPageApiError("Facebook Page ID is missing or does not match the owner-verified allowlist");
  if (typeof accessToken !== "string" || accessToken.length < 20) throw new MetaPageApiError("Meta Page access token is not configured securely");
  if (!API_VERSION_PATTERN.test(apiVersion)) throw new MetaPageApiError("META_GRAPH_API_VERSION must look like v26.0");
}
function probeImageFile(filePath) {
  const result = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_type,width,height", "-of", "json", filePath], { encoding: "utf8", timeout: 15000 });
  if (result.error || result.status !== 0) throw new MetaPageApiError("ffprobe is unavailable or failed to decode the Facebook image asset");
  let data;
  try { data = JSON.parse(result.stdout); } catch { throw new MetaPageApiError("ffprobe returned invalid image inspection data"); }
  const stream = (data.streams ?? []).find(item => item.codec_type === "video" && Number(item.width) > 0 && Number(item.height) > 0);
  if (!stream) throw new MetaPageApiError("Facebook image asset has no decodable image stream or valid dimensions");
  return { width: Number(stream.width), height: Number(stream.height) };
}
function endpoint(apiVersion, pathPart) {
  return "https://graph.facebook.com/" + apiVersion + "/" + pathPart;
}
function headers(accessToken, extra = {}) {
  return { authorization: "Bearer " + accessToken, accept: "application/json", ...extra };
}

/** Verify the user's granted app scopes, exact managed Page, create-content task and matching Page token. */
export async function verifyMetaPagePermissions({
  pageId, userAccessToken, pageAccessToken, apiVersion = "v26.0",
  fetchImpl = fetch, timeoutMs = 10000
}) {
  if (!PAGE_ID_PATTERN.test(String(pageId ?? ""))) throw new MetaPageApiError("A numeric owner-specified Page ID is required");
  if (typeof userAccessToken !== "string" || userAccessToken.length < 20) throw new MetaPageApiError("Meta user access token is not configured securely");
  if (typeof pageAccessToken !== "string" || pageAccessToken.length < 20) throw new MetaPageApiError("Meta Page access token is not configured securely");
  if (!API_VERSION_PATTERN.test(apiVersion)) throw new MetaPageApiError("META_GRAPH_API_VERSION must look like v26.0");
  let permissionsResponse;
  try {
    permissionsResponse = await fetchImpl(endpoint(apiVersion, "me/permissions"), {
      method: "GET", headers: headers(userAccessToken), signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new MetaPageApiError("Meta permission check failed before a response; publishing remains blocked", { retryable: true });
  }
  const permissionData = await parseResponse(permissionsResponse, userAccessToken);
  const required = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];
  const granted = new Set((permissionData.data ?? []).filter(item => item?.status === "granted").map(item => item.permission));
  const missing = required.filter(permission => !granted.has(permission));
  if (missing.length) throw new MetaPageApiError("Required Meta permissions are missing or not granted: " + missing.join(", "));
  // Follow cursor pagination through the supported managed-Page edge. Never log paging URLs,
  // which may contain sensitive query parameters, and cap traversal to prevent runaway requests.
  let page = null;
  let after = "";
  const maxPages = 20;
  for (let pageNumber = 0; pageNumber < maxPages; pageNumber++) {
    const query = new URLSearchParams({ fields: "id,name,tasks,access_token", limit: "100" });
    if (after) query.set("after", after);
    let accountsResponse;
    try {
      accountsResponse = await fetchImpl(endpoint(apiVersion, "me/accounts?" + query.toString()), {
        method: "GET", headers: headers(userAccessToken), signal: AbortSignal.timeout(timeoutMs)
      });
    } catch {
      throw new MetaPageApiError("Meta managed-Page lookup failed before a response; publishing remains blocked", { retryable: true });
    }
    const accounts = await parseResponse(accountsResponse, userAccessToken);
    page = (accounts.data ?? []).find(item => item?.id === pageId) ?? null;
    if (page) break;
    if (!accounts.paging?.next) break;
    const nextAfter = accounts.paging?.cursors?.after;
    if (typeof nextAfter !== "string" || !nextAfter || nextAfter === after) {
      throw new MetaPageApiError("Meta managed-Page pagination did not provide a safe advancing cursor; publishing remains blocked");
    }
    after = nextAfter;
  }
  if (!page) throw new MetaPageApiError("The configured Page ID was not found in the bounded managed-Page lookup");
  const tasks = Array.isArray(page.tasks) ? page.tasks : [];
  if (!tasks.includes("CREATE_CONTENT") && !tasks.includes("MANAGE")) throw new MetaPageApiError("The authorized account lacks the CREATE_CONTENT or MANAGE task for this Page");
  const returnedPageToken = typeof page.access_token === "string" ? page.access_token : "";
  const tokensMatch = returnedPageToken.length === pageAccessToken.length &&
    crypto.timingSafeEqual(Buffer.from(returnedPageToken), Buffer.from(pageAccessToken));
  if (!tokensMatch) throw new MetaPageApiError("The configured Page access token does not match the token returned for this exact Page ID");
  return {
    verified: true, pageId: page.id, pageName: typeof page.name === "string" ? page.name : null,
    tasks, grantedPermissions: required.filter(permission => granted.has(permission)),
    permissionsVerified: true, verifiedAt: new Date().toISOString(), apiVersion
  };
}

export async function verifyMetaPageIdentity({
  pageId, expectedPageId, accessToken, apiVersion = "v26.0", expectedPageName = "",
  fetchImpl = fetch, timeoutMs = 10000
}) {
  validateConfig({ pageId, expectedPageId, accessToken, apiVersion });
  let response;
  try {
    response = await fetchImpl(endpoint(apiVersion, encodeURIComponent(pageId) + "?fields=id,name"), {
      method: "GET", headers: headers(accessToken), signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new MetaPageApiError("Meta Page identity check failed before a response; do not publish until connectivity is verified", { retryable: true });
  }
  const data = await parseResponse(response, accessToken);
  if (data.id !== expectedPageId) throw new MetaPageApiError("Meta returned a Page ID that does not match the verified allowlist");
  if (expectedPageName && data.name !== expectedPageName) throw new MetaPageApiError("Meta Page name differs from the owner-specified expected name; review identity manually");
  return { verified: true, pageId: data.id, pageName: typeof data.name === "string" ? data.name : null, checkedAt: new Date().toISOString(), apiVersion };
}

/** Single-request Page post adapter. It deliberately performs no retries. */
export async function publishMetaPagePost({
  draft, pageId, expectedPageId, accessToken, apiVersion = "v26.0",
  permissionsConfirmed = false, fetchImpl = fetch, rootDir = process.cwd(), now = Date.now(),
  timeoutMs = 30000, probeImage = probeImageFile
}) {
  validateConfig({ pageId, expectedPageId, accessToken, apiVersion });
  if (permissionsConfirmed !== true) throw new MetaPageApiError("Owner has not confirmed required Meta Page publishing permissions");
  if (!draft || draft.kind !== "FACEBOOK_PAGE_DRAFT" || !draft.caption || !draft.scheduledAt) throw new MetaPageApiError("A complete reviewed Facebook Page draft is required");
  const scheduledMs = Date.parse(draft.scheduledAt);
  if (!Number.isFinite(scheduledMs) || scheduledMs <= now) throw new MetaPageApiError("Facebook scheduled publication time must be in the future");
  const deltaMs = scheduledMs - now;
  if (deltaMs < 10 * 60 * 1000 || deltaMs > 75 * 24 * 60 * 60 * 1000) throw new MetaPageApiError("Meta scheduled posts must be at least 10 minutes and no more than 75 days in the future");
  const scheduledSeconds = Math.floor(scheduledMs / 1000);
  const form = new FormData();
  form.set("message", draft.caption);
  form.set("published", "false");
  form.set("scheduled_publish_time", String(scheduledSeconds));
  form.set("unpublished_content_type", "SCHEDULED");
  let pathPart = encodeURIComponent(pageId) + "/feed";
  if (draft.media) {
    if (typeof draft.media.path !== "string" || !/^[a-f0-9]{64}$/.test(draft.media.sha256 ?? "")) throw new MetaPageApiError("Image asset path and SHA-256 are required");
    const absolute = path.resolve(rootDir, draft.media.path);
    const root = path.resolve(rootDir);
    if (!(absolute === root || absolute.startsWith(root + path.sep))) throw new MetaPageApiError("Image asset path escapes the configured repository root");
    let bytes;
    try { bytes = fs.readFileSync(absolute); } catch { throw new MetaPageApiError("Image asset is missing or unreadable"); }
    if (!bytes.length || crypto.createHash("sha256").update(bytes).digest("hex") !== draft.media.sha256) throw new MetaPageApiError("Image asset checksum does not match the approved draft");
    const extension = path.extname(absolute).toLowerCase();
    const mimeType = IMAGE_TYPES.get(extension);
    if (!mimeType) throw new MetaPageApiError("Meta photo publishing supports only verified JPEG, PNG, GIF, BMP or TIFF images in this adapter");
    probeImage(absolute);
    form.set("source", new Blob([bytes], { type: mimeType }), path.basename(absolute));
    pathPart = encodeURIComponent(pageId) + "/photos";
  }
  let response;
  try {
    response = await fetchImpl(endpoint(apiVersion, pathPart), {
      method: "POST", headers: headers(accessToken), body: form, signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new MetaPageApiError("Meta publish request ended without a definitive response; outcome is uncertain and must be reconciled before retry", { retryable: false, uncertain: true });
  }
  const data = await parseResponse(response, accessToken, { mutation: true });
  const remotePostId = typeof data.post_id === "string" ? data.post_id : typeof data.id === "string" ? data.id : "";
  if (!remotePostId) throw new MetaPageApiError("Meta accepted the request but returned no usable post ID; outcome requires reconciliation", { uncertain: true });
  return {
    status: "REMOTE_SCHEDULED_UNVERIFIED", remotePostId,
    photoId: typeof data.id === "string" && data.post_id ? data.id : null,
    scheduledPublishTime: scheduledSeconds, pageId, apiVersion,
    createdAt: new Date(now).toISOString(), verifiedRemotely: false
  };
}

export async function fetchMetaPagePost({
  remotePostId, expectedPageId, accessToken, apiVersion = "v26.0",
  fetchImpl = fetch, timeoutMs = 10000
}) {
  if (typeof remotePostId !== "string" || !remotePostId.startsWith(expectedPageId + "_") && !remotePostId.startsWith(expectedPageId)) throw new MetaPageApiError("Remote post ID does not match the authorized Page ID");
  validateConfig({ pageId: expectedPageId, expectedPageId, accessToken, apiVersion });
  let response;
  try {
    response = await fetchImpl(endpoint(apiVersion, encodeURIComponent(remotePostId) + "?fields=id,message,created_time,permalink_url,is_published,scheduled_publish_time"), {
      method: "GET", headers: headers(accessToken), signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new MetaPageApiError("Remote post verification failed; retain the known ID and reconcile later", { retryable: true });
  }
  const data = await parseResponse(response, accessToken);
  if (data.id !== remotePostId) throw new MetaPageApiError("Meta post verification returned a different remote ID");
  return {
    status: data.is_published === true ? "PUBLISHED_VERIFIED" : Number.isFinite(Number(data.scheduled_publish_time)) ? "SCHEDULED_VERIFIED" : "REMOTE_EXISTS_STATUS_UNCLEAR",
    remotePostId: data.id, remoteUrl: typeof data.permalink_url === "string" && data.permalink_url.startsWith("https://") ? data.permalink_url : null,
    remoteMessage: typeof data.message === "string" ? data.message : null,
    createdTime: data.created_time ?? null, scheduledPublishTime: data.scheduled_publish_time ?? null,
    isPublished: data.is_published === true, verifiedAt: new Date().toISOString()
  };
}
