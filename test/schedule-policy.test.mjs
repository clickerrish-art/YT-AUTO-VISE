import test from "node:test";
import assert from "node:assert/strict";
import { validatePublicationSlot, weeklyUtcCronGaps, localDateTimeToIso, evaluateNextPublication } from "../scripts/schedule-policy.mjs";

test("publication slot compares actual instants and rejects same-local-date and under-72-hour collisions", () => {
  const existing = [
    { id: "published-1", status: "published", scheduledAt: "2026-10-19T15:00:00.000Z", publishedAt: "2026-10-20T15:00:00.000Z" },
    { id: "scheduled-2", status: "scheduled", scheduledAt: "2026-10-23T15:00:00.000Z" }
  ];
  const tooClose = validatePublicationSlot({ id: "new", scheduledAt: "2026-10-25T15:00:00.000Z" }, existing);
  assert.equal(tooClose.valid, false);
  assert.ok(tooClose.errors.some(error => error.includes("48 hours is below the 72-hour minimum")));
  const enoughGap = validatePublicationSlot({ id: "new", scheduledAt: "2026-10-26T15:00:00.000Z" }, existing);
  assert.equal(enoughGap.valid, true);
});

test("published items use actual publication timestamps rather than their old planned slot", () => {
  const result = validatePublicationSlot(
    { id: "next", scheduledAt: "2026-10-25T15:00:00.000Z" },
    [{ id: "already-live", status: "published", scheduledAt: "2026-10-20T15:00:00.000Z", publishedAt: "2026-10-24T15:00:00.000Z" }]
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("24 hours is below the 72-hour minimum")));
});

test("validator fails closed when a published item has no actual publication timestamp", () => {
  const result = validatePublicationSlot(
    { id: "next", scheduledAt: "2026-10-28T15:00:00.000Z" },
    [{ id: "published-without-time", status: "published", scheduledAt: "2026-10-20T15:00:00.000Z" }]
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("missing publishedAt")));
});

test("an already-colliding existing schedule blocks any new slot", () => {
  const result = validatePublicationSlot(
    { id: "new", scheduledAt: "2026-10-31T15:00:00.000Z" },
    [
      { id: "scheduled-a", status: "scheduled", scheduledAt: "2026-10-27T15:00:00.000Z" },
      { id: "scheduled-b", status: "scheduled", scheduledAt: "2026-10-27T18:00:00.000Z" }
    ]
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("existing publication date collision between scheduled-a and scheduled-b")));
});

test("publication slot rejects duplicate IDs, invalid timestamps, and same Johannesburg date", () => {
  assert.equal(validatePublicationSlot(
    { id: "job-1", scheduledAt: "2026-10-24T10:00:00Z" },
    [{ id: "job-2", status: "scheduled", scheduledAt: "2026-10-24T20:00:00Z" }]
  ).valid, false);
  assert.ok(validatePublicationSlot(
    { id: "job-1", scheduledAt: "2026-10-24T10:00:00Z" },
    [{ id: "job-1", status: "scheduled", scheduledAt: "2026-10-28T10:00:00Z" }]
  ).errors.some(error => error.includes("duplicate job ID")));
  assert.throws(() => validatePublicationSlot({ id: "x", scheduledAt: "not-a-date" }, []), /valid ISO timestamp/);
});

test("draft items do not block slots but active items must have the correct real timestamps", () => {
  assert.equal(validatePublicationSlot(
    { id: "new", scheduledAt: "2026-10-24T15:00:00Z" },
    [{ id: "draft-1", status: "draft", scheduledAt: "2026-10-24T15:00:00Z" }]
  ).valid, true);
  assert.ok(validatePublicationSlot(
    { id: "new", scheduledAt: "2026-10-24T15:00:00Z" },
    [{ id: "published-without-time", status: "published" }]
  ).errors.some(error => error.includes("missing publishedAt")));
  assert.ok(validatePublicationSlot(
    { id: "new", scheduledAt: "2026-10-24T15:00:00Z" },
    [{ id: "scheduled-without-time", status: "scheduled" }]
  ).errors.some(error => error.includes("missing scheduledAt")));
});

test("weekly UTC cadence detects the actual 48/48/72-hour pattern", () => {
  const gaps = weeklyUtcCronGaps([
    { day: "Tuesday", cronUtc: "0 15 * * 2" },
    { day: "Thursday", cronUtc: "0 15 * * 4" },
    { day: "Saturday", cronUtc: "0 15 * * 6" }
  ]);
  assert.deepEqual(gaps.map(gap => gap.hours), [48, 48, 72]);
});

