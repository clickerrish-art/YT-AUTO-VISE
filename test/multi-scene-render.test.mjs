import test from "node:test";
import assert from "node:assert/strict";
import { createDeterministicEditPlan } from "../scripts/content-quality-gates.mjs";
import { buildMultiSceneVideoGraph } from "../scripts/multi-scene-render.mjs";
const timeline = [
  { assetId: "scene-a", path: "/media/a.mp4", startSeconds: 0, endSeconds: 10 },
  { assetId: "scene-b", path: "/media/b.mp4", startSeconds: 2, endSeconds: 12 }
];
function plan(transition = "cut") {
  const scenes = [
    { assetId: "scene-a", sourceSha256: "a".repeat(64), rightsStatus: "VERIFIED", editorialPurpose: "Establish habitat", startSeconds: 0, endSeconds: 10 },
    { assetId: "scene-b", sourceSha256: "b".repeat(64), rightsStatus: "VERIFIED", editorialPurpose: "Show next beat", startSeconds: 2, endSeconds: 12 }
  ];
  const result = createDeterministicEditPlan({ seed: 9, scenes, profile: { framing: ["fit"], transitions: [transition], transitionDurationSeconds: 0.35 } });
  result.scenes[0].transitionToNext = transition;
  return result;
}
test("builds a multi-scene filter graph with source trims, per-scene grade and caption burn-in", () => {
  const result = buildMultiSceneVideoGraph({ editPlan: plan(), sceneTimeline: timeline, captionsFilter: "/captions.srt", width: 1920, height: 1080, narrationDurationSeconds: 20 });
  assert.equal(result.sceneInputCount, 2);
  assert.equal(result.narrationInputIndex, 2);
  assert.equal(result.plannedDurationSeconds, 20);
  assert.match(result.filterComplex, /\[0:v:0\]trim=start=0:end=10/);
  assert.match(result.filterComplex, /\[1:v:0\]trim=start=2:end=12/);
  assert.match(result.filterComplex, /concat=n=2:v=1:a=0/);
  assert.match(result.filterComplex, /subtitles='\/captions\.srt'/);
});
test("supports crossfade and accounts for overlap in the timeline duration", () => {
  const result = buildMultiSceneVideoGraph({ editPlan: plan("crossfade"), sceneTimeline: timeline, captionsFilter: "/captions.srt", width: 1080, height: 1920, narrationDurationSeconds: 19.65, transitionDurationSeconds: 0.35 });
  assert.equal(result.plannedDurationSeconds, 19.65);
  assert.match(result.filterComplex, /xfade=transition=fade:duration=0\.35:offset=9\.65/);
});
test("blocks invalid segments, duplicate source segments and narration duration mismatch", () => {
  assert.throws(() => buildMultiSceneVideoGraph({ editPlan: plan(), sceneTimeline: [{ ...timeline[0], endSeconds: 0 }, timeline[1]], captionsFilter: "/captions.srt", width: 1920, height: 1080, narrationDurationSeconds: 20 }), /valid source start\/end range/);
  assert.throws(() => buildMultiSceneVideoGraph({ editPlan: plan(), sceneTimeline: [timeline[0], { ...timeline[0] }], captionsFilter: "/captions.srt", width: 1920, height: 1080, narrationDurationSeconds: 20 }), /duplicate source segment/);
  assert.throws(() => buildMultiSceneVideoGraph({ editPlan: plan(), sceneTimeline: timeline, captionsFilter: "/captions.srt", width: 1920, height: 1080, narrationDurationSeconds: 17 }), /must match measured narration duration/);
});
