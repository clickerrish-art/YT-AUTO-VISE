#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { persistRegister } from "./register-nature-frontiers-local-media.mjs";
import { validateMediaRegister } from "./validate-nature-frontiers-media-register.mjs";

const DEFAULT_REGISTER = "content/nature-frontiers-media-register.json";
const REQUIRED_CHECKS = ["watchedEntireClip", "checkedBeginningMiddleEnd", "checkedAudio", "checkedEditsAndContext", "checkedForMisleadingRepresentation"];

function validTimestamp(value, now = Date.now()) {
  return typeof value === "string" && /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) && Date.parse(value) <= now;
}

function isHttps(value) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}

export function recordNatureFrontiersReview({ register, assetId, review, root = process.cwd(), now = Date.now() }) {
  if (!register || !Array.isArray(register.assets)) throw new Error("register.assets must be an array");
  if (!review || typeof review !== "object" || Array.isArray(review)) throw new Error("review input must be a JSON object");
  const asset = register.assets.find(item => item.id === assetId);
  if (!asset) throw new Error("unknown asset ID: " + assetId);
  if (!asset.localFile?.path || !/^[a-f0-9]{64}$/.test(asset.localFile.sha256 ?? "")) throw new Error("asset must have a registered local file and SHA-256 before review");
  if (asset.approval?.status !== "pending") throw new Error("visual review changes are blocked after an approval decision; use the formal revocation/re-review workflow");
  if (asset.usage?.scheduled || asset.usage?.published) throw new Error("cannot revise inspection after scheduling or publication; use a separate incident/revocation workflow");
  if (review.fileSha256 !== asset.localFile.sha256) throw new Error("review fileSha256 does not match the currently registered asset; review is stale");
  if (typeof review.reviewer !== "string" || !review.reviewer.trim()) throw new Error("reviewer is required");
  if (!validTimestamp(review.reviewedAt, now)) throw new Error("reviewedAt must be a valid non-future timezone-qualified timestamp");
  if (typeof review.visualNotes !== "string" || review.visualNotes.trim().length < 20) throw new Error("visualNotes must contain at least 20 meaningful characters");
  if (!review.checklist || REQUIRED_CHECKS.some(key => review.checklist[key] !== true)) throw new Error("all full-clip inspection checklist items must be explicitly true");
  if (!Array.isArray(review.claims)) throw new Error("claims must be an array; explicitly account for each existing factual claim");
  const knownClaims = Array.isArray(asset.claims) ? asset.claims : [];
  const seen = new Set();
  for (const claim of review.claims) {
    if (!claim || typeof claim.type !== "string" || typeof claim.value !== "string" || !["verified", "unverified", "not_used"].includes(claim.status)) throw new Error("each claim needs type, value and verified/unverified/not_used status");
    const key = claim.type + "\\u0000" + claim.value;
    if (seen.has(key)) throw new Error("duplicate claim review: " + claim.type + " / " + claim.value);
    seen.add(key);
    if (!knownClaims.some(item => item.type === claim.type && item.value === claim.value)) throw new Error("review references a claim not present in the register: " + claim.type + " / " + claim.value);
    if (claim.status === "verified" && (!Array.isArray(claim.evidenceUrls) || claim.evidenceUrls.length === 0 || claim.evidenceUrls.some(url => !isHttps(url)))) throw new Error("verified claims require one or more HTTPS evidenceUrls");
  }
  for (const claim of knownClaims) {
    if (!seen.has(claim.type + "\\u0000" + claim.value)) throw new Error("review must explicitly account for every registered claim: " + claim.type + " / " + claim.value);
  }

  const projectRoot = fs.realpathSync(path.resolve(root));
  const localPath = path.resolve(projectRoot, asset.localFile.path);
  const mediaRoot = fs.realpathSync(path.join(projectRoot, "media/nature-frontiers"));
  const realPath = fs.realpathSync(localPath);
  const relative = path.relative(mediaRoot, realPath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("registered media file resolves outside media/nature-frontiers");
  const stat = fs.lstatSync(localPath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("registered media file must be a regular non-symlink file");
  const actualHash = crypto.createHash("sha256").update(fs.readFileSync(localPath)).digest("hex");
  if (actualHash !== asset.localFile.sha256) throw new Error("local media bytes changed since intake; re-register and review the new exact file");

  const reviewRecord = {
    reviewer: review.reviewer.trim(),
    reviewedAt: review.reviewedAt,
    fileSha256: actualHash,
    checklist: Object.fromEntries(REQUIRED_CHECKS.map(key => [key, true])),
    visualNotes: review.visualNotes.trim(),
    claims: review.claims.map(claim => ({ type: claim.type, value: claim.value, status: claim.status, evidenceUrls: claim.status === "verified" ? [...claim.evidenceUrls] : [] }))
  };
  asset.reviewHistory = [...(Array.isArray(asset.reviewHistory) ? asset.reviewHistory : []), reviewRecord];
  asset.inspection = { ...(asset.inspection ?? {}), status: "complete", inspectedBy: reviewRecord.reviewer, inspectedAt: reviewRecord.reviewedAt, visualNotes: reviewRecord.visualNotes, inspectedFileSha256: actualHash };
  for (const reviewedClaim of reviewRecord.claims) {
    const existing = knownClaims.find(item => item.type === reviewedClaim.type && item.value === reviewedClaim.value);
    existing.status = reviewedClaim.status;
    existing.evidenceUrls = reviewedClaim.evidenceUrls;
  }
  // Inspection does not clear rights, approve the asset, or authorize scheduling/publication.
  const errors = validateMediaRegister(register, { now });
  if (errors.length) throw new Error("register validation failed: " + errors.join("; "));
  return { assetId, fileSha256: actualHash, reviewRecord };
}

export function runNatureFrontiersReview({ args, root = process.cwd(), now = Date.now() } = {}) {
  if (!Array.isArray(args) || args.length < 2 || args.length > 3) throw new Error("expected asset ID, review JSON path and optional register JSON path");
  const [assetId, reviewPath, registerArg] = args;
  const registerPath = path.resolve(root, registerArg ?? DEFAULT_REGISTER);
  const register = JSON.parse(fs.readFileSync(registerPath, "utf8"));
  const review = JSON.parse(fs.readFileSync(path.resolve(root, reviewPath), "utf8"));
  const result = recordNatureFrontiersReview({ register, assetId, review, root, now });
  persistRegister(registerPath, register);
  return { ...result, message: "PASS: complete visual inspection recorded for " + assetId + " against SHA-256 " + result.fileSha256 + ". Rights and approval remain unchanged." };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(runNatureFrontiersReview({ args: process.argv.slice(2) }).message); }
  catch (error) { console.error("FAIL: " + error.message); process.exitCode = 1; }
}
