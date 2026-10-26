# Current release checkpoint — 26 October 2026, 22:20 SAST

This section supersedes the older checkpoint claims below for current branch state and the most recent source/test tree. Older entries are historical evidence and must not be read as proof for later code.

## Exact Git state at this checkpoint
- **Exact tested source/test SHA:** `46551b175583db51cb48976755b4e52a8abcdea1`.
- **Application-code commit:** [`8cfb24b`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/8cfb24b3979763e505fdf59a95e1f1d8879ced66).
- **Regression-test commit:** [`46551b1`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/46551b175583db51cb48976755b4e52a8abcdea1).
- `main` HEAD: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`; divergence: **1,481 ahead / 2 behind**; PR reports **148 changed files**.
- PR #1 remains **OPEN, DRAFT, UNMERGED**. No main edits, merge, reset, rebase, force-push or destructive reconciliation occurred.

## Changes in this checkpoint
- Source-segment binding now accepts only an explicit scene ID that exists exactly once in the reviewed long-form timeline and contains the submitted time range. An asset ID can no longer substitute for a scene ID.
- Added a regression test proving that an asset-only identifier is rejected even when it appears as a timeline asset ID.
- This is a targeted fail-closed correction. It does not prove successful real-artifact binding, native Related video eligibility, or full Short-to-parent end-to-end acceptance.

## Exact-SHA CI evidence for `46551b175583db51cb48976755b4e52a8abcdea1`
- **Automation/security — PASS:** 322 Node tests passed, 0 failed or skipped; 8 Python safety tests passed; locked install, JavaScript syntax and Python compile checks passed; npm audit reported 0 vulnerabilities. [Run 40394411415](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40394411415).
- **Content quality — PASS:** [Run 40394411376](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40394411376).
- **Metadata validation — PASS:** [Run 40394411479](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40394411479).
- **Isolated main/candidate baseline — PASS:** [Run 40394411326](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40394411326).
- **Dashboard browser E2E — IN PROGRESS when this checkpoint was recorded:** [Run 40394411338](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40394411338). Do not count this as a pass until it finishes successfully.
- **Production readiness — BLOCKED:** [Run 40394411469](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40394411469). The run reports 13 blockers, including missing approved manifests/media, unresolved cadence approval, unverified full YouTube history and missing YouTube CI credentials.
- **Facebook daily draft — SKIPPED:** [Run 40394411339](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40394411339). This is not evidence of Meta Page verification or successful draft integration.

## Acceptance verdict
**CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.** The targeted source-segment correction is committed and the automation, content-quality, metadata and baseline workflows pass on the exact tested SHA. Browser E2E is not yet verified for this SHA. No real media, human realism review, live YouTube identity/history verification, successful authorized Facebook draft, feasible owner-approved cadence, exhaustive recovery drills or owner-controlled governance resolution are evidenced by these CI results.

Public/unattended YouTube publishing remains disabled; Facebook live publishing remains disabled; Safari campaigns remain inactive; the approved Selar destination remains `https://selar.com/0u19v8u99l`. No upload, public post, campaign activation, visibility change or PR merge occurred.

---

# Latest exact-SHA checkpoint — 26 October 2026 (supersedes earlier checkpoint below)

## Live Git state at the tested code checkpoint
- **Application-code SHA:** `f0bf2278cd093859cbee49ac473e828c6ff785a9`
- **Exact tested source/test SHA:** `8d754b0a01c81ce1957ba25a7c8112eaa2e8a1b4`
- PR #1 was at tested HEAD `8d754b0a01c81ce1957ba25a7c8112eaa2e8a1b4` when these workflows ran; later documentation-only commits may advance the current PR HEAD.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`; divergence at tested HEAD: **1,464 ahead / 2 behind / 148 changed files**.
- PR #1 remains open, draft and unmerged. No direct main edits, merge, reset, rebase, force-push, history rewrite or destructive reconciliation.

## Newly implemented safety checks
- Parent binding requires an explicit valid `SONICVHIBEZ_CHANNEL_ID` and matches the upload receipt's channel ID to it; a receipt cannot self-assert its own channel identity.
- Parent binding now also requires the remote receipt title to exactly match the title in the hash-verified approved parent metadata revision.
- Added unit regression tests for missing/invalid/mismatched channel identity, wrong channel title, missing/malformed receipt, and remote-title mismatch.
- Commits: [85f9258](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/85f9258d441e926e31facc1330b68fc2f8b268b8), [d9ab366](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/d9ab3667a21123c829df4e18c96a3d8ca2897a89), [8c085e1](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/8c085e1347144ad94dede6884619232d5c7278fd), [abcda0e](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/abcda0efe45f78f5164aa79396904f7679d1c97f), [f0bf227](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/f0bf2278cd093859cbee49ac473e828c6ff785a9), [8d754b0](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/8d754b0a01c81ce1957ba25a7c8112eaa2e8a1b4).

## Exact-SHA results for `8d754b0a01c81ce1957ba25a7c8112eaa2e8a1b4`
- Automation/security **PASS** — **321 Node tests, 0 failures or skips**, 8 Python safety tests, install/syntax/compile checks, dependency audit with 0 vulnerabilities. [Run 40330156711](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40330156711).
- Dashboard browser E2E **PASS** — 11 Chromium journeys against the real local dashboard/backend. [Run 40330156665](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40330156665).
- Content quality **PASS** [run 40330156751](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40330156751).
- Metadata **PASS** [run 40330156842](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40330156842).
- Isolated main/candidate baseline **PASS** [run 40330157081](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40330157081).
- Production readiness **BLOCKED** [run 40330156666](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40330156666).
- Nature Frontiers Facebook draft **SKIPPED**, not external integration evidence [run 40330156993](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40330156993).

## Still not accepted for production
The dashboard exposes parent binding, but successful binding with genuine approved artifacts and full browser coverage for stale hashes, wrong-channel receipt, queue reorder, concurrent binding, restart and backup/restore remain incomplete. No genuine final Short/long-form package has passed complete provenance/rights, originality, factual, narration/caption, natural-realism and human playback acceptance. YouTube OAuth/channel identity and complete history remain unverified; private parent means native Related video is correctly marked `BLOCKED_EXTERNAL`. Meta Page identity and a successful non-skipped draft workflow remain unverified. Cadence owner decision, full divergent-history review, cross-process recovery/backup/rollback/deployment drills and branch-protection governance remain open.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.** Public/unattended YouTube publishing, Facebook live publishing and Safari campaigns remain disabled. No upload, public post, campaign activation or merge occurred.

