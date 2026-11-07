const STATE_ID = 1;
const MAX_STATE_BYTES = 2 * 1024 * 1024;

const REQUIRED_ARRAYS = ["queueItems", "audit", "jobs", "uploads"];
const OPTIONAL_ARRAYS = ["campaigns", "facebookDrafts", "facebookPosts", "facebookAttempts"];

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}

function constantTimeEqual(left, right) {
  const a = new TextEncoder().encode(String(left ?? ""));
  const b = new TextEncoder().encode(String(right ?? ""));
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}

function validateDashboardState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("State must be a JSON object");
  }
  if (value.version !== 1) throw new Error("Unsupported dashboard state version");
  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(value[key])) throw new Error("Invalid state schema: " + key);
  }
  for (const key of OPTIONAL_ARRAYS) {
    if (value[key] !== undefined && !Array.isArray(value[key])) {
      throw new Error("Invalid state schema: " + key);
    }
  }
  if (value.publishingEnabled === true || value.publicPublishingEnabled === true ||
      value.unattendedPublishingEnabled === true) {
    throw new Error("Publishing must remain disabled in the Cloudflare state service");
  }
  for (const campaign of Array.isArray(value.campaigns) ? value.campaigns : []) {
    if (campaign?.type === "safari_affiliate" && campaign.status !== "INACTIVE") {
      throw new Error("Safari affiliate campaigns must remain inactive");
    }
  }
  return { ...value, publishingEnabled: false };
}

async function readJson(request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_STATE_BYTES) throw new Error("Request body exceeds the 2 MiB state limit");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_STATE_BYTES) {
    throw new Error("Request body exceeds the 2 MiB state limit");
  }
  return JSON.parse(raw);
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function authenticate(request, env) {
  const configured = env.DASHBOARD_OPERATOR_TOKEN;
  const supplied = request.headers.get("x-operator-token");
  return typeof configured === "string" && configured.length >= 24 &&
    constantTimeEqual(supplied, configured);
}

