import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const draft = fs.readFileSync(new URL("../content/drafts/nile-crocodile-eyes-at-the-waterline.md", import.meta.url), "utf8");
const narration = draft.match(/^## Narration draft[^\n]*\n\n([\s\S]*?)(?=\n\n## |$)/m)?.[1] ?? "";

test("Nile crocodile encounter remains an unqueued review-only draft", () => {
  assert.match(draft, /UNQUEUED EDITORIAL DRAFT/);
  assert.match(draft, /Queue state: NOT QUEUED/);
  assert.match(draft, /not rendered, approved, scheduled or published/i);
  assert.doesNotMatch(draft, /publishReady\s*[:=]\s*true|publishingEnabled\s*[:=]\s*true/i);
});

test("narration is a short wildlife encounter and discloses AI reconstruction", () => {
  const words = narration.trim().split(/\s+/);
  assert.ok(words.length >= 80 && words.length <= 140, `unexpected narration word count: ${words.length}`);
  assert.match(narration, /Nile crocodile/i);
  assert.match(narration, /AI-generated illustration of documented behaviour/i);
  assert.match(narration, /not real footage of an attack/i);
  assert.match(narration, /Never approach a crocodile shoreline/i);
});

test("material animal-behaviour claims have named source URLs", () => {
  assert.match(draft, /ielc\.libguides\.com\/sdzg\/factsheets\/nile_crocodile\/behavior/);
  assert.match(draft, /ielc\.libguides\.com\/sdzg\/factsheets\/nile_crocodile\/diet/);
  assert.match(draft, /pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC12079573/);
  assert.match(draft, /iucncsg\.org\/pages\/crocodilian-attacks/);
});

test("draft preserves requested vertical format and contains no unapproved product promotion", () => {
  assert.match(draft, /50–60 seconds, 9:16 vertical/);
  assert.match(draft, /TOO BIG\?/);
  assert.doesNotMatch(draft, /selar\.com|ADVERTISEMENT|affiliate/i);
});
