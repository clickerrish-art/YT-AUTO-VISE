import test from "node:test";
import assert from "node:assert/strict";
import {
  assertYoutubeVideoInsertScope,
  youtubeVideoInsertScopeStatus
} from "../scripts/youtube-oauth-scope.mjs";

const acceptedScopes = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtubepartner"
];

test("YouTube videos.insert accepts only documented upload-capable OAuth scopes", () => {
  for (const scope of acceptedScopes) {
    const status = youtubeVideoInsertScopeStatus({ scopes: ["openid", scope] });
    assert.equal(status.allowed, true);
    assert.equal(status.acceptedScope, scope);
    assert.deepEqual(status.grantedYouTubeScopes, [scope]);
    assert.equal(assertYoutubeVideoInsertScope({ scopes: [scope] }).allowed, true);
  }
});

test("read-only YouTube scope is insufficient for videos.insert", () => {
  const status = youtubeVideoInsertScopeStatus({
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"]
  });
  assert.equal(status.allowed, false);
  assert.equal(status.acceptedScope, null);
  assert.throws(
    () => assertYoutubeVideoInsertScope({ scopes: ["https://www.googleapis.com/auth/youtube.readonly"] }),
    /lacks an OAuth scope accepted by YouTube videos\.insert/
  );
});

test("missing or malformed token scope information fails closed", () => {
  for (const value of [undefined, null, {}, { scopes: "youtube.upload" }, { scopes: [] }]) {
    assert.equal(youtubeVideoInsertScopeStatus(value).allowed, false);
    assert.throws(() => assertYoutubeVideoInsertScope(value), /lacks an OAuth scope accepted/);
  }
});
