import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { inventoryDashboardSources } from "../scripts/dashboard-inventory.mjs";

const root = process.cwd();
const matrix = JSON.parse(fs.readFileSync(
  path.join(root, "docs", "DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.json"),
  "utf8"
));
const html = fs.readFileSync(path.join(root, "public", "dashboard.html"), "utf8");
const server = fs.readFileSync(path.join(root, "scripts", "dashboard-server.mjs"), "utf8");
const inventorySource = fs.readFileSync(path.join(root, "scripts", "dashboard-inventory.mjs"), "utf8");
const gitBlobSha = content => createHash("sha1")
  .update(Buffer.from("blob " + Buffer.byteLength(content) + "\0"))
  .update(content)
  .digest("hex");
const inventory = inventoryDashboardSources(html, server);
const evidenceSha = "701cf7b66f535288cdb96ebb5224b3d04652116b";
const automationEvidenceSha = "701cf7b66f535288cdb96ebb5224b3d04652116b";
const browserRun = "https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/45027495188";
const automationRun = "https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/45027495020";
assert.ok(browserRun.startsWith("https://github.com/clickerrish-art/YT-AUTO-VISE/"));
assert.ok(automationRun.startsWith("https://github.com/clickerrish-art/YT-AUTO-VISE/"));

function assertEvidence(evidence, dimension, run = browserRun) {
  assert.ok(evidence.some(item =>
    item.dimension === dimension &&
    item.observedResult === "PASS" &&
    item.testSha === evidenceSha &&
    item.run === run
  ), `missing exact-SHA PASS evidence for ${dimension}`);
}

