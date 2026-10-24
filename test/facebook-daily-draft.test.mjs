import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { generateDailyFacebookDraft } from "../scripts/generate-facebook-daily-draft.mjs";
import { validateFacebookHistoryPackage, restoreFacebookDraftHistory } from "../scripts/restore-facebook-draft-history.mjs";

test("daily Facebook draft package is research-only, timezone-labelled and idempotent", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-draft-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const first = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: root, now: "2030-10-24T05:30:00.000Z"
  });
  assert.equal(first.created, true);
  assert.equal(first.package.date, "2030-10-25");
  assert.equal(first.package.destination, "nature_frontiers_facebook");
  assert.equal(first.package.timezone, "Africa/Johannesburg");
  assert.ok(["08:00", "18:00"].includes(first.package.proposedPublicationTime));
  assert.equal(first.package.publishReady, false);
  assert.equal(first.package.publishingEnabled, false);
  assert.equal(first.package.destinationPageId, null);
  assert.deepEqual(first.package.factualClaims, []);
  assert.equal(first.package.media, null);
  assert.equal(first.package.rightsEvidence, null);
  assert.ok(first.package.blockers.length >= 4);
  assert.equal(fs.statSync(first.path).mode & 0o777, 0o600);

  const second = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: root, now: "2030-10-24T06:00:00.000Z"
  });
  assert.equal(second.created, false);
  assert.equal(second.reason, "IDEMPOTENT_EXISTING_DRAFT_PRESERVED");
  assert.deepEqual(second.package, first.package);
  assert.equal(fs.readdirSync(root).filter(name => name.endsWith(".json")).length, 1);
});

test("missed daily experiment slots are flagged instead of silently backdated", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-missed-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: root, now: "2030-10-25T20:00:00.000Z"
  });
  assert.equal(result.package.publishReady, false);
  assert.equal(result.package.publishingEnabled, false);
  assert.equal(result.package.scheduleStatus, "MISSED_SLOT_REVIEW_REQUIRED");
  assert.equal(result.package.status, "MISSED_SLOT_REVIEW_REQUIRED");
  assert.ok(result.package.blockers.some(item => /slot has passed; do not backdate or batch-publish/i.test(item)));
  assert.ok(Date.parse(result.package.proposedScheduledAt) < Date.parse("2030-10-25T20:00:00.000Z"));
});

test("daily draft generator rejects invalid dates and refuses malformed existing output", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-invalid-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.throws(() => generateDailyFacebookDraft({ date: "2030-02-31", outputDir: root }), /invalid/i);
  fs.writeFileSync(path.join(root, "2030-10-25.json"), JSON.stringify({ date: "2030-10-25", destination: "other-page", publishingEnabled: false }));
  assert.throws(() => generateDailyFacebookDraft({ date: "2030-10-25", outputDir: root }), /refusing to overwrite/i);
});


test("existing daily draft must pass the full research-only schema before idempotent reuse", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-schema-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, "2030-10-25.json");

  // A truncated artifact used to pass the old three-field check and suppress regeneration.
  fs.writeFileSync(file, JSON.stringify({
    date: "2030-10-25",
    destination: "nature_frontiers_facebook",
    publishingEnabled: false
  }));
  assert.throws(
    () => generateDailyFacebookDraft({ date: "2030-10-25", outputDir: root, now: "2030-10-24T05:30:00.000Z" }),
    /research-only safety schema; refusing to overwrite/i
  );

  fs.rmSync(file);
  const generated = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: root, now: "2030-10-24T05:30:00.000Z"
  });
  const tampered = { ...generated.package, publishReady: true };
  fs.writeFileSync(file, JSON.stringify(tampered));
  assert.throws(
    () => generateDailyFacebookDraft({ date: "2030-10-25", outputDir: root, now: "2030-10-24T06:00:00.000Z" }),
    /research-only safety schema; refusing to overwrite/i
  );
});


