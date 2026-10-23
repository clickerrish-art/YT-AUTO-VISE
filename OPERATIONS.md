# Operations and production gates

## Current scope and truthful status

This repository provides draft topics, caption and metadata validation, scheduled narration-draft workflows, FFmpeg renderers, production-readiness diagnostics, and a guarded private-only YouTube uploader. Presence of these components is not proof that a complete documentary has been rendered or that YouTube authorization is configured. Current media outputs remain drafts until real footage rights and human review are documented.

## Authoritative schedule

The sole target schedule is in `config/weekly-content-plan.json`. Run `npm run validate:schedule` after changing the schedule, queue, or workflow files. It checks the configuration, queue type/day mapping, approved Selar destination, and workflow cron declarations.

- Tuesday, 17:00 `Africa/Johannesburg`: long-form draft, 6–10 minutes.
- Thursday, 17:00 `Africa/Johannesburg`: long-form draft, 6–10 minutes.
- Saturday, 17:00 `Africa/Johannesburg`: Short draft, 50–60 seconds.

GitHub Actions cron uses UTC: 15:00 UTC maps to 17:00 in South Africa. South Africa does not currently observe daylight saving time. These are draft-generation targets, not public publication times. Queue items are a backlog; multiple items on a day do not mean multiple videos are authorized to upload.

## Current drafts

- Short 001: `content/short-001-wildlife-video-storytelling.md`; metadata template: `content/short-001-metadata.example.json`.
- Short 002: `content/short-002-plan-wildlife-documentary.md`; metadata template: `content/short-002-metadata.example.json`.

Metadata templates intentionally keep rights and compliance review false. They must remain blocked until real media is rendered, reviewed, and rights/compliance are independently checked.

## Channel isolation

Only SonicVhibez is authorized. Its channel ID remains unverified until checked through the authorized YouTube API. Do not use `UCSlkuPfHH78oGC1o418HV4w`; that ID was found on a Metricool brand labelled Nature Frontiers and must not be assumed to belong to SonicVhibez. Nature Frontiers is excluded from this project.

## Required production gates

1. A complete, readable MP4 exists and matches the queue item.
2. Narration, visuals, music, and fonts have retained, human-verified usage-rights evidence.
3. Metadata passes `npm run check -- content/next-short.json`.
4. The exact destination is approved in `config/products.json`; the currently approved Selar URL is `https://selar.com/0u19v8u99l`.
5. The authenticated YouTube channel ID and title are verified as SonicVhibez.
6. The uploader sets visibility to private; public publishing and public scheduling remain disabled.
7. The returned video ID, privacy status, timestamp, and artifact checksum are retained as a receipt.
8. Uncertain upload outcomes must be reconciled in YouTube Studio/API before retrying; do not blindly retry.

## Secrets and configuration

Never commit or print API keys, OAuth refresh tokens, client secrets, or access tokens. Store them only in GitHub Actions secrets or environment variables. Required uploader variables currently include `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, and `SONICVHIBEZ_CHANNEL_ID`. Never request secret values in chat.

## Rights, campaigns, and disclosure

The configured campaign is Selar-only. Do not add Safari affiliate destinations until the owner provides and verifies exact URLs. Keep the two campaign types isolated, including destination and disclosure. A typography-led review render is not a wildlife documentary and must not be represented as one. Never mark rights or human-review flags as approved without real evidence and authorized human review.

## Installation and commands

Prerequisites: Node.js 20+, npm, Python 3.12 for narration helpers, and FFmpeg/ffprobe for media rendering and validation.

```sh
npm install --ignore-scripts
npm test
npm run validate:schedule
npm run check:captions
npm run readiness
```

There is currently no committed npm lockfile, so `npm ci` is not yet reproducible. Do not claim deterministic dependency installation until a lockfile is added and tested.

For a private upload, first complete every rights and editorial gate, configure the secrets securely, inspect the metadata and artifact, and use the manual private-upload workflow. The upload is a real external action; keep operator confirmation explicit. No public-visibility option is authorized.

## Backup and recovery

Preserve the Git repository and downloaded workflow artifacts. Keep original media, caption files, metadata, manifests, rights evidence, and sanitized receipts together under stable queue-item identifiers. Before retrying a failed/uncertain upload, inspect the remote channel for an existing video ID. The current implementation still needs a durable job ledger and robust remote-success/local-failure reconciliation before it can be described as fully recoverable.

## Known blockers

- No verified rights-cleared wildlife footage or human approvals have been supplied.
- No independently verified SonicVhibez OAuth identity or private-upload receipt is evidenced.
- No dashboard-backed persistent job/approval store is currently verified.
- Full test suite and media pipeline execution were blocked in the current development environment; consult `docs/TEST_BASELINE_AND_REGRESSION_REPORT.md`.
- Public publishing remains disabled.
