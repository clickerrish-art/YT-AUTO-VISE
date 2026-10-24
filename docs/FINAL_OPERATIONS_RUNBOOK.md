## Current release status — 24 October 2026

**Current tested code candidate:** `de1bf204663f05b24d46833a2483453d9926ff0c`  
**PR #1:** [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1)  
**Branch comparison at this code-candidate checkpoint:** 875 commits ahead, 2 behind `main`; 92 changed files. Merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; base head `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. History reconciliation remains an owner decision.

### Exact-SHA CI evidence

These completed workflows ran against code candidate `de1bf204663f05b24d46833a2483453d9926ff0c`; counts and advisories were checked in job logs:

- [Automation validation — run 40121438928](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121438928): **PASS WITH MODERATE ADVISORIES**; `npm ci --ignore-scripts`; Node tests 204 passed, 0 failed, 0 skipped; Python safety tests 8 passed; 16 queued topics validated; campaign checks, JavaScript syntax and Python compilation passed. Audit: 4 moderate, 0 high, 0 critical.
- [Metadata validation — run 40121439065](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121439065): **PASS**; 204 Node tests passed, 0 failed, 0 skipped; schedule/caption and fail-closed readiness checks passed.
- [Content quality — run 40121438920](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121438920): **PASS**; 204 Node tests passed, 0 failed, 0 skipped.
- [Locked-install and lockfile validation — run 40121435383](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121435383): **PASS**; clean `npm ci --ignore-scripts`, complete Node test suite and validation checks passed.
- [Daily Facebook draft — run 40121438924](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121438924): **SKIPPED** on the PR event. No default-branch draft artifact is established by this run.
- No live YouTube upload or Facebook post was performed. A skipped workflow is not counted as a pass.

### Recent code-level changes

- `scripts/schedule-policy.mjs` rejects malformed calendar dates, timezone-free timestamps and invalid offsets; `test/schedule-policy.test.mjs` covers regression cases.
- `scripts/youtube-history-gate.mjs` strictly validates remote publication timestamps, owner reconciliation verification timestamps and reconciled record timestamps; `test/youtube-history-gate.test.mjs` covers malformed dates, missing time zones and invalid offsets.
- `scripts/upload-private.mjs` applies the same strict timestamp validation to retained rights-evidence verification and one-shot private-upload authorization. `tests/upload-safety.test.mjs` covers invalid calendar dates, missing time zones and invalid offsets. This is deterministic code/test evidence, not proof of a real owner approval or live upload.
- CI deliberately uses `npm ci --ignore-scripts`; a normal lifecycle-script install and clean local runtime acceptance remain unverified.

### Current acceptance register

| Gate | Status | Evidence / remaining action |
|---|---|---|
| Automated Node tests | PASS | 204 passed, 0 failed, 0 skipped on exact code candidate above. |
| Python safety tests | PASS | 8 passed on exact code candidate above. |
| Queue, campaign, schedule, caption, syntax and compilation checks | PASS | Exact-SHA automation/metadata logs linked above. |
| Strict timestamp validation for schedule, history and private-upload authorization | PASS | Regression tests pass; no real account operation implied. |
| Normal lifecycle-script install | NOT RUN | CI deliberately uses `npm ci --ignore-scripts`. |
| Dependency remediation | BLOCKED | Four moderate advisories remain; no major Google API upgrade was applied blindly. |
| Full dashboard clean-install end-to-end acceptance | NOT RUN | Every visible action, restart and operator flow has not been independently exercised end to end. |
| Genuine media, rights evidence and final-hash human review | OWNER ACTION REQUIRED | Supply genuine licensed inputs and review exact final hashes. |
| SonicVhibez OAuth identity and complete remote history | OWNER ACTION REQUIRED | Verify identity; reconcile public/private/unlisted history and uncertain attempts. |
| One authorized private upload and remote receipt | OWNER ACTION REQUIRED | No operation-specific authorization or live upload occurred. |
| Nature Frontiers Facebook Page identity/permissions | OWNER ACTION REQUIRED | Verify Page identity, scopes and token validity; live publishing remains disabled. |
| Default-branch Facebook draft and retained artifact | BLOCKED | PR run skipped; verify a real default-branch run and retained artifact. |
| Isolated backup/restore/restart drill | OWNER ACTION REQUIRED | Run in isolation and retain evidence. |
| Branch divergence and test-file incident | OWNER ACTION REQUIRED | Review the two base-only commits and 875/2 divergence; no merge or history rewrite performed. |
| Production acceptance | BLOCKED | External, media, dependency, integration and owner-controlled gates remain open. |

**Safety defaults:** public/unattended YouTube publishing remains disabled; private upload requires separate single-operation authorization; Facebook live publishing remains disabled with dry-run/emergency-stop safeguards; only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive.

**Verdict:** `CODE-LEVEL ACCEPTANCE BLOCKED`; production acceptance `BLOCKED`. Passing automated tests do not establish complete end-to-end or production acceptance.

---

## Historical checkpoint material


- Latest verified code/test checkpoint: `1155263c25e85f901b9245fd4e024898a1af6f19`. Later commits update documentation only. Base `main`: `45352b73bb6cc4787b2a49988b575afb754ab627`. PR #1 remains open, draft and unmerged; use PR #1 for the exact live documentation HEAD and comparison.
- All three validation workflows and the daily Facebook draft workflow passed on the exact code/test checkpoint: [automation — run 40091734573](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734573), [metadata — run 40091734584](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734584), [content quality — run 40091734600](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734600), [daily Facebook draft — run 40091734576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576). Each reports 139 Node tests passed, 0 failed, 0 skipped. Automation also passed 8 Python safety tests, JavaScript syntax checks and Python compilation. CI verified `npm ci --ignore-scripts` (46 packages added, 47 audited); ordinary `npm ci` remains unverified.
- Daily Facebook draft automation generates an idempotent research-only JSON package using `Africa/Johannesburg`, checks local editorial state where available, assigns an 08:00/18:00 experiment arm and retains an artifact. [Verified artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856). The observed run detected the 08:00 SAST slot had passed and returned `MISSED_SLOT_REVIEW_REQUIRED`; it did not backdate or batch-publish. Scheduled triggers execute only on the default branch; PR #1 remains draft, so this is not an active production daily trigger.
- Facebook approval fingerprints bind claims/source and media/licensing/provenance/disclosure fields. Keyed Meta credential fingerprints invalidate old Page permission attestations after Page token, user token or operator-secret rotation. These tests do not establish real Page identity, current permissions, Page Insights, licence authenticity or publication.
- npm audit reports 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`. A major Google API client upgrade remains untested and unapplied.
- YouTube publication policy is now a rolling `long_form → long_form → short` cycle with 72 elapsed hours between consecutive actual publications (216 hours for three cyclic gaps). Tuesday/Saturday remains draft-only; stale weekly-count fields are removed; live history reconciliation and explicit private-upload authorization remain required. Public YouTube publishing remains disabled.
- Production acceptance remains blocked by genuine rights-cleared media/manifests and full decode/playback, final-hash-bound human review, secure verified SonicVhibez OAuth identity, explicit authorization for a private upload and verified receipt, owner-run restart/restore acceptance, complete remote history reconciliation, and owner-provided Meta Page credentials/permissions plus a reviewed real Facebook test operation. Safari remains inactive pending exact HTTPS destination, disclosure and approval.

