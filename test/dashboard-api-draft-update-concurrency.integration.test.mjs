import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const token = "draft-update-concurrency-" + "x".repeat(40);

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

function launchDashboard(port, stateDir) {
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: "draft-update-concurrency@example.test",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: stateDir,
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      FACEBOOK_PUBLISH_ENABLED: "NO",
      FACEBOOK_RUNTIME_KILL_SWITCH: "YES",
      META_PAGE_ACCESS_TOKEN: "",
      META_USER_ACCESS_TOKEN: "",
      NATURE_FRONTIERS_FACEBOOK_PAGE_ID: "",
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
  return { child, port, get logs() { return logs; } };
}

async function waitForReady(instance) {
  const base = "http://127.0.0.1:" + instance.port;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (instance.child.exitCode !== null || instance.child.signalCode !== null) {
      throw new Error("Dashboard exited before becoming ready: " + instance.logs);
    }
    try {
      const response = await fetch(base + "/healthz");
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Dashboard did not become ready: " + instance.logs);
}

async function stopDashboard(instance) {
  if (!instance || instance.child.exitCode !== null || instance.child.signalCode !== null) return;
  const exited = new Promise(resolve => instance.child.once("exit", resolve));
  instance.child.kill("SIGTERM");
  await exited;
}

test("draft updates serialize concurrent writes and persist with audit history across restart", async t => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-draft-update-concurrency-"));
  const statePath = path.join(stateDir, "dashboard-state.json");
  let instance;
  t.after(async () => {
    await stopDashboard(instance);
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const start = async () => {
    instance = launchDashboard(await reservePort(), stateDir);
    await waitForReady(instance);
    return instance;
  };
  await start();

  const headers = { "content-type": "application/json", "x-operator-token": token };
  const base = () => "http://127.0.0.1:" + instance.port;
  const post = (route, payload) => fetch(base() + route, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  const createDraft = async ({ id, title, topic, contentType, scheduledDay, scheduledDate }) => {
    const draft = {
      id, title, topic, contentType, scheduledDay, scheduledDate,
      productUrl: "https://selar.com/0u19v8u99l"
    };
    const response = await post("/api/drafts", draft);
    const body = await response.json();
    assert.equal(response.status, 201, JSON.stringify(body));
    return draft;
  };

  const tuesday = await createDraft({
    id: "draft-update-concurrency-tuesday",
    title: "Tuesday draft before edit",
    topic: "A wildlife creator planning workflow",
    contentType: "long_form",
    scheduledDay: "Tuesday",
    scheduledDate: "2026-11-10"
  });
  const saturday = await createDraft({
    id: "draft-update-concurrency-saturday",
    title: "Saturday draft before edit",
    topic: "An ethical wildlife filming workflow",
    contentType: "short",
    scheduledDay: "Saturday",
    scheduledDate: "2026-11-14"
  });

  const updates = [
    { ...tuesday, title: "Tuesday draft after concurrent edit", topic: "Updated Tuesday planning workflow" },
    { ...saturday, title: "Saturday draft after concurrent edit", topic: "Updated Saturday filming workflow" }
  ];
  const responses = await Promise.all(updates.map(item => post("/api/drafts/update", item)));
  const outcomes = await Promise.all(responses.map(async response => ({
    status: response.status,
    body: await response.json()
  })));
  assert.deepEqual(outcomes.map(item => item.status), [200, 200],
    "concurrent edits to distinct drafts must both succeed without a lost update");
  for (const update of updates) {
    const outcome = outcomes.find(item => item.body.item?.id === update.id);
    assert.ok(outcome, "each response must identify the draft it updated");
    assert.equal(outcome.body.item.title, update.title);
    assert.equal(outcome.body.item.topic, update.topic);
  }

  const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
  for (const update of updates) {
    const item = persisted.queueItems.find(entry => entry.id === update.id);
    assert.equal(item.title, update.title);
    assert.equal(item.topic, update.topic);
    assert.equal(persisted.audit.filter(event =>
      event.action === "DRAFT_EDITED" &&
      event.itemId === update.id &&
      event.actor === "draft-update-concurrency@example.test"
    ).length, 1, "each committed edit must have exactly one operator-attributed audit event");
  }
  assert.ok(persisted.jobs.length >= 2 && persisted.jobs.every(job => job.publishingEnabled === false),
    "every persisted production job must remain non-publishable");

  await stopDashboard(instance);
  instance = null;
  await start();

  const recoveredResponse = await fetch(base() + "/api/state", {
    headers: { "x-operator-token": token }
  });
  const recovered = await recoveredResponse.json();
  assert.equal(recoveredResponse.status, 200);
  for (const update of updates) {
    const item = recovered.queueItems.find(entry => entry.id === update.id);
    assert.equal(item.title, update.title, "updated title must survive dashboard restart");
    assert.equal(item.topic, update.topic, "updated topic must survive dashboard restart");
    assert.equal(recovered.audit.filter(event =>
      event.action === "DRAFT_EDITED" &&
      event.itemId === update.id &&
      event.actor === "draft-update-concurrency@example.test"
    ).length, 1, "the original edit audit event must survive restart without duplication");
  }
  assert.equal(recovered.publishingEnabled, false);
});
