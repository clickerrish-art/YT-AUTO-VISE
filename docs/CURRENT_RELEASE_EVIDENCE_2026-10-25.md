# Current Release Evidence — 25 October 2026

## Latest verified checkpoint — candidate `e6bdf05bbda396d462de53f3c5a10dce6108f8f8`

> **Verified checkpoint — 25 October 2026; assessed application/test SHA `e6bdf05bbda396d462de53f3c5a10dce6108f8f8`.** Exact-SHA automation/security [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616776): 276 Node tests passed, 0 failed; 8 Python safety tests passed; clean normal/locked installation and npm audit reported 0 vulnerabilities. Real-dashboard Chromium E2E [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616798): 10 tests passed, including keyboard-only operator login, accessible token label and token redaction. Exact isolated main/candidate baseline [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227617108): main `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate `e6bdf05bbda396d462de53f3c5a10dce6108f8f8` both installed and passed Node/Python test commands (all exit codes 0). Metadata [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616809); content quality [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616866). Production readiness [BLOCKED as designed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616914); Nature Frontiers Facebook draft workflow [SKIPPED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616772), not integration evidence. PR #1 remains open/draft/unmerged; main is unchanged. Remaining blockers include owner-approved feasible cadence, genuine rights-cleared final media and human review, verified SonicVhibez OAuth/channel history, verified Nature Frontiers Page permissions and a non-skipped draft run, exhaustive dashboard/recovery/deployment acceptance, full divergent-history review, and repository branch protection. Public/unattended YouTube publishing, Facebook live publishing and Safari campaigns remain disabled. No upload or publication was performed.

### Exact-SHA evidence
- [Automation/security](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616776): PASS — 276 Node tests, 8 Python tests, npm audit 0 vulnerabilities, clean normal/locked install, syntax and compile checks.
- [Dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616798): PASS — 10 Chromium tests against the local dashboard/backend, including keyboard-only login.
- [Isolated main/candidate baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227617108): PASS — exact main and candidate install/Node/Python exit codes 0.
- [Metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616809) and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616866): PASS.
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616914): BLOCKED. [Facebook draft](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40227616772): SKIPPED.

---

## Exact PR HEAD verification checkpoint — 25 October 2026

- Exact candidate at this checkpoint: `f66928df29c804fa487a6a0d53e0961952b410c1`; `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; comparison at this checkpoint was 1,185 commits ahead, 2 behind, 120 changed files.
- PR #1 remains open, draft and unmerged.
- Automation/security [run 40223741160](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223741160): **PASS** — 276 Node tests, 0 failures; 8 Python tests; npm audit 0 vulnerabilities.
- Browser E2E [run 40223737527](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223737527): **PASS** — 9 Chromium journeys, including the new invalid/impossible Facebook idea-date regression.
- Content quality [run 40223741125](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223741125), metadata [run 40223741117](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223741117), and lockfile/locked install [run 40223737473](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223737473): **PASS**.
- Production readiness [run 40223741116](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223741116): **BLOCKED** as required. Retained log evidence confirms human-readable and JSON exit codes are both 2, followed by the explicit production-blocked message. Do not treat the workflow's failure conclusion as a test pass.
- Facebook draft workflow [run 40223741118](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223741118): **SKIPPED**, not integration evidence.
- Latest code changes: readiness prerequisite path/symlink guard; readiness workflow exit-code evidence correction; authenticated Facebook idea endpoint returns 400 for malformed/impossible dates without mutating draft state. The acceptance register records the applicable source/test evidence.
- Outstanding blockers remain unchanged: cadence approval; genuine rights-cleared final media and human approval; verified SonicVhibez OAuth/channel/history/attempt ledger and one-shot upload authorization; verified Nature Frontiers Page and real draft-only workflow; exact isolated `main` baseline; complete divergent-history review; exhaustive dashboard, recovery, deployment/monitoring/rollback drills; and repository protection/governance.
- Safety: no uploads, posts, campaign activation, merge or destructive Git operation. Public/unattended YouTube and Facebook live publishing remain disabled; Safari remains inactive.

## Latest dashboard input-validation checkpoint — 25 October 2026

