# OPERATIONS.md

## Authoritative current acceptance status — 25 October 2026

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Automated checks pass on the exact code/test SHA below, but full dashboard-control acceptance, complete divergent-history review, isolated recovery drills, real-account integration and deployment acceptance remain incomplete.

### Exact Git state
- Implementation branch: `codex/marketing-machine-audit-fixes`; tested code/test SHA: `e56e3f5a328590a2b54849299a9fabc09df02f25`.
- Current PR HEAD will be a documentation-only descendant of this tested candidate; see [live PR metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- At the tested code/test candidate, comparison was **1,036 ahead, 2 behind, 110 changed files**; subsequent documentation-only commits add no application-code changes. Use the live PR metadata for the current-head comparison. The full branch-only history has not been reviewed patch by patch. PR #1 remains open, draft and unmerged. No direct `main` edit or destructive history operation was performed.

### Exact-SHA CI
- [Automation/security — run 40181771250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771250): **PASS** — 244 Node tests, 0 failed/0 skipped; 8 Python tests; locked and normal `npm ci`; Google API import; JS syntax/Python compilation; 16 queue items; `npm audit`: 0 vulnerabilities across 49 packages.
- [Browser E2E — run 40181771259](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771259): **PASS** — 6 Chromium journeys against the local dashboard/backend; not every visible control is covered.
- [Content quality — run 40181771275](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771275): **PASS**.
- [Metadata — run 40181771283](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771283): **PASS**.
- [Production readiness — run 40181771257](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771257): **BLOCKED as required: 12 mandatory blockers**; retained diagnostic [artifact 12594570724](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771257/artifacts/12594570724).
- [Facebook daily draft — run 40181771276](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771276): **SKIPPED** on PR event; not default-branch acceptance evidence.

### Code fixes in this candidate
- Approval artifact directory creation now uses component-by-component symlink/non-directory checks before nested writes. Four new path-safety tests cover safe creation, symlink ancestors, file ancestors and dashboard use of the guard.
- Validation-task start and result persistence now use the cross-process state lock. A durable `RUNNING` record prevents duplicate launches across two dashboard processes sharing state; the regression test exercises concurrent submissions.
- Facebook Page verification now reports success/failure in a dedicated accessible status area, so refreshing the dashboard cannot erase the operation result; the new browser regression verifies persistent blocked feedback.
- Private upload workflow now uses lockfile-enforced `npm ci --ignore-scripts` and the built-in `${{ github.token }}` for restoring the prior attempt ledger; `test/ci-lockfile.test.mjs` asserts both settings.
- Existing approval transaction rollback, atomic JSON path checks, Facebook history restoration safeguards, dashboard handler wiring, schedule/queue invariants and publishing safety tests remain covered.

### Acceptance and owner actions
- [x] Exact-SHA automation, install, dependency audit, content and metadata checks pass.
- [x] Seven browser journeys pass.
- [x] Public/unattended YouTube publishing and Facebook live publishing remain disabled.
- [ ] Full dashboard-control browser acceptance and complete branch-history review/reconciliation.
- [ ] Isolated crash, rollback, backup/restore and deployment drills with retained evidence.
- [ ] Genuine rights-cleared Short/long-form media, validated manifests/checksums and human review.
- [ ] Verified SonicVhibez OAuth/channel identity, remote-history reconciliation, one-shot authorization and verified private-upload receipt.
- [ ] Verified Nature Frontiers Page permissions and successful default-branch Facebook draft run with retained artifact.
- [ ] Production monitoring, backup, emergency stop and deployment acceptance.

No real YouTube upload, public post or live Facebook post was performed. The sole approved Selar destination remains `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive. See [the current release evidence](docs/CURRENT_RELEASE_EVIDENCE_2026-10-25.md).

## Historical checkpoints (superseded; retained for audit trail)


## Live release assessment — 24 October 2026

**Latest application-code candidate:** `df5d28560a757fb185a020982f981fb1ce6722c7` (Google API client dependency and lockfile upgrade). Exact-head checks passed on `36b9e34285a9becb3ad3305f1147b5e831d7bf16`, a documentation-only descendant containing the same application code and dependency tree.
**PR #1:** [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
**Branch comparison at exact test head `36b9e34285a9becb3ad3305f1147b5e831d7bf16`:** 896 commits ahead, 2 behind `main`; 94 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Do not merge, reset, force-push, or rewrite divergent history without the owner's explicit decision.

### Exact-SHA evidence

- [Automation validation — run 40125752411](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752411): **PASS** on exact test head `36b9e34285a9becb3ad3305f1147b5e831d7bf16`; **206 Node tests passed, 0 failed, 0 skipped**; Python safety tests: **8 passed**; 16 queued topics passed safe-state/destination checks; campaign validation, JavaScript syntax and Python compilation passed. A clean isolated normal lifecycle-script `npm ci` passed and `googleapis` imported successfully.
- [Metadata validation — run 40125752409](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752409): **PASS** on the same exact test head.
- [Content quality — run 40125752405](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752405): **PASS** on the same exact test head.
- [Locked install/lockfile validation — run 40125748862](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125748862): **PASS** on the same exact test head; clean locked installation and configuration checks passed.
- [Production-readiness diagnostic — run 40125752527](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752527): **BLOCKED as intended** because mandatory production prerequisites remain unresolved. The `sonicvhibez-readiness-report` artifact was retained (artifact ID `12573171174`; expires 23 November 2026). This is not a readiness pass.
- [Nature Frontiers Facebook draft — run 40125752399](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752399): **SKIPPED** on the pull-request event. No default-branch draft or retained default-branch artifact is established by this run.

### Implemented in this audit

- The read-only readiness CLI exits with status 2 when mandatory gates are blocked and prints the complete blocker report; it exits 0 only when checks find no blockers.
- The dashboard readiness parser accepts the explicit blocked status and preserves actionable blockers rather than collapsing them into a generic validator error.
- The production-readiness workflow uses Node.js 24, runs for relevant pull-request paths, retains its diagnostic artifact, and fails the readiness gate while production prerequisites remain blocked.
- Pull-request validation workflows check out the exact pull-request head SHA rather than GitHub's synthetic merge ref. The automation workflow also verifies a normal lifecycle-script install in a clean temporary checkout with no credentials in its environment.
- Publication minimum spacing is configuration-driven across schedule validation, readiness checks, dashboard checks and the pre-upload history gate. The default remains 72 hours. The configured value must be finite, positive and at most 8,760 hours; cycle duration must equal the configured gap multiplied by the three-item cycle, and schedule, queue and spacing policy must agree. A regression test confirms a consistent 96-hour configuration is accepted.
- Upgraded `googleapis` from `^144.0.0` to `^188.0.0`; the lockfile now resolves `googleapis 188.0.0`, `gaxios 8.3.2` and `googleapis-common 9.3.1`. Exact-head npm audit reports **0 vulnerabilities** across all severities. The four previously reported moderate advisories are resolved in the audited lockfile; live OAuth/API account acceptance remains unverified.
- Publication cadence remains a rolling `long_form → long_form → short` cycle; the default 72-hour gap means at least 216 hours across three cyclic gaps. Tuesday/Saturday triggers are draft preparation only; no three-posts-per-week promise is made.

### Branch-divergence reconciliation

The live comparison is 896 ahead / 2 behind at the exact test head, with merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. The two base-only commits are file-only test churn: `71578dafc24e5d48173dce3f4e392e18e42aa40e` added `test/restore-facebook-draft-history.test.mjs` (117 lines), and `fa00d28e7f58911482686e4ad69fac9f4701a2e6` removed that same test file. They do not change runtime code. The implementation branch lacks this dedicated test file; owner review should decide whether to reintroduce its cross-run history-restoration coverage as a separately reviewed test. No merge, reset, force-push or history rewrite was performed.

### Current acceptance register

| Gate | Status | Evidence / next action |
|---|---|---|
| Node.js automated tests | PASS | 206 passed, 0 failed, 0 skipped on exact test head. |
| Python safety tests | PASS | 8 passed on exact test head. |
| Campaign, queue, schedule, syntax and compilation checks | PASS | Exact-head automation workflow above. |
| Normal lifecycle-script installation | PASS | Isolated clean checkout, no credentials, normal `npm ci`, and `googleapis` import passed. |
| Dependency audit | PASS | `npm audit`: 0 info, 0 low, 0 moderate, 0 high, 0 critical; total 0. |
| Configurable publication spacing | PASS | Default 72 hours; schedule, queue, dashboard, readiness and upload history gate use the validated configured value. |
| Readiness reporting fails closed | PASS | CLI returns status 2 with actionable blockers; dashboard returns HTTP 503 while mandatory production prerequisites are missing. |
| Clean-start dashboard/browser acceptance | NOT RUN | Exercise every visible control, authentication failure, API persistence, restart and error paths using the real app. |
| Real Short and long-form production media | OWNER ACTION REQUIRED | Supply genuine assets, completed manifests, rights evidence, checksums, full renders, full-file decode reports and human playback review bound to final hashes. |
| YouTube OAuth and channel identity | OWNER ACTION REQUIRED | Configure secrets securely, verify authenticated channel is SonicVhibez, retrieve complete public/private/unlisted history and reconcile uncertain attempts. |
| Private upload | OWNER ACTION REQUIRED | No live upload attempted. Require one-operation authorization, durable pre-insert ledger, private-only request and remotely verified private receipt. |
| Facebook integration | OWNER ACTION REQUIRED | Verify Nature Frontiers Page identity, token scopes and default-branch draft/artifact retention; live publishing remains disabled. |
| Backup/restore/restart drill | OWNER ACTION REQUIRED | Perform isolated restore and interruption/restart/concurrency tests; retain logs and checksums. |
| Branch divergence/test-file incident | OWNER ACTION REQUIRED | Review whether to restore the dedicated test coverage; no history rewrite or merge performed. |
| Production acceptance | BLOCKED | Mandatory media, identity, integration, recovery and owner-approval gates remain open. |

**Safety defaults:** public and unattended YouTube publishing remain disabled; a private upload requires explicit operation-specific authorization; Facebook live publishing remains disabled with dry-run and emergency-stop safeguards; the only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive.

**Verdict:** automated code checks and dependency audit pass on the stated exact test head; **CODE-LEVEL ACCEPTANCE REMAINS BLOCKED** pending remaining runtime verification. **PRODUCTION ACCEPTANCE IS BLOCKED.**

---

## Historical checkpoint material

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

Use Node.js 22+ (CI runs Node.js 24) and run `npm ci --ignore-scripts` (the supported, CI-verified install path). Set `DASHBOARD_OPERATOR_TOKEN` to a random value at least 24 characters long and `DASHBOARD_OPERATOR_ID` to the actual authorized operator. Start with `npm run dashboard`; it binds to loopback (`127.0.0.1) by default. Keep it local. A non-loopback deployment requires a securely authenticated reverse proxy, TLS, network controls and reviewed operational configuration; do not expose the bare server.

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


