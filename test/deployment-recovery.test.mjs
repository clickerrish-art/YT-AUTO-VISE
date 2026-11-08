import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const operatorToken = "deployment-recovery-test-token-0001";
const operatorId = "deployment-recovery-test";

function copyRelease(target) {
  fs.mkdirSync(target, { recursive: true });
  for (const name of ["scripts", "public"]) {
    fs.cpSync(path.join(repositoryRoot, name), path.join(target, name), { recursive: true });
  }
  fs.mkdirSync(path.join(target, "config"), { recursive: true });
  for (const name of ["campaigns.json", "weekly-content-plan.json"]) {
    fs.copyFileSync(path.join(repositoryRoot, "config", name), path.join(target, "config", name));
  }
  fs.mkdirSync(path.join(target, "content"), { recursive: true });
  fs.copyFileSync(path.join(repositoryRoot, "content", "queue.json"), path.join(target, "content", "queue.json"));
  fs.symlinkSync(path.join(repositoryRoot, "node_modules"), path.join(target, "node_modules"), "dir");
}

async function startRelease(releaseDir, stateDir) {
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: releaseDir,
    env: {
      ...process.env,
      DASHBOARD_HOST: "127.0.0.1",
      DASHBOARD_OPERATOR_TOKEN: operatorToken,
      DASHBOARD_OPERATOR_ID: operatorId,
      DASHBOARD_STATE_DIR: stateDir,
      PORT: "0",
      FACEBOOK_PUBLISH_ENABLED: "NO"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  let errors = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { errors += chunk; });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const match = output.split(/\r?\n/).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).find(event => event?.event === "dashboard_started");
    if (match?.port > 0) return { child, port: match.port, getOutput: () => ({ output, errors }) };
    if (child.exitCode !== null) throw new Error("Dashboard exited before startup: " + errors + output);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  child.kill("SIGKILL");
  throw new Error("Dashboard did not start: " + errors + output);
}

async function stopRelease(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), new Promise((_, reject) => setTimeout(() => reject(new Error("Dashboard did not stop")), 5000))]);
}

async function readPersistedState(port) {
  const response = await fetch(`http://127.0.0.1:${port}/api/state`, { headers: { "x-operator-token": operatorToken } });
  assert.equal(response.status, 200);
  return response.json();
}

test("deployment replacement and process restart preserve external persistent dashboard state", async t => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-deploy-recovery-"));
  const stateDir = path.join(temporaryRoot, "persistent-state");
  const releaseA = path.join(temporaryRoot, "release-a");
  const releaseB = path.join(temporaryRoot, "release-b");
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.mkdirSync(stateDir, { recursive: true });
  copyRelease(releaseA);
  copyRelease(releaseB);

  const marker = { id: "deployment-persistence-marker", title: "Must survive release replacement", status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" };
  fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), JSON.stringify({
    version: 1,
    queueItems: [marker],
    campaigns: [],
    audit: [{ id: "pre-deploy-audit", action: "DEPLOYMENT_RECOVERY_FIXTURE" }],
    jobs: [],
    uploads: [],
    facebookDrafts: [],
    facebookPosts: [],
    facebookAttempts: []
  }, null, 2) + "\n", { mode: 0o600 });

  const first = await startRelease(releaseA, stateDir);
  try {
    const health = await fetch(`http://127.0.0.1:${first.port}/healthz`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).publishingEnabled, false);
    const before = await readPersistedState(first.port);
    assert.deepEqual(before.queueItems, [marker]);
    assert.equal(before.audit[0].id, "pre-deploy-audit");
  } finally {
    await stopRelease(first.child);
  }

  // A replacement release has a distinct code directory but mounts the same persistent state directory.
  const second = await startRelease(releaseB, stateDir);
  try {
    const health = await fetch(`http://127.0.0.1:${second.port}/healthz`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).publishingEnabled, false);
    const after = await readPersistedState(second.port);
    assert.deepEqual(after.queueItems, [marker]);
    assert.equal(after.audit[0].id, "pre-deploy-audit");
    assert.equal(after.publishingEnabled, false);
    const onDisk = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
    assert.deepEqual(onDisk.queueItems, [marker]);
    assert.equal(fs.lstatSync(path.join(stateDir, "dashboard-state.json")).isFile(), true);
  } finally {
    await stopRelease(second.child);
  }
});


test("failed replacement startup rolls back to the previous release without losing persistent state", async t => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-deploy-rollback-"));
  const stateDir = path.join(temporaryRoot, "persistent-state");
  const previousRelease = path.join(temporaryRoot, "previous-release");
  const failedReplacement = path.join(temporaryRoot, "failed-replacement");
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  fs.mkdirSync(stateDir, { recursive: true });
  copyRelease(previousRelease);
  copyRelease(failedReplacement);

  const marker = { id: "rollback-queue-marker", title: "Retain across failed deployment", status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" };
  fs.writeFileSync(path.join(stateDir, "dashboard-state.json"), JSON.stringify({
    version: 1,
    queueItems: [marker],
    campaigns: [],
    audit: [{ id: "rollback-audit-marker", action: "PREVIOUS_RELEASE_ACTIVE" }],
    jobs: [],
    uploads: [],
    facebookDrafts: [],
    facebookPosts: [],
    facebookAttempts: []
  }, null, 2) + "\n", { mode: 0o600 });

  // Establish the known-good release, then stop it as a deployment would.
  const knownGood = await startRelease(previousRelease, stateDir);
  try {
    assert.equal((await fetch(`http://127.0.0.1:${knownGood.port}/healthz`)).status, 200);
    assert.deepEqual((await readPersistedState(knownGood.port)).queueItems, [marker]);
  } finally {
    await stopRelease(knownGood.child);
  }

  // Model a bad replacement artifact: its server entry point is missing.
  fs.rmSync(path.join(failedReplacement, "scripts", "dashboard-server.mjs"));
  const failed = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: failedReplacement,
    env: {
      ...process.env,
      DASHBOARD_HOST: "127.0.0.1",
      DASHBOARD_STATE_DIR: stateDir,
      PORT: "0",
      FACEBOOK_PUBLISH_ENABLED: "NO"
    },
    stdio: "ignore"
  });
  const [exitCode] = await once(failed, "exit");
  assert.notEqual(exitCode, 0, "replacement with a missing entry point must fail startup");

  // Roll back by restarting the previous release against the same persistent volume.
  const recovered = await startRelease(previousRelease, stateDir);
  try {
    const health = await fetch(`http://127.0.0.1:${recovered.port}/healthz`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).publishingEnabled, false);
    const restored = await readPersistedState(recovered.port);
    assert.deepEqual(restored.queueItems, [marker]);
    assert.equal(restored.audit[0].id, "rollback-audit-marker");
    assert.equal(restored.publishingEnabled, false);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8")).queueItems, [marker]);
  } finally {
    await stopRelease(recovered.child);
  }
});

test("manual repository runner defaults to read-only staging checks and requires explicit production dispatch opt-in", () => {
  const workflow = fs.readFileSync(path.join(repositoryRoot, ".github", "workflows", "repository-runner.yml"), "utf8");
  assert.ok(workflow.includes("run_staging_smoke:\n        description: \"Run non-production D1 checks and a temporary R2 integrity probe (safe default)\"\n        required: false\n        type: boolean\n        default: true"));
  assert.ok(workflow.includes("run_repository_runner:\n        description: \"Explicitly opt in to dispatching one approved due production job\"\n        required: false\n        type: boolean\n        default: false"));
  assert.ok(workflow.includes("inputs.run_repository_runner == true"));
  assert.ok(workflow.includes("inputs.run_staging_smoke == true"));
});
