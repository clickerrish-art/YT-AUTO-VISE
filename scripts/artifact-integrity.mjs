import crypto from "node:crypto";

export function artifactPartMd5(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("Artifact part bytes must be a Uint8Array");
  return crypto.createHash("md5").update(bytes).digest("hex");
}

export function assertArtifactPartMatches(bytes, etag) {
  const expected = artifactPartMd5(bytes);
  const received = String(etag ?? "").replace(/^"|"$/g, "").toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(received) || received !== expected) {
    throw new Error("Stored R2 multipart part does not match the current local artifact bytes");
  }
  return expected;
}
