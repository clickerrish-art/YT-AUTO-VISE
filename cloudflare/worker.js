import { normalizeDashboardState, toDashboardStateResponse } from "./dashboard-state-compat.js";
import { generateDashboardFacebookIdea } from "./facebook-idea-compat.js";
import { authorizeContentJobRetry, claimWorkerLease, completeWorkerLease, expireWorkerLease, heartbeatWorkerLease, transitionContentJob } from "./content-job-lifecycle-compat.js";
import { canonicalAuthoringScriptSha256 } from "./authoring-review-compat.js";
import { safeDraftItem, validateReservedPublicationSlot } from "./draft-compat.js";
import { DEFAULT_CAMPAIGNS, manageCampaign, validateCampaigns } from "./campaigns-compat.js";
import { DEFAULT_WEEKLY_PLAN } from "./weekly-plan-compat.js";

const STATE_ID = 1;
const MAX_STATE_BYTES = 2 * 1024 * 1024;
const MAX_ARTIFACT_BYTES = 8 * 1024 * 1024 * 1024;
const ARTIFACT_PART_BYTES = 8 * 1024 * 1024;


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
  return normalizeDashboardState(value);
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

function operatorIdentity(env) {
  const actor = typeof env.DASHBOARD_OPERATOR_ID === "string" ? env.DASHBOARD_OPERATOR_ID.trim() : "";
  return actor.length >= 2 && actor.length <= 120 ? actor : null;
}

async function authenticate(request, env) {
  const configured = env.DASHBOARD_OPERATOR_TOKEN;
  const supplied = request.headers.get("x-operator-token");
  return typeof configured === "string" && configured.length >= 24 &&
    constantTimeEqual(supplied, configured);
}

const RUNNER_OIDC_AUDIENCE = "sonicvhibez-dashboard-runner";
const RUNNER_OIDC_REPOSITORY = "clickerrish-art/YT-AUTO-VISE";
const RUNNER_OIDC_REF = "refs/heads/codex/dashboard-cloudflare-adapter";
const RUNNER_OIDC_REPOSITORY_ID = "1210809338";
const RUNNER_OIDC_OWNER_ID = "251036666";
let cachedGithubJwks = null;
let cachedGithubJwksAt = 0;
const RUNNER_OIDC_WORKFLOW = RUNNER_OIDC_REPOSITORY +
  "/.github/workflows/repository-runner.yml@" + RUNNER_OIDC_REF;

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function verifyRepositoryRunnerToken(token, { fetchImpl = fetch, nowMs = Date.now() } = {}) {
  if (typeof token !== "string" || token.length < 100 || token.length > 16_384) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
    if (header.alg !== "RS256" || typeof header.kid !== "string" ||
        claims.iss !== "https://token.actions.githubusercontent.com" ||
        !(claims.aud === RUNNER_OIDC_AUDIENCE || (Array.isArray(claims.aud) && claims.aud.includes(RUNNER_OIDC_AUDIENCE))) ||
        claims.repository !== RUNNER_OIDC_REPOSITORY ||
        claims.repository_id !== RUNNER_OIDC_REPOSITORY_ID ||
        claims.repository_owner !== "clickerrish-art" ||
        claims.repository_owner_id !== RUNNER_OIDC_OWNER_ID ||
        claims.actor !== "clickerrish-art" ||
        claims.actor_id !== RUNNER_OIDC_OWNER_ID ||
        claims.ref !== RUNNER_OIDC_REF ||
        claims.workflow_ref !== RUNNER_OIDC_WORKFLOW ||
        claims.sub !== "repo:" + RUNNER_OIDC_REPOSITORY + ":ref:" + RUNNER_OIDC_REF ||
        !["workflow_dispatch", "push"].includes(claims.event_name) ||
        !Number.isFinite(claims.exp) || claims.exp * 1000 <= nowMs ||
        !Number.isFinite(claims.iat) || claims.iat * 1000 > nowMs + 60_000 ||
        nowMs - claims.iat * 1000 > 10 * 60_000 ||
        (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf * 1000 > nowMs + 60_000))) {
      return false;
    }
    const cacheableFetch = fetchImpl === fetch;
    let jwks = cacheableFetch ? cachedGithubJwks : null;
    if (!jwks || nowMs - cachedGithubJwksAt > 5 * 60_000) {
      const response = await fetchImpl("https://token.actions.githubusercontent.com/.well-known/jwks", {
        headers: { accept: "application/json" },
        redirect: "error"
      });
      if (!response.ok) return false;
      jwks = await response.json();
      if (!Array.isArray(jwks.keys)) return false;
      if (cacheableFetch) {
        cachedGithubJwks = jwks;
        cachedGithubJwksAt = nowMs;
      }
    }
    const jwk = jwks.keys?.find(key => key.kid === header.kid && key.kty === "RSA" && key.use === "sig");
    if (!jwk) return false;
    const publicKey = await crypto.subtle.importKey("jwk", jwk, {
      name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"
    }, false, ["verify"]);
    const signingInput = new TextEncoder().encode(parts[0] + "." + parts[1]);
    const signatureValid = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" }, publicKey, decodeBase64Url(parts[2]), signingInput
    );
    return signatureValid;
  } catch {
    return false;
  }
}

async function authenticateRepositoryRunner(request, fetchImpl = fetch) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer ([A-Za-z0-9._~-]+)$/);
  return match ? verifyRepositoryRunnerToken(match[1], { fetchImpl }) : false;
}

async function measureArtifactUsage(env) {
  if (!env.ARTIFACTS || typeof env.ARTIFACTS.list !== "function") {
    throw new Error("R2 object listing is unavailable");
  }
  let completedBytes = 0;
  let objectCount = 0;
  let cursor;
  do {
    const page = await env.ARTIFACTS.list({ prefix: "jobs/", limit: 1000, ...(cursor ? { cursor } : {}) });
    if (!Array.isArray(page.objects)) throw new Error("R2 returned an invalid object listing");
    for (const object of page.objects) {
      if (!Number.isSafeInteger(object.size) || object.size < 0) throw new Error("R2 object size is invalid");
      completedBytes += object.size;
      objectCount++;
      if (!Number.isSafeInteger(completedBytes) || objectCount > 100000) throw new Error("R2 artifact listing exceeds safe accounting limits");
    }
    if (!page.truncated) break;
    if (typeof page.cursor !== "string" || !page.cursor || page.cursor === cursor) throw new Error("R2 pagination cursor is invalid");
    cursor = page.cursor;
  } while (true);
  const pending = await env.STATE_DB.prepare(
    "SELECT COALESCE(SUM(size_bytes), 0) AS total_bytes FROM runner_artifacts WHERE status = 'UPLOADING'"
  ).first();
  const pendingBytes = Number(pending?.total_bytes ?? 0);
  if (!Number.isSafeInteger(pendingBytes) || pendingBytes < 0) throw new Error("D1 pending artifact reservations are invalid");
  return { usedBytes: completedBytes + pendingBytes, objectCount, completedBytes, pendingBytes };
}

function validateRunnerBackoff(value, workerId) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      value.schemaVersion !== 1 || value.workerId !== workerId ||
      !value.cooldowns || typeof value.cooldowns !== "object" || Array.isArray(value.cooldowns) ||
      !value.uncertainDispatches || typeof value.uncertainDispatches !== "object" || Array.isArray(value.uncertainDispatches) ||
      !Array.isArray(value.consumedReleaseNonces)) {
    throw new Error("Runner backoff state has an invalid schema or worker identity");
  }
  for (const [jobId, entry] of Object.entries(value.cooldowns)) {
    if (!jobId || !entry || !Number.isInteger(entry.attempts) || entry.attempts < 1 || entry.attempts > 20 ||
        !Number.isSafeInteger(entry.nextAttemptAt) || entry.nextAttemptAt <= 0) {
      throw new Error("Runner cooldown entry is invalid");
    }
  }
  for (const [jobId, entry] of Object.entries(value.uncertainDispatches)) {
    if (!jobId || entry?.code !== "WORKER_DISPATCH_OUTCOME_UNCERTAIN" ||
        typeof entry.recordedAt !== "string" || !Number.isFinite(Date.parse(entry.recordedAt)) ||
        new Date(entry.recordedAt).toISOString() !== entry.recordedAt) {
      throw new Error("Runner uncertain-dispatch entry is invalid");
    }
  }
  if (value.consumedReleaseNonces.length > 1000000 ||
      value.consumedReleaseNonces.some(nonce => typeof nonce !== "string" || !/^[a-f0-9]{48}$/.test(nonce))) {
    throw new Error("Runner consumed release nonce list is invalid");
  }
  return value;
}

async function currentState(env) {
  return env.STATE_DB.prepare(
    "SELECT revision, state_json, updated_at FROM dashboard_state WHERE singleton_id = ?"
  ).bind(STATE_ID).first();
}


async function commitStateRevision(env, current, nextState, actor, action, details = {}) {
  const now = new Date().toISOString();
  const next = {
    ...nextState,
    audit: [...nextState.audit, {
      id: crypto.randomUUID(), action, actor, at: now,
      ...details
    }]
  };
  const stateJson = JSON.stringify(next);
  if (new TextEncoder().encode(stateJson).byteLength > MAX_STATE_BYTES) {
    return { error: json({ error: "Updated state exceeds the 2 MiB limit" }, 413) };
  }
  const backupId = crypto.randomUUID();
  const digest = await sha256(current.state_json);
  const results = await env.STATE_DB.batch([
    env.STATE_DB.prepare(
      "INSERT INTO dashboard_backups (backup_id, source_revision, state_json, sha256, created_at, reason) SELECT ?, revision, state_json, ?, ?, ? FROM dashboard_state WHERE singleton_id = ? AND revision = ?"
    ).bind(backupId, digest, now, action, STATE_ID, current.revision),
    env.STATE_DB.prepare(
      "UPDATE dashboard_state SET revision = revision + 1, state_json = ?, updated_at = ? WHERE singleton_id = ? AND revision = ?"
    ).bind(stateJson, now, STATE_ID, current.revision)
  ]);
  if (Number(results?.[1]?.meta?.changes ?? 0) !== 1) {
    return { error: json({ error: "State revision conflict; reload before retrying", code: "REVISION_CONFLICT" }, 409) };
  }
  const row = await currentState(env);
  return { row, state: next };
}

function validRealDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function handleRequest(request, env, { fetchImpl = fetch } = {}) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (url.pathname === "/healthz" && method === "GET") {
    return json({ status: "ok", service: "sonicvhibez-durable-state", publishingEnabled: false });
  }

  if (url.pathname === "/operational-readyz" && method === "GET") {
    const blockers = [];
    let stateStatus = "NOT_INITIALIZED";
    let campaignStatus = "NOT_VALIDATED";
    let assetStatus = "NOT_CONFIGURED";
    let artifactStatus = "NOT_CONFIGURED";
    try {
      const row = await currentState(env);
      if (row) {
        const state = validateDashboardState(JSON.parse(row.state_json));
        stateStatus = "READABLE";
        const campaigns = state.campaigns?.length ? state.campaigns : structuredClone(DEFAULT_CAMPAIGNS);
        const campaignErrors = validateCampaigns({ version: 1, campaigns });
        campaignStatus = campaignErrors.length ? "BLOCKED" : "PASS";
        if (campaignErrors.length) blockers.push(...campaignErrors.map(error => "Campaign configuration: " + error));
      } else {
        blockers.push("Durable dashboard state has not been bootstrapped.");
      }
    } catch {
      stateStatus = "INVALID_OR_UNAVAILABLE";
      blockers.push("Durable dashboard state is unreadable or has an unsupported schema.");
    }
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      try {
        const asset = await env.ASSETS.fetch(new Request(new URL("/dashboard.html", url.origin)));
        if (asset.ok) assetStatus = "READABLE";
        else blockers.push("Dashboard static asset /dashboard.html is unavailable.");
      } catch {
        blockers.push("Dashboard static asset /dashboard.html could not be read.");
      }
    } else {
      blockers.push("Cloudflare Static Assets binding ASSETS is not configured.");
    }

    if (env.ARTIFACTS && typeof env.ARTIFACTS.put === "function" && typeof env.ARTIFACTS.get === "function") {
      artifactStatus = "BOUND";
    } else {
      blockers.push("Private R2 artifact storage binding ARTIFACTS is not configured.");
    }
    const ready = stateStatus === "READABLE" && campaignStatus === "PASS" && assetStatus === "READABLE" && artifactStatus === "BOUND";
    return json({
      ready, mode: "cloudflare-worker", durableState: stateStatus,
      campaignConfig: campaignStatus, dashboardAssets: assetStatus, artifactStorage: artifactStatus,
      publicationReadiness: "SEPARATE", publicationGate: "/readyz",
      blockers, note: "R2 binding presence is checked, but artifact upload/download integrity is not yet end-to-end verified; publication readiness remains a separate gate.",
      publishingEnabled: false
    }, ready ? 200 : 503);
  }

  if (url.pathname === "/readyz" && method === "GET") {
    return json({
      ready: false,
      publicationReadiness: "BLOCKED",
      blockers: [
        "Complete SonicVhibez public, private and unlisted YouTube history has not been independently reconciled in this Worker.",
        "Every pending or uncertain upload attempt must be reconciled against remote YouTube records before publication.",
        "The next rolling long_form → long_form → short position and 72-hour actual-publication spacing must be verified against complete remote history.",
        "Private upload requires a separate one-shot authorization bound to the exact job, media, metadata, thumbnail, captions, rights evidence, human review and SonicVhibez channel.",
        "No Worker route may enable public or unattended publishing."
      ],
      publishingEnabled: false,
      publicPublishingEnabled: false,
      unattendedPublishingEnabled: false
    }, 503);
  }

  if (!url.pathname.startsWith("/api/")) {
    if (method === "GET" && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      const assetUrl = new URL(request.url);
      if (assetUrl.pathname === "/") assetUrl.pathname = "/dashboard.html";
      return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    }
    return json({ error: "Not found" }, 404);
  }
  const runnerRoute = url.pathname.startsWith("/api/runner/");
  if (runnerRoute) {
    if (url.pathname === "/api/runner/session/status" && method === "GET") {
      if (!(await authenticate(request, env))) return json({ error: "Unauthorized" }, 401);
      const row = await env.STATE_DB.prepare("SELECT session_id, worker_id, status, started_at, completed_at, release_reason FROM runner_control WHERE singleton_id = 1").first();
      return json({ active: row?.status === "ACTIVE", session: row ?? null, publishingEnabled: false });
    }
    if (url.pathname === "/api/runner/session/release" && method === "POST") {
      if (!(await authenticate(request, env))) return json({ error: "Unauthorized" }, 401);
      let input;
      try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
      if (typeof input?.sessionId !== "string" || typeof input?.reason !== "string" || input.reason.trim().length < 10 || input.reason.trim().length > 1000) {
        return json({ error: "Exact sessionId and a 10–1000 character operator release reason are required" }, 400);
      }
      const result = await env.STATE_DB.prepare(
        "UPDATE runner_control SET status = 'RELEASED', completed_at = ?, release_reason = ? WHERE singleton_id = 1 AND session_id = ? AND status = 'ACTIVE'"
      ).bind(new Date().toISOString(), input.reason.trim(), input.sessionId).run();
      if (Number(result.meta?.changes ?? 0) !== 1) return json({ error: "Active runner session was not found or session ID did not match", code: "RUNNER_SESSION_CONFLICT" }, 409);
      return json({ released: true, sessionId: input.sessionId, reason: input.reason.trim(), publishingEnabled: false });
    }
    if (!(await authenticateRepositoryRunner(request, fetchImpl))) return json({ error: "Unauthorized", code: "WORKER_OIDC_UNAUTHORIZED" }, 401);

    if (url.pathname === "/api/runner/ready" && method === "GET") {
      if (!env.ARTIFACTS || typeof env.ARTIFACTS.put !== "function" ||
          typeof env.ARTIFACTS.get !== "function" || typeof env.ARTIFACTS.delete !== "function") {
        return json({ ready: false, code: "ARTIFACT_STORAGE_NOT_CONFIGURED", blockers: ["Private R2 storage binding is unavailable."] }, 503);
      }
      let usage;
      try { usage = await measureArtifactUsage(env); }
      catch { return json({ ready: false, code: "R2_ARTIFACT_ACCOUNTING_FAILED", blockers: ["Private R2 storage usage could not be reconciled safely."] }, 503); }
      const usedBytes = usage.usedBytes;
      const remainingBytes = Math.max(0, MAX_ARTIFACT_BYTES - usedBytes);
      if (remainingBytes < 2 * 1024 * 1024 * 1024) {
        return json({ ready: false, code: "R2_ARTIFACT_HEADROOM_LOW", usedBytes, remainingBytes, requiredHeadroomBytes: 2 * 1024 * 1024 * 1024 }, 503);
      }
      const probeKey = "health/runner-probe-" + crypto.randomUUID();
      const nonce = crypto.randomUUID();
      try {
        await env.ARTIFACTS.put(probeKey, nonce, { customMetadata: { purpose: "runner-readiness-probe" } });
        const probe = await env.ARTIFACTS.get(probeKey);
        if (!probe || await probe.text() !== nonce) throw new Error("R2 readiness probe read-back did not match");
        return json({ ready: true, usedBytes, remainingBytes, storageProvider: "Cloudflare R2 Standard", publishingEnabled: false });
      } catch {
        return json({ ready: false, code: "R2_ARTIFACT_PROBE_FAILED", blockers: ["Private R2 write/read integrity probe failed."] }, 503);
      } finally {
        try { await env.ARTIFACTS.delete(probeKey); } catch {}
      }
    }

    if (url.pathname === "/api/runner/artifacts" && method === "GET") {
      const jobId = url.searchParams.get("jobId") ?? "";
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(jobId)) return json({ error: "A valid jobId is required" }, 400);
      const rows = await env.STATE_DB.prepare(
        "SELECT artifact_id, source_path, artifact_kind, filename, sha256, size_bytes, content_type, status, object_key, upload_id, part_size_bytes, expected_parts, created_at, completed_at FROM runner_artifacts WHERE job_id = ? ORDER BY created_at"
      ).bind(jobId).all();
      const artifacts = [];
      for (const row of rows.results ?? []) {
        const parts = row.status === "UPLOADING"
          ? await env.STATE_DB.prepare("SELECT part_number, etag FROM runner_artifact_parts WHERE artifact_id = ? ORDER BY part_number").bind(row.artifact_id).all()
          : { results: [] };
        artifacts.push({
          artifactId: row.artifact_id, sourcePath: row.source_path, kind: row.artifact_kind,
          filename: row.filename, sha256: row.sha256, sizeBytes: row.size_bytes,
          contentType: row.content_type, status: row.status, objectKey: row.object_key,
          uploadId: row.status === "UPLOADING" ? row.upload_id : undefined,
          partSizeBytes: row.part_size_bytes, expectedParts: row.expected_parts,
          uploadedParts: (parts.results ?? []).map(part => ({ partNumber: part.part_number, etag: part.etag })),
          createdAt: row.created_at, completedAt: row.completed_at
        });
      }
      return json({ jobId, artifacts, publishingEnabled: false });
    }

    if (url.pathname === "/api/runner/artifacts/create" && method === "POST") {
      if (!env.ARTIFACTS || typeof env.ARTIFACTS.createMultipartUpload !== "function") {
        return json({ error: "Private R2 artifact binding is unavailable", code: "ARTIFACT_STORAGE_NOT_CONFIGURED" }, 503);
      }
      let input;
      try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
      const { jobId, sourcePath, artifactKind, sha256: digest, sizeBytes } = input ?? {};
      const contentTypes = { video: "video/mp4", thumbnail: "image/jpeg", metadata: "application/json" };
      const filename = typeof sourcePath === "string" ? sourcePath.split("/").at(-1) : "";
      const safePath = typeof sourcePath === "string" && sourcePath.length <= 500 &&
        !sourcePath.startsWith("/") && !sourcePath.includes("\\") &&
        sourcePath.split("/").every(part => part && part !== "." && part !== "..");
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(jobId ?? "") ||
          !safePath || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(filename) ||
          !Object.hasOwn(contentTypes, artifactKind) || input.contentType !== contentTypes[artifactKind] ||
          !/^[a-f0-9]{64}$/.test(digest ?? "") ||
          !Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_ARTIFACT_BYTES) {
        return json({ error: "Artifact identity, type, path, SHA-256 or size is invalid; uploads are limited to 8 GiB per artifact", code: "ARTIFACT_INPUT_INVALID" }, 400);
      }
      const current = await currentState(env);
      if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
      let state;
      try { state = validateDashboardState(JSON.parse(current.state_json)); }
      catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
      const job = state.jobs.find(item => item?.kind === "CONTENT_PRODUCTION" && item.id === jobId);
      if (!job || !["GENERATED", "VALIDATING"].includes(job.state)) {
        return json({ error: "Only a generated content job may persist production artifacts", code: "ARTIFACT_JOB_NOT_GENERATED" }, 409);
      }
      const bound = artifactKind === "video"
        ? job.outputArtifacts?.some(item => item?.path === sourcePath && item.sha256 === digest)
        : artifactKind === "thumbnail"
          ? job.thumbnailArtifact?.path === sourcePath && job.thumbnailArtifact?.sha256 === digest
          : job.metadataPath === sourcePath && job.metadataVersion === digest;
      if (!bound) return json({ error: "Artifact path and SHA-256 must match the exact generated job receipt", code: "ARTIFACT_RECEIPT_MISMATCH" }, 409);
      const existing = await env.STATE_DB.prepare(
        "SELECT artifact_id, upload_id, object_key, status, size_bytes, part_size_bytes, expected_parts FROM runner_artifacts WHERE job_id = ? AND source_path = ? AND sha256 = ?"
      ).bind(jobId, sourcePath, digest).first();
      if (existing?.status === "READY") {
        return json({ artifactId: existing.artifact_id, objectKey: existing.object_key, status: "READY", idempotent: true, publishingEnabled: false });
      }
      if (existing?.status === "UPLOADING") {
        const parts = await env.STATE_DB.prepare(
          "SELECT part_number, etag FROM runner_artifact_parts WHERE artifact_id = ? ORDER BY part_number"
        ).bind(existing.artifact_id).all();
        return json({
          artifactId: existing.artifact_id, uploadId: existing.upload_id, objectKey: existing.object_key,
          status: "UPLOADING", partSizeBytes: existing.part_size_bytes, expectedParts: existing.expected_parts,
          uploadedParts: (parts.results ?? []).map(part => ({ partNumber: part.part_number, etag: part.etag })),
          publishingEnabled: false
        });
      }
      let usage;
      try { usage = await measureArtifactUsage(env); }
      catch { return json({ error: "Private R2 storage usage could not be reconciled safely", code: "R2_ARTIFACT_ACCOUNTING_FAILED" }, 503); }
      if (usage.usedBytes + sizeBytes > MAX_ARTIFACT_BYTES) {
        return json({ error: "The private staging artifact budget is capped at 8 GiB to stay below the R2 free storage allowance", code: "R2_APPLICATION_BUDGET_EXCEEDED" }, 413);
      }
      const artifactId = existing?.artifact_id ?? crypto.randomUUID();
      const objectKey = "jobs/" + jobId + "/" + digest + "/" + filename;
      const partSizeBytes = ARTIFACT_PART_BYTES;
      const expectedParts = Math.ceil(sizeBytes / partSizeBytes);
      if (expectedParts > 10000) return json({ error: "Artifact exceeds the R2 multipart part-count limit" }, 413);
      const createdAt = new Date().toISOString();
      let multipart;
      try {
        if (existing?.status === "FAILED" && existing.upload_id) {
          try { await env.ARTIFACTS.resumeMultipartUpload(existing.object_key, existing.upload_id).abort(); } catch {}
        }
        multipart = await env.ARTIFACTS.createMultipartUpload(objectKey, {
          httpMetadata: { contentType: contentTypes[artifactKind] },
          customMetadata: { jobId, sourcePath, artifactKind, sha256: digest }
        });
        if (existing?.status === "FAILED") {
          await env.STATE_DB.prepare("DELETE FROM runner_artifact_parts WHERE artifact_id = ?").bind(artifactId).run();
          await env.STATE_DB.prepare(
            "UPDATE runner_artifacts SET upload_id = ?, status = 'UPLOADING', etag = NULL, created_at = ?, completed_at = NULL WHERE artifact_id = ? AND status = 'FAILED'"
          ).bind(multipart.uploadId, createdAt, artifactId).run();
        } else {
          await env.STATE_DB.prepare(
            "INSERT INTO runner_artifacts (artifact_id, job_id, source_path, artifact_kind, filename, object_key, upload_id, sha256, size_bytes, part_size_bytes, expected_parts, content_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UPLOADING', ?)"
          ).bind(artifactId, jobId, sourcePath, artifactKind, filename, objectKey, multipart.uploadId, digest, sizeBytes, partSizeBytes, expectedParts, contentTypes[artifactKind], createdAt).run();
        }
      } catch {
        if (multipart) {
          try { await multipart.abort(); } catch {}
        }
        return json({ error: "Could not initialize durable private artifact upload", code: "ARTIFACT_UPLOAD_INIT_FAILED" }, 503);
      }
      return json({
        artifactId, uploadId: multipart.uploadId, objectKey, status: "UPLOADING",
        partSizeBytes, expectedParts, uploadedParts: [], publishingEnabled: false
      }, 201);
    }

    if (url.pathname === "/api/runner/artifacts/part" && method === "PUT") {
      if (!env.ARTIFACTS || typeof env.ARTIFACTS.resumeMultipartUpload !== "function") return json({ error: "Private R2 artifact binding is unavailable" }, 503);
      const artifactId = url.searchParams.get("artifactId") ?? "";
      const partNumber = Number(url.searchParams.get("partNumber"));
      const contentLength = Number(request.headers.get("content-length"));
      if (!/^[a-f0-9-]{36}$/.test(artifactId) || !Number.isInteger(partNumber) || partNumber < 1 ||
          !Number.isSafeInteger(contentLength) || contentLength < 1 || contentLength > ARTIFACT_PART_BYTES || !request.body) {
        return json({ error: "artifactId, partNumber, known Content-Length and a bounded part body are required" }, 400);
      }
      const artifact = await env.STATE_DB.prepare(
        "SELECT upload_id, object_key, size_bytes, part_size_bytes, expected_parts, status FROM runner_artifacts WHERE artifact_id = ?"
      ).bind(artifactId).first();
      if (!artifact || artifact.status !== "UPLOADING" || partNumber > artifact.expected_parts) return json({ error: "Active artifact upload was not found", code: "ARTIFACT_UPLOAD_NOT_FOUND" }, 404);
      const expectedLength = partNumber === artifact.expected_parts
        ? Number(artifact.size_bytes) - Number(artifact.part_size_bytes) * (Number(artifact.expected_parts) - 1)
        : Number(artifact.part_size_bytes);
      if (contentLength !== expectedLength) return json({ error: "Part length does not match the declared artifact size and part plan" }, 400);
      try {
        const upload = env.ARTIFACTS.resumeMultipartUpload(artifact.object_key, artifact.upload_id);
        const part = await upload.uploadPart(partNumber, request.body);
        await env.STATE_DB.prepare(
          "INSERT INTO runner_artifact_parts (artifact_id, part_number, etag) VALUES (?, ?, ?) ON CONFLICT(artifact_id, part_number) DO UPDATE SET etag = excluded.etag"
        ).bind(artifactId, partNumber, part.etag).run();
        return json({ artifactId, partNumber: part.partNumber, etag: part.etag, publishingEnabled: false });
      } catch {
        return json({ error: "R2 multipart part upload failed; the incomplete upload remains quarantined for retry", code: "ARTIFACT_PART_UPLOAD_FAILED" }, 503);
      }
    }

    if (url.pathname === "/api/runner/artifacts/complete" && method === "POST") {
      if (!env.ARTIFACTS || typeof env.ARTIFACTS.resumeMultipartUpload !== "function") return json({ error: "Private R2 artifact binding is unavailable" }, 503);
      let input;
      try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
      if (typeof input?.artifactId !== "string" || !/^[a-f0-9-]{36}$/.test(input.artifactId)) return json({ error: "artifactId is invalid" }, 400);
      const artifact = await env.STATE_DB.prepare(
        "SELECT artifact_id, upload_id, object_key, size_bytes, expected_parts, status, sha256 FROM runner_artifacts WHERE artifact_id = ?"
      ).bind(input.artifactId).first();
      if (!artifact) return json({ error: "Artifact upload was not found" }, 404);
      if (artifact.status === "READY") return json({ artifactId: artifact.artifact_id, objectKey: artifact.object_key, sha256: artifact.sha256, sizeBytes: artifact.size_bytes, status: "READY", idempotent: true });
      if (artifact.status !== "UPLOADING") return json({ error: "Artifact upload is not completable", code: "ARTIFACT_UPLOAD_NOT_ACTIVE" }, 409);
      const rows = await env.STATE_DB.prepare(
        "SELECT part_number, etag FROM runner_artifact_parts WHERE artifact_id = ? ORDER BY part_number"
      ).bind(input.artifactId).all();
      const parts = (rows.results ?? []).map(part => ({ partNumber: Number(part.part_number), etag: part.etag }));
      if (parts.length !== Number(artifact.expected_parts) ||
          parts.some((part, index) => part.partNumber !== index + 1 || typeof part.etag !== "string" || !part.etag)) {
        return json({ error: "Every multipart segment must be uploaded before completion", code: "ARTIFACT_PARTS_INCOMPLETE" }, 409);
      }
      let object;
      try {
        object = await env.ARTIFACTS.resumeMultipartUpload(artifact.object_key, artifact.upload_id).complete(parts);
      } catch {
        return json({ error: "R2 multipart completion failed; the upload remains available for reconciliation", code: "ARTIFACT_COMPLETE_FAILED" }, 503);
      }
      if (Number(object.size) !== Number(artifact.size_bytes)) {
        await env.ARTIFACTS.delete(artifact.object_key);
        await env.STATE_DB.prepare("UPDATE runner_artifacts SET status = 'FAILED' WHERE artifact_id = ?").bind(input.artifactId).run();
        return json({ error: "R2 object size did not match the declared artifact size; object was deleted", code: "ARTIFACT_SIZE_MISMATCH" }, 409);
      }
      const completedAt = new Date().toISOString();
      await env.STATE_DB.prepare(
        "UPDATE runner_artifacts SET status = 'READY', etag = ?, completed_at = ? WHERE artifact_id = ? AND status = 'UPLOADING'"
      ).bind(object.httpEtag, completedAt, input.artifactId).run();
      return json({
        artifactId: artifact.artifact_id, objectKey: artifact.object_key,
        sha256: artifact.sha256, sizeBytes: object.size, etag: object.httpEtag,
        status: "READY", completedAt, publishingEnabled: false
      }, 201);
    }
    if (url.pathname === "/api/runner/session" && method === "POST") {
      let input;
      try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
      const workerId = input?.workerId;
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(workerId ?? "")) return json({ error: "workerId is invalid" }, 400);
      const sessionId = crypto.randomUUID();
      const now = new Date().toISOString();
      const result = await env.STATE_DB.prepare(
        "INSERT INTO runner_control (singleton_id, session_id, worker_id, status, started_at, completed_at, release_reason) VALUES (1, ?, ?, 'ACTIVE', ?, NULL, NULL) ON CONFLICT(singleton_id) DO UPDATE SET session_id = excluded.session_id, worker_id = excluded.worker_id, status = 'ACTIVE', started_at = excluded.started_at, completed_at = NULL, release_reason = NULL WHERE runner_control.status = 'RELEASED'"
      ).bind(sessionId, workerId, now).run();
      if (Number(result.meta?.changes ?? 0) !== 1) {
        const active = await env.STATE_DB.prepare("SELECT session_id, worker_id, started_at FROM runner_control WHERE singleton_id = 1 AND status = 'ACTIVE'").first();
        return json({ error: "A previous repository runner session is still active; reconcile or explicitly release it before another run", code: "RUNNER_SESSION_ACTIVE", activeSession: active ?? null }, 409);
      }
      return json({ sessionId, workerId, startedAt: now, publishingEnabled: false }, 201);
    }
    if (url.pathname === "/api/runner/session/complete" && method === "POST") {
      let input;
      try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
      if (typeof input?.sessionId !== "string") return json({ error: "sessionId is required" }, 400);
      const now = new Date().toISOString();
      const result = await env.STATE_DB.prepare(
        "UPDATE runner_control SET status = 'RELEASED', completed_at = ?, release_reason = 'RUNNER_RECONCILIATION_COMPLETE' WHERE singleton_id = 1 AND session_id = ? AND status = 'ACTIVE'"
      ).bind(now, input.sessionId).run();
      if (Number(result.meta?.changes ?? 0) !== 1) return json({ error: "Runner session does not match the active lease", code: "RUNNER_SESSION_CONFLICT" }, 409);
      return json({ completed: true, sessionId: input.sessionId, completedAt: now, publishingEnabled: false });
    }
    if (url.pathname === "/api/runner/snapshot" && method === "GET") {
      const row = await currentState(env);
      if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
      let state;
      try { state = validateDashboardState(JSON.parse(row.state_json)); }
      catch { return json({ error: "Persisted state is corrupt or invalid", code: "STATE_INVALID" }, 503); }
      return json({ revision: row.revision, updatedAt: row.updated_at, state, publishingEnabled: false });
    }
    if (url.pathname === "/api/runner/snapshot" && method === "PUT") {
      const actor = "repository-runner";
      const revisionHeader = request.headers.get("if-match") ?? "";
      const match = revisionHeader.match(/^"?([0-9]+)"?$/);
      const expectedRevision = match ? Number(match[1]) : NaN;
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
        return json({ error: "If-Match must contain the snapshot revision", code: "REVISION_REQUIRED" }, 428);
      }
      let input;
      try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
      let state;
      try { state = validateDashboardState(input?.state); }
      catch (error) { return json({ error: error.message, code: "STATE_INVALID" }, 400); }
      const current = await currentState(env);
      if (!current || Number(current.revision) !== expectedRevision) {
        return json({ error: "Durable state changed during runner execution; refusing to overwrite it", code: "REVISION_CONFLICT" }, 409);
      }
      const saved = await commitStateRevision(env, current, state, actor, "REPOSITORY_RUNNER_STATE_RECONCILED", {
        workerId: request.headers.get("x-worker-id") ?? "repository-runner"
      });
      if (saved.error) return saved.error;
      return json({ revision: saved.row.revision, updatedAt: saved.row.updated_at, publishingEnabled: false }, 200, { etag: '"' + saved.row.revision + '"' });
    }
    if (url.pathname === "/api/runner/backoff" && method === "GET") {
      const workerId = url.searchParams.get("workerId") ?? "";
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(workerId)) return json({ error: "workerId is invalid" }, 400);
      const row = await env.STATE_DB.prepare("SELECT revision, state_json, updated_at FROM runner_state WHERE worker_id = ?").bind(workerId).first();
      return json({ workerId, revision: Number(row?.revision ?? 0), updatedAt: row?.updated_at ?? null, state: row ? JSON.parse(row.state_json) : null });
    }
    if (url.pathname === "/api/runner/backoff" && method === "PUT") {
      let input;
      try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
      const workerId = input?.workerId;
      const expectedRevision = input?.expectedRevision;
      if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(workerId ?? "") ||
          !Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
        return json({ error: "workerId and a non-negative expectedRevision are required" }, 400);
      }
      let state;
      try { state = validateRunnerBackoff(input.state, workerId); }
      catch (error) { return json({ error: error.message, code: "BACKOFF_STATE_INVALID" }, 400); }
      const now = new Date().toISOString();
      const stateJson = JSON.stringify({ ...state, updatedAt: now });
      const statement = expectedRevision === 0
        ? env.STATE_DB.prepare("INSERT OR IGNORE INTO runner_state (worker_id, revision, state_json, updated_at) VALUES (?, 1, ?, ?)")
            .bind(workerId, stateJson, now)
        : env.STATE_DB.prepare("UPDATE runner_state SET revision = revision + 1, state_json = ?, updated_at = ? WHERE worker_id = ? AND revision = ?")
            .bind(stateJson, now, workerId, expectedRevision);
      const result = await statement.run();
      if (Number(result.meta?.changes ?? 0) !== 1) return json({ error: "Runner backoff revision conflict", code: "REVISION_CONFLICT" }, 409);
      return json({ workerId, revision: expectedRevision + 1, updatedAt: now, publishingEnabled: false });
    }
    return json({ error: "Runner endpoint not found" }, 404);
  }

  if (!(await authenticate(request, env))) return json({ error: "Unauthorized" }, 401);

  if (url.pathname === "/api/artifacts" && method === "GET") {
    const jobId = url.searchParams.get("jobId") ?? "";
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(jobId)) return json({ error: "A valid jobId is required" }, 400);
    const rows = await env.STATE_DB.prepare(
      "SELECT artifact_id, job_id, source_path, artifact_kind, filename, sha256, size_bytes, content_type, status, etag, created_at, completed_at FROM runner_artifacts WHERE job_id = ? ORDER BY created_at DESC"
    ).bind(jobId).all();
    return json({
      artifacts: (rows.results ?? []).map(row => ({
        artifactId: row.artifact_id, jobId: row.job_id, sourcePath: row.source_path,
        kind: row.artifact_kind, filename: row.filename, sha256: row.sha256,
        sizeBytes: row.size_bytes, contentType: row.content_type, status: row.status,
        etag: row.etag, createdAt: row.created_at, completedAt: row.completed_at
      })),
      storageBudgetBytes: MAX_ARTIFACT_BYTES,
      publishingEnabled: false
    });
  }

  const artifactDownload = url.pathname.match(/^\/api\/artifacts\/([a-f0-9-]{36})\/download$/);
  if (artifactDownload && method === "GET") {
    if (!env.ARTIFACTS || typeof env.ARTIFACTS.get !== "function") return json({ error: "Private R2 artifact binding is unavailable" }, 503);
    const row = await env.STATE_DB.prepare(
      "SELECT object_key, filename, sha256, size_bytes, content_type, status FROM runner_artifacts WHERE artifact_id = ?"
    ).bind(artifactDownload[1]).first();
    if (!row || row.status !== "READY") return json({ error: "Verified artifact was not found", code: "ARTIFACT_NOT_READY" }, 404);
    const object = await env.ARTIFACTS.get(row.object_key);
    if (!object || Number(object.size) !== Number(row.size_bytes) ||
        object.customMetadata?.sha256 !== row.sha256) {
      return json({ error: "R2 object does not match the durable artifact receipt", code: "ARTIFACT_INTEGRITY_MISMATCH" }, 409);
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("content-type", row.content_type);
    headers.set("content-disposition", 'attachment; filename="' + row.filename.replace(/["\\\\]/g, "_") + '"');
    headers.set("content-length", String(object.size));
    headers.set("cache-control", "private, no-store");
    headers.set("x-artifact-sha256", row.sha256);
    headers.set("etag", object.httpEtag);
    return new Response(object.body, { status: 200, headers });
  }

  if (url.pathname === "/api/state" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try {
      state = validateDashboardState(JSON.parse(row.state_json));
    } catch {
      return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503);
    }
    return json(toDashboardStateResponse(state, { revision: row.revision, updatedAt: row.updated_at }), 200, { etag: '"' + row.revision + '"' });
  }

  if (url.pathname === "/api/state/bootstrap" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let state;
    try { state = validateDashboardState(await readJson(request)); }
    catch (error) { return json({ error: error.message }, 400); }
    const now = new Date().toISOString();
    const stateJson = JSON.stringify({
      ...state,
      audit: [...state.audit, {
        id: crypto.randomUUID(),
        action: "DASHBOARD_STATE_BOOTSTRAPPED",
        actor,
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
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
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
        "INSERT INTO dashboard_backups (backup_id, source_revision, state_json, sha256, created_at, reason) SELECT ?, revision, state_json, ?, ?, 'AUTOMATIC_PRE_UPDATE:' || ? FROM dashboard_state WHERE singleton_id = ? AND revision = ?"
      ).bind(backupId, digest, now, actor, STATE_ID, expectedRevision),
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


  if (url.pathname === "/api/campaigns" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(row.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    const campaigns = (state.campaigns?.length ? state.campaigns : structuredClone(DEFAULT_CAMPAIGNS));
    const errors = validateCampaigns({ version: 1, campaigns });
    return json({
      campaigns,
      source: state.campaigns ? "durable_dashboard_state" : "repository_campaign_config",
      authoritativeConfigImported: true,
      validation: { status: errors.length ? "BLOCKED" : "PASS", errors },
      publishingEnabled: false,
      readOnly: true,
      revision: row.revision
    });
  }

  if (url.pathname === "/api/schedule" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(row.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    const plan = DEFAULT_WEEKLY_PLAN;
    const blockers = [
      "Complete SonicVhibez public, private and unlisted publication history and uncertain attempts have not been reconciled here.",
      "Pending or uncertain YouTube upload attempts must be reconciled before any publication operation.",
      "No publication or unattended scheduling operation is authorized by this read endpoint."
    ];
    return json({
      schedule: plan,
      timezone: plan.timezone,
      publicationCycle: plan.publicationCycle,
      draftPreparationSlots: plan.schedule,
      authoritativeScheduleConfigImported: true,
      publicationHistoryReconciled: false,
      blockers,
      queuedReservations: state.queueItems.filter(item => item?.reservationType === "SCHEDULED_SLOT"),
      publishingEnabled: false,
      readOnly: true,
      revision: row.revision
    });
  }

  if (url.pathname === "/api/capabilities" && method === "GET") {
    const row = await currentState(env);
    return json({
      service: "sonicvhibez-dashboard-worker",
      statePersistence: { provider: "Cloudflare D1", configured: Boolean(env.STATE_DB), initialized: Boolean(row), revision: row?.revision ?? null },
      artifactStorage: { provider: "Cloudflare R2 Standard", configured: Boolean(env.ARTIFACTS), bucket: "sonicvhibez-artifacts-staging", access: "private-by-default", applicationBudgetBytes: 8589934592, uploadDownloadE2E: "NOT_TESTED" },
      dashboardHosting: { provider: "Cloudflare Workers Static Assets", configured: Boolean(env.ASSETS) },
      supported: [
        "state read/write with revision checks and backups",
        "queue diagnostics and read-only dispatchable-job inspection",
        "campaign validation, preview, activation and deactivation",
        "draft creation and safe editing with Johannesburg slot checks",
        "job creation, cancellation, transitions, operator retry and dead-letter recovery",
        "worker lease claim, heartbeat, completion and expiry reaping",
        "GitHub Actions OIDC-restricted runner snapshot and durable retry/quarantine reconciliation",
        "private R2 multipart storage for generated videos, thumbnails and metadata with an 8 GiB application budget",
        "hash-bound human script review"
      ],
      blockedUntilIntegration: [
        "repository task execution and Node/FFmpeg production pipeline (runner workflow is authored but not yet activated against this Worker)",
        "script generation provider and narration/TTS execution",
        "on-disk media validation, rights evidence verification and media review",
        "production-plan file verification and Short-parent remote receipt binding",
        "live R2 multipart upload/download integrity verification against the staging bucket",
        "YouTube OAuth upload and remote history reconciliation",
        "Meta Page identity verification and Facebook/Instagram provider actions"
      ],
      publishingEnabled: false,
      publicPublishingEnabled: false,
      unattendedPublishingEnabled: false
    });
  }

  if (url.pathname === "/api/tasks" && method === "GET") {
    return json({ publicPublishingEnabled: false, tasks: ["validate-schedule", "check-captions", "production-readiness", "test-suite", "validate-campaigns"], readOnly: true });
  }

  if (url.pathname === "/api/facebook/idea" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(row.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    const date = url.searchParams.get("date") ?? "";
    try {
      const idea = generateDashboardFacebookIdea({ date, existingDrafts: state.facebookDrafts, recentPosts: state.facebookPosts });
      return json({ idea, publishingEnabled: false, publishReady: false, readOnly: true });
    } catch (error) {
      if (error instanceof Error && /date is required|date is invalid/i.test(error.message)) {
        return json({ error: error.message, publishingEnabled: false, publishReady: false }, 400);
      }
      throw error;
    }
  }

  if (url.pathname === "/api/drafts" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(row.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    return json({ items: state.queueItems, queueItems: state.queueItems, publishingEnabled: false, readOnly: true, revision: row.revision });
  }

  if (url.pathname === "/api/facebook/drafts" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(row.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    return json({ drafts: state.facebookDrafts.slice(-30).reverse(), publishingEnabled: false, readOnly: true, destination: "nature_frontiers_facebook" });
  }

  if (url.pathname === "/api/facebook/state" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(row.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    return json({
      destination: "nature_frontiers_facebook",
      destinationPageId: null,
      pageIdentityVerified: false,
      pageName: null,
      lastIdentityCheck: null,
      metaAdapterImplemented: false,
      permissionsConfirmed: false,
      accessTokenConfigured: false,
      publishingEnabled: false,
      dryRun: true,
      timezone: null,
      dailyTarget: null,
      defaultLocalTime: null,
      comparisonLocalTime: null,
      drafts: state.facebookDrafts.slice(-30).reverse(),
      posts: state.facebookPosts.slice(-30).reverse(),
      attempts: state.facebookAttempts.slice(-30).reverse(),
      experiment: null,
      blockers: [
        "Meta Page identity and permissions have not been verified by this Cloudflare state adapter.",
        "Meta credentials and publishing configuration are not imported into staging.",
        "Nature Frontiers publishing remains disabled; use the existing repository dashboard for live provider checks."
      ],
      complianceRuleSet: null,
      readOnly: true
    });
  }


  if (url.pathname === "/api/jobs" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); }
    catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    if (!input || typeof input !== "object" || Array.isArray(input)) return json({ error: "Job request must be an object" }, 400);
    const idempotencyKey = String(input.idempotencyKey ?? "").trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9:_-]{2,119}$/.test(idempotencyKey)) return json({ error: "idempotencyKey must be 3–120 safe characters" }, 400);
    const title = String(input.title ?? "").trim();
    const topic = String(input.topic ?? "").trim();
    const contentType = input.contentType;
    const scheduledDate = String(input.scheduledDate ?? "").trim();
    const scheduledDay = input.scheduledDay;
    if (!title || title.length > 100 || !topic || topic.length > 300) return json({ error: "title (1–100 chars) and topic (1–300 chars) are required" }, 400);
    if (!["long_form", "short"].includes(contentType)) return json({ error: "contentType must be long_form or short" }, 400);
    if (!validRealDate(scheduledDate)) return json({ error: "scheduledDate must be a real YYYY-MM-DD date" }, 400);
    const weekday = new Date(scheduledDate + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    if (weekday !== scheduledDay || !["Tuesday", "Saturday"].includes(scheduledDay)) return json({ error: "scheduledDate must match an authorized Tuesday/Saturday draft-preparation slot" }, 400);
    if ((scheduledDay === "Saturday") !== (contentType === "short")) return json({ error: "contentType conflicts with the authorized draft-preparation day" }, 400);
    const inputReferences = input.inputReferences ?? [];
    if (!Array.isArray(inputReferences) || inputReferences.length > 30 || inputReferences.some(value => typeof value !== "string" || !value.trim() || value.length > 500)) return json({ error: "inputReferences must contain at most 30 non-empty strings (max 500 chars each)" }, 400);
    const fingerprint = await sha256(JSON.stringify({ title, topic, contentType, scheduledDay, scheduledDate, inputReferences }));
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    const prior = state.jobs.find(job => job.idempotencyKey === idempotencyKey);
    if (prior) {
      if (prior.requestFingerprint !== fingerprint) return json({ error: "Idempotency key was already used for a different job request", code: "IDEMPOTENCY_CONFLICT" }, 409);
      return json({ job: prior, revision: current.revision, idempotentReplay: true, publishingEnabled: false }, 200, { etag: '"' + current.revision + '"' });
    }
    const slotKey = `slot:${scheduledDate}:17:00:Africa/Johannesburg`;
    if (state.jobs.some(job => job.scheduledSlot?.idempotencyKey === slotKey && !["CANCELLED", "REJECTED", "FAILED", "DEAD_LETTER"].includes(job.state)) || state.queueItems.some(item => item?.scheduledSlot?.idempotencyKey === slotKey || item?.slotIdempotencyKey === slotKey)) {
      return json({ error: "A job already reserves this draft-preparation slot", code: "SLOT_CONFLICT" }, 409);
    }
    const now = new Date().toISOString();
    const job = {
      id: crypto.randomUUID(), idempotencyKey, requestFingerprint: fingerprint,
      kind: "CONTENT_PRODUCTION", title, topic, contentType,
      scheduledSlot: { date: scheduledDate, day: scheduledDay, time: "17:00", timezone: "Africa/Johannesburg", idempotencyKey: slotKey },
      inputReferences, publicationCycleId: typeof input.publicationCycleId === "string" && input.publicationCycleId.trim() ? input.publicationCycleId.trim() : null,
      shortParentRelationship: null, state: "QUEUED", createdAt: now, startedAt: null, completedAt: null, updatedAt: now,
      transitionHistory: [{ from: null, to: "QUEUED", at: now, actor, reason: "Job created through authenticated dashboard API" }],
      outputArtifacts: [], thumbnailArtifact: null, validationResults: null, rightsChecks: null, humanApproval: null,
      attemptCount: 0, retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true }, retryAuthorizations: [],
      deadLetterHistory: [], workerLease: null, metadataPath: null, leaseHistory: [], nextRetryAt: null,
      errorDetails: null, remoteVideoId: null, uploadReceipt: null, publishingEnabled: false
    };
    const updated = { ...state, jobs: [...state.jobs, job] };
    const saved = await commitStateRevision(env, current, updated, actor, "CONTENT_JOB_CREATED", { jobId: job.id, idempotencyKey });
    if (saved.error) return saved.error;
    return json({ job, revision: saved.row.revision, idempotentReplay: false, publishingEnabled: false }, 201, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/campaigns/manage" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Campaign changes require DASHBOARD_OPERATOR_ID to identify the authenticated operator" }, 503);
    let input;
    try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); } catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const config = { version: 1, campaigns: (state.campaigns?.length ? state.campaigns : structuredClone(DEFAULT_CAMPAIGNS)) };
    const existingErrors = validateCampaigns(config);
    if (existingErrors.length) return json({ error: "Campaign configuration is invalid", validationErrors: existingErrors }, 409);
    let result;
    try { result = await manageCampaign(config, input, actor); }
    catch (error) { return json({ error: error.message || "Campaign action rejected", code: "CAMPAIGN_ACTION_REJECTED" }, 409); }
    const campaigns = result.config.campaigns;
    const destinationVersion = result.campaign.approval?.destinationVersion ?? result.campaign.pendingDestinationVersion ?? null;
    const saved = await commitStateRevision(env, current, { ...state, campaigns }, actor, "CAMPAIGN_" + String(input.action).toUpperCase(), {
      campaignId: result.campaign.id, campaignType: result.campaign.type,
      status: result.campaign.status, destinationVersion, previewOnly: result.previewOnly === true
    });
    if (saved.error) return saved.error;
    return json({ campaign: result.campaign, previewOnly: result.previewOnly, publicPublishingEnabled: false, revision: saved.row.revision }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/drafts" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    let item;
    try { item = safeDraftItem(input); } catch (error) { return json({ error: error.message || "Draft validation failed" }, 400); }
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); } catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const campaigns = (state.campaigns?.length ? state.campaigns : structuredClone(DEFAULT_CAMPAIGNS));
    const campaignErrors = validateCampaigns({ version: 1, campaigns });
    if (campaignErrors.length) return json({ error: "Campaign configuration is invalid", validationErrors: campaignErrors }, 409);
    const selarCampaign = campaigns.find(campaign => campaign.type === "selar_digital_product");
    if (!selarCampaign || selarCampaign.status !== "ACTIVE_FOR_DRAFTS_ONLY" || selarCampaign.destinationUrl !== "https://selar.com/0u19v8u99l") {
      return json({ error: "The approved Selar campaign is inactive; preview and activate it for drafts first" }, 409);
    }
    if (state.queueItems.some(existing => existing.id === item.id)) return json({ error: "That queue ID already exists" }, 409);
    const spacing = validateReservedPublicationSlot({ id: item.id, scheduledAt: item.scheduledAt }, state);
    if (!spacing.valid) return json({ error: "Schedule slot conflicts with an existing reservation or violates minimum publication spacing", blockers: spacing.errors, publishingEnabled: false }, 409);
    const slotAlreadyReserved = state.jobs.some(existing => existing.kind === "CONTENT_PRODUCTION" &&
      !["CANCELLED", "REJECTED"].includes(String(existing.state ?? "").toUpperCase()) &&
      existing.scheduledSlot?.date === item.scheduledDate);
    if (slotAlreadyReserved) return json({ error: "This dated schedule slot is already reserved; reuse or edit its existing job", slotFingerprint: item.scheduledDate + ":17:00:Africa/Johannesburg" }, 409);
    const now = new Date().toISOString();
    const idempotencyKey = "draft:" + item.id;
    const inputReferences = [];
    const fingerprint = await sha256(JSON.stringify({
      title: item.title, topic: item.topic, contentType: item.contentType,
      scheduledDay: item.scheduledDay, scheduledDate: item.scheduledDate, inputReferences
    }));
    const job = {
      id: crypto.randomUUID(), idempotencyKey, requestFingerprint: fingerprint,
      kind: "CONTENT_PRODUCTION", title: item.title, topic: item.topic, contentType: item.contentType,
      scheduledSlot: {
        date: item.scheduledDate, day: item.scheduledDay, time: "17:00",
        timezone: "Africa/Johannesburg", idempotencyKey: "slot:" + item.scheduledDate + ":17:00:Africa/Johannesburg"
      },
      inputReferences, publicationCycleId: null, shortParentRelationship: null,
      state: "QUEUED", createdAt: now, startedAt: null, completedAt: null, updatedAt: now,
      transitionHistory: [{ from: null, to: "QUEUED", at: now, actor, reason: "Job created" }],
      outputArtifacts: [], thumbnailArtifact: null, validationResults: null, rightsChecks: null, humanApproval: null,
      attemptCount: 0, retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true }, retryAuthorizations: [],
      deadLetterHistory: [], workerLease: null, metadataPath: null, leaseHistory: [], nextRetryAt: null,
      errorDetails: null, remoteVideoId: null, uploadReceipt: null, publishingEnabled: false
    };
    const nextState = {
      ...state,
      campaigns,
      queueItems: [...state.queueItems, item],
      jobs: [...state.jobs, job],
      audit: [...state.audit, {
        id: crypto.randomUUID(), action: "DRAFT_CREATED", itemId: item.id, at: now, actor
      }]
    };
    const saved = await commitStateRevision(env, current, nextState, actor, "CONTENT_JOB_QUEUED", {
      itemId: item.id, jobId: job.id, idempotencyKey
    });
    if (saved.error) return saved.error;
    return json({ item, job, revision: saved.row.revision, publishingEnabled: false }, 201, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/drafts/update" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    let item;
    try { item = safeDraftItem(input); }
    catch (error) { return json({ error: error.message || "Draft validation failed" }, 400); }
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); } catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const index = state.queueItems.findIndex(existing => existing.id === item.id);
    if (index < 0) return json({ error: "Queue item not found" }, 404);
    const old = state.queueItems[index];
    const spacing = validateReservedPublicationSlot({ id: item.id, scheduledAt: item.scheduledAt }, state, item.id);
    if (!spacing.valid) return json({ error: "Updated schedule slot conflicts with an existing reservation or violates minimum publication spacing", blockers: spacing.errors, publishingEnabled: false }, 409);
    if (state.queueItems.some(existing => existing.id !== item.id && existing.scheduledDate === item.scheduledDate &&
        existing.reservationType === "SCHEDULED_SLOT" && String(existing.status ?? "").toUpperCase() !== "CANCELLED")) {
      return json({ error: "Another draft already occupies this dated schedule slot" }, 409);
    }
    if (state.jobs.some(existing => existing.kind === "CONTENT_PRODUCTION" &&
        !["CANCELLED", "REJECTED"].includes(String(existing.state ?? "").toUpperCase()) &&
        existing.scheduledSlot?.date === item.scheduledDate &&
        existing.id !== state.jobs.find(job => job.kind === "CONTENT_PRODUCTION" && job.idempotencyKey === "draft:" + item.id)?.id)) {
      return json({ error: "Another production job already occupies this dated schedule slot" }, 409);
    }
    const updatedItem = {
      ...old, ...item, status: old.status,
      rightsConfirmed: old.rightsConfirmed,
      complianceReviewed: old.complianceReviewed,
      updatedAt: new Date().toISOString()
    };
    const queueItems = [...state.queueItems]; queueItems[index] = updatedItem;
    const saved = await commitStateRevision(env, current, { ...state, queueItems }, actor, "DRAFT_EDITED", { itemId: item.id });
    if (saved.error) return saved.error;
    return json({ item: updatedItem, revision: saved.row.revision, publishingEnabled: false }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/jobs/authoring/review" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    if (!input || typeof input.jobId !== "string" || !["APPROVE", "REJECT"].includes(input.decision) ||
        typeof input.scriptSha256 !== "string" || !/^[a-f0-9]{64}$/.test(input.scriptSha256) ||
        typeof input.reason !== "string" || input.reason.trim().length < 5 || input.reason.length > 1000) {
      return json({ error: "jobId, script SHA-256, APPROVE/REJECT decision and a 5–1000 character review reason are required" }, 400);
    }
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); } catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const index = state.jobs.findIndex(job => job.kind === "CONTENT_PRODUCTION" && job.id === input.jobId);
    if (index < 0) return json({ error: "Content job not found" }, 404);
    const job = state.jobs[index];
    if (job.state !== "QUEUED" || !job.authoring || job.authoring.status !== "AWAITING_HUMAN_EDITORIAL_REVIEW") {
      return json({ error: "Only a queued job with a persisted authoring draft can receive script review" }, 409);
    }
    const script = job.authoring.result?.script;
    if (!script || typeof script !== "object" || Array.isArray(script)) return json({ error: "Structured generated script is missing" }, 409);
    let actualScriptSha256;
    try { actualScriptSha256 = await canonicalAuthoringScriptSha256(script); }
    catch (error) { return json({ error: error.message || "Script hash could not be calculated" }, 409); }
    if (input.scriptSha256 !== actualScriptSha256) return json({ error: "Script changed after review was prepared; refresh the draft and review its current SHA-256" }, 409);
    const existingApproval = job.authoring.scriptApproval;
    if (input.decision === "APPROVE" && existingApproval?.decision === "APPROVE" && existingApproval.scriptSha256 === actualScriptSha256) {
      const exactRetry = existingApproval.reviewer === actor && existingApproval.reason === input.reason.trim();
      const expectedReceiptSha256 = await sha256(JSON.stringify({
        jobId: job.id, decision: "APPROVE", scriptSha256: actualScriptSha256,
        reviewer: actor, reviewedAt: existingApproval.reviewedAt, reason: input.reason.trim()
      }));
      if (!exactRetry || existingApproval.approvalSha256 !== expectedReceiptSha256) {
        return json({ error: "Script is already approved under a different review receipt; changed reviewer, reason or receipt cannot reuse the existing approval" }, 409);
      }
      return json({ job, scriptReview: existingApproval, revision: current.revision, reused: true, publishable: false, publishingEnabled: false });
    }
    job.authoring.scriptSha256 = actualScriptSha256;
    const reviewedAt = new Date().toISOString();
    const decision = {
      decision: input.decision, scriptSha256: actualScriptSha256, reviewer: actor,
      reviewedAt, reason: input.reason.trim()
    };
    decision.approvalSha256 = await sha256(JSON.stringify({
      jobId: job.id, decision: input.decision, scriptSha256: actualScriptSha256,
      reviewer: actor, reviewedAt, reason: input.reason.trim()
    }));
    if (input.decision === "APPROVE") {
      job.authoring.scriptApproval = decision;
      job.authoring.scriptReview = decision;
    } else {
      delete job.authoring.scriptApproval;
      delete job.authoring.narrationApproval;
      job.authoring.scriptReview = decision;
      delete job.authoring.narrationStage;
      job.authoring.status = "REJECTED";
    }
    const jobs = [...state.jobs]; jobs[index] = job;
    const action = input.decision === "APPROVE" ? "SCRIPT_REVISION_APPROVED_FOR_NARRATION" : "SCRIPT_REVISION_REJECTED";
    const saved = await commitStateRevision(env, current, { ...state, jobs }, actor, action, {
      jobId: job.id, scriptSha256: actualScriptSha256, reviewer: actor,
      reason: input.reason.trim(), approvalSha256: decision.approvalSha256, at: reviewedAt
    });
    if (saved.error) return saved.error;
    return json({
      job, scriptReview: decision, revision: saved.row.revision,
      publishable: false, publishingEnabled: false,
      nextAction: input.decision === "APPROVE"
        ? "Generate narration as a draft, then separately review narration and provide approved visual assets, rights evidence and a scene plan."
        : "Revise the script brief and generate a new draft; rejected script approval cannot be reused."
    }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/jobs/lease/claim" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    if (!input || typeof input.jobId !== "string" || typeof input.workerId !== "string") return json({ error: "jobId and workerId are required" }, 400);
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); } catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const index = state.jobs.findIndex(job => job.kind === "CONTENT_PRODUCTION" && job.id === input.jobId);
    if (index < 0) return json({ error: "Content job not found" }, 404);
    let claimed;
    try { claimed = await claimWorkerLease(state.jobs[index], input.workerId, { leaseMs: input.leaseMs ?? 60_000 }); }
    catch (error) { return json({ error: error.message || "Worker lease cannot be claimed", code: "LEASE_CLAIM_REJECTED" }, 409); }
    const jobs = [...state.jobs]; jobs[index] = claimed.job;
    const saved = await commitStateRevision(env, current, { ...state, jobs }, actor, "WORKER_LEASE_CLAIMED", {
      jobId: input.jobId, workerId: input.workerId, expiresAt: claimed.job.workerLease.expiresAt
    });
    if (saved.error) return saved.error;
    return json({ job: claimed.job, leaseToken: claimed.leaseToken, revision: saved.row.revision, publishingEnabled: false }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/jobs/lease/heartbeat" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    if (!input || typeof input.jobId !== "string" || typeof input.leaseToken !== "string") return json({ error: "jobId and leaseToken are required" }, 400);
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); } catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const index = state.jobs.findIndex(job => job.kind === "CONTENT_PRODUCTION" && job.id === input.jobId);
    if (index < 0) return json({ error: "Content job not found" }, 404);
    let updated;
    try { updated = await heartbeatWorkerLease(state.jobs[index], input.leaseToken, { leaseMs: input.leaseMs ?? 60_000 }); }
    catch (error) { return json({ error: error.message || "Worker lease heartbeat rejected", code: "LEASE_HEARTBEAT_REJECTED" }, 409); }
    const jobs = [...state.jobs]; jobs[index] = updated;
    const saved = await commitStateRevision(env, current, { ...state, jobs }, actor, "WORKER_LEASE_HEARTBEAT", {
      jobId: input.jobId, workerId: updated.workerLease.workerId, expiresAt: updated.workerLease.expiresAt
    });
    if (saved.error) return saved.error;
    return json({ job: updated, revision: saved.row.revision, publishingEnabled: false }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/jobs/lease/complete" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    if (!input || typeof input.jobId !== "string" || typeof input.leaseToken !== "string" || typeof input.nextState !== "string") {
      return json({ error: "jobId, leaseToken and nextState are required" }, 400);
    }
    if (input.nextState === "GENERATED") {
      return json({ error: "Generated media can only be accepted after repository-runner verification of real MP4 bytes, SHA-256, metadata and ffprobe output; this Worker has no filesystem verifier", code: "ARTIFACT_VERIFICATION_REQUIRED" }, 409);
    }
    if (!["VALIDATING", "FAILED", "BLOCKED"].includes(input.nextState)) {
      return json({ error: "Worker completion may only advance to VALIDATING, FAILED or BLOCKED; human review and upload states require separate gates" }, 400);
    }
    const patch = input.result ?? {};
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) return json({ error: "result must be an object" }, 400);
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); } catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const index = state.jobs.findIndex(job => job.kind === "CONTENT_PRODUCTION" && job.id === input.jobId);
    if (index < 0) return json({ error: "Content job not found" }, 404);
    const previous = state.jobs[index];
    const requestSha256 = await sha256(JSON.stringify({ nextState: input.nextState, metadataPath: input.metadataPath ?? null, result: patch }));
    const leaseTokenSha256 = await sha256(input.leaseToken);
    if (previous.lastWorkerCompletion?.leaseTokenSha256 === leaseTokenSha256) {
      if (previous.lastWorkerCompletion.requestSha256 === requestSha256) return json({ job: previous, revision: current.revision, publishingEnabled: false, idempotent: true });
      return json({ error: "This worker lease already completed a different result; claim a new lease before submitting another completion." }, 409);
    }
    let updated;
    try { updated = await completeWorkerLease(previous, input.leaseToken, input.nextState, patch); }
    catch (error) { return json({ error: error.message || "Worker completion rejected", code: "LEASE_COMPLETION_REJECTED" }, 409); }
    const completedAt = new Date().toISOString();
    updated.lastWorkerCompletion = { leaseTokenSha256, requestSha256, nextState: input.nextState, completedAt };
    const jobs = [...state.jobs]; jobs[index] = updated;
    const nextState = {
      ...state,
      jobs,
      audit: updated.state === "DEAD_LETTER"
        ? [...state.audit, {
            id: crypto.randomUUID(), action: "CONTENT_JOB_DEAD_LETTERED", jobId: input.jobId,
            reasonCode: updated.deadLetter?.reasonCode ?? "MAX_ATTEMPTS_EXHAUSTED",
            attemptCount: updated.attemptCount, maxAttempts: updated.retryPolicy?.maxAttempts ?? null,
            at: completedAt, actor: "retry-policy"
          }]
        : state.audit
    };
    const saved = await commitStateRevision(env, current, nextState, actor, "WORKER_STAGE_COMPLETED", {
      jobId: input.jobId, workerId: previous.workerLease.workerId,
      from: previous.state, to: updated.state, at: completedAt
    });
    if (saved.error) return saved.error;
    return json({ job: updated, revision: saved.row.revision, publishingEnabled: false }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/jobs/lease/reap" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    if (!input || typeof input.jobId !== "string") return json({ error: "jobId is required" }, 400);
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); } catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const index = state.jobs.findIndex(job => job.kind === "CONTENT_PRODUCTION" && job.id === input.jobId);
    if (index < 0) return json({ error: "Content job not found" }, 404);
    let result;
    try { result = expireWorkerLease(state.jobs[index]); }
    catch (error) { return json({ error: error.message || "Lease expiry reconciliation failed", code: "LEASE_REAP_REJECTED" }, 409); }
    if (!result.expired) return json({ error: "No expired worker lease is available to reap", job: state.jobs[index] }, 409);
    const reapedAt = new Date().toISOString();
    const jobs = [...state.jobs]; jobs[index] = result.job;
    const extraAudit = [
      ...(result.job.state === "DEAD_LETTER" ? [{
        id: crypto.randomUUID(), action: "CONTENT_JOB_DEAD_LETTERED", jobId: input.jobId,
        reasonCode: result.job.deadLetter?.reasonCode ?? "LEASE_EXPIRY_RETRY_LIMIT_EXHAUSTED",
        attemptCount: result.job.attemptCount, maxAttempts: result.job.retryPolicy?.maxAttempts ?? null,
        at: reapedAt, actor: "retry-policy"
      }] : [])
    ];
    const nextState = { ...state, jobs, audit: [...state.audit, ...extraAudit] };
    const saved = await commitStateRevision(env, current, nextState, actor, "WORKER_LEASE_EXPIRED", {
      jobId: input.jobId, previousState: result.job.transitionHistory?.at(-1)?.from,
      state: result.job.state, at: reapedAt
    });
    if (saved.error) return saved.error;
    return json({ job: result.job, revision: saved.row.revision, publishingEnabled: false }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/jobs/retry" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); }
    catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    if (!input || typeof input.jobId !== "string" || typeof input.reason !== "string") {
      return json({ error: "jobId and an operator review reason are required" }, 400);
    }
    if (input.overrideRetryLimit !== undefined && typeof input.overrideRetryLimit !== "boolean") {
      return json({ error: "overrideRetryLimit must be a boolean when supplied" }, 400);
    }
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); }
    catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const index = state.jobs.findIndex(job => job.kind === "CONTENT_PRODUCTION" && job.id === input.jobId);
    if (index < 0) return json({ error: "Content job not found" }, 404);
    const previous = state.jobs[index];
    let updated;
    try {
      updated = authorizeContentJobRetry(previous, {
        actor, reason: input.reason, overrideRetryLimit: input.overrideRetryLimit === true
      });
    } catch (error) {
      return json({ error: error.message || "Retry authorization rejected", code: "RETRY_NOT_AUTHORIZED" }, 409);
    }
    const authorization = updated.retryAuthorizations.at(-1);
    const jobs = [...state.jobs];
    jobs[index] = updated;
    const nextState = {
      ...state,
      jobs,
      audit: previous.state === "DEAD_LETTER"
        ? [...state.audit, {
            id: crypto.randomUUID(), action: "CONTENT_JOB_DEAD_LETTER_RECOVERED",
            jobId: updated.id, actor, reason: authorization.reason, at: authorization.at
          }]
        : state.audit
    };
    const saved = await commitStateRevision(env, current, nextState, actor, "CONTENT_JOB_RETRY_AUTHORIZED", {
      jobId: updated.id, from: previous.state, to: updated.state,
      reason: authorization.reason, attemptCount: updated.attemptCount,
      maxAttempts: updated.retryPolicy.maxAttempts,
      overrideRetryLimit: authorization.overrideRetryLimit, at: authorization.at
    });
    if (saved.error) return saved.error;
    return json({ job: updated, revision: saved.row.revision, publishingEnabled: false, retryAuthorized: true }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/jobs/transition" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input;
    try { input = await readJson(request); }
    catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    if (!input || typeof input.jobId !== "string" || typeof input.nextState !== "string") {
      return json({ error: "jobId and nextState are required" }, 400);
    }
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); }
    catch { return json({ error: "Persisted state is invalid", code: "STATE_INVALID" }, 503); }
    const index = state.jobs.findIndex(job => job.kind === "CONTENT_PRODUCTION" && job.id === input.jobId);
    if (index < 0) return json({ error: "Content job not found" }, 404);
    const previous = state.jobs[index];
    let updated;
    try {
      updated = transitionContentJob(previous, input.nextState, {
        actor,
        reason: input.reason ?? ""
      });
    } catch (error) {
      return json({ error: error.message || "Invalid job transition", code: "INVALID_JOB_TRANSITION" }, 409);
    }
    const jobs = [...state.jobs];
    jobs[index] = updated;
    const action = updated.state === "CANCELLED" ? "CONTENT_JOB_CANCELLED" : "CONTENT_JOB_STATE_CHANGED";
    const saved = await commitStateRevision(env, current, { ...state, jobs }, actor, action, {
      jobId: updated.id, from: previous.state, to: updated.state,
      reason: String(input.reason ?? "").slice(0, 1000)
    });
    if (saved.error) return saved.error;
    return json({ job: updated, revision: saved.row.revision, publishingEnabled: false }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  const cancelParts = url.pathname.split("/");
  const cancelJobId = cancelParts.length === 5 && cancelParts[1] === "api" && cancelParts[2] === "jobs" && cancelParts[4] === "cancel" && /^[A-Za-z0-9-]+$/.test(cancelParts[3]) ? cancelParts[3] : null;
  if (cancelJobId && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    let input = {};
    try { input = await readJson(request); } catch (error) { return json({ error: error.message || "Invalid JSON body" }, 400); }
    const reason = typeof input.reason === "string" ? input.reason.trim() : "";
    if (!reason || reason.length > 1000) return json({ error: "A cancellation reason of 1–1000 characters is required" }, 400);
    const current = await currentState(env);
    if (!current) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(current.state_json)); } catch { return json({ error: "Persisted state is invalid" }, 503); }
    const index = state.jobs.findIndex(job => job.id === cancelJobId);
    if (index < 0) return json({ error: "Job not found" }, 404);
    const job = state.jobs[index];
    let cancelled;
    try {
      cancelled = transitionContentJob(job, "CANCELLED", { actor, reason });
    } catch (error) {
      return json({ error: error.message || "Job cannot be cancelled", code: "INVALID_JOB_TRANSITION" }, 409);
    }
    const jobs = [...state.jobs]; jobs[index] = cancelled;
    const saved = await commitStateRevision(env, current, { ...state, jobs }, actor, "CONTENT_JOB_CANCELLED", { jobId: job.id, from: job.state, to: "CANCELLED", reason });
    if (saved.error) return saved.error;
    return json({ job: cancelled, revision: saved.row.revision, publishingEnabled: false }, 200, { etag: '"' + saved.row.revision + '"' });
  }

  if (url.pathname === "/api/jobs" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(row.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    const limit = Number(url.searchParams.get("limit") ?? 30);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return json({ error: "limit must be an integer from 1 to 100" }, 400);
    return json({ jobs: state.jobs.slice(-limit).reverse(), publishingEnabled: false, readOnly: true, revision: row.revision });
  }

  if (url.pathname === "/api/jobs/dispatchable" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(row.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    const limit = Number(url.searchParams.get("limit") ?? 20);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return json({ error: "limit must be an integer from 1 to 100", publishingEnabled: false }, 400);
    const queued = state.jobs.filter(job => job?.kind === "CONTENT_PRODUCTION" && job.state === "QUEUED");
    const approved = job => job.authoring?.productionPlan?.status === "APPROVED_PLAN_ONLY" &&
      job.authoring.productionPlan.review?.decision === "APPROVE" &&
      /^[a-f0-9]{64}$/.test(job.authoring.productionPlan.review?.approvalSha256 ?? "");
    const now = Date.now();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
    const slotFor = job => {
      const slot = job.scheduledSlot;
      if (slot?.timezone !== "Africa/Johannesburg" ||
          !/^\\d{4}-\\d{2}-\\d{2}$/.test(slot.date ?? "") ||
          !/^(?:[01]\\d|2[0-3]):[0-5]\\d$/.test(slot.time ?? "")) return null;
      const instant = new Date(slot.date + "T" + slot.time + ":00+02:00");
      const local = Number.isFinite(instant.getTime()) ? new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(instant) : null;
      return local === slot.date ? { at: instant.getTime(), date: slot.date } : null;
    };
    const candidates = queued.filter(job => approved(job) && typeof job.id === "string")
      .map(job => ({ job, slot: slotFor(job) }))
      .filter(entry => entry.slot && entry.slot.date === today && entry.slot.at <= now)
      .sort((a, b) => a.slot.at - b.slot.at || String(a.job.createdAt ?? "").localeCompare(String(b.job.createdAt ?? "")) || a.job.id.localeCompare(b.job.id));
    return json({
      jobs: candidates.slice(0, limit).map(({ job }) => ({ id: job.id, contentType: job.contentType, state: job.state, createdAt: job.createdAt })),
      queuedCount: queued.length,
      dispatchableCount: candidates.length,
      queuedWithoutApprovedAuthoring: queued.filter(job => !job.authoring).length,
      queuedWithoutApprovedRenderPlan: queued.filter(job => !approved(job)).length,
      queuedWithoutValidSlot: queued.filter(job => !slotFor(job)).length,
      queuedWithFutureSlot: queued.filter(job => { const slot = slotFor(job); return slot && slot.at > now; }).length,
      queuedWithExpiredSlot: queued.filter(job => { const slot = slotFor(job); return slot && slot.date < today; }).length,
      publishingEnabled: false,
      readOnly: true
    });
  }

  if (url.pathname === "/api/jobs/queue-diagnostics" && method === "GET") {
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped", code: "STATE_NOT_INITIALIZED" }, 503);
    let state;
    try { state = validateDashboardState(JSON.parse(row.state_json)); }
    catch { return json({ error: "Persisted state is corrupt or has an unsupported schema", code: "STATE_INVALID" }, 503); }
    const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
      return json({ error: "limit must be an integer from 1 to 100", publishingEnabled: false, readOnly: true }, 400);
    }
    const queued = state.jobs.filter(job => job?.kind === "CONTENT_PRODUCTION" && job.state === "QUEUED");
    const hasApprovedRenderPlan = job =>
      job.authoring?.productionPlan?.status === "APPROVED_PLAN_ONLY" &&
      job.authoring.productionPlan.review?.decision === "APPROVE" &&
      /^[a-f0-9]{64}$/.test(job.authoring.productionPlan.review?.approvalSha256 ?? "");
    const checkedAt = Date.now();
    const localDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date(checkedAt));
    const items = queued.map(job => {
      const blockers = [];
      if (!job.authoring) blockers.push("APPROVED_AUTHORING_MISSING");
      if (!hasApprovedRenderPlan(job)) blockers.push("APPROVED_RENDER_PLAN_MISSING");
      let slot = null;
      const scheduled = job.scheduledSlot;
      if (scheduled?.timezone === "Africa/Johannesburg" &&
          /^\\d{4}-\\d{2}-\\d{2}$/.test(scheduled.date ?? "") &&
          /^(?:[01]\\d|2[0-3]):[0-5]\\d$/.test(scheduled.time ?? "")) {
        const instant = new Date(scheduled.date + "T" + scheduled.time + ":00+02:00");
        const resolvedLocalDate = Number.isFinite(instant.getTime()) ? new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(instant) : null;
        if (resolvedLocalDate === scheduled.date) {
          slot = { scheduledAt: instant.getTime(), localDate: scheduled.date };
        }
      }
      if (!slot) blockers.push("VALID_JOHANNESBURG_SLOT_MISSING");
      else if (slot.localDate < localDate) blockers.push("SLOT_EXPIRED_RESCHEDULE_REQUIRED");
      else if (slot.localDate > localDate) blockers.push("SLOT_IN_FUTURE");
      else if (slot.scheduledAt > checkedAt) blockers.push("SLOT_NOT_DUE_YET");
      return {
        id: typeof job.id === "string" ? job.id : null,
        contentType: typeof job.contentType === "string" ? job.contentType : null,
        state: job.state,
        createdAt: job.createdAt ?? null,
        scheduledSlot: scheduled ? { date: scheduled.date ?? null, time: scheduled.time ?? null, timezone: scheduled.timezone ?? null } : null,
        scheduledAt: slot ? new Date(slot.scheduledAt).toISOString() : null,
        status: blockers.length ? "HELD" : "DISPATCHABLE",
        blockers
      };
    });
    const blockerCounts = {};
    for (const item of items) for (const blocker of item.blockers) blockerCounts[blocker] = (blockerCounts[blocker] ?? 0) + 1;
    return json({
      checkedAt: new Date(checkedAt).toISOString(),
      timezone: "Africa/Johannesburg",
      queuedCount: queued.length,
      dispatchableCount: items.filter(item => item.status === "DISPATCHABLE").length,
      heldCount: items.filter(item => item.status === "HELD").length,
      blockerCounts,
      items: items.slice(0, requestedLimit),
      returnedCount: Math.min(items.length, requestedLimit),
      truncated: items.length > requestedLimit,
      publishingEnabled: false,
      readOnly: true
    });
  }

  if (url.pathname === "/api/backups" && method === "GET") {
    const result = await env.STATE_DB.prepare(
      "SELECT backup_id, source_revision, sha256, created_at, reason FROM dashboard_backups ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json({ backups: result.results ?? [] });
  }

  if (url.pathname === "/api/backups" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
    const row = await currentState(env);
    if (!row) return json({ error: "State has not been bootstrapped" }, 503);
    const backupId = crypto.randomUUID();
    const digest = await sha256(row.state_json);
    const createdAt = new Date().toISOString();
    await env.STATE_DB.prepare(
      "INSERT INTO dashboard_backups (backup_id, source_revision, state_json, sha256, created_at, reason) VALUES (?, ?, ?, ?, ?, 'OPERATOR_REQUESTED:' || ?)"
    ).bind(backupId, row.revision, row.state_json, digest, createdAt, actor).run();
    return json({ backupId, sourceRevision: row.revision, sha256: digest, createdAt }, 201);
  }

  if (url.pathname === "/api/backups/restore" && method === "POST") {
    const actor = operatorIdentity(env);
    if (!actor) return json({ error: "Authorized operator identity is not configured", code: "OPERATOR_ID_NOT_CONFIGURED" }, 503);
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
        "INSERT INTO dashboard_backups (backup_id, source_revision, state_json, sha256, created_at, reason) SELECT ?, revision, state_json, ?, ?, 'AUTOMATIC_PRE_RESTORE:' || ? FROM dashboard_state WHERE singleton_id = ? AND revision = ?"
      ).bind(beforeRestoreId, beforeRestoreDigest, now, actor, STATE_ID, body.expectedRevision),
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

  const runnerGatedRoutes = new Set([
    "POST /api/tasks/run",
    "POST /api/jobs/author",
    "POST /api/jobs/narration",
    "POST /api/jobs/narration/reconcile",
    "GET /api/jobs/narration/review",
    "GET /api/jobs/narration/audio",
    "POST /api/jobs/narration/review",
    "POST /api/jobs/production-plan",
    "POST /api/jobs/production-plan/review",
    "POST /api/jobs/parent-relationship",
    "POST /api/jobs/produce",
    "POST /api/jobs/validate",
    "POST /api/jobs/rights/verify",
    "POST /api/jobs/review",
    "GET /api/jobs/review/bundle",
    "GET /api/jobs/review/preview",
    "POST /api/worker/quarantine-release",
    "POST /api/jobs/render-recovery/reconcile"
  ]);
  const providerGatedRoutes = new Set([
    "POST /api/uploads/reconcile",
    "POST /api/facebook/verify-page",
    "POST /api/facebook/drafts",
    "POST /api/facebook/drafts/evaluate",
    "POST /api/facebook/drafts/approve",
    "GET /api/facebook/autonomous-status",
    "POST /api/facebook/publish"
  ]);
  const routeKey = method + " " + url.pathname;
  if (runnerGatedRoutes.has(routeKey)) {
    return json({
      error: "This operation requires the repository-backed Node/FFmpeg runner. That runner callback is not connected to the Worker, so no task was executed and no state was changed.",
      code: "REPOSITORY_RUNNER_NOT_CONNECTED",
      publishingEnabled: false
    }, 503);
  }
  if (providerGatedRoutes.has(routeKey)) {
    return json({
      error: "The required external provider adapter is not connected to this Worker. No provider request, upload, page verification or publication was attempted.",
      code: "EXTERNAL_PROVIDER_NOT_CONNECTED",
      publishingEnabled: false
    }, 503);
  }
  return json({ error: "Not found" }, 404);
}

export { authenticate, constantTimeEqual, handleRequest, operatorIdentity, validateDashboardState, verifyRepositoryRunnerToken };

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch {
      return json({ error: "Internal state service error" }, 500);
    }
  }
};
