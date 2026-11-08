const REQUIRED_ARRAYS = ["queueItems", "audit", "jobs", "uploads"];
const OPTIONAL_ARRAYS = ["campaigns", "facebookDrafts", "facebookPosts", "facebookAttempts"];
const MAX_STATE_BYTES = 2 * 1024 * 1024;

export class DashboardStateServiceError extends Error {
  constructor(message, { status = 0, code = "STATE_SERVICE_ERROR" } = {}) {
    super(message);
    this.name = "DashboardStateServiceError";
    this.status = status;
    this.code = code;
  }
}

export class DashboardStateConflictError extends DashboardStateServiceError {
  constructor(message = "Dashboard state changed elsewhere; reload before retrying") {
    super(message, { status: 409, code: "REVISION_CONFLICT" });
    this.name = "DashboardStateConflictError";
  }
}

export function validateRemoteDashboardState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state) || state.version !== 1) {
    throw new TypeError("Dashboard state must be a version 1 object");
  }
  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(state[key])) throw new TypeError("Invalid dashboard state array: " + key);
  }
  for (const key of OPTIONAL_ARRAYS) {
    if (state[key] !== undefined && !Array.isArray(state[key])) {
      throw new TypeError("Invalid dashboard state array: " + key);
    }
  }
  if (state.publishingEnabled === true || state.publicPublishingEnabled === true ||
      state.unattendedPublishingEnabled === true) {
    throw new TypeError("Remote dashboard state must keep publishing disabled");
  }
  for (const campaign of state.campaigns ?? []) {
    if (campaign?.type === "safari_affiliate" && campaign.status !== "INACTIVE") {
      throw new TypeError("Safari affiliate campaigns must remain inactive");
    }
  }
  return { ...state, publishingEnabled: false };
}

