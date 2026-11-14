import assert from "node:assert/strict";
import test from "node:test";
import { createGitHubOidcTokenProvider } from "../scripts/github-oidc-token.mjs";

function jwt(expiresAtSeconds) {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(JSON.stringify({ exp: expiresAtSeconds })).toString("base64url");
  return header + "." + claims + "." + Buffer.alloc(100, 7).toString("base64url");
}

test("GitHub OIDC token provider requests the expected audience and caches a still-valid token", async () => {
  let nowMs = 1_800_000_000_000;
  let requests = 0;
  const getToken = createGitHubOidcTokenProvider({
    env: {
      ACTIONS_ID_TOKEN_REQUEST_URL: "https://token.actions.githubusercontent.com/_services/token",
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-token"
    },
    now: () => nowMs,
    fetchImpl: async url => {
      requests++;
      assert.equal(new URL(url).searchParams.get("audience"), "sonicvhibez-dashboard-runner");
      return new Response(JSON.stringify({ value: jwt(Math.floor(nowMs / 1000) + 300) }), {
        status: 200, headers: { "content-type": "application/json" }
      });
    }
  });
  const first = await getToken();
  const second = await getToken();
  assert.equal(first, second);
  assert.equal(requests, 1);
});

test("GitHub OIDC token provider refreshes before the cached token expires", async () => {
  let nowMs = 1_800_000_000_000;
  let requests = 0;
  const getToken = createGitHubOidcTokenProvider({
    env: {
      ACTIONS_ID_TOKEN_REQUEST_URL: "https://token.actions.githubusercontent.com/_services/token",
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-token"
    },
    now: () => nowMs,
    fetchImpl: async () => {
      requests++;
      return new Response(JSON.stringify({ value: jwt(Math.floor(nowMs / 1000) + 300) }), {
        status: 200, headers: { "content-type": "application/json" }
      });
    }
  });
  const first = await getToken();
  nowMs += 250_000;
  const second = await getToken();
  assert.notEqual(second, first);
  assert.equal(requests, 2);
});

test("GitHub OIDC token provider rejects missing credentials and untrusted request URLs", async () => {
  await assert.rejects(createGitHubOidcTokenProvider({ env: {} })(), /OIDC is unavailable/);
  await assert.rejects(createGitHubOidcTokenProvider({
    env: {
      ACTIONS_ID_TOKEN_REQUEST_URL: "http://attacker.example/token",
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-token"
    }
  })(), /request URL is not trusted/);
});

test("GitHub OIDC token provider rejects malformed and nearly expired JWTs", async () => {
  const env = {
    ACTIONS_ID_TOKEN_REQUEST_URL: "https://token.actions.githubusercontent.com/_services/token",
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-token"
  };
  const malformed = createGitHubOidcTokenProvider({
    env, fetchImpl: async () => new Response(JSON.stringify({ value: "x".repeat(160) }), {
      status: 200, headers: { "content-type": "application/json" }
    })
  });
  await assert.rejects(malformed(), /invalid JWT structure/);

  const nowMs = 1_800_000_000_000;
  const expiring = createGitHubOidcTokenProvider({
    env, now: () => nowMs,
    fetchImpl: async () => new Response(JSON.stringify({ value: jwt(Math.floor(nowMs / 1000) + 30) }), {
      status: 200, headers: { "content-type": "application/json" }
    })
  });
  await assert.rejects(expiring(), /expired or too close to expiry/);
});
