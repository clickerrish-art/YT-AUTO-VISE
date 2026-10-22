import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("approved product config contains only the owner-provided vault URL", () => {
  const config = JSON.parse(fs.readFileSync("config/products.json", "utf8"));
  assert.equal(config.products.length, 1);
  assert.equal(config.products[0].url, "https://selar.com/0u19v8u99l");
  assert.equal(config.products[0].status, "approved");
});

test("example template starts private and cannot pass review by default", () => {
  const example = JSON.parse(fs.readFileSync("content/next-short.example.json", "utf8"));
  assert.equal(example.visibility, "private");
  assert.equal(example.rightsConfirmed, false);
  assert.equal(example.complianceReviewed, false);
  assert.equal(example.productUrl, "https://selar.com/0u19v8u99l");
});

test("all prepared production metadata templates remain blocked until review is complete", async () => {
  const { spawnSync } = await import("node:child_process");
  const templates = [
    "content/next-short.example.json",
    "content/short-001-metadata.example.json",
    "content/short-002-metadata.example.json"
  ];
  for (const path of templates) {
    const result = spawnSync(process.execPath, ["scripts/check-content.mjs", path], {
      encoding: "utf8",
      env: { ...process.env, SONICVHIBEZ_CHANNEL_ID: "UC_TEST_ONLY_NOT_A_REAL_CHANNEL" }
    });
    assert.notEqual(result.status, 0, `${path} must remain blocked until review`);
    assert.match(result.stderr, /BLOCKED/);
    assert.match(result.stderr, /rightsConfirmed/);
    assert.match(result.stderr, /complianceReviewed/);
  }
});

test("missing metadata fails closed", async () => {
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(process.execPath, ["scripts/check-content.mjs", "content/does-not-exist.json"], {
    encoding: "utf8"
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /metadata file not found/);
});
