import test from "node:test";
import assert from "node:assert/strict";
import { createContentJob, transitionContentJob } from "../scripts/content-job-lifecycle.mjs";

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
  assert.throws(() => createContentJob({ ...input, scheduledDay: "Tuesday" }), /conflicts/);
  assert.throws(() => createContentJob({ ...input, scheduledDate: "2026-10-23" }), /weekday/);
  assert.throws(() => createContentJob({ ...input, scheduledDate: "2026-10-23" }), /weekday/);
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
