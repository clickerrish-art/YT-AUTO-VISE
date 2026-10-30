# Current release evidence — 30 October 2026

## Live repository state

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Implementation branch: `codex/marketing-machine-audit-fixes`
- PR #1: [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1)
- Live PR HEAD at evidence preparation: `1e8e957c22e9c3f1e555aadd37f4cfef8bef6a40`
- Live `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- GitHub compare at this snapshot: 1,821 commits ahead / 2 behind / 164 changed files.
- No main-branch change, merge, rebase, reset, force-push, branch deletion or destructive reconciliation was performed.

## Exact tested application/source candidate

- Exact source/test candidate: `115fe82252b4fa1ef1eb2f9587bf0653356a6dc9`
- Candidate commit: [test: reject invalid review receipt timestamps](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/115fe82252b4fa1ef1eb2f9587bf0653356a6dc9)
- The candidate adds validation that review receipt timestamps are explicit-timezone, calendar-valid timestamps both when created and when reused.
- The candidate's recorded automation/security result: 426 Node tests, 0 failures, 0 skips; 16 Python tests passed; npm audit reported 0 vulnerabilities. FFmpeg/ffprobe, JavaScript syntax and Python compilation checks passed.
- Later PR HEAD `1e8e957c22e9c3f1e555aadd37f4cfef8bef6a40` is a documentation-only descendant of this tested candidate. A comparison of the exact candidate to that HEAD shows five documentation files changed and no application/test files changed.
- This is not a new test run on the current PR HEAD. It is exact-candidate evidence; do not label the later documentation commit as tested application code.

## Exact-candidate workflow evidence

All listed workflow runs are associated with exact candidate `115fe82252b4fa1ef1eb2f9587bf0653356a6dc9`.

| Workflow | Result | Run |
|---|---|---|
| Automation/security | PASS | [40940647523](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40940647523) |
| Content quality | PASS | [40940647323](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40940647323) |
| Metadata validation | PASS | [40940647496](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40940647496) |
| Dashboard browser E2E | PASS | [40940647329](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40940647329) |
| Isolated main/candidate baseline | PASS | [40940647321](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40940647321) |
| Non-destructive branch inventory | PASS | [40940647363](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40940647363) |
| Local Nature Frontiers draft-package validation | PASS | [40940647309](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40940647309) |
| Production readiness | BLOCKED (expected fail-closed result) | [40940647448](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40940647448) |

The readiness run uploaded the diagnostic artifact `sonicvhibez-readiness-report` (artifact ID `12926154146`). The workflow intentionally fails when mandatory readiness gates remain blocked. The local Facebook workflow validates a local draft package only; it does not prove provider-side Meta draft creation or read-back.

## Changes since the earlier documented source/test candidate

A live compare from earlier candidate `75ef3a5ee5c3eb41f1edec106d65145b219d737c` to tested candidate `115fe82252b4fa1ef1eb2f9587bf0653356a6dc9` reports 14 commits ahead, 0 behind and nine changed files:

- `scripts/human-review.mjs`
- `test/human-review.test.mjs`
- `test/dashboard-api-auth-matrix.test.mjs`
- `docs/BRANCH_RECONCILIATION_REPORT_2026-10-28.md`
- `docs/CURRENT_RELEASE_EVIDENCE_2026-10-29.md`
- `docs/DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.md`
- `docs/GO_LIVE_BLOCKERS.md`
- `docs/RELEASE_GATE_CHECKLIST.md`
- `docs/REQUIREMENTS_ACCEPTANCE_REGISTER.json`

The source change hardens review-receipt timestamp validation; the associated tests add invalid-timestamp and API authentication-matrix coverage. The subsequent five commits from the tested candidate to the live PR HEAD update documentation only. No assertion is made that every intervening commit has received a separate semantic review.

## Acceptance register snapshot

The live machine-readable register contains 69 requirements:

- PASS: 53
- NOT_TESTED: 8
- BLOCKED_EXTERNAL: 8

The aggregate is not 100% acceptance. In particular:

- DASH-001 remains NOT_TESTED: exhaustive behavior-specific acceptance for every dashboard control, form and API route is not complete. The static inventory is 105 controls, 15 forms and 38 literal routes (10 GET, 28 POST); this is inventory, not functional acceptance.
- STATE-001 remains NOT_TESTED: controlled process termination coverage exists, but all transaction boundaries, true power-loss durability and production-like recovery/rollback are not accepted.
- SCHED-001 remains NOT_TESTED: full queue/history, worker-overlap, restart and operational schedule acceptance is incomplete.
- GIT-002 remains NOT_TESTED: the large branch divergence still needs human semantic review, including both main-only commits and the historical restore-test incident.
- DEPLOY-001 remains NOT_TESTED: clean isolated installation, monitoring, backup/restore and deployment rollback have not been operationally accepted.
- SHORT-PARENT-001 and SCRIPT-PROMPT-001 remain NOT_TESTED.
- YT-001, YT-002, YT-003, FB-001, SEC-001, SCHED-003, YOUTUBE-RELATED-001 and META-REMOTE-SCHEDULED-001 remain BLOCKED_EXTERNAL.

## Safety and external boundaries

- YouTube target remains SonicVhibez only. Nature Frontiers must never be used as a YouTube destination.
- Public and unattended YouTube publishing remain disabled. No upload or visibility change was performed.
- The documented channel ID discrepancy must be resolved through authenticated account/API verification; do not guess or silently correct it.
- No provider-side Meta draft creation/read-back is proven. Live Facebook and Instagram publishing remain disabled; `publishingEnabled=false`, `dryRun=true`, `emergencyStop=true`, and `FACEBOOK_PUBLISH_ENABLED=NO` remain required.
- No campaign activation or Metricool schedule mutation was performed. The eight recorded future Nature Frontiers schedule records require individual owner decisions before any change.
- Owner-approved cadence, genuine rights-cleared production media, human review, provider identities/permissions, authorized private-upload evidence and native YouTube Related-video evidence remain outstanding.
- Branch protection/required checks must be verified and enabled by the repository owner/admin; connector access did not provide authoritative confirmation in this session.

## Branch reconciliation

The latest retained full-history inventory is for an earlier branch snapshot, not the live HEAD in this report. It identified 2,109 branch-only commits, 2 main-only commits and 178 final-tree changed files for its own recorded snapshot. The two main-only commits are the historical test-file addition and explicit revert. Both `test/restore-facebook-draft-history.test.mjs` and `tests/restore-state.test.mjs` are present on the current implementation branch.

The inventory artifact and report are evidence for a human review, not integration approval. A new inventory and full semantic review against the current live HEAD are still required. Do not reconcile destructively.

## Verdict

**NOT PRODUCTION READY.** The exact tested candidate has passing automated checks, but critical repository-controlled acceptance and genuine owner/provider gates remain open. No 100% completion claim is justified.
