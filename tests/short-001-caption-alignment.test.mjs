import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const disclosure = "This product is sold through my own Selar business; purchases generate revenue for my business.";
const normalize = value => value.trim().replace(/\s+/g, " ");

function toMilliseconds(value) {
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  assert.ok(match, "SRT timestamp must be valid");
  return (((Number(match[1]) * 60 + Number(match[2])) * 60 + Number(match[3])) * 1000) + Number(match[4]);
}

test("Short 001 captions exactly match narration and include the approved direct-sales disclosure", () => {
  const master = fs.readFileSync("content/narration-master-short-001-and-002.md", "utf8");
  const read = master.match(/\*\*Read:\*\*\s*([\s\S]*?)(?=\n\s*\*\*Performance notes:\*\*|\n## |$)/);
  assert.ok(read, "Short 001 Read block must exist");
  const narration = normalize(read[1]);

  const srt = fs.readFileSync("content/short-001-wildlife-video-storytelling.srt", "utf8");
  const blocks = srt.trim().split(/\r?\n\r?\n/);
  const cues = [];
  let previousEnd = 0;

  for (let index = 0; index < blocks.length; index += 1) {
    const lines = blocks[index].split(/\r?\n/);
    assert.ok(lines.length >= 3, "each SRT cue needs an index, time range and text");
    assert.equal(lines[0], String(index + 1), "SRT cue numbering must be sequential");
    const times = lines[1].split(" --> ");
    assert.equal(times.length, 2, "each SRT cue needs one time range");
    const start = toMilliseconds(times[0]);
    const end = toMilliseconds(times[1]);
    assert.ok(end > start, "each SRT cue must have positive duration");
    assert.equal(start, previousEnd, "SRT cues must be contiguous without gaps or overlaps");
    previousEnd = end;
    cues.push(lines.slice(2).join(" "));
  }

  assert.equal(previousEnd, 60_000, "the reviewed draft target is 60 seconds");
  assert.ok(cues.includes("Advertisement."), "the spoken commercial segment must carry a clear Advertisement identifier");
  assert.equal(normalize(cues.join(" ")), narration, "captions must match every spoken word exactly");
  assert.ok(cues.includes(disclosure), "the exact owner-approved disclosure must be a complete readable caption cue");
});

test("Short 001 metadata preserves private-only and policy disclosure safeguards", () => {
  const metadata = JSON.parse(fs.readFileSync("content/next-short.json", "utf8"));
  assert.equal(metadata.channel, "SonicVhibez");
  assert.equal(metadata.contentType, "short");
  assert.equal(metadata.targetSeconds, 60);
  assert.equal(metadata.visibility, "private");
  assert.equal(metadata.hasPaidPromotion, true);
  assert.equal(metadata.containsSyntheticMedia, true);
  assert.equal(metadata.promotionDisclosure.status, "APPROVED");
  assert.equal(metadata.promotionDisclosure.type, "direct_sales_revenue");
  assert.equal(metadata.promotionDisclosure.text, disclosure);
  assert.equal(metadata.rightsConfirmed, false);
  assert.equal(metadata.complianceReviewed, false);
  assert.equal(metadata.status, "HOLD_FOR_MEDIA_AND_HUMAN_REVIEW");
  assert.match(metadata.description, /ADVERTISEMENT.*OWNER-APPROVED DIRECT-SALES DISCLOSURE/);
});
