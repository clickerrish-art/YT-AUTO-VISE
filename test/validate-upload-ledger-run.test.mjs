import test from "node:test";
import assert from "node:assert/strict";
import { validatePreviousUploadLedger } from "../scripts/validate-upload-ledger-run.mjs";

const base = {
  repository: "clickerrish-art/YT-AUTO-VISE",
  token: "test-token-0123456789",
  currentRunId: "999",
  previousLedgerRunId: "NONE"
};

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return payload; }
  };
}

function run(id, createdAt) {
  return { id, created_at: createdAt, event: "workflow_dispatch" };
}

function fakeFetch({ runs = {}, jobs = {}, artifacts = {}, failPath = null } = {}) {
  const calls = [];
  const fetchImpl = async url => {
    const parsed = new URL(url);
    calls.push(parsed.pathname + parsed.search);
    if (failPath && parsed.pathname.includes(failPath)) return jsonResponse({}, 503);

    const workflowMatch = parsed.pathname.match(/\/actions\/workflows\/([^/]+)\/runs$/);
    if (workflowMatch) {
      const name = decodeURIComponent(workflowMatch[1]);
      return jsonResponse({ workflow_runs: runs[name] ?? [] });
    }
    const jobsMatch = parsed.pathname.match(/\/actions\/runs\/(\d+)\/jobs$/);
    if (jobsMatch) return jsonResponse(jobs[jobsMatch[1]] ?? { jobs: [], total_count: 0 });
    const artifactsMatch = parsed.pathname.match(/\/actions\/runs\/(\d+)\/artifacts$/);
    if (artifactsMatch) return jsonResponse(artifacts[artifactsMatch[1]] ?? { artifacts: [] });
    return jsonResponse({}, 404);
  };
  return { fetchImpl, calls };
}

test("read-only run with failed verification and skipped private-upload does not require a ledger", async () => {
  const { fetchImpl, calls } = fakeFetch({
    runs: {
      "upload-private.yml": [run(42569826008, "2026-11-09T05:53:10Z")],
      "upload-artifact-privately.yml": []
    },
    jobs: {
      "42569826008": {
        total_count: 2,
        jobs: [
          { name: "verify-channel-read-only", status: "completed", conclusion: "failure" },
          { name: "private-upload", status: "completed", conclusion: "skipped" }
        ]
      }
    }
  });
  const result = await validatePreviousUploadLedger({ ...base, fetchImpl });
  assert.equal(result.mode, "initialize");
  assert.equal(result.inspectedWorkflowRuns, 1);
  assert.equal(result.executedPrivateUploadRuns, 0);
  assert.ok(!calls.some(call => call.endsWith("/actions/runs/42569826008/artifacts?per_page=100")));
});

test("a previously executed private-upload job prevents NONE even when it failed", async () => {
  const { fetchImpl } = fakeFetch({
    runs: { "upload-private.yml": [run(700, "2026-11-09T08:00:00Z")] },
    jobs: {
      "700": { total_count: 1, jobs: [{ name: "private-upload", status: "completed", conclusion: "failure" }] }
    }
  });
  await assert.rejects(
    validatePreviousUploadLedger({ ...base, fetchImpl }),
    /prior private-upload job actually executed in workflow run 700/
  );
});

test("restores the latest executed private-upload ledger even when a later read-only run exists", async () => {
  const { fetchImpl } = fakeFetch({
    runs: {
      "upload-private.yml": [
        run(701, "2026-11-10T08:00:00Z"),
        run(700, "2026-11-09T08:00:00Z")
      ],
      "upload-artifact-privately.yml": []
    },
    jobs: {
      "701": { total_count: 2, jobs: [
        { name: "verify-channel-read-only", status: "completed", conclusion: "success" },
        { name: "private-upload", status: "completed", conclusion: "skipped" }
      ] },
      "700": { total_count: 1, jobs: [
        { name: "private-upload", status: "completed", conclusion: "success" }
      ] }
    },
    artifacts: {
      "700": { artifacts: [{ id: 812, name: "sonicvhibez-upload-ledger", expired: false }] }
    }
  });
  const result = await validatePreviousUploadLedger({
    ...base, previousLedgerRunId: "700", fetchImpl
  });
  assert.equal(result.mode, "restore");
  assert.equal(result.previousUploadRunId, "700");
  assert.equal(result.artifactId, 812);
});

test("rejects a stale prior-ledger run ID when a later upload job actually executed", async () => {
  const { fetchImpl } = fakeFetch({
    runs: { "upload-private.yml": [run(701, "2026-11-10T08:00:00Z"), run(700, "2026-11-09T08:00:00Z")] },
    jobs: {
      "701": { total_count: 1, jobs: [{ name: "private-upload", status: "completed", conclusion: "success" }] },
      "700": { total_count: 1, jobs: [{ name: "private-upload", status: "completed", conclusion: "success" }] }
    },
    artifacts: {
      "700": { artifacts: [{ id: 812, name: "sonicvhibez-upload-ledger", expired: false }] }
    }
  });
  await assert.rejects(
    validatePreviousUploadLedger({ ...base, previousLedgerRunId: "700", fetchImpl }),
    /must identify the latest executed private-upload job; latest run is 701/
  );
});

test("fails closed when the prior upload ledger artifact is absent or expired", async () => {
  for (const artifact of [
    { id: 813, name: "other-artifact", expired: false },
    { id: 814, name: "sonicvhibez-upload-ledger", expired: true }
  ]) {
    const { fetchImpl } = fakeFetch({
      runs: { "upload-private.yml": [run(700, "2026-11-09T08:00:00Z")] },
      jobs: {
        "700": { total_count: 1, jobs: [{ name: "private-upload", status: "completed", conclusion: "failure" }] }
      },
      artifacts: { "700": { artifacts: [artifact] } }
    });
    await assert.rejects(
      validatePreviousUploadLedger({ ...base, previousLedgerRunId: "700", fetchImpl }),
      /does not contain exactly one unexpired sonicvhibez-upload-ledger artifact/
    );
  }
});

test("fails closed if job history cannot be inspected", async () => {
  const { fetchImpl } = fakeFetch({
    runs: { "upload-private.yml": [run(700, "2026-11-09T08:00:00Z")] },
    failPath: "/actions/runs/700/jobs"
  });
  await assert.rejects(
    validatePreviousUploadLedger({ ...base, fetchImpl }),
    /returned HTTP 503; refusing to bypass the upload ledger/
  );
});
