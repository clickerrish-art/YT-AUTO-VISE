import crypto from "node:crypto";

const SHA256 = /^[a-f0-9]{64}$/;
const AUDIO_PROFILES = Object.freeze({
  documentary_narration: { narrationTargetLufs: -16, truePeakDbtpMax: -1.5, musicBelowNarrationDb: 12, ambienceBelowNarrationDb: 15, fadesRequired: true },
  wildlife_immersive: { narrationTargetLufs: -16, truePeakDbtpMax: -1.5, musicBelowNarrationDb: 10, ambienceBelowNarrationDb: 12, fadesRequired: true },
  minimal_clean: { narrationTargetLufs: -18, truePeakDbtpMax: -2, musicBelowNarrationDb: 18, ambienceBelowNarrationDb: 18, fadesRequired: true },
  short_form_voice_first: { narrationTargetLufs: -14, truePeakDbtpMax: -1, musicBelowNarrationDb: 14, ambienceBelowNarrationDb: 16, fadesRequired: true }
});

const PLACEHOLDER = /replace[_ -]?with|placeholder|todo|tbd|unknown|example\.com/i;

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hashValid(value) {
  return typeof value === "string" && SHA256.test(value);
}

/**
 * Validate a Short's explicit, revision-bound parent relationship.
 * This is an application relationship gate; it does not claim that YouTube's
 * native Related video feature has been set.
 */
export function validateShortParentRelationship(short, parent, {
  expectedChannel = "SonicVhibez",
  requireNativeRelatedVideoVerification = true
} = {}) {
  const errors = [];
  if (!short || typeof short !== "object") return { valid: false, errors: ["Short record is required"] };
  if (short.format !== "short") errors.push("child format must be short");
  if (!nonempty(short.contentId)) errors.push("Short contentId is required");
  if (!nonempty(short.weeklyContentCycleId)) errors.push("Short weeklyContentCycleId is required");
  if (!nonempty(short.parentContentId)) errors.push("Short parentContentId is required");
  if (!parent || typeof parent !== "object") errors.push("explicit parent content record is missing");
  if (parent && short.parentContentId !== parent.contentId) errors.push("parentContentId does not match the supplied parent record");
  if (parent && parent.format !== "long_form") errors.push("parent content must be long_form");
  if (parent && short.weeklyContentCycleId !== parent.weeklyContentCycleId) errors.push("parent and Short must belong to the same weekly content cycle");
  if (parent && !["APPROVED", "APPROVED_FOR_PRIVATE_UPLOAD", "PRIVATE_UPLOAD_VERIFIED"].includes(parent.approvalStatus ?? parent.state)) errors.push("parent must have a current approved status");
  if (parent && ["FAILED", "CANCELLED", "REJECTED", "BLOCKED"].includes(String(parent.state ?? "").toUpperCase())) errors.push("failed, cancelled, rejected or blocked parent cannot be used");
  if (parent && !hashValid(parent.mediaSha256)) errors.push("parent mediaSha256 must be a valid SHA-256");
  if (parent && short.parentMediaSha256 !== parent.mediaSha256) errors.push("Short parentMediaSha256 is missing or stale");
  if (parent && (!nonempty(short.approvedParentRevision) || short.approvedParentRevision !== String(parent.revision ?? parent.approvedRevision ?? ""))) errors.push("approvedParentRevision does not match the current parent revision");
  if (parent && parent.channel !== expectedChannel) errors.push("parent channel must be exactly " + expectedChannel);
  if (parent && parent.channelId && short.parentChannelId !== parent.channelId) errors.push("parent channel ID does not match the Short relationship");
  if (parent && !hashValid(parent.mediaSha256)) errors.push("parent media checksum is not verified");
  const remoteId = parent?.remoteVideoId ?? parent?.youtubeVideoId ?? parent?.parentYouTubeVideoId;
  if (!nonempty(remoteId)) errors.push("parent verified YouTube video ID is required before the Short can become publishable");
  if (nonempty(short.parentYouTubeVideoId) && short.parentYouTubeVideoId !== remoteId) errors.push("Short parent YouTube video ID conflicts with the verified parent");
  const canonicalUrl = nonempty(remoteId) ? "https://www.youtube.com/watch?v=" + encodeURIComponent(remoteId) : "";
  if (short.verifiedDestinationUrl !== canonicalUrl) errors.push("verifiedDestinationUrl must exactly match the canonical URL derived from the verified parent video ID");
  if (short.relationshipStatus !== "VERIFIED") errors.push("relationshipStatus must be VERIFIED");
  if (requireNativeRelatedVideoVerification && short.youtubeRelatedVideoStatus !== "VERIFIED") errors.push("YouTube native Related video association is not independently verified; manual Studio verification is required");
  if (short.sourceSegment !== undefined && (!short.sourceSegment || typeof short.sourceSegment !== "object" || !nonempty(short.sourceSegment.start) || !nonempty(short.sourceSegment.end))) errors.push("sourceSegment must include explicit start and end when supplied");
  return { valid: errors.length === 0, errors, canonicalUrl: canonicalUrl || null, parentYouTubeVideoId: nonempty(remoteId) ? remoteId : null };
}

