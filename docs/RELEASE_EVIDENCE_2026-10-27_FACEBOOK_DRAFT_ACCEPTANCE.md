# Release evidence addendum — candidate Facebook draft acceptance

Date: 27 October 2026

## Exact repository state

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- PR #1: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1 — OPEN, DRAFT, UNMERGED
- Exact PR head and workflow/test execution SHA: `a02644d448373de9c0f2a1322720a90fd7f0b36a`
- `main` SHA: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Live divergence at this checkpoint: 1,677 commits ahead / 2 behind.
- Changed-file count for PR: 162 (the comparison count is the current branch-vs-main view, not a count of files changed by this checkpoint commit).

This checkpoint changes the GitHub Actions workflow only. The application/test implementation remains at the previously recorded application-code/test checkpoint; the full CI below nevertheless ran against the exact candidate head above.

## Implemented workflow change

`.github/workflows/facebook-daily-draft.yml` now has a `validate-candidate-draft` job for PRs and implementation-branch pushes. It:

1. Installs locked dependencies without lifecycle scripts.
2. Runs `test/facebook-daily-draft.test.mjs` and `test/restore-facebook-draft-history.test.mjs`.
3. Generates a deterministic local draft package without calling Meta or retaining a competing artifact.
4. Asserts stable draft identity, the Nature Frontiers Facebook destination, no unverified Page ID, `Africa/Johannesburg`, publishing disabled, no fabricated media/rights evidence, and actionable review blockers.
5. Leaves the retained daily artifact job restricted to scheduled/manual runs on `main`.

This corrects the candidate workflow's prior behavior where its only job was skipped on PRs and candidate pushes. A successful candidate validation is evidence of the local draft/recovery pipeline only; it is not evidence of a live Meta API integration, verified Page identity or external draft creation.

## Exact-head CI outcomes

All URLs below are tied to PR head `a02644d448373de9c0f2a1322720a90fd7f0b36a`, except the explicitly identified push-triggered checks.

- Candidate Facebook draft/recovery validation: **PASS** — https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40560758575
- Automation/security and unit suite: **PASS** — https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40560758655
- Dashboard browser E2E against the real local dashboard/backend: **PASS** — https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40560758577
- Content quality: **PASS** — https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40560758561
- Metadata validation: **PASS** — https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40560758556
- Isolated `main`/candidate baseline: **PASS** — https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40560758727
- Production readiness: **BLOCKED, fail-closed** — https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40560758625. Both human-readable and JSON readiness commands returned exit code 2; the workflow retained its diagnostic report and correctly failed the release gate.
- Candidate push lockfile verification: **PASS** — https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40560750037
- Candidate push draft validation: **PASS** — https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40560749857

The production-readiness failure is not counted as a code-test regression: it is the expected release gate while mandatory production prerequisites remain unmet. It must not be relabeled as a pass.

## Remaining acceptance blockers

- No genuine rights-cleared production MP4 plus complete human full-playback/factual/realism/rights approval is proven.
- No authoritative authenticated SonicVhibez OAuth identity and complete public/private/unlisted history reconciliation is evidenced.
- No explicit one-operation private-upload authorization and verified remote receipt is evidenced.
- Native YouTube Short Related-video association remains unverified and may be unavailable under the private-only parent constraint; do not change visibility or publish publicly to bypass it.
- No genuine non-skipped Meta API/Page integration has been verified. The new workflow validates only local draft generation and mocked/injected recovery behavior.
- The owner-approved feasible publication cadence remains outstanding; the 72-hour minimum is not waived.
- Full backup/restore failure-injection, deployment/recovery drills, and divergent-history governance review remain outstanding.

## Safety and release decision

**IMPLEMENTATION INCOMPLETE / PRODUCTION BLOCKED.**

Public/unattended YouTube publishing remains disabled. Facebook live publishing remains disabled. Safari campaigns remain inactive. Nature Frontiers must never be a YouTube target. The approved Selar URL remains exactly `https://selar.com/0u19v8u99l`.

No video upload, social post, campaign activation, PR merge, `main` edit, reset, rebase, force-push or destructive history operation was performed.


---

## Follow-up exact-SHA checkpoint — restore rejects empty backups (27 October 2026)

This addendum supersedes no historical result above; the earlier sections refer to their explicitly stated SHAs. This checkpoint records the later restore-safety change and its own completed CI runs.

- Exact application/source/test SHA: `b97378fec30b49a25c30ed2ce5fcac0bf7d75114`
- Application change: `scripts/restore-state.mjs` rejects a valid-looking backup with zero entries instead of returning `RESTORE_COMPLETED` with zero restored files.
- Regression test: `tests/restore-state.test.mjs` asserts the empty-backup rejection while retaining the `RESTORE_CONFIRM=YES` confirmation gate.
- The separate `test/restore-facebook-draft-history.test.mjs` remains present and was not removed.

### Exact-SHA workflow outcomes for `b97378fec30b49a25c30ed2ce5fcac0bf7d75114`

- Automation/security and unit suite: **PASS** — [run 40562493445](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40562493445). Dependency installation, locked dependency audit, FFmpeg setup, unit tests, destination/disclosure checks, metadata safety checks, queue invariants, JavaScript syntax checks and Python compilation completed successfully.
- Dashboard browser E2E: **PASS** — [run 40562493423](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40562493423).
- Content quality: **PASS** — [run 40562493442](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40562493442).
- Metadata validation: **PASS** — [run 40562493428](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40562493428).
- Isolated main/candidate baseline: **PASS** — [run 40562493544](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40562493544).
- Candidate Facebook draft/recovery validation: **PASS** — [run 40562493425](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40562493425). This validates the candidate local draft/recovery workflow; it does not prove a live Meta API draft.
- Candidate push lockfile verification: **PASS** — [run 40562483356](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40562483356).
- Production readiness: **BLOCKED / fail-closed** — [run 40562493422](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40562493422). This is an expected release-gate failure while external production requirements remain unmet, not a test pass.

### Remaining release blockers

No real production MP4 with independently reviewed rights evidence and complete human playback approval; verified SonicVhibez OAuth identity and complete remote upload history; explicitly authorized private-upload operation and verified remote receipt; independently verified eligible native Short Related-video association; live Meta draft-only integration; owner-approved feasible cadence; or complete interrupted-restore, deployment and operational recovery drills have been demonstrated by this checkpoint.

**Verdict: IMPLEMENTATION INCOMPLETE / PRODUCTION BLOCKED.** Public/unattended YouTube publishing remains disabled; Facebook live publishing remains disabled; Safari remains inactive; Nature Frontiers is prohibited as a YouTube target; the approved Selar URL remains `https://selar.com/0u19v8u99l`. No upload, external post, campaign activation, PR merge, `main` edit, reset, rebase, force-push or destructive history operation was performed.
