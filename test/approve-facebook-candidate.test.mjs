import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { approveFacebookCandidate } from "../scripts/approve-facebook-candidate.mjs";
import { facebookPayloadFingerprint, verifyFacebookAutonomousApprovalReceipt } from "../scripts/facebook-policy-engine.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const secret = "test-only-facebook-approval-secret-0123456789";
const reviewer = "nature-frontiers-reviewer";
const now = "2026-11-17T10:00:00.000+02:00";

function fixture(t, slotId = "nf-test-slot-1") {
  const dir = fs.mkdtempSync(path.join(root, ".tmp-facebook-approval-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const media = path.join(dir, "media.mp4");
  const rights = path.join(dir, "rights.txt");
  fs.writeFileSync(media, "test media bytes");
  fs.writeFileSync(rights, "test licence evidence");
  const hash = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const payload = {
    destination: "nature_frontiers_facebook",
    destinationPageId: "1431329126735709",
    slotId,
    scheduledAt: "2026-11-18T08:00:00+02:00",
    caption: "Nile crocodiles use ambush hunting near the water's edge.",
    links: [],
    claims: [{
      text: "Nile crocodiles use ambush hunting near the water's edge.",
      sourceUrls: ["https://ielc.libguides.com/sdzg/factsheets/nile_crocodile/behavior"],
      sourceExcerpt: "Nile crocodiles use ambush hunting and wait near the water's edge."
    }],
    media: [{
      id: "crocodile-reel",
      path: path.relative(root, media),
      sha256: hash(media),
      rightsRecord: {
        evidencePath: path.relative(root, rights),
        evidenceSha256: hash(rights),
        source: "Original locally rendered illustration",
        license: "Owner-created",
        commercialUse: true,
        socialMediaUse: true,
        provenanceVerified: true,
        syntheticOrAlteredKnown: true,
        attributionRequired: false
      }
    }]
  };
  const file = path.join(dir, "candidates.json");
  fs.writeFileSync(file, JSON.stringify([payload]));
  return { dir, file, payload, relativeFile: path.relative(root, file) };
}

function confirmer(slotId, mutate) {
  return async prompt => {
    if (prompt.startsWith("Type exactly VERIFY CLAIM")) return "VERIFY CLAIM " + slotId + " 1";
    if (prompt.startsWith("Type exactly VERIFY MEDIA")) return "VERIFY MEDIA " + slotId + " 1";
    if (prompt.startsWith("Enter the reason")) return "Reviewed final copy, factual source, media and rights evidence.";
    if (prompt.startsWith("Type exactly APPROVE")) return "APPROVE " + slotId;
    if (mutate) mutate(prompt);
    return "";
  };
}

test("interactive signer creates a valid receipt bound to the exact candidate", async t => {
  const f = fixture(t);
  const result = await approveFacebookCandidate({
    candidateFile: f.relativeFile,
    slotId: f.payload.slotId,
    env: { FACEBOOK_APPROVAL_HMAC_SECRET: secret, FACEBOOK_APPROVER_ID: reviewer },
    confirm: confirmer(f.payload.slotId),
    now
  });
  const saved = JSON.parse(fs.readFileSync(f.file, "utf8"))[0];
  const check = verifyFacebookAutonomousApprovalReceipt(saved, { secret, now });
  assert.equal(result.approved, true);
  assert.equal(check.valid, true);
  assert.equal(saved.approval.reviewer, reviewer);
  assert.equal(saved.approval.contentFingerprint, facebookPayloadFingerprint(saved));
  assert.equal(saved.approval.signature.length, 64);
  assert.equal(saved.claims[0].sourceSupportsClaim, true);
  assert.equal(saved.claims[0].verified, true);
  const attestation = saved.claims[0].semanticVerification;
  assert.equal(attestation.reviewerId, reviewer);
  assert.equal(attestation.claimHash, crypto.createHash("sha256").update(saved.claims[0].text).digest("hex"));
  assert.equal(attestation.sourceUrlsHash, crypto.createHash("sha256").update(JSON.stringify(saved.claims[0].sourceUrls)).digest("hex"));
  assert.equal(attestation.sourceExcerptHash, crypto.createHash("sha256").update(saved.claims[0].sourceExcerpt).digest("hex"));
  const signedClaim = attestation.claimHash + "\\n" + attestation.sourceUrlsHash + "\\n" +
    attestation.sourceExcerptHash + "\\n" + attestation.reviewerId + "\\n" + attestation.checkedAt;
  assert.equal(attestation.signature, crypto.createHmac("sha256", secret).update(signedClaim).digest("hex"));
  const alteredAttestation = { ...saved, claims: [{ ...saved.claims[0], semanticVerification: { ...attestation, sourceExcerptHash: "0".repeat(64) } }] };
  assert.notEqual(facebookPayloadFingerprint(alteredAttestation), facebookPayloadFingerprint(saved));
});

test("signer refuses missing secrets, invalid media hashes, duplicate slots and existing receipts", async t => {
  const f = fixture(t);
  const base = {
    candidateFile: f.relativeFile, slotId: f.payload.slotId,
    env: { FACEBOOK_APPROVAL_HMAC_SECRET: secret, FACEBOOK_APPROVER_ID: reviewer },
    confirm: confirmer(f.payload.slotId), now
  };
  await assert.rejects(() => approveFacebookCandidate({ ...base, env: {} }), /at least 32 bytes/i);
  const duplicated = JSON.parse(fs.readFileSync(f.file, "utf8"));
  fs.writeFileSync(f.file, JSON.stringify([...duplicated, duplicated[0]]));
  await assert.rejects(() => approveFacebookCandidate(base), /exact slot ID must match exactly one/i);
  fs.writeFileSync(f.file, JSON.stringify([f.payload]));
  const changed = { ...f.payload, media: [{ ...f.payload.media[0], sha256: "0".repeat(64) }] };
  fs.writeFileSync(f.file, JSON.stringify([changed]));
  await assert.rejects(() => approveFacebookCandidate(base), /checksum mismatch/i);
  fs.writeFileSync(f.file, JSON.stringify([{ ...f.payload, approval: { decision: "APPROVE" } }]));
  await assert.rejects(() => approveFacebookCandidate(base), /already has an approval/i);
});

test("signer leaves candidate unchanged when a reviewer declines", async t => {
  const f = fixture(t);
  const original = fs.readFileSync(f.file, "utf8");
  await assert.rejects(() => approveFacebookCandidate({
    candidateFile: f.relativeFile, slotId: f.payload.slotId,
    env: { FACEBOOK_APPROVAL_HMAC_SECRET: secret, FACEBOOK_APPROVER_ID: reviewer },
    confirm: async () => "NO", now
  }), /not confirmed/i);
  assert.equal(fs.readFileSync(f.file, "utf8"), original);
});

test("signer detects a candidate changed during the review and refuses stale approval", async t => {
  const f = fixture(t);
  const base = {
    candidateFile: f.relativeFile, slotId: f.payload.slotId,
    env: { FACEBOOK_APPROVAL_HMAC_SECRET: secret, FACEBOOK_APPROVER_ID: reviewer },
    now
  };
  let changed = false;
  await assert.rejects(() => approveFacebookCandidate({
    ...base,
    confirm: async prompt => {
      if (!changed && prompt.startsWith("Type exactly VERIFY CLAIM")) {
        changed = true;
        fs.writeFileSync(f.file, JSON.stringify([{ ...f.payload, caption: "Changed while review was open." }]));
      }
      if (prompt.startsWith("Type exactly VERIFY CLAIM")) return "VERIFY CLAIM " + f.payload.slotId + " 1";
      if (prompt.startsWith("Type exactly VERIFY MEDIA")) return "VERIFY MEDIA " + f.payload.slotId + " 1";
      if (prompt.startsWith("Enter the reason")) return "Reviewed.";
      return "APPROVE " + f.payload.slotId;
    }
  }), /changed during review/i);
  assert.equal(JSON.parse(fs.readFileSync(f.file, "utf8"))[0].approval, undefined);
});
