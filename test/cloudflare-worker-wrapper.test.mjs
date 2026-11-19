import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../cloudflare/worker.js";

const TOKEN = "test-operator-token-that-is-long-enough";
const env = (overrides = {}) => ({
  DASHBOARD_OPERATOR_TOKEN: TOKEN,
  DASHBOARD_OPERATOR_ID: "sonicvhibez-owner",
  ...overrides
});

const request = (path, method = "GET", headers = {}) => new Request(
  `https://worker.test${path}`,
  { method, headers }
);

test("runner bridge API is wired but disabled by default", async () => {
  let outboundFetches = 0;
  const response = await handleRequest(
    request("/api/runner/ready"),
    env(),
    { fetchImpl: async () => { outboundFetches += 1; throw new Error("unexpected network call"); } }
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "RUNNER_OIDC_DISABLED");
  assert.equal(body.publishingEnabled, false);
  assert.equal(outboundFetches, 0);
});

test("enabling the runner gate still requires a valid GitHub OIDC token", async () => {
  let outboundFetches = 0;
  const response = await handleRequest(
    request("/api/runner/ready", "GET", { authorization: "Bearer invalid" }),
    env({ RUNNER_OIDC_ENABLED: "true" }),
    { fetchImpl: async () => { outboundFetches += 1; throw new Error("malformed token must not fetch JWKS"); } }
  );
  assert.equal(response.status, 401);
  assert.equal(outboundFetches, 0);
});

test("provider publishing remains fail-closed and makes no outbound request", async () => {
  let outboundFetches = 0;
  const response = await handleRequest(
    request("/api/facebook/publish", "POST", { "x-operator-token": TOKEN, "content-type": "application/json" }),
    env(),
    { fetchImpl: async () => { outboundFetches += 1; throw new Error("provider call must remain blocked"); } }
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "EXTERNAL_PROVIDER_NOT_CONNECTED");
  assert.equal(body.publishingEnabled, false);
  assert.equal(outboundFetches, 0);
});

test("production job execution remains blocked until repository runner is connected", async () => {
  const response = await handleRequest(
    request("/api/jobs/produce", "POST", { "x-operator-token": TOKEN, "content-type": "application/json" }),
    env()
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "REPOSITORY_RUNNER_NOT_CONNECTED");
  assert.equal(body.publishingEnabled, false);
});
