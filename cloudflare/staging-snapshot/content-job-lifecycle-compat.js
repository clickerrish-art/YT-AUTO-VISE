export const JOB_STATES = Object.freeze([
  "QUEUED", "GENERATING", "GENERATED", "VALIDATING", "BLOCKED", "CANCELLED",
  "AWAITING_HUMAN_REVIEW", "REJECTED", "APPROVED_FOR_PRIVATE_UPLOAD", "UPLOADING_PRIVATE",
  "PRIVATE_UPLOAD_VERIFIED", "FAILED", "DEAD_LETTER", "RECOVERY_REQUIRED"
]);

const transitions = {
  QUEUED: new Set(["GENERATING", "BLOCKED", "FAILED", "CANCELLED"]),
  GENERATING: new Set(["GENERATED", "BLOCKED", "FAILED", "RECOVERY_REQUIRED", "CANCELLED"]),
  GENERATED: new Set(["VALIDATING", "BLOCKED", "FAILED", "CANCELLED"]),
  VALIDATING: new Set(["AWAITING_HUMAN_REVIEW", "BLOCKED", "FAILED", "RECOVERY_REQUIRED", "CANCELLED"]),
  BLOCKED: new Set(["FAILED", "CANCELLED"]),
  AWAITING_HUMAN_REVIEW: new Set(["BLOCKED", "FAILED", "REJECTED", "CANCELLED"]),
  REJECTED: new Set(),
  APPROVED_FOR_PRIVATE_UPLOAD: new Set(),
  UPLOADING_PRIVATE: new Set(),
  PRIVATE_UPLOAD_VERIFIED: new Set(),
  FAILED: new Set(["CANCELLED"]),
  DEAD_LETTER: new Set(["CANCELLED"]),
  RECOVERY_REQUIRED: new Set(["BLOCKED", "FAILED"])
};

const protectedStates = new Set(["APPROVED_FOR_PRIVATE_UPLOAD", "UPLOADING_PRIVATE", "PRIVATE_UPLOAD_VERIFIED"]);

export function transitionContentJob(job, nextState, { actor = "local-operator", reason = "" } = {}, now = new Date().toISOString()) {
  if (!job || !JOB_STATES.includes(job.state)) throw new Error("Existing job has an invalid state");
  if (!JOB_STATES.includes(nextState)) throw new Error("Unknown job state");
  if (protectedStates.has(nextState)) throw new Error("This state requires a separate verified private-upload workflow and cannot be set through the dashboard transition API");
  if (nextState === "CANCELLED") {
    if (job.workerLease) throw new Error("A job with a worker lease cannot be cancelled; wait for the worker to finish or reap its expired lease first");
    const activeOrUncertainAuthoring = new Set(["GENERATING", "RECONCILING", "RECOVERY_REQUIRED"]);
    if (activeOrUncertainAuthoring.has(job.authoring?.status) || activeOrUncertainAuthoring.has(job.authoring?.narrationStage?.status)) {
      throw new Error("A job with active or uncertain script/narration work cannot be cancelled; wait for completion or reconcile the existing attempt first");
    }
    if (["RECOVERY_REQUIRED", "APPROVED_FOR_PRIVATE_UPLOAD", "UPLOADING_PRIVATE", "PRIVATE_UPLOAD_VERIFIED"].includes(job.state)) {
      throw new Error("A job at or beyond the private-upload boundary cannot be cancelled; reconcile or complete it first");
    }
  }
  if (["FAILED", "DEAD_LETTER"].includes(job.state) && nextState === "QUEUED") {
    throw new Error("Retry requires explicit operator authorization through the retry workflow");
  }
  if (!transitions[job.state]?.has(nextState)) throw new Error("Invalid job transition: " + job.state + " -> " + nextState);
  if (typeof actor !== "string" || !actor.trim() || actor.length > 120) throw new Error("actor is required and must be at most 120 characters");
  if (typeof reason !== "string" || reason.length > 1000) throw new Error("reason must be at most 1000 characters");
  if (nextState === "REJECTED" && job.state !== "AWAITING_HUMAN_REVIEW") throw new Error("Only a job awaiting human review may be rejected");
  if (nextState === "AWAITING_HUMAN_REVIEW") {
    if (job.validationResults?.passed !== true) throw new Error("A passing format-specific validation result is required before human review");
    if (job.rightsChecks?.verified !== true) throw new Error("Verified rights evidence is required before human review");
    if (!job.outputArtifacts?.some(a => typeof a.sha256 === "string" && /^[a-f0-9]{64}$/.test(a.sha256))) throw new Error("A checksummed output artifact is required before human review");
  }
  const updated = {
    ...job,
    state: nextState,
    updatedAt: now,
    transitionHistory: [...(job.transitionHistory ?? []), {
      from: job.state, to: nextState, at: now, actor: actor.trim(), reason: reason.trim()
    }]
  };
  if (nextState === "GENERATING") {
    updated.startedAt ??= now;
    updated.attemptCount = (updated.attemptCount ?? 0) + 1;
  }
  if (nextState === "CANCELLED") {
    updated.cancelledAt = now;
    updated.cancelledBy = actor.trim();
    updated.cancelReason = reason.trim() || "Cancelled by operator";
    updated.nextRetryAt = null;
  }
  if (["PRIVATE_UPLOAD_VERIFIED", "FAILED", "BLOCKED", "REJECTED", "CANCELLED"].includes(nextState)) updated.completedAt = now;
  return updated;
}


