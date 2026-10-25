# Project completion audit

## Authoritative current acceptance status — 25 October 2026

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Automated checks pass on the exact code/test SHA below, but full dashboard-control acceptance, complete divergent-history review, isolated recovery drills, real-account integration and deployment acceptance remain incomplete.

### Exact Git state
- Implementation branch: `codex/marketing-machine-audit-fixes`; tested code/test SHA: `e56e3f5a328590a2b54849299a9fabc09df02f25`.
- Current PR HEAD will be a documentation-only descendant of this tested candidate; see [live PR metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- At the tested code/test candidate, comparison was **1,036 ahead, 2 behind, 110 changed files**; subsequent documentation-only commits add no application-code changes. Use the live PR metadata for the current-head comparison. The full branch-only history has not been reviewed patch by patch. PR #1 remains open, draft and unmerged. No direct `main` edit or destructive history operation was performed.

### Exact-SHA CI
- [Automation/security — run 40181771250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771250): **PASS** — 244 Node tests, 0 failed/0 skipped; 8 Python tests; locked and normal `npm ci`; Google API import; JS syntax/Python compilation; 16 queue items; `npm audit`: 0 vulnerabilities across 49 packages.
- [Browser E2E — run 40181771259](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771259): **PASS** — 6 Chromium journeys against the local dashboard/backend; not every visible control is covered.
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

### Current acceptance register

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


## Historical checkpoint — superseded by current branch-head verification


# SonicVhibez Marketing Machine — Acceptance Audit

## Historical checkpoint — superseded by the current verified baseline above

The code/test commit `62b1bd599d63c3ab1d55b6a6660740fbf3d44157` passed all three GitHub Actions validation workflows with 100 passed, 0 failed, 0 skipped in each: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495157), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495128), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495162). The automation run completed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python compilation.

The later documentation checkpoint `b505a260570afb23de637d599868e55376a827aa` also passed all three workflows with 100 passed, 0 failed, 0 skipped: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034769), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034706), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034728). It was documentation-only relative to the tested code/test commit.

The implemented safeguards include: full production preflight at dashboard readiness; required operator identity in audit events; rights-record hash verification and rechecking retained source/licence file checksums before upload; checksummed backup/restore of state, audit history, rights records, review approvals, upload attempts and receipts; and fail-closed refusal to overwrite a different upload ledger. `.gitignore` excludes local secrets, state, rights records, backups and generated media.

These are automated/code-level checks, not proof of genuine licence authenticity, human playback review, real wildlife renders or a live YouTube upload. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

## Previous implementation checkpoint (superseded by current code/test checkpoint below) — 2026-10-24

Code and regression-test commit: `6b0874b870343cf435099eedf74038bf2e01f58c`. The three GitHub Actions validation workflows passed on this exact commit: 95 tests passed, 0 failed, 0 skipped in each workflow. [Automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083877), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083898), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083943). The automation workflow completed `npm ci --ignore-scripts` and installed/audited 46 packages.

The dashboard `/readyz` endpoint now runs the full production-readiness preflight, includes its actionable blockers, and returns HTTP 503 with `ready: false` when owner-controlled or production prerequisites remain unmet. The new regression test verifies this fail-closed behavior. This is not proof of real wildlife media, license authenticity, human playback review, live OAuth identity, or a real YouTube upload. Public publishing remains disabled and PR #1 remains open, draft and unmerged.


## Previous acceptance checkpoint (superseded by the latest code checkpoint below) — 2026-10-24

Tested implementation commit: `c39c3b88eefb3430dcfedbc0663bef33ad03f45c`. GitHub Actions ran the full Node suite at this commit: 95 passed, 0 failed, 0 skipped. [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766) all passed. The automation workflow also completed `npm ci --ignore-scripts` successfully.

Short and long-form renderers now fail closed on technical export validation errors. This code-test result does not mean a genuine wildlife MP4 was produced: the production manifests and rights-cleared assets are still absent. No live OAuth identity, real private upload, or remote receipt is claimed. Public publishing remains disabled; PR #1 remains draft and unmerged.

## Evidence-backed status

