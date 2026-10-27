## Revalidation of PR head `914f4e461982836737439e4fa7e8721916aa2e32` — 28 October 2026

The PR head at this run was a documentation-only descendant of tested source/test candidate `96cb4b06704915c7ee4fb2f0feb1796b41823301`. It remained open, draft and unmerged. Live comparison: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, `1,846 ahead / 2 behind / 168 changed files`.

- Automation/security [run 40603127074](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603127074): **384 Node tests passed, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities.**
- Content quality [run 40603126998](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603126998): **384/384, zero skips.**
- Metadata [run 40603126864](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603126864): **384/384, zero skips.**
- Browser E2E [run 40603127058](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603127058): **13 Chromium journeys passed.**
- Isolated baseline [run 40603126970](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603126970): **PASS**, artifact [12780390057](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603126970/artifacts/12780390057), SHA-256 `31b48206bc04997e80aa5be5ae3973589411c676d09be1a25eb65ba952481c49`. The runner's FFmpeg installation timed out, so this baseline is not proof of the media integration test; the automation and lockfile workflows independently ran FFmpeg integration with zero skips.
- Lockfile verification [run 40603121347](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603121347): **PASS**, FFmpeg/ffprobe installed and complete Node suite 384/384 with zero skips.
- Production readiness [run 40603126958](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603126958): **BLOCKED** by 13 prerequisites; the fail-closed gate is not a production pass.
- Meta draft workflow [run 40603127120](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40603127120): local validation passed, external draft-creation job skipped.

The live branch-protection endpoint returned **403 Resource not accessible by integration**. The owner must verify branch protection and required checks directly in repository settings; this session cannot claim the setting is enabled or disabled.

---

## Exact tested candidate and CI repair — 28 October 2026

**Tested source/test SHA:** `96cb4b06704915c7ee4fb2f0feb1796b41823301`. At this checkpoint PR #1 remained open, draft and unmerged. Live refs: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, `1,845 ahead / 2 behind / 168 changed files`.

### Implementation in this checkpoint
- Added dashboard API assertions for malformed JSON and request bodies larger than 16 KB; both must be rejected without disclosing local state paths.
- Added a concurrent same-slot reservation test: two concurrent drafts for one local date produce exactly one successful reservation, one conflict, and one audit event.
- Fixed `.github/workflows/generate-lockfile.yml` to install FFmpeg and ffprobe before running the full Node test suite. Previously, that workflow failed with `spawnSync ffmpeg ENOENT`; it now passes without skipping the integration test.

### Exact-SHA results
- Automation/security [run 40602641429](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641429): **384 Node tests passed, 0 failed, 0 skipped; 16 Python tests; npm audit 0 vulnerabilities; normal install and FFmpeg/ffprobe integration passed.**
- Content quality [run 40602641482](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641482): **384 tests, 0 failures, 0 skips.**
- Metadata [run 40602641432](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641432): **384 tests, 0 failures, 0 skips.**
- Browser E2E [run 40602641446](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641446): **13 Chromium journeys passed.**
- Isolated baseline [run 40602641414](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641414): **PASS**, artifact [12779123920](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641414/artifacts/12779123920). Artifact checksum not calculated in this session.
- Lockfile verification [run 40602634490](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602634490): clean locked install, FFmpeg/ffprobe available, **384/384 Node tests passed**, schedule/campaign validation and syntax checks passed.
- Metadata push workflow [run 40602634445](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602634445): **PASS**.
- Production readiness [run 40602641438](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641438): **BLOCKED** by 13 genuine prerequisites. The failure is the expected fail-closed release gate, not a passing production check.
- Meta draft workflow [run 40602641541](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40602641541): 15 local validation tests passed; external `create-draft-package` job **SKIPPED**. No live Meta draft creation is proven.

### Dashboard inventory and acceptance status
Live source scan: **105 HTML controls, 15 forms, 38 literal route branches** (10 GET, 28 POST), of which 35 are `/api` branches. The unauthenticated sweep covers the inventoried API routes. New malformed-body, size-limit and concurrent-reservation assertions pass. This does **not** complete DASH-001; authorized success/failure, per-control behavior, all malformed/boundary cases, permissions, provider/persistence failures, restart durability, audit correctness and complete accessibility remain partly untested.

### Git reconciliation and preserved restore tests
The two base-only commits are a net-zero test-file add/revert pair: [71578daf](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/71578dafc24e5d48173dce3f4e392e18e42aa40e) added `test/restore-facebook-draft-history.test.mjs`; [fa00d28](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/fa00d28e7f58911482686e4ad69fac9f4701a2e6) reverted that write on `main`. The implementation branch retains the test file, and `tests/restore-state.test.mjs` remains present. Do not cherry-pick the revert, reset, rebase or reconcile destructively. Full review of 1,845 branch-only commits and owner-approved integration plan remain incomplete.

### Release verdict
**AUTOMATED TESTS PASS / IMPLEMENTATION PARTIAL / PRODUCTION BLOCKED.** No live YouTube upload, Meta post, campaign activation, visibility change, merge, or edit to `main` occurred. Nature Frontiers remains prohibited as a YouTube target; public/unattended YouTube publishing and live Meta publishing remain disabled; Safari remains inactive; approved Selar destination unchanged.

---

## Latest exact-SHA restore-lock checkpoint — 28 October 2026, 00:20 SAST

**Exact tested source/test SHA:** `b2686b888dabf6099d25aff59d288a514b3caffe`. Documentation-only commits followed that tested candidate; PR #1 remains open, draft and unmerged. Live refs at the latest state check: branch head `59d34c856912fdb1a03229801612e04eb532baa1`, `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, divergence `1819 ahead / 2 behind / 164 changed files`.

The restore path now serializes concurrent restore/recovery invocations using `.restore-operation.lock` in the validated state directory. Lock creation is exclusive; a competing operation fails closed and does not rewrite another process's lock. The current operation removes only its own token-matched lock. A stale lock is not automatically stolen by age: an operator must establish that no restore is active before manual cleanup.

- Automation/security: [run 40593628190](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628190) — **379 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; normal lifecycle install passed; npm audit reported 0 vulnerabilities; FFmpeg, syntax and Python compilation checks passed.**
- Content quality: [run 40593628137](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628137) — **379 tests, 0 failures, 0 skips**, FFmpeg installed.
- Metadata/schedule: [run 40593628366](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628366) — **379 tests, 0 failures, 0 skips**.
- Dashboard browser E2E: [run 40593628079](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628079) — **13 Chromium journeys passed**; this does not prove exhaustive control/API coverage.
- Isolated main/candidate baseline: [run 40593628185](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628185) — **PASS**.
- Production readiness: [run 40593628122](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628122) — correctly **BLOCKED**, not a test-suite failure; 13 production prerequisites remain.
- Meta draft workflow: [run 40593628361](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628361) — local candidate validation passed; external `create-draft-package` job was **SKIPPED**, so no real Meta draft creation is proven.

Current live refs: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, branch `1813 ahead / 2 behind / 164 changed files`. The large divergence remains a separate integration-review blocker.

Acceptance register currently records 27 PASS / 8 NOT_TESTED / 7 BLOCKED_EXTERNAL. Dashboard/API exhaustive acceptance, full operational crash and deployment drills, genuine production media/rights/human approval, verified YouTube/Meta operations, owner-approved cadence and safe branch reconciliation remain incomplete. No live upload/post, campaign activation, visibility change, merge, `main` edit or destructive Git operation occurred.

## Latest exact-SHA interrupted-restore hardening checkpoint — 27 October 2026, 22:02 UTC

**Exact tested source/test candidate:** `b1989a764e54400cddb55158b998c5a375972321`. The latest source/test changes put the restore journal inside the configured application state directory and make the dashboard refuse startup while an interrupted restore journal exists. The recovery path now stages and flushes all replacements, records a durable transaction journal, rolls back committed files after a later commit failure, restores the original dashboard-state bytes on rollback, and requires an explicit second invocation after restart recovery.

### Exact-candidate CI results

- **Automation/security PASS:** [run 40591305237](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40591305237): **378 Node tests passed, 0 failed, 0 skipped**; 16 Python tests passed; normal lifecycle-script install passed; `npm audit` reported 0 vulnerabilities; syntax, Python compilation and FFmpeg renderer integration passed.
- **Content quality PASS:** [run 40591305355](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40591305355): 378 Node tests, 0 failures, 0 skips; FFmpeg/ffprobe installed.
- **Metadata validation PASS:** [run 40591305087](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40591305087): 378 Node tests, 0 failures, 0 skips.
- **Dashboard browser E2E PASS:** [run 40591305138](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40591305138): 13 Chromium tests passed. These include server-restart persistence and Short-parent blocker reporting, not exhaustive dashboard/API control acceptance.
- **Isolated main/candidate baseline PASS:** [run 40591305219](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40591305219); [retained artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40591305219/artifacts/12773494010). Both main and candidate install, Node and Python baseline commands exited 0.
- **Facebook draft workflow:** [run 40591305428](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40591305428) passed 15 local deterministic validation tests, 0 failures, 0 skips. The external `create-draft-package` job was skipped; no real Meta draft creation is proven.
- **Production readiness remains BLOCKED:** [run 40591305218](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40591305218) correctly reports HOLD with 13 prerequisites. This expected fail-closed result is not production acceptance.

### Restore recovery acceptance

Three deterministic tests now cover:
1. rollback of a previously committed new file when the next destination rename fails;
2. byte-for-byte restoration of an existing dashboard-state file after a later commit fails;
3. restart recovery from a durable journal, removing a partial commit and requiring explicit operator retry.

A dashboard startup regression test confirms the server exits before initializing state when the restore journal remains. All four new recovery/startup tests passed within the 378-test Node suite.

**Limit:** this is deterministic filesystem failure injection and journal-recovery evidence, not a full production power-loss/filesystem crash drill. Cross-process remote-side-effect recovery and full isolated deployment/rollback remain `NOT_TESTED`.

