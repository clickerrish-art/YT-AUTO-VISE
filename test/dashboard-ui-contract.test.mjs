import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { inventoryDashboardSources } from "../scripts/dashboard-inventory.mjs";

const dashboardPath = path.join(process.cwd(), "public", "dashboard.html");
const html = fs.readFileSync(dashboardPath, "utf8");
const serverPath = path.join(process.cwd(), "scripts", "dashboard-server.mjs");
const server = fs.readFileSync(serverPath, "utf8");
const inventory = inventoryDashboardSources(html, server);

test("dashboard derives production slots and rolling cycle from authoritative backend schedule", () => {
  assert.match(html, /const scheduleSlots=Array\.isArray\(state\.schedule\?\.schedule\)/);
  assert.match(html, /Draft-preparation slots:/);
  assert.match(html, /publicationCycle\?\.formats/);
  assert.match(html, /minimumPublicationSpacingHours/);
  assert.doesNotMatch(html, /Target: Tue \+ Thu long-form, Sat Short/);
  assert.doesNotMatch(html, /<option>Thursday<\/option>/);
});

test("dashboard exposes read-only Nature Frontiers Instagram operations health", () => {
  assert.match(html, /Nature Frontiers Instagram — operations health/);
  assert.match(html, /id="instagramRefresh"/);
  assert.match(html, /id="instagramStatus"/);
  assert.match(html, /api\("\/api\/instagram\/status"\)/);
  assert.match(html, /Meta token present: .*not live-verified/);
  assert.match(html, /No provider mutation was attempted/);
  assert.match(html, /\$\("instagramRefresh"\)\.onclick=loadInstagramStatus/);
});

test("dashboard describes the real read-only Meta adapter without implying live Facebook publishing", () => {
  assert.match(html, /read-only Meta adapter can verify Page identity and permissions/);
  assert.match(html, /this draft workflow does not publish a Page post/);
  assert.doesNotMatch(html, /no live Meta adapter is installed/);
});

