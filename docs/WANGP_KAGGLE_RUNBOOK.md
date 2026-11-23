# WanGP on Kaggle — PERMITTED BY POLICY, EXECUTION GATED

**Current status — 2026-11-23: NOT AUTHORIZED TO RUN.**

SonicVhibez permits clearly disclosed, photorealistic AI wildlife reconstructions. This is separate from Nature Frontiers, which retains its original creator-captured media policy. The WanGP notebook and importer must enforce the SonicVhibez policy without treating AI as prohibited.

## Why generation remains disabled

- No zero-cost GPU backend has been independently verified as available and usable for this project. A visible but unselectable Kaggle accelerator is not evidence of availability.
- The exact WanGP-compatible checkpoint/VAE mirror derivative provenance and rights remain unresolved. The upstream base-model licence alone does not prove rights in the converted mirror files.
- `config/video-generation.json` explicitly permits AI reconstruction but keeps generation disabled, marks zero-cost backend verification false, keeps exact model-rights verification false, and leaves commercial-use approval false.
- Every notebook code cell checks an immutable, commit-pinned copy of the policy and fails closed unless all generation, zero-cost backend, and exact model-rights gates are explicitly verified.
- `scripts/import_wangp_kaggle_output.py` requires the same gates before inspecting or copying any generated MP4. Technical import remains distinct from human review and publishing approval.
- No GPU session, generation, paid service, or model download is authorized by this runbook.

## Historical technical record

The proposed experiment uses the WanGP source commit `f4cfc1259215577be9a2ee280c41efbedfb4459a`, a Wan2.2-TI2V-5B upstream model, and converted checkpoint/VAE mirrors under `DeepBeepMeep/Wan2.2`. The exact mirror derivative provenance was unresolved. The historical plan was a five-second test shot, not a production documentary.

No generation has been authorized under the current policy, and no production output has been created. Do not infer that pinned hashes or an upstream licence resolve the mirror checkpoint/VAE rights hold.

## Current production path

Once (and only once) the zero-cost backend and exact model/checkpoint/VAE rights are independently verified and the pinned policy is updated to authorize generation, a short internal test may be generated with the pinned no-LoRA profile. Every output must retain the exact generation receipt, source/model revisions, checkpoint/VAE hashes, prompt, negative prompt, seed, settings, Kaggle session reference, output hash, ffprobe report and full-decode result. Human visual, species/factual and synthetic-disclosure review remain mandatory. Generated output is an illustrative reconstruction, never authentic recorded wildlife footage. Paid GPU or hosted generation remains prohibited without explicit owner approval.

See `docs/CONTINUOUS_WILDLIFE_PRODUCTION_SYSTEM.md` for the current production policy and sequential gates.
