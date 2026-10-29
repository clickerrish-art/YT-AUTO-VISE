## Latest exact-SHA dashboard API authentication acceptance — 29 October 2026, 13:25 UTC

- **Tested source/test SHA:** `9229671e82180eadb92411cdd5ac9e649da79fdb`. Application implementation is unchanged; regression coverage now includes protected read and mutating API declarations.
- **Implemented:** `test/dashboard-server.test.mjs` derives protected API routes from the source inventory and verifies missing and invalid operator tokens return HTTP 401 with an authentication error before validation or mutation on all **35 protected API route declarations: 28 mutating routes and 7 GET routes**.
- **Exact-SHA automation/security PASS:** [run 40881209227](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209227) — 421 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe and syntax/compilation checks passed.
- **Exact-SHA acceptance workflows:** [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209267), [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209407), [dashboard browser E2E PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209155), [isolated main/candidate baseline PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881198843), [non-destructive branch inventory PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209440).
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209299) remains BLOCKED/fail-closed. [Nature Frontiers draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40881209154) passed local candidate validation, but its external `create-draft-package` job was SKIPPED; no live Meta draft/read-back is proven.
- This closes the protected API authentication negative-path slice only. **DASH-001 remains NOT_TESTED**: all 105 controls and 15 forms and every route still need behavior-specific success, validation, repeat/concurrency, persistence, failure/recovery, audit and accessibility acceptance.
- Live refs at the tested candidate: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 2,120 ahead / 2 behind / 178 changed files. PR #1 remains open, draft and unmerged.
- No live upload/post, campaign activation, visibility change, Metricool schedule mutation, PR merge, main edit or destructive Git operation occurred. Public/unattended YouTube and live Meta publishing remain disabled; Nature Frontiers remains prohibited as a YouTube target; Safari remains inactive.

## Latest exact-SHA dashboard authorization acceptance — 29 October 2026, 13:20 UTC

- **Tested source/test SHA:** `02fd8f03b4730dca5c01974809314bf2e7f84678`. The application code is unchanged by this checkpoint; the regression test expands the dashboard mutation-route authorization matrix.
- **Implemented:** `test/dashboard-server.test.mjs` now discovers all 28 declared mutating API routes and verifies that both missing and invalid operator tokens receive HTTP 401 and an authentication error before request validation or state mutation.
- **Exact-SHA evidence:** [automation/security](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532626) PASS — 421 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities. [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532402) PASS, [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532528) PASS, [dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532606) PASS, [isolated main/candidate baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532588) PASS, and [non-destructive branch inventory](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532386) PASS.
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532384) remains blocked/fail-closed. [Nature Frontiers draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40880532420) passed local validation, but does not prove real provider-side draft creation/read-back.
- This closes only the missing/invalid-authentication negative-path slice for mutating routes. **DASH-001 remains NOT_TESTED** because all controls/forms/routes still need their complete behavior-specific success, validation, duplicate/concurrency, durable-state, failure/recovery, audit and accessibility acceptance.
- Live refs at this candidate: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 2,118 ahead / 2 behind / 178 changed files. PR #1 remains open, draft and unmerged.
- No live upload/post, campaign activation, visibility change, Metricool schedule mutation, PR merge, main edit or destructive Git operation occurred. Public/unattended YouTube and live Meta publishing remain disabled; Nature Frontiers remains prohibited as a YouTube target; Safari remains inactive.

# Current implementation checkpoint — 29 October 2026 (exact candidate 726e3fca8d0)

## Authoritative live refs at the tested candidate