export class CloudflareDashboardStateClient {
  constructor({ baseUrl, operatorToken, accessClientId = "", accessClientSecret = "", fetchImpl = globalThis.fetch, timeoutMs = 10_000 } = {}) {
    if (typeof baseUrl !== "string" || !baseUrl.trim()) throw new TypeError("DASHBOARD_STATE_API_URL is required");
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" && !(["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) && parsed.protocol === "http:")) {
      throw new TypeError("Dashboard state API must use HTTPS");
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new TypeError("Dashboard state API URL must not contain credentials, query, or fragment");
    if (typeof operatorToken !== "string" || operatorToken.length < 24) throw new TypeError("DASHBOARD_OPERATOR_TOKEN must contain at least 24 characters");
    if (Boolean(accessClientId) !== Boolean(accessClientSecret)) throw new TypeError("Cloudflare Access client ID and secret must be supplied together");
    if (accessClientId && (typeof accessClientId !== "string" || typeof accessClientSecret !== "string")) throw new TypeError("Cloudflare Access service-token credentials must be strings");
    if (typeof fetchImpl !== "function") throw new TypeError("A fetch implementation is required");
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120_000) throw new TypeError("timeoutMs must be between 100 and 120000");
    this.baseUrl = parsed.toString().replace(/\/+$/, "");
    this.operatorToken = operatorToken;
    this.accessClientId = accessClientId;
    this.accessClientSecret = accessClientSecret;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async request(path, { method = "GET", body, revision } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = { accept: "application/json", "x-operator-token": this.operatorToken };
    if (this.accessClientId) {
      headers["cf-access-client-id"] = this.accessClientId;
      headers["cf-access-client-secret"] = this.accessClientSecret;
    }
    if (body !== undefined) headers["content-type"] = "application/json";
    if (revision !== undefined) headers["if-match"] = String(revision);
    try {
      const response = await this.fetchImpl(this.baseUrl + path, {
        method, headers, redirect: "error", signal: controller.signal,
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const length = Number(response.headers.get("content-length") ?? 0);
      if (length > MAX_STATE_BYTES + 64 * 1024) throw new DashboardStateServiceError("State service response exceeds the supported size limit", { status: response.status, code: "RESPONSE_TOO_LARGE" });
      let payload;
      try { payload = await response.json(); }
      catch { throw new DashboardStateServiceError("State service returned an invalid response", { status: response.status, code: "INVALID_RESPONSE" }); }
      if (!response.ok) {
        const code = payload?.code ?? (response.status === 409 ? "REVISION_CONFLICT" : "STATE_SERVICE_ERROR");
        const message = typeof payload?.error === "string" ? payload.error : "State service request failed";
        if (response.status === 409 || code === "REVISION_CONFLICT") throw new DashboardStateConflictError(message);
        throw new DashboardStateServiceError(message, { status: response.status, code });
      }
      return { payload, etag: response.headers.get("etag") };
    } catch (error) {
      if (error instanceof DashboardStateServiceError) throw error;
      if (error?.name === "AbortError") throw new DashboardStateServiceError("State service request timed out", { code: "TIMEOUT" });
      throw new DashboardStateServiceError("State service could not be reached", { code: "NETWORK_ERROR" });
    } finally {
      clearTimeout(timer);
    }
  }

  async bootstrapState(state) {
    const validated = validateRemoteDashboardState(state);
    const { payload, etag } = await this.request("/api/state/bootstrap", { method: "POST", body: validated });
    if (Number(payload?.revision) !== 1 || !payload?.state || String(etag ?? "") !== '"1"') {
      throw new DashboardStateServiceError("State service returned an invalid bootstrap receipt", { code: "INVALID_RESPONSE" });
    }
    let savedState;
    try { savedState = validateRemoteDashboardState(payload.state); }
    catch (error) { throw new DashboardStateServiceError(error.message, { code: "INVALID_STATE" }); }
    return { revision: 1, updatedAt: payload.updatedAt ?? null, state: savedState };
  }

  async getState() {
    const { payload, etag } = await this.request("/api/state");
    const revision = Number(payload?.revision);
    if (!Number.isSafeInteger(revision) || revision < 1 || !payload?.state) {
      throw new DashboardStateServiceError("State service returned an incomplete state snapshot", { code: "INVALID_RESPONSE" });
    }
    const match = String(etag ?? "").match(/^"?([1-9][0-9]*)"?$/);
    if (!match || Number(match[1]) !== revision) {
      throw new DashboardStateServiceError("State revision and ETag do not match", { code: "INVALID_RESPONSE" });
    }
    let state;
    try { state = validateRemoteDashboardState(payload.state); }
    catch (error) { throw new DashboardStateServiceError(error.message, { code: "INVALID_STATE" }); }
    return { revision, updatedAt: payload.updatedAt ?? null, state };
  }

  async updateState(state, expectedRevision) {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new TypeError("expectedRevision must be a positive integer");
    const validated = validateRemoteDashboardState(state);
    const { payload, etag } = await this.request("/api/state", { method: "PUT", body: validated, revision: expectedRevision });
    const revision = Number(payload?.revision);
    if (!Number.isSafeInteger(revision) || revision !== expectedRevision + 1 || !payload?.state ||
        String(etag ?? "") !== '"' + revision + '"') {
      throw new DashboardStateServiceError("State service returned an unexpected update revision", { code: "INVALID_RESPONSE" });
    }
    let savedState;
    try { savedState = validateRemoteDashboardState(payload.state); }
    catch (error) { throw new DashboardStateServiceError(error.message, { code: "INVALID_STATE" }); }
    return { revision, updatedAt: payload.updatedAt ?? null, state: savedState };
  }

  async createBackup() {
    const { payload } = await this.request("/api/backups", { method: "POST", body: {} });
    if (typeof payload?.backupId !== "string" || !payload.backupId || !/^[a-f0-9]{64}$/.test(payload.sha256 ?? "") ||
        !Number.isSafeInteger(Number(payload.sourceRevision))) {
      throw new DashboardStateServiceError("State service returned an incomplete backup receipt", { code: "INVALID_RESPONSE" });
    }
    return payload;
  }

  async restoreBackup(backupId, expectedRevision) {
    if (typeof backupId !== "string" || !backupId.trim()) throw new TypeError("backupId is required");
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new TypeError("expectedRevision must be a positive integer");
    const { payload, etag } = await this.request("/api/backups/restore", {
      method: "POST", body: { backupId, expectedRevision }
    });
    const revision = Number(payload?.revision);
    if (!Number.isSafeInteger(revision) || revision !== expectedRevision + 1 || !payload?.state ||
        String(etag ?? "") !== '"' + revision + '"') {
      throw new DashboardStateServiceError("State service returned an unexpected restore revision", { code: "INVALID_RESPONSE" });
    }
    let state;
    try { state = validateRemoteDashboardState(payload.state); }
    catch (error) { throw new DashboardStateServiceError(error.message, { code: "INVALID_STATE" }); }
    return { revision, updatedAt: payload.updatedAt ?? null, state };
  }
}