async function currentState(env) {
  return env.STATE_DB.prepare(
    "SELECT revision, state_json, updated_at FROM dashboard_state WHERE singleton_id = ?"
  ).bind(STATE_ID).first();
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (url.pathname === "/healthz" && method === "GET") {
    return json({ status: "ok", service: "sonicvhibez-durable-state", publishingEnabled: false });
  }

  if (!url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
  if (!(await authenticate(request, env))) return json({ error: "Unauthorized" }, 401);

  if (url.pathname === "/api/state" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try {
      state = validateDashboardState(JSON.parse(row.state_json));
    } catch {
      return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503);
    }
    return json({ revision: row.revision, updatedAt: row.updated_at, state }, 200, { etag: '"' + row.revision + '"' });
  }

  if (url.pathname === "/api/state/bootstrap" && method === "POST") {
    let state;
    try { state = validateDashboardState(await readJson(request)); }
    catch (error) { return json({ error: error.message }, 400); }
    const now = new Date().toISOString();
    const stateJson = JSON.stringify({
      ...state,
      audit: [...state.audit, {
        id: crypto.randomUUID(),
        action: "DASHBOARD_STATE_BOOTSTRAPPED",
        actor: env.DASHBOARD_OPERATOR_ID ?? "authorized-operator",
        at: now
      }]
    });
    const result = await env.STATE_DB.prepare(
      "INSERT OR IGNORE INTO dashboard_state (singleton_id, revision, state_json, updated_at) VALUES (?, 1, ?, ?)"
    ).bind(STATE_ID, stateJson, now).run();
    if (Number(result.meta?.changes ?? 0) !== 1) {
      return json({ error: "State already exists; bootstrap is one-time only" }, 409);
    }
    return json({ revision: 1, updatedAt: now, state: JSON.parse(stateJson) }, 201, { etag: '"1"' });
  }

  if (url.pathname === "/api/state" && method === "PUT") {
    const revisionHeader = request.headers.get("if-match") ?? "";
    const revisionMatch = revisionHeader.match(/^"?([1-9][0-9]*)"?$/);
    const expectedRevision = revisionMatch ? Number(revisionMatch[1]) : NaN;
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
      return json({ error: "If-Match must contain the current integer state revision" }, 428);
    }
    let state;
    try { state = validateDashboardState(await readJson(request)); }
    catch (error) { return json({ error: error.message }, 400); }
    const current = await currentState(env);
    if (!current || Number(current.revision) !== expectedRevision) {
      return json({ error: "State revision conflict; reload before retrying", code: "REVISION_CONFLICT" }, 409);
    }
    const now = new Date().toISOString();
    const stateJson = JSON.stringify({
      ...state,
      audit: [...state.audit, {
        id: crypto.randomUUID(),
        action: "DASHBOARD_STATE_SNAPSHOT_UPDATED",
        actor: env.DASHBOARD_OPERATOR_ID ?? "authorized-operator",
        at: now,
        previousRevision: expectedRevision
      }]
    });
    const backupId = crypto.randomUUID();
    const digest = await sha256(current.state_json);
    const results = await env.STATE_DB.batch([
      env.STATE_DB.prepare(
        "INSERT INTO dashboard_backups (backup_id, source_revision, state_json, sha256, created_at, reason) SELECT ?, revision, state_json, ?, ?, 'AUTOMATIC_PRE_UPDATE' FROM dashboard_state WHERE singleton_id = ? AND revision = ?"
      ).bind(backupId, digest, now, STATE_ID, expectedRevision),
      env.STATE_DB.prepare(
        "UPDATE dashboard_state SET revision = revision + 1, state_json = ?, updated_at = ? WHERE singleton_id = ? AND revision = ?"
      ).bind(stateJson, now, STATE_ID, expectedRevision)
    ]);
    if (Number(results?.[1]?.meta?.changes ?? 0) !== 1) {
      return json({ error: "State revision conflict; reload before retrying", code: "REVISION_CONFLICT" }, 409);
    }
    const row = await currentState(env);
    return json({ revision: row.revision, updatedAt: row.updated_at, state: JSON.parse(row.state_json) }, 200, { etag: '"' + row.revision + '"' });
  }

  if (url.pathname === "/api/backups" && method === "GET") {
    const result = await env.STATE_DB.prepare(
      "SELECT backup_id, source_revision, sha256, created_at, reason FROM dashboard_backups ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json({ backups: result.results ?? [] });
  }

  if (url.pathname === "/api/backups" && method === "POST") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped" }, 503);
    const backupId = crypto.randomUUID();
    const digest = await sha256(row.state_json);
    const createdAt = new Date().toISOString();
    await env.STATE_DB.prepare(
      "INSERT INTO dashboard_backups (backup_id, source_revision, state_json, sha256, created_at, reason) VALUES (?, ?, ?, ?, ?, 'OPERATOR_REQUESTED')"
    ).bind(backupId, row.revision, row.state_json, digest, createdAt).run();
    return json({ backupId, sourceRevision: row.revision, sha256: digest, createdAt }, 201);
  }

  if (url.pathname === "/api/backups/restore" && method === "POST") {
    let body;
    try { body = await readJson(request); }
    catch (error) { return json({ error: error.message }, 400); }
    if (typeof body.backupId !== "string" || !body.backupId ||
        !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 1) {
      return json({ error: "backupId and expectedRevision are required" }, 400);
    }
    const backup = await env.STATE_DB.prepare(
      "SELECT state_json, sha256 FROM dashboard_backups WHERE backup_id = ?"
    ).bind(body.backupId).first();
    if (!backup) return json({ error: "Backup not found" }, 404);
    if (await sha256(backup.state_json) !== backup.sha256) {
      return json({ error: "Backup integrity check failed; restore refused" }, 409);
    }
    let restoredState;
    try { restoredState = validateDashboardState(JSON.parse(backup.state_json)); }
    catch { return json({ error: "Backup state schema is invalid; restore refused" }, 409); }
    const now = new Date().toISOString();
    const beforeRestoreId = crypto.randomUUID();
    const current = await currentState(env);
    if (!current || Number(current.revision) !== body.expectedRevision) {
      return json({ error: "State revision conflict; restore refused", code: "REVISION_CONFLICT" }, 409);
    }
    const beforeRestoreDigest = await sha256(current.state_json);
    const restoredJson = JSON.stringify({
      ...restoredState,
      audit: [...restoredState.audit, {
        id: crypto.randomUUID(),
        action: "DASHBOARD_STATE_RESTORED",
        actor: env.DASHBOARD_OPERATOR_ID ?? "authorized-operator",
        at: now,
        backupId: body.backupId
      }]
    });
    const results = await env.STATE_DB.batch([
      env.STATE_DB.prepare(
        "INSERT INTO dashboard_backups (backup_id, source_revision, state_json, sha256, created_at, reason) SELECT ?, revision, state_json, ?, ?, 'AUTOMATIC_PRE_RESTORE' FROM dashboard_state WHERE singleton_id = ? AND revision = ?"
      ).bind(beforeRestoreId, beforeRestoreDigest, now, STATE_ID, body.expectedRevision),
      env.STATE_DB.prepare(
        "UPDATE dashboard_state SET revision = revision + 1, state_json = ?, updated_at = ? WHERE singleton_id = ? AND revision = ?"
      ).bind(restoredJson, now, STATE_ID, body.expectedRevision)
    ]);
    if (Number(results?.[1]?.meta?.changes ?? 0) !== 1) {
      return json({ error: "State revision conflict; restore refused", code: "REVISION_CONFLICT" }, 409);
    }
    const row = await currentState(env);
    return json({ revision: row.revision, updatedAt: row.updated_at, state: JSON.parse(row.state_json) }, 200, { etag: '"' + row.revision + '"' });
  }

  return json({ error: "Not found" }, 404);
}

export { authenticate, constantTimeEqual, handleRequest, validateDashboardState };

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch {
      return json({ error: "Internal state service error" }, 500);
    }
  }
};
