# Dashboard wiring acceptance checkpoint — 30 October 2026

## Exact source/test candidate

- Exact tested candidate: `e8353daa3f786a0afbf74374d85bcce2e649d5e2`.
- Latest application implementation remains the previously tested restore-directory durability change; this checkpoint adds a dashboard acceptance regression test and does not change production application behavior.
- Added `test/dashboard-inventory.test.mjs` coverage proving that 15 dashboard forms have explicit submit handlers, each handler's first API call references a declared dashboard route, and all 87 non-submit controls have stable IDs and JavaScript bindings.
- The earlier commit `9c13352a9eb60205edbc29789c000102038c65c4` initially failed CI because the new test contained incorrectly escaped regular expressions. The failure was retrieved from the GitHub Actions job log, corrected in `8c556f601a9fef3fccae5b815d4079d91b30b78a`, and corrected again for proper assertion-source escaping in `e8353daa3f786a0afbf74374d85bcce2e649d5e2`.
- Exact-candidate automation/security [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41123147688): 431 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; syntax and compile checks passed.
- Exact-candidate dashboard browser E2E [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41123147615): 15 Chromium journeys passed.
- Exact-candidate content quality [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41123147543). Metadata [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41123147789).
- Isolated baseline [pending at time of this checkpoint](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41123147512); lockfile workflow [pending at time of this checkpoint](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41123142447).
- Production readiness remains [BLOCKED/fail-closed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41123147712) by 13 genuine prerequisites.
- **DASH-001 remains NOT_TESTED.** This static form/control wiring test does not prove successful operation, valid/invalid payload behavior, state persistence, authorization for each route, duplicate/concurrent request handling, error feedback or full user journeys. The 15 browser tests are useful but not exhaustive.
- Live refs at this checkpoint: PR #1 head `e8353daa3f786a0afbf74374d85bcce2e649d5e2`; `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; compare 2,187 ahead / 2 behind / 182 changed files. PR remains open, draft and unmerged. No main edit, merge, rebase, reset, force-push or destructive reconciliation.
- No local Codex checkout or local test execution is claimed; verification is from GitHub Actions. Remote GitHub integration accepted the branch commits.

## Next DASH-001 implementation target

Add operation-level browser/API acceptance for the 15 forms, starting with the remaining production authoring, script review, narration generation/review, production-plan review, produce, validation, rights verification, human review and upload reconciliation paths. Use isolated test jobs and fixture artifacts. For each, prove authorized success where the safe local path exists, invalid/missing payload rejection, no false success on server errors, state/audit persistence, and reload/read-back. Preserve all private-upload and no-live-publishing gates. Extend control-specific behavior journeys after forms; do not treat a generic handler check as acceptance.

---

# Latest all-commit-boundary restore recovery verification — 30 October 2026

## Current exact source/test candidate and live refs

- Exact tested source/test candidate: `dbd65dabcc75e993ae73a9e401cf3f471e860f70`.
- PR #1 was open, draft and unmerged at the tested candidate; this evidence update is a documentation-only descendant.
- Implementation branch: `codex/marketing-machine-audit-fixes`.
- Live `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`; compare: **2,181 ahead / 2 behind / 182 changed files**.
- Connected GitHub integration reports admin permission and accepted fast-forward commits on the implementation branch. No local checkout was attached; no local write probe or local test execution is claimed. GitHub Actions ran the exact candidate tests.

## Implementation and crash-recovery tests

- [`deefa1d83097a298bd39c2eeb04f5aa29ffd4774`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/deefa1d83097a298bd39c2eeb04f5aa29ffd4774) flushes destination directories after restore commits, rollback replacements and recovery deletions, and flushes the journal directory after journal removal.
- [`29537d71411d227a6da01f980671d72c4a9a4f2e`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/29537d71411d227a6da01f980671d72c4a9a4f2e) verifies destination directory flush ordering before journal removal.
- [`3d863ffb46c492169e4b516bf1325bc5c328d71e`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/3d863ffb46c492169e4b516bf1325bc5c328d71e) injects directory-fsync `EIO` after a destination rename and verifies safe rollback, journal cleanup and lock release.
- [`109b92f0c8b3dc894a6f360b99131fa6c0fffac3`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/109b92f0c8b3dc894a6f360b99131fa6c0fffac3) makes directory-fsync-specific assertions Windows-aware; those assertions skip on Windows because Node does not expose a portable directory-fsync API.
- [`bdfe264004ffc5451b0bae3ed66d7646a75bcdee`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/bdfe264004ffc5451b0bae3ed66d7646a75bcdee) adds child-process termination at each destination-commit boundary.
- [`dbd65dabcc75e993ae73a9e401cf3f471e860f70`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/dbd65dabcc75e993ae73a9e401cf3f471e860f70) extends that boundary matrix to cover an existing dashboard-state replacement and all missing-file destinations. Recovery verifies exact original dashboard bytes, absence of partial restored files, staged-temp cleanup, journal removal and lock release.
- Existing `test/restore-facebook-draft-history.test.mjs` remains present and was not deleted or recreated.

## Exact-candidate CI — `dbd65dabcc75e993ae73a9e401cf3f471e860f70`

