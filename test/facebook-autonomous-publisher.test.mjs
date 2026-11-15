import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runAutonomousFacebookPublisher } from "../scripts/facebook-autonomous-publisher.mjs";
import { FACEBOOK_POLICY_RULE_VERSION } from "../scripts/facebook-policy-engine.mjs";

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
    complianceRuleSet: FACEBOOK_POLICY_RULE_VERSION
  };
  fs.writeFileSync(configPath, JSON.stringify(config));
  fs.writeFileSync(queuePath, "[]");
  return { root, configPath, queuePath, stateDir, config, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test("failed durable lock initialization removes only its own incomplete lock", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const lockPath = path.join(f.stateDir, "facebook-publishing.lock");
    const originalFsync = fs.fsyncSync;
    try {
      fs.fsyncSync = () => { const error = new Error("simulated lock fsync failure"); error.code = "EIO"; throw error; };
      await assert.rejects(() => runAutonomousFacebookPublisher({
        rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
        env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) }
      }), /simulated lock fsync failure/);
    } finally {
      fs.fsyncSync = originalFsync;
    }
    assert.equal(fs.existsSync(lockPath), false, "failed initialization must not strand a lock file");
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) }
    });
    assert.equal(result.status, "COMPLETED", "a subsequent run must acquire the released lock");
  } finally { f.cleanup(); }
});

test("publisher does not begin work when lock directory durability cannot be confirmed", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    let mutationCalls = 0, directoryFsyncAttempted = false;
    const originalFsync = fs.fsyncSync;
    try {
      fs.fsyncSync = fd => {
        if (fs.fstatSync(fd).isDirectory()) {
          directoryFsyncAttempted = true;
          const error = new Error("simulated lock directory fsync failure");
          error.code = "EIO";
          throw error;
        }
        return originalFsync(fd);
      };
      await assert.rejects(() => runAutonomousFacebookPublisher({
        rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
        env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
        publish: async () => { mutationCalls++; throw new Error("publisher must not begin after an unflushed lock"); }
      }), /simulated lock directory fsync failure/);
    } finally {
      fs.fsyncSync = originalFsync;
    }
    assert.equal(directoryFsyncAttempted, true);
    assert.equal(mutationCalls, 0);
    assert.equal(fs.existsSync(path.join(f.stateDir, "facebook-publishing.lock")), false,
      "a lock whose directory durability could not be confirmed must be cleaned up");
  } finally { f.cleanup(); }
});

test("lock release never removes a replacement lock owned by another process", async () => {
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
    let enteredResolve, continueResolve;
    const entered = new Promise(resolve => { enteredResolve = resolve; });
    const continueGate = new Promise(resolve => { continueResolve = resolve; });
    const env = {
      FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345",
      META_USER_ACCESS_TOKEN: "u".repeat(30)
    };
    const publisher = runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now, env,
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "f".repeat(64), policyRuleVersion: f.config.complianceRuleSet, mediaFingerprints: [], reason: "ELIGIBLE" }),
      verifyPermissions: async () => {
        enteredResolve();
        await continueGate;
        return { permissionsVerified: false };
      },
      verifyIdentity: async () => { throw new Error("identity verification must not follow a failed permission check"); },
      publish: async () => { throw new Error("no Meta mutation is permitted in this lock test"); }
    });
    await entered;
    const lockPath = path.join(f.stateDir, "facebook-publishing.lock");
    assert.ok(fs.existsSync(lockPath), "publisher must hold its lock while permission verification is paused");
    fs.unlinkSync(lockPath);
    const replacement = "replacement lock belongs to another process\n";
    fs.writeFileSync(lockPath, replacement, { mode: 0o600 });
    continueResolve();
    const result = await publisher;
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.skipped, 1);
    assert.equal(fs.readFileSync(lockPath, "utf8"), replacement,
      "releasing the original lock must not delete a replacement lock owned by another process");
  } finally { f.cleanup(); }
});

