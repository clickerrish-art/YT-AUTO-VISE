import fs from "node:fs";

const errors = [];
const metadataPath = process.argv[2] ?? "content/next-short.json";
const products = JSON.parse(fs.readFileSync("config/products.json", "utf8")).products;

if (!fs.existsSync(metadataPath)) {
  console.error(`BLOCKED: metadata file not found: ${metadataPath}`);
  process.exit(2);
}

const item = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
const configuredChannelId = process.env.SONICVHIBEZ_CHANNEL_ID;
const approvedUrls = new Set(products.filter(p => p.status === "approved").map(p => p.url));

if (!configuredChannelId || !configuredChannelId.trim()) {
  errors.push("SONICVHIBEZ_CHANNEL_ID must be configured with the verified SonicVhibez channel ID");
}
if (item.channel !== "SonicVhibez") errors.push("channel must be exactly SonicVhibez");
if (item.status !== "READY_FOR_PRIVATE_UPLOAD") errors.push("status must be READY_FOR_PRIVATE_UPLOAD after a human has completed all reviews");
if (item.targetSeconds !== 55) errors.push("targetSeconds must be exactly 55 for this Shorts workflow");
if (!item.channelId || item.channelId !== configuredChannelId) errors.push("channelId must be present and match the configured SonicVhibez channel ID");
if (!/^UC[a-zA-Z0-9_-]{22}$/.test(item.channelId ?? "")) errors.push("channelId must have the standard YouTube channel ID format");
if (!item.title || item.title.length > 100) errors.push("title is required and must be at most 100 characters");
if (!item.description || item.description.length < 20) errors.push("description is required (minimum 20 characters)");
if (item.description && !item.description.includes(item.productUrl ?? "")) errors.push("description must include the approved product URL");
if (!Array.isArray(item.tags) || item.tags.length < 3 || item.tags.some(t => typeof t !== "string" || !t.trim())) errors.push("provide at least three non-empty tags");
if (!item.productUrl || !approvedUrls.has(item.productUrl)) errors.push("productUrl must exactly match an approved URL in config/products.json");
if (item.madeForKids !== false) errors.push("madeForKids must be explicitly false for this promotional workflow");
if (item.visibility !== "private") errors.push("new content must begin as private; public publishing is not authorized by this checker");
if (item.rightsConfirmed !== true) errors.push("rightsConfirmed must be true before media can proceed");
if (item.complianceReviewed !== true) errors.push("complianceReviewed must be true before media can proceed");
if (item.hasPaidPromotion !== true) errors.push("hasPaidPromotion must be true and the promotion relationship disclosed");
if (item.description && !/paid promotion|affiliate|may receive compensation/i.test(item.description)) errors.push("description must clearly disclose the promotional or affiliate relationship");
if (item.containsSyntheticMedia !== true) errors.push("containsSyntheticMedia must be true for the planned realistic AI-generated wildlife visuals");
if (item.description && !/AI DISCLOSURE|AI-generated|synthetic/i.test(item.description)) errors.push("description must include an accurate AI/synthetic-media disclosure");

if (errors.length) {
  console.error("BLOCKED — content did not pass safety checks:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("PASS — metadata checks passed. This does not upload, schedule, or publish a video.");
