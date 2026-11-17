import fs from "node:fs";
import path from "node:path";

const RATE_LIMIT_CODES = new Set([4, 17, 32, 613]);
const MAX_BACKOFF_MS = 60 * 60 * 1000;
const DEFAULT_BACKOFF_MS = 60 * 1000;
const USAGE_THRESHOLD = 90;

function parseRetryAfter(value, now) {
  if (typeof value !== "string" || !value.trim()) return null;
  const seconds = Number(value.trim());
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(MAX_BACKOFF_MS, seconds * 1000);
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return null;
  return Math.min(MAX_BACKOFF_MS, Math.max(0, date - now));
}

function usagePercentages(headers) {
  const values = [];
  for (const name of ["x-app-usage", "x-page-usage", "x-business-use-case-usage"]) {
    const raw = headers?.get?.(name);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const visit = value => {
        if (Array.isArray(value)) return value.forEach(visit);
        if (!value || typeof value !== "object") return;
        for (const [key, item] of Object.entries(value)) {
          if (typeof item === "number" && /call_count|total_cputime|total_time/i.test(key)) values.push(item);
          else if (item && typeof item === "object") visit(item);
        }
      };
      visit(parsed);
    } catch { /* malformed provider usage headers are ignored, never trusted */ }
  }
  return values.filter(Number.isFinite);
}

async function providerErrorCode(response) {
  try {
    const body = await response.clone().json();
    return Number.isInteger(body?.error?.code) ? body.error.code : null;
  } catch { return null; }
}

function readState(file) {
  let stat;
  try { stat = fs.lstatSync(file); }
  catch (error) { if (error?.code === "ENOENT") return { attempts: 0, blockedUntil: 0 }; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Meta rate-limit state must be a regular non-symlink file; provider calls blocked");
  const state = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!state || !Number.isSafeInteger(state.attempts) || state.attempts < 0 || !Number.isFinite(state.blockedUntil) || state.blockedUntil < 0) {
    throw new Error("Meta rate-limit state is malformed; provider calls blocked");
  }
  return state;
}

function writeState(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = file + "." + process.pid + "." + Date.now() + ".tmp";
  const fd = fs.openSync(temp, "wx", 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2) + "\n", "utf8"); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(temp, file);
  if (process.platform !== "win32") {
    const dir = fs.openSync(path.dirname(file), fs.constants.O_RDONLY);
    try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
  }
}

export class MetaRateLimitCooldownError extends Error {
  constructor(retryAfterMs, blockedUntil) {
    super("Meta rate-limit cooldown is active; no provider request sent for another " + Math.ceil(retryAfterMs / 1000) + " seconds");
    this.name = "MetaRateLimitCooldownError";
    this.status = 429;
    this.retryable = true;
    this.retryAfterMs = retryAfterMs;
    this.blockedUntil = blockedUntil;
  }
}

export function createMetaRateLimitGuard({ fetchImpl = fetch, stateFile, now = Date.now } = {}) {
  if (typeof fetchImpl !== "function" || typeof stateFile !== "string" || !path.isAbsolute(stateFile) || typeof now !== "function") {
    throw new TypeError("Meta rate-limit guard requires fetchImpl, an absolute stateFile and a clock function");
  }
  return async (input, options) => {
    const current = Number(now());
    if (!Number.isFinite(current)) throw new Error("Meta rate-limit guard clock is invalid");
    const state = readState(stateFile);
    if (state.blockedUntil > current) throw new MetaRateLimitCooldownError(state.blockedUntil - current, state.blockedUntil);

    const response = await fetchImpl(input, options);
    const code = await providerErrorCode(response);
    const usages = usagePercentages(response.headers);
    const nearLimit = usages.some(value => value >= USAGE_THRESHOLD);
    const rateLimited = response.status === 429 || RATE_LIMIT_CODES.has(code);
    if (rateLimited || nearLimit) {
      const attempts = rateLimited ? state.attempts + 1 : Math.max(1, state.attempts);
      const retryAfter = parseRetryAfter(response.headers?.get?.("retry-after"), current);
      const fallback = Math.min(MAX_BACKOFF_MS, DEFAULT_BACKOFF_MS * (2 ** Math.min(attempts - 1, 6)));
      const delay = rateLimited ? (retryAfter ?? fallback) : 5 * 60 * 1000;
      writeState(stateFile, {
        attempts,
        blockedUntil: Math.max(state.blockedUntil ?? 0, current + delay),
        updatedAt: new Date(current).toISOString(),
        lastHttpStatus: response.status,
        lastMetaErrorCode: code,
        reason: rateLimited ? "META_RATE_LIMIT_RESPONSE" : "META_USAGE_THRESHOLD_REACHED",
        usagePercentages: usages
      });
    } else if (state.blockedUntil && state.blockedUntil <= current) {
      writeState(stateFile, { attempts: 0, blockedUntil: 0, updatedAt: new Date(current).toISOString(), reason: "COOLDOWN_EXPIRED" });
    }
    return response;
  };
}