| Workflow | Result | Evidence |
|---|---|---|
| Automation/security | **PASS** — 430 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, JavaScript syntax and Python compilation passed | [Run 41119869020](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119869020) |
| Content quality | **PASS** — 430 tests, 0 failures, 0 skips | [Run 41119869159](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119869159) |
| Metadata validation | **PASS** — 430 tests, 0 failures, 0 skips; unreviewed metadata remains fail-closed | [Run 41119869249](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119869249) |
| Dashboard browser E2E | **PASS** — 15 Chromium journeys; not exhaustive per-control acceptance | [Run 41119869047](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119869047) |
| Isolated main/candidate baseline | **PASS** — exact main and candidate Node/Python test commands exited 0 | [Run 41119869134](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119869134) |
| Non-destructive branch inventory | **PASS** — inventory only; human semantic review remains incomplete | [Run 41119869074](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119869074) |
| Nature Frontiers local draft package | **PASS for local validation only** — provider-side create/read-back skipped | [Run 41119869265](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119869265) |
| Production readiness | **BLOCKED as designed** — fail-closed with 13 prerequisites; not a test-suite failure or production acceptance | [Run 41119869264](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119869264) |

## Acceptance and external safety

- Acceptance register remains **54 PASS / 8 NOT_TESTED / 8 BLOCKED_EXTERNAL** (70 requirements).
- `STATE-001` remains **NOT_TESTED**. The test suite now covers process termination after every destination-commit boundary for a fixture containing both a dashboard-state replacement and missing destinations. True power-loss/disk-full tests, full cross-process idempotency, deployment rollback and ambiguous external-side-effect reconciliation remain outstanding.
- `DASH-001` remains NOT_TESTED: 15 Chromium journeys do not prove all 105 controls, 15 forms and 38 routes.
- Production readiness remains blocked by 13 prerequisites, including external account identity/history, genuine rights-backed media, owner approvals and deployment requirements.
- Read-only Metricool recheck on 30 October confirms eight future Nature Frontiers promotional schedules remain `draft=false` and `autoPublish=true`; the first is due 31 October 2026 at 10:00 SAST. No remote record was changed.
- No live YouTube upload, Meta post, campaign activation, Metricool mutation, merge or `main` edit occurred.

## Verdict

**PARTIALLY COMPLETE — RESTORE DURABILITY AND ALL DESTINATION-COMMIT RECOVERY BOUNDARIES VERIFIED IN CI; REMAINING ENGINEERING AND EXTERNAL ACCEPTANCE GAPS ARE OPEN.**

---

# Latest restore fsync failure-recovery verification — 30 October 2026

## Current exact source/test candidate and live refs

- Exact tested source/test candidate: `109b92f0c8b3dc894a6f360b99131fa6c0fffac3`.
- Current PR #1 HEAD before this evidence refresh: `3f9a1f7bf5678745c9c63e7baf5e5a8d601527ef` (documentation-only descendant); PR remains open, draft and unmerged.
- Implementation branch: `codex/marketing-machine-audit-fixes`.
- Live `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`; live compare: **2,177 ahead / 2 behind / 182 changed files**.
- Connected GitHub integration reports admin permission and successfully created fast-forward commits on the existing implementation branch. No local checkout was attached, so no local write probe or local test execution is claimed; GitHub Actions ran the tests against the exact candidate SHA.

## Additional implementation and regression coverage

- [`deefa1d83097a298bd39c2eeb04f5aa29ffd4774`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/deefa1d83097a298bd39c2eeb04f5aa29ffd4774) flushes destination directories after restore commits, rollback renames and recovery deletions, and flushes the journal directory after journal removal.
- [`29537d71411d227a6da01f980671d72c4a9a4f2e`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/29537d71411d227a6da01f980671d72c4a9a4f2e) adds ordering coverage: every committed destination directory is flushed before journal removal, then the journal directory is flushed after deletion.
- [`3d863ffb46c492169e4b516bf1325bc5c328d71e`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/3d863ffb46c492169e4b516bf1325bc5c328d71e) injects a directory-fsync `EIO` after a destination rename and verifies rollback, journal cleanup and lock release.
- [`109b92f0c8b3dc894a6f360b99131fa6c0fffac3`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/109b92f0c8b3dc894a6f360b99131fa6c0fffac3) makes the directory-fsync-specific assertions skip on Windows, where Node does not expose a portable directory-fsync API. Linux CI executes both tests; the suite reports zero skips.
- Existing `test/restore-facebook-draft-history.test.mjs` remains present and unchanged by this work.

## Exact-candidate CI — `109b92f0c8b3dc894a6f360b99131fa6c0fffac3`

| Workflow | Result | Evidence |
|---|---|---|
| Automation/security | **PASS** — 429 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, syntax and Python compilation passed | [Run 41119180464](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119180464) |
| Content quality | **PASS** — 429 tests, 0 failures, 0 skips | [Run 41119180492](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119180492) |
| Metadata validation | **PASS** — 429 tests, 0 failures, 0 skips; unreviewed metadata remains fail-closed | [Run 41119180567](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119180567) |
| Dashboard browser E2E | **PASS** — 15 Chromium journeys; not exhaustive per-control acceptance | [Run 41119180565](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119180565) |
| Isolated main/candidate baseline | **PASS** — exact main and candidate checkouts | [Run 41119180598](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119180598) |
| Non-destructive branch inventory | **PASS** — inventory only; semantic history review remains incomplete | [Run 41119180487](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119180487) |
| Nature Frontiers local draft package | **PASS for local validation only** — provider-side create/read-back skipped | [Run 41119180437](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119180437) |
| Production readiness | **BLOCKED as designed** — fail-closed with 13 prerequisites; not a test-suite failure or production acceptance | [Run 41119180384](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41119180384) |

## Acceptance and external safety