test("duplicate queue slot IDs block before any candidate can be published", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-10-25T05:30:00.000Z");
    const base = {
      slotId: "nature-frontiers-duplicate-slot",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      links: [], media: [], claims: [], campaignId: null
    };
    const queue = [
      { ...base, caption: "First candidate caption." },
      { ...base, scheduledDate: "2026-10-26", scheduledAt: "2026-10-26T06:00:00.000Z",
        caption: "Different future-dated candidate with the same idempotency key." }
    ];
    fs.writeFileSync(f.queuePath, JSON.stringify(queue));
    let policyCalls = 0, mutationCalls = 0;
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      policyEvaluator: async () => { policyCalls++; return { eligible: true }; },
      publish: async () => { mutationCalls++; throw new Error("must not publish an ambiguous slot"); }
    }), /duplicate slot IDs/i);
    assert.equal(policyCalls, 0, "ambiguous queue entries must be rejected before policy selection");
    assert.equal(mutationCalls, 0, "ambiguous queue entries must never reach Meta mutation");
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), queue,
      "the ambiguous queue must remain intact for manual reconciliation");
    assert.equal(fs.existsSync(path.join(f.stateDir, "facebook-publishing.lock")), false,
      "the publisher lock must be released after rejecting the queue");
  } finally { f.cleanup(); }
});

test("safe defaults are a no-op and never attempt a Meta request", async () => {
  const f = setup();
  try {
    let called = false;
    const result = await runAutonomousFacebookPublisher({ rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, fetchImpl: async () => { called = true; throw new Error("must not call"); } });
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
    await assert.rejects(() => runAutonomousFacebookPublisher({ rootDir: f.root,
      configPath: f.configPath, queuePath: f.queuePath, stateDir: "relative-state",
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) }
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
    await assert.rejects(() => runAutonomousFacebookPublisher({ rootDir: f.root,
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345" }
    }), /Meta user access token is missing/i);
  } finally { f.cleanup(); }
});


test("remote post with mismatched caption or scheduled time is never recorded as verified", async () => {
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
      caption: "Approved wildlife education caption.",
      links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      verifyIdentity: async () => ({ verified: true }),
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "d".repeat(64), policyRuleVersion: f.config.complianceRuleSet, mediaFingerprints: [], reason: "ELIGIBLE" }),
      publish: async () => ({ remotePostId: "123456789012345_999" }),
      readRemote: async () => ({
        status: "SCHEDULED_VERIFIED",
        remotePostId: "123456789012345_999",
        remoteMessage: "Different caption returned by Meta",
        scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000
      })
    });
    assert.equal(result.published, 0);
    assert.equal(result.skipped, 1);
    const ledger = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), "utf8"));
    assert.equal(ledger[0].status, "UNCERTAIN");
    assert.equal(ledger[0].verifiedRemotely, false);
    assert.equal(ledger[0].verificationReason, "REMOTE_CAPTION_MISSING_OR_MISMATCHED");
    assert.equal(ledger[0].retryAllowed, false);
  } finally { f.cleanup(); }
});

test("remote post with mismatched scheduled time is never recorded as verified", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-10-25T05:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-2026-10-25-0800-schedule-mismatch",
      destination: "nature_frontiers_facebook",
      destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25",
      scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Approved wildlife education caption.",
      links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      verifyIdentity: async () => ({ verified: true }),
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "e".repeat(64), policyRuleVersion: f.config.complianceRuleSet, mediaFingerprints: [], reason: "ELIGIBLE" }),
      publish: async () => ({ remotePostId: "123456789012345_1000" }),
      readRemote: async () => ({
        status: "SCHEDULED_VERIFIED",
        remotePostId: "123456789012345_1000",
        remoteMessage: payload.caption,
        scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000 + 600
      })
    });
    assert.equal(result.published, 0);
    assert.equal(result.skipped, 1);
    const ledger = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), "utf8"));
    assert.equal(ledger[0].status, "UNCERTAIN");
    assert.equal(ledger[0].verifiedRemotely, false);
    assert.equal(ledger[0].verificationReason, "REMOTE_SCHEDULE_MISSING_OR_MISMATCHED");
    assert.equal(ledger[0].retryAllowed, false);
  } finally { f.cleanup(); }
});

