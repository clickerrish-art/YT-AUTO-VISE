import test from "node:test";
import assert from "node:assert/strict";
import { createContentJob, transitionContentJob, authorizeContentJobRetry, approveContentJobForPrivateUpload, claimWorkerLease, heartbeatWorkerLease, completeWorkerLease, expireWorkerLease, deadLetterExhaustedJob } from "../scripts/content-job-lifecycle.mjs";
import { shortParentRelationshipSha256, shortParentEvidenceSha256 } from "../scripts/short-parent-relationship.mjs";

const input = { idempotencyKey: "draft:short-001", title: "Wildlife storytelling", topic: "How to plan a wildlife documentary", contentType: "short", scheduledDay: "Saturday", scheduledDate: "2026-10-24", inputReferences: ["content/short-001-wildlife-video-storytelling.md"] };

test("content jobs retain durable schedule, identity, retry and audit fields", () => {
  const job = createContentJob(input, "2026-10-23T12:00:00.000Z");
  assert.equal(job.state, "QUEUED");
  assert.equal(job.scheduledSlot.timezone, "Africa/Johannesburg");
  assert.equal(job.scheduledSlot.time, "17:00");
  assert.equal(job.scheduledSlot.date, "2026-10-24");
  assert.equal(job.scheduledSlot.idempotencyKey, "slot:2026-10-24:17:00:Africa/Johannesburg");
  assert.equal(job.scheduledSlot.date, "2026-10-24");
  assert.equal(job.scheduledSlot.idempotencyKey, "slot:2026-10-24:17:00:Africa/Johannesburg");
  assert.equal(job.attemptCount, 0);
  assert.equal(job.publishingEnabled, false);
  assert.equal(job.transitionHistory[0].to, "QUEUED");
  assert.match(job.requestFingerprint, /^[a-f0-9]{64}$/);
});

test("content jobs reject schedule mismatches and malformed idempotency keys", () => {
  assert.throws(() => createContentJob({ ...input, scheduledDay: "Tuesday" }), /weekday/);
  assert.throws(() => createContentJob({ ...input, scheduledDay: "Thursday", scheduledDate: "2026-10-29" }), /Tuesday.*Saturday draft-preparation slot/);
  assert.throws(() => createContentJob({ ...input, scheduledDate: "2026-10-23" }), /weekday/);
  assert.throws(() => createContentJob({ ...input, scheduledDate: "2026-02-31" }), /real YYYY-MM-DD date/);
  assert.throws(() => createContentJob({ ...input, idempotencyKey: "!" }), /idempotencyKey/);
});

test("content job state machine enforces allowed transitions and protects upload states", () => {
  let job = createContentJob(input);
  job = transitionContentJob(job, "GENERATING", { actor: "operator", reason: "Start draft production" });
  assert.equal(job.state, "GENERATING");
  assert.equal(job.attemptCount, 1);
  job = transitionContentJob(job, "GENERATED", { actor: "worker", reason: "Artifacts created" });
  job = transitionContentJob(job, "VALIDATING", { actor: "worker", reason: "Start preflight" });
  assert.throws(() => transitionContentJob(job, "AWAITING_HUMAN_REVIEW"), /validation result/);
  assert.throws(() => transitionContentJob(job, "UPLOADING_PRIVATE"), /separate verified private-upload workflow/);
  assert.throws(() => transitionContentJob(job, "PRIVATE_UPLOAD_VERIFIED"), /separate verified private-upload workflow/);
});

