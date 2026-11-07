import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDashboardState, toDashboardStateResponse } from "../cloudflare/dashboard-state-compat.js";
import { authenticate, constantTimeEqual, handleRequest, operatorIdentity, validateDashboardState, verifyRepositoryRunnerToken } from "../cloudflare/worker.js";
import { canonicalAuthoringScriptSha256 } from "../cloudflare/authoring-review-compat.js";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { DEFAULT_CAMPAIGNS, manageCampaign, validateCampaigns } from "../cloudflare/campaigns-compat.js";
import { DEFAULT_WEEKLY_PLAN } from "../cloudflare/weekly-plan-compat.js";

const validState = () => ({
  version: 1,
  queueItems: [],
  campaigns: [],
  audit: [],
  jobs: [],
  uploads: [],
  facebookDrafts: [],
  facebookPosts: [],
  facebookAttempts: [],
  publishingEnabled: false
});

test("operator token comparison is constant-time in structure and rejects unequal values", () => {
  assert.equal(constantTimeEqual("same-token", "same-token"), true);
  assert.equal(constantTimeEqual("same-token", "same-tokeN"), false);
  assert.equal(constantTimeEqual("short", "much-longer"), false);
  assert.equal(constantTimeEqual("", ""), true);
});

test("state API authentication requires a configured high-entropy operator token", async () => {
  const request = new Request("https://state.example/api/state", { headers: { "x-operator-token": "a".repeat(24) } });
  assert.equal(await authenticate(request, { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24) }), true);
  assert.equal(await authenticate(request, { DASHBOARD_OPERATOR_TOKEN: "short" }), false);
  assert.equal(await authenticate(request, {}), false);
});

test("validates the existing dashboard state collections", () => {
  assert.equal(validateDashboardState(validState()).version, 1);
  for (const key of ["queueItems", "audit", "jobs", "uploads"]) {
    const state = validState();
    state[key] = {};
    assert.throws(() => validateDashboardState(state), new RegExp(key));
  }
});

test("rejects publishing enablement and active Safari campaigns", () => {
  const publishing = validState();
  publishing.publishingEnabled = true;
  assert.throws(() => validateDashboardState(publishing), /Publishing must remain disabled/);
  const safari = validState();
  safari.campaigns = [{ type: "safari_affiliate", status: "ACTIVE" }];
  assert.throws(() => validateDashboardState(safari), /Safari affiliate campaigns must remain fully inactive and unapproved/);
});

test("normalizes legacy state without optional Facebook arrays to empty compatibility collections", () => {
  const legacy = validState();
  delete legacy.facebookDrafts;
  delete legacy.facebookPosts;
  delete legacy.facebookAttempts;
  assert.deepEqual(validateDashboardState(legacy).facebookDrafts, []);
});

test("health endpoint exposes only the fail-closed service status", async () => {
  const response = await handleRequest(new Request("https://state.example/healthz"), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "sonicvhibez-durable-state",
    publishingEnabled: false
  });
});