| Acceptance area | Status | Evidence / remaining boundary |
|---|---|---|
| Authoritative schedule and draft-only UTC workflows | PASS | Schedule validation passed at tested commit; Tue/Thu long-form, Sat Short; 15:00 UTC = 17:00 Johannesburg |
| Draft queue, durable state, stable job IDs, idempotency and cross-process slot locking | PASS | Node regression suite includes process-safe slot and lifecycle cases |
| Local dashboard auth, loopback binding, allowlisted tasks, real state, health/readiness | PASS | Dashboard integration tests start the actual server and exercise authenticated API paths |
| Short and long-form renderers with fail-closed technical export verification | PASS WITH BLOCKED REAL PRODUCTION | Short and long-form renderers now run their standalone full-file export validators before reporting success; missing production manifests and rights-cleared media remain BLOCKED |
| Thumbnail generation and media inspection | IMPLEMENTED; LIVE ARTIFACT BLOCKED | Successful render path invokes FFmpeg thumbnail generation and ffprobe; no rights-cleared wildlife inputs were available for a genuine production render |
| Caption and metadata validation | PASS FOR CHECKS; CONTENT RELEASE BLOCKED | Caption fixtures pass; unreviewed metadata and asset-register examples remain intentionally blocked |
| Structured rights evidence and checksum-bound human review | IMPLEMENTED; OWNER EVIDENCE REQUIRED | Server hashes source and license-evidence files, requires configured operator identity and binds approval to video, thumbnail and metadata versions |
| Artifact-bound approval file | PASS IN CODE PATH | Approval record is atomically written under `run-logs/upload-approvals/`; uploader rechecks every related artifact checksum |
| Private-only uploader and uncertain-outcome recovery | PASS IN AUTOMATED MOCK TESTS; LIVE UPLOAD BLOCKED | Attempt ledger is persisted before insert; timeout/receipt failure tests cover recovery; live OAuth and remote YouTube identity were not exercised |
| Campaign isolation | PASS | Selar is fixed to `https://selar.com/0u19v8u99l`; Safari starts inactive and needs exact HTTPS destination, disclosure and explicit owner approval |
| Clean dependency install | PASS WITH SCRIPTS DISABLED | `npm ci --ignore-scripts` passed in workflow 40037943712; plain `npm ci` without the flag was not separately claimed |
| Node tests at implementation commit | PASS | 95 tests, 95 pass, 0 fail, 0 skipped in each of the three validation workflows |
| Main-branch baseline | PASS | 54 tests, 0 failures: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047 |
| Genuine MP4 and independent playback inspection | BLOCKED | No real rights-cleared Short/long-form artifact was generated in this run; therefore no production MP4 checksum/duration/dimensions are claimed |
| Verified SonicVhibez channel identity and live private upload | BLOCKED | Owner must configure OAuth secrets and independently confirm channel ID through the authenticated API |
| Public publishing | PASS — DISABLED | Schedule and upload workflows remain private/draft-only; no public/unlisted fallback |

## Workflow evidence

At implementation commit `c39c3b88eefb3430dcfedbc0663bef33ad03f45c`, all three validation workflows reported 95 passed, 0 failed and 0 skipped:
- [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766)
- [Automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712)
- [Metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732)

An earlier docs-only branch head `8f5c1186492131be6c644b73c02230a6b29650ce` also passed all three validation workflows with 95 tests, 0 failures and 0 skips:
- [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073678762)
- [Automation validation and `npm ci --ignore-scripts`](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073678805)
- [Metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073678871)

The main-branch baseline is 54 passing tests: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047. These are automated test results; they do not establish genuine media rendering, rights validity or a live YouTube upload. The clean-install workflow uses `npm ci --ignore-scripts`; plain `npm ci` is not claimed. See [go-live blockers](GO_LIVE_BLOCKERS.md) and [release gate checklist](RELEASE_GATE_CHECKLIST.md).

## Exact owner actions to clear external blockers

1. Add source footage, narration and any music that is legitimately licensed for YouTube use; retain original license/permission documents and checksums.
2. Complete `content/render-manifest.json` and `content/long-form-render-manifest.json` using real paths and evidence; render and inspect both actual outputs with FFmpeg/ffprobe and human playback.
3. Start the dashboard locally with a random `DASHBOARD_OPERATOR_TOKEN` of at least 24 characters and `DASHBOARD_OPERATOR_ID` set to the actual authorized operator. Keep `DASHBOARD_HOST=127.0.0.1`.
4. Verify the OAuth account's channel ID through YouTube API, then store `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` and the independently confirmed `SONICVHIBEZ_CHANNEL_ID` in the appropriate secure environment/GitHub Actions secrets.
5. Complete rights verification and human review for the exact rendered MP4, thumbnail and metadata; only then use the uploader with `CONFIRM_PRIVATE_UPLOAD=YES`.
6. Keep Safari inactive until the owner supplies the exact destination and disclosure, reviews the preview and explicitly approves it.

