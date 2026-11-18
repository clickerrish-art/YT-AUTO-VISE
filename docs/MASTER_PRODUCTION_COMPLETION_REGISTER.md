# LIVE MASTER COMPLETION REFRESH — 18 November 2026, 09:01 SAST

**This is the newest verified status addendum. It supersedes older SHA, test-count, readiness, Meta and branch-inventory snapshots below wherever they conflict. It is an evidence register, not owner authorization to publish.**

## Exact repository and test lineage

- Live PR #1 metadata: OPEN / DRAFT / UNMERGED; implementation branch `codex/marketing-machine-audit-fixes`; live PR head `34e751c6cb1f0cd850180f887c65323dd1ff7d83`; base `main`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.
- The PR description contains a stale HEAD (`04794264...`); live PR metadata is authoritative for the current head. Latest fully tested application/source candidate is `20e437b1412abfb7e6f45aa06fd926658afc1342`; the current PR-head checkpoint commit `34e751c...` is documentation-only relative to that tested source candidate.
- Exact PR-head automation/security run [44255110195](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44255110195): **171/171 Node test files passed; 84 Python tests passed; zero skips; npm audit 0 vulnerabilities**. Normal lifecycle install, syntax checks and Python compilation passed.
- Exact PR-head dashboard browser run [44255110222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44255110222): **33/33 Chromium journeys passed** against the real local dashboard/backend.
- Exact PR-head content quality [44255109987], metadata [44255110184], queue readiness [44255110180], Cloudflare durable-state [44255109998], runner bridge [44255110113], deployment recovery [44255109994], signed editorial approval regression [44255109992], Nature Frontiers local draft [44255110046] and Instagram safety [44255110273] completed successfully. Local/regression PASS is not live provider authorization.
- Meta connection workflow [44255110203] passed its regression tests, but its live Meta user/Page verification step was **SKIPPED** on the pull-request event. Do not record live Meta identity as passed.
- Production readiness [44255110124] completed **HOLD — 19 blockers**. The readiness failure is the required fail-closed result, not a code-test regression. It performed no upload, scheduling or publication.
- Non-destructive branch inventory [44255110152] passed: **4,308 branch-only commits, 9 base-only commits, 432 final-tree changed files**, decision `REQUIRES_REVIEW`. The isolated main/candidate baseline run [44255109995] was still in progress at the last inspection; do not count it as PASS until its conclusion is verified.
- PR safety remains mandatory: do not merge, close, mark ready, retarget, rebase, reset, force-push or rewrite history; do not modify `main`.

## B. Engineering and operational acceptance — current gate decisions

| Gate | Current decision | Exact remaining acceptance |
|---|---|---|
| DASH-001 | NOT TESTED overall | 120 controls / 17 forms. 11 forms have local/operator success evidence; 6 remain fail-closed on production prerequisites. Complete per-control/field authorized success, validation, error, authorization, persistence, refresh/restart, concurrency and accessibility evidence. 33 browser journeys are not exhaustive control acceptance. |
| API-001 | NOT TESTED overall | Last route matrix: 48 protected routes, 42 PASS, 6 BLOCKED; 48/48 missing/invalid-auth checks PASS. Six blocked routes: `POST /api/facebook/drafts/approve`, `POST /api/facebook/publish`, `POST /api/facebook/verify-page`, `POST /api/instagram/approve`, `POST /api/jobs/produce`, `POST /api/uploads/reconcile`. Complete their real provider/media positive paths and remote read-back; do not promote negative fail-closed tests to full route PASS. Matrix snapshot is dated 16 Nov and must be refreshed after new route-specific evidence. |
| SCHED-001 | NOT TESTED overall | Policy tests pass for rolling `long_form → long_form → short`, at least 72 elapsed hours and no same Johannesburg calendar day. Complete current OAuth, remote history/attempt reconciliation, actual remote timestamps, live dispatch, lease/cancel/retry/dead-letter and worker restart proof. |
| SCHED-WORKER-DISPATCH-001 | NOT TESTED operationally | Local 409/backoff, uncertain-dispatch quarantine and persistence/restart tests pass. A continuously running production worker and real render dispatch are not proven. |
| STATE-001 | PASS — staging only | Staging D1 backup/restore/restart and five-backup retention are accepted. Independent off-account backup and production state remain separate. |
| DEPLOY-001 | NOT TESTED | Deployment recovery smoke passes 2/2 locally. Complete authorized production deployment, monitoring, alerting, rollback and disaster recovery. |
| GIT-002 | NOT TESTED | 4,308/9 divergence and 432 changed files require human semantic review. Preserve both restore-history tests and all divergence; no integration mutation is authorized. |
| E2E-001 | NOT TESTED | No genuine rights-cleared item has completed the entire real plan → script → footage → narration → captions → render → QC → human approval → private-upload preparation → remote read-back → restart recovery journey. |
| SEO-001 | NOT TESTED | Approve final metadata/captions/thumbnail against a genuine final export and provide measured search/competition evidence. Do not claim ranking guarantees. |

The 171-file Node suite, 84 Python tests and 33 browser journeys establish current engineering regression health; they do not close the acceptance gates above.

## Production readiness — 19 current blockers

The exact-head readiness run [44255110124](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44255110124) lists:

**Short manifest (6):**
1. Missing `media/next-short-footage.mp4`.
2. Missing `media/next-short-narration.mp3`.
3. No genuine human-verified footage-rights evidence.
4. No genuine human-verified narration-rights evidence.
5. Keep `rightsConfirmed=false` until all actual media permissions are checked.
6. Keep `complianceReviewed=false` until a human reviews the exact final package.

**Long-form manifest (7):**
7. Missing `media/long-form-001-footage.mp4`.
8. Missing `media/long-form-drafts/long-001-narration-final.mp3`.
9. Missing `long-form-001-captions-final.srt`.
10. No human-verified footage-rights evidence.
11. No human-verified narration-rights evidence.
12. Long-form rights confirmation remains false.
13. Long-form compliance review remains false.