test("state endpoints reject missing operator authentication before database access", async () => {
  const response = await handleRequest(new Request("https://state.example/api/state"), {});
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("write operations require an explicit operator identity for audit attribution", () => {
  assert.equal(operatorIdentity({ DASHBOARD_OPERATOR_ID: "owner-operator" }), "owner-operator");
  assert.equal(operatorIdentity({ DASHBOARD_OPERATOR_ID: " " }), null);
  assert.equal(operatorIdentity({ DASHBOARD_OPERATOR_ID: "x".repeat(121) }), null);
  assert.equal(operatorIdentity({}), null);
});

test("queue diagnostics is authenticated, read-only, and holds incomplete queued jobs", async () => {
  const state = validState();
  state.jobs = [{ id: "job-1", kind: "CONTENT_PRODUCTION", state: "QUEUED", contentType: "long_form" }];
  const database = {
    prepare(sql) {
      return {
        bind() { return this; },
        async first() { return { revision: 1, state_json: JSON.stringify(state), updated_at: "2026-11-08T00:00:00.000Z" }; }
      };
    }
  };
  const response = await handleRequest(new Request("https://state.example/api/jobs/queue-diagnostics", {
    headers: { "x-operator-token": "a".repeat(24) }
  }), { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.queuedCount, 1);
  assert.equal(body.dispatchableCount, 0);
  assert.equal(body.heldCount, 1);
  assert.deepEqual(body.items[0].blockers, ["APPROVED_AUTHORING_MISSING", "APPROVED_RENDER_PLAN_MISSING", "VALID_JOHANNESBURG_SLOT_MISSING"]);
  assert.equal(body.readOnly, true);
  assert.equal(body.publishingEnabled, false);
});

test("queue diagnostics rejects invalid limits without changing state", async () => {
  const state = validState();
  let reads = 0;
  const database = { prepare() { return { bind() { return this; }, async first() { reads++; return { revision: 1, state_json: JSON.stringify(state) }; } }; } };
  const response = await handleRequest(new Request("https://state.example/api/jobs/queue-diagnostics?limit=101", {
    headers: { "x-operator-token": "a".repeat(24) }
  }), { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database });
  assert.equal(response.status, 400);
  assert.equal(reads, 1);
  assert.deepEqual(state.jobs, []);
});

test("compatibility adapter normalizes legacy optional collections without dropping unknown fields", () => {
  const legacy = validState();
  delete legacy.campaigns;
  delete legacy.facebookDrafts;
  delete legacy.facebookPosts;
  delete legacy.facebookAttempts;
  legacy.legacyExtension = { retained: true };
  const normalized = normalizeDashboardState(legacy);
  assert.deepEqual(normalized.campaigns, []);
  assert.deepEqual(normalized.facebookDrafts, []);
  assert.deepEqual(normalized.facebookPosts, []);
  assert.deepEqual(normalized.facebookAttempts, []);
  assert.deepEqual(normalized.legacyExtension, { retained: true });
  assert.equal(normalized.publishingEnabled, false);
});

test("compatibility adapter rejects legacy Safari campaign records that are not fully inert", () => {
  const state = validState();
  state.campaigns = [{ type: "safari_affiliate", status: "INACTIVE", destinationUrl: "https://unsafe.example", ownerApproved: false, destinationValidation: "not_verified", disclosureText: "" }];
  assert.throws(() => normalizeDashboardState(state), /Safari affiliate campaigns/);
});

test("legacy state response preserves browser fields and exposes revision without fabricating readiness", () => {
  const state = validState();
  state.queueItems = [{ id: "draft-1" }];
  state.jobs = [{ id: "job-1" }];
  const response = toDashboardStateResponse(state, { revision: 7, updatedAt: "2026-11-08T00:00:00.000Z" });
  assert.equal(response.revision, 7);
  assert.deepEqual(response.queueItems, [{ id: "draft-1" }]);
  assert.equal(response.jobs[0].id, "job-1");
  assert.deepEqual(response.schedule, DEFAULT_WEEKLY_PLAN);
  assert.equal(response.uploadLedger, null);
  assert.equal(response.campaignValidation.ok, true);
  assert.equal(response.publishingEnabled, false);
});

test("state compatibility reports real campaign validation and repository schedule without fabricating upload history", () => {
  const state = validState();
  state.campaigns = [{ id: "bad-campaign", type: "affiliate", status: "ACTIVE", destinationUrl: "https://unapproved.example" }];
  const response = toDashboardStateResponse(state, { revision: 11, updatedAt: "2026-11-08T01:00:00.000Z" });
  assert.deepEqual(response.schedule, DEFAULT_WEEKLY_PLAN);
  assert.equal(response.campaignValidation.ok, true);
  assert.ok(response.campaignValidation.errors.length > 0);
  assert.equal(response.uploadLedger, null);
  assert.ok(response.blockers.some(item => item.includes("upload ledger")));
  assert.equal(response.publishingEnabled, false);
});

test("state compatibility reports real campaign validation and repository schedule without fabricating upload history", () => {
  const state = validState();
  state.campaigns = [{ id: "bad-campaign", type: "affiliate", status: "ACTIVE", destinationUrl: "https://unapproved.example" }];
  const response = toDashboardStateResponse(state, { revision: 11, updatedAt: "2026-11-08T01:00:00.000Z" });
  assert.deepEqual(response.schedule, DEFAULT_WEEKLY_PLAN);
  assert.equal(response.campaignValidation.ok, false);
  assert.ok(response.campaignValidation.errors.length > 0);
  assert.equal(response.uploadLedger, null);
  assert.ok(response.blockers.some(item => item.includes("upload ledger")));
  assert.equal(response.publishingEnabled, false);
});

test("jobs list returns the legacy newest-first read-only collection", async () => {
  const state = validState();
  state.jobs = [{ id: "old" }, { id: "new" }];
  const database = { prepare() { return { bind() { return this; }, async first() { return { revision: 4, state_json: JSON.stringify(state) }; } }; } };
  const response = await handleRequest(new Request("https://state.example/api/jobs?limit=1", { headers: { "x-operator-token": "a".repeat(24) } }), { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.jobs.map(job => job.id), ["new"]);
  assert.equal(body.readOnly, true);
  assert.equal(body.publishingEnabled, false);
});

test("dispatchable jobs endpoint never releases queued work without approved authoring, approved plan, and due Johannesburg slot", async () => {
  const state = validState();
  state.jobs = [
    { id: "held", kind: "CONTENT_PRODUCTION", state: "QUEUED", contentType: "short" },
    { id: "future", kind: "CONTENT_PRODUCTION", state: "QUEUED", contentType: "long_form", authoring: { productionPlan: { status: "APPROVED_PLAN_ONLY", review: { decision: "APPROVE", approvalSha256: "a".repeat(64) } } }, scheduledSlot: { date: "2099-01-01", time: "17:00", timezone: "Africa/Johannesburg" } }
  ];
  const database = { prepare() { return { bind() { return this; }, async first() { return { revision: 2, state_json: JSON.stringify(state) }; } }; } };
  const response = await handleRequest(new Request("https://state.example/api/jobs/dispatchable", { headers: { "x-operator-token": "a".repeat(24) } }), { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.queuedCount, 2);
  assert.equal(body.dispatchableCount, 0);
  assert.equal(body.jobs.length, 0);
  assert.equal(body.publishingEnabled, false);
});

test("draft and Facebook read APIs expose persisted records without enabling publishing", async () => {
  const state = validState();
  state.queueItems = [{ id: "draft-1" }];
  state.facebookDrafts = [{ id: "nf-1", status: "DRAFT" }];
  const database = { prepare() { return { bind() { return this; }, async first() { return { revision: 5, state_json: JSON.stringify(state) }; } }; } };
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database };
  const headers = { "x-operator-token": "a".repeat(24) };
  const drafts = await handleRequest(new Request("https://state.example/api/drafts", { headers }), env);
  assert.deepEqual((await drafts.json()).items, [{ id: "draft-1" }]);
  const facebookDrafts = await handleRequest(new Request("https://state.example/api/facebook/drafts", { headers }), env);
  assert.deepEqual((await facebookDrafts.json()).drafts, [{ id: "nf-1", status: "DRAFT" }]);
  const facebookState = await handleRequest(new Request("https://state.example/api/facebook/state", { headers }), env);
  const body = await facebookState.json();
  assert.equal(body.destination, "nature_frontiers_facebook");
  assert.equal(body.pageIdentityVerified, false);
  assert.equal(body.dryRun, true);
  assert.equal(body.publishingEnabled, false);
  assert.equal(body.readOnly, true);
});

test("GET /api/state serves the legacy dashboard payload and durable revision envelope", async () => {
  const state = validState();
  state.queueItems = [{ id: "queue-1" }];
  state.jobs = [{ id: "job-1" }];
  const database = { prepare() { return { bind() { return this; }, async first() { return { revision: 9, updated_at: "2026-11-08T01:00:00.000Z", state_json: JSON.stringify(state) }; } }; } };
  const response = await handleRequest(new Request("https://state.example/api/state", { headers: { "x-operator-token": "a".repeat(24) } }), { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("etag"), '"9"');
  assert.equal(body.revision, 9);
  assert.deepEqual(body.queueItems, [{ id: "queue-1" }]);
  assert.deepEqual(body.jobs, [{ id: "job-1" }]);
  assert.equal(body.publishingEnabled, false);
  assert.equal(body.schedule, null);
  assert.equal(body.uploadLedger, null);
  assert.equal(body.campaignValidation.ok, false);
  assert.equal(body.state.facebookDrafts.length, 0);
});

test("task catalog is exposed as a read-only allowlist and never enables publishing", async () => {
  const response = await handleRequest(new Request("https://state.example/api/tasks", {
    headers: { "x-operator-token": "a".repeat(24) }
  }), { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24) });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.tasks, ["validate-schedule", "check-captions", "production-readiness", "test-suite", "validate-campaigns"]);
  assert.equal(body.publicPublishingEnabled, false);
  assert.equal(body.readOnly, true);
});

test("Facebook idea API returns a deterministic research-first idea without creating a draft", async () => {
  const state = validState();
  const database = { prepare() { return { bind() { return this; }, async first() { return { revision: 3, state_json: JSON.stringify(state) }; } }; } };
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database };
  const headers = { "x-operator-token": "a".repeat(24) };
  const first = await handleRequest(new Request("https://state.example/api/facebook/idea?date=2026-11-08", { headers }), env);
  const second = await handleRequest(new Request("https://state.example/api/facebook/idea?date=2026-11-08", { headers }), env);
  const firstBody = await first.json();
  const secondBody = await second.json();
  assert.equal(first.status, 200);
  assert.deepEqual(firstBody, secondBody);
  assert.equal(firstBody.idea.date, "2026-11-08");
  assert.equal(firstBody.idea.publishReady, false);
  assert.deepEqual(firstBody.idea.factualClaims, []);
  assert.equal(firstBody.publishingEnabled, false);
  assert.equal(firstBody.readOnly, true);
  assert.deepEqual(state.facebookDrafts, []);
});

test("Facebook idea API rejects invalid dates and excludes overlapping active topics", async () => {
  const state = validState();
  state.facebookDrafts = [{ id: "existing", topic: "How to observe wildlife without disturbing natural behaviour", status: "DRAFT" }];
  const database = { prepare() { return { bind() { return this; }, async first() { return { revision: 1, state_json: JSON.stringify(state) }; } }; } };
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database };
  const headers = { "x-operator-token": "a".repeat(24) };
  const invalid = await handleRequest(new Request("https://state.example/api/facebook/idea?date=2026-02-30", { headers }), env);
  assert.equal(invalid.status, 400);
  const valid = await handleRequest(new Request("https://state.example/api/facebook/idea?date=2026-11-08", { headers }), env);
  const body = await valid.json();
  assert.equal(valid.status, 200);
  assert.notEqual(body.idea.topic, state.facebookDrafts[0].topic);
  assert.equal(body.idea.publishReady, false);
});

test("campaign read API validates persisted campaign records against the repository policy", async () => {
  const state = validState();
  state.campaigns = [{ id: "selar-wildlife-vault", status: "ACTIVE_FOR_DRAFTS_ONLY" }];
  const database = { prepare() { return { bind() { return this; }, async first() { return { revision: 4, state_json: JSON.stringify(state) }; } }; } };
  const response = await handleRequest(new Request("https://state.example/api/campaigns", {
    headers: { "x-operator-token": "a".repeat(24) }
  }), { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.campaigns, state.campaigns);
  assert.equal(body.source, "durable_dashboard_state");
  assert.equal(body.authoritativeConfigImported, true);
  assert.equal(body.validation.status, "BLOCKED");
  assert.ok(body.validation.errors.length > 0);
  assert.equal(body.publishingEnabled, false);
  assert.equal(body.readOnly, true);
});

test("schedule read API exposes the authoritative draft slots while keeping publication history blocked", async () => {
  const state = validState();
  state.queueItems = [{ id: "slot-1", reservationType: "SCHEDULED_SLOT", scheduledDate: "2026-11-10" }];
  const database = { prepare() { return { bind() { return this; }, async first() { return { revision: 5, state_json: JSON.stringify(state) }; } }; } };
  const response = await handleRequest(new Request("https://state.example/api/schedule", {
    headers: { "x-operator-token": "a".repeat(24) }
  }), { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.timezone, "Africa/Johannesburg");
  assert.deepEqual(body.publicationCycle.formats, ["long_form", "long_form", "short"]);
  assert.equal(body.publicationCycle.minimumHoursBetweenConsecutivePublications, 72);
  assert.equal(body.publicationCycle.minimumCycleHours, 216);
  assert.equal(body.authoritativeScheduleConfigImported, true);
  assert.deepEqual(body.schedule, DEFAULT_WEEKLY_PLAN);
  assert.deepEqual(body.draftPreparationSlots, DEFAULT_WEEKLY_PLAN.schedule);
  assert.equal(body.publicationHistoryReconciled, false);
  assert.equal(body.queuedReservations.length, 1);
  assert.ok(body.blockers.length >= 2);
  assert.equal(body.publishingEnabled, false);
  assert.equal(body.readOnly, true);
});

function mutableDatabase(initialState, initialRevision = 1) {
  let revision = initialRevision;
  let stateJson = JSON.stringify(initialState);
  let updatedAt = "2026-11-08T00:00:00.000Z";
  const database = {
    prepare(sql) {
      return {
        sql,
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() { return { revision, state_json: stateJson, updated_at: updatedAt }; }
      };
    },
    async batch(statements) {
      const update = statements.find(statement => statement.sql.startsWith("UPDATE dashboard_state"));
      if (update && revision === update.args[3]) {
        stateJson = update.args[0];
        updatedAt = update.args[1];
        revision++;
        return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }];
      }
      return [{ meta: { changes: 0 } }, { meta: { changes: 0 } }];
    }
  };
  return { database, snapshot: () => ({ revision, state: JSON.parse(stateJson), updatedAt }) };
}

test("content job creation enforces preparation slots and persists an idempotent queued job with a backup", async () => {
  const { database, snapshot } = mutableDatabase(validState());
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const payload = { idempotencyKey: "job:2026-11-10:longform", title: "Wildlife behaviour", topic: "Observe animal behaviour responsibly", contentType: "long_form", scheduledDate: "2026-11-10", scheduledDay: "Tuesday", inputReferences: ["research:field-notes"] };
  const request = () => new Request("https://state.example/api/jobs", { method: "POST", headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" }, body: JSON.stringify(payload) });
  const created = await handleRequest(request(), env);
  const createdBody = await created.json();
  assert.equal(created.status, 201, JSON.stringify(createdBody));
  assert.equal(createdBody.job.state, "QUEUED");
  assert.equal(createdBody.job.scheduledSlot.timezone, "Africa/Johannesburg");
  assert.equal(createdBody.job.publishingEnabled, false);
  assert.equal(createdBody.revision, 2);
  assert.equal(snapshot().state.jobs.length, 1);
  const replay = await handleRequest(request(), env);
  const replayBody = await replay.json();
  assert.equal(replay.status, 200);
  assert.equal(replayBody.idempotentReplay, true);
  assert.equal(replayBody.job.id, createdBody.job.id);
  assert.equal(snapshot().revision, 2);
});

test("content job creation rejects mismatched weekdays, invalid type/day pairs and idempotency conflicts", async () => {
  const { database } = mutableDatabase(validState());
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const send = async payload => handleRequest(new Request("https://state.example/api/jobs", { method: "POST", headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" }, body: JSON.stringify(payload) }), env);
  const base = { idempotencyKey: "job:2026-11-10:longform", title: "Wildlife behaviour", topic: "Observe animal behaviour responsibly", contentType: "long_form", scheduledDate: "2026-11-10", scheduledDay: "Tuesday" };
  assert.equal((await send({ ...base, scheduledDay: "Saturday" })).status, 400);
  assert.equal((await send({ ...base, contentType: "short" })).status, 400);
  assert.equal((await send(base)).status, 201);
  const conflict = await send({ ...base, title: "Different title" });
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).code, "IDEMPOTENCY_CONFLICT");
});

test("job cancellation is audited, revision-guarded and refuses active worker leases", async () => {
  const state = validState();
  state.jobs = [
    { id: "queued-job", state: "QUEUED", transitionHistory: [], workerLease: null },
    { id: "leased-job", state: "GENERATING", transitionHistory: [], workerLease: { workerId: "worker-1", expiresAt: "2099-01-01T00:00:00.000Z" } }
  ];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const send = id => handleRequest(new Request(`https://state.example/api/jobs/${id}/cancel`, { method: "POST", headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" }, body: JSON.stringify({ reason: "Owner cancelled the draft request" }) }), env);
  const blocked = await send("leased-job");
  assert.equal(blocked.status, 409);
  const cancelled = await send("queued-job");
  const body = await cancelled.json();
  assert.equal(cancelled.status, 200);
  assert.equal(body.job.state, "CANCELLED");
  assert.equal(body.job.cancelledBy, "sonicvhibez-owner");
  assert.equal(body.revision, 2);
  assert.equal(snapshot().state.audit.at(-1).action, "CONTENT_JOB_CANCELLED");
  assert.equal(snapshot().state.jobs.find(job => job.id === "leased-job").state, "GENERATING");
});

test("cancel route rejects malformed job identifiers without reading durable state", async () => {
  let reads = 0;
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: { prepare() { reads++; throw new Error("must not access state"); } } };
  const response = await handleRequest(new Request("https://state.example/api/jobs/not%2Fa%2Fjob/cancel", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify({ reason: "Invalid identifier test" })
  }), env);
  assert.equal(response.status, 404);
  assert.equal(reads, 0);
});


test("content job transition API enforces the authoritative lifecycle and records audit history", async () => {
  const state = validState();
  state.jobs = [{ id: "content-1", kind: "CONTENT_PRODUCTION", state: "QUEUED", transitionHistory: [], attemptCount: 0, workerLease: null }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const send = nextState => handleRequest(new Request("https://state.example/api/jobs/transition", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify({ jobId: "content-1", nextState, reason: "Operator advanced the verified workflow stage" })
  }), env);
  const started = await send("GENERATING");
  const startedBody = await started.json();
  assert.equal(started.status, 200);
  assert.equal(startedBody.job.state, "GENERATING");
  assert.equal(startedBody.job.attemptCount, 1);
  assert.equal(startedBody.job.startedAt, startedBody.job.updatedAt);
  assert.equal(startedBody.job.transitionHistory.at(-1).actor, "sonicvhibez-owner");
  assert.equal(snapshot().state.audit.at(-1).action, "CONTENT_JOB_STATE_CHANGED");
  const protectedAttempt = await send("APPROVED_FOR_PRIVATE_UPLOAD");
  assert.equal(protectedAttempt.status, 409);
  assert.equal((await protectedAttempt.json()).code, "INVALID_JOB_TRANSITION");
  assert.equal(snapshot().state.jobs[0].state, "GENERATING");
});

test("content job transition API requires verified evidence before human review", async () => {
  const state = validState();
  state.jobs = [{ id: "content-review", kind: "CONTENT_PRODUCTION", state: "VALIDATING", transitionHistory: [], outputArtifacts: [], validationResults: null, rightsChecks: null }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const response = await handleRequest(new Request("https://state.example/api/jobs/transition", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify({ jobId: "content-review", nextState: "AWAITING_HUMAN_REVIEW" })
  }), env);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "INVALID_JOB_TRANSITION");
  assert.equal(snapshot().revision, 1);
  assert.equal(snapshot().state.jobs[0].state, "VALIDATING");
});


test("failed content jobs require operator retry authorization and preserve the retry receipt", async () => {
  const state = validState();
  state.jobs = [{
    id: "retryable-job", kind: "CONTENT_PRODUCTION", state: "FAILED",
    transitionHistory: [], attemptCount: 1,
    retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true },
    retryAuthorizations: [], errorDetails: { retryable: true }, workerLease: null
  }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const response = await handleRequest(new Request("https://state.example/api/jobs/retry", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify({ jobId: "retryable-job", reason: "Reviewed retained failure evidence and confirmed safe retry" })
  }), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.retryAuthorized, true);
  assert.equal(body.job.state, "QUEUED");
  assert.equal(body.job.retryAuthorizations.length, 1);
  assert.equal(body.job.retryAuthorizations[0].actor, "sonicvhibez-owner");
  assert.equal(body.job.nextRetryAt, null);
  assert.equal(snapshot().state.audit.at(-1).action, "CONTENT_JOB_RETRY_AUTHORIZED");
});

test("dead-letter retry requires an explicit one-attempt override and records recovery", async () => {
  const state = validState();
  state.jobs = [{
    id: "dead-job", kind: "CONTENT_PRODUCTION", state: "DEAD_LETTER",
    transitionHistory: [], attemptCount: 2,
    retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true },
    retryAuthorizations: [], errorDetails: { retryableAfterOperatorReview: true }, workerLease: null
  }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const send = overrideRetryLimit => handleRequest(new Request("https://state.example/api/jobs/retry", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify({ jobId: "dead-job", reason: "Reviewed dead-letter evidence and approved one controlled retry", overrideRetryLimit })
  }), env);
  const denied = await send(false);
  assert.equal(denied.status, 409);
  assert.equal(snapshot().revision, 1);
  const approved = await send(true);
  const body = await approved.json();
  assert.equal(approved.status, 200);
  assert.equal(body.job.state, "QUEUED");
  assert.equal(body.job.retryPolicy.maxAttempts, 3);
  assert.equal(body.job.retryAuthorizations[0].overrideRetryLimit, true);
  assert.ok(snapshot().state.audit.some(entry => entry.action === "CONTENT_JOB_DEAD_LETTER_RECOVERED"));
});


test("worker leases are claimed, heartbeated and completed with token fencing and idempotency", async () => {
  const state = validState();
  state.jobs = [{
    id: "leased-content", kind: "CONTENT_PRODUCTION", state: "QUEUED",
    transitionHistory: [], attemptCount: 0, retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true },
    leaseHistory: [], workerLease: null
  }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const send = (path, body) => handleRequest(new Request("https://state.example" + path, {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify(body)
  }), env);
  const claim = await send("/api/jobs/lease/claim", { jobId: "leased-content", workerId: "runner-01" });
  const claimBody = await claim.json();
  assert.equal(claim.status, 200);
  assert.equal(claimBody.job.state, "GENERATING");
  assert.equal(claimBody.job.attemptCount, 1);
  assert.equal(typeof claimBody.leaseToken, "string");
  const badHeartbeat = await send("/api/jobs/lease/heartbeat", { jobId: "leased-content", leaseToken: "wrong-token" });
  assert.equal(badHeartbeat.status, 409);
  const heartbeat = await send("/api/jobs/lease/heartbeat", { jobId: "leased-content", leaseToken: claimBody.leaseToken });
  assert.equal(heartbeat.status, 200);
  assert.equal((await heartbeat.json()).job.leaseHistory.at(-1).action, "HEARTBEAT");
  const completionPayload = { jobId: "leased-content", leaseToken: claimBody.leaseToken, nextState: "BLOCKED", result: { errorDetails: { code: "MISSING_PREREQUISITE", retryable: false } } };
  const completion = await send("/api/jobs/lease/complete", completionPayload);
  const completionBody = await completion.json();
  assert.equal(completion.status, 200);
  assert.equal(completionBody.job.state, "BLOCKED");
  assert.equal(completionBody.job.workerLease, null);
  const replay = await send("/api/jobs/lease/complete", completionPayload);
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).idempotent, true);
  assert.equal(snapshot().state.audit.at(-1).action, "WORKER_STAGE_COMPLETED");
});

