# Current branch status — 2026-10-24

- Snapshot baseline before this documentation-only update: branch HEAD `10a80f3ce809bea3fc1f25feb3bf0667b4a43696`, 609 commits ahead and 0 behind `main`; latest verified code/test checkpoint remains `6217680cc11e617375b152b9e7b5b745559eb8c0`. Base `main`: `45352b73bb6cc4787b2a49988b575afb754ab627`. PR #1 was open, draft and unmerged at the snapshot baseline. This update changes documentation only; consult PR #1 for the current live branch HEAD and comparison.
- All three validation workflows passed on the exact code/test checkpoint: [automation validation — run 40091065946](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091065946), [metadata validation — run 40091065995](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091065995), and [content quality — run 40091065945](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091065945). Each reports 136 Node tests passed, 0 failed, 0 skipped. Automation also passed 8 Python safety tests, JavaScript syntax checks and Python compilation. CI verified `npm ci --ignore-scripts` (46 packages added, 47 audited); ordinary `npm ci` remains unverified.
- Facebook safeguards added in this checkpoint: approval fingerprints bind factual claim/source data and material asset/licence/provenance/disclosure fields; keyed Meta credential fingerprints invalidate old Page permission attestations after Page token, user token or operator-secret rotation. Tests are mocked/unit-level only. Meta publishing remains disabled by default; no Page identity, permissions, Insights or real post have been verified.
- npm audit reports 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common`, and `uuid`. A major Google API client upgrade remains untested and unapplied.
- YouTube cadence remains unresolved: 2 long-form + 1 Short within 168 hours conflicts with three cyclic 72-hour gaps (216 hours required). Tuesday/Saturday remains draft-only; `cadenceDecisionRequired=true`; public YouTube publishing remains disabled.
- Production acceptance remains blocked by genuine rights-cleared media/manifests and full decode/playback, final-hash-bound human review, secure verified SonicVhibez OAuth identity, explicit authorization for a private upload and verified receipt, owner-run restart/restore acceptance, unresolved cadence, and owner-provided Meta Page credentials/permissions plus a reviewed real Facebook test operation. Safari remains inactive pending exact HTTPS destination, disclosure and approval.
- The test-fix sequence included one failed CI run due to a regression-test fixture setup error; the fixture was corrected, and all three workflows then passed on `6217680cc11e617375b152b9e7b5b745559eb8c0`. Documentation-only commits followed. This status is not production acceptance.

---

## Last fully verified code checkpoint before this documentation refresh — 2026-10-24

- Verified code/test HEAD: `68dd24f7a369a8bdb4ddb2513127e9bf3a0044e3`; PR #1 was open, draft and unmerged against `main`. The subsequent commits in this documentation refresh change documentation only; the final branch HEAD and its CI are reported in the PR description and completion response.
- All three GitHub Actions validation workflows passed on that exact code/test HEAD, each with 107 passed, 0 failed, 0 skipped: [automation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496654), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496646), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496600).
- The automation run passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and 8 Python safety tests. The metadata workflow intentionally verifies that `npm run check` fails closed while production metadata remains incomplete; that is a successful safety check, not production readiness. Plain `npm ci` without `--ignore-scripts` remains unverified.
- Schedule implementation converts configured 17:00 local time with IANA timezone rules, validates elapsed-hour gaps and local dates, and applies schedule/spacing checks to dashboard draft creation, draft updates and direct job creation. The dashboard state/readiness responses and CLI production-readiness report explicitly show the unresolved cadence decision. The current two-slot draft schedule (Tuesday long-form, Saturday Short) has 96-hour and 72-hour cyclic gaps.
- **Cadence decision remains BLOCKED:** the requested target is two long-form videos plus one Short every seven days. Three cyclic gaps of at least 72 hours require 216 hours, so that target cannot fit in a 168-hour week. The active one-long-form + one-Short schedule is an explicitly labelled interim safety fallback, not a silent replacement of the requested goal. Public publishing remains disabled.
- Production acceptance remains blocked by genuine rights-cleared source media and manifests, real rendered and fully decoded exports, human review bound to final hashes, secure live SonicVhibez OAuth identity verification, one explicitly authorized private upload with remote private-status receipt, and owner-run restart/backup-restore acceptance. Safari remains inactive until exact HTTPS destination, disclosure and owner approval exist.

# SonicVhibez operations runbook

This repository is a draft-generation and gated private-upload system. It is not an unattended public-publishing system.

## Scheduled draft generation

The workflow `.github/workflows/free-narration-artifact.yml` runs Tuesdays and Saturdays at 15:00 UTC (17:00 in South Africa while SAST is UTC+2). It generates a US-English narration package, estimated SRT captions, a 1080x1920 text-led review video, and a thumbnail/provenance record. GitHub-hosted scheduled workflows can be delayed; the cadence is a target, not a guaranteed delivery SLA.

Open Actions → Generate free narration audio to inspect the latest run. Download the `sonicvhibez-short-draft-package` artifact. The package includes:
- `rendered-drafts/*-DRAFT.mp4`: text-led visual review draft, not a finished wildlife documentary;
- matching `.json`: held metadata;
- `thumbnail.jpg` and `thumbnail-rights-evidence.json`;
- queue package narration `.mp3`, script `.txt`, and estimated captions `.srt`.

## Before any upload

1. Listen to the complete narration and watch the entire MP4.
2. Check each factual statement against reliable sources; correct any claim that cannot be verified.
3. Replace the text-only visuals with suitable wildlife footage only when each clip's license/permission and required attribution have been checked. Keep evidence for every asset.
4. Check that the voice, audio, visuals, music, thumbnail, and captions are suitable for publication; align captions to actual speech.
5. Confirm the thumbnail represents the actual video and is not misleading.
6. Check the title and description, including clear disclosure that the Selar resource is promotional.
7. Keep the only permitted product URL exactly `https://selar.com/0u19v8u99l`.
8. Confirm the destination channel is SonicVhibez. Never use the Nature Frontiers YouTube channel for these promotions.

## Prepare reviewed metadata

Create or edit `content/next-short.json` from the JSON matching the selected artifact's MP4. Preserve the exact `queueItemId`, `title`, and `productUrl` from that artifact so the handoff workflow can match them. Do not mark a review complete until it actually is.

Only after completing the checks above, set:
- `status`: `READY_FOR_PRIVATE_UPLOAD`
- `channelId`: the verified SonicVhibez YouTube channel ID (must match the GitHub secret)
- `rightsConfirmed`: `true` only after documenting rights for all final media
- `complianceReviewed`: `true` only after factual, disclosure, platform-policy, and metadata review
- `visibility`: `private`

Never set these values just to bypass the gates.

## Private upload handoff

1. Add the four GitHub Actions repository secrets: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, and `SONICVHIBEZ_CHANNEL_ID`. Use YouTube OAuth credentials authorized for the intended channel. Never commit secrets or paste them into logs.
2. Open Actions → Upload reviewed artifact privately → Run workflow.
3. Enter the successful draft-generation run ID as `source_run_id`; set `reviewed_metadata_path` to `content/next-short.json` unless you have deliberately added a different reviewed JSON file to the repository.
4. Inspect the run log and receipt artifact. Confirm the uploaded video's visibility is private and the returned channel/video identifiers are correct.
5. If any gate fails, do not weaken the gate. Correct the underlying issue and retry.

## Public posting

Public publishing is deliberately disabled. The project does not currently auto-publish public videos or guarantee that the two scheduled jobs will run exactly on time. Do not enable public posting until the end-to-end private workflow is verified, media rights and platform compliance are established, and an explicit publishing authorization is provided.

## Current known limitation

The automated renderer creates a polished text-led draft. It does not automatically source, license, or edit wildlife B-roll into a finished documentary. A thumbnail provenance record does not establish rights to any video footage. All such rights remain unconfirmed until reviewed by a human.
