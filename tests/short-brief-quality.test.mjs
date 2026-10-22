import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const briefs = [
  "content/short-001-wildlife-video-storytelling.md",
  "content/short-002-plan-wildlife-documentary.md"
];
const approvedUrl = "https://selar.com/0u19v8u99l";

function narrationFrom(markdown) {
  const heading = markdown.match(/^## Narration draft[^\n]*\n([\s\S]*?)(?=^## )/m);
  assert.ok(heading, "narration draft section must exist");
  return heading[1].replace(/^\s*|\s*$/g, "").replace(/[“”"]/g, "");
}

test("each Shorts brief has usable metadata, approved CTA, and rights safeguards", () => {
  for (const file of briefs) {
    const markdown = fs.readFileSync(file, "utf8");
    assert.match(markdown, /^\*\*Status:\*\* SCRIPT DRAFT/m, file + " must not imply a finished video");
    assert.match(markdown, /^## YouTube title\n\S/m, file + " needs a title");
    assert.ok(markdown.includes(approvedUrl), file + " must use the only approved product URL");
    assert.match(markdown, /only music you have permission to use|music and sound effects only when you have the rights|clips\/music element is owned, licensed, or otherwise cleared/i, file + " must retain rights guidance");
    assert.match(markdown, /never bait, chase, or disturb wildlife|avoid claims the footage cannot support|false claim/i, file + " must retain ethical or factual safeguards");
    assert.match(markdown, /never Nature Frontiers/i, file + " must explicitly protect the existing channel");
    assert.match(markdown, /no SEO score, ranking, reach, or sales outcome is guaranteed/i, file + " must not promise performance");
  }
});

test("each Shorts narration is within a practical draft word-count band", () => {
  for (const file of briefs) {
    const markdown = fs.readFileSync(file, "utf8");
    const narration = narrationFrom(markdown);
    const words = narration.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)*/g) ?? [];
    assert.ok(words.length >= 100, file + " narration is too short for the 50–60 second target (" + words.length + " words)");
    assert.ok(words.length <= 150, file + " narration is too long for the 50–60 second target (" + words.length + " words)");
  }
});
