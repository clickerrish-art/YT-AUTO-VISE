# SonicVhibez Marketing Machine

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


Free-first, local-first content operations for the SonicVhibez YouTube channel. This repository manages draft scheduling, production jobs, compliance gates, human review, campaigns and a guarded private-only upload path.

**Public publishing is disabled. Nature Frontiers is not an authorized target.** The approved Selar destination is exactly `https://selar.com/0u19v8u99l`. Safari affiliate campaigns start inactive.

## Requirements

- Node.js 22 or newer (CI runs on Node.js 24)
- npm
- FFmpeg and ffprobe with required filters/fonts for real rendering and thumbnail extraction
- Legitimately licensed footage/narration/music and retained rights evidence before any production release

## Setup

```sh
npm ci --ignore-scripts
cp .env.example .env
```

Populate secrets only in your local environment or secure secret store; never commit them. Set:
- `DASHBOARD_OPERATOR_TOKEN`: random token, at least 24 characters
- `DASHBOARD_OPERATOR_ID`: actual operator identity for review and rights verification
- Optional `DASHBOARD_STATE_DIR`: durable local state directory
- For private upload only: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, and the independently confirmed `SONICVHIBEZ_CHANNEL_ID`

The dashboard refuses to start without its operator token and binds to `127.0.0.1` by default. Do not expose it directly to the internet.

## Facebook publishing (separate from YouTube)

Nature Frontiers Facebook is a separate destination from SonicVhibez YouTube. Public YouTube publishing remains disabled; the rolling long_form → long_form → short cadence and 72-hour actual-publication spacing remain independently enforced.

The new dedicated autonomous path has no routine per-post approval or manual publish button. It runs on the default branch at 07:30 Africa/Johannesburg, prepares the 08:00 local slot, runs evidence intake, evaluates the final payload, rechecks the Meta Page connection and publishes only when every required check passes. A blocked or missed slot is recorded and skipped; it is never backdated or caught up. The workflow requires an isolated persistent self-hosted runner labelled facebook-publisher.

- `npm run facebook:intake:autonomous` — evaluate evidence-complete candidate records and queue only eligible payloads.
- `npm run facebook:publish:autonomous` — reconcile interrupted attempts, validate the current slot and publish eligible queued content when all live gates are explicitly enabled.
- `GET /api/facebook/autonomous-status` — authenticated read-only dashboard status for connection readiness, queue count, intake summary, run history, blocked posts and receipts.
- `POST /api/facebook/verify-page` — initial read-only verification of required Meta scopes, exact managed Page ID, Page task and matching Page token.

The current candidate file `content/facebook-intake-candidates.json` is intentionally empty. The checked-in `content/facebook-autonomous-queue.json` is only a local-development fallback; production intake and publishing default to `facebook-autonomous-queue.json` inside the durable `FACEBOOK_STATE_DIR` (or an explicitly configured `FACEBOOK_AUTONOMOUS_QUEUE_PATH`). The intake will not fabricate facts, source evidence, media, licence records or captions. No eligible candidate means no post. Every queued item is rechecked immediately before the publish mutation. Because no trusted semantic-verification provider is configured, factual claims are currently blocked by default even when a source excerpt is present.

