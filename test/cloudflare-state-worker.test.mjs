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
