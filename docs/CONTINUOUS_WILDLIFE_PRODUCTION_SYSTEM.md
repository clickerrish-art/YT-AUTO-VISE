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

**Primary engine:** project-owned [Kaggle notebook](../notebooks/sonicvhibez_wangp_kaggle.ipynb) running the official [WanGP repository](https://github.com/deepbeepmeep/WanGP) at immutable commit `f4cfc1259215577be9a2ee280c41efbedfb4459a` (v20.00). The commit is unsigned; the notebook pins the exact SHA and never pulls mutable `main`.

- **Notebook-owned setup:** clones the pinned source, keeps model weights/cache in Kaggle `/kaggle/temp`, writes MP4 outputs under `/kaggle/working/WanGP-outputs`, and records the Python environment.
- **Test model:** Wan 2.2 TI2V 5B quantized single-file checkpoint `DeepBeepMeep/Wan2.2/wan2.2_text2video_5B_quanto_mbf16_int8.safetensors`, pinned to revision `16bb1ad02fe4ca8319b67261397ea4eeaa4896c4`, SHA-256 `463076f7625d8c7fc8912011cf5d02db7f0a8ae666e1758cd835e5a8517ef0e0`. VAE is pinned to revision `4cb9607e5532be42f37a05778acfc47aee7701e1`, SHA-256 `bb6e5e515ca6af2cb2b7bbf8bfc790b8c306832c34e0a76193507c3739ebf54a`. No FastWan or other LoRA is applied.
- **Model licence determination:** official `Wan-AI/Wan2.2-TI2V-5B` model card declares Apache-2.0. The WanGP-compatible single-file checkpoint and converted VAE are mirrored under `DeepBeepMeep/Wan2.2`; the inspected mirror metadata does not independently declare a licence or a complete provenance statement for those converted files. Therefore the exact mirror checkpoint's commercial-use rights are **HOLD pending written provenance/rights confirmation**. The upstream base-model licence alone is not treated as proof that the mirror artifacts are licensed. Notebook and importer fail closed with `HOLD_UNVERIFIED_MIRROR_DERIVATIVE_PROVENANCE`.
- **WanGP software licence:** Community License 2.0. It permits internal business use and use of outputs subject to its terms; direct output sales require reasonable credit, while selling/hosting WanGP itself or paid API/SaaS access requires separate written commercial permission. Third-party model, LoRA, dataset and package terms remain separate.
- **Evidence intake:** `scripts/import_wangp_kaggle_output.py` validates pinned revisions, checkpoint/VAE hashes, video SHA-256, ffprobe metadata and full-file FFmpeg decode. It stores generated clips in `media/jobs/<job-id>/generated-shot.mp4` and writes `content/generation-evidence/<job-id>.json`. Import status is generated/unreviewed; it never approves rights or publishing and does not mark a long-form render complete.
- **Session operation:** the owner must start Kaggle when free GPU quota is available. The notebook's temporary Gradio share URL is public while active; do not enter credentials or private information. Kaggle free sessions are repeatable batch compute, not permanently running or guaranteed unattended GPU service.
- **Visual standard:** photorealistic wildlife only. Reject cartoon, plastic-looking, anatomically implausible, morphing or physically impossible animal behaviour. Generated scenes must not be represented as genuine documentary footage of a real event. Review YouTube altered/synthetic-content disclosure requirements.
- **Voice:** narration remains a separate stage. Target remains a natural, realistic male Australian-English voice; no voice is commercially cleared merely because it is free.
- **Brand and release:** SonicVhibez only for YouTube. Human full-playback review, factual review, rights review, captions, thumbnail and hash-bound approval remain mandatory. Publishing stays disabled until the separate authorization gate passes.

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
- **Project-owned WanGP Kaggle notebook:** committed; pinned source and model files are defined and hash-checked by the notebook. Not yet executed in the owner's Kaggle account.
- **MP4 evidence importer:** committed with Python unit tests; it has not yet received a real Kaggle output package.
- **Real wildlife test generation:** NOT_TESTED — no Kaggle GPU session has been started from this conversation, and no MP4 exists to inspect.
- **Exact mirror checkpoint commercial rights:** HOLD — upstream Wan-AI model card declares Apache-2.0, but the exact WanGP-compatible mirror checkpoint/converted VAE provenance and licence are not independently confirmed. Obtain written confirmation before commercial use.
- Automated final long-form video rendering from accepted generated shots: not yet verified.
- Commercially cleared Australian-English male narration: not established.
- Rights review and human approval: remain required.
- Continuous end-to-end production and automatic scheduling: not established.

The system must report each stage separately. It must not report 100% completion until a complete real video has been rendered, independently inspected, rights-cleared and approved.
