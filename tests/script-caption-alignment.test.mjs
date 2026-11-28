import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Short 001 legacy captions remain non-final until approved narration and captions are supplied", () => {
  const script = fs.readFileSync("content/short-001-wildlife-video-storytelling.md", "utf8");
  const srt = fs.readFileSync("content/short-001-wildlife-video-storytelling.srt", "utf8").toLowerCase();
  const manifest = JSON.parse(fs.readFileSync("content/render-manifest.json", "utf8"));
  assert.ok(script.includes("plan three shots from the same real encounter"));
  assert.ok(script.includes("Generate captions against the approved final narration"));
  assert.equal(manifest.narrationPath, "");
  assert.equal(manifest.captionsPath, "");
  assert.ok(srt.includes("plan three shots"));
  assert.ok(srt.includes("music you have permission to use"));
  assert.equal(manifest.narrationRightsStatus, "NOT_GENERATED_PENDING_OWNER_APPROVED_COMMERCIAL_VOICE");
  assert.equal(manifest.narrationProductionUseAllowed, false);
  assert.equal(manifest.narrationPublicBrandedDistributionAllowed, false);
});

test("Short 001 timed captions finish within 250ms of the generated narration duration", () => {
  const srt = fs.readFileSync("content/short-001-wildlife-video-storytelling.srt", "utf8");
  const evidence = JSON.parse(fs.readFileSync("content/short-001-roderic-narration-generation.json", "utf8"));
  const timestamps = [...srt.matchAll(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/g)];
  assert.ok(timestamps.length > 0, "expected timed caption entries");
  const last = timestamps[timestamps.length - 1];
  const endSeconds = Number(last[5]) * 3600 + Number(last[6]) * 60 + Number(last[7]) + Number(last[8]) / 1000;
  const narrationDuration = evidence.synthesis.durationSeconds;
  assert.ok(endSeconds <= narrationDuration, "captions must not outlast the generated narration");
  assert.ok(narrationDuration - endSeconds <= 0.25, "final caption must cover the final spoken word and finish within 250ms of audio end");
});
