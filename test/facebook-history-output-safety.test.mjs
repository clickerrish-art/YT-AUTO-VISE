import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { restoreFacebookDraftHistory } from "../scripts/restore-facebook-draft-history.mjs";

const API = "https://api.github.test";

test("Facebook history restoration refuses symlink output and preserves the target file", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-history-output-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const outsideFile = path.join(root, "outside-data.txt");
  const outputLink = path.join(root, "history.json");
  const tempDir = path.join(root, "work");
  fs.writeFileSync(outsideFile, "preserve this unrelated file", { mode: 0o600 });
  fs.symlinkSync(outsideFile, outputLink);

  const fetchImpl = async (url) => {
    assert.ok(url.startsWith(API + "/repos/clickerrish-art/YT-AUTO-VISE/actions/artifacts?"));
    return new Response(JSON.stringify({ artifacts: [] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  await assert.rejects(() => restoreFacebookDraftHistory({
    now: new Date("2030-10-24T06:00:00Z"),
    fetchImpl,
    tempDir,
    outputPath: outputLink,
    repository: "clickerrish-art/YT-AUTO-VISE",
    token: "test-token",
    apiBase: API,
    currentRunId: "9999"
  }), /symbolic link/i);

  assert.equal(fs.readFileSync(outsideFile, "utf8"), "preserve this unrelated file");
  assert.equal(fs.lstatSync(outputLink).isSymbolicLink(), true, "the output symlink must not be replaced or followed");
});