### Live Git state at the tested candidate

- `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Candidate/branch HEAD at test: `b1989a764e54400cddb55158b998c5a375972321`
- Divergence at test: 1,803 ahead / 2 behind / 164 changed files.
- PR #1 remains open, draft and unmerged. `main` was not modified.

Both `test/restore-facebook-draft-history.test.mjs` and the separate `tests/restore-state.test.mjs` remain present. No restore-history test was deleted or recreated blindly.

**Verdict: IMPLEMENTATION PARTIAL / NOT PRODUCTION READY.** No live upload, post, campaign activation, visibility change or merge occurred. Nature Frontiers remains prohibited as a YouTube target; public/unattended YouTube publishing and live Meta publishing remain disabled; Safari remains inactive; the approved Selar URL remains `https://selar.com/0u19v8u99l`.

---

## Latest exact-SHA restore-recovery implementation checkpoint — 27 October 2026, 21:55 UTC

**Exact tested source/test candidate:** `31b5f56415b51280baa11418c56ef3c2b1280006`. **Current PR head at the time of test:** `31b5f56415b51280baa11418c56ef3c2b1280006`. The source/test changes add transaction staging and durable journaling to `scripts/restore-state.mjs`, plus failure-injection and interrupted-transaction recovery tests in `test/backup-restore.test.mjs`.

### Exact-candidate CI evidence

- **Automation/security PASS:** [run 40590357469](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40590357469): 376 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; clean normal lifecycle-script install passed; `npm audit` reported 0 vulnerabilities; syntax, Python compilation and FFmpeg renderer integration checks passed.
- **Content quality PASS:** [run 40590357580](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40590357580): 376 Node tests, 0 failures, 0 skips; FFmpeg/ffprobe installed.
- **Metadata validation PASS:** [run 40590357601](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40590357601): 376 Node tests, 0 failures, 0 skips.
- **Dashboard browser E2E PASS:** [run 40590357460](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40590357460): 13 Chromium tests passed, including real-server restart persistence and Short-parent workflow blocker reporting. This is not exhaustive control-by-control acceptance or proof of a successful native YouTube association.
- **Isolated main/candidate baseline PASS:** [run 40590357407](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40590357407); [retained artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40590357407/artifacts/12773761331).
- **Facebook draft workflow:** [run 40590357666](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40590357666) passed 15 local deterministic validation tests, 0 failures, 0 skips. The external `create-draft-package` job was skipped; no real Meta draft creation is proven.
- **Production readiness remains BLOCKED:** [run 40590357522](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40590357522) correctly reports HOLD with 13 production prerequisites. This expected fail-closed result is not production acceptance.

### Restore safety improvement

The restore path now stages and fsyncs every changed destination before the first destination commit, writes a durable `.restore-transaction.json` journal containing expected hashes and the original state bytes for an allowed state replacement, rolls back committed destinations when a later rename fails, and recovers a journal after restart. Recovery refuses unexpected destination contents and requires a separate explicit restore invocation before retrying.

Regression evidence in `test/backup-restore.test.mjs`:
- injected failure on the second destination rename rolls back the first committed file;
- simulated interrupted transaction rolls back the partial file and removes the journal;
- both tests pass in the exact candidate's 376-test Node suite.

**Limit:** this is deterministic failure-injection and journal-recovery evidence, not a full production filesystem/power-loss drill. Keep broad cross-process state recovery and deployment/rollback requirements `NOT_TESTED` until the remaining operational tests are performed.

### Git and release state at tested candidate

- `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Candidate/branch HEAD at test: `31b5f56415b51280baa11418c56ef3c2b1280006`
- Divergence: 1,791 ahead / 2 behind / 164 changed files.
- PR #1 remains open, draft and unmerged. `main` was not modified.

The existing `test/restore-facebook-draft-history.test.mjs` remains present. The separate `tests/restore-state.test.mjs` variant was preserved; no restore test was deleted or blindly recreated.

**Verdict: IMPLEMENTATION PARTIAL / NOT PRODUCTION READY.** No live upload, post, campaign activation, visibility change or merge occurred. Nature Frontiers remains prohibited as a YouTube target; public/unattended YouTube publishing and live Meta publishing remain disabled; Safari remains inactive; the approved Selar URL remains `https://selar.com/0u19v8u99l`.

---

## Latest verified implementation and exact-SHA CI checkpoint — 27 October 2026, 21:40 UTC

**Exact tested source/test candidate SHA:** `ac97c8860700dcbfedfb367d4dfbc0c654164479`. The new test adds a real FFmpeg multi-scene integration path: generate distinct source clips and narration, assemble with captions, probe streams/duration, fully decode, and verify both visual scenes remain in the output. This proves the compositor can assemble a small synthetic test sequence; it does not certify production assets, rights, manifests, or human playback review.

- **Automation/security PASS:** [run 40588392132](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392132): 374 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; normal lifecycle-script install passed; `npm audit` reported 0 vulnerabilities; FFmpeg renderer integration, syntax and compilation checks passed.
- **Content quality PASS:** [run 40588392114](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392114): 374 Node tests, 0 failures, 0 skips; FFmpeg installed.
- **Metadata validation PASS:** [run 40588392137](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392137): 374 Node tests, 0 failures, 0 skips; FFmpeg installed.
- **Dashboard browser E2E PASS:** [run 40588392231](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392231): 13 Chromium journeys. This is not exhaustive control-by-control acceptance; the Short-parent dashboard journey and full mutation matrix remain incomplete.
- **Isolated main/candidate baseline PASS:** [run 40588392118](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392118), with retained [baseline-comparison artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392118/artifacts/12772897547). Exact main and candidate install, Node and Python baseline commands exited successfully.
- **Facebook draft workflow:** [run 40588392305](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392305) passed local deterministic validation only; external `create-draft-package` was skipped. No real Meta draft creation is proven.
- **Production readiness remains BLOCKED:** [run 40588392139](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40588392139) correctly reports HOLD with 13 production blockers. The readiness failure is an expected fail-closed production gate, not a passing release result.
- **Live Git state at test:** `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; branch `codex/marketing-machine-audit-fixes` at tested candidate `ac97c8860700dcbfedfb367d4dfbc0c654164479`; 1,779 commits ahead / 2 behind / 164 changed files. PR #1 remained open, draft and unmerged.
- **Remaining scope:** exhaustive dashboard controls/API matrix; cross-process crash/restart and uncertain-side-effect recovery drills; owner-approved cadence; genuine rights-cleared final media and hash-bound human approval; verified SonicVhibez identity/OAuth and complete remote history; one-operation private upload and remote receipt; native Short Related-video association eligibility; real Meta identities/permissions and draft-only integration; isolated deployment/rollback; branch-history reconciliation and repository protections.
- No live upload, post, campaign activation, visibility change, merge, main edit, reset, rebase, force-push or destructive Git operation occurred. Nature Frontiers remains prohibited as a YouTube target; public/unattended YouTube publishing and live Meta publishing remain disabled; Safari remains inactive; approved Selar URL remains `https://selar.com/0u19v8u99l`.

**Verdict: automated code/CI checks PASS on the exact tested candidate; implementation remains partial; production is NOT READY.**

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

# Live exact-SHA checkpoint — 27 October 2026 (current as of 20:50 UTC)

## Latest exact-SHA implementation and acceptance checkpoint — 27 October 2026, 21:08 UTC

**Exact source/test SHA:** `4ee5a6c8f1dded39d97d9b30dd70f9e0df2b32cd`. **Latest application-code SHA:** `4ee5a6c8f1dded39d97d9b30dd70f9e0df2b32cd`. At this source/test checkpoint, `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, divergence 1,734 ahead / 2 behind / 163 changed files. Documentation-only descendants update this evidence. PR #1 remains open, draft and unmerged.

### Implementation changes

- Narration generation now requires a strict calendar-valid ISO timestamp with an explicit timezone for human script approval. Regression cases reject date-only, timezone-free, impossible-date and invalid-offset values before TTS. See [code](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/65a572eeb8a785b79725594b90954c958b9b1625) and [tests](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/d214cbe7910d755a0630d7e7536b4c675fe1f589).
- Structured readiness findings now label evidence types and control ownership, identify checked paths for schedule/metadata/queue findings, explicitly state that remote YouTube history is not fetched by the read-only report, and redact absolute external `QUEUE_PATH` values. Regression tests cover evidence paths and path redaction. Final code/test checkpoint is `4ee5a6c8f1dded39d97d9b30dd70f9e0df2b32cd`.

### Exact-SHA verification

- **Automation/security — PASS:** [run 40583891887](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40583891887): 372 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; locked install with normal lifecycle scripts, npm audit (0 vulnerabilities), FFmpeg renderer integration, JS syntax checks and Python compilation passed.
- **Dashboard browser E2E — PASS:** [run 40583891896](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40583891896), 13 Chromium journeys against the real local dashboard/backend.
- **Content quality — PASS:** [run 40583891874](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40583891874).
- **Metadata validation — PASS:** [run 40583892218](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40583892218). Its own Node test invocation had 1 FFmpeg-dependent skip because FFmpeg was absent in that job; automation and baseline workflows installed FFmpeg and passed all 372 tests without skips.
- **Isolated main/candidate baseline — PASS:** [run 40583891860](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40583891860). [Retained baseline artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40583891860/artifacts/12770538942): main 54 Node / 8 Python tests; candidate 372 Node / 16 Python tests; zero failures/skips and all command exit codes 0.
- **Facebook draft workflow — PASS for local deterministic draft validation only:** [run 40583891851](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40583891851). The remote `create-draft-package` job was skipped; no live Meta integration is proven.
- **Production readiness — BLOCKED / fail-closed:** [run 40583891981](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40583891981). Human-readable and JSON checks exited 2; 13 blockers were retained in the [readiness artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40583891981/artifacts/12771280214).

The immediately preceding interim checkpoint exposed a syntax error and failed; that checkpoint is not accepted. The syntax was corrected and the exact source/test SHA above was rerun. The readiness workflow's failure is expected because production prerequisites remain missing.

### Current 13 production blockers

1. Owner-approved feasible cadence mode, timezone-aware approval timestamp and non-empty approval reference.
2. Complete SonicVhibez public/private/unlisted history and pending/uncertain upload attempts must be independently reconciled; the readiness script does not fetch remote history.
3. Rights-verified `content/render-manifest.json` is missing.
4. Rights-verified `content/long-form-render-manifest.json` is missing.
5. Short metadata needs human review and explicit `READY_FOR_PRIVATE_UPLOAD` status.
6. Metadata needs the independently verified SonicVhibez channel ID.
7. Rights confirmation requires genuine media/licence verification.
8. Compliance review requires authorized human completion.
9. Genuine final `media/next-short.mp4` is missing.
10–12. `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` and `YOUTUBE_REFRESH_TOKEN` are absent from this readiness execution environment; this does not establish the state of a separate production secret store.
13. `SONICVHIBEZ_CHANNEL_ID` is absent from this readiness execution environment and must be verified, never guessed.

### Safety and verdict

No upload, post, campaign activation, visibility change, merge, main-branch edit, reset, rebase, force-push or destructive reconciliation was performed. Public/unattended YouTube and Facebook/Instagram live publishing remain disabled; Nature Frontiers remains prohibited as a YouTube target; Safari remains inactive; the approved Selar URL remains `https://selar.com/0u19v8u99l`.

