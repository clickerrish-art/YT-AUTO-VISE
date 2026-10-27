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

test("dashboard final approval requires explicit YouTube-use permission and exact source/licence evidence hashes", () => {
  const server = fs.readFileSync(path.resolve("scripts/dashboard-server.mjs"), "utf8");
  assert.match(server, /Each source asset and licence-evidence file requires an explicit SHA-256 checksum/);
  assert.match(server, /permittedUses\.includes\("YouTube"\)/);
  assert.match(server, /evidenceAsset\.verificationStatus !== "VERIFIED"/);
  assert.match(server, /sha256File\(evidenceFile\) !== evidenceAsset\.licenseEvidenceSha256/);
  assert.doesNotMatch(server, /if \(evidenceAsset\.licenseEvidenceSha256 && sha256File\(evidenceFile\) !== evidenceAsset\.licenseEvidenceSha256\)/);
});

test("dashboard cannot final-approve a Short until native parent association is verified and eligible", () => {
  const server = fs.readFileSync(path.resolve("scripts/dashboard-server.mjs"), "utf8");
  assert.match(server, /requireNativeRelatedVideoVerified: true/);
  assert.match(server, /allowPrivateParent: false/);
  assert.match(server, /native YouTube Related video association must be independently verified before Short publication/);
});
