import fs from "node:fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/check-captions.mjs <file.srt> [...]");
  process.exit(2);
}

let failed = false;
for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`BLOCKED: subtitle file not found: ${file}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();
  const blocks = text.split(/\n\s*\n/);
  let previousEnd = 0;
  let fileErrors = [];
  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split("\n");
    if (lines.length < 3 || Number(lines[0]) !== i + 1) {
      fileErrors.push(`block ${i + 1}: invalid sequence or missing caption text`);
      continue;
    }
    const match = lines[1].match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
    if (!match) {
      fileErrors.push(`block ${i + 1}: invalid timestamp format`);
      continue;
    }
    const nums = match.slice(1).map(Number);
    const toMs = (h, m, s, ms) => (((h * 60 + m) * 60 + s) * 1000 + ms);
    const start = toMs(...nums.slice(0, 4));
    const end = toMs(...nums.slice(4, 8));
    if (end <= start) fileErrors.push(`block ${i + 1}: end must follow start`);
    if (start < previousEnd) fileErrors.push(`block ${i + 1}: captions overlap or are out of order`);
    if (!lines.slice(2).join(" ").trim()) fileErrors.push(`block ${i + 1}: caption text is empty`);
    previousEnd = end;
  }
  if (fileErrors.length) {
    failed = true;
    console.error(`BLOCKED: ${file}`);
    fileErrors.forEach(e => console.error(`- ${e}`));
  } else {
    console.log(`PASS: ${file} has ${blocks.length} sequential, non-overlapping caption blocks.`);
  }
}
if (failed) process.exit(1);
