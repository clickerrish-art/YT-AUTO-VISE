import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("private uploader refuses to run without YouTube credentials", () => {
  const env = { ...process.env };
  for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) delete env[key];
  const result = spawnSync(process.execPath, ["scripts/upload-private.mjs"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required environment variables/);
});

test("private uploader runs media preflight before any YouTube insert", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  assert.match(source, /scripts\/preflight-media\.mjs/);
  assert.match(source, /mediaPreflight\.stdout\.includes\("PASS:"\)/);
  assert.ok(source.indexOf("mediaPreflight.stdout.trim()") < source.indexOf("youtube.videos.insert"));
});

test("uploader verifies authenticated channel ID and exact channel name before upload", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  assert.match(source, /youtube\.channels\.list\(\{ part: \[\"id\", \"snippet\"\], mine: true \}\)/);
  assert.match(source, /matchedChannel\.snippet\?\.title !== \"SonicVhibez\"/);
  assert.match(source, /metadata\.channelId !== expectedChannelId/);
  assert.ok(source.indexOf("matchedChannel.snippet?.title !== \"SonicVhibez\"") < source.indexOf("youtube.videos.insert"));
  assert.match(source, /privacyStatus: \"private\"/);
});