**Metadata and release (3):**
14. Exact final metadata has not been human-reviewed and marked `READY_FOR_PRIVATE_UPLOAD`.
15. Metadata rights confirmation remains false.
16. Metadata compliance approval remains false.

**Remote access and final master (3):**
17. Missing rendered production master `media/next-short.mp4`.
18. Latest read-only YouTube OAuth attempt returns `invalid_grant`; reauthorization is required.
19. Upload-capable YouTube OAuth scope accepted by `videos.insert` (prefer `youtube.upload`) is not independently verified.

The readiness workflow reports one existing SonicVhibez upload (public=1, private=0, unlisted=0) and prior attempt reconciliation passed in that run. The existing public 20-second Short is a legacy item, not proof of the current 50–60-second production target. The OAuth failure and unverified upload scope still prohibit a new upload. No blind retry is permitted.

## C. Nature Frontiers — separate Meta publishing lane

- Live Metricool read-only brand: Nature Frontiers SA, brand ID `8094526`; Facebook Page ID recorded as `1431329126735709`; Instagram account label `naturefrontieers2026`; timezone `Africa/Johannesburg`.
- Metricool scheduled-post query for 18 Nov–18 Dec 2026 returned zero scheduled posts. Its brand network data also exposes the SonicVhibez YouTube channel ID; this cross-brand mapping is unresolved and is not permission to publish YouTube content through Nature Frontiers.
- Meta regression workflow is green, but the live identity/permission step was skipped on PR runs. The latest earlier live Meta identity check returned HTTP 401 (expired/invalid user and Page token session); renew only through secure secret management and then run the authorized read-only verification.
- Instagram safety and signed editorial-approval code suites pass; local draft package validation passes. None proves provider-side draft creation/read-back or human approval of actual content.
- The deployed `nature-frontiers-publisher` Worker is health-only: GET `/health`, no Meta publishing routes, no secrets, no cron. Its production D1 operational tables have zero rows. It is not a functioning publisher.
- Library inventory: 9 Nature Frontiers MP4s technically decoded; **0 publication-ready**, **0 verified original-camera packages**, **0 human-approved assets**. Nile crocodile explainer remains illustrative animation, not documentary footage, with full human playback, factual, source-provenance, rights and exact-hash approval still pending.
- Maintain `publishingEnabled=false`, `dryRun=true`, `FACEBOOK_PUBLISH_ENABLED=NO`, emergency stop enabled; keep unreviewed content held. No post, schedule or provider mutation is authorized.

## Required future owner inputs

1. Supply the genuine Short footage and the final long-form footage, or exact original-source links and creator/licence evidence; the five imported Canva wildlife clips remain excluded until source identity, original MP4 bytes, hashes, permitted use and human visual review are established.
2. Provide the user's own narration recording for the chosen content, or explicitly approve AI narration and its disclosures for that specific content. The recent request to record a permanent natural voice is not yet a supplied recording. Do not substitute placeholder eSpeak or unapproved synthetic voices.
3. Supply/approve final captions and exact script-to-scene mapping for each production item.
4. Confirm all rights for footage, narration, music, images and derivatives; perform full human playback/editorial/compliance review and approve the exact final hashes.
5. Human-review exact final metadata and explicitly authorize `READY_FOR_PRIVATE_UPLOAD` for a specific private-only job.
6. Reauthorize YouTube OAuth through the secure secret manager; independently verify SonicVhibez identity, upload-capable scope and complete current remote history. Confirm whether any upload was attempted, failed, timed out or left uncertain outside the repository/runtime.
7. Confirm official Nature Frontiers Facebook Page and Instagram professional-account identities/permissions in Meta Business Suite; renew user/Page credentials through secret management and verify by read-only API calls.
8. Supply an approved SonicVhibez logo if it is to be used in final video/thumbnail.
9. Confirm a zero-cost independent backup destination and resolve Cloudflare R2 permission/access (prior R2 listing returned 403); no paid service is approved.
10. Provide production deployment access/secrets only through their secret managers, and owner/admin confirmation to enable branch protection and required status checks.
11. Complete human semantic review of divergent Git history; this is an owner/maintainer review, not an automated inventory operation.

## Release decision — completed recommendation, owner authorization still separate

**RECOMMENDATION: HOLD / NOT PRODUCTION READY.** This is the evidence-based release decision for the current checkpoint. Do not upload, schedule, publish, activate campaigns, enable unattended publishing or promote staging to production. Reassess only after all relevant blockers have been independently satisfied and the exact final candidate has passed its release gates. This recommendation does not impersonate the owner's signature or grant publishing authorization.

**No credentials, assets, rights, approvals, provider outcomes or production deployment were fabricated. No paid infrastructure was used. No upload, schedule, publication, PR merge or main-branch modification was performed.**

---

# LIVE MASTER STATUS — 18 November 2026

**This live refresh supersedes older checkpoint details below wherever they conflict.** It is an evidence snapshot, not a release approval.

