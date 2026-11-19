import crypto from "node:crypto";

const sha256Pattern = /^[a-f0-9]{64}$/;

export function buildVerifiedUploadReconciliationJob({
  job,
  attempt,
  receipt,
  configuredChannelId,
  actor,
  at = new Date().toISOString()
}) {
  if (!job || job.kind !== "CONTENT_PRODUCTION" || typeof job.id !== "string") {
    throw new Error("Exact content-production job is required");
  }
  if (!["RECOVERY_REQUIRED", "UPLOADING_PRIVATE", "APPROVED_FOR_PRIVATE_UPLOAD", "PRIVATE_UPLOAD_VERIFIED"].includes(job.state)) {
    throw new Error("Job is not in a state eligible for private-upload reconciliation");
  }
  if (!attempt || attempt.jobId !== job.id || attempt.status !== "PRIVATE_UPLOAD_VERIFIED" ||
      typeof attempt.attemptId !== "string" || !attempt.attemptId ||
      typeof attempt.remoteVideoId !== "string" || !attempt.remoteVideoId ||
      !sha256Pattern.test(attempt.artifactSha256 ?? "")) {
    throw new Error("Upload ledger does not prove the exact verified attempt");
  }
  if (!receipt || !configuredChannelId ||
      receipt.jobId !== job.id ||
      receipt.attemptId !== attempt.attemptId ||
      receipt.videoId !== attempt.remoteVideoId ||
      receipt.artifactSha256 !== attempt.artifactSha256 ||
      receipt.channelId !== configuredChannelId ||
      receipt.channelTitle !== "SonicVhibez" ||
      receipt.privacyStatus !== "private" ||
      receipt.remoteStatusVerified !== true ||
      receipt.channelHistoryReconciled !== true ||
      !Number.isFinite(Date.parse(receipt.historyVerifiedAt ?? "")) ||
      typeof receipt.historyVerifiedBy !== "string" || receipt.historyVerifiedBy.trim().length < 2 ||
      !/^[a-f0-9]{64}$/.test(receipt.historyReconciliationSha256 ?? "") ||
      !Number.isSafeInteger(receipt.historyVideoCount) || receipt.historyVideoCount < 1 ||
      receipt.publishingEnabled !== false ||
      !Number.isFinite(Date.parse(receipt.actualPublishedAt ?? ""))) {
    throw new Error("Persisted receipt does not independently bind the exact private SonicVhibez upload");
  }
  if (typeof actor !== "string" || !actor.trim() || actor.length > 120) {
    throw new Error("Authenticated operator identity is required");
  }
  if (!Number.isFinite(Date.parse(at))) throw new Error("Reconciliation timestamp is invalid");

  if (job.state === "PRIVATE_UPLOAD_VERIFIED") {
    if (job.remoteVideoId !== receipt.videoId || job.uploadReceipt?.attemptId !== receipt.attemptId ||
        job.uploadReceipt?.artifactSha256 !== receipt.artifactSha256) {
      throw new Error("Already-verified job is bound to a different upload receipt");
    }
    return { job, changed: false, receipt: structuredClone(receipt) };
  }

  const updated = {
    ...job,
    state: "PRIVATE_UPLOAD_VERIFIED",
    remoteVideoId: receipt.videoId,
    uploadReceipt: structuredClone(receipt),
    completedAt: at,
    updatedAt: at,
    workerLease: null,
    transitionHistory: [...(job.transitionHistory ?? []), {
      from: job.state,
      to: "PRIVATE_UPLOAD_VERIFIED",
      at,
      actor: actor.trim(),
      reason: "Exact prior upload attempt and persisted private SonicVhibez receipt independently reconciled"
    }]
  };
  if (job.workerLease) {
    updated.leaseHistory = [...(job.leaseHistory ?? []), {
      workerId: job.workerLease.workerId,
      action: "RECONCILIATION_RELEASED",
      at,
      state: "PRIVATE_UPLOAD_VERIFIED"
    }];
  }
  return { job: updated, changed: true, receipt: structuredClone(receipt) };
}
