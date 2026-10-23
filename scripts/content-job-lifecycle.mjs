import crypto from "node:crypto";

export const JOB_STATES = Object.freeze([
  "QUEUED", "GENERATING", "GENERATED", "VALIDATING", "BLOCKED",
  "AWAITING_HUMAN_REVIEW", "APPROVED_FOR_PRIVATE_UPLOAD", "UPLOADING_PRIVATE",
  "PRIVATE_UPLOAD_VERIFIED", "FAILED", "RECOVERY_REQUIRED"
]);

const transitions = {
  QUEUED: new Set(["GENERATING", "BLOCKED", "FAILED"]),
  GENERATING: new Set(["GENERATED", "BLOCKED", "FAILED", "RECOVERY_REQUIRED"]),
  GENERATED: new Set(["VALIDATING", "BLOCKED", "FAILED"]),
  VALIDATING: new Set(["AWAITING_HUMAN_REVIEW", "BLOCKED", "FAILED", "RECOVERY_REQUIRED"]),
  BLOCKED: new Set(["FAILED"]),
  AWAITING_HUMAN_REVIEW: new Set(["BLOCKED", "FAILED"]),
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) || Number.isNaN(Date.parse(scheduledDate + "T12:00:00Z"))) throw new Error("scheduledDate must be a real YYYY-MM-DD date");
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
    validationResults: null,
    rightsChecks: null,
    humanApproval: null,
    attemptCount: 0,
    retryPolicy: { maxAttempts: 2, requiresOperatorRetry: true },
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
  if (["PRIVATE_UPLOAD_VERIFIED", "FAILED", "BLOCKED"].includes(nextState)) updated.completedAt = now;
  return updated;
}
