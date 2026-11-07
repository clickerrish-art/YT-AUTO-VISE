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
 * Keep the existing browser's /api/state response contract while also exposing
 * the revision envelope used by new clients. No synthetic schedule, upload ledger,
 * campaign validation, or provider verification is invented here.
 */
export function toDashboardStateResponse(state, { revision, updatedAt }) {
  const normalized = normalizeDashboardState(state);
  return {
    publishingEnabled: false,
    schedule: null,
    campaigns: normalized.campaigns,
    campaignValidation: { ok: false, errors: ["Campaign validation requires the authoritative repository configuration; unavailable in the state service."] },
    queueItems: normalized.queueItems,
    jobs: normalized.jobs.slice(-30).reverse(),
    uploads: normalized.uploads.slice(-30).reverse(),
    uploadLedger: null,
    audit: normalized.audit.slice(-50).reverse(),
    blockers: [
      "This is a durable-state compatibility response, not a production-readiness result.",
      "Live publishing remains disabled; verify complete SonicVhibez YouTube history and all production gates in the repository runner."
    ],
    revision,
    updatedAt,
    state: normalized
  };
}