test("failed jobs require an explicit operator retry authorization and exhausted retries enter a recoverable dead letter", () => {
  const now = Date.parse("2026-10-23T12:00:00.000Z");
  const afterBackoff = new Date(now + 1).toISOString();
  let job = {
    ...createContentJob(input, new Date(now).toISOString()),
    state: "FAILED",
    attemptCount: 1,
    completedAt: new Date(now).toISOString(),
    errorDetails: { code: "TRANSIENT_RENDER_FAILURE", retryable: true },
    nextRetryAt: afterBackoff
  };

  assert.throws(
    () => transitionContentJob(job, "QUEUED", { actor: "operator", reason: "Retry" }, afterBackoff),
    /explicit operator authorization/
  );
  assert.throws(
    () => claimWorkerLease(job, "worker-auto-retry", { now: Date.parse(afterBackoff) + 1 }),
    /explicit operator retry authorization/
  );
  assert.throws(
    () => authorizeContentJobRetry(job, { actor: "operator", reason: "Reviewed failure and approve retry" }, now),
    /backoff has not elapsed/
  );
  job = authorizeContentJobRetry(job, {
    actor: "authorized-operator",
    reason: "Reviewed retained render error and confirmed a safe retry"
  }, Date.parse(afterBackoff) + 1);
  assert.equal(job.state, "QUEUED");
  assert.equal(job.completedAt, null);
  assert.equal(job.retryAuthorizations.length, 1);
  assert.equal(job.retryAuthorizations[0].actor, "authorized-operator");

  const secondAttempt = claimWorkerLease(job, "worker-after-approval", { now: Date.parse(afterBackoff) + 2 });
  assert.equal(secondAttempt.job.attemptCount, 2);
  const deadLetter = completeWorkerLease(secondAttempt.job, secondAttempt.leaseToken, "FAILED", {
    errorDetails: { code: "TRANSIENT_RENDER_FAILURE", retryable: true, message: "Second attempt failed" }
  }, Date.parse(afterBackoff) + 3);
  assert.equal(deadLetter.state, "DEAD_LETTER");
  assert.equal(deadLetter.errorDetails.retryable, false);
  assert.equal(deadLetter.errorDetails.retryableAfterOperatorReview, true);
  assert.equal(deadLetter.deadLetter.reasonCode, "MAX_ATTEMPTS_EXHAUSTED");
  assert.equal(deadLetter.deadLetter.attemptCount, 2);
  assert.equal(deadLetter.transitionHistory.at(-1).to, "DEAD_LETTER");
  assert.throws(
    () => claimWorkerLease(deadLetter, "worker-without-review", { now: Date.parse(afterBackoff) + 4 }),
    /explicit operator retry authorization/
  );
  assert.throws(
    () => authorizeContentJobRetry(deadLetter, {
      actor: "authorized-operator",
      reason: "Attempt to bypass exhausted retry policy"
    }, Date.parse(afterBackoff) + 5),
    /one-attempt operator override/
  );

  const recovered = authorizeContentJobRetry(deadLetter, {
    actor: "authorized-operator",
    reason: "Reviewed dead-letter evidence and explicitly approved one final attempt",
    overrideRetryLimit: true
  }, Date.parse(afterBackoff) + 6);
  assert.equal(recovered.state, "QUEUED");
  assert.equal(recovered.retryPolicy.maxAttempts, 3);
  assert.equal(recovered.retryAuthorizations.length, 2);
  assert.equal(recovered.retryAuthorizations[1].overrideRetryLimit, true);
  const finalAttempt = claimWorkerLease(recovered, "worker-explicit-override", { now: Date.parse(afterBackoff) + 7 });
  assert.equal(finalAttempt.job.attemptCount, 3);
  const exhaustedAgain = completeWorkerLease(finalAttempt.job, finalAttempt.leaseToken, "FAILED", {
    errorDetails: { code: "TRANSIENT_RENDER_FAILURE", retryable: true, message: "Explicitly approved final attempt failed" }
  }, Date.parse(afterBackoff) + 8);
  assert.equal(exhaustedAgain.state, "DEAD_LETTER");
  assert.equal(exhaustedAgain.deadLetterHistory.length, 2);
  assert.equal(exhaustedAgain.retryPolicy.maxAttempts, 3);
});


