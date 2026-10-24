## Cross-run Facebook draft history — new

The scheduled/manual default-branch workflow runs `scripts/restore-facebook-draft-history.mjs` before generating a new draft. It reads only artifacts named `nature-frontiers-facebook-draft-*` from the previous 14 days using the workflow token with `actions: read`; it does not need write permission. The restore step validates each artifact's identity, destination, timezone, 08:00/18:00 assignment and draft-only flags. Missing permissions, API failures, unexpected archive paths, malformed packages or conflicting packages for the same date stop the job rather than silently resetting history.

This history is **bounded to the artifact-retention window**, not a permanent editorial database. If the history step fails, inspect the run and artifacts before manually rerunning; do not bypass the guard or manufacture history. Re-running the same local date reuses the exact retained package; conflicting same-date packages stop the job for operator reconciliation. Artifact downloads are bounded and archive paths are not extracted to disk. Mocked integration tests cover these failure paths, but they do not replace the first real default-branch restoration check. The PR-branch workflow is intentionally skipped, so the first default-branch scheduled/manual run after authorized release must verify real artifact restoration and deduplication. Drafts remain research-required, with `publishReady=false` and `publishingEnabled=false`; this step never publishes to Facebook.

# Operations Runbook

## Facebook daily workflow — draft-only

The Nature Frontiers Facebook Page is a separate destination from SonicVhibez YouTube. The application includes a gated Meta Graph API adapter, but publishing defaults are disabled and no real Page operation has been tested.

1. Verify the exact Facebook Page in Meta's own settings and record the numeric Page ID; do not rely on the Page display name.
2. Put the same exact numeric Page ID in `config/facebook-publishing.json` and `NATURE_FRONTIERS_FACEBOOK_PAGE_ID`. Configure `META_USER_ACCESS_TOKEN` and `META_PAGE_ACCESS_TOKEN` only in the secure environment. Never paste or commit tokens.
3. Start the dashboard locally. Use the read-only “Verify Page identity” control (or authenticated `POST /api/facebook/verify-page`) to check granted `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, the Page `CREATE_CONTENT`/`MANAGE` task, exact Page ID and matching Page token. Then inspect `GET /api/facebook/state`. The dashboard can suggest a research-first topic; it intentionally supplies a placeholder rather than inventing a factual claim.
4. Create a draft through `POST /api/facebook/drafts` with a unique ID, specific topic, supported content pillar, caption, future local date, numeric destination Page ID, structured claim sources, and media/license evidence paths and SHA-256 checksums.
5. Recheck with `POST /api/facebook/drafts/evaluate`. The checker blocks missing/wrong Page identity, missing media/license evidence, checksum mismatches, unsupported source records, missing required disclosures, engagement bait and near-duplicate content. Some uncertain or sensitive cases are flagged for human review.
6. Approval through `POST /api/facebook/drafts/approve` is allowed only when the current deterministic evaluation passes. Material changes invalidate the recorded approval fingerprint.
7. The schedule uses `Africa/Johannesburg`, initially testing 08:00 versus 18:00. This is a hypothesis, not a claimed best time. The current experiment requires at least 14 eligible observations in each arm before recommending further comparison; no Page Insights are currently present.
8. Keep `config.publishingEnabled=false`, `config.dryRun=true`, and `FACEBOOK_PUBLISH_ENABLED=NO` unless the owner explicitly approves enabling the integration after all checks. The publish endpoint returns HTTP 409 with these defaults. When gates are enabled, each scheduled post still requires explicit per-operation confirmation, durable attempt logging, remote refetch and receipt persistence. No live test has been performed.

Never store Meta tokens in source control, browser state, API responses or audit events. No real Facebook post has been created by these tests. See [the Facebook pipeline audit](docs/FACEBOOK_PIPELINE_AUDIT_2026-10-24.md).

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

## Daily Facebook draft generation

Run `npm run facebook:draft:daily` to create today's research-only draft package using the `Africa/Johannesburg` calendar date. The default output is `run-logs/facebook-daily-drafts/YYYY-MM-DD.json`. The generator preserves an existing same-day artifact, checks local editorial state when present, and never fills missing claims, media, licence evidence or Page identity with invented data. Every output remains `publishReady=false` and `publishingEnabled=false`.

The [GitHub Actions daily-draft workflow](.github/workflows/facebook-daily-draft.yml) is configured for 07:30 SAST and stores its output artifact for 14 days. The verified run created [artifact 12558699856](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856). Scheduled workflows execute only from the repository's default branch; while PR #1 remains draft, this is not an active production schedule. The workflow creates a draft artifact only and does not call Meta or publish. Research, media/licensing evidence, current Page identity/permissions, compliance recheck and human approval remain required.

## Current validation evidence

The latest verified code/test checkpoint is `1155263c25e85f901b9245fd4e024898a1af6f19`. All three validation workflows and the daily-draft workflow passed on that exact commit:
- [Automation validation — run 40091734573](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734573)
- [Metadata validation — run 40091734584](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734584)
- [Content quality — run 40091734600](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734600)
- [Daily Facebook draft workflow — run 40091734576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576)

Each reports 139 Node tests passed, 0 failed, 0 skipped. Automation also passed 8 Python safety tests, JavaScript syntax checks and Python compilation. CI used `npm ci --ignore-scripts` (46 packages added, 47 audited). npm audit reports 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`. Plain `npm ci` remains unverified.

