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
const exactSha = register.currentHeadSourceTestRefresh.sourceSha;
const liveHeadSha = register.dailyLiveRefresh.branchHead;

test("master acceptance register totals reconcile to all 89 requirements", () => {
  assert.equal(rows.length, 89);
  const counts = rows.reduce((result, row) => {
    result[row.status] = (result[row.status] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, { PASS: 71, NOT_TESTED: 8, BLOCKED: 10 });
  assert.equal(register.requirementStatusReevaluation.status, "NOT_REEVALUATED");
  assert.equal(register.requirementCountsStatus, "HISTORICAL_NOT_REEVALUATED");
  const refresh = register.currentHeadSourceTestRefresh;
  assert.equal(refresh.sourceSha, exactSha);
  assert.equal(refresh.rowsTotal, 89);
  assert.equal(refresh.rowsRefreshed, 89);
  assert.equal(refresh.fullRequirementReevaluation, false);
  assert.equal(refresh.externalAcceptancePromoted, 0);
  assert.deepEqual(refresh.currentHeadStatusCounts, { PASS: 68, NOT_TESTED: 8, PASS_STAGING: 1, BLOCKED: 12 });
  assert.ok(rows.every(row => /^[a-f0-9]{40}$/.test(row.currentHeadEvidenceSha ?? "")));
  assert.ok(rows.every(row => row.sourceTestEvidenceRefresh?.sourceSha === row.currentHeadEvidenceSha));
  const currentHeadStatusCounts = rows.reduce((result, row) => {
    result[row.currentHeadStatus] = (result[row.currentHeadStatus] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(currentHeadStatusCounts, register.currentHeadStatusCounts);
  assert.deepEqual(register.currentHeadStatusCounts, { PASS: 67, FAIL: 1, NOT_TESTED: 8, PASS_STAGING: 1, BLOCKED: 12 });
  assert.equal(byId("CI-002").currentHeadStatus, "FAIL");
  assert.equal(byId("CI-002").currentHeadEvidenceSha, liveHeadSha);
  assert.match(byId("CI-002").currentHeadEvidenceNote, /1,153 of 1,159 Node tests passed.*6 failed.*0 skipped/i);
  assert.equal(register.latestCurrentHeadCiObservation.exactHead, liveHeadSha);
  assert.equal(register.latestExactCiCheckpoint.branchHead, liveHeadSha);
  assert.equal(register.currentExactHeadExecution.sourceTestSha, liveHeadSha);
  assert.equal(register.latestExactCiCheckpoint.ci.automation.nodeTests, 1159);
  assert.equal(register.latestExactCiCheckpoint.ci.automation.nodeFailed, 6);
  assert.equal(register.latestExactCiCheckpoint.ci.automation.nodeSkipped, 0);
  assert.equal(register.latestExactCiCheckpoint.ci.automation.npmAuditVulnerabilities, 0);
  assert.equal(register.latestExactCiCheckpoint.ci.dashboard.status, "PASS");
  assert.equal(register.latestExactCiCheckpoint.ci.dashboard.passed, 41);
  assert.equal(register.latestExactCiCheckpoint.ci.productionReadiness.status, "HOLD");
  assert.equal(register.latestExactCiCheckpoint.ci.productionReadiness.blockers, 35);
  assert.equal(register.latestFullPassingCiCheckpoint.ci.automation.nodeTests, 1159);
  assert.equal(register.latestFullPassingCiCheckpoint.ci.automation.nodeFailed, 0);
  assert.equal(register.latestFullPassingCiCheckpoint.ci.automation.nodeSkipped, 0);
  assert.ok(register.currentHeadOpenDependencies.some(item => item.id === "ORIGINAL-WILDLIFE-FOOTAGE" && item.status === "BLOCKED"));
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
  assert.equal(api.currentHeadEvidenceSha, exactSha);
  assert.match(api.currentHeadEvidenceNote, /41\/50 PASS, 0\/50 NOT_TESTED, 9\/50 BLOCKED/);
  assert.match(api.currentHeadEvidenceNote, /50\/50 protected API routes/);
  assert.match(api.currentHeadEvidenceNote, /9\/50 BLOCKED by owner\/provider prerequisites/);
  assert.equal(api.mockedProviderDraftIntegrationStatus, "PASS");
  assert.equal(api.liveProviderAcceptance, "NOT_TESTED");
  assert.match(api.currentHeadEvidenceNote, /interrupted SUBMITTING.*concurrent reconciliation fencing/i);
  assert.match(api.nextAction, /owner-renewed Meta Page token.*exact one-shot authorization/i);
  assert.equal(register.latestExactCiCheckpoint.branchHead, liveHeadSha);
  assert.equal(register.latestExactCiCheckpoint.ci.automation.status, "FAIL");
  assert.equal(register.latestExactCiCheckpoint.ci.automation.nodeFailed, 1);
  assert.equal(register.latestExactCiCheckpoint.ci.dashboard.status, "PASS");
  assert.equal(register.latestFullPassingCiCheckpoint.ci.automation.nodeTests, 1159);
  assert.equal(register.latestFullPassingCiCheckpoint.ci.automation.nodeFailed, 0);
  assert.equal(register.latestFullPassingCiCheckpoint.ci.automation.nodeSkipped, 0);

  const dashboard = byId("DASH-001");
  assert.equal(dashboard.status, "NOT_TESTED");
  assert.equal(dashboard.currentHeadStatus, "NOT_TESTED");
  assert.equal(dashboard.currentHeadEvidenceSha, liveHeadSha);
  assert.match(dashboard.currentHeadEvidenceNote, /121\/121 controls/);
  assert.match(dashboard.currentHeadEvidenceNote, /17\/17 forms/);
  assert.match(dashboard.currentHeadEvidenceNote, /15\/15 cross-cutting dimensions/);
  assert.match(dashboard.currentHeadEvidenceNote, /(?:41\/41 Chromium journeys|browser E2E 41\/41 PASS)/i);
  assert.match(dashboard.currentHeadEvidenceNote, /(?:overallAcceptance is NOT_TESTED|Overall DASH-001 remains NOT_TESTED)/i);

  const state = byId("STATE-001");
  assert.equal(state.status, "PASS");
  assert.equal(state.currentHeadEvidenceSha, liveHeadSha);
  assert.match(state.currentHeadEvidenceNote, /deployment recovery smoke/i);
  assert.match(state.currentHeadEvidenceNote, /runner-bridge safety/);

  const worker = byId("SCHED-WORKER-DISPATCH-001");
  assert.equal(worker.status, "NOT_TESTED");
  assert.equal(worker.currentHeadEvidenceSha, liveHeadSha);
  assert.match(worker.currentHeadEvidenceNote, /all 38 test\/worker-runner\.test\.mjs cases/);
  assert.match(worker.currentHeadEvidenceNote, /retained process lock when cooldown persistence fails/);
  assert.match(worker.currentHeadEvidenceNote, /Live worker dispatch remains NOT_TESTED/);

  const scheduler = byId("SCHED-001");
  assert.equal(scheduler.status, "NOT_TESTED");
  assert.equal(scheduler.currentHeadEvidenceSha, liveHeadSha);
  assert.match(scheduler.currentHeadEvidenceNote, /manual\/local\/third-party attempt attestation/i);
  assert.match(scheduler.nextAction, /fresh owner attestation/);

  const deployment = byId("DEPLOY-001");
  assert.equal(deployment.status, "NOT_TESTED");
  assert.equal(deployment.currentHeadEvidenceSha, liveHeadSha);
  assert.match(deployment.currentHeadEvidenceNote, /No SonicVhibez production render\/publisher Worker/i);
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
  assert.equal(worker.currentHeadEvidenceSha, liveHeadSha);
  assert.match(worker.currentHeadEvidenceNote, /persisted HTTP 409 preflight cooldown across restart/);
  assert.match(worker.currentHeadEvidenceNote, /fail-stop with retained process lock when cooldown persistence fails/);
  assert.match(worker.currentHeadEvidenceNote, /Live worker dispatch remains NOT_TESTED/);

  const scheduler = byId("SCHED-001");
  assert.equal(scheduler.status, "NOT_TESTED");
  assert.match(scheduler.currentHeadEvidenceNote, /one public 20-second legacy Short, zero private\/unlisted videos/);
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

test("FFmpeg and zero-skip requirements have exact current CI evidence", () => {
  const ffmpeg = byId("CI-FFMPEG-001");
  assert.equal(ffmpeg.currentHeadStatus, "PASS");
  assert.equal(ffmpeg.currentHeadEvidenceSha, liveHeadSha);
  assert.match(ffmpeg.currentHeadEvidenceNote, /ffmpeg and ffprobe before Node tests/i);
  assert.match(ffmpeg.currentHeadEvidenceNote, /N-129000-g64f6bcffaf-20261117/);
  const skips = byId("CI-TEST-SKIPS-001");
  assert.equal(skips.currentHeadStatus, "PASS");
  assert.equal(skips.currentHeadEvidenceSha, liveHeadSha);
  assert.match(skips.currentHeadEvidenceNote, /1,159 Node tests across 194 files, 1,153 passed, 6 failed and zero skips/i);
});
