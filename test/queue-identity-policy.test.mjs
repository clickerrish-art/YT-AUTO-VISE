import test from "node:test";
import assert from "node:assert/strict";
import { validateQueueIdentity } from "../scripts/queue-identity-policy.mjs";

const operationalQueue = { items: [
  { id: "dispatch-long-one", contentType: "long_form" },
  { id: "dispatch-long-two", contentType: "long_form" },
  { id: "dispatch-short-one", contentType: "short" }
] };
const detailedQueue = { items: [
  { id: "canonical-long-one", scriptPath: "content/one.md", publicationCyclePosition: 1 },
  { id: "owner-selected-long-two", scriptPath: "content/two.md" }
] };
const approval = {
  schemaVersion: 1, status: "OWNER_APPROVED", ownerApproved: true,
  approvedBy: "repository-owner", approvedAt: "2026-11-21T12:00:00+02:00",
  approvalReference: "owner-decision-001",
  mappings: [
    { operationalItemId: "dispatch-long-one", detailedItemId: "canonical-long-one", cyclePosition: 1 },
    { operationalItemId: "dispatch-long-two", detailedItemId: "owner-selected-long-two", cyclePosition: 2 }
  ]
};

test("queue identity fails closed without explicit owner approval", () => {
  const result = validateQueueIdentity({ operationalQueue, detailedQueue });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => /approval.*missing/i.test(error)));
  assert.ok(result.errors.some(error => /mappings must cover/i.test(error)));
});

test("queue identity accepts complete owner-approved ordered mappings", () => {
  const result = validateQueueIdentity({ operationalQueue, detailedQueue, approval });
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.equal(result.mappingCount, 2);
  assert.deepEqual(result.mappedDetailedIds, ["canonical-long-one", "owner-selected-long-two"]);
});

test("queue identity rejects a changed or unapproved first long-form identity", () => {
  const changed = structuredClone(approval);
  changed.mappings[0].detailedItemId = "owner-selected-long-two";
  const result = validateQueueIdentity({ operationalQueue, detailedQueue, approval: changed });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => /cycle position 1/i.test(error)));
});

test("queue identity rejects missing mappings, duplicate mappings and cycle-order gaps", () => {
  for (const mutate of [
    value => { value.mappings.pop(); },
    value => { value.mappings.push({ ...value.mappings[0] }); },
    value => { value.mappings[1].cyclePosition = 3; },
    value => { value.mappings[1].detailedItemId = "missing"; }
  ]) {
    const changed = structuredClone(approval);
    mutate(changed);
    assert.equal(validateQueueIdentity({ operationalQueue, detailedQueue, approval: changed }).valid, false);
  }
});

test("queue identity rejects invalid owner approval metadata and malformed queue IDs", () => {
  const changed = structuredClone(approval);
  changed.approvedAt = "2026-11-21T12:00:00";
  assert.equal(validateQueueIdentity({ operationalQueue, detailedQueue, approval: changed }).valid, false);
  const duplicateQueue = structuredClone(operationalQueue);
  duplicateQueue.items[1].id = duplicateQueue.items[0].id;
  assert.equal(validateQueueIdentity({ operationalQueue: duplicateQueue, detailedQueue, approval }).valid, false);
});
