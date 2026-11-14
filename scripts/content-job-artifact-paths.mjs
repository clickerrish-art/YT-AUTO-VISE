const SAFE_JOB_ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{2,119}$/;

/**
 * Stable repository-relative artifact paths for one persisted content job.
 * Job IDs are validated before they become path components; each job keeps
 * its own final export and thumbnail instead of overwriting a shared output.
 */
export function contentJobArtifactPaths(jobId) {
  if (typeof jobId !== "string" || !SAFE_JOB_ID.test(jobId)) {
    throw new Error("A valid persisted content job ID is required for artifact paths");
  }
  const directory = "media/jobs/" + jobId;
  return Object.freeze({
    directory,
    videoPath: directory + "/final.mp4",
    thumbnailPath: directory + "/thumbnail.jpg"
  });
}