- Implementation branch: `codex/marketing-machine-audit-fixes`
- Exact tested source/test candidate: `726e3fca8d0a1a79a76f9d04fefcd440b83f52cc`
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6` (unchanged by this work)
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Full-history comparison at this candidate: 2,094 branch-only commits / 2 main-only commits / 178 final-tree changed files.
- Latest live branch-head inventory snapshot: `6562977544164e121671f5c635af610fcad20161`; 2,109 ahead / 2 behind / 178 changed files; [full inventory artifact 12889427360](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40856976846/artifacts/12889427360). Documentation-only commits after this snapshot do not change application/test code. The exact tested source/test candidate below has its own 2,094-ahead inventory snapshot.
- PR #1 remains open, draft, and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- GitHub reports `main` unprotected and required status-check enforcement off. Owner/admin action is required to configure protection; no settings were changed.
- Later commits after this exact source/test candidate update release documentation only; they are not represented as new application-code validation.

## Implemented code and regression

- [`49e1df2`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/49e1df25d6a512eb31b6b48132c5a3880f9010cb): upload log/ledger directory now uses the symlink-rejecting directory validator.
- [`22ee0e7`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/22ee0e755f339d3850fb1ea3f75afb470e1e6ed8): centralized YouTube read-back validation checks exact remote video ID, verified channel ID, approved title, and private visibility.
- [`78a4b86`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/78a4b8625532ef9f040c1eef1b5b341b2ed7274b) adds direct mismatch tests; [`f363bae`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/f363baeee5c14c21c3980001980df0eddb330b5d) fixes a stale source-guard assertion exposed by the refactor.
- [`351195b`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/351195b3a0b1ba27aae0f9e445907cbcfe85bf1a), [`e8a0dc4`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/e8a0dc42a06939004737ac75114b0340050a64bc), [`2699f41`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/2699f4152f7e0f252a46fe6aa6ba55018b6bb885), [`e33f96f`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/e33f96f54880a640fab4ddbd934f619d7ac23a81), and [`726e3fc`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/726e3fca8d0a1a79a76f9d04fefcd440b83f52cc) add a tested full-history Git reconciliation inventory tool, CLI, test, and artifact workflow. The first inventory workflow exposed a syntax error; it was fixed and the rerun passed.

## Exact-candidate CI

All listed runs below target `726e3fca8d0a1a79a76f9d04fefcd440b83f52cc`:

- Automation/security: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917680) — 420 Node tests, 0 failures, 0 skipped; 16 Python tests passed; npm audit reported 0 vulnerabilities; normal lifecycle install, syntax/compile and FFmpeg/ffprobe checks passed.
- Content quality: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917761).
- Metadata validation: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917638).
- Dashboard Chromium E2E: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917580) — 15 journeys; not exhaustive per-control acceptance.
- Isolated main/candidate baseline: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917554).
- Full-history branch inventory: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917617); retained [machine-readable JSON and human-readable Markdown artifact 12889820366](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917617/artifacts/12889820366).
- Production readiness: [BLOCKED as designed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917557); diagnostic artifact retained and gate returned exit code 2 for unmet prerequisites.
- Facebook daily draft: [local candidate validation passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40855917596); external provider draft-creation job was skipped, so this is not proof of a real Meta draft.

## Branch inventory results

- 2,094 branch-only commits and 2 main-only commits were inventoried.
- 0 patch-equivalent branch commits were detected by `git cherry`.
- 178 final-tree file changes, 17 critical-path changes, 0 final-tree deletions; working tree was clean during report generation.
- Heuristic categories: 900 documentation-only, 493 implementation, 455 test-only, 89 workflow-only, 58 config/content, 28 implementation-and-tests, and 71 mixed.
- The two main-only commits are the historical restore Facebook draft test incident: `71578dafc24e5d48173dce3f4e392e18e42aa40e` added the test and `fa00d28e7f58911482686e4ad69fac9f4701a2e6` reverted the unintended write. The implementation branch retains the test; `tests/restore-state.test.mjs` is retained too.
- This is a complete commit/file inventory but **not** completed human semantic review. Classification and patch-equivalence are heuristic, and the large divergence is not approved for merge.

## Current acceptance status

The machine-readable register has 67 requirements: 51 PASS, 8 NOT_TESTED, 8 BLOCKED_EXTERNAL. `GIT-INVENTORY-001` is PASS for reproducible inventory generation, but the human integration review remains outstanding. `UPLOAD-LOG-PATH-001` and `YT-READBACK-001` are PASS only for their targeted code criteria; they do not constitute a live upload acceptance. `DASH-001` remains NOT_TESTED: the 105-control / 15-form / 38-route inventory is not exhaustive acceptance. `STATE-001` remains NOT_TESTED because process termination at every transaction boundary, disk-full/permission-failure drills, deployment rollback and power-loss durability are not fully demonstrated.

External acceptance remains blocked for real rights-cleared production media and human review, verified YouTube OAuth/channel/history and a separately authorized private upload with provider read-back, native Short-parent association evidence, actual Meta Page/Instagram identity and provider draft read-back, owner-approved feasible cadence, and per-record owner decisions for existing Metricool schedules. Safari remains inactive. Nature Frontiers remains prohibited as a YouTube target. Public/unattended YouTube publishing and live Meta publishing remain disabled. The approved Selar URL remains `https://selar.com/0u19v8u99l`.

