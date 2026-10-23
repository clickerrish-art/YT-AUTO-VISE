# Episode 002 — v12 scene timing review

## Verified export
- File: `SonicVhibez-episode-2-caption-safe-review-v12.mp4`
- Duration: 407.567 seconds
- 1920×1080, 30 fps H.264; AAC stereo, 48 kHz
- Size: 17,964,021 bytes
- SHA-256: `d1c98edd2716ef3b9c7c98f26bd7e417731821e73227c93a53a2a08a7d5487ce`
- Full-file FFmpeg decode: passed.

## Preview finding
The subtitle band is separated from the static card footer, but the sample frames show the scene cards are not synchronized to the narration's semantic sections. For example, the viewer-question card remains on screen while the narration has already moved to footage/legal-access checks; other cards similarly overlap narration from adjacent sections. This is a real editorial defect, not a technical encoding failure.

## Required correction
Rebuild the scene timeline using the actual narration and caption cue boundaries. Use the narration paragraph boundaries from the approved script as candidate chapter points, then listen around each boundary and adjust by ear. Keep captions in the lower safe zone. Render and inspect frames immediately before and after each scene transition, plus a full-video sample.

## Status
HOLD. The v12 export is technically valid but not editorially approved. Do not upload or publish it.