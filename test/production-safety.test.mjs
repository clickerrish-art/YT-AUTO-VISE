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
const narrationPolicy = JSON.parse(fs.readFileSync("config/narration-voice-candidates.json", "utf8"));
const narrationPolicyHelper = fs.readFileSync("scripts/narration_policy.py", "utf8");
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
  assert.equal(shortTemplate.containsSyntheticMedia, false);
  assert.equal(shortTemplate.containsAIWildlifeVisuals, false);
  assert.equal(shortTemplate.wildlifeVisualSourcePolicy, "ORIGINAL_CREATOR_CAPTURED_ONLY");
  assert.equal(shortTemplate.mediaProvenanceStatus, "NOT_SUPPLIED");
  assert.match(shortTemplate.description, /PAID PROMOTION.*DRAFT DISCLOSURE/i);
  assert.match(shortTemplate.description, /AI NARRATION/i);
  assert.equal(shortTemplate.productUrl, "https://selar.com/0u19v8u99l");
});

test("local narration generation remains disabled while Speechma Andrew browser audition is pending", () => {
  for (const [workflow, disabledJob] of [[narrationWorkflow, "generate:"], [shortNarrationWorkflow, "generate-audio:"]]) {
    assert.match(workflow, /workflow_dispatch/);
    assert.ok(workflow.includes(disabledJob));
    assert.match(workflow, /if: false # Disabled:/);
    assert.doesNotMatch(workflow, /schedule:|cron:/);
    assert.doesNotMatch(workflow, /upload-artifact/i);
  }
  assert.equal(narrationPolicy.ownerDecision.approvedVoiceId, "b5c5b28db1ea408abc7d851202983bdb");
  assert.equal(narrationPolicy.ownerDecision.alternativeVoicesAuthorized, false);
  assert.equal(narrationPolicy.ownerDecision.selectionStatus, "OWNER_SELECTED_SPEECHMA_ANDREW_BROWSER_AUDITION_PENDING");
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.provider, "Speechma");
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.name, "Andrew");
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.manualBrowserOnly, true);
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.automationAllowed, false);
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.securityCodeRequiredPerGeneration, true);
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.maximumCharactersPerStandardConversion, 2000);
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.browserHistoryLocalOnly, true);
  assert.equal(narrationPolicy.ownerDecision.auditionExecutionPolicy.mode, "MANUAL_BROWSER_ONLY");
  assert.equal(narrationPolicy.ownerDecision.auditionExecutionPolicy.officialApiPaid, true);
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.voiceId, null);
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.productionApproved, false);
  assert.equal(narrationPolicy.ownerDecision.selectedAlternative.commercialUseAllowed, true);
  assert.equal(narrationPolicy.ownerDecision.paidUpgradeAuthorized, false);
  assert.equal(narrationPolicy.ownerDecision.commercialRightsStatus, "SPEECHMA_TERMS_GRANT_COMMERCIAL_OUTPUT_LICENSE_SUBJECT_TO_THIRD_PARTY_RIGHTS; NO_AUDIO_GENERATED_OR_APPROVED");
  assert.match(narrationPolicyHelper, /alternativeVoicesAuthorized/);
  assert.match(narrationPolicyHelper, /BLOCKED: Speechma Andrew is the only owner-selected zero-cost audition/);
  for (const generator of [longNarrationGenerator, shortNarrationGenerator]) {
    assert.match(generator, /require_owner_authorized_alternative_voice/);
    assert.match(generator, /not commercially cleared/i);
  }
});

test("non-commercial audio and unverified wildlife media cannot enter the generic renderer", () => {
  assert.match(queuedRenderer, /validate_render_authorization/);
  assert.match(queuedRenderer, /commercialUseAllowed/);
  assert.match(queuedRenderer, /ORIGINAL_CREATOR_CAPTURED/);
  assert.match(queuedRenderer, /BLOCKED: the generic text-only draft renderer is disabled/);
});

test("Pexels stock and AI wildlife visuals remain excluded under original-only policy", () => {
  assert.match(photoThumbnailGenerator, /BLOCKED: Pexels stock-thumbnail generation is disabled/);
  assert.doesNotMatch(photoThumbnailGenerator, /images\.pexels\.com|pexels\.com\/photo/i);
  assert.equal(pexelsRegistry.currentProductionPolicy.stockMediaAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.originalCreatorCapturedMediaRequired, true);
  assert.equal(pexelsRegistry.currentProductionPolicy.aiGeneratedWildlifeVisualsAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.stockVideoFootageAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.pexelsAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.pixabayAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.stockPhotographsAllowed, false);
  assert.match(pexelsAcquisitionWorkflow, /workflow_dispatch/);
  assert.match(pexelsAcquisitionWorkflow, /review_only/);
  assert.match(pexelsAcquisitionWorkflow, /default: true/);
  assert.match(pexelsAcquisitionWorkflow, /if: false # Disabled:/);
  assert.doesNotMatch(pexelsAcquisitionWorkflow, /^\s*push:/m);
  assert.match(pexelsAcquisitionWorkflow, /acquire-crocodile-footage-review\.mjs/);
});

test("quality workflow runs tests and explicitly avoids certifying runtime", () => {
  assert.match(qualityWorkflow, /(?:npm test|node --test)/);
  assert.match(qualityWorkflow, /does not certify a 6-minute runtime/);
  assert.doesNotMatch(qualityWorkflow, /upload-video|publish-video|youtube\.upload/i);
});
