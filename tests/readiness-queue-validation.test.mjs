import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

test("readiness report safely diagnoses malformed queue JSON without crashing", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-readiness-json-"));
  const queuePath = path.join(tempDir, "queue.json");
  fs.writeFileSync(queuePath, "{ this is not JSON");
  try {
    const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs"], {
      encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: queuePath }
    });
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stdout, /content\/queue\.json is not valid JSON/);
    assert.doesNotMatch(result.stderr, /SyntaxError/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("readiness report flags duplicate queue IDs", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-readiness-duplicate-"));
  const queuePath = path.join(tempDir, "queue.json");
  const duplicate = {
    publishingEnabled: false,
    items: [
      { id: "same-id", productUrl: "https://selar.com/0u19v8u99l" },
      { id: "same-id", productUrl: "https://selar.com/0u19v8u99l" }
    ]
  };
  fs.writeFileSync(queuePath, JSON.stringify(duplicate));
  try {
    const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs"], {
      encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: queuePath }
    });
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stdout, /Queue contains duplicate item IDs/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
