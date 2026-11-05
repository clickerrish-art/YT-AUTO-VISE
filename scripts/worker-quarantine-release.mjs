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

function ed25519PrivateKey(pem) {
  if (typeof pem !== "string" || !pem.trim()) {
    throw new Error("Dashboard-only Ed25519 quarantine signing private key is not configured");
  }
  const key = crypto.createPrivateKey(pem);
  if (key.asymmetricKeyType !== "ed25519") throw new Error("Quarantine signing private key must be Ed25519");
  return key;
}

function ed25519PublicKey(pem) {
  if (typeof pem !== "string" || !pem.trim()) {
    throw new Error("Worker Ed25519 quarantine verification public key is not configured");
  }
  const key = crypto.createPublicKey(pem);
  if (key.asymmetricKeyType !== "ed25519") throw new Error("Quarantine verification public key must be Ed25519");
  return key;
}

export function createWorkerQuarantineReleaseReceipt({
  workerId, jobId, attemptId, artifactSha256, privateKeyPem,
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
  const signature = crypto.sign(null, payloadBytes(payload), ed25519PrivateKey(privateKeyPem)).toString("base64url");
  return { ...payload, signature };
}

export function verifyWorkerQuarantineReleaseReceipt(receipt, {
  workerId, jobId, attemptId, artifactSha256, publicKeyPem, nowMs = Date.now()
} = {}) {
  if (!receipt || receipt.version !== 1 || receipt.workerId !== workerId ||
      receipt.jobId !== jobId || receipt.attemptId !== attemptId ||
      receipt.artifactSha256 !== artifactSha256 ||
      !/^[a-f0-9]{48}$/.test(receipt.nonce ?? "") ||
      typeof receipt.signature !== "string" || !/^[A-Za-z0-9_-]{86}$/.test(receipt.signature)) {
    throw new Error("Signed quarantine release receipt does not bind the exact worker, job, attempt and artifact");
  }
  const issued = Date.parse(receipt.issuedAt ?? "");
  const expires = Date.parse(receipt.expiresAt ?? "");
  if (!Number.isFinite(issued) || !Number.isFinite(expires) ||
      expires <= nowMs || issued > nowMs + 30_000 ||
      expires - issued !== MAX_TTL_MS || nowMs - issued > MAX_TTL_MS) {
    throw new Error("Signed quarantine release receipt is expired or has an invalid validity window");
  }
  let signature;
  try { signature = Buffer.from(receipt.signature, "base64url"); }
  catch { throw new Error("Signed quarantine release receipt signature encoding is invalid"); }
  if (signature.length !== 64 ||
      !crypto.verify(null, payloadBytes(receipt), ed25519PublicKey(publicKeyPem), signature)) {
    throw new Error("Signed quarantine release receipt signature is invalid");
  }
  return { nonce: receipt.nonce, workerId, jobId, attemptId, artifactSha256 };
}
