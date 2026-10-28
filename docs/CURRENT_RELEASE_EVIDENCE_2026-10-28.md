# Follow-up implementation evidence — 28 October 2026, 20:35 UTC

## Cross-process backup/restore lock contention

- **Exact source/test candidate:** `d5e3445def955413d424085489212c5835ff0807`.
- **Change:** `test/backup-restore.test.mjs` now launches a separate Node process that acquires and fsyncs the shared `.restore-operation.lock`, then verifies the parent process's `backupState` refuses to proceed without changing the other process's lock bytes or creating backup output. The test releases the child-owned lock and cleans its isolated fixture.
- **Test-debugging record:** candidate `9c9d98a379a6b0867e4ce8dc2add3162d618b5be` exposed a false-negative readiness-marker assertion (409 passed, 1 failed); the assertion was corrected to recognize the stable marker independent of newline encoding. The corrected candidate below passed all tests.
- **Exact-SHA automation/security:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764160063) — **410 Node tests passed, 0 failed, 0 skipped**; npm audit reported 0 vulnerabilities.
- **Metadata validation:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764160114).
- **Content quality:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764160204).
- **Dashboard browser E2E:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764160061).
- **Isolated main/candidate baseline:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764148454).
- **Lockfile workflow:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764148444).
- **Draft-only workflow:** [PASS for repository/local validation only](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764160297); no remote Meta draft was created or verified.
- **Production readiness:** [BLOCKED/fail-closed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40764160031), as expected while mandatory production prerequisites remain unresolved.

## Live refs at candidate verification

- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Tested source/test candidate: `d5e3445def955413d424085489212c5835ff0807`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- PR #1 remained open, draft and unmerged. The full Git divergence review remains incomplete.
- This evidence update is documentation-only; it does not change the tested source/test candidate.

## Scope limit

The new test verifies real separate-process lock contention, lock preservation, and no backup output while another process owns the shared lock. It does not prove process termination during restore, power-loss durability, full rollback after every interruption point, deployment rollback, or reconciliation of uncertain remote provider side effects. **Production remains blocked.**

---

# Follow-up implementation evidence — 28 October 2026, 20:23 UTC

## Shared backup/restore lock cleanup and truthful contention reporting

- **Exact source/test candidate:** `918f33295994d47a3f669e8b491828fd8293a862`.
- **Source commits:** `73c697c9c675504b07f15ad2c915261f0313769a` (shared backup/restore lock), `a0d6d74d239d318487fac8201602844ba34ea1ee` (accurate shared-lock contention message).
- **Test commits:** `086f157356a78d026b6e1dde4e473d01b85773ba` (backup-vs-restore contention), `753ecd7cdcb265b43113d264d79abb8dc0ba16b4` (lock cleanup on validation failure), `918f33295994d47a3f669e8b491828fd8293a862` (updated restore contention assertion).
- **Additional fix:** because backups now use the same exclusive lock as restore, a restore that encounters a backup lock reports the shared backup/restore operation accurately rather than incorrectly saying only another restore owns it.
- **Regression:** a backup with no eligible entries fails validation, leaves no backup output, and releases its own shared lock. Restore's lock-contention test asserts the shared-lock message.
- **Exact-SHA automation/security:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762720045) — **409 Node tests passed, 0 failed, 0 skipped**; npm audit reported **0 vulnerabilities**.
- **Metadata validation:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762720246).
- **Content quality:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762720195).
- **Dashboard browser E2E:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762720017).
- **Isolated main/candidate baseline:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762709642).
- **Draft-only workflow:** [PASS for local validation only](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762720015); this is not proof of a remote Meta draft.
- **Production readiness:** [BLOCKED/fail-closed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762720001), as expected while mandatory production prerequisites remain unresolved.

## Live Git snapshot before this documentation update

- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Implementation branch / PR #1 HEAD: `918f33295994d47a3f669e8b491828fd8293a862`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- GitHub compare: **2,014 ahead / 2 behind / 174 changed files**, status `diverged`.
- PR #1 remains open, draft and unmerged. `test/restore-facebook-draft-history.test.mjs` is present on the implementation branch and absent from main after main's explicit revert.
- Documentation commits following this candidate do not change source/test behavior.