---

## Last fully verified code checkpoint before this documentation refresh — 2026-10-24

- Verified code/test HEAD: `68dd24f7a369a8bdb4ddb2513127e9bf3a0044e3`; PR #1 was open, draft and unmerged against `main`. The subsequent commits in this documentation refresh change documentation only; the final branch HEAD and its CI are reported in the PR description and completion response.
- All three GitHub Actions validation workflows passed on that exact code/test HEAD, each with 107 passed, 0 failed, 0 skipped: [automation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496654), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496646), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496600).
- The automation run passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and 8 Python safety tests. The metadata workflow intentionally verifies that `npm run check` fails closed while production metadata remains incomplete; that is a successful safety check, not production readiness. Plain `npm ci` without `--ignore-scripts` remains unverified.
- Schedule implementation converts configured 17:00 local time with IANA timezone rules, validates elapsed-hour gaps and local dates, and applies schedule/spacing checks to dashboard draft creation, draft updates and direct job creation. The dashboard state/readiness responses and CLI production-readiness report explicitly show that complete remote channel history reconciliation is required before upload. The Tuesday/Saturday slots remain draft preparation only.
- The rolling three-publication cycle is implemented in configuration, queue validation and the pre-upload history gate. The Tuesday/Saturday schedule remains draft preparation only. Live owner-reviewed history reconciliation, OAuth verification and a separate private-upload authorization remain blocked; public publishing stays disabled.
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
