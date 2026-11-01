import fs from "node:fs";
import path from "node:path";

const REQUIRED_FIELDS = [
  "assetId",
  "source",
  "rightsHolder",
  "assetPath",
  "licenseEvidenceLocation",
  "restrictions",
  "attributionRequirements"
];

function isValidZonedTimestamp(value) {
  if (typeof value !== "string") return false;
  const match = /^(\\d{4})-(\\d{2})-(\\d{2})T([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)(?:\\.\\d{1,9})?(Z|([+-])(\\d{2}):(\\d{2}))$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]) return false;

  if (match[8]) {
    const offsetHours = Number(match[9]);
    const offsetMinutes = Number(match[10]);
    if (offsetHours > 14 || (offsetHours === 14 && offsetMinutes !== 0)) return false;
  }
  return Number.isFinite(Date.parse(value));
}

function inspectNonSymlinkRegularFile(file, label) {
  if (typeof file !== "string" || !file.trim()) {
    throw new Error(label + " must resolve to a file path");
  }
  const absolute = path.resolve(file);
  const filesystemRoot = path.parse(absolute).root;
  const components = absolute.slice(filesystemRoot.length).split(path.sep).filter(Boolean);
  let cursor = filesystemRoot;
  let stat;
  for (let index = 0; index < components.length; index++) {
    cursor = path.join(cursor, components[index]);
    stat = fs.lstatSync(cursor);
    if (stat.isSymbolicLink()) {
      throw new Error(label + " path must not contain symbolic links");
    }
    if (index < components.length - 1 && !stat.isDirectory()) {
      throw new Error(label + " path contains a non-directory component");
    }
  }
  if (!stat?.isFile() || stat.size <= 0) {
    throw new Error(label + " must be a non-empty regular file");
  }
  return absolute;
}

function readSha256(sha256File, file, label) {
  const digest = sha256File(file);
  if (typeof digest !== "string" || !/^[a-f0-9]{64}$/i.test(digest)) {
    throw new Error(label + " SHA-256 digest must be 64 hexadecimal characters");
  }
  return digest.toLowerCase();
}

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
  if (!isValidZonedTimestamp(timestamp)) {
    throw new Error("A valid verification timestamp with an explicit timezone is required");
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

    const assetFile = inspectNonSymlinkRegularFile(resolveFile(item.assetPath), "Source asset");
    const evidenceFile = inspectNonSymlinkRegularFile(resolveFile(item.licenseEvidenceLocation), "License evidence");
    const assetSha256 = readSha256(sha256File, assetFile, "Source asset");
    const licenseEvidenceSha256 = readSha256(sha256File, evidenceFile, "License evidence");

    return {
      assetId,
      source: item.source.trim(),
      rightsHolder: item.rightsHolder.trim(),
      assetPath: item.assetPath,
      assetSha256,
      licenseEvidenceLocation: item.licenseEvidenceLocation,
      licenseEvidenceSha256,
      permittedUses: [...new Set(item.permittedUses.map(use => use.trim()))],
      restrictions: item.restrictions.trim(),
      attributionRequirements: item.attributionRequirements.trim(),
      verificationStatus: "VERIFIED",
      verifiedBy: actor.trim(),
      verifiedAt: timestamp
    };
  });
}
