#!/usr/bin/env node
/**
 * Read-only production readiness report. Never uploads or publishes.
 * Reports the exact blockers for producing the first private SonicVhibez Short.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { isValidZonedIsoTimestamp } from "./schedule-policy.mjs";
import { isSafeRegularFileWithinRoot } from "./safe-project-file.mjs";

const root = process.cwd();
const blockers = [];
const notes = [];
const exists = (p) => isSafeRegularFileWithinRoot(root, p);
const queuePath = process.env.QUEUE_PATH ?? "content/queue.json";
const queueAbsolutePath = path.resolve(root, queuePath);
const queueExists = process.env.QUEUE_PATH
  ? isSafeRegularFileWithinRoot(path.dirname(queueAbsolutePath), path.basename(queueAbsolutePath))
  : exists(queuePath);
const manifestPath = "content/render-manifest.json";
const metadataPath = "content/next-short.json";
const videoPath = "media/next-short.mp4";
const schedulePath = "config/weekly-content-plan.json";
let minimumSpacingHours = NaN;
let cycleFormats = [];
if (!exists(schedulePath)) {
  blockers.push("Authoritative publication-cycle policy is missing.");
} else {
  try {
    const schedule = JSON.parse(fs.readFileSync(path.resolve(root, schedulePath), "utf8"));
    if (schedule.timezone !== "Africa/Johannesburg") blockers.push("Schedule timezone must be Africa/Johannesburg.");
    minimumSpacingHours = schedule.minimumPublicationSpacingHours;
    cycleFormats = schedule.publicationCycle?.formats ?? [];
    if (!Number.isFinite(minimumSpacingHours) || minimumSpacingHours <= 0 || minimumSpacingHours > 8760) blockers.push("Schedule minimumPublicationSpacingHours must be a finite positive value no greater than 8760 hours.");
    if (schedule.spacingPolicy?.minimumHoursBetweenPosts !== minimumSpacingHours) blockers.push("Schedule spacingPolicy must match minimumPublicationSpacingHours.");
    if (JSON.stringify(schedule.publicationCycle?.formats) !== JSON.stringify(["long_form", "long_form", "short"])) blockers.push("Publication cycle must be long-form, long-form, Short.");
    if (schedule.publicationCycle?.minimumHoursBetweenConsecutivePublications !== minimumSpacingHours || schedule.publicationCycle?.minimumCycleHours !== minimumSpacingHours * (Array.isArray(cycleFormats) ? cycleFormats.length : 0) || schedule.spacingPolicy?.minimumCycleHours !== minimumSpacingHours * (Array.isArray(cycleFormats) ? cycleFormats.length : 0)) blockers.push("Publication cycle and spacingPolicy must use the configured minimum gap and its derived cycle duration.");
    if (schedule.publicationCycle?.publicationRequiresVerifiedHistory !== true) blockers.push("Publication cycle must require independently verified public/private/unlisted history and reconciliation of uncertain attempts.");
    const cadenceDecision = schedule.cadenceDecision;
    const supportedCadenceModes = ["ROLLING_CYCLE_WITHOUT_WEEKLY_TARGET", "OTHER_OWNER_DEFINED_FEASIBLE_POLICY"];
    let cadenceDecisionValid = Boolean(cadenceDecision
      && cadenceDecision.status === "OWNER_APPROVED"
      && cadenceDecision.ownerApproved === true
      && supportedCadenceModes.includes(cadenceDecision.approvedMode)
      && isValidZonedIsoTimestamp(cadenceDecision.approvedAt)
      && typeof cadenceDecision.approvalReference === "string"
      && cadenceDecision.approvalReference.trim());
    // The 72-hour minimum is a hard publication invariant for every cadence mode.
    // Owner approval may resolve the weekly-target conflict, but may never waive spacing.
    if (cadenceDecisionValid && minimumSpacingHours < 72) cadenceDecisionValid = false;
    if (cadenceDecisionValid && cadenceDecision.approvedMode === "OTHER_OWNER_DEFINED_FEASIBLE_POLICY") {
      const custom = cadenceDecision.ownerDefinedPolicy;
      cadenceDecisionValid = Boolean(custom
        && typeof custom.description === "string" && custom.description.trim()
        && Number.isFinite(custom.publicationsPerCycle) && custom.publicationsPerCycle >= 1
        && Number.isFinite(custom.cycleHours) && custom.cycleHours > 0
        && custom.publicationsPerCycle * minimumSpacingHours <= custom.cycleHours);
    }
    if (!cadenceDecisionValid) {
      blockers.push("CADENCE DECISION REQUIRED: a feasible owner-approved cadence mode, explicit timezone-aware approval timestamp and non-empty approval reference are required before publication.");
    }
    if (["targetCadence", "requestedTargetCadence", "cadenceDecisionRequired", "interimDraftCadence"].some(key => key in schedule)) blockers.push("Stale weekly cadence fields must be removed.");
    blockers.push("LIVE BLOCKER: complete SonicVhibez public, private and unlisted history plus all pending/uncertain upload attempts must be independently reconciled immediately before upload.");
  } catch {
    blockers.push("Authoritative weekly schedule is not valid JSON; cadence and spacing cannot be verified.");
  }
}

if (!queueExists) {
  blockers.push("content/queue.json is missing.");
} else {
  let queue;
  try {
    queue = JSON.parse(fs.readFileSync(path.resolve(root, queuePath), "utf8"));
  } catch {
    blockers.push("content/queue.json is not valid JSON; queue checks cannot be trusted.");
  }
  if (queue) {
    if (!queue || typeof queue !== "object" || Array.isArray(queue)) {
      blockers.push("Queue must be a JSON object with an items array.");
    } else {
      if (queue.publishingEnabled !== false) blockers.push("Queue must keep publishingEnabled=false until private upload and human review are verified.");
      if (queue.cadence?.minimumHoursBetweenConsecutivePublications !== minimumSpacingHours || queue.cadence?.minimumCycleHours !== minimumSpacingHours * (Array.isArray(cycleFormats) ? cycleFormats.length : 0) || JSON.stringify(queue.cadence?.formats) !== JSON.stringify(["long_form", "long_form", "short"])) blockers.push("Queue cadence must match the configured rolling publication cycle policy.");
      if (queue.cadence?.draftPreparationFallback?.notPublicationCadence !== true) blockers.push("Tuesday/Saturday fallback must be marked draft preparation only, not publication cadence.");
      if (!Array.isArray(queue.items) || queue.items.length < 2) blockers.push("Queue needs at least two draft items.");
      const items = Array.isArray(queue.items) ? queue.items : [];
      if (items.some(item => !item || typeof item !== "object" || typeof item.id !== "string" || !item.id.trim())) {
        blockers.push("Every queued item must be an object with a non-empty id.");
      }
      if (items.some(item => item.productUrl !== "https://selar.com/0u19v8u99l")) {
        blockers.push("Every queued item must use the sole approved Selar product URL.");
      }
      if (new Set(items.map(item => item.id)).size !== items.length) {
        blockers.push("Queue contains duplicate item IDs; remove duplicates before relying on cadence tracking.");
      }
      notes.push(`Queue: ${items.length} items; public publishing ${queue.publishingEnabled === false ? "disabled" : "not safely disabled"}.`);
    }
  }
}
if (!exists(manifestPath)) {
  blockers.push("Create content/render-manifest.json from the example and fill it only after verifying asset rights.");
} else {
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(path.resolve(root, manifestPath), "utf8")); }
  catch { blockers.push("content/render-manifest.json is not valid JSON."); }
  if (manifest) {
    if (manifest.channel !== "SonicVhibez") blockers.push("Render manifest target must be exactly SonicVhibez.");
    for (const key of ["footagePath", "narrationPath", "captionsPath"]) {
      if (!manifest[key] || !exists(path.join("content", manifest[key]))) blockers.push(`Manifest asset ${key} is missing: ${manifest[key] ?? "(unset)"}.`);
    }
    for (const key of ["footageLicenseEvidence", "narrationLicenseEvidence"]) {
      if (typeof manifest[key] !== "string" || manifest[key].trim().length < 12 || /replace_with|placeholder|todo|unknown|tbd/i.test(manifest[key])) {
        blockers.push(`Manifest ${key} must reference real, human-verified rights evidence.`);
      }
    }
    if (manifest.rightsConfirmed !== true) blockers.push("Set rightsConfirmed=true only after checking all media licenses and permissions.");
    if (manifest.complianceReviewed !== true) blockers.push("Set complianceReviewed=true only after human content/compliance review.");
  }
}
const longFormManifestPath = "content/long-form-render-manifest.json";
if (!exists(longFormManifestPath)) {
  blockers.push("Create content/long-form-render-manifest.json from the example only after verifying real long-form assets and rights.");
} else {
  let longManifest;
  try { longManifest = JSON.parse(fs.readFileSync(path.resolve(root, longFormManifestPath), "utf8")); }
  catch { blockers.push("content/long-form-render-manifest.json is not valid JSON."); }
  if (longManifest) {
    if (longManifest.channel !== "SonicVhibez") blockers.push("Long-form render manifest target must be exactly SonicVhibez.");
    if (longManifest.targetAspectRatio !== "16:9") blockers.push("Long-form render manifest must specify targetAspectRatio 16:9.");
    for (const key of ["footagePath", "narrationPath", "captionsPath"]) {
      if (typeof longManifest[key] !== "string" || !longManifest[key].trim() || !exists(path.join("content", longManifest[key]))) {
        blockers.push(`Long-form manifest asset ${key} is missing: ${longManifest[key] ?? "(unset)"}.`);
      }
    }
    for (const key of ["footageLicenseEvidence", "narrationLicenseEvidence"]) {
      if (typeof longManifest[key] !== "string" || longManifest[key].trim().length < 12 || /replace_with|placeholder|todo|unknown|tbd/i.test(longManifest[key])) {
        blockers.push(`Long-form manifest ${key} must reference real, human-verified rights evidence.`);
      }
    }
    if (typeof longManifest.title !== "string" || longManifest.title.trim().length < 10 || /replace_with|placeholder|todo|tbd/i.test(longManifest.title)) {
      blockers.push("Long-form manifest title must be a real, reviewed title.");
    }
    if (longManifest.rightsConfirmed !== true) blockers.push("Long-form manifest rightsConfirmed must be true only after checking all media licenses and permissions.");
    if (longManifest.complianceReviewed !== true) blockers.push("Long-form manifest complianceReviewed must be true only after human content/compliance review.");
    if (typeof longManifest.containsSyntheticMedia !== "boolean") blockers.push("Long-form manifest must explicitly record containsSyntheticMedia as true or false.");
    if (typeof longManifest.hasPaidPromotion !== "boolean") blockers.push("Long-form manifest must explicitly record hasPaidPromotion as true or false.");
  }
}
if (!exists(metadataPath)) {
  blockers.push("Reviewed metadata file content/next-short.json is missing.");
} else {
  let metadata;
  try { metadata = JSON.parse(fs.readFileSync(path.resolve(root, metadataPath), "utf8")); }
  catch { blockers.push("content/next-short.json is not valid JSON."); }
  if (metadata) {
    if (metadata.channel !== "SonicVhibez") blockers.push("Metadata target must be exactly SonicVhibez.");
    if (metadata.status !== "READY_FOR_PRIVATE_UPLOAD") blockers.push("Metadata must be human-reviewed and explicitly marked READY_FOR_PRIVATE_UPLOAD before upload.");
    if (!metadata.channelId || !/^UC[a-zA-Z0-9_-]{22}$/.test(metadata.channelId)) blockers.push("Metadata needs the verified SonicVhibez YouTube channel ID.");
    if (process.env.SONICVHIBEZ_CHANNEL_ID && metadata.channelId !== process.env.SONICVHIBEZ_CHANNEL_ID) blockers.push("Metadata channelId does not match the configured SonicVhibez channel ID.");
    if (!Array.isArray(metadata.tags) || metadata.tags.length < 3) blockers.push("Metadata must include at least three relevant tags.");
    if (metadata.madeForKids !== false) blockers.push("Metadata must explicitly set madeForKids=false for this adult creator-marketing workflow.");
    if (typeof metadata.description !== "string" || !metadata.description.includes("https://selar.com/0u19v8u99l")) blockers.push("Metadata description must contain the sole approved Selar URL.");
    if (metadata.rightsConfirmed !== true) blockers.push("Metadata rightsConfirmed must be true only after media rights are verified.");
    if (metadata.complianceReviewed !== true) blockers.push("Metadata complianceReviewed must be true only after content/compliance review.");
    if (metadata.visibility !== "private") blockers.push("Metadata visibility must remain private.");
    if (metadata.productUrl !== "https://selar.com/0u19v8u99l") blockers.push("Metadata must use the sole approved Selar product URL.");
  }
}
if (!exists(videoPath)) blockers.push("Rendered MP4 media/next-short.mp4 is missing.");
for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) {
  if (!process.env[key]?.trim()) blockers.push(`Required YouTube environment variable ${key} is not configured in this execution environment.`);
}
if (process.env.SONICVHIBEZ_CHANNEL_ID && !/^UC[a-zA-Z0-9_-]{22}$/.test(process.env.SONICVHIBEZ_CHANNEL_ID)) {
  blockers.push("SONICVHIBEZ_CHANNEL_ID does not match the expected YouTube channel-ID format; verify it manually.");
}
function resolutionFor(blocker) {
  if (/history|uncertain upload|remote/i.test(blocker)) return "Authenticate to the approved SonicVhibez channel, retrieve public/private/unlisted history, reconcile every pending or uncertain attempt, and retain the reviewed reconciliation ledger.";
  if (/license|licen[cs]e|rights evidence|rightsConfirmed/i.test(blocker)) return "Supply genuine source and licence/permission evidence for every asset, verify the permitted uses and restrictions, and retain evidence files plus SHA-256 hashes. Do not use placeholder strings.";
  if (/human|review|approval|compliance/i.test(blocker)) return "Have the authorized human reviewer inspect the final media, captions, thumbnail, metadata, claims and disclosures; record the decision against exact final artifact hashes.";
  if (/YOUTUBE_|channel ID|channelId|channel identity|SonicVhibez/i.test(blocker)) return "Configure credentials only in the approved secret store, authenticate with YouTube, and verify the API-returned channel ID equals the independently confirmed SonicVhibez channel ID.";
  if (/manifest|MP4|media|footage|narration|captions|thumbnail/i.test(blocker)) return "Provide the genuine playable export and complete manifest; validate streams, duration, dimensions, captions, metadata and exact SHA-256 hashes.";
  if (/Selar|product URL|destination/i.test(blocker)) return "Use only the approved product destination https://selar.com/0u19v8u99l and ensure reviewed metadata and CTA agree with the actual content.";
  if (/schedule|spacing|cycle|queue|cadence/i.test(blocker)) return "Correct the authoritative schedule and queue so the rolling long_form → long_form → short cycle, Africa/Johannesburg timezone and minimum elapsed spacing agree; keep publication disabled.";
  return "Inspect the named prerequisite, provide verifiable evidence in the expected configuration or artifact, then rerun production readiness. Do not bypass or weaken this gate.";
}

function controlOwnerFor(message) {
  if (/LIVE BLOCKER|CADENCE DECISION REQUIRED|YOUTUBE_CLIENT_ID|YOUTUBE_CLIENT_SECRET|YOUTUBE_REFRESH_TOKEN|SONICVHIBEZ_CHANNEL_ID|verified SonicVhibez YouTube channel ID|rightsConfirmed|complianceReviewed|human-reviewed|human review|owner-approved/i.test(message)) {
    return "external_owner_or_human_reviewer";
  }
  if (/render-manifest|long-form-render-manifest|final rendered|media\/next-short\.mp4|footageLicenseEvidence|narrationLicenseEvidence/i.test(message)) {
    return "shared_code_and_owner";
  }
  return "maintainer_code_or_configuration";
}

function evidenceInspectedFor(message) {
  if (/YOUTUBE_CLIENT_ID|YOUTUBE_CLIENT_SECRET|YOUTUBE_REFRESH_TOKEN|SONICVHIBEZ_CHANNEL_ID/.test(message)) {
    return {
      kind: "environment-presence-check",
      observed: "The required variable is absent from this readiness process environment; secret values are never included in this report."
    };
  }
  if (/LIVE BLOCKER/.test(message)) {
    return {
      kind: "external-reconciliation-required",
      observed: "This read-only readiness check does not independently fetch remote YouTube history; remote public/private/unlisted history and local uncertain attempts remain unverified here."
    };
  }
  const pathMatch = message.match(/(?:content|config|media)\/[A-Za-z0-9._/-]+\.json|media\/next-short\.mp4/);
  return {
    kind: pathMatch ? "repository-path-check" : "readiness-check-finding",
    ...(pathMatch ? { path: pathMatch[0] } : {}),
    observed: message
  };
}

const structuredBlockers = blockers.map((message) => {
  const digest = createHash("sha256").update(message).digest("hex").slice(0, 12).toUpperCase();
  const critical = /LIVE BLOCKER|uncertain|OAuth|YOUTUBE_|channel ID|rights|licen[cs]e|human|approval|upload|private/i.test(message);
  return {
    id: `RDY-${digest}`,
    severity: critical ? "critical" : "high",
    message,
    evidence: evidenceInspectedFor(message),
    controlOwner: controlOwnerFor(message),
    resolution: resolutionFor(message)
  };
});

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({
    application: "SonicVhibez Marketing Machine",
    mode: "read-only",
    status: blockers.length ? "blocked" : "prerequisites-present",
    blockerCount: structuredBlockers.length,
    blockers: structuredBlockers,
    notes,
    limitations: [
      "This report never uploads, schedules, or publishes.",
      "This report does not verify account ownership, licence authenticity, factual accuracy, or visual quality."
    ]
  }, null, 2));
  if (blockers.length) process.exitCode = 2;
} else {
  console.log("SonicVhibez production readiness (read-only)");
  for (const note of notes) console.log("INFO: " + note);
  if (blockers.length) {
    console.log(`HOLD: ${blockers.length} blocker(s) remain before a private upload can be attempted:`);
    for (const blocker of blockers) console.log("- " + blocker);
    console.log("This report never uploads, schedules, or publishes.");
    console.log("This report does not verify account ownership, license authenticity, factual accuracy, or visual quality.");
    process.exitCode = 2;
  } else {
    console.log("PREREQUISITES PRESENT: run the content checker and media preflight, then manually inspect the result before any private upload.");
    console.log("This report never uploads, schedules, or publishes.");
  }
}