/**
 * Deterministic, non-evasive variation plan. The seed changes editorial choices,
 * not provenance, facts, rights restrictions, or source identities.
 */
export function createDeterministicEditPlan({ seed, scenes, profile = {} }) {
  if (!Number.isSafeInteger(seed) || seed < 0) throw new Error("render seed must be a non-negative safe integer");
  if (!Array.isArray(scenes) || scenes.length === 0) throw new Error("at least one approved scene is required");
  const errors = [];
  for (const [index, scene] of scenes.entries()) {
    if (!scene || !nonempty(scene.assetId) || !hashValid(scene.sourceSha256)) errors.push("scene " + index + " needs assetId and source SHA-256");
    if (scene?.rightsStatus !== "VERIFIED") errors.push("scene " + index + " rightsStatus must be VERIFIED");
    if (!nonempty(scene?.editorialPurpose)) errors.push("scene " + index + " needs an editorialPurpose");
    if (scene?.containsRestrictedMaterial === true) errors.push("scene " + index + " contains restricted material");
  }
  if (errors.length) throw new Error("edit plan blocked: " + errors.join("; "));
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const allowedTransitions = Array.isArray(profile.transitions) && profile.transitions.length
    ? profile.transitions : ["cut", "crossfade"];
  const allowedFraming = Array.isArray(profile.framing) && profile.framing.length
    ? profile.framing : ["fit", "gentle_crop"];
  return {
    seed,
    scenes: scenes.map((scene, index) => ({
      assetId: scene.assetId,
      sourceSha256: scene.sourceSha256,
      order: index,
      framing: allowedFraming[Math.floor(random() * allowedFraming.length)],
      transitionToNext: index === scenes.length - 1 ? "none" : allowedTransitions[Math.floor(random() * allowedTransitions.length)],
      purpose: scene.editorialPurpose
    })),
    profile: structuredClone(profile),
    planSha256: crypto.createHash("sha256").update(JSON.stringify({
      seed,
      scenes: scenes.map(s => ({ assetId: s.assetId, sourceSha256: s.sourceSha256, editorialPurpose: s.editorialPurpose })),
      profile
    })).digest("hex")
  };
}

