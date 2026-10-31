# Latest multi-process worker finalization and heartbeat acceptance — 31 October 2026, 19:13 UTC

This update supersedes earlier live-state snapshots below. Historical checkpoints are retained.

## Live GitHub state

- Starting branch SHA for this continuation: `29dfd92acc566e864391b3c5be8c821344e008f8`.
- Exact latest code/test SHA: `2904439f53cec6ae13a9a8a58597a69d720a90dc`.
- Documentation follow-ups: API matrix commit `27cb875be8688fef458922d8f20bb4847ed6a84b`, Git review briefing `cf8813e687b0d44790de58e75ddadb8bd517716d`, worker route matrix update `6f990b3358a44f0b4aadd6417e862ac396a7cc60`, and final worker route matrix update `e70ad9036b3a868467d963cb34bd9a2d4a8f3768`.
- Live branch HEAD: `e70ad9036b3a868467d963cb34bd9a2d4a8f3768`; main: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Compare: **2,350 ahead / 2 behind / 193 changed files**.
- PR #1 remains **OPEN, DRAFT, UNMERGED**. Branch protection remains disabled.
- No main edit, merge, reset, rebase, force-push, branch deletion or destructive reconciliation occurred.

## Worker lifecycle regression and repair

The new real-server test `test/dashboard-api-worker-finalization-race.integration.test.mjs` is on exact code/test SHA `2904439f53cec6ae13a9a8a58597a69d720a90dc`.

It starts two independent dashboard processes sharing an isolated persistent state directory and verifies:

- Two concurrent heartbeats using the same valid lease token are serialized and both succeed; both heartbeat audit events persist.
- Two concurrent duplicate completion requests against one lease produce exactly one successful completion and one rejected duplicate; exactly one completion audit event persists.
- Two concurrent expired-lease reaper requests produce exactly one successful reaping and one HTTP 409; exactly one expiry audit event persists.
- Persisted content jobs remain non-publishable.

The first attempt at SHA `bbd883be32c779c7016a83d59e94ded77fadd64f` failed because the test incorrectly expected a root-level `publishingEnabled` state flag. The actual invariant is stored on each content job. The assertion was corrected in `269c024b103fddf6a440f9bf5cc83d71a1f27761`; the corrected race test passed. This was a test assertion defect, not a discovered production publishing defect.

## Exact-SHA CI for `2904439f53cec6ae13a9a8a58597a69d720a90dc`

| Workflow | Run | Result |
|---|---:|---|
| Automation/security + Node unit tests | [41232932942](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232932942) | **PASS — 449 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities** |
| Dashboard browser E2E | [41232933016](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232933016) | **PASS — 20/20 Chromium journeys** |
| Content quality | [41232932961](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232932961) | **PASS — 449 tests, 0 failures, 0 skips** |
| Metadata | [41232933216](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232933216) | **PASS** |
| Isolated main/candidate baseline | [41232928603](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232928603) | **PASS** |
| Lockfile verification | [41232928412](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232928412) | **PASS** |
| Non-destructive branch inventory | [41232932905](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232932905) | **PASS — inventory only** |
| Nature Frontiers local draft validation | [41232932878](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232932878) | **PASS — local validation only; provider-side creation job skipped** |
| Production readiness | [41232932910](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232932910) | **HOLD / FAIL-CLOSED — production prerequisites remain unmet** |

## API route matrix improvement

The machine-readable API matrix now records **35 routes / 35 authentication-negative checks passed / 8 overall PASS / 22 NOT_TESTED / 5 BLOCKED**.

Newly accepted route-level evidence:
- `POST /api/jobs/lease/claim`: two-process claim race has one winner; interrupted work is recovered after SIGKILL/restart.
- `POST /api/jobs/lease/heartbeat`: concurrent heartbeats serialize successfully; lease extension, audit and restart persistence are tested.
- `POST /api/jobs/lease/reap`: concurrent reapers yield one success and one 409, with one expiry audit record.
- `POST /api/jobs/lease/complete`: concurrency and duplicate fencing are now tested, but overall acceptance remains NOT_TESTED because successful `GENERATED` completion with a real MP4 and matching metadata is not yet demonstrated.

The five previously accepted read-only GET routes remain PASS. API-001 remains NOT_TESTED because 22 routes are still not fully accepted and five have external-operation blockers.

