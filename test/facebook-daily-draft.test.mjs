import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateDailyFacebookDraft } from "../scripts/generate-facebook-daily-draft.mjs";

test("daily Facebook draft package is research-only, timezone-labelled and idempotent", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-draft-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const first = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: root, now: "2030-10-24T05:30:00.000Z"
  });
  assert.equal(first.created, true);
  assert.equal(first.package.date, "2030-10-25");
  assert.equal(first.package.destination, "nature_frontiers_facebook");
  assert.equal(first.package.timezone, "Africa/Johannesburg");
  assert.ok(["08:00", "18:00"].includes(first.package.proposedPublicationTime));
  assert.equal(first.package.publishReady, false);
  assert.equal(first.package.publishingEnabled, false);
  assert.equal(first.package.destinationPageId, null);
  assert.deepEqual(first.package.factualClaims, []);
  assert.equal(first.package.media, null);
  assert.equal(first.package.rightsEvidence, null);
  assert.ok(first.package.blockers.length >= 4);
  assert.equal(fs.statSync(first.path).mode & 0o777, 0o600);

  const second = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: root, now: "2030-10-24T06:00:00.000Z"
  });
  assert.equal(second.created, false);
  assert.equal(second.reason, "IDEMPOTENT_EXISTING_DRAFT_PRESERVED");
  assert.deepEqual(second.package, first.package);
  assert.equal(fs.readdirSync(root).filter(name => name.endsWith(".json")).length, 1);
});

test("missed daily experiment slots are flagged instead of silently backdated", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-missed-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: root, now: "2030-10-25T20:00:00.000Z"
  });
  assert.equal(result.package.publishReady, false);
  assert.equal(result.package.publishingEnabled, false);
  assert.equal(result.package.scheduleStatus, "MISSED_SLOT_REVIEW_REQUIRED");
  assert.equal(result.package.status, "MISSED_SLOT_REVIEW_REQUIRED");
  assert.ok(result.package.blockers.some(item => /slot has passed; do not backdate or batch-publish/i.test(item)));
  assert.ok(Date.parse(result.package.proposedScheduledAt) < Date.parse("2030-10-25T20:00:00.000Z"));
});

test("daily draft generator rejects invalid dates and refuses malformed existing output", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-invalid-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.throws(() => generateDailyFacebookDraft({ date: "2030-02-31", outputDir: root }), /invalid/i);
  fs.writeFileSync(path.join(root, "2030-10-25.json"), JSON.stringify({ date: "2030-10-25", destination: "other-page", publishingEnabled: false }));
  assert.throws(() => generateDailyFacebookDraft({ date: "2030-10-25", outputDir: root }), /refusing to overwrite/i);
});