- Candidate: `8146666ec32d5496dd0af6fb93a79fbd3284bf8f`; exact browser E2E [run 40223472355](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472355) **PASS** — 9 Chromium journeys.
- Confirmed defect: `GET /api/facebook/idea` previously allowed invalid date errors to reach the generic handler, which could misrepresent operator input as an internal server failure.
- Fix: [route returns HTTP 400 for invalid/impossible dates](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/5ca20732e714dd850e3a6ec657ad987e7741e20f); [browser regression test](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/e9fd88a993906565945aa0219987fece673ea332) checks unauthenticated 401, malformed and impossible dates, and unchanged draft state.
- The dashboard control matrix now documents the correct GET route and remaining partial coverage. The acceptance register records `DASH-CTRL-05` as PASS for the validated behavior; provider failure and full control coverage remain open.
- The final PR HEAD's checks remain authoritative; do not transfer this candidate's test results to a newer SHA without checking its own runs.

## Latest code/CI checkpoint — 25 October 2026

- Source/test candidate: `dfad17c87c6473a81ac65baa67ac7f694e2c7b29` on `codex/marketing-machine-audit-fixes`; PR #1 remains open, draft and unmerged.
- Readiness path hardening: [safe project-file guard](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/c8aa2710caa3e8b599e179f73012d3f2adebccf5), [regression tests](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/ca6ccf14e3a8f146966d921e4994b20d0e93c0a5), [readiness integration](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/2ed5f9968460e7a318f37e22ec959a107e447710), and [explicit external queue-path compatibility fix](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/728f6821c16cfa6fa730a84fe421c38c74ba41be).
- Readiness workflow correction: [retained exit-code evidence](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/7813cd5d8ed6b91d20ea78c46f378cc726e9bf4c), [line-delimited output fix](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/eb1753cdfd3158fdce0c5d53bdc6d04f291e3e7c), and [workflow regression assertion](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/dfad17c87c6473a81ac65baa67ac7f694e2c7b29).
- Automation/security [run 40222702143](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702143): **PASS** — 276 Node tests, 0 failed; 8 Python safety tests; dependency audit reported 0 vulnerabilities.
- Browser E2E [run 40222702124](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702124): **PASS** — all 8 Chromium journeys passed against the real local dashboard/backend.
- Content quality [run 40222702109](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702109), metadata [run 40222702097](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702097), and locked install [run 40222697980](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222697980): **PASS**.
- Production readiness [run 40222702175](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702175): **BLOCKED**, correctly — retained evidence records human-readable exit 2 and JSON exit 2, then explicitly reports the readiness gate as blocked. This is not a release pass.
- Facebook draft workflow [run 40222702166](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702166): **SKIPPED**, not integration evidence.
- Remaining blockers: owner cadence decision; real rights-cleared media and hash-bound human review; verified SonicVhibez OAuth/channel/history and one-shot authorization; verified Nature Frontiers Page and genuine draft workflow; exact-main baseline; full divergent-history review; exhaustive dashboard/recovery/deployment drills; and branch protection/governance.
- Safety: no upload, publication, campaign activation, merge or destructive Git operation. Public/unattended YouTube and Facebook live publishing remain disabled; Safari remains inactive.

## Strict cadence-approval timestamp hardening — 25 October 2026

- Shared strict ISO timestamp validator: [`cef7664`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/cef7664ad41bc11e6473e6d7a5f1682b7efd69e1).
- Schedule and readiness gates now use it: [`f3b31d5`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/f3b31d57ea1363fafe945c184cb300908e6c0f2f), [`58fceca`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/58fceca25f9fb70f52a12505e9d14f007e29d516).
- Regression tests cover explicit timezone, impossible dates, invalid offsets and invalid owner-decision timestamps: [`358f3b9`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/358f3b9f6e3dea315b30f671f8a1749e7849fb6e), [`70e6611`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/70e661171e91c624ed4d1a3f01d9eeb89c9a5378).
- Candidate `58fceca25f9fb70f52a12505e9d14f007e29d516`: [automation/security](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215742648) **PASS** — 272 Node tests passed, 0 failed; npm audit 0 vulnerabilities; Python safety, JS syntax, Python compilation, campaign and queue checks passed. [Metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215742576) and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215742589) **PASS**. [Dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215742588) was still running at checkpoint; do not mark it passed until completed. [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215742598) **BLOCKED** as required. Facebook draft workflow was **SKIPPED**.
- This is not a production acceptance. Public/unattended publishing remains disabled; no upload or publication occurred.

---

## Verified follow-up checkpoint — 25 October 2026

