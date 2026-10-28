# Non-destructive branch reconciliation report — 28 October 2026

## Scope and safety

This is a read-only snapshot of live GitHub refs for `clickerrish-art/YT-AUTO-VISE`. No merge, rebase, reset, force-push, branch deletion, file deletion, or edit to `main` was performed. PR #1 remains open, draft, and unmerged.

## Live ref snapshot

- Implementation branch: `codex/marketing-machine-audit-fixes`
- Branch HEAD when this report was prepared: `58a8a061624e11931a490c8e75daf613332c328a`
- PR #1 HEAD at that snapshot: `58a8a061624e11931a490c8e75daf613332c328a`
- Live `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Divergence: **1,921 commits ahead / 2 commits behind**
- Net changed-file comparison against `main`: **171 files** — 132 added, 39 modified, 0 removed, 0 renamed in the comparison result.

The GitHub compare result provides the current ahead/behind counts and net changed-file summary. It does not provide a complete, auditable enumeration of all 1,921 branch-only commits or a reliable commit-by-commit duplicate-change analysis in this report. That full history review remains open; this report is not an integration recommendation.

## Identified main-only commits

The two commits on `main` that are not in the implementation branch are:

1. [`71578dafc24e5d48173dce3f4e392e18e42aa40e`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/71578dafc24e5d48173dce3f4e392e18e42aa40e) — “Exercise cross-run history restoration with mocked GitHub artifact API”. Its change added `test/restore-facebook-draft-history.test.mjs` to `main`.
2. [`fa00d28e7f58911482686e4ad69fac9f4701a2e6`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/fa00d28e7f58911482686e4ad69fac9f4701a2e6) — “Revert unintended test-file write to default branch”. Its diff deletes that test file from `main`.

The implementation branch still contains `test/restore-facebook-draft-history.test.mjs` (blob SHA `b6d4ab9c30d1e025bf2e55bddae446d96a2cb2a3`) and `tests/restore-state.test.mjs` (blob SHA `43c1bd128f586f1db1ea917433260170f11bbf01`). Preserve both tests and their intended regression coverage. The main-only addition followed by revert is a concrete history discrepancy; it is not justification to delete the valid branch test.

## Recent implementation commits on the branch

The latest source/test work in this checkpoint is:

- [`b47d08614fa31074d2118cadc98df356478784b2`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/b47d08614fa31074d2118cadc98df356478784b2) — require exact Page-ID boundaries for Meta post read-back.
- [`e090b19136d9336c45fd1a01c4c90400c05405d4`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/e090b19136d9336c45fd1a01c4c90400c05405d4) — reject symlinked Meta image assets.
- [`ecad7ac2c706983e79c6206bbccb1a6fcaeb3bd9`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/ecad7ac2c706983e79c6206bbccb1a6fcaeb3bd9) — regression tests for both defects; this is the exact tested source/test candidate.

The current branch HEAD is later than that candidate because of documentation-only commits. Exact-SHA CI evidence is recorded in [current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-28.md) and the [acceptance register](REQUIREMENTS_ACCEPTANCE_REGISTER.json).

## Required next reconciliation steps

1. Obtain a complete commit graph and per-commit file inventory for all branch-only commits and both main-only commits.
2. Classify branch-only changes as intentional implementation, generated artifacts, documentation-only, duplicated/repeated change, superseded change, or risky deletion.
3. Compare final tree contents for all critical modules and tests, including restore history and state recovery.
4. Inspect branch protection, required status checks, PR file list, and any accidental writes to `main`.
5. Produce an explicit, reviewed integration strategy only after the full inventory; do not merge or rewrite history as part of the audit.

**Current conclusion:** non-destructive snapshot recorded; full reconciliation remains **NOT COMPLETE**. PR #1 stays open/draft/unmerged, and `main` remains unchanged.

## Source/test candidate update — 28 October 2026

The original ref snapshot above was captured before the latest Meta adapter fixes. The current exact source/test candidate is `c6b93328a92b48539650c96b647989fd9538623f`; the code changes since that snapshot are the strict timezone-qualified schedule validation and its regression test. Exact-candidate automation, content quality and metadata each passed 400 Node tests with zero skips; automation passed 16 Python tests and npm audit reported zero vulnerabilities; dashboard E2E passed 15 tests; isolated main/candidate baseline commands exited 0. See [current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-28.md).

The branch is still substantially divergent; no history rewrite or integration was attempted. Preserve `test/restore-facebook-draft-history.test.mjs` and `tests/restore-state.test.mjs`. Full branch-only commit-by-commit inventory and duplicate-change classification remain incomplete, so this remains a snapshot rather than an integration recommendation.


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

The commit-by-commit inventory and duplicate/superseded-change classification are still NOT COMPLETE; no history rewrite or integration was performed.

## Baseline result resolved — 28 October 2026

Follow-up to the earlier note that exact-candidate baseline evidence was pending: isolated baseline workflow [40664619319](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664619319) completed successfully on documentation-only PR head `a0d71fcbc53bdfa0909328567e4da4a004dd3de8`, whose application source/test candidate remained `e5f866d910db3a572a280f59c4c9ba17d4061c7f). Both `main` and candidate Node/Python test commands exited 0; FFmpeg and ffprobe 6.1.1 were installed. Artifact [12806220430](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40664619319/artifacts/12806220430), ZIP SHA-256 `c052006e3424e8ea1d999c517de93a37bca336d2586099ce882464570711bd27`.

This resolves the pending baseline status for the tested source/test candidate. It does not resolve full branch-history reconciliation or production blockers. The source/test SHA remains `e5f866d910db3a572a280f59c4c9ba17d4061c7f`; later commits are documentation-only.
