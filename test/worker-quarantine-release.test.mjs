import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorkerQuarantineReleaseReceipt,
  verifyWorkerQuarantineReleaseReceipt
} from "../scripts/worker-quarantine-release.mjs";

const secret = "worker-token-secret-that-is-not-the-operator-token";
const binding = {
  workerId: "render-worker-01",
  jobId: "job-uncertain-123",
  attemptId: "attempt-456",
  artifactSha256: "a".repeat(64),
  secret,
  nowMs: Date.parse("2026-11-05T18:00:00.000Z"),
  nonce: "b".repeat(48)
};

test("signed quarantine release receipt verifies exact worker, job, attempt and artifact", () => {
  const receipt = createWorkerQuarantineReleaseReceipt(binding);
  assert.equal(verifyWorkerQuarantineReleaseReceipt(receipt, binding).nonce, binding.nonce);
  assert.equal(receipt.expiresAt, "2026-11-05T18:05:00.000Z");
});

test("receipt rejects tampering, wrong binding, wrong secret and expiry", () => {
  const receipt = createWorkerQuarantineReleaseReceipt(binding);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt({ ...receipt, jobId: "other-job" }, binding), /does not bind/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, workerId: "other-worker" }), /does not bind/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, secret: "different-worker-secret" }), /signature is invalid/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, nowMs: binding.nowMs + 300_001 }), /expired/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, attemptId: "other-attempt" }), /does not bind/i);
});

test("receipt creation rejects malformed identities and weak signing secrets", () => {
  assert.throws(() => createWorkerQuarantineReleaseReceipt({ ...binding, secret: "short" }), /worker authentication secret/i);
  assert.throws(() => createWorkerQuarantineReleaseReceipt({ ...binding, artifactSha256: "bad" }), /fields are invalid/i);
});
