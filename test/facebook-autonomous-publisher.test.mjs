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