- The single acceptance register remains **54 PASS / 8 NOT_TESTED / 8 BLOCKED_EXTERNAL** (70 requirements).
- `STATE-001` remains **NOT_TESTED**: the new directory durability and injected-failure paths pass, but complete kill/restart at every transaction boundary, true power-loss/disk-full testing, all cross-process idempotency, deployment rollback and ambiguous remote-side-effect recovery remain outstanding.
- `DASH-001` remains NOT_TESTED: 15 Chromium journeys do not close behavior acceptance for all 105 controls, 15 forms and 38 routes.
- Production readiness remains blocked by 13 prerequisites, including owner/account/media/rights/history/approval and deployment requirements.
- Read-only Metricool recheck on 30 October confirms eight future Nature Frontiers promotional schedules remain `draft=false` and `autoPublish=true`; the first is due 31 October 2026 at 10:00 SAST. No remote record was edited, paused, cancelled or rescheduled. Owner action is required.
- No live YouTube upload, Meta post, campaign activation, Metricool mutation, merge or `main` edit occurred.

## Verdict

**PARTIALLY COMPLETE — TARGETED RESTORE DURABILITY DEFECT FIXED AND EXACT-CANDIDATE CI PASSED; APPLICATION AND PRODUCTION ACCEPTANCE REMAIN OPEN.**

---

# Latest restore durability implementation and exact-SHA acceptance — 30 October 2026

