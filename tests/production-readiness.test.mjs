import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

test("readiness report identifies blockers, preserves safety defaults, and exits non-zero", () => {
  const env = { ...process.env };
  for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) delete env[key];
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.equal(result.status, 2);
  assert.match(result.stdout, /SonicVhibez production readiness/);
  assert.match(result.stdout, /LIVE BLOCKER: complete SonicVhibez public, private and unlisted history/);
  assert.match(result.stdout, /HOLD:/);
  assert.match(result.stdout, /public publishing disabled/);
  assert.match(result.stdout, /content\/render-manifest\.json/);
  assert.match(result.stdout, /long-form-render-manifest/);
  assert.match(result.stdout, /Metadata complianceReviewed must be true/);
  assert.doesNotMatch(result.stdout, /Metadata needs the verified SonicVhibez YouTube channel ID/);
  assert.match(result.stdout, /SONICVHIBEZ_CHANNEL_ID/);
  assert.match(result.stdout, /YOUTUBE_CLIENT_ID/);
  assert.match(result.stdout, /never uploads, schedules, or publishes/i);
});

test("readiness JSON exposes stable blocker IDs, severity, evidence and actionable resolution without side effects", () => {
  const env = { ...process.env };
  for (const key of ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SONICVHIBEZ_CHANNEL_ID"]) delete env[key];
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    cwd: process.cwd(), env, encoding: "utf8"
  });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.equal(report.application, "SonicVhibez Marketing Machine");
  assert.equal(report.mode, "read-only");
  assert.equal(report.status, "blocked");
  assert.ok(report.blockerCount > 0);
  assert.equal(report.blockers.length, report.blockerCount);
  for (const blocker of report.blockers) {
    assert.match(blocker.id, /^RDY-[A-F0-9]{12}$/);
    assert.ok(["critical", "high"].includes(blocker.severity));
    assert.equal(typeof blocker.message, "string");
    assert.ok(["readiness-check-finding", "repository-path-check", "environment-presence-check", "external-reconciliation-required"].includes(blocker.evidence.kind));
    assert.equal(typeof blocker.evidence.observed, "string");
    assert.ok(["external_owner_or_human_reviewer", "shared_code_and_owner", "maintainer_code_or_configuration"].includes(blocker.controlOwner));
    assert.ok(blocker.resolution.length > 20);
  }
  assert.ok(report.blockers.some(blocker => /SonicVhibez public, private and unlisted history/.test(blocker.message)));
  assert.ok(report.limitations.some(item => /never uploads/.test(item)));
});



test("readiness JSON distinguishes external reconciliation from code-controlled findings", () => {
  const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
    cwd: process.cwd(), encoding: "utf8",
    env: { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "", SONICVHIBEZ_CHANNEL_ID: "" }
  });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.ok(report.blockers.some(blocker =>
    blocker.evidence.kind === "external-reconciliation-required" &&
    blocker.controlOwner === "external_owner_or_human_reviewer" &&
    /does not independently fetch remote YouTube history/.test(blocker.evidence.observed)
  ));
  assert.ok(report.blockers.some(blocker =>
    blocker.evidence.kind === "environment-presence-check" &&
    /secret values are never included/.test(blocker.evidence.observed)
  ));
  const cadence = report.blockers.find(blocker => /CADENCE DECISION REQUIRED/.test(blocker.message));
  assert.equal(cadence.evidence.kind, "repository-path-check");
  assert.equal(cadence.evidence.path, "config/weekly-content-plan.json");
  assert.match(cadence.resolution, /feasible owner-approved cadence/i);
  assert.match(cadence.resolution, /72-hour minimum spacing/i);
  assert.match(cadence.resolution, /timezone-aware timestamp/i);
  assert.doesNotMatch(cadence.resolution, /inspect the final media/i);
  assert.equal(report.blockers.some(blocker => /Metadata needs the verified SonicVhibez YouTube channel ID/.test(blocker.message)), false);
  assert.ok(report.blockers.some(blocker => /SONICVHIBEZ_CHANNEL_ID/.test(blocker.message)), "the secure OAuth environment binding remains an owner-controlled gate");
});

test("readiness workflow compares retained exit-code evidence and avoids false mismatches from missing step outputs", () => {
  const workflowPath = fileURLToPath(new URL("../.github/workflows/production-readiness.yml", import.meta.url));
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /readiness-report\/exit-codes\.txt/);
  assert.match(workflow, /readiness_status=\$\(sed -n '1p' readiness-report\/exit-codes\.txt\)/);
  assert.match(workflow, /json_status=\$\(sed -n '2p' readiness-report\/exit-codes\.txt\)/);
  assert.ok(workflow.includes("printf '%s\\n%s\\n'"));
  assert.match(workflow, /Production readiness is BLOCKED/);
  assert.doesNotMatch(workflow, /READINESS_EXIT_CODE:-2|READINESS_JSON_EXIT_CODE:-3/);
});


