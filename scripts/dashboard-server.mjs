import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { validateCampaigns } from "./validate-campaigns.mjs";
import { createContentJob, transitionContentJob, approveContentJobForPrivateUpload, claimWorkerLease, heartbeatWorkerLease, completeWorkerLease, expireWorkerLease } from "./content-job-lifecycle.mjs";
import { createReviewDecision, sha256File } from "./human-review.mjs";
import { manageCampaign } from "./campaign-management.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.DASHBOARD_HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 8787);
const token = process.env.DASHBOARD_OPERATOR_TOKEN;
const stateDir = path.resolve(process.env.DASHBOARD_STATE_DIR ?? path.join(root, "state"));
const stateFile = path.join(stateDir, "dashboard-state.json");
const approvedProductUrl = "https://selar.com/0u19v8u99l";
const htmlPath = path.join(root, "public", "dashboard.html");

if (!token || token.length < 24) {
  console.error("BLOCKED: set DASHBOARD_OPERATOR_TOKEN to a random value of at least 24 characters. No server started.");
  process.exit(2);
}
if (!["127.0.0.1", "::1", "localhost"].includes(host)) {
  console.error("BLOCKED: dashboard binds to loopback only; use a secure authenticated reverse proxy before changing this.");
  process.exit(2);
}
fs.mkdirSync(stateDir, { recursive: true });
if (!fs.existsSync(stateFile)) {
  const queue = JSON.parse(fs.readFileSync(path.join(root, "content/queue.json"), "utf8"));
  const campaignConfig = JSON.parse(fs.readFileSync(path.join(root, "config/campaigns.json"), "utf8"));
  const initial = { version: 1, queueItems: queue.items ?? [], campaigns: campaignConfig.campaigns ?? [], audit: [], jobs: [], uploads: [] };
  fs.writeFileSync(stateFile, JSON.stringify(initial, null, 2) + "\n", { mode: 0o600 });
}
function loadState() {
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  for (const key of ["queueItems", "audit", "jobs", "uploads"]) if (!Array.isArray(state[key])) throw new Error("Invalid state schema: " + key);
  return state;
}
function recoverInterruptedTasks() {
  const state = loadState();
  let recovered = 0;
  for (const job of state.jobs) {
    if (job.kind === "CONTENT_PRODUCTION" && ["GENERATING", "VALIDATING", "UPLOADING_PRIVATE"].includes(job.state)) {
      const previous = job.state;
      job.state = "RECOVERY_REQUIRED";
      job.errorDetails = { code: "INTERRUPTED_DURING_ACTIVE_STAGE", retryable: false, message: previous === "UPLOADING_PRIVATE" ? "Upload outcome is uncertain. Reconcile with YouTube before any retry." : "Server restarted during content processing; inspect artifacts before retrying." };
      job.updatedAt = new Date().toISOString();
      job.transitionHistory = [...(job.transitionHistory ?? []), { from: previous, to: "RECOVERY_REQUIRED", at: job.updatedAt, actor: "system-recovery", reason: job.errorDetails.message }];
      state.audit.push({ id: crypto.randomUUID(), action: "CONTENT_JOB_RECOVERY_REQUIRED", jobId: job.id, previousState: previous, at: job.updatedAt, actor: "system-recovery" });
      recovered++;
    }
    if (job.status === "RUNNING") {
      job.status = "RECOVERY_REQUIRED";
      job.error = "Dashboard restarted while this task was running; inspect its effects before retrying.";
      job.updatedAt = new Date().toISOString();
      state.audit.push({ id: crypto.randomUUID(), action: "TASK_INTERRUPTED_RECOVERY_REQUIRED", jobId: job.id, taskId: job.taskId, at: job.updatedAt, actor: "system-recovery" });
      recovered++;
    }
  }
  if (recovered) saveState(state);
  return recovered;
}
function saveState(state) {
  const temp = stateFile + "." + crypto.randomUUID() + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(temp, stateFile);
}

