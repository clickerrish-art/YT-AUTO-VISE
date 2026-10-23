# SonicVhibez footage acquisition queue — candidates, not yet cleared

**Status: SOURCE CANDIDATES ONLY. No footage has been downloaded, inspected, or approved by this file.** Do not change any rights or release flags based on this list.

## Preferred acquisition source

NOAA Fisheries' official B-roll package library:
https://videos.fisheries.noaa.gov/category/videos/b-roll-packages---all

The library states that B-roll packages are public domain and may be downloaded when NOAA Fisheries is credited. It also states that each package contains an opening slate with specific attribution information, including clips supplied by other organizations and applicable permit numbers. Therefore, inspect the actual package slate and credits before extracting or using any clip. Do not extract clips from ordinary narrative videos; NOAA warns those may contain third-party copyrighted clips that cannot be reused separately.

## First candidates to inspect

These are relevant candidates for short establishing shots, not approved assets:

1. **B-Roll: Spiny Lobsters in California** — https://videos.fisheries.noaa.gov/detail/video/6276580939001/b-roll:-spiny-lobsters-in-california
   - Potential use: marine establishing shots and examples of varied shot sizes.
   - Required before use: open original package; inspect slate and all clip credits; save package/credit evidence; confirm chosen shots match narration.
2. **B-Roll: Relocation of Hawaiian Monk Seal RQ58 ("Koalani")** — https://videos.fisheries.noaa.gov/detail/video/6276581219001/b-roll:-relocation-of-hawaiian-monk-seal-rq58-(koalani)
   - Potential use: seal footage as a specific example only if narration identifies it accurately; otherwise avoid implying the footage depicts a different animal or event.
   - Required before use: inspect opening slate, partner credits, and any permit/use notes.
3. **B-Roll: Leatherback Turtle Tagging** — https://videos.fisheries.noaa.gov/detail/video/6276581051001/b-roll:-leatherback-turtle-tagging
   - Potential use: turtle/research footage for a shot-planning demonstration.
   - Required before use: verify credits and context; do not narrate a different species or imply unrelated behaviour.
4. **B-Roll: Southern Resident Killer Whale (J35) with Her Dead Calf (J61) and a Healthy Newborn Calf (J62) on January 1, 2025** — find through the official library above.
   - Potential use: generally **not recommended** for a light creator-workflow video because the subject includes a dead calf and could be distressing or emotionally manipulative. Do not use as decorative footage.

The detail URLs above are candidates; if a link redirects, search the exact package title from the official library. The page-level reuse statement is not a substitute for the package's actual slate and credits.

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
