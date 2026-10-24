import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runAutonomousFacebookPublisher } from "../scripts/facebook-autonomous-publisher.mjs";

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-publisher-"));
  const configPath = path.join(root, "config.json");
  const queuePath = path.join(root, "queue.json");
  const stateDir = path.join(root, "durable-state");
  const config = {
    destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
    destinationPageName: "Nature Frontiers", apiVersion: "v26.0", timezone: "Africa/Johannesburg",
    autonomousMode: true, autonomousSchedulingEnabled: true, emergencyStop: true,
    publishingEnabled: false, dryRun: true, dailyCap: 1, minimumIntervalMinutes: 1200,
    allowedDomains: [], allowedCampaignIds: [], approvedDestinations: [],
    complianceRuleSet: "nf-facebook-autonomous-policy-2026-10-v1"
  };
  fs.writeFileSync(configPath, JSON.stringify(config));
  fs.writeFileSync(queuePath, "[]");
  return { root, configPath, queuePath, stateDir, config, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test("safe defaults are a no-op and never attempt a Meta request", async () => {
  const f = setup();
  try {
    let called = false;
    const result = await runAutonomousFacebookPublisher({ configPath: f.configPath, queuePath: f.queuePath, fetchImpl: async () => { called = true; throw new Error("must not call"); } });
    assert.equal(result.status, "SAFE_NOOP");
    assert.equal(called, false);
  } finally { f.cleanup(); }
});

test("live mode requires explicit disable of emergency stop and durable absolute state path", async () => {
  const f = setup();
  try {
    f.config.emergencyStop = false;
    f.config.publishingEnabled = true;
    f.config.dryRun = false;
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    await assert.rejects(() => runAutonomousFacebookPublisher({
      configPath: f.configPath, queuePath: f.queuePath, stateDir: "relative-state",
      env: { META_USER_ACCESS_TOKEN: "u".repeat(30), META_PAGE_ACCESS_TOKEN: "p".repeat(30) }
    }), /absolute durable/i);
  } finally { f.cleanup(); }
});

test("live mode refuses to run without secure Meta credentials", async () => {
  const f = setup();
  try {
    f.config.emergencyStop = false;
    f.config.publishingEnabled = true;
    f.config.dryRun = false;
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    await assert.rejects(() => runAutonomousFacebookPublisher({
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, env: {}
    }), /access tokens are missing/i);
  } finally { f.cleanup(); }
});


test("uncertain mutation is reconciled and a unique verified receipt is persisted without retry", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-10-25T05:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-2026-10-25-0800",
      destination: "nature_frontiers_facebook",
      destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25",
      scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Educational wildlife habitat note.",
      links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    let mutationCalls = 0, reconciliationCalls = 0;
    const result = await runAutonomousFacebookPublisher({
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { META_USER_ACCESS_TOKEN: "u".repeat(30), META_PAGE_ACCESS_TOKEN: "p".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true }),
      verifyIdentity: async () => ({ verified: true }),
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "c".repeat(64), policyRuleVersion: f.config.complianceRuleSet, mediaFingerprints: [], reason: "ELIGIBLE" }),
      publish: async () => { mutationCalls++; const error = new Error("timeout after server mutation"); error.uncertain = true; throw error; },
      reconcileRemote: async () => {
        reconciliationCalls++;
        return { outcome: "CONFIRMED", receipt: { status: "SCHEDULED_VERIFIED", remotePostId: "123456789012345_999", remoteUrl: "https://www.facebook.com/123456789012345_999", createdTime: "2026-10-25T05:30:00Z", scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000 } };
      },
      readRemote: async () => { throw new Error("normal read path must not be used after the mutation throws"); }
    });
    assert.equal(result.published, 1);
    assert.equal(mutationCalls, 1);
    assert.equal(reconciliationCalls, 1);
    const ledger = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), "utf8"));
    const history = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-history.json"), "utf8"));
    assert.equal(ledger[0].status, "SCHEDULED_VERIFIED");
    assert.equal(ledger[0].remotePostId, "123456789012345_999");
    assert.equal(ledger[0].verifiedRemotely, true);
    assert.equal(history[0].remotePostId, "123456789012345_999");
  } finally { f.cleanup(); }
});

test("unresolved mutation remains durably uncertain and is never retried", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-10-25T05:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-2026-10-25-0800",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Educational wildlife habitat note.", links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    let mutationCalls = 0;
    const result = await runAutonomousFacebookPublisher({
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { META_USER_ACCESS_TOKEN: "u".repeat(30), META_PAGE_ACCESS_TOKEN: "p".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true }),
      verifyIdentity: async () => ({ verified: true }),
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "d".repeat(64), policyRuleVersion: f.config.complianceRuleSet, mediaFingerprints: [], reason: "ELIGIBLE" }),
      publish: async () => { mutationCalls++; const error = new Error("timeout"); error.uncertain = true; throw error; },
      reconcileRemote: async () => ({ outcome: "UNRESOLVED", reason: "NO_MATCH_IS_NOT_PROOF_OF_NON_PUBLICATION", matches: [] })
    });
    assert.equal(result.skipped, 1);
    assert.equal(mutationCalls, 1);
    const ledger = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), "utf8"));
    assert.equal(ledger[0].status, "UNCERTAIN");
    assert.equal(ledger[0].retryAllowed, false);
    assert.equal(ledger[0].reconciliation.outcome, "UNRESOLVED");
  } finally { f.cleanup(); }
});


test("startup reconciles an interrupted PUBLISHING ledger entry before considering its slot", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const payload = {
      slotId: "nature-frontiers-2026-10-25-0800",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Educational wildlife habitat note.", links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    fs.writeFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), JSON.stringify([{
      kind: "FACEBOOK_PUBLISH_ATTEMPT", slotId: payload.slotId, destination: "nature_frontiers_facebook",
      status: "PUBLISHING", startedAt: "2026-10-25T05:30:00.000Z", scheduledAt: payload.scheduledAt,
      payload: { caption: payload.caption, scheduledAt: payload.scheduledAt }
    }]));
    let mutationCalls = 0, reconciliationCalls = 0;
    const result = await runAutonomousFacebookPublisher({
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { META_USER_ACCESS_TOKEN: "u".repeat(30), META_PAGE_ACCESS_TOKEN: "p".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true }),
      verifyIdentity: async () => ({ verified: true }),
      publish: async () => { mutationCalls++; throw new Error("must not publish this slot twice"); },
      reconcileRemote: async () => {
        reconciliationCalls++;
        return { outcome: "CONFIRMED", receipt: { status: "SCHEDULED_VERIFIED", remotePostId: "123456789012345_999", scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000 } };
      }
    });
    assert.equal(mutationCalls, 0);
    assert.equal(reconciliationCalls, 1);
    const ledger = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), "utf8"));
    assert.equal(ledger[0].status, "SCHEDULED_VERIFIED");
    assert.equal(ledger[0].remotePostId, "123456789012345_999");
    assert.equal(result.skipped, 1);
  } finally { f.cleanup(); }
});
