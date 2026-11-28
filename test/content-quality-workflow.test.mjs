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

const automationWorkflow = fs.readFileSync(
  new URL("../.github/workflows/validate-automation.yml", import.meta.url),
  "utf8",
);

test("automation queue validator applies the approved Selar destination only to promotional items", () => {
  assert.ok(automationWorkflow.includes('if item.get("hasPaidPromotion") is True:'));
  assert.ok(automationWorkflow.includes("assert product_url == promotional_url"));
  assert.ok(automationWorkflow.includes("assert product_url is None"));
  assert.ok(automationWorkflow.includes("assert product_url in approved"));
  assert.ok(
    automationWorkflow.includes('"SCRIPT_READY_PRODUCTION_HOLD_ORIGINAL_MEDIA_NARRATION_RIGHTS_AND_HUMAN_REVIEW_REQUIRED"'),
  );
  assert.ok(automationWorkflow.includes('assert q.get("publishingEnabled") is False'));
  assert.ok(
    !automationWorkflow.includes('assert all(i.get("productUrl") == "https://selar.com/0u19v8u99l" for i in items)'),
    "non-promotional topics must not be forced to carry a product URL",
  );
});
