# Test baseline and regression report

Updated: 2026-10-23
Default branch: `main`
Implementation branch: `codex/marketing-machine-audit-fixes`
Public publishing: disabled

## Branch comparison

| Branch | SHA reference | Full-suite result |
|---|---|---|
| `main` | baseline `45352b73bb6cc4787b2a49988b575afb754ab627` | **BLOCKED — not run in this execution environment** |
| `codex/marketing-machine-audit-fixes` | HEAD `a426b36b908103e2ce001a28a012a346da5c859c` | **BLOCKED — not run in this execution environment** |

At HEAD `a426b36b908103e2ce001a28a012a346da5c859c`, the connected GitHub commit-status endpoint returned an empty `statuses` list and the available commit-workflow lookup returned no runs. Neither result is a pass. That is not a passing result. A clean checkout could not be performed because GitHub hostname resolution failed in this execution environment. The newest dashboard/schedule additions also require a fresh CI run before they can be considered verified.

## Toolchain and reproducibility

- `package.json` requires Node.js `>=20`, uses ESM, and defines `npm test` as `node --test`.
- `googleapis` is the runtime dependency.
- No `package-lock.json` was found on the inspected branches. Thus `npm ci` is not currently available as a reproducible install step. Do not claim a reproducible install until a lockfile is deliberately generated and committed.
- Blocked, not passed: dependency install, full `npm test`, `npm run check`, `npm run check:captions`, `npm run readiness`, media rendering/preflight, and complete workflow execution.
- The CI workflow `.github/workflows/validate.yml` is configured to run `npm install --ignore-scripts`, syntax checks, `npm test`, readiness diagnostics, caption validation and negative checks for unreviewed metadata/asset examples. No confirmed run for the current implementation head was available through the connected status endpoint.

## Latest implementation additions (runtime still not verified)

- Added `scripts/validate-schedule.mjs` and `test/validate-schedule.test.mjs`; the validator reads the weekly plan and queue, checks slot types/durations, approved Selar destination, workflow cron strings, and disabled publishing.
- Added `scripts/dashboard-server.mjs` and `public/dashboard.html`: an authenticated loopback-only dashboard with real queue/config data, local durable JSON state, validated draft creation, duplicate-ID prevention, and an audit log. Ordinary draft creation explicitly rejects rights/review approval flags.
- Added `test/dashboard-server.test.mjs` for API authentication, draft persistence, duplicate prevention, and approval-gate behavior.
- Added the `dashboard` and `validate:schedule` npm commands; CI invokes the schedule validator.
- Updated `OPERATIONS.md` and `README.md` to document startup, local state, schedule, and blockers.
- Added `docs/PROJECT_COMPLETION_AUDIT.md`.

These tests and features have been committed but have **not been executed in this environment**. The dashboard currently does not launch render jobs or invoke the uploader, and it does not yet implement the complete approvals/job lifecycle described in the master prompt. It is a real queue/configuration dashboard, not full end-to-end acceptance.

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
