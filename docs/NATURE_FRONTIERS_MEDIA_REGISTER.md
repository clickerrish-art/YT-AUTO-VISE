# Nature Frontiers media register

The canonical register is `content/nature-frontiers-media-register.json`. It is ordinary version-controlled JSON and does not require a Pexels, Pixabay, Metricool, Meta, or other provider API. Provider integrations may be added later as optional import/export adapters; they must never become the source of truth.

## Validate

Run:

```sh
npm run validate:nature-frontiers-media
```

Or invoke the Node.js script directly: `node scripts/validate-nature-frontiers-media-register.mjs`.

Or validate another JSON file:

```sh
node scripts/validate-nature-frontiers-media-register.mjs path/to/register.json
```

The validator uses only Node.js built-ins. It performs no network requests and needs no credentials.

## Record lifecycle

1. Add an asset with a stable unique ID, exact source URL, provider name and listing evidence.
2. Keep species, behaviour and location claims explicitly marked as listing-only or unverified until the actual footage and reliable provenance have been checked.
3. Record the downloaded file's project-relative path and SHA-256 once the file is lawfully obtained.
4. Record a complete visual inspection with reviewer, timezone-qualified timestamp and meaningful notes.
5. Record rights review separately from the platform's listing-level licence claim. Capture the actual licence evidence and assess additional permissions (people, property, trademarks, music, location restrictions and other third-party rights as applicable).
6. Human approval is permitted only after rights are cleared and the complete local file has been inspected. Approval is bound to the exact file SHA-256 and explicit usage scope.
7. Scheduling and publication records require approval. Published records also require a remote platform post ID receipt.

## Status meanings

- `source.listingStatus`: whether the exact source listing itself was checked; it does not indicate rights clearance.
- `rights.reviewStatus`: `not_assessed`, `in_progress`, `cleared` or `rejected`.
- `rights.additionalPermissionsStatus`: whether further permissions are not assessed, not required, required, obtained or rejected.
- `inspection.status`: `not_inspected`, `partial` or `complete`.
- `approval.status`: `pending`, `approved`, `rejected` or `revoked`.

## Safety invariants

- New media defaults to held and pending.
- Automatic publication is disabled.
- Listing metadata never proves species, behaviour or exact location.
- No stock asset is represented as Nature Frontiers-original footage.
- A listing-level licence claim is not a substitute for a rights review.
- Approval is bound to the exact local file hash and intended platform use.
- No provider API is required to create, edit, validate, back up or restore the register.

Pexels' licence and terms can change. The register stores evidence links and review records rather than assuming that a provider API response is a legal clearance. Pexels' own terms note that third-party rights may still apply and that standalone redistribution is prohibited. See [Pexels License](https://www.pexels.com/license/) and [Pexels Terms of Service](https://www.pexels.com/terms-of-service/).
