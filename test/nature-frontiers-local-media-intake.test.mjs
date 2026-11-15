import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { registerLocalMedia, persistRegister, extractVideoTechnicalMetadata, parseIntakeArguments, runLocalMediaIntake } from "../scripts/register-nature-frontiers-local-media.mjs";
import { validateMediaRegister } from "../scripts/validate-nature-frontiers-media-register.mjs";

const ASSET_ID = "nf-pex-giraffe-5220275";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nf-media-"));
  fs.mkdirSync(path.join(root, "media/nature-frontiers"), { recursive: true });
  fs.writeFileSync(path.join(root, "media/nature-frontiers/clip.mp4"), "real local media bytes");
  const register = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/nature-frontiers-media-register.json"), "utf8"));
  register.assets = [structuredClone(register.assets.find(asset => asset.id === ASSET_ID))];
  return { root, register };
}

test("records exact local bytes with SHA-256 without clearing inspection, rights or approval", () => {
  const { root, register } = fixture();
  const result = registerLocalMedia({ register, assetId: ASSET_ID, filePath: "media/nature-frontiers/clip.mp4", root });
  assert.equal(result.sha256, crypto.createHash("sha256").update("real local media bytes").digest("hex"));
  assert.equal(register.assets[0].localFile.sha256, result.sha256);
  assert.equal(register.assets[0].media.byteSize, Buffer.byteLength("real local media bytes"));
  assert.equal(register.assets[0].inspection.status, "not_inspected");
  assert.equal(register.assets[0].rights.reviewStatus, "not_assessed");
  assert.equal(register.assets[0].approval.status, "pending");
  assert.deepEqual(validateMediaRegister(register), []);
});

test("rejects files outside the dedicated local media directory", () => {
  const { root, register } = fixture();
  fs.writeFileSync(path.join(root, "outside.mp4"), "bytes");
  assert.throws(() => registerLocalMedia({ register, assetId: ASSET_ID, filePath: "outside.mp4", root }), /must be stored under/);
});

test("rejects missing, empty and symlink-escaped media files", () => {
  const { root, register } = fixture();
  assert.throws(() => registerLocalMedia({ register, assetId: ASSET_ID, filePath: "media/nature-frontiers/missing.mp4", root }));
  fs.writeFileSync(path.join(root, "media/nature-frontiers/empty.mp4"), "");
  assert.throws(() => registerLocalMedia({ register, assetId: ASSET_ID, filePath: "media/nature-frontiers/empty.mp4", root }), /must not be empty/);
  const outside = path.join(root, "outside");
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "escape.mp4"), "outside bytes");
  fs.symlinkSync(outside, path.join(root, "media/nature-frontiers/linked"));
  assert.throws(() => registerLocalMedia({ register, assetId: ASSET_ID, filePath: "media/nature-frontiers/linked/escape.mp4", root }), /resolves outside/);
});

test("rejects unknown IDs and approved or already-used assets", () => {
  const { root, register } = fixture();
  assert.throws(() => registerLocalMedia({ register, assetId: "missing", filePath: "media/nature-frontiers/clip.mp4", root }), /unknown asset ID/);
  register.assets[0].approval.status = "approved";
  assert.throws(() => registerLocalMedia({ register, assetId: ASSET_ID, filePath: "media/nature-frontiers/clip.mp4", root }), /approval is pending/);
  register.assets[0].approval.status = "pending";
  register.assets[0].usage.scheduled = true;
  assert.throws(() => registerLocalMedia({ register, assetId: ASSET_ID, filePath: "media/nature-frontiers/clip.mp4", root }), /scheduled or published/);
});

test("persists register atomically as ordinary JSON", () => {
  const { root, register } = fixture();
  const target = path.join(root, "register.json");
  persistRegister(target, register);
  assert.deepEqual(JSON.parse(fs.readFileSync(target, "utf8")), register);
  assert.equal(fs.readdirSync(root).filter(name => name.endsWith(".tmp")).length, 0);
});

