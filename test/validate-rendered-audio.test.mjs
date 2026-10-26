import test from "node:test";
import assert from "node:assert/strict";
import { parseLoudnormReport, validateRenderedAudioMetrics } from "../scripts/validate-rendered-audio.mjs";

test("parses FFmpeg loudnorm input measurements", () => {
  const report = [
    "some ffmpeg output",
    '{ "input_i" : "-16.2", "input_tp" : "-1.7", "input_lra" : "6.2", "input_thresh" : "-27.0", "target_offset" : "0.2" }'
  ].join("\n");
  assert.deepEqual(parseLoudnormReport(report), { integratedLufs: -16.2, truePeakDbtp: -1.7, loudnessRange: 6.2 });
  assert.equal(parseLoudnormReport("no measurement"), null);
});

test("rendered audio must meet the selected profile's loudness and true-peak limits", () => {
  assert.equal(validateRenderedAudioMetrics({ integratedLufs: -16.5, truePeakDbtp: -1.7 }, "documentary_narration").valid, true);
  assert.match(validateRenderedAudioMetrics({ integratedLufs: -24, truePeakDbtp: -1.7 }, "documentary_narration").errors.join(" "), /loudness/);
  assert.match(validateRenderedAudioMetrics({ integratedLufs: -16, truePeakDbtp: -0.5 }, "documentary_narration").errors.join(" "), /true peak/);
  assert.match(validateRenderedAudioMetrics(null, "documentary_narration").errors.join(" "), /could not be measured/);
});
