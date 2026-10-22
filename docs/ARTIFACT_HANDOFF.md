# Draft artifact review handoff

The workflow named `Generate free narration audio` creates the artifact `sonicvhibez-short-draft-package`. The output is a text-led review draft, not a finished wildlife documentary. It contains no wildlife B-roll and remains on hold.

## Review before private upload

1. Open the successful generation run in GitHub Actions and note its run ID.
2. Download and review the MP4, narration, captions, thumbnail, and rights evidence in the artifact. Add footage only when you have verified the specific license and attribution requirements.
3. Prepare metadata for the exact artifact item. The repository includes a helper that copies the matching identity fields but deliberately leaves all review gates closed. After downloading/extracting the artifact, run:
   ```bash
   python scripts/prepare-review-metadata.py path/to/matching-generated-metadata.json --output content/next-short.json --channel-id VERIFIED_SONICVHIBEZ_CHANNEL_ID
   ```
   Replace the example path and channel ID with real values; do not type a guessed channel ID. The helper rejects the wrong channel/product destination and keeps `rightsConfirmed=false`, `complianceReviewed=false`, and a held status.
4. Watch the full draft and listen to the narration. Verify facts, captions, thumbnail accuracy, promotional disclosure, and rights for every final footage, image, music, and sound asset. The generated video is text-led; it is not a finished wildlife documentary until rights-cleared footage is edited in and the final video is rechecked.
5. Only after the checks actually pass, edit `content/next-short.json`: set `rightsConfirmed` and `complianceReviewed` to true, set `status` to `READY_FOR_PRIVATE_UPLOAD`, retain `visibility: private`, and confirm the channel ID. Never change these values merely to bypass the gates.
6. Configure the required YouTube OAuth/channel secrets in GitHub repository settings without committing or pasting secrets into source files.
7. Run `Upload a reviewed draft artifact privately`, providing the source run ID and reviewed metadata path. The workflow downloads the selected artifact, matches its metadata, and uses the existing strict checks. Verify the upload receipt and YouTube Studio entry; the workflow uploads privately only.

The workflow does not bypass missing OAuth secrets, channel verification, rights checks, or editorial review. Public publishing remains disabled. Scheduled runs can be delayed or skipped; check the Actions page for the actual result.
