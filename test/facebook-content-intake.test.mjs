import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runFacebookContentIntake } from "../scripts/facebook-content-intake.mjs";

function fixture() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-intake-"));
  const stateDir = path.join(rootDir, "durable-state");
  fs.mkdirSync(stateDir);
  const configPath = path.join(rootDir, "config.json");
  const queuePath = "queue.json";
  const candidatePath = "candidates.json";
  fs.writeFileSync(configPath, JSON.stringify({
    destination: "nature_frontiers_facebook", timezone: "Africa/Johannesburg",
    autonomousMode: true, autonomousSchedulingEnabled: true,
    complianceRuleSet: "nf-facebook-autonomous-policy-2026-10-v1",
    destinationPageId: "123456789012345", destinationPageName: "Nature Frontiers",
    allowedDomains: [], allowedCampaignIds: [], approvedDestinations: [],
    dailyCap: 1, minimumIntervalMinutes: 1200
  }));
  fs.writeFileSync(path.join(rootDir, queuePath), "[]");
  return { rootDir, stateDir, configPath, queuePath, candidatePath, cleanup: () => fs.rmSync(rootDir, { recursive: true, force: true }) };
}

test("intake queues only candidates that pass the final policy evaluator", async () => {
  const f = fixture();
  try {
    const candidates = [
      { slotId: "eligible-slot", destination: "nature_frontiers_facebook", caption: "Eligible final caption" },
      { slotId: "blocked-slot", destination: "nature_frontiers_facebook", caption: "Blocked final caption" }
    ];
    fs.writeFileSync(path.join(f.rootDir, f.candidatePath), JSON.stringify(candidates));
    const result = await runFacebookContentIntake({
      ...f, now: Date.parse("2026-10-24T10:00:00Z"), rootDir: f.rootDir,
      policyEvaluator: async candidate => candidate.slotId === "eligible-slot"
        ? { eligible: true, contentFingerprint: "a".repeat(64), policyRuleVersion: "nf-facebook-autonomous-policy-2026-10-v1", reason: "ELIGIBLE" }
        : { eligible: false, blockers: ["MISSING_RIGHTS"], reason: "MISSING_RIGHTS" }
    });
    assert.equal(result.accepted, 1);
    assert.equal(result.blocked, 1);
    const queue = JSON.parse(fs.readFileSync(path.join(f.rootDir, f.queuePath), "utf8"));
    assert.deepEqual(queue.map(item => item.slotId), ["eligible-slot"]);
    const summary = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-intake-summary.json"), "utf8"));
    assert.equal(summary.decisions[1].reason, "MISSING_RIGHTS");
  } finally { f.cleanup(); }
});

test("intake refuses duplicate slots and preserves existing queue items", async () => {
  const f = fixture();
  try {
    const existing = { slotId: "already-queued", caption: "existing" };
    fs.writeFileSync(path.join(f.rootDir, f.queuePath), JSON.stringify([existing]));
    fs.writeFileSync(path.join(f.rootDir, f.candidatePath), JSON.stringify([{ slotId: "already-queued", caption: "duplicate" }]));
    const result = await runFacebookContentIntake({
      ...f, now: Date.parse("2026-10-24T10:00:00Z"), rootDir: f.rootDir,
      policyEvaluator: async () => { throw new Error("duplicate must be rejected before policy evaluation"); }
    });
    assert.equal(result.duplicate, 1);
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), [existing]);
  } finally { f.cleanup(); }
});

test("intake blocks malformed history and rejects candidate path traversal", async () => {
  const f = fixture();
  try {
    fs.writeFileSync(path.join(f.rootDir, f.candidatePath), "[]");
    fs.writeFileSync(path.join(f.stateDir, "facebook-history.json"), "{malformed");
    await assert.rejects(() => runFacebookContentIntake({ ...f, rootDir: f.rootDir }), /JSON|Unexpected/i);
    fs.writeFileSync(path.join(f.stateDir, "facebook-history.json"), "[]");
    await assert.rejects(() => runFacebookContentIntake({ ...f, rootDir: f.rootDir, candidatePath: "../outside.json" }), /escapes repository root/i);
  } finally { f.cleanup(); }
});
