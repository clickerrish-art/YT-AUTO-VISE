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
    destinationPageName: "Nature Frontiers", apiVersion: "v27.0", timezone: "Africa/Johannesburg",
    autonomousMode: true, autonomousSchedulingEnabled: true, emergencyStop: true,
    publishingEnabled: false, dryRun: true, dailyCap: 3, dailyReelCap: 2, dailyFeedPostCap: 1, minimumIntervalMinutes: 240,
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
    const persistedState = fs.readdirSync(f.stateDir).filter(name => name.endsWith(".json"))
      .map(name => fs.readFileSync(path.join(f.stateDir, name), "utf8")).join("\\n");
    assert.equal(persistedState.includes("u".repeat(30)), false, "Meta user access token must never be persisted");
    assert.equal(persistedState.includes("p".repeat(30)), false, "derived Meta Page token must never be persisted");
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), []);
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
    const held = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-held-items.json"), "utf8"));
    assert.equal(held[0].status, "HELD_UNCERTAIN_REMOTE_OUTCOME");
    assert.deepEqual(held[0].payload, payload, "an unresolved remote outcome must retain the full original candidate");
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
    }), /state file path contains a symbolic link; publishing blocked/i);
  } finally {
    f.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});


test("failed Meta permissions hold the complete candidate before draining the active queue", async () => {
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
    assert.equal(history[0].status, "HELD_CONNECTION_BLOCKED");
    assert.equal(history[0].reason, "META_PAGE_IDENTITY_OR_PERMISSION_CHECK_FAILED_NO_MUTATION");
    const held = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-held-items.json"), "utf8"));
    assert.equal(held.length, 1);
    assert.equal(held[0].status, "HELD_CONNECTION_BLOCKED");
    assert.deepEqual(held[0].payload, payload, "the complete candidate must survive the automatic hold");
    assert.equal(result.heldItemsCount, 1);
  } finally { f.cleanup(); }
});


test("policy-blocked candidate is retained in the durable held-items ledger", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const payload = {
      slotId: "nature-frontiers-policy-hold-2026-10-25-0800",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Candidate held pending rights review.", links: [],
      media: [{ path: "media/candidate.mp4", sha256: "a".repeat(64) }],
      claims: [{ text: "A source-backed claim" }], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    let permissionCalls = 0, publishCalls = 0;
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      policyEvaluator: async () => ({ eligible: false, blockers: ["RIGHTS_NOT_VERIFIED"], warnings: [], contentFingerprint: "f".repeat(64), policyRuleVersion: f.config.complianceRuleSet, reason: "RIGHTS_NOT_VERIFIED" }),
      verifyPermissions: async () => { permissionCalls++; throw new Error("policy-blocked content must not reach Meta"); },
      publish: async () => { publishCalls++; throw new Error("policy-blocked content must never publish"); }
    });
    assert.equal(result.skipped, 1);
    assert.equal(permissionCalls, 0);
    assert.equal(publishCalls, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), []);
    const held = JSON.parse(fs.readFileSync(path.join(f.stateDir, "facebook-held-items.json"), "utf8"));
    assert.equal(held[0].status, "HELD_POLICY_BLOCKED");
    assert.deepEqual(held[0].payload, payload);
    assert.deepEqual(held[0].policyDecision.blockers, ["RIGHTS_NOT_VERIFIED"]);
  } finally { f.cleanup(); }
});

