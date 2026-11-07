# Current inventory refresh — 5 November 2026

The latest non-destructive inventory was generated from exact source/test candidate `51ad2bbcd502c9e44717cd4a529794993cfc50fe` in [workflow run 41951888807](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888807).

- Main: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Candidate: `51ad2bbcd502c9e44717cd4a529794993cfc50fe`.
- Divergence: **2,604 branch-only commits / 2 base-only commits**.
- Final tree: **231 changed paths**, zero final-tree deletions.
- Patch-equivalent branch commits: **0** (patch-ID heuristic only; not semantic equivalence).
- Critical paths requiring review: **17**.
- CI working tree clean; destructive reconciliation: **none**.
- Branch-only heuristic classification: 1,109 documentation-only; 640 test-only; 543 implementation; 106 workflow-only; 75 mixed; 73 implementation-and-tests; 58 config/content.
- Inventory decision: **REQUIRES_REVIEW**. GIT-002 remains **NOT TESTED** until a human reviews critical implementation, security, workflow, configuration and history changes.
- Semantic findings fixed in this candidate: publisher lock release and daily-draft write cleanup now compare device/inode before unlinking; worker regression tests cover uncertain 408/5xx dispatch outcomes.
- PR #1 remains open/draft/unmerged; main unchanged. Branch protection remains unverified due GitHub 403.
- Preserve `test/restore-facebook-draft-history.test.mjs` and `tests/restore-state.test.mjs`.

The older inventory snapshot below is retained as historical evidence and is superseded by this exact-head refresh.

---

# GIT-002 semantic review briefing — 5 November 2026

## Decision

**Live inventory refreshed 5 November 2026 on exact source/test candidate `51ad2bbcd502c9e44717cd4a529794993cfc50fe`.** The latest exact-SHA inventory reports 2,604 branch-only commits, 2 base-only commits, 231 changed paths, zero final-tree deletions, zero patch-equivalent commits and 17 critical paths. The inventory is non-destructive; semantic review has identified and fixed two file-ownership races and added worker uncertain-outcome regression coverage, but full critical-path review and integration remain unauthorized.

**Status: NOT TESTED — human semantic review remains required.**

This document records a reproducible, non-destructive history inventory and identifies the concrete human review decisions. It does not claim that a human has reviewed or approved integration, and it does not authorize merge, rebase, reset, force-push or history rewriting.

