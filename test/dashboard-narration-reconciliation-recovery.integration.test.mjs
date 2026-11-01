import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { canonicalAuthoringScriptSha256 } from "../scripts/authoring-production-pipeline.mjs";

test("dashboard restart recovers an interrupted narration reconciliation without regenerating audio", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-narration-reconcile-recovery-"));
  const port = 18000 + Math.floor(Math.random() * 10000);
  const token = "narration-recovery-token-" + "x".repeat(32);
  const jobId = "narration-reconcile-recovery-" + process.pid + "-" + Date.now();
  const script = { premise: "Test-only narration recovery", narration: "A retained narration draft must be verified before it can be reviewed.", sections: [] };
  const scriptSha256 = canonicalAuthoringScriptSha256(script);
  const approval = {
    decision: "APPROVE",
    scriptSha256,
    reviewer: "test-owner@example.test",
    reviewedAt: "2026-11-01T12:00:00.000Z",
    reason: "Test fixture approval only",
    approvalSha256: "a".repeat(64)
  };
  const stateFile = path.join(stateDir, "dashboard-state.json");
  fs.writeFileSync(stateFile, JSON.stringify({
    version: 1,
    queueItems: [],
    campaigns: [],
    audit: [],
    jobs: [{
      id: jobId,
      kind: "CONTENT_PRODUCTION",
      state: "QUEUED",
      contentType: "short",
      title: "Interrupted narration reconciliation fixture",
      authoring: {
        result: { script },
        scriptApproval: approval,
        narrationStage: {
          status: "RECONCILING",
          scriptSha256,
          scriptApprovalSha256: approval.approvalSha256,
          requestedAt: "2026-11-01T11:00:00.000Z",
          reconciliationStartedAt: "2026-11-01T11:05:00.000Z",
          reconciliationActor: "test-owner@example.test",
          artifacts: {}
        }
      }
    }],
    uploads: [],
    facebookDrafts: [],
    facebookPosts: [],
    facebookAttempts: []
  }, null, 2) + "\n", { mode: 0o600 });

  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "test-owner@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      FACEBOOK_PUBLISH_ENABLED: "NO",
      FACEBOOK_RUNTIME_KILL_SWITCH: "YES"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  const outputDir = path.join(process.cwd(), "media", "generated-authoring", jobId + "-" + scriptSha256.slice(0, 12));
  t.after(() => {
    if (child.exitCode === null) child.kill("SIGTERM");
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(outputDir, { recursive: true, force: true });
  });

  const base = "http://127.0.0.1:" + port;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard did not recover interrupted narration reconciliation: " + logs);

  const headers = { "content-type": "application/json", "x-operator-token": token };
  const recoveredState = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const recoveredJob = recoveredState.jobs.find(job => job.id === jobId);
  assert.equal(recoveredJob.authoring.narrationStage.status, "RECOVERY_REQUIRED");
  assert.equal(recoveredJob.authoring.narrationStage.recoveryRequired, true);
  assert.equal(recoveredJob.authoring.narrationStage.publishable, false);
  assert.equal(recoveredJob.authoring.narrationStage.publishingEnabled, false);
  assert.equal(recoveredState.audit.filter(event =>
    event.action === "AUTHORING_NARRATION_RECONCILIATION_INTERRUPTED" && event.jobId === jobId
  ).length, 1, "restart recovery must append exactly one durable interruption audit event");

  const beforeRetry = fs.readFileSync(stateFile);
  const retry = await fetch(base + "/api/jobs/narration/reconcile", {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId, scriptSha256 })
  });
  const retryBody = await retry.json();
  assert.equal(retry.status, 409, JSON.stringify(retryBody));
  assert.equal(retryBody.recoveryRequired, true, "incomplete retained artifacts must remain recoverable, not trigger TTS");
  assert.match(retryBody.error, /no TTS retry was performed/i);
  const afterRetry = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const afterJob = afterRetry.jobs.find(job => job.id === jobId);
  assert.equal(afterJob.authoring.narrationStage.status, "RECOVERY_REQUIRED");
  assert.equal(afterJob.authoring.narrationStage.publishingEnabled, false);
  assert.equal(afterRetry.audit.filter(event =>
    event.action === "AUTHORING_NARRATION_RECONCILIATION_INTERRUPTED" && event.jobId === jobId
  ).length, 1);
  assert.equal(afterRetry.audit.filter(event =>
    event.action === "AUTHORING_NARRATION_RECONCILIATION_FAILED" && event.jobId === jobId
  ).length, 1);
  assert.notDeepEqual(fs.readFileSync(stateFile), beforeRetry, "the failed reconciliation must durably record its attempt and recovery outcome");
});


