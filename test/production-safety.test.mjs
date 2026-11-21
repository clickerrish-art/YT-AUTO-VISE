import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
const narrationWorkflow = fs.readFileSync(".github/workflows/generate-long-form-narration.yml", "utf8");
const shortNarrationWorkflow = fs.readFileSync(".github/workflows/free-narration-artifact.yml", "utf8");
const qualityWorkflow = fs.readFileSync(".github/workflows/content-quality.yml", "utf8");
const readiness = fs.readFileSync("scripts/production-readiness.mjs", "utf8");
const longRenderer = fs.readFileSync("scripts/render-long-form.mjs", "utf8");
const shortTemplate = JSON.parse(fs.readFileSync("content/next-short.example.json", "utf8"));
const longNarrationGenerator = fs.readFileSync("scripts/generate_long_form_narration.py", "utf8");
const shortNarrationGenerator = fs.readFileSync("scripts/generate-narration.py", "utf8");
const queuePackageGenerator = fs.readFileSync("scripts/generate-queue-package.py", "utf8");
const queuedRenderer = fs.readFileSync("scripts/render-queued-draft.py", "utf8");
const photoThumbnailGenerator = fs.readFileSync("scripts/render-photo-thumbnail.py", "utf8");
const pexelsRegistry = JSON.parse(fs.readFileSync("content/approved-pexels-footage.json", "utf8"));
const pexelsAcquisitionWorkflow = fs.readFileSync(".github/workflows/acquire-short-001-assets.yml", "utf8");

test("production remains gated and target is SonicVhibez only", () => {
  assert.equal(queue.publishingEnabled, false);
  assert.match(readiness, /publishingEnabled !== false/);
  assert.match(readiness, /metadata\.visibility !== "private"/);
  assert.match(longRenderer, /m\.channel !== "SonicVhibez"/);
  assert.match(longRenderer, /m\.rightsConfirmed !== true/);
  assert.match(longRenderer, /m\.complianceReviewed !== true/);
});

test("Short metadata template contains required disclosures and stays gated", () => {
  assert.equal(shortTemplate.channel, "SonicVhibez");
  assert.equal(shortTemplate.status, "DRAFT_REVIEW_REQUIRED");
  assert.equal(shortTemplate.visibility, "private");
  assert.equal(shortTemplate.rightsConfirmed, false);
  assert.equal(shortTemplate.complianceReviewed, false);
  assert.equal(shortTemplate.hasPaidPromotion, true);
  assert.equal(shortTemplate.containsSyntheticMedia, true);
  assert.equal(shortTemplate.containsAIWildlifeVisuals, false);
  assert.equal(shortTemplate.wildlifeVisualSourcePolicy, "ORIGINAL_CREATOR_CAPTURED_ONLY");
  assert.equal(shortTemplate.mediaProvenanceStatus, "UNVERIFIED");
  assert.match(shortTemplate.description, /promotional disclosure/i);
  assert.match(shortTemplate.description, /AI NARRATION/i);
  assert.equal(shortTemplate.productUrl, "https://selar.com/0u19v8u99l");
});

test("Edge TTS workflows are manual-only and require explicit non-commercial acknowledgement", () => {
  for (const workflow of [narrationWorkflow, shortNarrationWorkflow]) {
    assert.match(workflow, /workflow_dispatch/);
    assert.match(workflow, /allow_noncommercial_audition/);
    assert.match(workflow, /default: false/);
    assert.match(workflow, /if:.*inputs\.allow_noncommercial_audition == true/);
    assert.match(workflow, /branches: \[main\]/);
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /cron:/);
    assert.match(workflow, /github\.event_name == 'workflow_dispatch' && inputs\.allow_noncommercial_audition == true/);
    assert.match(workflow, /--allow-noncommercial-audition/);
  }
  for (const generator of [longNarrationGenerator, shortNarrationGenerator, queuePackageGenerator]) {
    assert.match(generator, /require_noncommercial_audition/);
    assert.match(generator, /not commercially cleared/i);
  }
});

test("non-commercial audio and unverified wildlife media cannot enter the generic renderer", () => {
  assert.match(queuedRenderer, /validate_render_authorization/);
  assert.match(queuedRenderer, /commercialUseAllowed/);
  assert.match(queuedRenderer, /ORIGINAL_CREATOR_CAPTURED/);
  assert.match(queuedRenderer, /BLOCKED: the generic text-only draft renderer is disabled/);
});

test("Pexels stock thumbnail generation is disabled and historical selections are reference-only", () => {
  assert.match(photoThumbnailGenerator, /BLOCKED: Pexels stock-thumbnail generation is disabled/);
  assert.doesNotMatch(photoThumbnailGenerator, /images\.pexels\.com|pexels\.com\/photo/i);
  assert.equal(pexelsRegistry.currentProductionPolicy.stockMediaAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.originalCreatorCapturedMediaRequired, true);
  assert.match(pexelsAcquisitionWorkflow, /workflow_dispatch/);
  assert.match(pexelsAcquisitionWorkflow, /reference_only/);
  assert.match(pexelsAcquisitionWorkflow, /default: false/);
  assert.match(pexelsAcquisitionWorkflow, /if:.*inputs\\.reference_only == true/);
  assert.doesNotMatch(pexelsAcquisitionWorkflow, /^\\s*(push|pull_request|schedule):/m);
});

test("quality workflow runs tests and explicitly avoids certifying runtime", () => {
  assert.match(qualityWorkflow, /node --test/);
  assert.match(qualityWorkflow, /does not certify a 6-minute runtime/);
  assert.doesNotMatch(qualityWorkflow, /upload-video|publish-video|youtube\.upload/i);
});
