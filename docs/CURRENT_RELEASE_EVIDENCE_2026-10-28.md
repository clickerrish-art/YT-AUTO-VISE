

## Latest verified implementation checkpoint — 28 October 2026

- **Exact source/test candidate:** `986fe282b84c14f72d7c735c46259ca15722b858`. Source fix commit: `fbef6bc3f42d65fc712b2db3831bcaa4326cdfae`.
- **Fix implemented:** `validatePublicationSlot` no longer substitutes `createdAt` for missing `scheduledAt` on active reservations. Queued, queued-for-publication, pending-schedule, scheduled, uploading, uncertain and recovery-required states now fail closed when the reservation timestamp is absent.
- **Regression:** `test/schedule-policy.test.mjs`, test “active reservations never fall back to createdAt when scheduledAt is missing”.
- **Exact-SHA automation/security:** [397 Node tests passed, 0 failures, 0 skips; 16 Python tests passed; npm audit reported 0 vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40659295493).
- **Exact-SHA content quality:** [397/397 Node tests passed, 0 skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40659295386).
- **Exact-SHA metadata validation:** [397/397 Node tests passed, 0 skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40659295376).
- **Dashboard browser E2E:** [15 Chromium journeys passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40659295383). This is not full per-control/per-route acceptance; keep `DASH-001` `NOT_TESTED`.
- **Isolated main/candidate baseline:** [passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40659295381); [artifact 12802324377](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40659295381/artifacts/12802324377), ZIP SHA-256 `6e4d1a3e8dcb5414cb45abab91daab9f47fa67bfe4c0b887763a24821fe51419`.
- **Production readiness:** [blocked, correctly fail-closed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40659295494); [diagnostic artifact 12802583446](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40659295494/artifacts/12802583446). Do not treat this expected safety block as a test-suite pass.
- **Meta/Metricool:** [workflow passed its local validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40659295394), but that does not establish an external draft artifact or alter the separately observed eight live scheduled records.
- **Live Git state at the source/test checkpoint:** `main` `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; 1,898 commits ahead, 2 behind, 171 changed files; PR #1 open, draft and unmerged. Subsequent evidence-document commits are documentation-only; do not treat them as newly tested source/test changes.
- **Still blocked:** full dashboard/API acceptance; exhaustive divergence/history review; owner-approved feasible cadence; genuine rights-cleared production media and hash-bound human approval; verified SonicVhibez OAuth/channel identity and complete remote history; native Short Related-video eligibility; genuine Meta draft create/read-back; external scheduled-post owner decision; full recovery/deployment drills; branch protection verification.
- No live upload/post, visibility change, campaign activation, merge, edit to `main`, or destructive Git operation was performed.

---

## Exact source/test candidate — eab2e53440fa7c2ce611c4608b67c019a59ca5c7 (28 October 2026)

- **Schedule-history hardening:** `evaluateNextPublication` rejects remote `published`, `public`, `private` and `unlisted` history when `actualPublishedAt`/`publishedAt` are missing, even if `createdAt` or `scheduledAt` exists. A separate test confirms `publishedAt` remains a valid actual timestamp alias.
- **Dashboard mobile acceptance:** added a real Chromium test that connects the dashboard at 320px and asserts both document and body widths do not exceed the viewport. Browser suite passed 15/15 journeys.
- Automation/security: [396 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430244). Content quality: [396/396, zero skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430186). Metadata: [396/396, zero skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430267). Lockfile/FFmpeg integration: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651423326). Browser E2E: [15 Chromium journeys](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430378).
- Isolated main/candidate baseline: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430324); artifact ID `12799084851`, ZIP SHA-256 `${baselineSha}`.
- Production readiness [correctly remains blocked](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430301) by mandatory prerequisites. Meta draft workflow [passed local validation but skipped external draft creation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40651430170).
- Main `${main}`; merge base `${mergeBase}`; candidate divergence 1,892 ahead / 2 behind / 170 changed files. PR #1 remains open, draft and unmerged.
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


---

## Exact-SHA Meta adapter security repair — 28 October 2026

**Source/test candidate:** `ecad7ac2c706983e79c6206bbccb1a6fcaeb3bd9`  
**Application source fix:** `e090b19136d9336c45fd1a01c4c90400c05405d4`  
**Remote-ID boundary fix:** `b47d08614fa31074d2118cadc98df356478784b2`

### Defects fixed

1. **Remote post-ID prefix collision:** `fetchMetaPagePost` previously accepted any remote ID beginning with the configured Page ID, so a longer Page ID could share the prefix. It now validates the configured Page first and requires the exact Page ID, underscore separator, and non-empty suffix. The regression proves colliding, separator-free, and empty-suffix IDs are rejected before a Graph API request.
2. **Symlink escape in media upload:** lexical path containment alone did not stop a symlink located inside the configured media root from pointing outside it. The adapter now uses `resolveRegularFileNoSymlinks`, retains repository-root confinement, and rejects symlinked or non-regular files before reading/probing/uploading. The regression points an in-root symlink at an outside file and verifies that neither ffprobe nor the remote POST is called.

### Exact-candidate automated evidence

- Automation/security [run 40661176042](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176042): **PASS** — 399 Node tests, 0 failures, 0 skips; 16 Python tests passed; `npm audit` reported 0 vulnerabilities; FFmpeg 6.1.1 was installed; JavaScript syntax and Python compilation checks passed. Both new Meta regression tests appear in the run log.
- Content quality [run 40661176110](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176110): **PASS** — 399/399 Node tests, 0 failures, 0 skips.
- Metadata validation [run 40661176011](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176011): **PASS** — 399/399 Node tests, 0 failures, 0 skips.
- Dashboard Chromium E2E [run 40661176112](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176112): **PASS** — 15 tests. This remains a useful journey suite, not exhaustive per-control/API acceptance.
- Isolated main/candidate comparison [run 40661176071](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176071): **PASS** — Node and Python commands exited 0 for both main and candidate. The isolated baseline runner could not install FFmpeg and explicitly warned that its renderer integration test would skip there; the candidate automation workflow installed FFmpeg and passed with zero skipped tests. Artifact [12804520728](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176071/artifacts/12804520728), ZIP SHA-256 `89c7bf8f49f976a9b57e711cbafc71eaba2470e081a3416f85166c6f2518e586`.
- Production readiness [run 40661176424](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176424): **BLOCKED/failed closed**, as expected while owner-controlled prerequisites are absent.
- Facebook draft workflow [run 40661176046](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176046): local validation **PASS** (15 tests); remote draft creation was **SKIPPED**, so no external draft receipt is claimed.

### Current repository and release status

- Live `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- At this evidence refresh, live compare reports 1,906 commits ahead / 2 behind / 171 changed files before this documentation-only refresh. Recheck refs before any future integration; full non-destructive history reconciliation remains open.
- Acceptance register now has 51 requirements: 35 PASS, 8 NOT_TESTED, 8 BLOCKED_EXTERNAL. The two newly fixed Meta defects are recorded as `META-ASSET-PATH-001`.
- PR #1 remains open, draft and unmerged. No edit to `main`, merge, reset, rebase, force-push, external post, campaign activation, or visibility change occurred.
- Production remains **NOT READY**. Dashboard/API exhaustive acceptance, the full branch-history review, real media and rights/human approval, verified YouTube identity/history, authorized private upload, native Short Related-video verification, external Meta draft read-back, the owner decision on eight Metricool schedules, owner-approved cadence, and isolated deployment/rollback drills remain unresolved.


