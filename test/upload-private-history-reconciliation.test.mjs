import test from "node:test";
import assert from "node:assert/strict";
import { assertPrivateUploadPresentInCompleteHistory } from "../scripts/upload-private.mjs";

const actualPublishedAt = "2026-11-06T15:30:00.000Z";
const completeSnapshot = {
  history: [{
    id: "remote-video-123",
    status: "private",
    format: "long_form",
    actualPublishedAt
  }],
  scheduledItems: []
};

test("private upload receipt is reconciled only when the exact remote video appears in complete channel history", () => {
  assert.deepEqual(
    assertPrivateUploadPresentInCompleteHistory(completeSnapshot, {
      videoId: "remote-video-123",
      format: "long_form",
      actualPublishedAt
    }),
    completeSnapshot.history[0]
  );
});

test("private upload receipt cannot advance the cycle when its remote video is absent from complete history", () => {
  assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
    ...completeSnapshot,
    history: []
  }, {
    videoId: "remote-video-123",
    format: "long_form",
    actualPublishedAt
  }), /absent from complete verified channel history/);
});

test("private upload receipt rejects mismatched visibility, format or actual publication time", () => {
  for (const override of [
    { status: "public" },
    { format: "short" },
    { actualPublishedAt: "2026-11-06T15:30:01.000Z" }
  ]) {
    assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
      ...completeSnapshot,
      history: [{ ...completeSnapshot.history[0], ...override }]
    }, {
      videoId: "remote-video-123",
      format: "long_form",
      actualPublishedAt
    }), /does not match the exact remote video/);
  }
});

test("incomplete snapshot and scheduled-only video cannot be treated as actual publication", () => {
  assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
    history: completeSnapshot.history
  }, {
    videoId: "remote-video-123",
    format: "long_form",
    actualPublishedAt
  }), /complete verified channel-history snapshot is required/);

  assert.throws(() => assertPrivateUploadPresentInCompleteHistory({
    history: [],
    scheduledItems: [{ id: "remote-video-123", status: "scheduled" }]
  }, {
    videoId: "remote-video-123",
    format: "long_form",
    actualPublishedAt
  }), /absent from complete verified channel history/);
});