- Current fully tested implementation code SHA at this refresh: `20e437b1412abfb7e6f45aa06fd926658afc1342` (the master-register documentation refresh is a later documentation-only commit). Full automation run `44254485025` and content-quality run `44254493722` passed on this exact SHA.
- `main` HEAD: `2cd6f223b6b673c030974c7f27c5ddf6f41e8b38`. Its tree hash `f4d82cadc0b2f896702d3a249f367c19fdf7e5db` is identical to the original `main` tree at `2e4153c8252349d1a7c5655f5cdc00da557c597e`.
- **Safety incident and correction:** commits `5af11d8d63e36808ca8c77f5435a29a965270254` and `a10eca5d13da0b120eb55b2c9c40bb2c488eb61a` were accidentally created on `main` because two contents updates omitted the implementation-branch parameter. They added only `docs/REQUIREMENTS_ACCEPTANCE_REGISTER.json` and `.github/workflows/american-narration-review.yml`; both files were removed by normal forward revert commit `2cd6f223`. The original main tree is restored exactly. No force-push, reset, rebase or history rewrite was used. No further writes to `main` are permitted.
- PR #1: OPEN / DRAFT / UNMERGED. No merge, close or ready-for-review change.
- Branch reconciliation inventory `44254493755` on code SHA `20e437b` reports 4,307 ahead / 9 behind; merge base remains `45352b73bb6cc4787b2a49988b575afb754ab627`; 432 changed files, 17 critical-module changes, 0 deletions, 0 patch-equivalent commits, clean working tree, and `integrationDecision=REQUIRES_REVIEW`. GIT-002 semantic review remains NOT TESTED; no merge or rebase is authorized.
- Exact-SHA CI on code SHA `20e437b` passed: 981/981 Node tests with zero skips (`44254493722`), 84/84 Python tests with zero failures (`44254485025`), npm audit 0 vulnerabilities, isolated normal `npm ci` lifecycle install, JavaScript syntax checks, Python compilation, and read-only authenticated Cloudflare staging smoke. The full automation workflow `44254485025` completed SUCCESS. Dashboard browser E2E on this SHA is still being re-run; the preceding exact-SHA run `44253930716` passed 33/33 journeys.
- The latest readiness artifact on code SHA `20e437b` (run `44254493726`) reports **19 release blockers**. Read-only history run `44211269635` verified one legacy public Short; upload-ledger run `44252812519` verified no prior private-upload jobs and `previousLedgerRunId=NONE`. Neither result authorizes a new upload. OAuth still returns `invalid_grant`, and upload scope remains unverified.

## Current 19 release blockers

**Short manifest (6):**
1. Missing `media/next-short-footage.mp4`.
2. Missing `media/next-short-narration.mp3`.
3. Missing genuine, human-verified footage-rights evidence.
4. Missing genuine, human-verified narration-rights evidence.
5. `rightsConfirmed` must remain false until every asset's actual permissions are checked.
6. `complianceReviewed` must remain false until a human reviews the exact final package.

**Long-form manifest (7):**
7. Missing `media/long-form-001-footage.mp4`.
8. Missing `media/long-form-drafts/long-001-narration-final.mp3`.
9. Missing `long-form-001-captions-final.srt`.
10. Missing human-verified footage-rights evidence.
11. Missing human-verified narration-rights evidence.
12. Long-form `rightsConfirmed` remains false.
13. Long-form `complianceReviewed` remains false.

**Metadata and release (3):**
14. Final metadata has not been human-reviewed and marked `READY_FOR_PRIVATE_UPLOAD`.
15. Metadata rights confirmation remains false.
16. Metadata compliance review remains false.

**Remote access and final master (3):**
17. `media/next-short.mp4` does not exist.
18. Latest read-only YouTube OAuth attempt returns `invalid_grant`.
19. A current upload-capable YouTube OAuth scope (`youtube.upload` or another documented `videos.insert`-capable scope) is not independently verified.

The five imported Canva clips are explicitly excluded from production and remain uncleared. Queue-readiness run `44254493713` retained an isolated proposal with 16 existing items, 0 additions, 0 scheduled items and publishing disabled; 12 remain on media/human-review hold, 2 await narration/media/review, 1 has script/captions ready but still needs media/review, and 1 legacy status remains lower-case. The queue artifact's local readiness report shows 23 blockers because four YouTube environment variables are deliberately unavailable in the PR execution context; the configured production-readiness workflow reports the 19 release blockers above. The schedule validator now prints a NOTE rather than an unconditional live-history blocker; it does not query YouTube. The strict Internet Archive discovery workflow completed but found zero eligible wildlife assets; no media was downloaded. The WanGP model/VAE mirror provenance conflict remains unresolved, and no owner-started Kaggle GPU generation has occurred. The current queued Short draft is still a creator-education tutorial, which does not meet the user's current requested direction of realistic wildlife-encounter storytelling. A separate research-backed, unqueued Nile crocodile encounter draft now exists at `content/drafts/nile-crocodile-eyes-at-the-waterline.md`; four safety tests enforce its unqueued status, factual source map and AI-reconstruction disclosure. It is not yet owner-approved, rendered, scheduled or published. Any AI-generated encounter must be clearly labelled as an illustrative reconstruction, not a real documented event.

## Engineering and operational acceptance — current decision

