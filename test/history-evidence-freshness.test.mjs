import test from "node:test";
import assert from "node:assert/strict";
import { HISTORY_EVIDENCE_MAX_AGE_MS, isFreshHistoryEvidence } from "../scripts/history-evidence-freshness.mjs";

test("history evidence is fresh through the exact 24-hour boundary", () => {
  const now = Date.parse("2026-11-23T08:05:00.000Z");
  assert.equal(
    isFreshHistoryEvidence(new Date(now - HISTORY_EVIDENCE_MAX_AGE_MS).toISOString(), now),
    true
  );
  assert.equal(
    isFreshHistoryEvidence(new Date(now - HISTORY_EVIDENCE_MAX_AGE_MS - 1).toISOString(), now),
    false
  );
});

test("history evidence rejects future, invalid and unparseable timestamps", () => {
  const now = Date.parse("2026-11-23T08:05:00.000Z");
  assert.equal(isFreshHistoryEvidence(new Date(now + 1).toISOString(), now), false);
  assert.equal(isFreshHistoryEvidence("not-a-timestamp", now), false);
  assert.equal(isFreshHistoryEvidence(null, now), false);
});

test("history evidence accepts an injected Date clock without changing the freshness rule", () => {
  const now = new Date("2026-11-23T08:05:00.000Z");
  assert.equal(
    isFreshHistoryEvidence("2026-11-22T08:05:00.000Z", now),
    true
  );
});
