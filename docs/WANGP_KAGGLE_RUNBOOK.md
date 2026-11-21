# WanGP on Kaggle — DISABLED / HISTORICAL ONLY

**Current status — 2026-11-21: DISABLED. DO NOT RUN.**

This runbook is retained only as an audit record. Do not import this notebook into Kaggle, enable Internet, select a GPU, install model weights, launch WanGP, generate a wildlife clip, or import generated output into the repository.

## Why it is disabled

- Current owner production policy requires genuine original creator-captured wildlife media.
- AI-generated wildlife visuals are prohibited as substitutes for original wildlife footage or photographs.
- The exact WanGP-compatible checkpoint/VAE mirror provenance and rights were not verified; the upstream base-model licence does not establish the rights or provenance of converted mirror files.
- No GPU generation is authorized. The zero-cost constraint forbids paid GPU or hosted generation.
- The notebook's code cells now raise a policy-blocking error before GPU/model setup.
- `config/video-generation.json` marks generation disabled and non-primary.
- `scripts/import_wangp_kaggle_output.py` reads the current policy and rejects generated wildlife output before inspecting/copying a video.
- The saved Comfy Cloud Arctic/polar-bear text-to-video demo is also disqualified and has not been run.

## Historical technical record

The former experiment used the WanGP source commit `f4cfc1259215577be9a2ee280c41efbedfb4459a`, a Wan2.2-TI2V-5B upstream model, and converted checkpoint/VAE mirrors under `DeepBeepMeep/Wan2.2`. The exact mirror derivative provenance was unresolved. The historical plan was a five-second test shot, not a production documentary.

No generation was run and no production output was created. Any existing model setup, source code, license notes, Kaggle notebook outputs or model configuration are historical research only.

## Current production path

Acquire genuine original creator-captured wildlife footage directly from the creator or rights holder. Verify creator identity, source provenance, chain of custody, exact original bytes and SHA-256, commercial-use rights, technical quality, complete visual review and exact-hash approval. Only then proceed to source-led editing.

See `docs/CONTINUOUS_WILDLIFE_PRODUCTION_SYSTEM.md` for the current production policy and sequential gates.
