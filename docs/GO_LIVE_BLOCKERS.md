# Current authoritative release checkpoint — 29 October 2026

Exact tested source/test candidate: `726e3fca8d0a1a79a76f9d04fefcd440b83f52cc`. Exact-candidate automation/security, content quality, metadata, 15 Chromium browser journeys, isolated main/candidate baseline and full-history branch inventory passed; 420 Node tests passed with zero failures/skips, 16 Python tests passed, and npm audit reported zero vulnerabilities. Production-readiness CI remains intentionally blocked on missing prerequisites.

Current acceptance register: 51 PASS / 8 NOT_TESTED / 8 BLOCKED_EXTERNAL (67 total). Full production readiness is **NOT READY**. DASH-001 exhaustive dashboard/API acceptance and STATE-001 full recovery drills remain NOT_TESTED. Real YouTube identity/history/operation-specific private-upload acceptance, real Meta identity/draft/read-back, genuine rights-cleared assets and human review, native Short-parent evidence, owner-approved cadence and Metricool owner decisions remain unresolved.

The new branch-inventory workflow retained [the complete JSON/Markdown inventory artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917617/artifacts/12889820366): 2,094 branch-only commits, 2 main-only commits, 178 final-tree changed files, 17 critical-path changes, 0 final-tree deletions. The inventory is not human approval to merge; full semantic integration review remains required.

Live tested refs: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; candidate `726e3fca8d0a1a79a76f9d04fefcd440b83f52cc`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; 2,094 ahead / 2 behind / 178 changed files. PR #1 remains open, draft and unmerged. GitHub reports main branch protection disabled; owner/admin configuration is required.

Latest live branch-head inventory at generation time: 2,105 ahead / 2 behind / 178 changed files. The [full-history inventory artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40856736722/artifacts/12888729993) is retained; later commits are documentation-only, and human semantic integration review remains required.

Safety policy remains unchanged: no public/unattended YouTube publishing, no live Meta publishing, no campaign activation, no remote schedule changes without explicit per-record authorization, no visibility changes to satisfy Short association, Nature Frontiers never a YouTube target, Safari inactive, and the approved Selar destination remains `https://selar.com/0u19v8u99l`.

See [exact-candidate release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-29.md), [machine-readable acceptance register](REQUIREMENTS_ACCEPTANCE_REGISTER.json), and [branch reconciliation report](BRANCH_RECONCILIATION_REPORT_2026-10-28.md). Historical blocker details follow.

---

---

---

## Live implementation checkpoint — 29 October 2026, 07:01 UTC

- **Exact tested source/test SHA:** `bc02a73c2bfc39faa11990468778bb98372a551c`. This is the application/test candidate; subsequent documentation commits do not change it.
- **Changes:** `scripts/dashboard-inventory.mjs` now emits semantic, hashed acceptance IDs for controls, forms and routes; `test/dashboard-inventory.test.mjs` adds stability and duplicate-identity regression tests.
- **Exact-SHA verification:** Node suite 416/416 passed, 0 failed, 0 skipped; Python 16/16 passed; npm audit found 0 vulnerabilities; FFmpeg/ffprobe and syntax/compile checks passed. Content quality [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559799), automation/security [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559734), metadata [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559712), dashboard browser E2E [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559722), isolated baseline comparison [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559729).
- **Production readiness:** still fails closed at [run 40832559754](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559754). This is not treated as a test defect. Nature Frontiers workflow [run 40832559778](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559778) validates the local draft-only package; its provider creation job is skipped on the candidate branch, so this is **not** evidence of a real Meta draft.
- **Live refs:** `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; implementation branch at time of source/test verification `bc02a73c2bfc39faa11990468778bb98372a551c`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; comparison `2,059 ahead / 2 behind / 175 changed files`. PR #1 remains open, draft and unmerged.
- **Still not accepted:** DASH-001 exhaustive control/API acceptance; full branch history inventory and integration plan; all-boundary recovery and deployment rollback; genuine production media/rights/final human review; verified YouTube channel/history/private-upload receipt; native Short-parent provider association; real Meta identities and provider-side draft read-back; owner-approved cadence and external campaign decisions. No live upload, post, visibility change, campaign activation or Metricool mutation was performed.
- **GitHub protection:** live branch metadata reports `protected=false` and required status-check enforcement off. No repository settings were changed. Owner/admin action is required to configure branch protection and required checks.

## Controlled recovery test update — 29 October 2026

Candidate 1e55ac4e231db83fa77b6a5f8b5d50997e992c79 adds a separate-process termination regression: a child commits dashboard state and exits before normal cleanup; after its exit is confirmed and the stale lock is explicitly removed, recovery restores the exact prior bytes and clears the journal. The test suite passes at 414 Node tests with zero skips. Evidence: [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466179), [automation/security](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466090), [isolated baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466115).

This closes only one controlled crash point. Full transaction-boundary fault injection, power-loss durability, disk-full and permission failures, repeated recovery, and deployment rollback remain open; STATE-001 and DEPLOY-001 are not accepted. Production readiness remains blocked.

## Verification update — 29 October 2026

Exact source/test candidate `6c08cf0e49647babe3583bedb2d44fffb660cd8f` passed the Node suite (413 passed, 0 failed, 0 skipped), 16 Python tests, npm audit (0 vulnerabilities), FFmpeg/ffprobe integration checks, 15 Chromium dashboard E2E tests, metadata validation and isolated baseline comparison. Evidence: [automation/security](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016434), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016430), [dashboard E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016429), [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016477), [isolated baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016435).

These results do not clear the existing external or operational blockers. The production-readiness workflow remains fail-closed: [run 40831016439](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016439). The Facebook workflow [run 40831016443](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016443) is not evidence of live Meta draft creation; external creation remains unproven. Full branch reconciliation, exhaustive dashboard/API acceptance, controlled process-kill/power-loss recovery, deployment rollback, genuine production media/rights/human review, verified YouTube/Meta identities and owner cadence approval remain unresolved.

GitHub branch-protection details could not be read with the current integration (HTTP 403); the readable ruleset listing returned no rulesets. This is an access limitation, not proof that protection is absent or configured.

## Repository implementation update — 28 October 2026, 20:41 UTC

- **Latest tested source/test candidate:** `379dd09a5990db6c64e94a51f9d7606013e2604d`.
- Backup now refuses to snapshot state while an interrupted restore journal `.restore-transaction.json` remains or is unsafe. The journal is retained for recovery; no backup output is written and the backup's own lock is released.
- Exact-SHA automation/security [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764633734): **411 Node tests, 0 failures, 0 skips**, npm audit 0 vulnerabilities. Metadata [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764633578), content quality [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764633488), browser E2E [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764633651). Isolated baseline [was still running at capture](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764633501).
- Production readiness [remains BLOCKED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764633515). The guard is not proof of process-kill recovery, power-loss durability, or deployment rollback.
- Acceptance register counts: 46 PASS, 8 NOT_TESTED, 8 BLOCKED_EXTERNAL. `DASH-001` and `STATE-001` remain open.
- Live main at candidate verification: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`. PR #1 remains open, draft and unmerged; full branch-divergence reconciliation remains incomplete.

**Production verdict: NOT READY.** No live YouTube or Meta operation was performed, and no external schedule was changed.


---

## Reverified external state — 28 October 2026, read-only

A fresh read-only Metricool query against Nature Frontiers brand `7545638` (`Africa/Johannesburg`) returned the same eight future records documented below. All eight still report `autoPublish=true`, `draft=false`, provider status `PENDING`. The first seven list Facebook as their provider; record `406357554` lists Facebook and Instagram. No remote changes were made.

- `406357296` — 31 October 2026, 10:00 SAST.
- `406357335` — 4 November 2026, 10:00 SAST.
- `406357364` — 7 November 2026, 10:00 SAST.
- `406357388` — 11 November 2026, 10:00 SAST.
- `406357414` — 14 November 2026, 10:00 SAST.
- `406357443` — 18 November 2026, 10:00 SAST.
- `406357483` — 21 November 2026, 10:00 SAST.
- `406357554` — 25 November 2026, 10:00 SAST, Facebook and Instagram.

The scheduled text includes online-business/digital-product promotions as well as wildlife-creator content. Account owner must review the individual IDs, content and destinations and decide what should remain active. This implementation assignment authorizes **no** pause, cancellation, edit or reschedule. If a separate future request authorizes a specific change, read the provider state again after the change and verify it.

Latest exact source/test candidate: `03c60617afab051f0aab745d0c1203d0ed788417`. It passed the automation/security suite (404 Node tests, zero failures/skips; 16 Python tests; zero npm audit vulnerabilities), content-quality, metadata, 15-journey browser E2E and isolated main/candidate baseline workflows. Production readiness remains blocked. Details are in [current release evidence](https://github.com/clickerrish-art/YT-AUTO-VISE/blob/codex/marketing-machine-audit-fixes/docs/CURRENT_RELEASE_EVIDENCE_2026-10-28.md).

---

## Live external blocker refresh — 28 October 2026

### Owner decision required: existing Metricool schedules

Read-only inspection of Nature Frontiers Metricool brand `7545638` (`Africa/Johannesburg`) returned eight future scheduled records. Every record currently has `autoPublish=true` and `draft=false`. Repository dry-run flags do not disable these already-existing remote schedules. No remote state was changed.

| Record ID | Scheduled time (SAST) | Network(s) | Current state |
|---|---|---|---|
| `406357296` | 2026-10-31 10:00 | Facebook | auto-publish enabled, not draft |
| `406357335` | 2026-11-04 10:00 | Facebook | auto-publish enabled, not draft |
| `406357364` | 2026-11-07 10:00 | Facebook | auto-publish enabled, not draft |
| `406357388` | 2026-11-11 10:00 | Facebook | auto-publish enabled, not draft |
| `406357414` | 2026-11-14 10:00 | Facebook | auto-publish enabled, not draft |
| `406357443` | 2026-11-18 10:00 | Facebook | auto-publish enabled, not draft |
| `406357483` | 2026-11-21 10:00 | Facebook | auto-publish enabled, not draft |
| `406357554` | 2026-11-25 10:00 | Facebook and Instagram | auto-publish enabled, not draft |

**Required next action:** owner must explicitly identify which individual records should remain active and authorize any specific pause, cancellation or edit. Do not change any record speculatively. For each authorized change, retain the provider response, read the schedule again, and verify the exact resulting ID, time, network and publication mode. This list contains both wildlife-creator and online-business/digital-product promotions, so review the content/destination fit as part of the decision.

### Latest exact-SHA repository evidence

The current tested source/test candidate is `3f2b2e27bd04c686d279b293d3019f125a344285`. The real-server dashboard API authentication sweep passed; exact-SHA automation/security, content-quality, metadata, dashboard browser E2E and isolated main/candidate baseline workflows passed. The readiness workflow remains blocked by genuine external prerequisites. See [current release evidence](https://github.com/clickerrish-art/YT-AUTO-VISE/blob/codex/marketing-machine-audit-fixes/docs/CURRENT_RELEASE_EVIDENCE_2026-10-28.md). No YouTube upload, visibility change, Meta post, campaign activation, Metricool schedule change, PR merge or edit to `main` occurred.

---

## Exact-candidate dashboard request-size fix — 28 October 2026

- Live implementation/test candidate: `852eb1087cc4a06bafb80d70760ec9915817fe79`; current PR #1 was open, draft and unmerged at verification. `main` remained `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Implemented in `scripts/dashboard-server.mjs`: oversized JSON request bodies above 16KB now return HTTP 413 (Payload Too Large), rather than falling through to generic HTTP 400. `test/dashboard-server.test.mjs` now asserts 413 and retains assertions that the request is rejected without leaking the local state path.
- Exact-candidate automation/security: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40675312590), 401 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe 6.1.1.
- Exact-candidate content quality: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40675312539), 401/401 tests and zero skips.
- Exact-candidate metadata: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40675312486), 401/401 tests and zero skips.
- Exact-candidate dashboard browser E2E: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40675312668), 15 Chromium journeys. This does not close exhaustive per-control/per-route acceptance; `DASH-001` remains `NOT_TESTED`.
- Production readiness: [BLOCKED/fail-closed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40675312615). Meta draft workflow: [local validation passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40675312494), but external draft creation was skipped.
- Exact-candidate isolated baseline comparison: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40675312543). Both exact main and candidate locked installs, Node tests and Python tests exited 0. [Artifact 12809887903](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40675312543/artifacts/12809887903); ZIP SHA-256 `56159f21e0f951549990e321bc824d25977662a876e489d2c26e5ad134132b4a`.
- Git comparison at the implementation/test candidate: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 1,967 ahead / 2 behind / 172 changed files. This is not a completed full divergence review.
- Safety remains unchanged: no live upload/post, campaign activation, visibility change, PR merge, edit to `main`, or destructive Git operation. Nature Frontiers remains prohibited as a YouTube target; public/unattended YouTube and live Meta publishing remain disabled; Safari remains inactive; approved Selar destination remains unchanged.



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

The latest repository-controlled schedule and mobile-overflow regressions pass. Production remains blocked on external identity/history, genuine media/rights and human review, owner cadence approval, native Related-video eligibility, actual Meta draft creation, branch protection and deployment/recovery acceptance. No gate is waived.

---

## Exact-candidate checkpoint — e38e2fe7a5c13a71077bcab6bc3c337eb341d3cd (28 October 2026)

