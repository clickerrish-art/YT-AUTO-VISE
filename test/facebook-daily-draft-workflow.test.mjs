import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "facebook-daily-draft.yml");
const workflow = fs.readFileSync(workflowPath, "utf8");

test("Facebook daily workflow distinguishes local package validation from Meta provider acceptance", () => {
  assert.match(workflow, /^name: Validate daily Nature Frontiers local draft package$/m);
  assert.match(workflow, /^  generate-and-retain-local-draft-package:/m);
  assert.doesNotMatch(workflow, /^  create-draft-package:/m);
  assert.match(workflow, /Meta provider-side draft creation\/read-back: BLOCKED_EXTERNAL/);
  assert.match(workflow, /does not create or read back a Meta Page draft/);
  assert.match(workflow, /no Meta API write is performed/);
});
