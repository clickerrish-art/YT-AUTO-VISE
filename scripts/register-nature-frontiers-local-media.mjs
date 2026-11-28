#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { validateMediaRegister } from "./validate-nature-frontiers-media-register.mjs";

const DEFAULT_REGISTER = "content/nature-frontiers-media-register.json";
const MEDIA_ROOT = "media/nature-frontiers";

export function extractVideoTechnicalMetadata(filePath, { probeExecutable = process.env.FFPROBE_PATH || "ffprobe", run = execFileSync } = {}) {
  let output;
  try {
    output = run(probeExecutable, ["-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate", "-of", "json", filePath], { encoding: "utf8", timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true });
  } catch (error) { throw new Error("ffprobe failed: " + error.message); }
  let parsed;
  try { parsed = JSON.parse(output); } catch { throw new Error("ffprobe returned invalid JSON"); }
  const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
  const video = streams.find(stream => stream?.codec_type === "video");
  if (!video) throw new Error("ffprobe found no video stream");
  const durationSeconds = Number(parsed.format?.duration);
  const width = Number(video.width);
  const height = Number(video.height);
  const rateParts = String(video.avg_frame_rate ?? "").split("/");
  const [numerator, denominator] = rateParts.map(Number);
  const frameRate = rateParts.length === 2 && denominator > 0 ? numerator / denominator : NaN;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0 || !Number.isFinite(frameRate) || frameRate <= 0 || typeof video.codec_name !== "string" || !/^[a-zA-Z0-9_.-]+$/.test(video.codec_name)) {
    throw new Error("ffprobe metadata is incomplete or invalid");
  }
  const audio = streams.find(stream => stream?.codec_type === "audio");
  return { extractor: "ffprobe", durationSeconds, width, height, frameRate, videoCodec: video.codec_name, audioCodec: typeof audio?.codec_name === "string" ? audio.codec_name : null };
}

export function registerLocalMedia({ register, assetId, filePath, root = process.cwd(), technicalMetadata = null }) {
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
  if (technicalMetadata !== null) {
    const validTechnical = technicalMetadata && technicalMetadata.extractor === "ffprobe" && Number.isFinite(technicalMetadata.durationSeconds) && technicalMetadata.durationSeconds > 0 && Number.isInteger(technicalMetadata.width) && technicalMetadata.width > 0 && Number.isInteger(technicalMetadata.height) && technicalMetadata.height > 0 && Number.isFinite(technicalMetadata.frameRate) && technicalMetadata.frameRate > 0 && typeof technicalMetadata.videoCodec === "string" && /^[a-zA-Z0-9_.-]+$/.test(technicalMetadata.videoCodec) && (technicalMetadata.audioCodec === null || (typeof technicalMetadata.audioCodec === "string" && /^[a-zA-Z0-9_.-]+$/.test(technicalMetadata.audioCodec)));
    if (!validTechnical) throw new Error("technicalMetadata is incomplete or invalid");
    asset.media.technical = structuredClone(technicalMetadata);
  }
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

export function parseIntakeArguments(args) {
  const probeCount = args.filter(arg => arg === "--probe").length;
  if (probeCount > 1) throw new Error("--probe may only be supplied once");
  const positional = args.filter(arg => arg !== "--probe");
  const unknown = positional.find(arg => arg.startsWith("--"));
  if (unknown) throw new Error("unknown option: " + unknown);
  if (positional.length < 2 || positional.length > 3) throw new Error("expected asset ID, media path and optional register path");
  return { assetId: positional[0], filePath: positional[1], registerPath: positional[2] || DEFAULT_REGISTER, probeRequested: probeCount === 1 };
}

export function runLocalMediaIntake({ args, root = process.cwd(), probeExecutable, runProbe } = {}) {
  const parsed = parseIntakeArguments(args ?? []);
  const registerPath = path.resolve(root, parsed.registerPath);
  const register = JSON.parse(fs.readFileSync(registerPath, "utf8"));
  const result = registerLocalMedia({ register, assetId: parsed.assetId, filePath: parsed.filePath, root });
  let technicalMetadata = null;
  if (parsed.probeRequested) {
    const options = {};
    if (probeExecutable) options.probeExecutable = probeExecutable;
    if (runProbe) options.run = runProbe;
    technicalMetadata = extractVideoTechnicalMetadata(path.resolve(root, result.path), options);
    register.assets.find(asset => asset.id === parsed.assetId).media.technical = technicalMetadata;
  }
  const validationErrors = validateMediaRegister(register);
  if (validationErrors.length) throw new Error("register validation failed: " + validationErrors.join("; "));
  persistRegister(registerPath, register);
  const technical = technicalMetadata ? " ffprobe: " + technicalMetadata.width + "x" + technicalMetadata.height + ", " + technicalMetadata.durationSeconds + "s, " + technicalMetadata.frameRate + "fps." : "";
  return { ...result, technicalMetadata, message: "PASS: recorded local file integrity for " + result.assetId + ": " + result.path + " (" + result.byteSize + " bytes, SHA-256 " + result.sha256 + ")." + technical + " Inspection, rights and approval remain pending." };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = runLocalMediaIntake({ args: process.argv.slice(2) });
    console.log(result.message);
  } catch (error) {
    console.error("FAIL: " + error.message);
    process.exitCode = 1;
  }
}
