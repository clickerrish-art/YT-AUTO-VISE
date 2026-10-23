# Test baseline and regression report

Updated: 2026-10-23. Implementation branch: `codex/marketing-machine-audit-fixes`. Latest code-tested SHA: `46d878b6cc7d53e7beca79c086fd3fead931fb11`; subsequent commits are documentation-only. Consult the live branch ref for the current documentation HEAD.
Default branch: `main`
Implementation branch: `codex/marketing-machine-audit-fixes`
Public publishing: disabled

## Branch comparison

| Branch | SHA reference | Full-suite result |
|---|---|---|
| `main` | `45352b73bb6cc4787b2a49988b575afb754ab627` | **PASS** — run `40018038047`: 54 tests passed, 0 failed; readiness, caption checks and unreviewed metadata safety checks passed |
| `codex/marketing-machine-audit-fixes` | Latest job-and-campaign code SHA `869d4ab280fd9bf20ea74edee4c3d1dac032bbe8` | **PASS** — run 40016605388 completed npm test, campaign validation, job lifecycle/idempotency tests, review-safety tests, queue checks, syntax and Python compilation; docs-only commits followed |

Earlier inspection at `a426b36b908103e2ce001a28a012a346da5c859c` preceded the CI runs recorded below; its empty status lookup was not evidence of a pass. The latest job-and-campaign code SHA `869d4ab280fd9bf20ea74edee4c3d1dac032bbe8` passed the full automation workflow (run 40016605388), including npm test, campaign validation, job lifecycle/idempotency tests, safety tests, queue checks, syntax and Python compilation. A complete full-suite baseline on main remains unexecuted.

## Toolchain and reproducibility

- `package.json` requires Node.js `>=20`, uses ESM, and defines `npm test` as `node --test`.
- `googleapis` is the runtime dependency.
- No `package-lock.json` was found on the inspected branches. Thus `npm ci` is not currently available as a reproducible install step. Do not claim a reproducible install until a lockfile is deliberately generated and committed.
- On implementation SHA `46d878b6cc7d53e7beca79c086fd3fead931fb11`, automation CI run `40018011341` passed `npm test` (70/70), campaign validation, Python review-safety tests, queue invariants, JavaScript syntax checks and Python compilation. Metadata and content-quality workflows also passed (runs `40018004685` and `40018011188`). Media rendering and real artifact inspection remain unverified.
- The CI workflow `.github/workflows/validate.yml` is configured to run `npm install --ignore-scripts`, syntax checks, `npm test`, readiness diagnostics, caption validation and negative checks for unreviewed metadata/asset examples. No confirmed run for the current implementation head was available through the connected status endpoint.

## Implemented dashboard additions (CI verified; full production acceptance remains incomplete)

- Added `scripts/validate-schedule.mjs` and `test/validate-schedule.test.mjs`; the validator reads the weekly plan and queue, checks slot types/durations, approved Selar destination, workflow cron strings, and disabled publishing.
- Added `scripts/dashboard-server.mjs` and `public/dashboard.html`: an authenticated loopback-only dashboard with real queue/config data, local durable JSON state, validated draft creation, duplicate-ID prevention, and an audit log. Ordinary draft creation explicitly rejects rights/review approval flags.
- Added `test/dashboard-server.test.mjs` for API authentication, draft persistence, duplicate prevention, and approval-gate behavior.
- Added the `dashboard` and `validate:schedule` npm commands; CI invokes the schedule validator.
- Updated `OPERATIONS.md` and `README.md` to document startup, local state, schedule, and blockers.
- Added `docs/PROJECT_COMPLETION_AUDIT.md`.

These tests have been executed in GitHub Actions. The latest job-and-campaign code SHA `869d4ab280fd9bf20ea74edee4c3d1dac032bbe8` passed automation CI in run 40016605388. The dashboard persists jobs and transition history, but does not launch render workers or invoke the uploader; the complete approval/upload lifecycle is not implemented. This is not full end-to-end acceptance.

## Changes made

- `config/weekly-content-plan.json` now declares Tuesday and Thursday long-form drafts and a Saturday Short as the authoritative target schedule.
- Long-form workflow cron is `0 15 * * 2,4`; Short workflow cron is `0 15 * * 6`. 15:00 UTC corresponds to 17:00 in `Africa/Johannesburg`, which has no daylight-saving changes.
- Queue entries now map Tuesday/Thursday to long-form and Saturday to Short.
- `test/queue-cadence.test.mjs` now checks the authoritative schedule, timezone conversion, content/day alignment, unique IDs, approved Selar URL, and workflow cron declarations.
- `publishingEnabled` remains false. These workflows create review drafts; they are not a public-publishing scheduler.

## Commands required when checkout/runtime access is restored

Run on each branch after recording its exact HEAD SHA. Also run the dashboard integration test and start the dashboard in a clean environment:

```sh
node --version
npm --version
npm install --ignore-scripts
npm test
npm run check
npm run check:captions
npm run readiness
node scripts/validate-asset-register.mjs content/asset-register.example.json
```

