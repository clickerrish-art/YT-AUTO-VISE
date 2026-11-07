# SonicVhibez Cloudflare durable-state migration (staged)

This directory is a separate migration track. It does **not** replace the existing Node.js dashboard, worker runner, rendering pipeline, or publication gates.

## What is implemented

- `cloudflare/worker.js`: an authenticated D1-backed state API with health, one-time bootstrap, revision-checked snapshot replacement, operator backup creation/listing, integrity-checked restore, automatic pre-update/pre-restore snapshots, and server-attributed audit events.
- `cloudflare/migrations/0001_dashboard_state.sql`: D1 schema for one versioned dashboard-state snapshot and retained logical backups.
- `cloudflare.config.ts`: Cloudflare `cf` CLI project configuration with D1 binding and Workers Logs/Traces enabled.
- `test/cloudflare-state-worker.test.mjs`: Node tests for state validation, operator-token checks, publishing fail-closed behavior, health and unauthenticated API rejection.

## Explicitly not complete

- A staging-only D1 database (`sonicvhibez-state-staging`, ID `f018ee20-2d7f-41ec-9744-ee058bce80f8`) and Worker (`sonicvhibez-durable-state-staging`) are deployed. The Worker is version 3 and binds `STATE_DB` to that database.
- Operator secrets `DASHBOARD_OPERATOR_TOKEN` and `DASHBOARD_OPERATOR_ID` are configured as Worker secrets. Secret values are not stored in this repository or exposed in logs.
- No production state has been imported. The staging D1 database currently contains zero rows in both `dashboard_state` and `dashboard_backups`.
- The dashboard UI and existing Node API routes have not been ported. This is a durable-state service slice, not a replacement dashboard.
- The existing production JSON state has not been imported; no production instance exists and no production snapshot was available.
- The logical backups in D1 are not independent disaster-recovery copies. Before production acceptance, add and verify an independent R2 export/restore path and exercise D1 Time Travel recovery against a disposable database.
- Worker source/unit checks passed on commit `0fefa89ed000bd396362fbd0ae425bfc74f89156` (8 tests, zero skips). Cloudflare staging deployment version 3 and the `STATE_DB` binding were independently inspected.
- A D1 Time Travel recovery drill was executed against the staging database from a clean zero-row baseline: captured a pre-fixture bookmark, inserted one synthetic state row and one synthetic backup row, restored the exact bookmark, and verified both tables returned to zero rows. Cloudflare returned `success: true`; this is a real D1 point-in-time restore, but it is not an off-account backup.

## Safety and API contract

- All `/api/*` endpoints require `x-operator-token` matching a Worker secret named `DASHBOARD_OPERATOR_TOKEN` (at least 24 characters).
- Every mutating endpoint also requires `DASHBOARD_OPERATOR_ID` (2–120 characters) to be configured as a Worker environment variable; writes fail with HTTP 503 until the real operator identity is supplied. This prevents anonymous/generic audit attribution.
- The service rejects publishing-enabled state and active Safari affiliate campaigns.
- `POST /api/state/bootstrap` is one-time only. Supply the reviewed, complete existing state snapshot; do not bootstrap with an empty or guessed production state.
- `PUT /api/state` requires `If-Match` with the current revision. A mismatch returns HTTP 409. Each update creates a pre-update logical backup and appends an operator-attributed audit event.
- `POST /api/backups` creates a manual logical backup.
- `POST /api/backups/restore` requires `backupId` and `expectedRevision`; integrity and schema are checked, and the current state is backed up before restore.
- Health is public and reports `publishingEnabled: false`; it does not expose account, database or secret metadata.

## Free-tier-first deployment sequence (not yet executed)

1. Verify Cloudflare account plan and current D1/Workers quotas. The current D1 documentation lists a Workers Free allowance of 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, and up to 10 databases; these are usage quotas, not a guarantee of zero cost if the account is upgraded or limits/pricing change.
2. Create a dedicated **staging** D1 database named `sonicvhibez-state-staging` only after confirming the account remains on the Free plan and the database quota is available.
3. Bind it to `STATE_DB`, apply the migration, set a new high-entropy `DASHBOARD_OPERATOR_TOKEN` as a Worker secret, set the actual `DASHBOARD_OPERATOR_ID` environment variable, and deploy the Worker to a staging-only name.
4. Run authenticated bootstrap using a sanitized test fixture, then exercise read/update/conflict/backup/integrity/restore/restart tests. Verify byte-for-byte state and audit behavior.
5. Add an independent R2 backup export and restore test to a separate disposable D1 database. A backup in the same D1 database is not a disaster-recovery backup.
6. Only after all routes and UI behavior are ported and acceptance passes, consider a production cutover. Keep the Node dashboard and its source data unchanged until a verified rollback plan exists.

## Current decision

The **dashboard application remains NOT DEPLOYED**. The separate staging state Worker is deployed at `https://sonicvhibez-durable-state-staging.kajiboye44.workers.dev`; its public `/healthz` endpoint was previously observed returning HTTP 200 with publishing disabled. The dashboard UI/API is not integrated with this Worker, and no production persistence or production recovery capability is claimed.

## Current account verification

Current connected-account inspection confirms the staging D1 database and Worker described above. The database schema contains `dashboard_state`, `dashboard_backups`, and `dashboard_backups_created_at_idx`. Latest post-Time-Travel row counts are zero/zero. No R2 bucket, paid upgrade, or production resource was created. The dashboard app itself remains undeployed.
