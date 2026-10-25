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

test("private uploader fails closed when YouTube emergency stop is active or unset", async () => {
  const { uploadPrivate } = await import("../scripts/upload-private.mjs");
  const baseEnv = {
    YOUTUBE_CLIENT_ID: "test", YOUTUBE_CLIENT_SECRET: "test", YOUTUBE_REFRESH_TOKEN: "test",
    SONICVHIBEZ_CHANNEL_ID: "UC_SONIC_TEST", CONFIRM_PRIVATE_UPLOAD: "YES"
  };
  for (const stopValue of ["true", "YES", undefined]) {
    const env = { ...baseEnv };
    if (stopValue === undefined) delete env.YOUTUBE_EMERGENCY_STOP;
    else env.YOUTUBE_EMERGENCY_STOP = stopValue;
    await assert.rejects(uploadPrivate({
      metadataPath: "does-not-exist.json", videoPath: "does-not-exist.mp4",
      approvalPath: "does-not-exist-approval.json", jobId: "job-stop-001", env
    }), /YouTube emergency stop is active or unset/);
  }
  await assert.rejects(uploadPrivate({
    metadataPath: "does-not-exist.json", videoPath: "does-not-exist.mp4",
    approvalPath: "does-not-exist-approval.json", jobId: "job-stop-002",
    env: { ...baseEnv, YOUTUBE_EMERGENCY_STOP: "false" }
  }), /Metadata file is missing or cannot be inspected/);
});

