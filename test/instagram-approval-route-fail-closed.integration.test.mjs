import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:http";

const root = process.cwd();
const token = "instagram-approval-route-test-" + "x".repeat(40);
const operator = "instagram-approval-route-owner@example.test";

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

function launch(port, stateDir, uploadDir, pageId) {
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      DASHBOARD_OPERATOR_TOKEN: token,
      DASHBOARD_OPERATOR_ID: operator,
      DASHBOARD_STATE_DIR: stateDir,
      FACEBOOK_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: path.relative(root, uploadDir).split(path.sep).join("/"),
      PORT: String(port),
      DASHBOARD_HOST: "127.0.0.1",
      META_PAGE_ACCESS_TOKEN: "",
      META_USER_ACCESS_TOKEN: "",
      NATURE_FRONTIERS_FACEBOOK_PAGE_ID: pageId,
      NATURE_FRONTIERS_INSTAGRAM_ACCOUNT_ID: "",
      INSTAGRAM_APPROVAL_HMAC_SECRET: "",
      FACEBOOK_APPROVAL_HMAC_SECRET: "",
      FACEBOOK_PUBLISH_ENABLED: "NO",
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

async function waitReady(server) {
  const base = "http://127.0.0.1:" + server.port;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.child.exitCode !== null || server.child.signalCode !== null) {
      throw new Error("dashboard server exited before ready: " + server.logs);
    }
    try {
      if ((await fetch(base + "/healthz")).ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("dashboard server readiness timeout: " + server.logs);
}

async function stop(server) {
  if (!server || server.child.exitCode !== null || server.child.signalCode !== null) return;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("dashboard shutdown timeout")), 5000);
    server.child.once("exit", () => { clearTimeout(timer); resolve(); });
    server.child.kill("SIGTERM");
  });
}

test("Instagram approval route fails closed without a verified linked Page and survives restart", async t => {
  const instagramConfig = JSON.parse(fs.readFileSync(path.join(root, "config/instagram-publishing.json"), "utf8"));
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "instagram-approval-state-"));
  const fixtureDir = fs.mkdtempSync(path.join(root, ".instagram-approval-fixture-"));
  const uploadDir = path.join(fixtureDir, "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  const stateFile = path.join(stateDir, "dashboard-state.json");
  const candidateFile = path.join(root, "content/instagram-intake-candidates.json");
  const candidateBefore = fs.existsSync(candidateFile) ? fs.readFileSync(candidateFile) : null;
  let server = launch(await freePort(), stateDir, uploadDir, instagramConfig.facebookPageId);

  t.after(async () => {
    await stop(server).catch(() => {});
    fs.rmSync(stateDir, { recursive: true, force: true });
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  await waitReady(server);
  const base = () => "http://127.0.0.1:" + server.port;
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const payload = {
    slotId: "fixture-instagram-slot-not-approved",
    date: "2026-11-20",
    pillar: "wildlife_behaviour",
    format: "reel",
    caption: "Fixture-only candidate; not approved or publishable.",
    mediaPath: "media/fixture-only.mp4",
    sourceReference: "fixture-only; no rights or source clearance asserted"
  };
  const body = {
    confirmInstagramApproval: true,
    payload,
    reason: "Fixture test confirms missing verified linked Page blocks approval."
  };
  const post = async (requestBody, requestHeaders = headers) => {
    const response = await fetch(base() + "/api/instagram/approve", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestBody)
    });
    return { status: response.status, body: await response.json() };
  };

  const stateBefore = fs.readFileSync(stateFile);
  const unauthorized = await post(body, { "content-type": "application/json" });
  assert.equal(unauthorized.status, 401);

  const missingConfirmation = await post({ ...body, confirmInstagramApproval: false });
  assert.equal(missingConfirmation.status, 400);
  const shortReason = await post({ ...body, reason: "no" });
  assert.equal(shortReason.status, 400);
  assert.deepEqual(fs.readFileSync(stateFile), stateBefore,
    "invalid or unauthenticated approval requests must not mutate dashboard state");

  const blocked = await post(body);
  assert.equal(blocked.status, 409);
  assert.match(blocked.body.error, /recently verified Nature Frontiers Facebook Page/i);
  assert.deepEqual(fs.readFileSync(stateFile), stateBefore,
    "missing verified Page must block approval without state or audit mutation");
  if (candidateBefore === null) {
    assert.equal(fs.existsSync(candidateFile), false,
      "blocked approval must not create an Instagram intake register");
  } else {
    assert.deepEqual(fs.readFileSync(candidateFile), candidateBefore,
      "blocked approval must not append to the Instagram intake register");
  }

  const concurrent = await Promise.all([post(body), post(body)]);
  assert.deepEqual(concurrent.map(result => result.status), [409, 409]);
  assert.deepEqual(fs.readFileSync(stateFile), stateBefore,
    "concurrent blocked approvals must preserve state byte-for-byte");

  await stop(server);
  server = launch(await freePort(), stateDir, uploadDir, instagramConfig.facebookPageId);
  await waitReady(server);
  const afterRestart = await post(body);
  assert.equal(afterRestart.status, 409);
  assert.match(afterRestart.body.error, /recently verified Nature Frontiers Facebook Page/i);
  assert.deepEqual(fs.readFileSync(stateFile), stateBefore,
    "the approval gate must remain fail-closed after a fresh server process");
  if (candidateBefore !== null) {
    assert.deepEqual(fs.readFileSync(candidateFile), candidateBefore);
  }
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(instagramConfig.publishingEnabled, false);
  assert.equal(instagramConfig.dryRun, true);
  assert.equal(instagramConfig.emergencyStop, true);
  assert.ok(Array.isArray(state.audit));
  assert.equal(state.audit.length, 0);
});
