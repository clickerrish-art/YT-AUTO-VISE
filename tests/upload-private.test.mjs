import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("private uploader refuses to run without YouTube credentials", () => {
  const env = { ...process.env };
  for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) delete env[key];
  const result = spawnSync(process.execPath, ["scripts/upload-private.mjs"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required environment variables/);
});

test("private uploader runs media preflight before any YouTube insert", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  assert.match(source, /scripts\/preflight-media\.mjs/);
  assert.match(source, /preflight-media\.mjs/);
  assert.match(source, /mediaPreflight\.includes\("PASS:"\)/);
  assert.ok(source.indexOf('["scripts/preflight-media.mjs", videoPath, metadataPath]') < source.indexOf("youtube.videos.insert("));
});

test("uploader verifies authenticated channel ID and exact channel name before upload", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync("scripts/upload-private.mjs", "utf8");
  assert.match(source, /youtube\.channels\.list\(\{ part: \[\"id\", \"snippet\"\], mine: true \}\)/);
  assert.match(source, /matchedChannel\.snippet\?\.title !== \"SonicVhibez\"/);
  assert.match(source, /metadata\.channelId !== expectedChannelId/);
  assert.ok(source.indexOf("matchedChannel.snippet?.title !== \"SonicVhibez\"") < source.indexOf("youtube.videos.insert"));
  assert.match(source, /privacyStatus: \"private\"/);
});


test("private uploader records uncertain remote outcomes and refuses blind retries", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const { uploadPrivate, sha256File } = await import("../scripts/upload-private.mjs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-upload-timeout-"));
  try {
    const videoPath = path.join(dir, "video.mp4");
    const metadataPath = path.join(dir, "metadata.json");
    const approvalPath = path.join(dir, "approval.json");
    fs.writeFileSync(videoPath, "test-fixture-not-real-video");
    const metadata = { channel: "SonicVhibez", channelId: "UC_SONIC_TEST", visibility: "private", productUrl: "https://selar.com/0u19v8u99l", rightsConfirmed: true, complianceReviewed: true, status: "READY_FOR_PRIVATE_UPLOAD", title: "Test title", description: "Test description", tags: ["wildlife", "documentary", "education"] };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    const videoSha = sha256File(videoPath);
    fs.writeFileSync(approvalPath, JSON.stringify({ decision: "APPROVE", jobId: "job-timeout-001", artifactSha256: videoSha, metadataVersion: sha256File(metadataPath), reviewer: "Test Operator", rightsEvidenceSha256: "a".repeat(64), publishingEnabled: false, visibility: "private", relatedArtifacts: [{ path: videoPath, sha256: videoSha }, { path: path.join(dir, "thumbnail.jpg"), sha256: "b".repeat(64) }] }));
    const env = { YOUTUBE_CLIENT_ID: "test", YOUTUBE_CLIENT_SECRET: "test", YOUTUBE_REFRESH_TOKEN: "test", SONICVHIBEZ_CHANNEL_ID: "UC_SONIC_TEST", CONFIRM_PRIVATE_UPLOAD: "YES", UPLOAD_LOG_DIR: path.join(dir, "logs") };
    const youtubeFactory = () => ({
      channels: { list: async () => ({ data: { items: [{ id: "UC_SONIC_TEST", snippet: { title: "SonicVhibez" } }] } }) },
      videos: { insert: async request => { for await (const _chunk of request.media.body) {} const e = new Error("network timed out"); e.code = "ETIMEDOUT"; throw e; }, list: async () => ({ data: { items: [] } }) }
    });
    const args = { metadataPath, videoPath, approvalPath, jobId: "job-timeout-001", env, youtubeFactory, preflightRunner: args => args[0].includes("check-content") ? "PASS" : "PASS:" };
    await assert.rejects(uploadPrivate(args), /outcome is uncertain/);
    const ledgerPath = path.join(env.UPLOAD_LOG_DIR, "upload-attempts.json");
    const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
    assert.equal(ledger.attempts.length, 1);
    assert.equal(ledger.attempts[0].status, "RECOVERY_REQUIRED");
    await assert.rejects(uploadPrivate(args), /reconcile manually with YouTube before any retry/);
    assert.equal(JSON.parse(fs.readFileSync(ledgerPath, "utf8")).attempts.length, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("private uploader preserves remote video ID and marks recovery if receipt persistence fails", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const { uploadPrivate, sha256File } = await import("../scripts/upload-private.mjs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-upload-receipt-fail-"));
  try {
    const videoPath = path.join(dir, "video.mp4");
    const metadataPath = path.join(dir, "metadata.json");
    const approvalPath = path.join(dir, "approval.json");
    fs.writeFileSync(videoPath, "test-fixture-not-real-video");
    const metadata = { channel: "SonicVhibez", channelId: "UC_SONIC_TEST", visibility: "private", productUrl: "https://selar.com/0u19v8u99l", rightsConfirmed: true, complianceReviewed: true, status: "READY_FOR_PRIVATE_UPLOAD", title: "Test title", description: "Test description", tags: ["wildlife", "documentary", "education"] };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    const videoSha = sha256File(videoPath);
    fs.writeFileSync(approvalPath, JSON.stringify({ decision: "APPROVE", jobId: "job-receipt-001", artifactSha256: videoSha, metadataVersion: sha256File(metadataPath), reviewer: "Test Operator", rightsEvidenceSha256: "a".repeat(64), publishingEnabled: false, visibility: "private", relatedArtifacts: [{ path: videoPath, sha256: videoSha }, { path: path.join(dir, "thumbnail.jpg"), sha256: "b".repeat(64) }] }));
    const env = { YOUTUBE_CLIENT_ID: "test", YOUTUBE_CLIENT_SECRET: "test", YOUTUBE_REFRESH_TOKEN: "test", SONICVHIBEZ_CHANNEL_ID: "UC_SONIC_TEST", CONFIRM_PRIVATE_UPLOAD: "YES", UPLOAD_LOG_DIR: path.join(dir, "logs") };
    const youtubeFactory = () => ({
      channels: { list: async () => ({ data: { items: [{ id: "UC_SONIC_TEST", snippet: { title: "SonicVhibez" } }] } }) },
      videos: { insert: async request => { for await (const _chunk of request.media.body) {} return { data: { id: "VIDEO_PRIVATE_TEST" } }; }, list: async () => ({ data: { items: [{ id: "VIDEO_PRIVATE_TEST", snippet: { channelId: "UC_SONIC_TEST" } , status: { privacyStatus: "private" } }] } }) }
    });
    let failedReceiptWrite = false;
    const persistJson = (filePath, value) => {
      if (!failedReceiptWrite && path.basename(filePath) === "upload-VIDEO_PRIVATE_TEST.json") { failedReceiptWrite = true; throw new Error("injected receipt write failure"); }
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    };
    await assert.rejects(uploadPrivate({ metadataPath, videoPath, approvalPath, jobId: "job-receipt-001", env, youtubeFactory, persistJson, preflightRunner: args => args[0].includes("check-content") ? "PASS" : "PASS:" }), /receipt persistence failed/);
    const ledger = JSON.parse(fs.readFileSync(path.join(env.UPLOAD_LOG_DIR, "upload-attempts.json"), "utf8"));
    assert.equal(ledger.attempts[0].remoteVideoId, "VIDEO_PRIVATE_TEST");
    assert.equal(ledger.attempts[0].status, "RECOVERY_REQUIRED");
    const reconciled = await uploadPrivate({ metadataPath, videoPath, approvalPath, jobId: "job-receipt-001", env: { ...env, RECONCILE_ONLY: "YES" }, youtubeFactory, persistJson: (p, v) => fs.writeFileSync(p, JSON.stringify(v)), preflightRunner: args => args[0].includes("check-content") ? "PASS" : "PASS:" });
    assert.equal(reconciled.reused, true);
    assert.equal(reconciled.receipt.videoId, "VIDEO_PRIVATE_TEST");
    assert.equal(reconciled.receipt.privacyStatus, "private");
    assert.equal(JSON.parse(fs.readFileSync(path.join(env.UPLOAD_LOG_DIR, "upload-attempts.json"), "utf8")).attempts[0].status, "PRIVATE_UPLOAD_VERIFIED");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