- Cadence-approval validation hardening is in commits [`cf82332`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/cf82332136c444ef3c57e4e1d1eef9ba9aabae6f), [`95d9dd8`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/95d9dd8c4fb895861bcdfbc4c5ddc12b477990f6), [`630f1fb`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/630f1fbe05efa04ac4b5a470c506f872e75d1f1f). Schedule validation and production readiness now require a supported mode, timezone-aware approval timestamp, non-empty approval reference, and feasible spacing; custom modes must fit their cycle mathematically.
- Exact candidate tested by the latest workflow set: `564d8b95c9457e13ceb24ff32a1f5faa6de40273`.
- [Automation/security](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215336608): **PASS** — 270 Node tests passed, 0 failed; npm audit reported 0 vulnerabilities; Python safety checks, syntax/compile, campaign and queue validations passed.
- [Metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215336721): **PASS** — clean `npm ci --ignore-scripts`, 270 Node tests and metadata/schedule/caption checks passed.
- [Dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215336587): **PASS** — all 8 real-local-dashboard/backend Chromium tests passed, including persistence across server restart and fail-closed publication controls.
- [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215336624): **PASS**.
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215336580): **BLOCKED** — reports the missing feasible owner-approved cadence decision and other release prerequisites. This failure is expected; it is not a release pass.
- [Facebook draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40215336585): **SKIPPED**, not live integration evidence.
- These results cover candidate `564d8b9`; any subsequent commit requires its own exact-head CI verification. Public/unattended YouTube publishing, Facebook live publishing and Safari activation remain disabled. No upload or publication occurred.

---

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

# Current Release Evidence — 25 October 2026

## Historical implementation checkpoint — superseded by the latest verified checkpoint above

**Current tested candidate at this checkpoint:** `58f9255740903fefc0e0ac410d5adf308480f59d` on `codex/marketing-machine-audit-fixes`. The PR remains open, draft and unmerged. This section supersedes older "current" checkpoint statements later in this document; those entries are retained as historical evidence.

### Live repository state
- PR #1: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- Live comparison at this checkpoint: **1,044 commits ahead, 2 behind, 110 changed files**; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- The full 1,044-commit branch-only history has **not** been reviewed patch by patch. No merge, rebase, reset, force-push, history rewrite, or direct `main` edit was performed. A safe reconciliation plan and owner approval remain required.
- Latest recorded branch-protection status says required protection/status checks are not enforced; owner must confirm current settings and enable required checks before merge.

### Implementation changes committed in this continuation
- [`11adb103`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/11adb10335ed96c898cd82c8205054a0a40b2187) adds a read-only `--json` readiness mode with deterministic blocker IDs, severity, observed check findings and suggested resolution steps.
- [`fd3d8c4`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/fd3d8c4c0fbd14b7df0a8a150a43ba969d1c32e1) tests JSON shape, stable-ID format, actionable resolution and blocked exit status.
- [`fbbee4f`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/fbbee4f49b12267384e979aa7dc36bf6c301d612) adds `npm run readiness:json`.
- [`df64774`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/df64774f056da696fdedcaaad52a9654c504483d) documents the JSON diagnostic command and its limits.
- [`58f9255`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/58f9255740903fefc0e0ac410d5adf308480f59d) retains both human-readable and structured JSON readiness reports in the CI artifact and fails if their exit statuses disagree. It does not weaken the readiness gate.

### CI evidence for candidate `58f9255740903fefc0e0ac410d5adf308480f59d`
- [Automation/security — run 40188274695](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274695): **PASS** — 245 Node tests, 0 failed, 0 skipped; 8 Python tests; clean normal and locked dependency installs; `npm audit` reported 0 vulnerabilities across 49 packages; configuration, syntax and compilation checks passed.
- [Dashboard browser E2E — run 40188274674](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274674): **PASS** — 7 Chromium journeys. This still does not exercise every visible dashboard control.
- [Metadata validation — run 40188274667](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274667): **PASS**.
- [Content quality — run 40188274693](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274693): **PASS**.
- [Production readiness — run 40188274678](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274678): **BLOCKED as required** while real prerequisites are absent; retained [diagnostic artifact 12597386549](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274678/artifacts/12597386549), containing the human-readable report and structured JSON report.
- [Nature Frontiers Facebook draft — run 40188274716](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40188274716): **SKIPPED** on the pull-request event; this is not default-branch integration evidence.

