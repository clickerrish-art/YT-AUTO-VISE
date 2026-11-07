#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stateDir = path.resolve(process.env.DASHBOARD_STATE_DIR ?? path.join(root, "state"));
const stateFile = path.join(stateDir, "dashboard-state.json");
const workerId = process.env.DASHBOARD_WORKER_ID ?? "sonicvhibez-render-worker";
const baseUrl = process.env.DASHBOARD_API_URL ?? "https://sonicvhibez-durable-state-staging.kajiboye44.workers.dev";
const audience = "sonicvhibez-dashboard-runner";
const PART_BYTES = 8 * 1024 * 1024;
let oidcToken;

function origin() {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("DASHBOARD_API_URL must be an HTTPS origin without credentials, path, query or fragment");
  }
  if (!process.env.ACTIONS_ID_TOKEN_REQUEST_URL || !process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
    throw new Error("GitHub Actions OIDC is unavailable; this sync must run inside the authorized repository workflow");
  }
  return parsed.origin;
}

async function getToken() {
  if (oidcToken) return oidcToken;
  const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".actions.githubusercontent.com")) {
    throw new Error("GitHub Actions OIDC request URL is not trusted");
  }
  url.searchParams.set("audience", audience);
  const response = await fetch(url, {
    headers: { authorization: "Bearer " + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, accept: "application/json" },
    redirect: "error", signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error("GitHub OIDC token request failed with HTTP " + response.status);
  const payload = await response.json();
  if (typeof payload.value !== "string" || payload.value.length < 100) throw new Error("GitHub OIDC token response is invalid");
  oidcToken = payload.value;
  return oidcToken;
}

async function requestJson(route, options = {}) {
  const token = await getToken();
  const { timeoutMs = 60_000, ...fetchOptions } = options;
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(origin() + route, {
        ...fetchOptions,
        headers: {
          accept: "application/json",
          authorization: "Bearer " + token,
          "x-worker-id": workerId,
          ...(fetchOptions.body && typeof fetchOptions.body === "string" ? { "content-type": "application/json" } : {}),
          ...fetchOptions.headers
        },
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs)
      });
      let payload;
      try { payload = await response.json(); }
      catch (cause) { throw new Error("Artifact API returned unreadable JSON (HTTP " + response.status + ")", { cause }); }
      if (response.ok) return payload;
      const error = new Error(payload?.error ?? "Artifact API failed with HTTP " + response.status);
      error.status = response.status;
      error.code = payload?.code;
      if (response.status !== 429 && response.status < 500) throw error;
      lastError = error;
    } catch (error) {
      if (error?.status && error.status !== 429 && error.status < 500) throw error;
      lastError = error;
    }
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 750 * (2 ** attempt)));
  }
  throw lastError ?? new Error("Artifact API request failed after bounded retries");
}

