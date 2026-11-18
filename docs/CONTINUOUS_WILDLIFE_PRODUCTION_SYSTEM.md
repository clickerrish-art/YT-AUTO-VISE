# Continuous Wildlife Production System

## Operating contract

This system is footage-led and zero-cost by default. It must never describe an unrendered plan, still-image montage, downloaded source package, or review cut as a finished wildlife video.

### Automated intake

- GitHub Actions workflow: `.github/workflows/acquire-noaa-broll-candidates.yml`
- Runs weekly on Tuesday at 04:23 UTC and can also be run manually.
- Downloads selected official NOAA Fisheries B-roll packages into a temporary review artifact.
- Stores source URLs, response headers, file identification and SHA-256 evidence.
- Retains the review artifact for 14 days.
- This workflow is candidate intake only. A successful download is not rights clearance or production approval.

### Required production stages

1. Research the animal, behaviour, location and claims; retain primary-source URLs.
2. Acquire genuine moving footage from a documented source. Prefer public-domain/open-licensed archives. Record exact source URL, creator, licence text, attribution, restrictions, download timestamp and SHA-256 for every asset.
3. Inspect the complete clip and all embedded credits. Reject unclear provenance, third-party footage, watermarks, mismatched species/behaviour, or source audio without explicit clearance.
4. Write a fact-checked script and shot-to-claim map. Narration must not claim that footage depicts a behaviour/location/event it does not show.
5. Generate narration only from a voice with documented commercial-use permission. Australian-English male voice is a required voice profile; do not silently substitute another accent. If no suitable no-cost voice is cleared, hold the job for owner input.
6. Edit with FFmpeg/Remotion from real moving footage. No still-image slideshow, fake animal animation, or stock footage misrepresented as original AI-generated wildlife.
7. Run technical checks (ffprobe, full decode, audio presence/levels, caption sync, aspect ratio, duration), then visual and factual quality review against the complete rendered file.
8. Produce a review package containing MP4, script, SRT, thumbnail, asset manifest, licences, source map, hashes, QA report and disclosures.
9. Require explicit human approval bound to the exact final file hashes before any scheduling.
10. Schedule only after approval. Publishing remains separately gated by brand, channel, credential and one-shot authorization controls.

## Cost and infrastructure policy

- Paid APIs, hosted GPU generation, paid runners, paid TTS and paid storage are disabled unless the owner explicitly approves a specific cost.
- GitHub Actions standard-runner free quota is finite. Scheduled intake must remain short and quota-aware; do not use Actions as a video GPU.
- Do not store large source packages or rendered videos in Git history. Use short-retention Actions artifacts for review candidates and an approved durable media store only when its cost and access policy are known.
- No local model installation is assumed; the owner has stated the PC has insufficient storage.
- Free stock/archive footage can support documentary editing, but does not satisfy a request for newly AI-generated photorealistic footage. Do not conflate the two.

## Fail-closed rules

- Missing licence, voice permission, attribution, claim source, asset hash, human review or exact-file approval means HOLD.
- A technical render pass is not a visual-quality pass.
- No automatic scheduling or publishing is enabled by this workflow.
- Never retry an uncertain upload blindly.
- Keep SonicVhibez YouTube and Nature Frontiers Meta destinations separate.

## Current implementation status

- Weekly NOAA source-candidate intake: implemented in GitHub Actions.
- Automated final video rendering from the downloaded review artifact: not implemented.
- Commercially cleared Australian-English male narration: not established.
- Rights review and human approval: remain required.
- Continuous end-to-end production and automatic scheduling: not established.

The system must report each stage separately. It must not report 100% completion until a complete real video has been rendered, independently inspected, rights-cleared and approved.
