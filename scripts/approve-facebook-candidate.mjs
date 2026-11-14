import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { facebookPayloadFingerprint } from "./facebook-policy-engine.mjs";

const root = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const fail = message => { throw new Error(message); };

export async function approveFacebookCandidate({
  candidateFile,
  slotId,
  env = process.env,
  confirm = async prompt => {
    const rl = createInterface({ input: stdin, output: stdout });
    try { return await rl.question(prompt); } finally { rl.close(); }
  },
  now = new Date().toISOString()
} = {}) {
  if (typeof slotId !== "string" || !slotId.trim()) fail("An exact candidate slot ID is required");
  const secret = env.FACEBOOK_APPROVAL_HMAC_SECRET ?? "";
  const reviewerId = env.FACEBOOK_APPROVER_ID ?? "";
  if (secret.length < 32) fail("FACEBOOK_APPROVAL_HMAC_SECRET must be configured with at least 32 characters");
  if (!reviewerId.trim() || reviewerId.length > 200) fail("FACEBOOK_APPROVER_ID must identify the human reviewer");
  if (typeof candidateFile !== "string" || !candidateFile.trim()) fail("A candidate JSON file path is required");

  const file = path.resolve(root, candidateFile);
  const withinRoot = value => value === root || value.startsWith(root + path.sep);
  if (!withinRoot(file)) fail("Candidate file must remain inside the repository");
  const initial = fs.lstatSync(file);
  if (!initial.isFile() || initial.isSymbolicLink()) fail("Candidate file must be a regular file, not a symlink");
  const initialBytes = fs.readFileSync(file);
  const canonical = fs.realpathSync(file);
  if (!withinRoot(canonical) || canonical !== file) fail("Candidate file resolves outside the repository or through a symlink");

  const config = JSON.parse(fs.readFileSync(path.join(root, "config/facebook-publishing.json"), "utf8"));
  const candidates = JSON.parse(initialBytes.toString("utf8"));
  if (!Array.isArray(candidates)) fail("Candidate JSON must contain an array");
  const matches = candidates.map((item, index) => ({ item, index })).filter(row => row.item?.slotId === slotId);
  if (matches.length !== 1) fail("The exact slot ID must match exactly one candidate");
  const { item, index } = matches[0];
  if (item.destination !== "nature_frontiers_facebook" || item.destinationPageId !== config.destinationPageId) {
    fail("Candidate destination does not match the configured Nature Frontiers Facebook Page");
  }
  if (item.editorialApproval) fail("Candidate already has an editorial approval; do not overwrite an existing decision");
  if (typeof item.caption !== "string" || !item.caption.trim()) fail("Candidate has no final caption to review");
  if (!Array.isArray(item.claims) || item.claims.length === 0) fail("Candidate must include its factual claim evidence before review");
  if (!Array.isArray(item.media) || item.media.length === 0) fail("Candidate must include its final media assets before review");

  const contentFingerprint = facebookPayloadFingerprint(item);
  stdout.write("\nNATURE FRONTIERS — FINAL CONTENT REVIEW\n");
  stdout.write("Slot: " + item.slotId + "\n");
  stdout.write("Scheduled: " + String(item.scheduledAt ?? "not set") + "\n");
  stdout.write("Caption:\n" + item.caption + "\n");
  stdout.write("Claims:\n" + item.claims.map((claim, i) => (i + 1) + ". " + String(claim?.text ?? "")).join("\n") + "\n");
  stdout.write("Media:\n" + item.media.map(asset => "- " + String(asset?.id ?? "unnamed") + " SHA-256 " + String(asset?.sha256 ?? "missing")).join("\n") + "\n");
  stdout.write("Links: " + JSON.stringify(item.links ?? []) + "\n");
  stdout.write("Content fingerprint: " + contentFingerprint + "\n");
  stdout.write("Review the actual media files and source/rights evidence separately before approving.\n");

  const answer = await confirm("Type exactly APPROVE " + slotId + " to sign this exact content: ");
  if (answer !== "APPROVE " + slotId) fail("Approval not confirmed; candidate was not changed");
  const approvedAt = new Date(now).toISOString();
  const signed = contentFingerprint + "\\n" + reviewerId + "\\n" + approvedAt;
  const signature = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  candidates[index] = {
    ...item,
    editorialApproval: { status: "APPROVED", contentFingerprint, reviewerId, approvedAt, signature }
  };

  const currentStat = fs.lstatSync(canonical);
  const currentBytes = fs.readFileSync(canonical);
  if (!currentStat.isFile() || currentStat.isSymbolicLink() ||
      currentStat.dev !== initial.dev || currentStat.ino !== initial.ino ||
      !currentBytes.equals(initialBytes)) {
    fail("Candidate changed during review; approval was not written. Reopen the latest candidate and review it again.");
  }

  const temporary = canonical + "." + process.pid + ".approval.tmp";
  const mode = fs.statSync(canonical).mode & 0o777;
  const handle = fs.openSync(temporary, "wx", mode);
  try {
    fs.writeFileSync(handle, JSON.stringify(candidates, null, 2) + "\n", "utf8");
    fs.fsyncSync(handle);
  } finally {
    fs.closeSync(handle);
  }
  try { fs.renameSync(temporary, canonical); }
  catch (error) {
    try { fs.unlinkSync(temporary); } catch {}
    throw error;
  }
  return { approved: true, slotId, reviewerId, approvedAt, contentFingerprint };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [candidateFile, slotId] = process.argv.slice(2);
    const result = await approveFacebookCandidate({ candidateFile, slotId });
    stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (error) {
    console.error("BLOCKED: editorial approval was not written:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  }
}
