#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SHA256 = /^[a-f0-9]{64}$/;
const ZONED_ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/;

function validTimestamp(value) {
  if (typeof value !== "string") return false;
  const match = ZONED_ISO.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText);
  const offsetHour = Number(offsetHourText ?? 0), offsetMinute = Number(offsetMinuteText ?? 0);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth ||
      hour > 23 || minute > 59 || second > 59 ||
      offsetHour > 23 || offsetMinute > 59) return false;
  return Number.isFinite(Date.parse(value));
}

function validHttpsUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateMediaRegister(register, { now = Date.now() } = {}) {
  const errors = [];
  if (!register || typeof register !== "object" || Array.isArray(register)) return ["register must be a JSON object"];
  if (register.schemaVersion !== "1.0.0") errors.push("schemaVersion must be 1.0.0");
  if (register.registerId !== "nature-frontiers-media") errors.push("registerId must be nature-frontiers-media");
  if (register.brand !== "Nature Frontiers") errors.push("brand must be Nature Frontiers");
  if (register.timezone !== "Africa/Johannesburg") errors.push("timezone must be Africa/Johannesburg");
  if (!register.policy || register.policy.defaultPublicationState !== "held") errors.push("default publication state must remain held");
  if (register.policy?.requireHumanApproval !== true) errors.push("human approval must be required");
  if (register.policy?.allowAutomaticPublication !== false) errors.push("automatic publication must remain disabled");
  if (register.policy?.sourceOfTruth !== "versioned-local-json") errors.push("source of truth must be versioned local JSON");
  if (!Array.isArray(register.assets)) return [...errors, "assets must be an array"];

  const ids = new Set();
  for (const [index, asset] of register.assets.entries()) {
    const at = `assets[${index}]`;
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) { errors.push(at + " must be an object"); continue; }
    if (typeof asset.id !== "string" || !/^[a-z0-9][a-z0-9-]{2,79}$/.test(asset.id)) errors.push(at + " has an invalid stable ID");
    if (ids.has(asset.id)) errors.push("duplicate asset ID: " + asset.id);
    ids.add(asset.id);
    if (!["video", "image", "audio"].includes(asset.mediaType)) errors.push(at + " has an unsupported mediaType");
    if (!asset.source || typeof asset.source.provider !== "string" || !asset.source.provider.trim()) errors.push(at + " requires a provider-neutral source record");
    if (!validHttpsUrl(asset.source?.url)) errors.push(at + " source URL must be HTTPS without embedded credentials");
    if (!["unverified", "verified", "unavailable", "rejected"].includes(asset.source?.listingStatus)) errors.push(at + " has an invalid listingStatus");
    if (!Array.isArray(asset.source?.listingEvidence)) errors.push(at + " listingEvidence must be an array");
    for (const url of Array.isArray(asset.source?.listingEvidence) ? asset.source.listingEvidence : []) {
      if (!validHttpsUrl(url)) errors.push(at + " listing evidence URLs must be HTTPS");
    }

    if (asset.localFile !== null && asset.localFile !== undefined) {
      if (typeof asset.localFile.path !== "string" || !asset.localFile.path.trim()) errors.push(at + " localFile.path must be a non-empty relative path");
      if (path.isAbsolute(asset.localFile.path ?? "") || (asset.localFile.path ?? "").split(/[\\/]/).includes("..")) errors.push(at + " localFile.path must not escape the project");
      if (!SHA256.test(asset.localFile.sha256 ?? "")) errors.push(at + " localFile.sha256 must be a lowercase SHA-256 digest");
      if (asset.media?.sha256 && asset.media.sha256 !== asset.localFile.sha256) errors.push(at + " media SHA-256 must match localFile SHA-256");
    }

    const rights = asset.rights ?? {};
    if (!["not_assessed", "in_progress", "cleared", "rejected"].includes(rights.reviewStatus)) errors.push(at + " has an invalid rights.reviewStatus");
    if (!["not_assessed", "not_required", "required", "obtained", "rejected"].includes(rights.additionalPermissionsStatus)) errors.push(at + " has an invalid additionalPermissionsStatus");
    if (!Array.isArray(rights.licenseEvidence)) errors.push(at + " rights.licenseEvidence must be an array");
    for (const evidence of Array.isArray(rights.licenseEvidence) ? rights.licenseEvidence : []) {
      if (!validHttpsUrl(evidence)) errors.push(at + " rights licence evidence URLs must be HTTPS");
    }
    if (rights.reviewStatus === "cleared") {
      if (!Array.isArray(rights.licenseEvidence) || rights.licenseEvidence.length === 0) errors.push(at + " cleared rights require licence evidence");
      if (typeof rights.reviewedBy !== "string" || !rights.reviewedBy.trim()) errors.push(at + " cleared rights require reviewedBy");
      if (!validTimestamp(rights.reviewedAt) || Date.parse(rights.reviewedAt) > now) errors.push(at + " cleared rights require a valid non-future timezone-qualified reviewedAt");
      if (!["not_required", "obtained"].includes(rights.additionalPermissionsStatus)) errors.push(at + " cleared rights require explicit resolution of additional permissions");
    }

    const inspection = asset.inspection ?? {};
    if (!["not_inspected", "partial", "complete"].includes(inspection.status)) errors.push(at + " has an invalid inspection.status");
    if (inspection.status === "complete") {
      if (typeof inspection.inspectedBy !== "string" || !inspection.inspectedBy.trim()) errors.push(at + " complete inspection requires inspectedBy");
      if (!validTimestamp(inspection.inspectedAt) || Date.parse(inspection.inspectedAt) > now) errors.push(at + " complete inspection requires a valid non-future timezone-qualified inspectedAt");
      if (typeof inspection.visualNotes !== "string" || inspection.visualNotes.trim().length < 20) errors.push(at + " complete inspection requires meaningful visualNotes");
      if (!asset.localFile || inspection.inspectedFileSha256 !== asset.localFile.sha256) errors.push(at + " complete inspection file SHA-256 must match the currently registered local file");
    }

    const claims = asset.claims ?? [];
    if (!Array.isArray(claims)) errors.push(at + " claims must be an array");
    const claimRecords = Array.isArray(claims) ? claims : [];
    for (const claim of claimRecords) {
      if (!claim || typeof claim !== "object" || Array.isArray(claim) ||
          typeof claim.type !== "string" || typeof claim.value !== "string" ||
          !["listing_only", "unverified", "verified", "not_used"].includes(claim.status)) {
        errors.push(at + " contains an invalid factual claim record");
        continue;
      }
      if (claim.status === "verified" &&
          (!Array.isArray(claim.evidenceUrls) || claim.evidenceUrls.length === 0 ||
           claim.evidenceUrls.some(url => !validHttpsUrl(url)))) {
        errors.push(at + " verified factual claims require one or more HTTPS evidenceUrls");
      }
    }

    const approval = asset.approval ?? {};
    if (!["pending", "approved", "rejected", "revoked"].includes(approval.status)) errors.push(at + " has an invalid approval.status");
    if (approval.status === "approved") {
      if (claimRecords.some(claim => !["verified", "not_used"].includes(claim?.status))) errors.push(at + " cannot be approved while factual claims remain listing-only or unverified");
      if (rights.reviewStatus !== "cleared") errors.push(at + " cannot be approved until rights are cleared");
      if (inspection.status !== "complete") errors.push(at + " cannot be approved until full visual inspection is complete");
      if (!asset.localFile || !SHA256.test(asset.localFile.sha256 ?? "")) errors.push(at + " approval must bind to an exact local file SHA-256");
      if (approval.approvedFileSha256 !== asset.localFile?.sha256) errors.push(at + " approval file hash must match the registered local file");
      if (typeof approval.approvedBy !== "string" || !approval.approvedBy.trim()) errors.push(at + " approved status requires approvedBy");
      if (!validTimestamp(approval.approvedAt) || Date.parse(approval.approvedAt) > now) errors.push(at + " approved status requires a valid non-future timezone-qualified approvedAt");
      if (!Array.isArray(approval.approvedUsage) || approval.approvedUsage.length === 0) errors.push(at + " approval must state its permitted usage scope");
    }
    if (typeof asset.usage?.scheduled !== "boolean" || typeof asset.usage?.published !== "boolean" || !Array.isArray(asset.usage?.platformPostIds)) errors.push(at + " requires explicit usage booleans and platformPostIds");
    if (asset.usage?.scheduled === true || asset.usage?.published === true) {
      if (approval.status !== "approved") errors.push(at + " cannot be scheduled or published without exact-asset human approval");
    }
    if (Array.isArray(asset.usage?.platformPostIds) &&
        asset.usage.platformPostIds.some(id => typeof id !== "string" || !id.trim())) {
      errors.push(at + " platformPostIds entries must be non-empty strings");
    }
    if (asset.usage?.published === true && (!Array.isArray(asset.usage.platformPostIds) || asset.usage.platformPostIds.length === 0)) {
      errors.push(at + " published usage requires a remote platform post ID receipt");
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const file = path.resolve(process.cwd(), process.argv[2] ?? "content/nature-frontiers-media-register.json");
  try {
    const register = JSON.parse(fs.readFileSync(file, "utf8"));
    const errors = validateMediaRegister(register);
    if (errors.length) {
      for (const error of errors) console.error("FAIL: " + error);
      process.exitCode = 1;
    } else {
      console.log(`PASS: API-independent Nature Frontiers media register is structurally valid (${register.assets.length} assets). No asset is cleared by structural validation alone.`);
    }
  } catch (error) {
    console.error("FAIL: " + error.message);
    process.exitCode = 1;
  }
}
