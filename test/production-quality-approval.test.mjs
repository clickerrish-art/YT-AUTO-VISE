import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateProductionQualityApproval, validateProductionQualityApprovalFile } from "../scripts/production-quality-approval.mjs";
import { PRODUCTION_QUALITY_DIMENSIONS, PRODUCTION_QUALITY_CRITICAL_GATES, qualityScorecardSha256 } from "../scripts/production-quality-scorecard.mjs";

const hash = value => crypto.createHash("sha256").update(value).digest("hex");
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "production-quality-approval-"));
  const write = (name, data) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, data);
    return { path: name, sha256: hash(data) };
  };
  const video = write("media/final.mp4", "final-video-bytes");
  const metadata = write("content/metadata.json", "{\"channel\":\"SonicVhibez\"}");
  const thumbnail = write("media/thumbnail.jpg", "thumbnail-bytes");
  const captions = write("content/captions.srt", "caption-bytes");
  const narration = write("audio/narration.mp3", "narration-bytes");
  const relatedArtifacts = [video, metadata, thumbnail, captions, narration];
  const qualityScorecard = {
    policyId: "SV-PQS-001", decision: "APPROVED", reviewer: "Human Reviewer",
    reviewedAt: new Date().toISOString(), fullVideoPlayback: true,
    fullPlaybackEvidenceRef: "review/full-playback", thumbnailInspectedAtMobile: true,
    thumbnailInspectedAtDesktop: true, imageInspectionEvidenceRef: "review/image-inspection",
    factualEditorialEvidenceRef: "review/factual-editorial",
    scores: Object.fromEntries(PRODUCTION_QUALITY_DIMENSIONS.map(key => [key, 90])),
    criticalGates: Object.fromEntries(PRODUCTION_QUALITY_CRITICAL_GATES.map(key => [key, true])),
    artifactHashes: { video: video.sha256, metadata: metadata.sha256, thumbnail: thumbnail.sha256,
      images: [thumbnail.sha256], captions: captions.sha256, narration: narration.sha256 }
  };
  const technicalValidationReceipt = {
    passed: true,
    checkedAt: new Date().toISOString(),
    metadataVersion: metadata.sha256,
    captionsPath: captions.path,
    captionsSha256: captions.sha256,
    artifacts: [{ ...video, durationSeconds: 55, width: 1080, height: 1920 }],
    thumbnail: { ...thumbnail, width: 1280, height: 720 },
    checks: [
      "metadata-sha256", "caption-structure", "mp4-sha256", "ffprobe-duration",
      "orientation", "audio-stream", "thumbnail-sha256", "thumbnail-dimensions"
    ]
  };
  const rightsEvidence = { assets: [{ permittedUses: ["YouTube"], verificationStatus: "VERIFIED" }] };
  const approval = {
    decision: "APPROVE", publishingEnabled: false, visibility: "private", reviewer: "Human Reviewer",
    artifactSha256: video.sha256, metadataVersion: metadata.sha256,
    qualityScorecard, qualityScorecardSha256: qualityScorecardSha256(qualityScorecard),
    technicalValidationReceipt, technicalValidationSha256: hash(JSON.stringify(technicalValidationReceipt)),
    rightsEvidence, rightsEvidenceSha256: hash(JSON.stringify(rightsEvidence)), relatedArtifacts
  };
  const approvalPath = path.join(root, "run-logs/approval.json");
  fs.mkdirSync(path.dirname(approvalPath), { recursive: true });
  fs.writeFileSync(approvalPath, JSON.stringify(approval));
  return { root, video, metadata, approval, approvalPath, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test("accepts a current human approval bound to the exact export, metadata and every related artifact", () => {
  const f = fixture();
  try {
    assert.deepEqual(validateProductionQualityApproval(f.approval, {
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root
    }), []);
    assert.equal(validateProductionQualityApprovalFile({ approvalPath: path.relative(f.root, f.approvalPath),
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root }).valid, true);
  } finally { f.cleanup(); }
});

test("rejects missing approval, changed export, changed metadata, stale scorecard checksum and related-file tampering", () => {
  const f = fixture();
  try {
    assert.match(validateProductionQualityApproval(null).join(" "), /approval record is required/);
    fs.appendFileSync(path.join(f.root, f.video.path), "tampered");
    assert.match(validateProductionQualityApproval(f.approval, {
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root
    }).join(" "), /video hash does not match/);
    fs.writeFileSync(path.join(f.root, f.video.path), "final-video-bytes");
    fs.appendFileSync(path.join(f.root, f.metadata.path), "tampered");
    assert.match(validateProductionQualityApproval(f.approval, {
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root
    }).join(" "), /metadata hash does not match/);
    fs.writeFileSync(path.join(f.root, f.metadata.path), "{\"channel\":\"SonicVhibez\"}");
    f.approval.qualityScorecard.scores.visualClarity = 79;
    assert.match(validateProductionQualityApproval(f.approval, {
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root
    }).join(" "), /scorecard checksum/);
    f.approval.qualityScorecard.scores.visualClarity = 90;
    f.approval.qualityScorecardSha256 = qualityScorecardSha256(f.approval.qualityScorecard);
    fs.appendFileSync(path.join(f.root, "audio/narration.mp3"), "changed");
    assert.match(validateProductionQualityApproval(f.approval, {
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root
    }).join(" "), /related-artifact bytes changed/);
  } finally { f.cleanup(); }
});

test("requires private-only release state and an exact technical-validation receipt", () => {
  const f = fixture();
  try {
    f.approval.publishingEnabled = true;
    f.approval.technicalValidationReceipt.passed = false;
    const errors = validateProductionQualityApproval(f.approval, {
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root
    });
    assert.match(errors.join(" "), /private visibility/);
    assert.match(errors.join(" "), /technical-validation receipt/);
  } finally { f.cleanup(); }
});
test("rejects a technical receipt that is checksummed but belongs to different export or metadata bytes", () => {
  const f = fixture();
  try {
    f.approval.technicalValidationReceipt.artifacts[0].sha256 = hash("different-video");
    f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
    let errors = validateProductionQualityApproval(f.approval, {
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root
    });
    assert.match(errors.join(" "), /technical-validation receipt must contain the exact final export/);

    f.approval.technicalValidationReceipt.artifacts[0].sha256 = f.video.sha256;
    f.approval.technicalValidationReceipt.metadataVersion = hash("different-metadata");
    f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
    errors = validateProductionQualityApproval(f.approval, {
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root
    });
    assert.match(errors.join(" "), /receipt metadata hash does not match/);
  } finally { f.cleanup(); }
});

test("requires the technical receipt to bind the exact captions, thumbnail and full required check set", () => {
  const f = fixture();
  try {
    f.approval.technicalValidationReceipt.captionsSha256 = hash("different-captions");
    f.approval.technicalValidationReceipt.thumbnail.sha256 = hash("different-thumbnail");
    f.approval.technicalValidationReceipt.checks = ["mp4-sha256"];
    f.approval.technicalValidationSha256 = hash(JSON.stringify(f.approval.technicalValidationReceipt));
    const errors = validateProductionQualityApproval(f.approval, {
      videoPath: f.video.path, metadataPath: f.metadata.path, rootDir: f.root
    });
    assert.match(errors.join(" "), /exact reviewed captions/);
    assert.match(errors.join(" "), /exact 1280x720 reviewed thumbnail/);
    assert.match(errors.join(" "), /missing one or more required export/);
  } finally { f.cleanup(); }
});
test("Short and long-form renderers require exact final approval for release and label unapproved renders provisional", () => {
  for (const renderer of ["scripts/render-short.mjs", "scripts/render-long-form.mjs"]) {
    const source = fs.readFileSync(renderer, "utf8");
    assert.match(source, /validate-production-quality-approval\.mjs/);
    assert.match(source, /if \(m\.productionQualityApprovalPath !== undefined\)/);
    assert.match(source, /productionQualityApprovalPath and metadataPath must both identify the exact reviewed release package/);
    assert.match(source, /spawnSync\(process\.execPath, \[releaseValidatorPath, output, metadataPath, approvalPath\]/);
    assert.match(source, /FINAL QUALITY RELEASE VALIDATED/);
    assert.match(source, /PROVISIONAL RENDER COMPLETE/);
    assert.match(source, /NOT approved for release/);
    assert.match(source, /No upload or publishing action was performed/);
  }
});

test("production readiness requires the same exact-hash quality approval gate as private upload", () => {
  const source = fs.readFileSync("scripts/production-readiness.mjs", "utf8");
  assert.match(source, /validateProductionQualityApprovalFile/);
  assert.match(source, /UPLOAD_APPROVAL_PATH/);
  assert.match(source, /if \(!qualityApproval\.valid\)/);
  assert.match(source, /Production quality approval gate/);
  assert.match(source, /Exact-hash-bound human production quality approval is missing/);
});
