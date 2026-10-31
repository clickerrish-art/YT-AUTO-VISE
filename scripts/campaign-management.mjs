import crypto from "node:crypto";
import { APPROVED_SELAR_URL, validateCampaigns } from "./validate-campaigns.mjs";

function safeHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}

/** Mutates a cloned campaign config only; callers persist it atomically and audit the action. */
export function manageCampaign(config, request, actor, now = new Date().toISOString()) {
  if (!config || !Array.isArray(config.campaigns)) throw new Error("Campaign configuration is invalid");
  if (typeof actor !== "string" || actor.trim().length < 2) throw new Error("Authenticated operator identity is required");
  if (!request || typeof request !== "object") throw new Error("Campaign action is required");
  const campaigns = structuredClone(config);
  const index = campaigns.campaigns.findIndex(c => c.id === request.campaignId);
  if (index < 0) throw new Error("Campaign record not found");
  const campaign = campaigns.campaigns[index];
  const action = request.action;
  if (!["preview", "activate", "deactivate"].includes(action)) throw new Error("Unsupported campaign action");

  if (action === "preview") {
    if (campaign.type === "selar_digital_product") {
      if (request.destinationUrl !== APPROVED_SELAR_URL) throw new Error("Selar destination must exactly match the approved URL");
      if (typeof request.disclosureText !== "string" || !request.disclosureText.trim()) throw new Error("Promotional disclosure is required");
      campaign.pendingDestinationUrl = APPROVED_SELAR_URL;
      campaign.pendingDisclosureText = request.disclosureText.trim();
      campaign.pendingDestinationVersion = crypto.createHash("sha256")
        .update(campaign.pendingDestinationUrl + "\n" + campaign.pendingDisclosureText)
        .digest("hex");
      return { config: campaigns, campaign, previewOnly: true };
    }
    if (campaign.type !== "safari_affiliate") throw new Error("Unsupported campaign type");
    const destinationUrl = safeHttps(String(request.destinationUrl ?? ""));
    if (!destinationUrl) throw new Error("Safari preview requires the exact HTTPS destination without embedded credentials");
    if (typeof request.disclosureText !== "string" || request.disclosureText.trim().length < 8) throw new Error("Safari affiliate disclosure is required");
    campaign.pendingDestinationUrl = destinationUrl;
    campaign.pendingDisclosureText = request.disclosureText.trim();
    campaign.pendingDestinationVersion = crypto.createHash("sha256").update(destinationUrl + "\n" + campaign.pendingDisclosureText).digest("hex");
    return { config: campaigns, campaign, previewOnly: true };
  }

  if (action === "deactivate") {
    campaign.status = "INACTIVE";
    if (campaign.type === "safari_affiliate") {
      campaign.destinationUrl = "";
      campaign.destinationValidation = "not_verified";
      campaign.ownerApproved = false;
      campaign.disclosureText = "";
      delete campaign.pendingDestinationUrl;
      delete campaign.pendingDisclosureText;
      delete campaign.pendingDestinationVersion;
      delete campaign.approval;
    }
    const errors = validateCampaigns(campaigns);
    if (errors.length) throw new Error("Campaign deactivation blocked: " + errors.join("; "));
    delete campaign.pendingDestinationUrl;
    delete campaign.pendingDisclosureText;
    delete campaign.pendingDestinationVersion;
    return { config: campaigns, campaign, previewOnly: false };
  }

  if (campaign.type === "selar_digital_product") {
    if (request.destinationUrl !== APPROVED_SELAR_URL) throw new Error("Selar destination must exactly match the approved URL");
    if (typeof request.disclosureText !== "string" || !request.disclosureText.trim()) throw new Error("Promotional disclosure is required");
    if (request.confirmOwnerApproval !== true) throw new Error("Explicit owner approval of the exact preview is required before activation");
    const submittedDisclosure = request.disclosureText.trim();
    const expectedPreviewVersion = crypto.createHash("sha256")
      .update(APPROVED_SELAR_URL + "\n" + submittedDisclosure)
      .digest("hex");
    if (campaign.pendingDestinationUrl !== APPROVED_SELAR_URL ||
        campaign.pendingDisclosureText !== submittedDisclosure ||
        campaign.pendingDestinationVersion !== expectedPreviewVersion) {
      throw new Error("Preview the exact destination and disclosure before activation; the pending preview must match this request");
    }
    campaign.destinationUrl = APPROVED_SELAR_URL;
    campaign.destinationValidation = "exact_approved_allowlist";
    campaign.ownerApproved = true;
    campaign.disclosureText = request.disclosureText.trim();
    campaign.status = "ACTIVE_FOR_DRAFTS_ONLY";
    campaign.approval = { approvedBy: actor.trim(), approvedAt: now, destinationVersion: expectedPreviewVersion };
    delete campaign.pendingDestinationUrl;
    delete campaign.pendingDisclosureText;
    delete campaign.pendingDestinationVersion;
  } else if (campaign.type === "safari_affiliate") {
    // This project explicitly keeps Safari campaigns inactive. A preview and a generic
    // owner-confirmation flag are not sufficient to override that repository-level policy.
    throw new Error("Safari affiliate campaigns are disabled for this project and must remain INACTIVE");
  } else throw new Error("Unsupported campaign type");

  const errors = validateCampaigns(campaigns);
  if (errors.length) throw new Error("Campaign activation blocked: " + errors.join("; "));
  return { config: campaigns, campaign, previewOnly: false };
}
