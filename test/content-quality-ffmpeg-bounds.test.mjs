import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const boundedFfmpegWorkflows = [
  ".github/workflows/validate-automation.yml",
  ".github/workflows/instagram-publisher-safety.yml",
  ".github/workflows/queue-readiness.yml",
  ".github/workflows/content-quality.yml",
  ".github/workflows/isolated-baseline-comparison.yml"
];

test("FFmpeg CI setup avoids slow apt index refresh and bounds package installation", () => {
  for (const path of boundedFfmpegWorkflows) {
    const workflow = fs.readFileSync(path, "utf8");
    assert.doesNotMatch(workflow, /apt-get update/, path + " must not refresh package indexes");
    assert.match(workflow, /timeout 300s sudo apt-get install/, path + " must bound FFmpeg installation");
    assert.match(workflow, /Acquire::Retries=1/, path + " must bound transient retries");
    assert.match(workflow, /Acquire::http::Timeout=30/, path + " must bound HTTP timeout");
    assert.match(workflow, /Acquire::https::Timeout=30/, path + " must bound HTTPS timeout");
    assert.match(workflow, /--no-install-recommends/, path + " must avoid unnecessary packages");
  }
});
