import test from "node:test";
import assert from "node:assert/strict";
import { parseNodeTestSummary } from "../scripts/node-test-summary.mjs";

test("parses Node TAP pass, fail and skip totals as numbers", () => {
  const output = [
    "TAP version 13",
    "ℹ tests 12",
    "ℹ pass 10",
    "ℹ fail 0",
    "ℹ cancelled 0",
    "ℹ skipped 2",
    "ℹ todo 0"
  ].join("\n");
  assert.deepEqual(parseNodeTestSummary(output), { pass: 10, fail: 0, skipped: 2 });
});

test("uses the final TAP summary and strips ANSI color codes", () => {
  const output = "\u001b[32mℹ pass 2\u001b[0m\nℹ fail 0\nℹ skipped 0\n\nℹ pass 5\nℹ fail 1\nℹ skipped 0";
  assert.deepEqual(parseNodeTestSummary(output), { pass: 5, fail: 1, skipped: 0 });
});

test("fails closed when any summary total is missing or malformed", () => {
  assert.equal(parseNodeTestSummary("ℹ pass 2\nℹ fail 0"), null);
  assert.equal(parseNodeTestSummary("ℹ pass NaN\nℹ fail 0\nℹ skipped 0"), null);
});