- Fixed `scripts/schedule-policy.mjs` so `evaluateNextPublication` no longer treats `createdAt` as a publication timestamp. Added regression coverage for `published`, `public`, `private` and `unlisted` remote states where only creation/scheduled timestamps exist.
- Automation/security: [395 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536588).
- Content quality: [395 Node tests, 0 failures, 0 skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536513). Metadata: [395 Node tests, 0 failures, 0 skips](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536515). Lockfile/FFmpeg integration: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650532906). Dashboard browser E2E: [14 Chromium journeys](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536704).
- Isolated main/candidate baseline: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536584); artifact ID `12798704730`. Production readiness [remains blocked](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536632); Meta workflow [passed local validation but skipped external draft creation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40650536549).
- Live refs at candidate: main `fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 1,887 ahead / 2 behind / 170 changed files. PR #1 remains open, draft and unmerged.
- `DASH-001` remains `NOT_TESTED`; full dashboard/API acceptance, genuine rights-cleared production assets and human approval, owner-approved cadence, external YouTube/Meta verification, complete operational recovery/deployment drills, branch protection and full divergence review remain open. No live upload/post, visibility change, campaign activation, merge, `main` edit or destructive Git operation occurred.

---

The latest schedule-history fix is repository-controlled and tested on the exact candidate. External gates remain unchanged: verified SonicVhibez identity/history, real media/rights/human review, explicit feasible cadence approval, native Related-video eligibility, real Meta Page/Instagram identities and draft artifact, and owner verification of branch protection. Do not bypass any gate.

---

## Revalidated checkpoint — `914f4e461982836737439e4fa7e8721916aa2e32`

- Source/test candidate `96cb4b06704915c7ee4fb2f0feb1796b41823301`; docs-only PR head `914f4e461982836737439e4fa7e8721916aa2e32`.
- Automated tests pass (384 Node, 0 failures/0 skips; 16 Python; npm audit 0 vulnerabilities; FFmpeg/ffprobe integration; 13 Chromium journeys; isolated baseline).
- Readiness remains BLOCKED by 13 genuine prerequisites ([run](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603126958)); Meta external draft creation was skipped ([run](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603127120)).
- Branch protection could not be verified because the integration received 403; owner verification is required.
- Git compare: 1,846 ahead / 2 behind / 168 files; base-only commits are the test-file add/revert pair. No destructive reconciliation.
- Both `test/restore-facebook-draft-history.test.mjs` and `tests/restore-state.test.mjs` remain present.

**Verdict: NOT READY for production.**

## Current exact-SHA status — 28 October 2026

- Tested candidate: `96cb4b06704915c7ee4fb2f0feb1796b41823301`; current source/test CI passes (384 Node, 0 failures/0 skips; 16 Python; npm audit 0 vulnerabilities; FFmpeg/ffprobe integration; 13 Chromium journeys; isolated baseline).
- Dashboard API acceptance has new malformed-JSON, >16KB body and concurrent-slot assertions, but the full 105-control/38-route acceptance matrix remains incomplete.
- Lockfile workflow FFmpeg setup was repaired and the exact candidate passed: [run 40602634490](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602634490).
- Production readiness remains BLOCKED by 13 genuine prerequisites: [run 40602641438](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641438).
- External Meta draft creation remains SKIPPED: [run 40602641541](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641541).
- Git compare remains 1,845 ahead / 2 behind / 168 changed files. Base-only commits are the test-file add/revert pair; do not reconcile destructively.
- `test/restore-facebook-draft-history.test.mjs` and `tests/restore-state.test.mjs` are preserved.

**Verdict: NOT READY for production.** Keep public/unattended YouTube publishing disabled, live Meta publishing disabled, Safari inactive, and the native Related-video feature blocked while the parent is private.

---

## Latest cross-process restore lock — `b2686b888dabf6099d25aff59d288a514b3caffe`

Restore and interrupted-restore recovery are now serialized with an exclusive `.restore-operation.lock` in the configured state directory. A competing operation fails closed without replacing the existing lock; normal validation failures release the current invocation's lock. A stale lock requires operator verification that no restore is active before removal. Do not delete a lock merely because it is old.

Exact-candidate evidence:
- Automation/security [40593628190](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628190): 379 Node tests, 0 failures, 0 skips; 16 Python tests; normal install; npm audit 0 vulnerabilities.
- Content quality [40593628137](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628137): 379 tests, 0 failures, 0 skips.
- Metadata [40593628366](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628366): 379 tests, 0 failures, 0 skips.
- Dashboard E2E [40593628079](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628079): 13 Chromium journeys.
- Isolated baseline [40593628185](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628185): PASS.
- Readiness [40593628122](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628122): BLOCKED by 13 prerequisites.
- Meta workflow [40593628361](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628361): external draft-creation job skipped; no external draft verified.

This closes restore lock contention and cleanup test cases only. It does not establish full crash/power-loss resilience, stale-lock automatic recovery, exhaustive dashboard/API coverage, deployment/rollback acceptance, real YouTube/Meta operations or production readiness.

---

## Latest restore transaction and startup guard — `b1989a764e54400cddb55158b998c5a375972321`

Restore transaction state is now journaled in the configured application state directory. On a later commit failure the routine rolls back earlier committed destinations, including restoring the exact original dashboard-state bytes. After a process interruption, the next confirmed restore invocation reconciles the journal and stops for operator inspection; the dashboard itself refuses startup while the journal remains. The exact candidate passed all four deterministic restore/startup regression tests in [automation run 40591305237](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40591305237), with 378 Node tests and zero skips.

This closes the deterministic restore transaction cases only. Full filesystem/power-loss drills, cross-process remote-side-effect recovery and isolated deployment/rollback remain `NOT_TESTED`. All 13 production blockers below remain in force.

---

## Latest restore-safety implementation — `31b5f56415b51280baa11418c56ef3c2b1280006`

The state restore implementation now stages all replacement files, persists a recovery journal before the first destination mutation, rolls back a previously committed destination if a later commit fails, and reconciles interrupted journal state on the next confirmed invocation. The exact candidate passed the injected second-rename failure and simulated restart-recovery tests in [automation run 40590357469](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40590357469), with 376 Node tests and zero skips.

This closes the narrow deterministic restore-transaction regression, not the broader operational recovery gate. Full crash/power-loss testing, cross-process concurrency, isolated deployment/rollback and ambiguous remote upload recovery remain `NOT_TESTED`. The 13 production blockers listed below remain in force.

---

## Latest exact-SHA production gate result — 27 October 2026

- Tested candidate: `ac97c8860700dcbfedfb367d4dfbc0c654164479`.
- [Production-readiness run 40588392139](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392139) exits fail-closed with **HOLD: 13 blockers**. This is not a code-test failure and is not production acceptance.
- The readiness execution environment reports the final Short `media/next-short.mp4` missing and `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, and `SONICVHIBEZ_CHANNEL_ID` unconfigured. These findings describe this execution environment; do not infer secret-store status elsewhere.
- The owner-approved feasible cadence decision and timezone-qualified approval evidence are still missing. The requested 2 long-form + 1 Short weekly cadence conflicts with a 72-hour minimum.
- Complete remote public/private/unlisted YouTube history and uncertain attempts must be independently reconciled immediately before any upload.
- Genuine final media, provenance/licences, manifests, full human playback/compliance review and exact-hash approvals remain required. Nature Frontiers must never be the YouTube target.
- Native YouTube Related video remains a separate external gate; do not change visibility to bypass parent eligibility.
- Nature Frontiers Facebook/Instagram live identities/permissions and an actual external draft-creation result are not proven; the external draft job was skipped in [run 40588392305](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392305). Live Meta publishing remains disabled.
- Full backup/restore/restart/uncertain-operation recovery and isolated deployment/rollback drills, branch reconciliation, and branch protection remain incomplete.

No upload/post/campaign activation/visibility change/merge was performed. See [exact-SHA release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-27.md).

---

## Latest verified implementation and CI checkpoint — 27 October 2026, 21:28 UTC

**Exact tested candidate SHA:** `466605be027f531d1c6143a6d1f42e1bf4c2ffcc`. The candidate includes strict Short-parent approval timestamp validation, FFmpeg installation in the content-quality and metadata workflows, and explicit zero-skip assertions in the automation, content-quality and metadata workflows.

- **Automation/security PASS:** [run 40586772617](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772617): 373 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; normal lifecycle-script install, npm audit 0 vulnerabilities, FFmpeg renderer integration, JS syntax and Python compilation passed.
- **Content quality PASS:** [run 40586772612](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772612): 373 tests, 0 failures, 0 skips. **Metadata validation PASS:** [run 40586772614](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772614): 373 tests, 0 failures, 0 skips. Both jobs install FFmpeg/ffprobe and fail if the Node test summary does not explicitly report zero skips.
- **Dashboard browser E2E PASS:** [run 40586772627](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772627), 13 Chromium journeys.
- **Isolated main/candidate baseline PASS:** [run 40586772619](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772619); [retained baseline artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772619/artifacts/12772562360).
- **Facebook workflow PASS for local deterministic draft validation only:** [run 40586772611](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772611); external `create-draft-package` remains skipped, so no live Meta integration is accepted.
- **Production readiness BLOCKED:** [run 40586772604](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772604), fail-closed with 13 genuine production prerequisites.

### Latest implementation fixes

1. Parent relationship and native association approval timestamps must be strict, calendar-valid ISO timestamps with explicit timezones. Regression tests reject timezone-free values, impossible dates and invalid UTC offsets.
2. FFmpeg is installed in content-quality and metadata CI jobs, removing the previous renderer integration skip.
3. CI explicitly fails if the automation, content-quality or metadata Node test summary does not report zero skipped tests.

**Verdict: automated code and CI acceptance pass on this exact candidate SHA; implementation remains partial and production acceptance is blocked.** Genuine rights-cleared media, human approvals, independently verified SonicVhibez identity and complete remote history, secure runtime credentials, owner-approved cadence, live Meta draft creation and complete operational recovery/deployment drills remain unproven.

No upload, post, campaign activation, visibility change, merge, main edit or destructive Git operation occurred. PR #1 remains open, draft and unmerged.

---

## Latest verified implementation and workflow checkpoint — 27 October 2026, 21:25 UTC

**Exact tested candidate SHA:** `9310d961311871c3f6e9d2b1271735129fe45d31`. **Application-code fix:** `ebd4f334683237878bac742e052767faabb4f632`. **CI fixes:** `1702513c9d32e22b99dd218054ce693b246402c7` and `9310d961311871c3f6e9d2b1271735129fe45d31`.

- **Automation/security PASS:** [run 40586342797](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342797): 373 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; normal lifecycle-script install, npm audit 0 vulnerabilities, FFmpeg renderer integration, JS syntax and Python compilation passed.
- **Content quality PASS:** [run 40586342818](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342818): 373 Node tests, 0 failures, 0 skips. **Metadata validation PASS:** [run 40586342777](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342777): 373 Node tests, 0 failures, 0 skips. Both workflows now install FFmpeg/ffprobe before testing; previously each had one FFmpeg-dependent skip.
- **Dashboard browser E2E PASS:** [run 40586342774](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342774), 13 Chromium journeys.
- **Isolated main/candidate baseline PASS:** [run 40586342909](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342909); [retained comparison artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342909/artifacts/12772391880).
- **Facebook workflow PASS for local deterministic draft validation only:** [run 40586342799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342799); remote `create-draft-package` was skipped, so no live Meta integration is accepted.
- **Production readiness BLOCKED:** [run 40586342805](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342805), fail-closed with 13 genuine production prerequisites.

### Implementation fixes

1. Short-to-parent relationship approval and native-association verification timestamps now require strict calendar-valid ISO timestamps with explicit timezones; regression cases reject timezone-free timestamps, impossible dates and invalid UTC offsets.
2. Content-quality and metadata workflows install FFmpeg and ffprobe rather than silently skipping the real renderer integration test.

**Verdict: automated code and CI acceptance pass on the exact tested candidate SHA; implementation is partial and production acceptance remains blocked.** Genuine media/rights, human approvals, verified channel identity and full remote history, secure runtime credentials, owner-approved cadence, live Meta draft creation and full recovery/deployment drills remain unproven.

No upload, post, campaign activation, visibility change, merge, main edit or destructive Git operation occurred. PR #1 remains open, draft and unmerged.

---

## Latest verified implementation checkpoint — 27 October 2026, 21:19 UTC

**Exact source/test SHA:** `9abc4a46ed3ea6e3368ad7af5f24c587baee9411`. **Application code commit:** `ebd4f334683237878bac742e052767faabb4f632`. The new timestamp-hardening regression test passed on the exact source/test SHA.

- **Automation/security PASS:** [run 40585444830](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444830): 373 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; normal lifecycle-script dependency install, npm audit with 0 vulnerabilities, FFmpeg renderer integration, JS syntax checks and Python compilation passed.
- **Dashboard browser E2E PASS:** [run 40585444732](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444732), 13 Chromium journeys against the local dashboard/backend.
- **Content quality PASS:** [run 40585444874](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444874). **Metadata PASS:** [run 40585444697](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444697). Each of these two workflow-specific test invocations skipped one FFmpeg-dependent test because FFmpeg was absent in those jobs; the automation workflow installed FFmpeg and ran the full 373-test candidate suite with zero skips.
- **Isolated main/candidate baseline PASS:** [run 40585444803](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444803). The retained comparison artifact is [available here](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444803/artifacts/12771906551).
- **Facebook workflow PASS for local draft validation only:** [run 40585444973](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444973); external `create-draft-package` was skipped, so no real Meta integration is accepted.
- **Production readiness BLOCKED:** [run 40585444822](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444822); fail-closed report identifies 13 outstanding production prerequisites.

### Implementation change

Short-to-parent relationship approval timestamps and native Related-video verification timestamps now use the strict shared ISO timestamp validator, rejecting timezone-free timestamps, impossible calendar dates and invalid UTC offsets. Regression coverage is in [test commit](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/9abc4a46ed3ea6e3368ad7af5f24c587baee9411).

**Verdict: automated code checks pass at this exact SHA; overall implementation is partial and production acceptance remains blocked.** Genuine production media/rights, human approvals, verified SonicVhibez identity and complete remote history, secure runtime credentials, owner-approved cadence, actual Meta draft integration and full operational recovery/deployment drills are not replaced by CI results. PR #1 remains open, draft and unmerged. No upload, post, campaign activation, visibility change, merge, main edit or destructive Git operation occurred.

---

## Unverified follow-up code checkpoint — 27 October 2026

A new source/test change was committed after the last verified SHA. The latest **verified** source/test SHA remains `4ee5a6c8f1dded39d97d9b30dd70f9e0df2b32cd`. New code commit `ebd4f334683237878bac742e052767faabb4f632` tightens Short-to-parent approval timestamps, and test commit `9abc4a46ed3ea6e3368ad7af5f24c587baee9411` adds regression cases for timezone-free timestamps, impossible dates and invalid offsets. **The new source/test SHA is NOT TESTED**: no workflow runs were returned for it, and a local clone could not be fetched because this environment could not resolve github.com. Do not attribute the previous passing test counts to this newer SHA.

The latest test candidate requires CI to run before acceptance: `9abc4a46ed3ea6e3368ad7af5f24c587baee9411`. Production readiness remains blocked. PR #1 remains open, draft and unmerged; no external publishing or destructive Git operation was performed.

---

## Live checkpoint — 27 October 2026

## Latest implementation checkpoint — 27 October 2026, 21:08 UTC

Exact source/test SHA: `4ee5a6c8f1dded39d97d9b30dd70f9e0df2b32cd`. Automation/security PASS: 372 Node tests, 0 failures/skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg renderer integration passed. Dashboard E2E passed 13 Chromium journeys; content quality, metadata validation and isolated baseline passed. Main baseline: 54 Node / 8 Python; candidate: 372 Node / 16 Python; zero failures/skips, all exit codes 0. The metadata workflow itself skipped one FFmpeg-dependent test because FFmpeg was absent there; the automation and baseline workflows ran all candidate tests without skips. [Exact-SHA evidence and workflow links](CURRENT_RELEASE_EVIDENCE_2026-10-27.md).

Implementation fixes: strict timezone-qualified script-approval timestamps; readiness JSON now identifies checked paths, evidence type and control ownership, explicitly labels external YouTube history as unverified by the read-only checker, and redacts absolute external `QUEUE_PATH` values. A preceding interim commit failed on a syntax error; it was corrected and the final exact SHA was re-tested.

Production readiness still correctly reports 13 blockers. No live Meta integration is proven because the external draft job was skipped. Genuine media/rights/human approval, verified channel identity and full history, one-operation private-upload authorization/receipt, owner cadence approval and recovery/deployment drills remain outstanding. PR #1 is open, draft and unmerged. At the tested checkpoint, `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, divergence 1,734 ahead / 2 behind / 163 changed files. `test/restore-facebook-draft-history.test.mjs` remains present and tested. No publication, campaign activation, visibility change, merge or destructive Git operation occurred.

**Verdict: IMPLEMENTATION PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.**

---


## Latest implementation checkpoint — 27 October 2026, 21:02 UTC

Exact source/test SHA: `0969430d130340eed1d143de2f488265a50930dc`; latest application-code SHA: `e1f5650be2c82cb0c8ffd4046b8342a84df09eb9`. The source/test SHA passed automation/security (371 Node tests, 0 failed/skipped; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg render integration passed), dashboard E2E (13 Chromium journeys), content quality, metadata validation, and isolated main/candidate baseline (main 54 Node + 8 Python; candidate 371 Node + 16 Python; all zero failures/skips and exit codes 0). Exact links and limitations are recorded in [CURRENT_RELEASE_EVIDENCE_2026-10-27.md](CURRENT_RELEASE_EVIDENCE_2026-10-27.md).

