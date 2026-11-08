import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CloudflareDashboardStateStore } from "../scripts/cloudflare-dashboard-state-store.mjs";

const makeState = (extra = {}) => ({
  version: 1, queueItems: [{ id: "draft-1", title: "local title" }],
  campaigns: [], audit: [], jobs: [], uploads: [], facebookDrafts: [],
  facebookPosts: [], facebookAttempts: [], publishingEnabled: false, ...extra
});
const clone = value => JSON.parse(JSON.stringify(value));
function fixture(t, initialLocal = makeState()) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cloudflare-state-store-"));
  const stateFile = path.join(dir, "dashboard-state.json");
  if (initialLocal !== null) fs.writeFileSync(stateFile, JSON.stringify(initialLocal));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return { dir, stateFile };
}
function remoteClient(initial = makeState()) {
  const db = { revision: 1, state: clone(initial), backups: 0, failOnce: false };
  const client = {
    async getState() { return { revision: db.revision, state: clone(db.state), updatedAt: "2026-11-08T00:00:00.000Z" }; },
    async createBackup() { db.backups++; return { backupId: "backup", sourceRevision: db.revision, sha256: "a".repeat(64) }; },
    async bootstrapState(state) { db.revision = 1; db.state = clone(state); return { revision: 1, state: clone(state) }; },
    async updateState(state, expected) {
      if (db.revision !== expected) { const error = new Error("conflict"); error.status = 409; error.code = "REVISION_CONFLICT"; throw error; }
      if (db.failOnce) { db.failOnce = false; throw new Error("simulated connection loss after request"); }
      db.revision++;
      db.state = clone(state);
      return { revision: db.revision, state: clone(state), updatedAt: "2026-11-08T00:01:00.000Z" };
    }
  };
  return { client, db };
}

test("initialization hydrates a missing local file from the authoritative remote snapshot", async t => {
  const { stateFile } = fixture(t, null);
  const { client, db } = remoteClient(makeState({ jobs: [{ id: "job-remote" }] }));
  const store = new CloudflareDashboardStateStore({ client, stateFile, actor: "owner" });
  const state = await store.initialize();
  assert.equal(state.jobs[0].id, "job-remote");
  assert.equal(store.revision, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(stateFile, "utf8")), state);
  assert.equal(JSON.parse(fs.readFileSync(stateFile + ".cloudflare-meta.json", "utf8")).revision, 1);
  assert.equal(db.revision, 1);
});

test("first migration backs up the tracked staging seed and preserves local jobs and Facebook history", async t => {
  const remote = makeState({
    queueItems: [{ id: "draft-1", title: "tracked title" }, { id: "draft-2", title: "tracked second" }],
    audit: [{ id: "seed", action: "STAGING_BASELINE_IMPORTED_FROM_TRACKED_SOURCE" }]
  });
  const local = makeState({
    queueItems: [{ id: "draft-1", title: "local edit" }],
    jobs: [{ id: "job-private" }],
    facebookAttempts: [{ id: "attempt-private", status: "NEEDS_RECONCILIATION" }]
  });
  const { stateFile } = fixture(t, local);
  const { client, db } = remoteClient(remote);
  const store = new CloudflareDashboardStateStore({ client, stateFile, actor: "owner" });
  const merged = await store.initialize();
  assert.equal(db.backups, 1);
  assert.equal(store.revision, 2);
  assert.equal(merged.queueItems.find(x => x.id === "draft-1").title, "local edit");
  assert.equal(merged.queueItems.find(x => x.id === "draft-2").title, "tracked second");
  assert.equal(merged.jobs[0].id, "job-private");
  assert.equal(merged.facebookAttempts[0].id, "attempt-private");
  assert.ok(merged.audit.some(x => x.action === "DASHBOARD_LOCAL_STATE_MERGED_TO_CLOUDFLARE"));
});

test("persist commits remotely before replacing the local state and records the new revision", async t => {
  const initial = makeState();
  const { stateFile } = fixture(t, initial);
  const { client, db } = remoteClient(initial);
  const store = new CloudflareDashboardStateStore({ client, stateFile });
  await store.initialize();
  const next = makeState({ queueItems: [{ id: "draft-1", title: "saved" }] });
  await store.persist(next);
  assert.equal(db.revision, 2);
  assert.equal(store.revision, 2);
  assert.deepEqual(JSON.parse(fs.readFileSync(stateFile, "utf8")), next);
  assert.equal(JSON.parse(fs.readFileSync(stateFile + ".cloudflare-meta.json", "utf8")).revision, 2);
  assert.equal(fs.existsSync(stateFile + ".cloudflare-pending.json"), false);
});

