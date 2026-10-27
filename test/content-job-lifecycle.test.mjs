import test from "node:test";
import assert from "node:assert/strict";
import { createContentJob, transitionContentJob, approveContentJobForPrivateUpload, claimWorkerLease, heartbeatWorkerLease, completeWorkerLease, expireWorkerLease } from "../scripts/content-job-lifecycle.mjs";
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

test("retry requires a retryable failure and respects the attempt limit", () => {
  let job = createContentJob(input);
  job = transitionContentJob(job, "FAILED", { reason: "Input missing" });
  assert.throws(() => transitionContentJob(job, "QUEUED"), /not marked safe for retry/);
  job = { ...job, errorDetails: { retryable: true } };
  job = transitionContentJob(job, "QUEUED", { reason: "Operator approved retry" });
  job = transitionContentJob(job, "GENERATING", { reason: "First attempt started" });
  job = { ...job, errorDetails: { retryable: true } };
  job = transitionContentJob(job, "FAILED", { reason: "First attempt failed" });
  job = transitionContentJob(job, "QUEUED", { reason: "Operator approved second attempt" });
  job = transitionContentJob(job, "GENERATING", { reason: "Second attempt started" });
  job = { ...job, errorDetails: { retryable: true } };
  job = transitionContentJob(job, "FAILED", { reason: "Second attempt failed" });
  assert.throws(() => transitionContentJob(job, "QUEUED"), /Retry limit reached/);
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
    relatedArtifacts: [video, thumbnail, captions],
    id: "review-001"
  };
  const approved = approveContentJobForPrivateUpload(job, review, "2026-10-23T12:00:00.000Z");
  assert.equal(approved.state, "APPROVED_FOR_PRIVATE_UPLOAD");
  assert.equal(approved.humanApproval.artifactSha256, video.sha256);
  assert.throws(() => approveContentJobForPrivateUpload(job, { ...review, artifactSha256: "e".repeat(64) }), /Short parent relationship/);
  assert.throws(() => approveContentJobForPrivateUpload(job, { ...review, metadataVersion: "changed" }), /metadata version/);
  assert.throws(() => approveContentJobForPrivateUpload(job, { ...review, rightsEvidenceSha256: "f".repeat(64) }), /rights evidence/);
  assert.throws(() => approveContentJobForPrivateUpload(job, { ...review, relatedArtifacts: review.relatedArtifacts.filter(item => item.path !== captions.path) }), /does not bind every current media artifact/);
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
  const expired = expireWorkerLease(first.job, start + 5_001);
  assert.equal(expired.expired, true);
  assert.equal(expired.job.state, "FAILED");
  assert.equal(expired.job.errorDetails.retryable, true);
  assert.ok(Date.parse(expired.job.nextRetryAt) > start + 5_001);
  assert.equal(expired.job.workerLease, null);
  assert.throws(() => completeWorkerLease(expired.job, first.leaseToken, "GENERATED", {}, start + 5_002), /does not match/);
  assert.throws(() => claimWorkerLease(expired.job, "worker-b", { now: start + 5_002 }), /backoff has not elapsed/);
  const retry = claimWorkerLease(expired.job, "worker-b", { now: Date.parse(expired.job.nextRetryAt) + 1 });
  assert.equal(retry.job.state, "GENERATING");
  assert.equal(retry.job.attemptCount, 2);
  const secondExpiry = expireWorkerLease(retry.job, Date.parse(retry.job.workerLease.expiresAt) + 1);
  assert.equal(secondExpiry.job.state, "FAILED");
  assert.equal(secondExpiry.job.errorDetails.retryable, false);
  assert.throws(() => claimWorkerLease(secondExpiry.job, "worker-c", { now: Date.parse(secondExpiry.job.nextRetryAt ?? 0) + 1 }), /Retry limit reached/);
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