## Scope limit

Backup destination overwrite protection, backup durability flushing, backup/restore mutual exclusion, lock cleanup after validation failure, and shared-lock error reporting are implemented and covered. Full power-loss/deployment recovery, complete dashboard/API acceptance, genuine production media and rights approval, verified YouTube/Meta external operations, owner-approved cadence and full Git reconciliation remain unresolved. **Production remains blocked.**

---

# Follow-up implementation evidence — 28 October 2026, 20:19 UTC

## Serialize backup snapshots with restore transactions

- **Exact source/test candidate:** `086f157356a78d026b6e1dde4e473d01b85773ba`.
- **Source commit:** `73c697c9c675504b07f15ad2c915261f0313769a`.
- **Regression-test commit:** `086f157356a78d026b6e1dde4e473d01b85773ba`.
- **Defect:** restore already uses an exclusive operation lock, but backup did not participate. A backup could read files while a restore transaction was committing and capture a mixed/partial snapshot.
- **Fix:** `backupState` now acquires the same exclusive `.restore-operation.lock` used by `restoreState`, refuses to proceed if another operation owns it, and removes only the lock whose token it created. Existing symlink and real-directory checks protect the lock path. Restore and backup therefore fail closed rather than run concurrently under the shared state directory.
- **Regression:** pre-create a restore lock, call `backupState`, assert the operation is rejected, verify lock bytes are unchanged, and verify no backup output is written.
- **Exact-SHA automation/security:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762134886) — **408 Node tests passed, 0 failed, 0 skipped**; npm audit reported 0 vulnerabilities.
- **Content quality:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762134957).
- **Metadata validation:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762135041).
- **Dashboard browser E2E:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762135380).
- **Isolated main/candidate baseline:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762127254).
- **Draft-only workflow:** [PASS for local validation only](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762135171); remote Meta draft creation was not established.
- **Production readiness:** [BLOCKED/fail-closed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40762135154), as expected while mandatory prerequisites remain unresolved.

## Test-file addition/deletion incident — history checked

- Current implementation branch contains `test/restore-facebook-draft-history.test.mjs` (blob `b6d4ab9c30d1e025bf2e55bddae446d96a2cb2a3`). It includes injected GitHub artifact API tests for cross-run draft-history restoration, malformed archives, and safe output handling.
- GitHub path history shows main commit `71578dafc24e5d48173dce3f4e392e18e42aa40e` originally added the test on 24 October, followed by `fa00d28e7f58911482686e4ad69fac9f4701a2e6` explicitly reverting the unintended test-file write to main. The implementation branch later added its own intentional test commit `c507b63abfa336165865ad01cf6354ae50254f04` and symlink regression commit `fd92b55415c8a630860dba5894dae705b19ef5ac`.
- The file is present and exercised on the implementation branch. It is absent on current `main`; that absence matches the explicit revert. No attempt was made to restore it to main or alter either history.

## Live Git snapshot before this documentation update

- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Implementation branch / PR #1 HEAD: `086f157356a78d026b6e1dde4e473d01b85773ba`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- The branch remains substantially diverged from main; full commit-by-commit reconciliation remains incomplete.
- The evidence update that follows is documentation-only and does not alter the tested source/test candidate.

## Scope limit

The backup writer now protects explicit output paths, flushes backup contents, and serializes backup snapshots against restore transactions. The lock-contention regression does not complete full crash/power-loss recovery, deployment rollback, exhaustive dashboard/API acceptance, genuine production-media approval, or external platform verification. **Production remains blocked.**

---

# Follow-up implementation evidence — 28 October 2026, 20:15 UTC

## Backup overwrite and durability fix

