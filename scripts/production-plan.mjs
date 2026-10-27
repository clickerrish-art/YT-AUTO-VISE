import crypto from "node:crypto";

const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const FORMATS = new Set(["short", "long_form"]);

function stableStringify(value) {
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

export function productionPlanSha256(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw new Error("Production plan must be an object");
  return crypto.createHash("sha256").update(stableStringify(plan), "utf8").digest("hex");
}

/**
 * Structural gate only. A PASS does not prove ownership, licence validity,
 * originality, factual accuracy or visual realism; those require independent
 * evidence validation and human review.
 */
export function validateProductionPlan(plan, { jobId, contentType, scriptSha256 } = {}) {
  const errors = [];
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return ["production plan must be a JSON object"];
  if (plan.schemaVersion !== 1) errors.push("production plan schemaVersion must be 1");
  if (!SAFE_ID.test(plan.jobId ?? "") || plan.jobId !== jobId) errors.push("production plan must bind the exact persisted job ID");
  if (!FORMATS.has(contentType) || plan.contentType !== contentType) errors.push("production plan format must match the persisted job");
  if (!SHA256.test(plan.scriptSha256 ?? "") || plan.scriptSha256 !== scriptSha256) errors.push("production plan must bind the exact approved script SHA-256");
  if (typeof plan.title !== "string" || plan.title.trim().length < 8 || plan.title.length > 100) errors.push("production plan title must be 8–100 characters");
  if (typeof plan.editorialPremise !== "string" || plan.editorialPremise.trim().length < 30 || plan.editorialPremise.length > 2000) errors.push("a substantive 30–2000 character editorial premise is required");
  if (typeof plan.syntheticDisclosure !== "string" || !plan.syntheticDisclosure.trim()) errors.push("synthetic-content disclosure decision is required");
  if (plan.publishingEnabled !== false) errors.push("production plan must keep publishing disabled");
  if (plan.humanReviewRequired !== true) errors.push("production plan must require human review");
  if (!Array.isArray(plan.scenes)) errors.push("scene-by-scene asset manifest is required");
  else {
    const minScenes = contentType === "short" ? 3 : 6;
    if (plan.scenes.length < minScenes || plan.scenes.length > 60) errors.push("scene count must be " + minScenes + "–60 for this format");
    const ids = new Set();
    for (let i = 0; i < plan.scenes.length; i++) {
      const scene = plan.scenes[i];
      const prefix = "scene " + (i + 1) + ": ";
      if (!scene || typeof scene !== "object" || Array.isArray(scene)) { errors.push(prefix + "must be an object"); continue; }
      if (!SAFE_ID.test(scene.sceneId ?? "") || ids.has(scene.sceneId)) errors.push(prefix + "sceneId must be unique and valid");
      ids.add(scene.sceneId);
      if (typeof scene.editorialPurpose !== "string" || scene.editorialPurpose.trim().length < 10) errors.push(prefix + "editorial purpose is required");
      if (typeof scene.narrationCue !== "string" || scene.narrationCue.trim().length < 8) errors.push(prefix + "narration alignment cue is required");
      if (typeof scene.assetPath !== "string" || !scene.assetPath.trim() || scene.assetPath.startsWith("/") || scene.assetPath.includes("\\") || scene.assetPath.split("/").includes("..")) errors.push(prefix + "repository-relative assetPath is required");
      if (!SHA256.test(scene.assetSha256 ?? "")) errors.push(prefix + "asset SHA-256 is required");
      if (!["GENERATED_ORIGINAL", "LICENSED_FOOTAGE", "LICENSED_STILL"].includes(scene.sourceType)) errors.push(prefix + "sourceType must identify original generated or licensed source media");
      if (!scene.provenance || typeof scene.provenance !== "object" || Array.isArray(scene.provenance) ||
          typeof scene.provenance.sourceOrGeneration !== "string" || scene.provenance.sourceOrGeneration.trim().length < 8 ||
          typeof scene.provenance.rightsEvidencePath !== "string" || !scene.provenance.rightsEvidencePath.trim() ||
          !SHA256.test(scene.provenance.rightsEvidenceSha256 ?? "") ||
          scene.provenance.permittedUse !== "COMMERCIAL_DERIVATIVE" ||
          typeof scene.provenance.attribution !== "string" ||
          typeof scene.provenance.editorialNotes !== "string" || scene.provenance.editorialNotes.trim().length < 8) {
        errors.push(prefix + "complete provenance, rights-evidence hash, commercial derivative permission, attribution and editorial notes are required");
      }
      if (!Number.isFinite(scene.startSeconds) || scene.startSeconds < 0 ||
          !Number.isFinite(scene.endSeconds) || scene.endSeconds <= scene.startSeconds) errors.push(prefix + "valid positive scene time range is required");
    }
  }
  if (contentType === "short") {
    const parent = plan.parentRelationship;
    if (!parent || typeof parent !== "object" || Array.isArray(parent)) errors.push("Short requires an explicit parent relationship; filename or title inference is forbidden");
    else {
      if (typeof parent.parentContentId !== "string" || !parent.parentContentId.trim() || parent.parentContentId === jobId) errors.push("Short parentContentId must identify a distinct exact parent job");
      if (!SHA256.test(parent.parentRevisionSha256 ?? "")) errors.push("Short parent approved revision SHA-256 is required");
      if (!SHA256.test(parent.parentMediaSha256 ?? "")) errors.push("Short parent media SHA-256 is required");
      if (!Array.isArray(parent.sourceSegments) || parent.sourceSegments.length < 1 ||
          parent.sourceSegments.some(segment => !segment || typeof segment.sceneId !== "string" || !segment.sceneId.trim() ||
            !Number.isFinite(segment.startSeconds) || segment.startSeconds < 0 ||
            !Number.isFinite(segment.endSeconds) || segment.endSeconds <= segment.startSeconds)) {
        errors.push("Short requires explicit source scene segments from its approved parent");
      }
      if (parent.remoteParentVerified !== true || !/^[A-Za-z0-9_-]{11}$/.test(parent.remoteVideoId ?? "") ||
          parent.channelTitle !== "SonicVhibez" || !/^UC[A-Za-z0-9_-]{22}$/.test(parent.channelId ?? "") ||
          parent.visibility !== "public") errors.push("Short parent must have a verified public SonicVhibez remote receipt and exact channel identity");
      const expectedUrl = "https://www.youtube.com/watch?v=" + String(parent.remoteVideoId ?? "");
      if (parent.destinationUrl !== expectedUrl) errors.push("Short parent destination must be the canonical URL for the verified remote parent ID");
    }
  } else if (plan.parentRelationship !== undefined && plan.parentRelationship !== null) {
    errors.push("long-form production plan must not carry a Short parent relationship");
  }
  return errors;
}