| Gate | Evidence / status | Remaining acceptance |
|---|---|---|
| DASH-001 | NOT TESTED overall. Inventory: 120 controls, 17 forms, 103 form-owned, 17 standalone; last completed browser E2E passed 33/33 journeys on `58ec88f`; current `20e437b` rerun is in progress. 11 forms locally pass and 6 production-dependent forms fail closed. | Exhaustive per-control/field success, validation, error, authorization, persistence, refresh/restart, concurrency and accessibility acceptance. |
| API-001 | NOT TESTED overall. 48 protected routes; 42 overall PASS, 6 BLOCKED; 48/48 missing/invalid-auth negative checks pass. | Six positive paths remain provider/production gated; complete route-by-route persistence, audit, concurrency and restart acceptance. |
| SCHED-001 | NOT TESTED. Rolling `long_form → long_form → short`, 72 elapsed hours and no same Johannesburg calendar day are policy-tested; SCHED-003 cadence decision is PASS. Queue-readiness run `44254493713` passed with 0 new items, 16 total, 0 scheduled and `publishingEnabled=false`. The local validator now correctly notes that it does not query YouTube; the separate production-readiness gate handles remote history. | Current OAuth, live dispatch, actual remote publication timestamps, worker restart, lease/cancel/retry/dead-letter and real publication proof. |
| SCHED-WORKER-DISPATCH-001 | Local retry/backoff, 409 and uncertain-dispatch quarantine tests pass. | No continuous production worker or real render dispatch is proven. |
| STATE-001 | PASS for staging D1 backup/restore and restart tests only. Direct read-only query shows 5 backups and one dashboard-state row at revision 3. | Independent off-account backup and production state acceptance. Staging has zero runner artifact, runner control and runner-state rows. |
| DEPLOY-001 | NOT TESTED. Deployment recovery smoke passed on the current candidate; read-only Cloudflare staging smoke passed in automation run `44254485025`. | No SonicVhibez production Worker exists; production monitoring, alerting, rollback and disaster recovery remain open. |
| GIT-002 | NOT TESTED. Branch reconciliation `44254493755`: 4,307 ahead / 9 behind, 432 changed files, 17 critical modules, 0 deletions, 0 patch-equivalent commits, clean tree; integration decision `REQUIRES_REVIEW`. | Human semantic review of the divergent history; preserve all divergence and do not merge. Branch-protection endpoint returned 403; owner/admin must verify protection. |
| E2E-001 | NOT TESTED. | No real rights-cleared item has completed plan → script → footage → narration → captions → render → QC → approval → private-upload preparation → remote read-back → restart recovery. |
| SEO-001 | NOT TESTED. | No final metadata, captions and thumbnail have been approved against a genuine final export with measured search evidence. |

Stored acceptance-register snapshot (16 November, refreshed on 18 November for the owner-approved cadence decision only; remaining rows are not freshly reconciled): 89 requirements = 71 PASS / 9 NOT_TESTED / 9 BLOCKED. SCHED-003 is now PASS from the owner-authored 17 November approval recorded in config; SCHED-001 remains NOT_TESTED. API matrix snapshot: 48 routes = 42 PASS / 6 BLOCKED, authentication-negative 48/48. Do not present these stored counts as a current full release pass.

## Nature Frontiers — separate Meta lane

- Live Meta verification was executed on push (run `44251034601`), not merely inferred from the green PR regression suite. The regression suite passed 100 tests, but the live read-only check failed: user token HTTP 401 / OAuth error 190 (session invalid because user logged out); Page token HTTP 401 / OAuth error 190 (session invalidated by password/security change).
- Configured Page ID is `1431329126735709`; required user-token permissions are `pages_show_list`, `pages_read_engagement`, and `pages_manage_posts`, plus Page task `CREATE_CONTENT` or `MANAGE`. Both user and Page tokens must be renewed through Meta and stored only in GitHub Actions secrets. Never paste tokens into chat.
- Metricool currently exposes one brand only: Nature Frontiers SA, brand ID `8094526`, timezone `Africa/Johannesburg`. Its record contains Facebook Page `1431329126735709`, Instagram username `naturefrontieers2026`, and a `youtubeData` field containing the SonicVhibez channel ID `UCSlkuPfHH78oGC1o418HV4w`. The brand's connected-network summary lists Facebook/Instagram; treat the YouTube field as an unresolved cross-brand mapping and do not use Nature Frontiers as a YouTube destination.
- Current Metricool query returned zero scheduled posts for 18 November–18 December 2026. Old brand ID `7545638` returns HTTP 403 (access denied), so eight previously observed future auto-publish records remain UNKNOWN until the owner restores access or independently verifies them in the Metricool UI. Do not edit/cancel/publish unknown records.
- The green daily-draft CI run is a deterministic PR test fixture dated 2030-10-25, not a real scheduled content package. It contains three research-only slots with no factual claims, media, rights evidence, Page ID or approval. It is not a provider-side Meta draft.
- The Cloudflare `nature-frontiers-publisher` Worker is deployed but has no scheduled triggers and no secret bindings; its production D1 schema exists but all content, approval, rights, target, publication-attempt and audit tables contain zero rows. Instagram professional-account numeric ID is not configured/verified. Keep `publishingEnabled=false`, `dryRun=true`, `FACEBOOK_PUBLISH_ENABLED=NO`, emergency stop enabled, and unreviewed items held.

## Cloudflare / continuous operations

- Account read-only inventory shows no SonicVhibez production Worker. `sonicvhibez-durable-state-staging` is the only SonicVhibez Worker; it has no schedules and binds staging D1 plus an R2 bucket.
- Staging D1 has 5 backup rows and 1 state row (revision 3), but 0 runner artifacts, 0 artifact parts, 0 runner-control rows and 0 runner-state rows.
- R2 is not enabled: Cloudflare API returns error 10042 (“Please enable R2 through the Cloudflare Dashboard”). Do not enable or incur storage charges without explicit cost approval.
- `nature-frontiers-publisher` has no schedules and no secret bindings. Its D1 production database is schema-provisioned but has zero content, targets, approvals, rights, publication attempts, audit events or webhook rows.
- No continuous production worker, persistent media artifact path or independent off-account backup is proven.

## Voice and production direction

- User's current creative requirement is American English, mature male wildlife storyteller, energetic and passionate, natural and trustworthy; realistic animal-encounter stories rather than creator-education tutorials. AI-generated scenes must be disclosed as illustrative reconstructions.
- HeyGen Sterling audition exists from the prior conversation, but no persistent repository voice setting or private user voice clone has been saved. No user recording or room-tone recording has been uploaded. Sterling is a public voice and is not a zero-cost/permanent guarantee.
- Free local Piper Norman (American English male) review workflow passed on 18 November (run 44253500939): 154 words, 51.432 seconds, mono 22.05 kHz/16-bit WAV, peak −0.77 dBFS, RMS −18.59 dBFS, zero clipped samples. The review artifact includes the pinned model card, attribution and JSON provenance; its audio SHA-256 is `49c34b55de3658c9f21387eb544e1d1c8f350958bb9208242fd1d4a88c77ae2e`. The earlier 38.092-second sample was below the Short duration target; the script was lengthened and speech length-scale set to 1.1, and the current 51.432-second sample passes the 50–60-second gate. This is a free local Norman audition, not the HeyGen Sterling voice. It remains review-only: `humanVoiceQualityReview=PENDING`, `commercialAttributionReview=PENDING`, `productionApproved=false`, `finalNarration=false`, `publishingEnabled=false`. The WAV artifact is retained for 30 days, not permanent storage. It requires human listening, licence review and explicit approval.
- Do not use the older Australian Piper auditions as the current voice choice. No final narration or human approval exists.

