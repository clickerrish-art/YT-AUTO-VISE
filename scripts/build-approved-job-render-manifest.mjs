import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { canonicalAuthoringScriptSha256 } from "./authoring-production-pipeline.mjs";
import { productionPlanSha256 } from "./production-plan.mjs";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

const SHA256 = /^[a-f0-9]{64}$/;
const APPROVED_SELLAR_URL = "https://selar.com/0u19v8u99l";

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function resolveHashedFile(root, relativePath, expectedHash, label) {
  if (typeof relativePath !== "string" || !relativePath.trim() ||
      path.isAbsolute(relativePath) || relativePath.split(/[\\/]/u).includes("..") ||
      !SHA256.test(expectedHash ?? "")) {
    throw new Error(label + " requires a repository-relative path and SHA-256");
  }
  const absolute = resolveRegularFileNoSymlinks(relativePath, root, label);
  if (sha256File(absolute) !== expectedHash) throw new Error(label + " SHA-256 does not match file bytes");
  return absolute;
}

/**
 * Build a renderer manifest only from a fully reviewed job and independently
 * hash-bound evidence. This prepares a render; it does not grant publication
 * permission or certify visual realism, rights validity, or factual accuracy.
 *
 * The approved plan must contain renderEvidence:
 * {
 *   qualityEvidencePath, qualityEvidenceSha256,
 *   metadataPath, metadataSha256,
 *   narrationRightsEvidencePath, narrationRightsEvidenceSha256,
 *   complianceReviewed: true, complianceReviewer, complianceReviewedAt
 * }
 */