- **Exact source/test candidate:** `7cdd5fe59686acdd5e3499289463ccc5369f0efd`.
- **Source commit:** `3be0ddf7b8fcd4445d8bb93fe1f015a7ab006f51` updates `scripts/backup-state.mjs`.
- **Regression-test commit:** `7cdd5fe59686acdd5e3499289463ccc5369f0efd` updates `test/backup-restore.test.mjs`.
- **Defect:** an explicit `outputPath` could already exist and `renameSync` could silently replace the previous backup.
- **Fix:** backup content is written to an exclusive temporary file, flushed with `fsync`, and finalized with an exclusive same-directory hard link. An existing destination is rejected rather than replaced; the temporary file is cleaned up. POSIX directory metadata is flushed before success is reported.
- **Regression:** pre-create an operator-owned backup, call `backupState` with that path, assert it rejects with the overwrite-protection error, verify the original bytes remain unchanged, and verify no temporary file remains.
- **Exact-SHA automation/security:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40761601849) — the run completed successfully; the exact-SHA metadata test workflow also reports **407 Node tests passed, 0 failed, 0 skipped**, with npm audit reporting **0 vulnerabilities** ([run](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40761591289)).
- **Content quality:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40761601910).
- **Metadata validation:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40761591289).
- **Dashboard browser E2E:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40761601880).
- **Isolated main/candidate baseline:** [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40761591541).
- **Draft-only workflow:** [PASS for local validation only](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40761601917); it does not establish remote Meta draft creation.
- **Production readiness:** [BLOCKED/fail-closed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40761601938), as expected while mandatory production prerequisites remain unresolved.

## Live Git snapshot before this documentation update

- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Implementation branch / PR #1 HEAD: `7cdd5fe59686acdd5e3499289463ccc5369f0efd`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- GitHub compare: **2,002 ahead / 2 behind / 174 changed files**, status `diverged`.
- PR #1 remains open, draft and unmerged. `test/restore-facebook-draft-history.test.mjs` remains present.
- The following acceptance evidence commits are documentation-only and are not treated as application/test validation.

## Scope limit

This closes the explicit-backup-path overwrite defect and improves backup durability. It does not prove full backup/restore concurrency, crash/power-loss recovery, deployment rollback, complete dashboard/API acceptance, or overall production readiness. The acceptance status remains **PARTIALLY IMPLEMENTED / PRODUCTION BLOCKED**.

---

# Follow-up implementation evidence — 28 October 2026, 20:04 UTC

## Source/test candidate and targeted fix

- **Exact source/test SHA:** `54a15314e53c00af3e33faf8a7d691a72372e00a`.
- **Changes:** `scripts/dashboard-server.mjs` no longer drops a queue item marked `reservationType: "SCHEDULED_SLOT"` solely because `scheduledDate` is absent. The malformed reservation now reaches `validatePublicationSlot` without a timestamp and blocks new scheduling fail-closed.
- **Regression test:** `test/dashboard-api-request-boundaries.test.mjs` now starts the real dashboard server, injects a malformed persisted scheduled reservation, attempts an authenticated `POST /api/jobs`, expects HTTP 409 with the precise missing-timestamp blocker, confirms `publishingEnabled=false`, and verifies persisted state is byte-identical after rejection.
- **Code/test commits:** source fix `c6f4ea8db1bcc8ec14e38ee0d9b3336abdae1aff`; regression test `54a15314e53c00af3e33faf8a7d691a72372e00a`.

## Exact-SHA CI evidence

All runs below were triggered for candidate `54a15314e53c00af3e33faf8a7d691a72372e00a`:

- Automation/security: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40759742550). The real-server regression is explicitly reported passing. The Node test step completed successfully with zero skips required by the workflow; the log contains 406 passing test lines and zero failed test lines. npm audit summary: 0 info, 0 low, 0 moderate, 0 high, 0 critical vulnerabilities.
- Content quality: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40759742691).
- Metadata validation: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40759742541).
- Dashboard browser E2E: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40759742592).
- Isolated main/candidate baseline: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40759733666), using the live main SHA `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate `54a15314e53c00af3e33faf8a7d691a72372e00a`.
- Draft-only workflow: [workflow PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40759742755); this does not prove a remote Meta draft was created, and no remote posting was authorized.
- Production readiness: [BLOCKED as expected](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40759742599). Missing production prerequisites remain blockers; this failure is not a test regression and must not be bypassed.

## Live Git snapshot before this documentation update

- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Implementation branch / PR #1 HEAD: `54a15314e53c00af3e33faf8a7d691a72372e00a`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Comparison: **1,997 ahead / 2 behind / 174 changed files**, status `diverged`.
- PR #1 remains open, draft, and unmerged.
- The evidence/documentation update that follows is documentation-only. It does not alter source/test behavior; all test claims above remain tied to the exact candidate SHA.

## Acceptance impact

This closes one specific fail-open omission in queue reservation validation and adds real-server regression coverage. It does **not** close `DASH-001`, `SCHED-001`, `GIT-002`, or overall production acceptance. Full control/route acceptance, concurrency/restart/operational recovery, complete divergence review, verified channel history, genuine production media/rights/human approval, owner-approved cadence, and external provider decisions remain open.

**Verdict remains: PARTIALLY IMPLEMENTED / PRODUCTION BLOCKED.**

---

# Verified release checkpoint — 28 October 2026, 14:35 UTC

## Live refs snapshot at start of verification (before documentation-only refresh commits)

- `main` HEAD at snapshot: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Implementation branch / PR #1 HEAD at snapshot: `34d083d84a6410a176174cdffb4ebb59efecb2b4`.
- Merge base / PR base SHA: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Comparison at snapshot: **1,992 ahead / 2 behind / 174 changed files**; GitHub reported the refs as diverged.
- PR #1 is **open, draft, and unmerged**. No merge, rebase, reset, force-push, main-branch write, or external publishing operation was performed during this verification.
- Documentation-only evidence commits after that snapshot: `bd2d11d26f4351c5756915b08a8add93edd1ec00` (release evidence refresh) and `e92214c4854f2f7f3bbf33f7eee107246db7e409` (acceptance register refresh). These commits do not change application source or tests. The source/test candidate remains `34d083d84a6410a176174cdffb4ebb59efecb2b4`.

## Exact-HEAD GitHub Actions evidence

These runs are associated with exact candidate `34d083d84a6410a176174cdffb4ebb59efecb2b4`:

- Automation/security: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40706792068) — **405 Node tests passed, 0 failed, 0 skipped**; **16 Python tests passed**. The log includes the full Node test summary.
- Content quality: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40706792055).
- Dashboard browser E2E: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40706792120).
- Metadata validation: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40706792135).
- Isolated baseline comparison: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40706792076) — logs confirm main SHA `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate SHA `34d083d84a6410a176174cdffb4ebb59efecb2b4`; retained artifact ID `12824088751`, ZIP SHA-256 `494261ec68ef48819eb41c34b4bfbcfae8880fd09db5e1a88fc8d493cbddcb2c`.
- Nature Frontiers Facebook draft workflow: [workflow PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40706792503) means local workflow completed; it **does not prove** a real remote Meta draft was created or read back.
- Production readiness: [BLOCKED (expected fail-closed)](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40706792088). The log identifies unresolved cadence approval, missing `SONICVHIBEZ_CHANNEL_ID`, missing `media/next-short.mp4`, absent approved metadata/rights evidence and unverified remote history. This failure is not production acceptance and must not be bypassed.

## Acceptance state remains partial

- The authoritative acceptance register currently records **41 PASS, 0 FAIL, 8 BLOCKED_EXTERNAL, 8 NOT_TESTED, 0 NOT_APPLICABLE, 0 SKIPPED**. These counts are register labels, not a claim that the whole application is accepted.
- `DASH-001` remains `NOT_TESTED`: the source register describes a 105-control / 15-form inventory, 38 literal route branches and 35 distinct API method/path routes, but full per-control/per-route success, failure, persistence, concurrency, recovery and accessibility acceptance is incomplete.
- `GIT-002` remains `NOT_TESTED`: isolated baseline success does not replace review of the 1,992 branch-only commits, the two base-only commits, overlapping changes, or the restore-history test incident.
- Cross-process recovery and deployment/rollback drills, the feasible owner-approved cadence, independently verified SonicVhibez channel identity/history, genuine rights-cleared production media and hash-bound human approval remain unresolved.
- The previously documented eight future Metricool Nature Frontiers records were inspected read-only in the earlier 28 October checkpoint. This verification did not re-read or modify those records; do not assume their current provider state without a fresh read.
- No live YouTube upload, Facebook/Instagram post, schedule change, campaign activation or visibility change occurred.