## Required owner inputs to unblock work

1. Reauthorize the existing Google OAuth client for YouTube with `youtube.readonly` and `youtube.upload` plus offline access; update only `YOUTUBE_REFRESH_TOKEN` in GitHub Actions secrets. Do not send tokens in chat.
2. Reauthorize Meta user and Page tokens with the required Page scopes/tasks; update `META_USER_ACCESS_TOKEN` and `META_PAGE_ACCESS_TOKEN` in GitHub Actions secrets. Confirm the exact Facebook Page and Instagram professional-account numeric ID in Meta Business Suite.
3. Restore access to Metricool brand `7545638` or verify its eight historical auto-publish records; create a separate SonicVhibez Metricool brand and remove the SonicVhibez YouTube mapping from Nature Frontiers.
4. Start the pinned free Kaggle notebook session and provide its real test output only after the WanGP checkpoint/VAE provenance conflict is resolved; no GPU generation has been performed.
5. Choose the final narration route: approve a tested zero-cost American voice, supply a clean recording of your own voice with explicit clone consent, or reject the candidates. Supply original room tone only if it must be used.
6. Provide genuine source/rights-cleared media or approve the specific AI-generation model after its exact weights/VAE provenance and commercial terms are verified.
7. Human-review the final video, captions, thumbnail, facts, disclosures, metadata and hashes; explicitly authorize the exact private-upload job only after all prior gates pass.
8. Confirm a zero-cost independent backup destination and production deployment access. Do not enable R2 or any paid service without an explicit cost ceiling.

## Release decision

**HOLD — NOT MASTER COMPLETE.** No public upload, private upload, scheduling or publication is authorized. No finished Short or long-form production master exists. The current 19 blockers, invalid YouTube OAuth, invalid Meta tokens, missing separate brand configuration, absent production worker, disabled R2 and pending owner approvals prevent a 100% release. “Risk-free” cannot be guaranteed; the release target is zero unresolved critical/high blockers, documented residual risk, verified fail-closed behavior and human-approved exact artifacts.

---

# SonicVhibez master production completion register

**Scope:** first fully reviewed SonicVhibez production package and safe, verified publishing path.  
**Last inspected implementation SHA:** `5a3760b7f2b17af250a37dcbb3e3db857eb5cd45`  
**Register status:** `BLOCKED — NOT MASTER COMPLETE`

This is an evidence register, not a declaration that the project is complete. A task moves to PASS only when the exact implementation SHA, source evidence, test result and/or human approval are recorded. Never turn a missing file, draft, passing unit test, queued workflow, metadata search result or owner attestation into production proof.

## Non-negotiable safety boundaries

- YouTube destination is SonicVhibez only; never target Nature Frontiers.
- Preserve `main`; do not merge, close or mark PR #1 ready. Do not rewrite history.
- Keep public publishing disabled. Do not schedule, upload, change metadata or publish without the separate exact-job authorization and all release gates.
- Never claim AI-generated wildlife scenes are genuine documentary evidence of a real encounter.
- Do not use an asset until its individual commercial rights, third-party elements, source provenance and human review are evidenced.
- No paid GPU, API, TTS, runner or storage service by default.
- Kaggle is an owner-started, temporary batch GPU session, not a permanent or unattended GPU service.
- A zero-risk guarantee is impossible. The acceptance target is no unresolved critical/high release blockers, documented residual risks, fail-closed controls and a human-approved release.

## Verified foundations

| Area | Current evidence | Status |
|---|---|---|
| Git safety | Implementation branch `codex/marketing-machine-audit-fixes`; PR #1 remains open/draft/unmerged; `main` is unchanged by this work | PASS for preservation check |
| Brand destination | Read-only YouTube identity inventory confirmed channel ID `UCSlkuPfHH78oGC1o418HV4w`, handle `@sonicvhibez`; latest recorded inventory has one public 20-second Short | PASS for historical identity/inventory only; refresh before upload |
| Cadence decision | Owner-approved rolling `long_form → long_form → short`, minimum 72 elapsed hours, no same Johannesburg calendar day, no weekly publication target; three gaps require at least 216 hours | PASS for policy decision; actual scheduling remains blocked |
| Product promotion | Only `https://selar.com/0u19v8u99l` is approved; exact direct-sales disclosure is owner-approved; paid-promotion flag must remain enabled | PASS for this product/disclosure only |
| WanGP source setup | Project-owned Kaggle notebook pins WanGP source commit and records model/VAE revisions and hashes; importer and tests exist | PASS for repository setup only; no GPU generation has been evidenced |
| Internet Archive intake v1 | Workflow run `44227968869` completed successfully and uploaded artifact `14392619879`; 30 records were returned, but inspection showed broad-search false positives | PASS for workflow mechanics; FAIL for useful discovery relevance |
| Internet Archive intake v2 | Run `44228944629` succeeded on SHA `c36f19a57e90b049607afacfbbcebda0c0bb358c`; 21 candidates returned, but manual artifact inspection still found broad-title false positives and only one potentially wildlife-relevant item, with no licence. No media downloaded. | PASS for workflow mechanics; FAIL for useful/licensed discovery |

## Outstanding work — ordered execution gates

### Gate 1 — Stabilise Internet Archive discovery

**Status: IN PROGRESS**

