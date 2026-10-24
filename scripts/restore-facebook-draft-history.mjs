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
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assertConfiguration() {
  if (!outputPath || !repository || !token) {
    throw new Error("GITHUB_REPOSITORY, GITHUB_TOKEN and FACEBOOK_DAILY_DRAFT_HISTORY_FILE are required");
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error("Invalid GitHub repository identifier");
}

async function apiJson(url) {
  const response = await fetch(url, {
    headers: { authorization: "Bearer " + token, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error("GitHub artifact history API failed with HTTP " + response.status);
  return response.json();
}

function validatePackage(item, filenameDate) {
  if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Historical artifact is not a JSON object");
  if (item.schemaVersion !== 1 || item.id !== "nature-frontiers-daily-" + filenameDate || item.date !== filenameDate) throw new Error("Historical artifact identity does not match its filename");
  if (item.destination !== "nature_frontiers_facebook" || item.destinationPageId !== null || item.timezone !== "Africa/Johannesburg") throw new Error("Historical artifact violates destination/timezone safety rules");
  if (!["08:00", "18:00"].includes(item.proposedPublicationTime) || item.experiment?.slot !== item.proposedPublicationTime) throw new Error("Historical artifact has invalid experiment assignment");
  if (item.publishReady !== false || item.publishingEnabled !== false || item.media !== null || item.rightsEvidence !== null) throw new Error("Historical artifact is not draft-only");
  if (!Array.isArray(item.blockers) || !Array.isArray(item.factualClaims)) throw new Error("Historical artifact schema is incomplete");
  return item;
}

export async function restoreFacebookDraftHistory({ now = new Date(), fetchImpl = fetch, tempDir } = {}) {
  assertConfiguration();
  const tempRoot = tempDir ?? fs.mkdtempSync(path.join(os.tmpdir(), "facebook-history-"));
  fs.mkdirSync(tempRoot, { recursive: true, mode: 0o700 });
  const cutoff = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const artifacts = [];
  for (let page = 1; page <= 5; page++) {
    const data = await apiJson(apiBase + "/repos/" + repository + "/actions/artifacts?per_page=100&page=" + page);
    if (!Array.isArray(data.artifacts)) throw new Error("GitHub artifact listing has an invalid schema");
    artifacts.push(...data.artifacts);
    if (data.artifacts.length < 100) break;
  }
  const candidates = artifacts.filter(item =>
    item && typeof item.name === "string" && item.name.startsWith(artifactPrefix) &&
    item.expired === false && Number.isFinite(Date.parse(item.created_at)) && Date.parse(item.created_at) >= cutoff &&
    String(item.workflow_run?.id ?? "") !== currentRunId
  );
  const historyByDate = new Map();
  for (const artifact of candidates) {
    const archiveUrl = apiBase + "/repos/" + repository + "/actions/artifacts/" + encodeURIComponent(String(artifact.id)) + "/zip";
    const response = await fetchImpl(archiveUrl, {
      headers: { authorization: "Bearer " + token, accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error("Could not download a retained Facebook draft artifact (HTTP " + response.status + ")");
    const archivePath = path.join(tempRoot, String(artifact.id) + ".zip");
    fs.writeFileSync(archivePath, Buffer.from(await response.arrayBuffer()), { mode: 0o600, flag: "wx" });
    const listing = execFileSync("unzip", ["-Z1", archivePath], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).split("\n").filter(Boolean);
    if (!listing.length || listing.some(name => path.basename(name) !== name || !/^\d{4}-\d{2}-\d{2}\.json$/.test(name))) {
      throw new Error("Historical artifact contains an unexpected archive path or filename");
    }
    const extractDir = path.join(tempRoot, String(artifact.id));
    fs.mkdirSync(extractDir, { mode: 0o700 });
    execFileSync("unzip", ["-qq", archivePath, "-d", extractDir], { stdio: "ignore" });
    for (const filename of listing) {
      const date = filename.slice(0, 10);
      const packagePath = path.join(extractDir, filename);
      const stat = fs.lstatSync(packagePath);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024) throw new Error("Historical artifact file is not a bounded regular file");
      const item = validatePackage(JSON.parse(fs.readFileSync(packagePath, "utf8")), date);
      const previous = historyByDate.get(date);
      if (previous && JSON.stringify(previous) !== JSON.stringify(item)) throw new Error("Conflicting historical artifacts exist for " + date + "; operator reconciliation is required");
      historyByDate.set(date, item);
    }
  }
  const history = [...historyByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const destination = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  fs.writeFileSync(destination, JSON.stringify(history, null, 2) + "\n", { mode: 0o600 });
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