/** Enforce measurable script structure; quality scores supplied by an LLM are ignored. */
export function validateScriptDepth(script, { format = "long_form", minWords, maxWords, minSections } = {}) {
  const errors = [];
  if (!script || typeof script !== "object") return { valid: false, errors: ["script object is required"], measured: null };
  if (!["long_form", "short"].includes(format)) errors.push("format must be long_form or short");
  const text = String(script.narration ?? "").trim();
  const words = text ? text.split(/\s+/u).length : 0;
  const sections = Array.isArray(script.sections) ? script.sections : [];
  const claims = Array.isArray(script.claims) ? script.claims : [];
  const sources = Array.isArray(script.sources) ? script.sources : [];
  const measuredMinWords = minWords ?? (format === "long_form" ? 780 : 90);
  const measuredMaxWords = maxWords ?? (format === "long_form" ? 1600 : 150);
  const measuredMinSections = minSections ?? (format === "long_form" ? 5 : 3);
  if (words < measuredMinWords || words > measuredMaxWords) errors.push("narration word count must be " + measuredMinWords + "–" + measuredMaxWords + "; measured " + words);
  if (sections.length < measuredMinSections) errors.push("at least " + measuredMinSections + " differentiated sections are required");
  for (const [index, section] of sections.entries()) {
    if (!nonempty(section?.heading) || !nonempty(section?.purpose) || !nonempty(section?.narration)) errors.push("section " + (index + 1) + " requires heading, purpose and narration");
  }
  if (format === "long_form" && (!nonempty(script.premise) || !nonempty(script.conclusion))) errors.push("long-form script requires a distinct premise and substantive conclusion");
  if (!Array.isArray(script.claims) || claims.length === 0) errors.push("material factual claims must be enumerated with source references");
  for (const [index, claim] of claims.entries()) {
    if (!nonempty(claim?.text) || !Array.isArray(claim?.sourceIds) || claim.sourceIds.length === 0) errors.push("claim " + (index + 1) + " requires text and at least one sourceId");
    for (const sourceId of claim?.sourceIds ?? []) {
      if (!sources.some(source => source?.id === sourceId && nonempty(source?.url) && /^https:\/\//i.test(source.url))) errors.push("claim " + (index + 1) + " references a missing or invalid HTTPS source: " + sourceId);
    }
  }
  for (const [index, source] of sources.entries()) {
    if (!nonempty(source?.id) || !nonempty(source?.title) || !nonempty(source?.url) || !/^https:\/\//i.test(source.url) || PLACEHOLDER.test(source.url)) errors.push("source " + (index + 1) + " must have a title and a non-placeholder HTTPS URL");
  }
  if (script.similarityReview?.status !== "REVIEWED" || !nonempty(script.similarityReview?.evidenceRef)) errors.push("originality similarity review evidence is required");
  return { valid: errors.length === 0, errors, measured: { words, sections: sections.length, claims: claims.length, sources: sources.length } };
}

/** Validate rights/provenance records; this does not independently prove a licence is genuine. */
export function validateAssetProvenance(asset) {
  const errors = [];
  if (!asset || typeof asset !== "object") return { valid: false, errors: ["asset provenance record is required"] };
  for (const key of ["assetId", "sourceMethod", "creatorOrRightsHolder", "acquiredAt", "licenseEvidenceLocation", "editorialPurpose"]) {
    if (!nonempty(asset[key])) errors.push(key + " is required");
  }
  if (!hashValid(asset.originalSha256)) errors.push("originalSha256 must be a SHA-256 checksum");
  if (!["GENERATED", "ORIGINAL_RECORDING", "LICENSED"].includes(asset.sourceMethod)) errors.push("sourceMethod must be GENERATED, ORIGINAL_RECORDING or LICENSED");
  if (!nonempty(asset.permittedUse) || PLACEHOLDER.test(asset.permittedUse ?? "")) errors.push("permittedUse must be explicit and non-placeholder");
  if (asset.rightsStatus !== "VERIFIED") errors.push("rightsStatus must be VERIFIED after human evidence review");
  if (asset.commercialUseAllowed !== true) errors.push("commercial use must be explicitly allowed for this production");
  if (asset.sourceMethod === "LICENSED" && (!nonempty(asset.licenseName) || !nonempty(asset.attributionRequirements))) errors.push("licensed assets require licenseName and attributionRequirements");
  if (asset.sourceMethod === "GENERATED" && (!nonempty(asset.generationMethod) || !nonempty(asset.generationTool))) errors.push("generated assets require generationMethod and generationTool");
  if (!nonempty(asset.verifiedBy) || !nonempty(asset.verifiedAt) || !Number.isFinite(Date.parse(asset.verifiedAt))) errors.push("human rights verifier and valid verification timestamp are required");
  return { valid: errors.length === 0, errors };
}

export function getAudioProfile(name) {
  if (!Object.hasOwn(AUDIO_PROFILES, name)) throw new Error("unknown audio profile: " + name);
  return structuredClone(AUDIO_PROFILES[name]);
}

export function validateAudioReport(report, profileName) {
  const profile = getAudioProfile(profileName);
  const errors = [];
  if (!report || typeof report !== "object") return { valid: false, errors: ["measured audio report is required"] };
  if (!hashValid(report.narrationSha256)) errors.push("narrationSha256 is required");
  if (!hashValid(report.finalAudioSha256)) errors.push("finalAudioSha256 is required");
  if (typeof report.transcriptMatchStatus !== "string" || report.transcriptMatchStatus !== "HUMAN_VERIFIED") errors.push("narration transcript must be HUMAN_VERIFIED against the approved script");
  if (!Number.isFinite(report.integratedLufs) || Math.abs(report.integratedLufs - profile.narrationTargetLufs) > 3) errors.push("integrated loudness is outside configured tolerance");
  if (!Number.isFinite(report.truePeakDbtp) || report.truePeakDbtp > profile.truePeakDbtpMax) errors.push("true peak exceeds configured maximum");
  if (!Number.isFinite(report.musicBelowNarrationDb) || report.musicBelowNarrationDb < profile.musicBelowNarrationDb) errors.push("music-to-narration separation is below profile minimum");
  if (!Number.isFinite(report.ambienceBelowNarrationDb) || report.ambienceBelowNarrationDb < profile.ambienceBelowNarrationDb) errors.push("ambience-to-narration separation is below profile minimum");
  if (profile.fadesRequired && report.fadesVerified !== true) errors.push("audio fades must be verified");
  if (report.rightsStatus !== "VERIFIED") errors.push("audio rights must be verified");
  return { valid: errors.length === 0, errors, profile };
}