/** Re-queue a failed job only after authenticated operator review and retry-policy checks. */
export function authorizeContentJobRetry(job, {
  actor,
  reason,
  overrideRetryLimit = false
} = {}, now = Date.now()) {
  if (!job || !["FAILED", "DEAD_LETTER"].includes(job.state)) {
    throw new Error("Only failed or dead-letter jobs can receive retry authorization");
  }
  if (job.workerLease) throw new Error("A leased job cannot be manually re-queued");
  if (typeof actor !== "string" || !actor.trim() || actor.length > 120) {
    throw new Error("An authenticated operator identity is required for retry authorization");
  }
  if (typeof reason !== "string" || reason.trim().length < 8 || reason.length > 1000) {
    throw new Error("A retry review reason of 8–1000 characters is required");
  }
  if (job.retryPolicy?.requiresOperatorRetry !== true) {
    throw new Error("This job does not declare the required operator retry policy");
  }
  if (/^RENDER_(?:ARTIFACT|MANIFEST)_RECOVERY_REQUIRED$/.test(job.errorDetails?.code ?? "") &&
      job.renderRecovery?.verifiedAbsent !== true) {
    throw new Error("Retained render artifacts must be reconciled and verified absent before retry authorization");
  }
  if (job.nextRetryAt) {
    const retryAt = Date.parse(job.nextRetryAt);
    if (!Number.isFinite(retryAt)) throw new Error("Persisted retry time is invalid; operator reconciliation is required");
    if (retryAt > now) throw new Error("Retry backoff has not elapsed");
  }
  const maxAttempts = job.retryPolicy?.maxAttempts;
  const attemptCount = job.attemptCount;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || !Number.isInteger(attemptCount) || attemptCount < 0) {
    throw new Error("Retry policy or attempt count is invalid");
  }
  const exhausted = attemptCount >= maxAttempts;
  if (exhausted) {
    if (job.state !== "DEAD_LETTER" || overrideRetryLimit !== true || job.errorDetails?.retryableAfterOperatorReview !== true) {
      throw new Error("Retry limit exhausted; a dead-letter job requires an explicit one-attempt operator override after review");
    }
  } else if (job.errorDetails?.retryable !== true) {
    throw new Error("Failure is not marked safe for retry");
  }
  if (!exhausted && overrideRetryLimit === true) {
    throw new Error("Retry-limit override is only valid for an exhausted dead-letter job");
  }
  const timestamp = new Date(now).toISOString();
  const authorization = {
    actor: actor.trim(), reason: reason.trim(), at: timestamp,
    attemptCount, previousMaxAttempts: maxAttempts, overrideRetryLimit: exhausted
  };
  return {
    ...job,
    state: "QUEUED",
    updatedAt: timestamp,
    completedAt: null,
    nextRetryAt: null,
    retryPolicy: exhausted ? { ...job.retryPolicy, maxAttempts: attemptCount + 1 } : job.retryPolicy,
    errorDetails: { ...job.errorDetails, retryable: true, retryableAfterOperatorReview: false },
    retryAuthorizations: [...(job.retryAuthorizations ?? []), authorization],
    transitionHistory: [...(job.transitionHistory ?? []), {
      from: job.state, to: "QUEUED", at: timestamp, actor: actor.trim(), reason: reason.trim()
    }]
  };
}