**Verdict: IMPLEMENTATION PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.** The automated code checkpoint passes, but genuine rights-cleared media, human approvals, channel identity/history, explicit one-operation private-upload authorization/receipt, live Meta integration, owner cadence approval and recovery/deployment drills remain unproven.

---


## Latest exact-SHA implementation and acceptance checkpoint — 27 October 2026, 21:02 UTC

**Exact source/test SHA:** `0969430d130340eed1d143de2f488265a50930dc`. **Latest application-code SHA:** `e1f5650be2c82cb0c8ffd4046b8342a84df09eb9`. The code/test checkpoint is exact; documentation-only descendants follow it. At the tested checkpoint, `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, divergence 1,724 ahead / 2 behind / 163 changed files. PR #1 remains open, draft and unmerged.

### Implementation changes in this checkpoint

- Script narration generation now requires a strict calendar-valid ISO human-approval timestamp with an explicit timezone, reusing `isValidZonedIsoTimestamp`. Regression tests reject date-only values, timezone-free timestamps, impossible dates and invalid offsets before TTS runs. Code: [`65a572e`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/65a572eeb8a785b79725594b90954c958b9b1625); tests: [`d214cbe`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/d214cbe7910d755a0630d7e7536b4c675fe1f589).
- Readiness JSON now distinguishes repository-path checks, environment-presence checks and external history reconciliation, labels blocker ownership (`external_owner_or_human_reviewer`, `shared_code_and_owner`, or `maintainer_code_or_configuration`), and explicitly says the read-only check does not independently verify remote YouTube history. Code: [`e1f5650`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/e1f5650be2c82cb0c8ffd4046b8342a84df09eb9); tests: [`0969430`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/0969430d130340eed1d143de2f488265a50930dc).

### Exact-SHA verification

All following workflows checked out the exact source/test SHA `0969430d130340eed1d143de2f488265a50930dc`:

- **Automation/security — PASS:** [run 40582978833](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40582978833). 371 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; locked install with normal lifecycle scripts passed; FFmpeg two-scene render/decode integration passed; syntax checks and Python compilation passed; npm audit reported 0 vulnerabilities.
- **Dashboard browser E2E — PASS:** [run 40582979150](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40582979150), 13 Chromium journeys against the real local dashboard/backend.
- **Content quality — PASS:** [run 40582978759](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40582978759).
- **Metadata validation — PASS:** [run 40582979141](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40582979141). This workflow's own test invocation reported 370 passed / 0 failed / 1 skipped because FFmpeg was unavailable in that job; the automation workflow separately installed FFmpeg and ran all 371 tests with zero skips.
- **Isolated main/candidate comparison — PASS:** [run 40582978705](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40582978705). Retained artifact: [baseline-comparison.zip](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40582978705/artifacts/12770128315). Main: 54 Node / 8 Python tests, zero failures/skips; candidate: 371 Node / 16 Python tests, zero failures/skips; all reported exit codes were 0.
- **Facebook draft workflow — PASS for local deterministic package validation only:** [run 40582978997](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40582978997). The external `create-draft-package` job was skipped. No live Meta integration is proven.
- **Production readiness — BLOCKED / fail-closed:** [run 40582979127](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40582979127). Both human-readable and JSON readiness checks exited 2; the retained diagnostic artifact reports 13 blockers: [readiness report](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40582979127/artifacts/12769179191).

### Current 13 production blockers

1. Owner must approve a feasible cadence mode with a timezone-aware timestamp and non-empty approval reference.
2. Complete SonicVhibez public/private/unlisted YouTube history and all pending/uncertain upload attempts remain externally unreconciled; this read-only readiness command does not fetch that history.
3. Rights-verified `content/render-manifest.json` is missing.
4. Rights-verified `content/long-form-render-manifest.json` is missing.
5. Short metadata needs human review and explicit `READY_FOR_PRIVATE_UPLOAD` status.
6. Metadata needs the independently verified SonicVhibez channel ID.
7. Rights confirmation must follow genuine media/licence verification.
8. Compliance review must be completed by an authorized human.
9. Genuine final `media/next-short.mp4` is missing.
10–12. `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` and `YOUTUBE_REFRESH_TOKEN` are absent from this readiness execution environment; this does not establish the state of any separate production secret store.
13. `SONICVHIBEZ_CHANNEL_ID` is absent from this readiness execution environment and must be independently verified, not guessed.

The readiness report now labels each blocker with evidence type, control owner and remedy. The 13 blockers are not cleared by code tests. `test/restore-facebook-draft-history.test.mjs` remains present and is exercised by the passing automation suite.

### Safety and verdict

No upload, post, campaign activation, visibility change, merge, main-branch edit, reset, rebase, force-push or destructive reconciliation was performed. Public/unattended YouTube publishing and Facebook/Instagram live publishing remain disabled; Nature Frontiers remains prohibited as a YouTube target; Safari remains inactive; the approved Selar URL remains `https://selar.com/0u19v8u99l`.

**Verdict: IMPLEMENTATION PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.** The tested code checkpoint passes the automated suites above, but genuine media/rights/human approval, channel identity/history, one-operation private-upload receipt, live Meta integration, owner cadence approval and operational recovery/deployment drills remain unproven.

---


## Git baseline

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Branch: `codex/marketing-machine-audit-fixes`
- Current source/test candidate at this checkpoint: `7bd13b1894de0b783f062a6481090cdafcf272f3`
- Latest application-code ancestor: `081999d2a7f3afb2ef013a840e01982b21084db2`; this checkpoint changes only a test fixture after that application commit.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Live compare at this checkpoint: 1,718 commits ahead, 2 behind, 163 changed files. The branch is heavily divergent; do not merge or rewrite history as part of this work.
- PR #1: [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
- Historical checkpoint SHAs later in this file are retained as history, not current state.

## Change and regression

- Commit: [`7bd13b1894de0b783f062a6481090cdafcf272f3`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/7bd13b1894de0b783f062a6481090cdafcf272f3).
- Changed only `test/content-job-lifecycle.test.mjs`: corrected the private-upload approval fixture's metadata digest from a non-SHA label to a 64-character lowercase hexadecimal digest required by the validator.
- `test/restore-facebook-draft-history.test.mjs` remains present and tracked. Its cross-run archive restoration, malformed archive, size-limit, insecure-origin and symlinked-output-parent tests are included in the automation test run.
- No credentials were added and no external publishing operation was performed.

## Exact-SHA workflow evidence

All workflow runs below checked out the exact candidate SHA `7bd13b1894de0b783f062a6481090cdafcf272f3`.

- Automation/security: **PASS** — [run 40581175451](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40581175451). 369 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; `npm audit` reported 0 vulnerabilities; locked install, JavaScript syntax checks, Python compilation, campaign/disclosure checks, metadata safety checks and queue invariants passed.
- Dashboard browser E2E: **PASS** — [run 40581175422](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40581175422). 13 Chromium journeys passed against the real local dashboard/backend.
- Content quality: **PASS** — [run 40581175413](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40581175413).
- Metadata validation: **PASS** — [run 40581175673](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40581175673).
- Isolated main/candidate comparison: **PASS** — [run 40581175645](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40581175645). This indicates the comparison workflow completed successfully; inspect its retained artifact for the detailed main/candidate counts before making broader claims.
- Nature Frontiers Facebook draft: **PASS for deterministic local draft-package validation only** — [run 40581175874](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40581175874). The `create-draft-package` job was skipped; this is not live Meta integration evidence.
- Production readiness: **BLOCKED / expected fail-closed** — [run 40581175396](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40581175396). The readiness command exited 2 and reported 13 blockers; the workflow correctly failed its mandatory readiness gate.

## Exact currently reported readiness blockers

The 13 blockers from the readiness log are:

1. Feasible owner-approved cadence mode, timezone-aware approval timestamp and approval reference are missing.
2. Complete SonicVhibez public/private/unlisted upload history and all pending/uncertain upload attempts need independent reconciliation immediately before upload.
3. Rights-verified `content/render-manifest.json` is missing.
4. Rights-verified `content/long-form-render-manifest.json` is missing.
5. Short metadata is not human-reviewed and explicitly marked `READY_FOR_PRIVATE_UPLOAD`.
6. Metadata does not contain the verified SonicVhibez YouTube channel ID.
7. Metadata rights confirmation is not verified.
8. Metadata compliance review is not completed.
9. Final rendered `media/next-short.mp4` is missing.
10. `YOUTUBE_CLIENT_ID` is not configured in the readiness runner.
11. `YOUTUBE_CLIENT_SECRET` is not configured in the readiness runner.
12. `YOUTUBE_REFRESH_TOKEN` is not configured in the readiness runner.
13. `SONICVHIBEZ_CHANNEL_ID` is not configured in the readiness runner.

