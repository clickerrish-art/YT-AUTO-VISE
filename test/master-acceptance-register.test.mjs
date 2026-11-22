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
  assert.equal(api.currentHeadEvidenceSha, "648d3e0f1339a53cc73086afd949d50ca72536f0");
  assert.match(api.currentHeadEvidenceNote, /41\/50 PASS, 2\/50 NOT_TESTED/);
  assert.match(api.currentHeadEvidenceNote, /50\/50 protected API routes/);
  assert.match(api.currentHeadEvidenceNote, /7\\/50 BLOCKED by owner\\/provider prerequisites/);
  assert.equal(register.latestExactCiCheckpoint.exactSourceTestSha, "fae3bf58270b1ffecb038ea0c9a40be0bd340f9");
  assert.equal(register.latestExactCiCheckpoint.nodeTests.passed, 1107);
  assert.equal(register.latestExactCiCheckpoint.nodeTests.failed, 0);
  assert.equal(register.latestExactCiCheckpoint.nodeTests.skipped, 0);
  assert.equal(register.latestExactCiCheckpoint.browserE2EStatus, "PASS");

  const dashboard = byId("DASH-001");
  assert.equal(dashboard.status, "NOT_TESTED");
  assert.equal(dashboard.currentHeadStatus, "NOT_TESTED");
  assert.equal(dashboard.currentHeadEvidenceSha, "fae3bf58270b1ffecb038ea0c9a40be0bd340f9");
  assert.match(dashboard.currentHeadEvidenceNote, /121\/121 controls/);
  assert.match(dashboard.currentHeadEvidenceNote, /17\/17 forms/);
  assert.match(dashboard.currentHeadEvidenceNote, /15\/15 cross-cutting dimensions/);
  assert.match(dashboard.currentHeadEvidenceNote, /41\/41 Chromium journeys/);
  assert.match(dashboard.currentHeadEvidenceNote, /overallAcceptance is NOT_TESTED/);

  const state = byId("STATE-001");
  assert.equal(state.status, "PASS");
  assert.equal(state.currentHeadEvidenceSha, "fae3bf58270b1ffecb038ea0c9a40be0bd340f9");
  assert.match(state.currentHeadEvidenceNote, /deployment recovery smoke/);
  assert.match(state.currentHeadEvidenceNote, /runner-bridge safety/);

  const worker = byId("SCHED-WORKER-DISPATCH-001");
  assert.equal(worker.status, "NOT_TESTED");
  assert.equal(worker.currentHeadEvidenceSha, "fae3bf58270b1ffecb038ea0c9a40be0bd340f9");
  assert.match(worker.currentHeadEvidenceNote, /all 38 test\/worker-runner\.test\.mjs cases/);
  assert.match(worker.currentHeadEvidenceNote, /retained process lock when cooldown persistence fails/);
  assert.match(worker.currentHeadEvidenceNote, /Live worker dispatch remains NOT_TESTED/);

  const scheduler = byId("SCHED-001");
  assert.equal(scheduler.status, "NOT_TESTED");
  assert.equal(scheduler.currentHeadEvidenceSha, "fae3bf58270b1ffecb038ea0c9a40be0bd340f9");
  assert.match(scheduler.currentHeadEvidenceNote, /manual\/local\/third-party attempt attestation/);
  assert.match(scheduler.nextAction, /fresh owner attestation/);

  const deployment = byId("DEPLOY-001");
  assert.equal(deployment.status, "NOT_TESTED");
  assert.equal(deployment.currentHeadEvidenceSha, "fae3bf58270b1ffecb038ea0c9a40be0bd340f9");
  assert.match(deployment.currentHeadEvidenceNote, /No SonicVhibez production render\/publisher Worker/);
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
  assert.equal(worker.currentHeadEvidenceSha, "fae3bf58270b1ffecb038ea0c9a40be0bd340f9");
  assert.match(worker.currentHeadEvidenceNote, /persisted HTTP 409 preflight cooldown across restart/);
  assert.match(worker.currentHeadEvidenceNote, /fail-stop with retained process lock when cooldown persistence fails/);
  assert.match(worker.currentHeadEvidenceNote, /Live worker dispatch remains NOT_TESTED/);

  const scheduler = byId("SCHED-001");
  assert.equal(scheduler.status, "NOT_TESTED");
  assert.match(scheduler.currentHeadEvidenceNote, /complete one-page inventory of one public 20-second legacy Short with zero private\/unlisted videos/);
  assert.match(scheduler.nextAction, /fresh owner attestation/);
});

test("master completion register mirrors the acceptance totals and release hold", () => {
  const master = fs.readFileSync(
    path.join(root, "docs", "MASTER_PRODUCTION_COMPLETION_REGISTER.md"),
    "utf8"
  );
  assert.ok(master.includes("71 PASS / 8 NOT_TESTED / 10 BLOCKED / 0 FAIL"));
  assert.match(master, /\*\*DASH-001:\s*NOT_TESTED\.\*\*/);
  assert.doesNotMatch(master, /\$\{(?:run|url)\./);
  assert.match(master, /Release decision:\s*\*\*HOLD\*\*/);
});
