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
  { id: "owner-selected-long-two", scriptPath: "content/two.md", publicationCyclePosition: 2 }
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
  const impossibleDate = structuredClone(approval);
  impossibleDate.approvedAt = "2026-02-31T12:00:00+02:00";
  assert.equal(validateQueueIdentity({ operationalQueue, detailedQueue, approval: impossibleDate }).valid, false);
  const impossibleOffset = structuredClone(approval);
  impossibleOffset.approvedAt = "2026-11-21T12:00:00+15:00";
  assert.equal(validateQueueIdentity({ operationalQueue, detailedQueue, approval: impossibleOffset }).valid, false);
  const duplicateQueue = structuredClone(operationalQueue);
  duplicateQueue.items[1].id = duplicateQueue.items[0].id;
  assert.equal(validateQueueIdentity({ operationalQueue: duplicateQueue, detailedQueue, approval }).valid, false);
});

test("queue identity maps the third long-form item to cycle position four after the Short slot", () => {
  const expandedOperational = structuredClone(operationalQueue);
  expandedOperational.items.push({ id: "dispatch-short-two", contentType: "short" });
  expandedOperational.items.push({ id: "dispatch-long-three", contentType: "long_form" });
  const expandedDetailed = structuredClone(detailedQueue);
  expandedDetailed.items.push({ id: "third-long-form", scriptPath: "content/three.md", publicationCyclePosition: 4 });
  const expandedApproval = structuredClone(approval);
  expandedApproval.mappings.push({
    operationalItemId: "dispatch-long-three",
    detailedItemId: "third-long-form",
    cyclePosition: 4
  });
  const result = validateQueueIdentity({
    operationalQueue: expandedOperational,
    detailedQueue: expandedDetailed,
    approval: expandedApproval
  });
  assert.equal(result.valid, true, result.errors.join("; "));
});

test("queue identity rejects duplicate cycle positions, mappings to Short items and mismatched detailed positions", () => {
  const duplicatePosition = structuredClone(approval);
  duplicatePosition.mappings[1].cyclePosition = 1;
  assert.equal(validateQueueIdentity({ operationalQueue, detailedQueue, approval: duplicatePosition }).valid, false);

  const shortMapping = structuredClone(approval);
  shortMapping.mappings[1].operationalItemId = "dispatch-short-one";
  assert.equal(validateQueueIdentity({ operationalQueue, detailedQueue, approval: shortMapping }).valid, false);

  const mismatchedDetailedPosition = structuredClone(detailedQueue);
  mismatchedDetailedPosition.items[1].publicationCyclePosition = 3;
  assert.equal(validateQueueIdentity({
    operationalQueue,
    detailedQueue: mismatchedDetailedPosition,
    approval
  }).valid, false);
});
