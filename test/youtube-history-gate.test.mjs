import test from "node:test";
import assert from "node:assert/strict";
import { assertNoUnresolvedUploadAttempts, validateHistoryReconciliation, assertNextPublicationAllowed } from "../scripts/youtube-history-gate.mjs";

const channelId = "UC1234567890123456789012";
const remoteVideos = [
  { id: "vid-a", snippet: { channelId, publishedAt: "2026-10-01T15:00:00.000Z" }, status: { privacyStatus: "private" } },
  { id: "vid-b", snippet: { channelId, publishedAt: "2026-10-04T15:00:00.000Z" }, status: { privacyStatus: "unlisted" } }
];
const reconciliation = {
  complete: true, channelId, verifiedBy: "Owner Reviewer", verifiedAt: "2026-10-24T10:00:00.000Z",
  videos: [
    { id: "vid-a", format: "long_form", visibility: "private", actualPublishedAt: "2026-10-01T15:00:00.000Z" },
    { id: "vid-b", format: "long_form", visibility: "unlisted", actualPublishedAt: "2026-10-04T15:00:00.000Z" }
  ]
};

test("history reconciliation binds all public/private/unlisted remote IDs, timestamps and visibility", () => {
  const history = validateHistoryReconciliation({ channelId, remoteVideos, reconciliation });
  assert.equal(history.length, 2);
  assert.deepEqual(history.map(item => item.status), ["private", "unlisted"]);
  assert.equal(history[1].actualPublishedAt, "2026-10-04T15:00:00.000Z");
});

test("history reconciliation fails closed on missing remote videos, duplicate IDs or mismatched timestamps", () => {
  const wrongChannel = structuredClone(remoteVideos);
  wrongChannel[0].snippet.channelId = "UC0000000000000000000000";
  assert.throws(() => validateHistoryReconciliation({ channelId, remoteVideos: wrongChannel, reconciliation }), /does not match the authenticated channel ID/);
  const missingChannel = structuredClone(remoteVideos);
  delete missingChannel[1].snippet.channelId;
  assert.throws(() => validateHistoryReconciliation({ channelId, remoteVideos: missingChannel, reconciliation }), /does not match the authenticated channel ID/);
  assert.throws(() => validateHistoryReconciliation({ channelId, remoteVideos, reconciliation: { ...reconciliation, videos: reconciliation.videos.slice(0, 1) } }), /does not cover every remote channel video/);
  assert.throws(() => validateHistoryReconciliation({ channelId, remoteVideos: [...remoteVideos, remoteVideos[0]], reconciliation }), /duplicate video ID/);
  const changed = structuredClone(reconciliation);
  changed.videos[0].actualPublishedAt = "2026-10-01T16:00:00.000Z";
  assert.throws(() => validateHistoryReconciliation({ channelId, remoteVideos, reconciliation: changed }), /timestamp\/visibility does not match/);
});

test("unresolved or uncertain upload attempts block new uploads", () => {
  assert.equal(assertNoUnresolvedUploadAttempts({ attempts: [{ jobId: "job-1", status: "PRIVATE_UPLOAD_VERIFIED" }] }), true);
  assert.throws(() => assertNoUnresolvedUploadAttempts({ attempts: [{ jobId: "job-2", status: "RECOVERY_REQUIRED" }] }), /unresolved upload attempts/);
  assert.throws(() => assertNoUnresolvedUploadAttempts({}), /missing or invalid/);
});

test("cycle gate uses verified history and requires the next expected format and 72-hour gap", () => {
  const history = validateHistoryReconciliation({ channelId, remoteVideos, reconciliation });
  assert.equal(assertNextPublicationAllowed({ history, pendingAttempts: [], proposedAt: "2026-10-07T15:00:00.000Z", jobId: "job-3", format: "short" }).valid, true);
  assert.throws(() => assertNextPublicationAllowed({ history, pendingAttempts: [], proposedAt: "2026-10-07T14:59:59.999Z", jobId: "job-3", format: "short" }), /blocked upload/);
  assert.throws(() => assertNextPublicationAllowed({ history, pendingAttempts: [], proposedAt: "2026-10-07T15:00:00.000Z", jobId: "job-3", format: "long_form" }), /next format must be short/);
});
