# Live operational acceptance status — 30 October 2026

The tested application/source candidate is `115fe82252b4fa1ef1eb2f9587bf0653356a6dc9`; exact candidate workflows passed 426 Node tests (0 failures/skips), 16 Python tests, npm audit 0 vulnerabilities, FFmpeg/ffprobe, JS syntax and Python compilation. Content quality, metadata, 15 Chromium journeys, isolated baseline and branch inventory passed. The current branch HEAD is a documentation-only descendant; see `docs/CURRENT_RELEASE_EVIDENCE_2026-10-30.md`.

**Operational status: NOT PRODUCTION READY.** Do not enable publishing, campaigns or provider mutations. Keep public/unattended YouTube disabled; SonicVhibez is the only permitted YouTube destination; Nature Frontiers must never be a YouTube target. Keep Meta publishing disabled, dry-run enabled and emergency stop asserted. Production readiness remains fail-closed until genuine owner/provider evidence and operational acceptance are complete.

Outstanding maintainer acceptance includes exhaustive dashboard/API behavior acceptance (DASH-001), full crash/restart and power-loss recovery plus deployment rollback (STATE-001 / DEPLOY-001), complete schedule queue/history/concurrency acceptance (SCHED-001), and full semantic branch reconciliation (GIT-002). Owner/provider actions are enumerated in `docs/REQUIREMENTS_ACCEPTANCE_REGISTER.json` and `docs/GO_LIVE_BLOCKERS.md`.

---

# Current checkpoint — 29 October 2026

The current exact tested source/test candidate is `726e3fca8d0a1a79a76f9d04fefcd440b83f52cc`. Its automation/security, content-quality, metadata, browser and isolated-baseline workflows passed (420 Node tests, 0 failures/skips; 16 Python tests; npm audit 0 vulnerabilities; 15 Chromium journeys). The full-history branch inventory also passed and is available as [artifact 12889820366](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917617/artifacts/12889820366). Production readiness is still **BLOCKED**; do not bypass the readiness gate.

Targeted safeguards reject symlinked upload-log directory components and verify that YouTube read-back matches the exact remote video ID, verified channel, approved title and private visibility. The branch reconciliation tool inventories every branch-only/main-only commit and per-commit changed files; its report is evidence for review, not authorization to merge or rewrite history.

PR #1 remains open/draft/unmerged; `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Do not publish publicly, change visibility, post to Meta, activate campaigns or mutate remote schedules without the exact required authorization. Nature Frontiers is never a YouTube target; Safari remains inactive; the approved Selar URL remains `https://selar.com/0u19v8u99l`.

See [current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-29.md), [go-live blockers](GO_LIVE_BLOCKERS.md), [acceptance register](REQUIREMENTS_ACCEPTANCE_REGISTER.json), and [branch reconciliation report](BRANCH_RECONCILIATION_REPORT_2026-10-28.md).

---

---

## Latest verified checkpoint — 28 October 2026, 00:20 SAST

Exact tested source/test SHA: `b2686b888dabf6099d25aff59d288a514b3caffe`. Restore operations now use an exclusive cross-process lock in the configured state directory. Competing restores fail closed; a lock is only removed by the operation that created it. Stale locks require operator verification before manual removal.

Exact-candidate evidence:
- Automation/security: [40593628190](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628190) — 379 Node tests, 0 failures, 0 skips; 16 Python tests; normal lifecycle install; npm audit 0 vulnerabilities; FFmpeg renderer integration, JS syntax and Python compilation passed.
- Content quality: [40593628137](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628137) — 379 tests, 0 failures, 0 skips.
- Metadata/schedule: [40593628366](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628366) — 379 tests, 0 failures, 0 skips.
- Dashboard E2E: [40593628079](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628079) — 13 Chromium journeys.
- Isolated main/candidate baseline: [40593628185](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628185) — PASS.
- Readiness: [40593628122](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628122) — BLOCKED by 13 production prerequisites.
- Meta draft workflow: [40593628361](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40593628361) — external draft creation skipped.

## Latest verified checkpoint — 27 October 2026, 21:29 UTC

Exact tested candidate SHA: `466605be027f531d1c6143a6d1f42e1bf4c2ffcc`. Automation/security PASS: 373 Node tests, 0 failures, 0 skips; 16 Python tests; normal lifecycle-script install; npm audit 0 vulnerabilities; FFmpeg renderer integration, JS syntax and Python compilation passed. Content-quality and metadata workflows install FFmpeg/ffprobe and explicitly fail if any Node test is skipped; each passed 373 tests with zero skips. Dashboard E2E passed 13 Chromium journeys. Isolated main/candidate baseline passed on the exact candidate SHA. Facebook workflow passed local draft validation only; its remote draft-creation job was skipped. Production readiness remains correctly blocked by 13 genuine production prerequisites.

