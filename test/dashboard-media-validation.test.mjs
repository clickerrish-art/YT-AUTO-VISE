import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const hash = value => crypto.createHash("sha256").update(value).digest("hex");

test("dashboard does not persist a passing validation when the strict Short export gate rejects frame rate", {
  skip: process.platform === "win32"
}, async t => {
  const root = process.cwd();
  const nonce = process.pid + "-" + Date.now().toString(36);
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-media-gate-"));
  const assetDir = path.join(root, "media", ".dashboard-media-gate-" + nonce);
  const metadataDir = path.join(root, "content", ".dashboard-media-gate-" + nonce);
  const fakeBin = path.join(stateDir, "bin");
  fs.mkdirSync(assetDir, { recursive: true });
  fs.mkdirSync(metadataDir, { recursive: true });
  fs.mkdirSync(fakeBin, { recursive: true });

  const videoFile = path.join(assetDir, "invalid-fps.mp4");
  const metadataFile = path.join(metadataDir, "metadata.json");
  const captionsFile = path.join(metadataDir, "captions.srt");
  const thumbnailFile = path.join(assetDir, "thumbnail.jpg");
  const relative = file => path.relative(root, file).split(path.sep).join("/");
  const metadata = {
    channel: "SonicVhibez",
    visibility: "private",
    productUrl: "https://selar.com/0u19v8u99l",
    title: "Dashboard media gate test",
    description: "Test-only metadata used to verify fail-closed technical validation.",
    tags: ["wildlife", "documentary", "nature"]
  };
  const metadataBytes = Buffer.from(JSON.stringify(metadata) + "\n");
  fs.writeFileSync(videoFile, Buffer.alloc(150_000, 1));
  fs.writeFileSync(metadataFile, metadataBytes);
  fs.writeFileSync(captionsFile, "1\n00:00:00,000 --> 00:00:01,000\nTest caption.\n");
  fs.writeFileSync(thumbnailFile, Buffer.alloc(150_000, 2));

  const ffprobe = path.join(fakeBin, "ffprobe");
  fs.writeFileSync(ffprobe, "#!/bin/sh\nprintf '%s\\n' '{\"format\":{\"duration\":\"55.2\"},\"streams\":[{\"codec_type\":\"video\",\"codec_name\":\"h264\",\"width\":1080,\"height\":1920,\"avg_frame_rate\":\"0/0\"},{\"codec_type\":\"audio\",\"codec_name\":\"aac\"}]}'\n");
  fs.chmodSync(ffprobe, 0o755);

  const port = 18000 + Math.floor(Math.random() * 10000);
  const token = "media-gate-test-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: {
      ...process.env,
      PATH: fakeBin + path.delimiter + process.env.PATH,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "media-gate-test-operator",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: path.join(stateDir, "run-logs"),
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => {
    child.kill("SIGTERM");
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(assetDir, { recursive: true, force: true });
    fs.rmSync(metadataDir, { recursive: true, force: true });
  });

  const base = "http://127.0.0.1:" + port;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) break;
    try {
      if ((await fetch(base + "/healthz")).ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "dashboard did not start: " + logs);

  const statePath = path.join(stateDir, "dashboard-state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const jobId = "media-gate-" + nonce;
  state.jobs = [{
    id: jobId,
    kind: "CONTENT_PRODUCTION",
    state: "GENERATED",
    contentType: "short",
    outputArtifacts: [{ path: relative(videoFile), sha256: hash(fs.readFileSync(videoFile)) }],
    thumbnailArtifact: { path: relative(thumbnailFile), sha256: hash(fs.readFileSync(thumbnailFile)) },
    metadataPath: relative(metadataFile),
    metadataVersion: hash(metadataBytes),
    validationResults: null,
    workerLease: null
  }];
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });

  const response = await fetch(base + "/api/jobs/validate", {
    method: "POST",
    headers: { "content-type": "application/json", "x-operator-token": token },
    body: JSON.stringify({ jobId, captionsPath: relative(captionsFile) })
  });
  const responseText = await response.text();
  assert.equal(response.status, 400, responseText);
  const result = JSON.parse(responseText);
  assert.match(result.error, /format-specific media export validation failed/i);
  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const job = persisted.jobs.find(item => item.id === jobId);
  assert.equal(job.state, "GENERATED");
  assert.equal(job.validationResults, null, "a failed strict export check must not persist validationResults.passed=true");
  assert.equal(persisted.audit.some(event => event.action === "CONTENT_JOB_VALIDATION_PASSED" && event.jobId === jobId), false);
});
