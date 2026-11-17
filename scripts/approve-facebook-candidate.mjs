import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  createFacebookAutonomousApprovalReceipt,
  facebookPayloadFingerprint,
  verifyFacebookAutonomousApprovalReceipt
} from "./facebook-policy-engine.mjs";

const root = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const fail = message => { throw new Error(message); };
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

function readRegularFile(candidate, label) {
  if (typeof candidate !== "string" || !candidate.trim() || path.isAbsolute(candidate) ||
      candidate.includes("\\") || candidate.split("/").some(part => !part || part === "." || part === "..")) {
    fail(label + " must be a safe repository-relative path");
  }
  const resolved = path.resolve(root, candidate);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) fail(label + " escapes the repository");
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(label + " must be a regular non-symlink file");
  const canonical = fs.realpathSync(resolved);
  if (canonical !== resolved || (canonical !== root && !canonical.startsWith(root + path.sep))) {
    fail(label + " resolves outside the repository or through a symlink");
  }
  return { path: canonical, stat, bytes: fs.readFileSync(canonical) };
}

function syncDirectory(directory) {
  if (process.platform === "win32") return;
  const fd = fs.openSync(directory, fs.constants.O_RDONLY);
  try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}

/**
 * Human signs one exact Nature Frontiers Facebook candidate. The publisher independently
 * rechecks policy, media hashes, rights, source reachability, destination and Meta identity.
 */