**Verdict: PARTIALLY IMPLEMENTED / PRODUCTION BLOCKED.** Current exact-HEAD automation, content-quality, browser E2E, metadata and isolated-baseline workflows report success, but mandatory acceptance gates remain open.

---

# Latest checkpoint — 28 October 2026, exact source/test candidate

## Live Git state at source/test candidate

- Main HEAD: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Source/test candidate: `03c60617afab051f0aab745d0c1203d0ed788417`
- Implementation branch and PR #1 head at this code checkpoint: `03c60617afab051f0aab745d0c1203d0ed788417`
- Merge base / PR base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Live compare: 1,987 commits ahead, 2 behind, 174 changed files.
- PR #1 remains open, draft and unmerged.

## New repository-controlled acceptance work

- [`ec3decc`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/ec3decc94b0f2d0b8b12efbad7bbdd3170055eda) adds `test/dashboard-api-request-boundaries.test.mjs`: real-server POST /api/jobs tests prove malformed JSON returns 400, unsupported content type returns 415, and a body exceeding 16 KiB returns 413. Each case checks structured JSON, no local state-path disclosure and byte-identical persisted state.
- [`03c6061`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/03c60617afab051f0aab745d0c1203d0ed788417) extends that test with an authorized content-job lifecycle: POST creates one queued job and one audit event, exact duplicate submission returns the same job with `reused=true`, and conflicting content with the same idempotency key returns 409 without a second job or audit event.
- These are real local HTTP integration tests, not mocked handler tests. They are focused slices of acceptance, not full coverage of every route or control.

## Exact-SHA CI for candidate `03c60617afab051f0aab745d0c1203d0ed788417`

- Automation/security: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40705517639) — 404 Node tests passed, 0 failures, 0 skips; 16 Python tests passed; npm audit reported 0 vulnerabilities; FFmpeg installation, syntax and Python compilation checks completed successfully.
- Content quality: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40705517536).
- Metadata validation: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40705517494).
- Dashboard browser E2E: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40705517541) — 15 Chromium journeys passed.
- Isolated main/candidate baseline: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40705517549); retained artifact ID `12823608223`.
- Production readiness: [BLOCKED / fail-closed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40705517519). This is not production acceptance.
- Nature Frontiers draft workflow: [local workflow passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40705517492); no evidence that a remote Meta draft was created or read back.

## Current dashboard acceptance

- Static inventory: 105 controls, 15 forms, 38 literal route branches (10 GET, 28 POST), including 35 distinct API method/path routes.
- Missing-credential sweep: every distinct API method/path returned 401 JSON, did not disclose local paths and did not mutate persisted state.
- Boundary test: malformed JSON 400, unsupported media type 415, body over 16 KiB 413, no state mutation/path disclosure.
- Authorized job integration: one job and one audit event persisted; exact retry reused the same job; conflicting reuse returned 409 and preserved one job/audit event.
- `DASH-001` remains `NOT_TESTED`. Other controls/routes still need authorized success and input validation, failure injection, persistence/audit checks, concurrency/idempotency, restart/recovery, keyboard/focus/accessibility and responsive acceptance.

## Read-only Metricool re-verification

On 28 October 2026, the connected Metricool read-only query still returned the same eight Nature Frontiers future records. All have `autoPublish=true` and `draft=false`. Record IDs and scheduled times are: `406357296` (31 Oct 10:00), `406357335` (4 Nov 10:00), `406357364` (7 Nov 10:00), `406357388` (11 Nov 10:00), `406357414` (14 Nov 10:00), `406357443` (18 Nov 10:00), `406357483` (21 Nov 10:00), and `406357554` (25 Nov 10:00 SAST). The first seven have Facebook as their provider; the last has Facebook and Instagram. All are pending and set to auto-publish. Several include online-business promotions, not wildlife-specific copy. No remote schedule or post was created, edited, paused, cancelled or rescheduled.

## Verdict