This repository is **not 100% operational for real media release** until the blocked owner-dependent gates above have genuine evidence. No real upload or documentary artifact is claimed.


See [GO_LIVE_BLOCKERS.md](GO_LIVE_BLOCKERS.md) for owner-dependent acceptance gates and [RELEASE_GATE_CHECKLIST.md](RELEASE_GATE_CHECKLIST.md) for per-release evidence requirements.


## Historical implementation checkpoint — superseded by the current verified baseline above

- Historical checkpoint only: `4ba995bc51ed2ae0513bc312865713a73e0e3160`. This predates the rolling-cycle and history-gate changes and is **not** current release evidence; check the exact latest branch HEAD and its CI before acceptance.
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305593), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305540), and [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305556) all passed on that code HEAD. Each ran 106 tests: 106 passed, 0 failed, 0 skipped. Automation also passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python safety tests. Metadata validation explicitly confirms that `npm run check` fails closed while real production metadata is incomplete; this is not a release-readiness pass.
- Tuesday/Saturday are draft-preparation triggers only. The rolling publication cycle is long-form → long-form → Short with at least 72 elapsed hours between actual publications. The pre-upload gate requires complete remote public/private/unlisted history and reconciliation of uncertain attempts; live acceptance remains blocked until owner evidence and authorization are supplied.
- PR #1 remains open, draft and unmerged. Public publishing remains disabled. No production MP4, thumbnail, rights clearance, human playback acceptance, live OAuth identity check, private upload receipt, or owner-run restore acceptance is claimed.
- Remaining owner-controlled gates: genuine rights-cleared source assets and completed manifests; rendered/decoded media and human review; secure OAuth identity verification for SonicVhibez; explicit per-operation private-upload authorization; operational backup/restore acceptance. Safari remains inactive until exact destination, disclosure, and owner approval exist.


## Requirement traceability — verified implementation checkpoint `68dd24f7a369a8bdb4ddb2513127e9bf3a0044e3`

| Requirement | Implementation | Automated tests / CI | Real-world acceptance | Status / next action |
|---|---|---|---|---|
| Rolling 72-hour publication policy | `scripts/schedule-policy.mjs`, `scripts/youtube-history-gate.mjs`, `scripts/upload-private.mjs`, `scripts/validate-schedule.mjs` | New rolling-cycle and history-gate tests added; exact latest-HEAD CI must be checked before acceptance | Complete owner-reviewed remote history, verify OAuth and authorize one private-only upload | **Automated policy implemented; live acceptance BLOCKED** |
| Dashboard authentication, operator attribution and persistent state | `scripts/dashboard-server.mjs`, `test/dashboard-server.test.mjs`, `test/dashboard-task-runner.test.mjs` | 107/107 tests pass on the verified checkpoint | Owner must run the local app with real operator identity and verify restart persistence | Automated pass; operator acceptance outstanding |
| Queue lifecycle, idempotency, leases and interrupted-job recovery | `scripts/content-job-lifecycle.mjs`, dashboard state/lock code, `scripts/replenish-queue.mjs` | `test/content-job-lifecycle.test.mjs`, dashboard integration tests; 107/107 pass | Exercise real operator restart and recovery with local state backup | Automated pass; owner-run restart acceptance outstanding |
| Short/long rendering and export checks | `scripts/render-short.mjs`, `scripts/render-long-form.mjs`, `scripts/validate-short-export.mjs`, `scripts/validate-long-form-export.mjs` | Render/export regression tests; 107/107 pass with fixtures | Supply real licensed assets; render, fully decode, inspect streams and perform human playback review | Pipeline code tested; production artifacts BLOCKED |
| Rights evidence and artifact-bound human review | `scripts/human-review.mjs`, `scripts/upload-private.mjs`, retained rights evidence validators | `test/human-review.test.mjs`, `tests/upload-private.test.mjs`, `tests/upload-safety.test.mjs`; 107/107 pass | Retain genuine licences/permissions and approve exact final hashes | Automated guards pass; genuine rights and editorial acceptance BLOCKED |
| Private-only SonicVhibez upload and uncertain-outcome reconciliation | `scripts/upload-private.mjs`, `.github/workflows/upload-private.yml`, `.github/workflows/upload-artifact-privately.yml` | Upload mocks and fail-closed tests; 107/107 pass | Configure OAuth secrets securely, independently verify channel identity, authorize one private upload, verify remote private status and receipt | Mock tests pass; live upload BLOCKED |
| Campaign destination/disclosure controls | `config/campaigns.json`, `config/products.json`, `scripts/validate-campaigns.mjs`, `scripts/campaign-management.mjs` | `test/validate-campaigns.test.mjs`, `test/campaign-management.test.mjs`; 107/107 pass | Owner review of disclosures; Safari exact HTTPS destination and approval | Selar destination enforced; Safari remains inactive |
| Backup/restore integrity | `scripts/backup-state.mjs`, `scripts/restore-state.mjs` | `test/backup-restore.test.mjs`; 107/107 pass | Owner-run restore drill against an isolated local backup and persisted state | Automated fixtures pass; operational restore acceptance BLOCKED |
| Installation and workflow safety | `package-lock.json`, `.github/workflows/validate-automation.yml`, `.github/workflows/validate.yml`, `.github/workflows/content-quality.yml` | `npm ci --ignore-scripts` passed; Python safety suite 8/8; Node suite 107/107 | Plain `npm ci` has not been verified; no public publishing test is authorized | Supported CI install passes; plain install unverified; public publishing disabled |