If a lockfile is added in a separate dependency-management change, test `npm ci`. Run FFmpeg validation against actual generated files; mocked media fixtures do not prove real artifact validity. Inspect the `Validate SonicVhibez metadata` workflow run and its step logs before marking anything passed.

## Media and private upload gates

| Acceptance item | Status | Evidence/blocker |
|---|---|---|
| Complete 50–60 second real wildlife Short | **BLOCKED** | Existing pipeline creates typography-led review drafts; rights-cleared footage and human review are not evidenced. |
| Complete 6–10 minute wildlife documentary | **BLOCKED** | Narration drafts/render infrastructure exist; complete rights-cleared substantive visuals, final synchronized captions and approval are not evidenced. |
| Rights evidence and editorial approval | **BLOCKED** | No human-verified per-asset license/permission evidence is established by this report. |
| Verified SonicVhibez channel identity | **BLOCKED** | Configured channel ID remains empty; no authenticated OAuth identity result is available. |
| Real private YouTube upload and independent privacy check | **NOT ATTEMPTED** | Correctly blocked by missing verified identity, credentials and approved media. |
| Public publishing | **DISABLED** | Explicitly remains outside this change. |

No test, upload, deployment, sale or live analytics result is claimed as successful here. Update this report after collecting actual CI logs, artifact checksums, rights evidence and (if approved) a sanitized private-upload receipt.


## Dashboard task runner follow-up (2026-10-23)

- Added an allowlist-backed dashboard endpoint for running only `npm run validate:schedule`, `npm run check:captions`, `npm run readiness`, and `npm test`. Commands are spawned without a shell; arbitrary task names are rejected.
- Added a dashboard UI selector for these real commands and durable job/audit results.
- Added `test/dashboard-task-runner.test.mjs`, which starts the server, checks arbitrary command rejection, invokes the real schedule validator, and checks persisted results and publishing-disabled state.
- Historical run 40014281815 was superseded by later passing runs. Latest job-and-campaign code SHA `869d4ab280fd9bf20ea74edee4c3d1dac032bbe8` passed automation CI in run 40016605388.
- Dashboard tasks deliberately do not invoke the uploader, render pipeline, or any publishing operation. This is a safe incremental step, not full application completion.


## Current CI refresh — 2026-10-23

- main SHA: 45352b73bb6cc4787b2a49988b575afb754ab627. Recent queue readiness and metadata runs succeeded (40008273230, 40008273289), but these do not constitute a full main-branch test baseline.
- Implementation SHA 83501ea5db994c5b6dd73f9b7cc20fcd0d71bcbc: full automation validation passed, including npm test, Python review-safety tests, queue invariants, syntax checks and Python compilation: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40014937474. Content quality passed at the same SHA: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40014937704.
- Implementation SHA 896eea1521ba93afdff8f29a248cf9760d8c8e6a adds startup recovery and its integration test. Automation CI passed in run 40014972795, metadata validation passed in run 40014972886, and content quality passed in run 40014973012. Later docs-only SHA a47e74d91013f7ae38912bb4a144574f2575dfdd also passed automation CI in run 40015187821.
- No package-lock.json exists. CI currently uses npm install --ignore-scripts; npm ci is not yet a reproducible supported command.
- Main baseline PASS: run `40018038047` at SHA `45352b73bb6cc4787b2a49988b575afb754ab627`; 54 tests passed and all remaining steps in `Validate SonicVhibez metadata` passed. No live upload or genuine media artifact was created.

Campaign-enhanced code SHA `3fc132b99c683be71e571dab4e6660ab98beb4a9` passed automation CI in run `40016046874`, including npm test, campaign validation, Python review-safety tests, queue checks, syntax and Python compilation. The dashboard applies task timeouts, bounds request/output buffering, prevents overlapping same-task runs within the process, and changes persisted RUNNING validation tasks to RECOVERY_REQUIRED on restart. The content-job state machine and API now persist IDs, idempotency keys, schedule, input references, transition history, output/evidence fields, retry limits and upload receipt placeholders. Upload-only states are rejected by the generic transition API, and an interrupted UPLOADING_PRIVATE job becomes RECOVERY_REQUIRED for reconciliation. This is not equivalent to worker execution, cross-process locking, or a verified remote upload.


## Final job-and-campaign CI result — 2026-10-23

Latest code-tested SHA: 869d4ab280fd9bf20ea74edee4c3d1dac032bbe8. Automation workflow run 40016605388 completed successfully: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40016605388. The Node suite reported 70 tests, 70 passed, 0 failed, 0 skipped. The campaign validation step passed, the Python review-safety tests passed, queue invariants reported 16 queued topics and disabled publishing, and JavaScript syntax/Python compilation checks passed. Metadata validation passed in run 40016597429 and content quality passed in run 40016605400.

The tested implementation at SHA `46d878b6cc7d53e7beca79c086fd3fead931fb11` additionally tests calendar-date slot reservation and simultaneous identical requests across two dashboard processes. It does not establish real rights-cleared media artifacts, OAuth identity, or a real private upload.
