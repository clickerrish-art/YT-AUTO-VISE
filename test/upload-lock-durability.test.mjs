import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { acquireExclusiveUploadLock } from "../scripts/upload-private.mjs";

function temporaryDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sonic-upload-lock-durability-"));
}

test("private upload lock fsyncs its parent directory before returning the release handle", () => {
  const directory = temporaryDirectory();
  const lockPath = path.join(directory, "upload.lock");
  const originalFsync = fs.fsyncSync;
  let directorySyncObserved = false;
  try {
    fs.fsyncSync = function(fd) {
      if (fs.fstatSync(fd).isDirectory()) directorySyncObserved = true;
      return originalFsync.call(fs, fd);
    };
    const release = acquireExclusiveUploadLock(lockPath, { jobId: "job-durable-lock" });
    assert.equal(directorySyncObserved, true, "lock directory entry must be flushed before upload can proceed");
    assert.equal(fs.existsSync(lockPath), true);
    release();
    assert.equal(fs.existsSync(lockPath), false);
  } finally {
    fs.fsyncSync = originalFsync;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("private upload lock is retained when parent-directory durability is uncertain", () => {
  const directory = temporaryDirectory();
  const lockPath = path.join(directory, "upload.lock");
  const originalFsync = fs.fsyncSync;
  try {
    fs.fsyncSync = function(fd) {
      if (fs.fstatSync(fd).isDirectory()) {
        const error = new Error("simulated directory fsync failure");
        error.code = "EIO";
        throw error;
      }
      return originalFsync.call(fs, fd);
    };
    assert.throws(
      () => acquireExclusiveUploadLock(lockPath, { jobId: "job-uncertain-lock" }),
      /directory durability is uncertain; the lock is retained/
    );
    assert.equal(fs.existsSync(lockPath), true, "uncertain lock must remain as a fail-closed barrier");
    assert.match(fs.readFileSync(lockPath, "utf8"), /job-uncertain-lock/);
  } finally {
    fs.fsyncSync = originalFsync;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
