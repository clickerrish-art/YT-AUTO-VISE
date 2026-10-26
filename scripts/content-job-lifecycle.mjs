import crypto from "node:crypto";
import { assertShortParentRelationship, shortParentRelationshipSha256 } from "./short-parent-relationship.mjs";

export const JOB_STATES = Object.freeze([
  "QUEUED", "GENERATING", "GENERATED", "VALIDATING", "BLOCKED",
  "AWAITING_HUMAN_REVIEW", "REJECTED", "APPROVED_FOR_PRIVATE_UPLOAD", "UPLOADING_PRIVATE",
  "PRIVATE_UPLOAD_VERIFIED", "FAILED", "RECOVERY_REQUIRED"
]);

const transitions = {
  QUEUED: new Set(["GENERATING", "BLOCKED", "FAILED"]),
  GENERATING: new Set(["GENERATED", "BLOCKED", "FAILED", "RECOVERY_REQUIRED"]),
  GENERATED: new Set(["VALIDATING", "BLOCKED", "FAILED"]),
  VALIDATING: new Set(["AWAITING_HUMAN_REVIEW", "BLOCKED", "FAILED", "RECOVERY_REQUIRED"]),
  BLOCKED: new Set(["FAILED"]),
  AWAITING_HUMAN_REVIEW: new Set(["BLOCKED", "FAILED", "REJECTED"]),
  REJECTED: new Set(),
  APPROVED_FOR_PRIVATE_UPLOAD: new Set(),
  UPLOADING_PRIVATE: new Set(),
  PRIVATE_UPLOAD_VERIFIED: new Set(),
  FAILED: new Set(["QUEUED"]),
  RECOVERY_REQUIRED: new Set(["BLOCKED", "FAILED"])
};

const protectedStates = new Set(["APPROVED_FOR_PRIVATE_UPLOAD", "UPLOADING_PRIVATE", "PRIVATE_UPLOAD_VERIFIED"]);

export function createContentJob(input, now = new Date().toISOString()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Job request must be an object");
  const idempotencyKey = String(input.idempotencyKey ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9:_-]{2,119}$/.test(idempotencyKey)) throw new Error("idempotencyKey must be 3–120 safe characters");
  const title = String(input.title ?? "").trim();
  const topic = String(input.topic ?? "").trim();
  const contentType = input.contentType;
  const scheduledDay = input.scheduledDay;
  const scheduledDate = String(input.scheduledDate ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) || Number.isNaN(Date.parse(scheduledDate + "T12:00:00Z")) || new Date(scheduledDate + "T12:00:00Z").toISOString().slice(0, 10) !== scheduledDate) throw new Error("scheduledDate must be a real YYYY-MM-DD date");
  const actualDay = new Date(scheduledDate + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  if (actualDay !== scheduledDay) throw new Error("scheduledDate weekday must match scheduledDay");
  if (!title || title.length > 100) throw new Error("title is required and must be at most 100 characters");
  if (!topic || topic.length > 300) throw new Error("topic is required and must be at most 300 characters");
  if (!["long_form", "short"].includes(contentType)) throw new Error("contentType must be long_form or short");
  if (!["Tuesday", "Thursday", "Saturday"].includes(scheduledDay)) throw new Error("scheduledDay must match an authorized weekly slot");
  if ((scheduledDay === "Saturday") !== (contentType === "short")) throw new Error("contentType conflicts with the authoritative scheduled day");
  const inputReferences = input.inputReferences ?? [];
  if (!Array.isArray(inputReferences) || inputReferences.length > 30 || inputReferences.some(x => typeof x !== "string" || !x.trim() || x.length > 500)) {
    throw new Error("inputReferences must be an array of at most 30 non-empty strings (max 500 characters each)");
  }
  const fingerprint = crypto.createHash("sha256").update(JSON.stringify({ title, topic, contentType, scheduledDay, scheduledDate, inputReferences })).digest("hex");
  return {
    id: crypto.randomUUID(),
    idempotencyKey,
    requestFingerprint: fingerprint,
    kind: "CONTENT_PRODUCTION",
    title,
    topic,
    contentType,
    scheduledSlot: { date: scheduledDate, day: scheduledDay, time: "17:00", timezone: "Africa/Johannesburg", idempotencyKey: `slot:${scheduledDate}:17:00:Africa/Johannesburg` },
    inputReferences,
    state: "QUEUED",
    createdAt: now,
    startedAt: null,
    completedAt: null,
    updatedAt: now,
    transitionHistory: [{ from: null, to: "QUEUED", at: now, actor: "local-operator", reason: "Job created" }],
    outputArtifacts: [],
    thumbnailArtifact: null,
    validationResults: null,
    rightsChecks: null,
    humanApproval: null,
    attemptCount: 0,
    retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true },
    workerLease: null,
    metadataPath: null,
    leaseHistory: [],
    nextRetryAt: null,
    errorDetails: null,
    remoteVideoId: null,
    uploadReceipt: null,
    publishingEnabled: false
  };
}