test("operator-released held candidate can be retried after the connection is restored", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const payload = {
      slotId: "nature-frontiers-release-held-2026-10-25-0800",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Retry only after the operator releases this exact held candidate.",
      links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    const base = {
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      now: Date.parse("2026-10-25T05:30:00.000Z"),
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
      policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "9".repeat(64), policyRuleVersion: f.config.complianceRuleSet, reason: "ELIGIBLE" })
    };
    await runAutonomousFacebookPublisher({ ...base, verifyPermissions: async () => ({ permissionsVerified: false }) });
    const heldPath = path.join(f.stateDir, "facebook-held-items.json");
    const held = JSON.parse(fs.readFileSync(heldPath, "utf8"));
    assert.equal(held[0].status, "HELD_CONNECTION_BLOCKED");
    held[0].status = "RELEASED";
    fs.writeFileSync(heldPath, JSON.stringify(held));
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    let publishCalls = 0;
    const result = await runAutonomousFacebookPublisher({
      ...base,
      verifyPermissions: async () => ({ permissionsVerified: true, pageAccessToken: "p".repeat(30) }),
      verifyIdentity: async () => ({ verified: true }),
      publish: async () => { publishCalls++; return { remotePostId: "123456789012345_released" }; },
      readRemote: async () => ({ status: "SCHEDULED_VERIFIED", remoteUrl: "https://www.facebook.com/123456789012345_released", createdTime: "2026-10-25T05:30:00Z", scheduledPublishTime: Date.parse(payload.scheduledAt) / 1000 })
    });
    assert.equal(result.published, 1);
    assert.equal(publishCalls, 1);
    assert.equal(result.heldItemsCount, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), []);
    assert.equal(JSON.parse(fs.readFileSync(heldPath, "utf8"))[0].status, "RELEASED");
  } finally { f.cleanup(); }
});

test("failed held-ledger persistence leaves the original candidate in the active queue", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    const payload = {
      slotId: "nature-frontiers-hold-write-failure-2026-10-25-0800",
      destination: "nature_frontiers_facebook", destinationPageId: "123456789012345",
      scheduledDate: "2026-10-25", scheduledAt: "2026-10-25T06:00:00.000Z",
      caption: "Preserve this exact candidate if hold persistence fails.",
      links: [], media: [], claims: [], campaignId: null
    };
    fs.writeFileSync(f.queuePath, JSON.stringify([payload]));
    const originalOpen = fs.openSync;
    try {
      fs.openSync = function(file, ...args) {
        if (typeof file === "string" && file.includes("facebook-held-items.json.")) {
          const error = new Error("simulated held-ledger persistence failure");
          error.code = "EIO";
          throw error;
        }
        return originalOpen.call(this, file, ...args);
      };
      await assert.rejects(() => runAutonomousFacebookPublisher({
        rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
        now: Date.parse("2026-10-25T05:30:00.000Z"),
        env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) },
        policyEvaluator: async () => ({ eligible: true, blockers: [], warnings: [], contentFingerprint: "e".repeat(64), policyRuleVersion: f.config.complianceRuleSet, reason: "ELIGIBLE" }),
        verifyPermissions: async () => ({ permissionsVerified: false }),
        publish: async () => { throw new Error("must not publish"); }
      }), /simulated held-ledger persistence failure/);
    } finally {
      fs.openSync = originalOpen;
    }
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath, "utf8")), [payload],
      "queue removal must happen only after the full payload is durably held");
    assert.equal(fs.existsSync(path.join(f.stateDir, "facebook-history.json")), false);
    assert.equal(fs.existsSync(path.join(f.stateDir, "facebook-held-items.json")), false);
    assert.equal(fs.existsSync(path.join(f.stateDir, "facebook-publishing.lock")), false);
  } finally { f.cleanup(); }
});