test("worker lease expiry is reaped and generated media cannot bypass repository artifact verification", async () => {
  const state = validState();
  state.jobs = [{
    id: "expired-content", kind: "CONTENT_PRODUCTION", state: "GENERATING",
    transitionHistory: [], attemptCount: 1, retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true },
    workerLease: { workerId: "runner-old", tokenHash: "0".repeat(64), claimedAt: "2026-11-07T00:00:00.000Z", heartbeatAt: "2026-11-07T00:00:00.000Z", expiresAt: "2026-11-07T00:01:00.000Z" },
    leaseHistory: []
  }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const send = (path, body) => handleRequest(new Request("https://state.example" + path, {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify(body)
  }), env);
  const generated = await send("/api/jobs/lease/complete", { jobId: "expired-content", leaseToken: "not-a-token", nextState: "GENERATED", result: { outputArtifacts: [{ path: "media/fake.mp4", sha256: "a".repeat(64) }] } });
  assert.equal(generated.status, 409);
  assert.equal((await generated.json()).code, "ARTIFACT_VERIFICATION_REQUIRED");
  const reaped = await send("/api/jobs/lease/reap", { jobId: "expired-content" });
  const reapedBody = await reaped.json();
  assert.equal(reaped.status, 200);
  assert.equal(reapedBody.job.state, "FAILED");
  assert.equal(reapedBody.job.workerLease, null);
  assert.equal(reapedBody.job.errorDetails.code, "WORKER_LEASE_EXPIRED");
  assert.equal(snapshot().state.audit.at(-1).action, "WORKER_LEASE_EXPIRED");
});