## Autonomous Nature Frontiers Facebook publisher — current implementation

The autonomous publisher is separate from the draft-only Facebook workflow and SonicVhibez YouTube uploader. See [the secure runner setup guide](docs/FACEBOOK_AUTONOMOUS_RUNNER_SETUP.md).

- Scheduled workflow: `.github/workflows/facebook-autonomous-publisher.yml`, 07:30 Africa/Johannesburg, default branch only, persistent self-hosted runner labelled `facebook-publisher`.
- Intake: `npm run facebook:intake:autonomous`. It accepts only evidence-bearing candidate records, runs the final-payload policy engine, queues eligible candidates and records blocked reasons in the durable state directory. It does not invent evidence, media, rights or captions.
- Publisher: `npm run facebook:publish:autonomous`. It requires an absolute durable `FACEBOOK_STATE_DIR`, exact matching Page ID in config/runtime, both Meta tokens, `FACEBOOK_PUBLISH_ENABLED=YES`, `publishingEnabled=true`, `dryRun=false`, and `emergencyStop=false`. Defaults remain disabled.
- Dashboard: authenticated `GET /api/facebook/autonomous-status` displays current configuration readiness, queue size, intake summary, recent run summary, blocked posts, uncertain attempts and the last verified receipt. It does not expose tokens or claim that the runner itself is healthy.
- Routine path: the autonomous workflow does not require per-post approval. The visible dashboard no longer includes per-post review or manual publish forms for routine operation. The older separately gated API endpoints remain for compatibility and are not called by the autonomous schedule.