Implementation fixes at this checkpoint: parent relationship and native association timestamps require strict timezone-qualified, calendar-valid ISO values; FFmpeg is installed in the content-quality and metadata workflows; automation, content-quality and metadata workflows enforce zero skips. Evidence: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772617), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772612), [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772614), [dashboard E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772627), [isolated baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772619), [readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772604), [Facebook draft validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772611).

Verdict: automated code and CI acceptance pass on the exact tested candidate SHA; implementation is partial and production acceptance remains blocked. PR #1 remains open, draft and unmerged. No upload, post, campaign activation, visibility change, merge, main edit or destructive Git operation occurred.

---

> **Current verified checkpoint — assessment SHA `e6bdf05bbda396d462de53f3c5a10dce6108f8f8` (25 October 2026).** Automation/security [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616776): 276 Node tests, 8 Python safety tests, npm audit 0 vulnerabilities, clean normal/locked install. Dashboard E2E [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616798): 10 Chromium journeys, including keyboard-only login and token redaction. Exact isolated baseline [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227617108): main `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate `e6bdf05bbda396d462de53f3c5a10dce6108f8f8` install/Node/Python checks exited 0. Production readiness is still BLOCKED; Facebook draft workflow was SKIPPED. Never bypass readiness, retry an uncertain upload, publish, activate Safari, or treat a draft as approval. External identity, real media/rights, cadence, recovery and deployment acceptance remain outstanding.

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

> **Current release status — 2026-10-25:** See the [authoritative current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-25.md). Exact tested code/test SHA: `e56e3f5a328590a2b54849299a9fabc09df02f25`. Automated checks pass (244 Node tests, 8 Python tests, 7 Chromium E2E tests, locked and normal clean installs, and zero npm-audit vulnerabilities). **Code acceptance remains BLOCKED** by incomplete full dashboard-control coverage and divergent-history review; **production acceptance remains BLOCKED** by genuine media/rights, account authorization, external integration, recovery and deployment gates. This status supersedes older checkpoint wording where it conflicts.

# Final operations runbook

## Authoritative current acceptance status — 25 October 2026

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

## Historical release assessment — 24 October 2026 (superseded)

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

### Current acceptance register

| Gate | Status | Evidence / next action |
|---|---|---|
| Node.js automated tests | PASS | 207 passed, 0 failed, 0 skipped on exact test head. |
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

## Historical checkpoint material


- Latest verified code/test checkpoint: `1155263c25e85f901b9245fd4e024898a1af6f19`. Later commits update documentation only. Base `main`: `45352b73bb6cc4787b2a49988b575afb754ab627`. PR #1 remains open, draft and unmerged; use PR #1 for the exact live documentation HEAD and comparison.
- All three validation workflows and the daily Facebook draft workflow passed on the exact code/test checkpoint: [automation — run 40091734573](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734573), [metadata — run 40091734584](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734584), [content quality — run 40091734600](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734600), [daily Facebook draft — run 40091734576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576). Each reports 139 Node tests passed, 0 failed, 0 skipped. Automation also passed 8 Python safety tests, JavaScript syntax checks and Python compilation. CI verified `npm ci --ignore-scripts` (46 packages added, 47 audited); ordinary `npm ci` remains unverified.
- Daily Facebook draft automation generates an idempotent research-only JSON package using `Africa/Johannesburg`, checks local editorial state where available, assigns an 08:00/18:00 experiment arm and retains an artifact. [Verified artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856). The observed run detected the 08:00 SAST slot had passed and returned `MISSED_SLOT_REVIEW_REQUIRED`; it did not backdate or batch-publish. Scheduled triggers execute only on the default branch; PR #1 remains draft, so this is not an active production daily trigger.
- Facebook approval fingerprints bind claims/source and media/licensing/provenance/disclosure fields. Keyed Meta credential fingerprints invalidate old Page permission attestations after Page token, user token or operator-secret rotation. These tests do not establish real Page identity, current permissions, Page Insights, licence authenticity or publication.
- npm audit reports 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`. A major Google API client upgrade remains untested and unapplied.
- YouTube publication policy is now a rolling `long_form → long_form → short` cycle with 72 elapsed hours between consecutive actual publications (216 hours for three cyclic gaps). Tuesday/Saturday remains draft-only; stale weekly-count fields are removed; live history reconciliation and explicit private-upload authorization remain required. Public YouTube publishing remains disabled.
- Production acceptance remains blocked by genuine rights-cleared media/manifests and full decode/playback, final-hash-bound human review, secure verified SonicVhibez OAuth identity, explicit authorization for a private upload and verified receipt, owner-run restart/restore acceptance, complete remote history reconciliation, and owner-provided Meta Page credentials/permissions plus a reviewed real Facebook test operation. Safari remains inactive pending exact HTTPS destination, disclosure and approval.

