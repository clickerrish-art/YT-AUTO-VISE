# SonicVhibez Shorts Automation

Isolated project for a compliant, twice-weekly YouTube Shorts workflow for the SonicVhibez channel only.

## Status

Scaffold initialization only. Queue replenishment and metadata/caption checks run in GitHub Actions. A local FFmpeg renderer is available for a reviewed footage file, narration audio, and SRT captions. Automated asset sourcing/TTS, channel authorization, scheduling, and end-to-end media tests are not yet implemented or verified.

## Safety requirements

- Never publish to the Nature Frontiers channel.
- Use only approved product URLs supplied by the project owner.
- Keep posts in draft/review until metadata, media rights, destination channel, and scheduling are verified.
- Never claim SEO scores or performance guarantees that have not been measured.
- Keep API tokens and credentials in GitHub Actions secrets; never commit secrets.

## Branch status

The `main` branch is available. Repository settings still report a malformed default-branch name, so maintainers must select `main` as the default branch in GitHub repository Settings before treating this repository as production-ready.
