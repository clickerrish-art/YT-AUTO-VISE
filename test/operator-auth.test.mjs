import test from "node:test";
import assert from "node:assert/strict";
import { matchesOperatorToken } from "../scripts/operator-auth.mjs";

test("operator token comparison accepts only the exact token", () => {
  assert.equal(matchesOperatorToken("a".repeat(24), "a".repeat(24)), true);
  assert.equal(matchesOperatorToken("a".repeat(24), "b".repeat(24)), false);
  assert.equal(matchesOperatorToken(undefined, "a".repeat(24)), false);
  assert.equal(matchesOperatorToken(["a".repeat(24)], "a".repeat(24)), false);
});

test("operator token comparison safely rejects equal-code-unit strings with unequal UTF-8 byte lengths", () => {
  // Both strings have JavaScript length 24, but the first has more UTF-8 bytes.
  const provided = "é" + "a".repeat(23);
  const expected = "a".repeat(24);
  assert.equal(provided.length, expected.length);
  assert.notEqual(Buffer.byteLength(provided, "utf8"), Buffer.byteLength(expected, "utf8"));
  assert.equal(matchesOperatorToken(provided, expected), false);
});

test("operator token comparison handles matching non-ASCII tokens without throwing", () => {
  const token = "é".repeat(24);
  assert.equal(matchesOperatorToken(token, token), true);
  assert.equal(matchesOperatorToken("é".repeat(23) + "x", token), false);
});
