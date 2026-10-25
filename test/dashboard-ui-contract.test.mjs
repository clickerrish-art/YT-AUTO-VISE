import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const dashboardPath = path.join(process.cwd(), "public", "dashboard.html");
const html = fs.readFileSync(dashboardPath, "utf8");

test("dashboard derives production slots and rolling cycle from authoritative backend schedule", () => {
  assert.match(html, /const scheduleSlots=Array\.isArray\(state\.schedule\?\.schedule\)/);
  assert.match(html, /Draft-preparation slots:/);
  assert.match(html, /publicationCycle\?\.formats/);
  assert.match(html, /minimumPublicationSpacingHours/);
  assert.doesNotMatch(html, /Target: Tue \+ Thu long-form, Sat Short/);
  assert.doesNotMatch(html, /<option>Thursday<\/option>/);
});

test("dashboard describes the real read-only Meta adapter without implying live Facebook publishing", () => {
  assert.match(html, /read-only Meta adapter can verify Page identity and permissions/);
  assert.match(html, /this draft workflow does not publish a Page post/);
  assert.doesNotMatch(html, /no live Meta adapter is installed/);
});


test("every dashboard form and ID-addressable action control is wired to a handler", () => {
  const formIds = [...html.matchAll(/<form\\b[^>]*\\bid="([^"]+)"/g)].map(match => match[1]);
  const submitBindings = [...html.matchAll(/\\$\\(["']([^"']+)["']\\)\\.onsubmit\\s*=/g)].map(match => match[1]);
  const buttonIds = [...html.matchAll(/<button\\b[^>]*\\bid="([^"]+)"/g)].map(match => match[1]);
  const clickBindings = [...html.matchAll(/\\$\\(["']([^"']+)["']\\)\\.onclick\\s*=/g)].map(match => match[1]);

  assert.ok(formIds.length > 0, "dashboard should expose real forms");
  assert.deepEqual(formIds.filter(id => !submitBindings.includes(id)), [],
    "every visible form must have a submit handler");
  assert.deepEqual(buttonIds.filter(id => !clickBindings.includes(id)), [],
    "every ID-addressable button must have a click handler");
});