test("human script review binds approval to the exact canonical script and safely reuses an identical receipt", async () => {
  const script = { title: "Wildlife behaviour", narration: "A researched wildlife story.", sections: [{ narration: "A researched wildlife story." }] };
  const state = validState();
  state.jobs = [{
    id: "script-job", kind: "CONTENT_PRODUCTION", state: "QUEUED",
    authoring: { status: "AWAITING_HUMAN_EDITORIAL_REVIEW", result: { script } }
  }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const scriptSha256 = await canonicalAuthoringScriptSha256(script);
  const payload = { jobId: "script-job", decision: "APPROVE", scriptSha256, reason: "Reviewed factual structure, evidence and editorial accuracy" };
  const send = () => handleRequest(new Request("https://state.example/api/jobs/authoring/review", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify(payload)
  }), env);
  const approved = await send();
  const body = await approved.json();
  assert.equal(approved.status, 200);
  assert.equal(body.scriptReview.decision, "APPROVE");
  assert.equal(body.scriptReview.scriptSha256, scriptSha256);
  assert.equal(body.job.authoring.scriptApproval.approvalSha256.length, 64);
  assert.equal(body.publishable, false);
  const replay = await send();
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).reused, true);
  assert.equal(snapshot().revision, 2);
  assert.equal(snapshot().state.audit.at(-1).action, "SCRIPT_REVISION_APPROVED_FOR_NARRATION");
});

test("script review rejects stale hashes and rejection invalidates narration approvals", async () => {
  const script = { title: "Wildlife behaviour", narration: "Current approved script text." };
  const state = validState();
  state.jobs = [{
    id: "script-reject", kind: "CONTENT_PRODUCTION", state: "QUEUED",
    authoring: {
      status: "AWAITING_HUMAN_EDITORIAL_REVIEW", result: { script },
      narrationApproval: { decision: "APPROVE" }, narrationStage: { status: "DRAFT_REVIEW_REQUIRED" }
    }
  }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const send = payload => handleRequest(new Request("https://state.example/api/jobs/authoring/review", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify(payload)
  }), env);
  const stale = await send({ jobId: "script-reject", decision: "REJECT", scriptSha256: "0".repeat(64), reason: "The script needs factual corrections" });
  assert.equal(stale.status, 409);
  assert.equal(snapshot().revision, 1);
  const scriptSha256 = await canonicalAuthoringScriptSha256(script);
  const rejected = await send({ jobId: "script-reject", decision: "REJECT", scriptSha256, reason: "The script needs factual corrections" });
  const body = await rejected.json();
  assert.equal(rejected.status, 200);
  assert.equal(body.job.authoring.status, "REJECTED");
  assert.equal(body.job.authoring.scriptApproval, undefined);
  assert.equal(body.job.authoring.narrationApproval, undefined);
  assert.equal(body.job.authoring.narrationStage, undefined);
  assert.equal(snapshot().state.audit.at(-1).action, "SCRIPT_REVISION_REJECTED");
});


test("draft editing preserves review flags and enforces Johannesburg publication reservations", async () => {
  const state = validState();
  state.queueItems = [{
    id: "draft-queue-01", title: "Old title", topic: "Old topic", contentType: "long_form",
    scheduledDay: "Tuesday", scheduledDate: "2026-11-10", scheduledAt: "2026-11-10T15:00:00.000Z",
    reservationType: "SCHEDULED_SLOT", productUrl: "https://selar.com/0u19v8u99l",
    status: "DRAFT_REVIEW_REQUIRED", rightsConfirmed: true, complianceReviewed: false,
    humanApproved: false, approvedForPrivateUpload: false
  }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const payload = {
    id: "draft-queue-01", title: "Updated wildlife behaviour", topic: "Observe animal behaviour responsibly",
    contentType: "long_form", scheduledDay: "Tuesday", scheduledDate: "2026-11-17",
    productUrl: "https://selar.com/0u19v8u99l"
  };
  const send = body => handleRequest(new Request("https://state.example/api/drafts/update", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify(body)
  }), env);
  const updated = await send(payload);
  const body = await updated.json();
  assert.equal(updated.status, 200);
  assert.equal(body.item.title, payload.title);
  assert.equal(body.item.scheduledAt, "2026-11-17T15:00:00.000Z");
  assert.equal(body.item.status, "DRAFT_REVIEW_REQUIRED");
  assert.equal(body.item.rightsConfirmed, true);
  assert.equal(body.item.complianceReviewed, false);
  assert.equal(body.item.humanApproved, false);
  assert.equal(snapshot().state.audit.at(-1).action, "DRAFT_EDITED");
  const grantAttempt = await send({ ...payload, humanApproved: true });
  assert.equal(grantAttempt.status, 400);
  assert.equal(snapshot().revision, 2);
});

test("draft editing blocks another reserved slot on the same Johannesburg calendar date", async () => {
  const state = validState();
  state.queueItems = [
    { id: "draft-a", reservationType: "SCHEDULED_SLOT", scheduledDate: "2026-11-17", scheduledAt: "2026-11-17T15:00:00.000Z", status: "DRAFT_REVIEW_REQUIRED" },
    { id: "draft-b", reservationType: "SCHEDULED_SLOT", scheduledDate: "2026-11-24", scheduledAt: "2026-11-24T15:00:00.000Z", status: "DRAFT_REVIEW_REQUIRED" }
  ];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const response = await handleRequest(new Request("https://state.example/api/drafts/update", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify({
      id: "draft-b", title: "Updated wildlife behaviour", topic: "Observe animal behaviour responsibly",
      contentType: "long_form", scheduledDay: "Tuesday", scheduledDate: "2026-11-17",
      productUrl: "https://selar.com/0u19v8u99l"
    })
  }), env);
  assert.equal(response.status, 409);
  assert.equal(snapshot().revision, 1);
  assert.equal(snapshot().state.queueItems[1].scheduledDate, "2026-11-24");
});


