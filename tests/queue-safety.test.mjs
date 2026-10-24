import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("every queued idea remains draft-only for SonicVhibez's approved product", () => {
  const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));
  assert.equal(queue.publishingEnabled, false);
  assert.deepEqual(queue.cadence.formats, ["long_form", "long_form", "short"]);
  assert.equal(queue.cadence.minimumHoursBetweenConsecutivePublications, 72);
  assert.equal(queue.cadence.minimumCycleHours, 216);
  assert.equal(queue.cadence.draftPreparationFallback.notPublicationCadence, true);
  assert.equal(queue.cadence.timezone, "Africa/Johannesburg");
  assert.ok(Array.isArray(queue.items) && queue.items.length >= 2);
  for (const item of queue.items) {
    assert.equal(item.productUrl, "https://selar.com/0u19v8u99l", `unapproved product URL in ${item.id}`);
    assert.notEqual(item.status, "PUBLISHED");
    assert.notEqual(item.status, "READY_FOR_PUBLICATION");
    assert.notEqual(item.channel, "Nature Frontiers");
  }
});

test("first Short metadata is fail-closed and private", () => {
  const metadata = JSON.parse(fs.readFileSync("content/next-short.example.json", "utf8"));
  assert.equal(metadata.channel, "SonicVhibez");
  assert.equal(metadata.visibility, "private");
  assert.equal(metadata.status, "DRAFT_REVIEW_REQUIRED");
  assert.equal(metadata.rightsConfirmed, false);
  assert.equal(metadata.complianceReviewed, false);
  assert.equal(metadata.productUrl, "https://selar.com/0u19v8u99l");
});
