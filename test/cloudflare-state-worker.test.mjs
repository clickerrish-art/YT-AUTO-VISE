import test from "node:test";
import assert from "node:assert/strict";
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
  assert.throws(() => validateDashboardState(safari), /Safari affiliate campaigns must remain inactive/);
});

test("accepts legacy state without optional Facebook arrays without inventing them", () => {
  const legacy = validState();
  delete legacy.facebookDrafts;
  delete legacy.facebookPosts;
  delete legacy.facebookAttempts;
  assert.equal(validateDashboardState(legacy).facebookDrafts, undefined);
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
