import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateCaptionSync } from "../scripts/validate-caption-sync.mjs";

const read = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
const script = read("../content/short-004-california-spiny-lobster-script.md");
const srt = read("../content/short-004-california-spiny-lobster.srt");
const render = JSON.parse(read("../content/short-004-california-spiny-lobster-review-render.json"));
const metadata = JSON.parse(read("../content/short-004-california-spiny-lobster-metadata.json"));
const asset = JSON.parse(read("../content/asset-candidates/noaa-spiny-lobsters-california.json"));

function parseTimestamp(value) {
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  assert.ok(match, `invalid SRT timestamp: ${value}`);
  const [, h, m, s, ms] = match.map(Number);
  return (((h * 60 + m) * 60 + s) * 1000) + ms;
}

function parseCues(source) {
  return source.trim().replace(/\r\n/g, "\n").split(/\n\s*\n/).map((block, index) => {
    const lines = block.split("\n");
    assert.equal(Number(lines[0]), index + 1, `cue ${index + 1} sequence`);
    const match = lines[1].match(/^(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})$/);
    assert.ok(match, `cue ${index + 1} timestamp syntax`);
    return {
      start: parseTimestamp(match[1]),
      end: parseTimestamp(match[2]),
      lines: lines.slice(2)
    };
  });
}

function normalizeWords(value) {
  return value.toLocaleLowerCase("en-US")
    .replace(/[’‘]/g, "'")
    .match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.join(" ") ?? "";
}

test("Short-004 timed captions match the narration script and remain readable", () => {
  const narration = script.match(/^## Narration draft\s*\n+([\s\S]*?)\n+## Edit and disclosure instructions/m);
  assert.ok(narration, "narration section exists");
  const scriptText = narration[1].replace(/\s+/g, " ").trim();
  const cues = parseCues(srt);
  const captionText = cues.map(cue => cue.lines.join(" ")).join(" ");

  assert.equal(cues.length, 12);
  assert.equal(normalizeWords(captionText), normalizeWords(scriptText), "captions match narration word-for-word");
  assert.equal(normalizeWords(captionText).split(" ").length, 108);
  assert.deepEqual(validateCaptionSync(srt, 55), []);

  const allLines = cues.flatMap(cue => cue.lines);
  assert.ok(allLines.every(line => line.trim().length > 0));
  assert.ok(Math.max(...allLines.map(line => line.length)) <= 42, "caption lines fit the mobile readability limit");
  assert.ok(Math.max(...cues.map(cue => cue.lines.length)) <= 3, "no cue exceeds three lines");
  for (let index = 1; index < cues.length; index += 1) {
    assert.ok(cues[index].start >= cues[index - 1].end, `cue ${index + 1} does not overlap its predecessor`);
  }

  assert.equal(render.captions.cueCount, cues.length);
  assert.equal(render.captions.wordCount, 108);
  assert.equal(render.captions.maxLineCharacters, Math.max(...allLines.map(line => line.length)));
  assert.equal(render.captions.maxLinesPerCue, Math.max(...cues.map(cue => cue.lines.length)));
  assert.equal(render.captions.overlappingCues, 0);
  assert.equal(render.captions.gapBetweenCuesMs, 80);
});

test("Short-004 review renders and source candidate remain fail-closed", () => {
  assert.equal(render.status, "REVIEW_RENDER_ONLY_NOT_FOR_PUBLICATION");
  assert.equal(render.output.durationSeconds, 55);
  assert.equal(render.output.width, 1080);
  assert.equal(render.output.height, 1920);
  assert.equal(render.output.frameRate, 30);
  assert.equal(render.output.fullFileDecode, "PASS");
  assert.equal(render.output.sourceAudioStream, "ABSENT");
  assert.match(render.output.syntheticNarrationAudio, /eSpeak.*135 WPM/);
  assert.equal(render.output.sha256, metadata.narrationReview.sha256);
  assert.equal(render.output.filename, metadata.narrationReview.filename);
  assert.equal(render.output.sizeBytes, metadata.narrationReview.sizeBytes);
  assert.equal(metadata.narrationReview.status, "SYNTHETIC_REVIEW_RENDER_ONLY_NOT_FOR_PUBLICATION");
  assert.equal(metadata.narrationReview.humanApproved, false);
  assert.equal(metadata.narrationReview.humanVoiceApproval, false);
  assert.equal(metadata.narrationReview.rightsConfirmed, false);
  assert.equal(metadata.narrationReview.rightsEvidenceReviewed, false);
  assert.equal(metadata.narrationReview.complianceReviewed, false);
  assert.equal(metadata.narrationReview.uploadAllowed, false);
  assert.equal(metadata.narrationReview.scheduleAllowed, false);

  assert.equal(metadata.visualReview.productionApproved, false);
  assert.equal(metadata.visualReview.uploadAllowed, false);
  assert.equal(metadata.visualReview.scheduleAllowed, false);
  assert.equal(asset.visualReviewCut.productionApproved, false);
  assert.equal(asset.visualReviewCut.uploadAllowed, false);
  assert.equal(asset.visualReviewCut.scheduleAllowed, false);
});
