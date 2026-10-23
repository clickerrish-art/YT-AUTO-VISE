import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const APPROVED_SELAR_URL = "https://selar.com/0u19v8u99l";
const allowedTypes = new Set(["selar_digital_product", "safari_affiliate"]);
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
      if (campaign.ownerApproved !== true) errors.push("Selar campaign requires owner approval for " + campaign.id);
      if (campaign.status !== "ACTIVE_FOR_DRAFTS_ONLY") errors.push("approved Selar campaign status must be ACTIVE_FOR_DRAFTS_ONLY");
      if (typeof campaign.disclosureText !== "string" || !campaign.disclosureText.trim()) errors.push("Selar disclosure text is required for " + campaign.id);
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
  }
  const selar = config.campaigns.filter(c => c.type === "selar_digital_product");
  const safari = config.campaigns.filter(c => c.type === "safari_affiliate");
  if (selar.length !== 1) errors.push("exactly one approved Selar campaign is required");
  if (safari.length !== 1) errors.push("exactly one separate Safari campaign record is required");
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
      console.log("PASS: Selar and Safari campaign records are isolated; Selar destination is exact; Safari remains inactive without a verified URL; disclosure gates are present. This does not validate a live destination or authorize publishing.");
    }
  } catch (error) {
    console.error("FAIL: " + error.message);
    process.exitCode = 1;
  }
}