1. The v2 workflow and tests passed, but the 21-result report still contained false positives; only one title looked potentially wildlife-related and it had no licence metadata.
2. A stricter v3 search is now pinned to the Prelinger collection and per-item Public Domain Mark/CC0 metadata, with title-only relevance and game/sports/photography/broadcast exclusions. Workflow run `44229512157` is queued on current SHA `cfdbca182898a075a02192bd58db8b313aaf6623`.
3. Inspect the v3 report; if no suitable item appears, report zero suitable assets rather than widening the query into unlicensed content.
4. Review each candidate item page and licence terms; metadata triage is not legal clearance.
5. Exclude NonCommercial, NoDerivatives, unknown, uploader-unverified and third-party-restricted material.
6. Only then consider an item for manual download and asset registration.
7. Keep download, registration, render, scheduling and publishing disabled until separate approvals.

**Acceptance:** v2 tests pass, search results are relevant, and every selected asset has exact source page, uploader/creator, licence evidence, commercial-use and modification rights, third-party clearance, file hash and human approval. No item is approved merely by appearing in the report.

### Gate 2 — Resolve WanGP model rights and run a real Kaggle generation test

**Status: BLOCKED**

Existing configuration:
- WanGP source pinned to `f4cfc1259215577be9a2ee280c41efbedfb4459a`. Its exact `LICENSE.txt` (WanGP Community License 2.0) has been reviewed: internal business use, private batch/queue/headless use and use of outputs are permitted, subject to third-party model terms. Credit is required for a Direct Output Sale; third-party weights retain their own licences. The WanGP software licence itself is therefore not the blocker.

Wan 2.2 TI2V 5B mirrored checkpoint and VAE are pinned by immutable revisions and SHA-256. The official `Wan-AI/Wan2.2-TI2V-5B` model card states Apache-2.0, but the `DeepBeepMeep/Wan2.2` mirror's model-tree metadata identifies `Wan-AI/Wan2.2-T2V-A14B` as the base while the pinned checkpoint filename says 5B. The mirror provides hashes but no file-specific conversion/provenance statement or explicit licence. The VAE mirror likewise has a hash but no file-specific provenance/licence. Exact mirror checkpoint/VAE derivative provenance remains `HOLD_UNVERIFIED_MIRROR_DERIVATIVE_PROVENANCE`; do not infer rights from the upstream model alone.
- Kaggle execution is owner-started, temporary and not unattended.

Required tasks:
1. WanGP Community License 2.0 is verified for internal business use and output creation; preserve its terms and any required direct-output credit.
2. Obtain maintainer evidence that the exact pinned mirror checkpoint and VAE derive from the official Apache-2.0 TI2V-5B model and are redistributed under those terms, or replace them with a WanGP-compatible source whose exact files and licence are independently verified. The mirror's model-tree base-model metadata conflicts with the expected 5B checkpoint, so keep the weight/VAE rights gate on HOLD.
3. Inspect pinned WanGP source, dependency installation and notebook execution for supply-chain risks; do not run unreviewed mutable code.
4. Owner starts the project notebook in Kaggle, enables Internet and a free GPU, and runs the pinned setup/test cells.
5. Generate a real 5-second photorealistic wildlife test shot; no cartoon, still montage or fabricated file.
6. Verify output MP4, exact model/source metadata, seed, prompt, negative prompt, file SHA-256, ffprobe report and full FFmpeg decode.
7. Import output with `scripts/import_wangp_kaggle_output.py`.
8. Human watches the complete clip and records anatomy, species, movement, continuity, artefact and realism review.
9. Retain outputs outside temporary Kaggle session storage without requiring a large local PC model cache.

**Owner input needed:** start the Kaggle notebook session and provide the resulting test package or an accessible artifact reference. The assistant cannot operate the user's Kaggle UI or claim GPU output without it.

### Gate 3 — Clear source footage and build the media library

**Status: BLOCKED**

The imported Canva/Pexels inventory contains five candidate clips. All five remain HOLD:
- Elephant: source match pending visual confirmation; no local media.
- Aerial zebras/wildebeest: duration mismatch; visual confirmation pending; no local media.
- Grazing zebras/wildebeest: source match pending visual confirmation; no local media.
- Giraffe: source match pending visual confirmation; no local media.
- Lion: source and creator unresolved.

Required tasks:
1. Verify each exact Canva item visually against its claimed original source and creator.
2. Resolve metadata mismatches and reject unmatched clips.
3. Download only individually cleared source media.
4. Record exact source URL, licence, creator, download date, commercial/derivative permissions, third-party elements, SHA-256 and local/cloud storage path.
5. Human-review every clip and its proposed context.
6. Alternatively, use only WanGP-generated shots after Gate 2 clears, with their own model and generation evidence.
7. Build a shot-to-claim map; never imply an illustrative AI shot documents a real event.

**Acceptance:** at least enough cleared, technically usable, visually approved footage for the selected first production, with complete provenance and hash-bound evidence.

### Gate 4 — Clear narration and audio

**Status: IN PROGRESS — AUDITION WORKFLOW ADDED; OWNER LISTENING AND ATTRIBUTION REVIEW PENDING**

A promising free local candidate has been identified: `DataCraftsmanAustralia/piper-en_AU-librivox-medium`, pinned at `3faad046064c56f7316ffd745d5a8b14035f35df`. Its model card states CC BY 4.0 and permits commercial use with attribution. The model's base lineage also requires attribution to Jenny (Dioco); the model author explicitly describes their lineage interpretation as good-faith and not a legal conclusion. The candidate is not yet approved for production.

Three male speakers are registered for audition: Banjo (Timothy Ferguson, speaker 5, 7.97 hours), Angus (Algy Pug, speaker 4, 1.80 hours) and Flynn (Howard Skyman, speaker 6, 0.58 hours). Banjo is the first candidate because the model author records that Timothy Ferguson's spoken outro identifies him as recording from the Gold Coast, Australia. The model author warns that the voices can sound formal/literary rather than conversational and have variable recording quality.