export function transitionContentJob(job, nextState, { actor = "local-operator", reason = "" } = {}, now = new Date().toISOString()) {
  if (!job || !JOB_STATES.includes(job.state)) throw new Error("Existing job has an invalid state");
  if (!JOB_STATES.includes(nextState)) throw new Error("Unknown job state");
  if (protectedStates.has(nextState)) throw new Error("This state requires a separate verified private-upload workflow and cannot be set through the dashboard transition API");
  if (!transitions[job.state]?.has(nextState)) throw new Error("Invalid job transition: " + job.state + " -> " + nextState);
  if (typeof actor !== "string" || !actor.trim() || actor.length > 120) throw new Error("actor is required and must be at most 120 characters");
  if (typeof reason !== "string" || reason.length > 1000) throw new Error("reason must be at most 1000 characters");
  if (nextState === "REJECTED" && job.state !== "AWAITING_HUMAN_REVIEW") throw new Error("Only a job awaiting human review may be rejected");
  if (nextState === "AWAITING_HUMAN_REVIEW") {
    if (job.validationResults?.passed !== true) throw new Error("A passing format-specific validation result is required before human review");
    if (job.rightsChecks?.verified !== true) throw new Error("Verified rights evidence is required before human review");
    if (!job.outputArtifacts?.some(a => typeof a.sha256 === "string" && /^[a-f0-9]{64}$/.test(a.sha256))) throw new Error("A checksummed output artifact is required before human review");
  }
  if (job.state === "FAILED" && nextState === "QUEUED") {
    if (job.attemptCount >= (job.retryPolicy?.maxAttempts ?? 0)) throw new Error("Retry limit reached");
    if (job.errorDetails?.retryable !== true) throw new Error("Failure is not marked safe for retry");
  }
  const updated = { ...job, state: nextState, updatedAt: now, transitionHistory: [...(job.transitionHistory ?? []), { from: job.state, to: nextState, at: now, actor: actor.trim(), reason: reason.trim() }] };
  if (nextState === "GENERATING") {
    updated.startedAt ??= now;
    updated.attemptCount = (updated.attemptCount ?? 0) + 1;
  }
  if (["PRIVATE_UPLOAD_VERIFIED", "FAILED", "BLOCKED", "REJECTED"].includes(nextState)) updated.completedAt = now;
  return updated;
}


