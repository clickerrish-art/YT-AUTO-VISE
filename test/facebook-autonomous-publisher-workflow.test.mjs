import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "facebook-autonomous-publisher.yml"), "utf8");
const config = JSON.parse(fs.readFileSync(path.join(root, "config", "facebook-publishing.json"), "utf8"));

test("scheduled Facebook publisher workflow cannot enable live publishing through a repository variable", () => {
  assert.match(workflow, /^  publish:\n    if: github\.ref == 'refs\/heads\/main'/m);
  assert.match(workflow, /FACEBOOK_PUBLISH_ENABLED: 'NO'/);
  assert.doesNotMatch(workflow, /FACEBOOK_PUBLISH_ENABLED:\s*\$\{\{\s*vars\.FACEBOOK_PUBLISH_ENABLED/);
  assert.equal(config.publishingEnabled, false);
  assert.equal(config.dryRun, true);
  assert.equal(config.emergencyStop, true);
});