## Non-destructive history note — test-file preservation

Live `main` is `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; its latest commit is explicitly titled **“Revert unintended test-file write to default branch”** and its diff deletes `test/restore-facebook-draft-history.test.mjs` from `main`. The implementation branch still contains that test file (current blob SHA at this inspection: `b6d4ab9c30d1e025bf2e55bddae446d96a2cb2a3`). This is a verified branch/base discrepancy, not a reason to delete the branch regression test. Preserve it and its history; do not resolve this divergence by merging, resetting, rebasing or force-pushing. The complete inventory of branch-only commits and the other base-only commit still requires a dedicated, non-destructive history review.

## Latest exact-SHA checkpoint — 28 October 2026

**Tested source/test SHA:** `c6b93328a92b48539650c96b647989fd9538623f`. The Meta adapter now requires calendar-valid, timezone-qualified schedule timestamps before any remote mutation, in addition to exact Page-ID-boundary checks and symlink-resistant image path handling. Regression tests prove invalid timestamps, ambiguous remote IDs and symlinked image assets are rejected before any external request.

- Automation/security [40662366736](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40662366736): **PASS** — 400 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg 6.1.1; syntax and compilation checks passed.
- Content quality [40662366691](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40662366691): **PASS** — 400/400, zero skips.
- Metadata validation [40662366690](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40662366690): **PASS** — 400/400, zero skips.
- Dashboard Chromium E2E [40662366676](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40662366676): **PASS** — 15 tests; not exhaustive per-control/API acceptance.
- Isolated baseline [40662366734](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40662366734): **PASS** — main and candidate Node/Python commands exited 0; FFmpeg 6.1.1 was available. Artifact [12804756911](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40662366734/artifacts/12804756911), ZIP SHA-256 `fa645973cfb2a6927aad8a4bdbec2af06d30b448df89f897f4a10cfcf3a1a994`.
- Production readiness [40662366746](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40662366746): **BLOCKED/failed closed**, with diagnostic artifact [12804562115](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40662366746/artifacts/12804562115).
- Facebook workflow [40662366692](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40662366692): local validation passed 15/15; remote draft creation was **SKIPPED**.

The acceptance register now contains 52 requirements: 36 PASS, 8 NOT_TESTED, 8 BLOCKED_EXTERNAL. The tested candidate's live Git snapshot was `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 1,924 ahead / 2 behind / 172 changed files. Later commits are documentation-only. PR #1 remains open/draft/unmerged; `main` remains unchanged.

