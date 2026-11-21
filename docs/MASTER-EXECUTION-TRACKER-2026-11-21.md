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