### Requirements-to-evidence delta
| Requirement | Current classification | Evidence / unresolved item |
|---|---|---|
| Readiness diagnostics with stable IDs, severity and resolution | Implemented and CI-tested | `scripts/production-readiness.mjs --json`; regression test in `tests/production-readiness.test.mjs`; CI run 40188274695 |
| Structured readiness artifact retained in CI | Implemented and workflow-tested | Run 40188274678 artifact 12597386549; gate correctly remains blocked |
| Complete dashboard-control acceptance | Incompletely verified | Seven browser journeys pass; exhaustive per-control outcome coverage remains outstanding |
| Full divergent-history review and safe reconciliation | Missing / owner-blocked | 1,044 branch-only commits and 2 base-only commits; no destructive history action performed |
| Genuine playable Short and long-form exports, rights and human approval | Externally blocked | No production media/licence evidence or final-hash-bound human approval accepted |
| SonicVhibez identity, remote history and private-upload receipt | Externally blocked | No live OAuth identity/history acceptance or authorized upload performed |
| Nature Frontiers Page permissions and default-branch draft | Externally blocked | PR run skipped; Page permissions and successful default-branch artifact remain unverified |
| Crash/recovery, backup/restore, deployment, monitoring and emergency stop | Incompletely verified / owner-blocked | Automated tests exist; isolated operational drills and deployed-environment evidence remain outstanding |

### Safety and release decision
Public and unattended YouTube publishing remain disabled; Facebook live publishing remains disabled; Safari campaigns remain inactive; only `https://selar.com/0u19v8u99l` is approved for this release. No upload, public post, live Facebook post, campaign activation or merge was performed.

**Decision: CODE ACCEPTANCE BLOCKED. PRODUCTION BLOCKED.** The new readiness diagnostics improve observability; they do not close the external media, account, history, recovery, branch-review or deployment gates.

---


## Historical checkpoint — superseded by the latest implementation checkpoint above

**CODE ACCEPTANCE BLOCKED. PRODUCTION BLOCKED.** Automated regression, installation, dependency-audit and seven browser journeys pass on the exact application-code candidate. Full dashboard-control acceptance, complete branch-history review, retained recovery/deployment evidence and real-account acceptance remain incomplete.

## Authoritative Git state

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Exact tested application-code/test SHA: `e56e3f5a328590a2b54849299a9fabc09df02f25`
- Current branch HEAD: a documentation-only descendant of this tested SHA; live PR metadata is authoritative for the exact HEAD.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- At the tested code/test candidate, comparison was **1,036 ahead, 2 behind, 110 changed files**; subsequent documentation-only commits add no application-code changes. Use live PR metadata for the current-head comparison. The full PR changed-file inventory is available from GitHub. The full branch-only history has not been reviewed patch by patch. The two base-only commits around Facebook history-restoration coverage are understood.
- PR #1: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1 — open, draft, unmerged.
- No direct `main` edits or destructive history operations were performed.
- **Branch protection:** GitHub branch metadata reports both `main` and the implementation branch as unprotected (`protected=false`), with required status-check enforcement off. Owner action: enable branch protection and require the relevant checks before merging.

## Exact-SHA automated evidence

All runs below target `e56e3f5a328590a2b54849299a9fabc09df02f25`.

| Check | Result | Evidence |
|---|---|---|
| Node regression suite | **244 passed; 0 failed; 0 skipped** | [Automation/security run 40181771250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771250) |
| Python safety tests | **8 passed** | [Automation/security run 40181771250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771250) |
| Locked and normal lifecycle-script `npm ci` | **Passed** | [Automation/security run 40181771250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771250) |
| Dependency audit | **0 vulnerabilities** across 49 audited packages | [Automation/security run 40181771250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771250) |
| Google API import, JS syntax, Python compilation, queue/campaign checks | **Passed**; 16 queue topics checked | [Automation/security run 40181771250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771250) |
| Browser E2E | **7 passed** against local dashboard/backend | [Dashboard browser E2E run 40181771259](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771259) |
| Content quality | **Passed** | [Run 40181771275](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771275) |
| Metadata validation | **Passed** | [Run 40181771283](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771283) |
| Lockfile workflow | **Passed** | [Run 40181767945](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181767945) |
| Production readiness | **Blocked as required: 12 mandatory blockers** | [Run 40181771257](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771257); retained diagnostic [artifact 12594570724](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771257/artifacts/12594570724) |
| Nature Frontiers Facebook draft | **Skipped** on PR event | [Run 40181771276](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771276); not default-branch acceptance evidence |

## Implementation changes in this candidate

### Approval directory path safety
The dashboard previously used recursive directory creation for `run-logs/upload-approvals` before the approval transaction performed symlink checks. That could create nested output through a symlinked ancestor before rejection. Approval output now uses a shared component-by-component safe-directory helper that rejects symlinks and non-directory ancestors before nested writes.

