/** Parse the final TAP summary emitted by Node's built-in test runner. */
export function parseNodeTestSummary(output) {
  const normalized = String(output ?? "").replace(/\u001b\[[0-9;]*m/g, "");
  const lastMatch = pattern => [...normalized.matchAll(pattern)].at(-1);
  const pass = lastMatch(/(?:ℹ|#)\s*pass\s+(\d+)/gi);
  const fail = lastMatch(/(?:ℹ|#)\s*fail\s+(\d+)/gi);
  const skipped = lastMatch(/(?:ℹ|#)\s*skipped\s+(\d+)/gi);
  if (!pass || !fail || !skipped) return null;
  const summary = { pass: Number(pass[1]), fail: Number(fail[1]), skipped: Number(skipped[1]) };
  return Object.values(summary).every(Number.isSafeInteger) ? summary : null;
}
