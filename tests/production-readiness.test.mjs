import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("readiness report identifies blockers, preserves safety defaults, and exits non-zero", () => {
  const env = { ...process.env };
  for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) delete env[key];
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.equal(result.status, 2);
  assert.match(result.stdout, /SonicVhibez production readiness/);
  assert.match(result.stdout, /LIVE BLOCKER: complete SonicVhibez public, private and unlisted history/);
  assert.match(result.stdout, /HOLD:/);
  assert.match(result.stdout, /public publishing disabled/);
  assert.match(result.stdout, /content\/render-manifest\.json/);
  assert.match(result.stdout, /long-form-render-manifest/);
  assert.match(result.stdout, /Metadata complianceReviewed must be true/);
  assert.match(result.stdout, /verified SonicVhibez YouTube channel ID/);
  assert.match(result.stdout, /YOUTUBE_CLIENT_ID/);
  assert.match(result.stdout, /never uploads, schedules, or publishes/i);
});

test("readiness JSON exposes stable blocker IDs, severity, evidence and actionable resolution without side effects", () => {
  const env = { ...process.env };
  for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) delete env[key];
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.equal(report.application, "SonicVhibez Marketing Machine");
  assert.equal(report.mode, "read-only");
  assert.equal(report.status, "blocked");
  assert.ok(report.blockerCount > 0);
  assert.equal(report.blockers.length, report.blockerCount);
  for (const blocker of report.blockers) {
    assert.match(blocker.id, /^RDY-[A-F0-9]{12}$/);
    assert.ok(["critical", "high"].includes(blocker.severity));
    assert.equal(typeof blocker.message, "string");
    assert.equal(blocker.evidence.kind, "readiness-check-finding");
    assert.equal(typeof blocker.evidence.observed, "string");
    assert.ok(blocker.resolution.length > 20);
  }
  assert.ok(report.blockers.some(blocker => /SonicVhibez public, private and unlisted history/.test(blocker.message)));
  assert.ok(report.limitations.some(item => /never uploads/.test(item)));
});
