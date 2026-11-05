import crypto from "node:crypto";

const HASH = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,159}$/;
const WORKER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/;
const MAX_TTL_MS = 5 * 60_000;

function payloadBytes(payload) {
  return Buffer.from(JSON.stringify({
    version: payload.version,
    workerId: payload.workerId,
    jobId: payload.jobId,
    attemptId: payload.attemptId,
    artifactSha256: payload.artifactSha256,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
    nonce: payload.nonce
  }));
}

function signingKey(secret) {
  if (typeof secret !== "string" || secret.length < 24) {
    throw new Error("A distinct worker authentication secret is required to sign quarantine release receipts");
  }
  return crypto.createHash("sha256").update("sonicvhibez-worker-quarantine-release:v1:").update(secret).digest();
}

export function createWorkerQuarantineReleaseReceipt({
  workerId, jobId, attemptId, artifactSha256, secret,
  nowMs = Date.now(), nonce = crypto.randomBytes(24).toString("hex")
}) {
  if (!WORKER.test(workerId ?? "") || !IDENTIFIER.test(jobId ?? "") ||
      !IDENTIFIER.test(attemptId ?? "") || !HASH.test(artifactSha256 ?? "") ||
      !/^[a-f0-9]{48}$/.test(nonce) || !Number.isFinite(nowMs)) {
    throw new Error("Quarantine release receipt fields are invalid");
  }
  const payload = {
    version: 1, workerId, jobId, attemptId, artifactSha256,
    issuedAt: new Date(nowMs).toISOString(),
    expiresAt: new Date(nowMs + MAX_TTL_MS).toISOString(),
    nonce
  };
  const signature = crypto.createHmac("sha256", signingKey(secret)).update(payloadBytes(payload)).digest("hex");
  return { ...payload, signature };
}

export function verifyWorkerQuarantineReleaseReceipt(receipt, {
  workerId, jobId, attemptId, artifactSha256, secret, nowMs = Date.now()
} = {}) {
  if (!receipt || receipt.version !== 1 || receipt.workerId !== workerId ||
      receipt.jobId !== jobId || receipt.attemptId !== attemptId ||
      receipt.artifactSha256 !== artifactSha256 ||
      !/^[a-f0-9]{48}$/.test(receipt.nonce ?? "") ||
      !/^[a-f0-9]{64}$/.test(receipt.signature ?? "")) {
    throw new Error("Signed quarantine release receipt does not bind the exact worker, job, attempt and artifact");
  }
  const issued = Date.parse(receipt.issuedAt ?? "");
  const expires = Date.parse(receipt.expiresAt ?? "");
  if (!Number.isFinite(issued) || !Number.isFinite(expires) ||
      expires <= nowMs || issued > nowMs + 30_000 ||
      expires - issued !== MAX_TTL_MS || nowMs - issued > MAX_TTL_MS) {
    throw new Error("Signed quarantine release receipt is expired or has an invalid validity window");
  }
  const expected = crypto.createHmac("sha256", signingKey(secret)).update(payloadBytes(receipt)).digest();
  const supplied = Buffer.from(receipt.signature, "hex");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    throw new Error("Signed quarantine release receipt signature is invalid");
  }
  return { nonce: receipt.nonce, workerId, jobId, attemptId, artifactSha256 };
}
