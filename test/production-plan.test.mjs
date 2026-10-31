import test from "node:test";
import assert from "node:assert/strict";
import { productionPlanSha256, validateProductionPlan } from "../scripts/production-plan.mjs";

const hash = "a".repeat(64);
function makePlan(contentType = "short") {
  const scenes = Array.from({ length: contentType === "short" ? 3 : 6 }, (_, i) => ({
    sceneId: "scene-" + (i + 1),
    editorialPurpose: "Establish one specific visual fact " + (i + 1),
    narrationCue: "Align to narration section " + (i + 1),
    assetPath: "media/original/scene-" + (i + 1) + ".mp4",
    assetSha256: hash,
    sourceType: "GENERATED_ORIGINAL",
    startSeconds: i * 4,
    endSeconds: (i + 1) * 4,
    provenance: {
      sourceOrGeneration: "Original generated scene job " + (i + 1),
      rightsEvidencePath: "rights/scene-" + (i + 1) + ".json",
      rightsEvidenceSha256: hash,
      permittedUse: "COMMERCIAL_DERIVATIVE",
      attribution: "No third-party attribution required; verify evidence",
      editorialNotes: "Review anatomy, lighting and narrative alignment"
    }
  }));
  return {
    schemaVersion: 1,
    jobId: "short-job-01",
    contentType,
    scriptSha256: hash,
    title: "The hidden wildlife survival strategy",
    editorialPremise: "Explain one specific survival strategy using sourced claims and scene-by-scene evidence rather than sensationalized assumptions.",
    syntheticDisclosure: "AI-generated reconstruction clearly disclosed in metadata and narration context.",
    scenes,
    ...(contentType === "short" ? { parentRelationship: {
      parentContentId: "parent-long-01",
      parentRevisionSha256: hash,
      parentMediaSha256: hash,
      sourceSegments: [{ sceneId: "scene-2", startSeconds: 4, endSeconds: 8 }],
      remoteParentVerified: true,
      remoteVideoId: "Abcdef123_-",
      channelTitle: "SonicVhibez",
      channelId: "UC" + "a".repeat(22),
      visibility: "public",
      destinationUrl: "https://www.youtube.com/watch?v=Abcdef123_-"
    } } : {}),
    publishingEnabled: false,
    humanReviewRequired: true
  };
}

test("production plan hash is stable across object key ordering", () => {
  assert.equal(productionPlanSha256({ a: 1, b: { y: 2, x: 3 } }), productionPlanSha256({ b: { x: 3, y: 2 }, a: 1 }));
});

test("valid Short plan binds exact job/script, rights evidence and verified parent", () => {
  const plan = makePlan("short");
  assert.deepEqual(validateProductionPlan(plan, { jobId: "short-job-01", contentType: "short", scriptSha256: hash }), []);
});

test("rejects missing rights evidence, path traversal, duplicate scene IDs and parent URL mismatch", () => {
  const plan = makePlan("short");
  plan.scenes[0].assetPath = "../outside.mp4";
  plan.scenes[1].sceneId = plan.scenes[0].sceneId;
  delete plan.scenes[2].provenance.rightsEvidenceSha256;
  plan.parentRelationship.destinationUrl = "https://www.youtube.com/watch?v=WrongWrong12";
  const errors = validateProductionPlan(plan, { jobId: "short-job-01", contentType: "short", scriptSha256: hash });
  assert.ok(errors.some(error => /assetPath/.test(error)));
  assert.ok(errors.some(error => /sceneId/.test(error)));
  assert.ok(errors.some(error => /provenance/.test(error)));
  assert.ok(errors.some(error => /canonical URL/.test(error)));
});

test("rejects stale script hash and any plan that enables publishing", () => {
  const plan = makePlan("short");
  plan.scriptSha256 = "b".repeat(64);
  plan.publishingEnabled = true;
  const errors = validateProductionPlan(plan, { jobId: "short-job-01", contentType: "short", scriptSha256: hash });
  assert.ok(errors.some(error => /exact approved script SHA-256/.test(error)));
  assert.ok(errors.some(error => /publishing disabled/.test(error)));
});

