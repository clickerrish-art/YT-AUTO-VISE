# Internet Archive wildlife footage — SonicVhibez intake

## Purpose

Internet Archive is a secondary source-discovery library, not a source of automatically cleared production footage. This integration searches moving-image metadata and produces a review report. It does **not** download media, register assets, render videos, schedule posts or publish.

WanGP on Kaggle remains the primary engine for generating original wildlife shots. Internet Archive candidates may supplement a story only after separate source and rights review.

## Run discovery

Local:

```bash
python scripts/discover_internet_archive_assets.py --rows 30 --output artifacts/internet-archive-discovery.json
```

GitHub Actions: run **Internet Archive wildlife metadata discovery** manually, or let its weekly Wednesday schedule run. Download the resulting Actions artifact for review. The workflow uses read-only repository permissions.

## Rights triage

The report records the licence URL and rights text as supplied in the item metadata. Its triage is only a screening hint:

- CC0 / Public Domain Mark and CC BY / CC BY-SA may be candidates for commercial-use review.
- NonCommercial, NoDerivatives, sampling licences, all-rights-reserved statements and unknown terms are held.
- A claimed public-domain status must be checked against the actual work, uploader authority, jurisdiction, source materials and embedded content.

A licence label or uploader-entered metadata is not proof that the uploader owns all footage, music, narration, photographs or other included material. Read the item page and linked licence, inspect the entire source and its credits, and check third-party restrictions. Preserve dated screenshots or saved copies of the exact rights evidence.

## Required before any asset can enter the production register

1. Identify the exact item identifier, original item page, creator and source file.
2. Verify the uploader's authority and exact licence terms for commercial use and derivatives.
3. Inspect opening/closing slates, watermarks, embedded music, third-party clips, people, permits and other restrictions.
4. Download only after the source and intended use have been reviewed; record the exact file name, size and SHA-256.
5. Save the item page and licence evidence in the project's rights-evidence store.
6. Have a human review the footage and record approval against the exact media hash.
7. Enter it into `content/asset-register.json` only after all evidence exists; run `node scripts/validate-asset-register.mjs content/asset-register.json`.

Never infer rights from availability, a download button, the Archive's hosting, or a search result. Keep `rightsEvidenceReviewed`, `humanApproved` and production approval false until the actual review is complete. Do not use CC BY-NC for monetised SonicVhibez videos. Do not use CC BY-ND for edited footage.

## Safety and storage

Discovery is metadata-only. No video files are downloaded or stored in GitHub. Actions artifacts are short-lived review reports, not permanent production storage. Approved media must be stored in the project's designated media storage with immutable hashes and provenance records. Do not put large video files or credentials in Git history.

## Relationship to WanGP

WanGP/Kaggle is the primary generation engine for original photorealistic shots. Generated assets have their own model/checkpoint licence and provenance requirements. Internet Archive footage is separately licensed source material; the two rights tracks must never be conflated. Neither source can bypass full-video human review, factual review, synthetic-media disclosure review, the final render gates or publishing authorization.