These are reported blockers, not proof that every related underlying system is defective. Do not fabricate owner approval, credentials, media, rights evidence, identity, upload history or a remote receipt to clear them.

## Scope and verdict

The source/test change and exact-SHA CI results above are verified. The checks do **not** establish genuine final media, authentic rights/provenance, human playback approval, authenticated channel identity/history, one-operation private-upload authorization or receipt, eligible native Short Related video association, live Meta Page/Instagram integration, or completed production recovery/deployment drills.

No public/unattended YouTube publishing was enabled. No YouTube upload, Facebook/Instagram post, campaign activation, visibility change, merge, or destructive Git operation occurred. Nature Frontiers remains prohibited as a YouTube target; Facebook live publishing remains disabled; Safari remains inactive; approved Selar destination remains `https://selar.com/0u19v8u99l`.

**Verdict: IMPLEMENTATION PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.**

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

## Live checkpoint — 27 October 2026: retained render evidence protection

**Application-code SHA:** `d465c03cb3b12ee68000192089165f326121e8eb`  
**Exact source/test SHA:** `3690ec82b52263cb2da2378f8aba9a5b19658a8f`  
**PR #1:** open, draft, unmerged. Documentation-only commits may follow this source/test SHA.  
**Git comparison:** `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; 1,691 commits ahead / 2 behind / 163 changed files. The current compare lists no removed or renamed files; `test/restore-facebook-draft-history.test.mjs` remains present.

### Implemented in this checkpoint

- `scripts/dashboard-server.mjs` refuses to replace a retained per-job render manifest, including an existing regular file, and returns a recovery-required response.
- `scripts/safe-media-path.mjs` rejects an existing regular render destination before FFmpeg can overwrite it.
- Regression tests preserve existing manifest/output bytes and verify refusal occurs before a job leaves `QUEUED`.
- Earlier related protection: `bd6a4b75addcb2e14b31d2219ff82b5ef33a1406` guards existing video/thumbnail output; `fc466b1192305464493313c7c9ef68ee69129289` guards retained per-job manifests; `d465c03cb3b12ee68000192089165f326121e8eb` hardens direct renderer output handling.

### Exact-SHA CI status for `3690ec82b52263cb2da2378f8aba9a5b19658a8f`

- Dashboard browser E2E: **PASS**, 13 Chromium journeys — [run 40575972740](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972740).
- Content quality: **PASS** — [run 40575972899](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972899).
- Metadata validation: **PASS** — [run 40575972743](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972743).
- Lockfile install completed successfully in browser CI; that job reported 0 npm vulnerabilities — [run 40575972740](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972740).
- Automation/security: **IN PROGRESS** — [run 40575972741](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972741). Its unit-test step had not started when this checkpoint was recorded; do not infer that the new helper regression passed.
- Isolated main/candidate baseline: **IN PROGRESS** — [run 40575972749](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972749).
- Production readiness: **BLOCKED** — [run 40575972751](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972751).
- Daily Nature Frontiers Facebook workflow: **PASS for local draft-package validation only**, not live Meta integration — [run 40575973011](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575973011).

### External and production gates

No genuine production media, full human playback/rights approval, authenticated SonicVhibez OAuth identity and complete remote history, one-operation private-upload receipt, successful native Short Related video, verified Meta Page integration, or operational acceptance is proven. YouTube's [official Related video guidance](https://support.google.com/youtube/answer/14075157?hl=en) requires the selected video to be public or unlisted; a private parent is ineligible. Do not change privacy to bypass this. No live upload or post was performed. Public/unattended YouTube publishing and Facebook live publishing remain disabled; Safari campaigns remain inactive.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.** This is a checkpoint, not a claim of completion.

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

# Current Release Evidence — 27 October 2026

## Exact refs

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Implementation branch: `codex/marketing-machine-audit-fixes`
- PR: [#1](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1), open, draft, unmerged.
- Source/test SHA with latest implementation and regression test: `28d326c474d2c4871f6e9f2f55f050dac9fe14bd`.
- Latest observed PR HEAD at evidence creation: `28d326c474d2c4871f6e9f2f55f050dac9fe14bd`. Documentation-only follow-up commits, if any, are not source/test SHAs.
- Main HEAD: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Divergence at source/test SHA: 1,520 commits ahead, 2 behind; 149 changed files.
- PR description still contains historical checkpoint values and must not be treated as live evidence.

## Implementation in this checkpoint

- `scripts/content-quality-gates.mjs`: added `validateAssetProvenanceSet`, validating the provenance lineage graph for duplicate asset IDs, missing ancestors, self-derivation, malformed derivative declarations, and cycles.
- `scripts/validate-content-quality.mjs`: integrated the graph validation into the existing fail-closed quality evidence gate before scene mapping. Existing per-asset source path and SHA-256 verification remains active.
- `test/asset-provenance-set.test.mjs`: five unit tests for valid chains and invalid graph cases.
- `test/validate-content-quality.test.mjs`: integrated regression verifies duplicate IDs are rejected before a Map overwrite can hide the collision.
- Commits: [`f0c1d0f`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/f0c1d0fabcc9cc4d4b8f3bfe559a79536ab90878), [`dc4c34f`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/dc4c34f3227744d9823cee13139d8d1ee50ef951), [`28d326c`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/28d326c474d2c4871f6e9f2f55f050dac9fe14bd). The first two are implementation; the last adds the integrated regression test. The separate test file was added at [`052927a`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/052927af794660f9d14c5284052e02471865db6f).

## Exact-SHA workflows for `28d326c474d2c4871f6e9f2f55f050dac9fe14bd`

| Gate | Status | Evidence |
|---|---|---|
| Automation/security, Node/Python/security checks | PASS | [Run 40444442486](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442486) |
| Dashboard browser E2E | PASS | [Run 40444442543](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442543) |
| Metadata validation | PASS | [Run 40444442439](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442439) |
| Content quality | PASS | [Run 40444442512](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442512) |
| Isolated main/candidate baseline | PENDING at time of writing | [Run 40444442431](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442431) |
| Production readiness | BLOCKED, expected fail-closed | [Run 40444442464](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442464) |
| Nature Frontiers Facebook daily draft | SKIPPED; not integration proof | [Run 40444442448](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442448) |

The automation log reports 328 Node tests, 0 failures. The content-quality workflow also passed. Do not count the readiness workflow failure as a test regression: it is the readiness gate reporting unmet external/production prerequisites. The isolated baseline run had not completed at the time this file was written.

## Still blocked

- Dashboard `POST /api/jobs/produce` still explicitly refuses jobs with generated authoring records because generated narration, captions, scene rendering, and downstream validation are not connected as one complete workflow. This is a real code-level integration defect, not merely an external prerequisite.
- No genuine final Short/long-form exports with complete source/licence provenance and human full-playback approval are evidenced.
- SonicVhibez OAuth/channel identity, full public/private/unlisted history and uncertain-upload reconciliation, one-operation private-upload authorization and verified remote receipt are not established.
- Native YouTube Related video association remains externally unverified; a description URL is not equivalent.
- Nature Frontiers Page identity/permissions and a non-skipped draft-only integration run remain unverified.
- A feasible cadence decision, exhaustive dashboard-control coverage, cross-process failure injection, recovery/rollback/deployment drills, full divergent-history review and repository governance remain outstanding.

## Safety

Public/unattended YouTube publishing stays disabled. Facebook live publishing stays disabled. Safari campaigns stay inactive. Nature Frontiers remains prohibited as a YouTube target. No upload, post, visibility change, campaign activation, merge, reset, rebase, force-push or history rewrite was performed.


---

## Live implementation checkpoint — 27 October 2026: authoring narration component

**Exact source/test SHA:** `4b4b041dd45c41246736bd7973be8d05ba091286`. **Latest application-code commit:** `3a891228a169c027d22bf6a3d6e9a2bba2a102e4`. **PR HEAD at this checkpoint:** `4b4b041dd45c41246736bd7973be8d05ba091286`.

- Live Git comparison: `main` `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; **1,536 ahead / 2 behind / 152 changed files**. PR #1 remains open, draft and unmerged.
- Implemented `scripts/generate-authoring-narration.py`: draft-only Edge TTS generation for an existing structured script; validates word count, section-to-transcript consistency, section scene/pacing/sound directions and source IDs; writes MP3, transcript, captions from TTS word-boundary events and a report containing script/audio/transcript/caption hashes. It rejects absent word-boundary timing rather than silently using approximate timings. Output is restricted to job-specific children of `media/generated-authoring`; symlinked media/output paths are rejected.
- Updated `scripts/build-script-generation-prompt.mjs` to request the same word-count limits as the quality gate: long-form 900–1,500 words; Short 125–150 words.
- **Important limitation:** the narration component is not yet integrated with dashboard `POST /api/jobs/produce`. The existing fail-closed refusal remains. This is not an end-to-end authoring-to-render acceptance result; no real TTS audio was generated by CI, and no final video was produced or playback-reviewed.
- Automation/security **PASS** — [run 40449501858](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501858): 328 Node tests; 16 Python tests; npm audit 0 vulnerabilities; normal/locked install, syntax and Python compile checks passed.
- Dashboard browser E2E **PASS** — [run 40449501863](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501863): 12 Chromium tests.
- Content quality **PASS** — [run 40449501841](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501841). Metadata validation **PASS** — [run 40449501936](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501936).
- Isolated main/candidate baseline **PASS** — [run 40449501846](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501846), comparing exact main/base SHA `fa00d28e7f58911482686e4ad69fac9f4701a2e6` with candidate source/test SHA `4b4b041dd45c41246736bd7973be8d05ba091286`; the baseline artifact was retained. This PASS is for the stated exact SHA only.
- Production readiness **BLOCKED as required** — [run 40449501870](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501870). Nature Frontiers Facebook draft **SKIPPED** — [run 40449501843](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501843); not integration proof.
- Remaining primary code defect: connect the authoring record to durable narration/caption generation, an explicitly approved storyboard/source-asset manifest, per-job multi-scene render output, actual audio/caption/export validation, metadata/hash binding, and human review. Do not remove the refusal until this is integrated and tested end-to-end.
- Other blockers remain: genuine rights-cleared media and full-playback realism review; successful Short-parent binding/recovery with real receipts; verified SonicVhibez OAuth/channel identity/history and uncertain-upload reconciliation; native Related video verification; verified Nature Frontiers Page and non-skipped draft workflow; feasible owner-approved cadence; exhaustive recovery/restore/deployment drills; full branch-history review and branch-governance acceptance.
- Safety unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar destination `https://selar.com/0u19v8u99l`. No upload/post, visibility change, campaign activation, merge or destructive Git operation.