Live publishing is disabled by default. It requires all three JSON controls (`publishingEnabled=true`, `dryRun=false`, `emergencyStop=false)), the secure runtime variable `FACEBOOK_PUBLISH_ENABLED=YES`, the exact Page ID in both config and runtime, valid Meta user/Page tokens, live scope/task/token verification, durable state, and an eligible payload. Keep the emergency stop independent from enablement. Never store tokens in source control or paste them into chat.

Uncertain mutations are never blindly retried. The publisher reconciles the official Page scheduled_posts and feed edges using bounded pagination and exact caption/time matching. A single verified remote match is persisted as a receipt; no match is not proof of non-publication, and ambiguous outcomes remain blocked. See [autonomous runner setup](docs/FACEBOOK_AUTONOMOUS_RUNNER_SETUP.md) and [Facebook pipeline audit](docs/FACEBOOK_PIPELINE_AUDIT_2026-10-24.md).

The older authenticated Facebook draft and one-operation API routes remain separately gated for compatibility; they are not used by the autonomous schedule and are not presented as routine dashboard controls. The dashboard's visible Facebook area now focuses on autonomous health and read-only receipts rather than per-post approval/publish forms.

## Daily Facebook draft automation (draft-only)

The separate `npm run facebook:draft:daily` workflow creates a research-required draft package. It remains distinct from the autonomous publisher and never sends posts to Meta. It uses `Africa/Johannesburg`, preserves prior draft artifacts, and reports `publishReady=false` and `publishingEnabled=false`. Its GitHub artifact history is limited by artifact retention and is not a permanent editorial database. The autonomous publisher uses its own durable state directory instead.

The [daily draft workflow](.github/workflows/facebook-daily-draft.yml) is a separate, default-branch-only workflow. A skipped pull-request run is not evidence that the default-branch schedule has executed. Neither workflow is proof of live Page acceptance until the dedicated persistent runner and real Meta integration are verified.
 
## Run the dashboard

```sh
DASHBOARD_OPERATOR_TOKEN='use-a-random-secret-of-at-least-24-characters' DASHBOARD_OPERATOR_ID='actual-operator-id' npm run dashboard
```

Open `http://127.0.0.1:8787`. Keep the terminal running. The dashboard's actions operate on real local state and allowlisted server-side tasks. Missing manifests or rights-cleared media should result in a blocked job, not a fake success.

## Schedule

Source of truth: `config/weekly-content-plan.json`.

- Tuesday, 17:00 Africa/Johannesburg: long-form draft, 6–10 minutes, 16:9
- Saturday, 17:00 Africa/Johannesburg: Short draft, 50–60 seconds, 9:16

These Tuesday/Saturday workflows are **draft-preparation triggers only**, not a publication schedule. Actual publication follows a rolling `long_form → long_form → short` cycle with at least 72 complete elapsed hours between consecutive actual publications (216 hours minimum for three cyclic gaps; no weekly post-count promise). The private-upload path now requires a complete owner-reviewed channel-history reconciliation, checks public/private/unlisted remote records and blocks unresolved upload attempts. Public publishing remains disabled.
- GitHub Actions uses 15:00 UTC and creates drafts only.

## Useful commands

```sh
npm test
npm run validate:schedule
npm run validate:campaigns
npm run check:captions
npm run readiness
npm run render:short
npm run render:long
npm run validate:short-export -- media/next-short.mp4
npm run validate:long-export -- media/long-form-next.mp4
npm run preflight:media -- media/next-short.mp4 content/next-short.json
npm run render:thumbnail -- media/next-short.mp4 'Reviewed title' media/next-short-thumbnail.jpg
npm run upload:private -- content/next-short.json media/next-short.mp4
```

Rendering requires real manifests, audio, captions, footage and rights evidence. Examples are deliberately blocked until replaced with verified information. Upload requires a persisted artifact-bound approval, actual thumbnail file/checksum, `CONFIRM_PRIVATE_UPLOAD=YES`, valid OAuth credentials and a channel ID verified against the authenticated YouTube API. The uploader sets visibility to `private` and refuses blind retries.

## Test evidence

The latest verified code/test checkpoint is `1155263c25e85f901b9245fd4e024898a1af6f19`. All three repository validation workflows and the daily-draft workflow passed on that exact commit:
- [Automation validation — run 40091734573](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734573)
- [Metadata validation — run 40091734584](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734584)
- [Content quality — run 40091734600](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734600)
- [Daily Facebook draft workflow — run 40091734576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576), [retained draft artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856)

Each run reports 139 Node tests passed, 0 failed, 0 skipped. Automation also passed 8 Python safety tests, JavaScript syntax checks and Python compilation. CI used `npm ci --ignore-scripts` (46 packages added, 47 audited). npm audit still reports 4 moderate, 0 high and 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`. Plain `npm ci` without `--ignore-scripts` remains unverified.

The daily workflow's actual output marked the assigned 08:00 SAST slot `MISSED_SLOT_REVIEW_REQUIRED` because the run occurred after that time. The generator now records the proposed instant and refuses to backdate or catch up by publishing a backlog. The artifact remains draft-only. GitHub scheduled triggers run only on the default branch; PR #1 remains draft, so this schedule is not yet active as a production daily trigger.

The latest code also binds approvals to claim/source/licensing details and invalidates Meta permission attestations after credential rotation. These tests use mocks and local fixtures; they do not prove live Meta Page identity, permissions, Insights, licence authenticity, or real publishing.


## Operations and recovery

See [OPERATIONS.md](OPERATIONS.md), [docs/PROJECT_COMPLETION_AUDIT.md](docs/PROJECT_COMPLETION_AUDIT.md), [docs/GO_LIVE_BLOCKERS.md](docs/GO_LIVE_BLOCKERS.md), and [docs/RELEASE_GATE_CHECKLIST.md](docs/RELEASE_GATE_CHECKLIST.md). Back up the state directory and `run-logs/`; never retry an upload whose outcome is uncertain until the durable ledger and YouTube remote state have been reconciled. Keep PR #1 open and draft until all external prerequisites and live acceptance criteria are genuinely met.


## Rolling publication policy (current)

The publication sequence is `long_form → long_form → short`, with at least 72 complete elapsed hours between each consecutive actual publication. Three cyclic gaps require at least 216 hours; this is not a weekly posting promise. Tuesday/Saturday workflow triggers create drafts only. Before a private upload, the uploader fetches the authenticated SonicVhibez uploads playlist and requires `CHANNEL_HISTORY_RECONCILIATION_PATH` to enumerate every remote video with exact ID, format, actual timestamp and visibility, and it blocks unresolved upload attempts. This gate has automated tests but still requires owner credentials, a complete real reconciliation record, genuine approved assets and explicit authorization for one private upload.


## Current release evidence snapshot — 2026-10-24

Current tested code candidate: `9dd102f9636a5ba71c797cf79c104d3616cbe14e`. Exact-SHA automation validation [40122567804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567804) passed with advisories: 205 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; 16 queue topics validated; JavaScript syntax and Python compilation passed. Metadata [40122567802](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567802), content quality [40122567799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567799), and locked installation [40122564222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122564222) passed. Daily Facebook draft [40122567717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567717) was **SKIPPED** on the PR event and does not prove a default-branch artifact. The restore code now rejects symlinked destination paths before writing, with regression tests in `test/backup-restore.test.mjs`. Four moderate dependency advisories remain. This snapshot is historical for the tested code candidate; see [the current release register](GO_LIVE_BLOCKERS.md) for owner actions and production blockers. This docs-only update is not represented by the run links above; its exact-head CI is recorded in PR #1 after completion. Verdict: **CODE-LEVEL ACCEPTANCE BLOCKED; PRODUCTION ACCEPTANCE BLOCKED**.