## Release decision

**PARTIALLY ACCEPTED — NOT PRODUCTION READY.** No live upload, post, visibility change, campaign activation, remote schedule mutation, PR merge, main edit, or destructive Git operation occurred. Historical sections below are retained as historical evidence and must not supersede this checkpoint.

---

# Exact source/test checkpoint — 29 October 2026, 07:23 UTC

## Current tested candidate

- **Exact source/test SHA:** `71e84d211adacaeb8fed8865a24950101c2fa452`.
- Source fix: `76c3b2cf1d08b36c3a44f8079d8bffbbae7ad57b` updates `scripts/dashboard-inventory.mjs` to scan opening tags while respecting quoted attribute values and ignoring commented-out markup. This prevents a literal `>` inside an `aria-label` or form `action` from truncating the tag and distorting the static inventory.
- Regression test: `71e84d211adacaeb8fed8865a24950101c2fa452` adds coverage for quoted greater-than characters and commented-out example markup.
- Static inventory remains explicitly labelled as declaration inventory only, not proof that every dashboard control or API route is functionally accepted.

## Exact-SHA CI

- Automation/security **PASS** — [run 40835085920](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40835085920): **417 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; npm audit reported 0 vulnerabilities**.
- Content quality **PASS** — [run 40835085840](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40835085840): 417 Node tests, 0 failures, 0 skips.
- Metadata validation **PASS** — [run 40835085797](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40835085797): passed.
- Dashboard browser E2E **PASS** — [run 40835086030](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40835086030): 15 Chromium journeys.
- Isolated main/candidate baseline **PASS** — [run 40835085938](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40835085938): both exact checkouts passed their configured Node/Python baseline commands.
- Production readiness **BLOCKED / fail-closed** — [run 40835086060](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40835086060). This is not a test-suite pass or production acceptance.
- Nature Frontiers draft workflow — [run 40835085907](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40835085907): deterministic local draft validation passed; external provider draft creation was skipped, so no real Meta integration acceptance is claimed.

## Live repository state at tested candidate

- PR #1 remains [open, draft and unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
- `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Branch comparison: **2,068 commits ahead / 2 behind / 175 changed files**. Full non-destructive branch-history reconciliation is still required before any merge decision.
- After this evidence refresh, any later HEAD is documentation-only relative to the exact tested source/test candidate; do not claim the documentation commit itself is a new source/test candidate.

## Still blocked / not accepted

- Exhaustive per-control/per-route dashboard/API acceptance.
- Crash/restart coverage at every transaction boundary and production-like backup/restore/deployment rollback drills.
- Genuine rights-cleared production media, final rendered assets and full human playback/factual/rights review.
- Secure verification of the SonicVhibez YouTube OAuth identity, complete public/private/unlisted history, reconciliation of uncertain upload attempts, explicit per-operation private-upload authorization and verified remote receipt.
- Native Short-to-parent Related-video eligibility/association.
- Verified Meta identities/permissions and a successful external draft-only integration test.
- Owner-approved feasible cadence, with the mandatory minimum of 72 full hours between any two promotional publication timestamps.
- Full branch-history integration review.

No upload or post was published, no campaign was activated, no visibility was changed, `main` was not edited, and PR #1 was not merged. Public/unattended YouTube publishing and live Meta publishing remain disabled; Nature Frontiers remains prohibited as a YouTube target; Safari remains inactive; the approved Wildlife Creator's Vault Selar destination remains unchanged.

---

## Live implementation checkpoint — 29 October 2026, 07:01 UTC

- **Exact tested source/test SHA:** `bc02a73c2bfc39faa11990468778bb98372a551c`. This is the application/test candidate; subsequent documentation commits do not change it.
- **Changes:** `scripts/dashboard-inventory.mjs` now emits semantic, hashed acceptance IDs for controls, forms and routes; `test/dashboard-inventory.test.mjs` adds stability and duplicate-identity regression tests.
- **Exact-SHA verification:** Node suite 416/416 passed, 0 failed, 0 skipped; Python 16/16 passed; npm audit found 0 vulnerabilities; FFmpeg/ffprobe and syntax/compile checks passed. Content quality [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559799), automation/security [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559734), metadata [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559712), dashboard browser E2E [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559722), isolated baseline comparison [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559729).
- **Production readiness:** still fails closed at [run 40832559754](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559754). This is not treated as a test defect. Nature Frontiers workflow [run 40832559778](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40832559778) validates the local draft-only package; its provider creation job is skipped on the candidate branch, so this is **not** evidence of a real Meta draft.
- **Live refs:** `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; implementation branch at time of source/test verification `bc02a73c2bfc39faa11990468778bb98372a551c`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; comparison `2,059 ahead / 2 behind / 175 changed files`. PR #1 remains open, draft and unmerged.
- **Still not accepted:** DASH-001 exhaustive control/API acceptance; full branch history inventory and integration plan; all-boundary recovery and deployment rollback; genuine production media/rights/final human review; verified YouTube channel/history/private-upload receipt; native Short-parent provider association; real Meta identities and provider-side draft read-back; owner-approved cadence and external campaign decisions. No live upload, post, visibility change, campaign activation or Metricool mutation was performed.
- **GitHub protection:** live branch metadata reports `protected=false` and required status-check enforcement off. No repository settings were changed. Owner/admin action is required to configure branch protection and required checks.