---

## Live implementation checkpoint — 27 October 2026: dashboard script/narration review stages

**Exact application/test SHA:** `c5bfbbc7861616494c6b589604fa3797e673681a`. Documentation-only follow-ups, if any, do not change that tested source tree. **Latest server-stage integration commit:** `def2b74541f8f84a9095a92a54872264b4e22a6f`. **Latest narration recovery helper commit:** `85b0a15071a72de6c463e5fe89b7b047ae19a282`.

- Live PR #1 remains OPEN, DRAFT and UNMERGED. At this checkpoint, branch HEAD is `c5bfbbc7861616494c6b589604fa3797e673681a`; `main` is `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; live divergence **1,576 ahead / 2 behind / 154 changed files**. Full divergent-history review remains incomplete.
- Added `scripts/authoring-production-pipeline.mjs` to generate narration only for an explicitly human-approved exact script revision. It records script/audio/transcript/caption hashes, checks transcript text and word count against the approved narration, independently measures audio duration with ffprobe, runs the existing caption structure and synchronization validators, rejects symlinks and partial artifacts, and can reconcile complete prior output without invoking TTS again.
- Added dashboard API stages for hash-bound script review, narration generation, authenticated narration audio and review-bundle retrieval, explicit narration playback/transcript/caption approval, and recovery-only reconciliation. Added UI controls for script review, narration generation, audio playback, transcript/caption inspection, human review and no-retry reconciliation.
- The API tests use synthetic fixture bytes to test integrity/attestation handling; this is **not** evidence of real generated or playable production audio. CI does not invoke live Edge TTS. No genuine narration or final video was generated in this checkpoint.

### Exact-SHA workflow results for `c5bfbbc7861616494c6b589604fa3797e673681a`

- Automation/security **PASS** — [run 40453030534](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030534): **336 Node tests passed, 0 failed**; **16 Python safety tests passed**; npm audit reported **0 vulnerabilities**.
- Dashboard browser E2E **PASS** — [run 40453030615](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030615): **12 Chromium tests passed** against the local dashboard/backend.
- Content quality **PASS** — [run 40453030586](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030586).
- Metadata validation **PASS** — [run 40453030574](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030574).
- Isolated main/candidate baseline **PASS** — [run 40453030640](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030640), with the exact main/candidate comparison retained.
- Production readiness **BLOCKED** — [run 40453031961](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453031961), as expected because external account/media/approval gates remain unsatisfied.
- Nature Frontiers Facebook daily draft **SKIPPED** — [run 40453030497](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030497); this is not external integration proof.

### Release decision remains BLOCKED

The main defect is **not closed**: `POST /api/jobs/produce` still refuses authoring jobs. The new review/narration endpoints form a real, hash-bound first part of the pipeline, but the application still does not connect approved narration and approved source assets into a per-job scene manifest, render, final audio/caption/metadata validation and final-video human review. The refusal remains in place intentionally.

Remaining blockers include a production-plan binding contract and renderer integration; real rights-cleared visual assets and narration-licence evidence; final video playback review; successful Short-parent binding/recovery with a real verified parent receipt; verified SonicVhibez OAuth/channel/history and uncertain-upload reconciliation; native Related video verification; a successful non-skipped Nature Frontiers Page draft integration; owner-approved feasible cadence; and exhaustive backup/restore, deployment, rollback and branch-history review.

Safety unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar destination remains `https://selar.com/0u19v8u99l`. No upload, post, visibility change, campaign activation, merge or destructive Git operation occurred.


## Addendum — production-plan integration checkpoint (27 October 2026)

### Exact refs
- Current PR HEAD after documentation-only commits: `c439789e0ba8170821b85a3c9f0d685e5c08e62f`.
- Exact code/test tree used for the latest automated regression runs: `95a64fa88f668ba0f88cd2f4be394c9100c6ff53`; its latest browser run is still pending.
- Latest application-code SHA: `6224218660a11fd59353dbab96d9963e429649bb`; `95a64fa...` adds the corresponding browser acceptance assertion.
- `main` HEAD: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Live compare: 1,607 commits ahead / 2 behind / 157 changed files. Divergent history review is still incomplete.
- PR #1 remains OPEN, DRAFT and UNMERGED.

### Implemented in this checkpoint
- Added `scripts/production-plan.mjs` and structural/hash-bound validation tests for scene-level assets, provenance, rights-evidence hashes, format-specific scene counts, and explicit Short parent fields.
- Added `POST /api/jobs/production-plan` and `POST /api/jobs/production-plan/review`. The APIs require exact approved script and narration revisions, verify on-disk narration/audio/transcript/caption/report hashes, verify scene asset and rights-evidence file hashes, persist plan review state, and revalidate evidence during human review.
- Short plans must match the independently persisted, human-approved Short-parent relationship and verified public SonicVhibez receipt. A submitted plan cannot self-certify the parent.
- Added dashboard plan submission and review controls with a persisted plan preview. The review is explicitly **plan-stage only**.
- `POST /api/jobs/produce` remains fail-closed for authoring jobs. The per-job quality-evidence conversion, renderer integration, final media review and final-artifact approval are not implemented yet.

### Exact-SHA test evidence
- Automation/security PASS at `46186a494da5b512c57d0e6a04056b6c367754ef`: 345 Node tests passed, 0 failed; 16 Python safety tests passed; dependency audit and syntax/compile steps passed — [run 40487769081](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40487769081).
- Dashboard browser E2E at the prior code/test checkpoint PASS: 12 Chromium tests — [run 40487769134](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40487769134). The additional production-plan-preview assertion at current tree `95a64fa...` was still running when this addendum was drafted; do not attribute that result to the older run.
- Content quality PASS at `95a64fa...` — [run 40488246239](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488246239).
- Metadata validation PASS at `95a64fa...` — [run 40488245972](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488245972).
- Isolated main/candidate baseline PASS at `95a64fa...` — [run 40488246103](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488246103).
- Production readiness BLOCKED at `95a64fa...` — [run 40488246069](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488246069).
- Nature Frontiers Facebook daily draft SKIPPED at `95a64fa...` — [run 40488245959](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488245959); this is not a live integration pass.

### Current Metricool account finding
The connected Metricool account currently returns a Nature Frontiers brand (`7545638`) with a YouTube connection as well as Facebook and Instagram. The scheduled-post query found seven future posts (31 October–25 November 2026) with `autoPublish: true`, `draft: false`, and Instagram auto-publish enabled; one 27 October post is marked Facebook PUBLISHED. A pending/draft YouTube Short record on the Nature Frontiers brand has `youtubeData.privacy: public`. These are account observations, not repository test results. No Metricool post or setting was changed; the unsafe scheduled actions remain an external blocker pending explicit owner action.

### Release decision
**BLOCKED.** No real narration output or final production video has been accepted, no final full-playback realism review exists, no authorized private-upload receipt has been accepted, and the complete authoring-to-render workflow is still disconnected. Public/unattended YouTube publishing remains OFF, Facebook live publishing remains OFF in the application, Safari campaigns remain inactive, Nature Frontiers remains prohibited as a YouTube target, and the approved Selar URL remains `https://selar.com/0u19v8u99l`. No upload, post, visibility change, campaign activation, merge, or destructive Git operation was performed.


## Superseding implementation and exact-SHA evidence — 27 October 2026, 12:57 UTC

This section supersedes earlier statements above that the authoring renderer was entirely disconnected. Those statements remain historical checkpoints, not the current code description.

### Live Git refs at this checkpoint

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- PR #1 remains OPEN, DRAFT and UNMERGED: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- Application/test SHA: `66c61fc8aa8d79069426fc7f34dcb92013c02d7f`
- `main` SHA: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Live comparison: 1,628 commits ahead, 2 behind; 162 changed files.
- No merge, main edit, reset, rebase, force-push or history rewrite was performed.

### Code changes in the tested application/test tree

- Added `scripts/content-job-artifact-paths.mjs` and `test/content-job-artifact-paths.test.mjs`. Authoring jobs now use validated, isolated `media/jobs/<job-id>/final.mp4` and `thumbnail.jpg` paths rather than shared format-level output paths. Traversal/malformed IDs are rejected and distinct jobs receive distinct paths.
- Corrected `test/build-approved-job-render-manifest.test.mjs` fixtures to carry current hash-bound script, narration and plan approval attestations. Mutation tests now recompute the plan approval hash before testing deeper validation, so tests reach the intended gate rather than failing at an earlier stale-approval check.
- Corrected the production-plan review response so it no longer claims renderer integration is absent when `POST /api/jobs/produce` has a hash-gated authoring-render path.
- Final approval for authoring jobs now revalidates the current approved render package and saved per-job render manifest, and records explicit script, narration, transcript, captions, production-plan, quality-evidence and render-manifest hashes. It also records source-asset and licence-evidence hashes in the related-artifact integrity list. A stale or missing render package blocks approval.
- The renderer and all approval stages still keep publication disabled; code-level readiness does not constitute a real-media acceptance receipt.