New code hardening: script approval timestamps must be strict timezone-qualified ISO timestamps; readiness JSON now identifies evidence type, control ownership and the fact that external YouTube history is not independently verified by the read-only check. Production readiness still correctly reports 13 blockers. Local Facebook draft validation passed, but the remote draft job was skipped; no live Meta integration is proven.

At the tested checkpoint, `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, branch divergence 1,724 ahead / 2 behind / 163 changed files. PR #1 remains open, draft and unmerged. `test/restore-facebook-draft-history.test.mjs` remains present and tested. No external publication, campaign activation, visibility change, merge or destructive Git operation occurred.

**Verdict: IMPLEMENTATION PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.**

---


Current source/test SHA: `7bd13b1894de0b783f062a6481090cdafcf272f3`. Latest application-code ancestor: `081999d2a7f3afb2ef013a840e01982b21084db2`. Current release evidence: [CURRENT_RELEASE_EVIDENCE_2026-10-27.md](CURRENT_RELEASE_EVIDENCE_2026-10-27.md). PR #1 remains open, draft and unmerged. `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; live compare is 1,718 ahead / 2 behind / 163 changed files.

Exact candidate-SHA automation/security, browser E2E, content-quality, metadata-validation and isolated-baseline workflows completed successfully. Automation/security ran 369 Node tests (0 failures, 0 skipped), 16 Python tests and npm audit (0 vulnerabilities); browser E2E passed 13 Chromium journeys against the real local dashboard/backend. Local Facebook draft-package validation passed, but its external draft-package job was skipped and no live Meta integration is proven. Production readiness remains blocked: the readiness workflow reported 13 blockers and correctly failed closed. See the current release evidence for the verbatim blocker list and exact workflow links.

The historical test-file incident check is positive: `test/restore-facebook-draft-history.test.mjs` exists at the candidate branch and is exercised by the passing automation test suite. No YouTube upload, Facebook/Instagram post, campaign activation, visibility change, merge, main-branch modification or destructive Git operation occurred. Do not infer production readiness from code CI alone.

---

## Current release checkpoint — 27 October 2026

Exact application/test SHA: `081999d2a7f3afb2ef013a840e01982b21084db2`. PR #1 remains open, draft and unmerged. `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; live divergence 1,709 ahead / 2 behind / 163 changed files. No removed or renamed files appear in the live compare, and `test/restore-facebook-draft-history.test.mjs` is preserved.

Latest engineering change: private-parent Short relationship validation now fails closed by default; only the explicit private-upload and relationship-binding paths may persist a private parent with native Related video status `BLOCKED_EXTERNAL`. It does not claim a successful native association. Regression coverage is included.

Exact-SHA checks: automation/security PASS (368 Node, 0 failures, 0 skipped; 16 Python; npm audit 0 vulnerabilities), content quality PASS, metadata validation PASS, local Facebook draft-package validation PASS (not live Meta integration), isolated main/candidate baseline PASS. Dashboard browser E2E was pending when this note was recorded. Production readiness is BLOCKED / fail-closed (13 blockers), not a passing release gate.

Production remains blocked by genuine media and rights/playback approval, verified SonicVhibez identity and complete remote history, one-operation private upload authorization/receipt, native Short-parent eligibility, live authorized Meta/Instagram integration, owner-approved feasible cadence, and complete operational recovery/deployment acceptance. No upload or post occurred; public/unattended YouTube and Facebook live publishing remain disabled; Safari remains inactive.

---
## Newer exact-SHA acceptance result — 27 October 2026

**Exact application/test SHA:** `3690ec82b52263cb2da2378f8aba9a5b19658a8f`; latest application-code commit `d465c03cb3b12ee68000192089165f326121e8eb`. The PR HEAD at this evidence snapshot was `57ce7714ccdabbb149a95c56c3e3e0f5468f3f28`; subsequent documentation-only commits do not alter the tested application or tests. `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; divergence at that snapshot: 1,698 ahead / 2 behind / 163 changed files. No removed or renamed files appear in the live compare, and `test/restore-facebook-draft-history.test.mjs` is preserved.

### Verified results for the exact source/test SHA

- **Automation/security — PASS:** [run 40575972741](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972741): 367 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; `npm ci` with normal lifecycle scripts succeeded; Google API import passed; `npm audit` reported 0 vulnerabilities; JavaScript syntax, Python compilation, campaign/disclosure, metadata-safety and queue checks passed.
- **Dashboard browser E2E — PASS:** [run 40575972740](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972740): 13 Chromium journeys against the real local dashboard/backend.
- **Content quality — PASS:** [run 40575972899](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972899).
- **Metadata validation — PASS:** [run 40575972743](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972743).
- **Isolated main/candidate baseline — PASS:** [run 40575972749](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972749): main Node 54/54 passed; candidate Node exit code 0 with 366 passed, 0 failed and 1 skipped; main Python 8 passed and candidate Python 16 passed. The isolated baseline runner could not install FFmpeg, so one candidate renderer integration test was explicitly skipped there; the main automation/security run installed FFmpeg and completed 367/367 Node tests with no skips.
- **Production readiness — BLOCKED:** [run 40575972751](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972751), as required while production prerequisites are missing.
- **Facebook draft workflow — PASS for local deterministic draft-package validation only:** [run 40575973011](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575973011). This is not a live Meta API/Page integration.

### Acceptance decision

The retained-output/manifest guards and regression tests now pass the full automation/security suite. This does not prove genuine production media, full human playback/rights approval, authenticated SonicVhibez OAuth identity and complete remote history, an authorized private-upload receipt, eligible native Short-parent association, live Meta integration, owner-approved cadence, or all recovery/deployment drills. YouTube's [official Related video rule](https://support.google.com/youtube/answer/14075157?hl=en) requires the selected parent to be public or unlisted; a private parent cannot be linked. Do not change visibility to bypass this.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.** No live YouTube upload or Facebook post occurred; public/unattended YouTube publishing, Facebook live publishing and Safari campaigns remain disabled.

---

## Live blocker update — 27 October 2026

The current source/test checkpoint is `3690ec82b52263cb2da2378f8aba9a5b19658a8f` (latest application-code commit `d465c03cb3b12ee68000192089165f326121e8eb`). PR #1 remains open/draft/unmerged; `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. The branch is 1,691 ahead / 2 behind with 163 changed files from merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.

Render retries now fail closed when the per-job video, thumbnail or render manifest already exists. The manifest/output preservation regression tests are committed, but automation/security and isolated baseline CI for this exact SHA were still in progress at the time of this note. Browser E2E, content quality and metadata passed; production readiness remains blocked. See [current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-27.md).

Still blocked: genuine approved exports and human playback; verified SonicVhibez OAuth/channel identity and complete public/private/unlisted history; explicit one-operation private-upload authorization and verified receipt; native Short Related video (private parents are ineligible under [YouTube's official rule](https://support.google.com/youtube/answer/14075157?hl=en)); verified Meta Page and real draft-only integration; owner-approved cadence; recovery/deployment drills; full divergent-history review. Do not publish publicly or change visibility to bypass any gate.

---

# Latest verified checkpoint — 27 October 2026: publication-slot status coverage

**Exact tested source/test SHA:** `71555f20cc5fbd24658f50e82da5544eeed1a622`  
**Application-code commit:** `cb9118e8cadaa72c6be334031e250e4ceb44d02c`  
**Regression-test commit:** `71555f20cc5fbd24658f50e82da5544eeed1a622`  
**PR at test time:** #1 open, draft, unmerged. Documentation-only descendants may follow this exact tested source/test SHA.

## Change and verification

- `scripts/schedule-policy.mjs` now treats `queued_for_publication` and `pending_schedule` as active publication reservations. Previously, `evaluateNextPublication` recognized these states as planned attempts but `validatePublicationSlot` could filter them out, allowing a proposed slot to miss a queued collision.
- `test/schedule-policy.test.mjs` now covers same-day collision rejection, fail-closed missing timestamps, and reservation of these states through the rolling publication gate.
- Automation/security **PASS** — [run 40465705566](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705566): 338 Node tests passed, 0 failed; 16 Python safety tests passed; npm audit reported 0 vulnerabilities.
- Dashboard browser E2E **PASS** — [run 40465705587](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705587): 12 Chromium tests passed.
- Content quality **PASS** — [run 40465705622](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705622).
- Metadata validation **PASS** — [run 40465705503](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705503).
- Isolated main/candidate baseline **PASS** — [run 40465705450](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705450).
- Production readiness remains **BLOCKED** — [run 40465705498](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705498).
- Nature Frontiers Facebook daily draft was **SKIPPED** — [run 40465705576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705576); this is not Meta integration evidence.

## Release decision and remaining gates

**Code/test improvement verified; production release remains BLOCKED.** Still required: real rights-cleared media and narration, approved per-job render manifests and final MP4s, hash-bound human playback/rights review, verified SonicVhibez OAuth identity and complete public/private/unlisted history, reconciliation of uncertain upload attempts, explicit one-operation private-upload authorization and remote receipt, native Short-to-parent Related video evidence, verified Meta Page identity and a successful non-skipped draft-only integration, owner-approved feasible cadence, recovery/backup/restore/deployment drills, full divergent-history review and branch-governance acceptance.

Safety remains unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; exact approved Selar destination remains `https://selar.com/0u19v8u99l`. No upload, post, merge, main-branch edit or destructive Git operation occurred.

---

# Latest implementation and blocker checkpoint — 26 October 2026

Exact tested source/test SHA: `9982caed6bee7f8d01740acff5162b94988b2e59`; latest application-code commit: `1aeca29026c6965fe13ff206f8cc097f7d4fa038`. See [current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-26.md) for exact-SHA workflow links.

Code-level fixes now enforce measured script-duration estimates, shared public research URL validation, strict explicit parent IDs and measured loudness range. On the exact tested SHA, content quality, metadata, dashboard browser E2E and isolated baseline **PASS**; automation/security was still **IN PROGRESS** at last observation; production readiness is **BLOCKED**; Facebook draft is **SKIPPED**.

Keep these owner-controlled gates open: feasible approved cadence; complete verified YouTube history and uncertain attempts; genuine rights-cleared media/manifests and rendered Short; human metadata, rights and compliance review; credentials and verified channel identity; successful parent-binding/recovery E2E; genuine human full-playback realism and final audio/caption acceptance; verified Meta Page and non-skipped draft execution; recovery/deployment/monitoring drills; branch-history and governance review.

Never lower the 72-hour minimum spacing silently. Keep public/unattended YouTube publishing OFF, Facebook live publishing OFF, Safari campaigns inactive and PR #1 open/draft/unmerged.

---

# Live blocker checkpoint — 26 October 2026

**Latest tested source/test SHA:** `36aa95baeecfdb3ce1dbd8a4bf2380b0034e92fa`; **application-code SHA:** `15a3979fc294a97a1421b29ff4ff93207072e8b3`. Exact-SHA automation/security, content quality, metadata, 12-journey browser E2E and isolated baseline passed. Production readiness remains BLOCKED with 13 mandatory prerequisites; Facebook daily draft was SKIPPED. See [current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-26.md) for exact workflow links and scope.

The latest implementation fix corrects over-escaped research URL validation and rejects reserved example domains, loopback/local hosts and placeholders before provider access. Regression tests cover those cases; the dashboard integration fixture was updated to avoid a reserved test URL.

**Do not treat the green code suites as production acceptance.** Genuine rights-cleared media, human playback review, verified YouTube identity/history, owner-approved feasible cadence, successful Meta draft execution, full parent-binding success/recovery journeys, backup/restore and operational drills remain outstanding. Keep public/unattended YouTube publishing OFF, Facebook live publishing OFF, Safari campaigns inactive and PR #1 open/draft/unmerged.

---

# Current release decision — 26 October 2026 (latest tested source)

**Status: PRODUCTION BLOCKED.** Latest application-code SHA: `f0bf2278cd093859cbee49ac473e828c6ff785a9`; exact tested source/test SHA: `8d754b0a01c81ce1957ba25a7c8112eaa2e8a1b4`. Exact-SHA automation/security (321 Node, 8 Python), 11-journey browser E2E, content quality, metadata and isolated baseline passed; readiness is blocked and Facebook draft was skipped. See `docs/CURRENT_RELEASE_EVIDENCE_2026-10-26.md`.

Parent binding now requires both a configured SonicVhibez channel ID match and exact remote-title match against approved parent metadata. Still unresolved: successful parent-binding/recovery E2E coverage; genuine rights-cleared final exports and human playback; complete narration/caption/render and originality acceptance; verified YouTube OAuth/history and one-operation private upload; verified Meta Page and non-skipped draft; owner-approved feasible cadence; full recovery/deployment drills; full branch-history review and branch protection. Keep all public/live publishing and Safari activation disabled. PR #1 stays open/draft/unmerged.

---

# Current release decision — 26 October 2026

**Status: PRODUCTION BLOCKED.** Use `docs/CURRENT_RELEASE_EVIDENCE_2026-10-26.md` as the source of truth for the latest live Git state and exact-SHA workflow evidence. Current tested source/test SHA: `f3cae44edcc9094bf2f294ff46d583c556462548`; documentation-only updates after that SHA do not count as new code-test evidence.

Newly enforced: Short-parent binding now fails closed unless the parent receipt matches the explicitly configured `SONICVHIBEZ_CHANNEL_ID`. This does not verify OAuth, remote channel history or native Related video eligibility by itself.

Open release blockers remain: genuine rights-cleared final media and human playback review; complete script/narration/caption/render acceptance; comprehensive originality checks; verified YouTube identity/history and one-operation private-upload authorization; verified Meta Page identity and successful non-skipped draft workflow; owner-approved feasible cadence; complete relationship success/failure/recovery browser journeys; backup/restore/concurrency/rollback and deployment drills; complete divergent-history review; and branch-protection/required-check governance.

Safety remains unchanged: public/unattended YouTube publishing OFF, Facebook live publishing OFF, Safari campaigns inactive, PR #1 open/draft/unmerged, no unauthorized external actions.

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

> Live code checkpoint — 26 October 2026, source/test SHA 6acd678f0f52e691b8e54218f089d8874845f5ba. Dashboard authoring now calls the existing source-constrained generator and persists structured output against a queued job using the dashboard's locked state path. The UI includes a research-brief form. The integration test uses a local mock provider and verifies durable script persistence, idempotent reuse, and that factual/originality/rights/editorial gates remain pending. [Automation/security PASS: 306 Node tests, 8 Python tests, npm audit 0 vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546768); [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546692); [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546657); [isolated baseline PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546723). [Readiness remains BLOCKED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546830); Facebook draft workflow [SKIPPED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546789); dashboard E2E was still pending at last check [run 40305546725](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40305546725). This integration is partial: script-to-narration/caption/scene-rendering and approval flow is not yet end-to-end, and generated text remains non-publishable.

> **Current source/test checkpoint — `2686612d9982e0094cd25759e9a73fe466585634` (25 October 2026).** Dashboard validation now executes strict format-specific media validators, and private-upload approval rechecks the exact validated captions hash and binds the MP4, thumbnail, captions and metadata hashes. A regression test verifies the live dashboard returns HTTP 400 and persists no passing result when a Short's frame rate is invalid; lifecycle tests reject approvals with missing captions or failed technical validation. Exact-SHA evidence: [automation/security PASS — 280 Node tests, 0 failures, 8 Python safety tests, npm audit 0 vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940102), [real-dashboard Chromium E2E PASS — 10 tests on this exact SHA](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229935212), [isolated main/candidate baseline PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229935210), [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940142), and [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940079). [Production readiness remains BLOCKED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940077) by owner-controlled prerequisites; the [Nature Frontiers Facebook draft workflow was SKIPPED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940225), not integration evidence. Exhaustive dashboard control coverage, fault-injection/recovery/deployment drills, genuine rights-cleared media, authenticated YouTube/Meta identities, owner-approved feasible cadence, full history review and branch governance remain unresolved. Public/unattended YouTube and Facebook live publishing remain disabled; Safari remains inactive; no upload, post, campaign activation or merge occurred. `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; divergence at this source/test checkpoint is 1,208 ahead / 2 behind / 124 changed files. PR #1 remains open/draft/unmerged.

> **Latest verified code checkpoint — 25 October 2026:** Candidate `8146666ec32d5496dd0af6fb93a79fbd3284bf8f` includes symlink-/traversal-safe readiness prerequisite checks, a corrected readiness CI gate that compares retained exit codes, and Facebook idea-date validation returning HTTP 400 for malformed/impossible dates without mutating drafts. Exact-candidate evidence: [automation/security — 276 Node tests, 0 failures, 8 Python tests, 0 reported dependency vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472179), [browser E2E — 9 passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472355), [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472244), [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472262), and [locked install PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223467206). [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472230) correctly records exit codes 2/2 and remains **BLOCKED** on genuine prerequisites; the [Facebook draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472186) was **SKIPPED**, not passed. These results apply to this exact candidate; the final PR HEAD's separate checks remain authoritative.

> **Latest verified code checkpoint — 25 October 2026:** Source/test candidate `dfad17c87c6473a81ac65baa67ac7f694e2c7b29` adds symlink- and traversal-safe readiness file checks and corrects the readiness workflow to compare retained line-delimited exit codes. Exact-candidate evidence: [automation/security — 276 Node tests, 0 failures, 8 Python tests, 0 reported dependency vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702143), [browser E2E — 8 passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702124), [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702109), [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702097), and [locked install PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222697980). [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702175) correctly records exit codes 2/2 and remains **BLOCKED** on genuine prerequisites; the [Facebook draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702166) was **SKIPPED**, not passed. These results apply only to this exact candidate until the final PR HEAD's checks complete.

> **Cadence decision blocker — 25 October 2026:** The requested target of two long-form videos plus one Short per week is mathematically incompatible with a 72-hour minimum between consecutive publications: three cyclic gaps require at least 216 hours (9 days), versus 168 hours in a week. `config/weekly-content-plan.json` now records the requested target and `cadenceDecision.status=OWNER_DECISION_REQUIRED`; `npm run validate:schedule` reports the conflict, and production readiness blocks publication until a feasible mode is explicitly owner-approved. Draft-generation triggers are not publication times. Public/unattended publishing remains disabled.

## Authoritative current checkpoint — 25 October 2026

**Current source/test candidate:** `4819a6ed6553a87913aa8edc07a0aca09979831e`. **Documentation descendant before this refresh:** `600def0df653963c55560eb98461f4af2ba5c16e`. Documentation updates do not change application code; every final PR HEAD must still have its own CI verified.

- [Automation/security on source/test SHA](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909067): **PASS** — 267 Node tests, 0 failures, 0 skipped; 8 Python tests; normal lifecycle-script install isolation passed; dependency audit reported 0 vulnerabilities; JavaScript syntax and Python compilation passed.
- [Dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909103): **PASS** — 8 Chromium tests against the local dashboard/backend.
- [Metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909068) and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909057): **PASS**.
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909066): **BLOCKED** by required owner-controlled prerequisites.
- [Facebook draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909117): **SKIPPED**, not live Page integration evidence.
- Restore safety fix: `scripts/restore-state.mjs` rejects symlinked backup files and ancestors, opens the backup without following a final-component symlink where supported, and inspects every destination path component from the filesystem root. Regression tests in `tests/restore-state.test.mjs` cover a symlinked backup file, symlinked backup parent, symlinked destination root, regular backup read and explicit confirmation. See [implementation](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/73cf186a988d8a6fbc636298a4da6d7b78e15745), [destination-ancestor hardening](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/4dd3f1ea11e4619ed3b85e9add38a1a31af53cd1), [backup-path tests](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/832482f1ad8068421f7c4894bb5e5ac956a36a93), [destination-ancestor regression](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/4819a6ed6553a87913aa8edc07a0aca09979831e). Portable path-based APIs cannot eliminate every ancestor TOCTOU race; use an isolated restore environment.
- Dashboard mapping: [DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.md](DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.md). The acceptance register includes `RESTORE-001` and retains untested/external requirements as unresolved.
- Git state before this docs refresh: PR #1 open, draft and unmerged; `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; 1,135 commits ahead, 2 behind, 118 changed files. Full branch-only patch review remains incomplete; do not reconcile destructively.
- **Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Exact-`main` isolated baseline, exhaustive dashboard journeys, full divergent-history review, concurrency/recovery/backup/deployment drills, genuine media and rights/human review, verified SonicVhibez OAuth/history, one-shot upload authorization/receipt, and verified Nature Frontiers Page/draft workflow remain unresolved.
- Safety: public/unattended YouTube publishing and Facebook live publishing remain disabled; Safari remains inactive; only approved Selar URL is `https://selar.com/0u19v8u99l`. No upload, post, campaign activation, merge or destructive Git operation occurred.

