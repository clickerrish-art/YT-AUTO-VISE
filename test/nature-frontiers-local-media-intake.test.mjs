import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { registerLocalMedia, persistRegister } from "../scripts/register-nature-frontiers-local-media.mjs";
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
