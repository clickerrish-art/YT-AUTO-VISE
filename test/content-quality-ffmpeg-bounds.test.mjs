import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/content-quality.yml", "utf8");

test("content-quality FFmpeg setup is bounded and retries transient package-index failures", () => {
  assert.match(workflow, /timeout 600s sudo apt-get update/);
  assert.match(workflow, /timeout 900s sudo apt-get install/);
  assert.match(workflow, /Acquire::Retries=3/);
  assert.match(workflow, /Acquire::http::Timeout=30/);
  assert.match(workflow, /Acquire::https::Timeout=30/);
  assert.match(workflow, /--no-install-recommends/);
});