### Exact-SHA CI for application/test SHA `66c61fc8aa8d79069426fc7f34dcb92013c02d7f`

- **Automation/security — PASS:** 357 Node tests passed, 0 failed; 16 Python safety tests passed; locked dependency install succeeded; npm audit found 0 vulnerabilities; syntax/compile and repository policy checks passed. [Run 40507689487](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689487)
- **Content quality — PASS:** [Run 40507689426](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689426)
- **Metadata validation — PASS:** [Run 40507689469](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689469)
- **Isolated main/candidate baseline — PASS:** main `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate `66c61fc8aa8d79069426fc7f34dcb92013c02d7f` each completed Node and Python tests with exit code 0. [Run 40507689457](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689457)
- **Dashboard browser E2E — PENDING at evidence capture:** [Run 40507689427](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689427). Do not treat this as a pass.
- **Production readiness — BLOCKED:** [Run 40507689465](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689465). The workflow reported 13 blockers, including missing owner-approved feasible cadence, unverified complete YouTube history, missing verified SonicVhibez channel ID, rights attestation and missing final media.
- **Nature Frontiers Facebook daily draft — SKIPPED:** [Run 40507689421](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689421). No live draft-execution pass is claimed.

### External and production blockers that remain

- No genuine, rights-cleared production asset set and complete accepted final export have been produced and reviewed in this checkpoint. A renderer test, manifest validation or sample media file is not evidence of realistic wildlife footage.
- No verified SonicVhibez OAuth/channel identity, complete public/private/unlisted history reconciliation, authorized private-upload attempt or remote receipt was produced. No upload was performed.
- No completed real-media human full-playback review, verified caption/audio synchronization receipt, or native YouTube Related-video verification is available.
- The owner-approved feasible publication cadence remains absent. The configured `long_form → long_form → short` cycle and 72-hour minimum gap remain fail-closed until the owner records a feasible policy.
- The latest previously inspected Metricool snapshot reported eight future Nature Frontiers posts with `autoPublish=true` and `draft=false`, plus a Nature Frontiers YouTube connection whose identity was not verified. No safe, reversible account-level pause/disconnect control was exposed by the connected read-only inspection surface; no external schedules or connections were changed. Treat this as an unresolved external safety risk until the account is corrected and verified directly.
- Facebook draft integration remains unproven. Facebook live publishing remains disabled. Safari campaigns remain inactive. Nature Frontiers must never be a YouTube target. The approved Selar URL remains exactly `https://selar.com/0u19v8u99l`.

### Release decision

**BLOCKED — NOT 100% ACCEPTED.** The latest tested tree has meaningful pipeline, approval-integrity and per-job artifact improvements, and the listed exact-SHA checks pass except for the explicitly pending/blocked/skipped workflows. Real-media, external-account, cadence, final human-review, upload-receipt and deployment/recovery acceptance gates remain open. Do not merge PR #1 or enable unattended/public YouTube, Facebook live publishing, or Safari campaigns.


---

# Live implementation checkpoint — 27 October 2026: native Short-parent evidence binding

**Exact source/test SHA:** `3c961716d348945b266afd3e996c7952984c7260`  
**Implementation commit:** `1c8bde08e6bf0e9574e4085365fcde2924ca2f6d`  
**Regression-test commit / source-test HEAD:** `3c961716d348945b266afd3e996c7952984c7260`  
**Live PR #1:** open, draft, unmerged. Documentation/PR metadata updates are not application-code test evidence.

## Live Git reconciliation

- Implementation branch HEAD at this checkpoint: `3c961716d348945b266afd3e996c7952984c7260`.
- `main` HEAD: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Comparison: 1,640 commits ahead, 2 behind; 162 changed files.
- Historical release evidence elsewhere in this file refers to older SHAs and must not be treated as evidence for this checkpoint.

## Implemented

- `scripts/short-parent-relationship.mjs` now requires native Related video evidence marked `VERIFIED` to identify the exact approved parent video ID, matching verified SonicVhibez channel ID, and canonical parent destination URL.
- `test/short-parent-relationship.test.mjs` adds regression cases for wrong parent ID, wrong channel, wrong destination, and a matching evidence record.
- The validator still treats `BLOCKED_EXTERNAL` as an explicit external blocker. These checks validate recorded evidence consistency; they do not independently query YouTube or prove that the native Related video setting is configured correctly.

## Exact-SHA workflow status for `3c961716d348945b266afd3e996c7952984c7260`

- Metadata validation **PASS** — [run 40528746426](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746426).
- Content quality **PASS** — [run 40528746313](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746313).
- Automation/security **PASS** — [run 40528746351](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746351): 362 Node tests passed, 0 failed; npm audit reported 0 vulnerabilities; JavaScript syntax and Python compilation checks passed.
- Dashboard browser E2E **PASS** — [run 40528746832](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746832): 13 Chromium browser acceptance tests passed.
- Isolated main/candidate baseline **PASS** — [run 40528746461](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746461).
- Production readiness **BLOCKED / fail-closed** — [run 40528746326](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746326).
- Facebook daily draft **SKIPPED** — [run 40528746430](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746430); this is not evidence of a real Meta integration.

## Release decision

**Production release remains BLOCKED.** This checkpoint is not evidence of a genuine end-to-end production video or of originality, rights authenticity, naturalism, narration quality, final playback approval, native Related video configuration, live YouTube identity/history, an authorized private-upload receipt, Meta draft-only integration, or a feasible owner-approved cadence.

Safety controls remain unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar destination remains `https://selar.com/0u19v8u99l`. No upload, social post, merge, `main` edit, reset, rebase, force-push or destructive history operation was performed.


---

# Live implementation checkpoint — 27 October 2026: fail closed on unverified Short Related video

**Exact source/test SHA:** `3b91b1338f970ab671ca366eec6c860672146671`  
**Latest application-code commit:** `13fea8d69efb8680fe2619a183296e5bc3904f3d`  
**Latest regression-test commit:** `3b91b1338f970ab671ca366eec6c860672146671`

## Implemented and tested

- `scripts/short-parent-relationship.mjs` supports a strict publication context that requires native Related video status `VERIFIED` and rejects a private parent as ineligible.
- `scripts/upload-private.mjs` invokes that strict context for Short uploads, so a Short with `BLOCKED_EXTERNAL`, missing native evidence or an ineligible private parent cannot proceed to upload.
- `scripts/dashboard-server.mjs` applies the same strict requirement to final Short approval, keeping the job in review until the native association is independently verified and eligible.
- `test/short-parent-relationship.test.mjs`, `test/short-parent-upload.test.mjs`, `test/dashboard-approval-contract.test.mjs`, and `tests/upload-private.test.mjs` cover mismatched parent evidence, the final approval gate, eligible synthetic test fixtures, and generic upload-recovery tests without bypassing the Short-specific gate.
- A private-only parent cannot satisfy the native Related video eligibility rule in this workflow. This is intentionally fail-closed; do not change the parent visibility or publish it publicly without separate explicit owner authorization. Current private-only policy therefore leaves native Short linking as a production blocker.

## Exact-SHA workflow outcomes for `3b91b1338f970ab671ca366eec6c860672146671`

- Automation/security **PASS** — [run 40529986572](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986572): 363 Node tests passed, 0 failed; 16 Python tests passed; npm audit reported 0 vulnerabilities; syntax/compile checks passed.
- Dashboard browser E2E **PASS** — [run 40529986676](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986676): 13 Chromium tests passed.
- Content quality **PASS** — [run 40529986871](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986871).
- Metadata validation **PASS** — [run 40529986776](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986776).
- Isolated main/candidate baseline **PASS** — [run 40529986758](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986758).
- Production readiness **BLOCKED / fail-closed** — [run 40529986321](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986321).
- Nature Frontiers Facebook daily draft **SKIPPED** — [run 40529986454](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986454); not live Meta integration evidence.

## Release decision

**Production release remains BLOCKED.** No real production MP4 or rights licence was independently reviewed in this run. No real YouTube native Related video association, authenticated channel/history reconciliation, authorized private-upload receipt, Meta draft-only integration, or owner-approved cadence was verified. The synthetic upload fixtures exercise recovery mechanics only; they are not production media or real licence proof.

Safety remains unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar destination remains `https://selar.com/0u19v8u99l`. No external account mutation, upload, post, merge, `main` edit or destructive Git operation occurred.


---

## Follow-up implementation checkpoint — cadence hard invariant (27 October 2026)

**Exact source/test SHA:** `47c839452fda99757a34dcb29865da9e967121af`  
**Application-code commit:** `e9c555d1c70cc18d6fc6a919b3899ca78d67713f`  
**Configuration commit:** `477f1ad0d86ff00aac7dcf1d89f455553a6d8a4b`  
**Regression-test commit:** `47c839452fda99757a34dcb29865da9e967121af`

### Code change

- `scripts/production-readiness.mjs` no longer accepts the `WEEKLY_TARGET_WITH_SHORTER_SPACING` mode and rejects any cadence with less than 72 hours, regardless of owner-defined mode.
- `config/weekly-content-plan.json` no longer presents a cadence option that violates the hard minimum.
- `tests/production-readiness.test.mjs` adds regression coverage for the 72-hour invariant, 216-hour cycle, and removal of the unsafe option.
- This does not set owner approval, change actual publication slots, or enable publishing.

### Exact-SHA CI outcomes for `47c839452fda99757a34dcb29865da9e967121af`

