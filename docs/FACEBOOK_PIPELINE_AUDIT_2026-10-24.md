# Facebook daily pipeline audit — 2026-10-24

Repository: `clickerrish-art/YT-AUTO-VISE`
Branch: `codex/marketing-machine-audit-fixes`
Scope: Nature Frontiers Facebook Page is a separate destination from SonicVhibez YouTube.

## Current verified implementation checkpoint — 2026-10-24

Latest verified code/test checkpoint: `1155263c25e85f901b9245fd4e024898a1af6f19`. All three repository validation workflows and the daily-draft workflow passed on that exact commit: [automation — run 40091734573](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734573), [metadata — run 40091734584](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734584), [content quality — run 40091734600](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734600), and [daily Facebook draft — run 40091734576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576). Each reports 139 Node tests passed, 0 failed, 0 skipped; automation also passed 8 Python safety tests, JavaScript syntax checks and Python compilation. CI used `npm ci --ignore-scripts` (46 packages added, 47 audited); ordinary `npm ci` remains unverified. npm audit reports 4 moderate advisories.

### Additional fixes and daily draft automation

- **Approval binding:** `facebookApprovalFingerprint` binds claims/source URLs, media path/checksum/provenance, licence evidence path/checksum, permissions, attribution, synthetic/altered-media disclosure, destination, disclosure, schedule/timezone, experiment assignment and compliance-rule version. A material change invalidates approval. Regression coverage proves changed claims fail the publish gate.
- **Credential rotation:** `scripts/meta-credential-fingerprint.mjs` stores only HMAC fingerprints keyed by the dashboard operator secret, never raw Meta tokens. Page connection verification becomes invalid when the Page token, user token or operator secret changes.
- **Daily draft generator:** `scripts/generate-facebook-daily-draft.mjs` creates an idempotent research-only package using the `Africa/Johannesburg` calendar date and local editorial state where available, with a deterministic 08:00/18:00 experiment assignment. It never invents a Page ID, factual claims, media or rights evidence. It preserves existing same-day output.
- **Missed-slot recovery:** the generator records the proposed scheduled instant. If the selected slot has passed, it marks `MISSED_SLOT_REVIEW_REQUIRED` and instructs the operator not to backdate or batch-publish. The verified workflow run did exactly that when its 08:00 SAST slot was already past.
- **Scheduled workflow:** `.github/workflows/facebook-daily-draft.yml` runs at 07:30 SAST on the default branch and retains a 14-day artifact. The tested branch run produced [draft artifact 12558699856](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856). GitHub scheduled events run from the default branch only; PR #1 remains draft, so this is not yet an active production trigger.
- **Test correction history:** an earlier CI run failed because a regression test omitted the fixture's `root`; this was corrected. All four workflows passed on the subsequent code/test checkpoint listed above.

These are automated checks and a generated draft artifact, not proof of a real Page identity, current live permissions, Page Insights, licence authenticity or a real post. Publishing kill switches remain disabled; no real Facebook post was published.

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


## Autonomous publishing implementation checkpoint — candidate head pending CI

Candidate code added after the historical verified checkpoint above:

- Added `scripts/facebook-policy-engine.mjs`, a versioned fail-closed final-payload policy engine. It returns structured blockers/warnings, source/rights/disclosure/destination checks, duplicate decisions, rule version, a fingerprint and check timestamp. It checks source HTTPS reachability and requires a recorded source excerpt to occur in the fetched response; a URL by itself is not proof. It checks asset and licence-evidence checksums and canonical paths, commercial/platform rights fields, visible affiliate disclosure, exact campaign destination allowlists, URLs embedded directly in captions, redirect outcomes, wildlife/engagement-bait patterns, duplicate slots, daily caps and minimum intervals.
- Added `scripts/facebook-autonomous-publisher.mjs`. It has no per-post approval requirement. It uses the explicit configuration kill switch, a durable operator-controlled state directory, exclusive lock, validated persistent history/attempt ledger, machine policy decision before mutation, pre-mutation attempt persistence, remote receipt refetch and no automatic retry for uncertain outcomes. It preserves a known remote ID if post verification fails.
- Added `test/facebook-policy-engine.test.mjs` and `test/facebook-autonomous-publisher.test.mjs`; expanded `test/meta-page-adapter.test.mjs` for cursor pagination.
- Added `content/facebook-autonomous-queue.json` as an empty queue, `npm run facebook:publish:autonomous`, and `.github/workflows/facebook-autonomous-publisher.yml`. The scheduled workflow runs only from `main` and requires a persistent self-hosted runner labelled `facebook-publisher`; hosted ephemeral runners are deliberately not used for durable history.
- Updated `config/facebook-publishing.json` and `.env.example` with explicit autonomous-mode settings, the emergency stop, one-post daily cap, allowlists, durable-state path and secure runtime token names. Defaults remain `publishingEnabled=false`, `dryRun=true`, and `emergencyStop=true`; the workflow is not live until verified setup deliberately changes these settings.
- Meta managed-Page lookup now follows cursor pagination (bounded to 20 pages), and a scheduled receipt is not marked verified unless a real scheduled timestamp is returned.

