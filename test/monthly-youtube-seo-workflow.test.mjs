import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/monthly-youtube-seo-review.yml", "utf8");

test("monthly SEO research defaults to read-only and global unless an owner configures a market", () => {
  assert.match(workflow, /SEO_REGION_CODE:\s*\$\{\{ vars\.SEO_REGION_CODE \}\}/);
  assert.match(workflow, /Research configured wildlife market \(global unless explicitly set\)/);
  assert.match(workflow, /run: node scripts\/research-youtube-seo\.mjs/);
});

test("live SEO metadata updates require a separate manual dispatch and explicit YES confirmation", () => {
  assert.match(workflow, /confirm_live_metadata_update:[\s\S]*default: "NO"[\s\S]*options:[\s\S]*- "NO"[\s\S]*- "YES"/);
  const liveStep = workflow.slice(workflow.indexOf("Apply exact owner-approved SEO metadata"));
  assert.match(liveStep, /github\.ref == 'refs\/heads\/codex\/marketing-machine-audit-fixes'/);
  assert.match(liveStep, /github\.event_name == 'workflow_dispatch'/);
  assert.match(liveStep, /inputs\.confirm_live_metadata_update == 'YES'/);
  assert.match(liveStep, /SEO_METADATA_WRITE_ENABLED == 'YES'/);
  assert.match(liveStep, /SEO_METADATA_DRY_RUN == 'NO'/);
  assert.match(liveStep, /SEO_METADATA_LIVE_CONFIRM == 'YES'/);
  assert.match(liveStep, /hashFiles\('config\/seo-metadata-approval\.json'\) != ''/);
});
