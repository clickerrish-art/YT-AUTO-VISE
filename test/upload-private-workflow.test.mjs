import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/upload-private.yml", "utf8");
const readOnlyJob = workflow.split("  verify-channel-read-only:", 2)[1]?.split("  private-upload:", 1)[0] ?? "";
const privateUploadJob = workflow.split("  private-upload:", 2)[1] ?? "";

test("read-only channel verification can be dispatched without media or approval inputs", () => {
  for (const input of ["metadata_path", "video_path", "job_id", "approval_path", "one_shot_authorization_path"]) {
    const block = workflow.split(`      ${input}:\n`, 2)[1]?.split(/\n      [a-z_]+:\n/, 1)[0] ?? "";
    assert.notEqual(block, "", `workflow input ${input} exists`);
    assert.match(block, /required: false/, `${input} is optional at dispatch`);
  }
  assert.ok(readOnlyJob.includes("if: ${{ inputs.confirm_private_upload != 'YES' }}"));
  assert.ok(readOnlyJob.includes("node scripts/verify-youtube-channel.mjs"));
  assert.ok(!readOnlyJob.includes("node scripts/upload-private.mjs"));
});

test("explicit private upload validates all artifact-bound inputs before ledger restore or uploader execution", () => {
  assert.match(workflow, /confirm_private_upload:\s+description:[\s\S]*?required: true\s+default: 'NO'/);
  assert.ok(privateUploadJob.includes("if: ${{ inputs.confirm_private_upload == 'YES' }}"));
  const guard = privateUploadJob.indexOf("Require exact upload inputs before any private-upload work");
  const ledger = privateUploadJob.indexOf("Validate previous upload ledger against executed private-upload jobs");
  const uploader = privateUploadJob.indexOf("node scripts/upload-private.mjs");
  assert.ok(guard >= 0 && ledger > guard && uploader > ledger, "upload input guard precedes ledger handling and uploader");
  assert.ok(privateUploadJob.includes("node scripts/validate-upload-ledger-run.mjs"));
  for (const variable of ["METADATA_PATH", "VIDEO_PATH", "JOB_ID", "APPROVAL_PATH", "AUTHORIZATION_PATH"]) {
    assert.ok(privateUploadJob.includes(variable), `${variable} is validated in the private-upload job`);
  }
  assert.ok(privateUploadJob.includes("A-Za-z0-9][A-Za-z0-9:_-]{2,119}"));
  assert.ok(privateUploadJob.includes("CONFIRM_PRIVATE_UPLOAD: ${{ inputs.confirm_private_upload }}"));
  assert.ok(privateUploadJob.includes("YOUTUBE_EMERGENCY_STOP: ${{ inputs.confirm_emergency_stop_release == 'YES'"));
});

test("workflow keeps the emergency stop default engaged and private upload explicitly opt-in", () => {
  assert.match(workflow, /confirm_emergency_stop_release:\s+description:[\s\S]*?required: true\s+default: 'NO'/);
  assert.ok(workflow.includes("group: sonicvhibez-private-upload"));
  assert.ok(workflow.includes("cancel-in-progress: false"));
});

test("both private-upload entry points validate actual prior upload jobs instead of counting read-only dispatches", () => {
  const artifactWorkflow = fs.readFileSync(".github/workflows/upload-artifact-privately.yml", "utf8");
  for (const candidate of [workflow, artifactWorkflow]) {
    assert.ok(candidate.includes("node scripts/validate-upload-ledger-run.mjs"));
    assert.ok(candidate.includes("Latest prior run that actually executed private-upload"));
    assert.ok(!candidate.includes("Refuse ledger bypass after any prior manual upload run"));
  }
});
