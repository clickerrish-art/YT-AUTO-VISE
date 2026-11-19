# WanGP on Kaggle — SonicVhibez runbook

## Project-owned notebook

Open [notebooks/sonicvhibez_wangp_kaggle.ipynb](../notebooks/sonicvhibez_wangp_kaggle.ipynb) in GitHub, then in Kaggle choose **New Notebook → Import from GitHub** and paste the notebook's GitHub URL. In Kaggle settings enable Internet and select GPU. Run the cells in order.

The notebook:
- checks GPU and internet access;
- clones official WanGP and checks out immutable commit `f4cfc1259215577be9a2ee280c41efbedfb4459a`;
- places model weights and caches in Kaggle temporary storage;
- verifies the exact quantized 5B checkpoint and VAE by SHA-256;
- creates a custom WanGP model profile with no LoRAs;
- launches the WanGP UI for a single five-second test shot;
- writes a video + provenance manifest package.

The Gradio share URL is temporary and public while the cell is running. Do not enter secrets, credentials or private material.

## Pinned source and test assets

- WanGP source: `deepbeepmeep/WanGP` commit `f4cfc1259215577be9a2ee280c41efbedfb4459a`.
- WanGP licence: Community License 2.0, copied from that exact source checkout.
- Wan 2.2 5B checkpoint: `DeepBeepMeep/Wan2.2/wan2.2_text2video_5B_quanto_mbf16_int8.safetensors`, revision `16bb1ad02fe4ca8319b67261397ea4eeaa4896c4`, SHA-256 `463076f7625d8c7fc8912011cf5d02db7f0a8ae666e1758cd835e5a8517ef0e0`.
- Wan 2.2 VAE: `DeepBeepMeep/Wan2.2/Wan2.2_VAE.safetensors`, revision `4cb9607e5532be42f37a05778acfc47aee7701e1`, SHA-256 `bb6e5e515ca6af2cb2b7bbf8bfc790b8c306832c34e0a76193507c3739ebf54a`.
- No FastWan LoRA or other LoRA is used.

## Rights determination — commercial use remains on HOLD

The official `Wan-AI/Wan2.2-TI2V-5B` model card declares Apache-2.0. The WanGP-compatible checkpoint and VAE are mirrored as single-file safetensors under `DeepBeepMeep/Wan2.2`. The mirror metadata inspected for this task does not independently declare a licence or a clear source/provenance statement for these converted artifacts. The base-model licence is therefore evidence about the upstream model, not conclusive confirmation of the exact mirror file's provenance and rights. The notebook records this as `HOLD_UNVERIFIED_MIRROR_DERIVATIVE_PROVENANCE`. Obtain written confirmation or a verifiable source mapping before commercial use.

WanGP's own Community License 2.0 permits internal business use and use of outputs, subject to its restrictions. It requires reasonable credit when an output is directly sold/licensed, and restricts selling or providing paid hosted/API access to WanGP itself without a separate written licence. It expressly does not relicense third-party models, LoRAs, datasets or other components.

## Import generated test into project evidence

Download `sonicvhibez-wangp-test-package.zip` from Kaggle notebook outputs and extract the two files:
- `wildlife-test.mp4`
- `generation-manifest.json`

From a project checkout, run:

```bash
python scripts/import_wangp_kaggle_output.py --video /path/to/wildlife-test.mp4 --manifest /path/to/generation-manifest.json --job-id sonicvhibez-wangp-test-001
```

The importer checks pinned source/model/VAE hashes, video SHA-256, ffprobe metadata and full-file FFmpeg decode. It stores the MP4 under `media/jobs/<job-id>/generated-shot.mp4` and writes `content/generation-evidence/<job-id>.json`. It refuses to overwrite existing evidence.

This is a source-clip evidence record only. It does not update the long-form render manifest, mark a video complete, approve rights, or enable scheduling/publishing. The imported clip remains `GENERATED_TEST_UNREVIEWED` and commercial use remains on HOLD.

Run the importer unit tests with:

```bash
python -m unittest discover -s tests -p 'test_*.py' -v
```

## Acceptance criteria

A real test is complete only after the Kaggle notebook produces an MP4, its manifest matches the actual output and seed, the importer passes, and a human watches the full clip and records realism/anatomy/continuity findings. If the Kaggle GPU is unavailable or the model runs out of memory, report BLOCKED; do not substitute a still-image montage or fabricate a render.
