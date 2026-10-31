import { createDeterministicEditPlan } from "./content-quality-gates.mjs";

function n(value) { return Number(value.toFixed(6)).toString(); }

/** Build a deterministic filter graph for reviewed source segments; never downloads or grants rights. */
export function buildMultiSceneVideoGraph({
  editPlan, sceneTimeline, captionsFilter, width, height, narrationDurationSeconds,
  transitionDurationSeconds = 0.35, fps = 30
}) {
  if (!Array.isArray(sceneTimeline) || sceneTimeline.length < 2 || sceneTimeline.length > 30) throw new Error("multi-scene render requires between 2 and 30 explicit source segments");
  if (!editPlan || !Array.isArray(editPlan.scenes) || editPlan.scenes.length !== sceneTimeline.length) throw new Error("edit plan must bind each source segment exactly once");
  if (!Number.isInteger(width) || width < 2 || !Number.isInteger(height) || height < 2) throw new Error("output dimensions must be positive integers");
  if (!Number.isInteger(fps) || fps < 1 || fps > 60) throw new Error("output frame rate must be between 1 and 60 fps");
  if (!Number.isFinite(narrationDurationSeconds) || narrationDurationSeconds <= 0) throw new Error("measured narration duration is required");
  if (!Number.isFinite(transitionDurationSeconds) || transitionDurationSeconds < 0.1 || transitionDurationSeconds > 1) throw new Error("transitionDurationSeconds must be between 0.1 and 1 second");
  const errors = [], seen = new Set();
  const durations = sceneTimeline.map((scene, index) => {
    if (!scene || typeof scene.path !== "string" || !scene.path.trim()) errors.push("scene " + index + " requires a resolved source path");
    if (!Number.isFinite(scene?.startSeconds) || !Number.isFinite(scene?.endSeconds) || scene.startSeconds < 0 || scene.endSeconds <= scene.startSeconds) {
      errors.push("scene " + index + " requires a valid source start/end range"); return 0;
    }
    const key = [scene.assetId, scene.startSeconds, scene.endSeconds].join(":");
    if (seen.has(key)) errors.push("duplicate source segment is not allowed");
    seen.add(key);
    return scene.endSeconds - scene.startSeconds;
  });
  if (errors.length) throw new Error("multi-scene timeline blocked: " + errors.join("; "));
  const filters = [];
  for (let i = 0; i < sceneTimeline.length; i++) {
    const planned = editPlan.scenes[i], source = sceneTimeline[i];
    if (!planned || !["fit", "gentle_crop"].includes(planned.framing)) throw new Error("edit plan scene " + i + " has unsupported framing");
    const framing = planned.framing === "fit"
      ? "scale=" + width + ":" + height + ":force_original_aspect_ratio=decrease,pad=" + width + ":" + height + ":(ow-iw)/2:(oh-ih)/2:black"
      : "scale=" + width + ":" + height + ":force_original_aspect_ratio=increase,crop=" + width + ":" + height;
    const grade = planned.grade;
    if (!grade || ![grade.brightness, grade.contrast, grade.saturation].every(Number.isFinite)) throw new Error("edit plan scene " + i + " has invalid colour correction");
    filters.push("[" + i + ":v:0]trim=start=" + n(source.startSeconds) + ":end=" + n(source.endSeconds)
      + ",setpts=PTS-STARTPTS," + framing + ",eq=brightness=" + n(grade.brightness) + ":contrast=" + n(grade.contrast)
      + ":saturation=" + n(grade.saturation) + ",fps=" + fps + ",setsar=1,format=yuv420p,settb=AVTB[v" + i + "]");
  }
  let current = "v0", currentDuration = durations[0];
  for (let i = 1; i < sceneTimeline.length; i++) {
    const transition = editPlan.scenes[i - 1].transitionToNext, next = "v" + i, output = "timeline" + i;
    if (transition === "cut") {
      filters.push("[" + current + "][" + next + "]concat=n=2:v=1:a=0[" + output + "]");
      currentDuration += durations[i];
    } else if (transition === "crossfade") {
      if (Math.min(currentDuration, durations[i]) <= transitionDurationSeconds) throw new Error("crossfade duration must be shorter than both adjoining scenes");
      filters.push("[" + current + "][" + next + "]xfade=transition=fade:duration=" + n(transitionDurationSeconds) + ":offset=" + n(currentDuration - transitionDurationSeconds) + "[" + output + "]");
      currentDuration += durations[i] - transitionDurationSeconds;
    } else throw new Error("edit plan scene " + (i - 1) + " has unsupported transition " + transition);
    current = output;
  }
  if (Math.abs(currentDuration - narrationDurationSeconds) > 1) throw new Error("planned multi-scene duration " + n(currentDuration) + "s must match measured narration duration " + n(narrationDurationSeconds) + "s within 1 second");
  if (typeof captionsFilter !== "string" || !captionsFilter.trim()) throw new Error("escaped caption filter path is required");
  filters.push("[" + current + "]subtitles='" + captionsFilter + "',format=yuv420p[vout]");
  return { filterComplex: filters.join(";"), outputLabel: "[vout]", sceneInputCount: sceneTimeline.length, narrationInputIndex: sceneTimeline.length, plannedDurationSeconds: Number(currentDuration.toFixed(3)), scenePaths: sceneTimeline.map(scene => scene.path) };
}