test("publish response without remote ID triggers reconciliation instead of direct verification", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-10-25T05:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-2026-10-25-missing-publish-id",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Approved wildlife education caption.", links: [], media: [], claims: []
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    let readCalls = 0, reconcileCalls = 0, mutationCalls = 0;
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      verifyIdentity: async () => ({ verified: true }),
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "c".repeat(64), policyRuleVersion: f.config.complianceRuleSet, mediaFingerprints: [], reason: "ELIGIBLE" }),
      publish: async () => { mutationCalls++; return {}; },
      readRemote: async () => { readCalls++; throw new Error("cannot fetch a post without its remote ID"); },
      reconcileRemote: async () => {
        reconcileCalls++;
        return { outcome: "CONFIRMED", receipt: {
          status: "SCHEDULED_VERIFIED", remotePostId: "123456789012345_recovered",
          scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000
        } };
      }
    });
    assert.equal(mutationCalls, 1);
    assert.equal(readCalls, 0, "direct lookup must not run with a missing remote ID");
    assert.equal(reconcileCalls, 1, "missing mutation identity must enter reconciliation");
    assert.equal(result.published, 1);
    const ledger = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), "utf8"));
    assert.equal(ledger[0].status, "SCHEDULED_VERIFIED");
    assert.equal(ledger[0].remotePostId, "123456789012345_recovered");
    assert.equal(ledger[0].verifiedRemotely, true);
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
    const result = await runAutonomousFacebookPublisher({ rootDir: f.root,
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
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
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), []);
  } finally { f.cleanup(); }
});

test("normal verified publish path preserves a concurrent conflicting history receipt", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-10-25T05:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-normal-success-history-race",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Approved educational wildlife caption.", links: [], media: [], claims: []
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    const concurrentReceipt = {
      slotId: payload.slotId, destination: "nature_frontiers_facebook",
      status: "SCHEDULED_VERIFIED", verifiedRemotely: true,
      remotePostId: "123456789012345_concurrent"
    };
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      verifyIdentity: async () => ({ verified: true }),
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "c".repeat(64), policyRuleVersion: f.config.complianceRuleSet, mediaFingerprints: [], reason: "ELIGIBLE" }),
      publish: async () => ({ remotePostId: "123456789012345_returned" }),
      readRemote: async () => {
        fs.writeFileSync(path.join(f.stateDir, "facebook-history.json"), JSON.stringify([concurrentReceipt]));
        return {
          status: "SCHEDULED_VERIFIED", remotePostId: "123456789012345_returned",
          remoteMessage: payload.caption, scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000
        };
      },
      reconcileRemote: async () => ({ outcome: "UNRESOLVED", reason: "NO_MATCH_IS_NOT_PROOF_OF_NON_PUBLICATION", matches: [] })
    }), /verified receipt for this slot|history conflicts/i);
    const history = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-history.json"), "utf8"));
    assert.deepEqual(history, [concurrentReceipt], "the concurrent verified receipt must remain unchanged");
    const ledger = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), "utf8"));
    assert.equal(ledger[0].status, "PUBLISHING", "the unresolved attempt must remain available for safe startup reconciliation");
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), [payload],
      "the slot remains queued for manual reconciliation");
  } finally { f.cleanup(); }
});

