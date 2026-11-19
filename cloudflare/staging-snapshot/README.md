# Recovered Cloudflare staging Worker source snapshot

Read-only recovery snapshot of the deployed Worker `sonicvhibez-durable-state-staging`.

## Exact source reconciliation — 19 November 2026

- Live deployment version: `9a9bfd4c-208c-4dd8-93b0-5f84cdf3356c`
- Live deployment timestamp: `2026-11-14T19:06:42.659275Z`
- Live Worker was deployed from the Cloudflare Dashboard; no Git SHA was recorded in Cloudflare deployment metadata.
- A read-only Cloudflare API export of the live multipart Worker script was compared with every tracked module in this directory at repository commit `6302fae3cda5255296dcc50de69254e70dc61481`.
- **All eight deployed modules matched the tracked snapshot byte-for-byte after newline normalization**: `worker.js`, `dashboard-state-compat.js`, `draft-compat.js`, `facebook-idea-compat.js`, `weekly-plan-compat.js`, `authoring-review-compat.js`, `campaigns-compat.js`, and `content-job-lifecycle-compat.js`.
- This gives the live staging deployment a verified source-content match to the listed GitHub commit, although its deployment provenance still says Dashboard rather than a GitHub Actions deployment.

## Deployment and trust boundaries

- The deployed worker's OIDC trust still pins `refs/heads/codex/cloudflare-adapter-integration-20261108` and `.github/workflows/repository-runner.yml` on that old branch.
- That old branch still exists and is unprotected. The current implementation branch is `codex/marketing-machine-audit-fixes`; its current tree does not contain `.github/workflows/repository-runner.yml`.
- The old workflow is manual-only, requires explicit `run_repository_runner=true`, and limits a run to one job. Read-only GitHub Actions history inspection found **zero `workflow_dispatch` runs** on that old branch. No production job dispatch is claimed.
- The live Worker has not received the new wrapper's default-off gate; it still uses the old pinned OIDC trust. A read-only authenticated staging smoke [44555237191](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44555237191) passed: backup listing and unchanged inventory PASS, five backups retained, unauthenticated runner status rejected, authenticated status read PASS, runner session inactive, and no D1 mutation. This smoke did not test OIDC dispatch or R2. Do not broaden or replace the live OIDC trust until branch protection is enabled, the intended runner workflow is reviewed and present on the protected branch, and the exact deployed source is reviewed.
- The tracked `cloudflare/worker.js` is now a unified wrapper that delegates the complete runner/state API contract to this tracked snapshot. The prior smaller state-only implementation is preserved as `cloudflare/state-only-worker.js`. The wrapper adds a default-off `RUNNER_OIDC_ENABLED` gate for repository-runner routes (operator-only session status/release remain available); provider publishing routes and unconnected production-runner routes remain fail-closed. The wrapper commit is `5cbb52ca62e1031ab00f0fd7d2d384566e6b558a` and has not been deployed.

## Live bindings and current service state

- D1 binding: `STATE_DB` → `sonicvhibez-state-staging`.
- R2 binding: `ARTIFACTS` → `sonicvhibez-artifacts-staging`; account-level R2 access currently returns HTTP 403 / code 10042, “Please enable R2 through the Cloudflare Dashboard.” The binding exists but bucket access is not verified.
- Secret-text binding names present: `DASHBOARD_OPERATOR_ID`, `DASHBOARD_OPERATOR_TOKEN`. Secret values were not exported or displayed.
- Workers.dev subdomain is enabled; preview URLs are disabled. API state operations require the operator token; runner operations require GitHub OIDC claims matching the pinned old branch/workflow.
- Direct read-only D1 SQL confirms application tables `dashboard_state`, `dashboard_backups`, `runner_state`, `runner_control`, `runner_artifacts`, and `runner_artifact_parts`. The D1 list endpoint's `num_tables: 0` metadata is stale.
- Staging D1 currently contains 1 dashboard-state row, 5 backups, and 0 runner-state/control/artifact/part rows. Current state revision is 3. No live runner session or persisted remote runner backoff/artifact activity was found.
- A controlled staging-only backup/restore drill passed in run `43701290286`; it retained the pre-restore backup and audit receipt and restored the exact pre-test state. This was an owner-authorized staging mutation, not a production change.

## Safety

This directory is a recovered snapshot of the live staging implementation, not a deployable release candidate. Its current OIDC trust and R2 dependency remain unresolved. Do not deploy this snapshot or the smaller `cloudflare/worker.js` over the live worker until the current protected-branch workflow, runner contract, R2 access and rollback plan are verified. No Cloudflare resource was changed by the read-only source reconciliation. No production worker was created or deployed; publishing remains disabled.

Historical recovery metadata from the earlier 9 November export is retained in Git history. Secret values were never exported.
