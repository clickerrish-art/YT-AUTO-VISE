import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateMediaRegister } from "../scripts/validate-nature-frontiers-media-register.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const register = JSON.parse(fs.readFileSync(path.join(root, "content/nature-frontiers-media-register.json"), "utf8"));

test("Nature Frontiers imported Pexels assets are registered but remain held", () => {
  const expected = [
    ["nf-pex-elephant-37394148", "37394148", "VAHbNVGS8LM", 14, 3840, 2160],
    ["nf-pex-zebra-wildebeest-5146578", "5146578", "VAHbNQdZTYc", 25, 1920, 1080],
    ["nf-pex-giraffe-5214258", "5214258", "VAHbNT-7Jx4", 21, 1920, 1080]
  ];
  for (const [id, pexelsId, canvaAssetId, duration, width, height] of expected) {
    const asset = register.assets.find(item => item.id === id);
    assert.ok(asset, id + " must exist in the Nature Frontiers register");
    assert.equal(asset.source.assetId, pexelsId);
    assert.equal(asset.source.canvaAssetId, canvaAssetId);
    assert.equal(asset.source.canvaImportVerified, true);
    assert.equal(asset.localFile, null, "Canva metadata is not a local MP4");
    assert.equal(asset.media.durationSeconds, duration);
    assert.equal(asset.media.width, width);
    assert.equal(asset.media.height, height);
    assert.equal(asset.media.sha256, null, "no byte hash may be invented");
    assert.equal(asset.rights.reviewStatus, "not_assessed");
    assert.equal(asset.inspection.status, "not_inspected");
    assert.equal(asset.approval.status, "pending");
    assert.equal(asset.approval.approvedFileSha256, null);
    assert.equal(asset.usage.scheduled, false);
    assert.equal(asset.usage.published, false);
    assert.deepEqual(asset.usage.platformPostIds, []);
    assert.ok(asset.claims.every(claim => claim.status !== "verified"), "listing text is not factual verification");
  }
});

test("Nature Frontiers media register remains structurally valid and fail-closed", () => {
  assert.deepEqual(validateMediaRegister(register), []);
  assert.equal(register.policy.defaultPublicationState, "held");
  assert.equal(register.policy.requireHumanApproval, true);
  assert.equal(register.policy.allowAutomaticPublication, false);
});
