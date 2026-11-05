import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { applyWorkerQuarantineRelease } from "../scripts/worker-runner.mjs";
import {
  createWorkerQuarantineReleaseReceipt,
  verifyWorkerQuarantineReleaseReceipt
} from "../scripts/worker-quarantine-release.mjs";

const keyPair = crypto.generateKeyPairSync("ed25519");
const privateKeyPem = keyPair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const publicKeyPem = keyPair.publicKey.export({ type: "spki", format: "pem" }).toString();
const binding = {
  workerId: "render-worker-01",
  jobId: "job-uncertain-123",
  attemptId: "attempt-456",
  artifactSha256: "a".repeat(64),
  privateKeyPem,
  publicKeyPem,
  nowMs: Date.parse("2026-11-05T18:00:00.000Z"),
  nonce: "b".repeat(48)
};

test("Ed25519-signed quarantine release receipt verifies exact worker, job, attempt and artifact", () => {
  const receipt = createWorkerQuarantineReleaseReceipt(binding);
  assert.equal(verifyWorkerQuarantineReleaseReceipt(receipt, binding).nonce, binding.nonce);
  assert.equal(receipt.expiresAt, "2026-11-05T18:05:00.000Z");
});

test("receipt rejects tampering, wrong binding, wrong public key and expiry", () => {
  const receipt = createWorkerQuarantineReleaseReceipt(binding);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt({ ...receipt, jobId: "other-job" }, binding), /does not bind/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, workerId: "other-worker" }), /does not bind/i);
  const other = crypto.generateKeyPairSync("ed25519");
  const wrongPublicKeyPem = other.publicKey.export({ type: "spki", format: "pem" }).toString();
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, publicKeyPem: wrongPublicKeyPem }), /signature is invalid/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, nowMs: binding.nowMs + 300_001 }), /expired/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, attemptId: "other-attempt" }), /does not bind/i);
  assert.throws(() => verifyWorkerQuarantineReleaseReceipt(receipt, { ...binding, publicKeyPem: privateKeyPem }), /PUBLIC key is not configured/i);
});

test("receipt creation rejects malformed identities and missing or malformed private keys", () => {
  assert.throws(() => createWorkerQuarantineReleaseReceipt({ ...binding, privateKeyPem: "" }), /private key is not configured/i);
  assert.throws(() => createWorkerQuarantineReleaseReceipt({ ...binding, privateKeyPem: "not a key" }), /private key|decoder/i);
  assert.throws(() => createWorkerQuarantineReleaseReceipt({ ...binding, artifactSha256: "bad" }), /fields are invalid/i);
});

test("worker consumes a signed release once and persists the nonce against replay", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-release-consume-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const statePath = path.join(dir, "cooldowns.json");
  const state = {
    schemaVersion: 1,
    workerId: binding.workerId,
    updatedAt: new Date(binding.nowMs).toISOString(),
    cooldowns: {},
    uncertainDispatches: {
      [binding.jobId]: { code: "WORKER_DISPATCH_OUTCOME_UNCERTAIN", recordedAt: new Date(binding.nowMs - 1000).toISOString() }
    },
    consumedReleaseNonces: []
  };
  fs.writeFileSync(statePath, JSON.stringify(state), { mode: 0o600 });
  const receipt = createWorkerQuarantineReleaseReceipt(binding);
  const released = applyWorkerQuarantineRelease({
    statePath, workerId: binding.workerId, jobId: binding.jobId, attemptId: binding.attemptId, artifactSha256: binding.artifactSha256, publicKeyPem, receipt, nowMs: binding.nowMs
  });
  assert.equal(released.released, true);
  let persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  assert.equal(Object.hasOwn(persisted.uncertainDispatches, binding.jobId), false);
  assert.ok(persisted.consumedReleaseNonces.includes(binding.nonce));

  persisted.uncertainDispatches[binding.jobId] = {
    code: "WORKER_DISPATCH_OUTCOME_UNCERTAIN",
    recordedAt: new Date(binding.nowMs).toISOString()
  };
  fs.writeFileSync(statePath, JSON.stringify(persisted), { mode: 0o600 });
  assert.throws(() => applyWorkerQuarantineRelease({
    statePath, workerId: binding.workerId, jobId: binding.jobId, attemptId: binding.attemptId, artifactSha256: binding.artifactSha256, publicKeyPem, receipt, nowMs: binding.nowMs
  }), /already been consumed/i);
});
