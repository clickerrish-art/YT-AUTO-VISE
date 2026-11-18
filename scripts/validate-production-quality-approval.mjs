#!/usr/bin/env node
import { validateProductionQualityApprovalFile } from "./production-quality-approval.mjs";
const [videoPath, metadataPath, approvalPath] = process.argv.slice(2);
if (!videoPath || !metadataPath || !approvalPath) {
  console.error("Usage: node scripts/validate-production-quality-approval.mjs <video.mp4> <metadata.json> <approval.json>");
  process.exit(2);
}
const result = validateProductionQualityApprovalFile({ videoPath, metadataPath, approvalPath });
if (!result.valid) {
  console.error("BLOCKED — production quality release gate failed:");
  for (const error of result.errors) console.error("- " + error);
  process.exit(1);
}
console.log("PASS: production quality scorecard, human review, exact export/metadata/artifact hashes, technical receipt and rights-evidence checksum are current.");
console.log("This approval remains private-only; no upload or publication was performed.");