test("local schedule time conversion follows IANA timezone and daylight-saving rules", () => {
  assert.equal(localDateTimeToIso("2026-10-27", "17:00", "Africa/Johannesburg"), "2026-10-27T15:00:00.000Z");
  assert.equal(localDateTimeToIso("2026-03-07", "17:00", "America/New_York"), "2026-03-07T22:00:00.000Z");
  assert.equal(localDateTimeToIso("2026-03-09", "17:00", "America/New_York"), "2026-03-09T21:00:00.000Z");
  assert.throws(() => localDateTimeToIso("2026-03-08", "02:30", "America/New_York"), /does not exist/);
});


test("rolling cycle accepts exactly 72 elapsed hours and rejects one millisecond below", () => {
  const history = [{ id: "remote-1", status: "private", actualPublishedAt: "2026-10-20T15:00:00.000Z", format: "long_form" }];
  const exact = evaluateNextPublication({ history, historyVerified: true, proposedAt: "2026-10-23T15:00:00.000Z", jobId: "job-next", format: "long_form" });
  assert.equal(exact.valid, true, exact.errors.join("; "));
  const below = evaluateNextPublication({ history, historyVerified: true, proposedAt: "2026-10-23T14:59:59.999Z", jobId: "job-next", format: "long_form" });
  assert.equal(below.valid, false);
  assert.ok(below.errors.some(error => error.includes("72 elapsed hours") || error.includes("below the 72-hour minimum")));
});

test("rolling cycle advances long-form, long-form, Short and treats private/unlisted videos as history", () => {
  const history = [
    { id: "remote-1", status: "private", actualPublishedAt: "2026-10-01T15:00:00.000Z", format: "long_form" },
    { id: "remote-2", status: "unlisted", actualPublishedAt: "2026-10-04T15:00:00.000Z", format: "long_form" }
  ];
  const result = evaluateNextPublication({ history, historyVerified: true, proposedAt: "2026-10-07T15:00:00.000Z", jobId: "job-next", format: "short" });
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.equal(result.expectedFormat, "short");
});

test("rolling cycle fails closed for missing/incomplete history and unresolved upload attempts", () => {
  assert.equal(evaluateNextPublication({ history: [], historyVerified: false, proposedAt: "2026-10-01T15:00:00Z", jobId: "job-next", format: "long_form" }).valid, false);
  const unresolved = evaluateNextPublication({
    history: [{ id: "remote-1", status: "public", actualPublishedAt: "2026-10-01T15:00:00Z", format: "long_form" }],
    historyVerified: true, pendingAttempts: [{ jobId: "job-uncertain", status: "RECOVERY_REQUIRED" }],
    proposedAt: "2026-10-04T15:00:00Z", jobId: "job-next", format: "long_form"
  });
  assert.equal(unresolved.valid, false);
  assert.ok(unresolved.errors.some(error => error.includes("unresolved/uncertain outcome")));
});

test("rolling cycle rejects duplicate remote IDs and timezone-boundary gaps under 72 hours", () => {
  const duplicates = evaluateNextPublication({
    history: [{ id: "same-id", status: "public", actualPublishedAt: "2026-10-01T15:00:00Z", format: "long_form" }],
    historyVerified: true, scheduledItems: [{ id: "same-id", status: "scheduled", scheduledAt: "2026-10-04T15:00:00Z" }],
    proposedAt: "2026-10-07T15:00:00Z", jobId: "job-next", format: "long_form"
  });
  assert.equal(duplicates.valid, false);
  assert.ok(duplicates.errors.some(error => error.includes("duplicate stable job/remote ID")));
  const tzGap = validatePublicationSlot(
    { id: "next", scheduledAt: "2026-10-04T14:59:00Z" },
    [{ id: "last", status: "private", publishedAt: "2026-10-01T15:00:00Z" }],
    { timeZone: "Africa/Johannesburg" }
  );
  assert.equal(tzGap.valid, false);
});


test("reconciled successful upload ledger entries do not count as future scheduled slots", () => {
  const history = [{
    id: "remote-video-1", status: "private",
    actualPublishedAt: "2026-10-20T15:00:00.000Z", format: "long_form"
  }];
  const ledger = [{
    jobId: "job-long-form-1", remoteVideoId: "remote-video-1",
    status: "PRIVATE_UPLOAD_VERIFIED",
    actualPublishedAt: "2026-10-20T15:00:00.000Z",
    format: "long_form"
  }];
  const result = evaluateNextPublication({
    history, historyVerified: true, pendingAttempts: ledger,
    proposedAt: "2026-10-23T15:00:00.000Z",
    jobId: "job-long-form-2", format: "long_form"
  });
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.equal(result.expectedFormat, "long_form");
});
