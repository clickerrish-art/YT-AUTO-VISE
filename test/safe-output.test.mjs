import test from "node:test";
import assert from "node:assert/strict";
import { redactOperationalText } from "../scripts/safe-output.mjs";

test("redacts configured operator and integration secrets from output", () => {
  const text = "operator=operator-secret-123 META token=meta-access-token-123 Bearer abcdefghijklmnopqrstuvwxyz123";
  const result = redactOperationalText(text, {
    env: {
      DASHBOARD_OPERATOR_TOKEN: "operator-secret-123",
      META_PAGE_ACCESS_TOKEN: "meta-access-token-123"
    }
  });
  assert.equal(result.includes("operator-secret-123"), false);
  assert.equal(result.includes("meta-access-token-123"), false);
  assert.equal(result.includes("abcdefghijklmnopqrstuvwxyz123"), false);
  assert.match(result, /REDACTED/);
});

test("redacts secret assignments and local filesystem roots without changing safe diagnostics", () => {
  const result = redactOperationalText(
    'Error reading /private/work/state/file.json client_secret="do-not-show-this" status=ENOENT',
    { env: {}, roots: ["/private/work", "/private/work/state"] }
  );
  assert.equal(result.includes("/private/work"), false);
  assert.equal(result.includes("do-not-show-this"), false);
  assert.match(result, /Error reading <local-path>\/state\/file\.json/);
  assert.match(result, /status=ENOENT/);
});

test("handles empty output and does not redact short values that are unsafe to match globally", () => {
  assert.equal(redactOperationalText(""), "");
  assert.equal(redactOperationalText("token=x", { env: { API_TOKEN: "x" } }), "token=x");
});
