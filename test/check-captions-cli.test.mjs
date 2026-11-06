import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const checker = path.resolve("scripts/check-captions.mjs");

function runChecker(contents) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "caption-check-"));
  const file = path.join(directory, "captions.srt");
  try {
    fs.writeFileSync(file, contents);
    return spawnSync(process.execPath, [checker, file], { encoding: "utf8" });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("caption checker accepts valid CRLF SRT and hour values above 23", () => {
  const srt = [
    "1",
    "25:00:00,000 --> 25:00:01,000",
    "A valid caption.",
    ""
  ].join("\r\n");
  const result = runChecker(srt);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PASS:/);
});

test("caption checker rejects minute fields above 59", () => {
  const result = runChecker("1\n00:60:00,000 --> 00:60:01,000\nInvalid minute.\n");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /minute and second timestamp fields/);
});

test("caption checker rejects second fields above 59", () => {
  const result = runChecker("1\n00:00:60,000 --> 00:00:61,000\nInvalid second.\n");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /minute and second timestamp fields/);
});
