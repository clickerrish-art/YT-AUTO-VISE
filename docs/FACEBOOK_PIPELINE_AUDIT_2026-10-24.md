# Facebook daily pipeline audit — 2026-10-24

Repository: `clickerrish-art/YT-AUTO-VISE`
Branch: `codex/marketing-machine-audit-fixes`
Scope: Nature Frontiers Facebook Page is a separate destination from SonicVhibez YouTube.

## Current verified implementation checkpoint — 2026-10-24

Current tested code checkpoint: `6217680cc11e617375b152b9e7b5b745559eb8c0`. The three CI workflows passed on that exact code/test commit: [automation — run 40091065946](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091065946), [metadata — run 40091065995](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091065995), and [content quality — run 40091065945](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091065945). Each reports 136 Node tests passed, 0 failed, 0 skipped. Automation also passed 8 Python safety tests and JavaScript/Python syntax checks. The tested dependency installation was `npm ci --ignore-scripts`; ordinary `npm ci` remains unverified. npm audit still reports 4 moderate advisories.

### Additional defects fixed in this checkpoint

- **Approval binding:** `facebookApprovalFingerprint` now binds structured claims and their source URLs, media path/checksum/provenance, retained licence evidence path/checksum, commercial/platform permissions, attribution, synthetic/altered-media disclosure state, Page destination, disclosure, schedule/timezone, experiment assignment and compliance-rule version. Changing material factual or rights data invalidates the prior approval. Regression coverage proves that changed claims fail the publish gate.
- **Credential rotation:** `scripts/meta-credential-fingerprint.mjs` stores only HMAC fingerprints keyed by the dashboard operator secret, not raw Meta tokens. A Page connection attestation becomes invalid when the Page token, user token or operator secret changes. Regression tests cover rotation, purpose separation and malformed fingerprints.
- **Test evidence:** the first run exposed a regression-test fixture error (`root is not defined`); the fixture was corrected, and all three workflows passed on the subsequent code/test checkpoint. The earlier failed run is historical and must not be mistaken for the latest result.

These checks do not establish a real Page identity, current live permissions, Page Insights access or successful publication. All publishing kill switches remain disabled; no real Facebook post was published.

## Baseline findings

| Severity | Finding | Evidence | Implemented response | Acceptance still required |
|---|---|---|---|---|
| Critical | No verified Page ID or permission evidence was available in repository configuration | `config/facebook-publishing.json` initially has no Page ID; `.env.example` has no Meta credentials | Explicit empty Page ID, identity-unverified default and publishing-disabled flag; dashboard blocks readiness | Owner verifies the exact Page in Meta and confirms supported API permissions/token lifecycle |
| High | No first-class Facebook draft/review endpoints existed in the inspected dashboard routes | `scripts/dashboard-server.mjs` routes covered generic drafts/jobs/campaigns and YouTube private-upload controls | Added authenticated `/api/facebook/state`, `/api/facebook/idea`, `/api/facebook/drafts`, `/api/facebook/drafts/evaluate`, and `/api/facebook/drafts/approve` routes with persisted state/audit events; added a one-post-per-local-calendar-day collision guard | Dedicated dashboard controls are implemented; owner/operator acceptance and a real API test remain |
| High | No deterministic daily schedule experiment or Page-specific evidence guard existed | No Facebook schedule config or timing experiment in baseline | Added `Africa/Johannesburg`, 08:00/18:00 experiment config, deterministic slot assignment and minimum-sample reporting | No Page Insights were available; no optimum-time conclusion is supported |
| High | Rights, claims, originality and final approval needed a destination-specific gate | Existing review flow is designed for YouTube production artifacts | Added deterministic Facebook draft validation for sources, media/license checksums, permission flags, disclosure, duplicate text, engagement bait and review flags | Human must authenticate licences and verify factual claims; no automated check can certify authenticity |
| Critical | A live Facebook publish operation could not be safely verified or authorized | No Page ID, API permission proof, or verified publishing adapter in the baseline | Added an official Meta Graph API adapter behind config + environment kill switches, live Page/scope verification, approval fingerprint, explicit per-operation confirmation, durable attempt logging and remote refetch. Defaults remain `publishingEnabled=false` and `dryRun=true` | Implement official Meta API adapter only after verified owner setup and approved test post |

