# Master execution tracker — 21 November 2026

**Project:** SonicVhibez Marketing Machine / YT-AUTO-VISE  
**Audited branch:** `codex/marketing-machine-audit-fixes`  
**Audited starting HEAD:** `c4dd8767a5c91ec0a121f0c133724343f14d8ee4`  
**PR:** #1 — must remain open, draft and unmerged.  
**Default branch:** `main` — do not write, merge into, reset, rebase or force-push it.  
**Release posture:** HOLD. Publishing, scheduling and uploads remain disabled. Zero-cost constraint remains in force.

This tracker distinguishes source-code presence from verified operational completion. A task is PASS only when its required output is independently verified on the exact current source SHA. Historical CI, mocked provider tests, drafts and configuration flags do not establish live production success.

## 1. Verified current blockers

1. No eligible original creator-captured wildlife media package is present. Pexels, Pixabay, Wikimedia, NOAA, Internet Archive, Canva stock and generated wildlife imagery are excluded from production by the current policy. Required: original files, source/creator provenance, commercial rights, hashes, technical probe, complete playback and shot-level editorial approval.
2. Narration is blocked. HeyGen Support denied zero-cost commercial-use rights for Roderic Free-plan outputs. Roderic remains the owner-selected exclusive voice; no alternative voice or paid upgrade is authorized. Required: written HeyGen reversal for the exact use, or explicit owner change to the voice restriction.
3. Long-form 001 is a research draft only. Required: qualified zoological review, factual corrections, source-to-claim mapping, original rights-cleared footage, lawful narration, final captions, edit, thumbnail, full playback and exact-hash owner approval.
4. Short 001/002/004 remain planning/review-only; excluded stock/archive footage and unapproved narration cannot be promoted into production. No final approved Short MP4 exists.
5. No final production render, final captions, final thumbnail or exact-hash owner approval exists.
6. YouTube OAuth was previously observed returning invalid_grant on the 21 November checkpoint. A 20 November read-only inventory had verified channel `UCSlkuPfHH78oGC1o418HV4w`, handle `@sonicvhibez`, and read/upload scopes, but it is stale until a fresh successful authentication. Required: reauthorize the existing client securely, confirm upload scope, complete history inventory and owner attestation for manual/local/third-party upload attempts after 18 November. Never blindly retry uncertain uploads.
7. Fresh YouTube history's one 20-second public upload matches the prior owner-reviewed Short record, but the fresh inventory itself labels format unclassified. Owner reaffirmation is required.
8. Scheduling is not accepted. Required: complete actual remote history, rolling `long_form → long_form → short`, minimum 72 elapsed hours, no same Johannesburg calendar day, Africa/Johannesburg timezone/DST, and live lease/cancel/retry/dead-letter/restart/uncertain-upload recovery evidence.
9. No verified SonicVhibez production publisher Worker exists. Staging OIDC trust is pinned to an old branch. R2 enablement previously returned Cloudflare error 10042. Durable archive and independent restore are not verified.
10. Latest source head `c4dd8767a5c91ec0a121f0c133724343f14d8ee4` has no PR-triggered workflow runs returned by the connected GitHub run lookup. Historical test runs do not certify this head.
11. Worker retry/backoff and uncertain-dispatch safeguards have source/test evidence on earlier trees, but current-head full regression and live staging acceptance remain unverified.
12. Nature Frontiers is restricted in repository config to Facebook/Instagram. Metricool legacy brand 7545638 remains inaccessible (403); eight historical `draft=false`/`autoPublish=true` records and 20 reported drafts remain unreconciled. Current brand 8094526's settings response did not prove the old mapping was disconnected.
13. Nature Frontiers and SonicVhibez must remain separate brands. Nature Frontiers must never target the SonicVhibez YouTube channel.
14. The default-branch NOAA acquisition workflow remains enabled for relevant pushes and manual dispatch. It is a risk because it conflicts with the current original-creator-captured-only policy. Repository owner action is required; do not mutate main from this workflow.
15. Git history includes four rights-review commits accidentally written to main. Preserve history and obtain owner-directed semantic review; no reset, rebase, force-push or silent correction.
16. Branch protection status remains unverified/disabled in the latest checkpoint. Owner/admin action is required.
17. Dashboard acceptance (DASH-001) and API acceptance (API-001) require exact-current-head tests and full behavior matrices, not counts of controls/routes or CI-only evidence.
18. STATE-001 and DEPLOY-001 require verified durable storage, production Worker, safe OIDC, backup/restore and recovery. No paid infrastructure is authorized.
19. GIT-002 requires semantic review of critical modules, divergence and default-branch risks while preserving PR #1 and branch history.
20. Analytics/growth operations cannot be fully measured until content is lawfully published and real platform analytics are available.

