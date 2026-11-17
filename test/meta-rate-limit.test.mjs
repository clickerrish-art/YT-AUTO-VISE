import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createMetaRateLimitGuard, MetaRateLimitCooldownError } from "../scripts/meta-rate-limit.mjs";

const response = (status, headers = {}, body = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

test("Meta 429 persists Retry-After cooldown and blocks subsequent requests without retrying", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "meta-rate-limit-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const stateFile = path.join(dir, "meta-rate-limit-state.json");
  let calls = 0;
  const now = Date.parse("2026-11-17T10:00:00.000Z");
  const guarded = createMetaRateLimitGuard({ stateFile, now: () => now, fetchImpl: async () => { calls++; return response(429, { "retry-after": "120" }); } });
  const first = await guarded("https://graph.facebook.com/v27.0/me", {});
  assert.equal(first.status, 429);
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(state.blockedUntil, now + 120000);
  await assert.rejects(() => guarded("https://graph.facebook.com/v27.0/me", {}), MetaRateLimitCooldownError);
  assert.equal(calls, 1, "the cooldown must not issue a second provider request");
});

test("Meta Graph rate-limit error codes trigger bounded exponential cooldown without logging credentials", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "meta-rate-limit-code-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const stateFile = path.join(dir, "state.json");
  const now = Date.parse("2026-11-17T10:00:00.000Z");
  const guarded = createMetaRateLimitGuard({ stateFile, now: () => now, fetchImpl: async () => response(400, {}, { error: { code: 613, message: "Rate limit" } }) });
  await guarded("https://graph.facebook.com/v27.0/me", {});
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(state.reason, "META_RATE_LIMIT_RESPONSE");
  assert.equal(state.blockedUntil, now + 60000);
  assert.equal(JSON.stringify(state).includes("access_token"), false);
});

test("Meta usage headers at 90 percent apply proactive cooldown", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "meta-rate-limit-usage-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const stateFile = path.join(dir, "state.json");
  const now = Date.parse("2026-11-17T10:00:00.000Z");
  const guarded = createMetaRateLimitGuard({ stateFile, now: () => now, fetchImpl: async () => response(200, { "x-app-usage": JSON.stringify({ call_count: 95, total_cputime: 10, total_time: 20 }) }) });
  const result = await guarded("https://graph.facebook.com/v27.0/me", {});
  assert.equal(result.status, 200);
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(state.reason, "META_USAGE_THRESHOLD_REACHED");
  assert.equal(state.blockedUntil, now + 300000);
});

test("malformed or symlinked rate-limit state fails closed", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "meta-rate-limit-invalid-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const stateFile = path.join(dir, "state.json");
  fs.writeFileSync(stateFile, "not-json");
  const guarded = createMetaRateLimitGuard({ stateFile, fetchImpl: async () => { throw new Error("must not call provider"); } });
  await assert.rejects(() => guarded("https://graph.facebook.com/v27.0/me", {}));
  fs.rmSync(stateFile);
  const target = path.join(dir, "target.json");
  fs.writeFileSync(target, JSON.stringify({ attempts: 0, blockedUntil: 0 }));
  fs.symlinkSync(target, stateFile);
  await assert.rejects(() => guarded("https://graph.facebook.com/v27.0/me", {}), /non-symlink/i);
});
