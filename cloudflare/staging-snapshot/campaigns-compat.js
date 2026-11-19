export const APPROVED_SELAR_URL = "https://selar.com/0u19v8u99l";

export const DEFAULT_CAMPAIGNS = Object.freeze([
  Object.freeze({
    id: "selar-wildlife-vault",
    type: "selar_digital_product",
    name: "Complete YouTube Wildlife Creator's Vault – Premium Combo PDF",
    status: "ACTIVE_FOR_DRAFTS_ONLY",
    destinationUrl: APPROVED_SELAR_URL,
    destinationValidation: "exact_approved_allowlist",
    ownerApproved: true,
    disclosureRequired: true,
    disclosureText: "Promotional link: product details and current terms are available on the seller page."
  }),
  Object.freeze({
    id: "safari-affiliate-inactive",
    type: "safari_affiliate",
    name: "Safari affiliate campaign (not configured)",
    status: "INACTIVE",
    destinationUrl: "",
    destinationValidation: "not_verified",
    ownerApproved: false,
    disclosureRequired: true,
    disclosureText: ""
  })
]);

const allowedTypes = new Set(["selar_digital_product", "safari_affiliate"]);
const allowedStatuses = new Set(["ACTIVE_FOR_DRAFTS_ONLY", "INACTIVE"]);

export function validateCampaigns(config) {
  const errors = [];
  if (!config || typeof config !== "object" || !Array.isArray(config.campaigns)) return ["campaigns must be an array"];
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
      if (!["ACTIVE_FOR_DRAFTS_ONLY", "INACTIVE"].includes(campaign.status)) errors.push("Selar campaign must be active for drafts only or inactive");
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

function safeHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

/** Mutates a cloned campaign config only; callers persist it atomically and audit the action. */
export async function manageCampaign(config, request, actor, now = new Date().toISOString()) {
  if (!config || !Array.isArray(config.campaigns)) throw new Error("Campaign configuration is invalid");
  if (typeof actor !== "string" || actor.trim().length < 2) throw new Error("Authenticated operator identity is required");
  if (!request || typeof request !== "object" || Array.isArray(request)) throw new Error("Campaign action is required");
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
      campaign.pendingDestinationVersion = await sha256(campaign.pendingDestinationUrl + "\n" + campaign.pendingDisclosureText);
      return { config: campaigns, campaign, previewOnly: true };
    }
    if (campaign.type !== "safari_affiliate") throw new Error("Unsupported campaign type");
    const destinationUrl = safeHttps(String(request.destinationUrl ?? ""));
    if (!destinationUrl) throw new Error("Safari preview requires the exact HTTPS destination without embedded credentials");
    if (typeof request.disclosureText !== "string" || request.disclosureText.trim().length < 8) throw new Error("Safari affiliate disclosure is required");
    campaign.pendingDestinationUrl = destinationUrl;
    campaign.pendingDisclosureText = request.disclosureText.trim();
    campaign.pendingDestinationVersion = await sha256(destinationUrl + "\n" + campaign.pendingDisclosureText);
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
    const expectedPreviewVersion = await sha256(APPROVED_SELAR_URL + "\n" + submittedDisclosure);
    if (campaign.pendingDestinationUrl !== APPROVED_SELAR_URL ||
        campaign.pendingDisclosureText !== submittedDisclosure ||
        campaign.pendingDestinationVersion !== expectedPreviewVersion) {
      throw new Error("Preview the exact destination and disclosure before activation; the pending preview must match this request");
    }
    campaign.destinationUrl = APPROVED_SELAR_URL;
    campaign.destinationValidation = "exact_approved_allowlist";
    campaign.ownerApproved = true;
    campaign.disclosureText = submittedDisclosure;
    campaign.status = "ACTIVE_FOR_DRAFTS_ONLY";
    campaign.approval = { approvedBy: actor.trim(), approvedAt: now, destinationVersion: expectedPreviewVersion };
    delete campaign.pendingDestinationUrl;
    delete campaign.pendingDisclosureText;
    delete campaign.pendingDestinationVersion;
  } else if (campaign.type === "safari_affiliate") {
    throw new Error("Safari affiliate campaigns are disabled for this project and must remain INACTIVE");
  } else throw new Error("Unsupported campaign type");

  const errors = validateCampaigns(campaigns);
  if (errors.length) throw new Error("Campaign activation blocked: " + errors.join("; "));
  return { config: campaigns, campaign, previewOnly: false };
}
