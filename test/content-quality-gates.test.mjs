import test from "node:test";
import assert from "node:assert/strict";
import {
  createDeterministicEditPlan,
  getAudioProfile,
  validateAssetProvenance,
  validateAudioReport,
  validateScriptDepth,
  validateShortParentRelationship,
  validateShortPublicationRelationship
} from "../scripts/content-quality-gates.mjs";

const hash = "a".repeat(64);
const parent = {
  contentId: "long-2026-w44",
  weeklyContentCycleId: "cycle-2026-w44",
  format: "long_form",
  state: "PRIVATE_UPLOAD_VERIFIED",
  approvalStatus: "APPROVED_FOR_PRIVATE_UPLOAD",
  revision: "rev-3",
  mediaSha256: hash,
  channel: "SonicVhibez",
  channelId: "UCverified",
  privacyStatus: "unlisted",
  remoteVideoId: "abc123XYZ",
};
const child = {
  contentId: "short-2026-w44",
  weeklyContentCycleId: "cycle-2026-w44",
  format: "short",
  parentContentId: parent.contentId,
  parentMediaSha256: hash,
  approvedParentRevision: "rev-3",
  parentYouTubeVideoId: "abc123XYZ",
  parentChannelId: "UCverified",
  verifiedDestinationUrl: "https://www.youtube.com/watch?v=abc123XYZ",
  relationshipStatus: "VERIFIED",
  youtubeRelatedVideoStatus: "VERIFIED",
};

test("accepts only an explicit approved parent with matching cycle, revision, hash and verified remote destination", () => {
  const result = validateShortParentRelationship(child, parent);
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.equal(result.canonicalUrl, "https://www.youtube.com/watch?v=abc123XYZ");
});

test("fails closed for missing/wrong parent, wrong cycle, stale revision/hash and unverified native Related video", () => {
  assert.match(validateShortParentRelationship({ ...child, parentContentId: "" }, parent).errors.join(" "), /parentContentId/);
  assert.match(validateShortParentRelationship(child, { ...parent, contentId: "different" }).errors.join(" "), /does not match/);
  assert.match(validateShortParentRelationship(child, { ...parent, weeklyContentCycleId: "other-cycle" }).errors.join(" "), /same weekly content cycle/);
  assert.match(validateShortParentRelationship({ ...child, parentMediaSha256: "b".repeat(64) }, parent).errors.join(" "), /stale/);
  assert.match(validateShortParentRelationship({ ...child, approvedParentRevision: "rev-2" }, parent).errors.join(" "), /revision/);
  assert.match(validateShortParentRelationship({ ...child, youtubeRelatedVideoStatus: "PENDING" }, parent).errors.join(" "), /Related video association/);
  assert.equal(validateShortParentRelationship({ ...child, youtubeRelatedVideoStatus: "PENDING" }, parent, { requireNativeRelatedVideoVerification: false }).valid, true);
  assert.match(validateShortPublicationRelationship({ ...child, youtubeRelatedVideoStatus: "PENDING" }, parent).errors.join(" "), /Related video association/);
  assert.match(validateShortPublicationRelationship(child, { ...parent, privacyStatus: "private" }).errors.join(" "), /must be public or unlisted/);
});

test("blocks unapproved, failed, foreign-channel and unpublished parent records", () => {
  assert.match(validateShortParentRelationship(child, { ...parent, approvalStatus: "PENDING" }).errors.join(" "), /approved status/);
  assert.match(validateShortParentRelationship(child, { ...parent, state: "FAILED" }).errors.join(" "), /failed, cancelled/);
  assert.match(validateShortParentRelationship(child, { ...parent, channel: "Nature Frontiers" }).errors.join(" "), /exactly SonicVhibez/);
  assert.match(validateShortParentRelationship({ ...child, parentYouTubeVideoId: "", verifiedDestinationUrl: "" }, { ...parent, remoteVideoId: "" }).errors.join(" "), /video ID is required/);
  assert.match(validateShortParentRelationship({ ...child, verifiedDestinationUrl: "https://youtube.com/watch?v=wrong" }, parent).errors.join(" "), /canonical URL/);
});

test("render edit plan is reproducible for same seed and does not accept unverified assets", () => {
  const scenes = [
    { assetId: "scene-a", sourceSha256: hash, rightsStatus: "VERIFIED", editorialPurpose: "Establish habitat" },
    { assetId: "scene-b", sourceSha256: "b".repeat(64), rightsStatus: "VERIFIED", editorialPurpose: "Show natural behavior" }
  ];
  assert.deepEqual(createDeterministicEditPlan({ seed: 44, scenes }), createDeterministicEditPlan({ seed: 44, scenes }));
  assert.notDeepEqual(createDeterministicEditPlan({ seed: 44, scenes }), createDeterministicEditPlan({ seed: 45, scenes }));
  assert.throws(() => createDeterministicEditPlan({ seed: 44, scenes: [{ ...scenes[0], rightsStatus: "UNKNOWN" }] }), /rightsStatus/);
  assert.throws(() => createDeterministicEditPlan({ seed: 44, scenes: [{ ...scenes[0], containsRestrictedMaterial: true }] }), /restricted material/);
});

