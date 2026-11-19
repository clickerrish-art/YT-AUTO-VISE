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
const inventory = inventoryDashboardSources(
  html,
  server
);

test("dashboard control acceptance register exactly matches the live source inventory", () => {
  assert.equal(matrix.schemaVersion, 1);
  assert.equal(matrix.sourceBlobs.dashboardHtml, gitBlobSha(html));
  assert.equal(matrix.sourceBlobs.dashboardInventoryScript, gitBlobSha(inventorySource));
  assert.equal(matrix.repository, "clickerrish-art/YT-AUTO-VISE");
  assert.equal(matrix.branch, "codex/marketing-machine-audit-fixes");
  assert.equal(matrix.inventory.controls, inventory.counts.controls);
  assert.equal(matrix.inventory.forms, inventory.counts.forms);
  assert.equal(matrix.inventory.formOwnedControls, inventory.controls.filter(control => control.form !== null).length);
  assert.equal(matrix.inventory.standaloneControls, inventory.controls.filter(control => control.form === null).length);
  assert.equal(matrix.controls.length, inventory.controls.length);
  assert.equal(matrix.forms.length, inventory.forms.length);

  for (const [index, source] of inventory.controls.entries()) {
    const accepted = matrix.controls[index];
    assert.equal(accepted.acceptanceId, `DASH-C${String(index + 1).padStart(3, "0")}`);
    for (const field of ["tag", "id", "name", "type", "form", "disabled", "required", "line"]) {
      assert.equal(accepted[field], source[field], `control ${accepted.acceptanceId} field ${field} drifted`);
    }
    assert.equal(accepted.index, source.index);
    assert.equal(accepted.status, "NOT_TESTED",
      "source inventory alone must never promote a control to behavioral acceptance");
    assert.deepEqual(accepted.evidence, [],
      "overall behavioral acceptance requires complete dimension-specific evidence");
    assert.ok(Array.isArray(accepted.applicableDimensions));
    assert.ok(Array.isArray(accepted.observedCoverage));
    assert.ok(accepted.observedCoverage.some(item =>
      item.dimension === "stable_identity_and_accessible_name" &&
      item.observedResult === "PASS" &&
      item.testSha === "4b5783ae03470002052eb0312a4284f09cedfd95"
    ), `control ${accepted.acceptanceId} must retain exact-SHA accessibility evidence`);
    if (accepted.required) {
      assert.ok(accepted.observedCoverage.some(item =>
        ["required_empty_value_validation", "read_only_hash_field_integrity"].includes(item.dimension) &&
        item.observedResult === "PASS" &&
        item.testSha === "4b5783ae03470002052eb0312a4284f09cedfd95"
      ), `required control ${accepted.acceptanceId} must retain its exact-SHA validation evidence`);
    }
  }

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
    assert.equal(accepted.status, "NOT_TESTED");
    assert.deepEqual(accepted.evidence, []);
    assert.ok(Array.isArray(accepted.observedCoverage));
    assert.ok(accepted.observedCoverage.some(item =>
      item.dimension === "required_empty_form_submission" &&
      item.observedResult === "PASS" &&
      item.testSha === "4b5783ae03470002052eb0312a4284f09cedfd95"
    ));
  }

  assert.equal(matrix.status, "NOT_TESTED");
  assert.equal(matrix.disclaimer.includes("does not claim behavioral acceptance"), true);
});
