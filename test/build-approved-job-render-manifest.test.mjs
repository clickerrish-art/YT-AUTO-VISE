import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { createContentJob } from "../scripts/content-job-lifecycle.mjs";
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


async function reservePort() {
  const server = createServer();
  await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

function dueJohannesburgSlot() {
  const now = Date.now() - 2 * 60_000;
  return {
    date: new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now)),
    time: new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(now)),
    timezone: "Africa/Johannesburg"
  };
}

test("approved long-form job runs through /api/jobs/produce to a verified, persisted GENERATED artifact", async t => {
  const f = fixture();
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "approved-render-state-"));
  const token = "approved-render-" + crypto.randomBytes(24).toString("hex");
  const port = await reservePort();
  const base = "http://127.0.0.1:" + port;
  let child;
  let logs = "";
  const stop = async () => {
    if (!child || child.exitCode !== null) return;
    const running = child;
    running.kill("SIGTERM");
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Dashboard shutdown timed out: " + logs)), 5000);
      running.once("exit", () => { clearTimeout(timer); resolve(); });
    });
  };
  t.after(async () => {
    await stop().catch(() => {});
    fs.rmSync(stateDir, { recursive: true, force: true });
    f.cleanup();
  });

  // The dashboard derives its repository root from its own script location.
  // Copy the production scripts into this isolated fixture root so the test
  // never writes manifests, media, metadata or state into the working tree.
  for (const directory of ["scripts", "config", "public"]) {
    const source = path.join(process.cwd(), directory);
    if (fs.existsSync(source)) fs.cpSync(source, path.join(f.root, directory), { recursive: true });
  }
  const oldMetadataFile = path.join(f.root, f.metadata.path);
  const productionMetadataPath = "content/long-form-next.json";
  const productionMetadataFile = path.join(f.root, productionMetadataPath);
  fs.mkdirSync(path.dirname(productionMetadataFile), { recursive: true });
  fs.renameSync(oldMetadataFile, productionMetadataFile);
  f.metadata.path = productionMetadataPath;
  f.plan.renderEvidence.metadataPath = productionMetadataPath;
  const planSha256 = productionPlanSha256(f.plan);
  f.job.authoring.productionPlan.planSha256 = planSha256;
  f.job.authoring.productionPlan.review.planSha256 = planSha256;
  rehashPlanReview(f.job);

  const scheduledDate = (() => {
    const date = new Date();
    for (let i = 0; i < 14; i++) {
      const candidate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + i, 12));
      if (candidate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }) === "Tuesday") return candidate.toISOString().slice(0, 10);
    }
    throw new Error("Unable to find a valid Tuesday schedule fixture");
  })();
  const lifecycleJob = createContentJob({
    idempotencyKey: "approved-render-integration",
    title: "Approved render integration fixture",
    topic: "Test-only approved documentary render",
    contentType: "long_form",
    scheduledDay: "Tuesday",
    scheduledDate
  });
  const job = {
    ...lifecycleJob,
    id: f.job.id,
    scheduledSlot: dueJohannesburgSlot(),
    authoring: f.job.authoring
  };
  const stateFile = path.join(stateDir, "dashboard-state.json");
  fs.writeFileSync(stateFile, JSON.stringify({
    version: 1, queueItems: [], campaigns: [], audit: [], jobs: [job], uploads: [],
    facebookDrafts: [], facebookPosts: [], facebookAttempts: []
  }, null, 2) + "\n", { mode: 0o600 });

  // This test renderer is deliberately confined to the temporary repository.
  // It ignores fixture source bytes and emits a real FFmpeg MP4 so the API's
  // production output inspection, thumbnail generation and persistence run.
  const rendererPath = path.join(f.root, "scripts", "render-long-form.mjs");
  fs.writeFileSync(rendererPath, `import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const output = process.argv[4];
fs.mkdirSync(path.dirname(output), { recursive: true });
const result = spawnSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error",
  "-f", "lavfi", "-i", "color=c=black:s=1280x720:r=24:d=360",
  "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100:duration=360",
  "-c:v", "libx264", "-preset", "ultrafast", "-crf", "35", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "64k", "-t", "360", "-shortest", "-movflags", "+faststart", output
], { encoding: "utf8", timeout: 180000 });
if (result.error || result.status !== 0) {
  process.stderr.write(result.stderr || String(result.error || "FFmpeg fixture renderer failed"));
  process.exit(result.status || 1);
}
process.stdout.write("TEST_FIXTURE_RENDER_SUCCEEDED; fixture output is not publishable\n");
`);

  child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: f.root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "approved-render-test@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error("Dashboard server exited: " + logs);
    try { if ((await fetch(base + "/healthz")).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.equal(ready, true, "Dashboard server did not start: " + logs);

  const response = await fetch(base + "/api/jobs/produce", {
    method: "POST",
    headers: { "content-type": "application/json", "x-operator-token": token },
    body: JSON.stringify({ jobId: job.id })
  });
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  assert.equal(payload.job.state, "GENERATED");
  assert.equal(payload.job.publishingEnabled, false);
  assert.equal(payload.job.outputArtifacts.length, 1);
  assert.equal(payload.job.outputArtifacts[0].durationSeconds >= 360, true);
  assert.equal(payload.job.outputArtifacts[0].width, 1280);
  assert.equal(payload.job.outputArtifacts[0].height, 720);
  assert.equal(payload.job.thumbnailArtifact.width, 1280);
  assert.equal(payload.job.thumbnailArtifact.height, 720);
  assert.match(payload.job.outputArtifacts[0].sha256, /^[a-f0-9]{64}$/);
  assert.match(payload.job.thumbnailArtifact.sha256, /^[a-f0-9]{64}$/);
  assert.equal(fs.existsSync(path.join(f.root, payload.job.outputArtifacts[0].path)), true);
  assert.equal(fs.existsSync(path.join(f.root, payload.job.thumbnailArtifact.path)), true);
  const persisted = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const saved = persisted.jobs.find(entry => entry.id === job.id);
  assert.equal(saved.state, "GENERATED", "successful output validation must persist the terminal render state");
  assert.equal(persisted.audit.filter(event => event.action === "CONTENT_RENDER_STARTED" && event.jobId === job.id).length, 1);
  assert.equal(persisted.audit.filter(event => event.action === "CONTENT_RENDER_SUCCEEDED" && event.jobId === job.id).length, 1);
  assert.equal(saved.workerLease, null, "successful rendering must release the worker lease");
  assert.equal(saved.publishable, undefined, "a generated fixture must not be represented as publishable");
  assert.equal(saved.publishingEnabled, false);
});