## Latest checkpoint — 29 October 2026 (newer than the historical snapshot below)

### Live refs immediately before this evidence refresh

- PR #1 remains open, draft and unmerged.
- PR head before this documentation update: 7a11ae51094a6bfd76147f12708ddca876f9c8b2.
- Exact tested source/test candidate: 1e55ac4e231db83fa77b6a5f8b5d50997e992c79.
- main: fa00d28e7f58911482686e4ad69fac9f4701a2e6.
- Merge base: 45352b73bb6cc4787b2a49988b575afb754ab627.
- Divergence: 2,054 ahead / 2 behind / 175 changed files.
- Commits after the exact source/test candidate are documentation-only. This update is also documentation-only and does not change application/test code.

### Exact-candidate CI

- **Content quality: PASS** — 414 Node tests, 0 failures, 0 skipped: [run 40831466179](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466179).
- **Automation/security: PASS** — 414 Node tests, 16 Python tests, locked install, FFmpeg/ffprobe, npm audit 0 vulnerabilities: [run 40831466090](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466090).
- **Dashboard browser E2E: PASS** — 15 Chromium tests: [run 40831466165](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466165).
- **Metadata: PASS:** [run 40831466158](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466158).
- **Isolated main/candidate baseline: PASS:** [run 40831466115](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466115).
- **Production readiness: BLOCKED and correctly fails closed:** [run 40831466131](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466131).
- **Facebook daily draft:** local validation succeeded but external provider draft-creation job was skipped: [run 40831466088](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831466088).

### New recovery evidence

The test commit [1e55ac4e](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/1e55ac4e231db83fa77b6a5f8b5d50997e992c79) launches a separate process, terminates it immediately after the dashboard-state destination commit, confirms the durable journal and lock remain, models operator-confirmed stale-lock cleanup only after child exit, then proves restart recovery restores the exact original state bytes and clears the journal. This covers one controlled transaction boundary. It does not prove every-boundary recovery, true power-loss durability, disk-full/permission drills or deployment rollback. The broader STATE-001 requirement remains NOT_TESTED.

The prior backup output symlink hardening remains covered by [source commit 16a3b481](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/16a3b4814ccbc52304f61fb782869f131a61aa85) and regression [commit 6c08cf0e](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/6c08cf0e49647babe3583bedb2d44fffb660cd8f).

### Updated acceptance totals

The register contains **64 requirements: 48 PASS, 8 NOT_TESTED, 8 BLOCKED_EXTERNAL**. Targeted PASS items do not mean overall acceptance.

### Remaining blockers and verdict