test("production uploader rejects inputs outside the repository root before reading them", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const { uploadPrivate } = await import("../scripts/upload-private.mjs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-upload-outside-root-"));
  const metadataPath = path.join(dir, "metadata.json");
  fs.writeFileSync(metadataPath, "{}");
  try {
    await assert.rejects(uploadPrivate({
      metadataPath, videoPath: metadataPath, approvalPath: metadataPath, jobId: "job-path-001",
      env: {
        YOUTUBE_CLIENT_ID: "test", YOUTUBE_CLIENT_SECRET: "test", YOUTUBE_REFRESH_TOKEN: "test",
        SONICVHIBEZ_CHANNEL_ID: "UC_SONIC_TEST", CONFIRM_PRIVATE_UPLOAD: "YES",
        YOUTUBE_EMERGENCY_STOP: "false"
      }
    }), /Metadata file must remain inside the repository root/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
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
  assert.match(source, /youtube\.channels\.list\(\{ part: \["id", "snippet", "contentDetails"\], mine: true \}\)/);
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
    const metadata = { channel: "SonicVhibez", channelId: "UC_SONIC_TEST", contentType: "short", visibility: "private", productUrl: "https://selar.com/0u19v8u99l", rightsConfirmed: true, complianceReviewed: true, status: "READY_FOR_PRIVATE_UPLOAD", title: "Test title", description: "Test description", tags: ["wildlife", "documentary", "education"] };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    const videoSha = sha256File(videoPath);
    const thumbnailPath = path.join(dir, "thumbnail.jpg");
    fs.writeFileSync(thumbnailPath, "test-thumbnail");
    const thumbnailSha = sha256File(thumbnailPath);
    const captionsPath = path.join(dir, "captions.srt");
    fs.writeFileSync(captionsPath, "1\n00:00:00,000 --> 00:00:01,000\nTest caption\n");
    const captionsSha = sha256File(captionsPath);
    const sourceAssetPath = path.join(dir, "source-asset.mp4");
    const licenseEvidencePath = path.join(dir, "license-evidence.txt");
    fs.writeFileSync(sourceAssetPath, "test-source-asset-fixture");
    fs.writeFileSync(licenseEvidencePath, "TEST FIXTURE ONLY: mock rights evidence; not a real license.");
    const rightsEvidence = { assetId: "fixture-asset", source: "isolated test fixture", rightsHolder: "test fixture", assetPath: sourceAssetPath, assetSha256: sha256File(sourceAssetPath), licenseEvidenceLocation: licenseEvidencePath, licenseEvidenceSha256: sha256File(licenseEvidencePath), permittedUses: ["YouTube"], restrictions: "mock only", attributionRequirements: "mock only", verificationStatus: "VERIFIED", verifiedBy: "Test Operator", verifiedAt: "2026-10-24T00:00:00.000Z", assets: [{ assetId: "fixture-asset", source: "isolated test fixture", rightsHolder: "test fixture", assetPath: sourceAssetPath, assetSha256: sha256File(sourceAssetPath), licenseEvidenceLocation: licenseEvidencePath, licenseEvidenceSha256: sha256File(licenseEvidencePath), permittedUses: ["YouTube"], restrictions: "mock only", attributionRequirements: "mock only", verificationStatus: "VERIFIED", verifiedBy: "Test Operator", verifiedAt: "2026-10-24T00:00:00.000Z" }] };
    const rightsEvidenceSha256 = (await import("node:crypto")).createHash("sha256").update(JSON.stringify(rightsEvidence)).digest("hex");
    fs.writeFileSync(approvalPath, JSON.stringify({ decision: "APPROVE", jobId: "job-timeout-001", artifactSha256: videoSha, metadataVersion: sha256File(metadataPath), reviewer: "Test Operator", rightsEvidenceSha256, rightsEvidence, publishingEnabled: false, visibility: "private", relatedArtifacts: [{ path: videoPath, sha256: videoSha }, { path: thumbnailPath, sha256: thumbnailSha }, { path: captionsPath, sha256: captionsSha }, { path: metadataPath, sha256: sha256File(metadataPath) }] }));
    const env = { YOUTUBE_CLIENT_ID: "test", YOUTUBE_CLIENT_SECRET: "test", YOUTUBE_REFRESH_TOKEN: "test", SONICVHIBEZ_CHANNEL_ID: "UC_SONIC_TEST", CONFIRM_PRIVATE_UPLOAD: "YES", YOUTUBE_EMERGENCY_STOP: "false", UPLOAD_LOG_DIR: path.join(dir, "logs") };
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
    assert.equal(ledger.attempts[0].format, "short");
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
    const metadata = { channel: "SonicVhibez", channelId: "UC_SONIC_TEST", contentType: "short", visibility: "private", productUrl: "https://selar.com/0u19v8u99l", rightsConfirmed: true, complianceReviewed: true, status: "READY_FOR_PRIVATE_UPLOAD", title: "Test title", description: "Test description", tags: ["wildlife", "documentary", "education"] };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    const videoSha = sha256File(videoPath);
    const thumbnailPath = path.join(dir, "thumbnail.jpg");
    fs.writeFileSync(thumbnailPath, "test-thumbnail");
    const thumbnailSha = sha256File(thumbnailPath);
    const captionsPath = path.join(dir, "captions.srt");
    fs.writeFileSync(captionsPath, "1\n00:00:00,000 --> 00:00:01,000\nTest caption\n");
    const captionsSha = sha256File(captionsPath);
    const sourceAssetPath = path.join(dir, "source-asset.mp4");
    const licenseEvidencePath = path.join(dir, "license-evidence.txt");
    fs.writeFileSync(sourceAssetPath, "test-source-asset-fixture");
    fs.writeFileSync(licenseEvidencePath, "TEST FIXTURE ONLY: mock rights evidence; not a real license.");
    const rightsEvidence = { assetId: "fixture-asset", source: "isolated test fixture", rightsHolder: "test fixture", assetPath: sourceAssetPath, assetSha256: sha256File(sourceAssetPath), licenseEvidenceLocation: licenseEvidencePath, licenseEvidenceSha256: sha256File(licenseEvidencePath), permittedUses: ["YouTube"], restrictions: "mock only", attributionRequirements: "mock only", verificationStatus: "VERIFIED", verifiedBy: "Test Operator", verifiedAt: "2026-10-24T00:00:00.000Z", assets: [{ assetId: "fixture-asset", source: "isolated test fixture", rightsHolder: "test fixture", assetPath: sourceAssetPath, assetSha256: sha256File(sourceAssetPath), licenseEvidenceLocation: licenseEvidencePath, licenseEvidenceSha256: sha256File(licenseEvidencePath), permittedUses: ["YouTube"], restrictions: "mock only", attributionRequirements: "mock only", verificationStatus: "VERIFIED", verifiedBy: "Test Operator", verifiedAt: "2026-10-24T00:00:00.000Z" }] };
    const rightsEvidenceSha256 = (await import("node:crypto")).createHash("sha256").update(JSON.stringify(rightsEvidence)).digest("hex");
    fs.writeFileSync(approvalPath, JSON.stringify({ decision: "APPROVE", jobId: "job-receipt-001", artifactSha256: videoSha, metadataVersion: sha256File(metadataPath), reviewer: "Test Operator", rightsEvidenceSha256, rightsEvidence, publishingEnabled: false, visibility: "private", relatedArtifacts: [{ path: videoPath, sha256: videoSha }, { path: thumbnailPath, sha256: thumbnailSha }, { path: captionsPath, sha256: captionsSha }, { path: metadataPath, sha256: sha256File(metadataPath) }] }));
    const env = { YOUTUBE_CLIENT_ID: "test", YOUTUBE_CLIENT_SECRET: "test", YOUTUBE_REFRESH_TOKEN: "test", SONICVHIBEZ_CHANNEL_ID: "UC_SONIC_TEST", CONFIRM_PRIVATE_UPLOAD: "YES", YOUTUBE_EMERGENCY_STOP: "false", UPLOAD_LOG_DIR: path.join(dir, "logs") };
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
    assert.equal(reconciled.receipt.format, "short");
    assert.ok(reconciled.receipt.actualPublishedAt, "remote actual timestamp must be persisted in the receipt");
    const verifiedLedger = JSON.parse(fs.readFileSync(path.join(env.UPLOAD_LOG_DIR, "upload-attempts.json"), "utf8"));
    assert.equal(verifiedLedger.attempts[0].status, "PRIVATE_UPLOAD_VERIFIED");
    assert.equal(verifiedLedger.attempts[0].format, "short");
    assert.ok(verifiedLedger.attempts[0].actualPublishedAt, "actual timestamp must survive restart in the durable ledger");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});


