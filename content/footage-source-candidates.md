# SonicVhibez footage acquisition queue — candidates and conditional owner authorizations

**Current status (10 November 2026):** The NOAA Spiny Lobsters in California package has **owner-authorized conditional use** for SonicVhibez, limited to the exact source SHA recorded in `content/asset-candidates/noaa-spiny-lobsters-california.json`, with the exact credit **“NOAA’s Office of National Marine Sanctuaries”** and complete removal of source audio. This is not a production clearance or final-video approval. The asset remains outside the approved production register; `rightsEvidenceReviewed`, `humanApproved`, `rightsConfirmed` and `complianceReviewed` remain false. Publishing remains disabled. The leatherback package and all other candidates remain unapproved.

## Preferred acquisition source

NOAA Fisheries' official B-roll package library:
https://videos.fisheries.noaa.gov/category/videos/b-roll-packages---all

The library states that B-roll packages are public domain and may be downloaded when NOAA Fisheries is credited. It also states that each package contains an opening slate with specific attribution information, including clips supplied by other organizations and applicable permit numbers. Therefore, inspect the actual package slate and credits before extracting or using any clip. Do not extract clips from ordinary narrative videos; NOAA warns those may contain third-party copyrighted clips that cannot be reused separately.

## First candidates to inspect

These are relevant candidates for short establishing shots, not approved assets:

1. **B-Roll: Spiny Lobsters in California** — https://videos.fisheries.noaa.gov/detail/videos/b-roll-packages---all/video/6313425635112/b-roll%3A-spiny-lobsters-in-california?autoStart=true
   - Potential use: marine establishing shots and examples of varied shot sizes.
   - Required before use: open original package; inspect slate and all clip credits; save package/credit evidence; confirm chosen shots match narration.
2. **B-Roll: Relocation of Hawaiian Monk Seal RQ58 ("Koalani")** — https://videos.fisheries.noaa.gov/detail/videos/b-roll-packages---all/video/6311406347112/b-roll%3A-relocation-of-hawaiian-monk-seal-rq58-koalani?autoStart=true
   - Potential use: seal footage as a specific example only if narration identifies it accurately; otherwise avoid implying the footage depicts a different animal or event.
   - Required before use: inspect opening slate, partner credits, and any permit/use notes.
3. **B-Roll: Leatherback Turtle Tagging** — https://videos.fisheries.noaa.gov/detail/videos/b-roll-packages---all/video/6329928828112/b-roll%3A-leatherback-turtle-tagging?autoStart=true
   - Potential use: turtle/research footage for a shot-planning demonstration.
   - Required before use: verify credits and context; do not narrate a different species or imply unrelated behaviour.
4. **B-Roll: Southern Resident Killer Whale (J35) with Her Dead Calf (J61) and a Healthy Newborn Calf (J62) on January 1, 2025** — find through the official library above.
   - Potential use: generally **not recommended** for a light creator-workflow video because the subject includes a dead calf and could be distressing or emotionally manipulative. Do not use as decorative footage.

The detail URLs above are candidates; if a link redirects, search the exact package title from the official library. The page-level reuse statement is not a substitute for the package's actual slate and credits.

## Acquisition evidence — 9 November 2026

A review-only acquisition run downloaded two official NOAA Fisheries B-roll package files. Latest repeat workflow run: `42594716333`; artifact: `sonicvhibez-noaa-broll-candidates` (artifact ID `13662524700`, 266,154,848 bytes). Its two MP4 SHA-256 values match the earlier acquisition run `42589870532` (artifact ID `13660453540`), confirming reproducible downloads. The latest artifact is retained in GitHub Actions; these source files are not committed to the repository.

| Candidate | Technical inspection | SHA-256 | Opening-slate attribution observed |
|---|---|---|---|
| B-Roll: Spiny Lobsters in California | MP4, H.264/AAC, 1280×720, 380.810 s, 100,223,664 bytes | `1aefd2c3aae7569aa80b89f6fe9d15ac3cf8c7b27651fde4e2fede74a35a92eb` | “NOAA’s Office of National Marine Sanctuaries” |
| B-Roll: Leatherback Turtle Tagging | MP4, H.264/AAC, 1280×720, 628.724 s, 166,534,262 bytes | `a2b0252cd5fdda4bfe09d5953df55fbebf748c8bba3b0139f2f8ebc755b2f568` | “NOAA Fisheries” |

