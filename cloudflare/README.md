# SonicVhibez Cloudflare durable-state migration (staged)

This directory is a separate migration track. It does **not** replace the existing Node.js dashboard, worker runner, rendering pipeline, or publication gates.

## What is implemented

- `cloudflare/worker.js`: an authenticated D1-backed state API with health, one-time bootstrap, revision-checked snapshot replacement, operator backup creation/listing, integrity-checked restore, automatic pre-update/pre-restore snapshots, and server-attributed audit events.
- `cloudflare/migrations/0001_dashboard_state.sql`: D1 schema for one versioned dashboard-state snapshot and retained logical backups.
- `cloudflare.config.ts`: Cloudflare `cf` CLI project configuration with D1 binding and Workers Logs/Traces enabled.
- `test/cloudflare-state-worker.test.mjs`: Node tests for state validation, operator-token checks, publishing fail-closed behavior, health and unauthenticated API rejection.

## Explicitly not complete

- No D1 database, R2 bucket, Worker, domain, secret, or deployment has been created by this branch.
- The D1 binding has no account database ID until a deliberate resource-creation step is authorized and completed.
- The dashboard UI and existing Node API routes have not been ported. This is a durable-state service slice, not a replacement dashboard.
- The existing production JSON state has not been imported; no production instance exists and no production snapshot was available.
- The logical backups in D1 are not independent disaster-recovery copies. Before production acceptance, add and verify an independent R2 export/restore path and exercise D1 Time Travel recovery against a disposable database.
- No end-to-end D1 runtime test or Cloudflare deployment has yet passed.

## Safety and API contract

- All `/api/*` endpoints require `x-operator-token` matching a Worker secret named `DASHBOARD_OPERATOR_TOKEN` (at least 24 characters).
- The service rejects publishing-enabled state and active Safari affiliate campaigns.
- `POST /api/state/bootstrap` is one-time only. Supply the reviewed, complete existing state snapshot; do not bootstrap with an empty or guessed production state.
- `PUT /api/state` requires `If-Match` with the current revision. A mismatch returns HTTP 409. Each update creates a pre-update logical backup and appends an operator-attributed audit event.
- `POST /api/backups` creates a manual logical backup.
- `POST /api/backups/restore` requires `backupId` and `expectedRevision`; integrity and schema are checked, and the current state is backed up before restore.
- Health is public and reports `publishingEnabled: false`; it does not expose account, database or secret metadata.

## Free-tier-first deployment sequence (not yet executed)

1. Verify Cloudflare account plan and current D1/Workers quotas. The current D1 documentation lists a Workers Free allowance of 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, and up to 10 databases; these are usage quotas, not a guarantee of zero cost if the account is upgraded or limits/pricing change.
2. Create a dedicated **staging** D1 database named `sonicvhibez-state-staging` only after confirming the account remains on the Free plan and the database quota is available.
3. Bind it to `STATE_DB`, apply the migration, set a new high-entropy `DASHBOARD_OPERATOR_TOKEN` as a Worker secret, and deploy the Worker to a staging-only name.
4. Run authenticated bootstrap using a sanitized test fixture, then exercise read/update/conflict/backup/integrity/restore/restart tests. Verify byte-for-byte state and audit behavior.
5. Add an independent R2 backup export and restore test to a separate disposable D1 database. A backup in the same D1 database is not a disaster-recovery backup.
6. Only after all routes and UI behavior are ported and acceptance passes, consider a production cutover. Keep the Node dashboard and its source data unchanged until a verified rollback plan exists.

## Current decision

The app remains **NOT DEPLOYED**. No public URL, operational dashboard, production persistence, or production recovery capability is claimed by this branch.
