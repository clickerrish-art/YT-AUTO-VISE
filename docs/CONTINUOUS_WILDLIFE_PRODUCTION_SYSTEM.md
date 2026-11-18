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

## Primary AI video-generation engine: WanGP on Kaggle

**Selected primary engine:** [WanGP](https://github.com/deepbeepmeep/WanGP), run in a user-started Kaggle GPU notebook session. GitHub Actions remains the queue, orchestration, validation and evidence layer; it is not the video-generation GPU.

- **Kaggle adapter candidate:** [Square-Zero-Labs/Wan2GP-on-Kaggle](https://github.com/Square-Zero-Labs/Wan2GP-on-Kaggle). Its notebook is Apache-2.0, uses Kaggle's installed CUDA/PyTorch stack, places model caches in `/kaggle/temp`, and places generated outputs in `/kaggle/working/Wan2GP-outputs`.
- **Preferred first model/profile:** Wan 2.2 TextImage2Video 5B FastWan at 480p, subject to actual availability in the selected WanGP build and the model's own licence. Start with short test shots; do not assume a 6–10 minute video can be generated in one pass.
- **Storage:** model weights and caches are temporary Kaggle session data; generated outputs must be saved as a Kaggle notebook output/version or another owner-approved durable store before the session ends. Do not download large model weights to the owner's PC.
- **Session operation:** the notebook must be started by the owner when GPU access is available. Kaggle free GPU quota/session limits mean this is repeatable batch production, not a permanently running or guaranteed unattended GPU service.
- **Pinning and supply-chain rule:** do not run a mutable `main` clone or `git pull` as a production dependency. Before production use, pin the WanGP source to an inspected commit, record the commit and dependency environment in each job record, and review notebook changes. Do not run third-party notebook cells blindly.
- **Notebook safety note:** the alternative `kayas881/WanGP-Kaggle` notebook was inspected but is not the selected production bootstrap: it installs a separately pinned PyTorch/CUDA stack, patches upstream source with `sed`, and deletes its output directory during launch. Do not use it unchanged.
- **Licensing:** the WanGP software licence does not grant rights to every model, LoRA, reference image, dataset or generated subject. Check and retain the exact model/checkpoint and LoRA licence for commercial YouTube use before generation is approved. Record the WanGP version, model ID, model licence URL, LoRAs, prompt, seed and output SHA-256.
- **Visual standard:** photorealistic wildlife only. Reject cartoon, plastic-looking, anatomically implausible, morphing or physically impossible animal behaviour. Generated scenes must not be represented as genuine documentary footage of a real event. Use the applicable YouTube altered/synthetic-content disclosure.
- **Voice:** narration remains a separate stage. The target remains a natural, realistic male Australian-English voice; do not assume a voice model or service is commercially cleared merely because it is free.
- **Brand and release:** SonicVhibez only for YouTube. Generated video is a draft asset, not a publishable video. Human full-playback review, factual review, rights review, captions, thumbnail and hash-bound approval remain mandatory. Publishing stays disabled until the separate authorization gate passes.

### Required production stages

1. Research the animal, behaviour, location and claims; retain primary-source URLs.
2. Prepare a shot-by-shot generation brief grounded in the research. Clearly label fictional/composite scenes and never imply an AI-generated encounter is genuine wildlife footage.
3. Start the approved WanGP Kaggle notebook, confirm GPU and internet access, record the source commit and model/checkpoint licence, and generate short shots in a controlled batch.
4. Inspect every generated shot for anatomy, species traits, natural movement, scene continuity, watermarks, visual artefacts and misleading behaviour. Reject poor outputs rather than hiding defects with editing.
5. Record prompt, negative prompt, seed, model/checkpoint, LoRA, settings, runtime, Kaggle session reference, output filename and SHA-256 for every accepted generated clip.
6. Write a fact-checked script and shot-to-claim map. Narration must not claim that generated footage depicts a real recorded event, location or animal.
7. Generate narration only from a voice with documented commercial-use permission. Australian-English male voice is the required profile; do not silently substitute another accent. If no suitable no-cost voice is cleared, hold the job for owner input.
8. Edit the approved generated shots with FFmpeg/Remotion. No still-image slideshow, fake animal animation presented as documentary footage, or stock footage misrepresented as original AI-generated wildlife.
9. Run technical checks (ffprobe, full decode, audio presence/levels, caption sync, aspect ratio, duration), then visual and factual quality review against the complete rendered file.
10. Produce a review package containing MP4, script, SRT, thumbnail, generation manifest, model/LoRA licences, source map, hashes, QA report and disclosures.
11. Require explicit human approval bound to the exact final file hashes before any scheduling.
12. Schedule only after approval. Publishing remains separately gated by brand, channel, credential and one-shot authorization controls.

## Cost and infrastructure policy

- Paid APIs, hosted GPU generation, paid runners, paid TTS and paid storage are disabled unless the owner explicitly approves a specific cost.
- GitHub Actions standard-runner free quota is finite. Actions may prepare prompts and validate metadata, but must not be treated as a video GPU.
- Kaggle free GPU is the primary generation runtime, but it is quota/session-bound. No always-on or guaranteed unattended generation is claimed.
- Do not store large source packages, model weights or rendered videos in Git history. Keep model caches in Kaggle temporary storage and persist only approved outputs and evidence to a durable, owner-approved destination.
- No local model installation is assumed; the owner has stated the PC has insufficient storage.
- Free stock/archive footage can support documentary editing, but does not satisfy a request for newly AI-generated photorealistic footage. Do not conflate the two.

## Fail-closed rules

- Missing model/checkpoint licence, voice permission, asset/generation provenance, claim source, output hash, human review or exact-file approval means HOLD.
- A technical render pass is not a visual-quality pass.
- No automatic scheduling or publishing is enabled by this workflow.
- Never retry an uncertain upload blindly.
- Keep SonicVhibez YouTube and Nature Frontiers Meta destinations separate.

## Current implementation status

- Weekly NOAA source-candidate intake: implemented in GitHub Actions.
- **Primary generation engine selected:** WanGP on Kaggle.
- Kaggle notebook adapter identified and source inspected; it is not yet pinned, installed in the user's Kaggle account, or test-generated against a wildlife prompt.
- Secure project-owned notebook bootstrap, pinned WanGP commit, Kaggle output persistence, and machine-readable generation-artifact intake remain to be implemented and verified.
- Automated final video rendering from accepted generated shots: not yet verified.
- Commercially cleared Australian-English male narration: not established.
- Rights review and human approval: remain required.
- Continuous end-to-end production and automatic scheduling: not established.

The system must report each stage separately. It must not report 100% completion until a complete real video has been rendered, independently inspected, rights-cleared and approved.
