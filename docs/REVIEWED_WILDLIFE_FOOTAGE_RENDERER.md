# Reviewed wildlife-footage renderer

A separate renderer now exists at `scripts/render-reviewed-wildlife-footage.py`. It does not change the scheduled draft workflow or upload anything. It is an opt-in production path for when you have actual footage files and have checked each clip's rights.

## Prepare the footage folder

Create `media/approved-footage/` locally, put your permitted video files in that folder, and create `media/approved-footage/manifest.json` in this format:

```json
{
  "clips": [
    {
      "file": "clip-01.mp4",
      "sourceUrl": "https://official-source.example/asset-page",
      "licenseBasis": "Specific license or written permission reviewed; note any attribution/usage conditions",
      "attribution": "Required creator/agency credit, or 'No attribution required' only if the terms confirm it",
      "rightsReviewed": true
    },
    {
      "file": "clip-02.mp4",
      "sourceUrl": "https://official-source.example/another-asset",
      "licenseBasis": "Specific license or written permission reviewed",
      "attribution": "Required credit",
      "rightsReviewed": true
    }
  ]
}
```

Replace every example value with the real asset information. The `rightsReviewed` flag is a human attestation, not a license check performed by code. Do not set it to true until you have read the exact asset's terms, checked third-party material, and recorded attribution requirements. Keep source/license evidence alongside your project records.

## Render and verify

After the queue-generation workflow has created exactly one current narration package, run:

```bash
python scripts/render-reviewed-wildlife-footage.py
```

Requires FFmpeg and Mutagen (already installed in the GitHub generation workflow environment). The output is `media/rendered-drafts/*-FOOTAGE-REVIEW.mp4`, with a separate evidence JSON. Each clip is placed into an equal segment of the narration. The script deliberately leaves metadata on HOLD, with `rightsConfirmed=false` and `complianceReviewed=false`. Captions still need timing correction and the complete video needs a human review.

This is a rendering component, not a fully unattended stock-footage sourcing service. It does not download arbitrary footage, infer licenses, confirm factual claims, upload to YouTube, or enable public posting.
