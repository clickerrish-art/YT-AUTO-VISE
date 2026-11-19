import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { acquireDashboardStateFileLock } from "../scripts/dashboard-state-file-lock.mjs";
import { spawnSync } from "node:child_process";

test("queue replenishment is idempotent and never enables publishing", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-queue-replenish-"));
  const queuePath = path.join(tempDir, "queue.json");
  const initial = {
    cadence: { postsPerWeek: 2, days: ["Tuesday", "Friday"], timezone: "Africa/Johannesburg" },
    publishingEnabled: false,
    items: [{
      id: "existing-approved-draft",
      topic: "Existing draft is preserved",
      productUrl: "https://selar.com/0u19v8u99l",
      status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW"
    }]
  };
  fs.writeFileSync(queuePath, JSON.stringify(initial, null, 2));
  try {
    const run = () => spawnSync(process.execPath, ["scripts/replenish-queue.mjs"], {
      encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: queuePath, QUEUE_TRUST_ROOT: tempDir }
    });
    const first = run();
    assert.equal(first.status, 0, first.stderr);
    const afterFirst = JSON.parse(fs.readFileSync(queuePath, "utf8"));
    assert.equal(afterFirst.publishingEnabled, false);
    assert.deepEqual(afterFirst.cadence.formats, ["long_form", "long_form", "short"]);
    assert.equal(afterFirst.cadence.minimumHoursBetweenConsecutivePublications, 72);
    assert.equal(afterFirst.cadence.minimumCycleHours, 216);
    assert.deepEqual(afterFirst.cadence.draftPreparationFallback.days, ["Tuesday", "Saturday"]);
    assert.equal(afterFirst.cadence.draftPreparationFallback.notPublicationCadence, true);
    assert.equal("postsPerWeek" in afterFirst.cadence, false);
    assert.equal("days" in afterFirst.cadence, false);
    assert.ok(afterFirst.items.some(item => item.id === "existing-approved-draft"));
    assert.ok(afterFirst.items.length >= 13, "preserve the existing item and seed all 12 reviewed topic briefs");
    const seeded = afterFirst.items.filter(item => item.id !== "existing-approved-draft" && item.status === "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW");
    assert.ok(seeded.length >= 12);
    assert.ok(seeded.every(item => item.targetSeconds === 55));
    assert.ok(seeded.every(item => Array.isArray(item.keywords) && item.keywords.length >= 3));
    assert.ok(seeded.every(item => Array.isArray(item.outline) && item.outline.length >= 3));
    assert.ok(afterFirst.items.every(item => item.productUrl === "https://selar.com/0u19v8u99l"));
    const idsAfterFirst = afterFirst.items.map(item => item.id);
    const second = run();
    assert.equal(second.status, 0, second.stderr);
    const afterSecond = JSON.parse(fs.readFileSync(queuePath, "utf8"));
    assert.deepEqual(afterSecond.items.map(item => item.id), idsAfterFirst);
    assert.equal(afterSecond.publishingEnabled, false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("queue replenishment refuses a queue that has publishing enabled", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-queue-publish-"));
  const queuePath = path.join(tempDir, "queue.json");
  const original = { publishingEnabled: true, items: [] };
  fs.writeFileSync(queuePath, JSON.stringify(original));
  try {
    const result = spawnSync(process.execPath, ["scripts/replenish-queue.mjs"], {
      encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: queuePath, QUEUE_TRUST_ROOT: tempDir }
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must not enable publishing/);
    assert.deepEqual(JSON.parse(fs.readFileSync(queuePath, "utf8")), original);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("a missing queue is initialized from the authoritative rolling publication policy", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-queue-default-"));
  const queuePath = path.join(tempDir, "new", "queue.json");
  try {
    const result = spawnSync(process.execPath, ["scripts/replenish-queue.mjs"], {
      encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: queuePath, QUEUE_TRUST_ROOT: tempDir }
    });
    assert.equal(result.status, 0, result.stderr);
    const created = JSON.parse(fs.readFileSync(queuePath, "utf8"));
    assert.equal(created.publishingEnabled, false);
    assert.deepEqual(created.cadence.formats, ["long_form", "long_form", "short"]);
    assert.equal(created.cadence.minimumHoursBetweenConsecutivePublications, 72);
    assert.equal(created.cadence.minimumCycleHours, 216);
    assert.deepEqual(created.cadence.draftPreparationFallback.days, ["Tuesday", "Saturday"]);
    assert.equal(created.cadence.draftPreparationFallback.notPublicationCadence, true);
    assert.equal("postsPerWeek" in created.cadence, false);
    assert.equal("days" in created.cadence, false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("queue replenishment normalizes an omitted publishing flag to explicit false", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-queue-default-publishing-"));
  const queuePath = path.join(tempDir, "queue.json");
  fs.writeFileSync(queuePath, JSON.stringify({ items: [] }));
  try {
    const result = spawnSync(process.execPath, ["scripts/replenish-queue.mjs"], {
      encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: queuePath, QUEUE_TRUST_ROOT: tempDir }
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(fs.readFileSync(queuePath, "utf8")).publishingEnabled, false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("queue replenishment refuses a publication-eligible item without an exact human quality approval", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-queue-quality-"));
  const queuePath = path.join(tempDir, "queue.json");
  const original = {
    publishingEnabled: false,
    items: [{
      id: "scheduled-without-review", title: "Unreviewed export", topic: "Wildlife",
      productUrl: "https://selar.com/0u19v8u99l", contentType: "short", status: "SCHEDULED"
    }]
  };
  fs.writeFileSync(queuePath, JSON.stringify(original));
  try {
    const result = spawnSync(process.execPath, ["scripts/replenish-queue.mjs"], {
      encoding: "utf8", env: { ...process.env, QUEUE_PATH: queuePath, QUEUE_TRUST_ROOT: tempDir }
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /lacks its human-approved quality record/i);
    assert.deepEqual(JSON.parse(fs.readFileSync(queuePath, "utf8")), original,
      "a blocked publication queue must not be rewritten or silently normalized");
  } finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
});


test("queue replenishment refuses concurrent writers and preserves the current queue", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-queue-lock-"));
  const queuePath = path.join(tempDir, "queue.json");
  const original = { publishingEnabled: false, items: [{ id: "concurrent-preserve", status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" }] };
  fs.writeFileSync(queuePath, JSON.stringify(original));
  const release = acquireDashboardStateFileLock(queuePath);
  try {
    const result = spawnSync(process.execPath, ["scripts/replenish-queue.mjs"], {
      encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: queuePath, QUEUE_TRUST_ROOT: tempDir }
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /queue is busy|state is busy|lock/i);
    assert.deepEqual(JSON.parse(fs.readFileSync(queuePath, "utf8")), original,
      "a concurrent queue writer must not overwrite the active transaction");
  } finally {
    release();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("queue replenishment rejects symlink and path-traversal targets", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-queue-path-"));
  const targetPath = path.join(tempDir, "target.json");
  const linkPath = path.join(tempDir, "queue-link.json");
  fs.writeFileSync(targetPath, JSON.stringify({ sentinel: "preserve" }));
  fs.symlinkSync(targetPath, linkPath);
  try {
    const symlinkResult = spawnSync(process.execPath, ["scripts/replenish-queue.mjs"], {
      encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: linkPath, QUEUE_TRUST_ROOT: tempDir }
    });
    assert.notEqual(symlinkResult.status, 0);
    assert.match(symlinkResult.stderr, /single-link regular file|symlink/i);
    assert.deepEqual(JSON.parse(fs.readFileSync(targetPath, "utf8")), { sentinel: "preserve" });

    const traversalPath = path.join(tempDir, "..", "outside-queue.json");
    const traversalResult = spawnSync(process.execPath, ["scripts/replenish-queue.mjs"], {
      encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: traversalPath, QUEUE_TRUST_ROOT: tempDir }
    });
    assert.notEqual(traversalResult.status, 0);
    assert.match(traversalResult.stderr, /contained within its explicit trust root/i);
    assert.equal(fs.existsSync(path.resolve(traversalPath)), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