**Production is still not ready.** Full dashboard/API acceptance, full branch-only history inventory, genuine rights-cleared media and human approval, verified SonicVhibez identity/history and authorized private upload, native Short Related-video evidence, actual Meta draft read-back, owner-approved feasible cadence, the eight Metricool schedule decision, and isolated deployment/rollback drills remain unresolved.

## Caption timestamp regression — exact source/test candidate 28 October 2026

**Source/test candidate:** `e5f866d910db3a572a280f59c4c9ba17d4061c7f`. The caption validator now rejects SRT timestamps with minute or second fields above 59, while still allowing hour values above 23, and reports invalid parsed values as invalid timestamps. Regression coverage includes `00:60:00,000`, `00:00:60,000`, and valid long timelines.

- Automation/security [40664139349](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664139349): **PASS** — 401 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg 6.1.1.
- Content quality [40664139298](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664139298): **PASS** — 401 Node tests, 0 failures, 0 skips.
- Metadata validation [40664139374](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664139374): **PASS** — 401 Node tests, 0 failures, 0 skips.
- Dashboard Chromium E2E [40664139278](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664139278): **PASS** — 15 browser journeys; not exhaustive per-control acceptance.
- Production readiness [40664139308](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664139308): **BLOCKED/failed closed**, as intended when external prerequisites are absent.
- Facebook draft workflow [40664139317](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664139317): local candidate validation passed; actual external draft creation job was **SKIPPED**.

An isolated baseline comparison for this exact source/test candidate has not yet been verified; the older baseline run must not be reused as proof for this candidate. The acceptance register records that limitation. This fix does not prove real media quality, caption-to-speech semantic alignment, rights ownership, or human playback approval.

At the candidate snapshot, `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, divergence 1,936 ahead / 2 behind / 172 changed files. PR #1 remains open/draft/unmerged. The full branch-only history inventory remains incomplete. Production remains **BLOCKED**.

## Baseline result resolved — 28 October 2026

Follow-up to the earlier note that exact-candidate baseline evidence was pending: isolated baseline workflow [40664619319](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664619319) completed successfully on documentation-only PR head `a0d71fcbc53bdfa0909328567e4da4a004dd3de8`, whose application source/test candidate remained `e5f866d910db3a572a280f59c4c9ba17d4061c7f). Both `main` and candidate Node/Python test commands exited 0; FFmpeg and ffprobe 6.1.1 were installed. Artifact [12806220430](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664619319/artifacts/12806220430), ZIP SHA-256 `c052006e3424e8ea1d999c517de93a37bca336d2586099ce882464570711bd27`.

This resolves the pending baseline status for the tested source/test candidate. It does not resolve full branch-history reconciliation or production blockers. The source/test SHA remains `e5f866d910db3a572a280f59c4c9ba17d4061c7f`; later commits are documentation-only.

### Exact source/test SHA baseline confirmation

The isolated baseline workflow also ran directly for source/test candidate `e5f866d910db3a572a280f59c4c9ba17d4061c7f`: [run 40664139277](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664139277). Both main and candidate Node and Python commands exited 0, and FFmpeg/ffprobe 6.1.1 were available. Artifact [12804894418](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664139277/artifacts/12804894418), ZIP SHA-256 `cf4efef274a291627572da3407553365090988ecb07b8021797da0bd33e34e5f`. This exact-candidate run supersedes the earlier pending-baseline note.
