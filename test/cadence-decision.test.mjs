import test from "node:test";
import assert from "node:assert/strict";
import { validateCadenceDecision } from "../scripts/schedule-policy.mjs";

const rollingApproval = {
  status: "OWNER_APPROVED",
  ownerApproved: true,
  approvedMode: "ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET",
  approvedAt: "2026-10-28T09:00:00+02:00",
  approvalReference: "owner-decision-2026-10-28"
};

test("accepts an explicit timezone-qualified owner decision that preserves the 72-hour invariant", () => {
  assert.deepEqual(validateCadenceDecision(rollingApproval, 72), { valid: true, errors: [] });
  assert.deepEqual(validateCadenceDecision(rollingApproval, 96), { valid: true, errors: [] });
});

test("requires owner approval, a supported mode, a valid zoned timestamp and a reference", () => {
  for (const patch of [
    { status: "DRAFT" },
    { ownerApproved: false },
    { approvedMode: "THREE_PER_WEEK" },
    { approvedAt: "2026-10-28T09:00:00" },
    { approvedAt: "2026-02-30T09:00:00Z" },
    { approvedAt: "2026-10-28T09:00:00+15:00" },
    { approvalReference: "  " }
  ]) {
    const result = validateCadenceDecision({ ...rollingApproval, ...patch }, 72);
    assert.equal(result.valid, false, JSON.stringify(patch));
    assert.ok(result.errors.length > 0, JSON.stringify(patch));
  }
  assert.equal(validateCadenceDecision(null, 72).valid, false);
});

test("never lets an owner decision waive the minimum 72 elapsed-hour gap", () => {
  const result = validateCadenceDecision(rollingApproval, 71.999);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => /at least 72 elapsed hours/.test(error)));
});

test("custom cadence requires whole publication counts and a mathematically feasible cycle", () => {
  const custom = {
    ...rollingApproval,
    approvedMode: "OTHER_OWNER_DEFINED_FEASIBLE_POLICY",
    ownerDefinedPolicy: { description: "Three publications per rolling cycle", publicationsPerCycle: 3, cycleHours: 216 }
  };
  assert.deepEqual(validateCadenceDecision(custom, 72), { valid: true, errors: [] });
  for (const patch of [
    { publicationsPerCycle: 2.5, cycleHours: 216 },
    { publicationsPerCycle: 3, cycleHours: 215.99 },
    { publicationsPerCycle: 0, cycleHours: 216 },
    { publicationsPerCycle: 3, cycleHours: 0 }
  ]) {
    const result = validateCadenceDecision({ ...custom, ownerDefinedPolicy: { ...custom.ownerDefinedPolicy, ...patch } }, 72);
    assert.equal(result.valid, false, JSON.stringify(patch));
  }
});

test("custom cadence rejects a missing or blank policy description", () => {
  const result = validateCadenceDecision({
    ...rollingApproval,
    approvedMode: "OTHER_OWNER_DEFINED_FEASIBLE_POLICY",
    ownerDefinedPolicy: { description: " ", publicationsPerCycle: 3, cycleHours: 216 }
  }, 72);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => /description/.test(error)));
});
