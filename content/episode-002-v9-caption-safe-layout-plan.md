# Episode 002 — next visual pass plan (v9)

## Decision
The v8 MP4 passes technical decode, but remains a review draft. The contact sheet confirms that burned-in captions occupy the same lower-middle region as the card's process strip and compete with the card text. Scene changes also use approximate fixed time ranges rather than confirmed narration-beat boundaries.

## Required v9 changes
1. Rebuild the card layout with a dedicated caption-safe zone. Remove the decorative process strip and footer from the caption area, or move all static card text into the upper 65% of frame. Keep subtitles in a consistent lower safe zone with no collision.
2. Derive scene boundaries from the actual narration/caption timeline and the approved shotlist. Do not infer exact cut points from the written script alone.
3. Keep the paid resource disclosure as a distinct final segment; preserve the exact approved URL `https://selar.com/0u19v8u99l` and clearly disclose that it is paid.
4. Re-render with the exact narration file used by the cut and the matching caption source. Do not silently substitute a different narration or SRT.
5. Generate a fresh contact sheet at the start, every scene boundary, and end card. Inspect each sampled frame for caption/static-text collisions.
6. Re-run ffprobe checks, full-file decode, audio presence, duration, frame size, frame rate, and SHA-256.
7. Human-watch the complete export with sound and muted. Caption-to-audio transcription and asset rights require human verification.

## Release gate
**HOLD.** Passing FFmpeg decode is only a technical check. It is not proof of caption accuracy, visual relevance, rights clearance, or YouTube readiness. No public upload or scheduled publication is authorized by this report.