const leaseDurationBounds = { min: 5_000, max: 15 * 60_000 };
const retryDelay = attemptCount => Math.min(15 * 60_000, 30_000 * (2 ** Math.max(0, attemptCount - 1)));

async function hashLeaseToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(token ?? "")));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function workerLeaseExpiryMs(job) {
  const value = job?.workerLease?.expiresAt;
  const timestamp = typeof value === "string" ? Date.parse(value) : NaN;
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    throw new Error("Worker lease expiry timestamp is invalid; operator reconciliation is required");
  }
  return timestamp;
}

export async function claimWorkerLease(job, workerId, { leaseMs = 60_000, now = Date.now() } = {}) {
  if (!job || !JOB_STATES.includes(job.state)) throw new Error("Existing job has an invalid state");
  if (typeof workerId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(workerId)) throw new Error("workerId must be a safe 2–120 character identifier");
  if (!Number.isInteger(leaseMs) || leaseMs < leaseDurationBounds.min || leaseMs > leaseDurationBounds.max) throw new Error("lease duration must be between 5 seconds and 15 minutes");
  if (job.workerLease && workerLeaseExpiryMs(job) > now) throw new Error("Job already has an active worker lease");
  if (job.state === "FAILED" || job.state === "DEAD_LETTER") throw new Error("A failed job requires explicit operator retry authorization before a worker can claim it");
  if (job.state !== "QUEUED") throw new Error("Only queued jobs with explicit retry authorization can be claimed");
  const claimedAt = new Date(now).toISOString();
  const token = crypto.randomUUID();
  const updated = transitionContentJob(job, "GENERATING", { actor: workerId, reason: "Worker lease acquired" }, claimedAt);
  updated.workerLease = {
    workerId, tokenHash: await hashLeaseToken(token), claimedAt, heartbeatAt: claimedAt,
    expiresAt: new Date(now + leaseMs).toISOString()
  };
  updated.leaseHistory = [...(updated.leaseHistory ?? []), {
    workerId, action: "CLAIMED", at: claimedAt, expiresAt: updated.workerLease.expiresAt
  }];
  updated.nextRetryAt = null;
  return { job: updated, leaseToken: token };
}

export async function heartbeatWorkerLease(job, leaseToken, { leaseMs = 60_000, now = Date.now() } = {}) {
  if (!job?.workerLease || job.workerLease.tokenHash !== await hashLeaseToken(leaseToken)) throw new Error("Worker lease token does not match");
  if (workerLeaseExpiryMs(job) <= now) throw new Error("Worker lease has expired");
  if (!Number.isInteger(leaseMs) || leaseMs < leaseDurationBounds.min || leaseMs > 5 * 60_000) throw new Error("lease duration must be between 5 seconds and 5 minutes");
  const timestamp = new Date(now).toISOString();
  const expiresAt = new Date(now + leaseMs).toISOString();
  return {
    ...job,
    updatedAt: timestamp,
    workerLease: { ...job.workerLease, heartbeatAt: timestamp, expiresAt },
    leaseHistory: [...(job.leaseHistory ?? []), {
      workerId: job.workerLease.workerId, action: "HEARTBEAT", at: timestamp, expiresAt
    }]
  };
}

