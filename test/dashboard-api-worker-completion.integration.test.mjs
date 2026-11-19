import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { createContentJob } from "../scripts/content-job-lifecycle.mjs";

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test("worker completion verifies real local output, persists one receipt, and recovers an interrupted next stage", async t => {
  const root = process.cwd();
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-completion-state-"));
  const fixtureDir = fs.mkdtempSync(path.join(root, ".worker-completion-fixture-"));
  const mediaPath = path.join(fixtureDir, "short.mp4");
  const metadataPath = path.join(fixtureDir, "metadata.json");
  const relative = file => path.relative(root, file).split(path.sep).join("/");
  const generated = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=24:d=50",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100:duration=50",
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-r", "24",
    "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", mediaPath
  ], { encoding: "utf8", timeout: 180_000 });
  assert.equal(generated.status, 0, "FFmpeg media fixture generation failed: " + generated.stderr);
  const metadata = {
    channel: "SonicVhibez", visibility: "private", productUrl: "https://selar.com/0u19v8u99l",
    title: "Test wildlife short", description: "Test-only worker completion fixture.",
    tags: ["wildlife", "nature", "education"]
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata) + "\n");
  const mediaBytes = fs.readFileSync(mediaPath);
  const metadataBytes = fs.readFileSync(metadataPath);
  const mediaSha256 = sha256(mediaBytes);
  const metadataSha256 = sha256(metadataBytes);
  const job = createContentJob({
    idempotencyKey: "worker-completion-success",
    title: "Worker completion fixture",
    topic: "Test-only verified short export",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: "2026-11-07"
  });
  const stateFile = path.join(stateDir, "dashboard-state.json");
  fs.writeFileSync(stateFile, JSON.stringify({
    version: 1, queueItems: [], campaigns: [], audit: [], jobs: [job], uploads: [],
    facebookDrafts: [], facebookPosts: [], facebookAttempts: []
  }));

  const token = "worker-completion-" + crypto.randomBytes(24).toString("hex");
  const port = await availablePort();
  const base = "http://127.0.0.1:" + port;
  let child = null;
  let logs = "";
  const start = async () => {
    logs = "";
    child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
      cwd: root,
      env: {
        ...process.env, DASHBOARD_OPERATOR_TOKEN: token,
        DASHBOARD_OPERATOR_ID: "worker-completion-test@example.test",
        DASHBOARD_STATE_DIR: stateDir, UPLOAD_LOG_DIR: stateDir,
        PORT: String(port), DASHBOARD_HOST: "127.0.0.1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    child.stdout.on("data", chunk => { logs += chunk.toString(); });
    child.stderr.on("data", chunk => { logs += chunk.toString(); });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error("Dashboard server exited: " + logs);
      try { if ((await fetch(base + "/healthz")).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error("Dashboard server startup timed out: " + logs);
  };
  const stop = async () => {
    if (!child || child.exitCode !== null) return;
    const current = child;
    current.kill("SIGTERM");
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Dashboard shutdown timed out: " + logs)), 5000);
      current.once("exit", () => { clearTimeout(timer); resolve(); });
    });
  };
  const post = async (body, auth = true) => {
    const headers = { "content-type": "application/json" };
    if (auth) headers["x-operator-token"] = token;
    const response = await fetch(base + "/api/jobs/lease/complete", {
      method: "POST", headers, body: JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
  };
  t.after(async () => {
    await stop().catch(() => {});
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  await start();
  const initialState = fs.readFileSync(stateFile);
  const unauthorized = await post({ jobId: job.id, leaseToken: "invalid", nextState: "FAILED" }, false);
  assert.equal(unauthorized.status, 401);
  assert.deepEqual(fs.readFileSync(stateFile), initialState, "unauthorized completion must not mutate state");
  const missing = await post({});
  assert.equal(missing.status, 400);
  assert.deepEqual(fs.readFileSync(stateFile), initialState, "missing completion fields must not mutate state");
  const unknown = await post({ jobId: "unknown-worker-job", leaseToken: "invalid", nextState: "FAILED" });
  assert.equal(unknown.status, 404);

  const claimResponse = await fetch(base + "/api/jobs/lease/claim", {
    method: "POST",
    headers: { "content-type": "application/json", "x-operator-token": token },
    body: JSON.stringify({ jobId: job.id, workerId: "verified-output-worker", leaseMs: 120_000 })
  });
  const claim = await claimResponse.json();
  assert.equal(claimResponse.status, 200, JSON.stringify(claim));
  assert.ok(claim.leaseToken);
  const completionPayload = {
    jobId: job.id,
    leaseToken: claim.leaseToken,
    nextState: "GENERATED",
    metadataPath: relative(metadataPath),
    result: {
      metadataVersion: metadataSha256,
      outputArtifacts: [{ path: relative(mediaPath), sha256: mediaSha256 }]
    }
  };
  const completed = await post(completionPayload);
  assert.equal(completed.status, 200, JSON.stringify(completed.body));
  assert.equal(completed.body.job.state, "GENERATED");
  assert.equal(completed.body.publishingEnabled, false);
  assert.equal(completed.body.job.outputArtifacts[0].sha256, mediaSha256);
  assert.equal(completed.body.job.outputArtifacts[0].width, 1080);
  assert.equal(completed.body.job.outputArtifacts[0].height, 1920);
  assert.ok(Math.abs(completed.body.job.outputArtifacts[0].durationSeconds - 50) < 0.1);
  assert.equal(completed.body.job.metadataVersion, metadataSha256);
  assert.equal(completed.body.job.lastWorkerCompletion.nextState, "GENERATED");

  const afterCompletion = fs.readFileSync(stateFile);
  const completionAudit = JSON.parse(afterCompletion.toString("utf8")).audit.filter(event =>
    event.action === "WORKER_STAGE_COMPLETED" && event.jobId === job.id
  );
  assert.equal(completionAudit.length, 1);

  const retry = await post(completionPayload);
  assert.equal(retry.status, 200, JSON.stringify(retry.body));
  assert.equal(retry.body.idempotent, true);
  assert.deepEqual(fs.readFileSync(stateFile), afterCompletion, "exact retry must not rewrite the durable completion receipt");

  const concurrent = await Promise.all([post(completionPayload), post(completionPayload)]);
  assert.deepEqual(concurrent.map(result => result.status), [200, 200]);
  assert.ok(concurrent.every(result => result.body.idempotent === true));
  assert.deepEqual(fs.readFileSync(stateFile), afterCompletion, "concurrent retries must not duplicate audit or state writes");

  const conflicting = await post({
    ...completionPayload,
    result: { ...completionPayload.result, errorDetails: { message: "conflicting completion" } }
  });
  assert.equal(conflicting.status, 409);
  assert.deepEqual(fs.readFileSync(stateFile), afterCompletion, "conflicting completion must preserve the original receipt");

  fs.writeFileSync(mediaPath, "tampered after worker completion");
  const tampered = await post(completionPayload);
  assert.equal(tampered.status, 409, "idempotency must not bypass current artifact checksum validation");
  assert.deepEqual(fs.readFileSync(stateFile), afterCompletion);
  fs.writeFileSync(mediaPath, mediaBytes);

  await stop();
  await start();
  const recovered = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const recoveredJob = recovered.jobs.find(item => item.id === job.id);
  assert.equal(recoveredJob.state, "RECOVERY_REQUIRED", "restart during a still-leased next stage must fail closed for operator reconciliation");
  assert.equal(recoveredJob.workerLease, null);
  assert.equal(recoveredJob.lastWorkerCompletion.requestSha256, completed.body.job.lastWorkerCompletion.requestSha256);
  assert.equal(recovered.audit.filter(event => event.action === "WORKER_STAGE_COMPLETED" && event.jobId === job.id).length, 1);
  assert.equal(recovered.audit.filter(event => event.action === "CONTENT_JOB_RECOVERY_REQUIRED" && event.jobId === job.id).length, 1);

  const afterRecovery = fs.readFileSync(stateFile);
  const recoveredRetry = await post(completionPayload);
  assert.equal(recoveredRetry.status, 200, JSON.stringify(recoveredRetry.body));
  assert.equal(recoveredRetry.body.idempotent, true);
  assert.equal(recoveredRetry.body.job.state, "RECOVERY_REQUIRED");
  assert.deepEqual(fs.readFileSync(stateFile), afterRecovery, "replayed completion receipt must not clear the recovery gate or rewrite state");
});