test("Worker campaign defaults exactly match repository config and keep Safari inactive", () => {
  const repositoryConfig = JSON.parse(readFileSync(new URL("../config/campaigns.json", import.meta.url), "utf8"));
  assert.deepEqual(DEFAULT_CAMPAIGNS, repositoryConfig.campaigns);
  assert.deepEqual(validateCampaigns({ version: 1, campaigns: DEFAULT_CAMPAIGNS }), []);
  assert.equal(DEFAULT_CAMPAIGNS.find(campaign => campaign.type === "safari_affiliate").status, "INACTIVE");
});

test("campaign preview and activation require the exact approved Selar destination and disclosure", async () => {
  const state = validState();
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const send = body => handleRequest(new Request("https://state.example/api/campaigns/manage", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify(body)
  }), env);
  const disclosureText = "Promotional link: product details and current terms are available on the seller page.";
  const preview = await send({
    action: "preview", campaignId: "selar-wildlife-vault",
    destinationUrl: "https://selar.com/0u19v8u99l", disclosureText
  });
  const previewBody = await preview.json();
  assert.equal(preview.status, 200, JSON.stringify(previewBody));
  assert.equal(previewBody.previewOnly, true);
  assert.equal(previewBody.campaign.pendingDestinationUrl, "https://selar.com/0u19v8u99l");
  const activate = await send({
    action: "activate", campaignId: "selar-wildlife-vault",
    destinationUrl: "https://selar.com/0u19v8u99l", disclosureText, confirmOwnerApproval: true
  });
  const activateBody = await activate.json();
  assert.equal(activate.status, 200);
  assert.equal(activateBody.campaign.status, "ACTIVE_FOR_DRAFTS_ONLY");
  assert.equal(activateBody.campaign.approval.approvedBy, "sonicvhibez-owner");
  assert.equal(activateBody.publicPublishingEnabled, false);
  assert.equal(snapshot().state.audit.at(-1).action, "CAMPAIGN_ACTIVATE");
  const safari = await send({
    action: "activate", campaignId: "safari-affiliate-inactive",
    destinationUrl: "https://example.com/affiliate", disclosureText: "A clearly disclosed affiliate relationship", confirmOwnerApproval: true
  });
  assert.equal(safari.status, 409);
  assert.equal(snapshot().state.campaigns.find(campaign => campaign.type === "safari_affiliate").status, "INACTIVE");
});

test("draft creation persists a queue item and linked production job with safe defaults", async () => {
  const { database, snapshot } = mutableDatabase(validState());
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const payload = {
    id: "wildlife-draft-01", title: "Wildlife behaviour explained",
    topic: "Observe animal behaviour responsibly in natural habitats",
    contentType: "long_form", scheduledDay: "Tuesday", scheduledDate: "2026-11-10",
    productUrl: "https://selar.com/0u19v8u99l"
  };
  const request = () => handleRequest(new Request("https://state.example/api/drafts", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify(payload)
  }), env);
  const created = await request();
  const body = await created.json();
  assert.equal(created.status, 201);
  assert.equal(body.item.status, "DRAFT_REVIEW_REQUIRED");
  assert.equal(body.job.state, "QUEUED");
  assert.equal(body.job.idempotencyKey, "draft:wildlife-draft-01");
  assert.equal(body.job.publishingEnabled, false);
  assert.equal(snapshot().state.queueItems.length, 1);
  assert.equal(snapshot().state.jobs.length, 1);
  assert.equal(snapshot().state.audit.at(-1).action, "CONTENT_JOB_QUEUED");
  const duplicate = await request();
  assert.equal(duplicate.status, 409);
  assert.equal(snapshot().revision, 2);
});

test("draft creation blocks invalid campaigns and any non-allowlisted destination", async () => {
  const state = validState();
  state.campaigns = [{ id: "selar-wildlife-vault", type: "selar_digital_product", status: "ACTIVE_FOR_DRAFTS_ONLY", destinationUrl: "https://evil.example", ownerApproved: true, destinationValidation: "exact_approved_allowlist", disclosureRequired: true, disclosureText: "Promotional disclosure" }];
  const { database, snapshot } = mutableDatabase(state);
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const response = await handleRequest(new Request("https://state.example/api/drafts", {
    method: "POST",
    headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
    body: JSON.stringify({
      id: "wildlife-draft-02", title: "Wildlife behaviour explained",
      topic: "Observe animal behaviour responsibly in natural habitats",
      contentType: "long_form", scheduledDay: "Tuesday", scheduledDate: "2026-11-10",
      productUrl: "https://selar.com/0u19v8u99l"
    })
  }), env);
  assert.equal(response.status, 409);
  assert.equal(snapshot().revision, 1);
  assert.equal(snapshot().state.queueItems.length, 0);
});


test("Worker serves the dashboard entry document from static assets while keeping API authentication separate", async () => {
  let requestedAsset = null;
  const env = {
    ASSETS: {
      async fetch(request) {
        requestedAsset = new URL(request.url).pathname;
        return new Response("dashboard-shell", { status: 200, headers: { "content-type": "text/html" } });
      }
    },
    DASHBOARD_OPERATOR_TOKEN: "a".repeat(24)
  };
  const root = await handleRequest(new Request("https://state.example/"), env);
  assert.equal(root.status, 200);
  assert.equal(await root.text(), "dashboard-shell");
  assert.equal(requestedAsset, "/dashboard.html");
  const api = await handleRequest(new Request("https://state.example/api/state"), env);
  assert.equal(api.status, 401);
});


test("operational readiness requires readable D1 state, valid campaigns and dashboard assets", async () => {
  const state = validState();
  const env = {
    STATE_DB: { prepare() { return { bind() { return this; }, async first() { return { revision: 7, state_json: JSON.stringify(state), updated_at: "2026-11-08T00:00:00.000Z" }; } }; } },
    ASSETS: { async fetch() { return new Response("dashboard", { status: 200 }); } },
    ARTIFACTS: { async put() {}, async get() {} }
  };
  const response = await handleRequest(new Request("https://state.example/operational-readyz"), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ready, true);
  assert.equal(body.durableState, "READABLE");
  assert.equal(body.campaignConfig, "PASS");
  assert.equal(body.dashboardAssets, "READABLE");
  assert.equal(body.artifactStorage, "BOUND");
  assert.equal(body.publicationReadiness, "SEPARATE");
  assert.equal(body.publishingEnabled, false);
  assert.equal(body.blockers.length, 0);
});

test("publication readiness remains blocked until complete remote history and one-shot authorization are verified", async () => {
  const response = await handleRequest(new Request("https://state.example/readyz"), {});
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.ready, false);
  assert.equal(body.publicationReadiness, "BLOCKED");
  assert.ok(body.blockers.some(blocker => blocker.includes("Complete SonicVhibez")));
  assert.ok(body.blockers.some(blocker => blocker.includes("one-shot authorization")));
  assert.equal(body.publishingEnabled, false);
  assert.equal(body.publicPublishingEnabled, false);
  assert.equal(body.unattendedPublishingEnabled, false);
});


test("filesystem-heavy operations fail explicitly until the repository runner is connected", async () => {
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner" };
  for (const [method, path] of [["POST", "/api/tasks/run"], ["POST", "/api/jobs/produce"], ["GET", "/api/jobs/review/bundle?jobId=job-1"], ["POST", "/api/jobs/render-recovery/reconcile"]]) {
    const response = await handleRequest(new Request("https://state.example" + path, {
      method, headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
      body: method === "POST" ? JSON.stringify({ taskId: "production-readiness" }) : undefined
    }), env);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.code, "REPOSITORY_RUNNER_NOT_CONNECTED");
    assert.equal(body.publishingEnabled, false);
  }
});

test("Meta and YouTube provider operations fail closed without external adapters", async () => {
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner" };
  for (const [method, path] of [["POST", "/api/uploads/reconcile"], ["POST", "/api/facebook/verify-page"], ["POST", "/api/facebook/drafts"], ["POST", "/api/facebook/publish"]]) {
    const response = await handleRequest(new Request("https://state.example" + path, {
      method, headers: { "x-operator-token": "a".repeat(24), "content-type": "application/json" },
      body: JSON.stringify({})
    }), env);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.code, "EXTERNAL_PROVIDER_NOT_CONNECTED");
    assert.equal(body.publishingEnabled, false);
  }
});


test("capabilities endpoint distinguishes implemented durable operations from runner/provider blockers", async () => {
  const { database } = mutableDatabase(validState());
  const env = { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24), STATE_DB: database, ASSETS: {} };
  const response = await handleRequest(new Request("https://state.example/api/capabilities", {
    headers: { "x-operator-token": "a".repeat(24) }
  }), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.statePersistence.configured, true);
  assert.equal(body.dashboardHosting.configured, true);
  assert.equal(body.artifactStorage.configured, false);
  assert.equal(body.artifactStorage.uploadDownloadE2E, "NOT_TESTED");
  assert.ok(body.supported.some(item => item.includes("worker lease")));
  assert.ok(body.blockedUntilIntegration.some(item => item.includes("Node/FFmpeg")));
  assert.ok(body.blockedUntilIntegration.some(item => item.includes("YouTube OAuth")));
  assert.equal(body.publishingEnabled, false);
});


