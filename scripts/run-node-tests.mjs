#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseNodeTestSummary } from "./node-test-summary.mjs";

const roots = ["test", "tests"];
const TEST_FILE_TIMEOUT_MS = 60_000; // A hung test file must not block the full release suite indefinitely.
const files = roots.flatMap(root => {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".test.mjs"))
    .map(entry => path.join(root, entry.name));
}).sort();

if (files.length === 0) {
  console.error("No Node.js test files were found in ./test or ./tests.");
  process.exit(2);
}

const failures = [];
let totalPass = 0, totalFail = 0, totalSkipped = 0;
console.log(`Running ${files.length} Node.js test files in isolated processes (per-file timeout: ${TEST_FILE_TIMEOUT_MS}ms).`);

for (const [index, file] of files.entries()) {
  console.log(`\n[${index + 1}/${files.length}] ${file}`);
  const result = spawnSync(process.execPath, ["--test", file], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    timeout: TEST_FILE_TIMEOUT_MS,
    killSignal: "SIGTERM",
    maxBuffer: 32 * 1024 * 1024
  });
  const output = String(result.stdout ?? "") + String(result.stderr ?? "");
  process.stdout.write(output);
  const summary = parseNodeTestSummary(output);
  if (!summary) {
    failures.push({ file, reason: "test runner summary was missing or malformed; pass/fail/skip totals cannot be verified" });
  } else {
    totalPass += summary.pass;
    totalFail += summary.fail;
    totalSkipped += summary.skipped;
  }

  if (result.error) {
    const reason = result.error.code === "ETIMEDOUT"
      ? `timed out after ${TEST_FILE_TIMEOUT_MS}ms`
      : result.error.message;
    failures.push({ file, reason });
    console.error(`FAILED to execute ${file}: ${reason}`);
    continue;
  }
  if (result.signal || result.status !== 0) {
    failures.push({
      file,
      reason: result.signal ? `terminated by ${result.signal}` : `exit code ${result.status}`
    });
  }
}

console.log(`\nNode.js test-file summary: ${files.length - failures.length}/${files.length} passed.`);
console.log(`Node.js test totals: pass ${totalPass}, fail ${totalFail}, skipped ${totalSkipped}.`);
if (totalFail > 0) failures.push({ file: "aggregate", reason: `${totalFail} test(s) failed` });
const allowedSkipped = process.env.DASHBOARD_TEST_CHILD === "1" ? 1 : 0;
if (totalSkipped > allowedSkipped) failures.push({ file: "aggregate", reason: `${totalSkipped} test(s) were skipped; allowed ${allowedSkipped} in this isolated self-test mode` });
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure.file}: ${failure.reason}`);
  process.exitCode = 1;
} else {
  console.log("All discovered Node.js test files passed.");
}