export function buildApprovedJobRenderManifest({ job, root }) {
  if (!job || job.kind !== "CONTENT_PRODUCTION" || !["short", "long_form"].includes(job.contentType)) {
    throw new Error("A persisted Short or long-form content job is required");
  }
  const authoring = job.authoring;
  const script = authoring?.result?.script;
  if (!script || typeof script !== "object" || Array.isArray(script)) throw new Error("Generated structured script is missing");
  const scriptSha256 = canonicalAuthoringScriptSha256(script);
  if (authoring?.scriptApproval?.decision !== "APPROVE" ||
      authoring.scriptApproval.scriptSha256 !== scriptSha256 ||
      authoring.scriptSha256 !== scriptSha256) {
    throw new Error("The exact current script revision must have human approval");
  }

  const narration = authoring.narrationStage;
  const narrationApproval = authoring.narrationApproval;
  if (narration?.status !== "APPROVED_FOR_RENDER" || narration.scriptSha256 !== scriptSha256 ||
      narrationApproval?.decision !== "APPROVE" || narrationApproval.scriptSha256 !== scriptSha256 ||
      narrationApproval.confirmAudioListened !== true ||
      narrationApproval.confirmTranscriptReviewed !== true ||
      narrationApproval.confirmCaptionsReviewed !== true) {
    throw new Error("Narration, transcript and captions must be human-approved for the exact script");
  }
  const artifactFiles = {};
  for (const [name, hashField] of [
    ["narration.mp3", "audioSha256"],
    ["narration.txt", "transcriptSha256"],
    ["captions.srt", "captionsSha256"],
    ["narration-report.json", "reportSha256"]
  ]) {
    const record = narration.artifacts?.[name];
    if (!record || record.sha256 !== narrationApproval[hashField] || !SHA256.test(record.sha256 ?? "")) {
      throw new Error("Approved narration is missing hash-bound artifact " + name);
    }
    const absolute = resolveRegularFileNoSymlinks(record.path, root, "Approved " + name);
    if (sha256File(absolute) !== record.sha256) throw new Error("Approved narration artifact changed: " + name);
    artifactFiles[name] = absolute;
  }

  const planStage = authoring.productionPlan;
  if (planStage?.status !== "APPROVED_PLAN_ONLY" || planStage.review?.decision !== "APPROVE" ||
      planStage.review.planSha256 !== planStage.planSha256 ||
      productionPlanSha256(planStage.plan) !== planStage.planSha256 ||
      planStage.scriptSha256 !== scriptSha256) {
    throw new Error("A current, hash-bound, human-approved production plan is required");
  }
  const plan = planStage.plan;
  if (plan.jobId !== job.id || plan.contentType !== job.contentType || plan.scriptSha256 !== scriptSha256 ||
      plan.publishingEnabled !== false || plan.humanReviewRequired !== true ||
      !Array.isArray(plan.scenes) || plan.scenes.length < (job.contentType === "short" ? 3 : 6)) {
    throw new Error("Production plan does not match this job or lacks mandatory scene/safety fields");
  }

  const renderEvidence = plan.renderEvidence;
  if (!renderEvidence || renderEvidence.complianceReviewed !== true ||
      typeof renderEvidence.complianceReviewer !== "string" || !renderEvidence.complianceReviewer.trim() ||
      !Number.isFinite(Date.parse(renderEvidence.complianceReviewedAt ?? ""))) {
    throw new Error("Separate, dated compliance review evidence is required before rendering");
  }

  const qualityEvidencePath = resolveHashedFile(root, renderEvidence.qualityEvidencePath,
    renderEvidence.qualityEvidenceSha256, "Quality evidence");
  const metadataPath = resolveHashedFile(root, renderEvidence.metadataPath,
    renderEvidence.metadataSha256, "Approved metadata");
  const narrationRightsPath = resolveHashedFile(root, renderEvidence.narrationRightsEvidencePath,
    renderEvidence.narrationRightsEvidenceSha256, "Narration rights evidence");

  let qualityEvidence;
  try { qualityEvidence = JSON.parse(fs.readFileSync(qualityEvidencePath, "utf8")); }
  catch { throw new Error("Quality evidence must be readable JSON"); }
  if (qualityEvidence.format !== job.contentType || qualityEvidence.humanEditorialReview?.status !== "APPROVED" ||
      typeof qualityEvidence.humanEditorialReview?.reviewer !== "string" ||
      !qualityEvidence.humanEditorialReview.reviewer.trim() ||
      !Number.isFinite(Date.parse(qualityEvidence.humanEditorialReview.reviewedAt ?? ""))) {
    throw new Error("Quality evidence must include a matching format and explicit human editorial approval");
  }
  const transcript = fs.readFileSync(artifactFiles["narration.txt"], "utf8").replace(/\\s+/gu, " ").trim();
  const evidenceNarration = qualityEvidence.script?.narration;
  if (typeof evidenceNarration !== "string" || evidenceNarration.replace(/\\s+/gu, " ").trim() !== transcript) {
    throw new Error("Quality-evidence script narration must match the exact approved transcript");
  }
  if (!Array.isArray(qualityEvidence.scenes) || qualityEvidence.scenes.length !== plan.scenes.length ||
      !Array.isArray(qualityEvidence.assetProvenance)) {
    throw new Error("Quality evidence must map every approved production-plan scene to provenance");
  }
  for (const scene of plan.scenes) {
    const source = resolveHashedFile(root, scene.assetPath, scene.assetSha256, "Scene asset " + scene.sceneId);
    const provenance = qualityEvidence.assetProvenance.find(asset =>
      asset?.originalSha256 === scene.assetSha256 &&
      typeof asset.path === "string" &&
      path.resolve(root, asset.path) === source);
    if (!provenance) throw new Error("Quality evidence lacks matching provenance for scene " + scene.sceneId);
    resolveHashedFile(root, scene.provenance?.rightsEvidencePath,
      scene.provenance?.rightsEvidenceSha256, "Scene rights evidence " + scene.sceneId);
  }
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  if (metadata.channel !== "SonicVhibez" || metadata.visibility !== "private" ||
      metadata.productUrl !== APPROVED_SELLAR_URL ||
      typeof metadata.title !== "string" || !metadata.title.trim() ||
      typeof metadata.description !== "string" || !metadata.description.trim() ||
      !Array.isArray(metadata.tags) || metadata.tags.length < 3) {
    throw new Error("Metadata must be complete, private-only, SonicVhibez-bound and use the exact approved Selar URL");
  }

  if (job.contentType === "short") {
    const relationship = job.shortParentRelationship;
    const parent = plan.parentRelationship;
    if (!relationship || relationship.relationshipApproved !== true ||
        relationship.parentRemoteVerified !== true || relationship.parentChannelTitle !== "SonicVhibez" ||
        relationship.parentPrivacyStatus !== "public" || !parent ||
        parent.parentContentId !== relationship.parentContentId ||
        parent.remoteVideoId !== relationship.parentRemoteVideoId ||
        parent.parentMediaSha256 !== relationship.parentMediaSha256 ||
        parent.channelId !== relationship.parentChannelId ||
        parent.remoteParentVerified !== true) {
      throw new Error("Short rendering requires the exact independently approved and remotely verified SonicVhibez parent relationship");
    }
  }

  const firstScene = plan.scenes[0];
  const manifest = {
    channel: "SonicVhibez",
    footagePath: path.resolve(root, firstScene.assetPath),
    narrationPath: artifactFiles["narration.mp3"],
    captionsPath: artifactFiles["captions.srt"],
    qualityEvidencePath,
    footageLicenseEvidence: path.resolve(root, firstScene.provenance.rightsEvidencePath),
    narrationLicenseEvidence: narrationRightsPath,
    rightsConfirmed: true,
    complianceReviewed: true,
    ...(job.contentType === "short" ? { targetSeconds: 55 } : { targetAspectRatio: "16:9" }),
    metadataPath,
    metadataSha256: renderEvidence.metadataSha256,
    scriptSha256,
    narrationSha256: narrationApproval.audioSha256,
    transcriptSha256: narrationApproval.transcriptSha256,
    captionsSha256: narrationApproval.captionsSha256,
    productionPlanSha256: planStage.planSha256,
    qualityEvidenceSha256: renderEvidence.qualityEvidenceSha256,
    parentRelationship: job.contentType === "short" ? plan.parentRelationship : null,
    publishingEnabled: false,
    publishable: false
  };
  return { manifest, artifactFiles, qualityEvidencePath, metadataPath, narrationRightsPath };
}
