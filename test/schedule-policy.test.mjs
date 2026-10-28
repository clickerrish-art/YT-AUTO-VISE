import test from "node:test";
import assert from "node:assert/strict";
import { validatePublicationSlot, weeklyUtcCronGaps, localDateTimeToIso, evaluateNextPublication, isValidZonedIsoTimestamp } from "../scripts/schedule-policy.mjs";

test("strict timestamp validator requires timezone and rejects normalized invalid dates", () => {
  assert.equal(isValidZonedIsoTimestamp("2026-10-25T12:00:00+02:00"), true);
  assert.equal(isValidZonedIsoTimestamp("2026-10-25T10:00:00Z"), true);
  assert.equal(isValidZonedIsoTimestamp("2026-10-25T12:00:00"), false);
  assert.equal(isValidZonedIsoTimestamp("2026-02-31T12:00:00Z"), false);
  assert.equal(isValidZonedIsoTimestamp("2026-10-25T12:00:00+15:00"), false);
  assert.equal(isValidZonedIsoTimestamp("2026-10-25T12:00:00+02:60"), false);
  assert.equal(isValidZonedIsoTimestamp("2026-02-29T12:00:00Z"), false);
  assert.equal(isValidZonedIsoTimestamp("2024-02-29T12:00:00Z"), true);
  assert.equal(isValidZonedIsoTimestamp(null), false);
});

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