---

## Last fully verified code checkpoint before this documentation refresh — 2026-10-24

- Verified code/test HEAD: `68dd24f7a369a8bdb4ddb2513127e9bf3a0044e3`; PR #1 was open, draft and unmerged against `main`. The subsequent commits in this documentation refresh change documentation only; the final branch HEAD and its CI are reported in the PR description and completion response.
- All three GitHub Actions validation workflows passed on that exact code/test HEAD, each with 107 passed, 0 failed, 0 skipped: [automation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496654), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496646), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496600).
- The automation run passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and 8 Python safety tests. The metadata workflow intentionally verifies that `npm run check` fails closed while production metadata remains incomplete; that is a successful safety check, not production readiness. Plain `npm ci` without `--ignore-scripts` remains unverified.
- Schedule implementation converts configured 17:00 local time with IANA timezone rules, validates elapsed-hour gaps and local dates, and applies schedule/spacing checks to dashboard draft creation, draft updates and direct job creation. The dashboard state/readiness responses and CLI production-readiness report explicitly show that complete remote channel history reconciliation is required before upload. The Tuesday/Saturday slots remain draft preparation only.
- The rolling three-publication cycle is implemented in configuration, queue validation and the pre-upload history gate. The Tuesday/Saturday schedule remains draft preparation only. Live owner-reviewed history reconciliation, OAuth verification and a separate private-upload authorization remain blocked; public publishing stays disabled.
- Production acceptance remains blocked by genuine rights-cleared source media and manifests, real rendered and fully decoded exports, human review bound to final hashes, secure live SonicVhibez OAuth identity verification, one explicitly authorized private upload with remote private-status receipt, and owner-run restart/backup-restore acceptance. Safari remains inactive until exact HTTPS destination, disclosure and owner approval exist.

# SonicVhibez operations runbook

This repository is a draft-generation and gated private-upload system. It is not an unattended public-publishing system.

## Scheduled draft generation

The workflow `.github/workflows/free-narration-artifact.yml` runs Tuesdays and Saturdays at 15:00 UTC (17:00 in South Africa while SAST is UTC+2). It generates a US-English narration package, estimated SRT captions, a 1080x1920 text-led review video, and a thumbnail/provenance record. GitHub-hosted scheduled workflows can be delayed; the cadence is a target, not a guaranteed delivery SLA.

Open Actions → Generate free narration audio to inspect the latest run. Download the `sonicvhibez-short-draft-package` artifact. The package includes:
- `rendered-drafts/*-DRAFT.mp4`: text-led visual review draft, not a finished wildlife documentary;
- matching `.json`: held metadata;
- `thumbnail.jpg` and `thumbnail-rights-evidence.json`;
- queue package narration `.mp3`, script `.txt`, and estimated captions `.srt`.

## Before any upload

1. Listen to the complete narration and watch the entire MP4.
2. Check each factual statement against reliable sources; correct any claim that cannot be verified.
3. Replace the text-only visuals with suitable wildlife footage only when each clip's license/permission and required attribution have been checked. Keep evidence for every asset.
4. Check that the voice, audio, visuals, music, thumbnail, and captions are suitable for publication; align captions to actual speech.
5. Confirm the thumbnail represents the actual video and is not misleading.
6. Check the title and description, including clear disclosure that the Selar resource is promotional.
7. Keep the only permitted product URL exactly `https://selar.com/0u19v8u99l`.
8. Confirm the destination channel is SonicVhibez. Never use the Nature Frontiers YouTube channel for these promotions.

## Prepare reviewed metadata

Create or edit `content/next-short.json` from the JSON matching the selected artifact's MP4. Preserve the exact `queueItemId`, `title`, and `productUrl` from that artifact so the handoff workflow can match them. Do not mark a review complete until it actually is.

