# SonicVhibez: remaining setup and go-live checklist

This repository currently prepares review drafts. It is deliberately not an unattended public-publishing system. Keep public publishing disabled until the channel, media rights, factual accuracy, and private-upload path are verified.

## What is already implemented

- A queue of 14 topic ideas restricted to the approved Selar product URL: https://selar.com/0u19v8u99l
- Tuesday/Friday scheduled draft generation at 17:00 South Africa time (15:00 UTC)
- English narration using Edge TTS voice `en-US-GuyNeural`
- Captions, metadata, a vertical review video, and a thumbnail in a GitHub Actions artifact
- Queue-integrity checks and a separate readiness diagnostic
- A manual private-upload workflow that refuses to proceed unless the expected channel identity and credentials are configured

## Required actions in GitHub (never paste secrets into chat)

1. Open **Settings → Secrets and variables → Actions** in this repository.
2. Add repository Actions secrets with these exact names:
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `YOUTUBE_REFRESH_TOKEN`
   - `SONICVHIBEZ_CHANNEL_ID`
3. Obtain OAuth credentials and a refresh token through a Google Cloud project you control, with the YouTube Data API enabled. Use the OAuth client and refresh token belonging to the Google account authorized to manage SonicVhibez. Never put credentials in source files or artifacts.
4. Set `SONICVHIBEZ_CHANNEL_ID` only after checking the channel ID in YouTube Studio / the channel's official account details. The workflow is intended to reject a mismatch; do not guess the ID.
5. Open **Actions → Check SonicVhibez production readiness → Run workflow**. Inspect the `sonicvhibez-readiness-report` artifact. A missing secret or failed readiness check means STOP; do not try to bypass it.
6. Open **Actions → Build free narration review artifact → Run workflow**, choose `both`, and inspect the completed run. Download `sonicvhibez-short-draft-package`. A successful run should contain narration, script, captions, metadata, the vertical review draft and thumbnail.
7. Review the complete draft. Confirm every visual asset's license and attribution, verify wildlife facts against reputable sources, check that captions match narration, and check that product promotion is clear and not misleading. The current default video is text-led; it does not claim to contain licensed wildlife footage.
8. Only after all checks pass, use the manual upload workflow to upload **privately**. Confirm the uploaded video's channel in YouTube Studio. Do not change visibility to public until a human has approved the final upload.

## Schedule and limitations

The scheduled job generates review artifacts only; it does not publish videos, and GitHub Actions is not guaranteed to run at an exact minute. The intended cadence is Tuesday and Friday at 17:00 SAST. This workflow does not guarantee SEO scores, views, sales, or monetization. Do not enable automatic public posting as part of this setup.

## Current blockers before unattended publishing

- Google/YouTube OAuth secrets and the exact SonicVhibez channel ID must be configured and validated by the account owner.
- Rights-cleared wildlife footage has not been integrated into the generated video; the current output is a text-led draft with a thumbnail.
- A human must review the factual claims, media rights, captions, title, description and thumbnail.
- A successful private upload and channel identity check must be confirmed before any decision about public release.

## Free footage research starting points

- NOAA Fisheries B-roll packages: https://videos.fisheries.noaa.gov/category/videos/b-roll-packages---all
- U.S. Fish & Wildlife Service B-roll library: https://www.fws.gov/library/collections/b-roll-videos

These are starting points, not blanket permission for every clip. Verify the individual asset's license, third-party content, attribution, and any restrictions before use.
