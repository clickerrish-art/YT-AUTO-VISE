import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("isolated Node test runner bounds each child process and reports timeouts explicitly", () => {
  const source = fs.readFileSync(new URL("../scripts/run-node-tests.mjs", import.meta.url), "utf8");
  assert.match(source, /const TEST_FILE_TIMEOUT_MS = 60_000/);
  assert.match(source, /timeout: TEST_FILE_TIMEOUT_MS/);
  assert.match(source, /killSignal: "SIGKILL"/);
  assert.match(source, /result\.error\.code === "ETIMEDOUT"/);
  assert.match(source, /timed out after/);
  assert.match(source, /stdio: \["ignore", outputFd, outputFd\]/);
  assert.match(source, /detached: process\.platform !== "win32"/);
  assert.match(source, /process\.kill\(-result\.pid, "SIGKILL"\)/);
  assert.match(source, /fs\.readFileSync\(outputPath, "utf8"\)/);
});