**Release decision: BLOCKED.** CI proves the checked-in automated paths and test fixtures only. It does not prove genuine rights, production media quality, human review, live OAuth identity, a real private upload, or owner-run operational recovery.


## Current release evidence snapshot — 2026-10-24

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


## Latest dashboard contract fix and exact-SHA verification — 24 October 2026

- Dashboard fix commit: `2fd87605a50266ad809efde8ea06a0ae668de5a5`; UI contract test commit: `60b2cf71643c7d80416f8c74d5484ecb07eb7ab0`; unsupported Thursday fallback removal: `7490e0caa966861ba16a6af023fb45d0914d9a34`.
- The dashboard no longer hardcodes the obsolete Tuesday/Thursday/Saturday summary. It derives production-preparation slots, rolling format cycle and minimum elapsed spacing from the authoritative API schedule; day/format controls follow that same schedule. The misleading claim that no Meta adapter exists was replaced with accurate default-off/read-only wording.
- Exact candidate `7490e0caa966861ba16a6af023fb45d0914d9a34`: [automation validation 40129571307](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571307) **PASS** — 211 Node tests passed, 0 failed; 8 Python safety tests passed; 16 queue topics validated; normal clean `npm ci` passed; `googleapis` import passed; `npm audit` reports 0 advisories. [Metadata validation 40129571317](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571317) and [content quality 40129571311](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571311) **PASS**.
- [Readiness 40129571315](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571315) remains **BLOCKED as intended** because required real production prerequisites are missing. [Facebook daily draft 40129571331](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40129571331) is **SKIPPED** on the PR event and is not default-branch draft evidence.
- The added `test/dashboard-ui-contract.test.mjs` verifies the stale schedule copy is absent and that the UI reads the authoritative schedule. This is a static UI contract regression test, **not** browser E2E acceptance. No real browser session, rights-cleared production exports, OAuth identity verification, private upload, default-branch Facebook draft artifact, or owner-run recovery drill has been established.
- Branch divergence at this checkpoint: 905 commits ahead, 2 behind; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. PR #1 remains open, draft and unmerged. No real external upload or post occurred. Production acceptance remains **BLOCKED**.


## Browser E2E acceptance and mobile overflow repair — 24 October 2026

- The Playwright dependency is pinned to `@playwright/test@1.64.1`. An initial 1.55.0 pin surfaced high-severity browser-download certificate advisories in `npm audit`; it was upgraded, the lockfile regenerated, and the current audit is clean.
- The first real Chromium run exposed a mobile horizontal overflow caused by long unbroken fail-closed Meta status strings. The UI now wraps those messages; flex-row children also permit shrinking. The regression test now passes at 375px viewport width.
- Exact source candidate `e1afbdc51745ef18e47f12a93629674c76dc73a0`: [browser E2E run 40130547249](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130547249) **PASS**, one browser test; [automation run 40130550675](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550675) **PASS**, 211 Node tests, 0 failures, 8 Python safety tests, clean `npm ci`, zero npm audit advisories and 16 queued topics validated; [metadata run 40130550684](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550684) and [content quality run 40130550761](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550761) **PASS**.
- The browser journey uses a test-only operator token and isolated temporary local state. It verifies API authentication, dashboard connection, schedule and cycle display, local draft/job creation and persistence, duplicate rejection, `/readyz` returning 503 while blocked, and mobile overflow. It does **not** use live YouTube/Meta credentials or create external posts.
- [Readiness run 40130550732](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550732) remains **BLOCKED as intended**; [Facebook PR run 40130550704](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40130550704) is **SKIPPED** and is not evidence of a default-branch artifact.
- Still NOT RUN / OWNER ACTION REQUIRED: production media exports and rights evidence, final-hash human approval, real YouTube OAuth/channel/history reconciliation, separately authorized private upload and receipt, real Nature Frontiers Page verification and default-branch draft artifact, and owner-run backup/restore/restart/concurrency/rollback drills. No real upload or post occurred.
- At this source checkpoint the branch is 925 commits ahead and 2 behind `main`, with 99 changed files and merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. PR #1 remains open, draft and unmerged. Release verdict remains **BLOCKED**.