> Older checkpoint sections below are historical unless they match the exact SHA and workflow evidence above. Do not treat their counts or "current" labels as current evidence.

---

## Latest evidence checkpoint — application-code SHA `eda0dbb7be1cfb2e71155d7478f1875739078340` (25 October 2026)

This checkpoint records the application changes at the SHA above. Later documentation-refresh commits do not change application source; their own exact-SHA CI must be checked before treating them as the final candidate.

- **Current branch/PR at source checkpoint:** `codex/marketing-machine-audit-fixes`; PR #1 open, draft, unmerged. `main` remains untouched. Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`; comparison: 1,104 commits ahead, 2 behind, 116 changed files. The 1,104 branch-only commits have not all been independently reviewed; do not reconcile history destructively.
- **Implemented media path hardening:** new `scripts/safe-media-path.mjs`; Short and long-form renderers reject symlinked manifests, inputs, output files and output ancestors; export validators reject symlinked media; media preflight rejects symlinked media/metadata; thumbnail generation rejects symlinked source/output paths and creates its title sidecar exclusively with restrictive permissions.
- **Regression coverage:** `test/safe-media-path.test.mjs`, `test/render-thumbnail.test.mjs`, additional cases in `test/render-long-form.test.mjs`, `test/validate-short-export.test.mjs` and `test/validate-long-form-export.test.mjs`. Existing Short renderer contract test was updated to assert the safe resolver is used.
- **Exact-SHA automation/security:** [run 40207797361](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797361) **PASS** — 262 Node tests, 0 failures, 0 skipped; 8 Python tests; clean isolated install and npm audit with 0 reported vulnerabilities.
- **Exact-SHA dashboard browser E2E:** [run 40207797321](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797321) **PASS** — 8 browser tests.
- **Other checks:** [metadata 40207797357](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797357) **PASS**; [content quality 40207797355](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797355) **PASS**.
- **Production readiness:** [run 40207797310](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797310) **BLOCKED as designed** because owner/account/history/media/approval prerequisites are not present. This is not a code-test pass or production acceptance.
- **Facebook draft workflow:** [run 40207797368](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797368) **SKIPPED**; this is not Page identity verification or successful draft integration.
- **Safety:** no upload, live Facebook post, campaign activation, merge or destructive Git operation was performed. Public/unattended YouTube publishing and Facebook live publishing remain disabled; Safari remains inactive.
- **Still unaccepted:** complete dashboard-control coverage; exhaustive branch-history review and safe reconciliation plan; cross-process and crash-recovery drills; genuine rendered Short and long-form artifacts with rights evidence; authenticated SonicVhibez identity and complete remote history; Nature Frontiers Page verification/draft workflow; deployment, monitoring, backup/restore and rollback drills.
- **Decision at this source checkpoint:** **CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED**. Recheck exact-SHA workflows for the final documentation-refresh HEAD before release decisions.

# Go-live blockers

## Historical implementation checkpoint — superseded by the latest verified checkpoint above

This checkpoint supersedes earlier "current" SHA and CI summaries below; historical entries are retained for traceability. Authoritative details and requirement classification are in [Current Release Evidence](CURRENT_RELEASE_EVIDENCE_2026-10-25.md).

- Candidate tested: `58f9255740903fefc0e0ac410d5adf308480f59d`; PR #1 remains open, draft and unmerged.
- Live comparison: 1,044 ahead, 2 behind, 110 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; main `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Changes: structured read-only readiness JSON with stable blocker IDs/severity/resolution; `npm run readiness:json`; CI retains JSON plus text diagnostics and fails closed if they disagree. Commits: [11adb103](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/11adb10335ed96c898cd82c8205054a0a40b2187), [fd3d8c4](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/fd3d8c4c0fbd14b7df0a8a150a43ba969d1c32e1), [fbbee4f](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/fbbee4f49b12267384e979aa7dc36bf6c301d612), [df64774](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/df64774f056da696fdedcaaad52a9654c504483d), [58f9255](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/58f9255740903fefc0e0ac410d5adf308480f59d).
- CI on candidate `58f9255740903fefc0e0ac410d5adf308480f59d`: [automation/security 40188274695](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274695) PASS — 245 Node tests, 0 failed/0 skipped, 8 Python tests, clean normal and locked installs, 0 npm audit vulnerabilities across 49 packages; [browser 40188274674](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274674) PASS — 7 Chromium journeys; [metadata 40188274667](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274667) PASS; [content 40188274693](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274693) PASS.
- [Production readiness 40188274678](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274678) is **BLOCKED as required**; [artifact 12597386549](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274678/artifacts/12597386549) retains text and JSON reports. [Facebook draft 40188274716](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274716) was skipped on the PR event.
- **Decision remains CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Full branch patch review, exhaustive dashboard controls, genuine media/rights/human approval, live SonicVhibez identity/history, separately authorized private upload, Facebook Page/default-branch draft acceptance, recovery/deployment drills and owner approval remain unresolved. Public/unattended YouTube and live Facebook publishing remain disabled; Safari stays inactive; approved Selar URL only: `https://selar.com/0u19v8u99l`.


## Historical acceptance checkpoint — superseded by the latest verified checkpoint above

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Automated checks pass on the exact code/test SHA below, but full dashboard-control acceptance, complete divergent-history review, isolated recovery drills, real-account integration and deployment acceptance remain incomplete.

