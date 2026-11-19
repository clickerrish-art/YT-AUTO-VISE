import test from "node:test";
import assert from "node:assert/strict";
import { validateAssetProvenanceSet } from "../scripts/content-quality-gates.mjs";

const asset = (assetId, derivativeOf) => ({ assetId, ...(derivativeOf === undefined ? {} : { derivativeOf }) });

test("provenance graph accepts unique source and derivative chains", () => {
  assert.deepEqual(validateAssetProvenanceSet([asset("source"), asset("grade-1", ["source"]), asset("edit-2", ["grade-1"])]), []);
});

test("provenance graph rejects duplicate asset IDs instead of silently overwriting one", () => {
  assert.ok(validateAssetProvenanceSet([asset("scene-a"), asset("scene-a")]).some(error => /duplicate assetId/i.test(error)));
});

test("provenance graph rejects missing ancestors and self-derivation", () => {
  const errors = validateAssetProvenanceSet([asset("scene-a", ["missing"]), asset("scene-b", ["scene-b"])]);
  assert.ok(errors.some(error => /missing derivative ancestor/i.test(error)));
  assert.ok(errors.some(error => /cannot derive from itself/i.test(error)));
});

test("provenance graph rejects cycles across derivative records", () => {
  const errors = validateAssetProvenanceSet([asset("scene-a", ["scene-b"]), asset("scene-b", ["scene-a"])]);
  assert.ok(errors.some(error => /contains a cycle/i.test(error)));
});

test("provenance graph fails closed on missing or malformed sets", () => {
  assert.match(validateAssetProvenanceSet([])[0], /non-empty array/i);
  assert.ok(validateAssetProvenanceSet([{}]).some(error => /no assetId/i.test(error)));
});
