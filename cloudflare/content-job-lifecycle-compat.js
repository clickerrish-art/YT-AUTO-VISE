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
