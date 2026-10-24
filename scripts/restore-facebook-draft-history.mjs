import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const artifactPrefix = "nature-frontiers-facebook-draft-";
const outputPath = process.env.FACEBOOK_DAILY_DRAFT_HISTORY_FILE;
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const apiBase = (process.env.GITHUB_API_URL ?? "https://api.github.com").replace(/\/$/, "");
const currentRunId = process.env.GITHUB_RUN_ID ?? "";

function assertConfiguration(config) {
  if (!config.outputPath || !config.repository || !config.token) {
    throw new Error("GITHUB_REPOSITORY, GITHUB_TOKEN and FACEBOOK_DAILY_DRAFT_HISTORY_FILE are required");
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repository)) throw new Error("Invalid GitHub repository identifier");
  const api = new URL(config.apiBase);
  if (api.protocol !== "https:" || api.username || api.password) throw new Error("GitHub API base must be an HTTPS URL without embedded credentials");
}

async function apiJson(url, fetchImpl, authToken) {
  const response = await fetchImpl(url, {
    headers: { authorization: "Bearer " + authToken, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error("GitHub artifact history API failed with HTTP " + response.status);
  return response.json();
}

async function boundedResponseBuffer(response, maxBytes) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error("Historical artifact archive exceeds the configured size limit");
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("Historical artifact archive exceeds the configured size limit");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}

export function validateFacebookHistoryPackage(item, filenameDate) {
  if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Historical artifact is not a JSON object");
  if (item.schemaVersion !== 1 || item.id !== "nature-frontiers-daily-" + filenameDate || item.date !== filenameDate) throw new Error("Historical artifact identity does not match its filename");
  if (item.destination !== "nature_frontiers_facebook" || item.destinationPageId !== null || item.timezone !== "Africa/Johannesburg") throw new Error("Historical artifact violates destination/timezone safety rules");
  if (!["08:00", "18:00"].includes(item.proposedPublicationTime) || item.experiment?.slot !== item.proposedPublicationTime) throw new Error("Historical artifact has invalid experiment assignment");
  if (item.publishReady !== false || item.publishingEnabled !== false || item.media !== null || item.rightsEvidence !== null) throw new Error("Historical artifact is not draft-only");
  if (!Array.isArray(item.blockers) || !Array.isArray(item.factualClaims)) throw new Error("Historical artifact schema is incomplete");
  return item;
}

export async function restoreFacebookDraftHistory({
  now = new Date(), fetchImpl = fetch, tempDir,
  outputPath: configuredOutputPath = outputPath,
  repository: configuredRepository = repository,
  token: configuredToken = token,
  apiBase: configuredApiBase = apiBase,
  currentRunId: configuredCurrentRunId = currentRunId
} = {}) {
  const config = {
    outputPath: configuredOutputPath, repository: configuredRepository,
    token: configuredToken, apiBase: configuredApiBase
  };
  assertConfiguration(config);
  const tempRoot = tempDir ?? fs.mkdtempSync(path.join(os.tmpdir(), "facebook-history-"));
  fs.mkdirSync(tempRoot, { recursive: true, mode: 0o700 });
  const cutoff = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const artifacts = [];
  let listingComplete = false;
  for (let page = 1; page <= 5; page++) {
    const data = await apiJson(configuredApiBase + "/repos/" + configuredRepository + "/actions/artifacts?per_page=100&page=" + page, fetchImpl, configuredToken);
    if (!Array.isArray(data.artifacts)) throw new Error("GitHub artifact listing has an invalid schema");
    artifacts.push(...data.artifacts);
    if (data.artifacts.length < 100) {
      listingComplete = true;
      break;
    }
  }
  // A full fifth page means more than 500 artifacts may exist. Never build
  // duplicate-prevention history from a silently truncated listing.
  if (!listingComplete) throw new Error("Historical artifact listing reached the 500-item safety limit; refusing incomplete history");
  const candidates = artifacts.filter(item =>
    item && typeof item.name === "string" && item.name.startsWith(artifactPrefix) &&
    item.expired === false && Number.isFinite(Date.parse(item.created_at)) && Date.parse(item.created_at) >= cutoff &&
    String(item.workflow_run?.id ?? "") !== configuredCurrentRunId
  );
  const historyByDate = new Map();
  for (const artifact of candidates) {
    if (!Number.isSafeInteger(Number(artifact.id)) || Number(artifact.id) <= 0) throw new Error("Historical artifact has an invalid identifier");
    const archiveUrl = configuredApiBase + "/repos/" + configuredRepository + "/actions/artifacts/" + encodeURIComponent(String(artifact.id)) + "/zip";
    const response = await fetchImpl(archiveUrl, {
      headers: { authorization: "Bearer " + configuredToken, accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error("Could not download a retained Facebook draft artifact (HTTP " + response.status + ")");
    const archivePath = path.join(tempRoot, String(artifact.id) + ".zip");
    const archiveBytes = await boundedResponseBuffer(response, 10 * 1024 * 1024);
    if (!archiveBytes.length) throw new Error("Historical artifact archive is empty");
    fs.writeFileSync(archivePath, archiveBytes, { mode: 0o600, flag: "wx" });
    const listing = execFileSync("unzip", ["-Z1", archivePath], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 }).split("\n").filter(Boolean);
    if (listing.length !== 1 || listing.some(name => path.basename(name) !== name || !/^\d{4}-\d{2}-\d{2}\.json$/.test(name))) {
      throw new Error("Historical artifact contains an unexpected archive path, filename or file count");
    }
    for (const filename of listing) {
      const date = filename.slice(0, 10);
      const raw = execFileSync("unzip", ["-p", archivePath, filename], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1024 * 1024 + 1 });
      if (Buffer.byteLength(raw, "utf8") > 1024 * 1024) throw new Error("Historical artifact file exceeds the configured size limit");
      const item = validateFacebookHistoryPackage(JSON.parse(raw), date);
      const previous = historyByDate.get(date);
      if (previous && JSON.stringify(previous) !== JSON.stringify(item)) throw new Error("Conflicting historical artifacts exist for " + date + "; operator reconciliation is required");
      historyByDate.set(date, item);
    }
  }
  const history = [...historyByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const destination = path.resolve(configuredOutputPath);
  const parent = path.dirname(destination);
  fs.mkdirSync(parent, { recursive: true, mode: 0o700 });

  // The output path is configurable. Reject symlinks in any existing path
  // component so a caller cannot redirect a history write outside the intended
  // runner/work directory. Replace a regular history file atomically.
  const rootPath = path.parse(destination).root;
  let currentPath = rootPath;
  for (const part of path.relative(rootPath, destination).split(path.sep).filter(Boolean)) {
    currentPath = path.join(currentPath, part);
    if (!fs.existsSync(currentPath)) continue;
    const stat = fs.lstatSync(currentPath);
    if (stat.isSymbolicLink()) throw new Error("History output path contains a symbolic link; refusing to overwrite an unintended destination");
    if (currentPath === destination && !stat.isFile()) throw new Error("History output destination must be a regular file");
  }

  const temporary = destination + "." + process.pid + "." + Math.random().toString(16).slice(2) + ".tmp";
  try {
    fs.writeFileSync(temporary, JSON.stringify(history, null, 2) + "\n", { mode: 0o600, flag: "wx" });
    fs.renameSync(temporary, destination);
  } catch (error) {
    try { fs.rmSync(temporary, { force: true }); } catch {}
    throw error;
  }
  return { count: history.length, dates: history.map(item => item.date), outputPath: destination };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await restoreFacebookDraftHistory();
    console.log(JSON.stringify({ restoredHistoryCount: result.count, dateRange: result.dates.length ? [result.dates[0], result.dates.at(-1)] : [], historyFile: path.basename(result.outputPath) }));
  } catch (error) {
    console.error("BLOCKED: cross-run Facebook history restoration failed closed:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  }
}
