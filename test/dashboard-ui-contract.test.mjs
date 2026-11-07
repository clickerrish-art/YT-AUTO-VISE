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
  const formIds = [...html.matchAll(/<form\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]);
  const submitBindings = [...html.matchAll(/\$\(["']([^"']+)["']\)\.onsubmit\s*=/g)].map(match => match[1]);
  const buttonIds = [...html.matchAll(/<button\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]);
  const clickBindings = [...html.matchAll(/\$\(["']([^"']+)["']\)\.onclick\s*=/g)].map(match => match[1]);

  assert.ok(formIds.length > 0, "dashboard should expose real forms");
  assert.deepEqual(formIds.filter(id => !submitBindings.includes(id)), [],
    "every visible form must have a submit handler");
  assert.deepEqual(buttonIds.filter(id => !clickBindings.includes(id)), [],
    "every ID-addressable button must have a click handler");
});

test("Nature Frontiers Facebook draft form cannot offer prohibited product or affiliate promotions", () => {
  const formStart = html.search(/<form\b[^>]*\bid="facebookdraftform"[^>]*>/);
  const formEnd = html.indexOf("</form>", formStart);
  const form = formStart >= 0 && formEnd > formStart ? html.slice(formStart, formEnd) : "";
  assert.ok(form, "Facebook draft form must remain present");
  assert.match(form, /Nature Frontiers is education-only/);
  assert.match(form, /Product, affiliate and Selar promotions are not permitted/);
  assert.doesNotMatch(form, /selar-wildlife-vault|fbcampaign|fbcommercial|fbdisclosure/);
  assert.match(html, /campaignId:null/);
  assert.match(html, /disclosureRequired:false,commercial:false/);
});

test("dashboard exposes authenticated read-only production queue diagnostics", () => {
  assert.match(html, /api\("\/api\/jobs\/queue-diagnostics\?limit=100"\)/);
  assert.match(html, /Production queue operations/);
  assert.match(html, /diagnosticsQueued/);
  assert.match(html, /diagnosticsDispatchable/);
  assert.match(html, /diagnosticsHeld/);
  assert.match(html, /queueDiagnosticsBlockers/);
  assert.match(html, /queueDiagnosticsItems/);
  assert.match(html, /renderQueueDiagnostics\(\)/);
  assert.match(html, /cell\.textContent=String\(value\)/,
    "queue diagnostics must render untrusted job values as text, not HTML");
  assert.match(html, /data\.readOnly===true/);
  assert.match(html, /data\.publishingEnabled===false/);
  assert.doesNotMatch(html, /queueDiagnostics.*retry/i,
    "read-only diagnostics must not introduce retry controls");
});

test("queue diagnostics give explicit non-automatic operator remediation guidance", () => {
  assert.match(html, /function queueOperatorNextStep\(item\)/);
  assert.match(html, /Create the authoring draft, then complete human script review and approval/);
  assert.match(html, /record its explicit approval with the required digest/);
  assert.match(html, /Assign a valid date and time in Africa\/Johannesburg/);
  assert.match(html, /expired slots are never silently moved/);
  assert.match(html, /complete media, rights, human-review and upload gates separately/);
  assert.match(html, /<th>Operator next step<\/th>/);
  assert.match(html, /queueOperatorNextStep\(item\)/);
});

test("final media review exposes verified video, thumbnail, captions and evidence previews", () => {
  assert.match(html, /id="reviewVideo"/);
  assert.match(html, /id="reviewThumbnail"/);
  assert.match(html, /id="reviewCaptions"/);
  assert.match(html, /id="reviewMetadata"/);
  assert.match(html, /id="reviewRights"/);
  assert.match(html, /\/api\/jobs\/review\/bundle/);
  assert.match(html, /bundle\.previewUrls\[kind\]/);
  assert.match(html, /Integrity verified/);
  assert.match(html, /actual media, thumbnail and captions loaded/);
});