---

# Live release checkpoint — 26 October 2026 (current source/test evidence)

This checkpoint supersedes earlier SHA, branch-divergence and test-count claims below wherever they differ. The latest tested source/test tree is **`f3cae44edcc9094bf2f294ff46d583c556462548`**. The last application-code change is **`8c085e1347144ad94dede6884619232d5c7278fd`**; the immediately following test-only change is included in the tested tree. PR HEAD was this tested tree when the evidence was collected.

## Live Git state at test time
- PR #1: open, draft, unmerged — https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- Implementation branch: `codex/marketing-machine-audit-fixes`
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Divergence: 1,452 commits ahead / 2 behind; 148 changed files.
- No main edits, merge, reset, rebase, force-push, history rewrite, destructive reconciliation, upload, public post or campaign activation occurred.

## Implementation in this checkpoint
- Parent binding now requires an explicit, valid `SONICVHIBEZ_CHANNEL_ID` configuration and checks the parent upload receipt's channel ID against that configured identity. It no longer treats the receipt's own channel ID as its own verification authority.
- Added reusable `validateConfiguredSonicVhibezChannel` validation and regression tests for absent/invalid configured IDs, mismatched channel IDs, wrong channel title and malformed/missing receipts.
- Files: `scripts/dashboard-server.mjs`, `scripts/short-parent-relationship.mjs`, `test/short-parent-relationship.test.mjs`.
- Commits: [85f9258](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/85f9258d441e926e31facc1330b68fc2f8b268b8), [d9ab366](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/d9ab3667a21123c829df4e18c96a3d8ca2897a89), [8c085e1](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/8c085e1347144ad94dede6884619232d5c7278fd), [f3cae44](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/f3cae44edcc9094bf2f294ff46d583c556462548).

## Exact-SHA workflow results
All results below apply to source/test SHA `f3cae44edcc9094bf2f294ff46d583c556462548`, not to a future code change:
- Automation/security **PASS** — 320 Node tests, 0 failures; 8 Python safety tests passed; normal and locked install checks, syntax/compile checks and dependency audit passed. [Run 40328924668](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40328924668).
- Dashboard browser E2E **PASS** — 11 Chromium journeys against the real local dashboard/backend. [Run 40328924917](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40328924917).
- Content quality **PASS**. [Run 40328924800](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40328924800).
- Metadata **PASS**. [Run 40328924789](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40328924789).
- Isolated main/candidate baseline **PASS**. [Run 40328924666](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40328924666).
- Production readiness **BLOCKED**; the workflow intentionally fails while mandatory external/production gates remain unresolved. [Run 40328924747](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40328924747).
- Nature Frontiers Facebook draft workflow **SKIPPED**; this is not evidence of Page verification or a successful draft artifact. [Run 40328924901](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40328924901).

## Remaining blockers — no release approval
- The parent relationship UI and API exist, but the browser suite currently verifies control exposure and incomplete-binding rejection; a successful end-to-end parent bind, stale hash, wrong-channel receipt, queue reorder, concurrent bind, and backup/restore relationship journey still need explicit acceptance coverage.
- No real, rights-cleared final Short and long-form exports with complete provenance and human playback review bound to final hashes have been accepted.
- Full script-to-narration/caption/render lifecycle and comprehensive originality/perceptual similarity checks remain incomplete as an accepted production workflow; automated similarity cannot establish legal originality.
- YouTube OAuth/channel identity and full public/private/unlisted history reconciliation remain unverified. The previously supplied channel ID must not be guessed or repaired.
- A private parent is ineligible for native YouTube Related video; the UI accurately records `BLOCKED_EXTERNAL`. No visibility change is authorized.
- Meta Page identity/scopes and a successful non-skipped draft-only workflow remain unverified.
- The `long_form → long_form → short` cycle with 72-hour minimum gaps requires 216 hours for a complete three-gap cycle and conflicts with a 168-hour week; owner decision remains required.
- Full divergent-history review, exhaustive API/dashboard coverage, cross-process fault injection, backup/restore/rollback and deployment/monitoring drills remain incomplete. Branch protection and required checks need owner-controlled governance.
- Public/unattended YouTube publishing, Facebook live publishing and Safari campaign activation remain disabled. Approved Selar URL remains `https://selar.com/0u19v8u99l`.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED. No claim of 100% completion.**

---

## Latest live checkpoint — 26 October 2026: parent source evidence and exact-SHA acceptance

**Application-code SHA:** `02eb5c42b81b479223fd32c262247d75ecf5472d`. **Exact tested source/test SHA:** `02eb5c42b81b479223fd32c262247d75ecf5472d`. **PR HEAD at this checkpoint:** `2f455314d4f75dafe8b9b309ead0040570158e09` (documentation-only descendant after the tested source/test SHA).

- **Live Git state:** `main` `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; **1,447 ahead / 2 behind / 148 changed files**. PR #1 remains **OPEN, DRAFT, UNMERGED**.
- **Automation/security — PASS:** [run 40325797435](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797435): 319 Node tests passed, 0 failed/skipped; 8 Python safety tests passed; normal/locked install, syntax/compile checks passed; npm audit reported 0 vulnerabilities.
- **Content quality — PASS:** [run 40325797106](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797106). **Metadata — PASS:** [run 40325797283](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797283). **Dashboard browser E2E — PASS:** [run 40325797233](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797233), 11 Chromium journeys. **Isolated main/candidate baseline — PASS:** [run 40325797285](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797285), Node/Python commands exited 0 for both main and candidate.
- **Production readiness — BLOCKED:** [run 40325797317](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797317). **Nature Frontiers Facebook draft — SKIPPED:** [run 40325797165](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797165), not integration evidence.
- **Implementation:** the dashboard requests the exact parent quality-evidence path; backend checks submitted scene IDs/time ranges against the explicit long-form scene timeline; the tamper-evident relationship includes that evidence path and SHA-256; private upload rechecks evidence bytes and source segments immediately before remote insert. Tests cover valid/invalid source-segment ranges and updated upload fixtures.
- **Coverage limits:** successful parent binding with genuine approved parent media, real verified upload receipt and a real child media artifact remains **NOT TESTED end-to-end**. No genuine production exports or human playback/realism approval are evidenced. Script-to-narration/captions/multi-scene-render/review is not accepted as one integrated production journey. No verified SonicVhibez OAuth/channel identity/history reconciliation; no verified Meta Page/successful non-skipped draft; cadence still needs an owner-approved feasible policy; exhaustive recovery/deployment drills and full divergent-history review remain incomplete.
- **Safety:** public/unattended YouTube and Facebook live publishing remain disabled; Safari campaigns remain inactive; approved Selar URL remains `https://selar.com/0u19v8u99l`. No live upload/post, campaign activation, visibility change, merge or destructive Git operation occurred.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.**

