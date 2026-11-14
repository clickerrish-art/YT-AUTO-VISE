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

  assert.equal(matrix.counts.authNegativePass, uniqueApiRoutes.length,
    "every protected route must retain an explicit authentication-negative PASS");
  assert.ok(matrix.routes.every(route =>
    typeof route.authenticationNegative === "string" &&
    /\bPASS\b/.test(route.authenticationNegative)
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
