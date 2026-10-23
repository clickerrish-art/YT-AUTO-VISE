# Operations and Production Gates

## Truthful status

The project currently passes its implementation regression suite, but it is not yet fully accepted. The tested code SHA `11987c6d62f40e11173b70c32ea4c467616da074` passed 82/82 tests in [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40022475907), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40022476331), and [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40022475908). The main baseline passed 54/54 tests at `45352b73bb6cc4787b2a49988b575afb754ab627` ([run](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047)).

No genuine final wildlife MP4, verified artifact checksum, FFmpeg playback result, OAuth channel verification, remote private upload or upload receipt is claimed. Public publishing remains disabled.

## Authoritative schedule

Use `config/weekly-content-plan.json` as the source of truth. Run `npm run validate:schedule` after schedule, queue or workflow changes.

- Tuesday, 17:00 `Africa/Johannesburg`: 6–10 minute 16:9 long-form draft.
- Thursday, 17:00 `Africa/Johannesburg`: 6–10 minute 16:9 long-form draft.
- Saturday, 17:00 `Africa/Johannesburg`: 50–60 second 9:16 Short draft.

GitHub Actions cron is UTC: 15:00 UTC equals 17:00 South Africa time. These are draft-generation targets, not public publishing times. The content queue is a backlog; it is not the dated-slot reservation ledger.

## Local dashboard

1. Use Node.js 20+ and npm. No `package-lock.json` is committed yet, so `npm ci` is not available as a proven setup step; CI currently uses `npm install --ignore-scripts`.
2. Copy `.env.example` to a private local environment file or export the variables in a secure terminal.
3. Set `DASHBOARD_OPERATOR_TOKEN` to a random value at least 24 characters long and `DASHBOARD_OPERATOR_ID` to the operator identity to be recorded in review/campaign history.
4. Run `npm run dashboard` and open http://127.0.0.1:8787.
5. Check `/healthz` and `/readyz`. Readiness reports missing external prerequisites and never enables publishing.

The dashboard binds to loopback by default and persists state in `state/dashboard-state.json` (or `DASHBOARD_STATE_DIR`). Stop the service before taking a consistent backup. Copy the entire state directory to an access-controlled backup location; protect it because it contains job and audit records. To restore, stop the service, preserve a copy of the current state, restore the backup directory, check file ownership/permissions, restart, and verify `/healthz`, `/readyz`, and dashboard state. Do not expose the service directly to the public internet.

## Campaign operations

- Selar destination must remain exactly `https://selar.com/0u19v8u99l`.
- Campaign controls are backed by durable dashboard state and audit events.
- Preview does not activate a campaign. Safari requires an exact HTTPS destination, disclosure text, and explicit operator confirmation after preview. Safari activation only enables draft use.
- Deactivation clears the active Safari destination and approval to prevent silent reactivation.
- Campaign activation does not authorize uploads or public publishing.

## Media production and rights

Render scripts require actual inputs and completed manifests. Before rendering:
1. Verify source footage, narration, music, images and fonts usage rights; retain permission/license evidence and checksums.
2. Complete the applicable render manifest with real repository-relative input paths.
3. Verify narration and caption timing.
4. Run the renderer, then inspect the output using FFmpeg/ffprobe and actual playback. Reject silent, truncated, corrupt or incomplete outputs.
5. Record output path, SHA-256, duration, dimensions, source inputs and validation results.
6. Review the exact artifact and metadata versions before approval.

Never treat an example manifest, placeholder, boolean flag, or statement written by a generator as proof of a license. Do not fabricate wildlife footage. If rights-cleared assets are absent, keep the production job blocked.

## Human review

The dashboard review endpoint requires a job in `AWAITING_HUMAN_REVIEW`, an operator identity, the actual repository-relative artifact and metadata files, matching SHA-256 values, and structured rights evidence. The rights source asset and evidence file must exist; the source checksum must match. Approval binds the exact artifact checksum, metadata version, reviewer identity and rights-evidence checksum. Changes to the artifact or metadata require re-review.

Review is not currently a substitute for a complete dashboard-launched render pipeline. Do not manually alter JSON state to forge approval.

## Private YouTube upload and recovery

Before an upload attempt:
- Store OAuth client ID, client secret, refresh token and the independently verified SonicVhibez channel ID in a secure environment or GitHub Actions secrets.
- Confirm the authenticated YouTube API identity and exact channel title `SonicVhibez`. Do not reuse a Nature Frontiers channel ID.
- Ensure the metadata status is `READY_FOR_PRIVATE_UPLOAD`, target is SonicVhibez, visibility is `private`, the Selar destination is exact, and rights/compliance checks passed.
- Save an approval JSON that binds the stable job ID, actual MP4 SHA-256, actual metadata SHA-256, reviewer identity, rights-evidence checksum, `visibility: private`, and `publishingEnabled: false`.
- Manually dispatch the private-upload workflow and choose `YES` for the explicit confirmation. The default is `NO`.

The uploader writes `run-logs/upload-attempts.json` before the remote insert. It then records the remote video ID, re-fetches the video, and verifies private status and channel identity before creating a receipt. An uncertain result is `RECOVERY_REQUIRED`; never blindly retry.

For GitHub Actions, each later attempt must restore the previous `sonicvhibez-upload-ledger` artifact using its run ID. Use `NONE` only for the first-ever attempt. If an attempt has no remote video ID, reconcile manually in YouTube Studio/API before any retry. If a remote ID exists, the uploader re-fetches it and checks its current private status before deciding not to insert again. Preserve ledger artifacts even when a workflow fails.

No real upload has been performed or verified by the implementation tests. Keep public publishing disabled.

## Secret handling and rotation

- Never commit secrets or paste them into chat.
- Rotate OAuth client secrets/refresh tokens using the provider's secure account controls; update the secret store and revoke obsolete credentials.
- Do not print environment values, tokens, authorization headers or raw API errors in logs.
- `.env.example` contains names only; create real `.env` files locally and keep them out of version control.

## Test and recovery commands

```sh
npm test
npm run validate:schedule
npm run validate:campaigns
npm run check:captions
npm run readiness
```

After a failed workflow, inspect the failed job logs for the exact tested SHA, correct the root cause, and rerun the suite. A green workflow on an earlier SHA does not validate a newer commit.

## Remaining acceptance work

- Commit a real npm lockfile and pass clean `npm ci`.
- Implement worker leases, heartbeat, expiry, bounded exponential backoff and stale-worker fencing.
- Complete dashboard-launched rendering, artifact validation, human review and production-job linkage.
- Generate and inspect real rights-cleared Short and long-form MP4s.
- Complete failure-injection/reconciliation tests, OAuth identity verification, and a real private-only upload only after all gates and explicit owner authorization.
- Finish end-to-end backup/restore and restart-recovery tests.

Do not call the application 100% operational until these blockers are resolved.