---

## Live checkpoint — 26 October 2026: Short-parent source-evidence binding

**Application-code SHA:** `02eb5c42b81b479223fd32c262247d75ecf5472d`. **Exact tested source/test SHA:** `02eb5c42b81b479223fd32c262247d75ecf5472d`. **Latest workflow-only PR HEAD:** `baa1fcfee7e71082a187746bae65c7c3d0730650`; it bounds optional FFmpeg installation in the isolated-baseline workflow and does not change application code or tests.

- **Live Git state:** PR #1 HEAD `baa1fcfee7e71082a187746bae65c7c3d0730650`; `main` `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; **1,438 ahead / 2 behind / 148 changed files**. PR #1 remains **OPEN, DRAFT, UNMERGED**.
- **Automation/security — PASS:** [run 40325185979](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185979): 319 Node tests passed, 0 failed/skipped; 8 Python safety tests passed; normal/locked install, syntax/compile checks passed; npm audit reported 0 vulnerabilities.
- **Content quality — PASS:** [run 40325185867](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185867). **Metadata — PASS:** [run 40325185858](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185858). **Isolated main/candidate baseline — PASS:** [run 40325185901](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185901), exact main `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate workflow HEAD `baa1fcfee7e71082a187746bae65c7c3d0730650); Node and Python commands exited 0 in both isolated checkouts.
- **Dashboard browser E2E:** **PASS on exact source/test SHA `02eb5c4`** — [run 40324089738](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40324089738), 11 Chromium journeys. The workflow for the latest workflow-only PR HEAD `baa1fcf` was still **IN PROGRESS** at the last query: [run 40325186030](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325186030). Do not describe that latest run as completed.
- **Production readiness — BLOCKED:** [run 40325185869](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185869). **Nature Frontiers Facebook draft — SKIPPED:** [run 40325185929](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185929), not external-integration evidence.
- **New enforcement:** dashboard parent binding requires the exact parent quality-evidence path; backend checks submitted scene IDs and time ranges against the explicit long-form timeline; the relationship digest includes the evidence path and SHA-256; private upload rechecks evidence bytes and source segments immediately before the remote insert. The regression suite includes valid/invalid scene-range checks and updated upload fixtures. A successful relationship bind with real approved media/receipt is still **NOT TESTED end-to-end**.
- **Remaining blockers:** genuine rights-cleared final exports and human playback/realism review; integrated narration/caption/multi-scene render/review journey; verified SonicVhibez OAuth/channel identity and complete YouTube history/uncertain-attempt reconciliation; native Related video while parent is private; verified Meta Page and successful non-skipped draft run; owner-approved feasible cadence; exhaustive dashboard/recovery/backup/restore/concurrency/deployment drills; full divergent-history review and branch governance.
- **Safety:** public/unattended YouTube publishing and Facebook live publishing remain disabled; Safari campaigns remain inactive; approved Selar URL remains `https://selar.com/0u19v8u99l`. No live upload, public post, campaign activation, visibility change, merge or destructive Git operation occurred.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.** Passing automated checks do not establish the missing real-media, account, authorization, or operational acceptance gates.

---

## Latest verified checkpoint — 26 October 2026, 13:57 SAST: dashboard relationship controls, script gates and multi-scene renderer

**Application-code SHA:** `601f209b6a3fe4db725bf6ad0b915e6b558b8e66`. **Exact tested source/test-tree SHA:** `3c77f53d8c5304a2675af546bf1c34091cc93f96` (includes the code plus the corrected multi-scene test fixture). The tested source/test SHA is the evidence anchor; subsequent documentation-only descendants are not a new application-code revision.

- **Live Git state at tested checkpoint:** PR #1 head `3c77f53d8c5304a2675af546bf1c34091cc93f96`; `main` `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; branch divergence **1,427 ahead / 2 behind**, 146 changed files. PR #1 remains **OPEN, DRAFT, UNMERGED**.
- **Automation/security — PASS:** [run 40318788542](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40318788542): 317 Node tests passed, 0 failed; 8 Python safety tests passed; npm audit reported 0 vulnerabilities; locked installation, syntax checks and Python compilation passed.
- **Content quality — PASS:** [run 40318788499](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40318788499). **Metadata — PASS:** [run 40318788768](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40318788768). **Dashboard browser E2E — PASS:** [run 40318788547](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40318788547), 11 Chromium journeys. **Isolated main/candidate baseline — PASS:** [run 40318788521](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40318788521). **Lockfile workflow — PASS:** [run 40318782361](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40318782361).
- **Production readiness — BLOCKED:** [run 40318788504](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40318788504); failure is a readiness-gate result, not a release pass. **Facebook daily draft — SKIPPED:** [run 40318788540](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40318788540), not external-integration evidence.
- **New implementation:** dashboard Short-parent review form calls the existing authenticated API and fails closed on incomplete requests; script validation now enforces distinct section headings/purposes, non-repeated section narration, required visual/pacing/sound-design directions and exact section-to-full-transcript concatenation; a multi-scene FFmpeg timeline builder supports hash-bound source segments, per-scene framing/colour correction, configured cuts/crossfades and caption burn-in. Scene timing is included in the reproducible edit-plan digest and each scene is checked against its provenance record and source hash.
- **Coverage limits:** the dashboard browser suite covers panel visibility and rejection of incomplete binding, not a successful parent bind with real parent receipt/media. The multi-scene graph and provenance checks are tested, but no real multi-scene export has been rendered and playback-reviewed in this checkpoint. Script-to-narration/caption generation is still not fully integrated as one persisted dashboard workflow. No rights-cleared real exports or realism review are evidenced.
- **Remaining blockers:** authenticated SonicVhibez channel identity/OAuth/history and uncertain upload reconciliation; genuine source and audio rights; approved parent receipt and successful binding persistence/recovery; final exports and human playback; full dashboard/recovery/concurrency/backup/restore acceptance; authorized Meta Page verification and non-skipped draft workflow; feasible owner-approved cadence; complete divergent-history review and branch-protection governance.
- **Safety:** public/unattended YouTube publishing remains disabled; Facebook live publishing remains disabled; Safari campaigns remain inactive; approved Selar URL remains `https://selar.com/0u19v8u99l`. No real upload/post, campaign activation, visibility change, merge, reset, rebase, force-push or destructive Git operation occurred.

