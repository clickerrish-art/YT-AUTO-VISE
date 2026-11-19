import test from "node:test";
import assert from "node:assert/strict";
import { contentJobArtifactPaths } from "../scripts/content-job-artifact-paths.mjs";

test("content jobs receive distinct stable final-video and thumbnail paths", () => {
  const first = contentJobArtifactPaths("job-00000000-0000-4000-8000-000000000001");
  const second = contentJobArtifactPaths("job-00000000-0000-4000-8000-000000000002");
  assert.equal(first.videoPath, "media/jobs/job-00000000-0000-4000-8000-000000000001/final.mp4");
  assert.equal(first.thumbnailPath, "media/jobs/job-00000000-0000-4000-8000-000000000001/thumbnail.jpg");
  assert.notEqual(first.videoPath, second.videoPath);
  assert.notEqual(first.thumbnailPath, second.thumbnailPath);
  assert.equal(first.directory, "media/jobs/job-00000000-0000-4000-8000-000000000001");
});

test("content job artifact paths reject traversal and malformed job identifiers", () => {
  for (const jobId of ["../outside", "/absolute", "job/child", "", "x", "job\\\\child"]) {
    assert.throws(() => contentJobArtifactPaths(jobId), /valid persisted content job ID/);
  }
});
