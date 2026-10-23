import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("authoritative schedule validator accepts the configured draft-only cadence", () => {
  const result = spawnSync(process.execPath, ["scripts/validate-schedule.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PASS: authoritative schedule/);
});