Only after completing the checks above, set:
- `status`: `READY_FOR_PRIVATE_UPLOAD`
- `channelId`: the verified SonicVhibez YouTube channel ID (must match the GitHub secret)
- `rightsConfirmed`: `true` only after documenting rights for all final media
- `complianceReviewed`: `true` only after factual, disclosure, platform-policy, and metadata review
- `visibility`: `private`

Never set these values just to bypass the gates.

## Private upload handoff

1. Add the four GitHub Actions repository secrets: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, and `SONICVHIBEZ_CHANNEL_ID`. Use YouTube OAuth credentials authorized for the intended channel. Never commit secrets or paste them into logs.
2. Open Actions → Upload reviewed artifact privately → Run workflow.
3. Enter the successful draft-generation run ID as `source_run_id`; set `reviewed_metadata_path` to `content/next-short.json` unless you have deliberately added a different reviewed JSON file to the repository.
4. Inspect the run log and receipt artifact. Confirm the uploaded video's visibility is private and the returned channel/video identifiers are correct.
5. If any gate fails, do not weaken the gate. Correct the underlying issue and retry.

## Public posting

Public publishing is deliberately disabled. The project does not currently auto-publish public videos or guarantee that the two scheduled jobs will run exactly on time. Do not enable public posting until the end-to-end private workflow is verified, media rights and platform compliance are established, and an explicit publishing authorization is provided.

## Current known limitation

The automated renderer creates a polished text-led draft. It does not automatically source, license, or edit wildlife B-roll into a finished documentary. A thumbnail provenance record does not establish rights to any video footage. All such rights remain unconfirmed until reviewed by a human.


## Current release evidence snapshot — 2026-10-24

Current tested code candidate: `9dd102f9636a5ba71c797cf79c104d3616cbe14e`. Exact-SHA automation validation [40122567804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567804) passed with advisories: 205 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; 16 queue topics validated; JavaScript syntax and Python compilation passed. Metadata [40122567802](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567802), content quality [40122567799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567799), and locked installation [40122564222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122564222) passed. Daily Facebook draft [40122567717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567717) was **SKIPPED** on the PR event and does not prove a default-branch artifact. The restore code now rejects symlinked destination paths before writing, with regression tests in `test/backup-restore.test.mjs`. Four moderate dependency advisories remain. This snapshot is historical for the tested code candidate; see [the current release register](GO_LIVE_BLOCKERS.md) for owner actions and production blockers. This docs-only update is not represented by the run links above; its exact-head CI is recorded in PR #1 after completion. Verdict: **CODE-LEVEL ACCEPTANCE BLOCKED; PRODUCTION ACCEPTANCE BLOCKED**.


## Latest live checkpoint — 26 October 2026

Tested application/test SHA: `a912d3c724195fb1f3ca823d186cddf8b9b4f984`. Exact-SHA CI: automation/security **PASS** (306 Node tests, 0 failures/skips; 8 Python tests; npm audit 0 vulnerabilities; clean install/syntax checks) [run 40302828218](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828218); content quality **PASS** [40302828279](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828279); metadata **PASS** [40302828303](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828303); dashboard E2E **PASS** [10 tests, run 40302828398](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828398); isolated main/candidate baseline **PASS** [40302828254](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828254). Production readiness **BLOCKED** [40302828489](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828489); Facebook daily draft **SKIPPED** [40302828351](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828351).

Change: [`3dbccd1`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/3dbccd19584cb9da81e646cb9c34a65184fcd47b) hardens script research input validation; [`a912d3c`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/a912d3c724195fb1f3ca823d186cddf8b9b4f984) adds regression tests proving malformed, insecure, placeholder and duplicate research records are rejected before provider access. Current PR HEAD after evidence-document updates is later than the tested SHA; those updates are documentation-only.