test("long-form plan requires six or more scenes and cannot carry Short parent binding", () => {
  const plan = makePlan("long_form");
  assert.deepEqual(validateProductionPlan(plan, { jobId: "short-job-01", contentType: "long_form", scriptSha256: hash }), []);
  plan.scenes.pop();
  plan.parentRelationship = makePlan("short").parentRelationship;
  const errors = validateProductionPlan(plan, { jobId: "short-job-01", contentType: "long_form", scriptSha256: hash });
  assert.ok(errors.some(error => /scene count/.test(error)));
  assert.ok(errors.some(error => /must not carry a Short parent/.test(error)));
});


test("private parent is valid for internal lineage only when native Related video stays externally blocked", () => {
  const plan = makePlan("short");
  plan.parentRelationship.visibility = "private";
  plan.parentRelationship.nativeRelatedVideoStatus = "BLOCKED_EXTERNAL";
  plan.parentRelationship.nativeRelatedVideoBlocker = "Private parent is not eligible for native Related video.";
  assert.deepEqual(validateProductionPlan(plan, { jobId: "short-job-01", contentType: "short", scriptSha256: hash }), []);
  delete plan.parentRelationship.nativeRelatedVideoStatus;
  delete plan.parentRelationship.nativeRelatedVideoBlocker;
  const errors = validateProductionPlan(plan, { jobId: "short-job-01", contentType: "short", scriptSha256: hash });
  assert.ok(errors.some(error => /native Related video is explicitly BLOCKED_EXTERNAL/.test(error)));
});

test("rejects unverified, private or wrong-channel parent for a Short", () => {
  const plan = makePlan("short");
  plan.parentRelationship.remoteParentVerified = false;
  plan.parentRelationship.visibility = "private";
  plan.parentRelationship.channelTitle = "Nature Frontiers";
  const errors = validateProductionPlan(plan, { jobId: "short-job-01", contentType: "short", scriptSha256: hash });
  assert.ok(errors.some(error => /verified private\/public\/unlisted SonicVhibez/.test(error)));
});


test("narration approval receipt is recomputed rather than trusting a persisted APPROVE flag", async () => {
  const { validateNarrationApprovalReceipt } = await import("../scripts/production-plan.mjs");
  const approval = {
    decision: "APPROVE",
    reviewer: "reviewer@example.test",
    reviewedAt: "2030-10-24T06:00:00.000Z",
    reason: "Audio and captions reviewed",
    scriptSha256: hash,
    audioSha256: hash,
    transcriptSha256: hash,
    captionsSha256: hash,
    reportSha256: hash,
    confirmAudioListened: true,
    confirmTranscriptReviewed: true,
    confirmCaptionsReviewed: true
  };
  const payload = { jobId: "short-job-01", ...approval };
  const crypto = await import("node:crypto");
  approval.approvalSha256 = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  assert.deepEqual(validateNarrationApprovalReceipt("short-job-01", approval), []);
  assert.match(validateNarrationApprovalReceipt("different-job", approval)[0], /invalid|changed/);
  approval.reason = "Changed after approval";
  assert.match(validateNarrationApprovalReceipt("short-job-01", approval)[0], /invalid|changed/);
});

test("Short production-plan review rechecks the exact persisted approved public parent", async () => {
  const { validateShortProductionPlanParent } = await import("../scripts/production-plan.mjs");
  const plan = makePlan("short");
  const job = {
    id: "short-job-01",
    kind: "CONTENT_PRODUCTION",
    contentType: "short",
    authoring: { productionPlan: { plan } },
    shortParentRelationship: {
      relationshipApproved: true,
      parentRemoteVerified: true,
      parentChannelTitle: "SonicVhibez",
      parentPrivacyStatus: "public",
      parentContentId: "parent-long-01",
      parentRemoteVideoId: "Abcdef123_-",
      parentCanonicalUrl: "https://www.youtube.com/watch?v=Abcdef123_-",
      parentMediaSha256: hash,
      parentChannelId: "UC" + "a".repeat(22)
    }
  };
  const jobs = [job, { id: "parent-long-01", kind: "CONTENT_PRODUCTION", contentType: "long_form" }];
  assert.deepEqual(validateShortProductionPlanParent(job, jobs), []);
  jobs[1].contentType = "short";
  assert.match(validateShortProductionPlanParent(job, jobs)[0], /long-form/);
  jobs[1].contentType = "long_form";
  job.shortParentRelationship.parentPrivacyStatus = "private";
  assert.match(validateShortProductionPlanParent(job, jobs)[0], /approved public SonicVhibez/);
});
