#!/usr/bin/env node
/**
 * Read-only production readiness report. Never uploads or publishes.
 * Reports the exact blockers for producing the first private SonicVhibez Short.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blockers = [];
const notes = [];
const exists = (p) => fs.existsSync(path.resolve(root, p));
const queuePath = "content/queue.json";
const manifestPath = "content/render-manifest.json";
const metadataPath = "content/next-short.json";
const videoPath = "media/next-short.mp4";

if (!exists(queuePath)) {
  blockers.push("content/queue.json is missing.");
} else {
  const queue = JSON.parse(fs.readFileSync(path.resolve(root, queuePath), "utf8"));
  if (queue.publishingEnabled !== false) blockers.push("Queue must keep publishingEnabled=false until private upload and human review are verified.");
  if (!Array.isArray(queue.items) || queue.items.length < 2) blockers.push("Queue needs at least two draft items.");
  if ((queue.items ?? []).some(item => item.productUrl !== "https://selar.com/0u19v8u99l")) {
    blockers.push("Every queued item must use the sole approved Selar product URL.");
  }
  notes.push(`Queue: ${queue.items?.length ?? 0} items; public publishing ${queue.publishingEnabled === false ? "disabled" : "not safely disabled"}.`);
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
console.log("SonicVhibez production readiness (read-only)");
for (const note of notes) console.log("INFO: " + note);
if (blockers.length) {
  console.log(`HOLD: ${blockers.length} blocker(s) remain before a private upload can be attempted:`);
  for (const blocker of blockers) console.log("- " + blocker);
  console.log("This report never uploads, schedules, or publishes.");
  console.log("This report does not verify account ownership, license authenticity, factual accuracy, or visual quality.");
  process.exit(0);
}
console.log("PREREQUISITES PRESENT: run the content checker and media preflight, then manually inspect the result before any private upload.");
console.log("This report never uploads, schedules, or publishes.");
