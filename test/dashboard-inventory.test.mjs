import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inventoryDashboardSources } from "../scripts/dashboard-inventory.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("dashboard static inventory reports all declared controls, forms and literal routes", () => {
  const inventory = inventoryDashboardSources(
    fs.readFileSync(path.join(root, "public", "dashboard.html"), "utf8"),
    fs.readFileSync(path.join(root, "scripts", "dashboard-server.mjs"), "utf8"),
  );

  assert.equal(inventory.schemaVersion, 1);
  assert.equal(inventory.counts.controls, inventory.controls.length);
  assert.equal(inventory.counts.forms, inventory.forms.length);
  assert.equal(inventory.counts.routes, inventory.routes.length);
  assert.equal(inventory.counts.controls, 105);
  assert.equal(inventory.counts.forms, 15);
  assert.equal(inventory.counts.routes, 38);
  assert.deepEqual(inventory.counts.controlsByTag, {
    button: 21,
    input: 43,
    select: 26,
    textarea: 15,
  });
  assert.deepEqual(inventory.counts.routesByMethod, { GET: 10, POST: 28 });

  assert.ok(inventory.controls.every(control => Number.isInteger(control.line) && control.line > 0));
  assert.ok(inventory.forms.every(form => Number.isInteger(form.line) && form.line > 0));
  assert.ok(inventory.routes.every(route => Number.isInteger(route.line) && route.path.startsWith("/")));
  assert.ok(inventory.routes.every(route => route.method !== "METHOD_NOT_INLINE"), "every literal route must declare an HTTP method inline");
  assert.equal(inventory.disclaimer.includes("not control/route acceptance evidence"), true);
});

test("dashboard inventory preserves duplicate method/path declarations rather than hiding them", () => {
  const inventory = inventoryDashboardSources(
    '<form id="one"><button id="save">Save</button></form><form id="two"><input name="x"></form>',
    'if (req.method === "GET" && url.pathname === "/same") {}\nif (req.method === "POST" && url.pathname === "/same") {}',
  );
  assert.equal(inventory.counts.controls, 2);
  assert.equal(inventory.counts.forms, 2);
  assert.equal(inventory.counts.routes, 2);
  assert.deepEqual(inventory.routes.map(route => [route.method, route.path]), [
    ["GET", "/same"],
    ["POST", "/same"],
  ]);
});

test("dashboard acceptance IDs are unique and stable when unrelated declarations are inserted", () => {
  const originalHtml = '<button id="save">Save</button><input name="caption"><form id="review"><button id="approve" type="submit">Approve</button></form>';
  const originalServer = 'if (req.method === "GET" && url.pathname === "/health") {}\nif (req.method === "POST" && url.pathname === "/jobs") {}';
  const before = inventoryDashboardSources(originalHtml, originalServer);
  const after = inventoryDashboardSources('<button id="new-control">New</button>' + originalHtml, 'if (req.method === "GET" && url.pathname === "/new") {}\n' + originalServer);

  assert.ok(before.controls.every(item => typeof item.acceptanceId === "string" && item.acceptanceId.length > 0));
  assert.ok(before.forms.every(item => typeof item.acceptanceId === "string" && item.acceptanceId.length > 0));
  assert.ok(before.routes.every(item => typeof item.acceptanceId === "string" && item.acceptanceId.length > 0));
  assert.equal(new Set(before.controls.map(item => item.acceptanceId)).size, before.controls.length);
  assert.equal(new Set(before.forms.map(item => item.acceptanceId)).size, before.forms.length);
  assert.equal(new Set(before.routes.map(item => item.acceptanceId)).size, before.routes.length);
  for (const item of before.controls) {
    assert.equal(after.controls.find(candidate => candidate.id === item.id || candidate.name === item.name)?.acceptanceId, item.acceptanceId);
  }
  for (const item of before.forms) {
    assert.equal(after.forms.find(candidate => candidate.id === item.id)?.acceptanceId, item.acceptanceId);
  }
  for (const item of before.routes) {
    assert.equal(after.routes.find(candidate => candidate.method === item.method && candidate.path === item.path)?.acceptanceId, item.acceptanceId);
  }
});

test("dashboard acceptance IDs disambiguate repeated declarations without dropping either route", () => {
  const inventory = inventoryDashboardSources(
    '<button id="save">One</button><button id="save">Two</button>',
    'if (req.method === "GET" && url.pathname === "/same") {}\nif (req.method === "GET" && url.pathname === "/same") {}',
  );
  assert.equal(new Set(inventory.controls.map(item => item.acceptanceId)).size, 2);
  assert.equal(new Set(inventory.routes.map(item => item.acceptanceId)).size, 2);
});