test("actual remote states never fall back to job creation time when publication time is missing", () => {
  for (const status of ["published", "public", "private", "unlisted"]) {
    const result = validatePublicationSlot(
      { id: "next", scheduledAt: "2026-10-28T15:00:00.000Z" },
      [{
        id: `remote-${status}`,
        status,
        createdAt: "2026-10-20T15:00:00.000Z",
        scheduledAt: "2026-10-20T15:00:00.000Z"
      }]
    );
    assert.equal(result.valid, false, `${status} history without an actual timestamp must fail closed`);
    assert.ok(result.errors.some(error => error.includes("actual publication timestamp")),
      `${status} history must identify the missing actual publication timestamp`);
  }
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
  assert.throws(() => localDateTimeToIso("2026-11-01", "01:30", "America/New_York"), /is ambiguous/);
  assert.equal(localDateTimeToIso("2026-11-01", "03:30", "America/New_York"), "2026-11-01T08:30:00.000Z");
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


test("publication timestamps reject normalized invalid dates, missing zones, and malformed offsets", () => {
  const base = { history: [{ id: "remote-1", status: "private", actualPublishedAt: "2026-10-20T15:00:00.000Z", format: "long_form" }], historyVerified: true, jobId: "next", format: "long_form" };
  for (const proposedAt of [
    "2026-02-30T15:00:00Z",
    "2026-10-23T15:00:00",
    "2026-10-23 15:00:00Z",
    "2026-10-23T15:00:00+14:30",
    "not-a-date"
  ]) {
    const result = evaluateNextPublication({ ...base, proposedAt });
    assert.equal(result.valid, false, `must reject malformed timestamp: ${proposedAt}`);
    assert.ok(result.errors.some(error => error.includes("proposedAt must be a valid ISO timestamp with explicit timezone")));
  }
});

test("history timestamps with invalid calendar dates fail closed instead of normalizing", () => {
  const result = evaluateNextPublication({
    history: [{ id: "remote-1", status: "private", actualPublishedAt: "2026-02-30T15:00:00Z", format: "long_form" }],
    historyVerified: true,
    proposedAt: "2026-10-23T15:00:00Z",
    jobId: "next",
    format: "long_form"
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("history item remote-1 is missing a verified actual ISO timestamp with timezone")));
});


test("rolling cycle rejects draft, scheduled, missing, and unknown statuses in claimed remote history", () => {
  for (const status of ["draft", "scheduled", "", "deleted", "mystery"]) {
    const result = evaluateNextPublication({
      history: [{
        id: "remote-invalid-status",
        status,
        actualPublishedAt: "2026-10-20T15:00:00.000Z",
        format: "long_form"
      }],
      historyVerified: true,
      proposedAt: "2026-10-23T15:00:00.000Z",
      jobId: "next",
      format: "long_form"
    });
    assert.equal(result.valid, false, "must reject remote history status " + JSON.stringify(status));
    assert.ok(result.errors.some(error => error.includes("unsupported remote publication status")));
  }
});

test("queued publication jobs reserve their timestamps and block collisions", () => {
  const sameDay = validatePublicationSlot(
    { id: "next-slot", scheduledAt: "2026-10-27T15:00:00Z" },
    [{ id: "queued-slot", status: "QUEUED", scheduledAt: "2026-10-27T15:00:00Z" }]
  );
  assert.equal(sameDay.valid, false);
  assert.ok(sameDay.errors.some(error => error.includes("publication date collision with queued-slot")));

  const exact72Hours = validatePublicationSlot(
    { id: "next-slot", scheduledAt: "2026-10-27T15:00:00Z" },
    [{ id: "queued-prior", status: "queued", scheduledAt: "2026-10-24T15:00:00Z" }]
  );
  assert.equal(exact72Hours.valid, true, exact72Hours.errors.join("; "));

  const missingTimestamp = validatePublicationSlot(
    { id: "next-slot", scheduledAt: "2026-10-27T15:00:00Z" },
    [{ id: "queued-without-time", status: "queued" }]
  );
  assert.equal(missingTimestamp.valid, false);
  assert.ok(missingTimestamp.errors.some(error => error.includes("active item queued-without-time is missing scheduledAt")));
});



test("queued-for-publication and pending-schedule attempts reserve publication slots", () => {
  for (const status of ["queued_for_publication", "pending_schedule"]) {
    const sameDay = validatePublicationSlot(
      { id: "next-slot", scheduledAt: "2026-10-27T15:00:00Z" },
      [{ id: "reserved-slot", status, scheduledAt: "2026-10-27T15:00:00Z" }]
    );
    assert.equal(sameDay.valid, false, status + " must block same-day collisions");
    assert.ok(sameDay.errors.some(error => error.includes("publication date collision with reserved-slot")));

    const missingTime = validatePublicationSlot(
      { id: "next-slot", scheduledAt: "2026-10-27T15:00:00Z" },
      [{ id: "reserved-without-time", status }]
    );
    assert.equal(missingTime.valid, false, status + " without a timestamp must fail closed");
    assert.ok(missingTime.errors.some(error => error.includes("missing scheduledAt")));
  }
});

test("pending-attempt schedule states are checked against the proposed publication slot", () => {
  for (const status of ["queued_for_publication", "pending_schedule"]) {
    const result = evaluateNextPublication({
      history: [{
        id: "remote-prior", status: "private",
        actualPublishedAt: "2026-10-20T15:00:00.000Z", format: "long_form"
      }],
      historyVerified: true,
      pendingAttempts: [{
        jobId: "reserved-attempt", status,
        scheduledAt: "2026-10-23T15:00:00.000Z"
      }],
      proposedAt: "2026-10-23T15:00:00.000Z",
      jobId: "next-job",
      format: "long_form"
    });
    assert.equal(result.valid, false, status + " must reserve its timestamp");
    assert.ok(result.errors.some(error => error.includes("publication date collision with reserved-attempt")));
  }
});


test("publication slot validator refuses caller-supplied spacing below the non-waivable 72-hour minimum", () => {
  const proposed = { id: "new", scheduledAt: "2026-10-28T15:00:00Z" };
  for (const minSpacingHours of [-1, 0, 71.999, 71]) {
    assert.throws(
      () => validatePublicationSlot(proposed, [], { minSpacingHours }),
      /minSpacingHours must be at least 72 elapsed hours/
    );
  }
  assert.equal(validatePublicationSlot(proposed, [], { minSpacingHours: 72 }).valid, true);
  assert.equal(validatePublicationSlot(proposed, [], { minSpacingHours: 96 }).valid, true);
});
