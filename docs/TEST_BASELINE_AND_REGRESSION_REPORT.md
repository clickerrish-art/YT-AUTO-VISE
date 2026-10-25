> **Current verified checkpoint — assessment SHA `e6bdf05bbda396d462de53f3c5a10dce6108f8f8` (25 October 2026).** Automation/security [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616776): 276 Node tests, 8 Python safety tests, npm audit 0 vulnerabilities, clean normal/locked install. Dashboard E2E [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616798): 10 Chromium journeys, including keyboard-only login and token redaction. Exact isolated main/candidate baseline [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227617108): main `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate `e6bdf05bbda396d462de53f3c5a10dce6108f8f8` installs, Node tests and Python tests all exited 0. Metadata/content quality passed. Production readiness remains BLOCKED; Facebook draft workflow was SKIPPED. PR #1 remains open/draft/unmerged and main unchanged. Cadence approval, genuine rights-cleared media, live YouTube/Meta verification, full dashboard/recovery/deployment acceptance, divergent-history review and branch protection remain unresolved. No upload or publication occurred.

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

# Test baseline and regression report

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

## Historical checkpoint material


- Tested code HEAD: `e36f3fb288df257e71605e9f8e51f4941a9253ab`.
- Exact-HEAD CI: [automation run 40095077502](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40095077502), [content quality run 40095077405](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40095077405), and [metadata run 40095077505](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40095077505) passed. Each reports 147 Node tests passed, 0 failed, 0 skipped. Automation also reports 8 Python safety tests passed and completed locked installation, JavaScript syntax/Python compilation, campaign and queue checks.
- The new mocked history-restoration tests cover artifact download/persistence, malformed archive failure, HTTPS API origin enforcement, bounded archive size, exact same-day artifact reuse and conflicting-artifact rejection. These do not prove real default-branch artifact retrieval.
- The daily workflow [run 40095077449](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40095077449) was intentionally skipped on the PR branch. A default-branch scheduled/manual run is still required to verify actual artifact restoration.
- Latest npm audit: 4 moderate, 0 high, 0 critical advisories (`gaxios`, `googleapis`, `googleapis-common`, `uuid`). The available `googleapis` fix is a major upgrade; no blind upgrade was applied.
- PR #1 remains open, draft and unmerged. Public YouTube and Facebook publishing remain disabled. No live Meta post or YouTube upload is claimed.

---

# Release evidence snapshot — prior checkpoint cb6ca43b7723d903c3e6b78fd3ed662a13498b04 (2026-10-24)

This section records evidence from the preceding branch checkpoint; the commit containing this correction is documentation-only and is not covered by the run links below. See PR #1 for the live branch HEAD and exact current-HEAD workflow links. This is not production acceptance.

- At the preceding evidence checkpoint the implementation branch was `codex/marketing-machine-audit-fixes`, based on `main` at `45352b73bb6cc4787b2a49988b575afb754ab627`. Re-fetch live refs from PR #1 before relying on current counts. PR #1 remains open, draft and unmerged. The last code/test checkpoint remains `703a7d380a63f0d379ca17f0b920279597ea58be`.
- At checkpoint `586e5404ceabf399375e59fc0adad95389367408`, the following PR workflows succeeded: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868763), [metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868753), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868796). The lockfile verification run is [40084865929](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084865929). The lockfile workflow ran `npm ci --ignore-scripts`, 112 Node tests, schedule/campaign validators and syntax checks; it did not execute the lockfile refresh/commit steps because no refresh was needed.
- The automation log at checkpoint `586e5404ceabf399375e59fc0adad95389367408` reports 112 Node tests passed, 0 failed, 0 skipped; Python safety tests: 8 passed. Campaign validation passed, 16 queued topics were held for review, public publishing was disabled, and JavaScript/Python syntax checks passed.
- The automation install at that checkpoint used `npm ci --ignore-scripts` (46 packages added, 47 audited). Plain `npm ci` without `--ignore-scripts` has not been verified.
- Current npm audit: 4 moderate, 0 high, 0 critical. Affected packages/ranges reported by the audit: `gaxios` 6.4.0–6.7.1 (via `uuid`); `googleapis` 33.0.0–149.0.0 (via `googleapis-common`); `googleapis-common` <=7.2.0 (via `uuid`); `uuid` <11.1.1 (v3/v5/v6 buffer bounds-check advisory). npm reports the available `googleapis` fix as 178.0.0, a major upgrade. Do not upgrade blindly; evaluate runtime compatibility and rerun the full suite. Dependency tree is not vulnerability-free.
- Production acceptance remains **BLOCKED**: the rolling cycle and fail-closed history gate are implemented but live channel history/OAuth have not been accepted; genuine assets, retained rights evidence and final-hash human review are absent; one explicitly authorized private upload/remote receipt is unverified; owner-run restart/backup/restore acceptance is outstanding. Safari remains inactive pending exact HTTPS destination, truthful disclosure and explicit owner approval.
- Public publishing remains disabled. GitHub Actions success does not prove that scheduled workflows are active on `main`, and does not prove production media, real rights, live OAuth, upload acceptance or restore acceptance.
- The malformed content-quality URL formerly in PR #1 was corrected to run [40084868796](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868796).

---

## Verified code/test checkpoint and documentation-refresh status — 2026-10-24

- The most recent code/test checkpoint is `703a7d380a63f0d379ca17f0b920279597ea58be`; it passed all three validation workflows: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084232036), [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084232050), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084232178). Logs show 112 Node tests passed, 0 failed, 0 skipped; Python safety tests and syntax/compilation checks also passed.
- A subsequent documentation-only refresh on this branch updated the evidence sections. Its current branch HEAD and its own CI runs are recorded in PR #1; do not mistake the code/test checkpoint above for the documentation commit SHA.
- The [lockfile workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084228825) passed on the code/test checkpoint, including `npm ci --ignore-scripts`, Node tests, schedule/campaign validation and syntax checks. Plain `npm ci` without `--ignore-scripts` remains unverified.
- The latest verified automation audit reports four moderate npm advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`, with no high/critical findings. The available Google API client fix is a major version upgrade and needs compatibility testing. Do not describe dependencies as vulnerability-free.
- Production acceptance remains blocked by owner-supplied genuine rights-cleared media, full decode and human playback review bound to final hashes, secure live SonicVhibez OAuth identity verification, a complete owner-reviewed channel-history reconciliation, one explicitly authorized private upload with a remotely verified private-status receipt, and owner-run restart/backup-restore acceptance. Safari remains inactive until exact HTTPS destination, truthful disclosure and explicit owner approval exist.
- Public publishing remains disabled. The rolling `long_form → long_form → short` publication cycle requires at least 72 complete elapsed hours between each consecutive actual publication (216 hours minimum for three cyclic gaps). Tuesday/Saturday remains draft preparation only; it is not represented as publication cadence.