The actual daily workflow output detected that its assigned 08:00 SAST slot had passed and returned `MISSED_SLOT_REVIEW_REQUIRED`; it did not backdate, batch-publish, or claim success. The retained draft artifact is [here](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856). Scheduled events execute only on the default branch, so the daily schedule is not active in production while PR #1 remains draft.

Approval fingerprints now bind claims/source/licensing provenance and disclosure, and keyed Meta credential fingerprints invalidate stale permission attestations after credential rotation. These automated tests do not prove real Page identity, Insights, licence authenticity or publishing. Public YouTube publishing remains disabled; PR #1 remains open, draft and unmerged.


## 3. Schedule and queue

`config/weekly-content-plan.json` is authoritative:
- Tuesday at 17:00 Africa/Johannesburg: 6–10 minute 16:9 long-form draft.
- Saturday at 17:00 Africa/Johannesburg: 50–60 second 9:16 Short draft.

The Tuesday/Saturday cron slots are draft-preparation triggers only. The publication policy is a rolling `long_form → long_form → short` cycle with at least 72 elapsed hours between consecutive actual publications (216 hours minimum for three cyclic gaps); it makes no weekly-count promise. The upload path now retrieves the authenticated channel's uploads playlist, compares all returned remote IDs/timestamps/visibility against a complete owner-reviewed reconciliation file, and blocks unresolved upload attempts. This live history check still needs real owner credentials and a completed reconciliation record. Public publishing remains disabled.
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
- `PRIVATE_UPLOAD_AUTHORIZATION_PATH` — a separate one-shot authorization record bound to the exact job ID, final video hash, metadata hash, approval hash and independently verified channel ID
- `JOB_ID`, `UPLOAD_APPROVAL_PATH`, `METADATA_PATH`, `VIDEO_PATH`

The uploader verifies that the authenticated channel title is exactly SonicVhibez and its ID matches the configured ID. A live insert additionally requires `PRIVATE_UPLOAD_AUTHORIZATION_PATH` containing `decision: AUTHORIZE_ONE_PRIVATE_UPLOAD`, a unique `authorizationId`, the exact `jobId`, `artifactSha256`, `metadataSha256`, `approvalSha256`, verified `channelId`, `visibility: private`, `publishingEnabled: false`, operator identity and a timestamp no older than 24 hours. The authorization ID is persisted in the pre-insert attempt ledger and cannot be reused. The uploader writes the attempt ledger before remote insert, uses only `privacyStatus: private`, re-fetches the remote video and verifies private visibility and channel ownership. No public or unlisted fallback exists.

## 7. Uncertain upload outcomes and recovery

Attempt ledger: `run-logs/upload-attempts.json`. Receipts: `run-logs/upload-<video-id>.json`. The uploader also uses `run-logs/upload-operation.lock` to serialize concurrent processes. A crash can leave a stale lock; the system intentionally fails closed and requires an operator to reconcile the ledger and lock before clearing it. Never automatically remove a stale lock or reuse a consumed authorization.

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


## Rolling publication and history gate

The authoritative cycle is `long_form → long_form → short`; each next actual publication must be at least 72 elapsed hours after the previous actual publication. The cycle's three gaps total at least 216 hours. Workflow cron slots are draft-preparation only. The production upload command fails closed unless authenticated channel history is retrieved, every public/private/unlisted video is covered by `CHANNEL_HISTORY_RECONCILIATION_PATH`, all IDs/timestamps/visibility match the remote API, the next format is correct, the gap is valid, and the upload-attempt ledger has no unresolved attempts. The reconciliation file is owner-reviewed evidence, not a substitute for the API comparison.
