# Current Release Evidence — 2026-10-28

## Exact source/test candidate

- **Source/test candidate:** `24d792b51dee6ab4020601e225dbb6d0625b39f4`
- **Application-code commit:** `1b64a5d7859ed16c74bc10b518bfee8a6924aba9`
- **Regression-test commit:** `24d792b51dee6ab4020601e225dbb6d0625b39f4`
- **PR:** [Draft PR #1](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1), remains open and unmerged.

## Safety correction

`scripts/schedule-policy.mjs` no longer falls back to a job's `createdAt` or planned `scheduledAt` when an item has a remote state of `published`, `public`, `private`, or `unlisted` but lacks an actual publication timestamp. These states must provide `actualPublishedAt` or `publishedAt`; otherwise schedule validation fails closed.

`test/schedule-policy.test.mjs` now exercises all four remote states with a creation time present but no actual publication timestamp. This prevents a creation timestamp from being misrepresented as evidence of a real remote publication time.

## Exact-candidate CI

- Automation/security [run 40648903290](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40648903290): **PASS** — 387 Node tests, 0 failures, 0 skips; 16 Python tests passed; `npm audit` reported 0 vulnerabilities; FFmpeg/ffprobe integration, syntax and compilation checks passed.
- Content quality [run 40648903293](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40648903293): **PASS** — 387 Node tests, 0 failures, 0 skips; renderer integration checks passed.
- Metadata validation [run 40648903292](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40648903292): **PASS** — 387 Node tests, 0 failures, 0 skips; metadata and safety gates behaved as expected.
- Dashboard browser E2E [run 40648903347](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40648903347): **PASS** — 14 Chromium journeys.
- Isolated main/candidate baseline [run 40648903279](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40648903279): **PASS** — main `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate `24d792b51dee6ab4020601e225dbb6d0625b39f4` each completed dependency installation, Node tests and Python tests with exit code 0. Artifact ID `12799076318`; uploaded ZIP SHA-256 `ba8d19e445953b8a1daf80d02fc49b5e38b9a2c377e86b30d2cc229351f400a3`.
- Production readiness [run 40648903409](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40648903409): **BLOCKED as intended** — both readiness modes returned exit code 2 with 13 prerequisites outstanding. This is not release acceptance.
- Nature Frontiers Facebook draft workflow [run 40648903321](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40648903321): local candidate validation **PASS**; external `create-draft-package` job **SKIPPED**. No external Meta draft creation is verified.

## Live integration safety finding

Metricool currently exposes one brand labelled **Nature Frontiers**. The inspected queue contained eight upcoming Facebook/Instagram promotional posts with `draft: false` and `autoPublish: true`; post `406357273` showed as published on 2026-10-27. Existing scheduled posts were not changed by this implementation run. Owner intervention is needed to prevent unwanted future cross-platform promotions. Do not treat this integration state as safe or production-ready.

## Remaining release gates

- Genuine rights-cleared source media, narration and music; final MP4s and exact-hash manifests.
- Human factual, rights and full-playback review.
- Secure verification of the SonicVhibez channel/OAuth identity and complete public/private/unlisted history, including uncertain upload attempts.
- Explicit per-operation private-upload authorization and independent verification of the remote receipt.
- Native YouTube Related-video eligibility or a clearly retained external blocker.
- Actual external Meta draft-only integration and verified Page/Instagram identities.
- Owner-approved cadence that satisfies the minimum 72-hour elapsed gap.
- Exhaustive dashboard/API behavioral acceptance (DASH-001 remains NOT_TESTED), branch protection, non-destructive branch-history reconciliation, and controlled deployment/backup/restore/rollback drills.

No video or post was published by this run. No campaign was activated, no visibility changed, no paid generation used, no merge performed, and `main` was not edited. Scheduled GitHub workflows run from `main`; PR-branch workflow success is not evidence that production automation is active.