test("live uncertain reconciliation rechecks durable history and blocks a concurrent conflicting receipt", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-10-25T05:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-2026-10-25-live-reconciliation-conflict",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Approved educational wildlife caption.", links: [], media: [], claims: []
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    let mutationCalls = 0, reconciliationCalls = 0;
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      verifyIdentity: async () => ({ verified: true }),
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "b".repeat(64), policyRuleVersion: f.config.complianceRuleSet, mediaFingerprints: [], reason: "ELIGIBLE" }),
      publish: async () => {
        mutationCalls++;
        fs.writeFileSync(path.join(f.stateDir, "facebook-history.json"), JSON.stringify([{
          slotId: payload.slotId, destination: "nature_frontiers_facebook",
          status: "SCHEDULED_VERIFIED", verifiedRemotely: true,
          remotePostId: "123456789012345_concurrent"
        }]));
        const error = new Error("timeout after remote mutation");
        error.uncertain = true;
        throw error;
      },
      reconcileRemote: async () => {
        reconciliationCalls++;
        return { outcome: "CONFIRMED", receipt: {
          status: "SCHEDULED_VERIFIED", remotePostId: "123456789012345_reconciled",
          scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000
        } };
      }
    }), /history conflicts with a reconciled ledger receipt/i);
    assert.equal(mutationCalls, 1);
    assert.equal(reconciliationCalls, 1);
    const history = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-history.json"), "utf8"));
    assert.equal(history.length, 1);
    assert.equal(history[0].remotePostId, "123456789012345_concurrent",
      "conflicting durable history must not be overwritten");
    const ledger = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), "utf8"));
    assert.equal(ledger[0].status, "PUBLISHING",
      "the unresolved ledger attempt remains available for safe startup reconciliation");
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), [payload],
      "the candidate remains queued for manual reconciliation");
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
    const result = await runAutonomousFacebookPublisher({ rootDir: f.root,
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
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
    const result = await runAutonomousFacebookPublisher({ rootDir: f.root,
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
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


test("separate runtime kill switch blocks live config before any Meta request", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    let called = false;
    const result = await runAutonomousFacebookPublisher({ rootDir: f.root,
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      env: { FACEBOOK_PUBLISH_ENABLED: "NO", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      fetchImpl: async () => { called = true; throw new Error("must not call"); }
    });
    assert.equal(result.status, "SAFE_NOOP");
    assert.equal(called, false);
  } finally { f.cleanup(); }
});

test("live publisher rejects a runtime Page ID that differs from configuration", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    await assert.rejects(() => runAutonomousFacebookPublisher({ rootDir: f.root,
      configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "999999999999999", META_USER_ACCESS_TOKEN: "u".repeat(30) }
    }), /must exactly match/i);
  } finally { f.cleanup(); }
});


test("publisher rejects a queue symlink that resolves outside its repository root", async () => {
  const f = setup();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-queue-outside-"));
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.writeFileSync(path.join(outside, "queue.json"), "[]");
    fs.rmSync(f.queuePath);
    fs.symlinkSync(path.join(outside, "queue.json"), f.queuePath);
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) }
    }), /symlink escapes approved repository\/state roots/i);
  } finally {
    f.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});


test("publisher defaults to a durable queue in FACEBOOK_STATE_DIR when no queue override is supplied", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const durableQueue = path.join(f.stateDir, "facebook-autonomous-queue.json");
    fs.writeFileSync(durableQueue, "[]");
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, stateDir: f.stateDir,
      now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      verifyIdentity: async () => ({ verified: true }),
      publish: async () => { throw new Error("empty durable queue must not publish"); }
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.queueCount, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(durableQueue, "utf8")), []);
  } finally { f.cleanup(); }
});


test("publisher rejects state-ledger symlinks escaping the durable state directory", async () => {
  const f = setup();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-state-outside-"));
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false, historyFile: "facebook-history.json" });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const outsideHistory = path.join(outside, "private-history.json");
    fs.writeFileSync(outsideHistory, "[]");
    fs.symlinkSync(outsideHistory, path.join(f.stateDir, "facebook-history.json"));
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) }
    }), /state file symlink escapes/i);
  } finally {
    f.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});


test("failed Meta permissions automatically skip and drain a slot without owner confirmation", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const payload = {
      slotId: "nature-frontiers-2026-10-25-0800",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Educational wildlife habitat note.", links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    let publishCalls = 0;
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: false }),
      verifyIdentity: async () => { throw new Error("identity should not be called"); },
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "e".repeat(64), policyRuleVersion: f.config.complianceRuleSet, mediaFingerprints: [], reason: "ELIGIBLE" }),
      publish: async () => { publishCalls++; throw new Error("must not publish"); }
    });
    assert.equal(result.skipped, 1);
    assert.equal(publishCalls, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), []);
    const history = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-history.json"), "utf8"));
    assert.equal(history[0].status, "SKIPPED_CONNECTION_BLOCKED");
    assert.equal(history[0].reason, "META_PAGE_IDENTITY_OR_PERMISSION_CHECK_FAILED_NO_MUTATION");
  } finally { f.cleanup(); }
});


