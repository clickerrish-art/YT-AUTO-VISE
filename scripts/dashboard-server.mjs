import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

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
  const initial = { version: 1, queueItems: queue.items ?? [], audit: [], jobs: [], uploads: [] };
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
function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; if (raw.length > 16_384) reject(new Error("Request body exceeds 16KB")); });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("Request body must be valid JSON")); } });
    req.on("error", reject);
  });
}
const allowedTasks = new Map([
  ["validate-schedule", ["run", "validate:schedule"]],
  ["check-captions", ["run", "check:captions"]],
  ["production-readiness", ["run", "readiness"]],
  ["test-suite", ["test"]]
]);
const activeTasks = new Set();
const taskTimeoutMs = new Map([["validate-schedule", 30_000], ["check-captions", 45_000], ["production-readiness", 60_000], ["test-suite", 180_000]]);
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
  return { id, title, topic, contentType, scheduledDay, productUrl: approvedProductUrl, status: "DRAFT_REVIEW_REQUIRED", updatedAt: new Date().toISOString() };
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    if (req.method === "GET" && url.pathname === "/healthz") return json(res, 200, { ok: true, publishingEnabled: false });
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
      const blockers = [];
      if (!schedule.channelId) blockers.push("SonicVhibez channel ID has not been verified");
      if (!fs.existsSync(path.join(root, "content/render-manifest.json"))) blockers.push("Rights-reviewed render manifest is missing");
      return json(res, 200, { publishingEnabled: false, schedule, queueItems: state.queueItems, jobs: state.jobs.slice(-30).reverse(), uploads: state.uploads.slice(-30).reverse(), audit: state.audit.slice(-50).reverse(), blockers, stateFile: path.relative(root, stateFile) });
    }
    if (req.method === "GET" && url.pathname === "/api/tasks") {
      return json(res, 200, { publicPublishingEnabled: false, tasks: [...allowedTasks.keys()] });
    }
    if (req.method === "POST" && url.pathname === "/api/tasks/run") {
      const body = await readBody(req);
      if (typeof body.taskId !== "string" || !allowedTasks.has(body.taskId)) return json(res, 400, { error: "Choose a supported allowlisted validation task" });
      if (activeTasks.has(body.taskId)) return json(res, 409, { error: "This task is already running; duplicate execution was prevented" });
      activeTasks.add(body.taskId);
      const state = loadState();
      const job = { id: crypto.randomUUID(), kind: "VALIDATION_TASK", taskId: body.taskId, status: "RUNNING", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), publishingEnabled: false };
      state.jobs.push(job);
      state.audit.push({ id: crypto.randomUUID(), action: "VALIDATION_TASK_STARTED", jobId: job.id, taskId: body.taskId, at: new Date().toISOString(), actor: "local-operator" });
      saveState(state);
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
    if (req.method === "POST" && url.pathname === "/api/drafts") {
      const body = await readBody(req);
      const item = safeItem(body);
      const state = loadState();
      if (state.queueItems.some(existing => existing.id === item.id)) return json(res, 409, { error: "That queue ID already exists" });
      state.queueItems.push(item);
      state.audit.push({ id: crypto.randomUUID(), action: "DRAFT_CREATED", itemId: item.id, at: new Date().toISOString(), actor: "local-operator" });
      saveState(state);
      return json(res, 201, { item });
    }
    if (req.method === "POST" && url.pathname === "/api/drafts/update") {
      const body = await readBody(req);
      const item = safeItem(body);
      const state = loadState();
      const index = state.queueItems.findIndex(existing => existing.id === item.id);
      if (index < 0) return json(res, 404, { error: "Queue item not found" });
      const old = state.queueItems[index];
      // Ordinary editing cannot grant rights or approval; review flags remain unchanged and cannot be promoted here.
      for (const key of ["rightsConfirmed", "complianceReviewed", "approvedForPrivateUpload", "humanApproved"]) {
        if (Object.hasOwn(item, key) && item[key] !== old[key]) return json(res, 403, { error: "Review and rights fields cannot be changed through draft editing" });
      }
      state.queueItems[index] = { ...old, ...item, status: old.status, rightsConfirmed: old.rightsConfirmed, complianceReviewed: old.complianceReviewed, updatedAt: new Date().toISOString() };
      state.audit.push({ id: crypto.randomUUID(), action: "DRAFT_EDITED", itemId: item.id, at: new Date().toISOString(), actor: "local-operator" });
      saveState(state);
      return json(res, 200, { item: state.queueItems[index] });
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : "Request failed" });
  }
});
const recoveredTasks = recoverInterruptedTasks();
server.listen(port, host, () => console.log(JSON.stringify({ event: "dashboard_started", host, port, publishingEnabled: false, stateFile, recoveredTasks })));
