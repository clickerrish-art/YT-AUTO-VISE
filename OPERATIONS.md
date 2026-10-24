# Operations Runbook

## 1. Safe startup

Use Node.js 20+ and run `npm ci --ignore-scripts` (the supported, CI-verified install path). Set `DASHBOARD_OPERATOR_TOKEN` to a random value at least 24 characters long and `DASHBOARD_OPERATOR_ID` to the actual authorized operator. Start with `npm run dashboard`; it binds to loopback (`127.0.0.1) by default. Keep it local. A non-loopback deployment requires a securely authenticated reverse proxy, TLS, network controls and reviewed operational configuration; do not expose the bare server.

Check:
- `GET /healthz` — process health
- `GET /readyz` — readiness and external prerequisites
- dashboard API — requires the operator token in `x-operator-token`

The `/readyz` endpoint is a **production-readiness gate**, not just a process-health check. It executes the read-only production preflight and returns HTTP 503 with a `blockers` array while required manifests, source assets, rights/compliance checks, reviewed metadata, the Short MP4, or YouTube environment configuration are missing or invalid. Use `/healthz` to distinguish a running local server from production readiness. A clear readiness response does not independently prove that a license is genuine or that editorial review occurred.

Never put OAuth tokens in browser code, committed files or logs.

Dashboard startup also requires `DASHBOARD_OPERATOR_ID` (2–120 characters). Audit events use this configured operator identity; use the actual person responsible for the session rather than a generic label. The private uploader validates the approval's structured rights-evidence hash and rechecks each source asset and retained licence-evidence file against the saved SHA-256 values immediately before the remote upload flow.

## 2. Backup and restore

Create a secret-excluding checksummed snapshot of dashboard state, audit history, upload attempts, receipts, upload approvals and retained rights evidence:

```sh
npm run backup:state -- backups/sonicvhibez-backup.json
```

Review the backup file and keep it in a protected location. It excludes OAuth credentials and generated video files. Restore into an empty or reconciled environment with explicit confirmation:

```sh
RESTORE_CONFIRM=YES npm run restore:state -- backups/sonicvhibez-backup.json
```

If the existing dashboard state differs, restore requires `RESTORE_OVERWRITE=YES` and refuses to replace state modified after the backup. A different existing upload ledger is always a hard stop: reconcile remote YouTube state first and do not overwrite that ledger. Receipt, approval and rights-evidence conflicts are also refused. The restore preflights every entry and checksum before writing any files.

## Current validation evidence

The code/test commit `62b1bd599d63c3ab1d55b6a6660740fbf3d44157` passed all three GitHub Actions validation workflows with 100 passed, 0 failed, 0 skipped in each: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495157), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495128), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495162). The automation run completed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python compilation.

The later documentation checkpoint `b505a260570afb23de637d599868e55376a827aa` also passed all three workflows with 100 passed, 0 failed, 0 skipped: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034769), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034706), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034728). It was documentation-only relative to the tested code/test commit.

The implemented safeguards include: full production preflight at dashboard readiness; required operator identity in audit events; rights-record hash verification and rechecking retained source/licence file checksums before upload; checksummed backup/restore of state, audit history, rights records, review approvals, upload attempts and receipts; and fail-closed refusal to overwrite a different upload ledger. `.gitignore` excludes local secrets, state, rights records, backups and generated media.

These are automated/code-level checks, not proof of genuine licence authenticity, human playback review, real wildlife renders or a live YouTube upload. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

## 3. Schedule and queue

`config/weekly-content-plan.json` is authoritative:
- Tuesday at 17:00 Africa/Johannesburg: 6–10 minute 16:9 long-form draft.
- Saturday at 17:00 Africa/Johannesburg: 50–60 second 9:16 Short draft.

The active Tuesday/Saturday draft-production cycle is 96 hours then 72 hours. Dashboard draft creation, updates and direct job API requests convert 17:00 local time through the IANA timezone and reject date collisions or gaps below the configured 72-hour minimum. This does not inspect remote YouTube history automatically; that remains mandatory before any publication.

**Owner decision required:** the requested target remains two long-form videos plus one Short per seven days. Three posts in a 168-hour weekly cycle require at least 216 hours to preserve three 72-hour cyclic gaps, so the target is mathematically infeasible. The current one-long-form plus one-Short weekly draft cadence is an interim safety fallback, not a silent change to the requested goal. Keep publishing disabled until the owner resolves the cadence and the remaining production gates.
- Scheduled GitHub workflows run at 15:00 UTC and must remain draft-only.

Queue backlog items are separate from reserved dated production slots. Duplicate/conflicting reservations are rejected. Do not manually edit the JSON state while the dashboard is running.

## 4. Rendering and media checks

Use `content/render-manifest.example.json` and `content/long-form-render-manifest.example.json` only as schema examples. Copy to the expected manifest paths and fill with real footage, narration, captions and actual license-evidence references. Evidence references must point to retained, non-empty documents; a filename or checkbox alone does not establish that rights are genuine.

Run `npm run render:short` or `npm run render:long`; both renderers now run the appropriate standalone technical export validator before reporting success. Then run `npm run preflight:media -- media/next-short.mp4 content/next-short.json` for the separate Short metadata gate and inspect outputs with `ffprobe`/playback. The dashboard additionally verifies checksums, audio stream, duration, orientation and the generated 1280×720 thumbnail. Review the media by playback; a technically valid MP4 is not automatically editorially complete.

Do not represent test fixtures, typography-only slides or missing/placeholder footage as a wildlife documentary. If inputs or tools are missing, leave the job BLOCKED.

## 5. Human review and private approval

Configure the real operator identity before enabling rights review. Use the dashboard to validate captions/metadata, verify each source asset against its original rights evidence, and review the exact MP4 and thumbnail. Approval is bound to the MP4 checksum, related artifact checksums, metadata version and rights-evidence hash.

An approval file is written under `run-logs/upload-approvals/`. The file is not a substitute for genuine rights documents or actual human inspection. If media, thumbnail, metadata or rights evidence changes, do not reuse the approval; rerun validation and review.

## 6. Private-only YouTube upload

Never upload until all checks are complete. Set secrets securely:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`
- `SONICVHIBEZ_CHANNEL_ID` (must be independently confirmed via authenticated YouTube API)
- `CONFIRM_PRIVATE_UPLOAD=YES`
- `JOB_ID`, `UPLOAD_APPROVAL_PATH`, `METADATA_PATH`, `VIDEO_PATH`

The uploader verifies that the authenticated channel title is exactly SonicVhibez and its ID matches the configured ID. It writes the attempt ledger before remote insert, uses only `privacyStatus: private`, re-fetches the remote video and verifies private visibility and channel ownership. No public or unlisted fallback exists.

## 7. Uncertain upload outcomes and recovery

Attempt ledger: `run-logs/upload-attempts.json`. Receipts: `run-logs/upload-<video-id>.json`.

- If an attempt is marked `RECOVERY_REQUIRED`, do not run a new upload attempt for that job/artifact.
- If the ledger contains a remote video ID, use the reconciliation-only mode (`RECONCILE_ONLY=YES) to fetch that exact remote video, verify the channel and private status, and rebuild the local receipt.
- If no remote video ID was persisted, reconcile manually in YouTube Studio/API using the authorized account before retrying. Never guess an ID or blindly repeat the insert.
- A receipt-write failure is not success. Only the remote verification plus durable receipt can establish `PRIVATE_UPLOAD_VERIFIED`.

For GitHub Actions upload workflows, preserve the prior `sonicvhibez-upload-ledger` artifact and supply its run ID on the next manual dispatch. Use `NONE` only for a first-ever attempt. These workflows require explicit manual confirmation and secrets; they do not run on a schedule.

## 7. Backup and restore

Stop the dashboard before backup. Copy:
- the directory specified by `DASHBOARD_STATE_DIR` (or repository `state/), including `dashboard-state.json`;
- `run-logs/upload-attempts.json`;
- `run-logs/upload-approvals/` and upload receipt JSON files;
- original rights/license evidence and source asset register.

Keep backup copies private and access-controlled. To restore, stop the dashboard, preserve the current directory as a dated backup, restore the state/log/evidence files to their original paths, verify file permissions and checksums, then start the dashboard and inspect `/healthz`, `/readyz`, job states and upload ledger. Never restore an old ledger over a newer one without reconciling external uploads first.

## 8. Failed workflow recovery

Open the failed GitHub Actions run and inspect its summary/logs. Fix the root cause before rerunning. A green historical workflow does not validate a newer commit. Scheduled workflows only validate configuration and create draft work; do not add public publishing or automatic visibility changes.

## 9. Cost, campaign and channel constraints

- No paid services or upgrades are introduced by this workflow.
- Selar must remain exactly `https://selar.com/0u19v8u99l`.
- Safari stays inactive until its exact HTTPS destination and disclosure are supplied, previewed and explicitly approved by the owner.
- Nature Frontiers must never be selected as a target.
- Public publishing remains disabled.
