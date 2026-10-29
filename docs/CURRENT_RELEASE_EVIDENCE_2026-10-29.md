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