### Recovery behavior

Before selecting new work, the publisher examines durable attempts in `PUBLISHING` or `UNCERTAIN` state. It uses the official Page `scheduled_posts` and `feed` edges with bounded pagination, exact caption and time matching, and no mutation retry. A unique verified match is persisted as a receipt. No match does not prove non-publication; unresolved or ambiguous outcomes stay blocked and are retried only as read-only reconciliation on a later run. The original attempt and history are never deleted to enable retry.

The checked-in `content/facebook-intake-candidates.json` and `content/facebook-autonomous-queue.json` are intentionally empty. Until a genuine content-intake record contains source evidence and excerpt, final caption, actual media checksum, licence evidence and the configured destination/schedule, the correct outcome is no post.

### Release limitations

Mock tests do not establish the real Page ID, token validity, permissions, runner isolation, durable volume, licence authenticity or successful remote publication. The self-hosted workflow is not active from the default branch until the PR is accepted through the repository's normal review process. Do not enable live flags until the exact candidate SHA has green CI and a controlled, separately authorized Meta integration test has a remotely verified receipt.


## Current release evidence snapshot — 2026-10-24

Current tested code candidate: `9dd102f9636a5ba71c797cf79c104d3616cbe14e`. Exact-SHA automation validation [40122567804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567804) passed with advisories: 205 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; 16 queue topics validated; JavaScript syntax and Python compilation passed. Metadata [40122567802](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567802), content quality [40122567799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567799), and locked installation [40122564222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122564222) passed. Daily Facebook draft [40122567717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567717) was **SKIPPED** on the PR event and does not prove a default-branch artifact. The restore code now rejects symlinked destination paths before writing, with regression tests in `test/backup-restore.test.mjs`. Four moderate dependency advisories remain. This snapshot is historical for the tested code candidate; see [the current release register](GO_LIVE_BLOCKERS.md) for owner actions and production blockers. This docs-only update is not represented by the run links above; its exact-head CI is recorded in PR #1 after completion. Verdict: **CODE-LEVEL ACCEPTANCE BLOCKED; PRODUCTION ACCEPTANCE BLOCKED**.


