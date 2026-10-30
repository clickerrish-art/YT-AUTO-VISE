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

test("dashboard inventory detects multiline literal route conditions", () => {
  const inventory = inventoryDashboardSources(
    "",
    'if (\\n  req.method === "POST" &&\\n  url.pathname === "/api/multiline"\\n) { }',
  );

  assert.equal(inventory.counts.routes, 1);
  assert.equal(inventory.routes[0].method, "POST");
  assert.equal(inventory.routes[0].path, "/api/multiline");
  assert.notEqual(inventory.routes[0].method, "METHOD_NOT_INLINE");
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
    assert.equal(after.controls.find(candidate => (item.id && candidate.id === item.id) || (item.name && candidate.name === item.name))?.acceptanceId, item.acceptanceId);
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


test("dashboard inventory parses greater-than signs in quoted attributes and ignores commented-out markup", () => {
  const html = '<!-- <button id="comment-only">Not live</button> --><form id="review" action="/submit?hint=a>b"><input name="caption" aria-label="Save > review"></form>';
  const inventory = inventoryDashboardSources(html, "");

  assert.equal(inventory.counts.controls, 1);
  assert.equal(inventory.counts.forms, 1);
  assert.equal(inventory.controls[0].ariaLabel, "Save > review");
  assert.equal(inventory.forms[0].action, "/submit?hint=a>b");
  assert.equal(inventory.controls[0].id, null);
  assert.equal(inventory.controls[0].name, "caption");
});

test("dashboard forms and non-submit controls are wired to real API routes", () => {
  const html = fs.readFileSync(path.join(root, "public", "dashboard.html"), "utf8");
  const server = fs.readFileSync(path.join(root, "scripts", "dashboard-server.mjs"), "utf8");
  const inventory = inventoryDashboardSources(html, server);
  const scriptSource = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .join("\n");

  const formIds = [...html.matchAll(/<form\b([^>]*)>/gi)]
    .map(match => match[1].match(/\bid=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);
  const submitBindings = [...scriptSource.matchAll(/\$\(\s*["']([^"']+)["']\s*\)\.onsubmit\s*=/g)]
    .map(match => ({ id: match[1], index: match.index }));
  const routeDeclarations = new Set(inventory.routes.map(route => route.path));

  assert.equal(formIds.length, 15, "the dashboard form inventory changed; review the acceptance fixture");
  assert.equal(submitBindings.length, formIds.length, "every dashboard form must have exactly one explicit submit handler");

  for (const formId of formIds) {
    const bindingIndex = submitBindings.findIndex(binding => binding.id === formId);
    assert.notEqual(bindingIndex, -1, "form #" + formId + " has no submit handler");
    const start = submitBindings[bindingIndex].index;
    const end = submitBindings[bindingIndex + 1]?.index ?? scriptSource.length;
    const handler = scriptSource.slice(start, end);
    const apiRoute = handler.match(/\bapi\s*\(\s*["']([^"']+)["']/)?.[1];
    assert.ok(apiRoute, "form #" + formId + " does not call the dashboard API");
    assert.ok(routeDeclarations.has(apiRoute), "form #" + formId + " calls undeclared API route " + apiRoute);
  }

  const controlTags = [...html.matchAll(/<(button|input|select|textarea)\b([^>]*)>/gi)];
  let wiredControls = 0;
  for (const match of controlTags) {
    const tag = match[1].toLowerCase();
    const attributes = match[2];
    const id = attributes.match(/\bid=["']([^"']+)["']/i)?.[1];
    const type = attributes.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase()
      ?? (tag === "button" ? "submit" : "");
    if (tag === "button" && type === "submit") continue;

    assert.ok(id, "non-submit " + tag + " control is missing a stable id");
    assert.ok(
      scriptSource.includes('$("' + id + '")') || scriptSource.includes("$('#" + id + "')"),
      "non-submit control #" + id + " has no JavaScript binding",
    );
    wiredControls++;
  }

  assert.equal(wiredControls, 87, "the number of non-submit dashboard controls changed; review the acceptance fixture");
});
