## Exact source/test candidate — eab2e53440fa7c2ce611c4608b67c019a59ca5c7 (28 October 2026)

- **Schedule-history hardening:** `evaluateNextPublication` rejects remote `published`, `public`, `private` and `unlisted` history when `actualPublishedAt`/`publishedAt` are missing, even if `createdAt` or `scheduledAt` exists. A separate test confirms `publishedAt` remains a valid actual timestamp alias.
- **Dashboard mobile acceptance:** added a real Chromium test that connects the dashboard at 320px and asserts both document and body widths do not exceed the viewport. Browser suite passed 15/15 journeys.
- Automation/security: [396 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430244). Content quality: [396/396, zero skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430186). Metadata: [396/396, zero skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430267). Lockfile/FFmpeg integration: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651423326). Browser E2E: [15 Chromium journeys](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430378).
- Isolated main/candidate baseline: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430324); artifact ID `12799084851`, ZIP SHA-256 `${baselineSha}`.
- Production readiness [correctly remains blocked](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430301) by mandatory prerequisites. Meta draft workflow [passed local validation but skipped external draft creation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430170).
- Main `${main}`; merge base `${mergeBase}`; candidate divergence 1,889 ahead / 2 behind / 170 changed files. PR #1 remains open, draft and unmerged.
- `DASH-001` remains `NOT_TESTED`. Real media/rights/human approval, verified YouTube/Meta identities and operations, owner-approved feasible cadence, complete operational recovery/deployment drills, branch protection and full branch-history review remain open. No live upload/post, visibility change, campaign activation, merge, `main` edit or destructive Git operation occurred.

---

## Exact-candidate checkpoint — e38e2fe7a5c13a71077bcab6bc3c337eb341d3cd (28 October 2026)

- Fixed `scripts/schedule-policy.mjs` so `evaluateNextPublication` no longer treats `createdAt` as a publication timestamp. Added regression coverage for `published`, `public`, `private` and `unlisted` remote states where only creation/scheduled timestamps exist.
- Automation/security: [395 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536588).
- Content quality: [395 Node tests, 0 failures, 0 skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536513). Metadata: [395 Node tests, 0 failures, 0 skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536515). Lockfile/FFmpeg integration: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650532906). Dashboard browser E2E: [14 Chromium journeys](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536704).
- Isolated main/candidate baseline: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536584); artifact ID `12798704730`.
- Baseline artifact ZIP SHA-256: `1dcd3b26a7fd69b3f2e5877238a2c31bb17d2ec1073cb2552a5ec1c62a66894d` (computed from the downloaded artifact ZIP; artifact ID `12798704730`).
Production readiness [remains blocked](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536632); Meta workflow [passed local validation but skipped external draft creation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536549).
- Live refs at candidate: main `fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 1,887 ahead / 2 behind / 170 changed files. PR #1 remains open, draft and unmerged.
- `DASH-001` remains `NOT_TESTED`; full dashboard/API acceptance, genuine rights-cleared production assets and human approval, owner-approved cadence, external YouTube/Meta verification, complete operational recovery/deployment drills, branch protection and full divergence review remain open. No live upload/post, visibility change, campaign activation, merge, `main` edit or destructive Git operation occurred.

---

# Current Release Evidence — 2026-10-28

## Exact tested source/test candidate

- **Exact tested candidate:** `cfa4e3c3b18e8fd2e799a676f56b32ade766d072`.
- **Timestamp-safety code commit:** `1b64a5d7859ed16c74bc10b518bfee8a6924aba9`.
- **Timestamp-safety regression test commit:** `24d792b51dee6ab4020601e225dbb6d0625b39f4`.
- **PR #1:** [Draft PR #1](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1), open and unmerged.
- **Base:** `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.
- **Branch divergence at this candidate:** 1,882 commits ahead, 2 behind, 170 changed files. Full non-destructive history review remains a blocker. No reset, rebase, force-push, merge or main edit was performed.

## Code and tests

1. `scripts/schedule-policy.mjs` does not fall back to `createdAt` or planned `scheduledAt` when remote state is `published`, `public`, `private`, or `unlisted` but the actual publication timestamp is absent. It requires `actualPublishedAt` or `publishedAt` and fails closed otherwise.
2. `test/schedule-policy.test.mjs` covers all four remote states when creation/scheduled timestamps exist but actual publication time is missing.
3. Caller-supplied spacing below 72 hours is rejected in both the publication-slot validator and next-publication gate; regression tests cover negative, zero and sub-72-hour overrides and accept 72/96-hour settings.
4. `validateCadenceDecision` centralizes owner-cadence validation. It requires explicit owner approval, a valid timezone-qualified approval timestamp, a supported mode/reference and a mathematically feasible policy. This does not supply owner approval or authorize a cadence.

## Exact-candidate CI

- Automation/security [run 40650196598](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650196598): **PASS** — 394 Node tests, 0 failures, 0 skips; 16 Python tests passed; `npm audit` reported 0 vulnerabilities; FFmpeg/ffprobe integration, syntax and compilation checks passed.
- Content quality [run 40650196513](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650196513): **PASS** — 394 Node tests, 0 failures, 0 skips; renderer integration checks passed.
- Metadata validation [run 40650196606](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650196606): **PASS** — 394 Node tests, 0 failures, 0 skips.
- Dashboard browser E2E [run 40650196545](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650196545): **PASS** — 14 Chromium journeys.
- Isolated main/candidate baseline [run 40650196481](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650196481): **PASS** — main `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate `cfa4e3c3b18e8fd2e799a676f56b32ade766d072` each completed dependency installation, Node tests and Python tests with exit code 0. Artifact ID `12799476452`.
- Production readiness [run 40650196516](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650196516): **BLOCKED as intended** — 13 prerequisites remain; both readiness modes returned exit code 2. This is not release acceptance.
- Nature Frontiers Facebook draft workflow [run 40650196549](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650196549): local candidate validation **PASS**; external `create-draft-package` job **SKIPPED**. No external Meta draft creation is verified.

## Live Metricool safety finding

Metricool exposes one brand labelled **Nature Frontiers**. The inspected queue contained eight upcoming Facebook/Instagram promotional posts with `draft: false` and `autoPublish: true`; post `406357273` showed as published with a scheduled timestamp of 2026-10-27 10:00 SAST. The tool did not provide its actual remote publication timestamp. Existing scheduled posts were not changed by this implementation run. Owner intervention is required to prevent unwanted future cross-platform promotions; do not treat this integration state as safe.

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