### Exact Git state
- Implementation branch: `codex/marketing-machine-audit-fixes`; tested code/test SHA: `e56e3f5a328590a2b54849299a9fabc09df02f25`.
- Current PR HEAD will be a documentation-only descendant of this tested candidate; see [live PR metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- At the tested code/test candidate, comparison was **1,036 ahead, 2 behind, 110 changed files**; subsequent documentation-only commits add no application-code changes. Use the live PR metadata for the current-head comparison. The full branch-only history has not been reviewed patch by patch. PR #1 remains open, draft and unmerged. No direct `main` edit or destructive history operation was performed.

### Exact-SHA CI
- [Automation/security — run 40181771250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771250): **PASS** — 244 Node tests, 0 failed/0 skipped; 8 Python tests; locked and normal `npm ci`; Google API import; JS syntax/Python compilation; 16 queue items; `npm audit`: 0 vulnerabilities across 49 packages.
- [Browser E2E — run 40181771259](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771259): **PASS** — 7 Chromium journeys against the local dashboard/backend; not every visible control is covered.
- [Content quality — run 40181771275](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771275): **PASS**.
- [Metadata — run 40181771283](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771283): **PASS**.
- [Production readiness — run 40181771257](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771257): **BLOCKED as required: 12 mandatory blockers**; retained diagnostic [artifact 12594570724](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771257/artifacts/12594570724).
- [Facebook daily draft — run 40181771276](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771276): **SKIPPED** on PR event; not default-branch acceptance evidence.

### Code fixes in this candidate
- Approval artifact directory creation now uses component-by-component symlink/non-directory checks before nested writes. Four new path-safety tests cover safe creation, symlink ancestors, file ancestors and dashboard use of the guard.
- Validation-task start and result persistence now use the cross-process state lock. A durable `RUNNING` record prevents duplicate launches across two dashboard processes sharing state; the regression test exercises concurrent submissions.
- Facebook Page verification now reports success/failure in a dedicated accessible status area, so refreshing the dashboard cannot erase the operation result; the new browser regression verifies persistent blocked feedback.
- Private upload workflow now uses lockfile-enforced `npm ci --ignore-scripts` and the built-in `${{ github.token }}` for restoring the prior attempt ledger; `test/ci-lockfile.test.mjs` asserts both settings.
- Existing approval transaction rollback, atomic JSON path checks, Facebook history restoration safeguards, dashboard handler wiring, schedule/queue invariants and publishing safety tests remain covered.

### Acceptance and owner actions
- [x] Exact-SHA automation, install, dependency audit, content and metadata checks pass.
- [x] Seven browser journeys pass.
- [x] Public/unattended YouTube publishing and Facebook live publishing remain disabled.
- [ ] Full dashboard-control browser acceptance and complete branch-history review/reconciliation.
- [ ] Isolated crash, rollback, backup/restore and deployment drills with retained evidence.
- [ ] Genuine rights-cleared Short/long-form media, validated manifests/checksums and human review.
- [ ] Verified SonicVhibez OAuth/channel identity, remote-history reconciliation, one-shot authorization and verified private-upload receipt.
- [ ] Verified Nature Frontiers Page permissions and successful default-branch Facebook draft run with retained artifact.
- [ ] Production monitoring, backup, emergency stop and deployment acceptance.

No real YouTube upload, public post or live Facebook post was performed. The sole approved Selar destination remains `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive. See [the current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-25.md).

## Historical checkpoints (superseded; retained for audit trail)


## Live release assessment — 24 October 2026

**Latest application-code candidate:** `df5d28560a757fb185a020982f981fb1ce6722c7` (Google API client dependency and lockfile upgrade). Exact-head checks passed on `36b9e34285a9becb3ad3305f1147b5e831d7bf16`, a documentation-only descendant containing the same application code and dependency tree.
**PR #1:** [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
**Branch comparison at exact test head `36b9e34285a9becb3ad3305f1147b5e831d7bf16`:** 896 commits ahead, 2 behind `main`; 94 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Do not merge, reset, force-push, or rewrite divergent history without the owner's explicit decision.

### Exact-SHA evidence

- [Automation validation — run 40125752411](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752411): **PASS** on exact test head `36b9e34285a9becb3ad3305f1147b5e831d7bf16`; **206 Node tests passed, 0 failed, 0 skipped**; Python safety tests: **8 passed**; 16 queued topics passed safe-state/destination checks; campaign validation, JavaScript syntax and Python compilation passed. A clean isolated normal lifecycle-script `npm ci` passed and `googleapis` imported successfully.
- [Metadata validation — run 40125752409](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752409): **PASS** on the same exact test head.
- [Content quality — run 40125752405](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752405): **PASS** on the same exact test head.
- [Locked install/lockfile validation — run 40125748862](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125748862): **PASS** on the same exact test head; clean locked installation and configuration checks passed.
- [Production-readiness diagnostic — run 40125752527](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752527): **BLOCKED as intended** because mandatory production prerequisites remain unresolved. The `sonicvhibez-readiness-report` artifact was retained (artifact ID `12573171174`; expires 23 November 2026). This is not a readiness pass.
- [Nature Frontiers Facebook draft — run 40125752399](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752399): **SKIPPED** on the pull-request event. No default-branch draft or retained default-branch artifact is established by this run.

### Implemented in this audit

- The read-only readiness CLI exits with status 2 when mandatory gates are blocked and prints the complete blocker report; it exits 0 only when checks find no blockers.
- The dashboard readiness parser accepts the explicit blocked status and preserves actionable blockers rather than collapsing them into a generic validator error.
- The production-readiness workflow uses Node.js 24, runs for relevant pull-request paths, retains its diagnostic artifact, and fails the readiness gate while production prerequisites remain blocked.
- Pull-request validation workflows check out the exact pull-request head SHA rather than GitHub's synthetic merge ref. The automation workflow also verifies a normal lifecycle-script install in a clean temporary checkout with no credentials in its environment.
- Publication minimum spacing is configuration-driven across schedule validation, readiness checks, dashboard checks and the pre-upload history gate. The default remains 72 hours. The configured value must be finite, positive and at most 8,760 hours; cycle duration must equal the configured gap multiplied by the three-item cycle, and schedule, queue and spacing policy must agree. A regression test confirms a consistent 96-hour configuration is accepted.
- Upgraded `googleapis` from `^144.0.0` to `^188.0.0`; the lockfile now resolves `googleapis 188.0.0`, `gaxios 8.3.2` and `googleapis-common 9.3.1`. Exact-head npm audit reports **0 vulnerabilities** across all severities. The four previously reported moderate advisories are resolved in the audited lockfile; live OAuth/API account acceptance remains unverified.
- Publication cadence remains a rolling `long_form → long_form → short` cycle; the default 72-hour gap means at least 216 hours across three cyclic gaps. Tuesday/Saturday triggers are draft preparation only; no three-posts-per-week promise is made.

### Branch-divergence reconciliation

The live comparison is 896 ahead / 2 behind at the exact test head, with merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. The two base-only commits are file-only test churn: `71578dafc24e5d48173dce3f4e392e18e42aa40e` added `test/restore-facebook-draft-history.test.mjs` (117 lines), and `fa00d28e7f58911482686e4ad69fac9f4701a2e6` removed that same test file. They do not change runtime code. The implementation branch lacks this dedicated test file; owner review should decide whether to reintroduce its cross-run history-restoration coverage as a separately reviewed test. No merge, reset, force-push or history rewrite was performed.

### Historical acceptance register — superseded by latest verified checkpoint

| Gate | Status | Evidence / next action |
|---|---|---|
| Node.js automated tests | PASS | 206 passed, 0 failed, 0 skipped on exact test head. |
| Python safety tests | PASS | 8 passed on exact test head. |
| Campaign, queue, schedule, syntax and compilation checks | PASS | Exact-head automation workflow above. |
| Normal lifecycle-script installation | PASS | Isolated clean checkout, no credentials, normal `npm ci`, and `googleapis` import passed. |
| Dependency audit | PASS | `npm audit`: 0 info, 0 low, 0 moderate, 0 high, 0 critical; total 0. |
| Configurable publication spacing | PASS | Default 72 hours; schedule, queue, dashboard, readiness and upload history gate use the validated configured value. |
| Readiness reporting fails closed | PASS | CLI returns status 2 with actionable blockers; dashboard returns HTTP 503 while mandatory production prerequisites are missing. |
| Clean-start dashboard/browser acceptance | NOT RUN | Exercise every visible control, authentication failure, API persistence, restart and error paths using the real app. |
| Real Short and long-form production media | OWNER ACTION REQUIRED | Supply genuine assets, completed manifests, rights evidence, checksums, full renders, full-file decode reports and human playback review bound to final hashes. |
| YouTube OAuth and channel identity | OWNER ACTION REQUIRED | Configure secrets securely, verify authenticated channel is SonicVhibez, retrieve complete public/private/unlisted history and reconcile uncertain attempts. |
| Private upload | OWNER ACTION REQUIRED | No live upload attempted. Require one-operation authorization, durable pre-insert ledger, private-only request and remotely verified private receipt. |
| Facebook integration | OWNER ACTION REQUIRED | Verify Nature Frontiers Page identity, token scopes and default-branch draft/artifact retention; live publishing remains disabled. |
| Backup/restore/restart drill | OWNER ACTION REQUIRED | Perform isolated restore and interruption/restart/concurrency tests; retain logs and checksums. |
| Branch divergence/test-file incident | OWNER ACTION REQUIRED | Review whether to restore the dedicated test coverage; no history rewrite or merge performed. |
| Production acceptance | BLOCKED | Mandatory media, identity, integration, recovery and owner-approval gates remain open. |

**Safety defaults:** public and unattended YouTube publishing remain disabled; a private upload requires explicit operation-specific authorization; Facebook live publishing remains disabled with dry-run and emergency-stop safeguards; the only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive.

**Verdict:** automated code checks and dependency audit pass on the stated exact test head; **CODE-LEVEL ACCEPTANCE REMAINS BLOCKED** pending remaining runtime verification. **PRODUCTION ACCEPTANCE IS BLOCKED.**

---

# HISTORICAL CHECKPOINT — 2026-10-24

This is the current dated evidence snapshot. Older checkpoints below are historical only. If the branch advances, consult PR #1 and the exact-SHA Actions results before treating this snapshot as current.

- Latest exact-SHA verified PR head at this checkpoint: `5a542fd702aee926515718027af850e34a0dc325` (documentation-only refresh). The executable-code change and regression test are in parent candidate `249558377b71eec7b793ad2667bac3cee5594a13`; the report-refresh commit changed this report only.
- PR #1 is open, draft and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1.
- Live branch comparison: 758 commits ahead and 2 behind `main`; current `main` HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; 80 changed files.
- Security implementation: `scripts/dashboard-server.mjs` resolves operator-supplied repository-relative file paths to canonical paths and rejects symlink targets outside the repository. `test/dashboard-server.test.mjs` tests this through the authenticated HTTP upload-reconciliation endpoint using a temporary external fixture; the request is rejected before reconciliation. The earlier dashboard state-path disclosure fix remains covered by HTTP integration assertions.
- Exact-SHA CI for report-refresh candidate `5a542fd702aee926515718027af850e34a0dc325`:
  - Automation validation [run 40108268034](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40108268034): PASS — 160 Node tests passed, 0 failed; 8 Python safety tests passed; queue/campaign checks, JavaScript syntax and Python compilation passed.
  - Content quality [run 40108268023](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40108268023): PASS — 160 Node tests passed, 0 failed.
  - Metadata validation [run 40108268048](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40108268048): PASS — 160 Node tests passed, 0 failed; schedule and caption validation passed; readiness correctly remains blocked.
  - Nature Frontiers daily Facebook draft [run 40108268027](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40108268027): SKIPPED on the PR branch; this is not default-branch production acceptance.
- Dependency audit from run 40108268034: 4 moderate, 0 high, 0 critical advisories. Affected packages: `gaxios`, `googleapis`, `googleapis-common`, and `uuid`. The available Google API remediation is a major upgrade to `googleapis@188.0.0`; it has not been applied without compatibility testing.
- Installation evidence uses `npm ci --ignore-scripts`; unrestricted lifecycle-script installation was not tested.
- Production acceptance remains BLOCKED: genuine licensed source media, complete render manifests/asset register and human playback review are missing; live SonicVhibez OAuth and complete channel-history reconciliation have not been verified; no explicitly authorized private upload or durable remote receipt exists; real Meta identity/default-branch artifact and owner-run backup/restore acceptance are unverified; dependency-risk disposition and branch-divergence review remain open.
- No real YouTube upload or Facebook post is claimed. Public YouTube publishing stays disabled; Facebook live publishing stays disabled/dry-run; Safari remains inactive. Do not merge or perform external mutations without the relevant explicit owner authorization.


---

# HISTORICAL CHECKPOINT — 2026-10-24 (superseded; retained for audit)

- Tested code SHA: `bb9c8d115979ab5aff48ed0ee3ca9afe1bc0fd05`; implementation branch `codex/marketing-machine-audit-fixes`.
- PR #1 remains open, draft and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1.
- Branch comparison at this checkpoint: 746 commits ahead, 2 behind `main`; base HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Preserve the accidental test-file add/delete incident for owner review; no merge or history rewrite was performed.
- Exact-SHA CI passed:
  - Automation validation [run 40100702894](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100702894): 160 Node tests passed, 0 failed/skipped; 8 Python safety tests passed; `npm ci --ignore-scripts`, campaign/queue checks, JavaScript syntax and Python compilation passed.
  - Content quality [run 40100702959](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100702959): 160 Node tests passed, 0 failed/skipped.
  - Metadata validation [run 40100702955](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100702955): 160 Node tests passed, 0 failed/skipped; schedule validation, readiness and captions checks passed.
  - Nature Frontiers daily Facebook draft [run 40100702958](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100702958): skipped on the PR branch; not default-branch acceptance.
- Rolling publication policy: `long_form → long_form → short`; minimum 72 elapsed hours between consecutive actual publications and 216 hours across the three cyclic gaps. Tuesday/Saturday triggers are draft preparation only. Completed ledger receipts are not re-counted as future slots; an exclusive upload lock prevents concurrent inserts and fails closed after a crash.
- Live uploads now require a separate one-shot authorization bound to the job ID, final video hash, metadata hash, approval hash and verified channel ID. Authorization ID is persisted before insert and cannot be reused. This automated gate does not replace live owner credentials, rights evidence or human approval.
- All eleven inspected workflows now use `actions/checkout@v7` and `actions/setup-node@v7` where applicable, with Node.js 24 and setup-node caching explicitly disabled. Package engine floor is Node.js >=22. The exact SHA above passed on those updated actions.
- Dependency audit remains 4 moderate, 0 high/critical: `gaxios`, `googleapis`, `googleapis-common`, `uuid`. No unsafe major dependency upgrade was applied.
- CI installation used `npm ci --ignore-scripts`; unrestricted lifecycle-script installation was not tested.
- Production acceptance remains BLOCKED: required real short/long manifests and asset register are absent, `media/next-short.mp4` is absent, genuine licence evidence and human final-hash playback approval are not available, live SonicVhibez OAuth/history reconciliation and a separately authorized private upload/remote receipt have not occurred, Meta identity/default-branch artifact remains unverified, and owner-accepted backup/restore drill is outstanding.

- Cross-run history restoration now has mocked API integration tests for valid artifact retrieval, malformed archive failure, HTTPS enforcement and bounded archive size. Same-day retained packages are reused exactly; conflicting same-date artifacts fail closed. These are mocked tests, not proof of a real default-branch artifact restore.
- History remains bounded by GitHub's 14-day artifact retention, not a permanent editorial database. The next authorized default-branch scheduled/manual run must verify real artifact restoration and deduplication.
- Latest npm audit on this tested candidate: 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`; the available `googleapis` remediation is a major version upgrade and remains unmodified pending compatibility testing.
- Production acceptance remains blocked by real Meta Page verification, authorized live-post receipt, genuine media/licensing evidence and human review, live SonicVhibez OAuth/channel verification, explicitly authorized private upload and remote receipt, backup/restore owner acceptance, and live owner-reviewed YouTube history reconciliation remains required.
- No real Facebook post or YouTube upload is claimed. Do not merge, enable public publishing or perform external mutations without separate explicit owner authorization.

---


# Historical branch status — 24 October 2026 (superseded)

- Verified code/test checkpoint: `4f144038aba80630494292ec63bc221535881459` on `codex/marketing-machine-audit-fixes`; base `main`: `45352b73bb6cc4787b2a49988b575afb754ab627`. PR #1 was open, draft and unmerged; comparison at this checkpoint was 583 ahead, 0 behind.
- All checkpoint workflows passed: [automation — run 40090594392](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40090594392), [metadata — run 40090594361](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40090594361), [content quality — run 40090594384](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40090594384). Node tests: 133 passed, 0 failed, 0 skipped; automation also passed 8 Python safety tests and syntax/compilation checks. Verified CI install path: `npm ci --ignore-scripts`; plain `npm ci` remains unverified.
- Facebook implementation includes research-first draft ideas, authenticated dashboard UI/API, persistent state/audit, duplicate and one-post-per-local-day checks, source/license checksum gates, disclosure/high-impact claim/external-link checks, exact Selar campaign/pillar restrictions, artifact-bound approvals, live Meta scope/Page/task/token verification, gated Graph API scheduled text/photo publishing, image ffprobe/checksum validation, durable attempts, remote refetch and interrupted-attempt reconciliation. It is disabled by default: `publishingEnabled=false`, `dryRun=true`, `FACEBOOK_PUBLISH_ENABLED=NO`. No real Meta account was verified and no Facebook post was published.
- npm audit remains 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common`, and `uuid`.

## Historical owner-controlled production blockers — see latest verified checkpoint

1. Securely configure `META_USER_ACCESS_TOKEN`, `META_PAGE_ACCESS_TOKEN`, the exact Page ID in config and `NATURE_FRONTIERS_FACEBOOK_PAGE_ID`; run read-only Meta permission/Page verification and review the returned scopes, Page task, ID and token match.
2. Keep Facebook publishing kill switches disabled until the owner explicitly authorizes a real test post. Any real scheduled operation requires current human approval, per-operation confirmation, durable attempt record and remote receipt verification.
3. Supply `CHANNEL_HISTORY_RECONCILIATION_PATH` containing every SonicVhibez remote video ID, format, actual timestamp and visibility; verify the authenticated uploads playlist is complete and resolve every pending/uncertain upload attempt.
4. Supply genuine rights-cleared YouTube media, narration, music, manifests/provenance/checksums, and complete full-file decode and human playback/caption/thumbnail review.
5. Complete final-hash-bound rights/editorial approval, secure live OAuth verification of SonicVhibez, then explicitly authorize one private-only upload and verify its remote ID/receipt.
6. Run and record owner-controlled restart and backup/restore acceptance.
7. Supply exact Safari HTTPS destination, truthful disclosure and explicit owner approval.
8. Resolve four moderate npm advisories through tested compatible upgrades or a documented risk decision.

No live Facebook post, YouTube upload, public publishing or production acceptance is claimed by these CI results.

---






# Release evidence snapshot — prior checkpoint cb6ca43b7723d903c3e6b78fd3ed662a13498b04 (2026-10-24)

This section records evidence from the preceding branch checkpoint; the commit containing this correction is documentation-only and is not covered by the run links below. All links below identify their historical checkpoint explicitly. See PR #1 for the live branch HEAD and exact current-HEAD workflow links. This is not production acceptance.

- At the preceding evidence checkpoint the implementation branch was `codex/marketing-machine-audit-fixes`, based on `main` at `45352b73bb6cc4787b2a49988b575afb754ab627`. Re-fetch live refs from PR #1 before relying on current counts. PR #1 remains open, draft and unmerged. The last code/test checkpoint remains `703a7d380a63f0d379ca17f0b920279597ea58be`.
- At checkpoint `586e5404ceabf399375e59fc0adad95389367408`, the following PR workflows succeeded: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868763), [metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868753), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868796). The lockfile verification run is [40084865929](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084865929). The lockfile workflow ran `npm ci --ignore-scripts`, 112 Node tests, schedule/campaign validators and syntax checks; it did not execute the lockfile refresh/commit steps because no refresh was needed.
- The automation log at checkpoint `586e5404ceabf399375e59fc0adad95389367408` reports 112 Node tests passed, 0 failed, 0 skipped; Python safety tests: 8 passed. Campaign validation passed, 16 queued topics were held for review, public publishing was disabled, and JavaScript/Python syntax checks passed.
- The automation install at that checkpoint used `npm ci --ignore-scripts` (46 packages added, 47 audited). Plain `npm ci` without `--ignore-scripts` has not been verified.
- Current npm audit: 4 moderate, 0 high, 0 critical. Affected packages/ranges reported by the audit: `gaxios` 6.4.0–6.7.1 (via `uuid`); `googleapis` 33.0.0–149.0.0 (via `googleapis-common`); `googleapis-common` <=7.2.0 (via `uuid`); `uuid` <11.1.1 (v3/v5/v6 buffer bounds-check advisory). npm reports the available `googleapis` fix as 178.0.0, a major upgrade. Do not upgrade blindly; evaluate runtime compatibility and rerun the full suite. Dependency tree is not vulnerability-free.
- Production acceptance remains **BLOCKED**: the rolling cycle and fail-closed history gate are implemented but live channel history/OAuth have not been accepted; genuine assets, retained rights evidence and final-hash human review are absent; one explicitly authorized private upload/remote receipt is unverified; owner-run restart/backup/restore acceptance is outstanding. Safari remains inactive pending exact HTTPS destination, truthful disclosure and explicit owner approval.
- Public publishing remains disabled. GitHub Actions success does not prove that scheduled workflows are active on `main`, and does not prove production media, real rights, live OAuth, upload acceptance or restore acceptance.
- The malformed content-quality URL formerly in PR #1 was corrected to run [40084868796](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868796).

---

# Go-live blockers — SonicVhibez Marketing Machine

## Historical publication-spacing acceptance snapshot — 24 October 2026

Tuesday/Saturday cron slots are draft-preparation triggers only, not a publication cadence. Actual uploads are gated by the rolling long-form → long-form → Short cycle, 72 elapsed hours from the latest actual publication, complete remote history reconciliation, and a clear upload-attempt ledger. Public publishing remains disabled.


**Acceptance status: BLOCKED for real media release and live YouTube acceptance.** Code and mock tests do not substitute for real rights evidence, media inspection or remote upload verification.

Last review: 2026-10-24. PR #1 remains open, draft and unmerged. Public publishing remains disabled.

| Gate | Status | Owner action | Evidence required to close |
|---|---|---|---|
| Real media | BLOCKED | Supply genuine wildlife footage, narration and any music with permission for commercial YouTube use. | Actual rendered Short and long-form MP4s, real thumbnails/captions, SHA-256 values, ffprobe output, full decode and human playback inspection. |
| Production manifests | BLOCKED | Populate `content/render-manifest.json` and `content/long-form-render-manifest.json` using real existing files; do not promote example placeholders. | Both manifests reference existing, non-empty, validated inputs. |
| Rights | BLOCKED pending owner evidence | Retain original licence/permission documents; verify platform/commercial permissions, attribution, restrictions and expiry per asset. | Evidence files and checksums, source checksums, actual verifier identity and timestamp. A filename or checkbox is not proof. |
| Human review | BLOCKED pending production artifacts | Review exact video, thumbnail, captions, metadata, factual claims, disclosures and synthetic/altered-media flags. | Authenticated decision bound to the final video, thumbnail, caption, metadata and rights-evidence hashes, timestamp and rejection reason where applicable. |
| YouTube identity | BLOCKED | Securely configure `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` and independently confirmed `SONICVHIBEZ_CHANNEL_ID` in a secret store/environment. Never paste secrets into chat. | Authenticated API confirms channel title exactly `SonicVhibez` and channel ID matches configured ID. |
| Live private upload | BLOCKED | After all gates pass, explicitly authorize one private upload; set `CONFIRM_PRIVATE_UPLOAD=YES` only for that operation. | Durable pre-upload attempt, remote video ID, re-fetched remote ownership/private visibility, durable receipt. |
| Safari affiliate | INACTIVE by design | Supply exact HTTPS destination and disclosure if wanted; preview and explicitly approve. | Exact destination, disclosure and owner approval. Until then Safari stays inactive. |
| Plain `npm ci` | NOT VERIFIED | Review install-script effects and run plain `npm ci` in a clean environment if required. | Captured command exit code and output. The evidenced install path is `npm ci --ignore-scripts`. |
| Rolling publication cycle | PASS — AUTOMATED POLICY / BLOCKED — OWNER ACTION FOR LIVE RELEASE | Configuration, queue validation and pre-upload gate require long-form → long-form → Short, at least 72 elapsed hours between consecutive actual publications, and at least 216 hours across three cyclic gaps. Tuesday/Saturday are draft-preparation triggers only. | Provide complete owner-reviewed channel-history reconciliation and resolve all pending/uncertain attempts; live OAuth and a separately authorized private upload remain required. |
| Operator runtime acceptance | PARTIALLY VERIFIED | Run clean local startup, authenticated API checks, restart-persistence and backup/restore. | Captured health/readiness results and persisted-state/restore checks. Automated integration tests alone are not operator acceptance. |

## Non-negotiable controls

- SonicVhibez only; never use Nature Frontiers as the YouTube target.
- Public publishing remains disabled. No public/unlisted upload or unattended public scheduling.
- Preserve the exact Selar destination: `https://selar.com/0u19v8u99l`.
- Never blindly retry an uncertain upload; reconcile the existing attempt with YouTube first.
- Keep PR #1 open, draft and unmerged unless the owner separately authorizes a merge.

## Historical code/test checkpoint — 24 October 2026 (superseded)

The code/test commit `62b1bd599d63c3ab1d55b6a6660740fbf3d44157` passed all three GitHub Actions validation workflows with 100 passed, 0 failed, 0 skipped in each: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495157), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495128), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495162). The automation run completed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python compilation.

