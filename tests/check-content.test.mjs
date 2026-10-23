import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("approved product config contains only the owner-provided vault URL", () => {
  const config = JSON.parse(fs.readFileSync("config/products.json", "utf8"));
  assert.equal(config.products.length, 1);
  assert.equal(config.products[0].url, "https://selar.com/0u19v8u99l");
  assert.equal(config.products[0].status, "approved");
});

test("example template starts private and cannot pass review by default", () => {
  const example = JSON.parse(fs.readFileSync("content/next-short.example.json", "utf8"));
  assert.equal(example.visibility, "private");
  assert.equal(example.rightsConfirmed, false);
  assert.equal(example.complianceReviewed, false);
  assert.equal(example.productUrl, "https://selar.com/0u19v8u99l");
});

test("all prepared production metadata templates remain blocked until review is complete", async () => {
  const { spawnSync } = await import("node:child_process");
  const templates = [
    "content/next-short.example.json",
    "content/short-001-metadata.example.json",
    "content/short-002-metadata.example.json"
  ];
  for (const templatePath of templates) {
    const result = spawnSync(process.execPath, ["scripts/check-content.mjs", templatePath], {
      encoding: "utf8",
      env: { ...process.env, SONICVHIBEZ_CHANNEL_ID: "UC_TEST_ONLY_NOT_A_REAL_CHANNEL" }
    });
    assert.notEqual(result.status, 0, `${templatePath} must remain blocked until review`);
    assert.match(result.stderr, /BLOCKED/);
    assert.match(result.stderr, /rightsConfirmed/);
    assert.match(result.stderr, /complianceReviewed/);
    assert.match(result.stderr, /READY_FOR_PRIVATE_UPLOAD/);
  }
});

test("channel identity fails closed when configured ID and metadata ID differ", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-channel-check-"));
  const metadataPath = path.join(tempDir, "valid-review.json");
  const metadata = {
    channel: "SonicVhibez",
    channelId: "UC_METADATA_TEST_ID",
    title: "How to Make Better Wildlife Videos for YouTube",
    description: "Practical tips for planning respectful wildlife videos and clear documentary stories.",
    tags: ["wildlife videos", "wildlife filmmaking", "nature documentary"],
    productUrl: "https://selar.com/0u19v8u99l",
    madeForKids: false,
    visibility: "private",
    rightsConfirmed: true,
    complianceReviewed: true
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata));
  try {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync(process.execPath, ["scripts/check-content.mjs", metadataPath], {
      encoding: "utf8",
      env: { ...process.env, SONICVHIBEZ_CHANNEL_ID: "UC_CONFIGURED_TEST_ID" }
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /channelId must be present and match/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("missing metadata fails closed", async () => {
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(process.execPath, ["scripts/check-content.mjs", "content/does-not-exist.json"], {
    encoding: "utf8"
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /metadata file not found/);
});

test("SonicVhibez metadata templates never target the Nature Frontiers channel", () => {
  const forbiddenChannelId = "UCSlkuPfHH78oGC1o418HV4w";
  for (const templatePath of [
    "content/short-001-metadata.example.json",
    "content/short-002-metadata.example.json"
  ]) {
    const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
    assert.notEqual(template.channelId, forbiddenChannelId);
    assert.equal(template.channelId, "REPLACE_WITH_VERIFIED_SONICVHIBEZ_CHANNEL_ID");
    assert.equal(template.visibility, "private");
    assert.equal(template.rightsConfirmed, false);
    assert.equal(template.complianceReviewed, false);
  }
});


test("HOLD metadata cannot pass even when all other metadata fields look ready", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-hold-check-"));
  const metadataPath = path.join(tempDir, "hold.json");
  const channelId = "UC" + "A".repeat(22);
  const metadata = {
    channel: "SonicVhibez",
    channelId,
    status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW",
    targetSeconds: 55,
    title: "How to Make Better Wildlife Videos for YouTube",
    description: "Practical wildlife storytelling tips. https://selar.com/0u19v8u99l",
    tags: ["wildlife videos", "wildlife filmmaking", "nature documentary"],
    productUrl: "https://selar.com/0u19v8u99l",
    madeForKids: false,
    visibility: "private",
    rightsConfirmed: true,
    complianceReviewed: true
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata));
  try {
    const result = (await import("node:child_process")).spawnSync(
      process.execPath, ["scripts/check-content.mjs", metadataPath],
      { encoding: "utf8", env: { ...process.env, SONICVHIBEZ_CHANNEL_ID: channelId } }
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /status must be READY_FOR_PRIVATE_UPLOAD/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});


test("media preflight blocks when human rights and compliance review are missing", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-preflight-"));
  const mediaPath = path.join(tempDir, "placeholder.mp4");
  const metadataPath = path.join(tempDir, "metadata.json");
  fs.writeFileSync(mediaPath, "not real media");
  fs.writeFileSync(metadataPath, JSON.stringify({
    channel: "SonicVhibez",
    title: "Test-only metadata fixture",
    description: "Test-only description for rights-gate coverage.",
    tags: ["wildlife", "test", "fixture"],
    visibility: "private",
    rightsConfirmed: false,
    complianceReviewed: false
  }));
  try {
    const result = (await import("node:child_process")).spawnSync(
      process.execPath, ["scripts/preflight-media.mjs", mediaPath, metadataPath],
      { encoding: "utf8" }
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /rightsConfirmed and complianceReviewed/);
    assert.doesNotMatch(result.stdout + result.stderr, /PASS:/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("media preflight blocks if the video file is missing", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-missing-media-"));
  const metadataPath = path.join(tempDir, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify({ channel: "SonicVhibez", visibility: "private" }));
  try {
    const result = (await import("node:child_process")).spawnSync(
      process.execPath, ["scripts/preflight-media.mjs", path.join(tempDir, "missing.mp4"), metadataPath],
      { encoding: "utf8" }
    );
    assert.equal(result.status, 2);
    assert.match(result.stderr, /video or metadata file does not exist/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
