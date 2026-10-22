# SonicVhibez Shorts Automation

Isolated project for a compliant, twice-weekly YouTube Shorts workflow for the SonicVhibez channel only.

## Status

Queue replenishment and metadata/caption checks run in GitHub Actions. A local FFmpeg renderer and a gated private-only uploader are implemented, but automated asset sourcing/TTS, verified channel authorization, and end-to-end media tests are not yet completed or verified.

## Safety requirements

- Never publish to the Nature Frontiers channel.
- Use only approved product URLs supplied by the project owner.
- Keep posts in draft/review until metadata, media rights, destination channel, and scheduling are verified.
- Never claim SEO scores or performance guarantees that have not been measured.
- Keep API tokens and credentials in GitHub Actions secrets; never commit secrets.

## Branch status

The repository default branch has been corrected to `main` and verified through the GitHub API. Scheduled workflows now target the intended default branch. This configuration fix does not mean video production or publishing is live.

## Current production gate

Run `npm run readiness` for a read-only blocker report. A `HOLD` is expected until all of the following are supplied and independently checked:

1. `content/render-manifest.json` referencing real footage, narration audio, and the SRT captions.
2. Evidence for footage and narration rights; human-confirmed rights and compliance flags.
3. `content/next-short.json` updated only after a human review, including the verified SonicVhibez channel ID.
4. A rendered `media/next-short.mp4` that passes `npm run preflight:media -- media/next-short.mp4 content/next-short.json`.
5. YouTube OAuth credentials and the verified SonicVhibez channel ID configured as repository secrets/environment variables.

The readiness report is diagnostic only; it does not validate that license evidence is genuine, judge the finished video's quality, or grant permission to publish. The uploader is private-only. Public publishing and unattended public scheduling remain disabled. Never point credentials at Nature Frontiers.