## Historical checkpoint — superseded by the verified code/test checkpoint above


## Historical checkpoint — superseded by the latest verified checkpoint


# Test Baseline and Regression Report

## Historical checkpoint — superseded by the latest verified checkpoint above

The code/test commit `62b1bd599d63c3ab1d55b6a6660740fbf3d44157` passed all three GitHub Actions validation workflows with 100 passed, 0 failed, 0 skipped in each: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495157), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495128), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495162). The automation run completed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python compilation.

The later documentation checkpoint `b505a260570afb23de637d599868e55376a827aa` also passed all three workflows with 100 passed, 0 failed, 0 skipped: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034769), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034706), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034728). It was documentation-only relative to the tested code/test commit.

The implemented safeguards include: full production preflight at dashboard readiness; required operator identity in audit events; rights-record hash verification and rechecking retained source/licence file checksums before upload; checksummed backup/restore of state, audit history, rights records, review approvals, upload attempts and receipts; and fail-closed refusal to overwrite a different upload ledger. `.gitignore` excludes local secrets, state, rights records, backups and generated media.

These are automated/code-level checks, not proof of genuine licence authenticity, human playback review, real wildlife renders or a live YouTube upload. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

## Historical implementation checkpoint — 24 October 2026 (superseded)

Code and regression-test commit: `6b0874b870343cf435099eedf74038bf2e01f58c`. The three GitHub Actions validation workflows passed on this exact commit: 95 tests passed, 0 failed, 0 skipped in each workflow. [Automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083877), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083898), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083943). The automation workflow completed `npm ci --ignore-scripts` and installed/audited 46 packages.