## Exact inventory snapshot

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Base: `main` at `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Candidate: `codex/marketing-machine-audit-fixes` at `51ad2bbcd502c9e44717cd4a529794993cfc50fe`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Divergence: **2,604 branch-only commits / 2 base-only commits**
- Final base-to-head tree: **231 paths changed** on exact candidate `51ad2bbcd502c9e44717cd4a529794993cfc50fe`.
- Exact-head inventory: 231 changed paths, zero final-tree deletions, 2,604 branch-only commits and 2 base-only commits.
- Patch-equivalent branch commits reported by `git cherry`: **0**. This is not proof that no changes are semantically duplicated; it only reports no patch IDs matched.
- CI checkout working tree: clean. This does not assert anything about a developer's separate local working tree.
- Destructive reconciliation performed: **no**.

## Branch-only commit classification

The CI inventory classified 2,604 branch-only commits as follows:

| Classification | Commits |
|---|---:|
| Documentation-only | 1,109 |
| Test-only | 640 |
| Implementation | 543 |
| Workflow-only | 106 |
| Mixed | 75 |
| Config/content | 58 |
| Implementation and tests | 73 |
| **Total** | **2,604** |

The volume of documentation-only and test-only commits indicates a long, incremental implementation history. It is not evidence that those commits are disposable. The 543 implementation-only and 73 implementation-plus-test commits require review against the final source tree and each other.

## Base-only history and restore-history preservation

The two base-only commits concern the same path:

1. `71578dafc24e5d48173dce3f4e392e18e42aa40e` — added `test/restore-facebook-draft-history.test.mjs` to exercise cross-run history restoration with a mocked GitHub artifact API.
2. `fa00d28e7f58911482686e4ad69fac9f4701a2e6` — reverted the unintended test-file write to the default branch and deleted that test.

The implementation branch retains `test/restore-facebook-draft-history.test.mjs`. This is a test-file add/delete sequence on main, not evidence that the branch should delete the test. Preserve it pending human review of its assertions and its relationship to the current restore implementation.

## Critical final-tree paths requiring semantic review

The inventory identified 17 critical paths:

- Added: `public/dashboard.html`
- Added: `scripts/backup-state.mjs`
- Added: `scripts/content-job-lifecycle.mjs`
- Added: `scripts/dashboard-inventory.mjs`
- Added: `scripts/dashboard-server.mjs`
- Added: `scripts/facebook-autonomous-publisher.mjs`
- Added: `scripts/facebook-pipeline.mjs`
- Added: `scripts/human-review.mjs`
- Added: `scripts/meta-page-adapter.mjs`
- Added: `scripts/operator-auth.mjs`
- Modified: `scripts/production-readiness.mjs`
- Added: `scripts/restore-state.mjs`
- Added: `scripts/schedule-policy.mjs`
- Modified: `scripts/upload-private.mjs`
- Added: `scripts/youtube-history-gate.mjs`
- Added: `test/restore-facebook-draft-history.test.mjs`
- Added: `tests/restore-state.test.mjs`

The full branch inventory artifact contains commit chronology, per-commit changed paths, branch/base-only commit lists, deletion records, and the final-tree changed-file list.

Artifact: [Non-destructive branch inventory workflow 41951888807](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888807). Its retained artifact was generated on exact SHA `51ad2bbcd502c9e44717cd4a529794993cfc50fe`.

## Semantic findings already fixed on the current candidate

1. **Facebook publisher lock ownership:** `scripts/facebook-autonomous-publisher.mjs` previously unlinked its lock path unconditionally during release. If a stale-lock recovery action replaced the path while the original publisher was still running, the original process could delete the replacement lock. Release now compares the open descriptor's device/inode with the path before unlinking. Regression test: `lock release never removes a replacement lock owned by another process`.
2. **Daily draft artifact ownership:** `scripts/generate-facebook-daily-draft.mjs` previously unlinked the output path unconditionally after a write/fsync failure. If another process replaced that path, cleanup could delete the replacement artifact. Both new-draft and retained-history cleanup paths now remove only the inode created by the current invocation. Regression test covers both paths.
3. **Uncertain worker dispatch outcomes:** `test/worker-runner.test.mjs` now explicitly verifies HTTP 408 and 5xx responses stop the worker, prevent dispatch of the next queued job, and do not create an ordinary retry cooldown.

Focused local regression tests passed 44/44 across worker runner, Facebook publisher and daily-draft suites. Exact-SHA automation passed 529 Node tests across 111 files, 16 Python tests, zero skips, and npm audit reported zero vulnerabilities. These findings demonstrate targeted semantic review; they do not complete review of all 17 critical paths or authorize integration.

## Human review decisions required

1. Review the final diff and tests for the 17 critical paths, prioritizing authentication/authorization, private upload authorization, history reconciliation, Meta identity boundaries, restore transaction recovery, and schedule policy.
2. Review the 543 implementation-only, 73 implementation-and-test, and 75 mixed branch-only commits for superseded or conflicting implementations; do not infer semantic duplication from commit subjects or file overlap alone.
3. Review the 106 workflow-only and 58 config/content commits for secret exposure, permission broadening, publishing activation, environment drift, and changes to protected brand/channel boundaries.
4. Confirm that the branch's restored `test/restore-facebook-draft-history.test.mjs` is the intended test and that the main-side revert does not represent a product decision to remove it.
5. Decide the eventual integration strategy only after the above review. No merge, rebase, reset, force-push, or branch rewrite is authorized by this inventory.

## Reproduction

Run from a full clone with both refs fetched:

```sh
npm run report:branch -- --base origin/main --head codex/marketing-machine-audit-fixes
```

The report is an inventory and heuristic classification. It is not a substitute for reviewing code diffs, tests, configuration, and runtime behavior.
