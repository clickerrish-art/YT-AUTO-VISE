import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { authenticate, constantTimeEqual, handleRequest, operatorIdentity, validateDashboardState } from "../cloudflare/worker.js";

const validState = () => ({
  version: 1,
  queueItems: [],
  campaigns: [],
  audit: [],
  jobs: [],
  uploads: [],
  facebookDrafts: [],
  facebookPosts: [],
  facebookAttempts: [],
  publishingEnabled: false
});

test("operator token comparison is constant-time in structure and rejects unequal values", () => {
  assert.equal(constantTimeEqual("same-token", "same-token"), true);
  assert.equal(constantTimeEqual("same-token", "same-tokeN"), false);
  assert.equal(constantTimeEqual("short", "much-longer"), false);
  assert.equal(constantTimeEqual("", ""), true);
});

test("state API authentication requires a configured high-entropy operator token", async () => {
  const request = new Request("https://state.example/api/state", { headers: { "x-operator-token": "a".repeat(24) } });
  assert.equal(await authenticate(request, { DASHBOARD_OPERATOR_TOKEN: "a".repeat(24) }), true);
  assert.equal(await authenticate(request, { DASHBOARD_OPERATOR_TOKEN: "short" }), false);
  assert.equal(await authenticate(request, {}), false);
});

test("validates the existing dashboard state collections", () => {
  assert.equal(validateDashboardState(validState()).version, 1);
  for (const key of ["queueItems", "audit", "jobs", "uploads"]) {
    const state = validState();
    state[key] = {};
    assert.throws(() => validateDashboardState(state), new RegExp(key));
  }
});

test("rejects publishing enablement and active Safari campaigns", () => {
  const publishing = validState();
  publishing.publishingEnabled = true;
  assert.throws(() => validateDashboardState(publishing), /Publishing must remain disabled/);
  const safari = validState();
  safari.campaigns = [{ type: "safari_affiliate", status: "ACTIVE" }];
  assert.throws(() => validateDashboardState(safari), /Safari affiliate campaigns must remain inactive/);
});

test("accepts legacy state without optional Facebook arrays without inventing them", () => {
  const legacy = validState();
  delete legacy.facebookDrafts;
  delete legacy.facebookPosts;
  delete legacy.facebookAttempts;
  assert.equal(validateDashboardState(legacy).facebookDrafts, undefined);
});

test("health endpoint exposes only the fail-closed service status", async () => {
  const response = await handleRequest(new Request("https://state.example/healthz"), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "sonicvhibez-durable-state",
    publishingEnabled: false
  });
});