test("cross-run history accepts only matching research-only artifact identities", () => {
  const valid = {
    schemaVersion: 1,
    id: "nature-frontiers-daily-2030-10-25",
    date: "2030-10-25",
    destination: "nature_frontiers_facebook",
    destinationPageId: null,
    timezone: "Africa/Johannesburg",
    proposedPublicationTime: "08:00",
    experiment: { slot: "08:00" },
    publishReady: false,
    publishingEnabled: false,
    media: null,
    rightsEvidence: null,
    blockers: ["research", "rights", "page verification", "human review"],
    factualClaims: []
  };
  assert.deepEqual(validateFacebookHistoryPackage(valid, "2030-10-25"), valid);
  assert.throws(() => validateFacebookHistoryPackage({ ...valid, publishReady: true }, "2030-10-25"), /draft-only/i);
  assert.throws(() => validateFacebookHistoryPackage({ ...valid, destination: "sonicvhibez_youtube" }, "2030-10-25"), /destination\/timezone/i);
  assert.throws(() => validateFacebookHistoryPackage(valid, "2030-10-26"), /identity/i);
});


test("cross-run history restoration downloads, validates and persists a retained draft through injected GitHub API", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-history-fixture-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const draftDir = path.join(root, "drafts");
  const generated = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: draftDir, now: "2030-10-24T05:30:00.000Z"
  });
  const archivePath = path.join(root, "fixture.zip");
  execFileSync("zip", ["-q", archivePath, "2030-10-25.json"], { cwd: draftDir });
  const archive = fs.readFileSync(archivePath);
  const outputPath = path.join(root, "history.json");
  const api = "https://api.github.test";
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    assert.equal(options.headers.authorization, "Bearer test-token");
    if (url.startsWith(api + "/repos/clickerrish-art/YT-AUTO-VISE/actions/artifacts?")) {
      return new Response(JSON.stringify({ artifacts: [{
        id: 12345, name: "nature-frontiers-facebook-draft-12345", expired: false,
        created_at: "2030-10-24T05:00:00Z", workflow_run: { id: 1234 }
      }] }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url === api + "/repos/clickerrish-art/YT-AUTO-VISE/actions/artifacts/12345/zip") {
      return new Response(archive, { status: 200, headers: { "content-type": "application/zip" } });
    }
    throw new Error("Unexpected URL: " + url);
  };
  const result = await restoreFacebookDraftHistory({
    now: new Date("2030-10-24T06:00:00Z"), fetchImpl,
    tempDir: path.join(root, "work"), outputPath,
    repository: "clickerrish-art/YT-AUTO-VISE", token: "test-token",
    apiBase: api, currentRunId: "9999"
  });
  assert.equal(result.count, 1);
  assert.deepEqual(result.dates, ["2030-10-25"]);
  assert.deepEqual(JSON.parse(fs.readFileSync(outputPath, "utf8")), [generated.package]);
  assert.equal(calls.length, 2);
});

test("cross-run history restoration fails closed on malformed archive and leaves no history file", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-history-invalid-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const outputPath = path.join(root, "history.json");
  const api = "https://api.github.test";
  const fetchImpl = async url => url.includes("/actions/artifacts?")
    ? new Response(JSON.stringify({ artifacts: [{
        id: 12346, name: "nature-frontiers-facebook-draft-12346", expired: false,
        created_at: "2030-10-24T05:00:00Z", workflow_run: { id: 1234 }
      }] }), { status: 200 })
    : new Response("not a zip archive", { status: 200 });
  await assert.rejects(() => restoreFacebookDraftHistory({
    now: new Date("2030-10-24T06:00:00Z"), fetchImpl,
    tempDir: path.join(root, "work"), outputPath,
    repository: "clickerrish-art/YT-AUTO-VISE", token: "test-token",
    apiBase: api, currentRunId: "9999"
  }));
  assert.equal(fs.existsSync(outputPath), false);
});