test("failed atomic state write removes its unique temporary file and a later run recovers", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-11-15T07:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-2026-11-15-1000",
      destination: "nature_frontiers_facebook",
      destinationPageId: "123456789012345",
      scheduledDate: "2026-11-15",
      scheduledAt: "2026-11-15T08:00:00.000Z",
      caption: "Test-only candidate must remain blocked.",
      links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    const options = {
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      policyEvaluator: async () => ({
        eligible: false, blockers: ["TEST_BLOCK"], warnings: [], contentFingerprint: "a".repeat(64),
        policyRuleVersion: f.config.complianceRuleSet, reason: "TEST_BLOCK"
      })
    };
    const originalFsync = fs.fsyncSync;
    let fsyncCalls = 0;
    try {
      fs.fsyncSync = fd => {
        fsyncCalls++;
        if (fsyncCalls === 2) { const error = new Error("simulated atomic state fsync failure"); error.code = "EIO"; throw error; }
        return originalFsync(fd);
      };
      await assert.rejects(() => runAutonomousFacebookPublisher(options), /simulated atomic state fsync failure/);
    } finally {
      fs.fsyncSync = originalFsync;
    }
    assert.equal(fs.existsSync(path.join(f.stateDir, "facebook-publishing.lock")), false,
      "publisher must release its own lock after a failed state write");
    assert.deepEqual(fs.readdirSync(f.stateDir), [],
      "failed state write must remove its unique temporary file");
    const result = await runAutonomousFacebookPublisher(options);
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.skipped, 1, "the policy-blocked candidate must remain blocked on recovery");
    assert.deepEqual(fs.readdirSync(f.stateDir).filter(name => name.endsWith(".tmp")), [],
      "successful recovery must leave no temporary state files");
    const history = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-history.json"), "utf8"));
    assert.equal(history[0].status, "SKIPPED_BLOCKED");
  } finally { f.cleanup(); }
});


test("startup rebuilds missing history from a verified ledger receipt before draining duplicate queue work", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const now = Date.parse("2026-10-25T05:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-2026-10-25-0800-history-gap",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Previously verified educational wildlife caption.",
      links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    fs.writeFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), JSON.stringify([{
      kind: "FACEBOOK_PUBLISH_ATTEMPT", slotId: payload.slotId,
      destination: "nature_frontiers_facebook", status: "SCHEDULED_VERIFIED",
      startedAt: "2026-10-25T05:30:00.000Z", completedAt: "2026-10-25T05:31:00.000Z",
      scheduledAt: payload.scheduledAt, remotePostId: "123456789012345_777",
      remoteUrl: "https://www.facebook.com/123456789012345_777",
      verifiedRemotely: true, retryAllowed: false,
      payload: { caption: payload.caption, scheduledAt: payload.scheduledAt }
    }]));
    let mutationCalls = 0, permissionCalls = 0;
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath,
      stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => { permissionCalls++; throw new Error("duplicate slot must not reach Meta"); },
      publish: async () => { mutationCalls++; throw new Error("duplicate slot must never be republished"); }
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(mutationCalls, 0);
    assert.equal(permissionCalls, 0);
    const history = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-history.json"), "utf8"));
    assert.equal(history.length, 1);
    assert.equal(history[0].slotId, payload.slotId);
    assert.equal(history[0].status, "SCHEDULED_VERIFIED");
    assert.equal(history[0].historyRebuildReason, "VERIFIED_LEDGER_RECEIPT_RECOVERED_AFTER_HISTORY_WRITE_GAP");
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), []);
  } finally { f.cleanup(); }
});


