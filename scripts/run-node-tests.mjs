#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["test", "tests"];
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
console.log(`Running ${files.length} Node.js test files in isolated processes.`);

for (const [index, file] of files.entries()) {
  console.log(`\n[${index + 1}/${files.length}] ${file}`);
  const result = spawnSync(process.execPath, ["--test", file], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit"
  });

  if (result.error) {
    failures.push({ file, reason: result.error.message });
    console.error(`FAILED to start ${file}: ${result.error.message}`);
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
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure.file}: ${failure.reason}`);
  process.exitCode = 1;
} else {
  console.log("All discovered Node.js test files passed.");
}
