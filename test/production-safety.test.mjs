import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
const narrationWorkflow = fs.readFileSync(".github/workflows/generate-long-form-narration.yml", "utf8");
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

test("script changes automatically trigger narration generation", () => {
  assert.match(narrationWorkflow, /push:[\s\S]*paths:[\s\S]*content\/long-form-scripts\.md/);
  assert.match(narrationWorkflow, /workflow_dispatch/);
  assert.match(narrationWorkflow, /actions\/upload-artifact@v4/);
});

test("quality workflow runs tests and explicitly avoids certifying runtime", () => {
  assert.match(qualityWorkflow, /node --test/);
  assert.match(qualityWorkflow, /does not certify a 6-minute runtime/);
  assert.doesNotMatch(qualityWorkflow, /upload-video|publish-video|youtube\.upload/i);
});
