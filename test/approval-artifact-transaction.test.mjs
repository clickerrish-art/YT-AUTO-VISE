import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { commitApprovalArtifact } from "../scripts/approval-artifact-transaction.mjs";

test("approval artifact becomes visible only after durable state persistence", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "approval-transaction-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const destination = path.join(root, "approvals", "job.json");
  let statePersisted = false;
  const record = { decision: "APPROVE", visibility: "private", jobId: "job-1" };

  commitApprovalArtifact({
    destination,
    record,
    persistState: () => {
      assert.equal(fs.existsSync(destination), false, "final approval must not exist before state persistence");
      statePersisted = true;
    }
  });

  assert.equal(statePersisted, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(destination, "utf8")), record);
  assert.equal(fs.readdirSync(path.dirname(destination)).filter(name => name.endsWith(".tmp")).length, 0);
});

test("failed state persistence leaves no uploadable approval artifact or temporary file", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "approval-transaction-fail-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const destination = path.join(root, "approvals", "job.json");

  assert.throws(() => commitApprovalArtifact({
    destination,
    record: { decision: "APPROVE", visibility: "private", jobId: "job-2" },
    persistState: () => { throw new Error("simulated durable state failure"); }
  }), /simulated durable state failure/);

  assert.equal(fs.existsSync(destination), false);
  assert.equal(fs.readdirSync(path.dirname(destination)).some(name => name.endsWith(".tmp")), false);
});

test("existing or symlinked approval destinations fail closed before state persistence", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "approval-transaction-path-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const parent = path.join(root, "approvals");
  fs.mkdirSync(parent);
  const existing = path.join(parent, "existing.json");
  fs.writeFileSync(existing, "preserve");
  let persisted = false;

  assert.throws(() => commitApprovalArtifact({
    destination: existing,
    record: { decision: "APPROVE" },
    persistState: () => { persisted = true; }
  }), /already exists/);
  assert.equal(persisted, false);
  assert.equal(fs.readFileSync(existing, "utf8"), "preserve");

  const outside = path.join(root, "outside.json");
  fs.writeFileSync(outside, "preserve outside");
  const link = path.join(parent, "linked.json");
  fs.symlinkSync(outside, link);
  assert.throws(() => commitApprovalArtifact({
    destination: link,
    record: { decision: "APPROVE" },
    persistState: () => { persisted = true; }
  }), /symbolic link/);
  assert.equal(persisted, false);
  assert.equal(fs.readFileSync(outside, "utf8"), "preserve outside");
});


test("post-publication cleanup failure rolls back the final approval artifact", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "approval-transaction-rollback-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const destination = path.join(root, "approvals", "job.json");
  const originalUnlink = fs.unlinkSync;
  let failedTempCleanupOnce = false;

  fs.unlinkSync = function (target, ...args) {
    if (!failedTempCleanupOnce && typeof target === "string" && target.endsWith(".tmp")) {
      failedTempCleanupOnce = true;
      const error = new Error("simulated temporary-link cleanup failure");
      error.code = "EIO";
      throw error;
    }
    return originalUnlink.call(this, target, ...args);
  };
  t.after(() => { fs.unlinkSync = originalUnlink; });

  assert.throws(() => commitApprovalArtifact({
    destination,
    record: { decision: "APPROVE", visibility: "private", jobId: "job-rollback" },
    persistState: () => {}
  }), /simulated temporary-link cleanup failure/);

  assert.equal(failedTempCleanupOnce, true);
  assert.equal(fs.existsSync(destination), false, "failed publication must not leave a final-looking approval");
  assert.equal(fs.readdirSync(path.dirname(destination)).some(name => name.endsWith(".tmp")), false);
});
