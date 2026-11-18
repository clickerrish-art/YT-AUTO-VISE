# SonicVhibez master production completion register

**Scope:** first fully reviewed SonicVhibez production package and safe, verified publishing path.  
**Last inspected implementation SHA:** `e7a017267cbef4efb7408f3abb595334767e1651`  
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
| Internet Archive intake v2 | Relevance filter and regression test committed; workflow rerun on current branch SHA `e7a017267cbef4efb7408f3abb595334767e1651` | PENDING workflow result |

## Outstanding work — ordered execution gates

### Gate 1 — Stabilise Internet Archive discovery

**Status: IN PROGRESS**

1. Confirm v2 GitHub Actions run on the current SHA succeeds.
2. Inspect the resulting report for wildlife relevance; report zero useful results honestly if no suitable items are found.
3. Review individual item pages and licence terms; metadata triage is not legal clearance.
4. Exclude NonCommercial, NoDerivatives, unknown, uploader-unverified and third-party-restricted material.
5. Only then consider an item for manual download and asset registration.
6. Keep download, registration, render, scheduling and publishing disabled until separate approvals.

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

**Status: BLOCKED**

Required voice profile is a natural, realistic male Australian-English voice. No final voice file or verified commercial-use permission is currently present.

Tasks:
1. Select a genuinely free voice option with documented commercial-use rights for the voice model, software and generated output, or use an owner-recorded voice track.
2. Record exact voice/model version, licence URL, licence copy, settings and source-script hash.
3. Regenerate narration from the current script; old narration evidence is stale against current script hashes and the Short narration lacks the approved exact disclosure.
4. Include the exact spoken direct-sales disclosure and clear spoken advertisement identification where required.
5. Check pronunciation, intelligibility, pacing, naturalness and Australian-English accent.
6. Run audio loudness, clipping, silence and full-playback checks.
7. Time captions against the final narration; no draft SRT is accepted as final.

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

**Status: BLOCKED / NOT STARTED**

Tasks:
1. Keep the rolling long-form → long-form → Short order and minimum 72 elapsed hours between actual publication timestamps; enforce no same Johannesburg calendar day.
2. Draft-preparation Tuesday/Saturday triggers are not publication slots.
3. Verify actual remote timestamps immediately before each scheduling/publication operation.
4. Confirm Metricool integration/account and YouTube scheduling method are actually connected and tested; repository currently has only a Metricool risk document, not a verified Metricool production integration.
5. Schedule only fully approved content and verify the remote scheduled record.
6. Publish privately first where authorized; verify video ID, channel, privacy, processing and metadata in YouTube Studio.
7. Public release requires a separate explicit owner authorization; public and unattended publishing stay disabled until that exists.
8. Verify actual publication timestamp and rolling cycle state.
9. Run read-only analytics, verify the correct video identity and report real metrics only.
10. Confirm no prohibited automated engagement, spam, duplicate distribution or artificial metric activity.

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

**NOT MASTER COMPLETE.** No finished Short or long-form MP4 exists in the repository media tree at the inspected SHA. WanGP GPU execution is pending; exact mirror checkpoint/VAE commercial provenance is on HOLD; the five imported Canva candidates are on HOLD; no final narration is commercially cleared; both render manifests are blocked; upload-attempt ledger reconciliation is incomplete; no exact-job private upload approval exists; no verified Metricool scheduling integration or remote schedule exists.

Do not report a percentage or call any of these tasks complete until the evidence listed above is present and independently checked.