test("preflight failures can be dead-lettered only after the configured retry limit is exhausted", () => {
  const failed = {
    ...createContentJob(input),
    state: "FAILED",
    attemptCount: 2,
    retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true },
    errorDetails: { code: "RENDER_PREFLIGHT_NOT_READY", retryable: true, retryableAfterOperatorReview: true }
  };
  assert.throws(() => deadLetterExhaustedJob({ ...failed, attemptCount: 1 }), /must exhaust its configured attempts/);
  assert.throws(() => deadLetterExhaustedJob({ ...failed, errorDetails: { retryable: true } }), /operator-review recovery evidence/);
  const deadLetter = deadLetterExhaustedJob(failed, "2026-11-05T12:00:00.000Z", "RENDER_PREFLIGHT_RETRY_LIMIT_EXHAUSTED");
  assert.equal(deadLetter.state, "DEAD_LETTER");
  assert.equal(deadLetter.deadLetter.reasonCode, "RENDER_PREFLIGHT_RETRY_LIMIT_EXHAUSTED");
  assert.equal(deadLetter.deadLetter.attemptCount, 2);
  assert.equal(deadLetter.transitionHistory.at(-1).from, "FAILED");
  assert.equal(deadLetter.transitionHistory.at(-1).to, "DEAD_LETTER");
});

test("cancellation is fenced while script or narration work is active or its outcome is uncertain", () => {
  const now = "2026-10-31T12:00:00.000Z";
  const queued = createContentJob({ ...input, idempotencyKey: "cancel:active-authoring" }, now);
  const activeStages = [
    { authoring: { status: "GENERATING" } },
    { authoring: { status: "RECOVERY_REQUIRED" } },
    { authoring: { status: "AWAITING_HUMAN_EDITORIAL_REVIEW", narrationStage: { status: "GENERATING" } } },
    { authoring: { status: "AWAITING_HUMAN_EDITORIAL_REVIEW", narrationStage: { status: "RECONCILING" } } },
    { authoring: { status: "AWAITING_HUMAN_EDITORIAL_REVIEW", narrationStage: { status: "RECOVERY_REQUIRED" } } }
  ];
  for (const stage of activeStages) {
    assert.throws(
      () => transitionContentJob({ ...queued, ...stage }, "CANCELLED", { actor: "operator", reason: "Cancel request" }, now),
      /active or uncertain script\/narration work/,
      JSON.stringify(stage)
    );
  }
  const completed = { ...queued, authoring: { status: "AWAITING_HUMAN_EDITORIAL_REVIEW", narrationStage: { status: "DRAFT_REVIEW_REQUIRED" } } };
  assert.equal(transitionContentJob(completed, "CANCELLED", { actor: "operator", reason: "Withdraw completed draft" }, now).state, "CANCELLED");
});

