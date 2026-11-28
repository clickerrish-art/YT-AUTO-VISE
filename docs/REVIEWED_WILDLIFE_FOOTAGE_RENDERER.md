# Original creator-captured wildlife-footage renderer

The renderer at `scripts/render-reviewed-wildlife-footage.py` accepts only genuine original creator-captured wildlife recordings. Pexels, Pixabay, other stock footage and AI-generated wildlife visuals are rejected as production substitutes. Stock candidate inventories may be retained for provenance research, but they cannot be passed to this renderer.

The renderer is a review-draft component only. It never marks output ready to publish, uploads, schedules or publishes.

## Prepare original footage

Create `media/approved-footage/` locally and place original camera files inside it. Create `media/approved-footage/manifest.json` with exact file hashes and capture provenance:

```json
{
  "clips": [
    {
      "sourceMethod": "ORIGINAL_RECORDING",
      "creatorCapturedOriginal": true,
      "creatorIdentity": "Actual camera operator / creator",
      "captureProvenance": "How and when the original camera recording was captured",
      "file": "clip-01.mp4",
      "sourceUrl": "Owner-controlled source record or original capture reference",
      "licenseBasis": "Creator-owned original recording; any depicted third-party permissions documented separately",
      "attribution": "Accurate creator credit",
      "originalSha256": "64-character SHA-256 of the exact original MP4",
      "rightsReviewed": false,
      "reviewOnly": true
    }
  ]
}
```

Replace every example with true source data. Never use placeholders as evidence. The capture-provenance and creator-identity fields must be supported by the original file and creator record. A SHA-256 proves file identity, not ownership or permissions. Third-party rights, location, people, property, trademarks, music, factual accuracy and human visual review remain separate checks.

## Render and verify

After a current narration package has been created and independently reviewed, run:

```bash
python scripts/render-reviewed-wildlife-footage.py
```

The output is written under `media/rendered-drafts/` with a separate evidence JSON. The renderer requires exactly one queued metadata JSON, a 50–60 second narration MP3, captions, original footage files and matching SHA-256 values. Incomplete rights or human review keeps the result on HOLD. It does not grant publication authorization.

Pexels/Pixabay source inventories and platform-license research are not substitutes for original camera-captured wildlife footage and cannot be selected in this renderer.