test("state endpoints reject missing operator authentication before database access", async () => {
  const response = await handleRequest(new Request("https://state.example/api/state"), {});
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("write operations require an explicit operator identity for audit attribution", () => {
  assert.equal(operatorIdentity({ DASHBOARD_OPERATOR_ID: "owner-operator" }), "owner-operator");
  assert.equal(operatorIdentity({ DASHBOARD_OPERATOR_ID: " " }), null);
  assert.equal(operatorIdentity({ DASHBOARD_OPERATOR_ID: "x".repeat(121) }), null);
  assert.equal(operatorIdentity({}), null);
});


function createRestoreDatabase({ current, backup }) {
  let state = { ...current };
  const backups = new Map([[backup.backupId, { ...backup }]]);
  let batchCalls = 0;
  const prepare = sql => ({
    bind: (...values) => ({
      sql,
      values,
      first: async () => {
        if (sql.includes("FROM dashboard_state")) return { ...state };
        if (sql.includes("FROM dashboard_backups")) return backups.get(values[0]) ?? null;
        throw new Error("Unexpected D1 first query: " + sql);
      },
      run: async () => {
        if (sql.startsWith("INSERT INTO dashboard_backups")) {
          backups.set(values[0], {
            backup_id: values[0],
            source_revision: values[1],
            state_json: values[2],
            sha256: values[3],
            created_at: values[4],
            reason: "OPERATOR_REQUESTED:" + values[5]
          });
          return { meta: { changes: 1 } };
        }
        throw new Error("Unexpected D1 run query: " + sql);
      }
    })
  });
  return {
    prepare,
    async batch(statements) {
      batchCalls++;
      const [backupInsert, stateUpdate] = statements;
      const [backupId, digest, createdAt, actor, singletonId, expectedRevision] = backupInsert.values;
      if (Number(state.revision) !== Number(expectedRevision)) {
        return [{ meta: { changes: 0 } }, { meta: { changes: 0 } }];
      }
      backups.set(backupId, {
        backup_id: backupId,
        source_revision: state.revision,
        state_json: state.state_json,
        sha256: digest,
        created_at: createdAt,
        reason: "AUTOMATIC_PRE_RESTORE:" + actor
      });
      const [stateJson, updatedAt, updateSingletonId, updateExpectedRevision] = stateUpdate.values;
      if (Number(state.revision) !== Number(updateExpectedRevision)) {
        return [{ meta: { changes: 1 } }, { meta: { changes: 0 } }];
      }
      state = {
        ...state,
        revision: Number(state.revision) + 1,
        state_json: stateJson,
        updated_at: updatedAt
      };
      return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }];
    },
    snapshot: () => ({ state: { ...state }, backups: [...backups.values()], batchCalls })
  };
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("backup restore verifies the backup hash, checks revision, and preserves a pre-restore backup", async () => {
  const restoredState = validState();
  restoredState.queueItems = [{ id: "restored-queue-item" }];
  const backupJson = JSON.stringify(restoredState);
  const currentJson = JSON.stringify(validState());
  const db = createRestoreDatabase({
    current: { revision: 7, state_json: currentJson, updated_at: "2026-11-17T00:00:00.000Z" },
    backup: { backupId: "backup-valid", state_json: backupJson, sha256: sha256Text(backupJson) }
  });
  const response = await handleRequest(new Request("https://state.example/api/backups/restore", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-operator-token": "operator-token-".padEnd(40, "x")
    },
    body: JSON.stringify({ backupId: "backup-valid", expectedRevision: 7 })
  }), {
    DASHBOARD_OPERATOR_TOKEN: "operator-token-".padEnd(40, "x"),
    DASHBOARD_OPERATOR_ID: "test-owner",
    STATE_DB: db
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.revision, 8);
  assert.deepEqual(result.state.queueItems, [{ id: "restored-queue-item" }]);
  assert.equal(result.state.audit.at(-1).action, "DASHBOARD_STATE_RESTORED");
  assert.equal(result.state.audit.at(-1).backupId, "backup-valid");
  const snapshot = db.snapshot();
  assert.equal(snapshot.batchCalls, 1);
  assert.equal(snapshot.backups.length, 2, "the pre-restore state must be backed up before replacement");
  assert.equal(snapshot.state.revision, 8);
});

test("backup restore refuses a corrupted backup without mutating state", async () => {
  const backupJson = JSON.stringify(validState());
  const db = createRestoreDatabase({
    current: { revision: 4, state_json: JSON.stringify(validState()), updated_at: "2026-11-17T00:00:00.000Z" },
    backup: { backupId: "backup-corrupt", state_json: backupJson, sha256: "0".repeat(64) }
  });
  const response = await handleRequest(new Request("https://state.example/api/backups/restore", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-operator-token": "operator-token-".padEnd(40, "x")
    },
    body: JSON.stringify({ backupId: "backup-corrupt", expectedRevision: 4 })
  }), {
    DASHBOARD_OPERATOR_TOKEN: "operator-token-".padEnd(40, "x"),
    DASHBOARD_OPERATOR_ID: "test-owner",
    STATE_DB: db
  });
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /integrity check failed/);
  const snapshot = db.snapshot();
  assert.equal(snapshot.batchCalls, 0);
  assert.equal(snapshot.state.revision, 4);
});

test("backup restore refuses a stale expected revision without mutating state", async () => {
  const backupJson = JSON.stringify(validState());
  const db = createRestoreDatabase({
    current: { revision: 4, state_json: JSON.stringify(validState()), updated_at: "2026-11-17T00:00:00.000Z" },
    backup: { backupId: "backup-stale", state_json: backupJson, sha256: sha256Text(backupJson) }
  });
  const response = await handleRequest(new Request("https://state.example/api/backups/restore", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-operator-token": "operator-token-".padEnd(40, "x")
    },
    body: JSON.stringify({ backupId: "backup-stale", expectedRevision: 3 })
  }), {
    DASHBOARD_OPERATOR_TOKEN: "operator-token-".padEnd(40, "x"),
    DASHBOARD_OPERATOR_ID: "test-owner",
    STATE_DB: db
  });
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /revision conflict/);
  const snapshot = db.snapshot();
  assert.equal(snapshot.batchCalls, 0);
  assert.equal(snapshot.state.revision, 4);
});