## 2. Production sequence and release gates

### Long-form 001 — Nile crocodile
- Script: `content/nile-crocodile-documentary-001-draft.md`; research draft only.
- Required: qualified zoological review; corrected source-to-claim ledger; original creator-captured footage; rights/provenance evidence; owner-approved lawful narration; final edit; synchronized SRT/VTT; thumbnail; full audio/video decode and playback; mobile review; metadata review; exact SHA-256 manifest; human rights/compliance/quality approval.
- Educational documentary only: no Selar CTA or paid-promotion claim in this package.

### Short production
- Required: approved original footage; lawful narration; 50–60 second vertical master; synchronized captions; original thumbnail/brand treatment; accurate metadata; full playback; technical checks; exact hashes and owner approval.
- Do not treat visual rough cuts, reference assets or AI demos as final media.

### Voice
- Keep existing Roderic Free-plan audio internal-only. Do not generate with another voice or use a paid plan without explicit owner authorization.

### AI and stock
- Keep AI wildlife generation and stock/archive acquisition disabled. Do not spend GPU credits or introduce generated/stock wildlife visuals as substitutes for original footage.

## 3. Marketing and promotions audit

The current `content/promotional-short-plan.json` contains 14 items, all private and `DRAFT_ONLY`, with no publication/scheduling timestamps. Weekly maximum is two Shorts. This is a preparation plan, not a publication calendar.

Automated structural audit on the audited branch:
- 14 promotion drafts.
- 8 product-specific disclosure records marked APPROVED.
- 6 disclosure records marked HOLD.
- 14/14 have production checklists.
- 14/14 remain private and DRAFT_ONLY.
- 0 publication/scheduled timestamps.
- Three product IDs: Wildlife Creator's Vault, Full Video Creation Prompt Pack Premium Edition, and YouTube Success Blueprint 90-Day Creator System.

The six HOLD items are:
- `sonicvhibez-short-003-prompt-framework`
- `sonicvhibez-short-004-90-day-review`
- `sonicvhibez-short-006-niche-selection`
- `sonicvhibez-short-008-youtube-video-outline`
- `sonicvhibez-short-013-youtube-shorts-analytics`
- `sonicvhibez-short-016-youtube-script-hooks`

Their seller relationship is recorded as owner-confirmed direct sales, not affiliate commissions, but their exact viewer-facing disclosure is not approved. Do not substitute generic affiliate wording. Obtain approval of the exact product-specific wording before recording/publishing.

The eight APPROVED records apply to the Complete YouTube Wildlife Creator's Vault direct-sales disclosure. That approval must not be reused for the other two products without explicit authorization.

All 14 drafts still require genuine eligible original visuals, lawful narration, technical production, factual review, exact product/listing recheck, final playback, exact-hash approval and current YouTube scheduling/history gates. Current Selar pages could not be independently opened during this audit; seller/listing recheck remains outstanding. No campaign is authorized for upload or publication.

Marketing measurement requirements after lawful publication: impressions, reach, CTR, average view duration, retention curve, returning viewers, subscriber conversion, link clicks, Selar conversion/revenue and campaign-level attribution. Do not invent baselines or promise growth/income.

## 4. Owner/provider inputs

