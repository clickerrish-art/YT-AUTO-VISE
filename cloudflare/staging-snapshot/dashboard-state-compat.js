import { DEFAULT_WEEKLY_PLAN } from "./weekly-plan-compat.js";
import { DEFAULT_CAMPAIGNS, validateCampaigns } from "./campaigns-compat.js";

const REQUIRED_ARRAYS = ["queueItems", "audit", "jobs", "uploads"];
const OPTIONAL_ARRAYS = ["campaigns", "facebookDrafts", "facebookPosts", "facebookAttempts"];

/**
 * Normalize the v1 on-disk dashboard state shape for the durable repository.
 * Unknown top-level properties are intentionally retained: old dashboard versions
 * may have fields this adapter does not yet understand.
 */
export function normalizeDashboardState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("State must be a JSON object");
  }
  if (value.version !== 1) throw new Error("Unsupported dashboard state version");
  const normalized = { ...value };
  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(normalized[key])) throw new Error("Invalid state schema: " + key);
  }
  for (const key of OPTIONAL_ARRAYS) {
    if (normalized[key] === undefined) normalized[key] = [];
    else if (!Array.isArray(normalized[key])) throw new Error("Invalid state schema: " + key);
  }
  if (normalized.publishingEnabled === true ||
      normalized.publicPublishingEnabled === true ||
      normalized.unattendedPublishingEnabled === true) {
    throw new Error("Publishing must remain disabled in the Cloudflare state service");
  }
  for (const campaign of normalized.campaigns) {
    if (campaign?.type === "safari_affiliate" &&
        (campaign.status !== "INACTIVE" ||
         campaign.destinationUrl !== "" ||
         campaign.ownerApproved !== false ||
         campaign.destinationValidation !== "not_verified" ||
         campaign.disclosureText !== "" ||
         ["pendingDestinationUrl", "pendingDisclosureText", "pendingDestinationVersion", "approval"]
           .some(key => Object.hasOwn(campaign, key)))) {
      throw new Error("Safari affiliate campaigns must remain fully inactive and unapproved");
    }
  }
  normalized.publishingEnabled = false;
  return normalized;
}

/**
 * Preserve the existing browser's /api/state contract using authoritative repository
 * configuration and persisted D1 state. Filesystem-only upload-ledger data remains
 * explicitly unavailable; no remote history or readiness is inferred.
 */
export function toDashboardStateResponse(state, { revision, updatedAt }) {
  const normalized = normalizeDashboardState(state);
  const campaigns = normalized.campaigns.length ? normalized.campaigns : structuredClone(DEFAULT_CAMPAIGNS);
  const campaignErrors = validateCampaigns({ version: 1, campaigns });
  const blockers = [
    ...campaignErrors.map(error => "Campaign configuration: " + error),
    "The filesystem-backed upload ledger is not available in the durable-state adapter.",
    "This is a durable-state compatibility response, not a production-readiness result.",
    "Live publishing remains disabled; verify complete SonicVhibez YouTube history and all production gates in the repository runner."
  ];
  return {
    publishingEnabled: false,
    schedule: DEFAULT_WEEKLY_PLAN,
    campaigns,
    campaignValidation: { ok: campaignErrors.length === 0, errors: campaignErrors },
    queueItems: normalized.queueItems,
    jobs: normalized.jobs.slice(-30).reverse(),
    uploads: normalized.uploads.slice(-30).reverse(),
    uploadLedger: null,
    audit: normalized.audit.slice(-50).reverse(),
    blockers,
    revision,
    updatedAt,
    state: normalized
  };
}
