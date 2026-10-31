import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { buildApprovedJobRenderManifest } from "../scripts/build-approved-job-render-manifest.mjs";
import { canonicalAuthoringScriptSha256 } from "../scripts/authoring-production-pipeline.mjs";
import { productionPlanSha256 } from "../scripts/production-plan.mjs";

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function hashJson(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}
function rehashPlanReview(job) {
  const review = job.authoring.productionPlan.review;
  review.approvalSha256 = hashJson({
    jobId: job.id, decision: review.decision, planSha256: review.planSha256,
    scriptSha256: review.scriptSha256, reviewer: review.reviewer,
    reviewedAt: review.reviewedAt, reason: review.reason,
    confirmScenePlanReviewed: review.confirmScenePlanReviewed,
    confirmRightsEvidenceReviewed: review.confirmRightsEvidenceReviewed
  });
}
function write(root, relative, data) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  return { path: relative, sha256: hash(file) };
}
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "approved-job-render-"));
  const narrationText = "A complete documentary narration transcript used to bind this approved production job to its exact voice track.";
  const script = { narration: narrationText, premise: "A grounded documentary premise", conclusion: "A meaningful conclusion", sections: [] };
  const scriptSha256 = canonicalAuthoringScriptSha256(script);
  const audio = write(root, "content/jobs/job-123/narration.mp3", "test-audio-bytes");
  const transcript = write(root, "content/jobs/job-123/narration.txt", narrationText + "\n");
  const captions = write(root, "content/jobs/job-123/captions.srt", "1\n00:00:00,000 --> 00:00:01,000\nA complete documentary narration.\n");
  const report = write(root, "content/jobs/job-123/narration-report.json", JSON.stringify({ status: "DRAFT_REVIEW_REQUIRED" }));
  const narrationRights = write(root, "content/rights/narration-rights.json", JSON.stringify({ permittedUse: "COMMERCIAL_DERIVATIVE", reviewed: true }));
  const metadata = write(root, "content/job-metadata.json", JSON.stringify({
    channel: "SonicVhibez", visibility: "private", productUrl: "https://selar.com/0u19v8u99l",
    title: "A Documentary About Wildlife", description: "A detailed wildlife documentary with AI Made disclosure where applicable.",
    tags: ["wildlife", "documentary", "nature"]
  }));
  const scenes = [], qualityScenes = [], assetProvenance = [];
  for (let i = 1; i <= 6; i++) {
    const asset = write(root, "media/scene-" + i + ".mp4", "scene-bytes-" + i);
    const rights = write(root, "content/rights/scene-" + i + ".json", JSON.stringify({
      sourceMethod: "original-generation", permittedUse: "COMMERCIAL_DERIVATIVE", sourceSha256: asset.sha256
    }));
    scenes.push({
      sceneId: "scene-" + i, editorialPurpose: "Explain one distinct part of the documentary story",
      narrationCue: "Narration section " + i + " begins here", assetPath: asset.path, assetSha256: asset.sha256,
      sourceType: "GENERATED_ORIGINAL", startSeconds: 0, endSeconds: 2,
      provenance: {
        sourceOrGeneration: "Original generated wildlife scene " + i, rightsEvidencePath: rights.path,
        rightsEvidenceSha256: rights.sha256, permittedUse: "COMMERCIAL_DERIVATIVE",
        attribution: "AI Made; original generated scene", editorialNotes: "Illustrates the stated narration without claiming authentic recording"
      }
    });
    qualityScenes.push({ assetId: "asset-" + i, sourceSha256: asset.sha256, startSeconds: 0, endSeconds: 2 });
    assetProvenance.push({
      assetId: "asset-" + i, path: "../media/scene-" + i + ".mp4", originalSha256: asset.sha256
    });
  }
  const quality = write(root, "content/job-quality.json", JSON.stringify({
    format: "long_form", script: { narration: narrationText }, scenes: qualityScenes, assetProvenance,
    humanEditorialReview: { status: "APPROVED", reviewer: "editor-1", reviewedAt: "2026-10-27T12:00:00Z" }
  }));
  const plan = {
    schemaVersion: 1, jobId: "job-123", contentType: "long_form", scriptSha256,
    title: "A Documentary About Wildlife", editorialPremise: "A detailed, evidence-led documentary about animal behavior and its ecological context.",
    syntheticDisclosure: "AI Made; generated reconstructions are disclosed and not represented as recorded events.",
    publishingEnabled: false, humanReviewRequired: true, scenes,
    renderEvidence: {
      qualityEvidencePath: quality.path, qualityEvidenceSha256: quality.sha256,
      metadataPath: metadata.path, metadataSha256: metadata.sha256,
      narrationRightsEvidencePath: narrationRights.path, narrationRightsEvidenceSha256: narrationRights.sha256,
      complianceReviewed: true, complianceReviewer: "compliance-1", complianceReviewedAt: "2026-10-27T12:00:00Z"
    }
  };
  const planSha256 = productionPlanSha256(plan);
  const scriptApproval = {
    decision: "APPROVE", scriptSha256, reviewer: "editor-1",
    reviewedAt: "2026-10-27T12:00:00Z",
    reason: "Reviewed the complete exact script revision and its source coverage."
  };
  scriptApproval.approvalSha256 = hashJson({
    jobId: "job-123", decision: scriptApproval.decision, scriptSha256: scriptApproval.scriptSha256,
    reviewer: scriptApproval.reviewer, reviewedAt: scriptApproval.reviewedAt, reason: scriptApproval.reason
  });
  const narrationApproval = {
    decision: "APPROVE", reviewer: "editor-1", reviewedAt: "2026-10-27T12:05:00Z",
    reason: "Listened to the complete narration and reviewed transcript and caption timing.",
    scriptSha256, audioSha256: audio.sha256, transcriptSha256: transcript.sha256,
    captionsSha256: captions.sha256, reportSha256: report.sha256,
    confirmAudioListened: true, confirmTranscriptReviewed: true, confirmCaptionsReviewed: true
  };
  narrationApproval.approvalSha256 = hashJson({
    jobId: "job-123", decision: narrationApproval.decision, reviewer: narrationApproval.reviewer,
    reviewedAt: narrationApproval.reviewedAt, reason: narrationApproval.reason,
    scriptSha256: narrationApproval.scriptSha256, audioSha256: narrationApproval.audioSha256,
    transcriptSha256: narrationApproval.transcriptSha256, captionsSha256: narrationApproval.captionsSha256,
    reportSha256: narrationApproval.reportSha256, confirmAudioListened: narrationApproval.confirmAudioListened,
    confirmTranscriptReviewed: narrationApproval.confirmTranscriptReviewed,
    confirmCaptionsReviewed: narrationApproval.confirmCaptionsReviewed
  });
  const planReview = {
    decision: "APPROVE", planSha256, scriptSha256, reviewer: "editor-1",
    reviewedAt: "2026-10-27T12:10:00Z",
    reason: "Reviewed every scene, source asset, rights evidence and compliance note.",
    confirmScenePlanReviewed: true, confirmRightsEvidenceReviewed: true
  };
  planReview.approvalSha256 = hashJson({
    jobId: "job-123", decision: planReview.decision, planSha256: planReview.planSha256,
    scriptSha256: planReview.scriptSha256, reviewer: planReview.reviewer,
    reviewedAt: planReview.reviewedAt, reason: planReview.reason,
    confirmScenePlanReviewed: planReview.confirmScenePlanReviewed,
    confirmRightsEvidenceReviewed: planReview.confirmRightsEvidenceReviewed
  });
  const job = {
    id: "job-123", kind: "CONTENT_PRODUCTION", contentType: "long_form", state: "QUEUED",
    authoring: {
      result: { script }, scriptSha256, scriptApproval,
      narrationStage: {
        status: "APPROVED_FOR_RENDER", scriptSha256,
        artifacts: {
          "narration.mp3": audio, "narration.txt": transcript, "captions.srt": captions, "narration-report.json": report
        }
      },
      narrationApproval,
      productionPlan: {
        status: "APPROVED_PLAN_ONLY", plan, planSha256, scriptSha256, review: planReview
      }
    }
  };
  return { root, job, plan, quality, metadata, scenes, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test("builds a renderer manifest only from exact approved, hash-bound job evidence", () => {
  const f = fixture();
  try {
    const result = buildApprovedJobRenderManifest({ job: f.job, root: f.root });
    assert.equal(result.manifest.channel, "SonicVhibez");
    assert.equal(result.manifest.rightsConfirmed, true);
    assert.equal(result.manifest.complianceReviewed, true);
    assert.equal(result.manifest.targetAspectRatio, "16:9");
    assert.equal(result.manifest.publishingEnabled, false);
    assert.equal(result.manifest.publishable, false);
    assert.equal(result.manifest.qualityEvidenceSha256, f.quality.sha256);
    assert.equal(result.manifest.metadataSha256, f.metadata.sha256);
    assert.equal(result.manifest.footagePath, path.join(f.root, f.scenes[0].assetPath));
  } finally { f.cleanup(); }
});

test("allows internal Short lineage to a verified private parent while native Related video remains blocked", () => {
  const f = fixture();
  try {
    f.job.contentType = "short";
    f.plan.contentType = "short";
    const qualityPath = path.join(f.root, f.quality.path);
    const qualityEvidence = JSON.parse(fs.readFileSync(qualityPath, "utf8"));
    qualityEvidence.format = "short";
    const quality = write(f.root, f.quality.path, JSON.stringify(qualityEvidence));
    f.quality.sha256 = quality.sha256;
    f.plan.renderEvidence.qualityEvidenceSha256 = quality.sha256;

    const channelId = "UC" + "a".repeat(22);
    const parentVideoId = "Abcdef123_-";
    f.job.shortParentRelationship = {
      relationshipApproved: true,
      parentRemoteVerified: true,
      parentChannelTitle: "SonicVhibez",
      parentPrivacyStatus: "private",
      parentContentId: "parent-long-01",
      parentRemoteVideoId: parentVideoId,
      parentMediaSha256: "b".repeat(64),
      parentChannelId: channelId,
      nativeRelatedVideo: { status: "BLOCKED_EXTERNAL", blocker: "Private parent is ineligible for native Related video." }
    };
    f.plan.parentRelationship = {
      parentContentId: "parent-long-01",
      parentRevisionSha256: "c".repeat(64),
      parentMediaSha256: "b".repeat(64),
      sourceSegments: [{ sceneId: "scene-2", startSeconds: 0, endSeconds: 2 }],
      remoteParentVerified: true,
      remoteVideoId: parentVideoId,
      channelTitle: "SonicVhibez",
      channelId,
      visibility: "private",
      destinationUrl: "https://www.youtube.com/watch?v=" + parentVideoId,
      nativeRelatedVideoStatus: "BLOCKED_EXTERNAL",
      nativeRelatedVideoBlocker: "Private parent is ineligible for native Related video."
    };

    const planSha256 = productionPlanSha256(f.plan);
    f.job.authoring.productionPlan.planSha256 = planSha256;
    f.job.authoring.productionPlan.review.planSha256 = planSha256;
    rehashPlanReview(f.job);
    const result = buildApprovedJobRenderManifest({ job: f.job, root: f.root });
    assert.equal(result.manifest.publishable, false);
    assert.equal(result.manifest.publishingEnabled, false);
    assert.equal(result.manifest.parentRelationship.nativeRelatedVideoStatus, "BLOCKED_EXTERNAL");
  } finally { f.cleanup(); }
});

test("rejects a missing plan approval rather than treating a submitted plan as render-ready", () => {
  const f = fixture();
  try {
    f.job.authoring.productionPlan.status = "REVIEW_REQUIRED";
    assert.throws(() => buildApprovedJobRenderManifest({ job: f.job, root: f.root }), /human-approved production plan/);
  } finally { f.cleanup(); }
});

test("rejects stale quality evidence and metadata hashes", () => {
  const f = fixture();
  try {
    f.job.authoring.productionPlan.plan.renderEvidence.qualityEvidenceSha256 = "0".repeat(64);
    f.job.authoring.productionPlan.planSha256 = productionPlanSha256(f.job.authoring.productionPlan.plan);
    f.job.authoring.productionPlan.review.planSha256 = f.job.authoring.productionPlan.planSha256;
    rehashPlanReview(f.job);
    assert.throws(() => buildApprovedJobRenderManifest({ job: f.job, root: f.root }), /Quality evidence SHA-256/);
  } finally { f.cleanup(); }
});

test("rejects an unreviewed compliance package", () => {
  const f = fixture();
  try {
    f.job.authoring.productionPlan.plan.renderEvidence.complianceReviewed = false;
    f.job.authoring.productionPlan.planSha256 = productionPlanSha256(f.job.authoring.productionPlan.plan);
    f.job.authoring.productionPlan.review.planSha256 = f.job.authoring.productionPlan.planSha256;
    rehashPlanReview(f.job);
    assert.throws(() => buildApprovedJobRenderManifest({ job: f.job, root: f.root }), /compliance review evidence/);
  } finally { f.cleanup(); }
});

test("rejects ambiguous duplicate provenance IDs before renderer Map selection", () => {
  const f = fixture();
  try {
    const qualityPath = path.join(f.root, f.quality.path);
    const evidence = JSON.parse(fs.readFileSync(qualityPath, "utf8"));
    evidence.assetProvenance[1].assetId = evidence.assetProvenance[0].assetId;
    fs.writeFileSync(qualityPath, JSON.stringify(evidence));
    f.quality.sha256 = hash(qualityPath);
    f.job.authoring.productionPlan.plan.renderEvidence.qualityEvidenceSha256 = f.quality.sha256;
    f.job.authoring.productionPlan.planSha256 = productionPlanSha256(f.job.authoring.productionPlan.plan);
    f.job.authoring.productionPlan.review.planSha256 = f.job.authoring.productionPlan.planSha256;
    rehashPlanReview(f.job);
    assert.throws(() => buildApprovedJobRenderManifest({ job: f.job, root: f.root }), /duplicate provenance asset IDs/);
  } finally { f.cleanup(); }
});

test("rejects duplicate quality-evidence scene asset IDs before renderer mapping", () => {
  const f = fixture();
  try {
    const qualityPath = path.join(f.root, f.quality.path);
    const evidence = JSON.parse(fs.readFileSync(qualityPath, "utf8"));
    evidence.scenes[1].assetId = evidence.scenes[0].assetId;
    fs.writeFileSync(qualityPath, JSON.stringify(evidence));
    f.quality.sha256 = hash(qualityPath);
    f.job.authoring.productionPlan.plan.renderEvidence.qualityEvidenceSha256 = f.quality.sha256;
    f.job.authoring.productionPlan.planSha256 = productionPlanSha256(f.job.authoring.productionPlan.plan);
    f.job.authoring.productionPlan.review.planSha256 = f.job.authoring.productionPlan.planSha256;
    rehashPlanReview(f.job);
    assert.throws(() => buildApprovedJobRenderManifest({ job: f.job, root: f.root }), /duplicate scene asset IDs/);
  } finally { f.cleanup(); }
});

test("rejects narration artifacts modified after approval", () => {
  const f = fixture();
  try {
    fs.appendFileSync(path.join(f.root, f.job.authoring.narrationStage.artifacts["narration.mp3"].path), "changed");
    assert.throws(() => buildApprovedJobRenderManifest({ job: f.job, root: f.root }), /artifact changed/);
  } finally { f.cleanup(); }
});