1. Original creator-captured wildlife footage and photographs, plus creator identity/provenance and written commercial usage rights.
2. Written HeyGen reversal for commercial use of Roderic Free-plan outputs, or explicit owner decision changing the exclusive-voice constraint. No paid upgrade by default.
3. Qualified zoological reviewer for Nile crocodile claims and shot selection.
4. Fresh YouTube OAuth reauthorization through the existing client, with secrets updated only in the approved GitHub secret store; never paste credentials into chat or source.
5. Owner attestation covering any manual, local, third-party or workflow upload attempts after 18 November; reaffirm the existing Short classification.
6. Metricool legacy brand export/access and authoritative mapping/support confirmation.
7. Cloudflare R2 enablement or owner-approved zero-cost durable storage alternative; production Worker/OIDC access.
8. Repository owner/admin verification of branch protection and remediation of the main-branch NOAA workflow.
9. Owner approval of exact disclosure wording for the six held promotion drafts.
10. Owner review of final rendered assets and exact SHA-256 hashes.

## 5. Engineering acceptance gates

- Current-head full Node/Python/security regression, with exact SHA and complete logs.
- DASH-001: behavior-level matrix for every user journey/control and current-head browser E2E.
- API-001: authentication-negative and positive route tests, with external provider gates clearly separated.
- SCHED-001: complete remote history, policy/property tests, real staging dispatch, timezone/DST and recovery evidence.
- STATE-001: durable persistence, backup integrity, independent restore and restart tests.
- DEPLOY-001: production Worker identity, exact source provenance, secure OIDC, bindings, storage, observability and rollback/recovery.
- GIT-002: branch divergence, critical-module semantic review, default-branch workflow risk and history incident review.
- Production quality: scorecard, technical validation, full playback, rights evidence, exact-hash approvals and fail-closed release decision.

## 6. Execution safety and status vocabulary

- PASS: exact required output exists and has been independently verified on the identified SHA/provider record.
- BLOCKED: a required owner/provider input or prerequisite is missing.
- NOT_TESTED: no valid verification was performed.
- HOLD: any critical gate is blocked or not tested.

Do not claim 100% completion while any required gate is BLOCKED or NOT_TESTED. Keep public/unattended publishing disabled. Do not change `main`, merge/close/ready PR #1, reset/rebase/force-push, invent evidence, use paid services, or run GPU generation without explicit authorization.


---

## 7. Live execution addendum — 21 November 2026

This section supersedes any older exact-head, YouTube, Metricool, Cloudflare or test-status statements above where they conflict.

### Exact Git state and test evidence
- Current implementation branch HEAD: `0c9b9bb892fbbba1034c0e8020ba7157b84c588f`.
- `main`: `3795519ccbf58fd02d74458624b58dd2e44a88c0`; unchanged.
- PR #1 remains OPEN / DRAFT / UNMERGED; base `main`.
- Branch comparison: 5,024 ahead / 17 behind; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Exact executable-code baseline `600775c3bd3a4ce80515ccbf4caa93f6cef06bf6`, run [44908444869](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44908444869): 185/185 Node test files, 1,070 Node tests passed, zero failed/skipped; 103 Python tests passed; npm audit zero vulnerabilities. Deployment recovery run [44908444940](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44908444940) passed; artifact bridge safety run [44908444879](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44908444879) passed.
- Current HEAD is six commits ahead of `600775c`; the only changed paths since that tested executable-code baseline are four content/evidence JSON files: the Cloudflare reconciliation, Metricool reconciliation, promotional Short plan and YouTube history refresh. No executable source or test file changed after `600775c`. The promotional plan and evidence JSON files were parsed and structurally inspected separately. **No exact-current-HEAD full CI run is recorded**, and no current-HEAD browser E2E is recorded.
- Older full run [44905987671](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44905987671) failed on earlier SHA `02c8fb7f0990f8b235441473e16a5c3a301e3f5a`: 1,068 passed, 2 failed, zero skipped. Failures were a stale detached-process assertion and a production-readiness evidence-path matcher. Subsequent source/test changes corrected both; the 1,070-test PASS is on `600775c`, not the current evidence-only HEAD.
- PR #1 has no PR-triggered workflow runs/statuses returned for current HEAD `0c9b9bb`; do not infer a current-head CI result.