test("startup does not promote an incomplete or unverified ledger row into remote history", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const slotId = "nature-frontiers-2026-10-25-unverified-ledger-row";
    fs.writeFileSync(f.queuePath, JSON.stringify([{
      slotId, destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Do not publish from incomplete ledger evidence.", links: [], media: [], claims: []
    }]));
    fs.writeFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), JSON.stringify([{
      slotId, destination: "nature_frontiers_facebook", status: "SCHEDULED_VERIFIED",
      // Deliberately missing attempt kind, remotePostId and verifiedRemotely attestation.
      retryAllowed: false
    }]));
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath,
      stateDir: f.stateDir, now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      publish: async () => { throw new Error("ledger presence must continue to block duplicate processing"); }
    });
    const history = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-history.json"), "utf8"));
    assert.equal(history.length, 0, "incomplete ledger data must not be represented as a verified remote receipt");
    assert.equal(result.lastRemoteReceipt, null);
    assert.equal(result.skipped, 1);
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), []);
  } finally { f.cleanup(); }
});


test("startup blocks when verified ledger and history receipts disagree on remote post identity", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const slotId = "nature-frontiers-2026-10-25-conflicting-receipts";
    fs.writeFileSync(f.queuePath, JSON.stringify([{
      slotId, destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Conflicting receipt test.", links: [], media: [], claims: []
    }]));
    const base = {
      kind: "FACEBOOK_PUBLISH_ATTEMPT", slotId, destination: "nature_frontiers_facebook",
      status: "SCHEDULED_VERIFIED", verifiedRemotely: true, retryAllowed: false
    };
    fs.writeFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), JSON.stringify([{
      ...base, remotePostId: "123456789012345_ledger"
    }]));
    fs.writeFileSync(path.join(f.stateDir, "facebook-history.json"), JSON.stringify([{
      ...base, remotePostId: "123456789012345_history"
    }]));
    let mutationCalls = 0;
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath,
      stateDir: f.stateDir, now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      publish: async () => { mutationCalls++; throw new Error("conflicting receipts must stop before mutation"); }
    }), /history conflicts with a verified ledger receipt/i);
    assert.equal(mutationCalls, 0);
    assert.equal(JSON.parse(fs.readFileSync(f.queuePath, "utf8")).length, 1,
      "the queue must remain untouched for operator reconciliation");
  } finally { f.cleanup(); }
});


test("startup blocks interrupted reconciliation when existing verified history names another remote post", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const payload = {
      slotId: "nature-frontiers-2026-10-25-conflicting-recovery",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Interrupted reconciliation conflict.", links: [], media: [], claims: []
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    fs.writeFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), JSON.stringify([{
      kind: "FACEBOOK_PUBLISH_ATTEMPT", slotId: payload.slotId, destination: "nature_frontiers_facebook",
      status: "PUBLISHING", startedAt: "2026-10-25T05:30:00.000Z", scheduledAt: payload.scheduledAt,
      payload: { caption: payload.caption, scheduledAt: payload.scheduledAt }
    }]));
    fs.writeFileSync(path.join(f.stateDir, "facebook-history.json"), JSON.stringify([{
      kind: "FACEBOOK_PUBLISH_ATTEMPT", slotId: payload.slotId, destination: "nature_frontiers_facebook",
      status: "SCHEDULED_VERIFIED", verifiedRemotely: true, remotePostId: "123456789012345_old"
    }]));
    let mutationCalls = 0;
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      reconcileRemote: async () => ({
        outcome: "CONFIRMED",
        receipt: { status: "SCHEDULED_VERIFIED", remotePostId: "123456789012345_new",
          scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000 }
      }),
      publish: async () => { mutationCalls++; throw new Error("must remain blocked"); }
    }), /history conflicts with a reconciled ledger receipt/i);
    assert.equal(mutationCalls, 0);
    assert.equal(JSON.parse(fs.readFileSync(f.queuePath, "utf8")).length, 1);
  } finally { f.cleanup(); }
});


