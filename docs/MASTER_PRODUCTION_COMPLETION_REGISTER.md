# SonicVhibez master production completion register

**Scope:** first fully reviewed SonicVhibez production package and safe, verified publishing path.  
**Last inspected implementation SHA:** `c36f19a57e90b049607afacfbbcebda0c0bb358c`  
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
- WanGP source pinned to `f4cfc1259215577be9a2ee280c41efbedfb4459a`.
- Wan 2.2 TI2V 5B mirrored checkpoint and VAE pinned by revision and SHA-256.
- Exact mirror checkpoint/VAE derivative provenance is unverified; configuration correctly says `HOLD_UNVERIFIED_MIRROR_DERIVATIVE_PROVENANCE`.
- Kaggle execution is owner-started, temporary and not unattended.

Required tasks:
1. Obtain verifiable provenance and commercial-use terms for the exact checkpoint and VAE, or replace them with a WanGP-compatible source whose exact files and licence are independently verified.
2. Inspect pinned WanGP source, dependency installation and notebook execution for supply-chain risks; do not run unreviewed mutable code.
3. Owner starts the project notebook in Kaggle, enables Internet and a free GPU, and runs the pinned setup/test cells.
4. Generate a real 5-second photorealistic wildlife test shot; no cartoon, still montage or fabricated file.
5. Verify output MP4, exact model/source metadata, seed, prompt, negative prompt, file SHA-256, ffprobe report and full FFmpeg decode.
6. Import output with `scripts/import_wangp_kaggle_output.py`.
7. Human watches the complete clip and records anatomy, species, movement, continuity, artefact and realism review.
8. Retain outputs outside temporary Kaggle session storage without requiring a large local PC model cache.

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

**Verified:** GitHub Actions run [44228884555](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/44228884555) completed successfully on source SHA `4678e10369d2093d7928fc1bda06ad768542ef2f`. It installed Piper 1.8.0, passed the candidate/speaker-map tests, generated all three WAV auditions, verified the pinned model SHA-256 `f34849bce64d803d0fe90087766d5d6f2a8215a12edad43e486d77072df7dd41`, and uploaded artifact `14394291428` (`sonicvhibez-piper-australian-male-voice-auditions`). The artifact expires 2026-12-18. This is an audition only, not final narration. The owner has not yet auditioned or selected a voice.

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

**Status: BLOCKED**

Current scripts are drafts, not approved production scripts.

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

**Status: PARTIALLY VERIFIED / BLOCKED**

Historical identity and full public/private/unlisted inventory passed read-only verification on 2026-11-18, source commit `9aaffeee6b3ad75b19e92774fb1091d4209389ac`. It found one public 20-second legacy Short. The owner attested there were no other manual/local/external attempts, but the automated GitHub Actions workflow-dispatch/private-upload ledger is not yet reconciled.

Tasks:
1. Rerun read-only channel identity and complete uploads inventory against current code and credentials.
2. Inspect all pages of workflow-dispatch history, private-upload jobs, retries, uncertain outcomes and remote video IDs.
3. Reconcile owner attestation with automated ledger evidence; do not retry uncertain remote uploads.
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

## Required owner inputs (only when the corresponding gate is ready)

1. Start the free Kaggle session and run the pinned test notebook; provide the resulting package/artifact.
2. If no commercially cleared free Australian-English male voice is verified, provide a voice recording or explicitly approve a documented option.
3. Watch and approve the exact final video, captions, thumbnail, metadata, disclosures and factual claims.
4. Explicitly authorize any exact private upload job after all prior gates pass.
5. Separately authorize any public publication or unattended scheduling; existing approval does not imply it.

## Current acceptance decision

**NOT MASTER COMPLETE.** No finished Short or long-form MP4 exists in the repository media tree at the inspected SHA. WanGP GPU execution is pending; exact mirror checkpoint/VAE commercial provenance is on HOLD; the five imported Canva candidates are on HOLD; no final narration is commercially cleared; both render manifests are blocked; upload-attempt ledger reconciliation is incomplete; no exact-job private upload approval exists; no safe separate SonicVhibez Metricool brand exists; the only connected brand is Nature Frontiers SA and it contains the SonicVhibez YouTube channel ID; old Metricool brand 7545638 and its eight historically observed auto-publishing records remain inaccessible/unknown.

Do not report a percentage or call any of these tasks complete until the evidence listed above is present and independently checked.
