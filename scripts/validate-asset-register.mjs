#!/usr/bin/env node
/**
 * Fail-closed validator for a rights-aware visual asset register.
 * This validates record completeness only; it cannot determine whether a license
 * is legally sufficient. Human review of original license evidence remains required.
 */
import fs from "node:fs";
import path from "node:path";

const [registerArg = "content/asset-register.json"] = process.argv.slice(2);
const registerPath = path.resolve(registerArg);
if (!fs.existsSync(registerPath)) {
  console.error("BLOCKED: asset register not found. Copy content/asset-register.example.json and complete it with source evidence.");
  process.exit(2);
}
let data;
try {
  data = JSON.parse(fs.readFileSync(registerPath, "utf8"));
} catch {
  console.error("BLOCKED: asset register is not valid JSON.");
  process.exit(2);
}
const errors = [];
if (!Array.isArray(data.assets) || data.assets.length === 0) {
  errors.push("assets must be a non-empty array");
} else {
  const seen = new Set();
  data.assets.forEach((asset, i) => {
    const prefix = `assets[${i}]`;
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
      errors.push(`${prefix} must be an object`);
      return;
    }
    for (const key of ["id", "filename", "sourceUrl", "licenseTerms", "dateChecked", "evidencePath"]) {
      if (typeof asset[key] !== "string" || !asset[key].trim()) errors.push(`${prefix}.${key} is required`);
    }
    if (typeof asset.id === "string" && asset.id.trim()) {
      if (seen.has(asset.id)) errors.push(`${prefix}.id duplicates ${asset.id}`);
      seen.add(asset.id);
    }
    if (typeof asset.sourceUrl === "string" && asset.sourceUrl.trim()) {
      try {
        const u = new URL(asset.sourceUrl);
        if (u.protocol !== "https:") errors.push(`${prefix}.sourceUrl must use HTTPS`);
      } catch {
        errors.push(`${prefix}.sourceUrl must be a valid URL`);
      }
    }
    if (typeof asset.dateChecked === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(asset.dateChecked)) {
      errors.push(`${prefix}.dateChecked must use YYYY-MM-DD`);
    }
    if (!Array.isArray(asset.requiredAttribution) || asset.requiredAttribution.length === 0) {
      errors.push(`${prefix}.requiredAttribution must be an array; use ["None stated in reviewed terms"] only if the terms support that conclusion`);
    }
    if (typeof asset.thirdPartyRestrictionsChecked !== "boolean") {
      errors.push(`${prefix}.thirdPartyRestrictionsChecked must be explicitly true or false`);
    }
    if (asset.humanApproved !== true) errors.push(`${prefix}.humanApproved must be true only after a person reviews the source and terms`);
    if (asset.rightsEvidenceReviewed !== true) errors.push(`${prefix}.rightsEvidenceReviewed must be true only after evidence has been inspected`);
    if (typeof asset.evidencePath === "string" && asset.evidencePath.trim() &&
        /placeholder|replace_with|todo|unknown|tbd/i.test(asset.evidencePath)) {
      errors.push(`${prefix}.evidencePath must identify the actual saved evidence, not a placeholder`);
    }
  });
}
if (errors.length) {
  console.error("BLOCKED — asset register review failed:");
  errors.forEach(e => console.error("- " + e));
  process.exit(1);
}
console.log(`PASS: ${data.assets.length} asset record(s) are complete and marked for human-reviewed rights evidence.`);
console.log("Note: this is a completeness check, not a legal determination or a substitute for watching the final video.");
