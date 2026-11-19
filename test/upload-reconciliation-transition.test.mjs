import test from "node:test";
import assert from "node:assert/strict";
import { buildVerifiedUploadReconciliationJob } from "../scripts/upload-reconciliation-transition.mjs";

const channelId = "UC" + "a".repeat(22);
const receipt = {
  jobId: "job-uncertain-123",
  attemptId: "attempt-456",
  videoId: "remote-video-789",
  artifactSha256: "a".repeat(64),
  channelId,
  channelTitle: "SonicVhibez",
  privacyStatus: "private",
  remoteStatusVerified: true,
  channelHistoryReconciled: true,
  historyVerifiedAt: "2026-11-05T17:45:00.000Z",
  historyVerifiedBy: "history-reviewer@example.test",
  historyReconciliationSha256: "a".repeat(64),
  historyVideoCount: 42,
  publishingEnabled: false,
  actualPublishedAt: "2026-11-05T17:30:00.000Z"
};
const attempt = {
  jobId: receipt.jobId,
  attemptId: receipt.attemptId,
  status: "PRIVATE_UPLOAD_VERIFIED",
  remoteVideoId: receipt.videoId,
  artifactSha256: receipt.artifactSha256
};
const job = (state = "RECOVERY_REQUIRED") => ({
  id: receipt.jobId,
  kind: "CONTENT_PRODUCTION",
  state,
  remoteVideoId: null,
  uploadReceipt: null,
  workerLease: { workerId: "worker-a", tokenHash: "not-a-secret", expiresAt: "2026-11-05T18:00:00.000Z" },
  leaseHistory: [],
  transitionHistory: [{ from: "UPLOADING_PRIVATE", to: "RECOVERY_REQUIRED", at: "2026-11-05T17:00:00.000Z", actor: "lease-reaper", reason: "uncertain" }]
});
const common = {
  attempt, receipt, configuredChannelId: channelId,
  actor: "verified-operator@example.test",
  at: "2026-11-05T18:00:00.000Z"
};

test("verified private receipt terminalizes exact recovery job and preserves evidence", () => {
  const original = job();
  const result = buildVerifiedUploadReconciliationJob({ ...common, job: original });
  assert.equal(result.changed, true);
  assert.equal(result.job.state, "PRIVATE_UPLOAD_VERIFIED");
  assert.equal(result.job.remoteVideoId, receipt.videoId);
  assert.equal(result.job.uploadReceipt.attemptId, attempt.attemptId);
  assert.equal(result.job.uploadReceipt.artifactSha256, attempt.artifactSha256);
  assert.equal(result.job.completedAt, common.at);
  assert.equal(result.job.workerLease, null);
  assert.deepEqual(result.job.leaseHistory.at(-1), {
    workerId: "worker-a", action: "RECONCILIATION_RELEASED",
    at: common.at, state: "PRIVATE_UPLOAD_VERIFIED"
  });
  assert.equal(result.job.transitionHistory.at(-1).actor, common.actor);
  assert.equal(original.state, "RECOVERY_REQUIRED", "transition helper must not mutate persisted input state");
});

test("receipt cannot terminalize a different job, attempt, artifact, channel or public upload", () => {
  const cases = [
    { attempt: { ...attempt, jobId: "other-job" } },
    { attempt: { ...attempt, attemptId: "other-attempt" } },
    { attempt: { ...attempt, artifactSha256: "b".repeat(64) } },
    { receipt: { ...receipt, channelId: "UC" + "b".repeat(22) } },
    { receipt: { ...receipt, privacyStatus: "public" } },
    { receipt: { ...receipt, remoteStatusVerified: false } },
    { receipt: { ...receipt, channelHistoryReconciled: false } },
    { receipt: { ...receipt, historyVerifiedAt: null } },
    { receipt: { ...receipt, historyVerifiedBy: " " } },
    { receipt: { ...receipt, historyVideoCount: 0 } },
    { receipt: { ...receipt, publishingEnabled: true } },
    { receipt: { ...receipt, actualPublishedAt: "not-a-date" } }
  ];
  for (const overrides of cases) {
    assert.throws(
      () => buildVerifiedUploadReconciliationJob({ ...common, ...overrides, job: job() }),
      /exact|private|receipt|verified/i
    );
  }
});

test("already verified job accepts only the same exact receipt and is idempotent", () => {
  const existing = {
    ...job("PRIVATE_UPLOAD_VERIFIED"),
    remoteVideoId: receipt.videoId,
    uploadReceipt: structuredClone(receipt)
  };
  const result = buildVerifiedUploadReconciliationJob({ ...common, job: existing });
  assert.equal(result.changed, false);
  assert.equal(result.job, existing);
  assert.throws(() => buildVerifiedUploadReconciliationJob({
    ...common,
    job: { ...existing, remoteVideoId: "different-video" }
  }), /different upload receipt/i);
});

test("ineligible job state and missing operator identity fail closed", () => {
  assert.throws(() => buildVerifiedUploadReconciliationJob({ ...common, job: job("QUEUED") }), /not in a state eligible/i);
  assert.throws(() => buildVerifiedUploadReconciliationJob({ ...common, actor: " ", job: job() }), /operator identity/i);
});