### Dashboard and API acceptance
- DASH-001: NOT_TESTED overall. Inventory is 121 controls / 17 forms / 104 form-owned / 17 standalone. The last 41/41 browser evidence is on an older SHA, not current HEAD. The matrix's last browser E2E is not on the latest tested source SHA.
- API-001: NOT_TESTED overall. Matrix records 48 routes, 42 local acceptance passes, 48/48 auth-negative checks, and six provider/production routes still blocked. Local fixture success is not live provider acceptance.
- Production-quality gate: source and tests enforce eight quality dimensions, minimum 80 per dimension, overall 85/100, critical-gate approval, exact artifact/metadata/caption/thumbnail/narration hashes, technical receipt, rights evidence and human reviewer identity. The uploader and production-readiness script both validate the gate. This is a code-level structural gate; it cannot prove the reviewer actually watched the media or authenticate the truth of the review evidence.

### Fresh YouTube evidence
- Read-only run [44890253420](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44890253420) on 21 November authenticated `@sonicvhibez`, confirmed both `youtube.readonly` and `youtube.upload` scopes, complete pagination, one public video and zero private/unlisted videos. The workflow output is aggregate-only; it does not provide a retained current per-video artifact for owner reconciliation.
- Existing public video format is still marked UNCLASSIFIED in the fresh inventory. Owner must reaffirm its format against YouTube Studio.
- Upload-ledger run [44890418778](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44890418778) found zero prior private-upload workflow executions. It does not cover manual/local/third-party uploads after the 18 November owner attestation. A new owner attestation is required.
- Publishing, uploads and metadata writes remain disabled.

### Fresh Metricool evidence
- Current Nature Frontiers SA brand 8094526 returns Facebook Page 1431329126735709 and Instagram `naturefrontieers2026`; current brand settings do not return a YouTube network.
- Scheduled-post query for 21 November 2026 through 1 January 2027 returned zero posts.
- Legacy brand 7545638 returns HTTP 403. Its 20 reported historical drafts and eight `draft=false / autoPublish=true` records remain unreconciled. No provider mutations were performed.

### Fresh Cloudflare evidence
- Current account has no SonicVhibez production publisher Worker. It has only `sonicvhibez-durable-state-staging` for SonicVhibez dashboard/state, plus separate Nature Frontiers Workers.
- Staging Worker has seven recorded deployments, latest on 14 November, and zero cron schedules.
- Staging D1 `sonicvhibez-state-staging`: six tables, dashboard revision 3 last updated 15 November, one dashboard state row, five backups, 16 queue items, zero jobs/uploads, and zero runner state/control/artifact rows.
- All five retained D1 backup JSON records passed read-only SHA-256 recomputation and schema-version-1 JSON parsing. This verifies stored bytes, **not** independent restore.
- R2 list API returns HTTP 403 / error 10042: enable R2 through Cloudflare Dashboard. R2 bucket/object access and archive/restore remain unverified. No R2 activation, bucket creation or billing change was attempted.
- Cloudflare account-wide two-factor enforcement is false; owner/admin action required.
- The deployed staging Worker source still pins OIDC trust to `refs/heads/codex/cloudflare-adapter-integration-20261108`. PR #4 on that branch remains open/draft/unmerged; its current `.github/workflows/repository-runner.yml` sets both jobs to `if: false`, removes `id-token: write`, and defaults both dispatch inputs to false. This is source-level containment; the stale trust remains deployed in the Worker. Runner dispatch remains prohibited until trust is retired or migrated and tested.
- No Cloudflare resources were mutated.

### Production and owner dependencies still open
- Zero verified original-camera wildlife production packages; zero final approved videos.
- Short 001 and Long-form 001 still lack eligible footage, commercial rights, approved narration, final renders/captions/thumbnails and exact-hash human approval.
- HeyGen Support denied commercial use of Roderic Free-plan output. Roderic remains the owner's exclusive selected voice; no alternative voice or paid upgrade is authorized.
- Long-form 001 topic/script identity conflicts with other packages; owner must confirm canonical topic/ID and keep the crocodile documentary educational-only without Selar promotion.
- Six promotional Short disclosure records remain HOLD; eight Vault-specific records remain approved only for that product.
- Owner inputs still required: original footage and creator provenance; written commercial rights; narration licensing decision; owner classification of the existing public YouTube video; fresh manual/local/third-party upload-attempt attestation after 18 November; Metricool legacy export/access; Cloudflare R2/2FA owner actions; qualified zoological and final human review.
- No task is master-complete while a critical production, security, deployment or external-provider gate is BLOCKED or NOT_TESTED.


