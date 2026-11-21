import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { inventoryDashboardSources } from "../scripts/dashboard-inventory.mjs";

const root = process.cwd();
const matrix = JSON.parse(fs.readFileSync(
  path.join(root, "docs", "API_ROUTE_ACCEPTANCE_MATRIX.json"),
  "utf8"
));
const inventory = inventoryDashboardSources(
  fs.readFileSync(path.join(root, "public", "dashboard.html"), "utf8"),
  fs.readFileSync(path.join(root, "scripts", "dashboard-server.mjs"), "utf8")
);

const uniqueApiRoutes = inventory.routes
  .filter(route => route.path.startsWith("/api/"))
  .filter((route, index, routes) => routes.findIndex(candidate =>
    candidate.method === route.method && candidate.path === route.path
  ) === index);

const routeKey = route => `${route.method} ${route.path}`;

test("API acceptance matrix covers the complete source-derived protected route inventory", () => {
  assert.equal(matrix.repository, "clickerrish-art/YT-AUTO-VISE");
  assert.equal(matrix.branch, "codex/marketing-machine-audit-fixes");
  assert.equal(matrix.inventory.totalHandlers, inventory.routes.length);
  assert.equal(matrix.inventory.protectedApiRoutes, uniqueApiRoutes.length);
  assert.equal(matrix.counts.routes, uniqueApiRoutes.length);

  const sourceKeys = uniqueApiRoutes.map(routeKey).sort();
  const documentedKeys = matrix.routes.map(routeKey).sort();
  assert.deepEqual(documentedKeys, sourceKeys,
    "the acceptance matrix must contain every API method/path exactly once");

  assert.equal(matrix.counts.authNegativePass, matrix.routes.filter(route => /PASS/.test(route.authenticationNegative)).length,
    "every protected route must retain an explicit authentication-negative PASS");
  assert.ok(matrix.routes.every(route =>
    typeof route.authenticationNegative === "string" &&
    /\b(?:PASS|NOT_TESTED)\b/.test(route.authenticationNegative)
  ));

  const pass = matrix.routes.filter(route => route.overallAcceptance === "PASS").length;
  const blocked = matrix.routes.filter(route => route.overallAcceptance === "BLOCKED").length;
  const notTested = matrix.routes.filter(route => route.overallAcceptance === "NOT_TESTED").length;
  assert.equal(matrix.counts.overallPass, pass);
  assert.equal(matrix.counts.overallBlocked, blocked);
  assert.equal(matrix.counts.overallNotTested, notTested);
  assert.equal(pass + blocked + notTested, uniqueApiRoutes.length);

  assert.ok(matrix.routes.every(route =>
    ["PASS", "BLOCKED", "NOT_TESTED"].includes(route.overallAcceptance)
  ), "route acceptance must use an explicit, honest status");
  assert.equal(matrix.inventory.branchProtectionEnabled, null,
    "unknown branch protection must not be represented as enabled or disabled");
});


test("current-head API route evidence is exact-SHA, complete, and preserves provider blockers", () => {
  const currentSha = matrix.currentHeadReconciliation?.observedImplementationHeadSha;
  assert.match(currentSha || "", /^[a-f0-9]{40}$/,
    "API positive-route evidence must identify an exact tested source/test SHA");
  assert.equal(matrix.currentHeadReconciliation?.status, "PARTIAL");
  assert.equal(matrix.currentHeadReconciliation?.positiveRoutesReconciled, 41);
  assert.equal(matrix.currentHeadReconciliation?.blockedRoutesPreserved, 6);
  assert.equal(matrix.currentHeadReconciliation?.ownerGatedRoutes, 2);
  assert.equal(matrix.latestCurrentHeadPositiveEvidence?.sourceTestSha, currentSha);

  const positive = matrix.routes.filter(route => route.overallAcceptance === "PASS");
  const blocked = matrix.routes.filter(route => route.overallAcceptance === "BLOCKED");
  assert.equal(positive.length, 41);
  assert.equal(blocked.length, 7);

  for (const route of positive) {
    assert.equal(route.currentHeadStatus, "PASS", `${route.method} ${route.path} must be reconciled`);
    assert.equal(route.currentHeadEvidenceSha, currentSha, `${route.method} ${route.path} evidence SHA must match CI`);
    assert.ok(Number.isInteger(route.currentHeadEvidenceRunId));
    assert.ok(route.currentHeadEvidenceTestFiles?.length,
      `${route.method} ${route.path} must name endpoint-specific success tests`);
    for (const testFile of route.currentHeadEvidenceTestFiles) {
      assert.ok(fs.existsSync(path.join(root, testFile)),
        `evidence test file must exist for ${route.method} ${route.path}: ${testFile}`);
    }
  }

  for (const route of blocked) {
    if ((route.method === "GET" && route.path === "/api/jobs/dispatchable") ||
        (route.method === "POST" && route.path === "/api/jobs/produce")) {
      assert.equal(route.currentHeadStatus, "NOT_TESTED");
      assert.equal(route.currentHeadEvidenceSha, null);
      assert.match(route.currentHeadEvidenceNote, /owner-approved content\/queue-identity-approval\.json is absent/i);
    } else {
      assert.equal(route.currentHeadStatus, "BLOCKED");
      assert.equal(route.currentHeadEvidenceSha, currentSha);
    }
  }

  const expectedBlocked = [
    "POST /api/facebook/drafts/approve",
    "POST /api/facebook/publish",
    "POST /api/facebook/verify-page",
    "POST /api/instagram/approve",
    "GET /api/jobs/dispatchable",
    "POST /api/jobs/produce",
    "POST /api/uploads/reconcile"
  ];
  assert.deepEqual(blocked.map(routeKey).sort(), expectedBlocked.sort());
});