test("Wrangler staging config binds the dashboard static assets and existing D1 database without deploying", () => {
  const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  assert.equal(config.name, "sonicvhibez-durable-state-staging");
  assert.equal(config.assets.directory, "./public");
  assert.equal(config.assets.binding, "ASSETS");
  assert.equal(config.assets.run_worker_first, true);
  assert.equal(config.d1_databases[0].binding, "STATE_DB");
  assert.equal(config.d1_databases[0].database_id, "f018ee20-2d7f-41ec-9744-ee058bce80f8");
  assert.equal(config.r2_buckets[0].binding, "ARTIFACTS");
  assert.equal(config.r2_buckets[0].bucket_name, "sonicvhibez-artifacts-staging");
});


test("bundled Worker weekly plan exactly matches repository schedule configuration", () => {
  const repositoryPlan = JSON.parse(readFileSync(new URL("../config/weekly-content-plan.json", import.meta.url), "utf8"));
  assert.deepEqual(DEFAULT_WEEKLY_PLAN, repositoryPlan);
  assert.equal(DEFAULT_WEEKLY_PLAN.publishingEnabled, false);
  assert.equal(DEFAULT_WEEKLY_PLAN.publicationCycle.publicationEnabled, false);
  assert.equal(DEFAULT_WEEKLY_PLAN.cadenceDecision.approvedMode, "ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET");
});



async function createRunnerOidcFixture(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const pair = await crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5", modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256"
  }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  Object.assign(jwk, { kid: "runner-test-key", use: "sig", alg: "RS256" });
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "RS256", typ: "JWT", kid: jwk.kid });
  const claims = {
    iss: "https://token.actions.githubusercontent.com",
    aud: "sonicvhibez-dashboard-runner",
    sub: "repo:clickerrish-art/YT-AUTO-VISE:ref:refs/heads/codex/dashboard-cloudflare-adapter",
    repository: "clickerrish-art/YT-AUTO-VISE",
    repository_id: "1210809338",
    repository_owner: "clickerrish-art",
    repository_owner_id: "251036666",
    actor: "clickerrish-art",
    actor_id: "251036666",
    ref: "refs/heads/codex/dashboard-cloudflare-adapter",
    workflow_ref: "clickerrish-art/YT-AUTO-VISE/.github/workflows/repository-runner.yml@refs/heads/codex/dashboard-cloudflare-adapter",
    event_name: "workflow_dispatch",
    sha: "a".repeat(40),
    iat: now,
    nbf: now - 5,
    exp: now + 300,
    ...overrides
  };
  const payload = encode(claims);
  const signingInput = header + "." + payload;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(signingInput));
  const token = signingInput + "." + Buffer.from(signature).toString("base64url");
  const fetchImpl = async url => {
    assert.equal(String(url), "https://token.actions.githubusercontent.com/.well-known/jwks");
    return new Response(JSON.stringify({ keys: [jwk] }), { status: 200, headers: { "content-type": "application/json" } });
  };
  return { token, fetchImpl, nowMs: now * 1000 };
}

test("repository runner OIDC restricts push triggers to the repository owner identity", async () => {
  const ownerPush = await createRunnerOidcFixture({ event_name: "push" });
  assert.equal(await verifyRepositoryRunnerToken(ownerPush.token, ownerPush), true);
  const otherActor = await createRunnerOidcFixture({ event_name: "push", actor: "another-contributor", actor_id: "999999" });
  assert.equal(await verifyRepositoryRunnerToken(otherActor.token, otherActor), false);
  const wrongRepoId = await createRunnerOidcFixture({ repository_id: "999999999" });
  assert.equal(await verifyRepositoryRunnerToken(wrongRepoId.token, wrongRepoId), false);
});

test("repository runner OIDC accepts only the exact repository, branch, workflow, audience and event", async () => {
  const fixture = await createRunnerOidcFixture();
  assert.equal(await verifyRepositoryRunnerToken(fixture.token, fixture), true);
  for (const overrides of [
    { repository: "attacker/other-repo" },
    { ref: "refs/heads/main" },
    { workflow_ref: "clickerrish-art/YT-AUTO-VISE/.github/workflows/other.yml@refs/heads/codex/dashboard-cloudflare-adapter" },
    { aud: "wrong-audience" },
    { event_name: "pull_request" },
    { iss: "https://attacker.example" },
    { exp: Math.floor(Date.now() / 1000) - 1 }
  ]) {
    const invalid = await createRunnerOidcFixture(overrides);
    assert.equal(await verifyRepositoryRunnerToken(invalid.token, invalid), false);
  }
});

test("repository runner OIDC snapshot API is separate from operator APIs and revision guarded", async () => {
  const fixture = await createRunnerOidcFixture();
  const { database, snapshot } = mutableDatabase(validState());
  const env = { DASHBOARD_OPERATOR_TOKEN: "o".repeat(32), DASHBOARD_OPERATOR_ID: "sonicvhibez-owner", STATE_DB: database };
  const read = await handleRequest(new Request("https://state.example/api/runner/snapshot", {
    headers: { authorization: "Bearer " + fixture.token, "x-worker-id": "runner-test" }
  }), env, fixture);
  const readBody = await read.json();
  assert.equal(read.status, 200);
  assert.equal(readBody.revision, 1);
  assert.deepEqual(readBody.state, validState());
  const workerCannotReadOperatorApi = await handleRequest(new Request("https://state.example/api/state", {
    headers: { authorization: "Bearer " + fixture.token }
  }), env, fixture);
  assert.equal(workerCannotReadOperatorApi.status, 401);
  const operatorCannotUseRunnerApi = await handleRequest(new Request("https://state.example/api/runner/snapshot", {
    headers: { "x-operator-token": "o".repeat(32) }
  }), env, fixture);
  assert.equal(operatorCannotUseRunnerApi.status, 401);
  const next = { ...validState(), queueItems: [{ id: "runner-produced-record" }] };
  const write = await handleRequest(new Request("https://state.example/api/runner/snapshot", {
    method: "PUT",
    headers: { authorization: "Bearer " + fixture.token, "x-worker-id": "runner-test", "if-match": '"1"', "content-type": "application/json" },
    body: JSON.stringify({ state: next })
  }), env, fixture);
  assert.equal(write.status, 200);
  assert.equal((await write.json()).revision, 2);
  assert.equal(snapshot().state.queueItems[0].id, "runner-produced-record");
  assert.equal(snapshot().state.audit.at(-1).action, "REPOSITORY_RUNNER_STATE_RECONCILED");
  const stale = await handleRequest(new Request("https://state.example/api/runner/snapshot", {
    method: "PUT",
    headers: { authorization: "Bearer " + fixture.token, "if-match": '"1"', "content-type": "application/json" },
    body: JSON.stringify({ state: next })
  }), env, fixture);
  assert.equal(stale.status, 409);
});

test("repository runner snapshot rejects invalid publishing state", async () => {
  const fixture = await createRunnerOidcFixture();
  const { database } = mutableDatabase(validState());
  const env = { DASHBOARD_OPERATOR_TOKEN: "o".repeat(32), STATE_DB: database };
  const invalid = await handleRequest(new Request("https://state.example/api/runner/snapshot", {
    method: "PUT",
    headers: { authorization: "Bearer " + fixture.token, "if-match": '"1"', "content-type": "application/json" },
    body: JSON.stringify({ state: { ...validState(), publishingEnabled: true } })
  }), env, fixture);
  assert.equal(invalid.status, 400);
});