The official NOAA Fisheries B-roll library states that B-roll packages are public domain for download and use with NOAA Fisheries credit, and that each package’s opening slate provides specific attribution, possible third-party contributions and applicable permit numbers. The package pages identify the lobster footage as California spiny lobster (*Panulirus interruptus*) and the turtle footage as NOAA researchers tagging leatherback turtles in the Gulf of Mexico near Destin, Florida. Official policy: https://videos.fisheries.noaa.gov/category/videos/b-roll-packages---all

**Review status: DOWNLOADED; OPENING SLATES AND TECHNICAL HEADERS INSPECTED; NOT APPROVED FOR PRODUCTION.** The full packages have not yet received exhaustive clip-by-clip visual/credit review, the source audio has not been cleared, and no owner/human rights approval has been recorded. Keep `rightsEvidenceReviewed=false`, `humanApproved=false`, and `rightsConfirmed=false`. Do not extract, render, or publish these clips until the remaining review is complete.


## Independent visual sample review — 9 November 2026

The latest retained acquisition artifact was downloaded for a second, independent review:
- GitHub Actions artifact: `sonicvhibez-noaa-broll-candidates`, run `42594716333`, artifact ID `13662524700` (266,763,096 bytes as downloaded).
- Both MP4 SHA-256 values were recomputed locally and match the values above exactly.
- `ffprobe` independently confirmed H.264 video, AAC audio, 1280×720 resolution, and durations matching the opening slates (lobster 380.810 s / 6:20.8; turtle 628.724 s / 10:28.7).
- A 12-frame visual contact sheet was sampled across each full package, including the opening slate. This is a content overview only, not exhaustive clip-by-clip review.

### Observations and attribution

- **Spiny lobster package:** the opening slate explicitly requests credit to **“NOAA’s Office of National Marine Sanctuaries”** and states the footage is courtesy of NOAA. The sampled frames show underwater rocky reef habitat, fish and California spiny lobsters. Use the exact requested credit; do not replace it with a generic NOAA Fisheries credit.
- **Leatherback turtle package:** the opening slate explicitly requests credit to **“NOAA Fisheries.”** Additional sampled in-video title cards describe NOAA Fisheries researchers capturing a leatherback turtle near Destin, Florida, using a breakaway hoop net, then assessing the animal and applying a satellite tag. Sampled footage shows boats and researchers conducting the operation. Narration must retain this specific context and must not imply a different species, location, or behaviour.


### Embedded attribution-card inspection — leatherback package

A timeline scan identified seven full black interstitial cards at approximately 5–10 s, 108–113 s, 135–140 s, 262–267 s, 489–494 s, 526–531 s and 577–582 s. The cards were extracted and their text checked. Each requests **“NOAA Fisheries”** credit. The final three cards additionally identify **Videographer: Lisa Belskis**. Two further narrative cards were checked around 160 s and 317 s; they describe the capture near Destin, Florida, the breakaway hoop-net method, health assessment and satellite-tagging, and also request NOAA Fisheries credit.

The lobster package's sampled species card identifies **California spiny lobster (*Panulirus interruptus*)** and repeats the requested credit to **NOAA's Office of National Marine Sanctuaries**.

This improves attribution discovery but does not establish that no other contributor, rights restriction, or audio condition exists elsewhere in either package. The complete clip/credit inventory remains open.

### What this review does not establish

- The 12-frame sample does not inspect every shot, transition, contributor, or embedded credit card.
- AAC source audio remains uncleared and must be removed unless its separate reuse rights are documented.
- The package-level NOAA public-domain statement and visible slates do not establish that every individual shot is free of third-party restrictions.
- No asset-register entries, rights-confirmed flags, human approvals, render manifests, or production permissions were created by this review.

**Disposition: retain both as source candidates for further review only.** The next clearance step is a full timeline/credit inspection and shot-level selection, followed by the actual asset-register evidence and human approval. No clip may be rendered or published on the basis of this sample review alone.

## Download and clearance checklist

For each selected package:

1. Download only from the official source page using its offered download link.
2. Keep an untouched copy of the downloaded package, if permitted, and capture the source page, date accessed, opening slate, and full credit/attribution text in private project evidence.
3. Check whether any footage, logos, people, music, or third-party content has extra restrictions. Remove source audio unless its reuse rights are explicit; use the separately generated narration and properly licensed/original music only.
4. Add each used clip to `content/asset-register.json` with unique ID, actual filename, exact source URL, the actual terms, date checked, required attribution, third-party restriction review, evidence file path, and human approval status.
5. Run `node scripts/validate-asset-register.mjs content/asset-register.json`. The validator checks record completeness and evidence-file existence; it does not decide legal permission.
6. Match each clip to the shotlist and narration, then render only after the complete asset register and separate review gates are genuinely satisfied.

