# Current Release Evidence — 2026-10-28

## Current exact-HEAD checkpoint

- **Exact HEAD tested by the current workflow set:** `4f4499e93de2d9faa6e56d0c062ee5ce901d7ce2`.
- **Earlier timestamp-safety code commit:** `1b64a5d7859ed16c74bc10b518bfee8a6924aba9`.
- **Timestamp-safety regression test commit:** `24d792b51dee6ab4020601e225dbb6d0625b39f4`.
- **PR #1:** [Draft PR #1](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1), open and unmerged.
- **Base:** `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.
- **Branch divergence at this checkpoint:** 1,873 commits ahead, 2 behind, 170 changed files. This remains a non-destructive full-review blocker; no reset, rebase, force-push, merge or main edit was performed.

## Code and test changes in the tested branch

1. `scripts/schedule-policy.mjs` no longer falls back to `createdAt` or planned `scheduledAt` when remote state is `published`, `public`, `private`, or `unlisted` but the actual publication timestamp is absent. It requires `actualPublishedAt` or `publishedAt` and fails closed otherwise.
2. `test/schedule-policy.test.mjs` covers all four remote states when creation/scheduled timestamps exist but actual publication time is missing.
3. The current branch also contains a `validateCadenceDecision` helper in `scripts/schedule-policy.mjs`, used by `scripts/production-readiness.mjs`, with `test/cadence-decision.test.mjs` and production-readiness regression coverage. It requires an explicit owner-approved mode and reference, a valid zoned approval timestamp, and a mathematically feasible cadence while preserving the hard minimum of 72 elapsed hours. This does not supply owner approval or authorize a cadence.

## Exact current-HEAD CI results

- Automation/security [run 40649391095](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40649391095): **PASS** — 392 Node tests, 0 failures, 0 skips; 16 Python tests passed; `npm audit` reported 0 vulnerabilities; FFmpeg/ffprobe integration, syntax and compilation checks passed.
- Content quality [run 40649391033](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40649391033): **PASS** — 392 Node tests, 0 failures, 0 skips; renderer integration checks passed.
- Metadata validation [run 40649390946](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40649390946): **PASS** — 392 Node tests, 0 failures, 0 skips.
- Dashboard browser E2E [run 40649391002](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40649391002): **PASS** — 14 Chromium journeys.
- Isolated main/candidate baseline [run 40649390981](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40649390981): **PASS** — main and current candidate completed dependency installation, Node tests and Python tests with exit code 0.
- Production readiness [run 40649391027](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40649391027): **BLOCKED as intended** — readiness reported 13 prerequisites and both modes returned exit code 2. This is not release acceptance.
- Nature Frontiers Facebook draft workflow [run 40649390923](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40649390923): local candidate validation **PASS**; external `create-draft-package` job **SKIPPED**. No external Meta draft creation is verified.

## Live Metricool safety finding

Metricool currently exposes one brand labelled **Nature Frontiers**. The inspected queue contained eight upcoming Facebook/Instagram promotional posts with `draft: false` and `autoPublish: true`; post `406357273` showed as published with a scheduled timestamp of 2026-10-27 10:00 SAST. The tool did not provide its actual remote publication timestamp. Existing scheduled posts were not changed by this implementation run. Owner intervention is required to prevent unwanted future cross-platform promotions; do not treat this integration state as safe.

## Remaining release gates

- Genuine rights-cleared source media, narration and music; final MP4s and exact-hash manifests.
- Human factual, rights and full-playback review.
- Secure verification of SonicVhibez channel/OAuth identity and complete public/private/unlisted history, including uncertain upload attempts.
- Explicit per-operation private-upload authorization and independent verification of the remote receipt.
- Native YouTube Related-video eligibility or a clearly retained external blocker.
- Actual external Meta draft-only integration and verified Page/Instagram identities.
- Owner-approved cadence that satisfies the minimum 72-hour elapsed gap.
- Exhaustive dashboard/API behavioral acceptance (DASH-001 remains NOT_TESTED), branch protection, non-destructive branch-history reconciliation, and controlled deployment/backup/restore/rollback drills.

No video or post was published by this implementation run. No campaign was activated, no visibility changed, no paid generation used, no merge performed, and `main` was not edited. Scheduled GitHub workflows execute from `main`; PR-branch workflow success is not evidence that production automation is active.
