import test from "node:test";
import assert from "node:assert/strict";
import { artifactPartMd5, assertArtifactPartMatches } from "../scripts/artifact-integrity.mjs";

test("R2 multipart part integrity accepts the exact bytes and a quoted or unquoted ETag", () => {
  const bytes = new Uint8Array([1, 2, 3, 4, 5]);
  const md5 = "7cfdd07889b3295d6a550914ab35e068";
  assert.equal(artifactPartMd5(bytes), md5);
  assert.equal(assertArtifactPartMatches(bytes, md5), md5);
  assert.equal(assertArtifactPartMatches(bytes, '"' + md5 + '"'), md5);
});

test("R2 multipart part integrity rejects changed bytes, missing ETags and malformed ETags", () => {
  const bytes = new Uint8Array([1, 2, 3, 4, 5]);
  assert.throws(() => assertArtifactPartMatches(new Uint8Array([1, 2, 3, 4, 6]), "7cfdd07889b3295d6a550914ab35e068"), /does not match/);
  assert.throws(() => assertArtifactPartMatches(bytes, undefined), /does not match/);
  assert.throws(() => assertArtifactPartMatches(bytes, "not-an-etag"), /does not match/);
});