- Exhaustive control-by-control and route-by-route dashboard/API acceptance remains incomplete; DASH-001 is NOT_TESTED.
- Full transaction-boundary, power-loss, disk-full and deployment rollback drills remain incomplete; STATE-001 and DEPLOY-001 are not accepted.
- Real SonicVhibez channel/OAuth identity, complete YouTube history, and an authorized private upload/read-back are not proven. Public/unattended YouTube publishing remains disabled.
- Native YouTube Related-video association remains unverified and may conflict with the private-only policy.
- Meta destination identity/permissions and actual draft creation/read-back remain unverified; live publishing remains disabled.
- Genuine production media, license evidence, human playback review and final hash-bound approval are not established by synthetic renderer tests.
- Owner-approved cadence and full Git divergence reconciliation remain outstanding. Branch protection is unverified because the integration receives HTTP 403 from the protection endpoint.
- Historical Metricool schedules must be reread and any change individually authorized; none was changed here.

No upload, post, visibility change, campaign activation, remote schedule mutation, merge, main edit or destructive Git operation occurred.

**Tested candidate checks: PASS. Full functional acceptance: NOT COMPLETE. Production readiness: NOT READY.**

---

Historical snapshot below is retained for audit trail; its older refs and test candidate are not the latest state.

# Current Release Evidence — 29 October 2026

## Live Git snapshot

- Repository: clickerrish-art/YT-AUTO-VISE
- Implementation branch: codex/marketing-machine-audit-fixes
- PR #1: [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1)
- PR head immediately before this evidence-file commit: cc14a97481ac900c937fab98c23de05d04421788
- Exact tested source/test candidate: 6c08cf0e49647babe3583bedb2d44fffb660cd8f
- main: fa00d28e7f58911482686e4ad69fac9f4701a2e6
- PR base SHA / merge base: 45352b73bb6cc4787b2a49988b575afb754ab627
- Divergence at snapshot: **2,048 ahead / 2 behind / 174 changed files**.
- Commits after the exact source/test candidate through cc14a974... are documentation-only evidence/register updates. This evidence document is also documentation-only; it does not change tested application code.
- Branch-protection endpoint returned HTTP 403 for the current integration. The readable ruleset listing returned no rulesets. Protection status is therefore **unverified**, not assumed absent or present.
- The API does not expose a working-tree status for a remote branch. No local checkout was available in this run; no claim is made about a local working tree.

## Exact-candidate verification

All following results are associated with source/test candidate 6c08cf0e49647babe3583bedb2d44fffb660cd8f:

| Check | Result | Evidence |
|---|---|---|
| Node suite / content quality | **PASS** — 413 tests, 413 passed, 0 failed, 0 skipped | [Workflow 40831016430](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016430) |
| Automation/security | **PASS** — 413 Node tests, 16 Python tests, locked install, FFmpeg/ffprobe, npm audit 0 vulnerabilities | [Workflow 40831016434](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016434) |
| Dashboard browser E2E | **PASS** — 15 Chromium tests | [Workflow 40831016429](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016429) |
| Metadata validation | **PASS** | [Workflow 40831016477](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016477) |
| Isolated main/candidate baseline | **PASS** | [Workflow 40831016435](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016435) |
| Production readiness | **BLOCKED / workflow fails closed** | [Workflow 40831016439](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016439) |
| Facebook daily draft | Local candidate validation passed; provider draft-creation job **SKIPPED** | [Workflow 40831016443](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40831016443) |

The new backup output regression proves that a symlinked ancestor is rejected before nested directories are created in the symlink target and that the shared operation lock is released. The code fix is [16a3b481](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/16a3b4814ccbc52304f61fb782869f131a61aa85); the regression-test commit is [6c08cf0e](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/6c08cf0e49647babe3583bedb2d44fffb660cd8f).

## Acceptance register

The updated machine-readable register contains **63 requirements**:

- **47 PASS**
- **8 NOT_TESTED**
- **8 BLOCKED_EXTERNAL**