test("scheduled Reel publisher persists remote video ID before upload and verifies scheduled receipt",async()=>{
  const f=setup();
  try {
    Object.assign(f.config,{emergencyStop:false,publishingEnabled:true,dryRun:false});
    fs.writeFileSync(f.configPath,JSON.stringify(f.config));
    const now=Date.parse("2026-10-25T05:30:00.000Z");
    const payload={
      slotId:"nature-frontiers-reel-2026-10-25-0600",destination:"nature_frontiers_facebook",
      destinationPageId:"123456789012345",scheduledDate:"2026-10-25",scheduledAt:"2026-10-25T06:00:00.000Z",
      mediaType:"reel",caption:"Verified wildlife education Reel.",media:[{path:"media/reel.mp4",sha256:"a".repeat(64)}],
      links:[],claims:[],campaignId:null
    };
    fs.writeFileSync(f.queuePath,JSON.stringify([payload]));
    let uploadCalls=0,reconcileCalls=0;
    const result=await runAutonomousFacebookPublisher({
      rootDir:f.root,configPath:f.configPath,queuePath:f.queuePath,stateDir:f.stateDir,now,
      env:{FACEBOOK_PUBLISH_ENABLED:"YES",NATURE_FRONTIERS_FACEBOOK_PAGE_ID:"123456789012345",META_USER_ACCESS_TOKEN:"u".repeat(30)},
      policyEvaluator:async()=>({eligible:true,blockers:[],warnings:[],contentFingerprint:"e".repeat(64),policyRuleVersion:f.config.complianceRuleSet,mediaFingerprints:[{sha256:"a".repeat(64)}],reason:"ELIGIBLE"}),
      verifyPermissions:async()=>({permissionsVerified:true,pageAccessToken:"p".repeat(30)}),
      verifyIdentity:async()=>({verified:true}),
      publish:async()=>{throw new Error("feed-post adapter must not receive a Reel");},
      publishReel:async options=>{
        uploadCalls++;
        assert.equal(options.videoState,"SCHEDULED");
        assert.equal(options.scheduledPublishAt,payload.scheduledAt);
        await options.onRemoteVideoId({remoteVideoId:"987654321098765"});
        const ledger=JSON.parse(fs.readFileSync(path.join(f.stateDir,"facebook-attempt-ledger.json"),"utf8"));
        assert.equal(ledger[0].remoteVideoId,"987654321098765","remote ID must be durable before binary upload");
        return {remoteVideoId:"987654321098765",status:"REMOTE_SCHEDULED_UNVERIFIED"};
      },
      reconcileReel:async options=>{
        reconcileCalls++;
        assert.equal(options.remoteVideoId,"987654321098765");
        return {outcome:"CONFIRMED",receipt:{status:"SCHEDULED_VERIFIED",remotePostId:"987654321098765",remoteVideoId:"987654321098765",scheduledPublishTime:Date.parse(payload.scheduledAt)/1000}};
      }
    });
    assert.equal(result.published,1);
    assert.equal(uploadCalls,1);
    assert.equal(reconcileCalls,1);
    const ledger=JSON.parse(fs.readFileSync(path.join(f.stateDir,"facebook-attempt-ledger.json"),"utf8"));
    assert.equal(ledger[0].kind,"FACEBOOK_PAGE_REEL_PUBLISH_ATTEMPT");
    assert.equal(ledger[0].status,"SCHEDULED_VERIFIED");
    assert.equal(ledger[0].remoteVideoId,"987654321098765");
    assert.equal(ledger[0].verifiedRemotely,true);
    assert.deepEqual(JSON.parse(fs.readFileSync(f.queuePath,"utf8")),[]);
  } finally { f.cleanup(); }
});

test("startup recovers an interrupted Reel upload by its persisted remote video ID without reuploading",async()=>{
  const f=setup();
  try {
    Object.assign(f.config,{emergencyStop:false,publishingEnabled:true,dryRun:false});
    fs.writeFileSync(f.configPath,JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir,{recursive:true});
    const scheduledAt="2026-10-25T06:00:00.000Z";
    const payload={slotId:"nature-frontiers-reel-recovery",destination:"nature_frontiers_facebook",destinationPageId:"123456789012345",
      scheduledDate:"2026-10-25",scheduledAt,mediaType:"reel",caption:"Previously submitted Reel.",media:[],links:[],claims:[],campaignId:null};
    fs.writeFileSync(f.queuePath,JSON.stringify([payload]));
    fs.writeFileSync(path.join(f.stateDir,"facebook-attempt-ledger.json"),JSON.stringify([{
      kind:"FACEBOOK_PAGE_REEL_PUBLISH_ATTEMPT",slotId:payload.slotId,destination:"nature_frontiers_facebook",
      status:"PUBLISHING",startedAt:"2026-10-25T05:30:00.000Z",scheduledAt,remoteVideoId:"987654321098765",
      payload:{caption:payload.caption,scheduledAt,mediaType:"reel"}
    }]));
    let uploadCalls=0,reconcileCalls=0;
    const result=await runAutonomousFacebookPublisher({
      rootDir:f.root,configPath:f.configPath,queuePath:f.queuePath,stateDir:f.stateDir,now:Date.parse("2026-10-25T05:30:00.000Z"),
      env:{FACEBOOK_PUBLISH_ENABLED:"YES",NATURE_FRONTIERS_FACEBOOK_PAGE_ID:"123456789012345",META_USER_ACCESS_TOKEN:"u".repeat(30)},
      verifyPermissions:async()=>({permissionsVerified:true,pageAccessToken:"p".repeat(30)}),
      publishReel:async()=>{uploadCalls++;throw new Error("recovered Reel must never upload again");},
      reconcileReel:async options=>{reconcileCalls++;assert.equal(options.remoteVideoId,"987654321098765");return {outcome:"CONFIRMED",receipt:{status:"SCHEDULED_VERIFIED",remotePostId:"987654321098765",remoteVideoId:"987654321098765",scheduledPublishTime:Date.parse(scheduledAt)/1000}};}
    });
    assert.equal(uploadCalls,0);
    assert.equal(reconcileCalls,1);
    const ledger=JSON.parse(fs.readFileSync(path.join(f.stateDir,"facebook-attempt-ledger.json"),"utf8"));
    assert.equal(ledger[0].status,"SCHEDULED_VERIFIED");
    assert.equal(ledger[0].remoteVideoId,"987654321098765");
    assert.equal(result.skipped,1);
  } finally { f.cleanup(); }
});

