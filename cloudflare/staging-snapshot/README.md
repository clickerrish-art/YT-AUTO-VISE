# Recovered Cloudflare staging Worker source snapshot

Read-only recovery snapshot of the deployed Worker `sonicvhibez-durable-state-staging`.

- Retrieved: 2026-11-09
- Deployment ID: `4f26b391-0009-4948-ad3e-c4081ed7a1d5`
- Worker source annotation: `0ecea4caa817364d2f38b31b15a0f0c8033f68ca`
- Compatibility date: `2026-11-07`
- Main module: `worker.js`
- Modules: `content-job-lifecycle-compat.js`, `dashboard-state-compat.js`, `draft-compat.js`, `facebook-idea-compat.js`, `weekly-plan-compat.js`, `worker.js`, `authoring-review-compat.js`, `campaigns-compat.js`.
- Bindings present: D1 `STATE_DB`, R2 `ARTIFACTS`, secret-text bindings `DASHBOARD_OPERATOR_ID` and `DASHBOARD_OPERATOR_TOKEN`.

This is a snapshot of the deployed staging code, not a declaration that it matches the current repository branch. The deployed main module is materially larger than the tracked `cloudflare/worker.js`; treat this snapshot as recovery evidence pending semantic review. Secret values were not exported. No Cloudflare resource was changed by this read-only export. Do not deploy this snapshot until its differences and migration behavior have been reviewed.