The dashboard `/readyz` endpoint now runs the full production-readiness preflight, includes actionable blockers, and returns HTTP 503 with `ready: false` when owner-controlled or production prerequisites remain unmet. This is not proof of real wildlife media, license authenticity, human playback review, live OAuth identity, or a real YouTube upload. Public publishing remains disabled and PR #1 remains open, draft and unmerged.


## Historical acceptance checkpoint — 24 October 2026 (superseded)

Tested implementation commit: `c39c3b88eefb3430dcfedbc0663bef33ad03f45c`. GitHub Actions ran the full Node suite at this commit: 95 passed, 0 failed, 0 skipped. [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766) all passed. The automation workflow also completed `npm ci --ignore-scripts` successfully.

Short and long-form renderers now fail closed on technical export validation errors. This code-test result does not mean a genuine wildlife MP4 was produced: the production manifests and rights-cleared assets are still absent. No live OAuth identity, real private upload, or remote receipt is claimed. Public publishing remains disabled; PR #1 remains draft and unmerged.

## Results

| Run | Commit tested | Result | Link |
|---|---|---|---|
| Content quality | `c39c3b88eefb3430dcfedbc0663bef33ad03f45c` | 95 tests, 95 pass, 0 fail, 0 skipped | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766 |
| Automation validation | `c39c3b88eefb3430dcfedbc0663bef33ad03f45c` | 95 tests, 95 pass, 0 fail, 0 skipped | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712 |
| Metadata/schedule validation | `c39c3b88eefb3430dcfedbc0663bef33ad03f45c` | 95 tests, 95 pass, 0 fail, 0 skipped; schedule/captions passed | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732 |
| npm clean install | `c39c3b88eefb3430dcfedbc0663bef33ad03f45c` | `npm ci --ignore-scripts` passed; 46 packages installed/audited | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712 |
| Main baseline | `45352b73bb6cc4787b2a49988b575afb754ab627` | 54 tests passed, 0 failed | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047 |

## Coverage represented by automated tests

- Dashboard authentication, local state persistence, real draft operations, campaign state operations and audit history.
- Cross-process slot reservation, idempotent creation, schedule-date validation, lease transitions and stale worker protection.
- Rights evidence shape, review checksum binding and blocked attempts to bypass review.
- Private-only uploader preconditions, authenticated channel identity checks, durable pre-upload ledger, uncertain remote timeout, receipt persistence failure, reconciliation-only recovery and no blind retry.
- Campaign separation, exact Selar URL, inactive Safari defaults, schedule/workflow agreement and public publishing disabled.
- Caption, metadata and asset-register preflight.

## Important limits

- GitHub Actions tests exercise mock YouTube clients for failure scenarios; they are not proof of a real external YouTube integration.
- `npm ci --ignore-scripts` was run; plain `npm ci` without `--ignore-scripts` is not separately claimed.
- No production wildlife MP4, actual thumbnail or real-media checksum/duration/dimensions are claimed because legitimate assets and rights evidence were unavailable.
- Live OAuth identity verification, real private upload, remote receipt verification and real-world rights validation remain blocked on owner-provided prerequisites.
- The test suite does not turn public publishing on; it remains disabled.


## Acceptance gate references

See [GO_LIVE_BLOCKERS.md](GO_LIVE_BLOCKERS.md) for current owner-dependent blockers and [RELEASE_GATE_CHECKLIST.md](RELEASE_GATE_CHECKLIST.md) for the exact evidence required before release. No live-media render or live private upload is claimed. Public publishing remains disabled.


## Previous branch-head CI checkpoint (superseded)

Docs-only branch head `460f57fdddc48b8eb163ba452e6044a434c0bceb` passed all three validation workflows with 95 passed, 0 failed and 0 skipped: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073783190), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073783221), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073783180). The workflow ran `npm ci --ignore-scripts` and reported 46 packages added/audited. Plain `npm ci` without the flag remains unverified. These tests do not prove real media rendering or a live YouTube upload.


