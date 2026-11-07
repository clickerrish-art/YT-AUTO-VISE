import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { assertNoUnresolvedUploadAttempts, validateHistoryReconciliation, validateHistoryReconciliationSnapshot, assertNextPublicationAllowed, fetchCompleteYoutubeHistorySnapshot } from "../scripts/youtube-history-gate.mjs";

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

test("history reconciliation separates future scheduled videos from actual publication history and enforces their slots", () => {
  const scheduledVideo = {
    id: "vid-scheduled",
    snippet: { channelId, publishedAt: "2026-10-05T00:00:00.000Z" },
    status: { privacyStatus: "private", publishAt: "2026-10-10T15:00:00.000Z" }
  };
  const scheduledReconciliation = {
    ...reconciliation,
    videos: [
      ...reconciliation.videos,
      { id: "vid-scheduled", format: "short", visibility: "private", scheduledAt: "2026-10-10T15:00:00.000Z" }
    ]
  };
  const snapshot = validateHistoryReconciliationSnapshot({
    channelId,
    remoteVideos: [...remoteVideos, scheduledVideo],
    reconciliation: scheduledReconciliation,
    now: new Date("2026-10-05T00:00:00.000Z")
  });
  assert.equal(snapshot.history.length, 2, "a future scheduled upload must not advance the actual-publication cycle");
  assert.deepEqual(snapshot.scheduledItems, [{
    id: "vid-scheduled",
    status: "scheduled",
    scheduledAt: "2026-10-10T15:00:00.000Z",
    format: "short"
  }]);
  assert.throws(() => assertNextPublicationAllowed({
    history: snapshot.history,
    scheduledItems: snapshot.scheduledItems,
    pendingAttempts: [],
    proposedAt: "2026-10-12T15:00:00.000Z",
    jobId: "job-4",
    format: "short"
  }), /blocked upload/);
  assert.doesNotThrow(() => assertNextPublicationAllowed({
    history: snapshot.history,
    scheduledItems: snapshot.scheduledItems,
    pendingAttempts: [],
    proposedAt: "2026-10-13T15:00:00.000Z",
    jobId: "job-4",
    format: "short"
  }), "the recorded owner approval clears the cadence-decision blocker while history and slot checks remain enforced");
  assert.throws(() => validateHistoryReconciliationSnapshot({
    channelId,
    remoteVideos: [...remoteVideos, scheduledVideo],
    reconciliation: { ...scheduledReconciliation, videos: reconciliation.videos },
    now: new Date("2026-10-05T00:00:00.000Z")
  }), /does not cover every remote channel video/);
  assert.throws(() => validateHistoryReconciliationSnapshot({
    channelId,
    remoteVideos: [...remoteVideos, scheduledVideo],
    reconciliation: scheduledReconciliation,
    now: new Date("2026-10-11T00:00:00.000Z")
  }), /past publishAt/);
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


test("history reconciliation rejects normalized invalid dates and timezone-free timestamps", () => {
  for (const invalid of ["2026-02-30T15:00:00.000Z", "2026-10-01T15:00:00", "2026-10-01T15:00:00+14:30", "2026-13-01T15:00:00Z"]) {
    const badRemote = structuredClone(remoteVideos);
    badRemote[0].snippet.publishedAt = invalid;
    assert.throws(() => validateHistoryReconciliation({ channelId, remoteVideos: badRemote, reconciliation }), /timestamp/);
  }
  for (const invalid of ["2026-02-30T10:00:00.000Z", "2026-10-24T10:00:00"]) {
    const badReconciliation = { ...reconciliation, verifiedAt: invalid };
    assert.throws(() => validateHistoryReconciliation({ channelId, remoteVideos, reconciliation: badReconciliation }), /verification timestamp/);
  }
  const badRecord = structuredClone(reconciliation);
  badRecord.videos[0].actualPublishedAt = "2026-02-30T15:00:00.000Z";
  assert.throws(() => validateHistoryReconciliation({ channelId, remoteVideos, reconciliation: badRecord }), /requires visibility and actualPublishedAt/);
});

test("unresolved or uncertain upload attempts block new uploads", () => {
  assert.equal(assertNoUnresolvedUploadAttempts({ attempts: [{ jobId: "job-1", status: "PRIVATE_UPLOAD_VERIFIED" }] }), true);
  assert.throws(() => assertNoUnresolvedUploadAttempts({ attempts: [{ jobId: "job-2", status: "RECOVERY_REQUIRED" }] }), /unresolved upload attempts/);
  assert.throws(() => assertNoUnresolvedUploadAttempts({ attempts: [{ jobId: "job-3", status: "REMOTE_ACCEPTED_RECONCILIATION_REQUIRED" }] }), /unresolved upload attempts/);
  assert.throws(() => assertNoUnresolvedUploadAttempts({ attempts: [{ jobId: "job-4", status: "UPLOAD_OUTCOME_UNCERTAIN" }] }), /unresolved upload attempts/);
  for (const status of ["", "UNKNOWN_STATE", "UPLOADED", null]) {
    assert.throws(
      () => assertNoUnresolvedUploadAttempts({ attempts: [{ jobId: "job-unknown", status }] }),
      /unknown or missing status/
    );
  }
  assert.throws(() => assertNoUnresolvedUploadAttempts({ attempts: [{}] }), /unknown or missing status/);
  assert.throws(() => assertNoUnresolvedUploadAttempts({}), /missing or invalid/);
});

test("cycle gate uses verified history and requires the next expected format and 72-hour gap", () => {
  const history = validateHistoryReconciliation({ channelId, remoteVideos, reconciliation });
  assert.doesNotThrow(
    () => assertNextPublicationAllowed({ history, pendingAttempts: [], proposedAt: "2026-10-07T15:00:00.000Z", jobId: "job-3", format: "short" }),
    "an approved cadence permits a valid next-format slot exactly 72 elapsed hours after the prior publication"
  );
  assert.throws(() => assertNextPublicationAllowed({ history, pendingAttempts: [], proposedAt: "2026-10-07T14:59:59.999Z", jobId: "job-3", format: "short" }), /blocked upload/);
  assert.throws(() => assertNextPublicationAllowed({ history, pendingAttempts: [], proposedAt: "2026-10-07T15:00:00.000Z", jobId: "job-3", format: "long_form" }), /next format must be short/);
});


test("private upload gate accepts the approved cadence but still enforces all other gates", () => {
  const history = validateHistoryReconciliation({ channelId, remoteVideos, reconciliation });
  assert.doesNotThrow(() => assertNextPublicationAllowed({
    history,
    pendingAttempts: [],
    proposedAt: "2026-10-07T15:00:00.000Z",
    jobId: "job-owner-cadence",
    format: "short"
  }));
  assert.throws(() => assertNextPublicationAllowed({
    history,
    pendingAttempts: [{ jobId: "uncertain-job", status: "RECOVERY_REQUIRED" }],
    proposedAt: "2026-10-07T15:00:00.000Z",
    jobId: "job-owner-cadence",
    format: "short"
  }), /unresolved\/uncertain outcome and must be reconciled/);
});


test("complete history fetch verifies authenticated playlist ownership and every paginated playlist item", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "youtube-history-gate-"));
  const reconciliationPath = path.join(directory, "history.json");
  const ids = Array.from({ length: 51 }, (_, index) => "video-" + String(index).padStart(3, "0"));
  const remote = ids.map(id => ({
    id,
    snippet: { channelId, publishedAt: "2026-10-01T15:00:00.000Z" },
    status: { privacyStatus: "private" }
  }));
  fs.writeFileSync(reconciliationPath, JSON.stringify({
    complete: true,
    channelId,
    verifiedBy: "Owner Reviewer",
    verifiedAt: "2026-10-24T10:00:00.000Z",
    videos: ids.map(id => ({
      id,
      format: "long_form",
      visibility: "private",
      actualPublishedAt: "2026-10-01T15:00:00.000Z"
    }))
  }));
  const pageCalls = [];
  const youtube = {
    playlistItems: {
      list: async args => {
        pageCalls.push(args);
        if (args.pageToken === "page-2") {
          return { data: {
            pageInfo: { totalResults: 51 },
            items: [{ contentDetails: { videoId: ids[50] } }]
          } };
        }
        return { data: {
          pageInfo: { totalResults: 51 },
          nextPageToken: "page-2",
          items: ids.slice(0, 50).map(videoId => ({ contentDetails: { videoId } }))
        } };
      }
    },
    videos: {
      list: async ({ id }) => ({
        data: { items: id.split(",").map(videoId => remote.find(item => item.id === videoId)) }
      })
    }
  };
  try {
    const snapshot = await fetchCompleteYoutubeHistorySnapshot(
      youtube,
      { id: channelId, contentDetails: { relatedPlaylists: { uploads: "uploads-playlist" } } },
      reconciliationPath,
      channelId
    );
    assert.equal(snapshot.history.length, 51);
    assert.equal(snapshot.reconciliationSha256, crypto.createHash("sha256").update(fs.readFileSync(reconciliationPath)).digest("hex"), "snapshot must bind the exact reviewed reconciliation document bytes");
    assert.equal(pageCalls.length, 2);
    assert.equal(pageCalls[0].maxResults, 50);
    assert.equal(pageCalls[1].pageToken, "page-2");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("complete history fetch rejects a playlist object from another authenticated channel", async () => {
  await assert.rejects(
    fetchCompleteYoutubeHistorySnapshot(
      { playlistItems: { list: async () => { throw new Error("must not call YouTube"); } } },
      { id: "UC0000000000000000000000", contentDetails: { relatedPlaylists: { uploads: "wrong-playlist" } } },
      "unused-history.json",
      channelId
    ),
    /does not match the configured SonicVhibez channel ID/
  );
});

test("complete history fetch rejects missing IDs, inconsistent totals and incomplete video details", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "youtube-history-gate-"));
  const reconciliationPath = path.join(directory, "history.json");
  fs.writeFileSync(reconciliationPath, JSON.stringify(reconciliation));
  const channel = { id: channelId, contentDetails: { relatedPlaylists: { uploads: "uploads-playlist" } } };
  try {
    await assert.rejects(fetchCompleteYoutubeHistorySnapshot({
      playlistItems: { list: async () => ({ data: {
        pageInfo: { totalResults: 1 },
        items: [{ contentDetails: {} }]
      } }) },
      videos: { list: async () => ({ data: { items: [] } }) }
    }, channel, reconciliationPath, channelId), /missing its remote video ID/);

    let page = 0;
    await assert.rejects(fetchCompleteYoutubeHistorySnapshot({
      playlistItems: { list: async () => ({ data: {
        pageInfo: { totalResults: page++ === 0 ? 2 : 3 },
        ...(page === 1 ? { nextPageToken: "next" } : {}),
        items: [{ contentDetails: { videoId: "video-a" } }]
      } }) },
      videos: { list: async () => ({ data: { items: [] } }) }
    }, channel, reconciliationPath, channelId), /total changed during pagination/);

    await assert.rejects(fetchCompleteYoutubeHistorySnapshot({
      playlistItems: { list: async () => ({ data: {
        pageInfo: { totalResults: 1 },
        items: [{ contentDetails: { videoId: "video-a" } }]
      } }) },
      videos: { list: async () => ({ data: { items: [] } }) }
    }, channel, reconciliationPath, channelId), /video details omitted one or more requested playlist video IDs/);

    await assert.rejects(fetchCompleteYoutubeHistorySnapshot({
      playlistItems: { list: async () => ({ data: {
        pageInfo: { totalResults: 1 },
        items: [{ contentDetails: { videoId: "video-a" } }]
      } }) },
      videos: { list: async () => ({ data: { items: [{
        id: "video-b",
        snippet: { channelId, publishedAt: "2026-10-01T15:00:00.000Z" },
        status: { privacyStatus: "private" }
      }] } }) }
    }, channel, reconciliationPath, channelId), /did not match the requested playlist video IDs/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