**Current verification status:** the prior CI run on `05fe179bc53bbb0b4f5f06e21c0842bddd307d81` failed three new policy tests because the engine incorrectly treated a known-authentic `syntheticOrAltered: false` asset as unknown. That predicate was corrected in a later commit, and additional tests were added afterward. GitHub Actions has not provided a run associated with the current candidate head through the available workflow-run query; therefore these latest changes are **not yet verified by CI**. No local test run was possible because this environment cannot resolve GitHub to clone the repository. Do not label the current candidate green until CI runs against its exact SHA.

### Remaining blockers for true end-to-end acceptance

1. The policy engine is a preventive deterministic gate, not proof of legal licence authenticity or a guarantee of Meta enforcement outcomes. Semantic claim support remains conservative and requires a verifiable source excerpt and explicit structured support record; claims that cannot be validated must be skipped.
2. The autonomous queue is currently empty. The existing daily draft generator is still research-only and is not yet an end-to-end autonomous researcher/media producer that populates this queue with verified facts and rights-cleared assets.
3. The new scheduled workflow requires an owner-controlled persistent self-hosted runner, a durable absolute `FACEBOOK_STATE_DIR`, secure Meta tokens, exact Page ID/name and granted permissions. None has been verified in a real Meta account.
4. Uncertain attempts are durably blocked from duplicate retries. Full remote reconciliation for an uncertain mutation with no returned remote ID still requires a supported Page-feed reconciliation strategy before any retry can ever be considered.
5. The new publisher is not yet integrated into the dashboard health/receipt view; dashboard acceptance remains pending.
6. The current candidate must pass full CI on its exact SHA. The previous three validation runs were red on the earlier SHA; no current-SHA pass is claimed.


## Final implementation checkpoint — 2026-10-24

**Exact tested code checkpoint:** `c272fdf8c997bcda61aec3a1f52084e8e180ed64`. Three required validation workflows passed on that exact SHA:

- [Automation validation — 40114724961](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40114724961): 196 Node tests passed, 0 failed; 8 Python safety tests passed; campaign and queue checks, JS syntax checks and Python compilation passed.
- [Content quality — 40114724953](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40114724953): 196 Node tests passed, 0 failed.
- [Metadata validation — 40114724969](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40114724969): 196 Node tests passed, 0 failed; schedule and caption checks passed and the default production readiness checker correctly remained blocked.
- [Facebook daily draft workflow — 40114724935](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40114724935): skipped on the pull-request event; this is not evidence of a default-branch scheduled run or a published Facebook post.

The current npm audit at that checkpoint reported four moderate advisories and zero high/critical: gaxios, googleapis, googleapis-common and uuid. A proposed googleapis 188.0.0 major upgrade could not be validated because the lockfile-generation run remained pending and the lockfile was out of sync, so the package.json change was reverted rather than leaving an un-installable candidate. The moderate advisories remain unresolved.

### Additional implementation details

- The production queue now defaults to the durable state directory, outside the ephemeral checkout. Intake and publisher share the configured exclusive lock; terminal slots are removed from the pending queue only after their decision/receipt is persisted. The checked-in queue is only a local-development fallback.
- Startup recovery converts interrupted PUBLISHING records to UNCERTAIN and reconciles them before considering new work. It queries the official scheduled_posts and feed edges with bounded pagination. One verified match is persisted; zero matches are not proof of non-publication; ambiguous results remain blocked with no mutation retry.
- The publisher requires both JSON enablement flags and the separate runtime FACEBOOK_PUBLISH_ENABLED=YES control, plus an exact matching NATURE_FRONTIERS_FACEBOOK_PAGE_ID, live permissions and identity checks, and an absolute durable state directory. Failed Page/permission checks are recorded as automatic skips without owner confirmation.
- The dashboard exposes authenticated read-only autonomous status and no longer shows per-post review or manual publish forms as the routine workflow.
- Path checks reject queue escapes, queue symlink escapes, unsafe state filenames and state-ledger symlinks outside the durable directory. The queue and history are not stored solely in CI artifacts.
- The policy engine now requires a structured claim, a reachable authoritative source, a matching excerpt, a claim bound to the exact final caption, and an injected trusted semantic verifier. **No trusted semantic-verification provider is currently configured in production; the default is fail-closed, so factual wildlife posts remain ineligible.** Source excerpts and self-declared verified flags are not treated as semantic proof.
- The new intake evaluates only supplied evidence-bearing candidates. It does not yet autonomously research topics or create/licence production media. The checked-in candidate list remains empty; no content or rights evidence has been fabricated.

**Evidence scope warning:** the three green runs above prove the code checkpoint `c272fdf8c997bcda61aec3a1f52084e8e180ed64`, not subsequent documentation-only commits. Always check the exact current PR head and its runs before release acceptance.
