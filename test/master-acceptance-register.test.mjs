import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const register = JSON.parse(fs.readFileSync(
  path.join(root, "docs", "REQUIREMENTS_ACCEPTANCE_REGISTER.json"),
  "utf8"
));
const rows = register.requirements;
const byId = id => rows.find(row => row.id === id);

test("master acceptance register totals reconcile to all 89 requirements", () => {
  assert.equal(rows.length, 89);
  const counts = rows.reduce((result, row) => {
    result[row.status] = (result[row.status] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, { PASS: 71, NOT_TESTED: 8, BLOCKED: 10 });
});

test("the owner-approved rolling publication cadence is no longer marked blocked", () => {
  const cadence = byId("SCHED-003");
  assert.equal(cadence.status, "PASS");
  assert.equal(cadence.currentHeadStatus, "PASS");
  assert.match(cadence.currentHeadEvidenceNote, /2026-11-18T16:27:44Z/);
  assert.match(cadence.currentHeadEvidenceNote, /long_form.*long_form.*short/i);
  assert.match(cadence.currentHeadEvidenceNote, /72 elapsed hours/);
  assert.match(cadence.currentHeadEvidenceNote, /Africa\/Johannesburg/);
  assert.match(cadence.currentHeadEvidenceNote, /no weekly target/i);
});

test("API and dashboard acceptance statuses retain their exact evidence boundaries", () => {
  const api = byId("API-001");
  assert.equal(api.status, "BLOCKED");
  assert.equal(api.currentHeadEvidenceSha, "e9cc56ba3a1a3ca37a73d78a1fcc679b9d2c13f3");
  assert.match(api.currentHeadEvidenceNote, /42\/42 authorized application-level positive routes PASS/);
  assert.match(api.currentHeadEvidenceNote, /48\/48 protected API routes/);
  assert.match(api.currentHeadEvidenceNote, /six provider\/production routes remain BLOCKED/);

  const dashboard = byId("DASH-001");
  assert.equal(dashboard.status, "NOT_TESTED");
  assert.equal(dashboard.currentHeadEvidenceSha, "71fe8547bbb605ed258aafa080cd5061b201ec16");
  assert.match(dashboard.currentHeadEvidenceNote, /39\/39 Chromium journeys passed/);
  assert.match(dashboard.currentHeadEvidenceNote, /121 controls and 17 forms/);
  assert.match(dashboard.currentHeadEvidenceNote, /23 maxlength controls/);
});

test("Nature Frontiers stays blocked after read-only Metricool reconciliation", () => {
  const meta = byId("META-001");
  assert.equal(meta.status, "BLOCKED");
  assert.match(meta.currentHeadEvidenceNote, /zero future scheduled posts/);
  assert.match(meta.currentHeadEvidenceNote, /five Facebook/);
  assert.match(meta.currentHeadEvidenceNote, /zero Instagram/);
  assert.match(meta.currentHeadEvidenceNote, /SonicVhibez/);
  assert.match(meta.nextAction, /Keep publishing disabled/);
});


test("worker dispatch backoff failure is fail-closed while live runtime remains blocked", () => {
  const worker = byId("SCHED-WORKER-DISPATCH-001");
  assert.equal(worker.status, "NOT_TESTED");
  assert.equal(worker.currentHeadStatus, "NOT_TESTED");
  assert.equal(worker.currentHeadEvidenceSha, "71741365f54d3a4a7dda52e7bd12715a06c32453");
  assert.match(worker.currentHeadEvidenceNote, /HTTP 409 preflight cooldown/);
  assert.match(worker.currentHeadEvidenceNote, /failed cooldown persistence causing a non-retryable stop and retained process lock/);
  assert.match(worker.currentHeadEvidenceNote, /Live worker dispatch remains NOT_TESTED/);

  const scheduler = byId("SCHED-001");
  assert.equal(scheduler.status, "NOT_TESTED");
  assert.match(scheduler.currentHeadEvidenceNote, /complete current authenticated public\/private\/unlisted channel history/);
});

test("master completion register mirrors the acceptance totals and release hold", () => {
  const master = fs.readFileSync(
    path.join(root, "docs", "MASTER_PRODUCTION_COMPLETION_REGISTER.md"),
    "utf8"
  );
  assert.match(master, /71 PASS \/ 8 NOT_TESTED \/ 10 BLOCKED \/ 0 FAIL/);
  assert.match(master, /Release decision:\s*\*\*HOLD\*\*/);
});
