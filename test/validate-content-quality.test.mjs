import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createDeterministicEditPlan } from "../scripts/content-quality-gates.mjs";
import { validateContentQualityEvidence } from "../scripts/validate-content-quality.mjs";

const hash = value => crypto.createHash("sha256").update(value).digest("hex");

function fixture(t, format = "long_form") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-quality-evidence-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const footagePath = path.join(dir, "footage.bin");
  const narrationPath = path.join(dir, "narration.bin");
  fs.writeFileSync(footagePath, "rights-cleared source bytes");
  fs.writeFileSync(narrationPath, "narration bytes bound to approved script");
  const footageHash = hash(fs.readFileSync(footagePath));
  const narrationHash = hash(fs.readFileSync(narrationPath));
  const scenes = [{ assetId: "asset-1", sourceSha256: footageHash, rightsStatus: "VERIFIED", editorialPurpose: "Establish habitat" }];
  const editProfile = { framing: ["fit", "gentle_crop"], transitions: ["cut", "crossfade"] };
  const editPlanSha256 = createDeterministicEditPlan({ seed: 71, scenes, profile: editProfile }).planSha256;
  const sectionCount = format === "long_form" ? 5 : 3;
  const wordCount = format === "long_form" ? 1000 : 137;
  const words = Array.from({ length: wordCount }, (_, i) => "narration" + i);
  const sectionNarrations = Array.from({ length: sectionCount }, (_, i) => words.slice(Math.floor(i * wordCount / sectionCount), Math.floor((i + 1) * wordCount / sectionCount)).join(" "));
  const narration = sectionNarrations.join("\n\n");
  const sections = sectionNarrations.map((sectionNarration, i) => ({
    heading: "Section " + i, purpose: "Advance the narrative " + i, narration: sectionNarration,
    visualDirection: "Documentary scene " + i, pacing: "Measured", soundDesign: "Natural ambience"
  }));
  const script = {
    narration, sections,
    premise: format === "long_form" ? "An evidence-led premise" : undefined,
    conclusion: format === "long_form" ? "A substantive conclusion" : undefined,
    claims: [{ text: "A sourced claim", sourceIds: ["source-1"] }],
    sources: [{ id: "source-1", title: "Research reference", url: "https://www.nature.com/" }],
    similarityReview: { status: "REVIEWED", evidenceRef: "similarity-review-1" }
  };
  const asset = {
    assetId: "asset-1", path: "footage.bin", sourceMethod: "ORIGINAL_RECORDING",
    creatorOrRightsHolder: "SonicVhibez", originalSha256: footageHash,
    acquiredAt: "2026-10-25T10:00:00Z", licenseEvidenceLocation: "rights/asset-1.json",
    permittedUse: "YouTube commercial documentary use", commercialUseAllowed: true,
    rightsStatus: "VERIFIED", verifiedBy: "editor-1", verifiedAt: "2026-10-25T11:00:00Z",
    editorialPurpose: "Establish habitat"
  };
  const evidence = {
    format, script, assetProvenance: [asset], renderSeed: 71, scenes, editProfile, editPlanSha256,
    audioProfile: format === "short" ? "short_form_voice_first" : "documentary_narration",
    audioReport: {
      narrationPath: "narration.bin", narrationSha256: narrationHash, finalAudioSha256: "b".repeat(64),
      transcriptMatchStatus: "HUMAN_VERIFIED", integratedLufs: format === "short" ? -14 : -16,
      truePeakDbtp: -1.6, loudnessRange: 6, musicBelowNarrationDb: 18, ambienceBelowNarrationDb: 18,
      fadesVerified: true, rightsStatus: "VERIFIED"
    },
    humanEditorialReview: { status: "APPROVED", reviewer: "editor-1", reviewedAt: "2026-10-25T12:00:00Z" }
  };
  if (format === "short") {
    const parent = {
      contentId: "long-1", weeklyContentCycleId: "cycle-1", format: "long_form",
      state: "PRIVATE_UPLOAD_VERIFIED", approvalStatus: "APPROVED_FOR_PRIVATE_UPLOAD", privacyStatus: "unlisted",
      revision: "r1", mediaSha256: "c".repeat(64), channel: "SonicVhibez", channelId: "UC" + "B".repeat(22),
      remoteVideoId: "aBcD1234_-Z"
    };
    evidence.parentRecord = parent;
    evidence.shortRelationship = {
      contentId: "short-1", weeklyContentCycleId: "cycle-1", format: "short",
      parentContentId: "long-1", parentMediaSha256: "c".repeat(64), approvedParentRevision: "r1",
      parentYouTubeVideoId: "aBcD1234_-Z", parentChannelId: "UC" + "B".repeat(22),
      verifiedDestinationUrl: "https://www.youtube.com/watch?v=aBcD1234_-Z",
      relationshipStatus: "VERIFIED", youtubeRelatedVideoStatus: "PENDING"
    };
  }
  return { dir, footagePath, narrationPath, evidence };
}

