# Episode 002 — v7 caption/audio alignment defect (HOLD)

A fresh contact-sheet inspection of the actual v7 MP4 found a critical defect: several burned-in caption snippets do not match the adjacent workflow graphic and appear to be fragments from unrelated narration (examples include “publications recognized conservation”, “license or permission date accessed and”, and “final file in YouTube Studio but it”). The contact sheet cannot prove the exact audio transcript, but it is sufficient to fail caption QA.

## Decision
**Reject v7 as an upload candidate.** The technical decode and video format pass, but editorial/caption acceptance fails. Do not upload this cut.

## Required correction
1. Rebuild captions from the exact Episode 2 narration audio, not from a different episode's SRT or an older draft.
2. Align cues to the narration and use sensible phrase boundaries, correct spelling, and readable line lengths.
3. Generate a new preview contact sheet from the rebuilt cut.
4. Validate complete audio duration, caption end time, full-file decode, resolution/frame rate and audio stream.
5. Watch the entire new export with sound and muted before considering private upload.

## Verified v7 technical properties
- Duration: 411.967 seconds.
- Video: H.264, 1920×1080, 30 fps.
- Audio: AAC, 24 kHz mono.
- SHA-256: `73988b5f3c5f5f5ed7f65cd3faa31790ebed5870a6c638ec3256e1c705bbbc38`.
- FFmpeg full-file decode: passed.

Passing file integrity does not make a video editorially correct. Public publishing remains disabled; no upload is authorized by this report.