function deadLetterExhaustedJob(job, now = Date.now(), reasonCode = "MAX_ATTEMPTS_EXHAUSTED") {
  if (!job || job.state !== "FAILED") throw new Error("Only a failed job can be moved to dead letter");
  if (!Number.isInteger(job.attemptCount) || !Number.isInteger(job.retryPolicy?.maxAttempts) || job.attemptCount < job.retryPolicy.maxAttempts) {
    throw new Error("A job must exhaust its configured attempts before dead-lettering");
  }
  if (job.errorDetails?.retryableAfterOperatorReview !== true) throw new Error("Dead-lettering requires retained operator-review recovery evidence");
  const timestamp = new Date(now).toISOString();
  const entry = {
    reasonCode, at: timestamp, attemptCount: job.attemptCount,
    maxAttempts: job.retryPolicy?.maxAttempts ?? null, errorCode: job.errorDetails?.code ?? null,
    message: "Automatic retries are exhausted. An operator must review the retained failure evidence before authorizing one additional attempt."
  };
  return {
    ...job, state: "DEAD_LETTER", updatedAt: timestamp, completedAt: timestamp,
    deadLetter: entry, deadLetterHistory: [...(job.deadLetterHistory ?? []), entry],
    transitionHistory: [...(job.transitionHistory ?? []), {
      from: "FAILED", to: "DEAD_LETTER", at: timestamp, actor: "retry-policy",
      reason: "Retry limit exhausted; held for explicit operator recovery"
    }]
  };
}

export async function completeWorkerLease(job, leaseToken, nextState, patch = {}, now = Date.now()) {
  if (!job?.workerLease || job.workerLease.tokenHash !== await hashLeaseToken(leaseToken)) throw new Error("Worker lease token does not match");
  if (workerLeaseExpiryMs(job) <= now) throw new Error("Worker lease has expired");
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
  updated.leaseHistory = [...(updated.leaseHistory ?? []), {
    workerId: job.workerLease.workerId, action: terminalStage ? "RELEASED" : "STAGE_COMPLETED",
    at: timestamp, state: nextState
  }];
  if (nextState === "FAILED") {
    const failureCanRetry = updated.errorDetails?.retryable === true;
    const exhausted = failureCanRetry && updated.attemptCount >= (updated.retryPolicy?.maxAttempts ?? 0);
    updated.errorDetails = {
      ...updated.errorDetails,
      retryable: failureCanRetry && !exhausted,
      ...(exhausted ? { retryableAfterOperatorReview: true, retryLimitReached: true } : {})
    };
    updated.nextRetryAt = failureCanRetry && !exhausted ? new Date(now + retryDelay(updated.attemptCount)).toISOString() : null;
    if (exhausted) updated = deadLetterExhaustedJob(updated, now);
  }
  return updated;
}

export function expireWorkerLease(job, now = Date.now()) {
  if (!job?.workerLease) return { job, expired: false };
  if (workerLeaseExpiryMs(job) > now) return { job, expired: false };
  const previous = job.state;
  const timestamp = new Date(now).toISOString();
  let updated;
  if (previous === "UPLOADING_PRIVATE") {
    updated = {
      ...job, state: "RECOVERY_REQUIRED", updatedAt: timestamp, completedAt: timestamp,
      errorDetails: { code: "UPLOAD_LEASE_EXPIRED", retryable: false, message: "Upload lease expired; remote outcome must be reconciled before retrying." },
      transitionHistory: [...(job.transitionHistory ?? []), {
        from: previous, to: "RECOVERY_REQUIRED", at: timestamp, actor: "lease-reaper",
        reason: "Expired upload lease; outcome uncertain"
      }]
    };
  } else {
    const canRetry = job.attemptCount < (job.retryPolicy?.maxAttempts ?? 0);
    updated = transitionContentJob(job, "FAILED", {
      actor: "lease-reaper", reason: "Worker lease expired; stale worker results are fenced off"
    }, timestamp);
    updated.errorDetails = {
      code: "WORKER_LEASE_EXPIRED", retryable: canRetry,
      ...(canRetry ? {} : { retryableAfterOperatorReview: true, retryLimitReached: true }),
      message: "Worker lease expired; inspect outputs before retrying."
    };
    updated.nextRetryAt = canRetry ? new Date(now + retryDelay(updated.attemptCount)).toISOString() : null;
    if (!canRetry) updated = deadLetterExhaustedJob(updated, now, "LEASE_EXPIRY_RETRY_LIMIT_EXHAUSTED");
  }
  updated.workerLease = null;
  updated.leaseHistory = [...(updated.leaseHistory ?? []), {
    workerId: job.workerLease.workerId, action: "EXPIRED", at: timestamp, previousState: previous
  }];
  return { job: updated, expired: true };
}
