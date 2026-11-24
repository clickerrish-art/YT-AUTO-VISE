import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateQueueIdentity } from "../scripts/queue-identity-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

test("committed SonicVhibez queue identity remains pending explicit owner reconfirmation", () => {
  const operationalQueue = readJson("content/queue.json");
  const detailedQueue = readJson("content/long-form-queue.json");
  const approval = readJson("content/queue-identity-approval.json");
  const result = validateQueueIdentity({ operationalQueue, detailedQueue, approval });

  assert.equal(result.valid, false, "queue edits after approval must invalidate the exact-hash approval");
  assert.ok(result.errors.some(error => /must be explicitly OWNER_APPROVED by the owner/.test(error)));
  assert.ok(result.errors.some(error => /must identify the approving owner/.test(error)));
  assert.ok(result.errors.some(error => /timezone-qualified approvedAt timestamp/.test(error)));
  assert.equal(result.errors.some(error => /operationalQueueSha256 does not match/.test(error)), false);
  assert.equal(result.errors.some(error => /detailedQueueSha256 does not match/.test(error)), false);
  assert.equal(approval.status, "PENDING_OWNER_RECONFIRMATION");
  assert.equal(approval.ownerApproved, false);
  assert.equal(approval.approvedBy, "");
  assert.equal(approval.approvedAt, "");
  assert.deepEqual(approval.mappings, [
    { operationalItemId: "long-form-plan-wildlife-video", detailedItemId: "long-001-wildlife-video-planning", cyclePosition: 1 },
    { operationalItemId: "long-form-faceless-wildlife-workflow", detailedItemId: "long-002-faceless-wildlife-workflow", cyclePosition: 2 }
  ]);
  assert.equal(detailedQueue.items.find(item => item.id === "long-001-wildlife-video-planning").publicationCyclePosition, 1);
  assert.equal(detailedQueue.items.find(item => item.id === "long-002-faceless-wildlife-workflow").publicationCyclePosition, 2);
  assert.equal(detailedQueue.items.find(item => item.id === "long-001-wildlife-video-planning").status, "SCRIPT_DRAFT_NOT_PRODUCTION_APPROVED");
  assert.equal(detailedQueue.items.find(item => item.id === "long-002-faceless-wildlife-workflow").status, "SCRIPT_DRAFT_NOT_PRODUCTION_APPROVED");
  assert.equal(operationalQueue.publishingEnabled, false);
  assert.equal(detailedQueue.publishingEnabled, false);
});

test("production readiness remains HOLD for real media, narration, review and history gates after identity reconciliation", () => {
  const run = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env }
  });
  assert.equal(run.status, 2, run.stdout + "\n" + run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.status, "blocked");
  assert.ok(report.blockerCount > 0);
  assert.equal(report.blockers.some(item => /QUEUE IDENTITY RECONCILIATION REQUIRED/i.test(item.message)), true,
    "the pending owner approval must remain a production blocker");
  assert.equal(report.notes.some(note => /Queue identity reconciliation: 2 owner-approved long-form mappings verified/i.test(note)), false);
  assert.match(report.blockers.map(item => item.message).join("\n"), /original creator-captured wildlife footage|narration rights are not cleared|human content\/compliance review|upload-attempt reconciliation/i);
  assert.equal(readJson("content/queue.json").publishingEnabled, false);
});

test("production dispatch source retains independent authoring, hash-bound plan and due-slot gates", () => {
  const source = fs.readFileSync(path.join(root, "scripts/dashboard-server.mjs"), "utf8");
  const produceRoute = source.slice(source.indexOf('if (req.method === "POST" && url.pathname === "/api/jobs/produce")'));
  assert.ok(produceRoute.indexOf("if (!job.authoring)") >= 0, "jobs without the approved authoring pipeline must be rejected");
  assert.ok(produceRoute.indexOf("APPROVED_PLAN_ONLY") < 0 || produceRoute.indexOf("productionPlan") >= 0,
    "production plan remains an independent dispatch prerequisite");
  assert.match(produceRoute, /Africa\/Johannesburg/);
  assert.match(produceRoute, /renderStarted: false/);
  assert.match(produceRoute, /publishingEnabled: false/);
});