test("startup keeps a confirmed reconciliation without a remote post ID uncertain", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const payload = {
      slotId: "nature-frontiers-2026-10-25-missing-remote-id",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Receipt without remote identity.", links: [], media: [], claims: []
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    fs.writeFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), JSON.stringify([{
      kind: "FACEBOOK_PUBLISH_ATTEMPT", slotId: payload.slotId, destination: "nature_frontiers_facebook",
      status: "PUBLISHING", startedAt: "2026-10-25T05:30:00.000Z", scheduledAt: payload.scheduledAt,
      payload: { caption: payload.caption, scheduledAt: payload.scheduledAt }
    }]));
    let mutationCalls = 0;
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      reconcileRemote: async () => ({
        outcome: "CONFIRMED",
        receipt: { status: "SCHEDULED_VERIFIED", scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000 }
      }),
      publish: async () => { mutationCalls++; throw new Error("must not publish an uncertain slot"); }
    });
    const ledger = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), "utf8"));
    const history = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-history.json"), "utf8"));
    assert.equal(mutationCalls, 0);
    assert.equal(ledger[0].status, "UNCERTAIN");
    assert.notEqual(history.some(item => ["SCHEDULED_VERIFIED", "PUBLISHED_VERIFIED"].includes(item.status)), true);
    assert.equal(result.published, 0);
  } finally { f.cleanup(); }
});


test("atomic state write does not acknowledge a rename until its directory entry is fsynced", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-11-15T07:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-2026-11-15-directory-fsync",
      destination: "nature_frontiers_facebook",
      destinationPageId: "123456789012345",
      scheduledDate: "2026-11-15",
      scheduledAt: "2026-11-15T08:00:00.000Z",
      caption: "Test-only candidate must remain blocked.",
      links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    let mutationCalls = 0;
    const options = {
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      policyEvaluator: async () => ({
        eligible: false, blockers: ["TEST_BLOCK"], warnings: [], contentFingerprint: "b".repeat(64),
        policyRuleVersion: f.config.complianceRuleSet, reason: "TEST_BLOCK"
      }),
      publish: async () => { mutationCalls++; throw new Error("blocked candidate must never reach Meta"); }
    };
    const originalFsync = fs.fsyncSync;
    let directoryFsyncAttempted = false;
    try {
      fs.fsyncSync = fd => {
        if (fs.fstatSync(fd).isDirectory()) {
          directoryFsyncAttempted = true;
          const error = new Error("simulated directory fsync failure");
          error.code = "EIO";
          throw error;
        }
        return originalFsync(fd);
      };
      await assert.rejects(() => runAutonomousFacebookPublisher(options), /simulated directory fsync failure/);
    } finally {
      fs.fsyncSync = originalFsync;
    }
    assert.equal(directoryFsyncAttempted, true, "test must fail the directory descriptor, not an earlier file flush");
    const historyPath = path.join(f.stateDir, "facebook-history.json");
    assert.equal(JSON.parse(fs.readFileSync(historyPath, "utf8"))[0].status, "SKIPPED_BLOCKED",
      "rename may have produced a complete file, but the failed directory fsync must not be acknowledged");
    assert.equal(JSON.parse(fs.readFileSync(f.queuePath, "utf8")).length, 1,
      "the queued slot must remain available for idempotent recovery when the history write is not acknowledged");
    assert.equal(fs.existsSync(path.join(f.stateDir, "facebook-publishing.lock")), false);
    const result = await runAutonomousFacebookPublisher(options);
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.skipped, 1);
    assert.equal(mutationCalls, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), []);
  } finally { f.cleanup(); }
});


