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
  const voiceReview = readJson("../content/media/roderic-heygen-voice-rights-review.json");
  const shortNarration = readJson("../content/short-001-roderic-narration-generation.json");
  assert.equal(voiceReview.providerDenial.status, "DENIED");
  assert.equal(voiceReview.decision, "KEEP_ALL_RODERIC_FREE_PLAN_NARRATION_OUT_OF_PUBLIC_OR_COMMERCIAL_PRODUCTION");
  assert.equal(shortNarration.status, "INTERNAL_AUDITION_ONLY_PROVIDER_DENIED_COMMERCIAL_USE");
  assert.equal(shortNarration.license.commercialUseAllowed, false);
  assert.equal(shortNarration.release.productionUseBlocked, true);
  for (const [path, job] of [
    ["../.github/workflows/piper-voice-audition.yml", "audition"],
    ["../.github/workflows/american-narration-review.yml", "render-review"],
    ["../.github/workflows/banjo-narration-review.yml", "render-review"],
    ["../.github/workflows/generate-long-form-narration.yml", "generate"],
    ["../.github/workflows/free-narration-artifact.yml", "generate-audio"],
    ["../.github/workflows/short-narration-artifact.yml", "generate"],
    ["../.github/workflows/acquire-noaa-broll-candidates.yml", "acquire-candidates"],
    ["../.github/workflows/acquire-short-001-assets.yml", "acquire"],
    ["../.github/workflows/noaa-lobster-thumbnail-review.yml", "thumbnail-review"],

  ]) {
    assert.ok(jobDisabled(readText(path), job), path + " job " + job + " must be disabled");
  }
});

test("Pexels and Pixabay media registers are reference-only, never production footage", () => {
  const nature = readJson("../content/nature-frontiers-media-register.json");
  const short = readJson("../content/short-001-acquisition-manifest.json");
  assert.equal(nature.policy.originalCreatorCapturedMediaRequired, true);
  assert.equal(nature.policy.stockMediaAllowed, false);
  assert.equal(nature.policy.aiGeneratedWildlifeVisualsAllowed, false);
  assert.ok(nature.assets.length > 0);
  assert.ok(nature.assets.every(asset => asset.productionEligibility?.eligible === false));
  assert.ok(nature.assets.every(asset => asset.productionEligibility?.status === "REFERENCE_ONLY_EXCLUDED_BY_ORIGINAL_CAPTURE_POLICY"));
  assert.equal(short.productionDisposition.productionEligible, false);
  assert.ok(short.assets.every(asset => asset.productionEligibility === "EXCLUDED_REFERENCE_ONLY_NOT_ORIGINAL_CREATOR_CAPTURED_MEDIA"));
});

test("AI wildlife generation and stock acquisition paths are disabled", () => {
  const generation = readJson("../config/video-generation.json");
  const notebook = readJson("../notebooks/sonicvhibez_wangp_kaggle.ipynb");
  const acquisitionScript = readText("../scripts/acquire-short-001-assets.mjs");
  const importer = readText("../scripts/import_wangp_kaggle_output.py");
  assert.equal(generation.status, "DISABLED_BY_ORIGINAL_CREATOR_CAPTURED_MEDIA_POLICY");
  assert.equal(generation.primary, false);
  assert.equal(generation.generation.enabled, false);
  assert.equal(generation.safety.aiGeneratedWildlifeVisualsAllowed, false);
  const codeCells = notebook.cells.filter(cell => cell.cell_type === "code");
  assert.ok(codeCells.length > 0);
  assert.ok(codeCells.every(cell => (Array.isArray(cell.source) ? cell.source.join("") : cell.source)
    .startsWith('raise RuntimeError("DISABLED_BY_OWNER_ORIGINAL_CAPTURE_POLICY')));
  assert.ok(acquisitionScript.includes("Pexels stock acquisition is disabled"));
  assert.ok(acquisitionScript.indexOf("Pexels stock acquisition is disabled") < acquisitionScript.indexOf("await fsp.mkdir(MEDIA_ROOT"));
  assert.ok(importer.includes("AI-generated wildlife media is disabled by the current original creator-captured-media policy"));
});

test("NOAA and stock-library source records remain excluded from current production", () => {
  const noaa = readJson("../content/asset-candidates/noaa-spiny-lobsters-california.json");
  assert.equal(noaa.currentProductionDisposition.productionEligible, false);
  assert.equal(noaa.ownerAuthorization.currentStatus, "SUPERSEDED_BY_2026-11-21_ORIGINAL_MEDIA_POLICY");
  assert.equal(noaa.publication.allowed, false);
  for (const path of [
    "../content/media/pexels-crocodile-30026544-rights-review.json",
    "../content/media/wikimedia-kruger-tilapia-2015-rights-review.json",
    "../content/media/wikimedia-nairobi-crocodile-2025-rights-review.json",
    "../content/media/wikimedia-wildebeest-ambush-2016-rights-review.json"
  ]) {
    const record = readJson(path);
    assert.equal(record.currentProductionDisposition.productionEligible, false, path);
    assert.equal(record.status, "REFERENCE_ONLY_EXCLUDED_BY_ORIGINAL_CAPTURE_POLICY", path);
  }
  const thumbnailScript = readText("../scripts/create-noaa-lobster-thumbnail-review.py");
  assert.ok(thumbnailScript.includes("BLOCKED: NOAA B-roll is stock/archive footage"));
});
