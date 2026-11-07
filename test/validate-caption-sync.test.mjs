import test from "node:test";
import assert from "node:assert/strict";
import { validateCaptionSync, parseSrtTime } from "../scripts/validate-caption-sync.mjs";

const valid = [
  "1",
  "00:00:00,000 --> 00:00:02,000",
  "A caption that fits.",
  "",
  "2",
  "00:00:02,100 --> 00:00:04,000",
  "The next caption."
].join("\n");

test("caption sync accepts ordered cues ending within media duration", () => {
  assert.deepEqual(validateCaptionSync(valid, 4.2), []);
  assert.equal(parseSrtTime("00:01:02,345"), 62345);
});

test("caption sync rejects cues extending beyond the rendered media", () => {
  const late = valid.replace("00:00:02,100 --> 00:00:04,000", "00:00:02,100 --> 00:00:06,000");
  assert.ok(validateCaptionSync(late, 4).some(error => /ends after the media ends/i.test(error)));
});

test("caption sync rejects overlapping cues and malformed timestamps", () => {
  const overlap = valid.replace("00:00:02,100 --> 00:00:04,000", "00:00:01,500 --> 00:00:04,000");
  assert.ok(validateCaptionSync(overlap, 5).some(error => /overlap or are out of order/i.test(error)));
  const malformed = valid.replace("00:00:00,000 --> 00:00:02,000", "bad timestamp");
  assert.ok(validateCaptionSync(malformed, 5).some(error => /invalid SRT timestamp/i.test(error)));
});

test("caption sync fails closed for empty captions and invalid duration", () => {
  assert.ok(validateCaptionSync("", 5).some(error => /empty/i.test(error)));
  assert.ok(validateCaptionSync(valid, Number.NaN).some(error => /finite positive/i.test(error)));
});

test("caption sync rejects impossible SRT minute and second fields", () => {
  assert.equal(parseSrtTime("00:60:00,000"), null);
  assert.equal(parseSrtTime("00:00:60,000"), null);
  assert.equal(parseSrtTime("01:00:00,000"), 3600000, "hours may exceed 23 in an SRT timeline");
  const badMinutes = valid.replace("00:00:00,000 --> 00:00:02,000", "00:61:00,000 --> 00:61:02,000");
  const badSeconds = valid.replace("00:00:00,000 --> 00:00:02,000", "00:00:60,000 --> 00:00:62,000");
  assert.ok(validateCaptionSync(badMinutes, 10).some(error => /invalid SRT timestamp/i.test(error)));
  assert.ok(validateCaptionSync(badSeconds, 10).some(error => /invalid SRT timestamp/i.test(error)));
});
