# SonicVhibez Marketing Machine

Free-first, local-first content operations for the SonicVhibez YouTube channel. This repository manages draft scheduling, production jobs, compliance gates, human review, campaigns and a guarded private-only upload path.

**Public publishing is disabled. Nature Frontiers is not an authorized target.** The approved Selar destination is exactly `https://selar.com/0u19v8u99l`. Safari affiliate campaigns start inactive.

## Requirements

- Node.js 20 or newer
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

## Facebook Page drafts (separate from YouTube)

The initial Nature Frontiers Facebook workflow is **draft-only**. The current implementation adds authenticated API routes for inspecting Facebook readiness, creating a draft, rechecking compliance and recording human review:

- `GET /api/facebook/state`
- `GET /api/facebook/idea?date=YYYY-MM-DD` — returns a research-first idea with placeholders; never publish-ready
- `POST /api/facebook/verify-page` — read-only verification of required Meta scopes, exact managed Page ID, Page task and matching Page token
- `POST /api/facebook/drafts`
- `POST /api/facebook/drafts/evaluate`
- `POST /api/facebook/drafts/approve`
- `POST /api/facebook/publish` — requires every disabled-by-default gate and explicit per-operation authorization

All API routes require `x-operator-token`. Draft state and audit events are persisted in the dashboard state file. The configured timezone is `Africa/Johannesburg`; 08:00 SAST is the initial hypothesis and 18:00 is the comparison arm. The experiment does not claim an optimal time without sufficient Page-specific observations.

Set the exact numeric Page ID in `config/facebook-publishing.json` and `NATURE_FRONTIERS_FACEBOOK_PAGE_ID`; configure `META_USER_ACCESS_TOKEN` and `META_PAGE_ACCESS_TOKEN` only in the secure local environment. The read-only verification endpoint checks `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, the Page `CREATE_CONTENT`/`MANAGE` task and that the Page token matches the token returned for that Page.

The official Meta Graph API adapter is implemented, but all defaults remain disabled: `config.publishingEnabled=false`, `dryRun=true`, and `FACEBOOK_PUBLISH_ENABLED=NO`. With those defaults `POST /api/facebook/publish` returns HTTP 409 and makes no remote mutation. Enabling the separate gates still requires a passing live Page/scope check, current draft approval, an explicit per-operation confirmation, a durable attempt record and remote receipt verification. Never store tokens in source control or paste them into chat. No real Page publishing test has been performed. See [Facebook pipeline audit](docs/FACEBOOK_PIPELINE_AUDIT_2026-10-24.md).

## Daily Facebook draft automation (safe, draft-only)

Run locally with `npm run facebook:draft:daily`. It uses the `Africa/Johannesburg` calendar date, checks existing dashboard drafts/posts when local state is available, restores recent daily artifacts from the previous 14 days through the read-only GitHub Actions artifacts API, validates every restored artifact and conflicting date, assigns the 08:00/18:00 experiment arm, and creates one idempotent JSON draft package under `run-logs/facebook-daily-drafts/YYYY-MM-DD.json`. Missing permissions, malformed archives, conflicting artifacts or invalid history fail closed instead of silently resetting topic history. This cross-run history is bounded by GitHub's 14-day artifact retention; it is not a permanent editorial database. The package is explicitly research-required, has no assumed Page ID, factual claims, media or licence evidence, and always reports `publishReady=false` and `publishingEnabled=false`. Existing same-day output is preserved rather than overwritten. When a prior artifact for today's date is restored, the exact retained package is reused in the new run; conflicting packages for that date stop generation for operator reconciliation. Archive retrieval is tested with a mocked GitHub API, but a real default-branch restoration has not yet been accepted.

The new [daily draft workflow](.github/workflows/facebook-daily-draft.yml) runs at 07:30 SAST when scheduled on the default branch, and its scheduled/manual job restores prior 14-day artifacts before generating today's draft. The artifact list requires the workflow's read-only `actions: read` permission. It retains a 14-day artifact for operator review: [latest verified draft artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856). **GitHub scheduled workflows run from the default branch only**; because PR #1 remains draft, this schedule is not yet active as a production daily trigger. No step publishes to Facebook. A human must research claims, add rights-cleared media/evidence, verify the Page and permissions, complete review, and separately authorize any live operation after the kill switches and external gates are resolved.

## Run the dashboard

```sh
DASHBOARD_OPERATOR_TOKEN='use-a-random-secret-of-at-least-24-characters' DASHBOARD_OPERATOR_ID='actual-operator-id' npm run dashboard
```

Open `http://127.0.0.1:8787`. Keep the terminal running. The dashboard's actions operate on real local state and allowlisted server-side tasks. Missing manifests or rights-cleared media should result in a blocked job, not a fake success.

## Schedule

Source of truth: `config/weekly-content-plan.json`.

- Tuesday, 17:00 Africa/Johannesburg: long-form draft, 6–10 minutes, 16:9
- Saturday, 17:00 Africa/Johannesburg: Short draft, 50–60 seconds, 9:16

These are **interim draft-production slots only**: Tuesday-to-Saturday is 96 hours and Saturday-to-next-Tuesday is 72 hours. The validator and authenticated dashboard API enforce actual elapsed-time gaps and schedule reservations.

**Owner decision required:** the requested target remains two long-form videos plus one Short per seven days. Three posts in a 168-hour weekly cycle with a 72-hour minimum require at least 216 hours, so that target is infeasible. The two-slot schedule is a temporary safety fallback, not a silent change to the requested goal. Public publishing remains disabled until the owner resolves the cadence and all production gates are met.
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
