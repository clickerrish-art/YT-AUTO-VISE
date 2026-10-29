# Current implementation checkpoint — 29 October 2026 (exact candidate f363baeee5c)

## Authoritative live refs

- Implementation branch: `codex/marketing-machine-audit-fixes`
- Exact tested source/test candidate: `f363baeee5c14c21c3980001980df0eddb330b5d`
- Current PR head at this checkpoint: `f363baeee5c14c21c3980001980df0eddb330b5d`; later documentation-only commits will be explicitly distinguished from this tested candidate.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6` (unchanged by this work)
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Compare snapshot before documentation refresh: 2,073 ahead / 2 behind / 175 changed files; complete commit-by-commit reconciliation remains incomplete.
- PR #1 remains open, draft, and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- GitHub reports `main` unprotected and required status-check enforcement off. Owner/admin action is required to configure protection; no settings were changed.

## Implemented code and regression

- [`49e1df2`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/49e1df25d6a512eb31b6b48132c5a3880f9010cb): upload log/ledger directory now uses `ensureSafeDirectoryPath`, rejecting symlinked path components before creating recovery-state descendants.
- [`941a27a`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/941a27a3d8eed2cc51c7842759595dd2d479a35c): regression test confirms a symlinked ancestor is rejected and no nested log directory/artifacts are created through the link.
- [`b70cdf6`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/b70cdf6e510cf7a959ecadc3ab8a9fc7ac9cc2a1) and [`22ee0e7`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/22ee0e755f339d3850fb1ea3f75afb470e1e6ed8): centralized remote YouTube read-back validation and require the exact remote video ID, verified channel ID, approved title, and private visibility.
- [`78a4b86`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/78a4b8625532ef9f040c1eef1b5b341b2ed7274b) adds direct field-mismatch tests. An intermediate source-guard assertion failed after centralization; [`f363bae`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/f363baeee5c14c21c3980001980df0eddb330b5d) corrected the assertion to target the shared verifier. The corrected exact candidate passed CI.
- These are targeted safety improvements, not proof of live provider acceptance, complete history reconciliation, or all file operations being race-free.

## Exact-candidate CI

All listed runs below target `f363baeee5c14c21c3980001980df0eddb330b5d`:

- Automation/security: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40854698985) — 419 Node tests, 0 failures, 0 skipped; 16 Python tests passed; npm audit reported 0 vulnerabilities; normal lifecycle install, syntax/compile and FFmpeg/ffprobe checks passed.
- Content quality: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40854699039).
- Metadata validation: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40854699028).
- Dashboard Chromium E2E: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40854698955) — 15 journeys; not exhaustive per-control acceptance.
- Isolated main/candidate baseline: [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40854698991).
- Production readiness: [BLOCKED as designed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40854698976); the workflow preserved a diagnostic artifact and returned exit code 2 for missing prerequisites.
- Facebook daily draft: [local candidate validation passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40854698962); external provider draft-creation job was skipped, so this is not proof of a real Meta draft.

## Current acceptance status

The machine-readable register now has 66 requirements: 50 PASS, 8 NOT_TESTED, 8 BLOCKED_EXTERNAL. `UPLOAD-LOG-PATH-001` is PASS only for the targeted symlink rejection criterion. `YT-READBACK-001` is PASS for shared read-back validation and its field-mismatch tests; actual provider-side upload acceptance remains blocked. `DASH-001` remains NOT_TESTED: the 105-control / 15-form / 38-route inventory is not exhaustive acceptance. `STATE-001` remains NOT_TESTED because process termination at every transaction boundary, disk-full/permission-failure drills, deployment rollback and power-loss durability are not fully demonstrated.

External acceptance remains blocked for real rights-cleared production media and human review, verified YouTube OAuth/channel/history and a separately authorized private upload with provider read-back, native Short-parent association evidence, actual Meta Page/Instagram identity and provider draft read-back, owner-approved feasible cadence, per-record owner decisions for existing Metricool schedules, and full Git history reconciliation. Safari remains inactive. Nature Frontiers remains prohibited as a YouTube target. Public/unattended YouTube publishing and live Meta publishing remain disabled. The approved Selar URL remains `https://selar.com/0u19v8u99l`.

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
