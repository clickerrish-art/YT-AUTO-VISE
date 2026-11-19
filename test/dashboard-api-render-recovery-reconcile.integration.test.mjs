import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { contentJobArtifactPaths } from "../scripts/content-job-artifact-paths.mjs";

async function reservePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

test("render recovery reconciliation is fail-closed, idempotent under concurrency and durable across restart", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-render-recovery-reconcile-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  const token = "render-recovery-reconcile-" + "x".repeat(40);
  const operatorId = "render-recovery-operator@example.test";
  const validJobId = "render-recovery-" + crypto.randomUUID();
  const retainedJobId = "render-retained-" + crypto.randomUUID();
  const validPaths = contentJobArtifactPaths(validJobId);
  const retainedPaths = contentJobArtifactPaths(retainedJobId);
  const validJob = {
    id: validJobId,
    kind: "CONTENT_PRODUCTION",
    state: "FAILED",
    workerLease: null,
    errorDetails: {
      code: "RENDER_ARTIFACT_RECOVERY_REQUIRED",
      message: "A test-only render artifact recovery failure."
    }
  };
  const retainedJob = {
    id: retainedJobId,
    kind: "CONTENT_PRODUCTION",
    state: "DEAD_LETTER",
    workerLease: null,
    errorDetails: {
      code: "RENDER_MANIFEST_RECOVERY_REQUIRED",
      message: "A test-only retained render manifest failure."
    }
  };
  fs.writeFileSync(statePath, JSON.stringify({
    version: 1,
    queueItems: [],
    campaigns: [],
    audit: [],
    jobs: [validJob, retainedJob],
    uploads: [],
    facebookDrafts: [],
    facebookPosts: [],
    facebookAttempts: []
  }, null, 2) + "\n", { mode: 0o600 });

  const retainedArtifact = path.join(process.cwd(), retainedPaths.videoPath);
  fs.mkdirSync(path.dirname(retainedArtifact), { recursive: true });
  fs.writeFileSync(retainedArtifact, Buffer.from("retained render artifact must block reconciliation"));

  const port = await reservePort();
  const launch = () => {
    const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DASHBOARD_OPERATOR_TOKEN: token,
        DASHBOARD_OPERATOR_ID: operatorId,
        DASHBOARD_STATE_DIR: stateDir,
        UPLOAD_LOG_DIR: stateDir,
        PORT: String(port),
        DASHBOARD_HOST: "127.0.0.1",
        META_PAGE_ACCESS_TOKEN: "",
        META_USER_ACCESS_TOKEN: "",
        NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "",
        FACEBOOK_PUBLISH_ENABLED: "",
        YOUTUBE_CLIENT_ID: "",
        YOUTUBE_CLIENT_SECRET: "",
        YOUTUBE_REFRESH_TOKEN: "",
        SONICVHIBEZ_CHANNEL_ID: ""
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let logs = "";
    child.stdout.on("data", chunk => { logs += chunk.toString(); });
    child.stderr.on("data", chunk => { logs += chunk.toString(); });
    return { child, get logs() { return logs; } };
  };
  let instance = launch();
  const base = "http://127.0.0.1:" + port;
  const stop = async current => {
    if (current.child.exitCode !== null || current.child.signalCode !== null) return;
    current.child.kill("SIGTERM");
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Dashboard did not stop: " + current.logs)), 5000);
      current.child.once("exit", () => { clearTimeout(timeout); resolve(); });
    });
  };
  const waitForReady = async current => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (current.child.exitCode !== null || current.child.signalCode !== null) {
        throw new Error("Dashboard exited before ready: " + current.logs);
      }
      try {
        if ((await fetch(base + "/healthz")).ok) return;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("Dashboard did not become ready: " + current.logs);
  };
  t.after(async () => {
    await stop(instance).catch(() => {});
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(path.join(process.cwd(), validPaths.directory), { recursive: true, force: true });
    fs.rmSync(path.join(process.cwd(), retainedPaths.directory), { recursive: true, force: true });
  });
  await waitForReady(instance);

  const headers = { "content-type": "application/json", "x-operator-token": token };
  const post = (jobId, reason) => fetch(base + "/api/jobs/render-recovery/reconcile", {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId, reason })
  });
  const beforeInvalid = fs.readFileSync(statePath);
  const invalidReason = await post(validJobId, "retry");
  assert.equal(invalidReason.status, 400);
  assert.deepEqual(fs.readFileSync(statePath), beforeInvalid,
    "invalid recovery review reason must not mutate durable state");

  const beforeRetained = fs.readFileSync(statePath);
  const retainedResponse = await post(retainedJobId, "Reviewed retained render artifacts and stopped recovery");
  assert.equal(retainedResponse.status, 409);
  assert.deepEqual(fs.readFileSync(statePath), beforeRetained,
    "a retained render artifact must block reconciliation without state or audit mutation");

  const reason = "Verified all render artifact paths are absent after inspecting the failed render.";
  const concurrent = await Promise.all([post(validJobId, reason), post(validJobId, reason)]);
  assert.deepEqual(concurrent.map(response => response.status), [200, 200]);
  const payloads = await Promise.all(concurrent.map(response => response.json()));
  assert.ok(payloads.every(payload => payload.recoveryReconciled === true));
  assert.ok(payloads.every(payload => payload.retryAuthorized === false && payload.publishingEnabled === false));
  assert.equal(payloads.filter(payload => payload.alreadyReconciled === false).length, 1,
    "exactly one concurrent request must commit the reconciliation receipt");
  assert.equal(payloads.filter(payload => payload.alreadyReconciled === true).length, 1,
    "the duplicate request must reuse the committed receipt without a second audit event");

  let persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const saved = persisted.jobs.find(job => job.id === validJobId);
  assert.equal(saved.state, "FAILED", "reconciliation must not silently retry the failed job");
  assert.equal(saved.renderRecovery.verifiedAbsent, true);
  assert.equal(saved.renderRecovery.checkedBy, operatorId);
  assert.deepEqual(saved.renderRecovery.checkedPaths, [
    validPaths.videoPath,
    validPaths.thumbnailPath,
    "content/job-render-manifests/" + validJobId + ".json"
  ]);
  assert.equal(persisted.audit.filter(event =>
    event.action === "CONTENT_RENDER_RECOVERY_RECONCILED" && event.jobId === validJobId
  ).length, 1);

  await stop(instance);
  instance = launch();
  await waitForReady(instance);
  const recoveredResponse = await fetch(base + "/api/state", { headers: { "x-operator-token": token } });
  assert.equal(recoveredResponse.status, 200);
  const recovered = await recoveredResponse.json();
  const recoveredJob = recovered.jobs.find(job => job.id === validJobId);
  assert.equal(recoveredJob.state, "FAILED");
  assert.equal(recoveredJob.renderRecovery.verifiedAbsent, true);
  assert.equal(recovered.audit.filter(event =>
    event.action === "CONTENT_RENDER_RECOVERY_RECONCILED" && event.jobId === validJobId
  ).length, 1);
  assert.equal(recovered.publishingEnabled, false);
});
