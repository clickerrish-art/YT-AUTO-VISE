import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createContentJob, transitionContentJob } from "../scripts/content-job-lifecycle.mjs";

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

test("technical validation retries are idempotent and do not duplicate audit history", async t => {
  const root = process.cwd();
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "validation-idempotency-state-"));
  const fixtureDir = fs.mkdtempSync(path.join(root, ".validation-idempotency-"));
  const mediaPath = path.join(fixtureDir, "short.mp4");
  const thumbnailPath = path.join(fixtureDir, "thumbnail.jpg");
  const captionsPath = path.join(fixtureDir, "captions.srt");
  const metadataPath = path.join(fixtureDir, "metadata.json");
  const relative = file => path.relative(root, file).split(path.sep).join("/");
  const ffmpeg = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=24:d=50",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100:duration=50",
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-r", "24",
    "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", mediaPath
  ], { encoding: "utf8", timeout: 180_000 });
  assert.equal(ffmpeg.status, 0, "FFmpeg fixture generation failed: " + ffmpeg.stderr);
  const thumbnail = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i",
    "color=c=blue:s=1280x720", "-frames:v", "1", "-q:v", "2", thumbnailPath
  ], { encoding: "utf8", timeout: 30_000 });
  assert.equal(thumbnail.status, 0, "thumbnail fixture generation failed: " + thumbnail.stderr);
  fs.writeFileSync(captionsPath, "1\n00:00:00,000 --> 00:00:49,500\nA test narration cue.\n\n");
  const metadata = {
    channel: "SonicVhibez", visibility: "private", productUrl: "https://selar.com/0u19v8u99l",
    title: "Test wildlife short", description: "Test-only technical validation fixture.",
    tags: ["wildlife", "nature", "education"]
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata) + "\n");
  const mediaBytes = fs.readFileSync(mediaPath);
  const thumbnailBytes = fs.readFileSync(thumbnailPath);
  const metadataBytes = fs.readFileSync(metadataPath);
  assert.ok(mediaBytes.length > 100_000, "video fixture must exceed the minimum export size");

  let job = createContentJob({
    idempotencyKey: "validation-idempotency-job", title: "Validation idempotency fixture",
    topic: "Test-only short export validation", contentType: "short",
    scheduledDay: "Saturday", scheduledDate: "2026-11-07"
  });
  job = transitionContentJob(job, "GENERATING", { actor: "test-worker" });
  job = transitionContentJob(job, "GENERATED", { actor: "test-worker" });
  job.metadataPath = relative(metadataPath);
  job.metadataVersion = sha256(metadataBytes);
  job.outputArtifacts = [{ path: relative(mediaPath), sha256: sha256(mediaBytes) }];
  job.thumbnailArtifact = { path: relative(thumbnailPath), sha256: sha256(thumbnailBytes) };
  job.authoring = { narrationStage: { artifacts: { "captions.srt": {
    path: relative(captionsPath), sha256: sha256(fs.readFileSync(captionsPath))
  } } } };
  const stateFile = path.join(stateDir, "dashboard-state.json");
  fs.writeFileSync(stateFile, JSON.stringify({
    version: 1, queueItems: [], campaigns: [], audit: [], jobs: [job], uploads: [],
    facebookDrafts: [], facebookPosts: [], facebookAttempts: []
  }));

  const token = "validation-idempotency-" + crypto.randomBytes(24).toString("hex");
  const port = 25000 + Math.floor(Math.random() * 10000);
  const base = "http://127.0.0.1:" + port;
  let child;
  let logs = "";
  const start = async () => {
    logs = "";
    child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
      cwd: root,
      env: {
        ...process.env, DASHBOARD_OPERATOR_TOKEN: token,
        DASHBOARD_OPERATOR_ID: "validation-test@example.test",
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
  const request = async () => {
    const response = await fetch(base + "/api/jobs/validate", {
      method: "POST",
      headers: { "content-type": "application/json", "x-operator-token": token },
      body: JSON.stringify({ jobId: job.id, captionsPath: relative(captionsPath) })
    });
    return { status: response.status, body: await response.json() };
  };
  t.after(async () => {
    await stop().catch(() => {});
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  await start();
  const first = await request();
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(first.body.job.validationResults.passed, true);
  assert.equal(first.body.idempotent, undefined);
  const afterFirst = fs.readFileSync(stateFile);
  assert.equal(JSON.parse(afterFirst.toString("utf8")).audit.filter(event => event.action === "CONTENT_JOB_VALIDATION_PASSED").length, 1);

  const retry = await request();
  assert.equal(retry.status, 200, JSON.stringify(retry.body));
  assert.equal(retry.body.idempotent, true);
  assert.deepEqual(fs.readFileSync(stateFile), afterFirst, "identical validation retry must not rewrite durable state or audit history");

  await stop();
  await start();
  const afterRestart = await request();
  assert.equal(afterRestart.status, 200, JSON.stringify(afterRestart.body));
  assert.equal(afterRestart.body.idempotent, true);
  assert.deepEqual(fs.readFileSync(stateFile), afterFirst, "restart read-back and idempotent retry must preserve durable validation and audit history");

  const concurrent = await Promise.all([request(), request()]);
  assert.deepEqual(concurrent.map(result => result.status), [200, 200]);
  assert.ok(concurrent.every(result => result.body.idempotent === true));
  assert.deepEqual(fs.readFileSync(stateFile), afterFirst, "concurrent idempotent retries must preserve byte-identical durable state");
});