PASS counts include targeted evidence only; they do not imply complete application acceptance. The register remains the detailed source of requirement-level status and next actions: [REQUIREMENTS_ACCEPTANCE_REGISTER.json](https://github.com/clickerrish-art/YT-AUTO-VISE/blob/codex/marketing-machine-audit-fixes/docs/REQUIREMENTS_ACCEPTANCE_REGISTER.json).

## Branch-history incident and reconciliation

The history confirms that commit [71578daf](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/71578dafc24e5d48173dce3f4e392e18e42aa40e) added test/restore-facebook-draft-history.test.mjs to main, and [fa00d28e](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/fa00d28e7f58911482686e4ad69fac9f4701a2e6) explicitly reverted that unintended default-branch write. The implementation branch independently retains the test and later coverage, including [c507b63a](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/c507b63abfa336165865ad01cf6354ae50254f04) and [fd92b554](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/fd92b55415c8a630860dba5894dae705b19ef5ac). tests/restore-state.test.mjs is also retained and has new duplicate-journal recovery coverage.

This is a targeted incident finding, not a complete reconciliation of the 2,048-commit divergence. No reset, rebase, merge, force-push, cherry-pick or destructive history operation was performed. The full branch-only/base-only commit review and overlap/regression assessment remain open.

## Dashboard/API acceptance

The 15 Chromium journeys pass, including keyboard-only connection, accessible names, 320px mobile layout, persistence across real server restart, fail-closed campaign behavior, draft persistence, public YouTube publication absence, actionable API errors and Short-parent UI/backend blocker handling. This does **not** satisfy the exhaustive 105-control / 15-form / route-by-route acceptance requirement. DASH-001 remains **NOT_TESTED**.

## Operational and external blockers

- **State recovery:** targeted rollback, lock, journal-validation and backup-path cases have regression coverage. Controlled process-kill/restart at every transaction boundary, power-loss durability, disk-full behavior and deployment rollback drills remain incomplete. STATE-001 remains **NOT_TESTED**.
- **YouTube:** authorized SonicVhibez channel identity, OAuth account identity, complete remote history reconciliation and an explicitly authorized private-upload acceptance operation are not proven by these repository CI results. The documented channel-ID discrepancy remains unresolved. Public/unattended publishing remains disabled.
- **Short parent:** internal binding tests/UI exist; native YouTube Related video state is not independently verified. Do not change visibility to satisfy native association.
- **Meta:** local Facebook draft generation/validation is not a live provider draft. The external create-draft job was skipped. Nature Frontiers Page/Instagram identity and permissions plus provider read-back remain unverified. Live publishing stays disabled.
- **Production media:** genuine rights-cleared assets, completed human playback review and hash-bound production approval are not proven by synthetic renderer tests.
- **Schedule:** owner approval of a feasible cadence is missing. Keep Africa/Johannesburg, the rolling long_form -> long_form -> short cycle, no same-local-day publication and at least 72 elapsed hours between actual publications.
- **Metricool:** historical schedule IDs require a fresh provider read and explicit owner authorization before any individual remote change. No remote schedule was changed here.
- **GitHub protection:** branch protection could not be read due integration permission limits; owner verification is still required.
- **Branch reconciliation:** 2,048 ahead / 2 behind remains too divergent to merge safely without a full review.

## Safety and production verdict

No live YouTube upload, visibility change, Meta post, campaign activation, Metricool schedule mutation, PR merge, main edit or destructive Git operation occurred.

**Repository test status: PASS for the exact candidate checks listed above.**  
**Full functional acceptance: NOT COMPLETE.**  
**Production readiness: NOT READY.**

The readiness gate must remain fail-closed until every mandatory repository and external prerequisite is genuinely satisfied. Documentation-only commits after the exact candidate do not constitute new application-code test evidence.

## Exact-SHA dashboard inventory regression — 29 October 2026, 14:25 UTC

- **Application-code commit:** [dea21c7](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/dea21c79403af6fa645edcc89b66f52088e73a70).
- **Tested source/test SHA:** [3b038b7](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/3b038b7f2af9b301135644778cfb9e8af21d6fb6).
- **Defect fixed:** `scripts/dashboard-inventory.mjs` previously only matched route conditions on a single line. It now recognizes multiline literal route conditions. `test/dashboard-inventory.test.mjs` includes a regression for a multiline POST route.
- **Automation/security PASS:** [run 40890110672](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40890110672) — 422 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; syntax and compilation checks passed.
- **Content quality PASS:** [run 40890111066](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40890111066). **Metadata PASS:** [run 40890110636](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40890110636). **Dashboard browser E2E PASS:** [run 40890110850](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40890110850). **Branch inventory PASS:** [run 40890110825](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40890110825).
- Isolated baseline run [40890110695](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40890110695) was still in progress at the time this section was recorded; it is not counted as PASS here. Production readiness remains fail-closed at [run 40890110804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40890110804).
- **DASH-001 remains NOT_TESTED.** This closes the multiline-inventory regression only; it does not establish behavior-level acceptance for all controls, forms or routes. No external publishing or schedule mutation was performed.

## Exact-SHA dashboard inventory and worker-lease race acceptance — 29 October 2026, 14:36 UTC

- **Tested source/test SHA:** `e64505ebf62f36ea6d7680324a04a6ba08f4ce9a`.
- **Application-code fix:** `dea21c79403af6fa645edcc89b66f52088e73a70` makes the static dashboard inventory recognize multiline literal route conditions; `test/dashboard-inventory.test.mjs` adds regression coverage.
- **Concurrency regression:** `test/dashboard-server.test.mjs` sends two simultaneous lease-claim requests for the same content job and asserts one 200 grant, one 400 rejection, and exactly one durable `WORKER_LEASE_CLAIMED` audit event.
- **Automation/security PASS:** [run 40892739679](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40892739679) — 422 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; syntax and compilation checks passed.
- **Content quality PASS:** [run 40892739941](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40892739941). **Metadata PASS:** [run 40892739655](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40892739655). **Dashboard browser E2E PASS:** [run 40892739944](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40892739944). **Isolated baseline PASS:** [run 40892727207](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40892727207). **Branch inventory PASS:** [run 40892739829](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40892739829).
- **Production readiness:** [run 40892739870](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40892739870) correctly remains blocked/fail-closed. The Facebook workflow [run 40892739963](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40892739963) passed local validation but skipped `create-draft-package`; it is not external provider acceptance.
- **DASH-001 remains NOT_TESTED.** These fixes improve route inventory and worker-lease concurrency coverage only; exhaustive acceptance of all dashboard controls, forms and routes remains incomplete. No external publishing or schedule mutation was performed.

## Exact-SHA dashboard concurrency acceptance — 29 October 2026, 14:43 UTC

- **Tested source/test SHA:** `dba98d78fb211a77ffb5df5410f77097218828cb`.
- **Route inventory:** `dea21c79403af6fa645edcc89b66f52088e73a70` fixes multiline literal route detection, with a dedicated regression test.
- **Worker lease race:** two simultaneous claims for one job result in exactly one HTTP 200 lease grant, one HTTP 400 rejection and one durable `WORKER_LEASE_CLAIMED` audit event.
- **Duplicate draft race:** two simultaneous identical `POST /api/drafts` requests result in one HTTP 201 and one HTTP 409, exactly one queue item and one production job.
- **Automation/security PASS:** [run 40893664584](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40893664584) — 422 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; syntax/compilation checks passed.
- **Content quality PASS:** [run 40893664244](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40893664244). **Metadata PASS:** [run 40893664370](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40893664370). **Dashboard browser E2E PASS:** [run 40893664245](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40893664245). **Isolated baseline PASS:** [run 40893664265](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40893664265). **Branch inventory PASS:** [run 40893664582](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40893664582).
- **Production readiness:** [run 40893664254](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40893664254) correctly remains blocked/fail-closed. The Facebook workflow [run 40893664325](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40893664325) passed local validation but skipped `create-draft-package`; it is not provider acceptance.
- **DASH-001 remains NOT_TESTED.** These are targeted concurrency and inventory regression results, not exhaustive acceptance of all controls/forms/routes. No external publishing or schedule mutation occurred.

## Exact-SHA dashboard concurrency and Facebook workflow boundary — 29 October 2026, 14:52 UTC

- **Exact tested source/test SHA:** `713a876f0753b2200b69ebb566438728400ae017`.
- **Automation/security PASS:** [run 40895185517](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40895185517) — 423 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; syntax/compilation checks passed.
- **Content quality PASS:** [run 40895185111](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40895185111). **Metadata PASS:** [run 40895185573](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40895185573). **Dashboard browser E2E PASS:** [run 40895185260](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40895185260). **Isolated baseline PASS:** [run 40895185238](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40895185238). **Branch inventory PASS:** [run 40895185354](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40895185354).
- **Dashboard regressions:** multiline literal route detection; simultaneous lease claims result in one grant/one rejection and one audit event; simultaneous identical draft submissions result in one creation/one conflict with one queue item and one production job.
- **Facebook workflow clarification:** [run 40895185599](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40895185599) passed local draft validation. Its provider-side draft operation is not implemented here and is explicitly `BLOCKED_EXTERNAL`; the local package job is skipped on PR and the workflow summary says no Meta API write or remote Page draft is claimed.
- **Production readiness:** [run 40895185212](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40895185212) correctly remains blocked/fail-closed. **DASH-001 remains NOT_TESTED**; these targeted tests do not complete the full dashboard matrix.

## Exact-SHA Facebook safety and dashboard regression checkpoint — 29 October 2026, 14:57 UTC

- **Exact tested source/test SHA:** `75ef3a5ee5c3eb41f1edec106d65145b219d737c`.
- **Automation/security PASS:** [run 40896235089](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40896235089) — 424 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; syntax/compilation checks passed.
- **Content quality PASS:** [run 40896235208](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40896235208). **Metadata PASS:** [run 40896235156](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40896235156). **Dashboard browser E2E PASS:** [run 40896235539](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40896235539). **Isolated baseline PASS:** [run 40896235384](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40896235384). **Branch inventory PASS:** [run 40896235084](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40896235084).
- **Meta safety:** the scheduled autonomous publisher workflow now hardcodes `FACEBOOK_PUBLISH_ENABLED=NO`; config remains `publishingEnabled=false`, `dryRun=true`, `emergencyStop=true`. The daily draft workflow is explicitly local-only and reports provider-side draft creation/read-back as `BLOCKED_EXTERNAL` ([run 40896235130](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40896235130)).
- **Production readiness:** [run 40896235238](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40896235238) correctly remains blocked/fail-closed. **DASH-001 remains NOT_TESTED**; targeted regression passes do not establish full control/form/route acceptance.


## Exact-SHA strict rights-verification timestamp checkpoint — 29 October 2026

- **Application-code commit:** `b4841acbf9a891553f2156b3b34ec4aca33f5e80`. **Exact tested source/test SHA:** `bd988fd5a1c565401f1c34ec94e1c59a4312d95a`.
- **Fix:** human-review rights evidence now uses the shared strict ISO timestamp validator. It rejects timezone-free timestamps, impossible calendar dates, invalid UTC offsets and malformed values. Regression tests accept a valid zoned timestamp and reject invalid variants.
- **Automation/security PASS:** [run 40939877673](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40939877673) — 425 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; syntax/compilation checks passed.
- **Content quality PASS:** [run 40939877782](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40939877782), 425 tests, 0 failures/skips. **Metadata PASS:** [run 40939877719](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40939877719), 425 tests, 0 failures/skips. **Dashboard Chromium E2E PASS:** [run 40939877781](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40939877781), 15 journeys. **Isolated main/candidate baseline PASS:** [run 40939877744](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40939877744), [artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40939877744/artifacts/12926641458). **Non-destructive branch inventory PASS:** [run 40939877733](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40939877733).
- **Production readiness remains BLOCKED/fail-closed:** [run 40939877767](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40939877767). This is not a successful release-readiness gate. **Meta workflow:** [run 40939877715](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40939877715) passed local draft validation only; provider-side draft creation/read-back was skipped and remains `BLOCKED_EXTERNAL`.
- **Acceptance register:** 68 requirements — 52 PASS, 8 NOT_TESTED, 8 BLOCKED_EXTERNAL. The new `RIGHTS-TIMESTAMP-001` requirement is PASS based on exact-SHA tests and CI.
- **Live Git comparison:** `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 2,142 ahead / 2 behind / 180 changed files at the source/test checkpoint. PR #1 remains open, draft and unmerged.
- **Remaining limits:** DASH-001 exhaustive control/form/route acceptance, cross-process crash/deployment drills, full semantic history reconciliation, genuine media/licence evidence and human approval, authenticated YouTube identity/history and authorized private upload, native Related-video verification, provider-side Meta draft read-back, owner decisions and branch-protection verification remain unresolved. No live publishing operation occurred.
