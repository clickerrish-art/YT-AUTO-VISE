# Operations and production gates

## Current scope

This repository currently validates a proposed Short's metadata. It does not generate a video, synthesize narration, upload to YouTube, schedule posts, or replenish a queue.

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
