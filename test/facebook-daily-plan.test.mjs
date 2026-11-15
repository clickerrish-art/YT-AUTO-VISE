import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateDailyFacebookPlan } from "../scripts/generate-facebook-daily-plan.mjs";

test("daily plan creates two Reel briefs and one feed brief with five-hour spacing", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-plan-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = generateDailyFacebookPlan({ date: "2030-10-25", outputDir: root, now: "2030-10-24T05:30:00.000Z" });
  const plan = result.plan;
  assert.equal(result.created, true);
  assert.equal(plan.schemaVersion, 2);
  assert.equal(plan.destination, "nature_frontiers_facebook");
  assert.equal(plan.timezone, "Africa/Johannesburg");
  assert.equal(plan.dailyTarget, 3);
  assert.equal(plan.dailyReelTarget, 2);
  assert.equal(plan.dailyFeedPostTarget, 1);
  assert.deepEqual(plan.slots.map(slot => [slot.mediaType, slot.localTime]), [["reel", "08:00"], ["feed_post", "13:00"], ["reel", "18:00"]]);
  assert.deepEqual(plan.slots.map(slot => slot.aspectRatio), ["9:16", "4:5", "9:16"]);
  assert.equal(new Set(plan.slots.map(slot => slot.topic)).size, 3);
  const times = plan.slots.map(slot => Date.parse(slot.scheduledAt));
  assert.ok(times[1] - times[0] >= 4 * 60 * 60 * 1000);
  assert.ok(times[2] - times[1] >= 4 * 60 * 60 * 1000);
  for (const slot of plan.slots) {
    assert.deepEqual(slot.factualClaims, []);
    assert.equal(slot.media, null);
    assert.equal(slot.rightsEvidence, null);
    assert.equal(slot.publishReady, false);
    assert.ok(slot.blockers.length >= 4);
  }
  assert.equal(plan.publishReady, false);
  assert.equal(plan.publishingEnabled, false);
  assert.equal(fs.statSync(result.path).mode & 0o777, 0o600);
});

test("daily plan is idempotent and preserves the original plan", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-plan-idempotent-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const first = generateDailyFacebookPlan({ date: "2030-10-25", outputDir: root, now: "2030-10-24T05:30:00.000Z" });
  const second = generateDailyFacebookPlan({ date: "2030-10-25", outputDir: root, now: "2030-10-24T06:30:00.000Z" });
  assert.equal(second.created, false);
  assert.equal(second.reason, "IDEMPOTENT_EXISTING_PLAN_PRESERVED");
  assert.deepEqual(second.plan, first.plan);
});

test("missed slots are held individually and never silently backdated", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-plan-missed-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = generateDailyFacebookPlan({ date: "2030-10-25", outputDir: root, now: "2030-10-25T16:30:00.000Z" });
  assert.equal(result.plan.slots[0].scheduleStatus, "MISSED_SLOT_REVIEW_REQUIRED");
  assert.equal(result.plan.slots[1].scheduleStatus, "MISSED_SLOT_REVIEW_REQUIRED");
  assert.equal(result.plan.slots[2].scheduleStatus, "FUTURE_SLOT_PROPOSED");
  assert.ok(result.plan.slots[0].blockers.some(item => /never backdate/i.test(item)));
  assert.equal(result.plan.publishingEnabled, false);
});

test("daily plan rejects invalid dates, symlinked output and malformed existing plans", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-plan-invalid-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.throws(() => generateDailyFacebookPlan({ date: "2030-02-31", outputDir: root }), /invalid/i);
  const target = path.join(root, "target");
  fs.mkdirSync(target);
  const link = path.join(root, "link");
  fs.symlinkSync(target, link);
  assert.throws(() => generateDailyFacebookPlan({ date: "2030-10-25", outputDir: link }), /symlink/i);
  fs.writeFileSync(path.join(target, "2030-10-25.plan.json"), JSON.stringify({ date: "2030-10-25", publishingEnabled: false }));
  assert.throws(() => generateDailyFacebookPlan({ date: "2030-10-25", outputDir: target }), /refusing to overwrite/i);
});
