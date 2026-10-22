# SonicVhibez Shorts Automation

Isolated project for a compliant, twice-weekly YouTube Shorts workflow for the SonicVhibez channel only.

## Status

Queue replenishment, free narration generation, and metadata/caption checks run in GitHub Actions. The narration workflow now renders a text-led 1080×1920 review MP4 and a thumbnail from the draft video, then validates the output before packaging it as an artifact. This is not wildlife-footage production: the visuals are typography-based until footage rights are verified. Private upload and public publishing are not enabled by this workflow, and channel authorization has not been verified.

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

## Free narration generation

The `Generate free narration audio` GitHub Actions workflow creates MP3 narration artifacts for Short 001 and Short 002 using the US English `en-US-GuyNeural` voice through the community `edge-tts` client. It needs no paid API key and has no upload or publishing permission. It runs automatically every Tuesday and Friday at 15:00 UTC (17:00 South Africa time), when the narration master or generator changes, and can also be run manually from Actions to select one Short or both. Download the `sonicvhibez-short-draft-package` artifact from the completed run; artifacts expire after 30 days. The generated audio is a draft: listen to it, check pronunciation and timing, and align captions to the actual read. On each scheduled run it selects a queued topic and packages a narration MP3, draft script, estimated-timing SRT, and JSON metadata. It then attempts to render a text-led 1080×1920 review MP4 and a 1280×720 thumbnail, validates the video stream, duration, and safety metadata, and includes them in the downloadable artifact. The output remains `HOLD_FOR_FOOTAGE_AND_REVIEW`: it contains no licensed wildlife footage, its captions have estimated timings, and the thumbnail and final visual quality require review. It is not ready for upload until media rights, factual/compliance review, and the destination channel are verified. Voice service availability and terms may change; this workflow does not guarantee a specific age impression or exact duration.
