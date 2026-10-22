import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

test("renderer refuses to run without an explicitly reviewed manifest", () => {
  const result = spawnSync(process.execPath, ["scripts/render-short.mjs"], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /render manifest not found/i);
});

test("example render manifest defaults to a blocked state", () => {
  const manifest = JSON.parse(fs.readFileSync("content/render-manifest.example.json", "utf8"));
  assert.equal(manifest.channel, "SonicVhibez");
  assert.equal(manifest.rightsConfirmed, false);
  assert.equal(manifest.complianceReviewed, false);
  assert.equal(manifest.targetSeconds, 55);
});
