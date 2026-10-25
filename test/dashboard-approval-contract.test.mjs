import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("dashboard approval rechecks and binds the exact validated captions and metadata hashes", () => {
  const server = fs.readFileSync(path.resolve("scripts/dashboard-server.mjs"), "utf8");
  const lifecycle = fs.readFileSync(path.resolve("scripts/content-job-lifecycle.mjs"), "utf8");
  assert.match(server, /const captionsPath = job\.validationResults\?\.captionsPath/);
  assert.match(server, /sha256File\(captionsFile\) !== captionsSha256/);
  assert.match(server, /relatedArtifacts: \[\.\.\.relatedArtifacts, \{ path: metadataPath, sha256: metadataVersion \}\]/);
  assert.match(lifecycle, /Validated captions path and SHA-256 are required before private-upload approval/);
  assert.match(lifecycle, /\{ path: captionsPath, sha256: captionsSha256 \}/);
});
