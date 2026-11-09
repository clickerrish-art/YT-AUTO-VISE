import { isValidZonedIsoTimestamp } from "./schedule-policy.mjs";

const COMPENSATION_TYPES = new Set(["affiliate", "paid", "none", "direct_sales_revenue"]);
const OWNER_CONFIRMED_COMPENSATION_TYPES = new Set(["direct_sales_revenue"]);
const isValidOwnerConfirmationDate = value => {
  if (typeof value !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const validCompensationEvidenceDate = value =>
  isValidZonedIsoTimestamp(value) || isValidOwnerConfirmationDate(value);
const hasText = value => typeof value === "string" && value.trim().length > 0;

/**
 * An approved product URL is not permission to promote it.
 * Require current seller evidence, explicit SonicVhibez authorization,
 * a verified compensation relationship, and matching approved disclosure.
 */
export function validateProductPromotionGate(product, metadata, options = {}) {
  const requireMetadataDisclosure = options.requireMetadataDisclosure !== false;
  const errors = [];

  if (!product || typeof product !== "object" || Array.isArray(product)) return ["approved product record is missing"];
  if (product.status !== "approved") errors.push("product must remain approved in config/products.json");
  if (!hasText(product.url)) errors.push("exact approved product URL must be recorded");

  const gate = product.promotionGate;
  if (!gate || typeof gate !== "object" || Array.isArray(gate)) {
    errors.push("promotionGate evidence is missing from config/products.json");
    return errors;
  }

  const seller = gate.seller ?? {};
  if (seller.status !== "VERIFIED") errors.push("seller details must be reverified from the exact Selar listing");
  if (!hasText(seller.name)) errors.push("verified seller name must be recorded");
  if (seller.sourceUrl !== product.url) errors.push("seller evidence URL must match the exact approved product URL");
  if (!isValidZonedIsoTimestamp(seller.verifiedAt)) errors.push("seller verification needs a calendar-valid timezone-qualified timestamp");
  if (!hasText(seller.evidenceReference)) errors.push("seller verification needs a non-empty evidence reference");

  const authorization = gate.brandAuthorization ?? {};
  if (authorization.status !== "OWNER_CONFIRMED") errors.push("SonicVhibez brand authorization must be owner-confirmed");
  if (authorization.brand !== "SonicVhibez") errors.push("brand authorization must name exactly SonicVhibez");
  if (!isValidZonedIsoTimestamp(authorization.confirmedAt)) errors.push("brand authorization needs a calendar-valid timezone-qualified timestamp");
  if (!hasText(authorization.approvalReference)) errors.push("brand authorization needs a non-empty owner approval reference");

  const compensation = gate.compensation ?? {};
  const directSalesRevenue = compensation.type === "direct_sales_revenue";
  const acceptedCompensationStatuses = directSalesRevenue
    ? new Set(["OWNER_CONFIRMED", "VERIFIED"])
    : new Set(["VERIFIED"]);
  if (!acceptedCompensationStatuses.has(compensation.status)) {
    errors.push("commercial compensation relationship must be verified or owner-confirmed for direct sales revenue");
  }
  if (!COMPENSATION_TYPES.has(compensation.type)) errors.push("compensation type must be affiliate, paid, or none");
  if (!(directSalesRevenue && compensation.status === "OWNER_CONFIRMED"
    ? isValidOwnerConfirmationDate(compensation.verifiedAt)
    : isValidZonedIsoTimestamp(compensation.verifiedAt))) {
    errors.push("compensation verification needs a calendar-valid date; owner-confirmed direct sales may use YYYY-MM-DD");
  }
  if (!hasText(compensation.evidenceReference)) errors.push("compensation verification needs a non-empty evidence reference");

  const disclosure = gate.disclosure ?? {};
  if (disclosure.status !== "OWNER_APPROVED") errors.push("viewer-facing disclosure must be owner-approved");
  if (!hasText(disclosure.text)) errors.push("approved viewer-facing disclosure text must be recorded");
  if (!isValidZonedIsoTimestamp(disclosure.approvedAt)) errors.push("disclosure approval needs a calendar-valid timezone-qualified timestamp");
  if (!hasText(disclosure.approvalReference)) errors.push("disclosure approval needs a non-empty owner approval reference");

  if (metadata && typeof metadata === "object" && COMPENSATION_TYPES.has(compensation.type)) {
    const expectedPaidFlag = compensation.type !== "none";
    if (metadata.hasPaidPromotion !== expectedPaidFlag) {
      errors.push("hasPaidPromotion must match the verified affiliate/paid/none relationship");
    }
  }

  if (requireMetadataDisclosure) {
    const viewerDisclosure = metadata?.promotionDisclosure;
    if (viewerDisclosure?.status !== "APPROVED") errors.push("metadata promotionDisclosure must be APPROVED");
    if (viewerDisclosure?.type !== compensation.type) errors.push("metadata promotionDisclosure type must match the verified compensation type");
    if (viewerDisclosure?.text !== disclosure.text) errors.push("metadata promotionDisclosure text must exactly match the owner-approved disclosure");
    if (!hasText(metadata?.description) || !hasText(disclosure.text) || !metadata.description.includes(disclosure.text)) {
      errors.push("description must contain the exact owner-approved viewer-facing disclosure");
    }
  }
  return errors;
}
