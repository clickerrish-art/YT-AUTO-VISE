import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const ffmpegWorkflows = [
  ".github/workflows/validate-automation.yml",
  ".github/workflows/instagram-publisher-safety.yml",
  ".github/workflows/queue-readiness.yml",
  ".github/workflows/content-quality.yml",
  ".github/workflows/isolated-baseline-comparison.yml",
  ".github/workflows/validate.yml"
];

test("FFmpeg CI uses a pinned renderer build with verified drawtext and H.264 support", () => {
  for (const path of ffmpegWorkflows) {
    const workflow = fs.readFileSync(path, "utf8");
    assert.match(workflow, /source .*install-ffmpeg-static\\.sh/, path + " must source the shared FFmpeg installer");
    assert.doesNotMatch(workflow, /apt-get/, path + " must not use slow apt package installation");
  }

  const installer = fs.readFileSync(".github/scripts/install-ffmpeg-static.sh", "utf8");
  assert.match(installer, /autobuild-2026-11-17-12-40/);
  assert.match(installer, /checksums\\.sha256/);
  assert.match(installer, /sha256sum --check/);
  assert.match(installer, /drawtext/);
  assert.match(installer, /libx264/);
  assert.match(installer, /GITHUB_PATH/);
  assert.match(installer, /GITHUB_ENV/);
  assert.match(installer, /export PATH=/);
});
