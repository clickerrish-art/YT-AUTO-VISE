#!/usr/bin/env node
/** Fail-closed script, provenance, parent-link, edit-plan and audio evidence gate. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  createDeterministicEditPlan,
  validateAssetProvenance,
  validateAudioReport,
  validateScriptDepth,
  validateShortParentRelationship
} from "./content-quality-gates.mjs";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function validateContentQualityEvidence(evidence, { format, evidenceDir = process.cwd(), expectedFootagePath, expectedNarrationPath } = {}) {
  const errors = [];
  let matchedFootage = false;
  if (!evidence || typeof evidence !== "object") return ["quality evidence must be a JSON object"];
  if (evidence.format !== format) errors.push("quality evidence format must match render format " + format);
  const script = validateScriptDepth(evidence.script, { format });
  errors.push(...script.errors.map(e => "script: " + e));
  if (!Array.isArray(evidence.assetProvenance) || evidence.assetProvenance.length === 0) {
    errors.push("at least one asset provenance record is required");
  } else {
    evidence.assetProvenance.forEach((asset, index) => {
      const result = validateAssetProvenance(asset);
      errors.push(...result.errors.map(e => "asset " + (index + 1) + ": " + e));
      if (typeof asset.path !== "string" || !asset.path.trim()) {
        errors.push("asset " + (index + 1) + " must include the path to the exact source file");
      } else {
        try {
          const file = resolveRegularFileNoSymlinks(asset.path, evidenceDir, "Provenance source asset");
          if (sha256(file) !== asset.originalSha256) errors.push("asset " + (index + 1) + " source hash does not match the file bytes");
          if (expectedFootagePath && path.resolve(file) === path.resolve(expectedFootagePath)) matchedFootage = true;
        } catch {
          errors.push("asset " + (index + 1) + " source path is missing or unsafe");
        }
      }
    });
  }
  if (Array.isArray(evidence.scenes)) {
    const provenanceById = new Map((evidence.assetProvenance ?? []).map(asset => [asset?.assetId, asset]));
    evidence.scenes.forEach((scene, index) => {
      const asset = provenanceById.get(scene?.assetId);
      if (!asset) errors.push("scene " + index + " must reference an assetProvenance assetId");
      else if (asset.originalSha256 !== scene.sourceSha256) errors.push("scene " + index + " source SHA-256 must match its assetProvenance record");
      if (evidence.scenes.length > 1 && (!Number.isFinite(scene?.startSeconds) || !Number.isFinite(scene?.endSeconds) || scene.startSeconds < 0 || scene.endSeconds <= scene.startSeconds)) {
        errors.push("multi-scene scene " + index + " must specify a valid source startSeconds/endSeconds segment");
      }
    });
  } else errors.push("scenes must be an explicit array tied to source provenance");
  if (expectedFootagePath && !matchedFootage) errors.push("asset provenance must bind the exact footage file used by the render manifest");
  if (expectedFootagePath) {
    try {
      if (evidence.scenes?.[0]?.sourceSha256 !== sha256(expectedFootagePath)) errors.push("the first deterministic scene must bind the exact footage file used by the render manifest");
    } catch {
      errors.push("expected footage input is missing or unsafe");
    }
  }
  if (!Number.isSafeInteger(evidence.renderSeed) || evidence.renderSeed < 0) errors.push("renderSeed must be a recorded non-negative integer");
  try {
    const plan = createDeterministicEditPlan({ seed: evidence.renderSeed, scenes: evidence.scenes, profile: evidence.editProfile ?? {} });
    if (evidence.editPlanSha256 !== plan.planSha256) errors.push("editPlanSha256 does not match the reproducible edit plan");
  } catch (error) {
    errors.push("edit plan: " + error.message);
  }
  if (evidence.format === "short") {
    const relationship = validateShortParentRelationship(evidence.shortRelationship, evidence.parentRecord, { requireNativeRelatedVideoVerification: false });
    errors.push(...relationship.errors.map(e => "parent relationship: " + e));
  }
  const audio = evidence.audioReport;
  if (!audio || typeof audio.narrationPath !== "string" || !audio.narrationPath.trim()) {
    errors.push("audioReport.narrationPath is required to verify narration bytes");
  } else {
    try {
      const narrationPath = resolveRegularFileNoSymlinks(audio.narrationPath, evidenceDir, "Narration source");
      if (sha256(narrationPath) !== audio.narrationSha256) errors.push("audio narrationSha256 does not match the narration file bytes");
      if (expectedNarrationPath && path.resolve(narrationPath) !== path.resolve(expectedNarrationPath)) errors.push("audio report must bind the exact narration file used by the render manifest");
    } catch {
      errors.push("audio narration path is missing or unsafe");
    }
  }
  try {
    const audioResult = validateAudioReport(audio, evidence.audioProfile);
    errors.push(...audioResult.errors.map(e => "audio: " + e));
  } catch (error) {
    errors.push("audio: " + error.message);
  }
  if (evidence.humanEditorialReview?.status !== "APPROVED" || typeof evidence.humanEditorialReview?.reviewer !== "string" || !evidence.humanEditorialReview.reviewer.trim() || !evidence.humanEditorialReview?.reviewedAt || !Number.isFinite(Date.parse(evidence.humanEditorialReview.reviewedAt))) {
    errors.push("humanEditorialReview must record an approving reviewer and valid timestamp; automated checks do not prove realism or factual accuracy");
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [evidenceArg, format, expectedFootageArg, expectedNarrationArg] = process.argv.slice(2);
  if (!evidenceArg || !["long_form", "short"].includes(format)) {
    console.error("Usage: node scripts/validate-content-quality.mjs <quality-evidence.json> <long_form|short> [footage-file] [narration-file]");
    process.exit(2);
  }
  let evidencePath;
  try { evidencePath = resolveRegularFileNoSymlinks(evidenceArg, process.cwd(), "Content quality evidence"); }
  catch { console.error("BLOCKED: quality evidence is missing, unsafe or contains a symbolic link."); process.exit(2); }
  let evidence;
  try { evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8")); }
  catch { console.error("BLOCKED: quality evidence is not valid JSON."); process.exit(2); }
  let expectedFootagePath, expectedNarrationPath;
  try {
    if (expectedFootageArg) expectedFootagePath = resolveRegularFileNoSymlinks(expectedFootageArg, process.cwd(), "Manifest footage");
    if (expectedNarrationArg) expectedNarrationPath = resolveRegularFileNoSymlinks(expectedNarrationArg, process.cwd(), "Manifest narration");
  } catch {
    console.error("BLOCKED: manifest footage or narration path is missing or unsafe.");
    process.exit(2);
  }
  const errors = validateContentQualityEvidence(evidence, { format, evidenceDir: path.dirname(evidencePath), expectedFootagePath, expectedNarrationPath });
  if (errors.length) {
    console.error("BLOCKED — content quality evidence failed:");
    errors.forEach(error => console.error("- " + error));
    process.exit(1);
  }
  const measuredScript = validateScriptDepth(evidence.script, { format }).measured;
  console.log("PASS: script depth, source claims, provenance hashes, reproducible edit plan, audio measurements and editorial review evidence.");
  console.log("Measured narration: " + measuredScript.words + " words at " + measuredScript.speakingRateWpm + " WPM; estimated duration " + measuredScript.estimatedNarrationMinutes + " minutes (" + measuredScript.estimatedDurationSeconds + " seconds), target " + measuredScript.targetDurationSeconds.min + "–" + measuredScript.targetDurationSeconds.max + " seconds.");
  console.log("This is a word-rate estimate, not a measured final audio duration. Human review still requires genuine full playback and factual review.");
}