test("asset provenance requires traceable origin, hash, commercial permission and human rights verification", () => {
  const record = {
    assetId: "asset-1",
    sourceMethod: "GENERATED",
    creatorOrRightsHolder: "SonicVhibez",
    originalSha256: hash,
    acquiredAt: "2026-10-25T10:00:00Z",
    licenseEvidenceLocation: "records/rights/asset-1.json",
    permittedUse: "YouTube monetized documentary production",
    commercialUseAllowed: true,
    rightsStatus: "VERIFIED",
    verifiedBy: "editor-1",
    verifiedAt: "2026-10-25T11:00:00Z",
    generationMethod: "Text-to-video with reviewed prompt",
    generationTool: "Approved generator",
    editorialPurpose: "Illustrate habitat"
  };
  assert.equal(validateAssetProvenance(record).valid, true);
  assert.match(validateAssetProvenance({ ...record, originalSha256: "bad" }).errors.join(" "), /SHA-256/);
  assert.match(validateAssetProvenance({ ...record, commercialUseAllowed: false }).errors.join(" "), /commercial use/);
  assert.match(validateAssetProvenance({ ...record, licenseEvidenceLocation: "TODO" }).errors.join(" "), /licenseEvidenceLocation/);
});

test("script-depth gate measures words and requires sections, claim sources and similarity evidence", () => {
  const sectionNarrations = Array.from({ length: 5 }, (_, i) => Array.from({ length: 160 }, (_, j) => "word" + (i * 160 + j)).join(" "));
  const narration = sectionNarrations.join("\n\n");
  const sections = sectionNarrations.map((sectionNarration, i) => ({
    heading: "Section " + i, purpose: "Advance explanation " + i, narration: sectionNarration,
    visualDirection: "Documentary scene for section " + i, pacing: "Measured", soundDesign: "Natural ambience"
  }));
  const script = {
    narration, sections, premise: "A sourced premise", conclusion: "A meaningful conclusion",
    claims: [{ text: "Claim", sourceIds: ["src-1"] }],
    sources: [{ id: "src-1", title: "Scientific source", url: "https://example.org/research" }],
    similarityReview: { status: "REVIEWED", evidenceRef: "review-2026-01" }
  };
  assert.equal(validateScriptDepth(script).valid, true, validateScriptDepth(script).errors.join("; "));
  assert.match(validateScriptDepth({ ...script, narration: "too short" }).errors.join(" "), /word count/);
  assert.match(validateScriptDepth({ ...script, sources: [] }).errors.join(" "), /missing or invalid HTTPS source/);
  assert.match(validateScriptDepth({ ...script, similarityReview: null }).errors.join(" "), /similarity review/);
});

test("script-depth gate rejects duplicate sections, missing scene direction and narration mismatch", () => {
  const words = Array.from({ length: 800 }, (_, i) => "word" + i);
  const sectionNarrations = Array.from({ length: 5 }, (_, i) => words.slice(i * 160, (i + 1) * 160).join(" "));
  const sections = sectionNarrations.map((narration, i) => ({
    heading: "Section " + i, purpose: "Different purpose " + i, narration,
    visualDirection: "Specific scene direction " + i, pacing: "Measured", soundDesign: "Natural ambience"
  }));
  const script = {
    narration: sectionNarrations.join("\n\n"), sections,
    premise: "A clear premise", conclusion: "A substantive conclusion",
    claims: [{ text: "Claim supported by evidence", sourceIds: ["src-1"] }],
    sources: [{ id: "src-1", title: "Research source", url: "https://research.example.org/paper" }],
    similarityReview: { status: "REVIEWED", evidenceRef: "human-review-1" }
  };
  assert.equal(validateScriptDepth(script).valid, true, validateScriptDepth(script).errors.join("; "));
  assert.match(validateScriptDepth({ ...script, sections: sections.map((section, i) => i === 4 ? { ...section, heading: sections[0].heading } : section) }).errors.join(" "), /headings must be distinct/);
  assert.match(validateScriptDepth({ ...script, sections: sections.map((section, i) => i === 2 ? { ...section, visualDirection: "" } : section) }).errors.join(" "), /requires visualDirection/);
  assert.match(validateScriptDepth({ ...script, narration: script.narration + " extra" }).errors.join(" "), /exactly concatenate/);
});

test("audio profiles enforce measured loudness, peak, transcript, rights and source hashes", () => {
  const profile = getAudioProfile("documentary_narration");
  const report = {
    narrationSha256: hash, finalAudioSha256: "b".repeat(64),
    transcriptMatchStatus: "HUMAN_VERIFIED", integratedLufs: -16, truePeakDbtp: -1.6,
    musicBelowNarrationDb: 13, ambienceBelowNarrationDb: 16, fadesVerified: true, rightsStatus: "VERIFIED"
  };
  assert.equal(validateAudioReport(report, "documentary_narration").valid, true);
  assert.ok(profile.fadesRequired);
  assert.match(validateAudioReport({ ...report, truePeakDbtp: 0 }, "documentary_narration").errors.join(" "), /true peak/);
  assert.match(validateAudioReport({ ...report, transcriptMatchStatus: "AUTO" }, "documentary_narration").errors.join(" "), /HUMAN_VERIFIED/);
});
