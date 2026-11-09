# SonicVhibez footage acquisition queue — candidates, not yet cleared

**Status: TWO SOURCE CANDIDATE PACKAGES DOWNLOADED; OPENING SLATES AND TECHNICAL METADATA INSPECTED; NONE APPROVED FOR PRODUCTION.** Do not change any rights or release flags based on this list.

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
