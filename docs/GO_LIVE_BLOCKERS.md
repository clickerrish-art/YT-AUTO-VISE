# SonicVhibez launch blockers and acceptance criteria

This file distinguishes repository implementation from external setup. A green code test is not proof of a private YouTube upload or unattended publishing.

## Implemented components

- Scheduled draft generation on Tuesday and Friday at 15:00 UTC (17:00 SAST while South Africa is UTC+2).
- Queue preflight and one approved Selar destination.
- Narration, SRT, metadata, text-led vertical MP4 draft, and thumbnail generation.
- Draft artifact retention for review.
- Review metadata helper that keeps footage-rights and compliance gates false.
- Strict private uploader and artifact-to-metadata identity checks.
- Validation workflow and release checklist.

## Launch acceptance checklist

- [ ] Latest Validate SonicVhibez automation workflow run on main is green.
- [ ] The actual generated MP4 is watched end-to-end; voice, facts, spelling, and captions are checked.
- [ ] The text-led draft is edited into the intended finished wildlife video with separately verified footage, image, music, and sound rights.
- [ ] Thumbnail accurately represents the final video and its source/license is recorded.
- [ ] The description contains a clear affiliate/promotional disclosure where appropriate and only the approved URL: https://selar.com/0u19v8u99l
- [ ] The correct SonicVhibez channel ID is verified from YouTube Studio/API, not guessed.
- [ ] GitHub Actions repository secrets are set by the owner: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN, SONICVHIBEZ_CHANNEL_ID. Never put secret values in repository files, commits, or chat.
- [ ] Reviewed metadata matches the selected artifact's channel, queueItemId, title, and productUrl; visibility remains private.
- [ ] rightsConfirmed and complianceReviewed are set true only after the relevant checks are genuinely completed.
- [ ] The private-upload workflow completes; receipt and private video are verified in YouTube Studio.
- [ ] Scheduled generation succeeds on subsequent scheduled runs and artifacts are available.
- [ ] Public publishing stays disabled until separately authorized and explicitly implemented/reviewed.

## Known limitations

- Generated video is a text-led review draft, not a completed wildlife documentary with licensed B-roll.
- Scheduled generation is not the same as scheduled publishing.
- The workflow cannot verify media rights or perform editorial fact-checking automatically.
- If required secrets or channel access are absent, upload must fail closed.
- Do not claim full hands-free operation until the checklist has been evidenced end-to-end.