test("known revision conflicts do not change the local committed copy or retain a retry journal", async t => {
  const initial = makeState();
  const { stateFile } = fixture(t, initial);
  const { client, db } = remoteClient(initial);
  const store = new CloudflareDashboardStateStore({ client, stateFile });
  await store.initialize();
  db.revision++;
  db.state = makeState({ queueItems: [{ id: "draft-1", title: "other operator" }] });
  await assert.rejects(store.persist(makeState({ queueItems: [{ id: "draft-1", title: "stale" }] })), error => error.status === 409);
  assert.deepEqual(JSON.parse(fs.readFileSync(stateFile, "utf8")), initial);
  assert.equal(fs.existsSync(stateFile + ".cloudflare-pending.json"), false);
});

test("an uncertain write leaves a journal and startup completes it after observing the remote revision", async t => {
  const initial = makeState();
  const { stateFile } = fixture(t, initial);
  const { client, db } = remoteClient(initial);
  const store = new CloudflareDashboardStateStore({ client, stateFile });
  await store.initialize();
  db.failOnce = true;
  const next = makeState({ queueItems: [{ id: "draft-1", title: "recover me" }] });
  await assert.rejects(store.persist(next), /simulated connection loss/);
  assert.equal(fs.existsSync(stateFile + ".cloudflare-pending.json"), true);
  const recovered = await new CloudflareDashboardStateStore({ client, stateFile }).initialize();
  assert.equal(recovered.queueItems[0].title, "recover me");
  assert.equal(db.revision, 2);
  assert.equal(fs.existsSync(stateFile + ".cloudflare-pending.json"), false);
});

test("remote advancement is adopted when the local copy has not changed since its checkpoint", async t => {
  const initial = makeState();
  const { stateFile } = fixture(t, initial);
  const { client, db } = remoteClient(initial);
  const first = new CloudflareDashboardStateStore({ client, stateFile });
  await first.initialize();
  db.revision = 2;
  db.state = makeState({ jobs: [{ id: "job-from-other-instance" }] });
  const restarted = new CloudflareDashboardStateStore({ client, stateFile });
  const result = await restarted.initialize();
  assert.equal(result.jobs[0].id, "job-from-other-instance");
  assert.equal(restarted.revision, 2);
});

test("divergent local edits without a matching remote checkpoint fail closed", async t => {
  const initial = makeState();
  const { stateFile } = fixture(t, initial);
  const { client } = remoteClient(initial);
  const store = new CloudflareDashboardStateStore({ client, stateFile });
  await store.initialize();
  fs.writeFileSync(stateFile, JSON.stringify(makeState({ queueItems: [{ id: "draft-1", title: "untracked local edit" }] })));
  await assert.rejects(new CloudflareDashboardStateStore({ client, stateFile }).initialize(), /both changed|differs from Cloudflare/);
});

test("bootstrap initializes an empty remote service from the existing local state", async t => {
  const local = makeState({ jobs: [{ id: "local-job" }] });
  const { stateFile } = fixture(t, local);
  const { client, db } = remoteClient(local);
  client.getState = async () => { const error = new Error("not initialized"); error.code = "STATE_NOT_INITIALIZED"; throw error; };
  const store = new CloudflareDashboardStateStore({ client, stateFile });
  const result = await store.initialize();
  assert.equal(result.jobs[0].id, "local-job");
  assert.equal(db.revision, 1);
});

test("Safari campaigns are forced inactive before remote persistence", async t => {
  const remote = makeState({
    campaigns: [{ id: "safari", type: "safari_affiliate", status: "INACTIVE", destinationUrl: "" }],
    audit: [{ id: "seed", action: "STAGING_BASELINE_IMPORTED_FROM_TRACKED_SOURCE" }]
  });
  const local = makeState({ campaigns: [{ id: "safari", type: "safari_affiliate", status: "ACTIVE", destinationUrl: "https://example.com" }] });
  const { stateFile } = fixture(t, local);
  const { client, db } = remoteClient(remote);
  const store = new CloudflareDashboardStateStore({ client, stateFile });
  const result = await store.initialize();
  assert.equal(result.campaigns[0].status, "INACTIVE");
  assert.equal(result.campaigns[0].destinationUrl, "");
  assert.equal(db.state.campaigns[0].status, "INACTIVE");
});