/** Evidence-gated human approval; callers must independently verify the files and rights evidence. */
export function approveContentJobForPrivateUpload(job, review, now = new Date().toISOString()) {
  if (!job || job.state !== "AWAITING_HUMAN_REVIEW") throw new Error("Job must be awaiting human review");
  if (job.validationResults?.passed !== true) throw new Error("Passing technical validation is required before approval");
  if (!review || review.decision !== "APPROVE" || !review.reviewer || !review.artifactSha256 || !review.metadataVersion || !review.rightsEvidenceSha256) {
    throw new Error("Complete artifact-bound approval evidence is required");
  }
  if (job.contentType === "short") {
    assertShortParentRelationship(job.shortParentRelationship, { childContentId: job.id, childMediaSha256: review.artifactSha256, childMetadataSha256: review.metadataVersion, channelId: job.verifiedChannelId });
    const relationshipDigest = shortParentRelationshipSha256(job.shortParentRelationship);
    if (review.shortParentRelationshipSha256 !== relationshipDigest) throw new Error("Approval does not bind the current Short-to-parent relationship");
  }
  const artifact = (job.outputArtifacts ?? []).find(item => item.path === review.artifactPath && item.sha256 === review.artifactSha256);
  if (!artifact) throw new Error("Approval artifact checksum does not match a generated job artifact");
  const captionsPath = job.validationResults?.captionsPath;
  const captionsSha256 = job.validationResults?.captionsSha256;
  if (typeof captionsPath !== "string" || !captionsPath.trim() || !/^[a-f0-9]{64}$/.test(captionsSha256 ?? "")) throw new Error("Validated captions path and SHA-256 are required before private-upload approval");
  const actualRelated = [...(job.outputArtifacts ?? []), ...(job.thumbnailArtifact ? [job.thumbnailArtifact] : []), { path: captionsPath, sha256: captionsSha256 }].map(item => ({ path: item.path, sha256: item.sha256 })).sort((a,b) => a.path.localeCompare(b.path));
  const reviewedRelated = (review.relatedArtifacts ?? [{ path: review.artifactPath, sha256: review.artifactSha256 }]).map(item => ({ path: item.path, sha256: item.sha256 })).sort((a,b) => a.path.localeCompare(b.path));
  if (JSON.stringify(actualRelated) !== JSON.stringify(reviewedRelated)) throw new Error("Approval does not bind every current media artifact and thumbnail");
  if (job.metadataVersion !== review.metadataVersion) throw new Error("Approval metadata version does not match the job's validated metadata");
  if (job.rightsChecks?.verified !== true || job.rightsChecks?.evidenceSha256 !== review.rightsEvidenceSha256) {
    throw new Error("Approval rights evidence does not match the job's verified rights record");
  }
  return {
    ...job,
    state: "APPROVED_FOR_PRIVATE_UPLOAD",
    humanApproval: structuredClone(review),
    updatedAt: now,
    transitionHistory: [...(job.transitionHistory ?? []), {
      from: "AWAITING_HUMAN_REVIEW",
      to: "APPROVED_FOR_PRIVATE_UPLOAD",
      at: now,
      actor: review.reviewer,
      reason: "Human approval bound to artifact checksum, metadata version and rights evidence"
    }]
  };
}


const leaseDurationBounds = { min: 5_000, max: 15 * 60_000 };
const retryDelay = (attemptCount) => Math.min(15 * 60_000, 30_000 * (2 ** Math.max(0, attemptCount - 1)));
const hashLeaseToken = token => crypto.createHash("sha256").update(token).digest("hex");

export function claimWorkerLease(job, workerId, { leaseMs = 60_000, now = Date.now() } = {}) {
  if (!job || !JOB_STATES.includes(job.state)) throw new Error("Existing job has an invalid state");
  if (typeof workerId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(workerId)) throw new Error("workerId must be a safe 2–120 character identifier");
  if (!Number.isInteger(leaseMs) || leaseMs < leaseDurationBounds.min || leaseMs > leaseDurationBounds.max) throw new Error("lease duration must be between 5 seconds and 15 minutes");
  if (job.workerLease && Date.parse(job.workerLease.expiresAt) > now) throw new Error("Job already has an active worker lease");
  let working = job;
  if (working.state === "FAILED") {
    if (working.attemptCount >= (working.retryPolicy?.maxAttempts ?? 0)) throw new Error("Retry limit reached");
    if (working.errorDetails?.retryable !== true) throw new Error("Only retryable failures may be leased again");
    if (working.nextRetryAt && Date.parse(working.nextRetryAt) > now) throw new Error("Retry backoff has not elapsed");
    working = transitionContentJob(working, "QUEUED", { actor: workerId, reason: "Retry backoff elapsed; worker claimed retry" }, new Date(now).toISOString());
  }
  if (working.state !== "QUEUED") throw new Error("Only queued or eligible retryable jobs can be claimed");
  const claimedAt = new Date(now).toISOString();
  const token = crypto.randomUUID();
  working = transitionContentJob(working, "GENERATING", { actor: workerId, reason: "Worker lease acquired" }, claimedAt);
  working.workerLease = { workerId, tokenHash: hashLeaseToken(token), claimedAt, heartbeatAt: claimedAt, expiresAt: new Date(now + leaseMs).toISOString() };
  working.leaseHistory = [...(working.leaseHistory ?? []), { workerId, action: "CLAIMED", at: claimedAt, expiresAt: working.workerLease.expiresAt }];
  working.nextRetryAt = null;
  return { job: working, leaseToken: token };
}

