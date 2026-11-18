import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";
import { validateProductionQualityScorecard, qualityScorecardSha256 } from "./production-quality-scorecard.mjs";

const sha256File = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
function resolveEvidenceFile(filePath, rootDir, label) {
  const root = fs.realpathSync(rootDir);
  const resolved = resolveRegularFileNoSymlinks(filePath, root, label);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith(".." + path.sep) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(label + " must remain inside the repository root");
  }
  return resolved;
}

/** Revalidate the signed-off release package against the bytes on disk at the point of use. */
export function validateProductionQualityApproval(approval, {
  videoPath,
  metadataPath,
  jobId = null,
  contentType = null,
  rootDir = process.cwd(),
  now = new Date()
} = {}) {
  const errors = [];
  if (!approval || typeof approval !== "object" || Array.isArray(approval)) {
    return ["production quality approval record is required"];
  }
  if (approval.decision !== "APPROVE") errors.push("production quality approval decision must be APPROVE");
  if (jobId !== null && approval.jobId !== jobId) errors.push("production quality approval job ID does not match the scheduled queue item");
  if (contentType !== null && approval.contentType !== contentType) errors.push("production quality approval content type does not match the scheduled queue item");
  if (approval.publishingEnabled !== false || approval.visibility !== "private") {
    errors.push("production quality approval must preserve publishingEnabled=false and private visibility");
  }
  let actualVideoSha256 = null;
  let actualMetadataSha256 = null;
  try {
    const safeVideo = resolveEvidenceFile(videoPath, rootDir, "Final export");
    actualVideoSha256 = sha256File(safeVideo);
    if (approval.artifactSha256 !== actualVideoSha256) errors.push("approval video hash does not match the exact final export bytes");
  } catch (error) { errors.push("final export cannot be verified: " + error.message); }
  try {
    const safeMetadata = resolveEvidenceFile(metadataPath, rootDir, "Final metadata");
    actualMetadataSha256 = sha256File(safeMetadata);
    if (approval.metadataVersion !== actualMetadataSha256) errors.push("approval metadata hash does not match the exact metadata bytes");
  } catch (error) { errors.push("final metadata cannot be verified: " + error.message); }

  if (typeof approval.reviewer !== "string" || approval.reviewer.trim().length < 2) errors.push("authenticated human reviewer identity is required");
  if (!approval.qualityScorecard || approval.qualityScorecardSha256 !== qualityScorecardSha256(approval.qualityScorecard)) {
    errors.push("production quality scorecard checksum does not match the approval record");
  }
  if (!approval.technicalValidationReceipt || approval.technicalValidationReceipt.passed !== true ||
      approval.technicalValidationSha256 !== crypto.createHash("sha256").update(JSON.stringify(approval.technicalValidationReceipt)).digest("hex")) {
    errors.push("passing exact technical-validation receipt and checksum are required");
  }
  if (!approval.rightsEvidence || typeof approval.rightsEvidence !== "object" || Array.isArray(approval.rightsEvidence) ||
      approval.rightsEvidenceSha256 !== crypto.createHash("sha256").update(JSON.stringify(approval.rightsEvidence)).digest("hex")) {
    errors.push("structured rights evidence checksum does not match the approval record");
  }

  const relatedArtifacts = Array.isArray(approval.relatedArtifacts) ? approval.relatedArtifacts : null;
  if (!relatedArtifacts) errors.push("complete related-artifact hash set is required");
  else {
    const seen = new Set();
    for (const item of relatedArtifacts) {
      if (!item || typeof item.path !== "string" || !/^[a-f0-9]{64}$/.test(item.sha256 ?? "")) {
        errors.push("each related artifact requires a repository-relative path and SHA-256");
        continue;
      }
      if (seen.has(item.path)) errors.push("related-artifact paths must be unique: " + item.path);
      seen.add(item.path);
      try {
        const safe = resolveEvidenceFile(item.path, rootDir, "Reviewed related artifact");
        if (sha256File(safe) !== item.sha256) errors.push("reviewed related-artifact bytes changed after approval: " + item.path);
      } catch (error) { errors.push("reviewed related artifact is unavailable or unsafe: " + item.path + " (" + error.message + ")"); }
    }
  }
  if (actualVideoSha256 && actualMetadataSha256 && relatedArtifacts) {
    errors.push(...validateProductionQualityScorecard(approval.qualityScorecard, {
      artifactSha256: actualVideoSha256,
      metadataSha256: actualMetadataSha256,
      relatedArtifacts,
      reviewer: approval.reviewer,
      now
    }));
    if (!relatedArtifacts.some(item => item.path === videoPath || item.sha256 === actualVideoSha256)) {
      errors.push("complete related-artifact set must include the exact final export");
    }
    if (!relatedArtifacts.some(item => item.sha256 === actualMetadataSha256)) {
      errors.push("complete related-artifact set must include the exact final metadata");
    }
  }
  return [...new Set(errors)];
}

export function validateProductionQualityApprovalFile({ approvalPath, videoPath, metadataPath, jobId = null, contentType = null, rootDir = process.cwd(), now = new Date() } = {}) {
  let approval;
  try {
    const safeApproval = resolveEvidenceFile(approvalPath, rootDir, "Production quality approval");
    approval = JSON.parse(fs.readFileSync(safeApproval, "utf8"));
  } catch (error) {
    return { valid: false, errors: ["production quality approval file is missing, unsafe or invalid: " + error.message] };
  }
  const errors = validateProductionQualityApproval(approval, { videoPath, metadataPath, jobId, contentType, rootDir, now });
  return { valid: errors.length === 0, errors, approval };
}