**Verified:** GitHub Actions run [44228884555](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44228884555) completed successfully on source SHA `4678e10369d2093d7928fc1bda06ad768542ef2f`. It installed Piper 1.8.0, passed the candidate/speaker-map tests, generated all three WAV auditions, verified the pinned model SHA-256 `f34849bce64d803d0fe90087766d5d6f2a8215a12edad43e486d77072df7dd41`, and uploaded artifact `14394291428` (`sonicvhibez-piper-australian-male-voice-auditions`). The artifact expires 2026-12-18. This is an audition only, not final narration. The owner has not yet auditioned or selected a voice. An enhanced workflow that synthesizes the actual current Short script in all three voices is queued as run `44229692794` on SHA `d766f642d4c5102da4db1a504527518370588b7a`; it has not yet completed.

Tasks:
1. Verify the Piper audition workflow and owner-listen to Banjo, Angus and Flynn; choose one or reject all three.
2. Review CC BY 4.0 terms and the Jenny (Dioco) base-checkpoint attribution condition; retain the full upstream attribution evidence. If unresolved, keep the voice on HOLD or use an owner-recorded voice track.
3. Record exact voice/model version, licence URL, licence copy, settings and source-script hash.
4. Regenerate narration from the current script; old narration evidence is stale against current script hashes and the Short narration lacks the approved exact disclosure.
5. Include the exact spoken direct-sales disclosure and clear spoken advertisement identification where required.
6. Check pronunciation, intelligibility, pacing, naturalness and Australian-English accent.
7. Run audio loudness, clipping, silence and full-playback checks.
8. Time captions against the final narration; no draft SRT is accepted as final.

**Owner input needed only if no suitable zero-cost voice with documented commercial rights is established:** supply a recorded voice track or approve a specific cleared voice option.

### Gate 5 — Complete factual and editorial content

**Status: BLOCKED — DRAFTS REQUIRE EDITORIAL AND FACTUAL APPROVAL**

Current scripts are drafts, not approved production scripts. The two long-form episodes are creator-education tutorials (not animal-encounter documentaries); the Short is a three-shot wildlife-storytelling tutorial. This content direction may serve the Wildlife Creator's Vault promotion, but it is not the realistic animal-encounter format also requested for SonicVhibez. Do not render the current drafts as animal-encounter content or imply they document real wildlife events. Owner/editorial approval of the first content direction is required before final production.

Tasks:
1. Select the first long-form topic and Short topic in the approved rolling cycle.
2. Verify all factual claims against primary/reputable sources and retain a source map.
3. Write a shot-by-shot brief and match each claim to footage or explicitly labelled illustrative visuals.
4. Complete the 6–10 minute long-form script and 50–60 second Short script.
5. Ensure no invented animal encounter, unsafe wildlife advice, false location or misleading thumbnail promise.
6. Include the owner-approved Selar disclosure exactly; keep the product promotion restricted to the one approved product and keep YouTube paid-promotion declaration enabled.
7. Add synthetic-media disclosure decisions for AI-generated realistic scenes and narration.
8. Human editorial and factual review.

### Gate 6 — Render and validate real final videos

**Status: BLOCKED — BOTH MANIFESTS SAY BLOCKED_NOT_RENDERABLE**

Short:
- Expected 50–60 seconds, 9:16.
- Required footage, narration and quality-evidence files are missing.
- Current SRT is a draft and is not synced to final audio.
- Rights and compliance are false.

Long form:
- Expected 6–10 minutes, 16:9.
- Required footage, narration, final captions and quality-evidence files are missing.
- Previous narration has a source-script hash mismatch and is superseded.
- Rights and compliance are false.

Tasks:
1. Build the edit only from cleared, reviewed source clips and licensed narration.
2. Render a genuine MP4 with FFmpeg; do not substitute still-image slideshows.
3. Verify dimensions, aspect ratio, duration, codec, frame rate, audio stream, loudness, full-file decode, caption sync and file hash.
4. Create truthful thumbnail at the required dimensions.
5. Review the complete video from beginning to end for quality, facts, artefacts, audio, captions, product disclosure and synthetic-media disclosure.
6. Bind review/approval to exact final hashes and retain the review package.
7. Update manifests only with actual evidence; never hand-edit a status to PASS.

### Gate 7 — Reconcile YouTube upload attempts and prepare private upload

**Status: PASS for historical identity/inventory and prior-attempt reconciliation; current upload remains BLOCKED by media/approval gates**

Read-only YouTube verification passed on 2026-11-18, source commit `9aaffeee6b3ad75b19e92774fb1091d4209389ac`, workflow run `44211269635`. It authenticated the approved SonicVhibez channel and inventoried the complete uploads playlist: one public 20-second legacy Short (video ID `LjePS02hA1o`, published 2026-10-22T15:05:56Z), no private or unlisted videos. The owner attested there were no other manual/local/external upload attempts.

Automated ledger validation also passed: workflow run `44229290895`, job `134550082550`, source SHA `3ab59402ce801c96431d24e8fe56d227edfec409`. It inspected one prior manual workflow-dispatch run across both private-upload entry points and found zero executed private-upload jobs. The earlier `upload-private.yml` run had its private-upload job skipped; no `upload-artifact-privately.yml` run existed. The first future authorized private upload can safely initialize the ledger with `previous_ledger_run_id=NONE`. No upload is authorized by this reconciliation.