## Current stop conditions

- Do not invent evidence paths or copy the example values into a production register.
- Do not mark `rightsEvidenceReviewed`, `humanApproved`, `rightsConfirmed`, or `complianceReviewed` true until the actual evidence and final edit have been inspected by a human.
- Do not claim this repository contains licensed wildlife footage or a completed wildlife video yet.
- Keep public publishing disabled.

## Full timeline review — NOAA Spiny Lobsters package — 10 November 2026

The retained acquisition artifact was downloaded and the complete 380.810-second source was inspected at one-second intervals (381 decoded frames, 1280×720, H.264 video, AAC 48 kHz stereo). Four contact sheets cover the complete one-second sample.

- Source package: **B-Roll: Spiny Lobsters in California's Channel Islands**.
- Official source page: https://videos.fisheries.noaa.gov/detail/videos/b-roll-packages---all/video/6313425635112/b-roll%3A-spiny-lobsters-in-california
- NOAA's B-roll library states that B-roll packages are public domain and may be downloaded and used with credit; the package's own slate supplies the specific attribution. This is distinct from NOAA narrative videos, which may contain third-party licensed clips that cannot be extracted.
- Exact opening-slate instruction: **“Please credit ‘NOAA’s Office of National Marine Sanctuaries’.”** The slate says all footage is courtesy of the National Oceanic and Atmospheric Administration.
- SHA-256 recomputed from the downloaded source: `1aefd2c3aae7569aa80b89f6fe9d15ac3cf8c7b27651fde4e2fede74a35a92eb`.
- Artifact: workflow run `42594716333`, artifact ID `13662524700`, file `noaa-spiny-lobsters-california.download`.
- The one-second visual review shows underwater reef habitat, fish, and California spiny lobsters. It shows no people, animal handling, baiting, staged interaction, or graphic animal harm. No additional attribution cards or third-party credits were observed in the one-second timeline sample after the opening slate.
- The source contains AAC audio. It is **not cleared for reuse**; remove the entire source audio track from any derivative. Do not use the NOAA seal/logo as SonicVhibez branding, and do not imply NOAA endorses SonicVhibez or the Selar product.

**Disposition: best current candidate for a marine-wildlife creator-education edit, but still not approved for production.** The one-second visual sample is not a frame-by-frame legal clearance and cannot rule out sub-second material or restrictions not visible in the video. A human must review the original package/source terms and final edit, approve the exact clip selection and credit, and sign off the finished video. Until then, do not add it as an approved asset, set `humanApproved`, `rightsConfirmed` or `complianceReviewed` true, or render/publish it as production content. The leatherback tagging package remains a separate, context-sensitive candidate and is not cleared by this review.



## Owner authorization — NOAA Spiny Lobsters package — 10 November 2026

**Owner decision: APPROVED FOR CONDITIONAL SONICVHIBEZ USE**, recorded in the ChatGPT conversation on 10 November 2026. The owner explicitly approved using this specific NOAA Spiny Lobsters in California's Channel Islands B-roll package, provided the exact package credit is displayed and the entire source audio track is removed.

Approved source identity (must match before any derivative is created):
- Official source page: https://videos.fisheries.noaa.gov/detail/videos/b-roll-packages---all/video/6313425635112/b-roll%3A-spiny-lobsters-in-california
- Acquired source filename: `noaa-spiny-lobsters-california.download`
- SHA-256: `1aefd2c3aae7569aa80b89f6fe9d15ac3cf8c7b27651fde4e2fede74a35a92eb`
- Exact required credit: **“NOAA’s Office of National Marine Sanctuaries”**.
- Source audio: **REMOVE COMPLETELY**; no source AAC audio may be used.
- NOAA seals/logos may not be used as SonicVhibez branding, and the edit must not imply NOAA endorsement of SonicVhibez or the Selar product.

**Scope and remaining controls:** this owner authorization applies only to the identified spiny-lobster package and the conditions above. It is not a blanket approval for the leatherback package, other NOAA material, music, third-party assets, or any other source. It does not itself establish legal clearance of every individual shot, substitute for inspection of selected in/out points and final edit, or authorize publication. The one-second full-timeline visual sample remains a sampling method, not frame-by-frame review. Before production use, inspect each selected shot and its transitions/credits, retain the exact source and credit evidence, verify the final edit contains the exact credit and no source audio, and complete the separate final-video human/compliance review. Until those checks are complete, keep the asset out of the approved production register and keep `rightsConfirmed=false`, `complianceReviewed=false`, and publishing disabled.