test("private-upload approval binds media, thumbnail, validated captions, metadata and rights evidence", () => {
  let job = createContentJob(input);
  const video = { path: "artifacts/fixture.mp4", sha256: "a".repeat(64) };
  const thumbnail = { path: "artifacts/fixture.jpg", sha256: "d".repeat(64) };
  const captions = { path: "artifacts/fixture.srt", sha256: "c".repeat(64) };
  const channelId = "UC" + "A".repeat(22);
  const relationship = {
    childContentId: job.id, childRevision: "rev-child-1", childMediaSha256: video.sha256, childMetadataSha256: "9".repeat(64),
    parentContentId: "parent-job-001", parentRevision: "rev-parent-1", parentMediaSha256: "c".repeat(64), parentMetadataSha256: "d".repeat(64), parentApprovalSha256: "e".repeat(64),
    parentRemoteVideoId: "abcdefghijk", parentCanonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
    parentChannelTitle: "SonicVhibez", parentRemoteTitle: "Approved parent documentary", parentChannelId: channelId, parentRemoteVerified: true, parentPrivacyStatus: "private",
    parentApproved: true, parentRevisionApproved: true, parentPublicationCycleId: "cycle-a", childPublicationCycleId: "cycle-a",
    sourceSegments: [{ sceneId: "scene-01", startSeconds: 10, endSeconds: 20 }],
    relationshipApproved: true, relationshipReviewNotes: "Parent narrative and scene segment reviewed.", relationshipReviewer: "reviewer@example.test", relationshipApprovedAt: "2026-10-23T12:00:00.000Z", parentSourceEvidencePath: "content/long-form-quality-evidence.json", parentSourceEvidenceSha256: "7".repeat(64), relationshipEvidenceSha256: "f".repeat(64),
    nativeRelatedVideo: { status: "BLOCKED_EXTERNAL", blocker: "Private parent cannot use native Related video." }
  };
  relationship.relationshipEvidenceSha256 = shortParentEvidenceSha256(relationship);
  job = {
    ...job,
    state: "AWAITING_HUMAN_REVIEW",
    verifiedChannelId: channelId,
    shortParentRelationship: relationship,
    metadataVersion: "9".repeat(64),
    outputArtifacts: [video],
    thumbnailArtifact: thumbnail,
    validationResults: { passed: true, captionsPath: captions.path, captionsSha256: captions.sha256 },
    rightsChecks: { verified: true, evidenceSha256: "b".repeat(64) }
  };
  const review = {
    decision: "APPROVE",
    reviewer: "reviewer@example.test",
    artifactPath: video.path,
    artifactSha256: video.sha256,
    metadataVersion: "9".repeat(64),
    rightsEvidenceSha256: "b".repeat(64),
    shortParentRelationshipSha256: shortParentRelationshipSha256(relationship),
    relatedArtifacts: [video, thumbnail, captions,
      { path: "rights/source-asset.mp4", sha256: "c".repeat(64) },
      { path: "rights/license.txt", sha256: "d".repeat(64) }
    ],
    id: "review-001"
  };
  const approved = approveContentJobForPrivateUpload(job, review, "2026-10-23T12:00:00.000Z");
  assert.equal(approved.state, "APPROVED_FOR_PRIVATE_UPLOAD");
  assert.equal(approved.humanApproval.artifactSha256, video.sha256);
  assert.throws(() => approveContentJobForPrivateUpload(job, { ...review, artifactSha256: "e".repeat(64) }), /Short parent relationship/);
  assert.throws(() => approveContentJobForPrivateUpload(job, { ...review, metadataVersion: "changed" }), /metadata version/);
  assert.throws(() => approveContentJobForPrivateUpload(job, { ...review, rightsEvidenceSha256: "f".repeat(64) }), /rights evidence/);
  assert.throws(() => approveContentJobForPrivateUpload(job, { ...review, relatedArtifacts: review.relatedArtifacts.filter(item => item.path !== captions.path) }), /does not bind every current media artifact/);
  assert.throws(() => approveContentJobForPrivateUpload(job, { ...review, relatedArtifacts: [...review.relatedArtifacts, review.relatedArtifacts[0]] }), /invalid\/duplicate related-artifact evidence/);
  assert.throws(() => approveContentJobForPrivateUpload({ ...job, validationResults: { passed: true } }, review), /Validated captions path and SHA-256/);
  assert.throws(() => approveContentJobForPrivateUpload({ ...job, validationResults: { ...job.validationResults, passed: false } }, review), /Passing technical validation/);
  assert.throws(() => approveContentJobForPrivateUpload({ ...job, state: "GENERATED" }, review), /awaiting human review/);
});