## New implementation surface

- `config/facebook-publishing.json`: draft-only destination configuration, Page identity gate, South African schedule hypothesis, compliance version and experiment threshold.
- `scripts/facebook-pipeline.mjs`: draft construction, timezone conversion, normalized fingerprinting and near-duplicate detection, factual source checks, rights/checksum checks, deterministic compliance results, research-first idea suggestions that are explicitly not publish-ready, high-impact claim flags, exact Selar campaign/pillar separation, artifact-bound human approval, kill-switch/authorization gate, available-metric summaries and uncertain-outcome reconciliation.
- `scripts/meta-page-adapter.mjs`: read-only identity/scope/managed-Page task checks, matching Page token verification, Graph API scheduled text/photo requests, checksum and ffprobe image checks, remote refetch and token-redacted errors. The adapter has no automatic retries.
- `scripts/dashboard-server.mjs`: authenticated idea, identity-verification, draft, recheck, approval and gated scheduling endpoints; durable `facebookDrafts`, `facebookPosts`, `facebookAttempts` state collections; audit events; startup recovery converts interrupted external attempts to reconciliation-only status while preserving known remote IDs.
- `test/facebook-pipeline.test.mjs`: isolated filesystem fixtures for schedule/timezone, invalid input, duplicate detection, Page identity, factual sources, rights evidence, disclosures, approval invalidation, dry-run gating and reconciliation.
- `test/facebook-dashboard.test.mjs`: dashboard authentication, draft persistence, blockers, duplicate refusal, audit history, disabled-publish refusal and interrupted-attempt recovery.
- `test/meta-page-adapter.test.mjs`: mocked identity/scopes/managed-Page token checks, scheduled post payload, photo checksum/decode, remote refetch, error redaction and timeout uncertainty.
- `.env.example`: documents the empty Page ID variable; no token or credential is included.

## Known limitations / external gates

1. No Meta access token, app, permission, Page role, exact Page identity or Page Insights access has been independently verified.
2. The Meta adapter is implemented but disabled by default (`publishingEnabled=false`, `dryRun=true`, `FACEBOOK_PUBLISH_ENABLED=NO`). With defaults the publish route returns HTTP 409 before a remote mutation. Live scheduling requires verified scopes, managed-Page task, matching Page token, current approval, explicit operation authorization, durable attempt logging and remote refetch.
3. The initial timing experiment has no real observations. The code requires a minimum of 14 eligible posts per arm before indicating enough sample volume for review; this is a guard, not a statistical guarantee.
4. The dashboard includes research-first idea suggestions, dedicated Facebook draft creation, compliance recheck, human review, read-only Page verification and one-operation scheduling controls. Defaults remain disabled; no real Meta post was published or tested.
5. The Facebook quality score uses a documented deterministic rubric: start at 100, subtract 20 per blocker, 8 per human-review flag and 3 per warning, floored at 0. A score of 95 is an internal triage target only; any blocker or unresolved human-review flag still blocks approval regardless of score. It is not a Meta score, SEO score, reach forecast or certification.
6. Human approval binds the current caption, media checksum, rights evidence checksum, Page ID, disclosure, scheduled instant and rule-set version. Filesystem checksum validation cannot prove a licence is legally authentic.
7. No real post was created or published. Tests use explicitly labelled local fixtures and mocks only.

## Acceptance tests

- `node --test test/facebook-pipeline.test.mjs test/facebook-dashboard.test.mjs`
- Full repository `node --test` and the current branch GitHub Actions runs.
- Owner verifies Page ID/roles/permissions in Meta and sets the same ID in the reviewed config and secure environment.
- Before a live adapter can be considered: official API permission validation, token-expiry handling, dry-run payload review, operator authorization, a reviewed test post, remote refetch and durable receipt/reconciliation tests.
- Keep Facebook and YouTube destination allowlists separate. Keep public YouTube publishing disabled and the existing YouTube cadence decision unresolved until owner direction.
