#!/usr/bin/env node
/** Build a structured, source-constrained authoring prompt; never calls an external model. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveRegularFileNoSymlinks } from "./safe-media-path.mjs";

export function buildScriptGenerationPrompt(format, brief) {
  if (!["long_form", "short"].includes(format)) throw new Error("format must be long_form or short");
  const errors = [];
  if (!brief || typeof brief !== "object") throw new Error("brief must be a JSON object");
  for (const key of ["topic", "audience", "editorialPurpose"]) {
    if (typeof brief[key] !== "string" || !brief[key].trim()) errors.push(key + " is required");
  }
  if (!Array.isArray(brief.sources) || brief.sources.length === 0) errors.push("at least one research source is required");
  for (const [index, source] of (brief.sources ?? []).entries()) {
    if (!source || typeof source.title !== "string" || !source.title.trim() || typeof source.url !== "string" || !/^https:\/\//i.test(source.url)) {
      errors.push("source " + (index + 1) + " requires a title and HTTPS URL");
    }
  }
  if (format === "short") {
    if (!brief.parentRecord || brief.parentRecord.format !== "long_form") errors.push("Short prompt requires an explicit long-form parent record");
    if (!brief.parentRecord?.contentId || !brief.parentRecord?.weeklyContentCycleId) errors.push("Short prompt requires parent content ID and weekly cycle ID");
    if (brief.parentRecord?.channel !== "SonicVhibez") errors.push("Short parent must target SonicVhibez");
  }
  if (errors.length) throw new Error("Prompt blocked: " + errors.join("; "));
  const sourceList = brief.sources.map((s, i) => (i + 1) + ". " + s.title + " — " + s.url).join("\n");
  const common = [
    "Create original, evidence-led wildlife documentary narration for SonicVhibez.",
    "Never invent sources, quotations, observations, animal behavior, statistics or certainty. Distinguish established evidence, inference and uncertainty.",
    "Do not copy, paraphrase closely, or imitate another creator's script. Do not invent a recorded encounter. Generated/reconstructed visuals must be described as illustrative where appropriate.",
    "Every material factual claim must reference one or more supplied source IDs. If a claim cannot be supported, qualify it or omit it.",
    "Return valid JSON only with keys: premise, conclusion, narration, sections, claims, sources, similarityReview. Each section must contain heading, purpose, narration. Each claim must contain text and sourceIds. Preserve source IDs and exact source URLs.",
    "Use scene-by-scene visual direction that is physically plausible, anatomically realistic, geographically coherent and aligned with the narration. Flag any scene that requires synthetic reconstruction or human factual review.",
    "Avoid filler, repetitive summaries, keyword stuffing, engagement bait and unsupported sensationalism.",
    "Topic: " + brief.topic,
    "Audience: " + brief.audience,
    "Editorial purpose: " + brief.editorialPurpose,
    "Allowed research sources:\n" + sourceList
  ];
  if (format === "long_form") {
    common.push(
      "FORMAT: long-form, 6–10 minutes, measured narration target 780–1600 words. The application measures the returned text; do not self-report word counts.",
      "Use at least five clearly differentiated sections. Include a distinctive accurate premise, researched context, detailed explanation, transitions, pacing and sound/visual direction, explicit uncertainty where appropriate, and a substantive conclusion that resolves the opening premise.",
      "Provide a complete narration transcript suitable for caption generation. Every section must advance the explanation and not repeat another section."
    );
  } else {
    common.push(
      "FORMAT: YouTube Short, 50–60 seconds, measured narration target 90–150 words. The application measures the returned text; do not self-report word counts.",
      "Use at least three differentiated beats: hook, evidence/discovery, and payoff. Make the Short coherent and self-contained; never truncate a long-form script arbitrarily.",
      "Explicit parent: contentId=" + brief.parentRecord.contentId + "; weeklyContentCycleId=" + brief.parentRecord.weeklyContentCycleId + ". Align the Short's topic and narrative with this parent, but do not fabricate a scene or claim absent from the approved parent evidence.",
      "Include a relevant, non-misleading invitation to watch the parent only where appropriate. The actual YouTube Studio Related video setting is a separate post-upload verification."
    );
  }
  return common.join("\n\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [format, briefArg] = process.argv.slice(2);
  if (!format || !briefArg) {
    console.error("Usage: node scripts/build-script-generation-prompt.mjs <long_form|short> <brief.json>");
    process.exit(2);
  }
  let briefPath;
  try { briefPath = resolveRegularFileNoSymlinks(briefArg, process.cwd(), "Script brief"); }
  catch { console.error("BLOCKED: script brief is missing, unsafe or contains a symbolic link."); process.exit(2); }
  let brief;
  try { brief = JSON.parse(fs.readFileSync(briefPath, "utf8")); }
  catch { console.error("BLOCKED: script brief is not valid JSON."); process.exit(2); }
  try { process.stdout.write(buildScriptGenerationPrompt(format, brief) + "\n"); }
  catch (error) { console.error(error.message); process.exit(1); }
}