test("worker lease fences concurrent claims and permits guarded heartbeat/stage completion", () => {
  const start = Date.parse("2026-10-23T12:00:00.000Z");
  const claimed = claimWorkerLease(createContentJob(input), "worker-a", { leaseMs: 10_000, now: start });
  assert.equal(claimed.job.state, "GENERATING");
  assert.ok(claimed.job.workerLease.tokenHash);
  assert.notEqual(claimed.job.workerLease.tokenHash, claimed.leaseToken);
  assert.throws(() => claimWorkerLease(claimed.job, "worker-b", { leaseMs: 10_000, now: start + 1 }), /active worker lease/);
  assert.throws(() => heartbeatWorkerLease(claimed.job, "wrong-token", { now: start + 1 }), /does not match/);
  const beat = heartbeatWorkerLease(claimed.job, claimed.leaseToken, { leaseMs: 15_000, now: start + 2_000 });
  assert.equal(Date.parse(beat.workerLease.expiresAt), start + 17_000);
  assert.throws(() => completeWorkerLease(beat, claimed.leaseToken, "GENERATED", { state: "APPROVED_FOR_PRIVATE_UPLOAD" }, start + 3_000), /protected job field/);
  const generated = completeWorkerLease(beat, claimed.leaseToken, "GENERATED", {
    outputArtifacts: [{ path: "media/fixture.mp4", sha256: "a".repeat(64) }],
    metadataPath: "content/fixture-metadata.json",
    metadataVersion: "meta-sha256:fixture"
  }, start + 3_000);
  assert.equal(generated.state, "GENERATED");
  assert.ok(generated.workerLease);
  const validating = completeWorkerLease(generated, claimed.leaseToken, "VALIDATING", {}, start + 4_000);
  assert.equal(validating.state, "VALIDATING");
  assert.ok(validating.workerLease);
  assert.throws(() => completeWorkerLease(validating, claimed.leaseToken, "AWAITING_HUMAN_REVIEW", {
    validationResults: { passed: true },
    rightsChecks: { verified: true, evidenceSha256: "b".repeat(64) }
  }, start + 5_000), /cannot modify protected job field: validationResults/);
});

test("expired leases fence stale results and enforce bounded retry backoff", () => {
  const start = Date.parse("2026-10-23T12:00:00.000Z");
  const first = claimWorkerLease(createContentJob(input), "worker-a", { leaseMs: 5_000, now: start });
  assert.throws(
    () => heartbeatWorkerLease(first.job, first.leaseToken, { leaseMs: 5_000, now: start + 5_000 }),
    /lease has expired/,
    "renewal at the exact expiry boundary must be rejected"
  );
  const expired = expireWorkerLease(first.job, start + 5_001);
  assert.equal(expired.expired, true);
  assert.equal(expired.job.state, "FAILED");
  assert.equal(expired.job.errorDetails.retryable, true);
  assert.ok(Date.parse(expired.job.nextRetryAt) > start + 5_001);
  assert.equal(expired.job.workerLease, null);
  assert.throws(() => completeWorkerLease(expired.job, first.leaseToken, "GENERATED", {}, start + 5_002), /does not match/);
  assert.throws(() => claimWorkerLease(expired.job, "worker-b", { now: start + 5_002 }), /explicit operator retry authorization/);
  assert.throws(() => authorizeContentJobRetry(expired.job, {
    actor: "operator",
    reason: "Reviewed expired worker lease and retained outputs"
  }, start + 5_002), /backoff has not elapsed/);
  const retryAuthorizationTime = Date.parse(expired.job.nextRetryAt) + 1;
  const authorizedRetry = authorizeContentJobRetry(expired.job, {
    actor: "operator",
    reason: "Reviewed expired worker lease and retained outputs"
  }, retryAuthorizationTime);
  const retry = claimWorkerLease(authorizedRetry, "worker-b", { now: retryAuthorizationTime + 1 });
  assert.equal(retry.job.state, "GENERATING");
  assert.equal(retry.job.attemptCount, 2);
  assert.throws(
    () => heartbeatWorkerLease(retry.job, first.leaseToken, { now: Date.now() }),
    /does not match/,
    "the previous worker's token must remain fenced after a new owner claims the retry"
  );
  assert.throws(
    () => completeWorkerLease(retry.job, first.leaseToken, "GENERATED", {}, Date.now()),
    /does not match/,
    "a stale worker must not complete a job after ownership transfers"
  );
  const secondExpiry = expireWorkerLease(retry.job, Date.parse(retry.job.workerLease.expiresAt) + 1);
  assert.equal(secondExpiry.job.state, "DEAD_LETTER");
  assert.equal(secondExpiry.job.errorDetails.retryable, false);
  assert.equal(secondExpiry.job.errorDetails.retryableAfterOperatorReview, true);
  assert.throws(() => claimWorkerLease(secondExpiry.job, "worker-c", { now: Date.parse(secondExpiry.job.nextRetryAt ?? 0) + 1 }), /explicit operator retry authorization/);
});