The later documentation checkpoint `b505a260570afb23de637d599868e55376a827aa` also passed all three workflows with 100 passed, 0 failed, 0 skipped: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034769), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034706), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034728). It was documentation-only relative to the tested code/test commit.

The implemented safeguards include: full production preflight at dashboard readiness; required operator identity in audit events; rights-record hash verification and rechecking retained source/licence file checksums before upload; checksummed backup/restore of state, audit history, rights records, review approvals, upload attempts and receipts; and fail-closed refusal to overwrite a different upload ledger. `.gitignore` excludes local secrets, state, rights records, backups and generated media.

These are automated/code-level checks, not proof of genuine licence authenticity, human playback review, real wildlife renders or a live YouTube upload. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

## Remaining owner-controlled blockers

- Genuine rights-cleared wildlife footage, narration/music and complete Short/long-form manifests.
- Actual media render, ffprobe/full-decode evidence and human playback/editorial review.
- Securely configured and independently verified SonicVhibez OAuth channel identity.
- Explicit per-operation authorization for one private upload, then remote private-status verification and durable receipt.
- Separate operator-run restart and backup/restore acceptance.
- Safari remains inactive until its exact HTTPS destination, disclosure and owner approval are supplied.



## Historical branch checkpoint — 24 October 2026 (superseded)

Branch HEAD at the latest verified documentation checkpoint: `54680587e71b5c84074a2c681ed8e95d919a87fd`. The three PR validation workflows passed on this exact SHA: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578167), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578180), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578198). Each reported 100 passed, 0 failed, 0 skipped. The automation workflow verified `npm ci --ignore-scripts` and Python compilation. The metadata workflow deliberately verifies that production checks fail closed while production metadata is incomplete; it is not a production-readiness pass.

These CI results do not close owner-controlled media, rights, human playback, OAuth/channel identity, private upload, or operational restore gates. PR #1 remains open, draft and unmerged; public publishing remains disabled. Recheck this section against the current HEAD before relying on it after future commits.


## Historical implementation checkpoint — 24 October 2026 (superseded)

- Historical checkpoint only: `4ba995bc51ed2ae0513bc312865713a73e0e3160`. This predates the rolling-cycle and history-gate changes and is **not** current release evidence; check the exact latest branch HEAD and its CI before acceptance.
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305593), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305540), and [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305556) all passed on that code HEAD. Each ran 106 tests: 106 passed, 0 failed, 0 skipped. Automation also passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python safety tests. Metadata validation explicitly confirms that `npm run check` fails closed while real production metadata is incomplete; this is not a release-readiness pass.
- Tuesday/Saturday are draft-preparation triggers only. The rolling publication cycle is long-form → long-form → Short with at least 72 elapsed hours between actual publications. The pre-upload gate requires complete remote public/private/unlisted history and reconciliation of uncertain attempts; live acceptance remains blocked until owner evidence and authorization are supplied.
- PR #1 remains open, draft and unmerged. Public publishing remains disabled. No production MP4, thumbnail, rights clearance, human playback acceptance, live OAuth identity check, private upload receipt, or owner-run restore acceptance is claimed.
- Remaining owner-controlled gates: genuine rights-cleared source assets and completed manifests; rendered/decoded media and human review; secure OAuth identity verification for SonicVhibez; explicit per-operation private-upload authorization; operational backup/restore acceptance. Safari remains inactive until exact destination, disclosure, and owner approval exist.


## Current implementation delta — rolling publication cycle

The authoritative configuration and queue use the rolling `long_form → long_form → short` sequence, 72 elapsed hours between consecutive actual publications, and 216 hours minimum across the three cyclic gaps; Tuesday/Saturday remain draft-preparation slots only. The upload evaluator now excludes reconciled successful ledger receipts from future-slot checks (remote history remains authoritative), and the uploader uses a cross-process exclusive lock to prevent simultaneous private-upload attempts. A process crash leaves a stale lock that fails closed and requires operator reconciliation rather than automatic deletion. Live uploads still require complete owner-reviewed remote history and unresolved-attempt reconciliation. Automated tests do not constitute live OAuth or upload acceptance.


**Evidence freshness note (2026-10-24):** exact tested code SHA `e86f715ee52522964e2864aead890b8bedf94395` passed all three code/test workflows linked at the top of this document (159 Node tests in each, 0 failures/skips; 8 Python safety tests in Automation validation). Older SHAs and counts elsewhere are historical checkpoints only. The Facebook workflow skip is not live default-branch acceptance.


## Historical release evidence register — 24 October 2026 (superseded)

This register was prepared from live CI results for code/test candidate `9dd102f9636a5ba71c797cf79c104d3616cbe14e`. It does not turn mocked or local tests into proof of live external integrations. The docs-only commit carrying this register is not represented by these earlier run links; its exact-head checks are listed in PR #1 after they complete.

### Exact-SHA CI evidence

| Gate | Status | Candidate SHA | Operation and actual result | Evidence | Remaining risk / next action |
|---|---|---|---|---|---|
| Automation and safety suite | PASS with advisories | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | `npm ci --ignore-scripts`; Node tests: 205 passed, 0 failed, 0 skipped; Python safety tests: 8 passed; 16 queue topics validated; JavaScript syntax and Python compilation passed. | [Run 40122567804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567804) | Four moderate npm advisories remain; clean normal lifecycle installation and production runtime are not proven. |
| Metadata, schedule, caption and fail-closed readiness validation | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | `npm ci --ignore-scripts`, 205 Node tests, schedule and caption checks, default production readiness remains blocked as intended. | [Run 40122567802](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567802) | These checks do not prove real media, OAuth identity or external history. |
| Content quality | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | 205 Node tests passed; long-form draft minimum and content-quality assertions passed. | [Run 40122567799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567799) | Content validation does not replace factual, rights or human review. |
| Locked installation / lockfile | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Clean `npm ci --ignore-scripts` and 205 Node tests passed. | [Run 40122564222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122564222) | Lifecycle scripts deliberately not executed; normal install path remains NOT RUN. |
| Daily Nature Frontiers Facebook draft | SKIPPED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | PR-event workflow skipped by its condition; no default-branch run or retained artifact established. | [Run 40122567717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567717) | OWNER ACTION REQUIRED: run on intended default-branch schedule after review and verify retained artifact. |

### Code-level change in this candidate

`scripts/restore-state.mjs` now rejects symbolic links in restore destination paths before writing files, and constrains the configured upload-log directory to the repository root. This prevents a backup restore from writing through a symlink into an unintended external directory. `test/backup-restore.test.mjs` adds regression coverage for symlinked rights and upload-log paths and verifies that rejection happens before state is partially restored.

### Remaining acceptance gates

| Gate | Status | Candidate SHA | Evidence / next action | Owner authorization |
|---|---|---|---|---|
| Node and Python automated tests | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Exact-SHA CI links above; 205 Node and 8 Python tests passed. | No |
| Restore symlink traversal regression | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Covered by `test/backup-restore.test.mjs` in the exact-SHA test suite. | No |
| Normal lifecycle-script installation | NOT RUN | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Test the supported install path in a trusted, disposable environment after reviewing install scripts. | Yes, environment/operator |
| Full dashboard browser/runtime acceptance | NOT RUN | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Clean-start server, authenticate, exercise every visible control, inspect persisted state and restart recovery. | Yes, operator |
| Genuine media, rights evidence, manifests and exact-hash human review | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Supply genuine licensed assets; render, validate, hash and human-review the final artifacts. | Yes |
| SonicVhibez OAuth identity and channel ID | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Verify the authenticated identity and configured channel independently. | Yes |
| Complete public/private/unlisted remote history and uncertain-attempt reconciliation | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Obtain complete authenticated remote history and reconcile every pending/ambiguous upload. | Yes |
| Single private upload and verified remote receipt | BLOCKED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Only after every prior gate passes, authorize one exact private operation and independently verify its receipt. No upload was performed. | Explicit, operation-specific |
| Nature Frontiers Facebook Page identity/permissions | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Verify Page ID, token validity, scopes and credential fingerprints through authorized configuration. | Yes |
| Default-branch Facebook draft and retained artifact | BLOCKED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | PR run was skipped; verify an actual intended default-branch run and artifact. | Repository owner/reviewer |
| Facebook live publishing | BLOCKED by policy | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Keep `publishingEnabled=false`, dry-run true and live gate disabled. Do not post for testing. | Explicit authorization if later desired |
| Isolated backup/restore/restart drill | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Execute the owner runbook in an isolated directory; record checksums, restart and rollback outcome. | Yes |
| Dependency-risk disposition | BLOCKED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Audit reports 4 moderate, 0 high, 0 critical; assess compatible fixes for `gaxios`, `googleapis`, `googleapis-common`, `uuid`. Avoid blind major upgrades. | Owner/developer decision |
| Branch divergence and test-file incident | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Review 878 ahead / 2 behind at tested code candidate `9dd102f9636a5ba71c797cf79c104d3616cbe14e` and base-only add/revert commits before integration; no destructive repair performed. | Yes |
| Production acceptance | BLOCKED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Multiple runtime, external, media and owner gates remain incomplete. | Yes |

Safety invariants remain unchanged: public/unattended YouTube publishing disabled; private upload is a separately authorized one-operation path; Facebook live publishing disabled and dry-run safeguards retained; Safari affiliate campaigns inactive; only approved Selar destination is `https://selar.com/0u19v8u99l`. No live YouTube upload or Facebook post occurred.

**Verdict at tested code candidate `9dd102f9636a5ba71c797cf79c104d3616cbe14e`: CODE-LEVEL ACCEPTANCE BLOCKED; PRODUCTION ACCEPTANCE BLOCKED.**