- Automation/security **PASS** — [run 40537264912](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264912): 364 Node tests passed, 0 failed; 16 Python tests passed; npm audit reported 0 vulnerabilities.
- Dashboard browser E2E **PASS** — [run 40537264704](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264704): 13 Chromium tests passed against the real local dashboard/backend.
- Content quality **PASS** — [run 40537264707](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264707).
- Metadata validation **PASS** — [run 40537265090](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537265090).
- Lockfile generation/verification **PASS** — [run 40537255697](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537255697).
- Production readiness **BLOCKED / fail-closed** — [run 40537264786](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264786).
- Facebook daily draft **SKIPPED** — [run 40537264915](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264915); not a real Meta integration test.
- Isolated main/candidate baseline **IN PROGRESS at this checkpoint** — [run 40537255841](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537255841). Do not count it as a pass until its actual conclusion is available.

### Release decision remains BLOCKED

No real production media, independent human full-playback approval, authenticated SonicVhibez OAuth/history reconciliation, authorized private-upload receipt, verified eligible native Related video association, real Meta draft-only run, owner-approved feasible cadence, or complete production recovery/deployment drill is established by these CI checks. Keep public/unattended YouTube publishing OFF, Facebook live publishing OFF, Safari inactive, Nature Frontiers prohibited as a YouTube target, and PR #1 open/draft/unmerged. The approved Selar URL remains `https://selar.com/0u19v8u99l`.


### Baseline completion addendum — 27 October 2026

The isolated main/candidate baseline workflows completed after the checkpoint above and are now **PASS** for tested source/test SHA `47c839452fda99757a34dcb29865da9e967121af`: [run 40537255841](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537255841) and [run 40537264675](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264675). The earlier `IN PROGRESS at this checkpoint` line accurately describes the earlier observation, but the final result is PASS. Production readiness remains BLOCKED and Facebook draft remains SKIPPED.


---

## Follow-up implementation checkpoint — private-only Short review and truthful Related-video blocker (27 October 2026)

**Application-code commit:** `2186822bba83ecfb299e40ab8d10376c009f8711`  
**Exact source/test SHA:** `77921aca418b25bca0a9aa681281145b00c6d72f`  
**Branch/PR head at this checkpoint:** `77921aca418b25bca0a9aa681281145b00c6d72f`

### Changes

- A private-only Short review upload may carry an explicit `BLOCKED_EXTERNAL` native Related-video status when its parent is private. It does not claim native association success, permit public publishing, or waive the public-release gate.
- Relationship validation now rejects an empty or vague external-blocker explanation (requires 8–500 characters).
- Regression coverage checks private-only approval, exact relationship binding, private-parent eligibility, and rejection of empty blocker evidence.
- The historical `test/restore-facebook-draft-history.test.mjs` remains present on the branch; its recovery coverage was not removed or rewritten.

### CI status observed for exact source/test SHA `77921aca418b25bca0a9aa681281145b00c6d72f`

- Automation/security **PASS** — [run 40542854519](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854519).
- Content quality **PASS** — [run 40542854671](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854671).
- Metadata validation **PASS** — [run 40542854427](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854427).
- Dashboard browser E2E **IN PROGRESS at this observation** — [run 40542854283](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854283). Do not treat as a pass until its final conclusion is checked.
- Isolated main/candidate baseline **IN PROGRESS at this observation** — [run 40542854437](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854437). Do not treat as a pass until its final conclusion is checked.
- Production readiness **BLOCKED / fail-closed** — [run 40542854087](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854087).
- Nature Frontiers Facebook daily draft **SKIPPED** — [run 40542854114](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854114); this is not live Meta integration evidence.

The separate application-code commit `2186822bba83ecfb299e40ab8d10376c009f8711` had dashboard browser E2E **PASS** in [run 40542804855](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542804855), but this older run does not replace final checks for the source/test SHA above.

### Release decision

**IMPLEMENTATION INCOMPLETE / PRODUCTION BLOCKED.** The focused Short-review defect is covered, but the broader audit still identifies missing lifecycle integration for authoring, no verified genuine multi-scene production render and no human-approved production MP4. Real SonicVhibez OAuth/history, an authorized private-upload receipt, native Related-video verification, live Meta draft-only integration, owner-approved feasible cadence, and complete recovery/deployment drills remain unproven. Public/unattended YouTube publishing and Facebook live publishing remain disabled; Safari campaigns remain inactive; Nature Frontiers remains prohibited as a YouTube target. PR #1 remains open, draft and unmerged. No live account mutation or publication was performed.


---

## Live repository and workflow reconciliation — 27 October 2026

This addendum supersedes any earlier statement in this document that describes the then-current branch head or says the newest browser/baseline workflows are still pending. It is documentation-only and does not change application code or tests.

- Live PR #1: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1 — OPEN, DRAFT, UNMERGED.
- Live branch: `codex/marketing-machine-audit-fixes`.
- Live PR head observed: `ed6f27d5275a8c9d2e41964d3f5ea386d4078d6c`.
- The head commit is documentation-only (OPERATIONS.md); the application/test tree remains at exact source/test checkpoint `77921aca418b25bca0a9aa681281145b00c6d72f`.
- Live comparison against `main`: 1,675 commits ahead / 2 behind; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; current `main` SHA `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. This is a large divergent history and still requires a full risk review; do not merge or reconcile destructively.

### Current-head workflow observations

The GitHub Actions runs associated with the observed head completed with these results:

- Automation/security PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315036
- Dashboard browser E2E PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315508
- Content quality PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315286
- Metadata validation PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315245
- Isolated main/candidate comparison PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315742
- Production readiness FAILED because mandatory readiness gates remain blocked: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315319
- Nature Frontiers Facebook daily draft SKIPPED: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315444. This is not evidence of a successful live Meta integration.

### Implementation interpretation

The current dashboard source includes a guarded authoring-to-render path that calls `buildApprovedJobRenderManifest`, validates the designated metadata path and per-job output directory, persists a per-job manifest, and launches the appropriate renderer. Tests verify that authoring jobs lacking required approval, provenance, quality, compliance, or artifact-integrity evidence are rejected. Therefore, the older blanket description that the endpoint simply refuses every authoring job is not supported by the current source; acceptance still requires successful end-to-end render evidence with genuine approved assets and independent human review.

### Release verdict remains BLOCKED

These CI results do not establish genuine rights-cleared final MP4s, full human playback/factual/realism acceptance, authenticated SonicVhibez OAuth identity and complete remote history, an authorized private-upload receipt, eligible native YouTube Related-video association, a real draft-only Meta run, owner-approved feasible cadence, or complete operational recovery/deployment drills. The documented Metricool risk involving Nature Frontiers' incorrect YouTube association and scheduled auto-publishing must be reconciled in Metricool by the owner before any further external publishing; no such account changes were made in this task.

Safety remains unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar URL unchanged. PR #1 remains open/draft/unmerged. No upload, post, campaign activation, merge, `main` edit, reset, rebase, force-push or destructive history operation occurred.


---

## Live implementation checkpoint — 27 October 2026: fail-closed Short-parent validation

**Exact application/test SHA:** `081999d2a7f3afb2ef013a840e01982b21084db2`  
**Latest application-code commit:** `081999d2a7f3afb2ef013a840e01982b21084db2`  
**PR #1:** open, draft, unmerged.  
**Main:** `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; **merge base:** `45352b73bb6cc4787b2a49988b575afb754ab627`; current divergence: 1,709 ahead / 2 behind / 163 changed files. The live compare shows no removed or renamed files; `test/restore-facebook-draft-history.test.mjs` remains present.

### Code and regression change

- `scripts/short-parent-relationship.mjs`: `allowPrivateParent` now defaults to `false`. Callers must explicitly opt in when they are recording a private-parent relationship as pending/blocked; this does not make the native YouTube Related video association successful.
- `scripts/dashboard-server.mjs`: the relationship-binding endpoint explicitly opts in to persist the honest `BLOCKED_EXTERNAL` private-parent state.
- `scripts/content-job-lifecycle.mjs`: private-upload approval explicitly opts in to the pending private-parent record, while native association remains blocked.
- `test/short-parent-relationship.test.mjs`: regression covers rejection by default and explicit acceptance only for a relationship record that still declares the native feature blocked.
- Commits: [`7cd237a`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/7cd237a7a41ba9f7f59314ee9f1cc9ba7f2a0c3a), [`75dc4d5`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/75dc4d561e17535f7353e59d9e78b5ebfd9fb675), [`6a74173`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/6a74173e83e77984f7fe276ca7227d0f07614028), [`081999d`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/081999d2a7f3afb2ef013a840e01982b21084db2).

### Exact-SHA CI

- **Automation/security — PASS:** [run 40578139334](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40578139334): 368 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; `npm audit` found 0 vulnerabilities; normal install, FFmpeg installation, syntax and safety checks passed.
- **Content quality — PASS:** [run 40578139310](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40578139310).
- **Metadata validation — PASS:** [run 40578139325](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40578139325).
- **Local Facebook draft package — PASS for deterministic draft-only validation only:** [run 40578139309](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40578139309); this is not live Meta integration evidence.
- **Isolated main/candidate baseline — PASS:** [run 40578139462](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40578139462).
- **Dashboard browser E2E:** [run 40578139350](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40578139350) was still pending when this checkpoint was recorded; do not infer a result from a pending run.
- **Production readiness — BLOCKED / fail-closed:** [run 40578139411](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40578139411) reported 13 blockers. This is an expected release hold, not a passing production gate.

### Still blocked

No genuine production MP4 with verified rights/provenance and full human playback approval; authenticated SonicVhibez OAuth identity and complete public/private/unlisted history; operation-specific private-upload authorization and verified receipt; eligible native Short-parent association (private parents remain ineligible); live authorized Meta Page/Instagram verification and external draft creation; owner-approved feasible cadence; complete operational recovery/deployment acceptance. No live upload or post occurred. Public/unattended YouTube publishing and Facebook live publishing remain disabled; Safari remains inactive.


---

## Operator-token byte-length hardening checkpoint — 28 October 2026

