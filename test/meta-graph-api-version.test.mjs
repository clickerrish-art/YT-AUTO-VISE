import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { META_GRAPH_API_VERSION } from "../scripts/meta-graph-api-version.mjs";

test("Facebook and Instagram publishing configs share the current Meta Graph API version", () => {
  assert.equal(META_GRAPH_API_VERSION, "v27.0");
  for (const file of ["config/facebook-publishing.json", "config/instagram-publishing.json"]) {
    const config = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(config.apiVersion, META_GRAPH_API_VERSION, file + " must match the shared version");
  }
});