## Historical implementation checkpoint — superseded by the latest verified checkpoint above

- Historical checkpoint only: `4ba995bc51ed2ae0513bc312865713a73e0e3160`. This predates the rolling-cycle and history-gate changes and is **not** current release evidence; check the exact latest branch HEAD and its CI before acceptance.
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305593), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305540), and [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305556) all passed on that code HEAD. Each ran 106 tests: 106 passed, 0 failed, 0 skipped. Automation also passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python safety tests. Metadata validation explicitly confirms that `npm run check` fails closed while real production metadata is incomplete; this is not a release-readiness pass.
- Tuesday/Saturday are draft-preparation triggers only. The rolling publication cycle is long-form → long-form → Short with at least 72 elapsed hours between actual publications. The pre-upload gate requires complete remote public/private/unlisted history and reconciliation of uncertain attempts; live acceptance remains blocked until owner evidence and authorization are supplied.
- PR #1 remains open, draft and unmerged. Public publishing remains disabled. No production MP4, thumbnail, rights clearance, human playback acceptance, live OAuth identity check, private upload receipt, or owner-run restore acceptance is claimed.
- Remaining owner-controlled gates: genuine rights-cleared source assets and completed manifests; rendered/decoded media and human review; secure OAuth identity verification for SonicVhibez; explicit per-operation private-upload authorization; operational backup/restore acceptance. Safari remains inactive until exact destination, disclosure, and owner approval exist.

## Verified branch-head checkpoint — 2026-10-24 (documentation commit pending revalidation)

- Exact tested code HEAD: `7b5a97da38a9716f49b19682c117f1b8a195afe4`; base `main` SHA: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- The three PR workflows completed successfully on that exact HEAD: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40083885872), [metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40083885858), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40083885897).
- Automation job evidence: Node test suite reported 112 tests, 112 passed, 0 failed; queue invariant check confirmed 16 held/review-state topics, the exact approved Selar destination, and publishing disabled. JavaScript syntax checks and Python compilation completed successfully. Install path was `npm ci --ignore-scripts`.
- Dependency audit: 4 moderate findings, 0 high, 0 critical. Reported paths/advisories include `gaxios` (range 6.4.0–6.7.1, fix available via `uuid`), `googleapis` (range 33.0.0–149.0.0; suggested fix `googleapis@178.0.0`, a major upgrade), `googleapis-common` (<=7.2.0; major-upgrade fix path), and `uuid` (<11.1.1; buffer-bounds-check issue). Do not call the dependency tree vulnerability-free; compatibility assessment and remediation remain open. CI deliberately warns rather than suppressing the audit.
- This checkpoint verifies automated repository checks only. It does not establish plain `npm ci`, live OAuth, genuine rights clearance, actual production media, human playback acceptance, a live private upload, or operator-run restore acceptance.
- The report was updated after the above test runs. Any commit containing this documentation update must be revalidated independently; these links apply to `7b5a97da38a9716f49b19682c117f1b8a195afe4`, not to a later documentation commit.


## Historical release evidence snapshot — 24 October 2026 (superseded)

Current tested code candidate: `9dd102f9636a5ba71c797cf79c104d3616cbe14e`. Exact-SHA automation validation [40122567804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567804) passed with advisories: 205 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; 16 queue topics validated; JavaScript syntax and Python compilation passed. Metadata [40122567802](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567802), content quality [40122567799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567799), and locked installation [40122564222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122564222) passed. Daily Facebook draft [40122567717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567717) was **SKIPPED** on the PR event and does not prove a default-branch artifact. The restore code now rejects symlinked destination paths before writing, with regression tests in `test/backup-restore.test.mjs`. Four moderate dependency advisories remain. This snapshot is historical for the tested code candidate; see [the current release register](GO_LIVE_BLOCKERS.md) for owner actions and production blockers. This docs-only update is not represented by the run links above; its exact-head CI is recorded in PR #1 after completion. Verdict: **CODE-LEVEL ACCEPTANCE BLOCKED; PRODUCTION ACCEPTANCE BLOCKED**.

## Addendum — regression restoration verification (24 October 2026, 20:10 UTC)

This addendum supersedes the earlier branch-count and test-file notes above where they conflict.