**PARTIALLY IMPLEMENTED / PRODUCTION BLOCKED.** New real-server API boundary and content-job idempotency coverage passes on the exact source/test candidate. Dashboard acceptance remains incomplete, and full branch-history review, operational recovery/deployment drills, genuine rights-cleared media and human approval, verified SonicVhibez YouTube identity/history, owner-approved feasible publication cadence, native Related video eligibility, and genuine external Meta draft creation/read-back remain unresolved. Live Metricool records are read-only and require owner review; no changes were made.

---

# Current release evidence — 28 October 2026, 12:36 UTC

## Latest exact source/test candidate

- **Tested source/test candidate:** `3f2b2e27bd04c686d279b293d3019f125a344285`
- **Live main:** `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- **Merge base:** `45352b73bb6cc4787b2a49988b575afb754ab627`
- **Live PR #1 before this evidence refresh:** `cda7af6f6c9eaec9b56c0f2bf8d2fef47a0e91cf`; PR remains open, draft and unmerged. The commits after the source/test candidate are documentation-only.
- **Live divergence at the pre-evidence documentation checkpoint:** 1,982 ahead / 2 behind / 173 changed files. This is not a substitute for the required full commit-by-commit and file-level divergence review.
- **Implementation commit:** [3f2b2e2 — add real-server authentication sweep across every dashboard API route](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/3f2b2e27bd04c686d279b293d3019f125a344285).
- New test `test/dashboard-api-auth-matrix.test.mjs` uses the actual local dashboard server and the current source inventory to call every distinct declared `/api/` method/path without credentials. Every route returned HTTP 401 with the consistent JSON authentication error; the test verified no internal path disclosure and byte-identical persisted state before/after the sweep. This is a narrow authentication guarantee, **not** full route acceptance.

## Exact-SHA CI results

All listed results below target the exact source/test candidate `3f2b2e27bd04c686d279b293d3019f125a344285`:

- Automation/security: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40688995839) — 402 Node tests passed, 0 failures, 0 skips; 16 Python tests passed; locked dependency audit reported 0 vulnerabilities; FFmpeg/ffprobe installation, syntax and Python compilation checks passed.
- Content quality: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40688995821) — 402/402 tests, 0 skips.
- Metadata validation: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40688995870) — 402/402 tests, 0 skips.
- Dashboard browser E2E: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40688995790) — 15 Chromium journeys. This does not cover every control/route.
- Isolated main/candidate baseline: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40688995834) — exact main and candidate checkouts tested in isolation.
- Production readiness: [BLOCKED/fail-closed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40688995898). The expected blocked readiness job is not a passing production gate.
- Nature Frontiers Facebook draft workflow: [local workflow passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40688995785), but it does not prove that an external Meta draft was created or read back.

## Recomputed dashboard inventory and remaining acceptance

Current source inventory: **105 controls, 15 forms, 38 literal route branches (10 GET, 28 POST), including 35 distinct API method/path routes**. The new test covers missing-credential rejection on every API route. `DASH-001` remains `NOT_TESTED`: per-control and per-route authorized success, malformed/boundary inputs, mutation persistence and audit events, idempotency, concurrent requests, dependency failures, restart/recovery, keyboard/focus, accessible announcements and full responsive behavior have not all been demonstrated.

## Live Metricool safety inspection — read-only

The live Nature Frontiers Metricool brand (`brandId=7545638`, timezone `Africa/Johannesburg`) currently has eight future records. **No remote state was changed.** All eight have `autoPublish=true` and `draft=false`:

| Metricool ID | Scheduled (SAST) | Destinations | Mode |
|---|---|---|---|
| `406357296` | 2026-10-31 10:00 | Facebook | Auto-publish enabled |
| `406357335` | 2026-11-04 10:00 | Facebook | Auto-publish enabled |
| `406357364` | 2026-11-07 10:00 | Facebook | Auto-publish enabled |
| `406357388` | 2026-11-11 10:00 | Facebook | Auto-publish enabled |
| `406357414` | 2026-11-14 10:00 | Facebook | Auto-publish enabled |
| `406357443` | 2026-11-18 10:00 | Facebook | Auto-publish enabled |
| `406357483` | 2026-11-21 10:00 | Facebook | Auto-publish enabled |
| `406357554` | 2026-11-25 10:00 | Facebook and Instagram | Auto-publish enabled |

The scheduled copy includes a mixture of wildlife-creator resources and online-business/digital-product promotions. Do not cancel, pause, edit, or activate anything without the owner explicitly deciding which individual records should remain active. If any change is authorized, re-read the provider and verify the new state. The prior published Facebook record is not changed by this inspection.

## Safety and release verdict

- `main` untouched; PR #1 remains open, draft and unmerged.
- No YouTube upload, visibility change, Meta post, campaign activation, schedule change, purchase, or website production change occurred.
- Nature Frontiers is not an allowed YouTube target. Public/unattended YouTube publishing and live Meta publishing remain disabled in repository policy; Safari remains inactive; the approved wildlife-creator Selar destination remains `https://selar.com/0u19v8u99l`.
- **Verdict: IMPLEMENTATION INCOMPLETE / PRODUCTION BLOCKED.** The new auth-sweep test and exact-SHA CI are positive progress, but dashboard acceptance, deeper operational recovery/deployment drills, full Git divergence review, genuine rights-cleared production media and human approval, verified SonicVhibez YouTube identity/history, native Related-video eligibility, genuine Meta draft creation/read-back, and the owner's decision on the eight live Metricool schedules remain unresolved.

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


