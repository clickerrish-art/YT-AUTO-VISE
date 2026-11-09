import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/upload-private.yml", "utf8");
const readOnlyJob = workflow.split("  verify-channel-read-only:", 2)[1]?.split("  private-upload:", 1)[0] ?? "";
const privateUploadJob = workflow.split("  private-upload:", 2)[1] ?? "";

test("read-only channel verification can be dispatched without media or approval inputs", () => {
  for (const input of ["metadata_path", "video_path", "job_id", "approval_path", "one_shot_authorization_path"]) {
    const match = workflow.match(new RegExp(`      ${input}:\\n([\\s\\S]*?)(?=      [a-z_]+:|\\n\\n#)`));
    assert.ok(match, `workflow input ${input} exists`);
    assert.match(match[1], /required: false/, `${input} is optional at dispatch`);
  }
  assert.match(readOnlyJob, /if: \\$\\{\\{ inputs\\.confirm_private_upload != 'YES' \\}\\}/);
  assert.match(readOnlyJob, /verify-youtube-channel\\.mjs/);
  assert.doesNotMatch(readOnlyJob, /upload-private\\.mjs/);
});

test("explicit private upload validates all artifact-bound inputs before ledger restore or uploader execution", () => {
  assert.match(workflow, /confirm_private_upload:\\n[\\s\\S]*?required: true[\\s\\S]*?default: 'NO'/);
  assert.match(privateUploadJob, /if: \\$\\{\\{ inputs\\.confirm_private_upload == 'YES' \\}\\}/);
  const guard = privateUploadJob.indexOf("Require exact upload inputs before any private-upload work");
  const ledger = privateUploadJob.indexOf("Refuse ledger bypass after any prior manual upload run");
  const uploader = privateUploadJob.indexOf("node scripts/upload-private.mjs");
  assert.ok(guard >= 0 && ledger > guard && uploader > ledger, "upload input guard precedes ledger handling and uploader");
  for (const variable of ["METADATA_PATH", "VIDEO_PATH", "JOB_ID", "APPROVAL_PATH", "AUTHORIZATION_PATH"]) {
    assert.match(privateUploadJob, new RegExp(variable));
  }
  assert.match(privateUploadJob, /JOB_ID.*A-Za-z0-9/);
  assert.match(privateUploadJob, /CONFIRM_PRIVATE_UPLOAD: \\$\\{\\{ inputs\\.confirm_private_upload \\}\\}/);
  assert.match(privateUploadJob, /YOUTUBE_EMERGENCY_STOP: \\$\\{\\{ inputs\\.confirm_emergency_stop_release == 'YES'/);
});

test("workflow keeps the emergency stop default engaged and private upload explicitly opt-in", () => {
  assert.match(workflow, /confirm_emergency_stop_release:\\n[\\s\\S]*?required: true[\\s\\S]*?default: 'NO'/);
  assert.match(workflow, /group: sonicvhibez-private-upload/);
  assert.match(workflow, /cancel-in-progress: false/);
});
