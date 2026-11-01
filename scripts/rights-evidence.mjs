import fs from "node:fs";

const REQUIRED_FIELDS = [
  "assetId",
  "source",
  "rightsHolder",
  "assetPath",
  "licenseEvidenceLocation",
  "restrictions",
  "attributionRequirements"
];

/**
 * Build a hash-bound rights evidence set from operator-attested source records.
 * This validates local structure and file integrity only; it cannot establish
 * that a licence is genuine or that the operator's attestation is truthful.
 */
export function buildVerifiedRightsAssets(items, {
  actor,
  timestamp,
  resolveFile,
  sha256File
}) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
    throw new Error("Rights verification requires 1–50 source assets");
  }
  if (typeof actor !== "string" || actor.trim().length < 2) {
    throw new Error("A verified operator identity is required for rights verification");
  }
  if (typeof timestamp !== "string" || !timestamp.trim()) {
    throw new Error("A verification timestamp is required");
  }
  if (typeof resolveFile !== "function" || typeof sha256File !== "function") {
    throw new Error("Safe file resolution and SHA-256 functions are required");
  }

  const seenAssetIds = new Set();
  return items.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Source asset " + (index + 1) + " must be an object");
    }
    for (const key of REQUIRED_FIELDS) {
      if (typeof item[key] !== "string" || !item[key].trim()) {
        throw new Error("Required source-rights field is missing: " + key);
      }
    }
    const assetId = item.assetId.trim();
    if (seenAssetIds.has(assetId)) {
      throw new Error("Duplicate rights asset ID: " + assetId);
    }
    seenAssetIds.add(assetId);

    if (!Array.isArray(item.permittedUses) || item.permittedUses.length < 1 ||
        item.permittedUses.length > 20 ||
        item.permittedUses.some(use => typeof use !== "string" || !use.trim()) ||
        !item.permittedUses.includes("YouTube")) {
      throw new Error("Every asset must have a valid permittedUses list that explicitly includes YouTube");
    }

    const assetFile = resolveFile(item.assetPath);
    const evidenceFile = resolveFile(item.licenseEvidenceLocation);
    for (const [label, file] of [["Source asset", assetFile], ["License evidence", evidenceFile]]) {
      const stat = fs.statSync(file);
      if (!stat.isFile() || stat.size <= 0) {
        throw new Error(label + " must be a non-empty regular file");
      }
    }

    return {
      assetId,
      source: item.source.trim(),
      rightsHolder: item.rightsHolder.trim(),
      assetPath: item.assetPath,
      assetSha256: sha256File(assetFile),
      licenseEvidenceLocation: item.licenseEvidenceLocation,
      licenseEvidenceSha256: sha256File(evidenceFile),
      permittedUses: [...new Set(item.permittedUses.map(use => use.trim()))],
      restrictions: item.restrictions.trim(),
      attributionRequirements: item.attributionRequirements.trim(),
      verificationStatus: "VERIFIED",
      verifiedBy: actor.trim(),
      verifiedAt: timestamp
    };
  });
}
