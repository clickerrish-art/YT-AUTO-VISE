import assert from "node:assert/strict";
import test from "node:test";
import { buildCloudflareAccessHeaders } from "../scripts/cloudflare-access-auth.mjs";

test("Cloudflare Access headers require and return the complete service-token pair", () => {
  assert.deepEqual(buildCloudflareAccessHeaders({
    DASHBOARD_STATE_ACCESS_CLIENT_ID: "service-token-id.access",
    DASHBOARD_STATE_ACCESS_CLIENT_SECRET: "service-token-secret"
  }), {
    "cf-access-client-id": "service-token-id.access",
    "cf-access-client-secret": "service-token-secret"
  });
});

test("Cloudflare Access headers fail closed when either service-token value is missing", () => {
  assert.throws(() => buildCloudflareAccessHeaders({}), /Both DASHBOARD_STATE_ACCESS_CLIENT_ID and DASHBOARD_STATE_ACCESS_CLIENT_SECRET are required/);
  assert.throws(() => buildCloudflareAccessHeaders({
    DASHBOARD_STATE_ACCESS_CLIENT_ID: "service-token-id.access"
  }), /Both DASHBOARD_STATE_ACCESS_CLIENT_ID and DASHBOARD_STATE_ACCESS_CLIENT_SECRET are required/);
  assert.throws(() => buildCloudflareAccessHeaders({
    DASHBOARD_STATE_ACCESS_CLIENT_SECRET: "service-token-secret"
  }), /Both DASHBOARD_STATE_ACCESS_CLIENT_ID and DASHBOARD_STATE_ACCESS_CLIENT_SECRET are required/);
});

test("Cloudflare Access headers reject CR/LF header injection", () => {
  assert.throws(() => buildCloudflareAccessHeaders({
    DASHBOARD_STATE_ACCESS_CLIENT_ID: "service-token-id.access\r\nX-Evil: true",
    DASHBOARD_STATE_ACCESS_CLIENT_SECRET: "service-token-secret"
  }), /invalid header characters/);
  assert.throws(() => buildCloudflareAccessHeaders({
    DASHBOARD_STATE_ACCESS_CLIENT_ID: "service-token-id.access",
    DASHBOARD_STATE_ACCESS_CLIENT_SECRET: "secret\nforged"
  }), /invalid header characters/);
});

test("Cloudflare Access header values are trimmed without logging or exposing credentials", () => {
  assert.deepEqual(buildCloudflareAccessHeaders({
    DASHBOARD_STATE_ACCESS_CLIENT_ID: " service-token-id.access ",
    DASHBOARD_STATE_ACCESS_CLIENT_SECRET: " service-token-secret "
  }), {
    "cf-access-client-id": "service-token-id.access",
    "cf-access-client-secret": "service-token-secret"
  });
});
