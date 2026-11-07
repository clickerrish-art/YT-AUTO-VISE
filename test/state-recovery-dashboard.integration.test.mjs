import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { backupState } from "../scripts/backup-state.mjs";
import { restoreState } from "../scripts/restore-state.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const operatorToken = "state-recovery-integration-token-0001";

async function startDashboard(stateDir) {
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      DASHBOARD_HOST: "127.0.0.1",
      DASHBOARD_OPERATOR_TOKEN: operatorToken,
      DASHBOARD_OPERATOR_ID: "state-recovery-integration",
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
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const started = output.split(/\r?\n/).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).find(event => event?.event === "dashboard_started");
    if (started?.port > 0) return { child, port: started.port, output: () => output, errors: () => errors };
    if (child.exitCode !== null) return { child, port: null, output: () => output, errors: () => errors };
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  child.kill("SIGKILL");
  throw new Error("Dashboard startup timed out: " + errors + output);
}

async function stopDashboard(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    once(child, "exit"),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Dashboard did not stop")), 5000))
  ]);
}

test("crash recovery blocks dashboard until rollback, then serves the original queue and audit", async t => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-state-dashboard-recovery-"));
  const stateDir = path.join(rootDir, "state");
  const uploadLogDir = path.join(rootDir, "run-logs");
  const rightsDir = path.join(rootDir, "rights");
  const backupDir = path.join(rootDir, "backups");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(uploadLogDir, { recursive: true });
  fs.mkdirSync(rightsDir, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  const originalState = {
    version: 1,
    queueItems: [{ id: "survive-restore-crash", title: "Retain approved work", status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" }],
    campaigns: [],
    audit: [{ id: "audit-before-crash", action: "OWNER_REVIEW_RETAINED" }],
    jobs: [],
    uploads: [],
    facebookDrafts: [],
    facebookPosts: [],
    facebookAttempts: []
  };
  const statePath = path.join(stateDir, "dashboard-state.json");
  fs.writeFileSync(statePath, JSON.stringify(originalState, null, 2) + "\n", { mode: 0o600 });
  fs.writeFileSync(path.join(uploadLogDir, "upload-attempts.json"), JSON.stringify({
    version: 1,
    attempts: [{ attemptId: "uncertain-upload-001", status: "RECOVERY_REQUIRED", remoteOutcome: "UNKNOWN" }]
  }), { mode: 0o600 });
  fs.writeFileSync(path.join(rightsDir, "retained-rights.txt"), "TEST FIXTURE ONLY; not a production rights grant\n", { mode: 0o600 });

  const backupPath = path.join(backupDir, "state-backup.json");
  await backupState({ rootDir, stateDir, uploadLogDir, rightsDir, outputPath: backupPath });
  const preRestoreBytes = fs.readFileSync(statePath);

  // Model a newer local state arriving after the backup. The restore is explicitly
  // authorized in this isolated fixture and must roll it back byte-for-byte on crash.
  const changedState = { ...originalState, queueItems: [], audit: [{ id: "post-backup-change", action: "MUST_BE_ROLLED_BACK" }] };
  fs.writeFileSync(statePath, JSON.stringify(changedState, null, 2) + "\n", { mode: 0o600 });
  const beforeRestoreBytes = fs.readFileSync(statePath);
  // Preserve the production stale-state guard: this fixture models a pre-existing
  // state snapshot, so its mtime must be earlier than the backup timestamp.
  const earlierThanBackup = new Date(Date.parse(JSON.parse(fs.readFileSync(backupPath, "utf8")).createdAt) - 1000);
  fs.utimesSync(statePath, earlierThanBackup, earlierThanBackup);

  const restoreModule = new URL("../scripts/restore-state.mjs", import.meta.url).href;
  const childSource = `
    import fs from "node:fs";
    import path from "node:path";
    const moduleUrl = ${JSON.stringify(restoreModule)};
    const statePath = ${JSON.stringify(statePath)};
    const { restoreState } = await import(moduleUrl);
    const originalRename = fs.renameSync;
    let committed = 0;
    fs.renameSync = function (from, to, ...args) {
      const result = originalRename.call(this, from, to, ...args);
      const target = String(to);
      if (path.basename(target) !== ".restore-transaction.json" &&
          !target.endsWith(".restore-tmp") &&
          !target.endsWith(".rollback-tmp")) {
        committed += 1;
        if (committed === 1) {
          process.exit(86);
        }
      }
      return result;
    };
    await restoreState({
      backupPath: ${JSON.stringify(backupPath)},
      rootDir: ${JSON.stringify(rootDir)},
      stateDir: ${JSON.stringify(stateDir)},
      uploadLogDir: ${JSON.stringify(uploadLogDir)},
      rightsDir: ${JSON.stringify(rightsDir)},
      confirm: "YES",
      overwriteState: true
    });
  `;
  const restoreChild = spawn(process.execPath, ["--input-type=module", "-e", childSource], {
    stdio: ["ignore", "pipe", "pipe"]
  });
  let restoreOutput = "";
  let restoreErrors = "";
  restoreChild.stdout.setEncoding("utf8");
  restoreChild.stderr.setEncoding("utf8");
  restoreChild.stdout.on("data", chunk => { restoreOutput += chunk; });
  restoreChild.stderr.on("data", chunk => { restoreErrors += chunk; });
  const [restoreExit] = await once(restoreChild, "exit");
  assert.equal(restoreExit, 86, "restore child must die immediately after its first durable destination commit: " + restoreErrors);

  const journalPath = path.join(stateDir, ".restore-transaction.json");
  const lockPath = path.join(stateDir, ".restore-operation.lock");
  assert.equal(fs.existsSync(journalPath), true, "the durable recovery journal must survive process death");
  assert.equal(fs.existsSync(lockPath), true, "the operation lock must remain as an operator recovery fence");
  assert.notDeepEqual(fs.readFileSync(statePath), beforeRestoreBytes,
    "the fixture must reach a committed replacement before the simulated crash");

  const blocked = await startDashboard(stateDir);
  assert.equal(blocked.port, null, "dashboard must refuse startup while the restore journal exists");
  assert.equal(blocked.child.exitCode, 2);
  assert.match(blocked.errors(), /interrupted state restore journal exists/);

  // The restore child is confirmed exited. Remove only its exact stale lock,
  // matching the documented operator recovery step; never reap a live owner.
  const staleLock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  assert.equal(staleLock.pid, restoreChild.pid);
  fs.unlinkSync(lockPath);

  await assert.rejects(
    restoreState({ backupPath, rootDir, stateDir, uploadLogDir, rightsDir, confirm: "YES", overwriteState: true }),
    /interrupted restore was rolled back safely.*rerun restore explicitly/i
  );
  assert.deepEqual(fs.readFileSync(statePath), beforeRestoreBytes,
    "restart recovery must restore the exact pre-restore state bytes, including queue and audit");
  assert.equal(fs.existsSync(journalPath), false, "completed recovery must remove its journal");
  assert.equal(fs.existsSync(lockPath), false, "completed recovery must release its operation lock");

  const recovered = await startDashboard(stateDir);
  assert.ok(recovered.port > 0, "dashboard must start after recovery: " + recovered.errors());
  try {
    const health = await fetch(`http://127.0.0.1:${recovered.port}/healthz`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).publishingEnabled, false);
    const stateResponse = await fetch(`http://127.0.0.1:${recovered.port}/api/state`, {
      headers: { "x-operator-token": operatorToken }
    });
    assert.equal(stateResponse.status, 200);
    const served = await stateResponse.json();
    assert.deepEqual(served.queueItems, originalState.queueItems);
    assert.deepEqual(served.audit, originalState.audit);
    assert.equal(served.publishingEnabled, false);
    const uploadLedger = JSON.parse(fs.readFileSync(path.join(uploadLogDir, "upload-attempts.json"), "utf8"));
    assert.equal(uploadLedger.attempts[0].status, "RECOVERY_REQUIRED",
      "the ambiguous upload outcome remains a reconciliation case, not an automatic retry");
    assert.equal(fs.readFileSync(path.join(rightsDir, "retained-rights.txt"), "utf8"),
      "TEST FIXTURE ONLY; not a production rights grant\n");
  } finally {
    await stopDashboard(recovered.child);
  }
});


test("dashboard remains available with unchanged state when restore destination permission is denied", async t => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-state-permission-recovery-"));
  const stateDir = path.join(rootDir, "state");
  const uploadLogDir = path.join(rootDir, "run-logs");
  const rightsDir = path.join(rootDir, "rights");
  const backupDir = path.join(rootDir, "backups");
  for (const directory of [stateDir, uploadLogDir, rightsDir, backupDir]) {
    fs.mkdirSync(directory, { recursive: true });
  }
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  const statePath = path.join(stateDir, "dashboard-state.json");
  const currentState = {
    version: 1,
    queueItems: [{ id: "permission-denied-state", title: "Keep current work", status: "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW" }],
    campaigns: [],
    audit: [{ id: "audit-before-permission-failure", action: "KEEP_CURRENT_STATE" }],
    jobs: [],
    uploads: [],
    facebookDrafts: [],
    facebookPosts: [],
    facebookAttempts: []
  };
  fs.writeFileSync(statePath, JSON.stringify(currentState, null, 2) + "\\n", { mode: 0o600 });
  const backupPath = path.join(backupDir, "state-backup.json");
  await backupState({ rootDir, stateDir, uploadLogDir, rightsDir, outputPath: backupPath });

  const replacementState = {
    ...currentState,
    queueItems: [],
    audit: [{ id: "must-not-commit", action: "RESTORE_REPLACEMENT" }]
  };
  fs.writeFileSync(statePath, JSON.stringify(replacementState, null, 2) + "\\n", { mode: 0o600 });
  const expectedBytes = fs.readFileSync(statePath);
  const earlierThanBackup = new Date(Date.parse(JSON.parse(fs.readFileSync(backupPath, "utf8")).createdAt) - 1000);
  fs.utimesSync(statePath, earlierThanBackup, earlierThanBackup);

  const originalRename = fs.renameSync;
  let destinationDenied = false;
  fs.renameSync = function (from, to, ...args) {
    if (path.resolve(String(to)) === path.resolve(statePath) &&
        String(from).endsWith(".restore-tmp") && !destinationDenied) {
      destinationDenied = true;
      const error = new Error("injected EACCES replacing dashboard state");
      error.code = "EACCES";
      throw error;
    }
    return originalRename.call(this, from, to, ...args);
  };
  try {
    await assert.rejects(
      restoreState({ backupPath, rootDir, stateDir, uploadLogDir, rightsDir, confirm: "YES", overwriteState: true }),
      error => error?.code === "EACCES"
    );
  } finally {
    fs.renameSync = originalRename;
  }

  assert.equal(destinationDenied, true, "restore must reach the protected destination commit boundary");
  assert.deepEqual(fs.readFileSync(statePath), expectedBytes,
    "a denied destination replacement must preserve the exact existing state bytes");
  assert.equal(fs.existsSync(path.join(stateDir, ".restore-transaction.json")), false,
    "a pre-commit permission denial must not leave a misleading recovery journal");
  assert.equal(fs.existsSync(path.join(stateDir, ".restore-operation.lock")), false,
    "the failed operation must release its own lock");
  assert.equal(fs.readdirSync(stateDir).some(name => name.endsWith(".restore-tmp")), false,
    "the denied destination must not leave staged restore files behind");

  const dashboard = await startDashboard(stateDir);
  assert.ok(dashboard.port > 0, "dashboard must remain available after the denied restore: " + dashboard.errors());
  try {
    const response = await fetch(`http://127.0.0.1:${dashboard.port}/api/state`, {
      headers: { "x-operator-token": operatorToken }
    });
    assert.equal(response.status, 200);
    const served = await response.json();
    assert.deepEqual(served.queueItems, replacementState.queueItems);
    assert.deepEqual(served.audit, replacementState.audit);
    assert.equal(served.publishingEnabled, false);
  } finally {
    await stopDashboard(dashboard.child);
  }
});
