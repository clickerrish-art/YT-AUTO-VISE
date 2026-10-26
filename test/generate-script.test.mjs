import test from "node:test";
import assert from "node:assert/strict";
import { generateScript, validateGenerationEndpoint } from "../scripts/generate-script.mjs";

const source = { id: "source-1", title: "Field ecology paper", url: "https://research.example.org/paper", evidenceLocator: "Results section, paragraphs 2–4", evidenceSummary: "The supplied research describes observation conditions and explains why repeated observations are needed before generalizing animal behavior." };
const narration = [
  "A wildlife encounter can look simple from a distance, but the evidence often tells a more careful story. The first question is not which animal is strongest; it is what each animal is doing in its own habitat.",
  "Field observations can describe behavior under specific conditions, but one observation cannot establish a universal rule. Researchers compare repeated observations, environmental context, and competing explanations before drawing conclusions.",
  "That distinction matters when a short video compresses a complicated interaction into a dramatic moment. A responsible account separates what the source directly reports from what remains uncertain, and never invents a scene to make the story more exciting."
].join("\n\n");
const script = {
  premise: "Explain how to interpret wildlife behavior without overstating a single observation.",
  conclusion: "The strongest wildlife story is the one that keeps observation, interpretation, and uncertainty distinct.",
  narration,
  sections: [
    { heading: "The question", purpose: "Frame the evidence", narration: narration.split("\n\n")[0], visualDirection: "Wide habitat establishing shot", pacing: "Measured", soundDesign: "Natural ambience" },
    { heading: "What evidence means", purpose: "Explain source limits", narration: narration.split("\n\n")[1], visualDirection: "Documented behavior with no invented encounter", pacing: "Steady", soundDesign: "Low ambience under narration" },
    { heading: "The responsible conclusion", purpose: "Resolve the premise", narration: narration.split("\n\n")[2], visualDirection: "Return to habitat context", pacing: "Slow slightly", soundDesign: "Natural fade" }
  ],
  claims: [{ text: "Researchers compare observations and context before drawing conclusions.", sourceIds: ["source-1"] }],
  sources: [source],
  similarityReview: { status: "REVIEWED", evidenceRef: "model-claims-review" }
};

function providerResponse(content, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }) };
}

test("generation accepts structurally valid source-bound output but never trusts model similarity claims", async () => {
  const result = await generateScript({
    format: "short",
    brief: { topic: "Interpreting wildlife observations", audience: "Adults", editorialPurpose: "Explain evidence limits", sources: [source], parentRecord: { contentId: "long-parent", weeklyContentCycleId: "cycle-1", format: "long_form", channel: "SonicVhibez" } },
    fetchImpl: async () => providerResponse(script)
  });
  assert.equal(result.publishable, false);
  assert.equal(result.reviewStatus, "AWAITING_HUMAN_SIMILARITY_AND_FACT_REVIEW");
  assert.equal(result.script.similarityReview.status, "PENDING");
  assert.equal(result.measured.words, narration.split(/\s+/u).length);
  assert.equal(result.measured.actualDurationVerified, false);
});

test("generation rejects a model that invents or changes source URLs", async () => {
  const altered = { ...script, sources: [{ ...source, url: "https://invented.example.org" }] };
  await assert.rejects(() => generateScript({
    format: "short",
    brief: { topic: "Topic", audience: "Adults", editorialPurpose: "Explain", sources: [source], parentRecord: { contentId: "long-parent", weeklyContentCycleId: "cycle-1", format: "long_form", channel: "SonicVhibez" } },
    fetchImpl: async () => providerResponse(altered)
  }), /exactly match supplied source/);
});

test("generation rejects malformed structure and remote plaintext endpoints", async () => {
  await assert.rejects(() => generateScript({
    format: "short",
    brief: { topic: "Topic", audience: "Adults", editorialPurpose: "Explain", sources: [source], parentRecord: { contentId: "long-parent", weeklyContentCycleId: "cycle-1", format: "long_form", channel: "SonicVhibez" } },
    fetchImpl: async () => providerResponse({ ...script, narration: "too short", sections: [] })
  }), /failed measured structural validation/);
  assert.throws(() => validateGenerationEndpoint("http://203.0.113.10/api"), /HTTPS or loopback HTTP/);
  assert.equal(validateGenerationEndpoint("http://127.0.0.1:1234/v1/chat/completions"), "http://127.0.0.1:1234/v1/chat/completions");
});

test("provider failure fails closed without returning a publishable script", async () => {
  await assert.rejects(() => generateScript({
    format: "short",
    brief: { topic: "Topic", audience: "Adults", editorialPurpose: "Explain", sources: [source], parentRecord: { contentId: "long-parent", weeklyContentCycleId: "cycle-1", format: "long_form", channel: "SonicVhibez" } },
    fetchImpl: async () => providerResponse({}, 503)
  }), /HTTP 503/);
});

test("generation requires substantive research evidence and complete scene direction", async () => {
  await assert.rejects(() => generateScript({
    format: "short",
    brief: { topic: "Topic", audience: "Adults", editorialPurpose: "Explain", sources: [{ id: "source-1", title: "Paper", url: source.url }] },
    fetchImpl: async () => providerResponse(script)
  }), /substantive evidenceSummary/);
  const incomplete = {
    ...script,
    sections: script.sections.map((section, index) => index === 0 ? { ...section, soundDesign: "" } : section)
  };
  await assert.rejects(() => generateScript({
    format: "short",
    brief: { topic: "Topic", audience: "Adults", editorialPurpose: "Explain", sources: [source], parentRecord: { contentId: "long-parent", weeklyContentCycleId: "cycle-1", format: "long_form", channel: "SonicVhibez" } },
    fetchImpl: async () => providerResponse(incomplete)
  }), /requires visualDirection, pacing and soundDesign/);
});