Current Git snapshot before these documentation updates: PR HEAD `a912d3c724195fb1f3ca823d186cddf8b9b4f984`, `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 1,322 ahead / 2 behind, 141 changed files. PR remains open/draft/unmerged. Full branch-only history review remains incomplete. Verdict remains **CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED**: authoring is not lifecycle/dashboard integrated; renderer still does not compose a genuine multi-scene storyboard; no production media/rights/human playback evidence; YouTube/Meta identity and history are unverified; cadence decision and exhaustive recovery/deployment gates remain open. No external upload, post, campaign activation, merge, or destructive Git operation occurred.


## Meta adapter safety note — 28 October 2026

The current tested Meta adapter candidate is `ecad7ac2c706983e79c6206bbccb1a6fcaeb3bd9`. For any authorized Meta operation, the adapter requires the remote post ID to contain the exact configured Page ID followed by an underscore and a non-empty suffix. It also rejects symlinked media inputs and files that resolve outside the configured root before image probing or upload. Do not bypass these checks or infer a remote draft from local validation.

Exact-candidate automation/security [40661176042](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176042), content quality [40661176110](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176110), and metadata [40661176011](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40661176011) each passed 399 tests with zero skips; automation passed 16 Python tests, npm audit found zero vulnerabilities, and FFmpeg was installed. Production readiness remains blocked and external draft creation remains unverified. Keep live Meta publishing disabled and do not alter the eight Metricool scheduled records without explicit owner authorization.

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

Operational rule: do not run external Meta mutation unless Page identity/permissions, exact draft, approved media, and schedule policy are independently verified; do not retry uncertain mutations without reconciliation. Keep live Meta publishing disabled.


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

Before accepting captions, run the repository caption synchronization validator against the actual rendered media duration; reject invalid SRT minute/second fields and separately review semantic speech alignment and playback.

## Latest exact-SHA dashboard authorization acceptance — 29 October 2026, 13:20 UTC

- **Tested source/test SHA:** `02fd8f03b4730dca5c01974809314bf2e7f84678`. The application code is unchanged by this checkpoint; the regression test expands the dashboard mutation-route authorization matrix.
- **Implemented:** `test/dashboard-server.test.mjs` now discovers all 28 declared mutating API routes and verifies that both missing and invalid operator tokens receive HTTP 401 and an authentication error before request validation or state mutation.
- **Exact-SHA evidence:** [automation/security](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532626) PASS — 421 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities. [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532402) PASS, [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532528) PASS, [dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532606) PASS, [isolated main/candidate baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532588) PASS, and [non-destructive branch inventory](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532386) PASS.
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532384) remains blocked/fail-closed. [Nature Frontiers draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532420) passed local validation, but does not prove real provider-side draft creation/read-back.
- This closes only the missing/invalid-authentication negative-path slice for mutating routes. **DASH-001 remains NOT_TESTED** because all controls/forms/routes still need their complete behavior-specific success, validation, duplicate/concurrency, durable-state, failure/recovery, audit and accessibility acceptance.
- Live refs at this candidate: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 2,118 ahead / 2 behind / 178 changed files. PR #1 remains open, draft and unmerged.
- No live upload/post, campaign activation, visibility change, Metricool schedule mutation, PR merge, main edit or destructive Git operation occurred. Public/unattended YouTube and live Meta publishing remain disabled; Nature Frontiers remains prohibited as a YouTube target; Safari remains inactive.

Operational deployment/monitoring/rollback acceptance remains NOT_TESTED; this workflow evidence does not substitute for a deployment drill.

## Latest exact-SHA dashboard API authentication acceptance — 29 October 2026, 13:25 UTC

- **Tested source/test SHA:** `9229671e82180eadb92411cdd5ac9e649da79fdb`. Application implementation is unchanged; regression coverage now includes protected read and mutating API declarations.
- **Implemented:** `test/dashboard-server.test.mjs` derives protected API routes from the source inventory and verifies missing and invalid operator tokens return HTTP 401 with an authentication error before validation or mutation on all **35 protected API route declarations: 28 mutating routes and 7 GET routes**.
- **Exact-SHA automation/security PASS:** [run 40881209227](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209227) — 421 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe and syntax/compilation checks passed.
- **Exact-SHA acceptance workflows:** [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209267), [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209407), [dashboard browser E2E PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209155), [isolated main/candidate baseline PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881198843), [non-destructive branch inventory PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209440).
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209299) remains BLOCKED/fail-closed. [Nature Frontiers draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209154) passed local candidate validation, but its external `create-draft-package` job was SKIPPED; no live Meta draft/read-back is proven.
- This closes the protected API authentication negative-path slice only. **DASH-001 remains NOT_TESTED**: all 105 controls and 15 forms and every route still need behavior-specific success, validation, repeat/concurrency, persistence, failure/recovery, audit and accessibility acceptance.
- Live refs at the tested candidate: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 2,120 ahead / 2 behind / 178 changed files. PR #1 remains open, draft and unmerged.
- No live upload/post, campaign activation, visibility change, Metricool schedule mutation, PR merge, main edit or destructive Git operation occurred. Public/unattended YouTube and live Meta publishing remain disabled; Nature Frontiers remains prohibited as a YouTube target; Safari remains inactive.

A real deployment, monitoring, backup/restore and rollback drill remains NOT_TESTED; CI and isolated baseline evidence are not a substitute.
