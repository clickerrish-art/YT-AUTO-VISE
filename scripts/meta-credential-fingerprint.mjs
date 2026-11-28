import crypto from "node:crypto";

/**
 * Store only a keyed fingerprint of Meta credentials, never the credential itself.
 * The operator token is the HMAC key; changing the operator token safely invalidates
 * existing connection attestations and requires a fresh read-only verification.
 */
export function metaCredentialFingerprint(value, purpose, operatorSecret) {
  if (typeof value !== "string" || value.length < 20 ||
      typeof purpose !== "string" || !purpose ||
      typeof operatorSecret !== "string" || operatorSecret.length < 24) return "";
  return crypto.createHmac("sha256", operatorSecret).update(purpose + ":" + value).digest("hex");
}

export function fingerprintsMatch(left, right) {
  if (typeof left !== "string" || typeof right !== "string" ||
      !/^[a-f0-9]{64}$/.test(left) || !/^[a-f0-9]{64}$/.test(right)) return false;
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}
