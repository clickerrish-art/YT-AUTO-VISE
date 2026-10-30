# SonicVhibez Marketing Machine — Release Evidence
# 31 October 2026 checkpoint

## Repository and protected Git state

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Pull request: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- Observed PR state: OPEN, DRAFT, UNMERGED
- Observed branch HEAD at this evidence snapshot: `4efa5db67dbd8b7b796d15dabaa7ec7fe122fcd5`
- Latest exact application/test candidate: `fa6145a4d5977fd64824fa98803c669161e2a152`
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Comparison at the observed HEAD: 2,254 commits ahead, 2 behind, 182 changed files.
- No merge, reset, rebase, force-push or destructive reconciliation was performed. The work was committed only to the implementation branch.
- A local developer working tree was not available through the remote GitHub session; local uncommitted changes therefore cannot be certified clean.

## Exact-SHA CI evidence

The latest full PR validation batch was triggered on exact PR head `fa6145a4d5977fd64824fa98803c669161e2a152`. Subsequent commits through `4efa5db67dbd8b7b796d15dabaa7ec7fe122fcd5` updated acceptance documentation and register evidence; no application behavior was changed after that tested candidate.

- Dashboard browser E2E — [run 41141841497](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41141841497): SUCCESS, 19/19 Chromium journeys.
- Automation/security — [run 41141841572](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41141841572): SUCCESS, 436 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; npm audit reported 0 vulnerabilities.
- Metadata validation — [run 41141841557](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41141841557): SUCCESS.
- Content quality — [run 41141841516](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41141841516): SUCCESS.
- Isolated main/candidate baseline comparison — [run 41141841590](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41141841590): SUCCESS.
- Non-destructive branch inventory — [run 41141841537](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41141841537): SUCCESS.
- Nature Frontiers local draft validation — [run 41141841398](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41141841398): SUCCESS. This validates the local draft package, not an external Facebook or Instagram publication.
- Production readiness — [run 41141841536](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41141841536): EXPECTED HOLD / workflow failure, 13 blockers remain. This is not a passing readiness result.

## DASH-001 dashboard acceptance

Inventory remains 105 dashboard controls, 15 forms and 38 API routes. DASH-001 remains **NOT_TESTED** because full per-control and per-route acceptance is not complete.

Current form-specific matrix:
- PASS: campaignform, draft, facebookdraftform, authoringform, scriptreviewform, narrationform, narrationreviewform (7 forms).
- NOT_TESTED: productionplanform, productionplanreviewform (2 forms).
- BLOCKED: produceform, parentrelationshipform, validationform, rightsform, reviewform, reconcileform (6 forms).

The new narration browser journey exercised the actual dashboard form against an isolated local server and the free Edge TTS service. It:
1. Created a source-bound short-form script and approved its exact script SHA.
2. Submitted the dashboard narration form.
3. Generated real TTS audio, measured with FFmpeg/ffprobe.
4. Verified the 137-word narration and 50–60 second duration requirement.
5. Verified TTS word-boundary caption timing.
6. Verified SHA-256 values and regular-file persistence for narration.mp3, narration.txt, captions.srt and narration-report.json.
7. Reloaded the dashboard and verified the persisted job/artifact state.
8. Simulated a recovery-required state with the completed artifacts retained, then reconciled those files without re-running TTS.
9. Confirmed publishing remained disabled and the narration remained a draft pending human review.

The narration-review form's separate earlier browser journey still uses a synthetic, non-playable audio fixture. It proves hash-bound review API/UI logic only; it does not prove that a human listened to the generated audio or granted genuine editorial approval.

The 19/19 browser result is reproducible in run 41141841497. The earlier initial run 41140897700 failed due to a test-harness assertion using native Response.status as a function; the next run exposed a trailing-newline word-count assertion. Both failures were preserved as historical evidence, corrected, and followed by the passing exact-PR-head run.

## Other requirement acceptance

- API-001: NOT_TESTED overall. Authentication, malformed request and focused successful API cases exist, but all 38 routes have not passed complete authorized success, persistence, concurrency, failure and response-contract acceptance.
- SCHED-001: NOT_TESTED overall. Full worker lifecycle, concurrent workers, retry/recovery, schedule history and operational timezone acceptance are outstanding.
- STATE-001: NOT_TESTED overall. A dashboard server restart journey passes, but complete backup integrity, restore, interrupted-write, cross-process concurrency and crash-recovery acceptance is outstanding.
- DEPLOY-001: NOT_TESTED. No isolated production deployment and rollback drill has been demonstrated.
- GIT-002: NOT_TESTED. Automated non-destructive branch inventory passes, but human semantic review of the full 2,254-ahead/2-behind difference is not complete.

The restore-history investigation is preserved:
- `test/restore-facebook-draft-history.test.mjs` exists on the implementation branch.
- The same path is absent from `main`.
- Neither version has been deleted or overwritten as part of this work.

## Production readiness — 13 blockers remain

The exact readiness run reports these blockers:

1. Owner-approved publication cadence, timezone-aware approval timestamp and approval reference are missing.
2. Complete SonicVhibez public/private/unlisted YouTube history and all pending/uncertain upload attempts must be reconciled.
3. Genuine rights-verified `content/render-manifest.json` is missing.
4. Genuine rights-verified `content/long-form-render-manifest.json` is missing.
5. Human-reviewed metadata is not marked READY_FOR_PRIVATE_UPLOAD.
6. Verified SonicVhibez YouTube channel ID is missing.
7. Rights approval is not established.
8. Compliance approval is not established.
9. Rendered `media/next-short.mp4` is missing.
10. `YOUTUBE_CLIENT_ID` is not configured in the CI execution environment.
11. `YOUTUBE_CLIENT_SECRET` is not configured in the CI execution environment.
12. `YOUTUBE_REFRESH_TOKEN` is not configured in the CI execution environment.
13. `SONICVHIBEZ_CHANNEL_ID` is not configured in the CI execution environment.

The readiness report explicitly states it never uploads, schedules or publishes. No YouTube upload, Facebook publication, Instagram publication, or external account change was attempted in this work.

## Decision

This checkpoint demonstrates a real, successful narration-generation and recovery journey and broad passing CI coverage. It does **not** establish that the entire application is complete, that DASH-001 is accepted, or that production is ready. Keep PR #1 open and in draft; keep publishing disabled; continue with production-plan submission/review, remaining successful form journeys, all-route API acceptance, scheduling, backup/restore, deployment/rollback and semantic branch review.