test("startup reconciliation re-reads history after Meta lookup before writing a recovered receipt", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const payload = {
      slotId: "nature-frontiers-2026-10-25-startup-history-race",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Startup reconciliation history race.", links: [], media: [], claims: []
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    fs.writeFileSync(path.join(f.stateDir, "facebook-attempt-ledger.json"), JSON.stringify([{
      kind: "FACEBOOK_PUBLISH_ATTEMPT", slotId: payload.slotId,
      destination: "nature_frontiers_facebook", status: "PUBLISHING",
      startedAt: "2026-10-25T05:30:00.000Z", scheduledAt: payload.scheduledAt,
      payload: { caption: payload.caption, scheduledAt: payload.scheduledAt }
    }]));
    const historyPath = path.join(f.stateDir, "facebook-history.json");
    const concurrentReceipt = {
      kind: "FACEBOOK_PUBLISH_ATTEMPT", slotId: payload.slotId,
      destination: "nature_frontiers_facebook", status: "SCHEDULED_VERIFIED",
      verifiedRemotely: true, remotePostId: "123456789012345_concurrent"
    };
    let mutationCalls = 0;
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath,
      stateDir: f.stateDir, now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      reconcileRemote: async () => {
        fs.writeFileSync(historyPath, JSON.stringify([concurrentReceipt]));
        return {
          outcome: "CONFIRMED",
          receipt: { status: "SCHEDULED_VERIFIED", remotePostId: "123456789012345_reconciled" }
        };
      },
      publish: async () => { mutationCalls++; throw new Error("startup recovery conflict must block publishing"); }
    }), /history conflicts with a reconciled ledger receipt/i);
    assert.equal(mutationCalls, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(historyPath, "utf8")), [concurrentReceipt],
      "the concurrent verified receipt must remain byte-for-byte authoritative");
    assert.equal(JSON.parse(fs.readFileSync(f.queuePath, "utf8")).length, 1,
      "the queued slot must remain for manual reconciliation");
  } finally { f.cleanup(); }
});


test("startup blocks conflicting verified receipts already present in durable history", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    const slotId = "nature-frontiers-conflicting-history-rows";
    const queue = [{
      slotId, destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Conflicting durable history must stop all processing.", links: [], media: [], claims: []
    }];
    const receipts = [
      { slotId, destination: "nature_frontiers_facebook", status: "SCHEDULED_VERIFIED",
        verifiedRemotely: true, remotePostId: "123456789012345_first" },
      { slotId, destination: "nature_frontiers_facebook", status: "PUBLISHED_VERIFIED",
        verifiedRemotely: true, remotePostId: "123456789012345_second" }
    ];
    fs.writeFileSync(f.queuePath, JSON.stringify(queue));
    const historyPath = path.join(f.stateDir, "facebook-history.json");
    fs.writeFileSync(historyPath, JSON.stringify(receipts));
    let policyCalls = 0, mutationCalls = 0;
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath,
      stateDir: f.stateDir, now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      policyEvaluator: async () => { policyCalls++; return { eligible: true }; },
      publish: async () => { mutationCalls++; throw new Error("conflicting receipts must never reach Meta"); }
    }), /conflicting verified remote post IDs/i);
    assert.equal(policyCalls, 0);
    assert.equal(mutationCalls, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(historyPath, "utf8")), receipts);
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), queue);
    assert.equal(fs.existsSync(path.join(f.stateDir, "facebook-publishing.lock")), false);
  } finally { f.cleanup(); }
});

test("policy-block history append preserves a concurrent durable history update", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const now = Date.parse("2026-10-25T05:30:00.000Z");
    const payload = {
      slotId: "nature-frontiers-policy-history-race",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Policy check history race.", links: [], media: [], claims: []
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    const historyPath = path.join(f.stateDir, "facebook-history.json");
    const concurrent = {
      slotId: payload.slotId, destination: "nature_frontiers_facebook",
      status: "SCHEDULED_VERIFIED", verifiedRemotely: true,
      remotePostId: "123456789012345_concurrent"
    };
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath,
      stateDir: f.stateDir, now,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      policyEvaluator: async () => {
        fs.mkdirSync(f.stateDir, { recursive: true });
        fs.writeFileSync(historyPath, JSON.stringify([concurrent]));
        return { eligible: false, blockers: ["TEST_BLOCK"], warnings: [],
          contentFingerprint: "c".repeat(64), policyRuleVersion: f.config.complianceRuleSet,
          reason: "TEST_BLOCK" };
      },
      publish: async () => { throw new Error("policy-blocked candidate must not publish"); }
    }), /history already contains this slot/i);
    assert.deepEqual(JSON.parse(fs.readFileSync(historyPath, "utf8")), [concurrent],
      "the concurrent durable history entry must not be overwritten");
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), [payload],
      "the slot remains queued for manual reconciliation");
  } finally { f.cleanup(); }
});