test("quality evidence validator binds provenance and narration to exact render input bytes", t => {
  const f = fixture(t);
  assert.deepEqual(validateContentQualityEvidence(f.evidence, {
    format: "long_form", evidenceDir: f.dir, expectedFootagePath: f.footagePath, expectedNarrationPath: f.narrationPath
  }), []);
});

test("multi-scene quality evidence requires exact provenance hashes and valid source ranges", t => {
  const f = fixture(t);
  const secondPath = path.join(f.dir, "footage-second.bin");
  fs.writeFileSync(secondPath, "second licensed source bytes");
  const secondHash = hash(fs.readFileSync(secondPath));
  f.evidence.assetProvenance.push({ ...f.evidence.assetProvenance[0], assetId: "asset-2", path: "footage-second.bin", originalSha256: secondHash, editorialPurpose: "Show the next narrative beat" });
  f.evidence.scenes.push({ assetId: "asset-2", sourceSha256: secondHash, rightsStatus: "VERIFIED", editorialPurpose: "Show the next narrative beat", startSeconds: 0, endSeconds: 10 });
  f.evidence.scenes[0].startSeconds = 0;
  f.evidence.scenes[0].endSeconds = 10;
  f.evidence.editPlanSha256 = createDeterministicEditPlan({ seed: f.evidence.renderSeed, scenes: f.evidence.scenes, profile: f.evidence.editProfile }).planSha256;
  const validErrors = validateContentQualityEvidence(f.evidence, { format: "long_form", evidenceDir: f.dir, expectedFootagePath: f.footagePath, expectedNarrationPath: f.narrationPath });
  assert.deepEqual(validErrors, []);
  f.evidence.scenes[1].sourceSha256 = "f".repeat(64);
  f.evidence.editPlanSha256 = createDeterministicEditPlan({ seed: f.evidence.renderSeed, scenes: f.evidence.scenes, profile: f.evidence.editProfile }).planSha256;
  assert.match(validateContentQualityEvidence(f.evidence, { format: "long_form", evidenceDir: f.dir }).join(" "), /must match its assetProvenance record/);
});

test("quality evidence fails closed when manifest footage or narration differs from reviewed evidence", t => {
  const f = fixture(t);
  const errors = validateContentQualityEvidence(f.evidence, {
    format: "long_form", evidenceDir: f.dir,
    expectedFootagePath: path.join(f.dir, "not-the-footage.bin"),
    expectedNarrationPath: path.join(f.dir, "other-narration.bin")
  });
  assert.match(errors.join(" "), /exact footage file/);
  assert.match(errors.join(" "), /exact narration file/);
});

test("Short render evidence requires an approved, explicit parent but native Related video can remain pending until Studio verification", t => {
  const f = fixture(t, "short");
  const errors = validateContentQualityEvidence(f.evidence, {
    format: "short", evidenceDir: f.dir, expectedFootagePath: f.footagePath, expectedNarrationPath: f.narrationPath
  });
  assert.deepEqual(errors, []);
  f.evidence.shortRelationship.parentContentId = "wrong-parent";
  assert.match(validateContentQualityEvidence(f.evidence, {
    format: "short", evidenceDir: f.dir, expectedFootagePath: f.footagePath, expectedNarrationPath: f.narrationPath
  }).join(" "), /does not match/);
});

test("missing editorial playback approval blocks content quality acceptance", t => {
  const f = fixture(t);
  f.evidence.humanEditorialReview = { status: "PENDING" };
  assert.match(validateContentQualityEvidence(f.evidence, { format: "long_form", evidenceDir: f.dir }).join(" "), /humanEditorialReview/);
});