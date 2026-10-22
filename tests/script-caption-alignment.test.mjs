import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Short 001 narration draft remains aligned with timed caption beats", () => {
  const script = fs.readFileSync("content/short-001-wildlife-video-storytelling.md", "utf8").toLowerCase();
  const srt = fs.readFileSync("content/short-001-wildlife-video-storytelling.srt", "utf8").toLowerCase();
  const requiredBeats = [
    ["opening hook", "want better wildlife videos"],
    ["one clear story", "one clear story"],
    ["shot planning", "plan three shots"],
    ["ethical distance", "keep a safe distance"],
    ["patient observation", "patient observation"],
    ["readable captions and rights-cleared music", "music you have permission to use"],
    ["closing takeaway", "one useful takeaway"],
    ["approved product call to action", "wildlife creator’s vault"]
  ];
  for (const [label, phrase] of requiredBeats) {
    assert.ok(script.includes(phrase), `script missing ${label}: ${phrase}`);
    assert.ok(srt.includes(phrase), `timed captions missing ${label}: ${phrase}`);
  }
});

test("Short 001 timed captions end at 55 seconds", () => {
  const srt = fs.readFileSync("content/short-001-wildlife-video-storytelling.srt", "utf8");
  const timestamps = [...srt.matchAll(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/g)];
  assert.ok(timestamps.length > 0, "expected timed caption entries");
  const last = timestamps[timestamps.length - 1];
  const endSeconds = Number(last[5]) * 3600 + Number(last[6]) * 60 + Number(last[7]) + Number(last[8]) / 1000;
  assert.equal(endSeconds, 55);
});
