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
