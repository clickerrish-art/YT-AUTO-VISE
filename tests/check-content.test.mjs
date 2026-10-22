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