test("narration reconciliation succeeds on retained media, is idempotent, and survives restart", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-narration-reconcile-success-"));
  const port = 18000 + Math.floor(Math.random() * 10000);
  const token = "narration-success-token-" + "x".repeat(32);
  const jobId = "narration-reconcile-success-" + process.pid + "-" + Date.now();
  const words = Array.from({ length: 130 }, (_, index) => "evidence" + (index + 1));
  const script = { premise: "Test-only retained narration reconciliation", narration: words.join(" "), sections: [] };
  const scriptSha256 = canonicalAuthoringScriptSha256(script);
  const approval = {
    decision: "APPROVE", scriptSha256, reviewer: "test-owner@example.test",
    reviewedAt: "2026-11-01T12:00:00.000Z", reason: "Test fixture approval only",
    approvalSha256: "b".repeat(64)
  };
  const outputDir = path.join(process.cwd(), "media", "generated-authoring", jobId + "-" + scriptSha256.slice(0, 12));
  fs.mkdirSync(outputDir, { recursive: true });
  const audioPath = path.join(outputDir, "narration.mp3");
  const encoded = spawnSync("ffmpeg", [
    "-nostdin", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i",
    "anullsrc=channel_layout=mono:sample_rate=24000", "-t", "55",
    "-codec:a", "libmp3lame", "-b:a", "64k", "-y", audioPath
  ], { encoding: "utf8", timeout: 30000 });
  assert.equal(encoded.status, 0, "FFmpeg must create the test-only playable MP3: " + (encoded.stderr || encoded.error?.message || ""));
  const probe = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", audioPath
  ], { encoding: "utf8", timeout: 20000 });
  assert.equal(probe.status, 0, "ffprobe must inspect the generated test MP3: " + (probe.stderr || ""));
  const durationSeconds = Number(probe.stdout.trim());
  assert.ok(Number.isFinite(durationSeconds) && durationSeconds >= 50 && durationSeconds <= 60);

  const digest = value => crypto.createHash("sha256").update(value).digest("hex");
  const write = (name, bytes) => {
    const file = path.join(outputDir, name);
    fs.writeFileSync(file, bytes, { mode: 0o600 });
    return { path: path.relative(process.cwd(), file).split(path.sep).join("/"), sha256: digest(bytes) };
  };
  fs.writeFileSync(path.join(outputDir, "approved-script.json"), JSON.stringify({ result: script }, null, 2) + "\n", { mode: 0o600 });
  const audioBytes = fs.readFileSync(audioPath);
  const audioArtifact = { path: path.relative(process.cwd(), audioPath).split(path.sep).join("/"), sha256: digest(audioBytes) };
  const transcriptArtifact = write("narration.txt", script.narration.replace(/\s+/gu, " ").trim() + "\n");
  const durationMs = Math.floor(durationSeconds * 1000);
  const cueWidth = Math.floor(durationMs / words.length);
  const formatTime = milliseconds => {
    const value = Math.max(0, Math.floor(milliseconds));
    const hours = Math.floor(value / 3600000);
    const minutes = Math.floor((value % 3600000) / 60000);
    const seconds = Math.floor((value % 60000) / 1000);
    const millis = value % 1000;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0") + "," + String(millis).padStart(3, "0");
  };
  const captions = words.map((word, index) => {
    const start = index * cueWidth;
    const end = index === words.length - 1 ? durationMs : (index + 1) * cueWidth;
    return String(index + 1) + "\n" + formatTime(start) + " --> " + formatTime(end) + "\n" + word;
  }).join("\n\n") + "\n";
  const captionsArtifact = write("captions.srt", captions);
  const report = {
    format: "short", scriptSha256, wordCount: words.length, durationSeconds,
    wordBoundaryCount: words.length, captionTiming: "TTS_WORD_BOUNDARIES",
    audioSha256: audioArtifact.sha256, transcriptSha256: transcriptArtifact.sha256,
    captionsSha256: captionsArtifact.sha256, humanReviewRequired: true,
    rightsStatus: "NOT_VERIFIED", status: "DRAFT_REVIEW_REQUIRED", publishingEnabled: false
  };
  const reportArtifact = write("narration-report.json", JSON.stringify(report) + "\n");
  const stateFile = path.join(stateDir, "dashboard-state.json");
  fs.writeFileSync(stateFile, JSON.stringify({
    version: 1, queueItems: [], campaigns: [], audit: [],
    jobs: [{
      id: jobId, kind: "CONTENT_PRODUCTION", state: "QUEUED", contentType: "short",
      title: "Retained narration reconciliation test",
      authoring: {
        result: { script }, scriptApproval: approval,
        narrationStage: {
          status: "RECONCILING", scriptSha256, scriptApprovalSha256: approval.approvalSha256,
          requestedAt: "2026-11-01T11:00:00.000Z",
          reconciliationStartedAt: "2026-11-01T11:05:00.000Z",
          reconciliationActor: "test-owner@example.test",
          artifacts: {
            "narration.mp3": audioArtifact, "narration.txt": transcriptArtifact,
            "captions.srt": captionsArtifact, "narration-report.json": reportArtifact
          }
        }
      }
    }],
    uploads: [], facebookDrafts: [], facebookPosts: [], facebookAttempts: []
  }, null, 2) + "\n", { mode: 0o600 });

  const env = {
    ...process.env, DASHBOARD_OPERATOR_TOKEN: token,
    DASHBOARD_OPERATOR_ID: "test-owner@example.test", DASHBOARD_STATE_DIR: stateDir,
    UPLOAD_LOG_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1",
    FACEBOOK_PUBLISH_ENABLED: "NO", FACEBOOK_RUNTIME_KILL_SWITCH: "YES"
  };
  let child = null;
  let logs = "";
  const startServer = async () => {
    child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], { env, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.on("data", chunk => { logs += chunk.toString(); });
    child.stderr.on("data", chunk => { logs += chunk.toString(); });
    const base = "http://127.0.0.1:" + port;
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (child.exitCode !== null) break;
      try { const response = await fetch(base + "/healthz"); if (response.ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, "dashboard did not start: " + logs);
    return base;
  };
  const stopServer = async () => {
    if (!child || child.exitCode !== null) return;
    const exited = new Promise(resolve => child.once("exit", resolve));
    child.kill("SIGTERM");
    await exited;
  };
  t.after(async () => {
    await stopServer();
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(outputDir, { recursive: true, force: true });
  });

  let base = await startServer();
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const recovered = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(recovered.jobs[0].authoring.narrationStage.status, "RECOVERY_REQUIRED");
  assert.equal(recovered.audit.filter(event => event.action === "AUTHORING_NARRATION_RECONCILIATION_INTERRUPTED").length, 1);

  const payload = JSON.stringify({ jobId, scriptSha256 });
  const concurrent = await Promise.all([
    fetch(base + "/api/jobs/narration/reconcile", { method: "POST", headers, body: payload }),
    fetch(base + "/api/jobs/narration/reconcile", { method: "POST", headers, body: payload })
  ]);
  const bodies = await Promise.all(concurrent.map(response => response.json()));
  const concurrentStatuses = concurrent.map(response => response.status).sort();
  assert.ok(
    JSON.stringify(concurrentStatuses) === JSON.stringify([200, 200]) ||
    JSON.stringify(concurrentStatuses) === JSON.stringify([200, 409]),
    "concurrent reconciliation must have one successful operation and only a safe in-progress conflict or exact retry: " + JSON.stringify(bodies)
  );
  const concurrentSuccesses = bodies.filter((body, index) => concurrent[index].status === 200);
  assert.equal(concurrentSuccesses.length >= 1, true);
  if (concurrentSuccesses.length === 2) {
    assert.equal(concurrentSuccesses.filter(body => body.idempotent === true).length, 1,
      "a concurrent request arriving after completion must reuse the single durable receipt");
  } else {
    const conflict = bodies.find((body, index) => concurrent[index].status === 409);
    assert.match(conflict.error, /Only an interrupted or recovery-required narration stage can be reconciled/i);
  }
  assert.ok(concurrentSuccesses.every(body => body.publishable === false && body.publishingEnabled === false));
  const persisted = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const job = persisted.jobs.find(item => item.id === jobId);
  assert.equal(job.authoring.narrationStage.status, "DRAFT_REVIEW_REQUIRED");
  assert.equal(job.authoring.narrationStage.reconciledAt !== undefined, true);
  assert.equal(persisted.audit.filter(event => event.action === "AUTHORING_NARRATION_RECONCILIATION_STARTED" && event.jobId === jobId).length, 1);
  assert.equal(persisted.audit.filter(event => event.action === "AUTHORING_NARRATION_RECONCILIATION_SUCCEEDED" && event.jobId === jobId).length, 1);
  assert.equal(persisted.audit.filter(event => event.action === "AUTHORING_NARRATION_RECONCILIATION_INTERRUPTED" && event.jobId === jobId).length, 1);

  const beforeExactRetry = fs.readFileSync(stateFile);
  const exactRetry = await fetch(base + "/api/jobs/narration/reconcile", { method: "POST", headers, body: payload });
  const exactRetryBody = await exactRetry.json();
  assert.equal(exactRetry.status, 200, JSON.stringify(exactRetryBody));
  assert.equal(exactRetryBody.idempotent, true);
  assert.deepEqual(fs.readFileSync(stateFile), beforeExactRetry,
    "an exact successful retry must verify retained files without adding state or audit mutations");

  await stopServer();
  base = await startServer();
  const recoveredBundleResponse = await fetch(base + "/api/jobs/narration/review?jobId=" + encodeURIComponent(jobId), { headers });
  assert.equal(recoveredBundleResponse.status, 200, "the reconciled transcript/report must remain reviewable after restart");
  const recoveredBundle = await recoveredBundleResponse.json();
  assert.equal(recoveredBundle.stageStatus, "DRAFT_REVIEW_REQUIRED");
  assert.equal(recoveredBundle.scriptSha256, scriptSha256);
  assert.equal(recoveredBundle.report.audioSha256, audioArtifact.sha256);
  assert.equal(recoveredBundle.transcript, script.narration + "\n");
  const recoveredAudioResponse = await fetch(base + "/api/jobs/narration/audio?jobId=" + encodeURIComponent(jobId), { headers });
  assert.equal(recoveredAudioResponse.status, 200);
  const recoveredAudio = Buffer.from(await recoveredAudioResponse.arrayBuffer());
  assert.equal(digest(recoveredAudio), audioArtifact.sha256, "the retained audio bytes must remain identical after restart");
  const afterRestart = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(afterRestart.audit.filter(event => event.action === "AUTHORING_NARRATION_RECONCILIATION_SUCCEEDED" && event.jobId === jobId).length, 1);
});