test("every dashboard form and ID-addressable action control is wired to a handler", () => {
  const formIds = [...html.matchAll(/<form\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]);
  const submitBindings = [...html.matchAll(/\$\(["']([^"']+)["']\)\.onsubmit\s*=/g)].map(match => match[1]);
  const buttonTags = [...html.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
  const buttonIds = buttonTags.flatMap(tag => {
    const match = tag.match(/\bid="([^"]+)"/);
    if (!match || match[1].includes("'+") || match[1].includes("${")) return [];
    return [match[1]];
  });
  const clickBindings = [...html.matchAll(/\$\(["']([^"']+)["']\)\.onclick\s*=/g)].map(match => match[1]);
  const clickListenerBindings = [...html.matchAll(/\$\(["']([^"']+)["']\)\.addEventListener\s*\(\s*["']click["']/g)].map(match => match[1]);

  assert.ok(formIds.length > 0, "dashboard should expose real forms");
  assert.deepEqual(formIds.filter(id => !submitBindings.includes(id)), [],
    "every visible form must have a submit handler");
  assert.deepEqual(buttonIds.filter(id => !clickBindings.includes(id) && !clickListenerBindings.includes(id)), [],
    "every static ID-addressable button must have a direct click handler");

  const dynamicRestoreButton = buttonTags.find(tag => tag.includes("data-restore-backup="));
  assert.ok(dynamicRestoreButton, "dynamic restore buttons must expose their delegated-action data attribute");
  assert.match(html, /\$\(["']stateBackupList["']\)\.addEventListener\s*\(\s*["']click["']\s*,\s*event\s*=>/,
    "dynamic restore buttons must be handled by the backup-list click delegate");
  assert.match(html, /event\.target\.closest\(["']button\[data-restore-backup\]["']\)/,
    "the delegated handler must target only restore buttons");
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
  assert.match(html, /bundle\.previewUrls\.(?:video|thumbnail|captions)/);
  assert.match(html, /Integrity verified/);
  assert.match(html, /actual media, thumbnail and captions loaded/);
});


test("all 119 static dashboard controls map to a submitted form or an explicit standalone binding", () => {
  assert.equal(inventory.counts.controls, 120);
  assert.equal(inventory.counts.forms, 17);
  assert.deepEqual(inventory.counts.controlsByTag, { button: 27, input: 50, select: 27, textarea: 16 });
  assert.equal(new Set(inventory.controls.map(control => control.acceptanceId)).size, 120,
    "every control must have a unique stable acceptance identity");

  const submitHandlers = new Set(
    [...html.matchAll(/\$\(["']([^"']+)["']\)\.onsubmit\s*=/g)].map(match => match[1])
  );
  const formIds = inventory.forms.map(form => form.id);
  assert.equal(formIds.length, 17);
  assert.deepEqual(formIds.filter(id => !submitHandlers.has(id)), [],
    "every form must have a submit handler");
  assert.deepEqual(inventory.controls.filter(control => control.form && !submitHandlers.has(control.form)), [],
    "every control inside a form must inherit a real form submission path");

  const standaloneIds = inventory.controls.filter(control => !control.form).map(control => control.id).sort();
  const expectedStandaloneIds = [
    "refresh", "token", "connect", "createStateBackup", "refreshStateBackups",
    "fbverifyPage", "instagramRefresh", "search", "filter", "narrationreviewjob",
    "narrationreviewsha", "narrationreviewaudioSha", "narrationreviewtranscriptSha",
    "narrationreviewcaptionsSha", "narrationreviewreportSha", "task", "runTask"
  ].sort();
  assert.deepEqual(standaloneIds, expectedStandaloneIds,
    "new standalone controls must be explicitly added to this acceptance map");

  for (const id of [
    "refresh", "connect", "createStateBackup", "refreshStateBackups",
    "fbverifyPage", "instagramRefresh", "runTask"
  ]) assert.ok(html.includes('$("' + id + '").onclick'), id + " must have a click handler");
  assert.ok(html.includes('$("token").value'), "operator token must be consumed by the connect action");
  assert.ok(html.includes('$("search").oninput'), "search input must have a live filter handler");
  assert.ok(html.includes('$("filter").onchange'), "format filter must have a change handler");
  assert.ok(html.includes('$("narrationreviewjob").onchange'), "narration selection must load its review bundle");
  assert.ok(html.includes('$("task").value'), "task selector must be consumed by the run-task action");

  for (const id of [
    "narrationreviewsha", "narrationreviewaudioSha", "narrationreviewtranscriptSha",
    "narrationreviewcaptionsSha", "narrationreviewreportSha"
  ]) {
    assert.ok(html.includes('id="' + id + '" readonly'), id + " is a system-populated integrity digest and must be read-only");
    assert.ok(html.includes('$("' + id + '").value'), id + " must be populated from the verified review bundle");
  }
});


test("all six production-blocked dashboard forms bind their fields to guarded API routes with integration coverage", () => {
  const contracts = [
    {
      form: "produceform", route: "/api/jobs/produce",
      fields: ["producejob"],
      integration: "test/dashboard-api-produce-fail-closed-recovery.integration.test.mjs"
    },
    {
      form: "validationform", route: "/api/jobs/validate",
      fields: ["validationjob", "captionsPath"],
      integration: "test/dashboard-api-validation-idempotency.integration.test.mjs"
    },
    {
      form: "rightsform", route: "/api/jobs/rights/verify",
      fields: ["rightsjob", "assetsJson", "confirmRightsVerified", "rightsAssetId", "rightsAssetSource", "rightsAssetHolder", "rightsAssetPath", "rightsLicensePath", "rightsRestrictions", "rightsAttribution", "rightsAssetYouTubeAllowed"],
      integration: "test/dashboard-api-rights-verification.integration.test.mjs"
    },
    {
      form: "reviewform", route: "/api/jobs/review",
      fields: ["reviewjob", "reviewdecision", "artifactPath", "artifactSha", "metadataPath", "metadataSha", "rightsJson", "reviewReason"],
      integration: "test/dashboard-api-review-approval.integration.test.mjs"
    },
    {
      form: "reconcileform", route: "/api/uploads/reconcile",
      fields: ["reconcileJobId", "reconcileVideoPath", "reconcileMetadataPath", "reconcileApprovalPath"],
      integration: "test/upload-reconcile-fail-closed.integration.test.mjs"
    },
    {
      form: "parentrelationshipform", route: "/api/jobs/parent-relationship",
      fields: ["relationshipChildJob", "relationshipParentJob", "relationshipChildMediaPath", "relationshipParentMediaPath", "parentQualityEvidencePath", "relationshipSourceSegments", "confirmRelationshipReviewed", "relationshipReviewNotes"],
      integration: "test/dashboard-api-parent-relationship.integration.test.mjs"
    }
  ];

  for (const contract of contracts) {
    assert.ok(inventory.forms.some(form => form.id === contract.form), contract.form + " must exist in the static form inventory");
    assert.ok(html.includes('$("' + contract.form + '").onsubmit'), contract.form + " must have a submit handler");
    assert.ok(html.includes(contract.route), contract.form + " must target its intended guarded API route");
    for (const field of contract.fields) {
      assert.ok(html.includes('id="' + field + '"'), contract.form + " must expose " + field);
      assert.ok(html.includes('$("' + field + '")'), contract.form + " handler/helper must consume " + field);
    }
    const integrationPath = path.join(process.cwd(), contract.integration);
    const integrationSource = fs.readFileSync(integrationPath, "utf8");
    assert.ok(integrationSource.includes(contract.route),
      contract.form + " must have an integration test for " + contract.route);
  }
});
