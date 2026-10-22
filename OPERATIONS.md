# Operations and production gates

## Current scope

This repository validates proposed Short metadata and stores scripts/production briefs. It does not generate a video, synthesize narration, upload to YouTube, schedule posts, or replenish a queue. HeyGen has reported that the workspace has used its free video-generation allowance for this month; no paid generation has been initiated.

## Current drafts

- Short 001: `content/short-001-wildlife-video-storytelling.md`; metadata template: `content/short-001-metadata.example.json`.
- Short 002: `content/short-002-plan-wildlife-documentary.md`; metadata template: `content/short-002-metadata.example.json`.

Both metadata templates intentionally keep `rightsConfirmed` and `complianceReviewed` false and have no media path. They must fail the production checker until a real video is generated, reviewed, and its rights/compliance verified.

## Channel isolation

The intended target is SonicVhibez, channel ID `UCSlkuPfHH78oGC1o418HV4w`. Nature Frontiers is explicitly out of scope. Before enabling any future uploader, the uploader must retrieve the authenticated YouTube channel identity and compare its channel ID to the configured target. If identity cannot be verified, stop. Do not rely on a brand label alone.

## Required production gates

1. A reviewed video file exists and is playable.
2. The narration, visuals, music, and fonts have documented usage rights.
3. Title, description, tags, and product URL pass `npm run check -- content/next-short.json`.
4. The exact product URL is present in `config/products.json` and has been manually verified.
5. The authenticated YouTube account is confirmed to be the SonicVhibez channel.
6. Upload begins as private. Public visibility requires a separate, explicit approval step until the end-to-end flow has been proven.
7. The returned YouTube video ID and privacy status are stored in a run log; failed uploads are not silently marked successful.
8. A scheduling job must not create a second upload if a retry finds an existing video ID.

## Secrets and configuration

Never commit API keys, OAuth refresh tokens, client secrets, or access tokens. Store them in a secrets manager or GitHub Actions secrets. The channel ID may be stored as a non-secret variable, but must still be checked against the authenticated YouTube API response.

## Cadence

The intended cadence is two Shorts per week. This repository does not currently implement a scheduler or automatic queue replenishment. Do not describe cadence as active until a scheduler, media pipeline, uploader, and recovery path are deployed and tested.

## Content integrity

Do not claim a guaranteed SEO score, guaranteed reach, or guaranteed sales. Avoid misleading income claims. Product promotions must accurately describe the linked product and use only owner-provided URLs. Do not upload unlicensed footage or cloned voices without the necessary rights and consent.

## Private upload implementation

`scripts/upload-private.mjs` is a gated first-stage uploader. It requires a reviewed metadata JSON and an MP4 path, runs the content checker, verifies the OAuth-authenticated YouTube channel ID matches `SONICVHIBEZ_CHANNEL_ID`, and only submits a **private** upload. It never makes a video public or schedules a public release.

Required GitHub Actions secrets/environment variables for a future manually approved run:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`
- `SONICVHIBEZ_CHANNEL_ID` (channel ID is not secret, but must match authenticated identity)

Do not add a publish workflow until the OAuth credentials are configured, the exact channel is verified, a reviewed media file is available, and a real private-upload test is approved. Upload logs may contain video IDs; review privacy and storage before committing logs. No credentials belong in the repository.


## Media preflight (local, no paid service)

Install FFmpeg (including `ffprobe`) on the computer where the reviewed MP4 is stored. Then run:

```sh
node scripts/preflight-media.mjs path/to/short.mp4 path/to/reviewed-metadata.json
```

The preflight fails closed unless the metadata targets SonicVhibez, starts as private, and records completed human rights/compliance review. It checks that the file is 50–60 seconds, vertical, and has an audio stream. It does not prove licensing, consent, truthfulness, caption synchronization, or visual quality, and it does not upload or publish anything.