**Implementation branch:** `codex/marketing-machine-audit-fixes`  
**PR #1 head at observation:** `de41102b622def75671e82b8972a16b536cd1c5a`  
**Change commits:** `c488ff20afd4177fc0e2a2d851d8b8073c9da9be` (helper), `d74eb48a709fbaae33437bcb1c958fdb8b5d3646` (regression tests), `de41102b622def75671e82b8972a16b536cd1c5a` (dashboard integration).

### Implemented

- Added `scripts/operator-auth.mjs` with `matchesOperatorToken`, which compares UTF-8 byte buffers using `timingSafeEqual` only after verifying equal byte lengths.
- Updated `scripts/dashboard-server.mjs` to use the helper for `x-operator-token` authentication. This avoids a thrown exception when strings have equal JavaScript code-unit lengths but unequal UTF-8 byte lengths.
- Added `test/operator-auth.test.mjs` covering exact match/mismatch, non-string inputs, equal code-unit lengths with unequal UTF-8 byte lengths, and matching non-ASCII tokens.
- Isolated local Node test execution for the helper and equivalent regression cases: **3 tests passed, 0 failed, 0 skipped**. This is focused helper evidence only, not a full repository test run.

### Exact-head GitHub Actions observation

At the time of this entry, the following runs were associated with `de41102b622def75671e82b8972a16b536cd1c5a`:

- Automation/security: [40595638690](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638690) — in progress.
- Content quality: [40595638795](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638795) — in progress.
- Metadata validation: [40595638741](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638741) — in progress.
- Dashboard browser E2E: [40595638773](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638773) — pending.
- Isolated main/candidate baseline: [40595638701](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638701) — pending.
- Production readiness: [40595638859](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638859) — failed/blocked by outstanding release prerequisites; this is not a code-test pass.
- Nature Frontiers Facebook draft workflow: [40595638700](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638700) — workflow success does not prove an external Meta draft was created; inspect job-level outcome before interpreting it.

Do not treat pending or in-progress runs as passes. Recheck exact-head conclusions before using this checkpoint for release acceptance.

### Release status and safety

This small authentication hardening does not close the exhaustive dashboard/API acceptance gap or any external production prerequisite. Production remains **NOT READY** until the current full test/acceptance results and all required media, rights, human review, verified account identity/history, private-upload receipt, native Short-parent eligibility, Meta draft-only integration, feasible owner-approved cadence, operational recovery/deployment drills, and branch-history reconciliation are evidenced.

No upload, social post, campaign activation, visibility change, merge, `main` edit, reset, rebase, force-push or destructive reconciliation was performed. Nature Frontiers remains prohibited as a YouTube target; public/unattended YouTube publishing and live Meta publishing remain disabled; Safari remains inactive.


### Exact source/test candidate status reconciliation — 28 October 2026

This reconciliation supersedes the earlier "in progress/pending" status for the following jobs only; it does not change the tested source/test candidate SHA `de41102b622def75671e82b8972a16b536cd1c5a`.

- Automation/security **PASS** — [40595638690](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638690): 382 Node tests, 0 failures, 0 skips; 16 Python tests passed; npm audit reported 0 vulnerabilities; normal install, FFmpeg integration, JavaScript syntax and Python compilation checks passed.
- Content quality **PASS** — [40595638795](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638795): repository test suite passed with zero skips.
- Metadata validation **PASS** — [40595638741](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638741): repository test suite and metadata gates passed with zero skips.
- Dashboard browser E2E — [40595638773](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638773) remained **IN PROGRESS** at this reconciliation; do not count it as a pass.
- Isolated main/candidate baseline — [40595638701](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638701) remained **PENDING** at this reconciliation; do not count it as a pass.
- Production readiness — [40595638859](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638859) remains **BLOCKED/FAILED** by outstanding release prerequisites.
- Nature Frontiers Facebook draft workflow — [40595638700](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595638700) reported workflow success, but that status alone does not establish external Meta draft creation; external job-level evidence must be inspected separately.

The helper's three isolated Node regression tests also passed locally. No full local checkout was available in this execution environment, so no claim is made that the complete suite was run locally.


---

## Dashboard authentication integration regression — 28 October 2026

**Current application/test candidate:** `c819fb9e005eb01b614d66c1aa380e1330147d41`  
**Change:** `test/dashboard-server.test.mjs` now sends an operator token with the same JavaScript string length as the configured token but a different UTF-8 byte length. It asserts the authenticated API rejects this malformed token with HTTP 401 rather than producing an internal error. The byte-safe helper and dedicated unit tests from `de41102b622def75671e82b8972a16b536cd1c5a` remain included.

### Exact-candidate workflow status at this observation

- Automation/security: [40595854783](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595854783) — in progress.
- Content quality: [40595854786](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595854786) — in progress.
- Metadata validation: [40595854888](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595854888) — in progress.
- Dashboard browser E2E: [40595854792](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595854792) — in progress.
- Isolated main/candidate baseline: [40595854787](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595854787) — pending.
- Production readiness: [40595854780](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595854780) — blocked/failure, with 13 reported prerequisites.
- Nature Frontiers draft workflow: [40595854852](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40595854852) — local draft-package validation passed; external draft-creation job was skipped. This is not external Meta acceptance.

The previous candidate `de41102b622def75671e82b8972a16b536cd1c5a` had automation/security, content-quality, metadata and 13-journey Chromium E2E workflows pass. The current candidate adds the integration-level malformed-token regression, so its own in-progress results must be checked before assigning the same pass claims to `c819fb9e005eb01b614d66c1aa380e1330147d41`.

Production remains **NOT READY**. The 13 current readiness blockers include missing genuine render manifests and final Short media, missing review/rights evidence, missing verified SonicVhibez channel metadata and YouTube credentials in this CI environment, complete YouTube history reconciliation, and a feasible timezone-aware owner-approved cadence. No external publication was attempted.


---

## Reconciled completed CI checkpoint — 28 October 2026

This section supersedes earlier statements in this document that isolated baseline run `40595854787` was pending. The refreshed branch checkpoint was `8e7bec96d66bf6ad8c18da177fe4b83d1e943716`; the only change in that commit relative to the source/test candidate was acceptance-register documentation. Dashboard and server source blobs at the checkpoint were independently scanned for the refreshed control/route inventory recorded in `docs/DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.md`.

- Automation/security [40596063596](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40596063596): PASS; 382 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit reported 0 vulnerabilities; normal lifecycle install, FFmpeg integration, syntax and compilation checks passed.
- Content quality [40596063407](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40596063407): PASS.
- Metadata [40596063450](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40596063450): PASS.
- Dashboard browser E2E [40596063436](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40596063436): PASS, 13 Chromium journeys.
- Isolated main/candidate baseline [40596063417](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40596063417): PASS. Retained artifact: [baseline-comparison.zip](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40596063417/artifacts/12776445936), artifact ID `12776445936`, uploaded ZIP SHA-256 `ad6a3cdc09533fd7d45cb8db516f4c02c4b0fce5c9960786b8e274084b0d6851`.
- Production readiness [40596063416](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40596063416): BLOCKED; the readiness commands correctly returned exit code 2 with 13 prerequisites.
- Facebook draft workflow [40596063619](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40596063619): local candidate draft validation passed, but `create-draft-package` was skipped. No external Meta draft is verified.

### Current decision

**Code CI and isolated baseline: PASS for the observed checkpoint. Implementation: PARTIAL. Production acceptance: BLOCKED.** The inventory is now refreshed to 105 controls across 15 forms and 38 literal route branches (10 GET, 28 POST). Exhaustive per-control/API acceptance remains `NOT_TESTED`; genuine media, rights, human playback approval, verified SonicVhibez account/history, private upload receipt, owner cadence approval, external Meta draft acceptance, native Related video eligibility, branch protection and operational deployment/recovery drills remain unresolved.

No public/unattended YouTube publishing, live Meta publishing, campaign activation, video visibility change, PR merge, main edit or destructive Git operation was performed.


---

## Dashboard inventory tooling and route-auth acceptance — 28 October 2026

**Exact source/test candidate:** `1f72c6dc5b648f0c60fdea45ae1d37e835e4505e`.

Implemented `scripts/dashboard-inventory.mjs`, exposed it as `npm run inventory:dashboard`, and added `test/dashboard-inventory.test.mjs`. The static inventory contains 105 controls (21 buttons, 43 inputs, 26 selects, 15 textareas), 15 forms and 38 literal route branches (10 GET, 28 POST). Inventory output includes source line numbers and route/control metadata; it explicitly does not represent acceptance by itself.

Extended `test/dashboard-server.test.mjs` to enumerate the literal `/api/*` method/path routes from the inventory and verify that every distinct route rejects a request without the operator token with HTTP 401. This improves coverage of the authentication boundary, not the complete behavior of each route.

Exact-candidate workflow results:
- Automation/security [40598195046](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195046): PASS; 384 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities.
- Content quality [40598195232](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195232): PASS.
- Metadata [40598195101](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195101): PASS.
- Browser E2E [40598195206](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195206): PASS, 13 Chromium journeys.
- Isolated main/candidate baseline [40598195202](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195202): PASS. Both isolated Node/Python test commands exited 0. Retained artifact [baseline-comparison.zip](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195202/artifacts/12776283618), artifact ID `12776283618`, ZIP SHA-256 `989203aab1898f8d740d4f56294e03eec8d023cb6086ce4c171ee2aff156ad2b`.
- Production readiness [40598195430](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195430): BLOCKED; the expected fail-closed readiness gate still reports unresolved production prerequisites.
- Facebook draft workflow [40598195092](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195092): local validation succeeded; external draft creation was skipped.

**Verdict:** this candidate passes the listed automated code checks and isolated baseline. Implementation remains partial; exhaustive dashboard/API acceptance, real external integrations, media/rights/human approval, cadence approval, native Short-parent association, operational deployment/recovery and branch protection remain unresolved. No external publishing or merge occurred.