test("repository runner backoff state is durable, worker-scoped and revision guarded", async () => {
  const records = new Map();
  const db = {
    prepare(sql) {
      return {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          const row = records.get(this.args[0]);
          return row ? { ...row } : null;
        },
        async run() {
          if (sql.startsWith("INSERT OR IGNORE")) {
            const [workerId, stateJson, updatedAt] = this.args;
            if (records.has(workerId)) return { meta: { changes: 0 } };
            records.set(workerId, { revision: 1, state_json: stateJson, updated_at: updatedAt });
            return { meta: { changes: 1 } };
          }
          const [stateJson, updatedAt, workerId, expectedRevision] = this.args;
          const row = records.get(workerId);
          if (!row || row.revision !== expectedRevision) return { meta: { changes: 0 } };
          records.set(workerId, { revision: row.revision + 1, state_json: stateJson, updated_at: updatedAt });
          return { meta: { changes: 1 } };
        }
      };
    }
  };
  const fixture = await createRunnerOidcFixture();
  const env = { DASHBOARD_OPERATOR_TOKEN: "o".repeat(32), STATE_DB: db };
  const get = () => handleRequest(new Request("https://state.example/api/runner/backoff?workerId=runner-one", {
    headers: { authorization: "Bearer " + fixture.token }
  }), env, fixture);
  const initial = await (await get()).json();
  assert.equal(initial.revision, 0);
  assert.equal(initial.state, null);
  const state = {
    schemaVersion: 1, workerId: "runner-one", updatedAt: new Date(0).toISOString(),
    cooldowns: { "job-1": { attempts: 1, nextAttemptAt: 1799999999999 } },
    uncertainDispatches: { "job-2": { code: "WORKER_DISPATCH_OUTCOME_UNCERTAIN", recordedAt: "2026-11-08T00:00:00.000Z" } },
    consumedReleaseNonces: []
  };
  const save = () => handleRequest(new Request("https://state.example/api/runner/backoff", {
    method: "PUT", headers: { authorization: "Bearer " + fixture.token, "content-type": "application/json" },
    body: JSON.stringify({ workerId: "runner-one", expectedRevision: 0, state })
  }), env, fixture);
  const saved = await save();
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).revision, 1);
  const loaded = await (await get()).json();
  assert.equal(loaded.state.uncertainDispatches["job-2"].code, "WORKER_DISPATCH_OUTCOME_UNCERTAIN");
  assert.equal(loaded.state.cooldowns["job-1"].attempts, 1);
  assert.equal((await save()).status, 409);
  const invalid = await handleRequest(new Request("https://state.example/api/runner/backoff", {
    method: "PUT", headers: { authorization: "Bearer " + fixture.token, "content-type": "application/json" },
    body: JSON.stringify({ workerId: "runner-one", expectedRevision: 1, state: { ...state, workerId: "runner-two" } })
  }), env, fixture);
  assert.equal(invalid.status, 400);
});


test("repository runner session lock blocks overlap and releases only after exact successful reconciliation", async () => {
  let session = null;
  const db = {
    prepare(sql) {
      return {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() { return session ? { ...session } : null; },
        async run() {
          if (sql.startsWith("INSERT INTO runner_control")) {
            const [sessionId, workerId, startedAt] = this.args;
            if (session?.status === "ACTIVE") return { meta: { changes: 0 } };
            session = { session_id: sessionId, worker_id: workerId, status: "ACTIVE", started_at: startedAt, completed_at: null, release_reason: null };
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith("UPDATE runner_control")) {
            if (!session || session.status !== "ACTIVE") return { meta: { changes: 0 } };
            if (sql.includes("session_id = ? AND status = 'ACTIVE'")) {
              const sessionId = this.args.at(-1);
              if (session.session_id !== sessionId) return { meta: { changes: 0 } };
            }
            const [completedAt, releaseReason] = this.args;
            session = {
              ...session, status: "RELEASED", completed_at: completedAt,
              release_reason: sql.includes("RUNNER_RECONCILIATION_COMPLETE") ? "RUNNER_RECONCILIATION_COMPLETE" : releaseReason
            };
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        }
      };
    }
  };
  const fixture = await createRunnerOidcFixture();
  const env = { DASHBOARD_OPERATOR_TOKEN: "o".repeat(32), STATE_DB: db };
  const start = () => handleRequest(new Request("https://state.example/api/runner/session", {
    method: "POST", headers: { authorization: "Bearer " + fixture.token, "content-type": "application/json" },
    body: JSON.stringify({ workerId: "runner-one" })
  }), env, fixture);
  const first = await start();
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  assert.ok(firstBody.sessionId);
  const overlapping = await start();
  assert.equal(overlapping.status, 409);
  assert.equal((await overlapping.json()).code, "RUNNER_SESSION_ACTIVE");
  const wrongCompletion = await handleRequest(new Request("https://state.example/api/runner/session/complete", {
    method: "POST", headers: { authorization: "Bearer " + fixture.token, "content-type": "application/json" },
    body: JSON.stringify({ sessionId: "not-the-active-session" })
  }), env, fixture);
  assert.equal(wrongCompletion.status, 409);
  const completed = await handleRequest(new Request("https://state.example/api/runner/session/complete", {
    method: "POST", headers: { authorization: "Bearer " + fixture.token, "content-type": "application/json" },
    body: JSON.stringify({ sessionId: firstBody.sessionId })
  }), env, fixture);
  assert.equal(completed.status, 200);
  assert.equal(session.status, "RELEASED");
  assert.equal(session.release_reason, "RUNNER_RECONCILIATION_COMPLETE");
  assert.equal((await start()).status, 201);
});

test("operator can inspect and explicitly release a stale runner session with exact ID and reason", async () => {
  let session = { session_id: "stale-session", worker_id: "runner-one", status: "ACTIVE", started_at: "2026-11-08T00:00:00.000Z", completed_at: null, release_reason: null };
  const db = {
    prepare(sql) {
      return {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() { return session ? { ...session } : null; },
        async run() {
          const [completedAt, reason, sessionId] = this.args;
          if (!session || session.status !== "ACTIVE" || session.session_id !== sessionId) return { meta: { changes: 0 } };
          session = { ...session, status: "RELEASED", completed_at: completedAt, release_reason: reason };
          return { meta: { changes: 1 } };
        }
      };
    }
  };
  const env = { DASHBOARD_OPERATOR_TOKEN: "o".repeat(32), STATE_DB: db };
  const status = await handleRequest(new Request("https://state.example/api/runner/session/status", {
    headers: { "x-operator-token": "o".repeat(32) }
  }), env);
  assert.equal((await status.json()).active, true);
  const release = await handleRequest(new Request("https://state.example/api/runner/session/release", {
    method: "POST",
    headers: { "x-operator-token": "o".repeat(32), "content-type": "application/json" },
    body: JSON.stringify({ sessionId: "stale-session", reason: "Owner inspected the failed workflow and verified no active process remains." })
  }), env);
  assert.equal(release.status, 200);
  assert.equal(session.status, "RELEASED");
  assert.match(session.release_reason, /Owner inspected/);
});


test("private R2 artifact upload requires an exact generated receipt and completes a resumable multipart object", async () => {
  const fixture = await createRunnerOidcFixture();
  const digest = "a".repeat(64);
  const job = {
    kind: "CONTENT_PRODUCTION", id: "job-r2-001", state: "GENERATED",
    outputArtifacts: [{ path: "media/generated-video.mp4", sha256: digest }],
    thumbnailArtifact: { path: "media/generated-thumbnail.jpg", sha256: "b".repeat(64) },
    metadataPath: "content/generated-metadata.json", metadataVersion: "c".repeat(64)
  };
  const state = { ...validState(), jobs: [job] };
  const artifactRows = new Map();
  const partRows = new Map();
  let uploadedPart = null;
  const database = {
    prepare(sql) {
      return {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          if (sql.includes("FROM dashboard_state")) return { revision: 4, state_json: JSON.stringify(state), updated_at: "2026-11-08T00:00:00.000Z" };
          if (sql.includes("FROM runner_artifacts WHERE job_id")) {
            return [...artifactRows.values()].find(row => row.job_id === this.args[0] && row.source_path === this.args[1] && row.sha256 === this.args[2]) ?? null;
          }
          if (sql.includes("SUM(size_bytes)")) return { total_bytes: 0 };
          if (sql.includes("FROM runner_artifacts WHERE artifact_id")) return artifactRows.get(this.args[0]) ?? null;
          return null;
        },
        async all() {
          if (sql.includes("FROM runner_artifact_parts")) {
            return { results: [...(partRows.get(this.args[0]) ?? new Map()).entries()].map(([part_number, etag]) => ({ part_number, etag })) };
          }
          if (sql.includes("FROM runner_artifacts WHERE job_id")) {
            return { results: [...artifactRows.values()].filter(row => row.job_id === this.args[0]) };
          }
          return { results: [] };
        },
        async run() {
          if (sql.startsWith("INSERT INTO runner_artifacts")) {
            const [artifact_id, job_id, source_path, artifact_kind, filename, object_key, upload_id, sha256, size_bytes, part_size_bytes, expected_parts, content_type, created_at] = this.args;
            artifactRows.set(artifact_id, { artifact_id, job_id, source_path, artifact_kind, filename, object_key, upload_id, sha256, size_bytes, part_size_bytes, expected_parts, content_type, status: "UPLOADING", created_at, completed_at: null });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith("INSERT INTO runner_artifact_parts")) {
            const [artifactId, partNumber, etag] = this.args;
            if (!partRows.has(artifactId)) partRows.set(artifactId, new Map());
            partRows.get(artifactId).set(partNumber, etag);
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith("UPDATE runner_artifacts SET status = 'READY'")) {
            const [etag, completedAt, artifactId] = this.args;
            const row = artifactRows.get(artifactId);
            if (row) Object.assign(row, { status: "READY", etag, completed_at: completedAt });
            return { meta: { changes: row ? 1 : 0 } };
          }
          return { meta: { changes: 1 } };
        }
      };
    }
  };
  const r2 = {
    async list() { return { objects: [], truncated: false }; },
    async createMultipartUpload(key, options) {
      assert.equal(key, "jobs/job-r2-001/" + digest + "/generated-video.mp4");
      assert.equal(options.customMetadata.sha256, digest);
      return { key, uploadId: "upload-r2-1", async abort() {} };
    },
    resumeMultipartUpload(key, uploadId) {
      assert.equal(uploadId, "upload-r2-1");
      return {
        async uploadPart(partNumber, body) {
          uploadedPart = { partNumber, bytes: await new Response(body).arrayBuffer() };
          return { partNumber, etag: "part-etag-1" };
        },
        async complete(parts) {
          assert.deepEqual(parts, [{ partNumber: 1, etag: "part-etag-1" }]);
          return { size: 5, httpEtag: "object-etag" };
        }
      };
    },
    async get(key) {
      return {
        size: 5, httpEtag: "object-etag", customMetadata: { sha256: digest },
        body: new Response("video").body,
        writeHttpMetadata(headers) { headers.set("content-type", "video/mp4"); }
      };
    }
  };
  const env = {
    DASHBOARD_OPERATOR_TOKEN: "o".repeat(32),
    STATE_DB: database,
    ARTIFACTS: r2
  };
  const call = (url, method = "GET", body, headers = {}) => handleRequest(new Request("https://state.example" + url, {
    method, headers: { authorization: "Bearer " + fixture.token, ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body)
  }), env, fixture);
  const create = await call("/api/runner/artifacts/create", "POST", {
    jobId: job.id, sourcePath: "media/generated-video.mp4", artifactKind: "video",
    sha256: digest, sizeBytes: 5, contentType: "video/mp4"
  });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.equal(created.status, "UPLOADING");
  const badReceipt = await call("/api/runner/artifacts/create", "POST", {
    jobId: job.id, sourcePath: "media/other.mp4", artifactKind: "video",
    sha256: digest, sizeBytes: 5, contentType: "video/mp4"
  });
  assert.equal(badReceipt.status, 409);
  const part = await handleRequest(new Request("https://state.example/api/runner/artifacts/part?artifactId=" + created.artifactId + "&partNumber=1", {
    method: "PUT", headers: {
      authorization: "Bearer " + fixture.token, "content-type": "application/octet-stream", "content-length": "5"
    }, body: new Uint8Array([1, 2, 3, 4, 5])
  }), env, fixture);
  assert.equal(part.status, 200);
  assert.equal(uploadedPart.partNumber, 1);
  const complete = await call("/api/runner/artifacts/complete", "POST", { artifactId: created.artifactId });
  assert.equal(complete.status, 201);
  assert.equal((await complete.json()).status, "READY");
  const list = await handleRequest(new Request("https://state.example/api/artifacts?jobId=" + job.id, {
    headers: { "x-operator-token": "o".repeat(32) }
  }), env);
  assert.equal(list.status, 200);
  assert.equal((await list.json()).artifacts[0].status, "READY");
  const download = await handleRequest(new Request("https://state.example/api/artifacts/" + created.artifactId + "/download", {
    headers: { "x-operator-token": "o".repeat(32) }
  }), env);
  assert.equal(download.status, 200);
  assert.equal(await download.text(), "video");
  assert.equal(download.headers.get("x-artifact-sha256"), digest);
});

