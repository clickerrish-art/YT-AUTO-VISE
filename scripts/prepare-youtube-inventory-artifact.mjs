#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { evaluateYoutubeInventoryArtifact } from "./youtube-inventory-artifact-policy.mjs";

const relativePath = process.env.YOUTUBE_HISTORY_INVENTORY_PATH?.trim();
if (!relativePath || path.isAbsolute(relativePath) ||
    path.normalize(relativePath).split(path.sep).includes("..")) {
  throw new Error("YOUTUBE_HISTORY_INVENTORY_PATH must be a safe repository-relative path");
}
const inventoryPath = path.resolve(process.cwd(), relativePath);
const raw = fs.readFileSync(inventoryPath);
const inventory = JSON.parse(raw.toString("utf8"));
const result = evaluateYoutubeInventoryArtifact(inventory);
const sha256 = createHash("sha256").update(raw).digest("hex");
const retentionDays = 7;
const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
const outputs = {
  artifact_ready: String(result.artifactReady),
  inventory_sha256: sha256,
  expires_at: expiresAt,
  total_uploads: String(result.totalUploads),
  public_count: String(result.visibilityCounts.public),
  private_count: String(result.visibilityCounts.private),
  unlisted_count: String(result.visibilityCounts.unlisted),
  reason: result.reason
};
const outputLines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`).join("\n") + "\n";
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, outputLines, { mode: 0o600 });
else process.stdout.write(outputLines);
const summary = [
  "### YouTube inventory artifact privacy gate",
  "",
  `- Complete uploads: ${result.totalUploads}`,
  `- Public: ${result.visibilityCounts.public}`,
  `- Private: ${result.visibilityCounts.private}`,
  `- Unlisted: ${result.visibilityCounts.unlisted}`,
  `- Public-only artifact eligible: ${result.artifactReady ? "YES" : "NO"}`,
  `- Raw inventory SHA-256: ${sha256}`,
  `- Planned retention: ${retentionDays} days`,
  `- Expected expiry: ${expiresAt}`,
  `- Decision: ${result.reason}`,
  "",
  "Video IDs and titles are deliberately not printed in this summary."
].join("\n") + "\n";
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { mode: 0o600 });
process.stdout.write(`Inventory artifact eligible: ${result.artifactReady}; total=${result.totalUploads}; public=${result.visibilityCounts.public}; private=${result.visibilityCounts.private}; unlisted=${result.visibilityCounts.unlisted}.\n`);