---

## Historical checkpoint — 26 October 2026, 13:45 SAST: dashboard Short-parent review UI

**Exact application/source-test SHA:** `eee84beaa7bbdfbc19ec795c0b14cecc289a9342`. This commit contains the dashboard relationship panel and its browser acceptance test; all status claims below are for this exact SHA unless explicitly described as an external prerequisite.

- **Live refs:** PR #1 head `eee84beaa7bbdfbc19ec795c0b14cecc289a9342`; main `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main...codex/marketing-machine-audit-fixes` is **1,422 ahead / 2 behind**; PR reports 144 changed files. PR #1 remains **OPEN, DRAFT, UNMERGED**.
- **Automation/security — PASS:** [run 40316826162](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826162); 312 Node tests passed, 0 failed; 8 Python safety tests passed; npm audit reported 0 vulnerabilities; locked installation, syntax checks and Python compilation passed.
- **Dashboard browser E2E — PASS:** [run 40316826186](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826186); 11 Chromium journeys passed, including the new relationship-panel visibility and incomplete-binding rejection journey against the real local dashboard/API.
- **Content quality — PASS:** [run 40316826193](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826193). **Metadata — PASS:** [run 40316826250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826250). **Isolated main/candidate baseline — PASS:** [run 40316826301](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826301). **Lockfile workflow — PASS:** [run 40316820572](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316820572).
- **Production readiness — BLOCKED:** [run 40316826177](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826177); this is an expected non-release result while external prerequisites and production gates remain unresolved. **Facebook daily draft — SKIPPED:** [run 40316826125](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826125), not integration evidence.
- **Implemented in this checkpoint:** dashboard form calls the existing authenticated `POST /api/jobs/parent-relationship`; lists Short and long-form jobs; exposes exact media path, source-segment JSON, review notes and explicit confirmation; reports relationship digest and separate native Related video status. The browser suite confirms the form exists and an incomplete request returns HTTP 400 without changing saved relationship state.
- **Acceptance limitation:** the successful relationship-binding path is still **NOT TESTED end-to-end** because it requires a genuinely approved parent, verified private-upload receipt, real hashed media/metadata artifacts and matching publication-cycle evidence. This UI test does not establish successful binding, restart/backup persistence, concurrency safety, or native Related video setup.
- **Release verdict:** **CODE ACCEPTANCE BLOCKED / PRODUCTION ACCEPTANCE BLOCKED**. Script-to-narration/captions/multi-scene rendering, real rights-cleared final exports and human playback review, exhaustive dashboard/recovery tests, authenticated YouTube history/channel verification, authorized Meta draft execution, feasible owner-approved cadence, full history review and branch-protection governance remain unresolved.
- **Safety:** public/unattended YouTube publishing remains disabled; Facebook live publishing remains disabled; Safari campaigns remain inactive; approved Selar URL remains `https://selar.com/0u19v8u99l`. No live upload/post, campaign activation, visibility change, merge, reset, rebase, force-push or destructive Git operation occurred.

---

## Historical checkpoint — 26 October 2026: explicit Short-to-parent review and upload binding

**Application source SHA:** `cabd24f750cf68bb801538bc959f9f61e4c03cdf`. **Exact tested source/test-tree SHA:** `defe68872edc1a24e404a17a4e997e98708826b6` (the application source at this SHA includes the same code plus updated regression fixtures). PR HEAD at the start of this checkpoint was `defe68872edc1a24e404a17a4e997e98708826b6`; subsequent documentation-only commits are separate. `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`; divergence at this checkpoint: 1,411 ahead / 2 behind / 144 changed files. PR #1 remains open, draft and unmerged.

### Latest code behavior
- Added a strict Short-parent relationship schema and validator with exact child/parent content IDs, revisions, media and metadata hashes, parent approval digest, verified remote parent video ID, canonical URL, verified SonicVhibez channel identity/title/privacy, same publication cycle, explicit source-scene segments, reviewer/timestamp/notes, tamper-evident relationship evidence and separate native Related video status.
- Added authenticated `POST /api/jobs/parent-relationship`. It requires explicit child and parent media paths, a human-approved long-form parent, a verified private-upload ledger/receipt, matching media/metadata hashes, matching explicit publication-cycle ID, child metadata naming the exact parent ID and canonical URL, and explicit reviewer confirmation plus notes. It stores an audit event and marks native Related video `BLOCKED_EXTERNAL` for a private parent.
- Lifecycle approval and upload-approval validation reject a missing, stale, cross-channel or mismatched parent relationship. The uploader rechecks child/media/metadata/approval hashes, all related artifacts, authenticated channel identity and exact remote parent ID/title/channel/privacy immediately before the irreversible insert. Upload attempt/receipt evidence stores the parent IDs, relationship digest and native Related video status.
- Regression coverage now includes missing/stale relationships, wrong parent/channel/URL, cycle mismatch, invalid native feature claims, upload-approval binding, and mocked parent reconciliation. No test performs a real upload.
- The relationship API is not yet exposed as a dedicated dashboard control and has no dedicated browser journey covering successful bind, stale-parent mutation and restart persistence. Do not treat the entire Short lifecycle as accepted.

### Exact-SHA CI evidence
- Automation/security **PASS** — 312 Node tests, 8 Python safety tests, locked install/compile checks, npm audit 0 vulnerabilities: [run 40311601185](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601185).
- Content quality **PASS** — 312 tests, 0 failures: [run 40311600981](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311600981).
- Metadata validation **PASS**: [run 40311601046](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601046).
- Dashboard browser E2E **PASS** — 10 Chromium journeys: [run 40311602123](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311602123).
- Isolated main/candidate baseline **PASS**: [run 40311601026](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601026).
- Production readiness **BLOCKED** — 13 blockers remain, including complete remote history/uncertain-attempt reconciliation: [run 40311601074](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601074).
- Nature Frontiers Facebook draft workflow **SKIPPED**, not integration evidence: [run 40311601171](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601171).

