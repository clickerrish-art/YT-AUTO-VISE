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
