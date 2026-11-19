import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildVerifiedRightsAssets } from "../scripts/rights-evidence.mjs";

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sonic-rights-evidence-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const asset = path.join(dir, "asset.bin");
  const licence = path.join(dir, "licence.txt");
  fs.writeFileSync(asset, Buffer.from("genuine fixture bytes"));
  fs.writeFileSync(licence, "fixture licence evidence");
  return {
    dir,
    asset,
    licence,
    resolveFile(relative) {
      const candidate = path.resolve(dir, relative);
      assert.ok(candidate.startsWith(dir + path.sep));
      assert.ok(fs.statSync(candidate).isFile());
      return candidate;
    },
    sha256File(file) {
      return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    },
    item(overrides = {}) {
      return {
        assetId: "asset-1",
        source: "Operator-supplied source",
        rightsHolder: "Rights holder recorded by operator",
        assetPath: "asset.bin",
        licenseEvidenceLocation: "licence.txt",
        permittedUses: ["YouTube"],
        restrictions: "No additional restrictions recorded",
        attributionRequirements: "Attribution as specified by licence",
        ...overrides
      };
    }
  };
}

test("rights evidence binds non-empty source and licence files to SHA-256 hashes", t => {
  const f = fixture(t);
  const [result] = buildVerifiedRightsAssets([f.item()], {
    actor: "operator@example.test",
    timestamp: "2026-11-01T08:00:00+02:00",
    resolveFile: f.resolveFile,
    sha256File: f.sha256File
  });
  assert.equal(result.verificationStatus, "VERIFIED");
  assert.equal(result.verifiedBy, "operator@example.test");
  assert.match(result.assetSha256, /^[a-f0-9]{64}$/);
  assert.match(result.licenseEvidenceSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.permittedUses, ["YouTube"]);
});

test("rights evidence requires a real timezone-qualified verification timestamp", t => {
  const f = fixture(t);
  const options = {
    actor: "operator@example.test",
    resolveFile: f.resolveFile,
    sha256File: f.sha256File
  };
  for (const timestamp of [
    "2026-11-01T08:00:00",
    "2026-02-30T08:00:00Z",
    "2026-11-01T08:00:00+15:00",
    "2026-11-01T08:00:00+14:01"
  ]) {
    assert.throws(() => buildVerifiedRightsAssets([f.item()], { ...options, timestamp }),
      /valid verification timestamp with an explicit timezone/);
  }
});

test("rights evidence rejects symbolic links in source and licence paths", t => {
  const f = fixture(t);
  const options = {
    actor: "operator@example.test",
    timestamp: "2026-11-01T08:00:00+02:00",
    resolveFile: f.resolveFile,
    sha256File: f.sha256File
  };
  const assetLink = path.join(f.dir, "asset-link.bin");
  fs.symlinkSync(f.asset, assetLink);
  assert.throws(() => buildVerifiedRightsAssets([f.item({ assetPath: "asset-link.bin" })], options),
    /path must not contain symbolic links/);
  fs.unlinkSync(assetLink);

  const licenceLink = path.join(f.dir, "licence-link.txt");
  fs.symlinkSync(f.licence, licenceLink);
  assert.throws(() => buildVerifiedRightsAssets([f.item({ licenseEvidenceLocation: "licence-link.txt" })], options),
    /path must not contain symbolic links/);
});

test("rights evidence rejects malformed SHA-256 provider results", t => {
  const f = fixture(t);
  assert.throws(() => buildVerifiedRightsAssets([f.item()], {
    actor: "operator@example.test",
    timestamp: "2026-11-01T08:00:00+02:00",
    resolveFile: f.resolveFile,
    sha256File: () => "not-a-sha256"
  }), /SHA-256 digest must be 64 hexadecimal characters/);
});

test("rights evidence rejects empty source assets and empty licence evidence", t => {
  const f = fixture(t);
  fs.writeFileSync(f.asset, "");
  assert.throws(() => buildVerifiedRightsAssets([f.item()], {
    actor: "operator@example.test", timestamp: "2026-11-01T08:00:00+02:00",
    resolveFile: f.resolveFile, sha256File: f.sha256File
  }), /Source asset must be a non-empty regular file/);
  fs.writeFileSync(f.asset, "source bytes");
  fs.writeFileSync(f.licence, "");
  assert.throws(() => buildVerifiedRightsAssets([f.item()], {
    actor: "operator@example.test", timestamp: "2026-11-01T08:00:00+02:00",
    resolveFile: f.resolveFile, sha256File: f.sha256File
  }), /License evidence must be a non-empty regular file/);
});

test("rights evidence rejects duplicate IDs and malformed permitted-use entries", t => {
  const f = fixture(t);
  const options = {
    actor: "operator@example.test", timestamp: "2026-11-01T08:00:00+02:00",
    resolveFile: f.resolveFile, sha256File: f.sha256File
  };
  assert.throws(() => buildVerifiedRightsAssets([f.item(), f.item()], options), /Duplicate rights asset ID/);
  assert.throws(() => buildVerifiedRightsAssets([f.item({ permittedUses: ["YouTube", "  "] })], options), /valid permittedUses list/);
  assert.throws(() => buildVerifiedRightsAssets([f.item({ permittedUses: ["Instagram"] })], options), /explicitly includes YouTube/);
});