### Remaining blockers
No genuine rights-cleared final exports or human playback approval; YouTube OAuth/channel identity and complete upload history remain unverified; no owner-approved feasible cadence; native Related video remains blocked while the parent is private; Meta Page identity/draft integration is unverified; the complete script-to-narration/captions/multi-scene-render/review pipeline, exhaustive dashboard matrix, full divergent-history review, backup/restore and deployment drills remain incomplete. Public/unattended YouTube and Facebook publishing remain disabled; Safari remains inactive.

**Verdict: CODE ACCEPTANCE BLOCKED / PRODUCTION ACCEPTANCE BLOCKED.**

---

## Latest implementation checkpoint — 26 October 2026: explicit Short-to-parent binding

**Exact tested application-code SHA:** `9766a5181eeb3a055357bbc8551af2e6f0fdb6f8`. The later release-document commits, if any, are documentation-only and do not change this application code. Live `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`; comparison at this checkpoint: 1,396 ahead / 2 behind / 144 changed files. PR #1 remains open, draft and unmerged.

### Implemented in this checkpoint
- Added `scripts/short-parent-relationship.mjs`: explicit parent/child content IDs, exact child and parent media/metadata hashes, parent approval hash, verified remote video ID, canonical watch URL, SonicVhibez channel identity, remote title/privacy verification, shared publication cycle, source scene segments, reviewer/timestamp, tamper-evident relationship evidence digest, and an honest separate native Related video status.
- Integrated the relationship into lifecycle approval and private-upload approval validation. A Short without a current, exact relationship cannot pass the approval gate.
- Added authenticated `POST /api/jobs/parent-relationship`. It requires explicit child and parent media paths, a human-approved long-form parent, an actual verified private-upload ledger entry and receipt, matching parent media/metadata hashes, matching explicit publication cycle, and child metadata that names the exact parent ID and canonical URL. It rechecks parent receipt and hashes before Short review.
- Updated `scripts/upload-private.mjs` to reject missing/stale parent bindings, revalidate the exact child/metadata/approval and related-artifact hashes immediately before the remote insert, recheck authenticated SonicVhibez identity, and independently re-fetch the exact parent video to verify ID, title, channel and privacy. The receipt/attempt ledger records parent content ID, remote parent ID, relationship digest and native Related video status.
- Added focused relationship and uploader tests; updated isolated upload tests to use a mock verified parent. Tests use fixtures only and do not upload real media.
- A private parent is explicitly marked `BLOCKED_EXTERNAL` for native YouTube Related video. The code does not change visibility or claim that a description URL proves the native feature.

### Exact-SHA workflow evidence
- Automation/security **PASS** — 312 Node tests, 8 Python safety tests, clean install/compile checks, npm audit 0 vulnerabilities: [run 40310763040](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763040).
- Content quality **PASS** — 312 tests, 0 failures: [run 40310763155](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763155).
- Metadata validation **PASS**: [run 40310763002](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763002).
- Dashboard browser E2E **PASS** — 10 Chromium journeys against the real local dashboard/backend: [run 40310762992](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310762992).
- Isolated main/candidate baseline **PASS**: [run 40310762998](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310762998).
- Production readiness **BLOCKED**, as required by unresolved real prerequisites: [run 40310763178](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763178).
- Nature Frontiers Facebook draft workflow **SKIPPED**, not integration evidence: [run 40310763123](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763123).

### Remaining limitations
- The parent-binding API has unit and full-suite coverage, but no dedicated browser journey yet exercises successful parent binding, stale-parent mutation and the entire Short-to-parent-to-approval sequence. The visible dashboard has not yet gained a dedicated parent-binding control.
- No real parent receipt, channel identity, rights-cleared media, full playback approval or native Related video evidence was created during tests.
- Full script-to-narration/captions/multi-scene render/review lifecycle, exhaustive dashboard-control coverage, full divergent-history review, backup/restore and deployment drills remain incomplete.
- Owner must provide a feasible, timestamped cadence approval and verify YouTube/Meta accounts. Public/unattended YouTube and Facebook live publishing remain disabled; Safari remains inactive.
- **Verdict remains CODE ACCEPTANCE BLOCKED / PRODUCTION ACCEPTANCE BLOCKED.** Automated code checks pass on the exact application-code SHA, but the full acceptance criteria are not satisfied.

---

## Latest code checkpoint — 26 October 2026, dashboard authoring and responsive correction

- Live PR HEAD at this checkpoint: 25f920890479271e961b4178f52675d6a811e4e6. Live main: fa00d28e7f58911482686e4ad69fac9f4701a2e6; merge base: 45352b73bb6cc4787b2a49988b575afb754ab627; divergence: 1,352 ahead / 2 behind / 141 changed files.
- Source/test changes now include authenticated dashboard script generation, persisted research brief and generated script, audit records, idempotent completed-result reuse, conflict prevention for changed briefs, explicit RECOVERY_REQUIRED for stale in-flight provider calls, and a render-route guard that prevents an authoring job from bypassing the missing narration/caption/scene integration. The dashboard displays the persisted script safely as text after refresh. A CSS fix addresses the narrow-viewport overflow detected by the first browser run.
- Exact-SHA automation/security PASS: 306 Node tests, 0 failures, 8 Python safety tests, clean install checks and npm audit 0 vulnerabilities ([run 40306582741](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582741)). Content quality PASS ([40306582779](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582779)); metadata PASS ([40306582615](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582615)); isolated main/candidate baseline PASS ([40306583897](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306583897)). Production readiness remains BLOCKED ([40306582834](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582834)); Facebook draft workflow SKIPPED ([40306582827](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582827)).
- Browser E2E is NOT VERIFIED for this checkpoint: the prior SHA 891952af1a2191322b9a411890aecf46ae4d2d9f failed the 375px viewport assertion because the new authoring label/form caused horizontal overflow. The CSS was corrected in 25f920890479271e961b4178f52675d6a811e4e6, but its browser workflow 40306582878 was still queued at the last check. Do not count the prior browser failure as a pass or infer the fix is verified.
- Script generation remains only partially integrated: it does not automatically trigger narration, captions, multi-scene rendering, full playback review, or final hash-bound approval. Authoring jobs with generated scripts are explicitly blocked from using the fixed-manifest renderer to bypass these missing steps. Overall code and production acceptance remain BLOCKED.

---

## Live checkpoint — dashboard authoring integration, 26 October 2026