### Branch reconciliation findings

The two commits present on `main` but not on the implementation branch are `71578dafc24e5d48173dce3f4e392e18e42aa40e` (“Exercise cross-run history restoration with mocked GitHub artifact API”) and `fa00d28e7f58911482686e4ad69fac9f4701a2e6` (“Revert unintended test-file write to default branch”). Inspection of their actual patches confirms the first added `test/restore-facebook-draft-history.test.mjs` and the second removed that same 117-line test. The current `main` tree lacks the file; the implementation branch restores it through commit `c507b63abfa336165865ad01cf6354ae50254f04` and exercises it in the 211-test suite.

The implementation branch remains 926 commits ahead and 2 behind `main`. GitHub’s compare endpoint returns only the first 250 of the 926 branch-only commits in its commit list; the visible history includes repeated operational-document and workflow-adjustment subjects. This is a reviewability risk, not proof that any particular code is invalid. I did not inspect every one of the 926 commits individually and did not merge, cherry-pick, reset, rebase, force-push or rewrite history. Safe next step: owner reviews the 99-file tip-to-base diff and decides an explicit reconciliation/review strategy; keep the current branch and draft PR intact until that approval.

---

## Live implementation addendum — 24 October 2026, 21:12 UTC

This addendum supersedes older checkpoints above for the changes described here. The code/test candidate at this checkpoint is `3438f55cf2261b2efcd1afcca7e67c252fbd1b4a`; the documentation refresh itself is separate from those source changes.

### New defects fixed and regression coverage

- **Facebook recovery receipt integrity:** `scripts/dashboard-server.mjs` no longer silently ignores malformed JSON lines, empty records, truncated final records, missing remote IDs, unreadable files, symlinks, or non-file recovery ledgers. A corrupt receipt ledger now fails startup closed so uncertain remote outcomes cannot be hidden before retry. Added `test/facebook-recovery-ledger-integrity.test.mjs` covering malformed JSON, truncation, missing remote receipt identifiers, and preservation of the original evidence.
- **Caption/media timing:** added `scripts/validate-caption-sync.mjs` and `test/validate-caption-sync.test.mjs`. The validator rejects empty captions, malformed/overlapping cues, invalid duration inputs, and any cue extending beyond the actual expected media duration (with a bounded 250 ms tolerance).
- **Renderer enforcement:** both `scripts/render-short.mjs` and `scripts/render-long-form.mjs` now check caption timing against narration duration before rendering.
- **Dashboard enforcement:** `/api/jobs/validate` independently runs the caption timing gate against the duration reported by `ffprobe`; a direct API caller cannot bypass the renderer's caption-duration check.
- **Operator command:** added `npm run validate:caption-sync -- <captions.srt> <duration-seconds>`.

### Exact-SHA verification

The following runs refer to the code/test candidate SHA above:

- [Automation and security checks — run 40133174746](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133174746): **PASS**, 219 Node tests passed, 0 failed; 8 Python safety tests passed; 16 queued topics passed safe-state/destination checks; normal clean `npm ci` and Google API client import passed; `npm audit` reported 0 vulnerabilities.
- [Browser E2E — run 40133171717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133171717): **PASS**, 3 Chromium tests passed against the real local dashboard/backend, including campaign safety and persistence across a real server restart.
- [Metadata validation — run 40133174647](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133174647): **PASS**.
- [Content quality — run 40133174728](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133174728): **PASS**.
- [Lockfile validation — run 40133171725](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133171725): **PASS**.
- [Production readiness — run 40133174724](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133174724): **BLOCKED as intended**; a blocked readiness check is not a release pass.
- [Facebook daily draft — run 40133174804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133174804): **SKIPPED** on the PR event. The branch push run was also skipped because this workflow is restricted to scheduled/manual execution on `main`. A successful default-branch scheduled/manual draft and retained artifact are **not verified**.