test("dashboard control evidence is internally consistent while DASH-001 remains NOT_TESTED overall", () => {
  assert.equal(matrix.schemaVersion, 1);
  assert.equal(matrix.sourceBlobs.dashboardHtml, gitBlobSha(html));
  assert.equal(matrix.sourceBlobs.dashboardInventoryScript, gitBlobSha(inventorySource));
  assert.equal(matrix.repository, "clickerrish-art/YT-AUTO-VISE");
  assert.equal(matrix.branch, "codex/marketing-machine-audit-fixes");
  assert.equal(matrix.inventory.controls, inventory.counts.controls);
  assert.equal(matrix.inventory.forms, inventory.counts.forms);
  assert.equal(matrix.inventory.formOwnedControls, inventory.controls.filter(control => control.form !== null).length);
  assert.equal(matrix.inventory.standaloneControls, inventory.controls.filter(control => control.form === null).length);
  assert.equal(matrix.controls.length, 121);
  assert.equal(matrix.forms.length, 17);
  assert.equal(matrix.sourceHead, evidenceSha);
  assert.equal(matrix.status, "PASS");
  assert.equal(matrix.evidenceStatus, "PASS");
  assert.equal(matrix.overallAcceptance, "NOT_TESTED");
  assert.match(matrix.coverageNote, /DASH-001 remains NOT_TESTED overall/);

  const currentHeadRefresh = matrix.currentHeadRefresh;
  assert.equal(currentHeadRefresh.sourceTestSha, automationEvidenceSha);
  assert.equal(currentHeadRefresh.nodeTests, 1107);
  assert.equal(currentHeadRefresh.nodeTestFiles, 189);
  assert.equal(currentHeadRefresh.browserE2EStatus, "PASS");
  assert.equal(currentHeadRefresh.overallAcceptance, "NOT_TESTED");

  const dashboardEvidence = matrix.dashboardEvidence;
  assert.equal(dashboardEvidence.status, "PASS");
  assert.equal(dashboardEvidence.testSha, evidenceSha);
  assert.equal(dashboardEvidence.browserRun, browserRun);
  assert.equal(dashboardEvidence.browserTests, 41);
  assert.equal(dashboardEvidence.controls, 121);
  assert.equal(dashboardEvidence.forms, 17);
  assert.equal(dashboardEvidence.automation.run, automationRun);
  assert.equal(dashboardEvidence.automation.testSha, automationEvidenceSha);
  assert.equal(dashboardEvidence.automation.nodeTestFiles, 189);
  assert.equal(dashboardEvidence.automation.nodeTests, 1107);
  assert.equal(dashboardEvidence.automation.nodeSkipped, 0);
  assert.equal(dashboardEvidence.automation.pythonTests, 108);
  assert.equal(dashboardEvidence.automation.pythonSkipped, 0);
  assert.equal(dashboardEvidence.automation.npmAuditVulnerabilities, 0);
  assert.equal(dashboardEvidence.automation.pythonEvidenceSha, automationEvidenceSha);
  assert.equal(dashboardEvidence.automation.npmAuditEvidenceSha, automationEvidenceSha);

  const crossCutting = new Map(dashboardEvidence.crossCuttingDimensions.map(item => [item.dimension, item]));
  for (const dimension of [
    "authorization_and_role_enforcement",
    "actionable_error_feedback",
    "durable_persistence_and_restart",
    "concurrency_and_idempotency",
    "concurrency_and_provider_call_idempotency",
    "keyboard_accessibility",
    "accessible_names_for_all_controls",
    "mobile_responsiveness_320px",
    "mobile_responsiveness_375px",
    "required_and_boundary_validation",
    "malformed_identifier_and_url_validation",
    "minimum_length_validation",
    "maximum_length_validation",
    "read_only_and_disabled_invariants",
    "all_controls_field_interaction_and_journey_mapping"
  ]) {
    assert.equal(crossCutting.get(dimension)?.observedResult, "PASS", `cross-cutting dimension ${dimension} must pass`);
    assert.equal(crossCutting.get(dimension)?.testSha, evidenceSha);
    assert.equal(crossCutting.get(dimension)?.run, browserRun);
  }

  for (const [index, source] of inventory.controls.entries()) {
    const accepted = matrix.controls[index];
    assert.equal(accepted.acceptanceId, `DASH-C${String(index + 1).padStart(3, "0")}`);
    for (const field of ["tag", "id", "name", "type", "form", "disabled", "required", "readOnly", "pattern", "minLength", "maxLength", "min", "max", "step", "line"]) {
      assert.equal(accepted[field], source[field], `control ${accepted.acceptanceId} field ${field} drifted`);
    }
    assert.equal(accepted.index, source.index);
    assert.equal(accepted.status, "PASS", `control ${accepted.acceptanceId} must be behaviorally accepted`);
    assert.ok(Array.isArray(accepted.applicableDimensions) && accepted.applicableDimensions.length > 0);
    assert.ok(Array.isArray(accepted.evidence) && accepted.evidence.length > 0);
    for (const dimension of accepted.applicableDimensions) assertEvidence(accepted.evidence, dimension);
    for (const item of accepted.evidence) {
      assert.equal(item.testSha, evidenceSha);
      assert.equal(item.run, browserRun);
      assert.equal(item.observedResult, "PASS");
    }
    assert.ok(accepted.observedCoverage.some(item =>
      item.dimension === "stable_identity_and_accessible_name" &&
      item.observedResult === "PASS" &&
      item.testSha === "4b5783ae03470002052eb0312a4284f09cedfd95"
    ), `control ${accepted.acceptanceId} must retain historical exact-SHA accessibility evidence`);
    if (accepted.required && !accepted.readOnly) {
      assertEvidence(accepted.evidence, "required_empty_value_validation");
    }
    if (accepted.pattern || accepted.type === "url") {
      assertEvidence(accepted.evidence, "native_pattern_or_url_validation");
    }
    if (accepted.minLength > 0) assertEvidence(accepted.evidence, "minimum_length_validation");
    if (accepted.maxLength > 0) assertEvidence(accepted.evidence, "maximum_length_validation");
    if (accepted.readOnly) assertEvidence(accepted.evidence, "read_only_hash_field_integrity");
    if (accepted.disabled) assertEvidence(accepted.evidence, "disabled_action_noop");
  }

  const expectedOutcomes = new Set([
    "SUCCESSFUL_OPERATION",
    "EXPECTED_BLOCKED_LOCAL_DRAFT_ONLY",
    "EXPECTED_REJECTION_OF_INVALID_REVIEW_EVIDENCE",
    "EXPECTED_BLOCKED_MISSING_PRODUCTION_MEDIA",
    "EXPECTED_BLOCKED_UNVERIFIED_PARENT_BINDING",
    "SUCCESSFUL_LOCAL_RIGHTS_REGISTER_OPERATION",
    "EXPECTED_REJECTION_OF_MALFORMED_SCORECARD",
    "EXPECTED_BLOCKED_INCOMPLETE_PRODUCTION_EVIDENCE"
  ]);
  for (const [index, source] of inventory.forms.entries()) {
    const accepted = matrix.forms[index];
    assert.equal(accepted.acceptanceId, `DASH-F${String(index + 1).padStart(3, "0")}`);
    for (const field of ["id", "name", "method", "action", "line"]) {
      assert.equal(accepted[field], source[field], `form ${accepted.acceptanceId} field ${field} drifted`);
    }
    assert.deepEqual(
      accepted.controlIds,
      inventory.controls.filter(control => control.form === source.id).map(control => `DASH-C${String(control.index).padStart(3, "0")}`)
    );
    assert.equal(accepted.status, "PASS");
    assert.ok(expectedOutcomes.has(accepted.expectedOutcome), `form ${accepted.id} must state its tested expected outcome`);
    assertEvidence(accepted.evidence, "required_empty_form_submission");
    assertEvidence(accepted.evidence, "form_journey_behavior");
    assert.ok(accepted.observedCoverage.some(item =>
      item.dimension === "required_empty_form_submission" &&
      item.observedResult === "PASS" &&
      item.testSha === "4b5783ae03470002052eb0312a4284f09cedfd95"
    ));
  }

  assert.equal(matrix.disclaimer.includes("exact tested commit"), true);
  assert.equal(dashboardEvidence.releaseBoundary.includes("does not authorize uploads"), true);
});
