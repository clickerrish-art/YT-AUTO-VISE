import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

const readText = path => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const readJson = path => JSON.parse(readText(path));
const gitBlobSha = text => {
  const body = Buffer.from(text, "utf8");
  const header = Buffer.from("blob " + body.length + "\0", "utf8");
  return crypto.createHash("sha1").update(Buffer.concat([header, body])).digest("hex");
};
const jobDisabled = (yaml, job) => new RegExp("jobs:\\s*\\n\\s*" + job + ":\\s*\\n\\s*if:\\s*false\\b").test(yaml);

test("Long-form manifest pins current script and scientific review and remains blocked", () => {
  const manifest = readJson("../content/long-form-render-manifest.json");
  const script = readText("../content/drafts/long-form-001-two-eyes-above-water.md");
  const review = readText("../content/assets/long-form-001-scientific-claim-review.md");
  assert.equal(manifest.sourceScriptBlobSha, gitBlobSha(script));
  assert.equal(manifest.scientificReviewBlobSha, gitBlobSha(review));
  assert.equal(manifest.status, "BLOCKED_NOT_RENDERABLE_COMMERCIAL_NARRATION_AND_FOOTAGE_MISSING");
  assert.equal(manifest.rightsConfirmed, false);
  assert.equal(manifest.complianceReviewed, false);
  assert.equal(manifest.footageLicenseEvidence, "");
  assert.equal(manifest.narrationRightsDeterminationEvidence, "heygen-roderic-commercial-rights-determination-2026-11-21.json");
});

test("Short manifest pins exact source files and excludes Pexels stock from production", () => {
  const manifest = readJson("../content/render-manifest.json");
  assert.equal(manifest.sourceScriptBlobSha, gitBlobSha(readText("../content/short-001-wildlife-video-storytelling.md")));
  assert.equal(manifest.captionSourceBlobSha, gitBlobSha(readText("../content/short-001-wildlife-video-storytelling.srt")));
  assert.equal(manifest.sourceHashType, "GIT_BLOB_SHA");
  assert.equal(manifest.captionHashType, "GIT_BLOB_SHA");
  assert.equal(manifest.footageLicenseEvidence, "");
  assert.equal(manifest.footageEligibilityStatus, "EXCLUDED_PEXELS_STOCK_NOT_ORIGINAL_CREATOR_CAPTURED_MEDIA");
  assert.equal(manifest.status, "BLOCKED_NOT_RENDERABLE");
  assert.equal(manifest.rightsConfirmed, false);
  assert.equal(manifest.complianceReviewed, false);
});

test("HeyGen denial is recorded and all unapproved narration workflows are disabled", () => {
  const rights = readJson("../content/heygen-roderic-commercial-rights-determination-2026-11-21.json");
  assert.equal(rights.providerDetermination.status, "DENIED");
  assert.equal(rights.providerDetermination.zeroCostCommercialExceptionAvailable, false);
  assert.equal(rights.providerDetermination.existingFreePlanOutputsCommerciallyUsable, false);
  assert.equal(rights.providerDetermination.futureFreePlanGenerationsCommerciallyUsable, false);
  for (const [path, job] of [
    ["../.github/workflows/piper-voice-audition.yml", "audition"],
    ["../.github/workflows/american-narration-review.yml", "render-review"],
    ["../.github/workflows/banjo-narration-review.yml", "render-review"],
    ["../.github/workflows/generate-long-form-narration.yml", "generate"],
    ["../.github/workflows/free-narration-artifact.yml", "generate-audio"],
    ["../.github/workflows/short-narration-artifact.yml", "generate"]
  ]) {
    assert.ok(jobDisabled(readText(path), job), path + " job " + job + " must be disabled");
  }
});