## Browser end-to-end acceptance

The repository includes a Playwright Chromium workflow that starts the actual local dashboard and backend with an isolated temporary state directory and test-only operator token. It does not call YouTube or Meta APIs, upload media, or publish posts.

Run locally with Node.js 24 (Node.js 22+ is declared by the package):

```sh
npm ci
npx playwright install --with-deps chromium
npm run test:browser
```

The browser test verifies unauthenticated API rejection, authenticated dashboard connection, schedule/rolling-cycle display from the backend, creation and persistence of a real local draft/job, duplicate-ID rejection, fail-closed readiness, and mobile-width horizontal overflow. This automated browser journey is separate from owner-controlled live integration, rights review, private-upload authorization, Facebook Page verification, and backup/restore drills.


## Approval-artifact rollback regression checkpoint — 25 October 2026

**Code/test candidate:** `85f4ececcdedc576c66dccf6103180fe0f2e9c72` (this documentation update is a later documentation-only descendant).

### Defect fixed and regression evidence
- Found a transaction edge case in `scripts/approval-artifact-transaction.mjs`: if the exclusive hard-link publication succeeded but removing its temporary hard link failed, the function threw while leaving the final approval artifact visible. That could make an operation appear failed while an uploadable-looking approval remained.
- The transaction now removes the final path it exclusively created when any later publication step fails, then cleans up the temporary path. If rollback itself fails, it reports that failure explicitly rather than hiding it.
- Added regression coverage in `test/approval-artifact-transaction.test.mjs` for injected temporary-link cleanup failure. The final approval path and temporary file must both be absent after the failed operation.
- Isolated local execution of the four approval transaction tests: **4 passed, 0 failed, 0 skipped**. This is focused local evidence, not a substitute for the full application suite.
- Exact candidate CI: [automation/security run 40168535857](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535857) **PASS** — 224 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; normal clean `npm ci`, Google API import, syntax/compile/campaign/queue checks passed; `npm audit` reported 0 vulnerabilities. [Browser E2E run 40168535886](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535886) **PASS** — 3 Chromium tests against the real local dashboard/backend. [Metadata run 40168535856](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535856) and [content quality run 40168535873](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535873) **PASS**.
- [Production readiness run 40168535859](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535859) **BLOCKED as intended**; its diagnostic artifact [12589466617](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535859/artifacts/12589466617) is retained through 24 November 2026. The workflow fails because mandatory production gates remain unresolved; that is not a code-test failure and not a release pass. [Facebook draft run 40168535861](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535861) was **SKIPPED** on the PR event and is not default-branch acceptance evidence.
- Git comparison at this code/test checkpoint: **957 commits ahead, 2 behind**, 105 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. PR #1 remains open, draft and unmerged. No merge, rebase, reset, force-push, cherry-pick or history rewrite was performed.

