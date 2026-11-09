import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const APPROVED_SELAR_URL = "https://selar.com/0u19v8u99l";
export const SELAR_DIRECT_SALES_DISCLOSURE = "This product is sold through my own Selar business; purchases generate revenue for my business.";
const allowedTypes = new Set(["selar_digital_product", "safari_affiliate", "affiliate"]);
const allowedStatuses = new Set(["ACTIVE_FOR_DRAFTS_ONLY", "INACTIVE"]);

export function validateCampaigns(config) {
  const errors = [];
  if (!config || typeof config !== "object" || !Array.isArray(config.campaigns)) {
    return ["campaigns must be an array"];
  }
  const ids = new Set();
  for (const campaign of config.campaigns) {
    if (!campaign || typeof campaign !== "object") { errors.push("each campaign must be an object"); continue; }
    if (typeof campaign.id !== "string" || !/^[a-z0-9][a-z0-9-]{2,79}$/.test(campaign.id)) errors.push("campaign IDs must be unique safe lowercase identifiers");
    if (ids.has(campaign.id)) errors.push("duplicate campaign ID: " + campaign.id);
    ids.add(campaign.id);
    if (!allowedTypes.has(campaign.type)) errors.push("unsupported campaign type for " + campaign.id);
    if (!allowedStatuses.has(campaign.status)) errors.push("unsupported campaign status for " + campaign.id);
    if (campaign.disclosureRequired !== true) errors.push("disclosure must be required for " + campaign.id);
    if (campaign.type === "selar_digital_product") {
      if (campaign.destinationUrl !== APPROVED_SELAR_URL) errors.push("Selar destination must exactly match the approved URL for " + campaign.id);
      if (campaign.destinationValidation !== "exact_approved_allowlist") errors.push("Selar destination must use the exact approved allowlist for " + campaign.id);
      if (campaign.compensationType !== "direct_sales_revenue") errors.push("Selar campaign must be classified as direct sales revenue for " + campaign.id);
      if (campaign.ownerApproved !== true) errors.push("Selar campaign requires owner approval for " + campaign.id);
      if (!["ACTIVE_FOR_DRAFTS_ONLY", "INACTIVE"].includes(campaign.status)) errors.push("Selar campaign must be active for drafts only or inactive");
      if (campaign.disclosureText !== SELAR_DIRECT_SALES_DISCLOSURE) errors.push("Selar disclosure must accurately identify the owner direct-sales relationship for " + campaign.id);
      if (!["PENDING_OWNER_APPROVAL", "OWNER_APPROVED"].includes(campaign.disclosureApprovalStatus)) {
        errors.push("Selar viewer-facing disclosure approval status must be explicit for " + campaign.id);
      }
      if (campaign.disclosureApprovalStatus === "OWNER_APPROVED") {
        const expectedVersion = crypto.createHash("sha256")
          .update(campaign.destinationUrl + "\n" + String(campaign.disclosureText ?? "").trim())
          .digest("hex");
        if (!campaign.approval || typeof campaign.approval.approvedBy !== "string" ||
            campaign.approval.approvedBy.trim().length < 2 ||
            !Number.isFinite(Date.parse(campaign.approval.approvedAt)) ||
            campaign.approval.destinationVersion !== expectedVersion) {
          errors.push("owner-approved Selar disclosure requires timestamped approval bound to the exact destination and wording for " + campaign.id);
        }
      } else if (campaign.approval) {
        errors.push("pending Selar disclosure must not carry an approval record for " + campaign.id);
      }
    }
    if (campaign.type === "safari_affiliate") {
      if (campaign.status === "INACTIVE") {
        if (campaign.destinationUrl !== "" || campaign.ownerApproved !== false || campaign.destinationValidation !== "not_verified") errors.push("inactive Safari campaign must have no destination and no approval claim");
      } else {
        let url;
        try { url = new URL(campaign.destinationUrl); } catch {}
        if (!url || url.protocol !== "https:") errors.push("active Safari campaign requires an exact verified HTTPS destination");
        if (campaign.ownerApproved !== true || campaign.destinationValidation !== "owner_verified") errors.push("active Safari campaign requires owner approval and verified destination");
        if (typeof campaign.disclosureText !== "string" || !campaign.disclosureText.trim()) errors.push("active Safari campaign requires approved affiliate disclosure text");
      }
    }
    if (campaign.type === "affiliate") {
      if (campaign.status === "INACTIVE") {
        if (campaign.destinationUrl !== "" || campaign.ownerApproved !== false || campaign.destinationValidation !== "not_verified" || campaign.disclosureText !== "") {
          errors.push("inactive affiliate campaign must have no destination, approval claim, or disclosure");
        }
      } else {
        let url;
        try { url = new URL(campaign.destinationUrl); } catch {}
        if (!url || url.protocol !== "https:" || url.username || url.password) errors.push("active affiliate campaign requires an exact HTTPS destination without embedded credentials");
        if (url && (url.hostname === "selar.com" || url.hostname.endsWith(".selar.com"))) errors.push("Selar destinations must use the dedicated direct-sales campaign, not an affiliate campaign");
        if (campaign.ownerApproved !== true || campaign.destinationValidation !== "owner_confirmed_exact_https") errors.push("active affiliate campaign requires explicit owner approval of the exact HTTPS destination");
        if (campaign.compensationType !== "affiliate") errors.push("external affiliate campaign must be classified as affiliate compensation");
        if (typeof campaign.disclosureText !== "string" || campaign.disclosureText.trim().length < 8) errors.push("active affiliate campaign requires an approved viewer-facing affiliate disclosure");
        const expectedDestinationVersion = crypto.createHash("sha256")
          .update(campaign.destinationUrl + "\n" + String(campaign.disclosureText ?? "").trim())
          .digest("hex");
        if (!campaign.approval || typeof campaign.approval.approvedBy !== "string" || campaign.approval.approvedBy.trim().length < 2 ||
            !Number.isFinite(Date.parse(campaign.approval.approvedAt)) ||
            campaign.approval.destinationVersion !== expectedDestinationVersion) {
          errors.push("active affiliate campaign requires a timestamped approval bound to the exact destination and disclosure");
        }
      }
    }
  }
  const selar = config.campaigns.filter(c => c.type === "selar_digital_product");
  const safari = config.campaigns.filter(c => c.type === "safari_affiliate");
  const affiliate = config.campaigns.filter(c => c.type === "affiliate");
  if (selar.length !== 1) errors.push("exactly one approved Selar campaign is required");
  if (safari.length !== 1) errors.push("exactly one separate Safari campaign record is required");
  if (affiliate.length < 1) errors.push("at least one separate external affiliate campaign record is required");
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const file = path.resolve(process.cwd(), "config/campaigns.json");
  try {
    const config = JSON.parse(fs.readFileSync(file, "utf8"));
    const errors = validateCampaigns(config);
    if (errors.length) {
      for (const error of errors) console.error("FAIL: " + error);
      process.exitCode = 1;
    } else {
      console.log("PASS: Selar and Safari campaign records are isolated; the external affiliate campaign is separate; Selar destination is exact; Safari remains inactive; affiliate activation requires an exact owner-approved HTTPS destination and disclosure. This does not validate a live destination or authorize publishing.");
    }
  } catch (error) {
    console.error("FAIL: " + error.message);
    process.exitCode = 1;
  }
}
