import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const campaignId = "selar-wildlife-vault";
const approvedDestination = "https://selar.com/0u19v8u99l";

function launchDashboard({ stateDir, token }) {
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "campaign-api-acceptance@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: "0",
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

async function waitForReady(instance) {
  // CI runners can be slow while the dashboard imports its full server module graph.
  // Keep polling at 100 ms, but allow up to 30 seconds for the real health endpoint.
  for (let attempt = 0; attempt < 300; attempt++) {
    if (instance.child.exitCode !== null) throw new Error("Dashboard exited before readiness: " + instance.logs);
    let started;
    for (const line of instance.logs.split(/\r?\n/)) {
      try {
        const event = JSON.parse(line);
        if (event.event === "dashboard_started" && Number.isInteger(event.port) && event.port > 0) {
          started = event;
          break;
        }
      } catch {}
    }
    if (started) {
      const base = "http://127.0.0.1:" + started.port;
      try {
        const response = await fetch(base + "/healthz");
        if (response.ok) return base;
      } catch {}
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Dashboard did not become ready: " + instance.logs);
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
  const token = "campaign-api-acceptance-" + "x".repeat(40);
  let base;
  const statePath = path.join(stateDir, "dashboard-state.json");
  let instance = launchDashboard({ stateDir, token });

  t.after(async () => {
    if (instance?.child && instance.child.exitCode === null) {
      try { await stopChild(instance.child); } catch { instance.child.kill("SIGKILL"); }
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  base = await waitForReady(instance);
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const disclosureText = "This product is sold through my own Selar business; purchases generate revenue for my business.";

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
  const unknownCampaign = await fetch(base + "/api/campaigns/manage", {
    method: "POST",
    headers,
    body: JSON.stringify({ campaignId: "missing-campaign", action: "deactivate" })
  });
  assert.equal(unknownCampaign.status, 400, await unknownCampaign.text());
  assert.deepEqual(fs.readFileSync(statePath), afterInvalid, "unknown campaign IDs must not mutate state or audit history");

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

  const concurrentPreviews = await Promise.all([1, 2].map(() => fetch(base + "/api/campaigns/manage", {
    method: "POST",
    headers,
    body: JSON.stringify({ campaignId, action: "preview", destinationUrl: approvedDestination, disclosureText })
  })));
  assert.deepEqual(concurrentPreviews.map(response => response.status), [200, 200]);
  const concurrentPreviewBodies = await Promise.all(concurrentPreviews.map(response => response.json()));
  assert.ok(concurrentPreviewBodies.every(body => body.previewOnly === true && body.publicPublishingEnabled === false));
  persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  campaign = persisted.campaigns.find(item => item.id === campaignId);
  assert.equal(campaign.pendingDestinationUrl, approvedDestination);
  assert.equal(campaign.pendingDisclosureText, disclosureText);
  assert.equal(persisted.audit.filter(event => event.action === "CAMPAIGN_PREVIEW" && event.campaignId === campaignId).length, 3,
    "each serialized preview operation must be durably audited without losing the shared preview state");
  assert.equal(persisted.audit.filter(event => event.action === "CAMPAIGN_PREVIEW" && event.campaignId === campaignId)
    .every(event => event.actor === "campaign-api-acceptance@example.test"), true);

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
  instance = launchDashboard({ stateDir, token });
  base = await waitForReady(instance);
  const stateResponse = await fetch(base + "/api/state", { headers: { "x-operator-token": token } });
  const stateText = await stateResponse.text();
  assert.equal(stateResponse.status, 200, stateText);
  const state = JSON.parse(stateText);
  assert.equal(state.campaigns.find(item => item.id === campaignId).status, "INACTIVE");
  assert.equal(state.audit.filter(event => event.action === "CAMPAIGN_PREVIEW" && event.campaignId === campaignId).length, 3);
  assert.equal(state.audit.filter(event => event.action === "CAMPAIGN_DEACTIVATE" && event.campaignId === campaignId).length, 1);
  assert.equal(state.publishingEnabled ?? false, false);
});


test("generic affiliate campaign API requires preview and owner approval, then persists the isolated draft-only activation", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-affiliate-api-"));
  const token = "affiliate-api-acceptance-" + "x".repeat(40);
  let instance = launchDashboard({ stateDir, token });
  let base;
  t.after(async () => {
    if (instance?.child && instance.child.exitCode === null) {
      try { await stopChild(instance.child); } catch { instance.child.kill("SIGKILL"); }
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });
  base = await waitForReady(instance);
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const campaignId = "external-affiliate-unconfigured";
  const destinationUrl = "https://affiliate.example/serengeti?ref=sonicvhibez";
  const disclosureText = "I may earn a commission if you book through this affiliate link.";
  const previewResponse = await fetch(base + "/api/campaigns/manage", {
    method: "POST", headers, body: JSON.stringify({ campaignId, action: "preview", destinationUrl, disclosureText })
  });
  const previewText = await previewResponse.text();
  assert.equal(previewResponse.status, 200, previewText);
  const preview = JSON.parse(previewText);
  assert.equal(preview.previewOnly, true);
  assert.equal(preview.campaign.status, "INACTIVE");
  assert.equal(preview.publicPublishingEnabled, false);
  const deniedActivation = await fetch(base + "/api/campaigns/manage", {
    method: "POST", headers, body: JSON.stringify({ campaignId, action: "activate", destinationUrl, disclosureText })
  });
  assert.equal(deniedActivation.status, 400);
  assert.match((await deniedActivation.json()).error, /Explicit owner approval/);
  const activation = await fetch(base + "/api/campaigns/manage", {
    method: "POST", headers, body: JSON.stringify({ campaignId, action: "activate", destinationUrl, disclosureText, confirmOwnerApproval: true })
  });
  const activationText = await activation.text();
  assert.equal(activation.status, 200, activationText);
  const saved = JSON.parse(activationText);
  assert.equal(saved.campaign.status, "ACTIVE_FOR_DRAFTS_ONLY");
  assert.equal(saved.campaign.compensationType, "affiliate");
  assert.equal(saved.campaign.destinationUrl, destinationUrl);
  assert.equal(saved.publicPublishingEnabled, false);
  const state = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  const affiliate = state.campaigns.find(item => item.id === campaignId);
  const selar = state.campaigns.find(item => item.id === "selar-wildlife-vault");
  assert.equal(affiliate.status, "ACTIVE_FOR_DRAFTS_ONLY");
  assert.equal(affiliate.destinationUrl, destinationUrl);
  assert.equal(affiliate.approval.destinationVersion, crypto.createHash("sha256").update(destinationUrl + "\n" + disclosureText).digest("hex"));
  assert.equal(selar.destinationUrl, approvedDestination);
  assert.equal(selar.compensationType, "direct_sales_revenue");
  assert.equal(state.publishingEnabled ?? false, false);
});
