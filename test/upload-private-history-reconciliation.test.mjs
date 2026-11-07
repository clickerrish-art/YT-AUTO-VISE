import test from "node:test";
import assert from "node:assert/strict";
import { assertPrivateUploadPresentInCompleteHistory } from "../scripts/upload-private.mjs";

const channelId = "UC" + "a".repeat(22);
const actualPublishedAt = "2026-11-06T15:30:00.000Z";
const completeSnapshot = {
  complete: true,
  channelId,
  verifiedAt: "2026-11-06T18:00:00.000Z",
  verifiedBy: "history-reviewer@example.test",
  reconciliationSha256: "a".repeat(64),
  history: [{
    id: "remote-video-123",
    status: "private",
    format: "long_form",
    actualPublishedAt
  }],
  scheduledItems: []
};
const expected = { videoId: "remote-video-123", channelId, format: "long_form", actualPublishedAt };

test("private upload receipt is reconciled only when the exact remote video appears in complete owner-reviewed channel history", () => {
  assert.deepEqual(
    assertPrivateUploadPresentInCompleteHistory(completeSnapshot, expected),
    completeSnapshot.history[0]
  );
});

test("private upload receipt cannot advance the cycle when its remote video is absent from complete history", () => {
  assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
    ...completeSnapshot,
    history: []
  }, expected), /absent from complete verified channel history/);
});

test("private upload receipt rejects mismatched channel, visibility, format or actual publication time", () => {
  assert.throws(() => assertPrivateUploadPresentInCompleteHistory(completeSnapshot, {
    ...expected, channelId: "UC" + "b".repeat(22)
  }), /bound to a different YouTube channel/);
  for (const override of [
    { status: "public" },
    { format: "short" },
    { actualPublishedAt: "2026-11-06T15:30:01.000Z" }
  ]) {
    assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
      ...completeSnapshot,
      history: [{ ...completeSnapshot.history[0], ...override }]
    }, expected), /does not match the exact remote video/);
  }
});

test("incomplete or unreviewed snapshot and scheduled-only video cannot be treated as actual publication", () => {
  assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
    ...completeSnapshot,
    complete: false
  }, expected), /complete owner-verified channel-history snapshot is required/);
  assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
    ...completeSnapshot,
    verifiedBy: " "
  }, expected), /complete owner-verified channel-history snapshot is required/);
  assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
    ...completeSnapshot,
    reconciliationSha256: "invalid"
  }, expected), /complete owner-verified channel-history snapshot is required/);
  assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
    ...completeSnapshot,
    history: [],
    scheduledItems: [{ id: "remote-video-123", status: "scheduled" }]
  }, expected), /absent from complete verified channel history/);
});
