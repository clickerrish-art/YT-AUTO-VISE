import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDashboardState, toDashboardStateResponse } from "../cloudflare/dashboard-state-compat.js";
import { authenticate, constantTimeEqual, handleRequest, operatorIdentity, validateDashboardState } from "../cloudflare/worker.js";

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
  assert.equal(response.schedule, null);
  assert.equal(response.uploadLedger, null);
  assert.equal(response.campaignValidation.ok, false);
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
