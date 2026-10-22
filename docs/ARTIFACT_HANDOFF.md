# Draft artifact review handoff

The workflow named `Generate free narration audio` creates the artifact `sonicvhibez-short-draft-package`. The output is a text-led review draft, not a finished wildlife documentary. It contains no wildlife B-roll and remains on hold.

## Review before private upload

1. Open the successful generation run in GitHub Actions and note its run ID.
2. Review the MP4, narration, captions, thumbnail, and rights evidence in its artifact. Add footage only when you have verified the specific license and attribution requirements.
3. Update a metadata JSON in the repository for the exact queue item. Its `channel`, `queueItemId`, `title`, and `productUrl` must match the metadata inside the selected artifact. Keep the exact approved product URL `https://selar.com/0u19v8u99l` and `visibility` set to `private`.
4. Set `rightsConfirmed` and `complianceReviewed` to true only after completing those checks, and set `status` to `READY_FOR_PRIVATE_UPLOAD` only after review. Include the verified channel ID.
5. Run `Upload a reviewed draft artifact privately`, providing the source run ID and reviewed metadata path. The workflow downloads the selected artifact, matches its metadata, and uses the existing strict checks. The upload is private only.

The workflow does not bypass missing OAuth secrets, channel verification, rights checks, or editorial review. Public publishing remains disabled. Scheduled runs can be delayed or skipped; check the Actions page for the actual result.
