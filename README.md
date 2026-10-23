# SonicVhibez Marketing Machine

Safety-first, free-first draft production and campaign management for **SonicVhibez only**. Nature Frontiers is excluded. Public publishing, public scheduling and automatic visibility changes remain disabled.

## Current status

The current implementation includes a local authenticated dashboard, persistent draft/job state, date-specific slot reservation, validation task execution, campaign preview/activation/deactivation, evidence-bound human-review primitives, FFmpeg render scripts, and a private-only uploader with attempt-ledger/reconciliation safeguards.

The automated implementation suite passed **88/88 tests** at tested implementation SHA `1c02e6529613e3dee695f98946d4c642fdf146b2`:
- [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40024835685)
- [Metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40024830465)
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40024835796)

The default-branch baseline passed 54/54 tests at `45352b73bb6cc4787b2a49988b575afb754ab627` ([run](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047)).

**Not yet fully accepted:** no genuine rights-cleared final MP4 has been generated and inspected in this pass; worker leases/backoff are incomplete; OAuth identity and a real private upload were not exercised; and no package lockfile exists, so `npm ci` has not been proven.

## Authoritative schedule

`config/weekly-content-plan.json` is the single source of truth:
- Tuesday 17:00 Africa/Johannesburg — one 6–10 minute, 16:9 long-form draft.
- Thursday 17:00 Africa/Johannesburg — one 6–10 minute, 16:9 long-form draft.
- Saturday 17:00 Africa/Johannesburg — one 50–60 second, 9:16 Short draft.

GitHub Actions cron is UTC: 15:00 UTC equals 17:00 South Africa time. These are draft-production targets, not public publishing times. Queue items are a backlog; they are not reserved calendar slots.

Run:

```sh
npm run validate:schedule
npm run validate:campaigns
npm test
```

## Local setup and dashboard

Requires Node.js 20+ and npm. A lockfile is not yet committed, so use `npm install --ignore-scripts` until reproducible installation is completed.

Copy `.env.example` to a private local `.env` file or export values in your terminal. Set:
- `DASHBOARD_OPERATOR_TOKEN`: random value with at least 24 characters.
- `DASHBOARD_OPERATOR_ID`: operator identity recorded in review/campaign audit history.

Do not commit `.env` or credentials.

macOS/Linux example:

```sh
export DASHBOARD_OPERATOR_TOKEN="$(node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))')"
export DASHBOARD_OPERATOR_ID="your-operator-identity"
npm run dashboard
```

Open http://127.0.0.1:8787. The dashboard binds to loopback by default, rejects weak/missing operator tokens, and persists state under `state/dashboard-state.json` or `DASHBOARD_STATE_DIR`. Back up that directory securely. Do not expose this service directly to the public internet; remote access requires TLS, a proper authenticated reverse proxy, access-control review and secure secret management.

The dashboard can create draft records, launch fixed renderers under worker leases, inspect real MP4s with ffprobe, validate captions/metadata, record per-asset rights evidence, and bind review to artifact checksums. The end-to-end pipeline remains blocked until real manifests and licensed source assets are supplied.

## Campaign rules

Campaign records are validated by `npm run validate:campaigns`.
- Selar must use exactly `https://selar.com/0u19v8u99l`. Activation only enables draft use.
- Safari remains inactive by default. To activate for draft use, provide the exact HTTPS destination and disclosure, preview them in the dashboard, and explicitly confirm. Deactivation clears the active Safari URL and approval.
- Campaign activation never authorizes YouTube upload or public publishing.

## Media and review gates

Render scripts require completed manifests, real inputs and rights-evidence references. A boolean or placeholder string is not proof that a license is genuine. No wildlife footage is fabricated. Only review actual files after rendering and technical checks; no real MP4 path/checksum/duration/dimensions are claimed by this report.

Human review is bound to artifact SHA-256, metadata version, operator identity and structured rights evidence. Any changed artifact or metadata requires a new review.

## Private-only YouTube workflow

The uploader:
- Requires secure OAuth environment values and an independently confirmed SonicVhibez channel ID.
- Requires `CONFIRM_PRIVATE_UPLOAD=YES`, a stable job ID and an artifact-bound approval record.
- Enforces `privacyStatus: private`; there is no public or unlisted fallback.
- Writes an attempt ledger before upload, re-fetches the remote video and verifies private visibility.
- Refuses blind retries after uncertain outcomes. For later workflow attempts, restore the prior `sonicvhibez-upload-ledger` artifact by supplying its run ID.

The manual workflow defaults confirmation to `NO`; a real upload was **not** performed in this implementation pass. Never upload before rights evidence, review, channel identity and explicit authorization are all verified.

## Environment variables and secrets

See `.env.example` for variable names only. Use local secure environment variables or GitHub Actions secrets. Never paste OAuth credentials into chat, commit them, or print them in logs.

## Remaining acceptance work

1. Commit a real npm lockfile and prove clean `npm ci`.
2. Finish worker leases, heartbeat/expiry, retry backoff and stale-worker fencing.
3. Provide completed real manifests and rights-cleared inputs, then exercise the dashboard-launched render/validation/rights/review pipeline end to end.
4. Provide rights-cleared source assets and evidence, then generate and inspect real Short and long-form artifacts.
5. Test upload failure injection and reconciliation; verify authorized SonicVhibez OAuth identity before any actual private upload.
6. Finish backup/restore and restart recovery acceptance.

See `docs/PROJECT_COMPLETION_AUDIT.md`, `docs/PROJECT_COMPLETION_REPORT.md`, `docs/TEST_BASELINE_AND_REGRESSION_REPORT.md`, and `OPERATIONS.md` for detailed evidence and blockers. PR #1 remains open and in draft; do not merge or enable public publishing before acceptance.

## Acceptance status

Latest tested implementation SHA: `1c02e6529613e3dee695f98946d4c642fdf146b2`; [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40024835685), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40024830465), and [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40024835796) each pass 88 tests with no failures or skips. This is not a claim of full production acceptance: no rights-cleared source media or real render was supplied, `npm ci` is not verified because no lockfile is committed, and no live OAuth/private upload was attempted. Public publishing remains disabled.