### Default-branch automation risk — verified against main and implementation branch
- On `main`, `.github/workflows/free-narration-artifact.yml` still has `workflow_dispatch` and push triggers and invokes Edge TTS voice `en-US-GuyNeural` for Short narration without the required explicit non-commercial audition gate.
- On `main`, `.github/workflows/generate-long-form-narration.yml` still has push and manual triggers; its script defaults to `en-US-GuyNeural` and does not require the new audition acknowledgement.
- On `main`, `.github/workflows/acquire-noaa-broll-candidates.yml` has a push trigger for workflow-file changes and manual dispatch; lobster and turtle inputs default true. It only uploads a 14-day rights-review artifact and explicitly labels downloads NOT REVIEWED; it is not a production render/publish step, but conflicts with the original-camera-only production policy and should remain disabled.
- The scheduled `.github/workflows/twice-weekly-check.yml` runs Tuesday/Thursday/Saturday at 15:00 UTC and performs `npm test` plus an example rights/compliance negative check. It does **not** generate narration.
- The implementation branch already contains fail-closed mitigations: both narration workflows are replaced with `if: false` disabled stubs; the NOAA acquisition job is `if: false`. These changes are present in PR #1 only and are not effective on `main` while PR #1 remains open/draft/unmerged.
- Do not merge PR #1 or write to `main` from this execution. Owner/admin must choose the controlled default-branch remediation path; until then, avoid pushes to the affected main-branch workflow paths and do not manually dispatch those workflows.


### Nile crocodile documentary research package — 21 November 2026
- Desk fact-check completed against the IUCN Crocodile Specialist Group species account, SANBI 2023 regional assessment, San Diego Zoo Wildlife Alliance fact sheets, a Lake St Lucia maternal-care study and the Leslie/Kemp/Spotila Lake St Lucia temperature-dependent sex determination study.
- Added `content/nile-crocodile-documentary-001-source-to-claim-ledger-2026-11-21.md` with claim-by-claim evidence, source limitations, required editorial caveats and outstanding review gates.
- Corrected the script's size description to “one of Africa's largest crocodilians”; dated the global 2017 and South African regional 2023 conservation assessments; expanded the claim register and added nine source references.
- Narration text remains approximately 875 words, within the 6–10 minute long-form requirement at a normal narration pace.
- The script remains DRAFT. No qualified zoological sign-off, original footage, commercial rights, narration clearance, final captions/render or exact-hash approval exists. This research task is complete; the documentary production task is not.


### Promotional Shorts disclosure reconciliation — 21 November 2026
- Rechecked all 14 promotional Short records after the product-specific review. All 14 remain private and `DRAFT_ONLY`; no publication/schedule timestamps exist. Eight disclosures remain approved only for the Wildlife Creator's Vault product URL `https://selar.com/0u19v8u99l`.
- Clarified the six HOLD records without changing their status or adding any approval:
  - Shorts 003, 008 and 016 map to **The Full Video Creation Prompt Pack Premium Edition** (`https://selar.com/539497q11t`). The 20 October product-page record was HOLD — VERIFY PRODUCT, price R570, Compliance Check blank. Exact viewer-facing direct-sales wording was not approved.
  - Shorts 004, 006 and 013 map to **THE YOUTUBE SUCCESS BLUEPRINT™ Build, Grow & Monetize a YouTube Channel With a Proven 90-Day Creator System** (`https://selar.com/91j893378q`). Prior records do not contain verified current product-page details, approved claims or exact viewer-facing disclosure wording.
- The previously approved Vault disclosure must not be reused for either product. Recheck both live listings, claims and compliance; obtain product-specific owner-approved disclosure wording before release.
- The plan remains 14/14 draft-only, eight APPROVED (Vault only), six HOLD, zero scheduled/published. No provider mutation occurred.


