#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isSafeRegularFileWithinRoot } from "./safe-project-file.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sha256Json = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function buildQueueIdentityApprovalTemplate(operationalQueue, detailedQueue) {
  if (!operationalQueue || typeof operationalQueue !== "object" || !Array.isArray(operationalQueue.items)) {
    throw new Error("content/queue.json must contain an items array");
  }
  if (!detailedQueue || typeof detailedQueue !== "object" || !Array.isArray(detailedQueue.items)) {
    throw new Error("content/long-form-queue.json must contain an items array");
  }
  const ids = new Set();
  for (const item of operationalQueue.items) {
    if (!item || typeof item.id !== "string" || !item.id.trim() || ids.has(item.id)) {
      throw new Error("operational queue must contain unique, non-empty item IDs");
    }
    ids.add(item.id);
  }
  const detailedIds = new Set();
  for (const item of detailedQueue.items) {
    if (!item || typeof item.id !== "string" || !item.id.trim() || detailedIds.has(item.id)) {
      throw new Error("detailed queue must contain unique, non-empty item IDs");
    }
    detailedIds.add(item.id);
  }
  const longForms = operationalQueue.items.filter(item => item.contentType === "long_form");
  if (longForms.length < 2) throw new Error("at least two operational long_form items are required");
  return {
    schemaVersion: 1,
    status: "PENDING_OWNER_APPROVAL",
    ownerApproved: false,
    approvedBy: "",
    approvedAt: "",
    approvalReference: "",
    operationalQueueSha256: sha256Json(operationalQueue),
    detailedQueueSha256: sha256Json(detailedQueue),
    mappings: longForms.map((item, index) => ({
      operationalItemId: item.id,
      detailedItemId: "",
      cyclePosition: Math.floor(index / 2) * 3 + (index % 2) + 1
    }))
  };
}

function readProjectJson(relativePath) {
  if (!isSafeRegularFileWithinRoot(root, relativePath)) {
    throw new Error(relativePath + " is missing, symlinked or outside the repository root");
  }
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

export function main() {
  const operationalQueue = readProjectJson("content/queue.json");
  const detailedQueue = readProjectJson("content/long-form-queue.json");
  const template = buildQueueIdentityApprovalTemplate(operationalQueue, detailedQueue);
  console.log(JSON.stringify(template, null, 2));
  console.error("PENDING OWNER INPUT: select each detailedItemId, confirm cycle positions/topics, then fill approvedBy, approvedAt and approvalReference. This command does not create or approve the file.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error("BLOCKED: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 2;
  }
}
