import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workflow = fs.readFileSync(
  new URL("../.github/workflows/content-quality.yml", import.meta.url),
  "utf8",
);
const embeddedPython = workflow.match(/python - <<'PY'\r?\n([\s\S]*?)\r?\n\s*PY/m)?.[1];
const python = embeddedPython?.replace(/^[ \\t]+/gm, "");

test("content-quality inline Python declares its imports and keeps narration parsing regexes valid", () => {
  assert.ok(embeddedPython, "content-quality workflow must contain its inline Python validation");
  assert.match(python, /^from pathlib import Path$/m);
  assert.match(python, /^import json$/m);
  assert.match(python, /^import re$/m);
  assert.match(embeddedPython, /json\.loads/);
  assert.match(embeddedPython, /re\.search/);
  assert.match(embeddedPython, /re\.findall/);
  assert.ok(
    python.includes("r\"(?m)^#{2,3} (?:Spoken narration draft|Narration script)\\s*$\""),
    "narration section regex must use a Python whitespace boundary",
  );
  assert.ok(
    python.includes("r\"\\b[\\w’'-]+\\b\""),
    "word counter regex must use Python word boundaries",
  );
});