## Live Git state and workspace method

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Implementation branch: `codex/marketing-machine-audit-fixes`
- PR #1: open, draft and unmerged; base `main`; implementation candidate `29537d71411d227a6da01f980671d72c4a9a4f2e`.
- Live `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; comparison after the implementation commits: **2,173 ahead / 2 behind / 182 changed files**.
- The connected GitHub repository integration reported repository permission `admin` and accepted fast-forward commits on the implementation branch. No local repository checkout was attached, so no local write probe or local test execution is claimed. Tests below ran in GitHub Actions against the exact candidate SHA.
- No `main` edit, merge, rebase, reset, force-push, branch deletion, live YouTube upload, live Meta post, campaign activation or Metricool mutation occurred.

## Implementation commits

- [`deefa1d83097a298bd39c2eeb04f5aa29ffd4774`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/deefa1d83097a298bd39c2eeb04f5aa29ffd4774) — restore destination-directory durability.
  - After each committed destination rename, flush the containing directory before proceeding.
  - Flush the destination directory after rollback replacement renames and recovery deletion of a newly restored file.
  - Flush the state directory after removing the interrupted-restore journal during recovery or successful completion.
  - Propagate real directory-sync I/O errors so the durable journal remains the recovery authority; tolerate explicitly unsupported directory fsync cases and Windows' lack of portable Node directory fsync.
- [`29537d71411d227a6da01f980671d72c4a9a4f2e`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/29537d71411d227a6da01f980671d72c4a9a4f2e) — add a regression test that observes destination renames, directory fsync ordering, journal deletion and final journal-directory fsync.
- The existing `test/restore-facebook-draft-history.test.mjs` remains present on the branch; it was not deleted or recreated.

## Exact-candidate CI for `29537d71411d227a6da01f980671d72c4a9a4f2e`

| Workflow | Result | Evidence |
|---|---|---|
| Automation/security | **PASS** — 428 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, JS syntax and Python compilation passed | [Run 41118119408](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41118119408) |
| New restore durability regression | **PASS** — explicit test output confirms the directory-flush ordering test passed | [Automation log](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41118119408) |
| Content quality | **PASS** — 428 tests, 0 failures, 0 skips | [Run 41118119355](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41118119355) |
| Metadata validation | **PASS** — 428 tests, 0 failures, 0 skips; unreviewed metadata remains fail-closed | [Run 41118119534](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41118119534) |
| Dashboard browser E2E | **PASS** — 15 Chromium journeys; not exhaustive per-control acceptance | [Run 41118119353](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41118119353) |
| Isolated main/candidate baseline | **PASS** — exact main and candidate checkouts | [Run 41118119318](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41118119318) |
| Non-destructive branch inventory | **PASS** — inventory only; not a human semantic merge review | [Run 41118119397](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41118119397) |
| Nature Frontiers local draft package | **PASS for local validation only** — provider-side create/read-back was skipped | [Run 41118119335](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41118119335) |
| Production readiness | **BLOCKED as designed** — fail-closed with 13 prerequisites; not a test-suite pass or production acceptance | [Run 41118119384](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41118119384) |

## Acceptance status

- Register counts remain **54 PASS / 8 NOT_TESTED / 8 BLOCKED_EXTERNAL** (70 requirements).
- `STATE-001` remains **NOT_TESTED**. This change closes the directory-entry durability ordering gap, but does not complete kill/restart at every transaction boundary, power-loss and disk-full drills, all cross-process idempotency, deployment rollback, or ambiguous external side-effect reconciliation.
- `DASH-001` remains NOT_TESTED: 15 Chromium journeys do not provide per-control acceptance for all 105 controls, 15 forms and 38 routes.
- `SCHED-001`, `SHORT-PARENT-001`, `SCRIPT-PROMPT-001`, `RENDER-MULTISCENE-001` and `DEPLOY-001` remain NOT_TESTED for the previously recorded operational/evidence reasons.
- External YouTube identity/history/media/approval, owner-approved cadence, Meta identity/provider-side draft acceptance, native Short Related-video eligibility and branch protection remain unresolved.

## Read-only Metricool safety recheck — 30 October 2026

The connected Metricool read-only integration returned only the Nature Frontiers brand (ID `7545638`) with timezone `Africa/Johannesburg`. All eight future promotional records remain scheduled with `draft=false` and `autoPublish=true`:

- `406357296` — 31 October 2026, 10:00 SAST, Facebook.
- `406357335` — 4 November 2026, 10:00 SAST, Facebook.
- `406357364` — 7 November 2026, 10:00 SAST, Facebook.
- `406357388` — 11 November 2026, 10:00 SAST, Facebook.
- `406357414` — 14 November 2026, 10:00 SAST, Facebook.
- `406357443` — 18 November 2026, 10:00 SAST, Facebook.
- `406357483` — 21 November 2026, 10:00 SAST, Facebook.
- `406357554` — 25 November 2026, 10:00 SAST, Facebook and Instagram.

The scheduled copy contains commercial/affiliate product promotion and Selar destinations. The first record is due **tomorrow, 31 October at 10:00 SAST**. No remote record was edited, paused, cancelled or rescheduled. Owner must decide what to do with each existing scheduled record; do not infer authorization from the code guard, which only protects newly generated repository content.

## Release verdict

**APPLICATION IMPLEMENTATION PARTIAL / PRODUCTION NOT READY.** The restore directory durability change and regression test passed exact-candidate CI. The acceptance register correctly retains unresolved engineering and external requirements. No live publication, account activation, remote schedule mutation, merge or main-branch change occurred.

---

# Latest exact-SHA implementation update — 30 October 2026

## Live refs and implementation

- PR #1 is OPEN, DRAFT and UNMERGED.
- Exact tested source/test SHA before this evidence-only update: `ab9416146adcd05a17f571b2cc7889dccac0c280`.
- Two focused commits added:
  - `0e4e6044840a5b62def1025799f452e71988d13a` — Nature Frontiers promotion guard scans the public `firstCommentText` as well as the caption, extracts URLs from both, and blocks Selar/Safari links or affiliate/promotional language hidden in the first comment. Policy version: `nf-facebook-autonomous-policy-2026-10-v3`.
  - `ab9416146adcd05a17f571b2cc7889dccac0c280` — regression test proves a neutral caption cannot move a prohibited Selar URL or affiliate disclosure into the public first comment; changing the first comment changes the approval fingerprint.
- The fingerprint includes `firstCommentText` only when the property is present, preserving legacy fingerprints for old payloads that do not contain the field.
- Live compare at the tested source/test SHA: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, **2,170 ahead / 2 behind / 182 changed files**. This is a live API compare snapshot, not human semantic approval to merge.

## Exact-SHA CI — source/test SHA ab9416146adcd05a17f571b2cc7889dccac0c280

- Automation/security [41024489463](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489463): **427 Node tests passed, 0 failures, 0 skips; 16 Python unit tests passed; npm audit 0 vulnerabilities; FFmpeg/ffprobe integration, syntax and Python compilation steps passed.**
- Content quality [41024489659](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489659): **427 tests passed, 0 failures, 0 skips.**
- Metadata validation [41024489440](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489440): **427 tests passed, 0 failures, 0 skips.** Its negative-path checks intentionally report that unreviewed asset metadata is BLOCKED.
- Dashboard browser E2E [41024489446](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489446): **15 Chromium journeys passed.**
- Isolated main/candidate baseline [41024489845](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489845): **PASS** for both exact checkouts.
- Non-destructive branch inventory [41024489462](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489462): **PASS**; inventory is not a semantic merge review.
- Nature Frontiers local draft-package validation [41024489472](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489472): **PASS for local deterministic validation only**; the external provider-create/read-back job was skipped.
- Production readiness [41024489515](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41024489515): **BLOCKED / fail-closed**, with the existing 13 prerequisites. This is not a code-test failure and is not production acceptance.

## Metricool and destination verification

- Metricool read-only brand list exposes only Nature Frontiers, brand ID `7545638`; it does not expose a distinct SonicVhibez/Sonic Fire brand.
- Metricool's configured YouTube channel ID is `UCSlkuPfHH78oGC1o418HV4w` (24 characters). The previously supplied SonicVhibez channel URL contains `UCSlkuPfHH78oC1o418HV4w` (23 characters). They are not equal. The connected destination must not be selected until the owner confirms the correct channel identity.
- Eight upcoming Nature Frontiers Facebook/Instagram promotional posts remain configured with `draft=false` and `autoPublish=true`: `406357296` (31 Oct 10:00 SAST), `406357335` (4 Nov 10:00), `406357364` (7 Nov 10:00), `406357388` (11 Nov 10:00), `406357414` (14 Nov 10:00), `406357443` (18 Nov 10:00), `406357483` (21 Nov 10:00), and `406357554` (25 Nov 10:00; Facebook and Instagram). No existing remote post was changed, cancelled or rescheduled. The repository guard does not alter provider-side queue records.
- The Metricool YouTube published-in-range connector returned one public video in the inspected 12-month period: `LjePS02hA1o`, title “How to make wildlife videos people actually watch #wildlife #filmmaking #shorts”, raw timestamp `20261022150556` without timezone metadata. At 30 Oct 2026 10:04:53 SAST, the known-public-video gap is **186h 58m 57s** if that timestamp is SAST or **184h 58m 57s** if it is UTC. Both exceed 72 hours, but private/unlisted history and uncertain upload attempts are not available and the timestamp timezone is ambiguous; the complete spacing check remains **UNVERIFIED**. No YouTube post was scheduled.
- HeyGen account read reports the Free plan and null/unavailable remaining-credit counters. The latest failed generation returned `MOVIO_PAYMENT_INSUFFICIENT_CREDIT`; completed library items inspected were 20.4016s, 22.3085s, 24.32s and 48.7967s. No new video was generated and no quota/payment was bypassed.
- All three supplied Selar pages were inaccessible to the available web reader. Seller identity, exact product contents and whether the link is affiliate, paid or owner-operated remain unverified. Do not publish promotional copy until the relationship is confirmed and the accurate disclosure is supplied.

## Release verdict

**NOT PRODUCTION READY.** Public/unattended YouTube publishing remains disabled; no live upload, schedule, Meta post, campaign activation, visibility change, merge, main-branch edit, rebase, reset, force-push or destructive reconciliation occurred. Nature Frontiers remains prohibited as a YouTube destination. The owner-controlled YouTube identity/history, genuine rights-backed media and human review, per-operation private-upload authorization, owner-approved feasible cadence, Meta identity/draft acceptance, branch protection and full semantic branch review remain unresolved.

---

# Current release evidence — 30 October 2026

## Latest live checkpoint — 30 October 2026, 09:36 SAST

- Repository: clickerrish-art/YT-AUTO-VISE
- Implementation branch: codex/marketing-machine-audit-fixes
- Current PR #1 HEAD at this snapshot: ef3eadd005a811f9596e1cc12fa58beaf4770a03 (documentation-only descendant). Exact tested application/source candidate: b31149df440a4c02cb2d7541b4894dcd916b8796.
- PR #1 remains open, draft and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- Live main: fa00d28e7f58911482686e4ad69fac9f4701a2e6
- Merge base: 45352b73bb6cc4787b2a49988b575afb754ab627
- Compare at this snapshot: 2,167 ahead / 2 behind / 182 changed files
- No main edit, merge, rebase, reset, force-push, destructive reconciliation, live upload, public post or Metricool mutation occurred.

## Documentation-head workflow verification

The current PR HEAD ef3eadd005a811f9596e1cc12fa58beaf4770a03 is documentation-only after tested application/test candidate b31149df440a4c02cb2d7541b4894dcd916b8796. Its automation/security, content quality, metadata, 15 Chromium browser journeys, isolated baseline, non-destructive branch inventory and local Nature Frontiers draft-package validation all passed: runs 41023127603, 41023127627, 41023127609, 41023127570, 41023127566, 41023127689 and 41023127592. The external Meta draft-creation step was skipped. Production readiness remains blocked at run 41023127637 with 13 blockers. GitHub branch metadata reports protected=false; owner/admin must configure branch protection and required checks.

## Current implementation change

Commit 798d507dbb6188ac9df555c1300507c2f6b3815a adds a fail-closed product-promotion guard to the Nature Frontiers Facebook draft evaluator and final-payload policy. It rejects commercial flags, non-empty campaign IDs, Selar/Safari storefront links, affiliate/sponsor/advertising language, purchase/download CTAs and the three supplied Selar product names. Selar/Safari destinations are no longer eligible outbound destinations for Nature Frontiers social posts. The policy versions were bumped to v2 and the local configuration documents the education-only rule.

Follow-up commit b31149df440a4c02cb2d7541b4894dcd916b8796 adds explicit regression coverage for the exact Complete YouTube Wildlife Creator's Vault name, including its apostrophe, and the three supplied Selar URLs. This guard protects repository-generated Nature Frontiers Facebook/Instagram content; it does not alter existing Metricool schedules or provide enforcement for unconnected Pinterest/TikTok APIs.

## Exact-HEAD CI evidence for b31149df440a4c02cb2d7541b4894dcd916b8796

| Workflow | Result | Run |
|---|---|---|
| Automation/security | PASS: 426 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592775 |
| Content quality | PASS: 426 tests, 0 failures, 0 skips | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592787 |
| Metadata validation | PASS: 426 tests, 0 failures, 0 skips | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592837 |
| Dashboard browser E2E | PASS: 15 Chromium journeys | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592840 |
| Isolated main/candidate baseline | PASS | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592897 |
| Non-destructive branch inventory | PASS; retained artifact 12961912400 | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592859 |
| Nature Frontiers local draft package | PASS for local validation only; provider creation job skipped | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592805 |
| Production readiness | BLOCKED by 13 prerequisites; fail-closed result is expected | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41022592898 |

The production-readiness run identifies the owner-controlled cadence decision, complete remote YouTube history and uncertain-attempt reconciliation, real rights-backed manifests, human review, verified channel identity, missing final MP4, and secure OAuth/channel configuration as blockers. It never uploads, schedules or publishes.

## Live Metricool and YouTube destination inspection

Metricool exposes only Nature Frontiers brand 7545638. Its YouTubeData channel ID is UCSlkuPfHH78oGC1o418HV4w. A 5-credit VidIQ channel lookup resolves this ID to the channel title SonicVibes; it does not establish the exact SonicVhibez/Sonic Fire identity. The earlier user-supplied channel ID differs and is 23 characters. Destination identity therefore remains unverified and must not be used for publishing.

Eight upcoming Nature Frontiers Facebook/Instagram product-promotion posts remain draft=false and autoPublish=true: 406357296 (31 Oct 10:00 SAST), 406357335 (4 Nov 10:00), 406357364 (7 Nov 10:00), 406357388 (11 Nov 10:00), 406357414 (14 Nov 10:00), 406357443 (18 Nov 10:00), 406357483 (21 Nov 10:00), and 406357554 (25 Nov 10:00; Facebook and Instagram). No remote record was modified, cancelled or rescheduled. The new code guard does not retroactively change these provider-side posts.

Metricool returned one public YouTube video in the inspected 12-month range: LjePS02hA1o, raw timestamp 20261022150556, with no timezone included in the metric response. If UTC, the timestamp is 22 Oct 17:05:56 SAST and the gap to 30 Oct 09:36:58 SAST is 184h 31m 02s. If already SAST, the gap is 186h 31m 02s. Both exceed 72 hours, but complete private/unlisted history and uncertain attempts were not available and timezone interpretation is ambiguous. Full spacing verification remains UNVERIFIED; no YouTube schedule was created.

## Media and product verification

HeyGen library lookup found completed videos of 20.4016s, 22.3085s, 24.32s and 48.7967s. None is the new approximately 55-second YouTube-hook script. The latest listed render attempt failed with MOVIO_PAYMENT_INSUFFICIENT_CREDIT. No render was started in this run and no paid quota was bypassed.

The three supplied Selar product URLs could not be opened by the available web reader. Product-page seller details, current contents, price and the actual own-product/affiliate/paid-placement relationship remain unverified. A disclosure must be finalized accurately before upload. No product facts or prices are inferred.

## Verdict

**NOT PRODUCTION READY.** Exact-HEAD CI is green for code/test checks, but 13 production prerequisites, exhaustive dashboard/API acceptance, complete recovery/deployment drills, human branch-history review, destination identity, real media and external provider acceptance remain open. Public/unattended YouTube publishing remains disabled.
## Changes since the earlier documented source/test candidate

A live compare from earlier candidate `75ef3a5ee5c3eb41f1edec106d65145b219d737c` to tested candidate `115fe82252b4fa1ef1eb2f9587bf0653356a6dc9` reports 14 commits ahead, 0 behind and nine changed files:

- `scripts/human-review.mjs`
- `test/human-review.test.mjs`
- `test/dashboard-api-auth-matrix.test.mjs`
- `docs/BRANCH_RECONCILIATION_REPORT_2026-10-28.md`
- `docs/CURRENT_RELEASE_EVIDENCE_2026-10-29.md`
- `docs/DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.md`
- `docs/GO_LIVE_BLOCKERS.md`
- `docs/RELEASE_GATE_CHECKLIST.md`
- `docs/REQUIREMENTS_ACCEPTANCE_REGISTER.json`

The source change hardens review-receipt timestamp validation; the associated tests add invalid-timestamp and API authentication-matrix coverage. The subsequent five commits from the tested candidate to the live PR HEAD update documentation only. No assertion is made that every intervening commit has received a separate semantic review.

## Acceptance register snapshot

The live machine-readable register contains 69 requirements:

- PASS: 53
- NOT_TESTED: 8
- BLOCKED_EXTERNAL: 8

The aggregate is not 100% acceptance. In particular:

- DASH-001 remains NOT_TESTED: exhaustive behavior-specific acceptance for every dashboard control, form and API route is not complete. The static inventory is 105 controls, 15 forms and 38 literal routes (10 GET, 28 POST); this is inventory, not functional acceptance.
- STATE-001 remains NOT_TESTED: controlled process termination coverage exists, but all transaction boundaries, true power-loss durability and production-like recovery/rollback are not accepted.
- SCHED-001 remains NOT_TESTED: full queue/history, worker-overlap, restart and operational schedule acceptance is incomplete.
- GIT-002 remains NOT_TESTED: the large branch divergence still needs human semantic review, including both main-only commits and the historical restore-test incident.
- DEPLOY-001 remains NOT_TESTED: clean isolated installation, monitoring, backup/restore and deployment rollback have not been operationally accepted.
- SHORT-PARENT-001 and SCRIPT-PROMPT-001 remain NOT_TESTED.
- YT-001, YT-002, YT-003, FB-001, SEC-001, SCHED-003, YOUTUBE-RELATED-001 and META-REMOTE-SCHEDULED-001 remain BLOCKED_EXTERNAL.

## Safety and external boundaries

- YouTube target remains SonicVhibez only. Nature Frontiers must never be used as a YouTube destination.
- Public and unattended YouTube publishing remain disabled. No upload or visibility change was performed.
- The documented channel ID discrepancy must be resolved through authenticated account/API verification; do not guess or silently correct it.
- No provider-side Meta draft creation/read-back is proven. Live Facebook and Instagram publishing remain disabled; `publishingEnabled=false`, `dryRun=true`, `emergencyStop=true`, and `FACEBOOK_PUBLISH_ENABLED=NO` remain required.
- No campaign activation or Metricool schedule mutation was performed. The eight recorded future Nature Frontiers schedule records require individual owner decisions before any change.
- Owner-approved cadence, genuine rights-cleared production media, human review, provider identities/permissions, authorized private-upload evidence and native YouTube Related-video evidence remain outstanding.
- Branch protection/required checks must be verified and enabled by the repository owner/admin; connector access did not provide authoritative confirmation in this session.

## Branch reconciliation

The latest retained full-history inventory is for an earlier branch snapshot, not the live HEAD in this report. It identified 2,109 branch-only commits, 2 main-only commits and 178 final-tree changed files for its own recorded snapshot. The two main-only commits are the historical test-file addition and explicit revert. Both `test/restore-facebook-draft-history.test.mjs` and `tests/restore-state.test.mjs` are present on the current implementation branch.

The inventory artifact and report are evidence for a human review, not integration approval. A new inventory and full semantic review against the current live HEAD are still required. Do not reconcile destructively.

## Verdict

**NOT PRODUCTION READY.** The exact tested candidate has passing automated checks, but critical repository-controlled acceptance and genuine owner/provider gates remain open. No 100% completion claim is justified.


## Subsequent documentation-only branch refresh — 30 October 2026

After the evidence above was written, the existing project audit/report, go-live blockers, release checklist, acceptance register and operations runbook were refreshed, and `docs/BRANCH_RECONCILIATION_REPORT_2026-10-30.md` was added. The live PR HEAD at this later read was `7bb46f0167f145134e927ae32798a19432f66107`; PR #1 remained open, draft and unmerged. Live compare at that read: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 2,162 ahead / 2 behind / 182 changed files. These are documentation-only commits after tested source/test candidate `115fe82252b4fa1ef1eb2f9587bf0653356a6dc9`; they do not constitute a new application-code test run.

Fresh PR workflows triggered for `7bb46f0167f145134e927ae32798a19432f66107` were still queued/in progress at the time of the last status read: automation/security run 40977628344; content quality 40977628347; metadata 40977628324; dashboard E2E 40977628382; isolated baseline 40977628350; branch inventory 40977628363; local Facebook draft package 40977628346; production readiness 40977628341. No conclusion is claimed for these pending runs.


## Dashboard API behavior-test expansion — 30 October 2026

The exact source/test candidate for the dashboard API test expansion is `a3b57ebddd96b28fe0bef5233eb0c87be152bf48` ([commit](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/a3b57ebddd96b28fe0bef5233eb0c87be152bf48)); a preceding test-only commit is [9e73447](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/9e73447adb7efd661f437e4fb052a036d8068214). Both changed only `test/dashboard-server.test.mjs`.

New evidence on the exact candidate:
- All 28 declared POST routes reject an authenticated empty JSON operation payload with a client error and leave the persisted dashboard state byte-for-byte unchanged.
- Read-only behavior is tested for Facebook idea generation (missing, invalid and valid dates), Facebook connection state and allowlisted task discovery; those reads preserve persisted state and report publishing disabled.
- Content-quality and metadata test steps each report 433 Node tests passed, zero failures and zero skips.
- Automation/security test step reports 433 Node tests passed, zero failures and zero skips; 16 Python tests passed; npm audit reports zero vulnerabilities; syntax/compilation steps completed successfully.
- Dashboard browser acceptance reports 16 passed journeys.
- Non-destructive branch inventory passed. Nature Frontiers local draft validation passed, while provider-side creation was skipped.
- Production readiness remains fail-closed with missing external prerequisites. No live upload, Meta post, campaign activation, Metricool schedule mutation, PR merge, main edit or destructive Git operation was performed.

At the time this section was written, several GitHub Actions wrappers were still `in_progress` even though their test/validation steps had completed successfully, and the isolated baseline was pending. Their final workflow conclusions must be rechecked before calling those workflows complete.

Live repository snapshot at this source/test checkpoint:
- Implementation branch: `codex/marketing-machine-audit-fixes`, source/test SHA `a3b57ebddd96b28fe0bef5233eb0c87be152bf48`.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- PR #1: open, draft and unmerged.
- Compare: 2,194 ahead / 2 behind / 182 changed files.
- `main` was not modified.

**DASH-001 remains NOT_TESTED.** This is partial behavior-level evidence for all 28 POST invalid-payload paths and three GET read-only paths, not exhaustive acceptance of all 15 forms, 105 controls, all successful API operations, browser persistence/reload, or every error/recovery path. Production remains NOT READY.



## Final workflow status refresh for source/test candidate `a3b57eb` — 30 October 2026

The exact candidate's relevant GitHub Actions runs have now reported final conclusions:

- [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41124654565): **SUCCESS** — 433 Node tests, 0 failures, 0 skips.
- [Metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41124654564): **SUCCESS** — 433 Node tests, 0 failures, 0 skips; metadata and unreviewed-template checks passed.
- [Automation/security](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41124654694): **SUCCESS** — 433 Node tests, 0 failures, 0 skips; 16 Python tests passed; npm audit 0 vulnerabilities; syntax and Python compilation checks passed.
- [Dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41124654677): **SUCCESS** — 16 browser journeys passed.
- [Non-destructive branch inventory](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41124654569): **SUCCESS**.
- [Isolated main/candidate baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41124646918): **SUCCESS** on the same exact source/test SHA.
- [npm lockfile verification](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41124647004): **SUCCESS**.
- [Nature Frontiers local draft validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41124654676): **SUCCESS** for local validation; provider-side draft creation remained skipped.
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41124654659): **FAILURE / BLOCKED by design** because 13 mandatory production prerequisites remain unresolved. The report correctly records HOLD; no safety gate was weakened.

A duplicate baseline run `41124654594` was still in progress at the time of the final read; the separate baseline run `41124646918` completed successfully against the same exact source/test SHA.

**Acceptance decision unchanged: DASH-001 remains NOT_TESTED.** The new 28-route POST negative-path matrix, three read-only GET behavior paths, and 16 browser journeys are partial behavior evidence. They do not cover every form's successful persisted operation, every control's intended behavior, all route success/error/concurrency paths, or complete browser reload/recovery acceptance.



## Dashboard campaign persistence and single-flight acceptance — 30 October 2026

Exact application/test candidate: `521ed70a263c03df48f5b0ae1c6c726dd380ce92`.

Implemented and committed:
- A single-flight guard for asynchronous dashboard form submissions, with `aria-busy` feedback. Backend validation/idempotency remains authoritative.
- Fixed Selar campaign preview so the pending URL, disclosure and fingerprint are durably stored without replacing approved configuration.
- Selar activation now requires explicit owner confirmation and an exact match to the stored preview hash; activation records the same fingerprint and clears pending fields.
- Deactivation clears pending preview state.
- Added unit and real-browser regression coverage for these behaviors.

Exact-SHA evidence:
- Dashboard browser E2E [run 41135546018](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41135546018): SUCCESS, 17 Chromium journeys.
- Content quality [run 41135552879](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41135552879): SUCCESS, 436 Node tests, zero failures.
- Automation/security [run 41135552980](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41135552980): SUCCESS, 436 Node tests, zero failures; 16 Python tests; npm audit zero vulnerabilities; syntax and compilation passed.
- Metadata [run 41135546094](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41135546094) and [run 41135553076](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41135553076): SUCCESS.
- Isolated baseline [run 41135552933](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41135552933): SUCCESS.
- Lockfile [run 41135546010](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41135546010): SUCCESS.
- Nature Frontiers local draft validation [run 41135553002](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41135553002): SUCCESS; no external Meta post was created.
- Production readiness [run 41135552805](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41135552805): remains FAIL/HOLD because genuine production prerequisites are missing.

The earlier browser failure [run 41134441258](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41134441258) on `204fa79` correctly exposed the missing Selar preview persistence. That application defect has been fixed. An intermediate test mismatch was also corrected by using the exact saved disclosure for activation.

Three of the 15 dashboard forms now have demonstrated successful browser journeys: campaign management, draft creation, and local Facebook draft creation. The remaining 12 forms are NOT_TESTED or BLOCKED by genuine prerequisites; see the form-by-form table in the dashboard matrix.

**DASH-001 remains NOT_TESTED.** Do not infer complete dashboard/API acceptance from the three accepted form journeys or 17 browser journeys.


---

## Exact-SHA successful dashboard authoring journey — 30 October 2026

- **Application/test candidate:** `1334f9380dafbf5f9e6cf272e1bd14feab0045f3`.
- Added a real Chromium journey for dashboard form `authoringform` in `browser-tests/dashboard.spec.mjs`. The test starts an isolated dashboard process and a loopback-only deterministic OpenAI-compatible test provider; it does not contact an external model service.
- The journey creates an isolated queued Short job using the repository's exact approved Selar destination, refreshes the real dashboard, submits a source-backed research brief through the authoring form, and verifies the generated script is persisted to the job state.
- It verifies the model-provided similarity claim is not trusted: persisted `similarityReview.status` is `PENDING`, and the job remains `publishable=false` with `publishingEnabled=false`.
- It performs an exact retry and verifies the server returns the existing result (`reused=true`) without a second provider call; after a full page reload, the saved script remains visible.
- [Dashboard browser E2E workflow 41137041295](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41137041295): **SUCCESS — 18 Chromium journeys passed, 0 failures**, exact candidate SHA above.
- [Automation/security workflow 41137046863](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41137046863): **SUCCESS — 436 Node tests, 0 failures, 0 skips; 16 Python tests passed; npm audit 0 vulnerabilities; syntax and Python compilation passed.**
- [Content quality workflow 41137047075](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41137047075): **SUCCESS — 436 Node tests, 0 failures.**
- [Metadata workflow 41137046875](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41137046875): **SUCCESS — 436 Node tests, 0 failures; metadata validation passed.**
- [Isolated main/candidate baseline workflow 41137046915](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41137046915): **SUCCESS** on the same exact candidate.
- [Non-destructive branch inventory workflow 41137046955](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41137046955): **SUCCESS** on the same exact candidate.
- [Nature Frontiers local draft validation 41137046914](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41137046914): **SUCCESS for local package validation only**; no provider-side draft creation or publication is claimed.
- [Production readiness workflow 41137046887](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41137046887): **FAILURE / HOLD by design**; mandatory business, identity, history, credentials, media and rights prerequisites remain unresolved.
- Dashboard successful-form count is now **4 of 15**: campaign preview/activation, queue draft, local Facebook draft, and source-bound script authoring. Eleven forms remain NOT_TESTED or BLOCKED; see `DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.md`. DASH-001 remains NOT_TESTED.
- The exact-SHA lockfile verification workflow was still pending at the time of this entry; no result is inferred.
- No YouTube upload, Facebook/Instagram publication, Metricool schedule change, campaign activation outside isolated tests, merge, main edit, reset, rebase or force-push occurred.


## Follow-up: hash-bound script review form successfully exercised — 30 October 2026

- **Test-only candidate:** `67edf6c84d716a236f457df8b13901eee896d195`, a browser-test-only descendant of application/test candidate `1334f9380dafbf5f9e6cf272e1bd14feab0045f3`; no application source changed in this follow-up.
- Extended the isolated authoring browser journey to submit the dashboard `scriptreviewform` using the selected script's exact SHA-256, an explicit APPROVE decision and a substantive review reason.
- Verified the real API persists the operator identity, review reason, script hash and approval receipt hash; verified the job remains `publishable=false` and global publishing remains disabled.
- Repeated the exact review request and verified the server reuses the existing approval receipt rather than recording a second approval.
- [Dashboard browser E2E workflow 41137335224](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41137335224): **SUCCESS — all 18 Chromium journeys passed**, including authoring and hash-bound script review.
- This synthetic test operator approval demonstrates the form and server workflow only. It is not the owner's real-world editorial approval and does not clear factual, originality, rights, narration, visual or publication gates.
- Successful form journeys now demonstrated: `campaignform`, `draft`, `facebookdraftform`, `authoringform`, and `scriptreviewform` (**5 of 15**). The other 10 forms remain NOT_TESTED or BLOCKED. DASH-001 remains NOT_TESTED.