## Addendum — regression restoration verification (24 October 2026, 20:10 UTC)

This addendum supersedes the earlier branch-count and test-file notes above where they conflict.

- Current implementation branch commit at the time of verification: `c507b63abfa336165865ad01cf6354ae50254f04`.
- [Automation validation run 40128537077](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40128537077) completed **PASS** on that exact SHA: **209 Node tests passed, 0 failed, 0 skipped**. This includes the restored `test/restore-facebook-draft-history.test.mjs` regression tests for successful cross-run artifact restoration, malformed-archive fail-closed behaviour, HTTPS-only API configuration and oversized-response rejection.
- [Production readiness run 40128537135](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40128537135) produced and retained a diagnostic artifact (artifact ID `12574685153`, expires 23 November 2026), then exited nonzero because mandatory production gates remain blocked. This is the intended fail-closed result, **not** production acceptance.
- The regression test was recovered from historical commit `71578dafc24e5d48173dce3f4e392e18e42aa40e` and committed separately; no merge, reset, force-push or history rewrite was performed.
- The branch now has **898 commits ahead, 2 behind** `main`, with **95 changed files**. Merge base remains `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` was `fa00d28e7f58911482686e4ad69fac9f4701a2e6` at this comparison.
- Browser-driven dashboard acceptance, genuine media and rights review, real YouTube OAuth/channel/history reconciliation, an explicitly authorized private upload, Facebook default-branch draft artifact verification, and owner-controlled recovery/restart drills remain **NOT RUN / BLOCKED**. No external post or upload was performed.

The above is CI evidence for commit `c507b63abfa336165865ad01cf6354ae50254f04`. Any later code or documentation commit requires its own exact-SHA checks before it can be described as the latest verified head. Production remains **BLOCKED**.


## Historical code/test checkpoint — 24 October 2026

The dashboard now derives draft-preparation slots and cycle/spacing labels from the authoritative backend schedule; the unsupported Thursday option and obsolete hardcoded cadence were removed. The stale Meta-adapter disclaimer was corrected. Regression test: `test/dashboard-ui-contract.test.mjs`.

Exact candidate `7490e0caa966861ba16a6af023fb45d0914d9a34`: [automation 40129571307](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571307) passed 211 Node tests, 8 Python safety tests, clean normal install and zero npm audit advisories; [metadata 40129571317](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571317) and [content quality 40129571311](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571311) passed. [Readiness 40129571315](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571315) is correctly blocked. The Facebook draft PR run was skipped and is not acceptance evidence.

Outstanding owner/runtime gates remain: actual browser E2E and restart persistence; genuine rights-cleared short and long-form exports and human approval bound to final hashes; verified SonicVhibez OAuth/channel/history; separate authorization and verified private-upload receipt; verified Nature Frontiers Page and actual retained default-branch Facebook draft; isolated backup/restore/concurrency/rollback drills. No external upload or post occurred. Production acceptance remains **BLOCKED**.


## Browser E2E verified; production gates remain blocked — 24 October 2026

Source candidate `e1afbdc51745ef18e47f12a93629674c76dc73a0` passed [Playwright browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130547249), [automation regression/security validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550675) (211 Node tests, 8 Python tests, zero npm audit advisories), [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550684) and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550761).

Browser testing found and helped repair mobile horizontal overflow caused by unbroken Meta blocker text. The browser test now passes at 375px and verifies authenticated dashboard connection, local draft/job persistence, duplicate rejection and fail-closed readiness. Playwright was upgraded to 1.64.1 after a high-severity advisory in 1.55.0 was detected; the current audit is clean.

Still blocked: no verified production media exports/licences/approvals; no live SonicVhibez OAuth/channel/history verification; no authorized private upload or receipt; no verified Nature Frontiers Page or retained default-branch Facebook draft; and no owner-run backup/restore/restart/concurrency/rollback evidence. Readiness run [40130550732](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550732) is blocked correctly, and Facebook PR run [40130550704](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550704) is skipped. No external upload or post occurred. PR #1 remains open, draft and unmerged; release verdict is **BLOCKED**.


## Approval-artifact rollback regression checkpoint — 25 October 2026

**Code/test candidate:** `85f4ececcdedc576c66dccf6103180fe0f2e9c72` (this documentation update is a later documentation-only descendant).

### Defect fixed and regression evidence
- Found a transaction edge case in `scripts/approval-artifact-transaction.mjs`: if the exclusive hard-link publication succeeded but removing its temporary hard link failed, the function threw while leaving the final approval artifact visible. That could make an operation appear failed while an uploadable-looking approval remained.
- The transaction now removes the final path it exclusively created when any later publication step fails, then cleans up the temporary path. If rollback itself fails, it reports that failure explicitly rather than hiding it.
- Added regression coverage in `test/approval-artifact-transaction.test.mjs` for injected temporary-link cleanup failure. The final approval path and temporary file must both be absent after the failed operation.
- Isolated local execution of the four approval transaction tests: **4 passed, 0 failed, 0 skipped**. This is focused local evidence, not a substitute for the full application suite.
- Exact candidate CI: [automation/security run 40168535857](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535857) **PASS** — 224 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; normal clean `npm ci`, Google API import, syntax/compile/campaign/queue checks passed; `npm audit` reported 0 vulnerabilities. [Browser E2E run 40168535886](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535886) **PASS** — 3 Chromium tests against the real local dashboard/backend. [Metadata run 40168535856](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535856) and [content quality run 40168535873](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535873) **PASS**.
- [Production readiness run 40168535859](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535859) **BLOCKED as intended**; its diagnostic artifact [12589466617](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535859/artifacts/12589466617) is retained through 24 November 2026. The workflow fails because mandatory production gates remain unresolved; that is not a code-test failure and not a release pass. [Facebook draft run 40168535861](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535861) was **SKIPPED** on the PR event and is not default-branch acceptance evidence.
- Git comparison at this code/test checkpoint: **957 commits ahead, 2 behind**, 105 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. PR #1 remains open, draft and unmerged. No merge, rebase, reset, force-push, cherry-pick or history rewrite was performed.

### Acceptance decision
The approval transaction defect is fixed and covered, and the exact candidate's automation, browser, metadata and content-quality checks pass. **The overall project remains IMPLEMENTATION INCOMPLETE; production acceptance is BLOCKED.** Genuine rights-cleared Short and long-form media and completed manifests, final-hash-bound human approval, verified SonicVhibez OAuth/channel identity and complete remote-history reconciliation, explicit authorization for one private upload and verified remote receipt, verified Nature Frontiers Page access and a successful default-branch Facebook draft artifact, isolated backup/restore/interruption/concurrency/rollback drills, full divergent-history review and production deployment verification remain unresolved. Public/unattended YouTube publishing and Facebook live publishing remain disabled; only approved Selar URL is `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive. No real YouTube upload or Facebook post was performed.


## Historical implementation checkpoint — 25 October 2026 (superseded by latest verified checkpoint)

**Exact tested application-code SHA:** `6b05beb4461ddf3065f05b56742a306fa4433ec2`. This checkpoint was tested by GitHub Actions on the exact SHA. Documentation-only descendants, if any, do not change the application code; do not describe this as CI for a later source change.

### Newly implemented fix
The dashboard previously wrote state to a temporary file and renamed it without explicitly flushing the file contents or parent-directory entry. The approval flow relies on state persistence completing before an uploadable approval artifact is exposed, so a successful rename alone was insufficient evidence of durable persistence across a crash/power loss.

- Added `scripts/atomic-json-file.mjs` with exclusive temporary-file creation, restrictive permissions, file `fsync`, atomic rename, parent-directory `fsync`, and cleanup of pre-rename temporary files on failure.
- Updated `scripts/dashboard-server.mjs` so all durable dashboard-state writes use this helper.
- Added `test/atomic-json-file.test.mjs`: complete JSON and mode check; simulated temporary-write failure preserves old state and removes the temp file; simulated rename failure preserves old state and removes staged file; symlink destination is rejected without following it.
- The existing approval-artifact transaction remains ordered so durable state persistence occurs before final approval artifact publication. If state persistence fails, no final approval artifact is exposed.

### Exact-SHA CI evidence
- [Automation/security run 40169467609](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467609) **PASS**: 228 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; clean locked install and isolated normal lifecycle-script `npm ci` passed; campaign/destination, review-metadata, queue, JavaScript syntax and Python compilation checks passed; `npm audit` reported 0 info, 0 low, 0 moderate, 0 high and 0 critical advisories.
- [Browser E2E run 40169467597](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467597) **PASS**: 3 Chromium tests against the real local dashboard/backend, including authenticated draft persistence and duplicate rejection, campaign safeguards, blocked readiness/mobile overflow, and a separate real local server restart persistence test.
- [Metadata run 40169467568](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467568) **PASS**.
- [Content-quality run 40169467601](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467601) **PASS**.
- [Lockfile validation run 40169463693](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169463693) **PASS**.
- [Production readiness run 40169467574](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467574) **BLOCKED as required**; its failure is the expected fail-closed result while mandatory production gates are unresolved, not a successful release gate.
- [Nature Frontiers Facebook draft run 40169467625](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467625) **SKIPPED** on the pull-request event; it is not default-branch draft acceptance evidence.

### Baseline and acceptance limitations
The pre-change baseline was not re-executed against the immediately preceding branch SHA before this patch. The last reported historical comparison was 224 Node tests / 8 Python tests on a different code candidate; it is not presented as a same-SHA baseline. Current exact-SHA evidence is 228 Node / 8 Python tests.

Current branch SHA at the code checkpoint: `6b05beb4461ddf3065f05b56742a306fa4433ec2`. `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`. Live comparison: **967 commits ahead, 2 behind, 107 changed files**. PR #1 remains open, draft and unmerged. No merge, rebase, reset, force-push, cherry-pick or history rewrite was performed. The complete divergent patch history has not been reviewed line by line, so branch reconciliation is not accepted.

### Remaining release gates
**Code acceptance is PARTIALLY VERIFIED, not fully accepted. Production acceptance is BLOCKED.** The current test suite and three browser tests do not establish every visible control/API route or all recovery drills. Genuine rights-cleared Short and long-form media, final manifests and validation reports, human playback and hash-bound approval, verified SonicVhibez OAuth/channel identity and complete remote-history reconciliation, explicit authorization for one private upload and verified remote receipt, verified Nature Frontiers Page access and successful default-branch Facebook draft artifact, isolated backup/restore/interruption/concurrency/rollback drills, complete branch-history review and actual deployment/monitoring verification remain outstanding. No real YouTube upload or Facebook post was performed. Public/unattended YouTube publishing and Facebook live publishing remain disabled. Only approved Selar destination: `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive.


## 2026-10-26 — content quality and Short relationship gates

The renderers now require `qualityEvidencePath` and run the content-quality evidence validator before FFmpeg. Missing script structure/source references, placeholder rights evidence, provenance hash mismatches, non-reproducible edit plans, unverified audio measurements, missing human editorial review, or an invalid Short parent relationship block rendering. These checks are evidence validation only; they do not independently prove licence authenticity or visual realism.

For Shorts, the internal parent and canonical parent URL are separate from YouTube Studio's native Related video setting. That native setting remains a manual verification gate and must not be marked `VERIFIED` without a dated artifact showing the child Short ID and intended parent video ID. Public/unattended publishing remains disabled.


## 2026-10-26 — render limitations

The Short and long-form renderers no longer loop source footage to manufacture target duration. They apply seed-bound framing/subtle bounded colour grading and selected narration audio filters, then measure the actual output audio loudness and true peak before success. These code gates passed automated tests on source/test SHA `26785f59e8fe600d7db73c261148f38dee627c83`. The renderer still accepts a single footage input rather than composing a complete multi-scene storyboard. Genuine multi-scene timeline/transition composition, actual production media, full human playback and verified rights evidence remain unresolved; do not call the production pipeline fully complete.


## 2026-10-26 — YouTube native Related video visibility blocker

The [official YouTube Help instructions](https://support.google.com/youtube/answer/14075157?hl=en-GB) require a Related video target to be public or unlisted and the channel to have advanced feature access. A privately uploaded parent therefore cannot be used as the native Shorts Related video target. Since public/unattended publishing remains disabled, native Related video acceptance is BLOCKED_EXTERNAL until the owner explicitly authorizes an eligible public/unlisted parent visibility or chooses not to use the native feature. No visibility change was made. The publication-stage code gate now rejects private/unknown parent visibility.


## Live checkpoint update — 26 October 2026

Candidate `a912d3c724195fb1f3ca823d186cddf8b9b4f984` adds fail-closed validation for script research-source records: malformed objects, absent title/URL, non-HTTPS/placeholder/credential-bearing URLs, duplicate IDs and excessive source counts are rejected before provider access. Regression tests are included. Exact-SHA CI runs are pending at note time; see [current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-26.md). This is a narrow code improvement, not closure of the production blockers.

Still blocked: script-generation lifecycle/dashboard integration; real multi-scene composition and perceptual reuse checks; genuine rights-cleared full exports and human playback review; independently verified SonicVhibez OAuth/channel/history and one-shot private-upload recovery; native Related video eligibility/verification; genuine Nature Frontiers Page identity/permissions and draft-only execution; owner-approved feasible cadence; exhaustive dashboard/recovery/deployment drills; full divergent-history review and owner-controlled branch protection. PR #1 remains open/draft/unmerged; `main` is unchanged. No external upload, publication, campaign activation, merge or destructive Git operation occurred.

## 27 October 2026 checkpoint supplement

Exact source/test SHA: `28d326c474d2c4871f6e9f2f55f050dac9fe14bd`. The asset provenance quality gate now validates lineage graphs and rejects duplicate asset IDs, missing derivative ancestors, self-derivation, malformed lineage declarations and cycles. Unit and integrated regression tests were added. Exact-SHA workflows: automation/security PASS [40444442486](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442486), dashboard browser E2E PASS [40444442543](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442543), metadata PASS [40444442439](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442439), content quality PASS [40444442512](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442512). Readiness remains BLOCKED [40444442464](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442464); Facebook daily draft remains SKIPPED [40444442448](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442448); isolated baseline was pending [40444442431](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442431) when this supplement was recorded.

**Still a code defect:** `POST /api/jobs/produce` does not connect generated script authoring to narration, caption generation, scene rendering and downstream gates. Do not mark that journey accepted or remove its fail-closed guard until the actual stages are integrated and tested. External blockers for genuine media, rights, channel identity/history, owner cadence approval, Facebook Page verification, native Related video, recovery/deployment drills, complete divergent history review and repository governance remain open. Publishing safety switches remain off.

---

## Live blocker update — 27 October 2026: authoring narration stage added

Current tested source/test checkpoint: `4b4b041dd45c41246736bd7973be8d05ba091286`; latest application-code commit: `3a891228a169c027d22bf6a3d6e9a2bba2a102e4`. Current branch HEAD before this documentation update: `4b4b041dd45c41246736bd7973be8d05ba091286`.

A new draft-only `scripts/generate-authoring-narration.py` component now accepts a structured generated script, validates section/transcript consistency, depth and claim source IDs, produces Edge TTS narration and uses actual TTS word-boundary events for SRT captions. It records canonical script, audio, transcript and caption hashes and fails closed if timing evidence is absent. The script prompt was aligned to 900–1,500 long-form words and 125–150 Short words. Tests are in `tests/test_generate_authoring_narration.py`.

**This does not close the principal authoring-to-render integration blocker.** `POST /api/jobs/produce` still refuses jobs with authoring records. The new component is not yet invoked by the dashboard, and the application does not yet connect generated script → narration/captions → explicitly approved storyboard/source assets → per-job multi-scene render → actual audio/export/metadata checks → hash-bound human review. The guard must remain until that complete path is implemented and tested. No genuine TTS file, rights-cleared final export or human playback review is evidenced.

Exact-SHA checks at `4b4b041dd45c41246736bd7973be8d05ba091286`: automation/security PASS (328 Node, 16 Python; [run 40449501858](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501858)); dashboard browser E2E PASS (12 tests; [run 40449501863](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501863)); content quality PASS ([run 40449501841](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501841)); metadata PASS ([run 40449501936](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501936)); isolated baseline was still IN PROGRESS when recorded ([run 40449501846](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501846)); readiness BLOCKED ([run 40449501870](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501870)); Facebook draft SKIPPED ([run 40449501843](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501843)).

Continue to keep public/unattended YouTube publishing disabled, Facebook live publishing disabled, Safari campaigns inactive, and Nature Frontiers excluded from YouTube targets. Preserve the approved Selar URL exactly: `https://selar.com/0u19v8u99l`.


