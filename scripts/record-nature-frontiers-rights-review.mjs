#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { validateMediaRegister } from "./validate-nature-frontiers-media-register.mjs";
import { persistRegister } from "./register-nature-frontiers-local-media.mjs";

const DEFAULT_REGISTER = "content/nature-frontiers-media-register.json";
const MEDIA_ROOT = "media/nature-frontiers";
const REQUIRED_CHECKS = [
  "sourceLicenceReviewed",
  "commercialUsePermitted",
  "attributionRequirementsChecked",
  "thirdPartyRightsChecked",
  "platformUseAndEditingRestrictionsChecked"
];
const SHA256 = /^[a-f0-9]{64}$/;

function isHttps(value) {
  try {
    const url = new URL(value);
    return typeof value === "string" && url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

function validZonedTimestamp(value, now) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= now;
}

export function recordNatureFrontiersRightsReview({ register, assetId, review, root = process.cwd(), now = Date.now() } = {}) {
  if (!register || !Array.isArray(register.assets)) throw new Error("register.assets must be an array");
  if (typeof assetId !== "string" || !assetId.trim()) throw new Error("assetId is required");
  const asset = register.assets.find(item => item?.id === assetId);
  if (!asset) throw new Error("unknown asset ID: " + assetId);
  if (asset.approval?.status !== "pending") throw new Error("rights review cannot alter an approved, rejected or revoked asset");
  if (asset.usage?.scheduled === true || asset.usage?.published === true) throw new Error("rights review is blocked for scheduled or published assets");
  if (!asset.localFile || !SHA256.test(asset.localFile.sha256 ?? "") || typeof asset.localFile.path !== "string") {
    throw new Error("rights review requires an exact registered local media file and SHA-256");
  }
  if (!review || typeof review !== "object" || Array.isArray(review)) throw new Error("review must be a JSON object");
  if (typeof review.reviewer !== "string" || !review.reviewer.trim()) throw new Error("reviewer must be a non-empty human reviewer identity");
  if (!validZonedTimestamp(review.reviewedAt, now)) throw new Error("reviewedAt must be a valid non-future timezone-qualified timestamp");
  if (review.fileSha256 !== asset.localFile.sha256) throw new Error("rights review fileSha256 must match the exact registered media file");
  if (!SHA256.test(review.fileSha256)) throw new Error("fileSha256 must be a lowercase SHA-256 digest");
  if (!["in_progress", "cleared", "rejected"].includes(review.reviewStatus)) throw new Error("reviewStatus must be in_progress, cleared or rejected");
  if (!["not_assessed", "required", "not_required", "obtained", "rejected"].includes(review.additionalPermissionsStatus)) {
    throw new Error("additionalPermissionsStatus is invalid");
  }
  if (!Array.isArray(review.licenseEvidence) || review.licenseEvidence.some(url => !isHttps(url))) {
    throw new Error("licenseEvidence must be an array of HTTPS evidence URLs");
  }
  if (!Array.isArray(review.additionalPermissionsEvidence ?? []) ||
      (review.additionalPermissionsEvidence ?? []).some(url => !isHttps(url))) {
    throw new Error("additionalPermissionsEvidence must be an array of HTTPS evidence URLs");
  }
  if (!Array.isArray(review.permittedUsage) || review.permittedUsage.some(scope => typeof scope !== "string" || !scope.trim())) {
    throw new Error("permittedUsage must be an array of non-empty usage scopes");
  }
  if (typeof review.reviewNotes !== "string" || review.reviewNotes.trim().length < 20) {
    throw new Error("reviewNotes must explain the rights assessment in at least 20 characters");
  }
  if (!review.checklist || typeof review.checklist !== "object" || Array.isArray(review.checklist) ||
      REQUIRED_CHECKS.some(key => typeof review.checklist[key] !== "boolean")) {
    throw new Error("checklist must explicitly record all five rights review checks as booleans");
  }
  if (review.reviewStatus === "cleared") {
    if (REQUIRED_CHECKS.some(key => review.checklist[key] !== true)) throw new Error("rights cannot be cleared until every required rights checklist item is confirmed");
    if (review.licenseEvidence.length === 0) throw new Error("cleared rights require licence evidence URLs");
    if (!["not_required", "obtained"].includes(review.additionalPermissionsStatus)) {
      throw new Error("cleared rights require additional permissions to be not_required or obtained");
    }
    if (review.additionalPermissionsStatus === "obtained" && review.additionalPermissionsEvidence.length === 0) {
      throw new Error("obtained additional permissions require evidence URLs");
    }
    if (review.permittedUsage.length === 0) throw new Error("cleared rights require at least one permittedUsage scope");
  }
  const projectRoot = fs.realpathSync(path.resolve(root));
  const mediaRoot = fs.realpathSync(path.join(projectRoot, MEDIA_ROOT));
  const localPath = path.resolve(projectRoot, asset.localFile.path);
  const realPath = fs.realpathSync(localPath);
  const relative = path.relative(mediaRoot, realPath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("registered media file resolves outside media/nature-frontiers");
  const stat = fs.lstatSync(localPath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("registered media file must be a regular non-symlink file");
  const actualHash = crypto.createHash("sha256").update(fs.readFileSync(localPath)).digest("hex");
  if (actualHash !== asset.localFile.sha256) throw new Error("local media bytes changed since intake; re-register before rights review");

  const record = {
    reviewer: review.reviewer.trim(),
    reviewedAt: review.reviewedAt,
    fileSha256: actualHash,
    reviewStatus: review.reviewStatus,
    additionalPermissionsStatus: review.additionalPermissionsStatus,
    licenseEvidence: [...review.licenseEvidence],
    additionalPermissionsEvidence: [...(review.additionalPermissionsEvidence ?? [])],
    permittedUsage: [...review.permittedUsage],
    checklist: Object.fromEntries(REQUIRED_CHECKS.map(key => [key, review.checklist[key]])),
    reviewNotes: review.reviewNotes.trim()
  };
  asset.rights = {
    ...(asset.rights ?? {}),
    reviewStatus: record.reviewStatus,
    additionalPermissionsStatus: record.additionalPermissionsStatus,
    licenseEvidence: record.licenseEvidence,
    additionalPermissionsEvidence: record.additionalPermissionsEvidence,
    permittedUsage: record.permittedUsage,
    reviewedBy: record.reviewer,
    reviewedAt: record.reviewedAt,
    reviewHistory: [...(Array.isArray(asset.rights?.reviewHistory) ? asset.rights.reviewHistory : []), record]
  };
  // Rights assessment never approves content, inspects visuals or enables publishing.
  const errors = validateMediaRegister(register, { now });
  if (errors.length) throw new Error("register validation failed: " + errors.join("; "));
  return { assetId, fileSha256: actualHash, rights: record, approvalStatus: asset.approval.status };
}

export function runNatureFrontiersRightsReview({ args, root = process.cwd(), now = Date.now() } = {}) {
  if (!Array.isArray(args) || args.length < 2 || args.length > 3) throw new Error("expected asset ID, rights review JSON path and optional register JSON path");
  const [assetId, reviewPath, registerArg] = args;
  const registerPath = path.resolve(root, registerArg ?? DEFAULT_REGISTER);
  const register = JSON.parse(fs.readFileSync(registerPath, "utf8"));
  const review = JSON.parse(fs.readFileSync(path.resolve(root, reviewPath), "utf8"));
  const result = recordNatureFrontiersRightsReview({ register, assetId, review, root, now });
  persistRegister(registerPath, register);
  return { ...result, message: "PASS: rights assessment recorded for " + assetId + " against SHA-256 " + result.fileSha256 + ". Human approval remains pending; no scheduling or publication was authorized." };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(runNatureFrontiersRightsReview({ args: process.argv.slice(2) }).message); }
  catch (error) { console.error("FAIL: " + error.message); process.exitCode = 1; }
}
