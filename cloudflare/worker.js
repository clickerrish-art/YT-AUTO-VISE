import { normalizeDashboardState, toDashboardStateResponse } from "./dashboard-state-compat.js";
import { generateDashboardFacebookIdea } from "./facebook-idea-compat.js";

const STATE_ID = 1;
const MAX_STATE_BYTES = 2 * 1024 * 1024;


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
  if (typeof value !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
    const campaigns = state.campaigns ?? [];
    return json({
      campaigns,
      source: "durable_dashboard_state",
      authoritativeConfigImported: false,
      validation: { status: "NOT_RUN", errors: ["Authoritative config/campaigns.json validation is not executed in the Worker adapter."] },
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
    return json({
      schedule: null,
      timezone: "Africa/Johannesburg",
      publicationCycle: {
        formats: ["long_form", "long_form", "short"],
        minimumHoursBetweenConsecutivePublications: 72,
        minimumCycleHours: 216
      },
      draftPreparationSlots: null,
      authoritativeScheduleConfigImported: false,
      publicationHistoryReconciled: false,
      blockers: [
        "Authoritative config/weekly-content-plan.json is not imported into the Worker adapter.",
        "Complete SonicVhibez public, private and unlisted publication history and uncertain attempts have not been reconciled here.",
        "No publication or unattended scheduling operation is authorized by this read endpoint."
      ],
      queuedReservations: state.queueItems.filter(item => item?.reservationType === "SCHEDULED_SLOT"),
      publishingEnabled: false,
      readOnly: true,
      revision: row.revision
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
    if (job.workerLease || ["GENERATING", "RECONCILING"].includes(job.authoring?.status) || ["GENERATING", "RECONCILING"].includes(job.authoring?.narrationStage?.status)) {
      return json({ error: "A leased or active/uncertain authoring job cannot be cancelled; reconcile the attempt first", code: "ACTIVE_WORK" }, 409);
    }
    if (!["QUEUED", "BLOCKED", "AWAITING_HUMAN_REVIEW", "FAILED", "DEAD_LETTER"].includes(job.state)) return json({ error: "Only an unleased queued, blocked, review-pending, failed or dead-letter job can be cancelled" }, 409);
    const now = new Date().toISOString();
    const cancelled = { ...job, state: "CANCELLED", updatedAt: now, completedAt: now, cancelledAt: now, cancelledBy: actor, cancelReason: reason,
      transitionHistory: [...(job.transitionHistory ?? []), { from: job.state, to: "CANCELLED", at: now, actor, reason }] };
    const jobs = [...state.jobs]; jobs[index] = cancelled;
    const saved = await commitStateRevision(env, current, { ...state, jobs }, actor, "CONTENT_JOB_CANCELLED", { jobId: job.id });
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

  return json({ error: "Not found" }, 404);
}

export { authenticate, constantTimeEqual, handleRequest, operatorIdentity, validateDashboardState };

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch {
      return json({ error: "Internal state service error" }, 500);
    }
  }
};
