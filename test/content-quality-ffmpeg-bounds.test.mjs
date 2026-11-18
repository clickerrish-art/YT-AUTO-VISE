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

test("FFmpeg CI uses pinned static binaries instead of slow apt package installs", () => {
  for (const path of ffmpegWorkflows) {
    const workflow = fs.readFileSync(path, "utf8");
    assert.match(workflow, /source .*install-ffmpeg-static\.sh/, path + " must source the shared static FFmpeg installer");
    assert.doesNotMatch(workflow, /apt-get/, path + " must not use apt package installation");
  }

  const installer = fs.readFileSync(".github/scripts/install-ffmpeg-static.sh", "utf8");
  assert.match(installer, /timeout 240s npm install/);
  assert.match(installer, /ffmpeg-static@5\.3\.0/);
  assert.match(installer, /@derhuerst\/ffprobe-static@5\.3\.0/);
  assert.match(installer, /GITHUB_PATH/);
  assert.match(installer, /export PATH=/);
  assert.match(installer, /ffmpeg" -version/);
  assert.match(installer, /ffprobe" -version/);
});
