import test from "node:test";
import assert from "node:assert/strict";
import { buildScriptGenerationPrompt } from "../scripts/build-script-generation-prompt.mjs";

const brief = {
  topic: "How honey badgers respond to venomous snakes",
  audience: "Wildlife-curious adults",
  editorialPurpose: "Explain documented defensive adaptations without inventing a staged encounter",
  sources: [{ title: "Peer-reviewed field study", url: "https://research.example.org/field-study" }]
};

test("long-form prompt specifies measured depth, source mapping, originality and realistic scene direction", () => {
  const prompt = buildScriptGenerationPrompt("long_form", brief);
  assert.match(prompt, /6–10 minutes/);
  assert.match(prompt, /at least five clearly differentiated sections/);
  assert.match(prompt, /Every material factual claim must reference/);
  assert.match(prompt, /physically plausible, anatomically realistic/);
  assert.match(prompt, /Return valid JSON only/);
});

test("Short prompt requires an explicit same-cycle SonicVhibez parent and forbids arbitrary truncation", () => {
  const prompt = buildScriptGenerationPrompt("short", {
    ...brief,
    parentRecord: { contentId: "long-1", weeklyContentCycleId: "cycle-1", format: "long_form", channel: "SonicVhibez" }
  });
  assert.match(prompt, /50–60 seconds/);
  assert.match(prompt, /never truncate a long-form script arbitrarily/);
  assert.match(prompt, /contentId=long-1/);
  assert.match(prompt, /actual YouTube Studio Related video setting is a separate/);
});

test("prompt builder fails closed on absent source references or missing Short parent", () => {
  assert.throws(() => buildScriptGenerationPrompt("long_form", { ...brief, sources: [] }), /research source is required/);
  assert.throws(() => buildScriptGenerationPrompt("short", brief), /explicit long-form parent/);
  assert.throws(() => buildScriptGenerationPrompt("long_form", { ...brief, sources: [{ title: "bad", url: "http://insecure.example.org" }] }), /HTTPS URL/);
});
