# SonicVhibez Marketing Machine

## Current release status — 24 October 2026

**Current tested code candidate:** `b7e1a68413edca07900099dd04942c5ef8dcb02b`  
**PR #1:** [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1)  
**Branch comparison at this checkpoint:** 873 commits ahead, 2 behind `main`; 92 changed files. Merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; base head `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. History reconciliation remains an owner decision.

### Exact-SHA CI evidence

All listed completed workflow runs were triggered for code candidate `b7e1a68413edca07900099dd04942c5ef8dcb02b` and their job logs were inspected:

- [Automation validation — run 40121115027](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115027): **PASS WITH MODERATE ADVISORIES**; `npm ci --ignore-scripts`; Node tests 203 passed, 0 failed, 0 skipped; Python safety tests 8 passed; 16 held queue topics validated; campaign checks, JavaScript syntax and Python compilation passed. Fresh locked audit: 4 moderate, 0 high, 0 critical.
- [Metadata validation — run 40121115039](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115039): **PASS**; 203 Node tests passed, 0 failed, 0 skipped; schedule/caption and fail-closed readiness checks passed.
- [Content quality — run 40121115019](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115019): **PASS**; 203 Node tests passed, 0 failed, 0 skipped.
- [Daily Facebook draft — run 40121115017](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115017): **SKIPPED** on the PR event. No default-branch draft artifact is established by this run.
- Combined commit status returned no status entries; no missing status is inferred to have passed.

### Recent code-level changes

- `scripts/schedule-policy.mjs` rejects malformed calendar dates, timezone-free timestamps and invalid offsets. Regression coverage remains in `test/schedule-policy.test.mjs`.
- `scripts/youtube-history-gate.mjs` now strictly validates remote publication timestamps, owner reconciliation verification timestamps and reconciled record timestamps before accepting channel history. `test/youtube-history-gate.test.mjs` adds malformed-date, missing-timezone and invalid-offset cases.
- Exact code candidate: [`b7e1a68413edca07900099dd04942c5ef8dcb02b`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/b7e1a68413edca07900099dd04942c5ef8dcb02b). Exact-SHA workflow runs: [automation 40121115027](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115027), [metadata 40121115039](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115039), and [content quality 40121115019](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115019). All report 203 Node tests passed, 0 failed, 0 skipped; automation also reports 8 Python tests passed. The [daily Facebook draft run 40121115017](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115017) was skipped on the PR event.
- CI ran `npm ci --ignore-scripts`, not a normal lifecycle-script install. Dependency audit remains 4 moderate, 0 high and 0 critical advisories.

### Acceptance summary

| Gate | Status | Evidence / remaining action |
|---|---|---|
| Node and Python automated tests | PASS | 203 Node and 8 Python safety tests on exact code SHA above. |
| Schedule/campaign/queue/caption/syntax checks | PASS | Exact-SHA CI logs linked above. |
| Malformed timestamp rejection | PASS | New regression cases pass in 203-test suite. |
| Normal lifecycle-script install | NOT RUN | CI deliberately uses `npm ci --ignore-scripts`. |
| Dependency remediation | BLOCKED | Four moderate advisories remain; no untested major Google API upgrade was applied. |
| Full dashboard clean-install end-to-end acceptance | NOT RUN | Every visible action, restart and operator flow not independently exercised end to end. |
| Genuine media, rights evidence and final-hash human review | OWNER ACTION REQUIRED | Supply licensed inputs and complete human review. |
| SonicVhibez OAuth/channel identity and complete remote history | OWNER ACTION REQUIRED | Independently verify identity; reconcile public/private/unlisted videos and uncertain attempts. |
| Single private upload and remote receipt | OWNER ACTION REQUIRED | No upload authorization or live upload occurred. |
| Nature Frontiers Facebook Page/permissions and trusted claim verifier | OWNER ACTION REQUIRED | Verify integration; live publishing remains disabled. |
| Default-branch Facebook draft and retained artifact | BLOCKED | PR run was skipped; verify scheduled/manual default-branch execution and artifact. |
| Isolated backup/restore/restart drill | OWNER ACTION REQUIRED | Run in isolation and retain evidence. |
| Branch divergence and test-file incident | OWNER ACTION REQUIRED | Review both base-only commits and branch integration; no merge/rebase performed. |
| Production acceptance | BLOCKED | External, media, dependency, integration and owner-controlled gates remain open. |

**Safety defaults:** public/unattended YouTube publishing remains disabled; private upload requires separate single-operation authorization; Facebook live publishing remains disabled with dry-run/emergency stop safeguards; only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive. No live YouTube upload or Facebook post was performed.

**Verdict:** `CODE-LEVEL ACCEPTANCE BLOCKED`; production acceptance `BLOCKED`. Automated checks pass, but this does not establish full dashboard end-to-end acceptance or production readiness.

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
