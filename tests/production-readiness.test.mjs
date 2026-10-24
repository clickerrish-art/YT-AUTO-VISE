import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("readiness report identifies blockers without enabling publishing or failing CI", () => {
  const env = { ...process.env };
  for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) delete env[key];
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /SonicVhibez production readiness/);
  assert.match(result.stdout, /HOLD:/);
  assert.match(result.stdout, /public publishing disabled/);
  assert.match(result.stdout, /content\/render-manifest\.json/);
  assert.match(result.stdout, /long-form-render-manifest/);
  assert.match(result.stdout, /Metadata complianceReviewed must be true/);
  assert.match(result.stdout, /verified SonicVhibez YouTube channel ID/);
  assert.match(result.stdout, /YOUTUBE_CLIENT_ID/);
  assert.match(result.stdout, /never uploads, schedules, or publishes/i);
});