- Live main SHA: fa00d28e7f58911482686e4ad69fac9f4701a2e6; merge base: 45352b73bb6cc4787b2a49988b575afb754ab627.
- PR #1 live HEAD at this source/test checkpoint: 6acd678f0f52e691b8e54218f089d8874845f5ba. The PR remains open, draft and unmerged; divergence is 1,333 ahead / 2 behind / 141 changed files.
- Implemented since the prior release note: authenticated POST /api/jobs/author invokes the existing source-constrained generation provider from the dashboard, persists the structured result to the selected job through the existing locked/atomic dashboard state, and records audit events. The dashboard now has a research-brief form and renders a queued-job selector. The authoring record explicitly remains not publishable and keeps factual verification, originality, rights, human editorial review, measured narration, captions and rendering gates pending.
- Recovery behavior: same-brief completed requests reuse the persisted result; conflicting revisions are rejected instead of silently replacing a review draft; concurrent requests are rejected; interrupted attempts older than ten minutes become RECOVERY_REQUIRED and are not automatically retried. Provider failures persist a failed authoring record. No external publication API is called by authoring.
- Regression test: the dashboard integration test runs an isolated local mock OpenAI-compatible provider, creates a queued job, invokes the real authenticated dashboard route, verifies the generated script is durably persisted, confirms model originality claims are reset to PENDING, checks all separate review gates remain pending, and verifies idempotent reuse.
- Exact source/test SHA: 6acd678f0f52e691b8e54218f089d8874845f5ba. [Automation/security PASS — 306 Node tests, 0 failures, 8 Python safety tests, npm audit 0 vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546768); [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546692); [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546657); [isolated main/candidate baseline PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546723). [Production readiness BLOCKED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546830) is expected while genuine prerequisites are absent. [Facebook draft workflow SKIPPED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546789). Dashboard browser E2E was pending at last observation: [run 40305546725](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546725); do not count it as a pass.
- Important limitation: this integrates research-to-script generation into a durable dashboard job, but it does not yet connect the generated script automatically to narration generation, caption timing, a multi-scene renderer, perceptual/semantic similarity tooling, or end-to-end approval. The render path still uses the fixed manifest workflow; a generated script does not make the job render-ready or publishable. Code acceptance remains BLOCKED.
- Production remains BLOCKED: real source evidence needs independent review; no verified rights-cleared media, measured final narration, captions, multi-scene output or human playback approval has been demonstrated. YouTube OAuth/channel/history and native Short-parent relationship remain unverified. Nature Frontiers Page/draft integration remains unverified. Owner cadence decision, branch governance, full branch-only history review and exhaustive dashboard/recovery/deployment acceptance remain outstanding. Public/unattended YouTube and Facebook live publishing remain disabled; Safari remains inactive; no upload, post, campaign activation, merge, reset, rebase or force-push occurred.

---

# Current release evidence — 26 October 2026

## Git and PR state

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Source/test SHA with the new content-quality gates: `be11490345ae89938c32af1496f01b75ae20134a`
- Main SHA at the source/test checkpoint: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Divergence at source/test checkpoint: 1,289 commits ahead, 2 behind, 139 changed files.
- PR #1 is open, draft and unmerged. Subsequent documentation commits have advanced the branch; the live PR head must be fetched before using this report as the final-head checkpoint.
- No merge, reset, rebase, force-push, history rewrite, upload, public post or campaign activation occurred.

## Implemented source changes

The source/test candidate adds `scripts/content-quality-gates.mjs`, `scripts/validate-content-quality.mjs`, the source-constrained prompt builder `scripts/build-script-generation-prompt.mjs`, and `scripts/validate-rendered-audio.mjs`. Both renderers require `qualityEvidencePath` and run this gate before FFmpeg. They no longer loop a source clip to fake target duration; they apply seed-bound fit/crop and subtle bounded colour grading, use profile-based audio filtering/compression/loudness normalization/fades, and measure the actual rendered MP4's integrated loudness and true peak before reporting success. The gate validates:

- measured script word count and differentiated sections, source-backed claims and a retained similarity-review record;
- asset provenance and original SHA-256 values against actual files, with commercial-use permission and human rights verification fields;
- deterministic scene selection from a recorded seed and matching edit-plan hash;
- audio profile, measured integrated loudness, true peak, music/ambience separation, fades, rights and human-verified transcript matching, bound to the exact narration bytes;
- a human editorial approval record;
- for Shorts, explicit parent content ID, same cycle, approved parent revision and media hash, SonicVhibez identity, verified remote parent video ID and canonical watch URL.

The native YouTube Related video setting is intentionally separate. Internal relationship validation and a description URL do not prove that YouTube Studio's Related video feature is configured. The publication-stage validator requires `youtubeRelatedVideoStatus=VERIFIED`; manual Studio verification and retained evidence remain necessary.

## Exact source/test SHA CI evidence

All links below are workflows associated with source/test SHA `be11490345ae89938c32af1496f01b75ae20134a`.

- [Automation/security — run 40284726836](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803930): PASS; 299 Node tests passed, 0 failed; npm audit reported 0 vulnerabilities. The workflow also ran clean/locked install checks and other repository validations.
- [Content quality — run 40284726814](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803919): PASS.
- [Metadata validation — run 40284726766](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803925): PASS.
- [Dashboard browser E2E — run 40284726765](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282804001): PASS.
- [Isolated main/candidate baseline — run 40284726848](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803924): PASS.
- [Production readiness — run 40284726890](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803929): BLOCKED as expected; human-readable and JSON readiness returned 2/2 and retained the diagnostic artifact. The blockers include missing verified media manifests, channel ID, OAuth credentials, owner-approved cadence decision and complete upload-history reconciliation.
- [Nature Frontiers Facebook daily draft — run 40284726775](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803928): SKIPPED, not successful Meta integration evidence.

The structured prompt builder is covered by regression tests and produces a prompt; the current TTS workflow still consumes authored scripts rather than automatically invoking an LLM. The deterministic visual adjustments are limited to framing/colour grading of the single manifest footage input; the pipeline does not yet compose a multi-scene storyboard automatically. Prompt-builder integration into an automated authoring service is not claimed. These results apply to source/test SHA `be11490345ae89938c32af1496f01b75ae20134a`, not automatically to later documentation descendants. Fetch and inspect workflows on the exact current PR head before release decisions.

## Relationship and media limitations

The code now has a tested internal parent relationship gate and a separate publication-stage native Related video gate. It does not autonomously set the native YouTube Studio Related video feature. A reviewer must verify it in Studio and retain evidence naming both the Short and parent video IDs.

