import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { generateDailyFacebookDraft } from "../scripts/generate-facebook-daily-draft.mjs";
import { restoreFacebookDraftHistory } from "../scripts/restore-facebook-draft-history.mjs";

const API = "https://api.github.test";

function makeArtifact(t, date = "2030-10-25") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-history-fixture-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const draftDir = path.join(root, "drafts");
  const generated = generateDailyFacebookDraft({
    date,
    outputDir: draftDir,
    now: "2030-10-24T05:30:00.000Z"
  });
  const archivePath = path.join(root, "fixture.zip");
  execFileSync("zip", ["-q", archivePath, date + ".json"], { cwd: draftDir });
  return { root, draft: generated.package, archive: fs.readFileSync(archivePath) };
}

test("cross-run history restoration downloads, validates and persists a retained draft through injected GitHub API", async (t) => {
  const fixture = makeArtifact(t);
  const outputPath = path.join(fixture.root, "history.json");
  const tempDir = path.join(fixture.root, "work");
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    assert.equal(options.headers.authorization, "Bearer test-token");
    if (url.startsWith(API + "/repos/clickerrish-art/YT-AUTO-VISE/actions/artifacts?")) {
      return new Response(JSON.stringify({
        artifacts: [{
          id: 12345,
          name: "nature-frontiers-facebook-draft-12345",
          expired: false,
          created_at: "2030-10-24T05:00:00Z",
          workflow_run: { id: 1234 }
        }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url === API + "/repos/clickerrish-art/YT-AUTO-VISE/actions/artifacts/12345/zip") {
      return new Response(fixture.archive, { status: 200, headers: { "content-type": "application/zip" } });
    }
    throw new Error("Unexpected URL: " + url);
  };
  const result = await restoreFacebookDraftHistory({
    now: new Date("2030-10-24T06:00:00Z"),
    fetchImpl,
    tempDir,
    outputPath,
    repository: "clickerrish-art/YT-AUTO-VISE",
    token: "test-token",
    apiBase: API,
    currentRunId: "9999"
  });
  assert.equal(result.count, 1);
  assert.deepEqual(result.dates, ["2030-10-25"]);
  assert.deepEqual(JSON.parse(fs.readFileSync(outputPath, "utf8")), [fixture.draft]);
  assert.equal(calls.length, 2);
  assert.equal(fs.statSync(outputPath).isFile(), true);
});

test("cross-run history restoration fails closed on malformed archive and does not write history", async (t) => {
  const fixture = makeArtifact(t);
  const outputPath = path.join(fixture.root, "history.json");
  const fetchImpl = async (url) => {
    if (url.startsWith(API + "/repos/clickerrish-art/YT-AUTO-VISE/actions/artifacts?")) {
      return new Response(JSON.stringify({ artifacts: [{
        id: 12346,
        name: "nature-frontiers-facebook-draft-12346",
        expired: false,
        created_at: "2030-10-24T05:00:00Z",
        workflow_run: { id: 1234 }
      }] }), { status: 200 });
    }
    return new Response(Buffer.from("not a zip archive"), { status: 200 });
  };
  await assert.rejects(() => restoreFacebookDraftHistory({
    now: new Date("2030-10-24T06:00:00Z"),
    fetchImpl,
    tempDir: path.join(fixture.root, "work"),
    outputPath,
    repository: "clickerrish-art/YT-AUTO-VISE",
    token: "test-token",
    apiBase: API,
    currentRunId: "9999"
  }));
  assert.equal(fs.existsSync(outputPath), false);
});

test("cross-run history rejects insecure API origins and oversized artifact responses", async (t) => {
  const fixture = makeArtifact(t);
  const base = {
    now: new Date("2030-10-24T06:00:00Z"),
    fetchImpl: async () => { throw new Error("fetch must not run for invalid configuration"); },
    tempDir: path.join(fixture.root, "work"),
    outputPath: path.join(fixture.root, "history.json"),
    repository: "clickerrish-art/YT-AUTO-VISE",
    token: "test-token",
    currentRunId: "9999"
  };
  await assert.rejects(() => restoreFacebookDraftHistory({ ...base, apiBase: "http://api.github.test" }), /HTTPS/i);
  await assert.rejects(() => restoreFacebookDraftHistory({
    ...base,
    apiBase: API,
    fetchImpl: async url => url.includes("/actions/artifacts?")
      ? new Response(JSON.stringify({ artifacts: [{
          id: 12347, name: "nature-frontiers-facebook-draft-12347", expired: false,
          created_at: "2030-10-24T05:00:00Z", workflow_run: { id: 1234 }
        }] }))
      : new Response("x".repeat(1024), { status: 200, headers: { "content-length": String(20 * 1024 * 1024) } })
  }), /size limit/i);
});


test("cross-run history restoration rejects symlinked output parents before creating nested directories", async (t) => {
  const fixture = makeArtifact(t);
  const outside = path.join(fixture.root, "outside");
  fs.mkdirSync(outside);
  const linkedParent = path.join(fixture.root, "history-root");
  fs.symlinkSync(outside, linkedParent, "dir");
  const outputPath = path.join(linkedParent, "new-subdirectory", "history.json");

  await assert.rejects(() => restoreFacebookDraftHistory({
    now: new Date("2030-10-24T06:00:00Z"),
    fetchImpl: async () => new Response(JSON.stringify({ artifacts: [] }), {
      status: 200, headers: { "content-type": "application/json" }
    }),
    tempDir: path.join(fixture.root, "work"),
    outputPath,
    repository: "clickerrish-art/YT-AUTO-VISE",
    token: "test-token",
    apiBase: API,
    currentRunId: "9999"
  }), /symbolic link/i);

  assert.equal(fs.existsSync(path.join(outside, "new-subdirectory")), false,
    "history restoration must not create directories through a symlinked output parent");
  assert.equal(fs.existsSync(outputPath), false);
});