### Current Git and acceptance status

- The live compare at this checkpoint reported **946 commits ahead, 2 behind**, **102 changed files**, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, with `main` at `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. These figures must be recalculated after subsequent commits.
- Commit metadata was inspected across 1,247 branch-history API records. Repeated documentation/workflow commit subjects are present; this is not equivalent to a complete review of every commit's patch. Full historical risk review and owner-approved reconciliation remain open. No merge, reset, rebase, force-push, cherry-pick, or history rewrite was performed.
- Browser tests cover three key operator flows, not every visible dashboard control or every end-to-end production journey. Actual media rendering from genuine rights-cleared footage, caption readability/audio synchronization review, final-hash-bound human approval, real SonicVhibez OAuth/channel identity and full history reconciliation, an explicitly authorized private upload with verified remote receipt, verified Nature Frontiers Page identity/permissions, a default-branch Facebook draft artifact, and owner-controlled backup/restore/concurrency/rollback drills remain unresolved.
- No YouTube upload or Facebook post was performed. Public/unattended YouTube publishing remains disabled; Facebook live publishing remains disabled; approved Selar URL remains `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive.

**Verdict: IMPLEMENTATION INCOMPLETE for full requested scope; production acceptance remains BLOCKED.** The code fixes and passing tests above do not satisfy missing real-media, account, authorization, external-workflow, recovery-drill, or branch-history gates.

---

## Latest recovery-output hardening and exact-SHA acceptance — 24 October 2026, 21:18 UTC

This addendum supersedes earlier code/test counts and branch-comparison figures above.

### Additional implementation
- `scripts/restore-facebook-draft-history.mjs` now rejects symbolic links and non-regular output destinations, checks existing path components before writing, and writes history to a same-directory temporary file before atomic rename. This prevents a configurable history-output path from silently following a symlink and overwriting an unrelated file.
- Added `test/facebook-history-output-safety.test.mjs`, which verifies that a symlinked output is rejected and the unrelated target file and symlink remain unchanged.
- The prior addendum's caption/media timing gate and Facebook recovery-ledger integrity fix remain in place.

### Latest code/test candidate and verification
- **Code/test SHA:** `ca88836b671dabd5f7b4e14ed650fc44e05f5994`.
- [Automation/security — run 40133517078](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133517078): **PASS** — **220 Node tests passed, 0 failed**; 8 Python safety tests passed; clean normal `npm ci`; Google API client import; 16 queue topics passed safe-state/destination checks; `npm audit` reports **0 vulnerabilities**.
- [Browser E2E — run 40133517060](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133517060): **PASS** — 3 Chromium tests passed against the real local dashboard/backend.
- [Metadata — run 40133517246](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133517246): **PASS**.
- [Content quality — run 40133517127](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133517127): **PASS**.
- [Lockfile validation — run 40133512239](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133512239): **PASS**.
- [Readiness — run 40133517136](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133517136): **BLOCKED as intended**; retained diagnostic artifact remains available from the workflow.
- [Facebook daily draft — run 40133517073](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40133517073): **SKIPPED** on the PR event; a successful default-branch scheduled/manual run and retained artifact remain unverified.

### Current status and owner actions
- Live compare after these code/test commits: **950 commits ahead, 2 behind**, **103 changed files**, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; default branch `main` remains at `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- The full patch/history review remains incomplete: commit metadata shows repeated documentation/workflow subjects, and a complete review of every historical patch plus owner-approved branch reconciliation has not been completed. No merge, reset, rebase, force-push, cherry-pick, or history rewrite was performed.
- Production remains blocked by missing genuine rights-cleared Short and long-form media, completed manifests and hash-bound approval; real SonicVhibez OAuth/channel identity and full remote history reconciliation; operation-specific private-upload authorization and remote receipt; real Nature Frontiers Page verification and default-branch draft artifact; owner-controlled recovery/rollback drills; and production deployment verification.
- No YouTube upload or Facebook post was performed. Public/unattended YouTube publishing and Facebook live publishing remain disabled. The approved Selar destination remains `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive.

**Verdict: IMPLEMENTATION INCOMPLETE — production acceptance remains BLOCKED.**


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


## Latest verified implementation checkpoint — 25 October 2026

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
