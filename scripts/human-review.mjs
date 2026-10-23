import crypto from "node:crypto";

/**
 * Evidence-bound review primitives. These functions validate evidence supplied
 * by the application; they do not assert that an external licence is genuine.
 */
export function sha256File(filePath) {
  return crypto.createHash("sha256").update(fsModule.readFileSync(filePath)).digest("hex");
}
import fsModule from "node:fs";

export function validateReviewEvidence({ artifact, rightsEvidence, metadataVersion, reviewer, decision, reason }) {
  const errors = [];
  if (!artifact || typeof artifact !== "object") errors.push("artifact record is required");
  if (!/^[a-f0-9]{64}$/.test(artifact?.sha256 ?? "")) errors.push("artifact SHA-256 checksum is required");
  if (typeof artifact?.path !== "string" || !artifact.path.trim()) errors.push("artifact path is required");
  if (typeof metadataVersion !== "string" || !metadataVersion.trim() || metadataVersion.length > 160) errors.push("metadata version is required");
  if (typeof reviewer !== "string" || reviewer.trim().length < 2 || reviewer.length > 120) errors.push("authenticated reviewer identity is required");
  if (!["APPROVE", "REJECT"].includes(decision)) errors.push("decision must be APPROVE or REJECT");
  if (decision === "REJECT" && (typeof reason !== "string" || reason.trim().length < 3)) errors.push("rejection reason is required");
  if (decision === "APPROVE") {
    if (!rightsEvidence || typeof rightsEvidence !== "object" || Array.isArray(rightsEvidence)) errors.push("structured rights evidence is required");
    else {
      for (const key of ["assetId", "source", "rightsHolder", "licenseEvidenceLocation", "permittedUses", "verificationStatus", "verifiedBy", "verifiedAt"]) {
        if (typeof rightsEvidence[key] !== "string" || !rightsEvidence[key].trim()) errors.push("rights evidence field is required: " + key);
      }
      if (rightsEvidence.verificationStatus !== "VERIFIED") errors.push("rights evidence must be marked VERIFIED after review");
      if (rightsEvidence.verifiedBy !== reviewer) errors.push("rights verifier must match the authenticated reviewer");
      if (!Number.isFinite(Date.parse(rightsEvidence.verifiedAt ?? ""))) errors.push("rights evidence verification timestamp is invalid");
      if (!Array.isArray(rightsEvidence.permittedUses) || !rightsEvidence.permittedUses.includes("YouTube")) errors.push("rights evidence must explicitly permit YouTube use");
      if (!/^[a-f0-9]{64}$/.test(rightsEvidence.assetSha256 ?? "")) errors.push("source asset SHA-256 checksum is required");
    }
  }
  return errors;
}

export function createReviewDecision(input, now = new Date().toISOString()) {
  const errors = validateReviewEvidence(input);
  if (errors.length) throw new Error("Review blocked: " + errors.join("; "));
  return Object.freeze({
    id: crypto.randomUUID(),
    decision: input.decision,
    reviewer: input.reviewer.trim(),
    reason: String(input.reason ?? "").trim(),
    artifactPath: input.artifact.path,
    artifactSha256: input.artifact.sha256,
    metadataVersion: input.metadataVersion,
    rightsEvidenceSha256: input.decision === "APPROVE"
      ? crypto.createHash("sha256").update(JSON.stringify(input.rightsEvidence)).digest("hex")
      : null,
    rightsEvidence: input.decision === "APPROVE" ? structuredClone(input.rightsEvidence) : null,
    reviewedAt: now
  });
}

export function isReviewCurrent(review, { artifact, metadataVersion, rightsEvidence }) {
  if (!review || review.decision !== "APPROVE" || !artifact || !rightsEvidence) return false;
  const rightsHash = crypto.createHash("sha256").update(JSON.stringify(rightsEvidence)).digest("hex");
  return review.artifactPath === artifact.path
    && review.artifactSha256 === artifact.sha256
    && review.metadataVersion === metadataVersion
    && review.rightsEvidenceSha256 === rightsHash;
}