test("extracts technical video metadata from ffprobe without changing review or rights gates", () => {
  const payload = JSON.stringify({
    format: { duration: "12.5" },
    streams: [
      { codec_type: "video", codec_name: "h264", width: 1920, height: 1080, avg_frame_rate: "30000/1001" },
      { codec_type: "audio", codec_name: "aac" }
    ]
  });
  const metadata = extractVideoTechnicalMetadata("/tmp/clip.mp4", { run: () => payload });
  assert.equal(metadata.extractor, "ffprobe");
  assert.equal(metadata.width, 1920);
  assert.equal(metadata.height, 1080);
  assert.ok(Math.abs(metadata.frameRate - 29.97002997) < 0.000001);
  const { root, register } = fixture();
  registerLocalMedia({ register, assetId: ASSET_ID, filePath: "media/nature-frontiers/clip.mp4", root, technicalMetadata: metadata });
  assert.deepEqual(register.assets[0].media.technical, metadata);
  assert.equal(register.assets[0].inspection.status, "not_inspected");
  assert.equal(register.assets[0].rights.reviewStatus, "not_assessed");
  assert.equal(register.assets[0].approval.status, "pending");
});

test("rejects failed, malformed, incomplete and non-video ffprobe results", () => {
  assert.throws(() => extractVideoTechnicalMetadata("/tmp/clip.mp4", { run: () => { throw new Error("not installed"); } }), /ffprobe failed/);
  assert.throws(() => extractVideoTechnicalMetadata("/tmp/clip.mp4", { run: () => "not json" }), /invalid JSON/);
  assert.throws(() => extractVideoTechnicalMetadata("/tmp/clip.mp4", { run: () => JSON.stringify({ format: { duration: "2" }, streams: [] }) }), /no video stream/);
  assert.throws(() => extractVideoTechnicalMetadata("/tmp/clip.mp4", { run: () => JSON.stringify({ format: { duration: "2" }, streams: [{ codec_type: "video", codec_name: "h264", width: 0, height: 1080, avg_frame_rate: "0/0" }] }) }), /incomplete or invalid/);
});

test("parses intake CLI arguments and rejects ambiguous or unknown options", () => {
  assert.deepEqual(parseIntakeArguments(["asset-1", "media/nature-frontiers/a.mp4", "--probe"]), {
    assetId: "asset-1", filePath: "media/nature-frontiers/a.mp4", registerPath: "content/nature-frontiers-media-register.json", probeRequested: true
  });
  assert.throws(() => parseIntakeArguments(["asset-1", "clip.mp4", "--probe", "--probe"]), /only be supplied once/);
  assert.throws(() => parseIntakeArguments(["asset-1", "clip.mp4", "--surprise"]), /unknown option/);
  assert.throws(() => parseIntakeArguments(["asset-1"]), /expected asset ID/);
});

test("CLI runner persists only after successful probe and register validation", () => {
  const { root, register } = fixture();
  fs.mkdirSync(path.join(root, "content"), { recursive: true });
  const registerPath = path.join(root, "content/nature-frontiers-media-register.json");
  fs.writeFileSync(registerPath, JSON.stringify(register));
  const before = fs.readFileSync(registerPath, "utf8");
  assert.throws(() => runLocalMediaIntake({
    args: [ASSET_ID, "media/nature-frontiers/clip.mp4", registerPath, "--probe"],
    root,
    runProbe: () => "not-json"
  }), /invalid JSON/);
  assert.equal(fs.readFileSync(registerPath, "utf8"), before);
  const payload = JSON.stringify({
    format: { duration: "12.5" },
    streams: [{ codec_type: "video", codec_name: "h264", width: 1920, height: 1080, avg_frame_rate: "30/1" }]
  });
  const result = runLocalMediaIntake({
    args: [ASSET_ID, "media/nature-frontiers/clip.mp4", registerPath, "--probe"],
    root,
    runProbe: () => payload
  });
  assert.equal(result.technicalMetadata.durationSeconds, 12.5);
  const saved = JSON.parse(fs.readFileSync(registerPath, "utf8"));
  assert.equal(saved.assets[0].media.technical.videoCodec, "h264");
  assert.equal(saved.assets[0].inspection.status, "not_inspected");
  assert.equal(saved.assets[0].rights.reviewStatus, "not_assessed");
  assert.equal(saved.assets[0].approval.status, "pending");
  assert.deepEqual(validateMediaRegister(saved), []);
});