export async function approveFacebookCandidate({
  candidateFile = "content/facebook-intake-candidates.json",
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
  const reviewer = env.FACEBOOK_APPROVER_ID ?? "";
  if (Buffer.byteLength(secret, "utf8") < 32) fail("FACEBOOK_APPROVAL_HMAC_SECRET must contain at least 32 bytes");
  if (typeof reviewer !== "string" || reviewer.trim().length < 2 || reviewer.length > 120) fail("FACEBOOK_APPROVER_ID must identify the human reviewer");
  const source = readRegularFile(candidateFile, "Candidate file");
  const candidates = JSON.parse(source.bytes.toString("utf8"));
  if (!Array.isArray(candidates)) fail("Candidate JSON must contain an array");
  const matches = candidates.filter(item => item?.slotId === slotId);
  if (matches.length !== 1) fail("The exact slot ID must match exactly one candidate");
  const item = matches[0];
  const config = JSON.parse(fs.readFileSync(path.join(root, "config/facebook-publishing.json"), "utf8"));
  if (item.destination !== "nature_frontiers_facebook" || item.destinationPageId !== config.destinationPageId) {
    fail("Candidate destination does not match the configured Nature Frontiers Facebook Page");
  }
  if (item.approval) fail("Candidate already has an approval receipt; do not overwrite an existing decision");
  if (typeof item.caption !== "string" || !item.caption.trim()) fail("Candidate has no final caption to review");
  if (!Array.isArray(item.claims) || item.claims.length === 0) fail("Candidate must include sourced factual claims before review");
  if (!Array.isArray(item.media) || item.media.length === 0) fail("Candidate must include final media and rights evidence before review");

  stdout.write("\nNATURE FRONTIERS — FACTUAL CLAIM REVIEW\n");
  for (let index = 0; index < item.claims.length; index++) {
    const claim = item.claims[index];
    if (typeof claim?.text !== "string" || !claim.text.trim() ||
        !Array.isArray(claim.sourceUrls) || claim.sourceUrls.length === 0 ||
        typeof claim.sourceExcerpt !== "string" || claim.sourceExcerpt.trim().length < 25) {
      fail("Every claim needs text, source URLs and a substantive source excerpt");
    }
    stdout.write("\nClaim " + (index + 1) + ": " + claim.text + "\n");
    stdout.write("Sources: " + JSON.stringify(claim.sourceUrls) + "\nExcerpt: " + claim.sourceExcerpt + "\n");
    stdout.write("Open each source and verify that it supports the complete claim with its qualifications.\n");
    if (await confirm("Type exactly VERIFY CLAIM " + slotId + " " + (index + 1) + ": ") !==
        "VERIFY CLAIM " + slotId + " " + (index + 1)) fail("Claim review was not confirmed; no approval was written");
    const claimHash = sha256(Buffer.from(String(claim.text), "utf8"));
    const sourceUrlsHash = sha256(Buffer.from(JSON.stringify(claim.sourceUrls), "utf8"));
    const sourceExcerptHash = sha256(Buffer.from(String(claim.sourceExcerpt), "utf8"));
    const checkedAt = new Date(now).toISOString();
    const signed = claimHash + "\\n" + sourceUrlsHash + "\\n" + sourceExcerptHash + "\\n" + reviewer.trim() + "\\n" + checkedAt;
    const signature = crypto.createHmac("sha256", secret).update(signed).digest("hex");
    item.claims[index] = {
      ...claim,
      sourceSupportsClaim: true,
      verified: true,
      semanticVerification: { claimHash, sourceUrlsHash, sourceExcerptHash, reviewerId: reviewer.trim(), checkedAt, signature }
    };
  }

  stdout.write("\nNATURE FRONTIERS — FINAL MEDIA AND RIGHTS REVIEW\n");
  for (let index = 0; index < item.media.length; index++) {
    const asset = item.media[index] ?? {};
    const rights = asset.rightsRecord ?? {};
    const mediaFile = readRegularFile(asset.path, "Media asset " + (index + 1));
    const rightsFile = readRegularFile(rights.evidencePath, "Rights evidence " + (index + 1));
    const actualMediaHash = sha256(mediaFile.bytes);
    const actualRightsHash = sha256(rightsFile.bytes);
    if (actualMediaHash !== asset.sha256 || actualRightsHash !== rights.evidenceSha256) {
      fail("Media or rights-evidence checksum mismatch for asset " + (index + 1));
    }
    if (rights.commercialUse !== true || rights.socialMediaUse !== true ||
        rights.provenanceVerified !== true || rights.syntheticOrAlteredKnown !== true ||
        typeof rights.source !== "string" || !rights.source.trim() ||
        typeof rights.license !== "string" || !rights.license.trim() ||
        (rights.attributionRequired === true && !(typeof rights.attributionText === "string" && rights.attributionText.trim())) ||
        (rights.expiresAt != null && (!Number.isFinite(Date.parse(rights.expiresAt)) || Date.parse(rights.expiresAt) <= Date.parse(now)))) {
      fail("Rights evidence fields are incomplete or expired for asset " + (index + 1));
    }
    stdout.write([
      "Media " + (index + 1) + ": " + String(asset.id ?? "unnamed"),
      "Path: " + asset.path,
      "SHA-256: " + actualMediaHash,
      "Rights evidence: " + rights.evidencePath,
      "Rights SHA-256: " + actualRightsHash,
      "Source: " + rights.source,
      "License: " + rights.license,
      "Commercial use: " + rights.commercialUse,
      "Social media use: " + rights.socialMediaUse,
      "Provenance verified: " + rights.provenanceVerified,
      "Synthetic/altered origin known: " + rights.syntheticOrAlteredKnown
    ].join("\n") + "\n");
    if (await confirm("Type exactly VERIFY MEDIA " + slotId + " " + (index + 1) + " after inspecting the actual file and licence: ") !==
        "VERIFY MEDIA " + slotId + " " + (index + 1)) fail("Media/rights review was not confirmed; no approval was written");
  }

  stdout.write("\nFINAL CAPTION\n" + item.caption + "\n");
  stdout.write("Links: " + JSON.stringify(item.links ?? []) + "\n");
  const fingerprint = facebookPayloadFingerprint(item);
  stdout.write("Exact content fingerprint: " + fingerprint + "\n");
  stdout.write("The publisher will independently rerun all policy, rights, source, duplicate, cadence and destination checks. This signature does not enable publishing.\n");
  const reason = await confirm("Enter the reason for approving this exact candidate: ");
  if (typeof reason !== "string" || reason.trim().length < 3 || reason.length > 1000) fail("A meaningful approval reason is required");
  if (await confirm("Type exactly APPROVE " + slotId + " to sign: ") !== "APPROVE " + slotId) {
    fail("Final approval was not confirmed; no approval was written");
  }

  const approval = createFacebookAutonomousApprovalReceipt(item, { reviewer, reason, secret, now });
  const verified = verifyFacebookAutonomousApprovalReceipt({ ...item, approval }, { secret, now });
  if (!verified.valid || verified.contentFingerprint !== fingerprint) fail("New approval receipt failed its own verification");

  const current = readRegularFile(candidateFile, "Candidate file");
  if (current.stat.dev !== source.stat.dev || current.stat.ino !== source.stat.ino || !current.bytes.equals(source.bytes)) {
    fail("Candidate changed during review; reopen and review the latest version");
  }
  const updated = candidates.map(candidate => candidate?.slotId === slotId ? { ...candidate, approval } : candidate);
  const temporary = source.path + "." + process.pid + ".approval.tmp";
  const fd = fs.openSync(temporary, "wx", 0o600);
  try {
    fs.writeFileSync(fd, JSON.stringify(updated, null, 2) + "\n", "utf8");
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  try {
    const latest = readRegularFile(candidateFile, "Candidate file");
    if (latest.stat.dev !== source.stat.dev || latest.stat.ino !== source.stat.ino || !latest.bytes.equals(source.bytes)) {
      fail("Candidate changed before atomic approval commit; no approval was written");
    }
    fs.renameSync(temporary, source.path);
    syncDirectory(path.dirname(source.path));
  } catch (error) {
    try { fs.rmSync(temporary, { force: true }); } catch {}
    throw error;
  }
  return { approved: true, slotId, reviewer: reviewer.trim(), approvedAt: now, contentFingerprint: fingerprint };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [candidateFile, slotId] = process.argv.slice(2);
    const result = await approveFacebookCandidate({ candidateFile: candidateFile ?? undefined, slotId });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("BLOCKED: Facebook candidate approval was not written:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  }
}
