import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const SHA256 = /^[a-f0-9]{64}$/;
const JOB_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const OUTPUT_NAMES = ["narration.mp3", "narration.txt", "captions.srt", "narration-report.json"];

function stableStringify(value) {
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

export function canonicalAuthoringScriptSha256(script) {
  if (!script || typeof script !== "object" || Array.isArray(script)) throw new Error("Generated script must be an object");
  return crypto.createHash("sha256").update(stableStringify(script), "utf8").digest("hex");
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function assertRealDirectory(dir, label) {
  if (fs.existsSync(dir)) {
    const stat = fs.lstatSync(dir);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(label + " must be a real directory, not a symlink or special file");
  } else {
    fs.mkdirSync(dir);
    const stat = fs.lstatSync(dir);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(label + " could not be safely created");
  }
}

function assertRegularFile(file, label) {
  const stat = fs.lstatSync(file);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(label + " must be a regular file, not a symlink or special file");
  if (stat.size <= 0) throw new Error(label + " is empty");
}

export function validateNarrationStageArtifacts({ report, scriptSha256, format, outputDir }) {
  const errors = [];
  const durationRange = format === "short" ? [50, 60] : format === "long_form" ? [360, 600] : null;
  if (!durationRange) errors.push("format must be short or long_form");
  if (!report || typeof report !== "object" || Array.isArray(report)) return ["narration report must be a JSON object"];
  if (report.format !== format) errors.push("narration report format does not match the job");
  if (report.scriptSha256 !== scriptSha256 || !SHA256.test(report.scriptSha256 ?? "")) errors.push("narration report is not bound to the approved script SHA-256");
  if (report.status !== "DRAFT_REVIEW_REQUIRED") errors.push("narration must remain a draft pending human review");
  if (report.humanReviewRequired !== true) errors.push("narration must explicitly require human review");
  if (report.publishingEnabled !== false) errors.push("narration stage must not enable publishing");
  if (report.rightsStatus !== "NOT_VERIFIED") errors.push("narration rights must remain unverified until separately reviewed");
  if (report.captionTiming !== "TTS_WORD_BOUNDARIES" || !Number.isInteger(report.wordBoundaryCount) || report.wordBoundaryCount < 1) errors.push("captions must use verified TTS word-boundary timings");
  if (!Number.isFinite(report.durationSeconds) || (durationRange && (report.durationSeconds < durationRange[0] || report.durationSeconds > durationRange[1]))) errors.push("measured narration duration is outside the required format range");
  const expected = [
    ["narration.mp3", report.audioSha256, "audio"],
    ["narration.txt", report.transcriptSha256, "transcript"],
    ["captions.srt", report.captionsSha256, "captions"]
  ];
  for (const [name, digest, label] of expected) {
    try {
      const file = path.join(outputDir, name);
      assertRegularFile(file, label);
      if (!SHA256.test(digest ?? "") || sha256File(file) !== digest) errors.push(label + " checksum does not match the narration report");
    } catch (error) {
      errors.push(error instanceof Error ? error.message : label + " artifact is missing");
    }
  }
  return errors;
}

/**
 * Generate narration for an explicitly script-approved job.
 * This stage deliberately does not approve rights, assets, visual realism or publication.
 */
export function runAuthoringNarrationStage({
  job, root, spawnSyncImpl = spawnSync, pythonExecutable = process.env.PYTHON ?? "python3",
  voice = "en-US-GuyNeural", rate = "-5%", timeoutMs = 180_000
}) {
  if (!job || job.kind !== "CONTENT_PRODUCTION" || !JOB_ID.test(job.id ?? "")) throw new Error("A valid persisted content-production job ID is required");
  if (!["short", "long_form"].includes(job.contentType)) throw new Error("Unsupported content format");
  const script = job.authoring?.result?.script;
  if (!script || typeof script !== "object" || Array.isArray(script)) throw new Error("Generated structured script is missing");
  const scriptSha256 = canonicalAuthoringScriptSha256(script);
  const approval = job.authoring?.scriptApproval;
  if (!approval || approval.decision !== "APPROVE" || approval.scriptSha256 !== scriptSha256 ||
      typeof approval.reviewer !== "string" || approval.reviewer.trim().length < 2 ||
      typeof approval.reviewedAt !== "string" || !Number.isFinite(Date.parse(approval.reviewedAt))) {
    throw new Error("A current human script approval bound to the exact script SHA-256 is required before narration");
  }
  const projectRoot = path.resolve(root);
  const mediaRoot = path.join(projectRoot, "media");
  const base = path.join(mediaRoot, "generated-authoring");
  if (fs.existsSync(mediaRoot) && (fs.lstatSync(mediaRoot).isSymbolicLink() || !fs.lstatSync(mediaRoot).isDirectory())) throw new Error("media directory must not be a symlink or special file");
  if (!fs.existsSync(mediaRoot)) fs.mkdirSync(mediaRoot);
  assertRealDirectory(base, "generated-authoring directory");
  const outputDir = path.join(base, job.id + "-" + scriptSha256.slice(0, 12));
  assertRealDirectory(outputDir, "job-specific narration output directory");
  const scriptFile = path.join(outputDir, "approved-script.json");
  const payload = JSON.stringify({ result: script }, null, 2) + "\n";
  if (fs.existsSync(scriptFile)) {
    assertRegularFile(scriptFile, "approved script");
    if (fs.readFileSync(scriptFile, "utf8") !== payload) throw new Error("Existing script payload differs; recovery is required and files will not be overwritten");
  } else {
    fs.writeFileSync(scriptFile, payload, { flag: "wx", mode: 0o600 });
  }
  const reportPath = path.join(outputDir, "narration-report.json");
  const present = OUTPUT_NAMES.filter(name => fs.existsSync(path.join(outputDir, name)));
  if (present.length === OUTPUT_NAMES.length) {
    assertRegularFile(reportPath, "narration report");
    let report;
    try { report = JSON.parse(fs.readFileSync(reportPath, "utf8")); } catch { throw new Error("Existing narration report is invalid; recovery is required"); }
    const errors = validateNarrationStageArtifacts({ report, scriptSha256, format: job.contentType, outputDir });
    if (errors.length) throw new Error("Existing narration artifacts failed reconciliation: " + errors.join("; "));
    return narrationStageResult(job, outputDir, report, scriptSha256, true, projectRoot);
  }
  if (present.length > 0) throw new Error("Partial narration artifacts exist without a complete report; mark RECOVERY_REQUIRED and reconcile before retrying");
  const generator = path.join(projectRoot, "scripts", "generate-authoring-narration.py");
  assertRegularFile(generator, "narration generator");
  const result = spawnSyncImpl(pythonExecutable, [generator, "--script-json", scriptFile, "--format", job.contentType, "--output-dir", outputDir, "--voice", voice, "--rate", rate], {
    cwd: projectRoot, encoding: "utf8", timeout: timeoutMs, maxBuffer: 2 * 1024 * 1024, windowsHide: true
  });
  if (result?.error || result?.status !== 0) {
    const detail = String(result?.stderr || result?.stdout || result?.error?.message || "narration generator exited unsuccessfully").slice(-1200);
    throw new Error("Narration generation failed closed: " + detail);
  }
  assertRegularFile(reportPath, "narration report");
  let report;
  try { report = JSON.parse(fs.readFileSync(reportPath, "utf8")); } catch { throw new Error("Narration generator produced an invalid report"); }
  const errors = validateNarrationStageArtifacts({ report, scriptSha256, format: job.contentType, outputDir });
  if (errors.length) throw new Error("Narration stage validation failed: " + errors.join("; "));
  return narrationStageResult(job, outputDir, report, scriptSha256, false, projectRoot);
}

function narrationStageResult(job, outputDir, report, scriptSha256, reused, root) {
  const paths = {};
  for (const name of OUTPUT_NAMES) {
    const file = path.join(outputDir, name);
    assertRegularFile(file, name);
    paths[name] = { path: path.relative(root, file).split(path.sep).join("/"), sha256: sha256File(file) };
  }
  return {
    status: "NARRATION_DRAFT_READY",
    contentJobId: job.id,
    contentFormat: job.contentType,
    scriptSha256,
    narrationReport: report,
    artifacts: paths,
    reused,
    humanReviewRequired: true,
    rightsStatus: "NOT_VERIFIED",
    publishable: false,
    publishingEnabled: false,
    nextAction: "Human-review the narration transcript, pronunciation, factual wording, and timing; then supply independently approved source assets, provenance, scene plan and rights evidence before rendering."
  };
}
