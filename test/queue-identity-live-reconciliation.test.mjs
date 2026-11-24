import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateQueueIdentity } from "../scripts/queue-identity-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

test("committed SonicVhibez queue identity reflects the owner's explicit long-form topic selection", () => {
  const operationalQueue = readJson("content/queue.json");
  const detailedQueue = readJson("content/long-form-queue.json");
  const approval = readJson("content/queue-identity-approval.json");
  const result = validateQueueIdentity({ operationalQueue, detailedQueue, approval });

  assert.equal(result.valid, true, result.errors.join("; "));
  assert.equal(result.mappingCount, 2);
  assert.deepEqual(result.operationalLongFormIds, ["long-form-001-two-eyes-above-water", "long-form-plan-wildlife-video"]);
  assert.deepEqual(result.mappedDetailedIds, ["long-form-001-two-eyes-above-water", "long-form-002-plan-wildlife-video"]);
  assert.equal(approval.status, "OWNER_APPROVED");
  assert.equal(approval.ownerApproved, true);
  assert.equal(approval.approvedBy, "User (explicit confirmation in this ChatGPT conversation)");
  assert.equal(approval.approvalScope, "CONTENT_IDENTITY_AND_ROLLING_CYCLE_POSITION_ONLY");
  assert.equal(approval.productionApproval, false);
  assert.equal(approval.rightsApproval, false);
  assert.equal(approval.uploadAuthorization, false);
  assert.equal(approval.publicationAuthorization, false);

  const crocodile = detailedQueue.items.find(item => item.id === "long-form-001-two-eyes-above-water");
  const planning = detailedQueue.items.find(item => item.id === "long-form-002-plan-wildlife-video");
  const faceless = detailedQueue.items.find(item => item.id === "draft-faceless-wildlife-workflow");
  assert.equal(crocodile.publicationCyclePosition, 1);
  assert.equal(crocodile.hasPaidPromotion, false);
  assert.equal(planning.publicationCyclePosition, 2);
  assert.equal(planning.hasPaidPromotion, true);
  assert.equal(faceless.identityStatus, "UNASSIGNED_DRAFT_NOT_IN_ACTIVE_PUBLICATION_CYCLE");
  assert.equal("publicationCyclePosition" in faceless, false);
  assert.equal(operationalQueue.publishingEnabled, false);
  assert.equal(detailedQueue.publishingEnabled, false);
});

test("production readiness remains HOLD for real media, narration, review and history gates after identity reconciliation", () => {
  const run = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    cwd: root, encoding: "utf8", env: { ...process.env }
  });
  assert.equal(run.status, 2, run.stdout + "\n" + run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.status, "blocked");
  assert.ok(report.blockerCount > 0);
  assert.equal(report.blockers.some(item => /QUEUE IDENTITY RECONCILIATION REQUIRED/i.test(item.message)), false);
  assert.equal(report.notes.some(note => /Queue identity reconciliation: 2 owner-approved long-form mappings verified/i.test(note)), true);
  assert.match(report.blockers.map(item => item.message).join("\n"), /original creator-captured wildlife footage|narration rights are not cleared|human content\/compliance review|upload-attempt reconciliation/i);
  assert.equal(readJson("content/queue.json").publishingEnabled, false);
});

test("production dispatch source retains independent authoring, hash-bound plan and due-slot gates", () => {
  const source = fs.readFileSync(path.join(root, "scripts/dashboard-server.mjs"), "utf8");
  const produceRoute = source.slice(source.indexOf('if (req.method === "POST" && url.pathname === "/api/jobs/produce")'));
  assert.ok(produceRoute.indexOf("if (!job.authoring)") >= 0);
  assert.ok(produceRoute.indexOf("APPROVED_PLAN_ONLY") < 0 || produceRoute.indexOf("productionPlan") >= 0);
  assert.match(produceRoute, /Africa\/Johannesburg/);
  assert.match(produceRoute, /renderStarted: false/);
  assert.match(produceRoute, /publishingEnabled: false/);
});