No real source asset set, generated wildlife sequence, final narration, final captions, finished MP4, rights packet or full-playback editorial review was supplied or independently verified in this execution. No production export was rendered. The code cannot claim naturalistic visual quality, zero reused-content risk, zero copyright claims or monetization eligibility.

## Acceptance status

- Content-quality gate implementation: code checks passed on the source/test SHA; genuine production assets and human editorial review remain BLOCKED_EXTERNAL.
- Internal Short-parent linkage: automated gate tested; native Related video configuration remains NOT_TESTED until Studio evidence exists.
- Code acceptance: BLOCKED overall because the full dashboard matrix, complete branch-only history review, cross-process/fault-injection/recovery drills and deployment acceptance remain incomplete.
- Production acceptance: BLOCKED.
- Public/unattended YouTube publishing: disabled.
- Facebook live publishing: disabled; workflow skipped.
- Safari campaigns: inactive.
- Approved Selar destination remains exactly `https://selar.com/0u19v8u99l`.


## Exact PR/documentation-descendant CI checkpoint

At the time this section was written, live PR metadata reported documentation descendant `5f4cff95e4119f9175bd4b96f702e405aed58a3f`, while this document's application source/test SHA remains `be11490345ae89938c32af1496f01b75ae20134a`. This resolves the stale PR body/documentation SHA discrepancy; the PR body still contains an older historical checkpoint and should not be treated as live-ref evidence.

Exact-HEAD workflow results for documentation descendant `5f4cff95e4119f9175bd4b96f702e405aed58a3f`:

- [Automation/security — run 40284364171](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364171): PASS; 299 Node tests passed, 0 failed; npm audit total 0 vulnerabilities.
- [Dashboard browser E2E — run 40284364156](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364156): PASS; 10 Chromium tests passed.
- [Isolated main/candidate baseline — run 40284364148](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364148): PASS.
- [Metadata — run 40284364176](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364176): PASS.
- [Content quality — run 40284364278](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364278): PASS.
- [Production readiness — run 40284364175](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364175): BLOCKED as intended by external production prerequisites.
- [Facebook daily draft — run 40284364164](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364164): SKIPPED, not Meta integration evidence.

The current PR head at the next fetch may be newer if further documentation commits are made. Do not conflate the application source/test SHA with the PR's documentation descendant SHA.


## Native Related video visibility restriction — official source

