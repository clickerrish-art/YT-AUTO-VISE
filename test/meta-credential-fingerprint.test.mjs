import test from "node:test";
import assert from "node:assert/strict";
import { metaCredentialFingerprint, fingerprintsMatch } from "../scripts/meta-credential-fingerprint.mjs";

test("Meta credential attestations are keyed, purpose-bound and invalidated by rotation", () => {
  const operatorSecret = "operator-token-for-test-" + "o".repeat(30);
  const pageToken = "meta-page-token-for-test-" + "p".repeat(30);
  const userToken = "meta-user-token-for-test-" + "u".repeat(30);
  const pageFingerprint = metaCredentialFingerprint(pageToken, "meta-page-token", operatorSecret);
  const userFingerprint = metaCredentialFingerprint(userToken, "meta-user-token", operatorSecret);
  assert.match(pageFingerprint, /^[a-f0-9]{64}$/);
  assert.match(userFingerprint, /^[a-f0-9]{64}$/);
  assert.notEqual(pageFingerprint, pageToken);
  assert.equal(fingerprintsMatch(pageFingerprint, metaCredentialFingerprint(pageToken, "meta-page-token", operatorSecret)), true);
  assert.equal(fingerprintsMatch(pageFingerprint, metaCredentialFingerprint("rotated-page-token-" + "r".repeat(30), "meta-page-token", operatorSecret)), false);
  assert.equal(fingerprintsMatch(pageFingerprint, metaCredentialFingerprint(pageToken, "different-purpose", operatorSecret)), false);
  assert.equal(fingerprintsMatch(pageFingerprint, metaCredentialFingerprint(pageToken, "meta-page-token", "rotated-operator-token-" + "x".repeat(30))), false);
  assert.equal(metaCredentialFingerprint("short", "meta-page-token", operatorSecret), "");
  assert.equal(metaCredentialFingerprint(pageToken, "meta-page-token", "short"), "");
  assert.equal(fingerprintsMatch("bad", pageFingerprint), false);
});