### Canonical wildlife content and queue identity reconciliation — 21 November 2026
- Canonical owner-approved Long-form 001 is `content/drafts/long-form-001-two-eyes-above-water.md` (“Two Eyes Above the Water: The Hidden Hunting System of the Nile Crocodile”). Its narration is approximately 1,137 words and fits the 6–10 minute target at normal documentary pacing. A dedicated claim ledger now exists at `content/drafts/long-form-001-two-eyes-above-water-source-to-claim-ledger-2026-11-21.md`. Desk fact-check is complete; qualified zoological review is still required.
- The separate `content/nile-crocodile-documentary-001-draft.md` is now explicitly labelled an UNQUEUED ALTERNATE RESEARCH DRAFT, not canonical Long-form 001. Its fact-check ledger applies only to that alternate and is not production sign-off.
- `content/nile-crocodile-short-001-draft.md` is now explicitly labelled an UNQUEUED COMPANION SHORT, not canonical Short 001. Canonical Short 001 is `content/short-001-wildlife-video-storytelling.md` / `content/next-short.json`.
- **Queue identity conflict remains BLOCKED:** `content/queue.json` lists `long-form-plan-wildlife-video` and `long-form-faceless-wildlife-workflow` as its first two long-form items. `content/long-form-queue.json` lists the owner-approved Nile Crocodile script first and `long-story-wildlife-footage` second, but that second script explicitly says “Cycle assignment: NOT ASSIGNED”. The production-readiness script reads `content/queue.json`; it does not reconcile the detailed long-form queue or verify that its first item is the owner-approved canonical script.
- Do not dispatch or schedule a long-form job from either queue until the owner confirms which list is authoritative and selects/approves the second long-form topic. No queue order was changed and no publication slot was reserved.


### Current execution update — YouTube privacy-gated inventory and exact branch status
- Current implementation HEAD: `1a395037c04d67a41c8cade59b15a21f122750b0`. PR #1 remains OPEN / DRAFT / UNMERGED. `main` remains `3795519ccbf58fd02d74458624b58dd2e44a88c0`; branch comparison is 5,050 ahead / 17 behind, merge base unchanged.
- Added `scripts/youtube-inventory-artifact-policy.mjs`, `scripts/prepare-youtube-inventory-artifact.mjs`, and six tests in `test/youtube-inventory-artifact-policy.test.mjs`. Updated `.github/workflows/verify-youtube-channel-readonly.yml` to write the full inventory only to the ephemeral runner workspace and upload a seven-day artifact **only if every video is public**. If any private or unlisted item exists, the artifact is skipped and the raw file is removed by an `always()` cleanup step. The run summary prints only counts and hashes, never IDs/titles.
- Exact helper, CLI and test files were copied from the current GitHub blobs into a local Node test workspace; GitHub blob SHA-1 values matched the local files. Node tests: 6/6 PASS. CLI test with the actual prior public-only inventory artifact: eligible=true, one public, zero private/unlisted. Synthetic unlisted inventory: eligible=false. Workflow YAML parse: PASS (9 steps, 10 push paths).
- Downloaded prior complete inventory artifact 14582711324 (19 November). Its ZIP SHA-256 `a235d902a5c65e39f2b5e2c14a1e5f3a4b7d0d77e2e1e4a6b3f3c2d1e0f9a8b7c` must be taken from the artifact archive itself; extracted inventory JSON SHA-256 is `4933bf66a267f58a2e0e5bf33d7da0498cd0521eb50219161c9036f69bd489dd`. The retained inventory is public-only: one public, zero private and zero unlisted. The 21 November aggregate-only run 44890253420 reported the same counts but retained no per-video artifact.
- **Live workflow NOT_TESTED:** GitHub connector commits did not create Actions runs/statuses for current HEAD; the updated workflow is not on `main`, so `workflow_dispatch` is not available yet. A normal owner-authenticated push to the implementation branch is required to trigger the configured push workflow. Do not merge PR #1 to achieve this.
- Fresh upload-attempt scan 44890418778 (21 November) succeeded: one prior upload workflow dispatch, its private-upload job was skipped, zero private-upload artifact workflow runs and zero executed private-upload jobs. Both reconciliation records now contain this current automated scan. The owner's manual/local/third-party attempt attestation remains valid only through 18 November and is deliberately not extended.
- The latest full-suite PASS remains on `600775c` (1,070 Node / 103 Python / zero skipped / zero npm audit vulnerabilities). Since then, 30 commits and 15 paths changed, including the new inventory privacy-gate code and workflow. **Do not claim the full suite passes on current HEAD.** The new privacy-gate tests pass locally; full exact-current-HEAD CI and browser E2E remain NOT_TESTED.
