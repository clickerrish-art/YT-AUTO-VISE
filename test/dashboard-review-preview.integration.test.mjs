import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

async function reservePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}
const digest = value => crypto.createHash("sha256").update(value).digest("hex");

test("human-review bundle and previews require operator auth and reject changed artifacts", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-review-preview-"));
  const fixtureId = "review-preview-" + crypto.randomUUID();
  const relativeDir = path.join("media", "jobs", fixtureId);
  const metadataRelative = path.join("content", fixtureId + ".json");
  const absoluteDir = path.join(process.cwd(), relativeDir);
  const metadataAbsolute = path.join(process.cwd(), metadataRelative);
  fs.mkdirSync(absoluteDir, { recursive: true });
  const artifacts = {
    video: Buffer.from("test mp4 bytes - review preview fixture"),
    thumbnail: Buffer.from("test jpeg bytes - review preview fixture"),
    captions: Buffer.from("1\n00:00:00,000 --> 00:00:01,000\nWildlife encounter\n"),
    metadata: Buffer.from(JSON.stringify({ channel: "SonicVhibez", visibility: "private", title: "Review fixture" }) + "\n")
  };
  const paths = {
    video: path.join(relativeDir, "final.mp4"),
    thumbnail: path.join(relativeDir, "thumbnail.jpg"),
    captions: path.join(relativeDir, "captions.srt")
  };
  for (const key of ["video", "thumbnail", "captions"]) fs.writeFileSync(path.join(process.cwd(), paths[key]), artifacts[key]);
  fs.writeFileSync(metadataAbsolute, artifacts.metadata);
  const hashes = Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key, digest(value)]));
  const port = await reservePort();
  const operatorToken = "operator-preview-test-" + "o".repeat(32);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: operatorToken, DASHBOARD_OPERATOR_ID: "reviewer@example.test", DASHBOARD_STATE_DIR: stateDir, UPLOAD_LOG_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(async () => {
    child.kill("SIGTERM");
    await new Promise(resolve => child.exitCode !== null ? resolve() : child.once("exit", resolve));
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(absoluteDir, { recursive: true, force: true });
    fs.rmSync(metadataAbsolute, { force: true });
  });
  const base = "http://127.0.0.1:" + port;
  let started = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) break;
    try { if ((await fetch(base + "/healthz")).ok) { started = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(started, true, "dashboard failed to start: " + logs);
  const statePath = path.join(stateDir, "dashboard-state.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  state.jobs.push({
    kind: "CONTENT_PRODUCTION", id: fixtureId, state: "AWAITING_HUMAN_REVIEW",
    title: "Review fixture", contentType: "short", metadataPath: metadataRelative, metadataVersion: hashes.metadata,
    outputArtifacts: [{ path: paths.video, sha256: hashes.video }],
    thumbnailArtifact: { path: paths.thumbnail, sha256: hashes.thumbnail },
    validationResults: { passed: true, artifacts: [{ path: paths.video, sha256: hashes.video }], thumbnail: { path: paths.thumbnail, sha256: hashes.thumbnail }, captionsPath: paths.captions, captionsSha256: hashes.captions, metadataVersion: hashes.metadata },
    rightsChecks: { evidence: { verificationStatus: "VERIFIED", permittedUses: ["YouTube"] }, evidenceSha256: "b".repeat(64) }
  });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
  const headers = { "x-operator-token": operatorToken };
  const unauthBundle = await fetch(base + "/api/jobs/review/bundle?jobId=" + fixtureId);
  assert.equal(unauthBundle.status, 401);
  const bundleResponse = await fetch(base + "/api/jobs/review/bundle?jobId=" + fixtureId, { headers });
  assert.equal(bundleResponse.status, 200, await bundleResponse.text());
  const bundle = await bundleResponse.json();
  assert.equal(bundle.publishingEnabled, false);
  assert.equal(bundle.artifacts.length, 3);
  assert.equal(bundle.metadata.sha256, hashes.metadata);
  for (const kind of ["video", "thumbnail", "captions"]) {
    const unauth = await fetch(base + bundle.previewUrls[kind]);
    assert.equal(unauth.status, 401, kind + " preview must require operator authentication");
    const response = await fetch(base + bundle.previewUrls[kind], { headers });
    assert.equal(response.status, 200, kind + " preview should be available to the authenticated operator");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), artifacts[kind]);
  }
  for (const kind of ["video", "thumbnail", "captions"]) {
    fs.writeFileSync(path.join(process.cwd(), paths[kind]), Buffer.from("tampered " + kind));
    const tamperedPreview = await fetch(base + bundle.previewUrls[kind], { headers });
    assert.equal(tamperedPreview.status, 409, "changed " + kind + " must never be served as the approved preview");
    const tamperedBundle = await fetch(base + "/api/jobs/review/bundle?jobId=" + fixtureId, { headers });
    assert.equal(tamperedBundle.status, 409, "the complete review package must fail closed after " + kind + " mutation");
    fs.writeFileSync(path.join(process.cwd(), paths[kind]), artifacts[kind]);
  }
  fs.writeFileSync(metadataAbsolute, Buffer.from("tampered metadata"));
  const tamperedMetadataBundle = await fetch(base + "/api/jobs/review/bundle?jobId=" + fixtureId, { headers });
  assert.equal(tamperedMetadataBundle.status, 409, "changed metadata must invalidate the complete review package");
});
