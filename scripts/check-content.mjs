import fs from "node:fs";

const errors = [];
const metadataPath = process.argv[2] ?? "content/next-short.json";
const products = JSON.parse(fs.readFileSync("config/products.json", "utf8")).products;

if (!fs.existsSync(metadataPath)) {
  console.error(`BLOCKED: metadata file not found: ${metadataPath}`);
  process.exit(2);
}

const item = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
const approvedUrls = new Set(products.filter(p => p.status === "approved").map(p => p.url));

if (item.channel !== "SonicVhibez") errors.push("channel must be exactly SonicVhibez");
if (item.channelId !== process.env.SONICVHIBEZ_CHANNEL_ID) errors.push("channelId must match the configured SonicVhibez channel ID");
if (!item.title || item.title.length > 100) errors.push("title is required and must be at most 100 characters");
if (!item.description || item.description.length < 20) errors.push("description is required (minimum 20 characters)");
if (!Array.isArray(item.tags) || item.tags.length < 3 || item.tags.some(t => typeof t !== "string" || !t.trim())) errors.push("provide at least three non-empty tags");
if (!item.productUrl || !approvedUrls.has(item.productUrl)) errors.push("productUrl must exactly match an approved URL in config/products.json");
if (item.madeForKids !== false) errors.push("madeForKids must be explicitly false for this promotional workflow");
if (item.visibility !== "private") errors.push("new content must begin as private; public publishing is not authorized by this checker");
if (item.rightsConfirmed !== true) errors.push("rightsConfirmed must be true before media can proceed");
if (item.complianceReviewed !== true) errors.push("complianceReviewed must be true before media can proceed");

if (errors.length) {
  console.error("BLOCKED — content did not pass safety checks:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("PASS — metadata checks passed. This does not upload, schedule, or publish a video.");
