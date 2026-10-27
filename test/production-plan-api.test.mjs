import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { canonicalAuthoringScriptSha256 } from "../scripts/authoring-production-pipeline.mjs";
import { productionPlanSha256 } from "../scripts/production-plan.mjs";

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const repoRoot = process.cwd();

test("production-plan API binds the approved script, checks real file hashes, and invalidates stale evidence", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "production-plan-api-state-"));
  const evidenceDirName = ".test-production-plan-" + process.pid + "-" + crypto.randomBytes(5).toString("hex");
  const evidenceDir = path.join(repoRoot, evidenceDirName);
  fs.mkdirSync(evidenceDir);
  const token = "test-token-" + "x".repeat(40);
  const port = 21000 + Math.floor(Math.random() * 10000);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: repoRoot,
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_OPERATOR_ID: "test-owner@example.test", DASHBOARD_STATE_DIR: stateDir, UPLOAD_LOG_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const stateFile = path.join(stateDir, "dashboard-state.json");
  const baseUrl = "http://127.0.0.1:" + port;
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const request = async (route, body) => {
    const response = await fetch(baseUrl + route, { method: "POST", headers, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  t.after(() => {
    child.kill("SIGTERM");
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(evidenceDir, { recursive: true, force: true });
  });

  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error("Dashboard server exited before startup: " + logs);
    try {
      const response = await fetch(baseUrl + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard backend should become ready; logs: " + logs);
  const narration = "The approved narration has a clear premise and describes what the research actually supports.";
  const script = { premise: "Explain an evidence-led wildlife question", narration, sections: [{ heading: "Context", purpose: "Set context", narration, visualDirection: "Documented habitat", pacing: "Measured", soundDesign: "Natural ambience" }], claims: [{ text: "A supported claim", sourceIds: ["source-1"] }], sources: [{ id: "source-1", title: "Actual source record" }] };
  const scriptSha256 = canonicalAuthoringScriptSha256(script);
  const jobId = "job-production-plan-api";
  const narrationArtifacts = {};
  for (const [name, bytes] of [
    ["narration.mp3", Buffer.from("test-only audio fixture")],
    ["narration.txt", Buffer.from(narration + "\\n")],
    ["captions.srt", Buffer.from("1\\n00:00:00,000 --> 00:00:05,000\\nTest caption\\n")],
    ["narration-report.json", Buffer.from(JSON.stringify({ status: "DRAFT_REVIEW_REQUIRED", publishingEnabled: false }))]
  ]) {
    const relativePath = evidenceDirName + "/" + name;
    fs.writeFileSync(path.join(repoRoot, relativePath), bytes);
    narrationArtifacts[name] = { path: relativePath, sha256: sha256(bytes) };
  }
  const review = {
    decision: "APPROVE", reviewer: "test-owner@example.test", reviewedAt: "2026-10-27T10:00:00.000Z",
    reason: "Test fixture review for API contract", scriptSha256,
    audioSha256: narrationArtifacts["narration.mp3"].sha256,
    transcriptSha256: narrationArtifacts["narration.txt"].sha256,
    captionsSha256: narrationArtifacts["captions.srt"].sha256,
    reportSha256: narrationArtifacts["narration-report.json"].sha256,
    confirmAudioListened: true, confirmTranscriptReviewed: true, confirmCaptionsReviewed: true
  };
  review.approvalSha256 = sha256(JSON.stringify({ jobId, ...review }));
  const job = {
    id: jobId, kind: "CONTENT_PRODUCTION", contentType: "long_form", title: "Evidence-led wildlife documentary",
    state: "QUEUED", authoring: {
      result: { script },
      scriptApproval: { decision: "APPROVE", scriptSha256, reviewer: "test-owner@example.test", reviewedAt: "2026-10-27T09:00:00.000Z" },
      narrationStage: { status: "APPROVED_FOR_RENDER", scriptSha256, artifacts: narrationArtifacts },
      narrationApproval: review
    }
  };
  fs.writeFileSync(stateFile, JSON.stringify({ version: 1, queueItems: [], campaigns: [], audit: [], jobs: [job], uploads: [], facebookDrafts: [], facebookPosts: [], facebookAttempts: [] }));

  const scenes = Array.from({ length: 6 }, (_, index) => {
    const assetBytes = Buffer.from("original scene fixture bytes " + index);
    const rightsBytes = Buffer.from(JSON.stringify({ asset: index, permittedUse: "COMMERCIAL_DERIVATIVE", reviewed: "fixture only" }));
    const assetPath = evidenceDirName + "/scene-" + index + ".mp4";
    const rightsPath = evidenceDirName + "/rights-" + index + ".json";
    fs.writeFileSync(path.join(repoRoot, assetPath), assetBytes);
    fs.writeFileSync(path.join(repoRoot, rightsPath), rightsBytes);
    return {
      sceneId: "scene-" + index, editorialPurpose: "Advance a specific documentary point " + index,
      narrationCue: "Align with narration section " + index, assetPath, assetSha256: sha256(assetBytes),
      sourceType: "GENERATED_ORIGINAL", startSeconds: index * 60, endSeconds: (index + 1) * 60,
      provenance: { sourceOrGeneration: "test fixture generated scene " + index, rightsEvidencePath: rightsPath, rightsEvidenceSha256: sha256(rightsBytes), permittedUse: "COMMERCIAL_DERIVATIVE", attribution: "Fixture attribution record", editorialNotes: "Test fixture only; not production rights evidence" }
    };
  });
  const plan = {
    schemaVersion: 1, jobId, contentType: "long_form", scriptSha256,
    title: "An evidence-led wildlife documentary",
    editorialPremise: "Explain a specific wildlife question using source-backed context, careful uncertainty and scene-level narration alignment.",
    syntheticDisclosure: "Generated scenes must be disclosed in metadata where applicable.",
    scenes, publishingEnabled: false, humanReviewRequired: true
  };
  const submitted = await request("/api/jobs/production-plan", { jobId, scriptSha256, productionPlan: plan });
  assert.equal(submitted.status, 201, JSON.stringify(submitted.body));
  assert.equal(submitted.body.validationStatus, "STRUCTURE_AND_FILE_HASHES_VALIDATED");
  assert.equal(submitted.body.publishingEnabled, false);
  assert.equal(submitted.body.planSha256, productionPlanSha256(plan));

  const narrationPath = path.join(repoRoot, narrationArtifacts["narration.mp3"].path);
  const originalAudio = fs.readFileSync(narrationPath);
  fs.writeFileSync(narrationPath, "mutated approved narration after plan submission");
  const staleNarration = await request("/api/jobs/production-plan/review", {
    jobId, planSha256: submitted.body.planSha256, decision: "APPROVE", reason: "Evidence was inspected",
    confirmScenePlanReviewed: true, confirmRightsEvidenceReviewed: true
  });
  assert.equal(staleNarration.status, 409, "changed approved narration must invalidate plan review");
  fs.writeFileSync(narrationPath, originalAudio);

  const changedAsset = path.join(repoRoot, scenes[0].assetPath);
  fs.writeFileSync(changedAsset, "mutated after plan submission");
  const stale = await request("/api/jobs/production-plan/review", {
    jobId, planSha256: submitted.body.planSha256, decision: "APPROVE", reason: "Evidence was inspected",
    confirmScenePlanReviewed: true, confirmRightsEvidenceReviewed: true
  });
  assert.equal(stale.status, 409, "a changed asset must invalidate review");
  fs.writeFileSync(changedAsset, Buffer.from("original scene fixture bytes 0"));

  const approved = await request("/api/jobs/production-plan/review", {
    jobId, planSha256: submitted.body.planSha256, decision: "APPROVE", reason: "Reviewed fixture evidence and scene alignment",
    confirmScenePlanReviewed: true, confirmRightsEvidenceReviewed: true
  });
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  assert.equal(approved.body.status, "APPROVED_PLAN_ONLY");
  assert.equal(approved.body.publishingEnabled, false);
  assert.equal(approved.body.renderingEnabled, false);
});