The official [YouTube Help instructions for adding a Related video to Shorts](https://support.google.com/youtube/answer/14075157?hl=en-GB) state that the selected target must be **public or unlisted**, and that the channel must have advanced feature access. A private parent is therefore ineligible for the native Related video feature. This repository's private-only upload posture and disabled public/unattended publishing mean the native association is blocked until the owner separately authorizes an eligible parent visibility or decides not to use the native feature. No visibility change was made. The publication-stage relationship validator now rejects private or unknown parent visibility.

## Exact documentation-descendant CI — 26 October 2026

Live PR metadata at this checkpoint reported documentation descendant `06d70ecd28c9ae8330f81cb0ad94c4b4a6351fa2`; application source/test SHA is `be11490345ae89938c32af1496f01b75ae20134a`. The current exact-HEAD runs for that documentation descendant are:

- [Automation/security — run 40284745178](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745178): PASS; 299 Node tests passed, 0 failed; npm audit total 0 vulnerabilities.
- [Browser E2E — run 40284745158](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745158): PASS; 10 Chromium tests.
- [Isolated baseline — run 40284745184](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745184): PASS.
- [Metadata — run 40284745239](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745239): PASS.
- [Content quality — run 40284745194](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745194): PASS.
- [Production readiness — run 40284745174](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745174): BLOCKED as expected.
- [Facebook draft — run 40284745168](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745168): SKIPPED.


## Latest source/test checkpoint — 26 October 2026

A subsequent branch-only change `390919713da239968d391ec7b715dd6173035f3e` adds queued jobs to active publication-spacing checks, so queued timestamps reserve slots. Regression test `e65e859e44f254edddb735def44ca1b8095ab627` verifies same-day collisions, the exact 72-hour boundary and missing queued timestamps. The current source/test SHA is therefore `e65e859e44f254edddb735def44ca1b8095ab627`; the preceding `be11490345ae89938c32af1496f01b75ae20134a` checkpoint remains useful for the Related video visibility-gate change but is no longer the latest test commit.

Exact SHA workflow status at time of update:
- [Automation/security — run 40284971980](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284971980): PASS; 300 Node tests passed, 0 failed; npm audit total 0 vulnerabilities.
- [Content quality — run 40284972016](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284972016): PASS.
- [Metadata — run 40284972151](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284972151): PASS.
- [Isolated main/candidate baseline — run 40284971993](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284971993): PASS.
- [Production readiness — run 40284972044](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284972044): BLOCKED as expected by real prerequisites.
- [Facebook daily draft — run 40284972048](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284972048): SKIPPED.
- [Dashboard browser E2E — run 40284971984](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284971984): IN PROGRESS at the time of this note; do not claim it passed on this SHA until the run completes.


## Script-generation provider implementation — 26 October 2026

Implementation commits:
- https://github.com/clickerrish-art/YT-AUTO-VISE/commit/1a393a652fd89bf1516b61a3ad1be74f73fbf79b — added `scripts/generate-script.mjs`, an optional configurable OpenAI-compatible provider that defaults to a loopback endpoint.
- https://github.com/clickerrish-art/YT-AUTO-VISE/commit/6182af1255ecf780b8ffd507eee9bc458136a33e — added regression tests for valid output, source URL substitution, malformed output, remote plaintext endpoint rejection and provider failure.
- https://github.com/clickerrish-art/YT-AUTO-VISE/commit/14bc3daf8faaade5d79275cd8c9b32f56f340d5a — added the `npm run script:generate` command.
- https://github.com/clickerrish-art/YT-AUTO-VISE/commit/12c089305be633d12db29172f4e531d2417d7ad4 — prompt source listing now includes stable source IDs.

The generator does not claim factual accuracy or originality based on model assertions. It verifies returned source identifiers/titles/URLs against the brief, measures narration and structure, requires section narration to concatenate exactly to the transcript, forces similarity review back to PENDING, and sets `publishable=false`. It emits JSON to stdout and does not write production state or call publication APIs. Configure `SCRIPT_GENERATION_ENDPOINT`, `SCRIPT_GENERATION_MODEL`, and optionally `SCRIPT_GENERATION_API_KEY`; loopback HTTP and HTTPS endpoints are permitted, remote plaintext HTTP is rejected. Default endpoint is `http://127.0.0.1:1234/v1/chat/completions`.

**Integration limitation:** this is now an executable generation command, but it is not yet a dashboard/lifecycle worker integration. Research provenance, similarity review, editorial review, actual rendered speech duration and final artifact approval remain independent gates. The new tests and full regression suites must be confirmed on the exact current HEAD before this addition is marked PASS. Production remains BLOCKED.


### Follow-up CI result and test-fixture correction

The first CI execution for the generator code checkpoint `12c089305be633d12db29172f4e531d2417d7ad4` exposed a test-fixture defect: the three negative-path tests invoked Short generation without the required explicit SonicVhibez long-form parent. The automation/security, content-quality, metadata and isolated-baseline workflows therefore failed at this checkpoint; browser E2E passed, production readiness remained blocked, and the Facebook draft workflow was skipped. This failure is not concealed or counted as a pass.

The fixture was corrected in commit https://github.com/clickerrish-art/YT-AUTO-VISE/commit/ebbf799d29479c8e549ebb75617eb024a5d15ca3. Provider redirects were then disabled in https://github.com/clickerrish-art/YT-AUTO-VISE/commit/dae5eb43889f6870672621937914ef7595a04d2c. As of this note, GitHub's PR-triggered workflow lookup has not returned new runs for these later commits, and local repository execution is unavailable in this environment. Therefore the corrected tests are **NOT VERIFIED on the latest application-code SHA**; the prior failures remain recorded, and no green result is inferred. Request a fresh CI execution from a normal branch push or authorized workflow run before treating the generator as accepted.


### Follow-up exact application-code CI — `dae5eb43889f6870672621937914ef7595a04d2c`

The corrected fixture and redirect hardening were tested by GitHub Actions after the previous note was written. These runs explicitly checked out application-code SHA `dae5eb43889f6870672621937914ef7595a04d2c`:
- [Automation/security — run 40288075144](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288075144): **PASS** — 304 Node tests passed; 8 Python tests passed; npm audit reported 0 vulnerabilities; lock/install checks, queue policy checks and Python syntax compilation completed.
- [Content quality — run 40288074937](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288074937): **PASS**.
- [Metadata — run 40288074988](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288074988): **PASS**.
- [Dashboard browser E2E — run 40288075040](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288075040): **PASS**, 10 browser tests.
- [Isolated main/candidate baseline — run 40288074935](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288074935): **PASS**.
- [Production readiness — run 40288074986](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288074986): **BLOCKED as intended**; the workflow's failure exit is the readiness gate enforcing unresolved production blockers, not a passing production result.
- [Nature Frontiers Facebook draft — run 40288074948](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288074948): **SKIPPED**, not Facebook integration evidence.

This supersedes the preceding statement that no new CI had returned. The earlier failure on SHA `12c089305be633d12db29172f4e531d2417d7ad4` remains historically recorded and is not counted as a pass. CI acceptance for the application-code checkpoint `dae5eb43889f6870672621937914ef7595a04d2c` is PASS; overall code and production acceptance remain BLOCKED for the independent dashboard/recovery/history/governance and external prerequisites listed above.


## Evidence-constrained script generation follow-up — exact test SHA `684c262169bd6bfde131e5380ead4128b19372bf`

The generation provider now requires each research input to include a substantive `evidenceSummary` (at least 40 characters) and an `evidenceLocator`, includes those fields in the authoring prompt, and requires each section to carry visual direction, pacing and sound-design notes. Model-returned source IDs/titles/URLs must still match the supplied source list exactly. Added regression coverage for missing research evidence and missing scene direction.

Exact-SHA CI results for `684c262169bd6bfde131e5380ead4128b19372bf`:
- [Automation/security — run 40288463303](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288463303): **PASS** — 305 Node tests, 8 Python tests, npm audit 0 vulnerabilities, clean/locked install and Python syntax checks.
- [Content quality — run 40288463345](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288463345): **PASS**.
- [Metadata — run 40288463446](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288463446): **PASS**.
- [Dashboard browser E2E — run 40288463382](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288463382): **PASS**, 10 browser tests.
- [Isolated main/candidate baseline — run 40288463510](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288463510): **PASS**.
- [Production readiness — run 40288463438](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288463438): **BLOCKED as required** by mandatory production gates.
- [Nature Frontiers Facebook draft — run 40288463312](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40288463312): **SKIPPED**, not live Page or draft-execution evidence.

These runs explicitly checked out the exact test SHA above. The current application-code checkpoint is `3110140b79cc1e835eb1dd75721e26a16f40150b` (generation/prompt code), with subsequent test-only commits through `684c262169bd6bfde131e5380ead4128b19372bf`. Overall code and production acceptance remain BLOCKED despite these passing automated checks.


## Live implementation checkpoint — 26 October 2026 (candidate `a912d3c724195fb1f3ca823d186cddf8b9b4f984`)

Starting PR HEAD for this work was `2c0475b5fb0e38dfb85e962487b42266454bac0a`. Live refs were rechecked before editing: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 1,320 commits ahead / 2 behind, 141 changed files. PR #1 remains open, draft and unmerged. No reset, rebase, force-push, merge or main-branch write was performed.

Implementation commits:
- [`3dbccd1`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/3dbccd19584cb9da81e646cb9c34a65184fcd47b) — research source normalization now rejects malformed records, non-HTTPS and placeholder URLs, embedded credentials, duplicate/empty IDs and over-limit source lists before contacting the configured provider.
- [`a912d3c`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/a912d3c724195fb1f3ca823d186cddf8b9b4f984) — regression tests prove malformed, insecure, duplicate and missing research sources fail before provider access.

Exact candidate CI is in progress at the time this note was written: automation/security [run 40302828218](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828218), dashboard E2E [40302828398](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828398), metadata [40302828303](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828303), content quality [40302828279](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828279), isolated baseline [40302828254](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828254), readiness [40302828489](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828489). Facebook daily draft [run 40302828351](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828351) is **SKIPPED**, not an integration pass. Do not treat in-progress checks as passes.

This change closes one code-level input-validation defect only. It does not integrate script generation into the dashboard/job lifecycle, implement a multi-scene renderer, prove rights/originality/realism, or clear account/cadence/media/recovery blockers. Current verdict remains **CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED** pending exact-SHA CI results and unresolved acceptance gates. Public/unattended YouTube publishing, Facebook live publishing and Safari campaigns remain disabled/inactive.
