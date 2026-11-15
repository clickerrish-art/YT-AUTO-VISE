#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const DEFAULT_REGISTER = "content/nature-frontiers-media-register.json";
const MEDIA_ROOT = "media/nature-frontiers";

export function registerLocalMedia({ register, assetId, filePath, root = process.cwd() }) {
  if (!register || !Array.isArray(register.assets)) throw new Error("register.assets must be an array");
  if (typeof assetId !== "string" || !assetId.trim()) throw new Error("assetId is required");
  if (typeof filePath !== "string" || !filePath.trim()) throw new Error("filePath is required");

  const asset = register.assets.find(item => item.id === assetId);
  if (!asset) throw new Error(`unknown asset ID: ${assetId}`);
  if (asset.approval?.status !== "pending") throw new Error("local media replacement is blocked unless approval is pending");
  if (asset.usage?.scheduled === true || asset.usage?.published === true) throw new Error("cannot replace media for a scheduled or published asset");

  const absoluteRoot = fs.realpathSync(path.resolve(root));
  const mediaRoot = path.resolve(absoluteRoot, MEDIA_ROOT);
  const absoluteFile = path.resolve(absoluteRoot, filePath);
  const relativeToMedia = path.relative(mediaRoot, absoluteFile);
  if (!relativeToMedia || relativeToMedia.startsWith("..") || path.isAbsolute(relativeToMedia)) {
    throw new Error(`media file must be stored under ${MEDIA_ROOT}/`);
  }
  const realMediaRoot = fs.realpathSync(mediaRoot);
  const realFile = fs.realpathSync(absoluteFile);
  const realRootRelative = path.relative(absoluteRoot, realMediaRoot);
  const realFileRelative = path.relative(realMediaRoot, realFile);
  if (realRootRelative.startsWith("..") || path.isAbsolute(realRootRelative) ||
      !realFileRelative || realFileRelative.startsWith("..") || path.isAbsolute(realFileRelative)) {
    throw new Error("media path resolves outside the dedicated local media directory");
  }
  const stat = fs.lstatSync(absoluteFile);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("media path must be a regular, non-symlink file");
  if (stat.size === 0) throw new Error("media file must not be empty");

  const bytes = fs.readFileSync(absoluteFile);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  const relativePath = path.relative(absoluteRoot, absoluteFile).split(path.sep).join("/");
  asset.localFile = { path: relativePath, sha256, byteSize: stat.size };
  asset.media = { ...(asset.media ?? {}), sha256, byteSize: stat.size };
  // A new file is evidence of possession and integrity only, never visual inspection or rights clearance.
  asset.inspection = { ...(asset.inspection ?? {}), status: "not_inspected", inspectedBy: null, inspectedAt: null, visualNotes: "" };
  asset.rights = { ...(asset.rights ?? {}), reviewStatus: "not_assessed", additionalPermissionsStatus: "not_assessed", reviewedBy: null, reviewedAt: null };
  asset.approval = { status: "pending", approvedBy: null, approvedAt: null, approvedFileSha256: null, approvedUsage: [] };
  return { assetId, path: relativePath, sha256, byteSize: stat.size };
}

export function persistRegister(registerPath, register) {
  const target = path.resolve(registerPath);
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(register, null, 2) + "\n", { flag: "wx" });
  try { fs.renameSync(temporary, target); }
  catch (error) { try { fs.unlinkSync(temporary); } catch {} throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [assetId, filePath, registerPath = DEFAULT_REGISTER] = process.argv.slice(2);
  if (!assetId || !filePath) {
    console.error("Usage: node scripts/register-nature-frontiers-local-media.mjs <asset-id> <media/nature-frontiers/file> [register.json]");
    process.exit(2);
  }
  try {
    const register = JSON.parse(fs.readFileSync(registerPath, "utf8"));
    const result = registerLocalMedia({ register, assetId, filePath });
    persistRegister(registerPath, register);
    console.log(`PASS: recorded local file integrity for ${result.assetId}: ${result.path} (${result.byteSize} bytes, SHA-256 ${result.sha256}). Inspection, rights and approval remain pending.`);
  } catch (error) {
    console.error("FAIL: " + error.message);
    process.exitCode = 1;
  }
}
