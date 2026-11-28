import test from "node:test";
import assert from "node:assert/strict";
import {
  assertRequiredYoutubeOAuthScopes,
  youtubeOAuthScopeStatus,
  REQUIRED_YOUTUBE_OAUTH_SCOPES
} from "../scripts/youtube-oauth-scope.mjs";

const uploadScope = "https://www.googleapis.com/auth/youtube.upload";
const readOnlyScope = "https://www.googleapis.com/auth/youtube.readonly";

test("both exact YouTube OAuth scopes are mandatory and pass together", () => {
  const status = youtubeOAuthScopeStatus({ scopes: ["openid", uploadScope, readOnlyScope] });
  assert.equal(status.allowed, true);
  assert.deepEqual(status.missingScopes, []);
  assert.deepEqual(status.requiredScopes, [uploadScope, readOnlyScope]);
  assert.deepEqual(assertRequiredYoutubeOAuthScopes({ scopes: [uploadScope, readOnlyScope] }).missingScopes, []);
});

test("missing youtube.upload fails even when youtube.readonly is granted", () => {
  const tokenInfo = { scopes: [readOnlyScope] };
  const status = youtubeOAuthScopeStatus(tokenInfo);
  assert.equal(status.allowed, false);
  assert.deepEqual(status.missingScopes, [uploadScope]);
  assert.throws(() => assertRequiredYoutubeOAuthScopes(tokenInfo), new RegExp(uploadScope.replaceAll(".", "\\.")));
});

test("missing youtube.readonly fails even when youtube.upload is granted", () => {
  const tokenInfo = { scopes: [uploadScope] };
  const status = youtubeOAuthScopeStatus(tokenInfo);
  assert.equal(status.allowed, false);
  assert.deepEqual(status.missingScopes, [readOnlyScope]);
  assert.throws(() => assertRequiredYoutubeOAuthScopes(tokenInfo), new RegExp(readOnlyScope.replaceAll(".", "\\.")));
});

test("missing, malformed, or unrelated scope information fails closed", () => {
  for (const value of [undefined, null, {}, { scopes: "youtube.upload youtube.readonly" }, { scopes: [] }, { scopes: ["openid"] }]) {
    assert.equal(youtubeOAuthScopeStatus(value).allowed, false);
    assert.throws(() => assertRequiredYoutubeOAuthScopes(value), /missing required OAuth scope/);
  }
});

test("scope status reports only the granted YouTube scopes without accepting substitutes", () => {
  const status = youtubeOAuthScopeStatus({ scopes: [uploadScope, readOnlyScope, "https://www.googleapis.com/auth/youtube"] });
  assert.equal(status.allowed, true);
  assert.deepEqual(status.grantedYouTubeScopes, [uploadScope, readOnlyScope, "https://www.googleapis.com/auth/youtube"]);
  assert.deepEqual(REQUIRED_YOUTUBE_OAUTH_SCOPES, [uploadScope, readOnlyScope]);
});
