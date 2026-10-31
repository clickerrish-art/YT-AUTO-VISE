import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const campaignId = "selar-wildlife-vault";
const approvedDestination = "https://selar.com/0u19v8u99l";

async function reservePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  return port;
}

function launchDashboard({ port, stateDir, token }) {
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "campaign-api-acceptance@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      META_PAGE_ACCESS_TOKEN: "",
      META_USER_ACCESS_TOKEN: "",
      NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "",
      FACEBOOK_PUBLISH_ENABLED: "",
      YOUTUBE_CLIENT_ID: "",
      YOUTUBE_CLIENT_SECRET: "",
      YOUTUBE_REFRESH_TOKEN: "",
      SONICVHIBEZ_CHANNEL_ID: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  return { child, get logs() { return logs; } };
}

async function waitForReady(base, child, readLogs) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error("Dashboard exited before readiness: " + readLogs());
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Dashboard did not become ready: " + readLogs());
}

async function stopChild(child, signal = "SIGTERM") {
  if (child.exitCode !== null) return;
  child.kill(signal);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Dashboard did not stop")), 5000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

test("campaign management API previews and deactivates the approved campaign with durable audit and restart recovery", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-campaign-api-"));
  const port = await reservePort();
  const token = "campaign-api-acceptance-" + "x".repeat(40);
  const base = "http://127.0.0.1:" + port;
  const statePath = path.join(stateDir, "dashboard-state.json");
  let instance = launchDashboard({ port, stateDir, token });

  t.after(async () => {
    if (instance?.child && instance.child.exitCode === null) {
      try { await stopChild(instance.child); } catch { instance.child.kill("SIGKILL"); }
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  await waitForReady(base, instance.child, () => instance.logs);
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const disclosureText = "Promotional link: review current details and terms on the seller page.";

  const invalidResponse = await fetch(base + "/api/campaigns/manage", {
    method: "POST",
    headers,
    body: JSON.stringify({
      campaignId,
      action: "preview",
      destinationUrl: "https://example.invalid/not-approved",
      disclosureText
    })
  });
  assert.equal(invalidResponse.status, 400, await invalidResponse.text());
  const afterInvalid = fs.readFileSync(statePath);

  const previewResponse = await fetch(base + "/api/campaigns/manage", {
    method: "POST",
    headers,
    body: JSON.stringify({ campaignId, action: "preview", destinationUrl: approvedDestination, disclosureText })
  });
  const previewText = await previewResponse.text();
  assert.equal(previewResponse.status, 200, previewText);
  const preview = JSON.parse(previewText);
  assert.equal(preview.previewOnly, true);
  assert.equal(preview.publicPublishingEnabled, false);
  assert.equal(preview.campaign.pendingDestinationUrl, approvedDestination);
  assert.equal(preview.campaign.pendingDisclosureText, disclosureText);
  assert.match(preview.campaign.pendingDestinationVersion, /^[a-f0-9]{64}$/);
  assert.equal(preview.campaign.status, "ACTIVE_FOR_DRAFTS_ONLY");
  assert.equal(Object.hasOwn(preview.campaign, "approval"), false);

  let persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  let campaign = persisted.campaigns.find(item => item.id === campaignId);
  assert.equal(campaign.pendingDestinationUrl, approvedDestination);
  assert.equal(campaign.pendingDisclosureText, disclosureText);
  assert.equal(persisted.audit.filter(event => event.action === "CAMPAIGN_PREVIEW" && event.campaignId === campaignId).length, 1);
  assert.equal(persisted.audit.find(event => event.action === "CAMPAIGN_PREVIEW" && event.campaignId === campaignId).actor, "campaign-api-acceptance@example.test");
  assert.notDeepEqual(fs.readFileSync(statePath), afterInvalid, "successful preview must persist the campaign state");

  const deactivateResponse = await fetch(base + "/api/campaigns/manage", {
    method: "POST",
    headers,
    body: JSON.stringify({ campaignId, action: "deactivate" })
  });
  const deactivateText = await deactivateResponse.text();
  assert.equal(deactivateResponse.status, 200, deactivateText);
  const deactivated = JSON.parse(deactivateText);
  assert.equal(deactivated.previewOnly, false);
  assert.equal(deactivated.campaign.status, "INACTIVE");
  assert.equal(Object.hasOwn(deactivated.campaign, "pendingDestinationUrl"), false);
  assert.equal(Object.hasOwn(deactivated.campaign, "pendingDisclosureText"), false);
  assert.equal(Object.hasOwn(deactivated.campaign, "pendingDestinationVersion"), false);

  persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  campaign = persisted.campaigns.find(item => item.id === campaignId);
  assert.equal(campaign.status, "INACTIVE");
  assert.equal(Object.hasOwn(campaign, "pendingDestinationUrl"), false);
  assert.equal(persisted.audit.filter(event => event.action === "CAMPAIGN_DEACTIVATE" && event.campaignId === campaignId).length, 1);
  assert.equal(persisted.audit.filter(event => event.campaignId === campaignId).every(event => event.actor === "campaign-api-acceptance@example.test"), true);

  await stopChild(instance.child, "SIGKILL");
  instance = launchDashboard({ port, stateDir, token });
  await waitForReady(base, instance.child, () => instance.logs);
  const stateResponse = await fetch(base + "/api/state", { headers: { "x-operator-token": token } });
  const stateText = await stateResponse.text();
  assert.equal(stateResponse.status, 200, stateText);
  const state = JSON.parse(stateText);
  assert.equal(state.campaigns.find(item => item.id === campaignId).status, "INACTIVE");
  assert.equal(state.audit.filter(event => event.action === "CAMPAIGN_PREVIEW" && event.campaignId === campaignId).length, 1);
  assert.equal(state.audit.filter(event => event.action === "CAMPAIGN_DEACTIVATE" && event.campaignId === campaignId).length, 1);
  assert.equal(state.publishingEnabled, false);
});
