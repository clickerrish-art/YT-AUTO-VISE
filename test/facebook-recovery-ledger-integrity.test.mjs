import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

test("dashboard fails closed and preserves malformed or truncated Facebook recovery receipts", async (t) => {
  const fixtures = [
    {
      name: "malformed JSON record",
      contents: "{not-json}\n",
      expected: /malformed JSON/
    },
    {
      name: "truncated final record",
      contents: JSON.stringify({
        attemptId: "attempt-uncertain",
        remotePostId: "123456789",
        status: "NEEDS_RECONCILIATION",
        reason: "receipt persistence failed",
        recordedAt: "2026-10-24T00:00:00.000Z"
      }).slice(0, -4),
      expected: /incomplete final record/
    },
    {
      name: "missing required remote receipt field",
      contents: JSON.stringify({
        attemptId: "attempt-uncertain",
        remotePostId: "",
        status: "NEEDS_RECONCILIATION",
        reason: "receipt persistence failed",
        recordedAt: "2026-10-24T00:00:00.000Z"
      }) + "\n",
      expected: /record is incomplete/
    }
  ];

  for (const fixture of fixtures) {
    await t.test(fixture.name, async (t2) => {
      const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-facebook-ledger-"));
      const ledgerPath = path.join(stateDir, "facebook-recovery-ledger.jsonl");
      fs.writeFileSync(ledgerPath, fixture.contents, { mode: 0o600 });
      const port = 32000 + Math.floor(Math.random() * 20000);
      const token = "test-token-" + "z".repeat(40);
      const child = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
        env: {
          ...process.env,
          DASHBOARD_OPERATOR_TOKEN: token,
          DASHBOARD_OPERATOR_ID: "test-owner@example.test",
          DASHBOARD_STATE_DIR: stateDir,
          PORT: String(port),
          DASHBOARD_HOST: "127.0.0.1"
        },
        stdio: ["ignore", "pipe", "pipe"]
      });
      let logs = "";
      child.stdout.on("data", chunk => { logs += chunk.toString(); });
      child.stderr.on("data", chunk => { logs += chunk.toString(); });
      t2.after(() => {
        if (child.exitCode === null) child.kill("SIGTERM");
        fs.rmSync(stateDir, { recursive: true, force: true });
      });

      const exited = await new Promise(resolve => {
        const timeout = setTimeout(() => resolve(false), 4000);
        child.once("exit", () => { clearTimeout(timeout); resolve(true); });
      });
      assert.equal(exited, true, "dashboard must not serve requests with corrupt recovery receipts");
      assert.notEqual(child.exitCode, 0);
      assert.match(logs, fixture.expected);
      assert.equal(fs.readFileSync(ledgerPath, "utf8"), fixture.contents, "corrupt recovery evidence must not be silently repaired or overwritten");
    });
  }
});