test("cross-run history rejects insecure API origins and oversized archive responses", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-history-size-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const base = {
    now: new Date("2030-10-24T06:00:00Z"),
    tempDir: path.join(root, "work"), outputPath: path.join(root, "history.json"),
    repository: "clickerrish-art/YT-AUTO-VISE", token: "test-token", currentRunId: "9999"
  };
  await assert.rejects(() => restoreFacebookDraftHistory({
    ...base, apiBase: "http://api.github.test",
    fetchImpl: async () => { throw new Error("fetch must not run for invalid configuration"); }
  }), /HTTPS/i);
  const api = "https://api.github.test";
  await assert.rejects(() => restoreFacebookDraftHistory({
    ...base, apiBase: api,
    fetchImpl: async url => url.includes("/actions/artifacts?")
      ? new Response(JSON.stringify({ artifacts: [{
          id: 12347, name: "nature-frontiers-facebook-draft-12347", expired: false,
          created_at: "2030-10-24T05:00:00Z", workflow_run: { id: 1234 }
        }] }))
      : new Response("x".repeat(1024), { status: 200, headers: { "content-length": String(20 * 1024 * 1024) } })
  }), /size limit/i);
});


test("daily generator reuses the exact retained same-day artifact instead of generating a duplicate", (t) => {
  const firstDir = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-first-"));
  const secondDir = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-second-"));
  t.after(() => fs.rmSync(firstDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(secondDir, { recursive: true, force: true }));
  const first = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: firstDir, now: "2030-10-24T05:30:00.000Z"
  });
  const second = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: secondDir, now: "2030-10-24T06:30:00.000Z",
    existingDrafts: [first.package]
  });
  assert.equal(second.created, false);
  assert.equal(second.reason, "IDEMPOTENT_RETAINED_HISTORY_REUSED");
  assert.deepEqual(second.package, first.package);
  assert.deepEqual(JSON.parse(fs.readFileSync(second.path, "utf8")), first.package);
});

test("daily generator refuses conflicting retained artifacts for the same local date", (t) => {
  const firstDir = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-conflict-a-"));
  const secondDir = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-daily-conflict-b-"));
  t.after(() => fs.rmSync(firstDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(secondDir, { recursive: true, force: true }));
  const first = generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: firstDir, now: "2030-10-24T05:30:00.000Z"
  });
  const conflict = { ...first.package, generatedAt: "2030-10-24T06:30:00.000Z" };
  assert.throws(() => generateDailyFacebookDraft({
    date: "2030-10-25", outputDir: secondDir, now: "2030-10-24T06:30:00.000Z",
    existingDrafts: [first.package, conflict]
  }), /conflicting cross-run drafts/i);
});


test("cross-run history refuses a truncated 500-artifact listing instead of risking duplicate drafts", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "facebook-history-pagination-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const api = "https://api.github.test";
  const calls = [];
  const fetchImpl = async url => {
    calls.push(url);
    const match = /[?&]page=(\d+)/.exec(url);
    if (!match) throw new Error("archive download must not begin from incomplete history");
    return new Response(JSON.stringify({
      artifacts: Array.from({ length: 100 }, (_, index) => ({
        id: (Number(match[1]) - 1) * 100 + index + 1,
        name: "nature-frontiers-facebook-draft-fixture",
        expired: false,
        created_at: "2030-10-24T05:00:00Z",
        workflow_run: { id: 1234 }
      }))
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  await assert.rejects(() => restoreFacebookDraftHistory({
    now: new Date("2030-10-24T06:00:00Z"), fetchImpl,
    tempDir: path.join(root, "work"), outputPath: path.join(root, "history.json"),
    repository: "clickerrish-art/YT-AUTO-VISE", token: "test-token",
    apiBase: api, currentRunId: "9999"
  }), /500-item safety limit; refusing incomplete history/i);
  assert.equal(calls.length, 5, "must stop at the bounded listing limit");
  assert.equal(fs.existsSync(path.join(root, "history.json")), false);
});
