import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("dashboard API authenticates operators, persists real drafts, and cannot grant approval", async (t) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-dashboard-"));
  const port = 18000 + Math.floor(Math.random() * 10000);
  const token = "test-token-" + "x".repeat(40);
  const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
    env: { ...process.env, DASHBOARD_OPERATOR_TOKEN: token, DASHBOARD_STATE_DIR: stateDir, PORT: String(port), DASHBOARD_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => { child.kill("SIGTERM"); fs.rmSync(stateDir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) break;
    try { const response = await fetch(base + "/healthz"); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server did not start: " + logs);
  const unauthorized = await fetch(base + "/api/state");
  assert.equal(unauthorized.status, 401);
  const headers = { "content-type": "application/json", "x-operator-token": token };
  const initial = await fetch(base + "/api/state", { headers });
  assert.equal(initial.status, 200);
  const body = await initial.json();
  assert.equal(body.publishingEnabled, false);
  const draft = {
    id: "dashboard-test-draft", title: "Test wildlife planning draft", topic: "planning a wildlife video",
    contentType: "long_form", scheduledDay: "Tuesday", scheduledDate: "2026-10-27", productUrl: "https://selar.com/0u19v8u99l"
  };
  const created = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(draft) });
  assert.equal(created.status, 201, await created.text());
  const duplicate = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify(draft) });
  assert.equal(duplicate.status, 409);
  const conflictingSlot = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-other", title: "Conflicting Tuesday reservation" }) });
  assert.equal(conflictingSlot.status, 409, "different drafts must not reserve the same calendar slot");
  const invalidDate = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-invalid-date", scheduledDate: "2026-02-31" }) });
  assert.equal(invalidDate.status, 400, "invalid calendar dates must be rejected");
  const unsafe = await fetch(base + "/api/drafts", { method: "POST", headers, body: JSON.stringify({ ...draft, id: "dashboard-test-unsafe", rightsConfirmed: true }) });
  assert.equal(unsafe.status, 400);
  const saved = JSON.parse(fs.readFileSync(path.join(stateDir, "dashboard-state.json"), "utf8"));
  assert.ok(saved.queueItems.some(item => item.id === draft.id));
  assert.ok(saved.audit.some(event => event.action === "DRAFT_CREATED" && event.itemId === draft.id));
  assert.equal(saved.queueItems.find(item => item.id === draft.id).rightsConfirmed, undefined);
});
