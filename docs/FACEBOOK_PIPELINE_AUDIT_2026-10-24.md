# Facebook daily pipeline audit — 2026-10-24

Repository: `clickerrish-art/YT-AUTO-VISE`
Branch: `codex/marketing-machine-audit-fixes`
Scope: Nature Frontiers Facebook Page is a separate destination from SonicVhibez YouTube.

## Baseline findings

| Severity | Finding | Evidence | Implemented response | Acceptance still required |
|---|---|---|---|---|
| Critical | No verified Page ID or permission evidence was available in repository configuration | `config/facebook-publishing.json` initially has no Page ID; `.env.example` has no Meta credentials | Explicit empty Page ID, identity-unverified default and publishing-disabled flag; dashboard blocks readiness | Owner verifies the exact Page in Meta and confirms supported API permissions/token lifecycle |
| High | No first-class Facebook draft/review endpoints existed in the inspected dashboard routes | `scripts/dashboard-server.mjs` routes covered generic drafts/jobs/campaigns and YouTube private-upload controls | Added authenticated `/api/facebook/state`, `/api/facebook/drafts`, `/api/facebook/drafts/evaluate`, and `/api/facebook/drafts/approve` routes with persisted state/audit events; added a one-post-per-local-calendar-day collision guard | Browser UI integration and operator acceptance remain to be completed |
| High | No deterministic daily schedule experiment or Page-specific evidence guard existed | No Facebook schedule config or timing experiment in baseline | Added `Africa/Johannesburg`, 08:00/18:00 experiment config, deterministic slot assignment and minimum-sample reporting | No Page Insights were available; no optimum-time conclusion is supported |
| High | Rights, claims, originality and final approval needed a destination-specific gate | Existing review flow is designed for YouTube production artifacts | Added deterministic Facebook draft validation for sources, media/license checksums, permission flags, disclosure, duplicate text, engagement bait and review flags | Human must authenticate licences and verify factual claims; no automated check can certify authenticity |
| Critical | A live Facebook publish operation could not be safely verified or authorized | No Page ID, API permission proof, or verified publishing adapter in the baseline | Added an explicit 409 refusal endpoint; all Facebook operations remain draft-first and `publishingEnabled=false` | Implement official Meta API adapter only after verified owner setup and approved test post |

## New implementation surface

- `config/facebook-publishing.json`: draft-only destination configuration, Page identity gate, South African schedule hypothesis, compliance version and experiment threshold.
- `scripts/facebook-pipeline.mjs`: draft construction, timezone conversion, normalized fingerprinting and near-duplicate detection, factual source checks, rights/checksum checks, deterministic compliance results, artifact-bound human approval, kill-switch/authorization gate, experiment summary and uncertain-outcome reconciliation.
- `scripts/dashboard-server.mjs`: authenticated draft-first endpoints and durable `facebookDrafts`, `facebookPosts`, `facebookAttempts` state collections; audit events for creation, recheck and approval; explicit live-publish refusal.
- `test/facebook-pipeline.test.mjs`: isolated filesystem fixtures for schedule/timezone, invalid input, duplicate detection, Page identity, factual sources, rights evidence, disclosures, approval invalidation, dry-run gating and reconciliation.
- `test/facebook-dashboard.test.mjs`: dashboard authentication, draft persistence, blockers, duplicate refusal, audit history and no-live-publish behavior.
- `.env.example`: documents the empty Page ID variable; no token or credential is included.

## Known limitations / external gates

1. No Meta access token, app, permission, Page role, exact Page identity or Page Insights access has been independently verified.
2. The implementation intentionally contains no live Meta publishing adapter. `POST /api/facebook/publish` returns HTTP 409 and never calls an external service.
3. The initial timing experiment has no real observations. The code requires a minimum of 14 eligible posts per arm before indicating enough sample volume for review; this is a guard, not a statistical guarantee.
4. The dashboard includes dedicated Facebook draft creation, compliance recheck and human-review controls; it displays Page-identity/publishing blockers and the timing experiment's sample status. It does not publish remotely.
5. The Facebook quality score uses a documented deterministic rubric: start at 100, subtract 20 per blocker, 8 per human-review flag and 3 per warning, floored at 0. A score of 95 is an internal triage target only; any blocker or unresolved human-review flag still blocks approval regardless of score. It is not a Meta score, SEO score, reach forecast or certification.
6. Human approval binds the current caption, media checksum, rights evidence checksum, Page ID, disclosure, scheduled instant and rule-set version. Filesystem checksum validation cannot prove a licence is legally authentic.
7. No real post was created or published. Tests use explicitly labelled local fixtures and mocks only.

## Acceptance tests

- `node --test test/facebook-pipeline.test.mjs test/facebook-dashboard.test.mjs`
- Full repository `node --test` and the current branch GitHub Actions runs.
- Owner verifies Page ID/roles/permissions in Meta and sets the same ID in the reviewed config and secure environment.
- Before a live adapter can be considered: official API permission validation, token-expiry handling, dry-run payload review, operator authorization, a reviewed test post, remote refetch and durable receipt/reconciliation tests.
- Keep Facebook and YouTube destination allowlists separate. Keep public YouTube publishing disabled and the existing YouTube cadence decision unresolved until owner direction.
