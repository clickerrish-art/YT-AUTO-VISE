import test from "node:test";
import assert from "node:assert/strict";
import { createCloudflareAccessHeaders } from "../scripts/cloudflare-access-headers.mjs";

test("Cloudflare Access identity headers cannot be overridden by caller headers", () => {
  const headers = createCloudflareAccessHeaders("trusted-client-id", "trusted-client-secret", {
    "CF-Access-Client-Id": "attacker-client-id",
    "cf-access-client-secret": "attacker-client-secret",
    "x-operator-token": "operator-token"
  });

  assert.equal(headers.get("cf-access-client-id"), "trusted-client-id");
  assert.equal(headers.get("cf-access-client-secret"), "trusted-client-secret");
  assert.equal(headers.get("x-operator-token"), "operator-token");
  assert.equal(headers.get("accept"), "application/json");
});

test("Cloudflare Access headers fail closed when either credential is missing", () => {
  assert.throws(() => createCloudflareAccessHeaders("", "secret"), /client ID is required/);
  assert.throws(() => createCloudflareAccessHeaders("client", ""), /client secret is required/);
});
