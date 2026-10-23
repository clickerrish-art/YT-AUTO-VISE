# Episode 002 — v12 preview re-check and timing correction

## What was rechecked
The current export was sampled at regular intervals after the caption-safe layout rebuild. Technical checks pass: 407.600 seconds, 1920×1080 H.264 at 30 fps, AAC stereo at 48 kHz, full-file FFmpeg decode passed. SHA-256: `09953e7fa000bf0140bfba07656a1d2c4599d7861c61ce1103c7a4818ac18c8a`.

## Editorial finding
The lower subtitle band is now clear of the static footer, but the sampled captions are not semantically synchronized to the scene cards. For example, a research card appears while the subtitle is about asking the audience question; an asset-rights card appears while the spoken words refer to research and sources. The current 11-card timeline (32, 41, 55, 55, 65, 49, 50, 39, 13, 5, 3.568 seconds) is therefore not suitable as the final narration-synced timeline.

## Correction approach
Use the SRT cue times to establish exact ranges for the narration's section transitions. Candidate boundaries from the script are: opening 0:00–0:32; audience question around 0:32; research/source record around 1:05; narration writing around 2:27; asset rights around 3:10; edit around 4:30; packaging around 5:25; final review around 6:00; paid resource/end card at the script's final section. These are candidates to validate against the spoken audio, not confirmed exact cut points.

## Release status
HOLD. A technical decode pass does not prove editorial alignment, caption transcription, asset rights, or platform readiness. No public upload or scheduled publishing is authorized.