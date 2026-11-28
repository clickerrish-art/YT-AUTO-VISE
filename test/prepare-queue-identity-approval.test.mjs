import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { buildQueueIdentityApprovalTemplate } from "../scripts/prepare-queue-identity-approval.mjs";

const operationalQueue = { items: [
  { id: "long-one", contentType: "long_form" },
  { id: "long-two", contentType: "long_form" },
  { id: "short-one", contentType: "short" },
  { id: "short-two", contentType: "short" },
  { id: "long-three", contentType: "long_form" }
] };
const detailedQueue = { items: [
  { id: "detail-one", scriptPath: "content/one.md", publicationCyclePosition: 1 },
  { id: "detail-two", scriptPath: "content/two.md", publicationCyclePosition: 2 }
] };

test("queue approval template binds both exact queue hashes and leaves owner choices blank", () => {
  const template = buildQueueIdentityApprovalTemplate(operationalQueue, detailedQueue);
  const hash = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
  assert.equal(template.status, "PENDING_OWNER_APPROVAL");
  assert.equal(template.ownerApproved, false);
  assert.equal(template.operationalQueueSha256, hash(operationalQueue));
  assert.equal(template.detailedQueueSha256, hash(detailedQueue));
  assert.deepEqual(template.mappings.map(item => item.cyclePosition), [1, 2, 4]);
  assert.ok(template.mappings.every(item => item.detailedItemId === ""));
  assert.equal(template.approvedBy, "");
  assert.equal(template.approvedAt, "");
  assert.equal(template.approvalReference, "");
});

test("queue approval template rejects malformed or duplicate queue identities", () => {
  assert.throws(() => buildQueueIdentityApprovalTemplate({ items: [] }, detailedQueue), /at least two/);
  const duplicate = structuredClone(operationalQueue);
  duplicate.items[1].id = duplicate.items[0].id;
  assert.throws(() => buildQueueIdentityApprovalTemplate(duplicate, detailedQueue), /unique/);
  assert.throws(() => buildQueueIdentityApprovalTemplate(operationalQueue, null), /items array/);
});