const stateLockDir = stateFile + ".lock";
async function acquireStateLock(timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    try {
      fs.mkdirSync(stateLockDir, { mode: 0o700 });
      fs.writeFileSync(path.join(stateLockDir, "owner.json"), JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), { mode: 0o600, flag: "wx" });
      return () => { try { fs.rmSync(stateLockDir, { recursive: true, force: true }); } catch {} };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        const stat = fs.statSync(stateLockDir);
        if (Date.now() - stat.mtimeMs > 120_000) {
          fs.rmSync(stateLockDir, { recursive: true, force: true });
          continue;
        }
      } catch { continue; }
      if (Date.now() >= deadline) throw new Error("State is busy in another process; retry the operation shortly");
      await new Promise(resolve => setTimeout(resolve, 20 + Math.floor(Math.random() * 40)));
    }
  }
}
function resolveRepositoryFile(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim() || path.isAbsolute(relativePath)) throw new Error("File path must be repository-relative");
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) throw new Error("File path escapes repository root");
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error("Required evidence file does not exist");
  return resolved;
}
function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let tooLarge = false;
    req.on("data", chunk => {
      if (tooLarge) return;
      raw += chunk.toString();
      if (Buffer.byteLength(raw, "utf8") > 16_384) {
        tooLarge = true;
        raw = "";
        reject(new Error("Request body exceeds 16KB"));
      }
    });
    req.on("end", () => {
      if (tooLarge) return;
      try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("Request body must be valid JSON")); }
    });
    req.on("error", error => { if (!tooLarge) reject(error); });
  });
}
const allowedTasks = new Map([
  ["validate-schedule", ["run", "validate:schedule"]],
  ["check-captions", ["run", "check:captions"]],
  ["production-readiness", ["run", "readiness"]],
  ["test-suite", ["test"]],
  ["validate-campaigns", ["run", "validate:campaigns"]]
]);
const activeTasks = new Set();
const taskTimeoutMs = new Map([["validate-schedule", 30_000], ["validate-campaigns", 30_000], ["check-captions", 45_000], ["production-readiness", 60_000], ["test-suite", 180_000]]);
function runTask(taskId) {
  const args = allowedTasks.get(taskId);
  if (!args) return Promise.reject(new Error("Task is not on the dashboard allowlist"));
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const child = spawn("npm", args, { cwd: root, shell: false, env: { ...process.env, CI: "1", ...(taskId === "test-suite" ? { DASHBOARD_TEST_CHILD: "1" } : {}) }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let truncated = false;
    let timedOut = false;
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ taskId, startedAt, finishedAt: new Date().toISOString(), truncated, ...result, output: result.output ?? output });
    };
    const collect = chunk => {
      output += chunk.toString();
      if (output.length > 12000) { output = output.slice(-12000); truncated = true; }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      output += "\\nTask exceeded its time limit; termination requested.";
      child.kill("SIGTERM");
      setTimeout(() => { if (child.exitCode === null) child.kill("SIGKILL"); }, 3000).unref();
    }, taskTimeoutMs.get(taskId) ?? 60_000);
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("error", error => finish({ exitCode: null, status: "FAILED", output: (output + "\\n" + error.message).slice(-12000) }));
    child.on("close", code => finish({ exitCode: code, status: timedOut ? "TIMED_OUT" : code === 0 ? "SUCCEEDED" : "FAILED" }));
  });
}
function safeItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Draft must be an object");
  const id = String(item.id ?? "").trim();
  const title = String(item.title ?? "").trim();
  const topic = String(item.topic ?? "").trim();
  const contentType = item.contentType;
  const scheduledDay = item.scheduledDay;
  const scheduledDate = String(item.scheduledDate ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) || Number.isNaN(Date.parse(scheduledDate + "T12:00:00Z")) || new Date(scheduledDate + "T12:00:00Z").toISOString().slice(0, 10) !== scheduledDate) throw new Error("Scheduled date must be a real YYYY-MM-DD date");
  const actualDay = new Date(scheduledDate + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  if (actualDay !== scheduledDay) throw new Error("Scheduled date weekday must match production day");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$/.test(id)) throw new Error("ID must be 3–80 safe characters");
  if (!title || title.length > 100) throw new Error("Title is required and must be at most 100 characters");
  if (!topic || topic.length > 300) throw new Error("Topic is required and must be at most 300 characters");
  if (!["long_form", "short"].includes(contentType)) throw new Error("contentType must be long_form or short");
  if (!["Tuesday", "Thursday", "Saturday"].includes(scheduledDay)) throw new Error("scheduledDay must match an authorized weekly slot");
  if ((scheduledDay === "Saturday") !== (contentType === "short")) throw new Error("Saturday is reserved for Shorts; Tuesday and Thursday are long-form");
  if (item.productUrl !== approvedProductUrl) throw new Error("Destination must be the exact approved Selar URL");
  for (const key of ["rightsConfirmed", "complianceReviewed", "approvedForPrivateUpload", "humanApproved"]) {
    if (item[key] === true) throw new Error("Draft editing cannot grant rights or review approval");
  }
  return { id, title, topic, contentType, scheduledDay, scheduledDate, reservationType: "SCHEDULED_SLOT", productUrl: approvedProductUrl, status: "DRAFT_REVIEW_REQUIRED", updatedAt: new Date().toISOString() };
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    if (req.method === "GET" && url.pathname === "/healthz") return json(res, 200, { ok: true, publishingEnabled: false });
    if (req.method === "GET" && url.pathname === "/readyz") {
      try {
        loadState();
        const schedule = JSON.parse(fs.readFileSync(path.join(root, "config/weekly-content-plan.json"), "utf8"));
        const configuredCampaigns = JSON.parse(fs.readFileSync(path.join(root, "config/campaigns.json"), "utf8"));
        const campaigns = { version: 1, campaigns: loadState().campaigns ?? configuredCampaigns.campaigns };
        const campaignErrors = validateCampaigns(campaigns);
        const optionalBlockers = [];
        if (!schedule.channelId) optionalBlockers.push("SONICVHIBEZ_CHANNEL_ID has not been independently verified");
        for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]) if (!process.env[key]) optionalBlockers.push(key + " is not configured");
        if (!fs.existsSync(path.join(root, "content/render-manifest.json"))) optionalBlockers.push("Rights-reviewed render manifest is missing");
        return json(res, campaignErrors.length ? 503 : 200, { ready: campaignErrors.length === 0, publishingEnabled: false, localState: "readable", scheduleConfig: "readable", campaignConfig: campaignErrors.length ? "invalid" : "valid", campaignErrors, optionalBlockers });
      } catch (error) {
        return json(res, 503, { ready: false, publishingEnabled: false, error: "Required local state or configuration is unreadable" });
      }
    }
    if (url.pathname === "/" && req.method === "GET") {
      const html = fs.readFileSync(htmlPath);
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:" });
      return res.end(html);
    }
    if (!url.pathname.startsWith("/api/")) return json(res, 404, { error: "Not found" });
    const provided = req.headers["x-operator-token"];
    if (typeof provided !== "string" || provided.length !== token.length || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(token))) return json(res, 401, { error: "Operator authentication required" });
    if (req.method === "GET" && url.pathname === "/api/state") {
      const state = loadState();
      const schedule = JSON.parse(fs.readFileSync(path.join(root, "config/weekly-content-plan.json"), "utf8"));
      const configuredCampaigns = JSON.parse(fs.readFileSync(path.join(root, "config/campaigns.json"), "utf8"));
      const campaignConfig = { version: 1, campaigns: state.campaigns ?? configuredCampaigns.campaigns };
      const campaignErrors = validateCampaigns(campaignConfig);
      const blockers = campaignErrors.map(error => "Campaign configuration: " + error);
      if (!schedule.channelId) blockers.push("SonicVhibez channel ID has not been verified");
      if (!fs.existsSync(path.join(root, "content/render-manifest.json"))) blockers.push("Rights-reviewed render manifest is missing");
      return json(res, 200, { publishingEnabled: false, schedule, campaigns: campaignConfig.campaigns, campaignValidation: { ok: campaignErrors.length === 0, errors: campaignErrors }, queueItems: state.queueItems, jobs: state.jobs.slice(-30).reverse(), uploads: state.uploads.slice(-30).reverse(), audit: state.audit.slice(-50).reverse(), blockers, stateFile: path.relative(root, stateFile) });
    }
    if (req.method === "GET" && url.pathname === "/api/tasks") {
      return json(res, 200, { publicPublishingEnabled: false, tasks: [...allowedTasks.keys()] });
    }
    if (req.method === "POST" && url.pathname === "/api/tasks/run") {
      const body = await readBody(req);
      if (typeof body.taskId !== "string" || !allowedTasks.has(body.taskId)) return json(res, 400, { error: "Choose a supported allowlisted validation task" });
      if (activeTasks.has(body.taskId)) return json(res, 409, { error: "This task is already running; duplicate execution was prevented" });
      const state = loadState();
      const job = { id: crypto.randomUUID(), kind: "VALIDATION_TASK", taskId: body.taskId, status: "RUNNING", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), publishingEnabled: false };
      state.jobs.push(job);
      state.audit.push({ id: crypto.randomUUID(), action: "VALIDATION_TASK_STARTED", jobId: job.id, taskId: body.taskId, at: new Date().toISOString(), actor: "local-operator" });
      saveState(state);
      activeTasks.add(body.taskId);
      let result;
      try { result = await runTask(body.taskId); }
      finally { activeTasks.delete(body.taskId); }
      const latest = loadState();
      const index = latest.jobs.findIndex(entry => entry.id === job.id);
      if (index >= 0) latest.jobs[index] = { ...latest.jobs[index], ...result, updatedAt: new Date().toISOString() };
      latest.audit.push({ id: crypto.randomUUID(), action: result.status === "SUCCEEDED" ? "VALIDATION_TASK_SUCCEEDED" : "VALIDATION_TASK_FAILED", jobId: job.id, taskId: body.taskId, exitCode: result.exitCode, at: new Date().toISOString(), actor: "local-operator" });
      saveState(latest);
      return json(res, result.status === "SUCCEEDED" ? 200 : 500, { job: latest.jobs.find(entry => entry.id === job.id), publicPublishingEnabled: false });
    }
    if (req.method === "POST" && url.pathname === "/api/campaigns/manage") {
      const body = await readBody(req);
      const actor = process.env.DASHBOARD_OPERATOR_ID;
      if (!actor || actor.trim().length < 2) return json(res, 503, { error: "Campaign changes require DASHBOARD_OPERATOR_ID to identify the authenticated operator" });
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const configured = JSON.parse(fs.readFileSync(path.join(root, "config/campaigns.json"), "utf8"));
        const current = { version: 1, campaigns: state.campaigns ?? configured.campaigns };
        const result = manageCampaign(current, body, actor);
        state.campaigns = result.config.campaigns;
        state.audit.push({ id: crypto.randomUUID(), action: "CAMPAIGN_" + String(body.action).toUpperCase(), campaignId: result.campaign.id, campaignType: result.campaign.type, status: result.campaign.status, destinationVersion: result.campaign.approval?.destinationVersion ?? result.campaign.pendingDestinationVersion ?? null, actor, at: new Date().toISOString(), previewOnly: result.previewOnly === true });
        saveState(state);
        return json(res, 200, { campaign: result.campaign, previewOnly: result.previewOnly, publicPublishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/drafts") {
      const body = await readBody(req);
      const item = safeItem(body);
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const configured = JSON.parse(fs.readFileSync(path.join(root, "config/campaigns.json"), "utf8"));
        const campaigns = state.campaigns ?? configured.campaigns;
        const selarCampaign = campaigns.find(c => c.type === "selar_digital_product");
        if (!selarCampaign || selarCampaign.status !== "ACTIVE_FOR_DRAFTS_ONLY" || selarCampaign.destinationUrl !== approvedProductUrl) return json(res, 409, { error: "The approved Selar campaign is inactive; preview and activate it for drafts first" });
        if (state.queueItems.some(existing => existing.id === item.id)) return json(res, 409, { error: "That queue ID already exists" });
        const slotFingerprint = item.scheduledDate + ":17:00:Africa/Johannesburg";
        const slotAlreadyReserved = state.jobs.some(existing => existing.kind === "CONTENT_PRODUCTION" && existing.scheduledSlot?.date === item.scheduledDate);
        if (slotAlreadyReserved) return json(res, 409, { error: "This dated schedule slot is already reserved; reuse or edit its existing job", slotFingerprint });
        const job = createContentJob({ idempotencyKey: "draft:" + item.id, title: item.title, topic: item.topic, contentType: item.contentType, scheduledDay: item.scheduledDay, scheduledDate: item.scheduledDate, inputReferences: [] });
        state.queueItems.push(item);
        state.jobs.push(job);
        state.audit.push({ id: crypto.randomUUID(), action: "DRAFT_CREATED", itemId: item.id, at: new Date().toISOString(), actor: "local-operator" });
        state.audit.push({ id: crypto.randomUUID(), action: "CONTENT_JOB_QUEUED", itemId: item.id, jobId: job.id, idempotencyKey: job.idempotencyKey, at: new Date().toISOString(), actor: "local-operator" });
        saveState(state);
        return json(res, 201, { item, job });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/jobs") {
      const body = await readBody(req);
      const job = createContentJob(body);
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const existing = state.jobs.find(entry => entry.kind === "CONTENT_PRODUCTION" && entry.idempotencyKey === job.idempotencyKey);
        if (existing) {
          if (existing.requestFingerprint !== job.requestFingerprint) return json(res, 409, { error: "Idempotency key already exists with different job inputs", job: existing });
          return json(res, 200, { job: existing, reused: true, publishingEnabled: false });
        }
        const slotConflict = state.jobs.find(entry => entry.kind === "CONTENT_PRODUCTION" && entry.scheduledSlot?.date === job.scheduledSlot.date);
        if (slotConflict) {
          if (slotConflict.requestFingerprint === job.requestFingerprint) return json(res, 200, { job: slotConflict, reused: true, publishingEnabled: false, reservationReused: true });
          return json(res, 409, { error: "The requested schedule slot is already reserved by a different job; reuse the existing job for retries", job: slotConflict });
        }
        state.jobs.push(job);
        state.audit.push({ id: crypto.randomUUID(), action: "CONTENT_JOB_QUEUED", jobId: job.id, idempotencyKey: job.idempotencyKey, at: new Date().toISOString(), actor: "local-operator" });
        saveState(state);
        return json(res, 201, { job, reused: false, publishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/jobs/validate") {
      const body = await readBody(req);
      if (typeof body.jobId !== "string" || typeof body.captionsPath !== "string") return json(res, 400, { error: "jobId and captionsPath are required" });
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const index = state.jobs.findIndex(entry => entry.kind === "CONTENT_PRODUCTION" && entry.id === body.jobId);
        if (index < 0) return json(res, 404, { error: "Content job not found" });
        const job = state.jobs[index];
        if (!["GENERATED", "VALIDATING"].includes(job.state)) return json(res, 409, { error: "Only generated jobs can be technically validated" });
        if (!Array.isArray(job.outputArtifacts) || !job.outputArtifacts.length || !job.metadataPath || !job.metadataVersion) return json(res, 409, { error: "A recorded artifact and metadata version are required" });
        const metadataFile = resolveRepositoryFile(job.metadataPath);
        const metadataVersion = sha256File(metadataFile);
        if (metadataVersion !== job.metadataVersion) return json(res, 409, { error: "Metadata changed after generation; regenerate or create a new job version" });
        const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));
        if (metadata.channel !== "SonicVhibez" || metadata.visibility !== "private" || metadata.productUrl !== approvedProductUrl) return json(res, 400, { error: "Metadata must target SonicVhibez, remain private and use the approved Selar URL" });
        if (typeof metadata.title !== "string" || !metadata.title.trim() || typeof metadata.description !== "string" || !metadata.description.trim() || !Array.isArray(metadata.tags) || metadata.tags.length < 3) return json(res, 400, { error: "Metadata needs a title, description and at least three tags" });
        const captionsFile = resolveRepositoryFile(body.captionsPath);
        const captionCheck = spawnSync(process.execPath, ["scripts/check-captions.mjs", captionsFile], { encoding: "utf8", timeout: 15_000 });
        if (captionCheck.error || captionCheck.status !== 0 || !String(captionCheck.stdout ?? "").includes("PASS:")) return json(res, 400, { error: "Caption validation failed; see the local caption checker output" });
        const inspectedArtifacts = [];
        for (const artifact of job.outputArtifacts) {
          const artifactFile = resolveRepositoryFile(artifact.path);
          const actualSha = sha256File(artifactFile);
          if (actualSha !== artifact.sha256) return json(res, 409, { error: "Artifact changed after generation: " + artifact.path });
          const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", artifactFile], { encoding: "utf8", timeout: 15_000 });
          if (probe.error || probe.status !== 0) return json(res, 503, { error: "ffprobe is unavailable or failed; validation remains blocked" });
          let media;
          try { media = JSON.parse(probe.stdout); } catch { return json(res, 400, { error: "ffprobe returned invalid inspection data" }); }
          const duration = Number(media.format?.duration);
          const streams = media.streams ?? [];
          const video = streams.find(stream => stream.codec_type === "video");
          const audio = streams.some(stream => stream.codec_type === "audio");
          const isShort = job.contentType === "short";
          if (!Number.isFinite(duration) || (isShort ? duration < 50 || duration > 60 : duration < 360 || duration > 600)) return json(res, 400, { error: "Artifact duration does not match the scheduled format" });
          if (!video || !audio || (isShort ? video.height <= video.width : video.width <= video.height)) return json(res, 400, { error: "Artifact must have the correct orientation and an audio stream" });
          inspectedArtifacts.push({ path: artifact.path, sha256: actualSha, durationSeconds: duration, width: video.width, height: video.height });
        }
        let updated = job;
        if (job.state === "GENERATED") updated = transitionContentJob(job, "VALIDATING", { actor: "local-operator", reason: "Server-side artifact, metadata and caption validation started" });
        updated.validationResults = { passed: true, checkedAt: new Date().toISOString(), metadataVersion, captionsPath: body.captionsPath, captionsSha256: sha256File(captionsFile), artifacts: inspectedArtifacts, checks: ["metadata-sha256", "caption-structure", "mp4-sha256", "ffprobe-duration", "orientation", "audio-stream"] };
        updated.updatedAt = new Date().toISOString();
        state.jobs[index] = updated;
        state.audit.push({ id: crypto.randomUUID(), action: "CONTENT_JOB_VALIDATION_PASSED", jobId: job.id, metadataVersion, captionsPath: body.captionsPath, artifacts: inspectedArtifacts.map(a => ({ path: a.path, sha256: a.sha256 })), at: updated.updatedAt, actor: "local-operator" });
        saveState(state);
        return json(res, 200, { job: updated, publishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/jobs/rights/verify") {
      const body = await readBody(req);
      const actor = process.env.DASHBOARD_OPERATOR_ID;
      if (!actor || actor.trim().length < 2) return json(res, 503, { error: "Rights verification requires DASHBOARD_OPERATOR_ID" });
      if (body.confirmRightsVerified !== true || typeof body.jobId !== "string" || !Array.isArray(body.assets) || body.assets.length < 1 || body.assets.length > 50) return json(res, 400, { error: "Explicit confirmation, jobId and 1–50 structured source assets are required" });
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const index = state.jobs.findIndex(entry => entry.kind === "CONTENT_PRODUCTION" && entry.id === body.jobId);
        if (index < 0) return json(res, 404, { error: "Content job not found" });
        const job = state.jobs[index];
        if (job.state !== "VALIDATING" || job.validationResults?.passed !== true) return json(res, 409, { error: "Technical validation must pass before rights verification" });
        const timestamp = new Date().toISOString();
        const assets = [];
        for (const item of body.assets) {
          if (!item || typeof item !== "object" || Array.isArray(item)) return json(res, 400, { error: "Each source asset must be an object" });
          for (const key of ["assetId", "source", "rightsHolder", "assetPath", "licenseEvidenceLocation", "restrictions", "attributionRequirements"]) {
            if (typeof item[key] !== "string" || !item[key].trim()) return json(res, 400, { error: "Required source-rights field is missing: " + key });
          }
          if (!Array.isArray(item.permittedUses) || !item.permittedUses.includes("YouTube")) return json(res, 400, { error: "Every asset must explicitly permit YouTube use" });
          const assetFile = resolveRepositoryFile(item.assetPath);
          const evidenceFile = resolveRepositoryFile(item.licenseEvidenceLocation);
          const assetSha256 = sha256File(assetFile);
          if (evidenceFile && fs.statSync(evidenceFile).size <= 0) return json(res, 400, { error: "License evidence file is empty" });
          assets.push({ assetId: item.assetId.trim(), source: item.source.trim(), rightsHolder: item.rightsHolder.trim(), assetPath: item.assetPath, assetSha256, licenseEvidenceLocation: item.licenseEvidenceLocation, licenseEvidenceSha256: sha256File(evidenceFile), permittedUses: item.permittedUses, restrictions: item.restrictions.trim(), attributionRequirements: item.attributionRequirements.trim() });
        }
        const primary = assets[0];
        const rightsEvidence = { assetId: primary.assetId, source: primary.source, rightsHolder: primary.rightsHolder, assetPath: primary.assetPath, assetSha256: primary.assetSha256, licenseEvidenceLocation: primary.licenseEvidenceLocation, licenseEvidenceSha256: primary.licenseEvidenceSha256, permittedUses: [...new Set(assets.flatMap(a => a.permittedUses))], restrictions: assets.map(a => a.restrictions).filter(Boolean).join(" | "), attributionRequirements: assets.map(a => a.attributionRequirements).filter(Boolean).join(" | "), assets, verificationStatus: "VERIFIED", verifiedBy: actor.trim(), verifiedAt: timestamp };
        const evidenceSha256 = crypto.createHash("sha256").update(JSON.stringify(rightsEvidence)).digest("hex");
        const updated = { ...job, rightsChecks: { verified: true, evidenceSha256, evidence: rightsEvidence, verifiedBy: actor.trim(), verifiedAt: timestamp }, updatedAt: timestamp };
        const reviewed = transitionContentJob(updated, "AWAITING_HUMAN_REVIEW", { actor: actor.trim(), reason: "Operator verified every source asset and retained rights evidence" }, timestamp);
        state.jobs[index] = reviewed;
        state.audit.push({ id: crypto.randomUUID(), action: "CONTENT_JOB_RIGHTS_VERIFIED", jobId: job.id, evidenceSha256, assetCount: assets.length, actor: actor.trim(), at: timestamp, reason: "Operator attested to retained license evidence and permitted uses" });
        state.audit.push({ id: crypto.randomUUID(), action: "CONTENT_JOB_AWAITING_HUMAN_REVIEW", jobId: job.id, at: timestamp, actor: actor.trim() });
        saveState(state);
        return json(res, 200, { job: reviewed, rightsEvidence, publishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/jobs/review") {
      const body = await readBody(req);
      const reviewer = process.env.DASHBOARD_OPERATOR_ID;
      if (!reviewer || reviewer.trim().length < 2) return json(res, 503, { error: "Human review is disabled until DASHBOARD_OPERATOR_ID identifies the authenticated local operator" });
      if (typeof body.jobId !== "string" || !["APPROVE", "REJECT"].includes(body.decision)) return json(res, 400, { error: "jobId and APPROVE/REJECT decision are required" });
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const index = state.jobs.findIndex(entry => entry.kind === "CONTENT_PRODUCTION" && entry.id === body.jobId);
        if (index < 0) return json(res, 404, { error: "Content job not found" });
        const job = state.jobs[index];
        if (job.state !== "AWAITING_HUMAN_REVIEW") return json(res, 409, { error: "Only jobs awaiting human review can be reviewed" });
        const artifactPath = String(body.artifactPath ?? "");
        const artifactFile = resolveRepositoryFile(artifactPath);
        const artifactSha256 = sha256File(artifactFile);
        if (body.artifactSha256 !== artifactSha256) return json(res, 409, { error: "Artifact checksum changed or does not match the submitted checksum" });
        const metadataPath = String(body.metadataPath ?? "");
        const metadataFile = resolveRepositoryFile(metadataPath);
        const metadataVersion = sha256File(metadataFile);
        if (body.metadataVersion !== metadataVersion || job.metadataVersion !== metadataVersion) return json(res, 409, { error: "Metadata version must match both the actual metadata file and validated job metadata" });
        const artifact = { path: artifactPath, sha256: artifactSha256 };
        if (!(job.outputArtifacts ?? []).some(entry => entry.path === artifact.path && entry.sha256 === artifact.sha256)) return json(res, 409, { error: "The checked file is not the exact artifact recorded on this job" });
        let rightsEvidence = body.rightsEvidence;
        if (body.decision === "APPROVE") {
          if (!rightsEvidence || typeof rightsEvidence !== "object") return json(res, 400, { error: "Structured rights evidence is required for approval" });
          const evidenceFile = resolveRepositoryFile(rightsEvidence.licenseEvidenceLocation);
          const assetFile = resolveRepositoryFile(rightsEvidence.assetPath);
          if (sha256File(assetFile) !== rightsEvidence.assetSha256) return json(res, 409, { error: "Source asset checksum does not match the rights evidence" });
          if (!fs.statSync(evidenceFile).size) return json(res, 400, { error: "Rights evidence file is empty" });
          if (rightsEvidence.verifiedBy !== reviewer || rightsEvidence.verificationStatus !== "VERIFIED") return json(res, 403, { error: "Rights evidence must be explicitly verified by the authenticated operator before approval" });
        }
        const review = createReviewDecision({ artifact, rightsEvidence, metadataVersion, reviewer, decision: body.decision, reason: body.reason ?? "" });
        if (body.decision === "APPROVE") {
          state.jobs[index] = approveContentJobForPrivateUpload({ ...job, rightsChecks: { verified: true, evidenceSha256: review.rightsEvidenceSha256, verifiedBy: reviewer, verifiedAt: review.reviewedAt } }, review);
        } else {
          const rejected = transitionContentJob(job, "REJECTED", { actor: reviewer, reason: body.reason });
          state.jobs[index] = { ...rejected, humanApproval: review };
        }
        state.audit.push({ id: crypto.randomUUID(), action: body.decision === "APPROVE" ? "CONTENT_ARTIFACT_APPROVED_FOR_PRIVATE_UPLOAD" : "CONTENT_ARTIFACT_REJECTED", jobId: job.id, artifactPath, artifactSha256, metadataVersion, reviewId: review.id, actor: reviewer, reason: String(body.reason ?? "").slice(0, 1000), at: new Date().toISOString() });
        saveState(state);
        const uploadApprovalRecord = body.decision === "APPROVE" ? { ...review, jobId: job.id, publishingEnabled: false, visibility: "private" } : null;
        return json(res, 200, { job: state.jobs[index], review, uploadApprovalRecord, publishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/jobs/lease/claim") {
      const body = await readBody(req);
      if (typeof body.jobId !== "string" || typeof body.workerId !== "string") return json(res, 400, { error: "jobId and workerId are required" });
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const index = state.jobs.findIndex(entry => entry.kind === "CONTENT_PRODUCTION" && entry.id === body.jobId);
        if (index < 0) return json(res, 404, { error: "Content job not found" });
        const claimed = claimWorkerLease(state.jobs[index], body.workerId, { leaseMs: body.leaseMs ?? 60_000 });
        state.jobs[index] = claimed.job;
        state.audit.push({ id: crypto.randomUUID(), action: "WORKER_LEASE_CLAIMED", jobId: body.jobId, workerId: body.workerId, expiresAt: claimed.job.workerLease.expiresAt, at: new Date().toISOString(), actor: "local-operator" });
        saveState(state);
        return json(res, 200, { job: claimed.job, leaseToken: claimed.leaseToken, publishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/jobs/lease/heartbeat") {
      const body = await readBody(req);
      if (typeof body.jobId !== "string" || typeof body.leaseToken !== "string") return json(res, 400, { error: "jobId and leaseToken are required" });
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const index = state.jobs.findIndex(entry => entry.kind === "CONTENT_PRODUCTION" && entry.id === body.jobId);
        if (index < 0) return json(res, 404, { error: "Content job not found" });
        const updated = heartbeatWorkerLease(state.jobs[index], body.leaseToken, { leaseMs: body.leaseMs ?? 60_000 });
        state.jobs[index] = updated;
        state.audit.push({ id: crypto.randomUUID(), action: "WORKER_LEASE_HEARTBEAT", jobId: body.jobId, workerId: updated.workerLease.workerId, expiresAt: updated.workerLease.expiresAt, at: new Date().toISOString(), actor: "local-operator" });
        saveState(state);
        return json(res, 200, { job: updated, publishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/jobs/lease/complete") {
      const body = await readBody(req);
      if (typeof body.jobId !== "string" || typeof body.leaseToken !== "string" || typeof body.nextState !== "string") return json(res, 400, { error: "jobId, leaseToken and nextState are required" });
      if (!["GENERATED", "VALIDATING", "FAILED", "BLOCKED"].includes(body.nextState)) return json(res, 400, { error: "Worker completion may only advance to GENERATED, VALIDATING, FAILED or BLOCKED; human review and upload states require separate gates" });
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const index = state.jobs.findIndex(entry => entry.kind === "CONTENT_PRODUCTION" && entry.id === body.jobId);
        if (index < 0) return json(res, 404, { error: "Content job not found" });
        const old = state.jobs[index];
        const resultPatch = body.result ?? {};
        if (body.nextState === "GENERATED") {
          if (!Array.isArray(resultPatch.outputArtifacts) || resultPatch.outputArtifacts.length < 1) return json(res, 400, { error: "Generation completion requires at least one real MP4 artifact with a checksum" });
          if (typeof body.metadataPath !== "string") return json(res, 400, { error: "Generation completion requires the actual metadata file path" });
          const metadataFile = resolveRepositoryFile(body.metadataPath);
          const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));
          const actualMetadataVersion = sha256File(metadataFile);
          if (resultPatch.metadataVersion !== actualMetadataVersion) return json(res, 409, { error: "Metadata version must equal the actual metadata file SHA-256" });
          if (metadata.channel !== "SonicVhibez" || metadata.visibility !== "private" || metadata.productUrl !== approvedProductUrl) return json(res, 400, { error: "Generated metadata must target SonicVhibez, remain private, and use the approved Selar destination" });
          for (const artifact of resultPatch.outputArtifacts) {
            if (!artifact || typeof artifact.path !== "string" || !/^[a-f0-9]{64}$/.test(artifact.sha256 ?? "") || path.extname(artifact.path).toLowerCase() !== ".mp4") return json(res, 400, { error: "Each output artifact must be a repository-relative MP4 with a SHA-256 checksum" });
            const artifactFile = resolveRepositoryFile(artifact.path);
            if (sha256File(artifactFile) !== artifact.sha256) return json(res, 409, { error: "Output artifact checksum does not match the actual file: " + artifact.path });
            const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", artifactFile], { encoding: "utf8", timeout: 15_000 });
            if (probe.error || probe.status !== 0) return json(res, 503, { error: "ffprobe is unavailable or could not inspect the generated MP4; generation cannot be marked successful" });
            let media;
            try { media = JSON.parse(probe.stdout); } catch { return json(res, 400, { error: "ffprobe returned invalid media inspection data" }); }
            const duration = Number(media.format?.duration);
            const streams = media.streams ?? [];
            const video = streams.find(stream => stream.codec_type === "video");
            const hasAudio = streams.some(stream => stream.codec_type === "audio");
            const isShort = old.contentType === "short";
            if (!Number.isFinite(duration) || (isShort ? duration < 50 || duration > 60 : duration < 360 || duration > 600)) return json(res, 400, { error: "Rendered MP4 duration does not match the scheduled content format" });
            if (!video || !hasAudio || (isShort ? video.height <= video.width : video.width <= video.height)) return json(res, 400, { error: "Rendered MP4 must contain audio and have the correct horizontal/vertical dimensions" });
            artifact.durationSeconds = duration;
            artifact.width = video.width;
            artifact.height = video.height;
            artifact.inspectedAt = new Date().toISOString();
          }
          resultPatch.metadataPath = body.metadataPath;
        }
        const updated = completeWorkerLease(old, body.leaseToken, body.nextState, resultPatch);
        state.jobs[index] = updated;
        state.audit.push({ id: crypto.randomUUID(), action: "WORKER_STAGE_COMPLETED", jobId: body.jobId, workerId: old.workerLease.workerId, from: old.state, to: updated.state, at: new Date().toISOString(), actor: "local-operator" });
        saveState(state);
        return json(res, 200, { job: updated, publishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/jobs/lease/reap") {
      const body = await readBody(req);
      if (typeof body.jobId !== "string") return json(res, 400, { error: "jobId is required" });
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const index = state.jobs.findIndex(entry => entry.kind === "CONTENT_PRODUCTION" && entry.id === body.jobId);
        if (index < 0) return json(res, 404, { error: "Content job not found" });
        const result = expireWorkerLease(state.jobs[index]);
        if (!result.expired) return json(res, 409, { error: "No expired worker lease is available to reap", job: state.jobs[index] });
        state.jobs[index] = result.job;
        state.audit.push({ id: crypto.randomUUID(), action: "WORKER_LEASE_EXPIRED", jobId: body.jobId, previousState: result.job.transitionHistory?.at(-1)?.from, state: result.job.state, at: new Date().toISOString(), actor: "lease-reaper" });
        saveState(state);
        return json(res, 200, { job: result.job, publishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/jobs/transition") {
      const body = await readBody(req);
      if (typeof body.jobId !== "string" || typeof body.nextState !== "string") return json(res, 400, { error: "jobId and nextState are required" });
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const index = state.jobs.findIndex(entry => entry.kind === "CONTENT_PRODUCTION" && entry.id === body.jobId);
        if (index < 0) return json(res, 404, { error: "Content job not found" });
        const old = state.jobs[index];
        const updated = transitionContentJob(old, body.nextState, { actor: "local-operator", reason: body.reason ?? "" });
        state.jobs[index] = updated;
        state.audit.push({ id: crypto.randomUUID(), action: "CONTENT_JOB_STATE_CHANGED", jobId: updated.id, from: old.state, to: updated.state, at: updated.updatedAt, actor: "local-operator", reason: String(body.reason ?? "").slice(0, 1000) });
        saveState(state);
        return json(res, 200, { job: updated, publishingEnabled: false });
      } finally { release(); }
    }
    if (req.method === "POST" && url.pathname === "/api/drafts/update") {
      const body = await readBody(req);
      const item = safeItem(body);
      const release = await acquireStateLock();
      try {
        const state = loadState();
        const index = state.queueItems.findIndex(existing => existing.id === item.id);
        if (index < 0) return json(res, 404, { error: "Queue item not found" });
        const old = state.queueItems[index];
        // Ordinary editing cannot grant rights or approval; review flags remain unchanged and cannot be promoted here.
        for (const key of ["rightsConfirmed", "complianceReviewed", "approvedForPrivateUpload", "humanApproved"]) {
          if (Object.hasOwn(item, key) && item[key] !== old[key]) return json(res, 403, { error: "Review and rights fields cannot be changed through draft editing" });
        }
        if (state.queueItems.some(existing => existing.id !== item.id && existing.scheduledDate === item.scheduledDate && existing.reservationType === "SCHEDULED_SLOT" && existing.status !== "CANCELLED")) {
          return json(res, 409, { error: "Another draft already occupies this dated schedule slot" });
        }
        if (state.jobs.some(existing => existing.kind === "CONTENT_PRODUCTION" && existing.id !== state.jobs.find(j => j.kind === "CONTENT_PRODUCTION" && j.idempotencyKey === "draft:" + item.id)?.id && existing.scheduledSlot?.date === item.scheduledDate)) {
          return json(res, 409, { error: "Another production job already occupies this dated schedule slot" });
        }
        state.queueItems[index] = { ...old, ...item, status: old.status, rightsConfirmed: old.rightsConfirmed, complianceReviewed: old.complianceReviewed, updatedAt: new Date().toISOString() };
        state.audit.push({ id: crypto.randomUUID(), action: "DRAFT_EDITED", itemId: item.id, at: new Date().toISOString(), actor: "local-operator" });
        saveState(state);
        return json(res, 200, { item: state.queueItems[index] });
      } finally { release(); }
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : "Request failed" });
  }
});
const recoveredTasks = recoverInterruptedTasks();
server.listen(port, host, () => console.log(JSON.stringify({ event: "dashboard_started", host, port, publishingEnabled: false, stateFile, recoveredTasks })));
