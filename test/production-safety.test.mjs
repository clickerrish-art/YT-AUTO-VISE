import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
const narrationWorkflow = fs.readFileSync(".github/workflows/generate-long-form-narration.yml", "utf8");
const shortNarrationWorkflow = fs.readFileSync(".github/workflows/free-narration-artifact.yml", "utf8");
const queuePackageGenerator = fs.readFileSync("scripts/generate-queue-package.py", "utf8");
const qualityWorkflow = fs.readFileSync(".github/workflows/content-quality.yml", "utf8");
const readiness = fs.readFileSync("scripts/production-readiness.mjs", "utf8");
const longRenderer = fs.readFileSync("scripts/render-long-form.mjs", "utf8");
const shortTemplate = JSON.parse(fs.readFileSync("content/next-short.example.json", "utf8"));

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
  assert.match(shortTemplate.description, /promotional disclosure/i);
  assert.match(shortTemplate.description, /AI disclosure/i);
  assert.equal(shortTemplate.productUrl, "https://selar.com/0u19v8u99l");
});

test("long-form Edge TTS generation is manual-only and explicitly non-commercial", () => {
  assert.ok(narrationWorkflow.includes("workflow_dispatch:"));
  assert.ok(narrationWorkflow.includes("allow_noncommercial_audition:"));
  assert.ok(narrationWorkflow.includes("default: false"));
  assert.ok(narrationWorkflow.includes("--allow-noncommercial-audition"));
  assert.ok(narrationWorkflow.includes("NON_COMMERCIAL_INTERNAL_EVALUATION_ONLY"));
  assert.ok(narrationWorkflow.includes("actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02"));
  const workflowLines = narrationWorkflow.split(String.fromCharCode(10)).map(line => line.trim());
  assert.equal(workflowLines.includes("schedule:"), false);
  assert.equal(workflowLines.includes("push:"), false);
});

test("Short Edge TTS audition workflow is manual-only, acknowledged, and never production", () => {
  assert.ok(shortNarrationWorkflow.includes("workflow_dispatch:"));
  assert.ok(shortNarrationWorkflow.includes("allow_noncommercial_audition:"));
  assert.ok(shortNarrationWorkflow.includes("default: false"));
  assert.ok(shortNarrationWorkflow.includes("if: \${{ inputs.allow_noncommercial_audition == true }}"));
  assert.ok(shortNarrationWorkflow.includes("--allow-noncommercial-audition"));
  assert.ok(shortNarrationWorkflow.includes("NON_COMMERCIAL_INTERNAL_EVALUATION_ONLY"));
  assert.ok(shortNarrationWorkflow.includes('assert data["productionUseAllowed"] is False'));
  const workflowLines = shortNarrationWorkflow.split(String.fromCharCode(10)).map(line => line.trim());
  assert.equal(workflowLines.includes("schedule:"), false);
  assert.equal(workflowLines.includes("push:"), false);
  assert.doesNotMatch(shortNarrationWorkflow, /generate-queue-package|render-queued-draft|youtube\.upload/i);
});

test("direct queue-package Edge TTS generation requires explicit non-commercial acknowledgement", () => {
  assert.ok(queuePackageGenerator.includes("--allow-noncommercial-audition"));
  assert.ok(queuePackageGenerator.includes("if not args.allow_noncommercial_audition"));
  assert.ok(queuePackageGenerator.includes("if not args.voice"));
  assert.ok(queuePackageGenerator.includes('"status": "INTERNAL_AUDITION_ONLY"'));
  assert.ok(queuePackageGenerator.includes('"voiceApprovalStatus": "NOT_OWNER_APPROVED"'));
  assert.ok(queuePackageGenerator.includes('"licenseStatus": "NON_COMMERCIAL_INTERNAL_EVALUATION_ONLY"'));
  assert.ok(queuePackageGenerator.includes('"commercialUseAllowed": False'));
  assert.ok(queuePackageGenerator.includes('"productionUseAllowed": False'));
  assert.ok(queuePackageGenerator.includes('"publishingEnabled": False'));
});

test("quality workflow runs tests and explicitly avoids certifying runtime", () => {
  assert.match(qualityWorkflow, /node --test/);
  assert.match(qualityWorkflow, /does not certify a 6-minute runtime/);
  assert.doesNotMatch(qualityWorkflow, /upload-video|publish-video|youtube\.upload/i);
});