test("private upload lock prevents concurrent workers and stale locks fail closed", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const { acquireExclusiveUploadLock } = await import("../scripts/upload-private.mjs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-upload-lock-"));
  const lockPath = path.join(dir, "upload-operation.lock");
  try {
    const release = acquireExclusiveUploadLock(lockPath, {
      jobId: "job-lock-001", now: () => new Date("2026-10-24T12:00:00.000Z")
    });
    assert.throws(() => acquireExclusiveUploadLock(lockPath, { jobId: "job-lock-002" }), /active or left a stale lock/);
    const record = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    assert.equal(record.jobId, "job-lock-001");
    release();
    assert.equal(fs.existsSync(lockPath), false);
    const releaseAgain = acquireExclusiveUploadLock(lockPath, { jobId: "job-lock-003" });
    releaseAgain();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test("one-shot upload authorization binds one job and all final hashes to the verified channel", async () => {
  const { validateOneShotUploadAuthorization } = await import("../scripts/upload-private.mjs");
  const input = {
    authorizationId: "auth-private-001",
    decision: "AUTHORIZE_ONE_PRIVATE_UPLOAD",
    jobId: "job-private-001",
    artifactSha256: "a".repeat(64),
    metadataSha256: "b".repeat(64),
    approvalSha256: "c".repeat(64),
    channelId: "UC_SONIC_TEST",
    visibility: "private",
    publishingEnabled: false,
    operator: "Authorized Owner",
    authorizedAt: "2026-10-24T12:00:00.000Z"
  };
  const validated = validateOneShotUploadAuthorization(input, { ...input, now: new Date("2026-10-24T12:30:00.000Z") });
  assert.equal(validated.authorizationId, input.authorizationId);
  assert.equal(validated.operator, "Authorized Owner");
  assert.throws(() => validateOneShotUploadAuthorization({ ...input, artifactSha256: "d".repeat(64) }, { ...input, now: new Date("2026-10-24T12:30:00.000Z") }), /bind the exact job/);
  assert.throws(() => validateOneShotUploadAuthorization({ ...input, visibility: "public" }, { ...input, now: new Date("2026-10-24T12:30:00.000Z") }), /restrict the operation to private/);
  assert.throws(() => validateOneShotUploadAuthorization(input, { ...input, now: new Date("2026-10-26T13:00:00.000Z") }), /no older than 24 hours/);
});
