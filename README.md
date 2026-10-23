# SonicVhibez Shorts Automation

Isolated project for a review-gated SonicVhibez content workflow targeting two long-form videos and one Short per week (Tuesday, Thursday, Saturday; Africa/Johannesburg).

## Status

Queue replenishment, free narration generation, and metadata/caption checks run in GitHub Actions. The long-form narration workflow is scheduled for Tuesday and Saturday at 15:00 UTC (17:00 South Africa time); the Short narration workflow is scheduled for Thursday at 15:00 UTC. The narration workflow renders a text-led 1080×1920 review MP4 and a thumbnail from draft content, then validates output before packaging it as an artifact. This is not wildlife-footage production: visuals are typography-based until footage rights are verified. Private upload and public publishing are not enabled by these generation workflows, and channel authorization has not been verified.

## Safety requirements

- Never publish to the Nature Frontiers channel.
- Use only approved product URLs supplied by the project owner.
- Keep posts in draft/review until metadata, media rights, destination channel, and scheduling are verified.
- Never claim SEO scores or performance guarantees that have not been measured.
- Keep API tokens and credentials in GitHub Actions secrets; never commit secrets.

## Branch status

The repository default branch is main. Scheduled workflows target the intended default branch. This configuration does not mean video production or publishing is live.

## Current production gate

Run npm run readiness for a read-only blocker report. A HOLD is expected until all of the following are supplied and independently checked:

1. content/render-manifest.json referencing real footage, narration audio, and SRT captions.
2. Evidence for footage and narration rights; human-confirmed rights and compliance flags.
3. content/next-short.json updated only after human review, including the verified SonicVhibez channel ID.
4. A rendered media/next-short.mp4 that passes npm run preflight:media -- media/next-short.mp4 content/next-short.json.
5. YouTube OAuth credentials and the verified SonicVhibez channel ID configured as repository secrets/environment variables.

The readiness report is diagnostic only; it does not validate that license evidence is genuine, judge finished-video quality, or grant permission to publish. The uploader is private-only. Public publishing and unattended public scheduling remain disabled. Never point credentials at Nature Frontiers.

## Guarded private-upload workflow

A manual workflow named Upload reviewed Short privately to SonicVhibez is available under GitHub Actions. It cannot publish publicly: the uploader hard-checks the authenticated channel name and ID and sets YouTube visibility to private.

Before running it, add these four secrets in the repository's Settings → Secrets and variables → Actions → New repository secret:

- YOUTUBE_CLIENT_ID
- YOUTUBE_CLIENT_SECRET
- YOUTUBE_REFRESH_TOKEN
- SONICVHIBEZ_CHANNEL_ID

Use credentials from the YouTube/Google Cloud OAuth client authorized for the SonicVhibez YouTube account. Verify the channel ID from that account before saving it. Never paste secrets into chat, issues, code, or workflow logs. If the OAuth consent screen is in testing mode, refresh-token lifetime can be limited; use the correct production configuration and least-privilege YouTube scope.

Then commit fully reviewed metadata JSON and a rights-cleared MP4 at the paths entered when dispatching the workflow. The metadata checker must pass, including rightsConfirmed=true, complianceReviewed=true, visibility=private, the approved product URL, and the verified channel ID. Media preflight must also pass. The workflow stops if secrets are missing, metadata is held, media is invalid, or the authenticated channel does not match. On success, download the sonicvhibez-private-upload-receipt artifact and verify the private video in YouTube Studio.

This is not unattended public publishing. It is a guarded, manual private upload so the account owner can inspect the result. No public posting or public scheduler is enabled.

## Media rights review

Use docs/WILDLIFE_MEDIA_RIGHTS_CHECKLIST.md before integrating real wildlife footage. It documents preferred government B-roll sources, attribution requirements, embedded-music restrictions, evidence to retain, and stop conditions. The workflow must never mark rights or compliance as verified automatically.

## Free narration generation

The Generate free narration audio GitHub Actions workflow creates MP3 narration artifacts for Short 001 and Short 002 using the US English en-US-GuyNeural voice through the community edge-tts client. It needs no paid API key and has no upload or publishing permission. It runs on Thursday at 15:00 UTC (17:00 South Africa time), when the narration master or generator changes, and can also be run manually from Actions to select one Short or both. The separate long-form narration workflow runs Tuesday and Saturday at 15:00 UTC. Download the sonicvhibez-short-draft-package artifact from the completed Short workflow run; artifacts expire after 30 days.

Generated audio is a draft: listen to it, check pronunciation and timing, and align captions to the actual read. The Short workflow selects a queued topic and packages a narration MP3, draft script, SRT caption draft, and JSON metadata. It then attempts to render a text-led 1080×1920 review MP4 and a 1280×720 thumbnail, validates the video stream, duration, and safety metadata, and includes them in the downloadable artifact. The output remains HOLD_FOR_FOOTAGE_AND_REVIEW: it contains no licensed wildlife footage, its captions have estimated timings, and the thumbnail and final visual quality require review. It is not ready for upload until media rights, factual/compliance review, and the destination channel are verified. Voice service availability and terms may change; this workflow does not guarantee a specific age impression or exact duration.