- Current implementation branch commit at the time of verification: `c507b63abfa336165865ad01cf6354ae50254f04`.
- [Automation validation run 40128537077](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40128537077) completed **PASS** on that exact SHA: **209 Node tests passed, 0 failed, 0 skipped**. This includes the restored `test/restore-facebook-draft-history.test.mjs` regression tests for successful cross-run artifact restoration, malformed-archive fail-closed behaviour, HTTPS-only API configuration and oversized-response rejection.
- [Production readiness run 40128537135](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40128537135) produced and retained a diagnostic artifact (artifact ID `12574685153`, expires 23 November 2026), then exited nonzero because mandatory production gates remain blocked. This is the intended fail-closed result, **not** production acceptance.
- The regression test was recovered from historical commit `71578dafc24e5d48173dce3f4e392e18e42aa40e` and committed separately; no merge, reset, force-push or history rewrite was performed.
- The branch now has **898 commits ahead, 2 behind** `main`, with **95 changed files**. Merge base remains `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` was `fa00d28e7f58911482686e4ad69fac9f4701a2e6` at this comparison.
- Browser-driven dashboard acceptance, genuine media and rights review, real YouTube OAuth/channel/history reconciliation, an explicitly authorized private upload, Facebook default-branch draft artifact verification, and owner-controlled recovery/restart drills remain **NOT RUN / BLOCKED**. No external post or upload was performed.

The above is CI evidence for commit `c507b63abfa336165865ad01cf6354ae50254f04`. Any later code or documentation commit requires its own exact-SHA checks before it can be described as the latest verified head. Production remains **BLOCKED**.


## Dashboard UI contract regression — 24 October 2026

The dashboard had a stale hardcoded Tuesday/Thursday/Saturday summary even though the authoritative draft-preparation schedule is Tuesday long-form and Saturday Short. Thursday was visibly selectable but rejected by the server. The UI now renders slot/day/format options from `state.schedule.schedule`, displays the rolling cycle and minimum spacing from the same API response, and accurately describes the default-off Meta adapter. Regression coverage is in `test/dashboard-ui-contract.test.mjs`.

Exact candidate `7490e0caa966861ba16a6af023fb45d0914d9a34` passed [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571307): 211 Node tests passed, 0 failed; 8 Python tests passed; clean `npm ci` passed; audit reported 0 vulnerabilities. [Metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571317) and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571311) also passed. The readiness workflow remains blocked intentionally and the Facebook draft workflow is skipped for PR events.

The UI regression test is not a real browser test. Browser E2E, genuine media/rights review, live YouTube identity/history, authorized private upload, default-branch Facebook draft artifact, and owner-run recovery drills remain unverified. Production acceptance is **BLOCKED**.


## Playwright browser acceptance and mobile regression — 24 October 2026

Exact source candidate `e1afbdc51745ef18e47f12a93629674c76dc73a0` passed [Chromium browser E2E run 40130547249](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130547249): 1 test passed. The test connected to the actual local dashboard/backend using an isolated temporary state directory and a test-only token; verified unauthenticated rejection, authoritative schedule/cycle display, draft/job creation and persistence, duplicate-ID rejection, fail-closed `/readyz` (503), and a 375px mobile viewport.

The initial browser run failed the mobile overflow assertion. Diagnostics traced it to long unbroken environment-variable names in fail-closed Meta status messages. CSS now applies `overflow-wrap:anywhere` to blocked/notice messages and permits flex-row children to shrink. The subsequent exact-source browser run passed.

[Automation run 40130550675](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550675) passed 211 Node tests, 8 Python safety tests, clean install and queue checks; npm audit reported 0 vulnerabilities. The Playwright pin was upgraded from 1.55.0 to 1.64.1 after the audit surfaced high-severity certificate-verification advisories, and the lockfile was regenerated. [Metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550684) and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550761) also passed. [Readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550732) remains blocked intentionally; [Facebook draft on PR](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550704) was skipped.

This is browser acceptance of the local operator journey only. It is not evidence of live OAuth/channel identity, rights-cleared exports, private upload, default-branch Facebook artifact or recovery drills. No real upload or post occurred; production remains **BLOCKED**.


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