function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on("data", chunk => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function resolveArtifact(sourcePath) {
  if (typeof sourcePath !== "string" || sourcePath.length > 500 || sourcePath.startsWith("/") ||
      sourcePath.includes("\\") || sourcePath.split("/").some(part => !part || part === "." || part === "..")) {
    throw new Error("Unsafe repository artifact path: " + String(sourcePath));
  }
  const resolved = path.resolve(root, sourcePath);
  if (!resolved.startsWith(root + path.sep)) throw new Error("Artifact path escaped the repository");
  let cursor = root;
  const segments = sourcePath.split("/");
  for (const segment of segments.slice(0, -1)) {
    cursor = path.join(cursor, segment);
    const parent = fs.lstatSync(cursor);
    if (parent.isSymbolicLink() || !parent.isDirectory()) throw new Error("Artifact parent path contains a symlink or non-directory: " + sourcePath);
  }
  const stat = fs.lstatSync(resolved);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Artifact must be a real regular file: " + sourcePath);
  return { resolved, sizeBytes: stat.size };
}

async function uploadArtifact(job, descriptor, existing) {
  const prior = existing.find(item => item.sourcePath === descriptor.sourcePath && item.sha256 === descriptor.sha256 && item.kind === descriptor.kind);
  if (prior?.status === "READY") {
    console.log(JSON.stringify({ event: "artifact_already_durable", jobId: job.id, kind: descriptor.kind, sha256: descriptor.sha256, artifactId: prior.artifactId }));
    return;
  }
  const file = resolveArtifact(descriptor.sourcePath);
  if (file.sizeBytes < 1 || file.sizeBytes > 8 * 1024 * 1024 * 1024) throw new Error("Artifact size is outside the 8 GiB application limit");
  const actualSha256 = await hashFile(file.resolved);
  if (actualSha256 !== descriptor.sha256) throw new Error("Artifact bytes do not match the exact generated job SHA-256: " + descriptor.sourcePath);

  let upload;
  if (prior?.status === "UPLOADING") {
    upload = prior;
  } else {
    upload = await requestJson("/api/runner/artifacts/create", {
      method: "POST",
      body: JSON.stringify({
        jobId: job.id, sourcePath: descriptor.sourcePath, artifactKind: descriptor.kind,
        sha256: descriptor.sha256, sizeBytes: file.sizeBytes, contentType: descriptor.contentType
      })
    });
  }
  if (upload.status === "READY" || upload.idempotent) return;
  if (!upload.artifactId || !upload.uploadId || !Number.isSafeInteger(upload.partSizeBytes) ||
      !Number.isSafeInteger(upload.expectedParts)) throw new Error("Artifact upload session response is invalid");
  const uploaded = new Set((upload.uploadedParts ?? []).map(part => Number(part.partNumber)));
  const fd = fs.openSync(file.resolved, "r");
  try {
    for (let partNumber = 1; partNumber <= upload.expectedParts; partNumber++) {
      if (uploaded.has(partNumber)) continue;
      const offset = (partNumber - 1) * upload.partSizeBytes;
      const length = Math.min(upload.partSizeBytes, file.sizeBytes - offset);
      const buffer = Buffer.alloc(length);
      const bytesRead = fs.readSync(fd, buffer, 0, length, offset);
      if (bytesRead !== length) throw new Error("Could not read the complete artifact segment " + partNumber);
      await requestJson("/api/runner/artifacts/part?artifactId=" + encodeURIComponent(upload.artifactId) +
        "&partNumber=" + partNumber, {
          method: "PUT",
          body: buffer,
          headers: { "content-type": "application/octet-stream" },
          timeoutMs: 120_000
        });
    }
  } finally {
    fs.closeSync(fd);
  }
  const completed = await requestJson("/api/runner/artifacts/complete", {
    method: "POST",
    body: JSON.stringify({ artifactId: upload.artifactId })
  });
  if (completed.status !== "READY" || completed.sha256 !== descriptor.sha256 ||
      Number(completed.sizeBytes) !== file.sizeBytes) {
    throw new Error("R2 artifact completion receipt did not match the local source file");
  }
  console.log(JSON.stringify({
    event: "artifact_durably_stored", jobId: job.id, kind: descriptor.kind,
    artifactId: completed.artifactId, objectKey: completed.objectKey,
    sha256: completed.sha256, sizeBytes: completed.sizeBytes
  }));
}

async function main() {
  const stateDirectoryStat = fs.lstatSync(stateDir);
  if (stateDirectoryStat.isSymbolicLink() || !stateDirectoryStat.isDirectory()) throw new Error("Dashboard state directory is missing or unsafe");
  const stateStat = fs.lstatSync(stateFile);
  if (stateStat.isSymbolicLink() || !stateStat.isFile()) throw new Error("Dashboard state file is missing or unsafe");
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  if (!Array.isArray(state.jobs)) throw new Error("Dashboard state has no jobs collection");
  let uploadedCount = 0;
  for (const job of state.jobs) {
    if (!job || !["GENERATED", "VALIDATING"].includes(job.state) || !Array.isArray(job.outputArtifacts)) continue;
    const existingPayload = await requestJson("/api/runner/artifacts?jobId=" + encodeURIComponent(job.id));
    const existing = existingPayload.artifacts ?? [];
    const descriptors = job.outputArtifacts.map(item => ({
      sourcePath: item.path, sha256: item.sha256, kind: "video", contentType: "video/mp4"
    }));
    if (job.thumbnailArtifact?.path && job.thumbnailArtifact?.sha256) {
      const extension = path.extname(job.thumbnailArtifact.path).toLowerCase();
      const contentType = ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" })[extension];
      if (!contentType) throw new Error("Generated thumbnail has an unsupported image format: " + job.thumbnailArtifact.path);
      descriptors.push({ sourcePath: job.thumbnailArtifact.path, sha256: job.thumbnailArtifact.sha256, kind: "thumbnail", contentType });
    }
    if (job.metadataPath && job.metadataVersion) descriptors.push({
      sourcePath: job.metadataPath, sha256: job.metadataVersion,
      kind: "metadata", contentType: "application/json"
    });
    for (const descriptor of descriptors) {
      const before = existing.find(item => item.sourcePath === descriptor.sourcePath &&
        item.sha256 === descriptor.sha256 && item.kind === descriptor.kind && item.status === "READY");
      if (before) continue;
      await uploadArtifact(job, descriptor, existing);
      uploadedCount++;
    }
  }
  console.log(JSON.stringify({ event: "artifact_sync_complete", uploadedOrVerified: uploadedCount, publishingEnabled: false }));
}

main().catch(error => {
  console.error("BLOCKED: " + String(error?.message ?? error).slice(0, 1000));
  process.exitCode = 2;
});
