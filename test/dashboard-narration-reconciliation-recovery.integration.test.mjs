import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
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
