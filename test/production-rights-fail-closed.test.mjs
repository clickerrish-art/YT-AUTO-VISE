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
  assert.equal(manifest.status, "BLOCKED_ORIGINAL_CREATOR_CAPTURED_FOOTAGE_REQUIRED");
  assert.equal(manifest.footageAcquisitionStatus, "ACQUIRED_FOR_REVIEW_NOT_RELEASE_CLEARED");
  assert.equal(manifest.footageAcquisitionArtifact.assetCount, 6);
  assert.equal(manifest.footageAcquisitionArtifact.fullDecodePasses, 6);
  assert.equal(manifest.footageAcquisitionArtifact.latestArtifactId, 14736582634);
  assert.equal(manifest.footageAcquisitionArtifact.totalActualSourceSeconds, 151.819967);
  assert.equal(manifest.footageCandidates.length, 5);
  assert.ok(manifest.footageCandidates.every(asset => asset.status === "ACQUIRED_FOR_REVIEW_NOT_RELEASE_CLEARED" && asset.fullDecode === "PASS" && /^[a-f0-9]{64}$/.test(asset.sha256) && asset.releaseEligible === false));
  assert.equal(manifest.supplementalFootageCandidates.length, 1);
  assert.equal(manifest.supplementalFootageCandidates[0].status, "ACQUIRED_FOR_REVIEW_SHA_PENDING_EXTRACTION");
  assert.equal(manifest.supplementalFootageCandidates[0].acquisitionArtifactId, 14736582634);
  assert.equal(manifest.supplementalFootageCandidates[0].fullDecode, "PASS");
  assert.equal(manifest.supplementalFootageCandidates[0].sha256, null);
  assert.equal(manifest.rightsConfirmed, false);
  assert.equal(manifest.complianceReviewed, false);
  assert.equal(manifest.footageLicenseEvidence, "");
  assert.equal(manifest.footageOrigin, "ai_generated");
  assert.equal(manifest.creatorCapturedOriginal, false);
  assert.equal(manifest.stockVideoFootageAllowed, false);
  assert.equal(manifest.originalCreatorCapturedMediaRequired, true);
  assert.equal(manifest.stockMediaAllowed, false);
  assert.equal(manifest.stockPhotographsAllowed, false);
  assert.equal(manifest.aiGeneratedWildlifeVisualsAllowed, true);
  assert.equal(manifest.projectPolicyExceptionId, "SONICVHIBEZ_NILE_CROCODILE_AI_VISUALS_2026_11");
  assert.equal(manifest.containsAIWildlifeVisuals, true);
  assert.equal(manifest.syntheticMediaDisclosureRequired, true);
  assert.equal(manifest.aiGenerationStatus, "OWNER_APPROVED_PROJECT_EXCEPTION_PENDING_SOURCE_EVIDENCE");
  assert.equal(manifest.aiGenerationEvidencePath, "");
  assert.equal(manifest.narrationRightsDeterminationEvidence, "");
});

test("Short manifest pins exact source files and blocks Pexels stock from production", () => {
  const manifest = readJson("../content/render-manifest.json");
  assert.equal(manifest.sourceScriptBlobSha, gitBlobSha(readText("../content/short-001-wildlife-video-storytelling.md")));
  assert.equal(manifest.captionSourceBlobSha, gitBlobSha(readText("../content/short-001-wildlife-video-storytelling.srt")));
  assert.equal(manifest.sourceHashType, "GIT_BLOB_SHA");
  assert.equal(manifest.captionHashType, "GIT_BLOB_SHA");
  assert.equal(manifest.footageLicenseEvidence, "");
  assert.equal(manifest.footageEligibilityStatus, "BLOCKED_ORIGINAL_CREATOR_CAPTURED_FOOTAGE_REQUIRED");
  assert.equal(manifest.footageOrigin, "creator_captured_original");
  assert.equal(manifest.stockVideoFootageAllowed, false);
  assert.equal(manifest.originalCreatorCapturedMediaRequired, true);
  assert.equal(manifest.stockMediaAllowed, false);
  assert.equal(manifest.stockPhotographsAllowed, false);
  assert.equal(manifest.aiGeneratedWildlifeVisualsAllowed, false);
  assert.equal(manifest.status, "BLOCKED_ORIGINAL_CREATOR_CAPTURED_FOOTAGE_REQUIRED");
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
    ["../.github/workflows/noaa-lobster-thumbnail-review.yml", "thumbnail-review"],

  ]) {
    assert.ok(jobDisabled(readText(path), job), path + " job " + job + " must be disabled");
  }
});