export function heartbeatWorkerLease(job, leaseToken, { leaseMs = 60_000, now = Date.now() } = {}) {
  if (!job?.workerLease || job.workerLease.tokenHash !== hashLeaseToken(String(leaseToken ?? ""))) throw new Error("Worker lease token does not match");
  if (Date.parse(job.workerLease.expiresAt) <= now) throw new Error("Worker lease has expired");
  if (!Number.isInteger(leaseMs) || leaseMs < leaseDurationBounds.min || leaseMs > leaseDurationBounds.max) throw new Error("lease duration must be between 5 seconds and 5 minutes");
  const timestamp = new Date(now).toISOString();
  const expiresAt = new Date(now + leaseMs).toISOString();
  return {
    ...job,
    updatedAt: timestamp,
    workerLease: { ...job.workerLease, heartbeatAt: timestamp, expiresAt },
    leaseHistory: [...(job.leaseHistory ?? []), { workerId: job.workerLease.workerId, action: "HEARTBEAT", at: timestamp, expiresAt }]
  };
}

export function completeWorkerLease(job, leaseToken, nextState, patch = {}, now = Date.now()) {
  if (!job?.workerLease || job.workerLease.tokenHash !== hashLeaseToken(String(leaseToken ?? ""))) throw new Error("Worker lease token does not match");
  if (Date.parse(job.workerLease.expiresAt) <= now) throw new Error("Worker lease has expired");
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new Error("Worker result must be an object");
  const allowedPatchKeys = new Set(["outputArtifacts", "thumbnailArtifact", "metadataPath", "metadataVersion", "errorDetails"]);
  for (const key of Object.keys(patch)) if (!allowedPatchKeys.has(key)) throw new Error("Worker cannot modify protected job field: " + key);
  let updated = { ...job, ...structuredClone(patch) };
  updated = transitionContentJob(updated, nextState, {
    actor: job.workerLease.workerId,
    reason: nextState === "FAILED" ? String(patch.errorDetails?.message ?? "Worker reported failure") : "Worker stage completed"
  }, new Date(now).toISOString());
  const timestamp = new Date(now).toISOString();
  const terminalStage = ["AWAITING_HUMAN_REVIEW", "BLOCKED", "FAILED", "RECOVERY_REQUIRED"].includes(nextState);
  updated.workerLease = terminalStage ? null : job.workerLease;
  updated.leaseHistory = [...(updated.leaseHistory ?? []), { workerId: job.workerLease.workerId, action: terminalStage ? "RELEASED" : "STAGE_COMPLETED", at: timestamp, state: nextState }];
  if (nextState === "FAILED") {
    const retryable = updated.errorDetails?.retryable === true && updated.attemptCount < (updated.retryPolicy?.maxAttempts ?? 0);
    updated.errorDetails = { ...updated.errorDetails, retryable };
    updated.nextRetryAt = retryable ? new Date(now + retryDelay(updated.attemptCount)).toISOString() : null;
  }
  return updated;
}

export function expireWorkerLease(job, now = Date.now()) {
  if (!job?.workerLease || Date.parse(job.workerLease.expiresAt) > now) return { job, expired: false };
  const previous = job.state;
  const timestamp = new Date(now).toISOString();
  let updated;
  if (previous === "UPLOADING_PRIVATE") {
    updated = { ...job, state: "RECOVERY_REQUIRED", updatedAt: timestamp, completedAt: timestamp,
      errorDetails: { code: "UPLOAD_LEASE_EXPIRED", retryable: false, message: "Upload lease expired; remote outcome must be reconciled before retrying." },
      transitionHistory: [...(job.transitionHistory ?? []), { from: previous, to: "RECOVERY_REQUIRED", at: timestamp, actor: "lease-reaper", reason: "Expired upload lease; outcome uncertain" }] };
  } else {
    const canRetry = job.attemptCount < (job.retryPolicy?.maxAttempts ?? 0);
    updated = transitionContentJob(job, "FAILED", { actor: "lease-reaper", reason: "Worker lease expired; stale worker results are fenced off" }, timestamp);
    updated.errorDetails = { code: "WORKER_LEASE_EXPIRED", retryable: canRetry, message: "Worker lease expired; inspect outputs before retrying." };
    updated.nextRetryAt = canRetry ? new Date(now + retryDelay(updated.attemptCount)).toISOString() : null;
  }
  updated.workerLease = null;
  updated.leaseHistory = [...(updated.leaseHistory ?? []), { workerId: job.workerLease.workerId, action: "EXPIRED", at: timestamp, previousState: previous }];
  return { job: updated, expired: true };
}
