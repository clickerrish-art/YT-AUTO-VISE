import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { inventoryDashboardSources } from "../scripts/dashboard-inventory.mjs";

const root = process.cwd();
const matrix = JSON.parse(fs.readFileSync(
  path.join(root, "docs", "DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.json"),
  "utf8"
));
const inventory = inventoryDashboardSources(
  fs.readFileSync(path.join(root, "public", "dashboard.html"), "utf8"),
  fs.readFileSync(path.join(root, "scripts", "dashboard-server.mjs"), "utf8")
);

test("dashboard control acceptance register exactly matches the live source inventory", () => {
  assert.equal(matrix.schemaVersion, 1);
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
      "behavioral acceptance requires explicit exact-SHA evidence");
    assert.ok(Array.isArray(accepted.applicableDimensions));
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
  }

  assert.equal(matrix.status, "NOT_TESTED");
  assert.equal(matrix.disclaimer.includes("does not claim behavioral acceptance"), true);
});