test("Nature Frontiers remains original-capture-only while SonicVhibez uses its separate AI reconstruction policy", () => {
  const nature = readJson("../content/nature-frontiers-media-register.json");
  const short = readJson("../content/short-001-acquisition-manifest.json");
  const owner = readJson("../content/owner-media-policy-override-2026-11-22.json");
  const acquisitionWorkflow = readText("../.github/workflows/acquire-short-001-assets.yml");
  assert.equal(nature.policy.originalCreatorCapturedMediaRequired, true);
  assert.equal(nature.policy.stockMediaAllowed, false);
  assert.equal(nature.policy.aiGeneratedWildlifeVisualsAllowed, false);
  assert.ok(nature.assets.length > 0);
  assert.ok(nature.assets.every(asset => asset.productionEligibility?.eligible === false));
  assert.ok(nature.assets.every(asset => asset.productionEligibility?.status === "REFERENCE_ONLY_EXCLUDED_BY_ORIGINAL_CAPTURE_POLICY"));
  assert.equal(owner.status, "REVOKED_UNSUPPORTED_OWNER_ATTRIBUTION");
  assert.equal(owner.mediaRules.pexelsLicensedStockAllowed, false);
  assert.equal(owner.mediaRules.pixabayLicensedStockAllowed, false);
  assert.equal(owner.mediaRules.stockVideoFootageAllowed, false);
  assert.match(acquisitionWorkflow, /if: false # Disabled:/);
  assert.doesNotMatch(acquisitionWorkflow, /^\s*push:/m);
  assert.equal(owner.mediaRules.originalCreatorCapturedMediaRequired, true);
  assert.equal(owner.mediaRules.stockPhotographsAllowed, false);
  assert.equal(owner.mediaRules.aiGeneratedWildlifeVisualsAllowed, false);
  assert.equal(owner.releaseGates.publicOrUnattendedPublishingRemainsDisabled, true);
  const sonicPolicy = readJson("../config/media-production-policy.json");
  assert.equal(sonicPolicy.policyScope.brand, "SonicVhibez");
  assert.equal(sonicPolicy.policyScope.platforms.includes("youtube"), true);
  assert.equal(sonicPolicy.policyScope.notApplicableTo.includes("Nature Frontiers"), true);
  assert.equal(short.productionDisposition.policy.aiGeneratedWildlifeVisualsAllowed, false);
  assert.equal(short.productionDisposition.policy.originalCreatorCapturedMediaRequired, true);
  assert.equal(short.productionDisposition.productionEligible, false);
  assert.equal(short.productionDisposition.reviewRenderEligible, true);
  assert.equal(short.assets.filter(asset => asset.productionEligibility === "REVIEW_ONLY_EXCLUDED_FROM_PRODUCTION_ORIGINAL_CAPTURE_REQUIRED").length, 3);
  assert.equal(short.assets.filter(asset => asset.productionEligibility === "EXCLUDED_EDITORIAL_VISIBLE_ENCLOSURE_AND_PARTIAL_PERSON").length, 1);
  assert.ok(short.assets.every(asset => asset.releaseEligible === false && asset.rightsVerified === false));
});

test("AI wildlife generation and Pexels acquisition remain disabled under original-only policy", () => {
  const generation = readJson("../config/video-generation.json");
  const notebook = readJson("../notebooks/sonicvhibez_wangp_kaggle.ipynb");
  const acquisitionScript = readText("../scripts/acquire-short-001-assets.mjs");
  const importer = readText("../scripts/import_wangp_kaggle_output.py");
  assert.equal(generation.status, "DISABLED_BY_OWNER_ORIGINAL_WILDLIFE_MEDIA_POLICY");
  assert.equal(generation.primary, false);
  assert.equal(generation.generation.enabled, false);
  assert.equal(generation.safety.aiGeneratedWildlifeVisualsAllowed, false);
  assert.equal(generation.safety.stockVideoFootageAllowed, false);
  assert.equal(generation.safety.originalCreatorCapturedMediaRequired, true);
  assert.equal(generation.safety.stockMediaAllowed, false);
  assert.equal(generation.safety.pexelsAllowed, false);
  assert.equal(generation.safety.pixabayAllowed, false);
  assert.equal(generation.safety.stockPhotographsAllowed, false);
  const codeCells = notebook.cells.filter(cell => cell.cell_type === "code");
  assert.ok(codeCells.length > 0);
  assert.ok(codeCells.every(cell => (Array.isArray(cell.source) ? cell.source.join("") : cell.source)
    .startsWith('raise RuntimeError("DISABLED_BY_OWNER_ORIGINAL_MEDIA_POLICY')));
  assert.ok(acquisitionScript.includes("OWNER_POLICY_PATH"));
  assert.ok(acquisitionScript.includes("owner.status !== \"ACTIVE_WITH_ASSET_LEVEL_REVIEW_GATES\""));
  assert.ok(acquisitionScript.includes("owner.mediaRules?.pexelsLicensedStockAllowed !== true"));
  assert.ok(acquisitionScript.includes("policy.stockMediaAllowed !== true"));
  assert.ok(acquisitionScript.includes("policy.stockVideoFootageAllowed !== true"));
  assert.ok(acquisitionScript.includes("policy.stockPhotographsAllowed !== false"));
  assert.ok(acquisitionScript.includes('"pexels-11528208"'));
  assert.ok(!acquisitionScript.includes('"pexels-31702128"'));
  assert.ok(acquisitionScript.includes("full decode "));
  assert.ok(importer.includes("AI-generated wildlife media is disabled by the current owner media policy"));
});

test("NOAA, Wikimedia and Pexels stock remain excluded from production while reference records are retained", () => {
  const noaa = readJson("../content/asset-candidates/noaa-spiny-lobsters-california.json");
  assert.equal(noaa.currentProductionDisposition.productionEligible, false);
  assert.equal(noaa.ownerAuthorization.currentStatus, "SUPERSEDED_BY_2026-11-21_ORIGINAL_MEDIA_POLICY");
  assert.equal(noaa.publication.allowed, false);
  for (const path of [
    "../content/media/wikimedia-kruger-tilapia-2015-rights-review.json",
    "../content/media/wikimedia-nairobi-crocodile-2025-rights-review.json",
    "../content/media/wikimedia-wildebeest-ambush-2016-rights-review.json"
  ]) {
    const record = readJson(path);
    assert.equal(record.currentProductionDisposition.productionEligible, false, path);
    assert.equal(record.status, "REFERENCE_ONLY_EXCLUDED_BY_ORIGINAL_CAPTURE_POLICY", path);
  }
  for (const path of [
    "../content/media/pexels-crocodile-30026544-rights-review.json",
    "../content/media/pexels-lion-19773061-rights-review.json"
  ]) {
    const record = readJson(path);
    assert.equal(record.status, "REFERENCE_ONLY_EXCLUDED_BY_ORIGINAL_CAPTURE_POLICY", path);
    assert.equal(record.currentProductionDisposition.status, "EXCLUDED_REFERENCE_ONLY", path);
    assert.equal(record.currentProductionDisposition.productionEligible, false, path);
    assert.equal(record.currentProductionDisposition.policy, "ORIGINAL_CREATOR_CAPTURED_MEDIA_REQUIRED", path);
    assert.notEqual(record.currentProductionDisposition.reviewEligible, true, path);
    assert.notEqual(record.currentProductionDisposition.releaseEligible, true, path);
  }
  const candidates = readJson("../content/media/pexels-crocodile-candidates-2026-11-22.json");
  assert.equal(candidates.assets.length, 6);
  assert.equal(candidates.assets.filter(asset => asset.status === "ACQUIRED_IN_REVIEW_ARTIFACT_SHA256_AND_FULL_DECODE_PASS").length, 5);
  assert.equal(candidates.assets.filter(asset => asset.status === "ACQUIRED_IN_REVIEW_ARTIFACT_SHA256_PENDING_EXTRACTION_FULL_DECODE_PASS").length, 1);
  const supplemental = candidates.assets.find(asset => asset.assetId === "pexels-video-20443910");
  assert.equal(supplemental.acquisitionArtifactId, 14736582634);
  assert.equal(supplemental.acquisitionWorkflowRunId, 44978618279);
  assert.equal(supplemental.localOriginalBytesAvailableInArtifact, true);
  assert.equal(supplemental.sha256, null);
  assert.equal(supplemental.sha256Status, "RECORDED_IN_ACQUISITION_MANIFEST_PENDING_EXTRACTION");
  assert.equal(supplemental.fullDecode, "PASS");
  assert.ok(candidates.assets.every(asset => asset.releaseEligible === false && asset.rightsVerified === false && asset.humanReviewed === false));
  const pexelsRegistry = readJson("../content/approved-pexels-footage.json");
  assert.equal(pexelsRegistry.currentProductionPolicy.stockMediaAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.originalCreatorCapturedMediaRequired, true);
  assert.equal(pexelsRegistry.currentProductionPolicy.pexelsAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.pixabayAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.aiGeneratedWildlifeVisualsAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.stockVideoFootageAllowed, false);
  assert.equal(pexelsRegistry.currentProductionPolicy.stockPhotographsAllowed, false);
  const thumbnailScript = readText("../scripts/create-noaa-lobster-thumbnail-review.py");
  assert.ok(thumbnailScript.includes("BLOCKED: NOAA B-roll is stock/archive footage"));
});

test("Pexels acquisition fails closed while the owner media policy is revoked", () => {
  const shortAcquisition = readText("../scripts/acquire-short-001-assets.mjs");
  const crocodileAcquisition = readText("../scripts/acquire-crocodile-footage-review.mjs");
  const workflow = readText("../.github/workflows/validate-automation.yml");
  const acquisitionWorkflow = readText("../.github/workflows/acquire-short-001-assets.yml");
  const owner = readJson("../content/owner-media-policy-override-2026-11-22.json");
  assert.equal(owner.status, "REVOKED_UNSUPPORTED_OWNER_ATTRIBUTION");
  assert.equal(owner.mediaRules.stockVideoFootageAllowed, false);
  assert.ok(shortAcquisition.includes("owner.status !== \"ACTIVE_WITH_ASSET_LEVEL_REVIEW_GATES\""));
  assert.ok(shortAcquisition.includes("rightsVerified: false"));
  assert.ok(shortAcquisition.includes("humanReviewed: false"));
  assert.ok(shortAcquisition.includes("releaseEligible: false"));
  assert.ok(shortAcquisition.includes("full decode "));
  assert.ok(crocodileAcquisition.includes("fullDecode: \"PASS\""));
  assert.ok(crocodileAcquisition.includes("releaseEligible: false"));
  assert.ok(crocodileAcquisition.includes("publicPublishingEnabled:false"));
  assert.ok(crocodileAcquisition.includes("owner.mediaRules.stockVideoFootageAllowed !== true"));
  assert.ok(crocodileAcquisition.includes("owner.mediaRules.stockPhotographsAllowed !== false"));
  assert.ok(!/id:\s*"pexels-20443910"/.test(crocodileAcquisition), "supplemental clip must remain excluded from the automatic asset list");
  assert.match(crocodileAcquisition, /Supplemental candidate 20443910 is excluded from automated acquisition/);
  assert.ok(crocodileAcquisition.includes("tile=5x1"));
  assert.ok(workflow.includes("contains(github.event.head_commit.message, '[acquire-media]')"));
  assert.ok(workflow.includes("node scripts/acquire-short-001-assets.mjs"));
  assert.ok(workflow.includes("node scripts/acquire-crocodile-footage-review.mjs"));
  assert.ok(workflow.indexOf("Run unit tests and require zero skips") < workflow.indexOf("Acquire Short 001 Pexels source footage for review"));
});

test("Production queues and Short candidates reflect current media and narration blockers", () => {
  const nextShort = readJson("../content/next-short.json");
  const longQueue = readJson("../content/long-form-queue.json");
  const queue = readJson("../content/queue.json");
  const weekly = readJson("../config/weekly-content-plan.json");
  const short004 = readJson("../content/short-004-california-spiny-lobster-metadata.json");
  assert.equal(nextShort.productionPolicy.originalCreatorCapturedMediaRequired, true);
  assert.equal(nextShort.productionPolicy.stockMediaAllowed, false);
  assert.equal(nextShort.productionPolicy.aiGeneratedWildlifeVisualsAllowed, false);
  assert.equal(nextShort.productionPolicy.narrationRightsStatus, "SPEECHMA_ANDREW_MANUAL_BROWSER_AUDITION_PENDING_NO_AUDIO_OR_PRODUCTION_APPROVAL");
  assert.equal(nextShort.containsSyntheticMedia, false);
  assert.equal(nextShort.productionPolicy.status, "ORIGINAL_CREATOR_CAPTURED_MEDIA_REQUIRED; PLANNING_ONLY");
  assert.equal(longQueue.productionPolicy.originalCreatorCapturedMediaRequired, true);
  assert.equal(longQueue.productionPolicy.stockMediaAllowed, false);
  assert.equal(queue.productionPolicy.originalCreatorCapturedMediaRequired, true);
  assert.equal(queue.productionPolicy.stockMediaAllowed, false);
  assert.equal(weekly.productionPolicy.originalCreatorCapturedMediaRequired, true);
  assert.equal(weekly.productionPolicy.stockMediaAllowed, false);
  assert.equal(weekly.productionPolicy.aiGeneratedWildlifeVisualsAllowed, false);
  assert.equal(weekly.productionPolicy.mediaPolicyEvidence, "config/media-production-policy.json");
  assert.equal(weekly.productionPolicy.status, "ORIGINAL_CREATOR_CAPTURED_ONLY_STOCK_REFERENCE_ONLY");
  const crocodile = longQueue.items.find(item => item.id === "long-form-001-two-eyes-above-water");
  assert.equal(crocodile.status, "PRODUCTION_HOLD_ORIGINAL_CREATOR_CAPTURED_MEDIA_NARRATION_RIGHTS_CAPTIONS_AND_HUMAN_REVIEW");
  assert.equal(crocodile.footageEligibilityStatus, "ORIGINAL_CREATOR_CAPTURED_MEDIA_REQUIRED; PEXELS_PIXABAY_REVIEW_ONLY");
  assert.equal(short004.currentProductionDisposition.productionEligible, false);
  assert.equal(short004.scheduleAllowed, false);
  assert.equal(short004.uploadAllowed, false);
  assert.equal(short004.status, "HOLD_EXCLUDED_NOAA_STOCK_SOURCE");
});

test("Nature Frontiers validator and schema enforce original creator-captured eligibility", () => {
  const validator = readText("../scripts/validate-nature-frontiers-media-register.mjs");
  const schema = readJson("../schemas/nature-frontiers-media-register.schema.json");
  assert.ok(validator.includes("original creator-captured media must be required"));
  assert.ok(validator.includes("Pexels/Pixabay stock listings must remain reference-only"));
  assert.ok(validator.includes("production eligibility requires cleared commercial rights"));
  assert.ok(schema.properties.policy.required.includes("originalCreatorCapturedMediaRequired"));
  assert.ok(schema.properties.assets.items.required.includes("productionEligibility"));
  assert.equal(schema.properties.policy.properties.stockMediaAllowed.const, false);
  assert.equal(schema.properties.policy.properties.aiGeneratedWildlifeVisualsAllowed.const, false);
});

test("All manual alternate-narrator entry points enforce the owner decision", () => {
  const policy = readJson("../config/narration-voice-candidates.json");
  assert.equal(policy.ownerDecision.approvedVoice, "Roderic — Authoritative & Refined");
  assert.equal(policy.ownerDecision.approvedVoiceStatus, "HISTORICAL_PREFERENCE_NOT_APPROVED_FOR_COMMERCIAL_RELEASE");
  assert.equal(policy.ownerDecision.alternativeVoicesAuthorized, false);
  assert.equal(policy.ownerDecision.selectionStatus, "OWNER_SELECTED_SPEECHMA_ANDREW_BROWSER_AUDITION_PENDING");
  assert.equal(policy.ownerDecision.selectedAlternative.provider, "Speechma");
  assert.equal(policy.ownerDecision.selectedAlternative.name, "Andrew");
  assert.equal(policy.ownerDecision.selectedAlternative.voiceId, null);
  assert.equal(policy.ownerDecision.selectedAlternative.productionApproved, false);
  assert.equal(policy.ownerDecision.selectedAlternative.commercialUseAllowed, true);
  assert.equal(policy.ownerDecision.paidUpgradeAuthorized, false);
  assert.equal(policy.ownerDecision.commercialRightsStatus, "SPEECHMA_TERMS_GRANT_COMMERCIAL_OUTPUT_LICENSE_SUBJECT_TO_THIRD_PARTY_RIGHTS; NO_AUDIO_GENERATED_OR_APPROVED");
  for (const path of [
    "../scripts/generate-narration.py",
    "../scripts/generate_long_form_narration.py",
    "../scripts/generate-authoring-narration.py",
    "../scripts/generate_piper_voice_audition.py",
    "../scripts/render_american_narration.py",
    "../scripts/render_banjo_narration.py"
  ]) {
    assert.ok(readText(path).includes("require_owner_authorized_alternative_voice"), path);
  }
  assert.ok(readText("../scripts/narration_policy.py").includes("owner has not authorized an alternative narrator"));
});


test("Imported Canva media inventory includes acquired crocodile clips without selecting them for release", () => {
  const inventory = readJson("../content/sonicvhibez-imported-media-inventory.json");
  const crocodileAssets = inventory.assets.filter(asset =>
    typeof asset.sourceAssetId === "string" && asset.sourceAssetId.startsWith("pexels-video-") &&
    asset.sourceAssetId !== "pexels-video-20443910"
  );
  assert.equal(inventory.assets.length, 10);
  assert.equal(inventory.assets.filter(asset => asset.reviewRenderEligible === true).length, 8);
  assert.equal(inventory.assets.filter(asset => asset.excludedFromProduction === true || asset.status === "EXCLUDED_NOT_USED").length, 10);
  assert.equal(inventory.assets.filter(asset => asset.selectedForProduction === true).length, 0);
  assert.equal(inventory.releaseAuthorized, false);
  assert.equal(crocodileAssets.length, 5);
  assert.ok(crocodileAssets.every(asset =>
    asset.reviewRenderEligible === true &&
    asset.selectedForProduction === false &&
    asset.productionEligible === false &&
    asset.releaseEligible === false &&
    asset.localMediaPath === null &&
    /^[a-f0-9]{64}$/.test(asset.sha256) &&
    asset.originalBytesAvailableInGitHubArtifact === true &&
    asset.originalBytesAvailableLocally === false &&
    asset.thirdPartyRightsReviewed === false &&
    asset.humanVisualReview === "PENDING_FULL_PLAYBACK"
  ));
});


test("Previously shared Pexels acquisition selects only four confirmed user-shared sources", () => {
  const register = readJson("../content/media/pexels-user-shared-candidates-2026-11-22.json");
  const script = readText("../scripts/acquire-previously-shared-pexels-candidates.mjs");
  const selectedIds = [
    "pexels-video-8268897",
    "pexels-video-9655785",
    "pexels-video-30175165",
    "pexels-video-2835528"
  ];
  assert.equal(register.assets.length, 6);
  for (const id of selectedIds) {
    const asset = register.assets.find(candidate => candidate.assetId === id);
    assert.ok(asset, `Missing previously shared Pexels candidate: ${id}`);
    assert.equal(asset.sourceFileStatus, "ACQUIRED_IN_REVIEW_ARTIFACT_SHA256_AND_FULL_DECODE_PASS");
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    assert.equal(asset.acquisitionArtifactId, 14737325814);
    assert.equal(asset.fullDecode, "PASS");
    assert.equal(asset.rightsVerified, false);
    assert.equal(asset.humanReviewed, false);
    assert.equal(asset.selectedForProduction, false);
    assert.ok(asset.downloadUrl.startsWith("https://videos.pexels.com/video-files/"));
    assert.ok(script.includes(id));
  }
  assert.ok(!script.includes("pexels-video-33260728"), "duration-mismatched possible match must stay out of automatic acquisition");
  assert.ok(!script.includes("pexels-video-30026544"), "crocodile clip is already acquired in the separate long-form set");
  assert.ok(script.includes("tile=4x1"));
  assert.ok(script.includes("fullDecode"));
  assert.ok(script.includes("thirdPartyRightsReviewed: false"));
  assert.ok(script.includes("releaseEligible: false"));
  const possibleMatch = register.assets.find(asset => asset.assetId === "pexels-video-33260728");
  assert.equal(possibleMatch.sourceMatchStatus, "POSSIBLE_MATCH_NOT_CONFIRMED_DURATION_MISMATCH");
  const elephant = register.assets.find(asset => asset.assetId === "pexels-video-2835528");
  assert.match(elephant.editorialRisk, /do not infer family relationships or a specific reserve\/location without visual evidence/i);
  assert.doesNotMatch(elephant.editorialRisk, /Asian elephant/i);
  const crocodile = register.assets.find(asset => asset.assetId === "pexels-video-30026544");
  assert.equal(crocodile.duplicateOf, "content/media/pexels-crocodile-candidates-2026-11-22.json");
  assert.equal(crocodile.sourceFileStatus, "ACQUIRED_IN_REVIEW_ARTIFACT");
  assert.equal(register.latestAcquisition.assetCount, 4);
  assert.equal(register.latestAcquisition.fullDecodePasses, 4);
  assert.equal(register.latestAcquisition.totalActualSourceSeconds, 70.61);
});

test("Nile crocodile AI permission is a single-project exception and preserves all release gates", () => {
  const policy = readJson("../config/media-production-policy.json");
  const exception = policy.projectExceptions.find(item => item.exceptionId === "SONICVHIBEZ_NILE_CROCODILE_AI_VISUALS_2026_11");
  assert.equal(policy.productionVisualMode, "ORIGINAL_CREATOR_CAPTURED_ONLY");
  assert.equal(policy.aiGeneratedWildlifeVisualsAllowed, false);
  assert.equal(exception.projectTitle, "Two Eyes Above the Water: The Hidden Hunting System of the Nile Crocodile");
  assert.equal(exception.contentType, "long_form");
  assert.equal(exception.ownerAuthorization, "EXPLICIT_USER_APPROVAL_IN_CHAT");
  assert.equal(exception.aiGeneratedWildlifeVisualsAllowed, true);
  assert.equal(exception.stockMediaAllowed, false);
  assert.equal(exception.requireSourceFileSha256, true);
  assert.equal(exception.requireGenerationProvenance, true);
  assert.equal(exception.requireProviderUsageRightsEvidence, true);
  assert.equal(exception.requireSyntheticMediaDisclosure, true);
  assert.equal(exception.requireHumanVisualReview, true);
  const long = readJson("../content/long-form-render-manifest.json");
  const short = readJson("../content/render-manifest.json");
  assert.equal(long.projectPolicyExceptionId, exception.exceptionId);
  assert.equal(long.footageOrigin, "ai_generated");
  assert.equal(long.creatorCapturedOriginal, false);
  assert.equal(long.containsAIWildlifeVisuals, true);
  assert.equal(long.containsSyntheticMedia, true);
  assert.equal(long.syntheticMediaDisclosureRequired, true);
  assert.equal(long.aiGenerationEvidencePath, "");
  assert.equal(long.footageHumanReviewStatus, "PENDING_FULL_PLAYBACK");
  assert.equal(long.rightsConfirmed, false);
  assert.equal(long.thirdPartyRightsReviewed, false);
  assert.equal(long.narrationProductionUseAllowed, false);
  assert.equal(short.projectPolicyExceptionId, undefined);
  assert.equal(short.footageOrigin, "creator_captured_original");
  assert.equal(short.aiGeneratedWildlifeVisualsAllowed, false);
  const nature = readJson("../content/nature-frontiers-media-register.json");
  assert.equal(nature.policy.aiGeneratedWildlifeVisualsAllowed, false);
});
