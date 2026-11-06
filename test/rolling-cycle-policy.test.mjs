import test from "node:test";
import assert from "node:assert/strict";
import { evaluateNextPublication, validateRollingPublicationCycle } from "../scripts/schedule-policy.mjs";

const approval = {
  ownerApproved: true,
  approvedBy: "project-owner",
  approvedAt: "2026-10-27T10:00:00+02:00",
  timeZone: "Africa/Johannesburg",
  minSpacingHours: 72,
  mode: "rolling",
  weeklyPublicationTarget: 2
};

const validCycle = [
  { id: "long-1", contentType: "long_form", scheduledAt: "2026-10-27T08:00:00+02:00" },
  { id: "long-2", contentType: "long_form", scheduledAt: "2026-10-30T08:00:00+02:00" },
  { id: "short-1", contentType: "short", scheduledAt: "2026-11-02T08:00:00+02:00" }
];

test("accepts the rolling long-form, long-form, Short order only with feasible owner approval", () => {
  const result = validateRollingPublicationCycle(validCycle, { ownerApprovedPolicy: approval });
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.deepEqual(result.orderedItems.map(item => item.contentType), ["long_form", "long_form", "short"]);
  assert.deepEqual(result.gaps.map(gap => gap.hours), [72, 72]);
  assert.equal(result.publishingEnabled, false);
});

test("rejects an infeasible three-publications-per-week policy at 72-hour spacing", () => {
  const result = validateRollingPublicationCycle(validCycle, {
    ownerApprovedPolicy: { ...approval, weeklyPublicationTarget: 3 }
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /mathematically infeasible/);
});

test("rejects missing owner approval and does not infer authorization", () => {
  const result = validateRollingPublicationCycle(validCycle);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /owner-approved rolling publication policy is required/);
  assert.equal(result.publishingEnabled, false);
});

test("rejects wrong cycle order and gaps shorter than 72 elapsed hours", () => {
  const result = validateRollingPublicationCycle([
    { id: "short-first", contentType: "short", scheduledAt: "2026-10-27T08:00:00+02:00" },
    { id: "long-second", contentType: "long_form", scheduledAt: "2026-10-29T08:00:00+02:00" }
  ], { ownerApprovedPolicy: approval });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /rolling cycle position 1 must be long_form/);
  assert.match(result.errors.join(" "), /minimum is 72/);
});

test("rejects same-local-date slots even when their timestamp syntax is valid", () => {
  const result = validateRollingPublicationCycle([
    { id: "long-1", contentType: "long_form", scheduledAt: "2026-10-27T08:00:00+02:00" },
    { id: "long-2", contentType: "long_form", scheduledAt: "2026-10-27T20:00:00+02:00" }
  ], { ownerApprovedPolicy: approval });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /same-local-date publication collision/);
});


test("scheduled upload attempts participate in stable-ID collision checks via jobId", () => {
  const history = [{
    id: "remote-video-1",
    status: "private",
    actualPublishedAt: "2026-10-20T15:00:00.000Z",
    format: "long_form"
  }];
  const duplicatePendingJob = evaluateNextPublication({
    history,
    historyVerified: true,
    pendingAttempts: [{
      jobId: "remote-video-1",
      status: "scheduled",
      scheduledAt: "2026-10-24T15:00:00.000Z"
    }],
    proposedAt: "2026-10-27T15:00:00.000Z",
    jobId: "job-next",
    format: "long_form"
  });
  assert.equal(duplicatePendingJob.valid, false);
  assert.ok(duplicatePendingJob.errors.some(error => error.includes("duplicate stable job/remote ID: remote-video-1")));

  const duplicateWithScheduledItem = evaluateNextPublication({
    history,
    historyVerified: true,
    scheduledItems: [{
      id: "job-shared",
      status: "scheduled",
      scheduledAt: "2026-10-24T15:00:00.000Z"
    }],
    pendingAttempts: [{
      jobId: "job-shared",
      status: "queued_for_publication",
      scheduledAt: "2026-10-24T15:00:00.000Z"
    }],
    proposedAt: "2026-10-27T15:00:00.000Z",
    jobId: "job-next",
    format: "long_form"
  });
  assert.equal(duplicateWithScheduledItem.valid, false);
  assert.ok(duplicateWithScheduledItem.errors.some(error => error.includes("duplicate stable job/remote ID: job-shared")));
});


test("accepts owner-approved rolling cycle without inventing a weekly target", () => {
  const policy = {
    ownerApproved: true,
    approvedBy: "project-owner",
    approvedAt: "2026-10-27T10:00:00+02:00",
    timeZone: "Africa/Johannesburg",
    minSpacingHours: 72,
    mode: "ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET"
  };
  const result = validateRollingPublicationCycle(validCycle, { ownerApprovedPolicy: policy });
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.equal(result.publishingEnabled, false);
});

test("rejects a weekly target in the no-weekly-target policy mode", () => {
  const policy = {
    ownerApproved: true,
    approvedBy: "project-owner",
    approvedAt: "2026-10-27T10:00:00+02:00",
    timeZone: "Africa/Johannesburg",
    minSpacingHours: 72,
    mode: "ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET",
    weeklyPublicationTarget: 2
  };
  const result = validateRollingPublicationCycle(validCycle, { ownerApprovedPolicy: policy });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /must omit weeklyPublicationTarget/);
});


test("blocks remote-accepted attempts until reconciliation is complete", () => {
  const result = evaluateNextPublication({
    history: [{ id: "remote-1", status: "private", actualPublishedAt: "2026-10-20T15:00:00.000Z", format: "long_form" }],
    historyVerified: true,
    pendingAttempts: [{ jobId: "job-uncertain", status: "REMOTE_ACCEPTED_RECONCILIATION_REQUIRED" }],
    proposedAt: "2026-10-27T15:00:00.000Z",
    jobId: "job-next",
    format: "long_form"
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /unresolved\/uncertain outcome/);
});

test("fails closed on an unknown upload-attempt status", () => {
  const result = evaluateNextPublication({
    history: [{ id: "remote-1", status: "private", actualPublishedAt: "2026-10-20T15:00:00.000Z", format: "long_form" }],
    historyVerified: true,
    pendingAttempts: [{ jobId: "job-unknown", status: "REMOTE_STATE_MAYBE" }],
    proposedAt: "2026-10-27T15:00:00.000Z",
    jobId: "job-next",
    format: "long_form"
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /unsupported status REMOTE_STATE_MAYBE/);
});