Tasks:
1. Historical channel identity and full uploads inventory are verified; refresh read-only inventory immediately before any upload because the previous inventory is not a permanent authorization.
2. Automated prior-upload ledger reconciliation is complete: zero private-upload jobs executed; use `previous_ledger_run_id=NONE` for the first future private upload.
3. Keep the legacy 20-second Short in history as a legacy exception; it does not meet the current 50–60 second standard.
4. Verify OAuth credentials remain valid without logging secret values.
5. Confirm exact channel ID and destination is SonicVhibez.
6. Prepare one private-only upload authorization bound to exact job, final MP4 hash, metadata hash, thumbnail hash, caption hash, rights evidence and human approval.
7. Do not execute upload until the owner explicitly authorizes that exact job.

### Gate 8 — Schedule, publish, verify and measure

**Status: BLOCKED — CRITICAL METRICOOL BRAND-SEPARATION ISSUE**

Fresh Metricool read-only inspection on 2026-11-18 returns only one connected brand, `Nature Frontiers SA` (brand ID `8094526`, timezone `Africa/Johannesburg`). Its `youtubeData` is the SonicVhibez channel ID `UCSlkuPfHH78oGC1o418HV4w`. This is a cross-brand association and is not an approved SonicVhibez scheduling destination.

The current brand's scheduled-post query for 2026-11-18 through 2027-01-31 returned an empty list. The older brand ID `7545638` remains inaccessible with HTTP 403. The earlier 2026-10-28 snapshot documented eight future records with `draft=false` and `autoPublish=true`; their final state remains UNKNOWN because the old brand is inaccessible. Do not infer they were canceled or transferred.

**Owner action required:** create/restore a separate SonicVhibez Metricool brand connected only to the verified SonicVhibez YouTube channel; remove the SonicVhibez YouTube connection from Nature Frontiers; restore access to the old Metricool brand or independently verify all eight historical records in Metricool UI. Do not mutate, cancel, edit or publish any post until exact record identity and owner authorization are established.



Tasks:
1. Keep the rolling long-form → long-form → Short order and minimum 72 elapsed hours between actual publication timestamps; enforce no same Johannesburg calendar day.
2. Draft-preparation Tuesday/Saturday triggers are not publication slots.
3. Verify actual remote timestamps immediately before each scheduling/publication operation.
4. Confirm a separate SonicVhibez Metricool brand exists and is connected only to the approved YouTube channel. The currently connected Nature Frontiers brand contains the SonicVhibez YouTube channel ID and must never be used for SonicVhibez publishing.
5. Reconcile the inaccessible old Metricool brand ID 7545638 and its eight previously observed future autoPublish records; current brand 8094526 has no scheduled posts returned for 2026-11-18 through 2027-01-31, which does not resolve the old brand's records.
6. Verify the Metricool integration/account and YouTube scheduling method after brand separation;
7. Schedule only fully approved content and verify the remote scheduled record.
8. Publish privately first where authorized; verify video ID, channel, privacy, processing and metadata in YouTube Studio.
9. Public release requires a separate explicit owner authorization; public and unattended publishing stay disabled until that exists.
10. Verify actual publication timestamp and rolling cycle state.
11. Run read-only analytics, verify the correct video identity and report real metrics only.
12. Confirm no prohibited automated engagement, spam, duplicate distribution or artificial metric activity.

### Gate 9 — Continuous operations, recovery and dashboard

**Status: PARTIALLY IMPLEMENTED / CURRENT-SHA ACCEPTANCE PENDING**

Existing repository includes worker leases, retry backoff, queue, approval, rendering, recovery and dashboard test suites. They are not proof that the complete media production and remote publishing lifecycle works end-to-end.

Tasks:
1. Run the current-SHA CI suite and investigate every failure, skip, cancellation and queued workflow.
2. Verify the current-SHA dashboard behavior for each production journey, not merely control counts.
3. Verify persistence, restart recovery, leases, cancellation, retry/backoff, dead-letter handling and uncertain remote mutation quarantine.
4. Run a complete safe dry-run through generation intake → review → approval → render → queue → schedule preflight.
5. Verify artifact retention, recovery and provenance survive session expiry.
6. Keep external publishing mutations disabled during acceptance tests.
7. Confirm deployment and production health checks without treating CI success as live provider proof.

The Short upload metadata title has been aligned to the exact title in the production script: `Wildlife Documentary Storytelling: 3 Shots, One Clear Story`.

## Required owner inputs (only when the corresponding gate is ready)

1. Start the free Kaggle session and run the pinned test notebook; provide the resulting package/artifact. No Kaggle GPU generation has yet been performed.
2. Listen to the Australian male Piper auditions and select one voice or reject all three; if none meets the realistic/conversational quality bar, provide an owner-recorded voice track or approve another fully documented option.
3. Confirm whether the first content package should remain the current creator-education tutorial or be replaced with a realistic animal-encounter story. The current drafts are tutorials, not animal-encounter documentaries.
4. Create/restore a separate SonicVhibez Metricool brand connected only to the verified SonicVhibez YouTube channel, disconnect that channel from Nature Frontiers, and restore access to the old brand or independently verify the eight historical auto-publishing records.
5. Watch and approve the exact final video, captions, thumbnail, metadata, disclosures and factual claims.
6. Explicitly authorize any exact private upload job after all prior gates pass.
7. Separately authorize any public publication or unattended scheduling; existing approval does not imply it.

## Current acceptance decision

**NOT MASTER COMPLETE.** No finished Short or long-form MP4 exists in the repository media tree at the inspected SHA. WanGP GPU execution is pending; exact mirror checkpoint/VAE commercial provenance is on HOLD; the five imported Canva candidates are on HOLD; no final narration is commercially cleared; both render manifests are blocked; prior upload-attempt ledger reconciliation is complete with zero executed private-upload jobs; no exact-job private upload approval exists; no safe separate SonicVhibez Metricool brand exists; the only connected brand is Nature Frontiers SA and it contains the SonicVhibez YouTube channel ID; old Metricool brand 7545638 and its eight historically observed auto-publishing records remain inaccessible/unknown.

Do not report a percentage or call any of these tasks complete until the evidence listed above is present and independently checked.