### Acceptance decision
The approval transaction defect is fixed and covered, and the exact candidate's automation, browser, metadata and content-quality checks pass. **The overall project remains IMPLEMENTATION INCOMPLETE; production acceptance is BLOCKED.** Genuine rights-cleared Short and long-form media and completed manifests, final-hash-bound human approval, verified SonicVhibez OAuth/channel identity and complete remote-history reconciliation, explicit authorization for one private upload and verified remote receipt, verified Nature Frontiers Page access and a successful default-branch Facebook draft artifact, isolated backup/restore/interruption/concurrency/rollback drills, full divergent-history review and production deployment verification remain unresolved. Public/unattended YouTube publishing and Facebook live publishing remain disabled; only approved Selar URL is `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive. No real YouTube upload or Facebook post was performed.


## Latest verified implementation checkpoint — 25 October 2026

**Exact tested application-code SHA:** `6b05beb4461ddf3065f05b56742a306fa4433ec2`. This checkpoint was tested by GitHub Actions on the exact SHA. Documentation-only descendants, if any, do not change the application code; do not describe this as CI for a later source change.

### Newly implemented fix
The dashboard previously wrote state to a temporary file and renamed it without explicitly flushing the file contents or parent-directory entry. The approval flow relies on state persistence completing before an uploadable approval artifact is exposed, so a successful rename alone was insufficient evidence of durable persistence across a crash/power loss.

- Added `scripts/atomic-json-file.mjs` with exclusive temporary-file creation, restrictive permissions, file `fsync`, atomic rename, parent-directory `fsync`, and cleanup of pre-rename temporary files on failure.
- Updated `scripts/dashboard-server.mjs` so all durable dashboard-state writes use this helper.
- Added `test/atomic-json-file.test.mjs`: complete JSON and mode check; simulated temporary-write failure preserves old state and removes the temp file; simulated rename failure preserves old state and removes staged file; symlink destination is rejected without following it.
- The existing approval-artifact transaction remains ordered so durable state persistence occurs before final approval artifact publication. If state persistence fails, no final approval artifact is exposed.

### Exact-SHA CI evidence
- [Automation/security run 40169467609](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467609) **PASS**: 228 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; clean locked install and isolated normal lifecycle-script `npm ci` passed; campaign/destination, review-metadata, queue, JavaScript syntax and Python compilation checks passed; `npm audit` reported 0 info, 0 low, 0 moderate, 0 high and 0 critical advisories.
- [Browser E2E run 40169467597](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467597) **PASS**: 3 Chromium tests against the real local dashboard/backend, including authenticated draft persistence and duplicate rejection, campaign safeguards, blocked readiness/mobile overflow, and a separate real local server restart persistence test.
- [Metadata run 40169467568](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467568) **PASS**.
- [Content-quality run 40169467601](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467601) **PASS**.
- [Lockfile validation run 40169463693](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169463693) **PASS**.
- [Production readiness run 40169467574](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467574) **BLOCKED as required**; its failure is the expected fail-closed result while mandatory production gates are unresolved, not a successful release gate.
- [Nature Frontiers Facebook draft run 40169467625](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467625) **SKIPPED** on the pull-request event; it is not default-branch draft acceptance evidence.

### Baseline and acceptance limitations
The pre-change baseline was not re-executed against the immediately preceding branch SHA before this patch. The last reported historical comparison was 224 Node tests / 8 Python tests on a different code candidate; it is not presented as a same-SHA baseline. Current exact-SHA evidence is 228 Node / 8 Python tests.

Current branch SHA at the code checkpoint: `6b05beb4461ddf3065f05b56742a306fa4433ec2`. `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`. Live comparison: **967 commits ahead, 2 behind, 107 changed files**. PR #1 remains open, draft and unmerged. No merge, rebase, reset, force-push, cherry-pick or history rewrite was performed. The complete divergent patch history has not been reviewed line by line, so branch reconciliation is not accepted.

### Remaining release gates
**Code acceptance is PARTIALLY VERIFIED, not fully accepted. Production acceptance is BLOCKED.** The current test suite and three browser tests do not establish every visible control/API route or all recovery drills. Genuine rights-cleared Short and long-form media, final manifests and validation reports, human playback and hash-bound approval, verified SonicVhibez OAuth/channel identity and complete remote-history reconciliation, explicit authorization for one private upload and verified remote receipt, verified Nature Frontiers Page access and successful default-branch Facebook draft artifact, isolated backup/restore/interruption/concurrency/rollback drills, complete branch-history review and actual deployment/monitoring verification remain outstanding. No real YouTube upload or Facebook post was performed. Public/unattended YouTube publishing and Facebook live publishing remain disabled. Only approved Selar destination: `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive.
