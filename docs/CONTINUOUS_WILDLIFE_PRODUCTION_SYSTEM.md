# Continuous Wildlife Production System

**Current operating policy — 2026-11-21**

This system is source-led and zero-cost by default. It requires genuine original creator-captured wildlife media. It must not use AI-generated wildlife visuals, generic stock footage, public-domain B-roll packages, or stock-library clips as substitutes for original wildlife media. A stock platform licence does not override this production policy.

## Non-negotiable operating rules

- Original creator-captured wildlife video and photographs only. Verify the creator, original source, chain of custody, capture context, exact original file bytes, and commercial-use permission.
- Do not describe stock, archival, generated, staged, composite or illustrative material as original documentary footage.
- Do not generate wildlife scenes with WanGP, Comfy Cloud, or another text-to-video/image model for production.
- No paid subscriptions, paid APIs, hosted GPU usage, storage charges, paid TTS or infrastructure spend without explicit owner authorization. No GPU generation is currently authorized.
- The owner-approved narrator is Roderic — Authoritative & Refined (HeyGen voice ID `b5c5b28db1ea408abc7d851202983bdb`) only. HeyGen has denied zero-cost commercial rights for existing and future Free-plan Roderic output. Keep it internal-only. No alternative narrator or paid upgrade is authorized. Narration is therefore a hard production blocker until written rights change or the owner explicitly changes the narrator constraint.
- SonicVhibez is the only YouTube brand. Nature Frontiers is Facebook/Instagram only; never route Nature Frontiers content to YouTube.
- Publishing remains disabled by default. No public, unattended, scheduled, or private upload without the exact required owner authorization and all prior release gates.
- A test pass, a filename, a stock listing, a source URL, a plan, or a partial contact sheet is not production evidence.

## Media eligibility

### Eligible source package

A media package can enter production review only when it contains:

1. Original creator-captured MP4/photo files supplied by the creator or rights holder, not a stock-library download.
2. Creator identity and contact/source record, original capture/source provenance, and a chain-of-custody note.
3. Explicit written commercial-use permission covering the intended platforms, editing/derivatives, territory, duration and attribution requirements.
4. Untouched source file(s) with SHA-256, byte size, filename, capture metadata where available, and a protected immutable original.
5. Technical probe and full decode for video; resolution, frame rate, duration, codecs, focus, exposure, image quality and audio checked.
6. Full human visual review of every complete clip/photo and a written record of what is actually shown. Do not infer species, behaviour, location or event from filenames or listing text.
7. Rights, factual and editorial review, followed by owner approval bound to exact file hashes and permitted usage.

Missing any item means HOLD. Do not silently substitute Pexels, Pixabay, Wikimedia Commons, NOAA B-roll, Internet Archive, or generated content.

### Current quarantine

- Five imported SonicVhibez Canva/Pexels items: excluded and audit-only.
- Four Short 001 Pexels clips: reference-only and excluded.
- Ninety-two Nature Frontiers Pexels/Pixabay listings: reference-only and excluded; zero local files, zero approved items, zero scheduled items and zero published items.
- Pexels and Wikimedia Commons crocodile leads: reference-only and excluded.
- NOAA B-roll packages and Internet Archive discovery results: reference-only and excluded.
- Comfy Cloud Arctic/polar-bear text-to-video demo: disqualified; no original-footage input.
- WanGP Kaggle notebook and importer: disabled under the original-capture policy; no generation has been run.

## Production workflow — execute sequentially

### 1. Original media intake

- Receive the creator's original files and rights/provenance evidence.
- Preserve untouched originals; compute SHA-256 before any editing.
- Verify media integrity, technical quality, scene coverage, species, visible behaviour and context.
- Register each asset as a candidate with its source, creator, hash, rights and review state.
- Reject stock, AI-generated, ambiguous, altered, corrupted, low-quality or rights-unclear assets.
- Do not proceed to edit until every selected clip is eligible and hash-bound.

### 2. Research and editorial preparation

- Research species, behaviour, ecology, conservation and safety claims from primary or authoritative sources.
- Maintain a claim map with citations and clear limits on what each source establishes.
- Build a shot-by-shot plan that maps each approved original clip to the narration beat and claim it supports.
- Avoid invented events, sensationalized behaviour, misleading locations, unsupported detection distances or claims that imply a specific recorded encounter when the footage does not show one.
- Obtain independent qualified zoological review for the complete script and scene map.

### 3. Narration clearance

- Use only Roderic while the owner’s Roderic-only instruction remains in force.
- Existing/future HeyGen Free-plan Roderic output is not commercially eligible under HeyGen’s written denial.
- Do not generate or use Free-plan Roderic in public, branded, monetized or commercial content.
- Do not use Piper, Banjo, Norman, Edge TTS, or any other voice without explicit owner approval.
- Keep the job blocked until the owner obtains a lawful zero-cost commercial-use path for Roderic or explicitly changes the voice requirement.

### 4. Editing and rendering

Only after media, script, independent review and narration rights pass:

- Long-form target: 6–10 minutes, 16:9.
- Short target: 50–60 seconds, 9:16.
- Use genuine original wildlife footage only. Do not fill runtime by looping clips or substituting generic stock.
- Preserve original source files; record every derivative and source in/out point.
- Use brand-correct logo/watermark, typography, colour, disclosure and sound treatment.
- No unwanted AI-generation watermark or review-only text may remain on final exports.

### 5. Captions, audio and visual quality

- Generate captions from the cleared final narration and synchronize against the final audio waveform.
- Review pronunciation, intelligibility, loudness, clipping, channel layout, silence, transitions and ending.
- Watch and listen to the entire rendered file, not only a contact sheet or midpoint frame.
- Verify scene-to-narration alignment, pacing, readability, accessibility, continuity and scientific accuracy.
- Run ffprobe, full-file decode, aspect ratio, duration, codec and caption-sync checks.
- Any change to final media invalidates hash-bound review and approval.

### 6. Packaging and approval

- Prepare title, description, thumbnail, tags, captions, disclosure and platform metadata.
- Review thumbnail for accuracy and mobile readability; never imply a real animal encounter not shown in original footage.
- Record exact SHA-256 for final video, thumbnail, captions and metadata.
- Require rights clearance, scientific/editorial review, complete human playback and owner approval against those exact hashes.
- Keep release manifests fail-closed until every gate is evidenced.

### 7. Publishing and verification

- Verify the authenticated YouTube destination is SonicVhibez only.
- Reconcile complete paginated remote upload/publication history, including private, unlisted and public videos and uncertain upload attempts.
- Never retry an uncertain upload blindly.
- Private-only upload requires one-shot authorization bound to the exact job, media, metadata, thumbnail, captions, rights, human review and channel.
- Verify remote video ID, destination channel and final privacy after upload.
- Public release requires separate explicit authorization.
- Nature Frontiers remains Facebook/Instagram only and requires its own account mapping, signed human approval, rights, campaign and disclosure gates.

### 8. Scheduling and operations

- Preserve the sequence `long_form → long_form → short`.
- Use Africa/Johannesburg for calendar-day rules and require at least 72 actual hours between actual publication timestamps.
- Do not schedule more than the mathematically feasible cadence. Three 72-hour gaps require 216 hours; the previous three-per-week expectation conflicts with the 72-hour minimum and needs an owner-approved feasible cadence.
- Verify lease, heartbeat, cancellation, idempotency, retry backoff, dead-letter, restart recovery and durable publication history before enabling autonomous workers.
- Keep emergency stop active and publishing disabled until full production acceptance.

## Current blockers — 2026-11-21

| Gate | Status | Evidence / missing input |
|---|---|---|
| Original wildlife media | BLOCKED | No admissible original creator-captured wildlife package with provenance, hashes and commercial rights is present. |
| Commercial narration | BLOCKED | HeyGen denied zero-cost commercial rights for Roderic Free-plan outputs; no alternative narrator is approved. |
| Long-form 001 | BLOCKED | Original footage and commercially eligible narration missing; no final render, captions, thumbnail or exact-hash approval. |
| Short 001 | BLOCKED | Pexels clips are reference-only; Roderic audio is internal-only; no final original-media edit or approval. |
| Scientific sign-off | PARTIAL | Script research and primary-paper limitations are documented; independent qualified review of complete script and final scene map remains outstanding. |
| Metricool brand separation | PARTIAL / BLOCKED | Repository configuration is corrected; live provider mapping confirmation and legacy brand 7545638 access remain unresolved. |
| YouTube history | NOT_TESTED | Fresh complete authenticated inventory and owner attestation of manual/local/third-party uploads are required before any upload. |
| Scheduling | BLOCKED | Cadence conflict, complete history and full worker/recovery proof remain open. |
| Durable archive | BLOCKED | No verified permanent archive and restore route; previous Cloudflare R2 enablement returned error 10042. |
| Production publisher | BLOCKED | No verified operational production publisher Worker/runner state. |
| Software acceptance | PARTIAL / STALE | Earlier exact-SHA test results are historical; no full current-head regression or live production acceptance has been run after current policy changes. |

## Required owner/provider inputs

- Original creator-captured wildlife files, creator identity, provenance and explicit commercial-use rights.
- A written HeyGen reversal granting zero-cost commercial rights for Roderic, or the owner's explicit change to the Roderic-only rule.
- Metricool access/export for legacy Nature Frontiers brand 7545638 and written confirmation of current brand 8094526 mapping.
- Fresh owner attestation of manual/local/third-party YouTube upload attempts since 2026-11-18 and fresh authenticated paginated YouTube history.
- Owner/admin authorization and access for a genuinely zero-cost durable archive and production publisher infrastructure.
- Independent qualified zoological review and final exact-hash human approval.

## Historical AI-generation material

The WanGP Kaggle notebook, WanGP importer, Comfy Cloud text-to-video workflow and associated model/checkpoint research are retained as historical technical records only. Their code paths are disabled. Do not run GPU sessions, download model weights, generate wildlife scenes or import generated shots under the current owner media policy. The model mirror checkpoint/VAE also had unresolved commercial provenance.

**Completion rule:** this project is not 100% complete until original media, narration rights, final outputs, all reviews, publishing verification, durable recovery, software acceptance and release gates have each been independently completed and evidenced. Until then the correct state is HOLD, not READY.