Evidence: [API route acceptance matrix](https://github.com/clickerrish-art/YT-AUTO-VISE/blob/codex/marketing-machine-audit-fixes/docs/API_ROUTE_ACCEPTANCE_MATRIX.json).

## Overall acceptance boundary

- Requirement register remains **75 total / 58 PASS / 0 FAIL / 9 NOT_TESTED / 8 BLOCKED**.
- DASH-001 remains NOT_TESTED: 20 browser journeys do not individually accept all 101 controls.
- API-001 remains NOT_TESTED: eight routes are accepted; 22 remain untested and five are externally blocked.
- SCHED-001 remains NOT_TESTED. Worker concurrency evidence has improved, but queue cancellation, full retry/recovery boundaries, scheduling semantics, shutdown and complete end-to-end worker acceptance remain open.
- STATE-001 and DEPLOY-001 remain NOT_TESTED; the new worker race test does not constitute complete transaction/disaster-recovery or clean deployment/rollback acceptance.
- GIT-002 remains NOT_TESTED pending authorized human semantic review. The non-destructive inventory and `docs/GIT-002_SEMANTIC_REVIEW_BRIEFING.md` are review preparation, not human approval.
- Production readiness remains HOLD with 13 fail-closed blockers. YouTube and Meta publishing restrictions remain unchanged.
- No live YouTube upload, Facebook/Instagram post, campaign activation, visibility change, or Metricool scheduled-record modification occurred. Nature Frontiers remains prohibited as a YouTube target.

**Verdict: engineering implementation remains PARTIALLY COMPLETE. The worker heartbeat/completion/reaper concurrency slice is now tested and CI-verified on exact SHA `2904439`. The application is not production-ready.**

---

# Latest exact-SHA API concurrency and branch-review update — 31 October 2026, 19:08 UTC

This update supersedes earlier live-state snapshots below. Historical records are retained.

## Live repository state

- Starting branch SHA for this continuation: `29dfd92acc566e864391b3c5be8c821344e008f8`.
- Exact source/test candidate: `7fb12f05aee8ae646390a0584d7a2605703c2e8f`.
- Documentation follow-ups: `27cb875be8688fef458922d8f20bb4847ed6a84b` (API matrix) and `cf8813e687b0d44790de58e75ddadb8bd517716d` (GIT-002 human-review briefing).
- Main: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Live branch after documentation updates: `cf8813e687b0d44790de58e75ddadb8bd517716d`; compare: **2,344 ahead / 2 behind / 192 changed files**.
- PR #1 remains **OPEN, DRAFT, UNMERGED**. Branch protection remains disabled.
- No main edit, merge, reset, rebase, force-push, branch deletion or destructive reconciliation occurred.

## New implementation/test change

Commit `7fb12f05aee8ae646390a0584d7a2605703c2e8f` adds:

- `test/dashboard-api-readonly-concurrency.integration.test.mjs`
- Starts the actual dashboard server with isolated persistent state.
- Runs 20 simultaneous authenticated reads across `/api/state`, `/api/facebook/idea`, `/api/facebook/state`, `/api/facebook/autonomous-status`, and `/api/tasks`.
- Verifies JSON response contracts, publishing remains disabled, internal state paths are not disclosed, and durable state is byte-identical after all reads.

## Exact-SHA validation for `7fb12f05aee8ae646390a0584d7a2605703c2e8f`

| Workflow | Run | Result |
|---|---:|---|
| Automation/security + Node unit tests | [41232372051](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232372051) | **PASS — 448 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities** |
| Dashboard browser E2E | [41232371801](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232371801) | **PASS — 20/20 Chromium journeys** |
| Content quality | [41232371823](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232371823) | **PASS** |
| Metadata | [41232371792](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232371792) | **PASS** |
| Isolated main/candidate baseline | [41232371843](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232371843) | **PASS** |
| Lockfile verification | [41232366724](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232366724) | **PASS** |
| Non-destructive branch inventory | [41232371800](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232371800) | **PASS — inventory only; human review remains required** |
| Nature Frontiers local draft validation | [41232371841](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232371841) | **PASS — local validation only; provider-side creation job skipped** |
| Production readiness | [41232371787](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232371787) | **HOLD / FAIL-CLOSED — mandatory prerequisites remain unmet** |

## API acceptance matrix update

The exact-SHA concurrent read test closes the concurrency slice for five read-only GET routes. The matrix was updated in commit `27cb875be8688fef458922d8f20bb4847ed6a84b`:

- `GET /api/state`: PASS.
- `GET /api/facebook/idea`: PASS.
- `GET /api/facebook/state`: PASS.
- `GET /api/facebook/autonomous-status`: PASS.
- `GET /api/tasks`: PASS.

Each has authorized success, validation, state-preservation, no-audit-mutation, restart and now concurrent-read evidence recorded in the matrix. Current route counts: **35 total / 5 PASS / 25 NOT_TESTED / 5 BLOCKED**. API-001 remains NOT_TESTED because the other routes are not fully accepted.

Evidence: [API route acceptance matrix](https://github.com/clickerrish-art/YT-AUTO-VISE/blob/codex/marketing-machine-audit-fixes/docs/API_ROUTE_ACCEPTANCE_MATRIX.json).

## Non-destructive Git inventory and human-review briefing

The inventory artifact from workflow [41232371800](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41232371800) records the exact `7fb12f0` snapshot:

- **2,342 branch-only commits / 2 base-only commits**.
- **0** patch-equivalent branch commits reported by `git cherry`; this does not prove semantic uniqueness.
- 190 final-tree changed paths at that candidate; zero final-tree deletions.
- Branch-only categories: 1,041 documentation-only; 539 test-only; 509 implementation-only; 90 workflow-only; 74 mixed; 58 config/content; 31 implementation-and-tests.
- 17 critical final-tree paths identified for semantic review.
- CI checkout working tree was clean; this says nothing about a separate developer's local working tree.
- The two base-only commits add and then delete `test/restore-facebook-draft-history.test.mjs`. The implementation branch retains that test.

A human-review briefing was added at `docs/GIT-002_SEMANTIC_REVIEW_BRIEFING.md` in commit `cf8813e687b0d44790de58e75ddadb8bd517716d`. It identifies the specific code/config/workflow review decisions. **GIT-002 remains NOT_TESTED until an authorized human performs that review.** No history rewrite or integration action was taken.

## Remaining acceptance and release boundary

- Requirement register remains **75 total / 58 PASS / 0 FAIL / 9 NOT_TESTED / 8 BLOCKED**.
- DASH-001 remains NOT_TESTED: 20 browser journeys plus static inventory do not prove all 101 controls individually.
- API-001 remains NOT_TESTED: five read-only routes are now accepted; 25 routes remain untested and five are blocked by external dependencies.
- SCHED-001, STATE-001 and DEPLOY-001 remain NOT_TESTED; the new GET concurrency test does not claim full queue, transaction/recovery or deployment acceptance.
- GIT-002 remains NOT_TESTED pending human semantic review.
- Production readiness remains HOLD with the 13 previously recorded fail-closed blockers. YouTube and Meta publishing restrictions remain unchanged.
- No live YouTube upload, Facebook/Instagram post, campaign activation, visibility change, or Metricool scheduled-record modification occurred. Nature Frontiers remains prohibited as a YouTube target.

**Verdict: engineering implementation remains PARTIALLY COMPLETE; the new concurrent read-only API slice is implemented and CI-verified on exact SHA `7fb12f0`. The application is not production-ready.**

---

# Latest exact-SHA implementation and acceptance update — 31 October 2026, 16:20 UTC

This update supersedes older live-state snapshots below. Older records are retained as historical evidence.

## Live Git state at this update

- Implementation branch HEAD observed before this documentation update: `d6b2fa128adce8e10f087b523591f8870d6efec2` (documentation-only descendants of the tested code candidate).
- Exact latest source/test candidate: `dea284d21b4e7a6923c46a201cd196ed39b72ffa`.
- Main: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Live compare: **2,337 ahead / 2 behind / 190 changed files**.
- PR #1: **OPEN, DRAFT, UNMERGED**. Branch protection is disabled. No main edit, merge, reset, rebase, force-push, branch deletion or destructive reconciliation occurred.

## Exact-SHA validation for `dea284d21b4e7a6923c46a201cd196ed39b72ffa`

| Workflow | Run | Result |
|---|---:|---|
| Automation/security + Node unit tests, zero skips | [41217848775](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41217848775) | **PASS** |
| Dashboard browser E2E | [41217848763](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41217848763) | **PASS** |
| Content quality | [41217848765](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41217848765) | **PASS** |
| Metadata | [41217848778](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41217848778) | **PASS** |
| Isolated main/candidate baseline | [41217848781](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41217848781) | **PASS** |

Exact-SHA code/test additions in this execution:
- `4eb66910a93bf4b33843b91d9384e1f34bdc902b`: real-server worker lease heartbeat, invalid-token fencing, controlled FAILED completion, duplicate completion rejection, active/expired reaping, durable audit and restart read-back. [CI 41216258636](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41216258636) PASS.
- `9ff2de1f046e879f687f3767697e787214cc1e28`: valid content-job transition persistence/audit; unsafe `UPLOADING_PRIVATE` transition returns 400 with byte-identical state. Automation, dashboard E2E, content quality and baseline passed.
- `c533cd8fbf7153ccbf84ab94a2a919069b9abbe0`: Facebook draft reevaluation; blocked APPROVE no-mutation; safe REJECT persists reviewer-bound rejection/audit. Automation, dashboard E2E, content quality, metadata and baseline passed.
- `dea284d21b4e7a6923c46a201cd196ed39b72ffa`: `POST /api/drafts/update` valid edit with durable read-back and one operator-attributed audit event; invalid calendar date and attempted rights promotion rejected without state mutation. All five exact-SHA workflows above passed.

## Acceptance state

- Requirement register: **75 total / 58 PASS / 0 FAIL / 9 NOT_TESTED / 8 BLOCKED**.
- Dashboard inventory: **101 controls / 15 forms**. DASH-001 remains NOT_TESTED; browser journeys and targeted route tests are not exhaustive per-control acceptance.
- Protected API: **35 routes / 35 auth-negative checks PASS / 30 overall NOT_TESTED / 5 externally BLOCKED**. API-001 remains NOT_TESTED.
- Worker lifecycle route slices are accepted individually; overall SCHED-001 remains NOT_TESTED.
- STATE-001, DEPLOY-001 and GIT-002 remain NOT_TESTED. The 2,337-commit divergence has automated inventory but still requires human semantic review.
- The machine-readable route matrix and requirement register preserve partial route evidence without marking overall routes complete.

## Production readiness — HOLD, 13 blockers

1. Owner-approved feasible publication cadence with timezone-stamped approval and reference.
2. Complete SonicVhibez public/private/unlisted YouTube history and uncertain-upload reconciliation.
3. Verified Short rights manifest at `content/render-manifest.json`.
4. Verified long-form rights manifest at `content/long-form-render-manifest.json`.
5. Genuine human metadata review.
6. Independently verified exact SonicVhibez channel identity; do not guess or normalize the historical ID discrepancy.
7. Genuine media rights approval.
8. Genuine content/compliance approval.
9. Final Short media `media/next-short.mp4`.
10. `YOUTUBE_CLIENT_ID`.
11. `YOUTUBE_CLIENT_SECRET`.
12. `YOUTUBE_REFRESH_TOKEN`.
13. `SONICVHIBEZ_CHANNEL_ID`.

Production readiness workflow [41218088805](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41218088805) on the documentation head reports the expected HOLD/fail-closed result. It is not a passing production gate.

## External operational risk and safety

- Eight Nature Frontiers promotional records in Metricool were previously read as `draft=false`, `autoPublish=true`; seven were pending. No remote records were modified. Owner review is still required.
- Nature Frontiers is never a YouTube target. Public/unattended YouTube publishing remains disabled. Facebook/Instagram provider-side draft creation/read-back is not verified; live Meta publishing remains disabled.
- No live upload, post, campaign activation, visibility change or schedule mutation occurred.
- Approved Selar destination remains `https://selar.com/0u19v8u99l`.
- Original `.bundle`: **BLOCKED — ORIGINAL FILE NOT SUPPLIED**.
- GitHub remote-only work cannot certify a developer local working-tree state.

**Verdict: IMPLEMENTATION INCOMPLETE / NOT PRODUCTION READY.** Exact-SHA code/test checks pass; the application-wide acceptance gates remain open.

---

## Documentation-only reconciliation update — 31 October 2026, 12:30 UTC

Latest PR head observed before this evidence refresh: `424f349cb39ffb885f4d521564eb1c8c64cc9656`. This and the preceding evidence/matrix/checklist commits are documentation-only descendants of exact source/test candidate `d9bdfbb4a79d4a1030edb208d8754fda88852c9b`; no application or test code changed after that tested candidate.

- PR #1 remains OPEN, DRAFT, UNMERGED.
- Current compare at the observed documentation head: **2,312 ahead / 2 behind / 189 changed files**.
- `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.
- A new machine-readable API route acceptance matrix is now checked in at `docs/API_ROUTE_ACCEPTANCE_MATRIX.json`. It inventories all 35 protected API routes and separates global authentication-negative coverage from route-specific success, validation, persistence, audit, concurrency and restart evidence. Overall API-001 remains NOT_TESTED; the matrix does not inflate incomplete routes to PASS.
- The acceptance register now has 75 requirements: **58 PASS / 0 FAIL / 9 NOT_TESTED / 8 BLOCKED**. The new PASS is limited to SCHED-WORKER-MULTIPROCESS-001; SCHED-001 remains NOT_TESTED.
- The release evidence, dashboard control matrix, go-live blockers and release checklist now carry the 31 October exact-SHA checkpoint and links to the route matrix.
- The current Metricool read-only state is documented above: eight Nature Frontiers records remain `draft=false` and `autoPublish=true`; provider marks one PUBLISHED and seven PENDING. No remote post or schedule was changed.
- GitHub remote-only access cannot certify a local working-tree status. Branch protection remains unverified because the relevant owner/admin setting is not exposed by the connected GitHub read tools.

The exact-SHA CI evidence remains the workflow batch listed above for `d9bdfbb`. The later documentation-only commits do not change that test result. Production readiness remains HOLD with 13 fail-closed blockers.

---

# Latest live checkpoint — 31 October 2026, 12:27 UTC

## Repository state

- PR #1: OPEN, DRAFT, UNMERGED.
- Implementation branch HEAD at this checkpoint: `d372709474a5c3f116e6bf53d8cb26e42a3eba12` (this commit updates acceptance evidence only).
- Exact source/test candidate: `d9bdfbb4a79d4a1030edb208d8754fda88852c9b`.
- Latest application-code commit in the current branch lineage: `88552e3c38fe30422724da4f6c599933f0335cad`.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Live comparison: **2,302 ahead / 2 behind / 188 changed files**.
- No merge, main edit, reset, rebase, force-push, branch deletion or destructive reconciliation was performed.
- GitHub remote operations do not expose a local developer working tree; a clean local working-tree status is therefore **NOT VERIFIED**.

## Exact-SHA validation — d9bdfbb

| Workflow | Run | Result |
|---|---:|---|
| Automation/security | [41201034162](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41201034162) | PASS — 446 Node, 0 failures, 0 skips; 16 Python; npm audit 0 vulnerabilities; FFmpeg/ffprobe, syntax and compilation checks passed |
| Content quality | [41201034134](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41201034134) | PASS — 446 tests, 0 failures, 0 skips |
| Metadata | [41201034143](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41201034143) | PASS — 446 tests, 0 failures, 0 skips |
| Dashboard Chromium E2E | [41201034132](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41201034132) | PASS — 20/20 journeys against the real local dashboard/backend |
| Isolated main/candidate baseline | [41201034192](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41201034192) | PASS — exact main and candidate checkouts; Node and Python exit code 0; [retained artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41201034192/artifacts/13042790814), SHA-256 `003b57a69350cbfc45f88a255c71d260b31d24e6212da058d7965bf114297f90` |
| Non-destructive branch inventory | [41201034144](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41201034144) | PASS — inventory only; human semantic review remains incomplete |
| Nature Frontiers local draft validation | [41201034174](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41201034174) | PASS for local validation only; provider-side draft creation job SKIPPED |
| Production readiness | [41201034135](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41201034135) | HOLD / BLOCKED — 13 genuine prerequisites remain; exit codes human=2, JSON=2 |

## New repository-controlled acceptance

Commit `d9bdfbb4a79d4a1030edb208d8754fda88852c9b` adds `test/dashboard-api-worker-lease-multiprocess.integration.test.mjs`.

The test starts two independent dashboard server processes against one isolated persistent state directory. Both compete to claim the same queued content job. Exactly one receives the lease and one claim audit event is retained. Both processes are then SIGKILLed; a fresh process must recover the job to `RECOVERY_REQUIRED`, clear the lease and record exactly one recovery audit event.

This exact test passed as part of the 446-test Node suite. The new narrow acceptance item is `SCHED-WORKER-MULTIPROCESS-001` (PASS). This does **not** close SCHED-001: heartbeat, lease expiry, retry, queue ordering, actual publication history and complete operational recovery still require acceptance.

The earlier candidate `8e95b9057d5e031e60474a171bb6aeea07b1cef1` exposed a test teardown bug: cleanup waited for a child-process exit event twice after SIGKILL. That attempt is superseded. The signal-aware teardown correction is in `d9bdfbb`, and the corrected exact-SHA suite passed.

## Dashboard and API acceptance boundaries

- Current static inventory: **101 HTML controls, 15 forms, 38 total registered handlers**.
- Of the 38 handlers, **35 are protected `/api/` routes**; the remaining three are `/`, `/healthz` and `/readyz`.
- Browser E2E: 20/20 PASS.
- DASH-001 remains NOT_TESTED: 20 browser journeys do not amount to per-control/per-form acceptance.
- API-001 remains NOT_TESTED: route authentication and focused successful/negative tests exist, but complete route-by-route business success, persistence, audit, concurrency and restart acceptance is incomplete.

## Current external Metricool read-only observation — 31 October 2026

Metricool currently exposes one brand: **Nature Frontiers** (brand ID `7545638`), with timezone `Africa/Johannesburg`, Facebook Page ID `1003575786161492` and Instagram username `naturefrontieers`.

A read-only scheduled-post query for 31 October 2026 through 31 January 2027 returned eight promotional records. All eight have `draft=false` and `autoPublish=true`. Provider status shows post `406357296` as PUBLISHED and the other seven (`406357335`, `406357364`, `406357388`, `406357414`, `406357443`, `406357483`, `406357554`) as PENDING. Their content includes Selar/product promotions, which conflict with the Nature Frontiers education-only repository policy. One pending record includes both Facebook and Instagram providers. No record was edited, cancelled, rescheduled or published by this investigation. **Owner review is required; do not assume application safeguards alter these remote schedules.**

The Metricool YouTubeData ID still resolves only to the title `SonicVibes` in the previous lookup; exact SonicVhibez identity is not verified. Do not use it as a YouTube destination.

## Remaining production blockers

The exact readiness run reports 13 blockers:

1. Feasible owner-approved publication cadence, timezone-aware approval timestamp and approval reference.
2. Complete SonicVhibez public/private/unlisted history and pending/uncertain upload reconciliation.
3. Genuine rights-verified `content/render-manifest.json`.
4. Genuine rights-verified `content/long-form-render-manifest.json`.
5. Human-reviewed metadata marked `READY_FOR_PRIVATE_UPLOAD`.
6. Verified SonicVhibez YouTube channel ID.
7. Genuine media rights approval.
8. Genuine content/compliance review.
9. Final rendered `media/next-short.mp4`.
10. `YOUTUBE_CLIENT_ID`.
11. `YOUTUBE_CLIENT_SECRET`.
12. `YOUTUBE_REFRESH_TOKEN`.
13. `SONICVHIBEZ_CHANNEL_ID`.

No YouTube upload, Meta draft creation, Facebook/Instagram publication, schedule change or campaign activation was attempted. Public/unattended YouTube publishing remains disabled. Nature Frontiers remains prohibited as a YouTube target. The original `.bundle` remains BLOCKED — original file not supplied.

## Acceptance summary

The updated machine-readable register contains **75 requirements: 58 PASS / 0 FAIL / 9 NOT_TESTED / 8 BLOCKED**. Repository engineering remains incomplete. Keep PR #1 open and draft; do not merge or alter `main`.

---

# SonicVhibez Marketing Machine — Release Evidence
# 31 October 2026 checkpoint

## Repository and protected Git state

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Pull request: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- Observed PR state: OPEN, DRAFT, UNMERGED
- Observed branch HEAD at this evidence snapshot: `ba0ed89a3d8509d264bfdcb837ba01443beb25fb`
- Latest exact application/test candidate: `7c8470a86aab237fe87002adbe8cec8fc47ae4d1`
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Comparison at the observed HEAD: 2,259 commits ahead, 2 behind, 183 changed files.
- No merge, reset, rebase, force-push or destructive reconciliation was performed. The work was committed only to the implementation branch.
- A local developer working tree was not available through the remote GitHub session; local uncommitted changes therefore cannot be certified clean.

## Exact-SHA CI evidence

The latest full PR validation batch was triggered on exact application/test SHA `7c8470a86aab237fe87002adbe8cec8fc47ae4d1`. Subsequent commits through `ba0ed89a3d8509d264bfdcb837ba01443beb25fb` updated acceptance documentation and register evidence; no application behavior was changed after that tested candidate.

- Dashboard browser E2E — [run 41142804815](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804815): SUCCESS, 19/19 Chromium journeys on exact SHA `7c8470a86aab237fe87002adbe8cec8fc47ae4d1`.
- Automation/security — [run 41142804948](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804948): SUCCESS, 436 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; npm audit reported 0 vulnerabilities.
- Metadata validation — [run 41142804925](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804925): SUCCESS.
- Content quality — [run 41142804795](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804795): SUCCESS.
- Isolated main/candidate baseline comparison — [run 41142804801](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804801): SUCCESS.
- Non-destructive branch inventory — [run 41142804861](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804861): SUCCESS.
- Nature Frontiers local draft validation — [run 41142804788](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804788): SUCCESS. This validates the local draft package, not an external Facebook or Instagram publication.
- Production readiness — [run 41142804825](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804825): EXPECTED HOLD / workflow failure, 13 blockers remain. This is not a passing readiness result.

## DASH-001 dashboard acceptance

Inventory remains 105 dashboard controls, 15 forms and 38 API routes. DASH-001 remains **NOT_TESTED** because full per-control and per-route acceptance is not complete.

Current form-specific matrix:
- PASS: campaignform, draft, facebookdraftform, authoringform, scriptreviewform, narrationform, narrationreviewform (7 forms).
- NOT_TESTED: productionplanform, productionplanreviewform (2 forms).
- BLOCKED: produceform, parentrelationshipform, validationform, rightsform, reviewform, reconcileform (6 forms).

The new narration browser journey exercised the actual dashboard form against an isolated local server and the free Edge TTS service. It:
1. Created a source-bound short-form script and approved its exact script SHA.
2. Submitted the dashboard narration form.
3. Generated real TTS audio, measured with FFmpeg/ffprobe.
4. Verified the 137-word narration and 50–60 second duration requirement.
5. Verified TTS word-boundary caption timing.
6. Verified SHA-256 values and regular-file persistence for narration.mp3, narration.txt, captions.srt and narration-report.json.
7. Reloaded the dashboard and verified the persisted job/artifact state.
8. Simulated a recovery-required state with the completed artifacts retained, then reconciled those files without re-running TTS.
9. Confirmed publishing remained disabled and the narration remained a draft pending human review.

The narration-review form's separate earlier browser journey still uses a synthetic, non-playable audio fixture. It proves hash-bound review API/UI logic only; it does not prove that a human listened to the generated audio or granted genuine editorial approval.

The 19/19 browser result is reproducible in run 41141841497. The earlier initial run 41140897700 failed due to a test-harness assertion using native Response.status as a function; the next run exposed a trailing-newline word-count assertion. Both failures were preserved as historical evidence, corrected, and followed by the passing exact-PR-head run.

## Other requirement acceptance

- API-001: NOT_TESTED overall. Authentication, malformed request and focused successful API cases exist, but all 38 routes have not passed complete authorized success, persistence, concurrency, failure and response-contract acceptance.
- SCHED-001: NOT_TESTED overall. Full worker lifecycle, concurrent workers, retry/recovery, schedule history and operational timezone acceptance are outstanding.
- STATE-001: NOT_TESTED overall. A dashboard server restart journey passes, but complete backup integrity, restore, interrupted-write, cross-process concurrency and crash-recovery acceptance is outstanding.
- DEPLOY-001: NOT_TESTED. No isolated production deployment and rollback drill has been demonstrated.
- GIT-002: NOT_TESTED. Automated non-destructive branch inventory passes, but human semantic review of the full 2,254-ahead/2-behind difference is not complete.

The restore-history investigation is preserved:
- `test/restore-facebook-draft-history.test.mjs` exists on the implementation branch.
- The same path is absent from `main`.
- Neither version has been deleted or overwritten as part of this work.

## Production readiness — 13 blockers remain

The exact readiness run reports these blockers:

1. Owner-approved publication cadence, timezone-aware approval timestamp and approval reference are missing.
2. Complete SonicVhibez public/private/unlisted YouTube history and all pending/uncertain upload attempts must be reconciled.
3. Genuine rights-verified `content/render-manifest.json` is missing.
4. Genuine rights-verified `content/long-form-render-manifest.json` is missing.
5. Human-reviewed metadata is not marked READY_FOR_PRIVATE_UPLOAD.
6. Verified SonicVhibez YouTube channel ID is missing.
7. Rights approval is not established.
8. Compliance approval is not established.
9. Rendered `media/next-short.mp4` is missing.
10. `YOUTUBE_CLIENT_ID` is not configured in the CI execution environment.
11. `YOUTUBE_CLIENT_SECRET` is not configured in the CI execution environment.
12. `YOUTUBE_REFRESH_TOKEN` is not configured in the CI execution environment.
13. `SONICVHIBEZ_CHANNEL_ID` is not configured in the CI execution environment.

The readiness report explicitly states it never uploads, schedules or publishes. No YouTube upload, Facebook publication, Instagram publication, or external account change was attempted in this work.

## Decision

This checkpoint demonstrates a real, successful narration-generation and recovery journey and broad passing CI coverage. It does **not** establish that the entire application is complete, that DASH-001 is accepted, or that production is ready. Keep PR #1 open and in draft; keep publishing disabled; continue with production-plan submission/review, remaining successful form journeys, all-route API acceptance, scheduling, backup/restore, deployment/rollback and semantic branch review.


---

## Implementation continuation — production-plan integrity and business-flow acceptance — 31 October 2026

### Exact source/test candidate

- Application-code commit: `e7d91d06626c1c9c87314f3d380c57c65943ae83`.
- Exact browser/test candidate: `e3a7e8b2bba82b0db96aefe396eaca7dddecf8e9`.
- The subsequent commits `30de9be63fb8db39a9a4ab1869e52186e7650a59` and `068f16aadc4769bd1f08dfd1a2b6a1afaa896268` update only the dashboard acceptance matrix and requirements register; no application behavior changed after the tested candidate.
- At the exact candidate: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 2,270 commits ahead / 2 behind / 183 changed files. PR #1 remained open, draft and unmerged.

### Implementation changes

- Production-plan review now recomputes the exact narration approval receipt and rejects a persisted `APPROVE` decision if any protected receipt field has changed.
- Production-plan review rechecks a Short's independently approved parent relationship against the persisted parent job, public remote receipt, exact channel identity, parent media hash and canonical URL. Submission-time validation is no longer treated as sufficient.
- The production-plan API returns a fail-closed 409 when narration approval or parent relationship evidence is stale/invalid; it does not write a review decision or approval audit event.
- Regression tests cover narration receipt tampering and stale/wrong parent identity.
- The real dashboard/server Chromium journey additionally alters the persisted narration approval receipt and verifies that review is rejected before restoring the fixture and completing the valid review.

Implementation commits:
- `119cf6215ae922938941d9ab862ffe4c580e9f9b` — receipt and parent revalidation helpers.
- `c0e922877a287e077ede4fb6a504c7d24c4e6f0f` — helper regression tests.
- `e7d91d06626c1c9c87314f3d380c57c65943ae83` — API enforcement.
- `e3a7e8b2bba82b0db96aefe396eaca7dddecf8e9` — browser tamper regression.

### Exact-SHA CI evidence on `e3a7e8b2bba82b0db96aefe396eaca7dddecf8e9`

- Automation/security [run 41148265949](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265949): **SUCCESS** — 438 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, syntax and compilation checks passed.
- Dashboard browser E2E [run 41148260651](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148260651): **SUCCESS** — 20/20 Chromium journeys. The production-plan journey uses an isolated temporary state directory and explicitly test-only media/rights fixtures. It proves dashboard submission, persisted plan read-back, audit event, narration-receipt tamper rejection, changed-scene rejection, reviewer-bound approval, approval hash and server-restart persistence.
- Content quality [run 41148265966](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265966): **SUCCESS**.
- Metadata validation [run 41148265891](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265891): **SUCCESS**.
- Isolated main/candidate baseline [run 41148265897](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265897): **SUCCESS**.
- Non-destructive branch inventory [run 41148265902](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265902): **SUCCESS** (inventory only; human semantic review remains incomplete).
- Nature Frontiers local draft validation [run 41148266077](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148266077): **SUCCESS for local validation only**; provider-side draft creation/read-back was not performed.
- Lockfile verification [run 41148260623](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148260623): **SUCCESS**.
- Production readiness [run 41148265917](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265917): **HOLD / BLOCKED by 13 mandatory prerequisites**, as designed. This is not a passing production-readiness result.

### Dashboard acceptance status

- `productionplanform`: **PASS** for isolated dashboard/server submission and durable read-back using test-only fixtures.
- `productionplanreviewform`: **PASS** for exact-hash review, narration receipt tamper rejection, changed scene rejection, persisted reviewer receipt and restart recovery using test-only fixtures.
- The 20/20 browser result is not exhaustive acceptance of the dashboard. DASH-001 remains **NOT_TESTED**: 105 controls and 38 API routes have not all passed dedicated success, failure, authorization, persistence and concurrency acceptance.
- Six downstream production forms remain BLOCKED pending genuine assets, independently verifiable rights, real media validation/final review or an actual uncertain remote upload attempt.

### Scope and honest limitations

- The production-plan browser fixture deliberately uses synthetic test bytes and a test-only rights record. It proves the application gate and integrity mechanics; it is not a genuine production asset, commercial licence, human rights approval or editorial approval.
- No actual production render, YouTube upload, Facebook/Instagram post, visibility change, campaign activation or owner authorization was created by these tests.
- The verified YouTube channel identity/history and credentials, genuine media manifests, rights and human approvals, external Meta identities/permissions, production deployment/rollback drills, full scheduler/worker lifecycle and human semantic branch review remain outstanding.
- `SCHED-001`, `STATE-001`, `API-001`, `DEPLOY-001` and `GIT-002` remain **NOT_TESTED overall** until their full acceptance criteria are demonstrated.
- PR #1 remains open, draft and unmerged. `main` remains untouched. Nature Frontiers remains prohibited as a YouTube target; public/unattended YouTube publishing and live Meta publishing remain disabled.

**Decision:** production-plan submission and review mechanics now have exact-SHA browser acceptance with fail-closed tamper checks. This is a meaningful engineering increment, not 100% application completion or production authorization. Keep the overall project on HOLD until the remaining application, external evidence and operational acceptance gates are independently proven.

---

## Live API route acceptance continuation — 31 October 2026

### Live repository state after this documentation refresh

- PR #1: **OPEN, DRAFT, UNMERGED**.
- PR HEAD immediately before this evidence refresh: `de578e71ef1327147c4b43fa7414b2ca9c55f50b`.
- Exact application/test candidate: `a16b94e60960aba90fa20adc8fcdaf3057e15d68`.
- All commits after the tested candidate in this evidence sequence are documentation-only updates to the acceptance register, dashboard matrix and release evidence; no application behavior changed after the tested candidate. The current live PR HEAD must be read from GitHub rather than inferred from this pre-update reference.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Live divergence: **2,278 ahead / 2 behind / 184 changed files**.
- No merge, main edit, reset, rebase, force-push or destructive reconciliation occurred. The local developer working tree is not available through this remote GitHub session; no claim is made about local uncommitted work.

### New API acceptance implementation

- Added `test/dashboard-api-authenticated-route-negative-matrix.test.mjs`.
- The test starts the actual dashboard server in an isolated temporary state directory and sends authenticated empty requests to every source-discovered API method/path.
- It verifies no unexpected 5xx response, a JSON response envelope, no internal filesystem path disclosure, and byte-identical persisted dashboard state after the complete route sweep.
- The current source contains **38 registered route handlers total**: **35 `/api/` routes** plus the dashboard root, `/healthz` and `/readyz`. Older descriptions that call all 38 handlers API routes are inaccurate and should be read as total registered handlers.
- This test is a negative-request acceptance slice only. It does not prove successful business behavior or complete API-001 acceptance.

### Exact-SHA CI on `a16b94e60960aba90fa20adc8fcdaf3057e15d68`

- Automation/security [run 41149529825](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529825): **SUCCESS** — 439 Node tests passed, 0 failures, 0 skips; 16 Python tests passed; npm audit reported 0 vulnerabilities; FFmpeg/ffprobe, JavaScript syntax and Python compilation steps passed.
- Dashboard browser E2E [run 41149529722](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529722): **SUCCESS** — 20/20 Chromium journeys passed against the real local dashboard/backend.
- Metadata validation [run 41149529692](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529692): **SUCCESS** — 439 Node tests, 0 failures, 0 skips; required metadata fail-closed checks passed.
- Content quality [run 41149529718](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529718): **SUCCESS** — 439 Node tests, 0 failures, 0 skips.
- Isolated main/candidate baseline [run 41149529768](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529768): **SUCCESS**; retained comparison artifact ID `13022835442`.
- Non-destructive branch inventory [run 41149529702](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529702): **SUCCESS** (inventory only; human semantic review of all divergent history remains incomplete).
- Nature Frontiers local draft validation [run 41149529710](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529710): **SUCCESS for local draft-package validation only**; provider-side draft creation/read-back was skipped.
- Production readiness [run 41149529996](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529996): **HOLD / BLOCKED by 13 mandatory prerequisites**, as intended. The workflow's expected nonzero result is not a code-test failure or a production pass.
- Exact readiness blockers from that run:
  1. Owner-approved feasible cadence mode, timezone-aware approval timestamp and approval reference.
  2. Independent reconciliation of SonicVhibez public/private/unlisted history and all pending/uncertain upload attempts.
  3. Genuine rights-verified `content/render-manifest.json`.
  4. Genuine rights-verified `content/long-form-render-manifest.json`.
  5. Human-reviewed metadata explicitly marked `READY_FOR_PRIVATE_UPLOAD`.
  6. Verified SonicVhibez YouTube channel ID bound to metadata.
  7. Media rights confirmation based on actual evidence.
  8. Content/compliance review confirmation.
  9. Genuine validated `media/next-short.mp4`.
  10. `YOUTUBE_CLIENT_ID` in the secure execution environment.
  11. `YOUTUBE_CLIENT_SECRET` in the secure execution environment.
  12. `YOUTUBE_REFRESH_TOKEN` in the secure execution environment.
  13. Verified `SONICVHIBEZ_CHANNEL_ID` in the secure execution environment.
  The readiness report explicitly performs no upload, scheduling or publication.

### Acceptance register refresh

- Requirements register now contains 73 records: **56 PASS / 9 NOT_TESTED / 8 BLOCKED**.
- Only the permitted statuses `PASS`, `FAIL`, `NOT_TESTED` and `BLOCKED` are used.
- `API-NEG-001` is PASS for the narrow all-route negative-request sweep.
- `API-001` remains NOT_TESTED until route-specific successful operations, invalid-field matrices, persistence, concurrency/idempotency, audit and restart acceptance are complete.
- `DASH-001` remains NOT_TESTED. Static inventory is 105 controls across 15 forms; 20/20 browser journeys are not exhaustive control acceptance.
- Production-plan submission and review remain accepted only for isolated test fixtures and application integrity mechanics. They do not establish genuine source-media provenance, commercial licence validity, human editorial approval, final rendering or upload authorization.

### Safety and outstanding external gates

- `test/restore-facebook-draft-history.test.mjs` remains present on the implementation branch and is included in the Node test suite.
- No YouTube upload, Facebook/Instagram publication, campaign activation, visibility change or external account mutation was performed.
- Nature Frontiers remains prohibited as a YouTube target. Public/unattended YouTube publishing and live Meta publishing remain disabled. Safari remains inactive. The approved Selar destination remains unchanged.
- Genuine media/manifests/rights evidence and human approval, verified SonicVhibez YouTube identity/history/OAuth, live Meta identity/permissions, owner-approved feasible cadence, full scheduler/worker lifecycle, full backup/restore/power-loss and deployment/rollback drills, complete per-control/API acceptance and human semantic branch review remain outstanding.

**Decision: PARTIALLY IMPLEMENTED.** The latest exact-SHA automation and browser suites pass, but API-001, DASH-001 and the full business application are not accepted. Production remains on HOLD.

---

## Live continuation — Nature Frontiers dashboard policy alignment — 31 October 2026

### Exact source/test candidate and live PR state

- Exact tested application/test candidate: `d489318421af534988e2d44df4f6666d3dbc4955`.
- PR #1 was OPEN, DRAFT and UNMERGED at this checkpoint. The PR head immediately before this evidence-only update was `ddbc07932aa863ade7e29a247803d10a59caff80`; this release-evidence commit is documentation-only.
- `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base remains `45352b73bb6cc4787b2a49988b575afb754ab627`.
- The exact tested candidate comparison was 2,285 commits ahead / 2 behind / 184 changed files. The implementation branch remains heavily divergent and still requires human semantic review.
- No merge, main edit, reset, rebase, force-push or destructive reconciliation occurred.
- The original `YT-AUTO-VISE.bundle` was not attached or found in the current conversation. **No bundle checksum, `git bundle verify`, bundle refs or bundle recovery is claimed.** The live GitHub repository was used as a separate source of truth.
- No local developer working tree was available through this remote GitHub session; local uncommitted changes cannot be certified clean.

### Implementation change

- `public/dashboard.html`: removed the Selar promotion option and commercial/affiliate/disclosure controls from the Nature Frontiers Facebook draft form. The form now explicitly says Nature Frontiers is education-only.
- The form's submission payload fixes `campaignId: null`, `commercial: false` and `disclosureRequired: false`; the dashboard can no longer suggest a prohibited promotion that the backend would reject.
- `test/dashboard-ui-contract.test.mjs`: added a regression test asserting that the prohibited controls remain absent and the request payload remains non-commercial.
- `test/dashboard-inventory.test.mjs`: refreshed exact inventory expectations after the four controls were removed.
- Commits: `6af30170db5231fc3d582b63bd88907ea7b89184` (dashboard fix), `60240f3bd8139f215a4c909e6d0a45659c8112ac` (robust regression assertion), and `d489318421af534988e2d44df4f6666d3dbc4955` (inventory test expectations).

### Exact-SHA verification on `d489318421af534988e2d44df4f6666d3dbc4955`

- Automation/security [run 41155835021](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835021): **SUCCESS** — 440 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, JavaScript syntax and Python compilation passed.
- Dashboard browser E2E [run 41155835124](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835124): **SUCCESS** — 20/20 Chromium journeys against the real local dashboard/backend.
- Content quality [run 41155835080](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835080): **SUCCESS**.
- Metadata validation [run 41155834980](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155834980): **SUCCESS**.
- Isolated main/candidate baseline [run 41155835151](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835151): **SUCCESS** — both exact main and candidate checkouts returned install, Node and Python exit code 0; retained artifact [13025083151](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835151/artifacts/13025083151).
- Non-destructive branch inventory [run 41155834996](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155834996): **SUCCESS** (inventory only; human semantic review remains outstanding).
- Nature Frontiers local draft validation [run 41155835138](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835138): **SUCCESS for local draft-package validation only**; the provider-side create-draft job was skipped.
- Production readiness [run 41155835201](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835201): **HOLD / BLOCKED by 13 prerequisites**, as designed. The report performed no upload, scheduling or publication.

### Current dashboard inventory and acceptance boundary

- **101 HTML controls**: 21 buttons, 41 inputs, 25 selects and 14 textareas.
- **15 forms**.
- **38 total registered route handlers**: 35 `/api/` routes plus `/`, `/healthz` and `/readyz`.
- **83 non-submit controls** have stable IDs and JavaScript bindings.
- The requirements register now contains **74 records: 57 PASS / 9 NOT_TESTED / 8 BLOCKED**. New item `NF-PROMO-UI-001` passes for the exact UI-policy alignment. `DASH-001` remains NOT_TESTED; inventory and 20 browser journeys are not exhaustive acceptance of all controls/routes.

### Remaining production blockers

The exact readiness run still reports 13 blockers:
1. Owner-approved feasible cadence mode, timezone-aware approval timestamp and approval reference.
2. Complete SonicVhibez public/private/unlisted history and reconciliation of all pending/uncertain upload attempts.
3. Genuine rights-verified `content/render-manifest.json`.
4. Genuine rights-verified `content/long-form-render-manifest.json`.
5. Human-reviewed metadata marked `READY_FOR_PRIVATE_UPLOAD`.
6. Verified SonicVhibez YouTube channel ID bound to metadata.
7. Actual media rights confirmation.
8. Content/compliance review confirmation.
9. Genuine validated `media/next-short.mp4`.
10. Secure `YOUTUBE_CLIENT_ID`.
11. Secure `YOUTUBE_CLIENT_SECRET`.
12. Secure `YOUTUBE_REFRESH_TOKEN`.
13. Verified `SONICVHIBEZ_CHANNEL_ID`.

No YouTube upload, Facebook/Instagram post, campaign activation, visibility change or external account mutation occurred. The existing provider-side Metricool schedule was not changed or rechecked as part of this code fix; owner review remains separate.

**Decision: IMPLEMENTATION INCOMPLETE — ENGINEERING WORK REMAINS.** This exact-SHA dashboard policy fix is verified. It does not complete DASH-001, API-001, scheduler/worker acceptance, full state/deployment drills, semantic branch reconciliation or the external production gates.

---

## Live continuation — campaign API integration and abrupt-restart acceptance — 31 October 2026

Exact source/test SHA: `faf7b993ee58b8761c716ca5dc7b70f2b372caae`.

A new real-server integration test, `test/campaign-management-api.integration.test.mjs`, exercises `POST /api/campaigns/manage` against an isolated dashboard process and persistent state directory. It verifies:

- An unapproved destination is rejected with HTTP 400 and does not mutate the state snapshot.
- The exact approved Selar destination can be previewed; the pending URL/disclosure are persisted with their SHA-256 destination-version binding.
- The authenticated operator ID is written to the `CAMPAIGN_PREVIEW` audit event.
- Deactivation clears the pending preview and records a `CAMPAIGN_DEACTIVATE` audit event.
- The dashboard process is terminated with `SIGKILL`; a fresh process then reads the deactivated campaign and both audit events from the same state directory.
- No external provider call is made and `publishingEnabled` remains false.

The API concurrency/restart test also now uses `SIGKILL` after 12 concurrent identical `POST /api/jobs` requests have been acknowledged, then verifies one durable job and one audit event after restart.

### Exact-SHA evidence

- Automation/security [41184686421](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686421): **444 Node tests passed, 0 failed, 0 skipped; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/FFprobe, syntax and Python compilation checks passed**.
- Dashboard browser E2E [41184686381](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686381): **20/20 Chromium journeys passed**.
- Metadata [41184686382](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686382): **SUCCESS**.
- Content quality [41184686487](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686487): **SUCCESS**.
- Local Nature Frontiers draft validation [41184686385](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686385): **SUCCESS; provider-side creation skipped**.
- Non-destructive branch inventory [41184686405](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686405): **SUCCESS**.
- Isolated exact main/candidate baseline [41184681953](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184681953): **SUCCESS**.
- Production readiness [41184686378](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686378): **HOLD with 13 blockers**, as designed.

**Acceptance boundary:** API-001 and STATE-001 remain NOT_TESTED overall. These tests establish two real-server state-changing routes and recovery after acknowledged writes followed by abrupt process termination. They do not prove all 35 API routes' successful business paths, power-loss/disk-full/interrupted-write behavior, complete backup/restore/rollback drills or ambiguous external side-effect reconciliation. DASH-001 remains NOT_TESTED. No external YouTube or Meta operation was attempted.