## Latest exact source/test checkpoint — 28 October 2026

- **Tested source/test SHA:** `4d003f320df0f1d26c5b46dcb2a0c545cfec785c`. Application implementation change: `290888193caa2b64b1f5c3f3497176175ecdc2b7`; regression/test fixture change: `4d003f320df0f1d26c5b46dcb2a0c545cfec785c`.
- **Dashboard API request parsing:** `scripts/dashboard-server.mjs` now requires `application/json` (including optional media-type parameters) for body-bearing API handlers, rejects unsupported media types with HTTP 415, and drains rejected request bodies. `test/dashboard-server.test.mjs` covers a JSON-looking body sent as `text/plain`, the 415 response and safe error text.
- **Restore failure-injection test determinism:** `test/backup-restore.test.mjs` sets the pre-restore dashboard-state mtime explicitly before the backup timestamp in the rollback test fixture. This preserves the production stale-state guard and ensures the test reaches the intended later-rename failure/rollback path.
- **Exact-candidate automation/security:** [run 40673471424](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471424) PASS — 401 Node tests, 0 failures, 0 skips; 16 Python tests passed; npm audit reported 0 vulnerabilities; FFmpeg/ffprobe 6.1.1 installed.
- **Content quality:** [run 40673471379](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471379) PASS — 401/401 Node tests, zero skips.
- **Metadata:** [run 40673471565](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471565) PASS — 401/401 Node tests, zero skips.
- **Dashboard Chromium E2E:** [run 40673471427](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471427) PASS — 15 browser journeys. This is not exhaustive per-control/per-route acceptance.
- **Isolated baseline:** [run 40673471350](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471350) PASS on exact candidate; main and candidate Node/Python commands exited 0. Artifact [12809417525](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471350/artifacts/12809417525), ZIP SHA-256 `7c46f5156967ef944b8a602e47cc8bbd6e31e7608c6600cd5a9f898a040a7371`.
- **Production readiness:** [run 40673471449](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471449) remains BLOCKED/fail-closed. **Meta draft workflow:** [run 40673471614](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40673471614) passed local validation; external draft creation was skipped. Neither result is external integration acceptance.
- Live comparison at this checkpoint: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; 1,962 ahead / 2 behind / 172 changed files. PR #1 remains open, draft and unmerged. The full divergence review is still incomplete.
- Production remains **NOT READY**. Exhaustive dashboard/API acceptance, full branch-history reconciliation, operational crash/deployment drills, genuine production media/rights/human approval, verified YouTube/Meta identities and remote operations, owner-approved cadence, native Short-parent eligibility, and the live Metricool scheduled-post decision remain unresolved.
- Safety unchanged: `main` untouched; no merge, upload, post, visibility change or campaign activation; public/unattended YouTube and live Meta publishing remain disabled; Nature Frontiers remains prohibited as a YouTube target; Safari inactive; approved Selar destination unchanged.