test("readiness evidence redacts absolute external queue paths", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "readiness-queue-"));
  const queueFile = path.join(directory, "queue.json");
  fs.writeFileSync(queueFile, "{ malformed json");
  try {
    const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
      cwd: process.cwd(), encoding: "utf8",
      env: { ...process.env, QUEUE_PATH: queueFile }
    });
    assert.equal(result.status, 2);
    const report = JSON.parse(result.stdout);
    const queueBlocker = report.blockers.find(blocker => /content\/queue\.json is not valid JSON/.test(blocker.message));
    assert.ok(queueBlocker);
    assert.equal(queueBlocker.evidence.path, "configured QUEUE_PATH (absolute path withheld)");
    assert.equal(JSON.stringify(queueBlocker.evidence).includes(directory), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("readiness never accepts an owner-approved cadence that weakens the 72-hour publication invariant", () => {
  const readinessPath = fileURLToPath(new URL("../scripts/production-readiness.mjs", import.meta.url));
  const schedulePath = fileURLToPath(new URL("../config/weekly-content-plan.json", import.meta.url));
  const readiness = fs.readFileSync(readinessPath, "utf8");
  const schedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));

  const schedulePolicyPath = fileURLToPath(new URL("../scripts/schedule-policy.mjs", import.meta.url));
  const schedulePolicy = fs.readFileSync(schedulePolicyPath, "utf8");
  assert.match(readiness, /validateCadenceDecision\(schedule\.cadenceDecision, minimumSpacingHours\)/);
  assert.match(schedulePolicy, /minimumSpacingHours < 72/);
  assert.doesNotMatch(readiness, /WEEKLY_TARGET_WITH_SHORTER_SPACING/);
  assert.equal(schedule.minimumPublicationSpacingHours, 72);
  assert.equal(schedule.publicationCycle.minimumHoursBetweenConsecutivePublications, 72);
  assert.equal(schedule.publicationCycle.minimumCycleHours, 216);
  assert.ok(!schedule.cadenceDecision.options.includes("WEEKLY_TARGET_WITH_SHORTER_SPACING"));
});


test("readiness rejects valid JSON roots that are not objects for every required config artifact", () => {
  const sourceRoot = process.cwd();
  const cases = [
    ["content/queue.json", "Queue must be a JSON object with an items array"],
    ["content/render-manifest.json", "content/render-manifest.json must contain a JSON object"],
    ["content/long-form-render-manifest.json", "content/long-form-render-manifest.json must contain a JSON object"],
    ["content/next-short.json", "content/next-short.json must contain a JSON object"]
  ];
  for (const [targetPath, expected] of cases) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "readiness-json-root-"));
    try {
      for (const relative of ["scripts", "config", "content"]) fs.mkdirSync(path.join(directory, relative), { recursive: true });
      for (const relative of ["scripts/production-readiness.mjs", "scripts/product-promotion-gate.mjs", "scripts/schedule-policy.mjs", "scripts/safe-project-file.mjs", "config/products.json", "config/weekly-content-plan.json", "content/queue.json"]) {
        fs.copyFileSync(path.join(sourceRoot, relative), path.join(directory, relative));
      }
      fs.writeFileSync(path.join(directory, targetPath), "null\n");
      const env = { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "", SONICVHIBEZ_CHANNEL_ID: "" };
      delete env.QUEUE_PATH;
      const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
        cwd: directory, env, encoding: "utf8"
      });
      assert.equal(result.status, 2, targetPath);
      const report = JSON.parse(result.stdout);
      assert.ok(report.blockers.some(blocker => blocker.message.includes(expected)), targetPath);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
});


test("readiness reports malformed render-manifest asset paths without crashing JSON diagnostics", () => {
  const sourceRoot = process.cwd();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "readiness-manifest-path-"));
  try {
    for (const relative of ["scripts", "config", "content", "media"]) fs.mkdirSync(path.join(directory, relative), { recursive: true });
    for (const relative of ["scripts/production-readiness.mjs", "scripts/product-promotion-gate.mjs", "scripts/schedule-policy.mjs", "scripts/safe-project-file.mjs", "config/products.json", "config/weekly-content-plan.json", "content/queue.json", "content/next-short.json"]) {
      fs.copyFileSync(path.join(sourceRoot, relative), path.join(directory, relative));
    }
    fs.writeFileSync(path.join(directory, "content/long-form-render-manifest.json"), JSON.stringify({
      channel: "SonicVhibez",
      targetAspectRatio: "16:9",
      title: "Fixture long-form title",
      footagePath: "missing-long-form-footage.mp4",
      narrationPath: "missing-long-form-narration.mp3",
      captionsPath: "missing-long-form-captions.srt",
      footageLicenseEvidence: "pending fixture evidence",
      narrationLicenseEvidence: "pending fixture evidence",
      rightsConfirmed: false,
      complianceReviewed: false,
      containsSyntheticMedia: false,
      hasPaidPromotion: false
    }));
    fs.writeFileSync(path.join(directory, "content/render-manifest.json"), JSON.stringify({
      channel: "SonicVhibez",
      footagePath: { unexpected: "object" },
      narrationPath: 42,
      captionsPath: null,
      footageLicenseEvidence: "evidence reference pending review",
      narrationLicenseEvidence: "evidence reference pending review",
      rightsConfirmed: false,
      complianceReviewed: false
    }));
    const env = { ...process.env, YOUTUBE_CLIENT_ID: "", YOUTUBE_CLIENT_SECRET: "", YOUTUBE_REFRESH_TOKEN: "", SONICVHIBEZ_CHANNEL_ID: "" };
    delete env.QUEUE_PATH;
    const result = spawnSync(process.execPath, ["scripts/production-readiness.mjs", "--json"], {
      cwd: directory, env, encoding: "utf8"
    });
    assert.equal(result.status, 2);
    const report = JSON.parse(result.stdout);
    assert.ok(report.blockers.some(blocker => blocker.message.includes("Manifest asset footagePath must be a non-empty relative path string.")));
    assert.ok(report.blockers.some(blocker => blocker.message.includes("Manifest asset narrationPath must be a non-empty relative path string.")));
    assert.ok(report.blockers.some(blocker => blocker.message.includes("Manifest asset captionsPath must be a non-empty relative path string.")));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
