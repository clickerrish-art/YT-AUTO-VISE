import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { approveFacebookCandidate } from "../scripts/approve-facebook-candidate.mjs";
import { facebookPayloadFingerprint } from "../scripts/facebook-policy-engine.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const secret = "test-only-editorial-approval-secret-0123456789";
const candidate = slotId => ({
  destination: "nature_frontiers_facebook",
  destinationPageId: "1431329126735709",
  slotId,
  scheduledAt: "2026-11-15T06:00:00.000Z",
  caption: "Observe wildlife from a respectful distance.",
  claims: [{ text: "Observe wildlife from a respectful distance." }],
  media: [{ id: "asset-1", sha256: "a".repeat(64) }],
  links: []
});

test("interactive signer writes a valid approval bound to the exact candidate fingerprint", async t => {
  const dir = fs.mkdtempSync(path.join(root, ".tmp-facebook-approval-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "candidates.json");
  const payload = candidate("nf-test-slot-1");
  fs.writeFileSync(file, JSON.stringify([payload]));
  const result = await approveFacebookCandidate({
    candidateFile: path.relative(root, file),
    slotId: payload.slotId,
    env: { FACEBOOK_APPROVAL_HMAC_SECRET: secret, FACEBOOK_APPROVER_ID: "owner-test-reviewer" },
    confirm: async prompt => {
      assert.ok(prompt.includes(payload.slotId));
      return "APPROVE " + payload.slotId;
    },
    now: "2026-11-14T10:00:00.000Z"
  });
  const saved = JSON.parse(fs.readFileSync(file, "utf8"))[0];
  const approval = saved.editorialApproval;
  assert.equal(result.approved, true);
  assert.equal(approval.status, "APPROVED");
  assert.equal(approval.contentFingerprint, facebookPayloadFingerprint(saved));
  const signed = approval.contentFingerprint + "\n" + approval.reviewerId + "\n" + approval.approvedAt;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  assert.equal(approval.signature, expected);
});

test("signer refuses an unconfirmed review and leaves the candidate unchanged", async t => {
  const dir = fs.mkdtempSync(path.join(root, ".tmp-facebook-approval-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "candidates.json");
  const payload = candidate("nf-test-slot-2");
  const original = JSON.stringify([payload]);
  fs.writeFileSync(file, original);
  await assert.rejects(() => approveFacebookCandidate({
    candidateFile: path.relative(root, file), slotId: payload.slotId,
    env: { FACEBOOK_APPROVAL_HMAC_SECRET: secret, FACEBOOK_APPROVER_ID: "owner-test-reviewer" },
    confirm: async () => "NO",
    now: "2026-11-14T10:00:00.000Z"
  }), /not confirmed/i);
  assert.equal(fs.readFileSync(file, "utf8"), original);
});

test("signer refuses to overwrite a candidate changed while the human review prompt is open", async t => {
  const dir = fs.mkdtempSync(path.join(root, ".tmp-facebook-approval-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "candidates.json");
  const payload = candidate("nf-test-slot-race");
  const original = JSON.stringify([payload]);
  fs.writeFileSync(file, original);
  await assert.rejects(() => approveFacebookCandidate({
    candidateFile: path.relative(root, file), slotId: payload.slotId,
    env: { FACEBOOK_APPROVAL_HMAC_SECRET: secret, FACEBOOK_APPROVER_ID: "owner-test-reviewer" },
    confirm: async () => {
      fs.writeFileSync(file, JSON.stringify([{ ...payload, caption: "Changed while reviewer was reading" }]));
      return "APPROVE " + payload.slotId;
    },
    now: "2026-11-14T10:00:00.000Z"
  }), /changed during review/i);
  const saved = JSON.parse(fs.readFileSync(file, "utf8"))[0];
  assert.equal(saved.editorialApproval, undefined);
  assert.equal(saved.caption, "Changed while reviewer was reading");
});

test("signer rejects missing key, duplicate slot IDs, existing approval and symlinked files", async t => {
  const dir = fs.mkdtempSync(path.join(root, ".tmp-facebook-approval-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "candidates.json");
  const payload = candidate("nf-test-slot-3");
  fs.writeFileSync(file, JSON.stringify([payload, payload]));
  const args = {
    candidateFile: path.relative(root, file), slotId: payload.slotId,
    env: { FACEBOOK_APPROVAL_HMAC_SECRET: secret, FACEBOOK_APPROVER_ID: "owner-test-reviewer" },
    confirm: async () => "APPROVE " + payload.slotId
  };
  await assert.rejects(() => approveFacebookCandidate({ ...args, env: {} }), /at least 32 characters/i);
  await assert.rejects(() => approveFacebookCandidate(args), /exact slot ID must match exactly one/i);
  fs.writeFileSync(file, JSON.stringify([{ ...payload, editorialApproval: { status: "APPROVED" } }]));
  await assert.rejects(() => approveFacebookCandidate(args), /already has an editorial approval/i);
  const link = path.join(dir, "linked.json");
  fs.symlinkSync(file, link);
  await assert.rejects(() => approveFacebookCandidate({ ...args, candidateFile: path.relative(root, link) }), /regular file, not a symlink/i);
});
