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