test("publisher fsyncs the state directory after each atomic ledger rename", async () => {
  const f = setup();
  const originalFsync = fs.fsyncSync;
  let directoryFsyncs = 0;
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.fsyncSync = function (fd) {
      if (fs.fstatSync(fd).isDirectory()) directoryFsyncs += 1;
      return originalFsync.call(this, fd);
    };
    const result = await runAutonomousFacebookPublisher({
      rootDir: f.root,
      configPath: f.configPath,
      queuePath: f.queuePath,
      stateDir: f.stateDir,
      env: {
        FACEBOOK_PUBLISH_ENABLED: "YES",
        NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345",
        META_USER_ACCESS_TOKEN: "u".repeat(30)
      }
    });
    assert.equal(result.status, "COMPLETED");
    assert.ok(fs.existsSync(path.join(f.stateDir, "facebook-run-summary.json")));
    assert.ok(directoryFsyncs >= 1,
      "the state directory must be fsynced after the summary/ledger atomic rename");
  } finally {
    fs.fsyncSync = originalFsync;
    f.cleanup();
  }
});

test("publisher rejects dangling state-ledger symlinks instead of treating them as empty history", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    fs.symlinkSync(path.join(f.stateDir, "missing-history.json"), path.join(f.stateDir, "facebook-history.json"));
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) }
    }), /state file path contains a symbolic link/i);
  } finally { f.cleanup(); }
});

test("publisher rejects internal state-ledger symlink aliases that could merge history and attempts", async () => {
  const f = setup();
  try {
    Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
    fs.writeFileSync(f.configPath, JSON.stringify(f.config));
    fs.mkdirSync(f.stateDir, { recursive: true });
    fs.writeFileSync(path.join(f.stateDir, "facebook-history.json"), "[]\n");
    fs.symlinkSync(path.join(f.stateDir, "facebook-history.json"), path.join(f.stateDir, "facebook-attempt-ledger.json"));
    await assert.rejects(() => runAutonomousFacebookPublisher({
      rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
      env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) }
    }), /state file path contains a symbolic link/i);
  } finally { f.cleanup(); }
});

test("publisher blocks unknown persisted statuses in history, attempt ledger and held-items ledger", async () => {
  const cases = [
    ["facebook-history.json", [{ status: "PUBLISHED" }]],
    ["facebook-attempt-ledger.json", [{ status: "PENDING" }]],
    ["facebook-held-items.json", [{ status: "HELD_UNKNOWN_NEW_STATE" }]]
  ];
  for (const [filename, rows] of cases) {
    const f = setup();
    try {
      Object.assign(f.config, { emergencyStop: false, publishingEnabled: true, dryRun: false });
      fs.writeFileSync(f.configPath, JSON.stringify(f.config));
      fs.mkdirSync(f.stateDir, { recursive: true });
      fs.writeFileSync(path.join(f.stateDir, filename), JSON.stringify(rows));
      await assert.rejects(() => runAutonomousFacebookPublisher({
        rootDir: f.root, configPath: f.configPath, queuePath: f.queuePath, stateDir: f.stateDir,
        env: { FACEBOOK_PUBLISH_ENABLED: "YES", NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "123456789012345", META_USER_ACCESS_TOKEN: "u".repeat(30) }
      }), /malformed or unknown status data; publishing blocked/i, filename);
    } finally { f.cleanup(); }
  }
});
