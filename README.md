# SonicVhibez Marketing Machine

Safety-first, free-first content workflow for SonicVhibez. Nature Frontiers is excluded. Public publishing, public scheduling, and visibility changes remain disabled.

## Current status

The repository contains draft queue content, narration workflows, render and validation scripts, a guarded private-only uploader, a schedule validator, and a local operator dashboard. This is not yet a fully accepted production system: the dashboard does not yet trigger the media renderers or uploader, OAuth channel identity has not been verified in this environment, no rights-cleared wildlife footage/human approvals are evidenced, and no actual private upload is claimed.

## Authoritative schedule

`config/weekly-content-plan.json` is the target schedule:
- Tuesday 17:00 Africa/Johannesburg — one 6–10 minute long-form draft.
- Thursday 17:00 Africa/Johannesburg — one 6–10 minute long-form draft.
- Saturday 17:00 Africa/Johannesburg — one 50–60 second Short draft.

GitHub Actions cron is UTC: 15:00 UTC equals 17:00 South Africa time. South Africa does not currently observe daylight saving time. These workflows produce drafts only.

Run `npm run validate:schedule` to check schedule, queue mapping, approved Selar destination, workflow cron declarations, and disabled publishing.

## Local dashboard

Requires Node.js 20+ and npm. From the repository root:

```sh
npm install --ignore-scripts
# In a private terminal, set a random operator token of at least 24 characters:
# macOS/Linux:
export DASHBOARD_OPERATOR_TOKEN="$(node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))')"
npm run dashboard
```

Open http://127.0.0.1:8787 and enter the same token. Windows PowerShell equivalent:

```powershell
$env:DASHBOARD_OPERATOR_TOKEN = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
npm run dashboard
```

The server binds to loopback only, rejects startup without a strong operator token, and persists queue drafts and audit events under `state/dashboard-state.json` (or `DASHBOARD_STATE_DIR`). Back up that directory securely. Do not expose this service directly to the public internet. A remote deployment requires a proper authenticated reverse proxy, TLS, authorization review, and server-side secret management.

The dashboard reads real configuration and queue state, creates validated draft records, and shows current blockers. It does not pretend to render media or perform uploads. Do not use it to claim rights or editorial approval.

## Approved campaign destination

The only currently configured product campaign is Selar: https://selar.com/0u19v8u99l. Do not add Safari affiliate campaigns until the owner supplies and verifies exact URLs. Keep future campaign destinations, disclosures, and reporting independent.

## Production and validation commands

```sh
npm test
npm run validate:schedule
npm run check:captions
npm run readiness
```

Use FFmpeg/ffprobe for actual media rendering and technical checks. A text-led typography draft is not a completed wildlife documentary. Rights, editorial review, captions, audio, thumbnail relevance, and promotional disclosure require human verification.

## Private YouTube upload

The existing guarded uploader requires `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, and `SONICVHIBEZ_CHANNEL_ID` as secure environment variables or GitHub secrets. Verify the authenticated channel using the authorized YouTube API before any upload. The only allowed visibility is private. Inspect the remote channel before retrying an uncertain outcome. Never put secret values in chat, source code, logs, or artifacts.

## Known blockers and evidence

- Test and media execution status: see [test baseline and regression report](docs/TEST_BASELINE_AND_REGRESSION_REPORT.md).
- Evidence-based feature inventory and blockers: see [project completion audit](docs/PROJECT_COMPLETION_AUDIT.md).
- Operational safety and recovery notes: see [OPERATIONS.md](OPERATIONS.md).

No current result should be described as a green test suite or successful real upload until the corresponding workflow or integration evidence exists.
