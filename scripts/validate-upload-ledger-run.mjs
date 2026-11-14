import path from "node:path";
import { pathToFileURL } from "node:url";

const WORKFLOWS = ["upload-private.yml", "upload-artifact-privately.yml"];
const PAGE_SIZE = 100;
const MAX_PAGES = 100;

async function requestJson(fetchImpl, url, token) {
  let response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      redirect: "error",
      headers: {
        accept: "application/vnd.github+json",
        authorization: "Bearer " + token,
        "x-github-api-version": "2022-11-28"
      }
    });
  } catch (cause) {
    throw new Error("Could not inspect prior upload history through the GitHub API; refusing to bypass the upload ledger", { cause });
  }
  if (!response?.ok) {
    throw new Error("GitHub upload-history inspection returned HTTP " + (response?.status ?? "unknown") + "; refusing to bypass the upload ledger");
  }
  try {
    return await response.json();
  } catch (cause) {
    throw new Error("GitHub upload-history inspection returned invalid JSON; refusing to bypass the upload ledger", { cause });
  }
}

function validateInputs({ repository, token, currentRunId, previousLedgerRunId }) {
  if (typeof repository !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("GITHUB_REPOSITORY is missing or invalid");
  }
  if (typeof token !== "string" || token.length < 10) {
    throw new Error("GH_TOKEN is missing; cannot inspect previous upload attempts");
  }
  if (!/^\d+$/.test(String(currentRunId ?? ""))) {
    throw new Error("GITHUB_RUN_ID is missing or invalid");
  }
  if (previousLedgerRunId !== "NONE" && !/^\d+$/.test(String(previousLedgerRunId ?? ""))) {
    throw new Error("previous_ledger_run_id must be NONE or a numeric GitHub Actions run ID");
  }
}

export async function validatePreviousUploadLedger(options = {}) {
  const repository = options.repository ?? process.env.GITHUB_REPOSITORY;
  const token = options.token ?? process.env.GH_TOKEN;
  const currentRunId = String(options.currentRunId ?? process.env.GITHUB_RUN_ID ?? "");
  const previousLedgerRunId = String(options.previousLedgerRunId ?? process.env.PREVIOUS_LEDGER_RUN_ID ?? "");
  const fetchImpl = options.fetchImpl ?? fetch;

  validateInputs({ repository, token, currentRunId, previousLedgerRunId });
  const apiRoot = "https://api.github.com/repos/" + repository;
  const priorRuns = new Map();

  // Enumerate all prior manual runs from both private-upload entry points.
  // A read-only dispatch can create workflow history without an upload attempt.
  for (const workflow of WORKFLOWS) {
    let completed = false;
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = apiRoot + "/actions/workflows/" + encodeURIComponent(workflow) +
        "/runs?event=workflow_dispatch&per_page=" + PAGE_SIZE + "&page=" + page;
      const payload = await requestJson(fetchImpl, url, token);
      if (!Array.isArray(payload?.workflow_runs)) {
        throw new Error("GitHub returned an invalid workflow-run list for " + workflow);
      }
      const pageRuns = payload.workflow_runs;
      for (const run of pageRuns) {
        if (!run || !/^\d+$/.test(String(run.id ?? "")) || typeof run.created_at !== "string") {
          throw new Error("GitHub returned an invalid prior workflow-run identity; refusing ledger bypass");
        }
        if (String(run.id) === currentRunId || run.event !== "workflow_dispatch") continue;
        priorRuns.set(String(run.id), run);
      }
      if (pageRuns.length < PAGE_SIZE) {
        completed = true;
        break;
      }
    }
    if (!completed) {
      throw new Error("Prior workflow history exceeded the bounded inspection limit; supply and review the latest retained upload ledger");
    }
  }

  const attemptedRuns = [];
  for (const run of priorRuns.values()) {
    const jobsUrl = apiRoot + "/actions/runs/" + run.id + "/jobs?per_page=100";
    const payload = await requestJson(fetchImpl, jobsUrl, token);
    if (!Array.isArray(payload?.jobs) || (Number.isFinite(payload.total_count) && payload.total_count > PAGE_SIZE)) {
      throw new Error("Could not completely inspect jobs for prior workflow run " + run.id + "; refusing ledger bypass");
    }
    const uploadJobs = payload.jobs.filter(job => job?.name === "private-upload");
    const executedJobs = uploadJobs.filter(job => job?.conclusion !== "skipped");
    if (executedJobs.length > 0) {
      attemptedRuns.push({ run, jobs: executedJobs });
    }
  }

  attemptedRuns.sort((a, b) => b.run.created_at.localeCompare(a.run.created_at));
  const latestAttempt = attemptedRuns[0] ?? null;

  if (previousLedgerRunId === "NONE") {
    if (latestAttempt) {
      throw new Error(
        "A prior private-upload job actually executed in workflow run " + latestAttempt.run.id +
        ". Restore that run's sonicvhibez-upload-ledger artifact; NONE is allowed only when prior upload jobs were skipped or never ran."
      );
    }
    return {
      mode: "initialize",
      previousUploadRunId: null,
      inspectedWorkflowRuns: priorRuns.size,
      executedPrivateUploadRuns: 0
    };
  }

  if (!latestAttempt) {
    throw new Error("previous_ledger_run_id was supplied, but no prior private-upload job actually executed");
  }
  if (String(latestAttempt.run.id) !== previousLedgerRunId) {
    throw new Error(
      "previous_ledger_run_id must identify the latest executed private-upload job; latest run is " +
      latestAttempt.run.id
    );
  }

  const artifactsUrl = apiRoot + "/actions/runs/" + previousLedgerRunId + "/artifacts?per_page=100";
  const artifactsPayload = await requestJson(fetchImpl, artifactsUrl, token);
  if (!Array.isArray(artifactsPayload?.artifacts)) {
    throw new Error("GitHub returned an invalid artifact list for prior upload run " + previousLedgerRunId);
  }
  const ledgers = artifactsPayload.artifacts.filter(artifact =>
    artifact?.name === "sonicvhibez-upload-ledger" && artifact.expired !== true
  );
  if (ledgers.length !== 1) {
    throw new Error(
      "Prior upload run " + previousLedgerRunId +
      " does not contain exactly one unexpired sonicvhibez-upload-ledger artifact; manual reconciliation is required."
    );
  }

  return {
    mode: "restore",
    previousUploadRunId: previousLedgerRunId,
    artifactId: ledgers[0].id,
    inspectedWorkflowRuns: priorRuns.size,
    executedPrivateUploadRuns: attemptedRuns.length
  };
}

async function main() {
  try {
    const result = await validatePreviousUploadLedger();
    if (result.mode === "initialize") {
      console.log(
        "PASS: no prior private-upload job executed; earlier read-only or skipped workflow runs do not require a ledger. A new durable ledger may be initialized."
      );
    } else {
      console.log(
        "PASS: verified the latest retained private-upload ledger in run " +
        result.previousUploadRunId + " (artifact " + result.artifactId + ")."
      );
    }
  } catch (error) {
    console.error("BLOCKED: " + (error instanceof Error ? error.message : "upload-ledger verification failed"));
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