---

## Live implementation update — 27 October 2026: narration review stages

Exact application/test SHA: `c5bfbbc7861616494c6b589604fa3797e673681a`.

Implemented and tested a hash-bound script approval route, narration-generation stage, authenticated narration playback/review bundle, narration approval bound to audio/transcript/caption/report hashes, and a no-TTS-retry recovery endpoint. The dashboard now exposes the script review, narration generation, playback, transcript/caption review and recovery controls.

Exact-SHA results: automation/security PASS (336 Node + 16 Python tests; npm audit zero vulnerabilities) [run 40453030534](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030534); browser E2E PASS (12 Chromium tests) [run 40453030615](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030615); content quality PASS [run 40453030586](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030586); metadata PASS [run 40453030574](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030574); isolated baseline PASS [run 40453030640](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030640); readiness BLOCKED [run 40453031961](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453031961); Facebook daily draft SKIPPED [run 40453030497](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030497).

**The primary production integration blocker remains open.** `POST /api/jobs/produce` still refuses authoring jobs. No live Edge TTS audio or final video was generated; API integrity tests use synthetic fixture bytes and do not constitute real audio or human playback evidence. The next code task is to bind an approved production plan and rights-cleared scene assets to the approved narration, render into per-job paths, run the final validators and require final-video review before removing the refusal.

Keep public/unattended YouTube OFF, Facebook live OFF, Safari campaigns inactive and Nature Frontiers excluded from YouTube targets. Do not claim the app is production accepted.


## Addendum — 27 October 2026 production-plan checkpoint

### Code progress
- Added a hash-bound production-plan schema and scene manifest validator.
- Added authenticated submission/review endpoints and dashboard controls with a persisted-plan preview.
- Both submission and approval recheck exact approved narration/audio/transcript/caption/report hashes and each scene asset/rights-evidence file hash. Short plans must match the independently persisted approved parent relationship and verified public SonicVhibez receipt.
- Production-plan approval is **not** final media approval. POST /api/jobs/produce still blocks authoring jobs.

### Still blocked
1. Convert the approved plan and exact narration/captions into per-job quality evidence and a render manifest compatible with the existing multi-scene renderer.
2. Independently validate every source's provenance and rights record; human review must not be inferred from hashes or checkbox fields alone.
3. Run actual FFmpeg/FFprobe production renders, final media/metadata/caption checks, and hash-bound final-video playback review.
4. Complete successful Short-parent recovery tests using real approved parent and remote receipt evidence.
5. Verify OAuth/channel/history, private-upload attempt ledger and receipt, YouTube native Related video association, Nature Frontiers Page permissions, and a non-skipped Facebook draft-only integration.
6. Complete operational restart/rollback/backup/restore/emergency-stop drills and the full divergent Git-history review.

### Latest evidence
- Application-code SHA: 6224218660a11fd59353dbab96d9963e429649bb.
- Exact test tree: 95a64fa88f668ba0f88cd2f4be394c9100c6ff53.
- Automation/security PASS: 345 Node tests, 16 Python safety tests, dependency audit and syntax/compile checks — [run 40487769081](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40487769081).
- Content quality PASS — [run 40488246239](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488246239); metadata PASS — [run 40488245972](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488245972); isolated baseline PASS — [run 40488246103](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488246103).
- Production readiness BLOCKED — [run 40488246069](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488246069). Facebook daily draft SKIPPED — [run 40488245959](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488245959). The latest browser workflow including the new plan-preview assertion was pending at the time this addendum was written; do not reuse the prior 12-test result as evidence for the latest UI.

### External publishing blocker
Metricool currently lists Nature Frontiers with a YouTube connection. Seven future posts dated 31 October–25 November have autoPublish: true, draft: false, and Instagram auto-publish enabled; a post on 27 October is marked Facebook PUBLISHED; a pending/draft YouTube Short on the Nature Frontiers brand has public privacy metadata. No external posts/settings were changed. Pause/reconcile these scheduled actions and remove the incorrect YouTube association before any further publishing.

Keep all repository publication safeguards enabled. Full production acceptance remains **BLOCKED**.


## Follow-up code correction — 27 October 2026

The readiness engine now treats 72 elapsed hours as a hard minimum for every cadence mode and no longer accepts `WEEKLY_TARGET_WITH_SHORTER_SPACING`. See source/test SHA `47c839452fda99757a34dcb29865da9e967121af` and [exact-SHA CI evidence](https://github.com/clickerrish-art/YT-AUTO-VISE/blob/codex/marketing-machine-audit-fixes/docs/CURRENT_RELEASE_EVIDENCE_2026-10-27.md).

This closes the code-level defect that could have accepted a shorter spacing policy. It does **not** close the owner cadence decision: the configuration remains unapproved until an explicit feasible mode is selected. Production remains blocked on real media/rights/human review, verified YouTube identity and history, private-upload authorization/receipt, eligible native Short Related video evidence, successful real Meta draft-only integration, and operational recovery/deployment acceptance.


## Follow-up implementation checkpoint — 27 October 2026

The private-only Short review path now permits an explicit `BLOCKED_EXTERNAL` native Related-video status without representing it as a successful association. An empty or vague blocker explanation is rejected and covered by a regression test. Exact source/test SHA: `77921aca418b25bca0a9aa681281145b00c6d72f`; application-code commit: `2186822bba83ecfb299e40ab8d10376c009f8711`. Evidence is recorded in [current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-27.md).

This does not clear native Related-video eligibility or authorize public publishing. Production readiness remains blocked by genuine approved media and human review, verified SonicVhibez OAuth/history and a private-upload receipt, real Meta draft-only integration, an owner-approved feasible cadence, and complete recovery/deployment acceptance. Browser E2E and isolated baseline were still in progress at the source/test checkpoint; verify their final outcomes before release. Keep publishing safeguards unchanged.


## Current acceptance checkpoint — 28 October 2026

**Tested source/test candidate:** `1f72c6dc5b648f0c60fdea45ae1d37e835e4505e`.

The current candidate passed:
- Automation/security [40598195046](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195046): 384 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities.
- Content quality [40598195232](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195232).
- Metadata [40598195101](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195101).
- Browser E2E [40598195206](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195206): 13 Chromium journeys.
- Isolated main/candidate baseline [40598195202](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195202), with both Node and Python baseline commands exiting 0; retained artifact [12776283618](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195202/artifacts/12776283618), ZIP SHA-256 `989203aab1898f8d740d4f56294e03eec8d023cb6086ce4c171ee2aff156ad2b`.

New repository-controlled safeguards include byte-safe operator-token comparison, regression tests for malformed UTF-8 token lengths, a reproducible `npm run inventory:dashboard` command, and an inventory-driven unauthenticated-access test across every discovered `/api/*` method/path.

### Blockers remain

Production readiness [40598195430](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195430) still correctly fails closed. Missing or unverified production prerequisites include genuine final Short/long-form assets and source/rights manifests, human factual and full-playback approval, verified SonicVhibez channel identity/OAuth and complete remote video-history reconciliation, explicit single-operation private-upload authorization and independently verified receipt, owner-approved feasible cadence, native Related-video eligibility or an explicit retained external blocker, external Meta draft-only acceptance, branch protection, and controlled deployment/recovery/rollback drills.

The dashboard inventory is **not** exhaustive behavioral acceptance. The full DASH-001 requirement remains `NOT_TESTED`; current authentication coverage proves only that unauthenticated requests to inventoried API routes receive HTTP 401. Authorized success, permission boundaries, malformed/boundary inputs, concurrency, dependency/persistence failure, restart durability, audit outcomes and full accessibility acceptance remain to be completed.

No live upload/post, visibility change, campaign activation, merge, main edit, or destructive Git reconciliation was performed. Public/unattended YouTube publishing, live Meta publishing and Safari remain disabled.

## Exact-SHA revalidation — 28 October 2026

Source/test candidate `ce3ee82d48265ef16c39e5d9b84debd69709112a` passed automation/security (386 Node tests, 0 failures, 0 skips), content quality with FFmpeg/ffprobe integration (386 tests, 0 failures, 0 skips), metadata validation, 13 Chromium journeys, and isolated main/candidate baseline (main and candidate install/Node/Python commands exit 0). Evidence: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40606304386), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40606304170), [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40606304233), [browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40606298746), [baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40606304157).

The readiness workflow [40606304141](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40606304141) remains BLOCKED/FAILED by genuine prerequisites. Meta workflow [40606304174](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40606304174) completed local validation, but external draft creation was skipped. These are still blockers, not passes.

Unresolved owner/external actions: verify SonicVhibez account/channel ID and OAuth ownership; reconcile complete remote history; provide genuine rights-cleared final assets and exact-hash human review; authorize a one-operation private upload only when all gates pass; approve a mathematically feasible cadence; verify Meta Page/Instagram identity and actual draft creation; decide whether native Related video remains unconfigured while parent is private; verify branch protection; perform isolated deployment/backup/restore/rollback drills. Do not enable public/unattended YouTube or live Meta publishing, change visibility, activate Safari, or alter the approved Selar URL.

## Live Metricool safety finding — 2026-10-28

- Metricool currently exposes one brand labelled Nature Frontiers; the inspected queue had eight upcoming Facebook/Instagram promotions with `draft: false` and `autoPublish: true`.
- Post `406357273` showed as published on 2026-10-27. The implementation run did not modify existing scheduled posts.
- Treat cross-platform promotional automation as unsafe until the owner has resolved these pending posts and a read-only recheck confirms the intended draft-only state.
- Exact-SHA code/test evidence for the remote-publication timestamp fail-closed correction is recorded in [CURRENT_RELEASE_EVIDENCE_2026-10-28.md](CURRENT_RELEASE_EVIDENCE_2026-10-28.md). Passing CI does not clear the owner-controlled integration and media gates.

## Current-HEAD verification — 2026-10-28

- Exact tested source/test candidate: `cfa4e3c3b18e8fd2e799a676f56b32ade766d072`.
- Remote `published`, `public`, `private`, and `unlisted` states fail closed if actual publication time is absent; creation/planned timestamps are not publication evidence.
- Both schedule validation entry points reject caller-supplied spacing below 72 elapsed hours; cadence validation requires explicit owner approval and a mathematically feasible policy.
- Current-candidate CI: automation/security 394 Node tests + 16 Python tests passed; content-quality and metadata 394 Node tests passed; dashboard E2E 14 Chromium journeys passed; isolated main/candidate baseline passed.
- Production readiness remains blocked by 13 prerequisites. External Meta draft creation was skipped. These are not production acceptance passes.
- Metricool still has eight upcoming Nature Frontiers Facebook/Instagram promotions with auto-publishing enabled. They were not modified; owner intervention is required.
- Exact links and remaining release gates: [CURRENT_RELEASE_EVIDENCE_2026-10-28.md](CURRENT_RELEASE_EVIDENCE_2026-10-28.md).


## Exact-SHA verification after Meta adapter security fixes — 2026-10-28

- Tested source/test candidate: `ecad7ac2c706983e79c6206bbccb1a6fcaeb3bd9`; latest application-source fix: `e090b19136d9336c45fd1a01c4c90400c05405d4`.
- The Meta adapter now rejects remote post IDs that only share a prefix with the authorized Page ID and rejects symlinked image assets before file inspection or remote mutation.
- Exact-candidate automation/security [40661176042](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176042), content quality [40661176110](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176110), and metadata [40661176011](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176011) passed 399 Node tests each with 0 failures and 0 skips. Automation also passed 16 Python tests and reported 0 npm audit vulnerabilities with FFmpeg installed.
- Dashboard browser E2E [40661176112](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176112) passed 15 journeys; this does not close exhaustive dashboard/API acceptance.
- Isolated baseline [40661176071](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176071) passed with main and candidate Node/Python commands exiting 0. The isolated baseline runner explicitly could not install FFmpeg and skipped its renderer integration test; the candidate automation run installed FFmpeg and had zero skipped tests. Artifact [12804520728](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176071/artifacts/12804520728).
- Readiness [40661176424](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176424) remains blocked by missing production prerequisites. Facebook workflow [40661176046](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176046) passed local validation but skipped external draft creation.
- Register: 51 requirements — 35 PASS, 8 NOT_TESTED, 8 BLOCKED_EXTERNAL. These CI passes do not resolve the external blockers listed above.
- Live main remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. At the source/test checkpoint, comparison was 1,906 ahead / 2 behind / 171 changed files. PR #1 remains open/draft/unmerged; no main edit or destructive reconciliation was performed.


## Non-destructive branch-history finding — 2026-10-28

Live `main` HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6` is titled “Revert unintended test-file write to default branch” and deletes `test/restore-facebook-draft-history.test.mjs`. That regression test remains present on `codex/marketing-machine-audit-fixes` and must be preserved. This verifies one meaningful base/branch difference but does not complete the full history inventory: the implementation branch remains substantially divergent, with two commits on `main` not in the branch and the complete branch-only commit/file review still open. Do not merge, reset, rebase, force-push, or delete the test as a shortcut. Obtain a full non-destructive comparison before any integration proposal.

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

Keep all owner-controlled blockers above open until the specific external evidence is supplied; these test passes do not authorize publication or alter live Metricool records.

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

No production gate is cleared by this validator fix. Keep the channel, media, rights, human review, remote draft and operational blockers open until their own evidence is recorded.


## Latest verified code/test checkpoint — 28 October 2026

Exact candidate `4d003f320df0f1d26c5b46dcb2a0c545cfec785c` passed automation/security (401 Node, 0 failures/skips; 16 Python; npm audit 0 vulnerabilities), content quality (401/401), metadata (401/401), dashboard E2E (15 journeys), and isolated main/candidate baseline. See [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471424), [quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471379), [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471565), [browser](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471427), and [baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471350). Baseline artifact [12809417525](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471350/artifacts/12809417525), SHA-256 `7c46f5156967ef944b8a602e47cc8bbd6e31e7608c6600cd5a9f898a040a7371`.

Dashboard API now rejects non-JSON request media types with 415; a regression test covers JSON-looking `text/plain` payloads. The backup/restore failure-injection fixture now deterministically reaches the rollback path. These changes do not clear production blockers. Production readiness [remains blocked](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471449); the Meta workflow [skipped external draft creation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471614).

Live Git compare: main `fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 1,962 ahead / 2 behind / 172 changed files. PR #1 remains open, draft and unmerged. Full divergence/history review and exhaustive dashboard/API acceptance remain open.