test("expired upload lease enters recovery-required rather than retrying", () => {
  const start = Date.parse("2026-10-23T12:00:00.000Z");
  const claimed = claimWorkerLease(createContentJob(input), "worker-a", { leaseMs: 5_000, now: start });
  const uncertain = { ...claimed.job, state: "UPLOADING_PRIVATE" };
  const recovered = expireWorkerLease(uncertain, start + 5_001);
  assert.equal(recovered.job.state, "RECOVERY_REQUIRED");
  assert.equal(recovered.job.errorDetails.retryable, false);
  assert.match(recovered.job.errorDetails.message, /reconciled/);
});


test("content jobs can be cancelled before the private-upload boundary but not during leased or uncertain work", () => {
  const now = "2026-10-31T12:00:00.000Z";
  const queued = createContentJob(input, now);
  const cancelled = transitionContentJob(queued, "CANCELLED", {
    actor: "operator@example.test",
    reason: "Owner withdrew this content request"
  }, now);
  assert.equal(cancelled.state, "CANCELLED");
  assert.equal(cancelled.cancelledAt, now);
  assert.equal(cancelled.cancelledBy, "operator@example.test");
  assert.equal(cancelled.cancelReason, "Owner withdrew this content request");
  assert.equal(cancelled.completedAt, now);
  assert.equal(cancelled.nextRetryAt, null);
  assert.throws(() => transitionContentJob(cancelled, "QUEUED"), /Invalid job transition/);

  const start = Date.parse(now);
  const leased = claimWorkerLease(createContentJob({ ...input, idempotencyKey: "cancel:leased-job" }, now),
    "worker-cancel-test", { leaseMs: 60_000, now: start });
  assert.throws(() => transitionContentJob(leased.job, "CANCELLED", {
    actor: "operator@example.test",
    reason: "Cannot interrupt an active worker"
  }, now), /worker lease cannot be cancelled/);

  for (const state of ["RECOVERY_REQUIRED", "APPROVED_FOR_PRIVATE_UPLOAD", "UPLOADING_PRIVATE", "PRIVATE_UPLOAD_VERIFIED"]) {
    assert.throws(() => transitionContentJob({ ...queued, state }, "CANCELLED", {
      actor: "operator@example.test",
      reason: "Must preserve uncertain or protected work"
    }, now), /private-upload boundary cannot be cancelled/);
  }
});

test("malformed persisted worker lease expiry timestamps fail closed across claim, heartbeat, completion and reaping", () => {
  const start = Date.parse("2026-11-06T12:00:00.000Z");
  const claimed = claimWorkerLease(createContentJob(input), "worker-malformed-lease", { leaseMs: 10_000, now: start });
  const malformed = {
    ...claimed.job,
    workerLease: { ...claimed.job.workerLease, expiresAt: "not-a-timestamp" }
  };
  const before = structuredClone(malformed);

  assert.throws(
    () => claimWorkerLease(malformed, "worker-replacement", { now: start + 1 }),
    /expiry timestamp is invalid; operator reconciliation is required/
  );
  assert.throws(
    () => heartbeatWorkerLease(malformed, claimed.leaseToken, { now: start + 1 }),
    /expiry timestamp is invalid; operator reconciliation is required/
  );
  assert.throws(
    () => completeWorkerLease(malformed, claimed.leaseToken, "GENERATED", {}, start + 1),
    /expiry timestamp is invalid; operator reconciliation is required/
  );
  assert.throws(
    () => expireWorkerLease(malformed, start + 20_000),
    /expiry timestamp is invalid; operator reconciliation is required/
  );
  assert.deepEqual(malformed, before, "invalid persisted lease data must remain untouched for operator inspection");
});
