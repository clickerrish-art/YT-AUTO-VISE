# Nature Frontiers media register

The canonical register is `content/nature-frontiers-media-register.json`. It is ordinary version-controlled JSON and does not require a Pexels, Pixabay, Metricool, Meta, or other provider API. Provider integrations may be added later as optional import/export adapters; they must never become the source of truth.

## Validate

Run `npm run validate:nature-frontiers-media`. The validator uses only Node.js built-ins, performs no network requests and needs no credentials.

## Record lifecycle

1. Add an asset with a stable unique ID, exact source URL, provider name and listing evidence.
2. Keep species, behaviour and location claims explicitly marked as listing-only or unverified until the actual footage and reliable provenance have been checked.
3. Record the downloaded file's project-relative path and SHA-256 once the file is lawfully obtained.
4. Record a complete visual inspection with reviewer, timezone-qualified timestamp and meaningful notes, bound to the exact file hash.
5. Record rights review separately from the platform's listing-level licence claim. Capture the actual licence evidence and assess additional permissions (people, property, trademarks, music, location restrictions and other third-party rights as applicable).
6. Human approval is permitted only after rights are cleared and the complete local file has been inspected. Approval is bound to the exact file SHA-256 and explicit usage scope.
7. Scheduling and publication records require approval. Published records also require a remote platform post ID receipt.

## Status meanings

- `source.listingStatus`: whether the exact source listing itself was checked; it does not indicate rights clearance.
- `rights.reviewStatus`: `not_assessed`, `in_progress`, `cleared` or `rejected`.
- `rights.additionalPermissionsStatus`: whether further permissions are not assessed, not required, required, obtained or rejected.
- `inspection.status`: `not_inspected`, `partial` or `complete`.
- `approval.status`: `pending`, `approved`, `rejected` or `revoked`.

## API-independent visual review

After local intake, prepare a review JSON file outside any public asset directory. It must be based on an actual human viewing of the complete clip; technical metadata and listing descriptions are not visual evidence.

Example structure (replace every example value with actual observations and evidence):

```json
{
  "reviewer": "Your reviewer identity",
  "reviewedAt": "2026-11-15T18:00:00+02:00",
  "fileSha256": "paste-the-exact-64-character-local-file-hash",
  "checklist": {
    "watchedEntireClip": true,
    "checkedBeginningMiddleEnd": true,
    "checkedAudio": true,
    "checkedEditsAndContext": true,
    "checkedForMisleadingRepresentation": true
  },
  "visualNotes": "Describe only what you personally observed in the clip.",
  "claims": [
    { "type": "species", "value": "giraffe", "status": "verified", "evidenceUrls": ["https://trusted-source.example/species"] },
    { "type": "location", "value": "South Africa", "status": "unverified", "evidenceUrls": [] }
  ]
}
```

Run:

```sh
npm run nature-frontiers:review-visual -- nf-pex-giraffe-5220275 path/to/review.json
```

The command checks the actual local bytes against both the register SHA-256 and review SHA-256, requires all five full-clip inspection attestations, requires an explicit disposition for every existing factual claim, and requires HTTPS evidence for claims marked verified. It appends a hash-bound review-history record and updates the inspection/claim fields. It refuses review if the media has changed or the asset is already scheduled/published. The register is structurally validated before atomic persistence.

**Important:** this records visual inspection and claim assessment only. It does not assess or clear rights, grant final human approval, or permit scheduling/publication. Rights remain as-is and approval remains pending. A verified claim must have credible, relevant evidence; a URL alone is not proof that the evidence is authoritative. Never mark a claim verified based solely on a stock listing or filename.


## API-independent rights review

Rights review is recorded separately from visual inspection and owner approval. Prepare a review JSON file after checking the actual licence and all relevant third-party rights. The file must include the exact registered media SHA-256, a reviewer, timezone-qualified timestamp, HTTPS licence evidence, a complete five-part checklist, review notes and explicit permitted platform usage scopes.

Checklist keys: `sourceLicenceReviewed`, `commercialUsePermitted`, `attributionRequirementsChecked`, `thirdPartyRightsChecked`, and `platformUseAndEditingRestrictionsChecked`. All must be true before rights can be marked cleared. If additional permissions are marked `obtained`, attach HTTPS evidence URLs. Never mark `not_required` unless the review establishes that no additional permission is needed.

Run:

```sh
npm run nature-frontiers:review-rights -- nf-pex-giraffe-5220275 path/to/rights-review.json
```

Rights clearance is bound to the exact local file SHA-256 and permitted usage scopes. It does not approve the asset, mark it visually inspected, schedule it or publish it. Human approval must separately use a usage scope contained within the rights-cleared permittedUsage list.

## Safety invariants

- New media defaults to held and pending.
- Automatic publication is disabled.
- Listing metadata never proves species, behaviour or exact location.
- No stock asset is represented as Nature Frontiers-original footage.
- A listing-level licence claim is not a substitute for a rights review.
- Approval is bound to the exact local file hash and intended platform use.
- No provider API is required to create, edit, validate, back up or restore the register.

Pexels' licence and terms can change. The register stores evidence links and review records rather than assuming that a provider API response is a legal clearance. Pexels' own terms note that third-party rights may still apply and that standalone redistribution is prohibited. See [Pexels License](https://www.pexels.com/license/) and [Pexels Terms of Service](https://www.pexels.com/terms-of-service/).

## Register an obtained local media file

Keep lawfully obtained source media under `media/nature-frontiers/` (this directory is git-ignored and should not be committed). Record its integrity against an existing asset ID:

```sh
npm run nature-frontiers:register-local-media -- nf-pex-giraffe-5220275 media/nature-frontiers/giraffe-clip.mp4 --probe
```

The optional `--probe` flag runs `ffprobe` against the local file and records duration, width, height, frame rate, video codec and (when present) audio codec under `media.technical`. Probe failure stops intake before the register is saved. Without `--probe`, intake remains API-independent and requires no external binary.

The command verifies that the target is a non-empty regular file inside the dedicated local media directory, computes SHA-256 from the actual bytes, runs the structural validator, persists JSON atomically, and refuses unknown IDs, approved assets, and assets already scheduled or published. Technical metadata does not establish visual content, species, location, licence, third-party rights or approval. Keep private licence documents in the approved private evidence store, not in the repository.
