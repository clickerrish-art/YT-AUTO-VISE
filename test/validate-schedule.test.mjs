import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const copiedFiles = [
  "config/weekly-content-plan.json",
  "content/queue.json",
  ".github/workflows/generate-long-form-narration.yml",
  ".github/workflows/free-narration-artifact.yml"
];

test("authoritative schedule validator accepts the configured draft-only cadence with 72-hour spacing", () => {
  const result = spawnSync(process.execPath, ["scripts/validate-schedule.mjs"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /PASS: two draft-only weekly slots/);
});

function runWithPlanMutation(mutate) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-schedule-"));
  try {
    for (const file of copiedFiles) {
      const target = path.join(temp, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(repoRoot, file), target);
    }
    const planPath = path.join(temp, "config/weekly-content-plan.json");
    const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
    mutate(plan);
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    return spawnSync(process.execPath, [path.join(repoRoot, "scripts/validate-schedule.mjs")], { cwd: temp, encoding: "utf8" });
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

test("schedule validator rejects any weekly gap shorter than 72 full hours", () => {
  const result = runWithPlanMutation(plan => {
    plan.schedule[1].day = "Thursday";
    plan.schedule[1].cronUtc = "0 15 * * 4";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /publication spacing between Tuesday and Thursday is 48.00 hours; minimum is 72 full hours/);
});

test("schedule validator rejects incorrect weekday and UTC time", () => {
  const weekday = runWithPlanMutation(plan => { plan.schedule[0].day = "Wednesday"; });
  assert.notEqual(weekday.status, 0);
  assert.match(weekday.stderr, /schedule missing Tuesday/);
  const time = runWithPlanMutation(plan => { plan.schedule[0].cronUtc = "0 16 * * 2"; });
  assert.notEqual(time.status, 0);
  assert.match(time.stderr, /Tuesday cronUtc must be 0 15 \* \* 2/);
});

test("schedule validator rejects wrong format, duration and unsafe publishing", () => {
  const format = runWithPlanMutation(plan => { plan.schedule[0].format = "short"; });
  assert.notEqual(format.status, 0);
  assert.match(format.stderr, /Tuesday format must be long_form/);
  const duration = runWithPlanMutation(plan => { plan.schedule[1].targetDurationSeconds.max = 75; });
  assert.notEqual(duration.status, 0);
  assert.match(duration.stderr, /Saturday Short must target 50–60 seconds/);
  const publishing = runWithPlanMutation(plan => { plan.publishingEnabled = true; });
  assert.notEqual(publishing.status, 0);
  assert.match(publishing.stderr, /publishing must remain disabled/);
});