test("private R2 artifact creation rejects unbound SHA, unsafe paths and storage over-budget", async () => {
  const fixture = await createRunnerOidcFixture();
  const digest = "a".repeat(64);
  const job = { kind: "CONTENT_PRODUCTION", id: "job-r2-002", state: "GENERATED", outputArtifacts: [{ path: "media/a.mp4", sha256: digest }] };
  const state = { ...validState(), jobs: [job] };
  const database = {
    prepare(sql) {
      return {
        args: [], bind(...args) { this.args = args; return this; },
        async first() {
          if (sql.includes("FROM dashboard_state")) return { revision: 1, state_json: JSON.stringify(state), updated_at: "2026-11-08T00:00:00.000Z" };
          if (sql.includes("FROM runner_artifacts WHERE job_id")) return null;
          if (sql.includes("SUM(size_bytes)")) return { total_bytes: 0 };
          return null;
        },
        async run() { return { meta: { changes: 1 } }; }
      };
    }
  };
  const env = { STATE_DB: database, ARTIFACTS: { async list() { return { objects: [{ size: 8 * 1024 * 1024 * 1024 }], truncated: false }; }, async put() {}, async get() {}, async delete() {}, async createMultipartUpload() { throw new Error("must not create"); } } };
  const send = body => handleRequest(new Request("https://state.example/api/runner/artifacts/create", {
    method: "POST", headers: { authorization: "Bearer " + fixture.token, "content-type": "application/json" },
    body: JSON.stringify(body)
  }), env, fixture);
  const mismatch = await send({ jobId: job.id, sourcePath: "media/other.mp4", artifactKind: "video", sha256: digest, sizeBytes: 1, contentType: "video/mp4" });
  assert.equal(mismatch.status, 409);
  const unsafe = await send({ jobId: job.id, sourcePath: "../media/a.mp4", artifactKind: "video", sha256: digest, sizeBytes: 1, contentType: "video/mp4" });
  assert.equal(unsafe.status, 400);
  const overBudget = await send({ jobId: job.id, sourcePath: "media/a.mp4", artifactKind: "video", sha256: digest, sizeBytes: 1, contentType: "video/mp4" });
  assert.equal(overBudget.status, 413);
});


test("repository runner preflight proves private R2 write/read/delete and enforces 2 GiB free-tier headroom", async () => {
  const fixture = await createRunnerOidcFixture();
  const calls = [];
  const database = {
    prepare() {
      return { bind() { return this; }, async first() { return { total_bytes: 1024 }; } };
    }
  };
  const env = {
    STATE_DB: database,
    ARTIFACTS: {
      async list() { return { objects: [], truncated: false }; },
      async put(key, value, options) { calls.push(["put", key, value, options.customMetadata.purpose]); },
      async get(key) { calls.push(["get", key]); return { async text() { return calls[0][2]; } }; },
      async delete(key) { calls.push(["delete", key]); }
    }
  };
  const response = await handleRequest(new Request("https://state.example/api/runner/ready", {
    headers: { authorization: "Bearer " + fixture.token }
  }), env, fixture);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ready, true);
  assert.equal(body.storageProvider, "Cloudflare R2 Standard");
  assert.ok(body.remainingBytes >= 2 * 1024 * 1024 * 1024);
  assert.deepEqual(calls.map(call => call[0]), ["put", "get", "delete"]);
});

test("repository runner preflight blocks production when private R2 headroom is below 2 GiB", async () => {
  const fixture = await createRunnerOidcFixture();
  let writes = 0;
  const env = {
    STATE_DB: { prepare() { return { bind() { return this; }, async first() { return { total_bytes: 0 }; } }; } },
    ARTIFACTS: { async list() { return { objects: [{ size: 8 * 1024 * 1024 * 1024 - 2 * 1024 * 1024 * 1024 + 1 }], truncated: false }; }, async put() { writes++; }, async get() {}, async delete() {} }
  };
  const response = await handleRequest(new Request("https://state.example/api/runner/ready", {
    headers: { authorization: "Bearer " + fixture.token }
  }), env, fixture);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "R2_ARTIFACT_HEADROOM_LOW");
  assert.equal(writes, 0);
});


test("dashboard job cards list private R2 artifacts and download them through operator authentication", () => {
  const html = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
  assert.ok(html.includes('api("/api/artifacts?jobId="'));
  assert.ok(html.includes('data-artifact-download='));
  assert.ok(html.includes('"/api/artifacts/"+encodeURIComponent(button.dataset.artifactDownload)+"/download"'));
  assert.ok(html.includes('"x-operator-token":$("token").value'));
});


test("dashboard inline JavaScript remains syntactically valid after artifact controls are added", () => {
  const html = readFileSync(new URL("../public/dashboard.html", import.meta.url), "utf8");
  const scripts = [];
  let cursor = 0;
  while (true) {
    const start = html.indexOf("<script", cursor);
    if (start < 0) break;
    const contentStart = html.indexOf(">", start) + 1;
    const end = html.indexOf("</script>", contentStart);
    assert.ok(contentStart > start && end >= contentStart, "script tag must be closed");
    scripts.push(html.slice(contentStart, end));
    cursor = end + "</script>".length;
  }
  assert.ok(scripts.length > 0);
  for (const source of scripts) assert.doesNotThrow(() => new Script(source));
});