`test/safe-directory-path.test.mjs` covers restrictive directory creation, symlink-ancestor rejection without creating descendants, non-directory ancestor rejection, and use of the guard by dashboard approval publication.

### Cross-process validation task durability
The `/api/tasks/run` route previously wrote initial and final task state without the cross-process state lock. Both transitions now acquire the lock, and a durable `RUNNING` record blocks a duplicate launch across dashboard processes sharing state. A regression test submits the same long-running allowlisted task to two processes and asserts one success and one conflict.

### Facebook Page verification feedback
The Page-verification button previously wrote its result into the autonomous-health panel and then refreshed that panel, overwriting the success/error message. The dashboard now uses a separate accessible live region for operation feedback. A sixth Chromium journey verifies that blocked feedback remains visible after the status refresh.

### Existing safeguards retained
Approval-artifact state-before-publication ordering and rollback handling; atomic JSON path validation; Facebook history restoration safeguards; dashboard form handler binding; queue idempotency and spacing; fail-closed readiness; hash-bound private-upload approval; remote-history/uncertain-attempt gates; inactive Safari campaigns; disabled public/unattended publishing.

### Additional workflow defect fixed

The manually dispatched private-upload workflow previously used `npm install --ignore-scripts`, which did not enforce the checked-in lockfile, and referenced `secrets.GITHUB_TOKEN` instead of the built-in `github.token` context when restoring prior ledger artifacts. It now uses `npm ci --ignore-scripts` and `github.token`; the new regression test checks both settings.

## Requirement status

### Verified in code/CI
- 244 Node tests, 8 Python tests and seven browser journeys pass on the exact tested SHA.
- Clean locked and normal dependency installation passed; `npm audit` reported zero vulnerabilities.
- The schedule uses `Africa/Johannesburg`, a rolling `long_form → long_form → short` cycle and a default 72 elapsed-hour minimum gap; Tuesday/Saturday triggers are draft-preparation only.
- The dashboard has authenticated operator routes, durable state, queue/job controls, campaign safeguards, Facebook draft workflows, review gates and read-only upload reconciliation.
- The private uploader requires verified SonicVhibez identity, exact approval hashes, one-shot authorization, explicit private visibility and durable attempt/receipt reconciliation.
- Public/unattended YouTube publishing and Facebook live publishing remain disabled.

### Still blocked or not fully verified
- The full branch-only history has not been reviewed patch by patch; safe reconciliation requires owner approval.
- Not every visible dashboard control has a browser acceptance journey.
- Isolated crash, interruption, rollback, backup/restore and deployment drills with retained logs/checksums are incomplete.
- No genuine production Short or long-form export, accepted production manifest, final production hash or human playback approval has been verified.
- SonicVhibez OAuth/channel identity and complete remote history are not verified against a real account.
- No operation-specific authorization was used for a real private upload; no YouTube upload was performed.
- Nature Frontiers Page identity/permissions and a successful default-branch Facebook draft with inspected retained artifact are not verified; the PR-triggered workflow was skipped.
- Production deployment, monitoring, backup schedule, emergency-stop behavior and rollback are not accepted.

## Exact owner actions

1. Supply genuine rights-cleared footage, narration/music, captions and thumbnails for Short and long-form production, retaining source and licence evidence.
2. Review the actual rendered media and metadata; approve exact hashes only after technical, rights, disclosure and policy checks pass.
3. Configure OAuth securely; verify the authenticated channel is exactly SonicVhibez; reconcile all public/private/unlisted videos and uncertain attempts.
4. Only after all gates pass, separately authorize one private-only upload and independently verify remote channel, privacy state and receipt. Never make it public.
5. Verify Nature Frontiers Page identity, token tasks and permissions; run the permitted default-branch draft workflow and inspect its retained artifact. Do not publish a live post.
6. Approve a safe branch-reconciliation plan after complete review of divergent changes.
7. Complete and retain isolated recovery/backup/restore and deployment/monitoring evidence; then make the release decision.

## Safety posture

No real YouTube upload, public YouTube post or live Facebook post was performed. Public/unattended YouTube publishing remains disabled. Facebook live publishing remains disabled. The only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive until separately reviewed and approved.

## Evidence limits

CI results are real and target the exact code/test SHA above. Seven Chromium journeys do not cover every dashboard control. A clean dependency audit does not establish overall security. Synthetic fixtures and test rights strings are not production media or genuine licences. The blocked readiness run is correct while mandatory prerequisites are missing. This report does not claim code acceptance or production acceptance.
