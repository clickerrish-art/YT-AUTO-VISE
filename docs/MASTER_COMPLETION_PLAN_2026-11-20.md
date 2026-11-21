# SonicVhibez — master production completion plan

**Snapshot date:** 2026-11-20  
**Channel:** SonicVhibez (YouTube only)  
**Current feature:** Long-form 001 — *Two Eyes Above the Water: The Hidden Hunting System of the Nile Crocodile*  
**Release decision:** HOLD — not renderable for commercial release and not authorized for upload.  
**Completion rule:** A task is complete only when its output exists, the exact output is independently checked, and the evidence is recorded. A passing code test, provider job status, asset-page licence summary, or generated file alone is not release evidence.

## 1. Current verified position

| Workstream | Verified position | Status |
|---|---|---|
| Documentary script | Owner-approved script exists at `content/drafts/long-form-001-two-eyes-above-water.md`; its visual plan and research map are present | PASS — script approval only |
| Scientific review | Sensory, habitat, age-related diet, ambush, tail propulsion, prey handling and human-safety claims desk-reviewed and documented at `content/assets/long-form-001-scientific-claim-review.md`; independent qualified zoologist review still required | PARTIAL — desk review complete |
| Narrator choice | Owner selected Roderic — Authoritative & Refined exclusively; Banjo rejected; no substitution authorized | PASS — choice only |
| Existing narration | One 398.083-second Roderic WAV generated on HeyGen Free for internal evaluation | HOLD — not commercially cleared |
| Roderic rights exception | Request sent to HeyGen Legal; no Legal reply in latest mailbox inspection; Support says it cannot give binding licensing confirmation | BLOCKED — external decision |
| Genuine footage | Five Pexels candidates plus three Wikimedia Commons candidates are now recorded with file-page metadata/licence leads; no MP4 source bytes acquired, hashed, decoded or visually approved | BLOCKED |
| Synthetic video | Comfy Cloud LTX-2.5 workflow v1 exists; its saved prompt is still an unrelated Arctic/polar-bear demo. Earlier generated outputs are not approved footage or final scenes | PARTIAL / HOLD |
| LTX output rights | LTX-2.x Community License and transparency requirements reviewed; exact asset provenance, model-version evidence and output-by-output disclosure review still required | PARTIAL |
| Captions | No current, verified SRT for the approved Roderic narration; timestamp data exists at provider level but no local synchronized caption artifact is verified | BLOCKED |
| Thumbnail | Direction exists (“TOO BIG?”); metadata/thumbnail direction is recorded, but no cleared final thumbnail exists | BLOCKED |
| Edit and final master | No final 6–10 minute 16:9 MP4 exists or has been verified | BLOCKED |
| Audio / visual QC | No full human listen-through, full master playback, final audio mix or exact-hash sign-off | BLOCKED |
| Rights / provenance | Render manifest has empty footage/narration licence evidence and `rightsConfirmed=false`, `complianceReviewed=false` | BLOCKED |
| YouTube identity and OAuth | Fresh read-only verification passed 2026-11-20 11:13:10Z (run 44725743866): exact channel @sonicvhibez / `UCSlkuPfHH78oGC1o418HV4w`, both required OAuth scopes and complete one-video inventory. New artifact is recorded at `content/youtube-history-refresh-2026-11-20.json`; its format is unclassified pending owner reaffirmation. Manual/local upload-attempt attestation remains stale after 2026-11-18 | PARTIAL — live identity/scopes/history pass; owner attestation and format reaffirmation pending |
| Publishing | No upload or publication authorized or verified; private-only one-shot policy remains | HOLD |
| Scheduler | Fresh complete remote inventory passed on 2026-11-20: one public 20-second video. The previous owner-reviewed record classifies the same exact ID/timestamp as a legacy Short; the fresh artifact's own format field is unclassified pending owner reaffirmation. No long-form publication exists to validate the rolling cycle; manual/local/third-party attempt attestation is stale after 2026-11-18 | PARTIAL |
| Production infrastructure | Staging state Worker exists; no SonicVhibez production publisher Worker; R2 is disabled (Cloudflare 403/code 10042) | BLOCKED |
| Durable archive | No verified permanent production archive. Temporary Comfy output URLs expire; ChatGPT Library upload previously failed for storage limit | BLOCKED |
| Branch/release controls | Implementation branch is in use; branch protection disabled; PR #1 remains draft/open/unmerged; no main-branch changes authorized | BLOCKED for repository release |

## 2. Detailed remaining work, in execution order

### P0 — preserve fail-closed safety

1. Keep YouTube public/unattended publishing disabled.
2. Keep all production manifests fail-closed while rights, assets, narration and compliance are incomplete.
3. Do not use the HeyGen Free-plan Roderic WAV in public, monetized or commercial output unless HeyGen Legal provides explicit written permission covering this voice and the existing/future WAVs, or applicable current terms clearly permit the exact use.
4. Do not use Banjo, Norman or another substitute narrator. Roderic is the exclusive owner-approved voice.
5. Do not present AI-generated wildlife scenes as authentic field footage. Apply the required synthetic/altered-content disclosure and preserve any embedded model provenance, watermark and metadata features.
6. Do not retry an uncertain YouTube upload; reconcile remote state first.
7. Keep Nature Frontiers separate from SonicVhibez. Nature Frontiers is never the YouTube destination.

### P1 — finish factual/editorial clearance

1. Extend the scientific review to Nile crocodile habitats, age-related diet, locomotion/tail propulsion, shoreline ambush, aquatic prey handling and human-safety guidance.
2. Obtain independent zoological/editorial review of the full approved narration and the final scene-to-claim mapping.
3. Record each factual claim, source, confidence, limitations and the exact scene that illustrates it.
4. Ensure no scene implies an attack, prey event, detection range, behaviour or species identity that the evidence does not support.
5. Keep the script unchanged unless the owner authorizes a revision; document any proposed factual corrections separately first.

**Required external input:** access to a qualified zoological reviewer is not currently evidenced.

### P2 — acquire and clear the visual assets

1. Acquire the original MP4s for the selected Pexels leads or obtain other genuine footage with verified commercial rights. The five current candidates remain unacquired; page metadata is not a file.
2. Record source URL, contributor, licence/terms snapshot, acquisition date, original filename, byte count, codecs, frame size, frame rate, duration and SHA-256 for each file.
3. Fully decode each source file and inspect the complete clip, not only thumbnails.
4. Verify the species and depicted behaviour visually; exclude generic crocodile clips from Nile-crocodile-specific claims unless the species is independently confirmed.
5. Reject any clip with unclear rights, visible watermark, misleading staging, unrelated people, embedded music or unsafe/graphic material.
6. Build original diagrams for head posture and sensory organs where genuine footage cannot show the anatomy accurately.
7. Decide separately whether labelled AI-generated inserts are acceptable for the edit. If used, preserve model provenance and make the synthetic nature clear on-screen and in YouTube's altered-content declaration.
8. Produce a per-asset rights ledger and have a human reviewer sign off each asset.

**Required external input:** usable source footage must be accessible to the cloud production workspace. The current retrieval tools could resolve Pexels media URLs but could not fetch their MP4 bytes. No source file is currently approved.

### P3 — clear narration without substitution

1. Obtain HeyGen Legal's written response to the existing zero-cost Roderic exception request.
2. Confirm the response covers (a) the exact public voice, (b) the existing 398.083-second WAV, (c) future Roderic generations, (d) public SonicVhibez YouTube use and monetization, and (e) duration, territory, attribution and any other conditions.
3. If Legal refuses or does not grant a clear exception, keep the existing WAV internal-only. Do not upgrade or generate with another voice.
4. Once rights are cleared, obtain the original WAV into the cloud production workspace, compute its SHA-256, inspect format/sample rate/channels/duration and perform a complete decode.
5. Listen to the entire narration and compare the spoken words against the approved script; record pronunciation, intelligibility, pacing, clipping, noise and start/end quality.
6. If the existing WAV is not word-for-word accurate or is technically defective, obtain permission before generating a corrected Roderic WAV. Generate only once from the approved text; no voice substitution.

**Required external input:** written rights decision from HeyGen Legal. No such response was present at the latest check.

### P4 — captions, sound and edit

1. Generate SRT captions from the cleared narration's timing or a verified transcription/alignment process.
2. Check every caption against the audio, punctuation, line breaks, reading speed and safe-area placement.
3. Acquire only zero-cost, commercially cleared music and sound effects; otherwise use no music and rely on cleared natural sound/voice.
4. Build the 16:9 6–10 minute edit from cleared footage, accurate diagrams and the approved narration. Do not loop or stretch short clips to fake runtime.
5. Use restrained transitions, clear story pacing, consistent colour and audio levels; no shock editing, fake animal encounters or misleading thumbnail composites.
6. Use explicit 1280×720 Comfy run overrides when using the saved LTX workflow; its 0.9 MP preset reference table produces 1280×736. The saved default prompt is not the approved crocodile prompt.
7. Keep a shot-to-script and asset-to-rights mapping for every shot.
8. Export the final MP4 and a separate thumbnail; record SHA-256 for both.

### P5 — final quality and compliance acceptance

1. Probe final file metadata and fully decode video and audio with FFmpeg/FFprobe.
2. Verify target duration, 16:9 frame, frame rate, audio stream, sample rate, loudness/true peak, no clipping, no unintended silence, black frames or broken transitions.
3. Inspect all frames/sections at full resolution and play the complete video from beginning to end.
4. Listen to the entire audio and compare every word against the approved script; verify captions against the audio.
5. Verify animal anatomy, species, behaviour, environment, factual claim alignment, animal-welfare treatment, AI disclosure, provenance, rights and attribution.
6. Review thumbnail/title/description/tags for truthfulness and policy compliance.
7. Record reviewer, date, exact final video hash, exact thumbnail hash, checklist result and explicit owner approval. Any file change invalidates the prior hash-bound approval.

### P6 — durable storage and recovery

1. Owner enables Cloudflare R2 in the account dashboard; the API currently returns error 10042 because R2 is disabled.
2. After enablement, recheck access and inspect pricing/free-tier boundaries before creating any resource. Do not create a billable bucket or exceed free limits without approval.
3. Create a private archive with least-privilege access, versioning or immutable originals, metadata and SHA-256 manifest.
4. Store original assets, licences, narration, captions, project files, final exports, thumbnails, QC evidence and publication receipts.
5. Test retrieval and restore from the archive; hash-compare restored objects with originals.
6. Until R2 is enabled, do not claim permanent cloud archive. Temporary signed Comfy URLs are not durable storage.

**Required owner input:** enable R2 in the Cloudflare Dashboard. No R2 bucket can currently be created or verified.

### P7 — YouTube identity, upload and publication

1. The fresh read-only YouTube identity/scope/history verification passed on 2026-11-20 11:13:10Z (run 44725743866): both required scopes, exact channel `@sonicvhibez` / `UCSlkuPfHH78oGC1o418HV4w`, and one public 20-second video. Inventory evidence is recorded at `content/youtube-history-refresh-2026-11-20.json`.
2. Owner must reaffirm the existing Short classification for the fresh inventory; the new artifact itself marks format unclassified, although its exact video ID/channel/visibility/publishedAt/duration match the previously owner-reviewed Short record.
3. Obtain an updated owner attestation covering any manual, local, third-party or external YouTube upload attempts since 2026-11-18. If any occurred, reconcile each exact remote video ID and timestamp before another upload.
4. Re-fetch the complete paginated public, private and unlisted channel history before upload if material time has passed or any upload attempt occurred. Compare against the owner-reviewed reconciliation.
5. If a future read-only OAuth check fails with `invalid_grant` or the upload scope is absent, the owner must reauthorize the existing OAuth client and securely update the GitHub Actions `YOUTUBE_REFRESH_TOKEN` secret. Never paste credentials into chat.
6. Reconcile all local jobs, GitHub workflows, provider uploads, uncertain upload attempts and remote video IDs. Do not blind-retry uncertain uploads.
5. Reconcile the queue and actual history against the owner-approved cadence: rolling `long_form → long_form → short`, Africa/Johannesburg, at least 72 elapsed hours between actual publications and no two publications on the same Johannesburg calendar day. The minimum three-item cycle is 216 hours; do not force a weekly cadence.
6. Confirm the final artifact, metadata, thumbnail, captions, rights and owner review hashes match the one-shot upload authorization.
7. Perform only the exact authorized private upload; verify remote video ID, channel, final privacy and remote metadata. Do not enable public/unattended publishing.
8. Only after the owner separately authorizes public release, publish and verify the public URL and actual publication timestamp.

**Required owner input:** updated owner attestation for manual/local/third-party upload attempts after 2026-11-18 and reaffirmation of the sole video's Short classification. The latest live OAuth and remote inventory check passed; reauthorization is conditional only if a later check fails.

### P8 — production infrastructure and repository release

1. Resolve R2 activation or choose an explicitly approved zero-cost durable alternative.
2. Align staging OIDC trust to the current implementation branch/workflow only after owner/admin review; do not trust an old unprotected ref.
3. Build and verify the dedicated SonicVhibez production publisher Worker and runner D1 operational state; staging state Worker is not a production publisher.
4. Keep dispatch and publishing disabled until all secrets, scopes, channel, rights and authorization gates pass.
5. Owner/admin enables branch protection and required checks.
6. Complete GIT-002 semantic review of branch divergence and preserve all protected tests/history. Do not merge, close, mark PR #1 ready, rebase, reset, force-push or modify `main` without explicit separate authorization.

## 3. Owner inputs that cannot be fabricated or performed without the owner/provider

1. **HeyGen Legal:** written zero-cost commercial-use decision for Roderic. The request has been sent; the response is outstanding.
2. **Cloudflare:** enable R2 from the account dashboard; no R2 resource has been created.
3. **Comfy Cloud:** free GPU capacity must be available again before a new LTX generation. No paid partner model or paid GPU workaround is permitted.
4. **YouTube:** reauthorize the OAuth client and update the refresh-token secret securely; no credential should be shared in chat.
5. **Source media:** make genuine, commercially usable footage available to the cloud workspace, or provide an accessible source/download route. Current Pexels leads are not downloaded.
6. **Human approval:** full narration listen-through, complete video playback, final rights/compliance review and exact-hash approval after files exist.
7. **Repository/account admin:** branch protection, production Worker and any infrastructure-level settings requiring owner/admin authorization.

## 4. Immediate execution queue

| Order | Task | Can be executed now? | Completion evidence |
|---|---|---|---|
| 1 | Scientific sensory-claim review | Completed | Verified review file and branch commit |
| 2 | Complete remaining species/ecology/behaviour/safety source checks | Partially | Claim matrix with sources and limitations |
| 3 | Reconcile voice-policy records so no stale candidate can be mistaken for approval | Yes, documentation and safe config review | Exact branch diff and tests |
| 4 | Recheck HeyGen Legal response | Yes, read-only | Full thread contents |
| 5 | Recheck Comfy workflow settings and free generation capacity | Read-only only until quota available | Workflow snapshot and quota evidence |
| 6 | Acquire footage | Not with current media-host retrieval access | Source bytes, hashes, full decode, human review |
| 7 | Clear Roderic commercial rights | No — external Legal decision | Written permission |
| 8 | Create captions, edit and final render | Blocked by cleared narration and footage | Verified files and exact hashes |
| 9 | Final human QC and owner approval | Requires completed media and owner review | Signed hash-bound review |
| 10 | R2 archive and restore test | Blocked by owner enabling R2 | Private bucket, stored hashes and successful restore |
| 11 | YouTube private upload verification | Blocked by OAuth/channel/history/approval | Remote video ID, privacy and reconciliation |
| 12 | Production publisher, scheduler and public release | Blocked by infrastructure and separate authorization | Live provider evidence; no CI-only claims |

## 5. Current release decision

**HOLD.** The approved script and partial research review are useful completed work, but there is no cleared long-form source footage, no commercially cleared Roderic narration, no current captions, no final edit, no completed human QC, no durable archive and no accepted live YouTube OAuth/history evidence. The production system must not label the documentary 100% complete or publish it until these exact gates are closed.

This plan records the work and blockers; it does not itself change any release flags, grant licences, authorize spend, or enable publication.


## Verified execution updates — 20 November 2026

These updates were executed on `codex/marketing-machine-audit-fixes`; `main` was not modified.

1. **Scientific claim review expanded.** The evidence note now covers the script's sensory system, Nile crocodile habitats and age-related diet, shoreline ambush, tail propulsion, prey handling and CSG safety advice. It preserves the experimental limits of the 2015 and 2025 studies. The exact file was read back from GitHub after commit `4d47261e3aad268cc6dd95c9a28586db1b3d603a`. Independent zoological sign-off is still outstanding.
2. **Footage research expanded.** Three Commons candidates were added to `content/assets/long-form-001-footage-sourcing.md`: a 21-second 4K Nairobi National Park clip (CC BY-SA 4.0), a 15-second Kruger feeding clip (CC BY-SA 2.0), and a 66-second wildebeest ambush clip (CC BY 3.0). They remain unacquired and unapproved. ShareAlike obligations and graphic-content risk are explicitly recorded.
3. **YouTube metadata draft prepared.** `content/long-form-001-youtube-metadata-draft.md` now contains a factual description, tags, research references, thumbnail direction, and explicit AI/paid-promotion/rights/upload gates. It is not final upload metadata.
4. **Narrator-policy drift corrected.** `config/narration-voice-candidates.json` now records the exclusive Roderic decision and Norman as historical only. `docs/NARRATION_VOICE_CLEARANCE.md` is marked superseded. The American/Norman and Banjo audition workflows have job-level `if: false` guards. The American narration workflow was observed as **skipped** on the earlier configuration push (run `44724864981`). The runner bridge safety job passed on the latest metadata-draft commit (run `44725167830`); this does not constitute narration generation or release approval.
5. **Deployment recovery smoke passed** on the configuration push (run `44725019030`): checkout, Node setup, locked dependency installation and persistent-state replacement/restart verification all succeeded. The latest metadata-draft commit has its own deployment recovery run still in progress at this snapshot.
6. **Master completion plan** and scientific review were both read back from GitHub after creation/update. File readback verifies their stored content and blob hashes; it does not replace full media QA.

### Latest repository state at this snapshot

- Implementation branch: `codex/marketing-machine-audit-fixes`, HEAD `95d1b3d70f6559b845557c533b163da8657c025b` at this plan update.
- `main`: `7efc548065385051f7c69377f87b77a35065ce74` (advanced independently; no main-branch write was made in this work).
- Non-destructive compare: **4,751 commits ahead / 10 behind / 300 changed files**. No rebase, merge, reset, force-push or history reconciliation was performed.
- PR #1 remains **OPEN / DRAFT / UNMERGED**.
- Branch protection is disabled on both refs at the time of this read (`protected=false`); owner/admin action is required.
- Latest content/config/test changes include commit `0718b05c7b61cccafabdd00c3bb8b5fc7f702909` (corrected a stale cadence test assertion) and `a96ecfdbb6962be381acb407dcc71921f7370b30` (corrected stale OAuth/history note). The read-only verification workflow was updated in `95d1b3d70f6559b845557c533b163da8657c025b` to re-run on long-form manifest/metadata changes. The earlier full Node suite on commit `39e0e0cb95d5319778f6381ac07cd58c8f933e35` completed with **1,040 passed / 1 failed**: only `test/queue-cadence.test.mjs` failed because the test expected a weekly target in the operational queue, while the queue correctly has `weeklyTarget: null`. That test was corrected to assert the rolling-cycle contract. A final full-suite rerun is required on the latest test fix. Do not infer pass from the previous run.

### Newly explicit unresolved controls

- `content/long-form-render-manifest.json` currently has `hasPaidPromotion=true`, while the approved narration contains no sponsorship segment. Do not change the manifest or YouTube disclosure until the owner confirms whether the final video contains any paid sponsorship/product placement.
- The saved Comfy workflow is still v1 with the unrelated Arctic/polar-bear default prompt. Its resolution reference table's 0.9 MP preset is 1280×736; use explicit 1280×720 per-run overrides. No new generation was submitted because free GPU capacity was previously exhausted.
- Comfy's existing completed job status and output link do not establish visual quality or durable storage. Earlier synthetic clips remain unreviewed.
- The TinyFish wallet reports a negative balance; no paid browser automation, fetch, research or top-up was used. This is not a zero-cost asset-acquisition route.
- Cloudflare R2 remains disabled (403/code 10042); no bucket or archive was created.
- HeyGen Legal has not replied. The Free-plan Roderic WAV remains internal-evaluation-only.


### YouTube readiness evidence correction (2026-11-20)

An earlier draft of this plan incorrectly treated an older `invalid_grant` attempt as the latest OAuth state. The repository evidence was rechecked and that statement has been corrected:

- Previous successful read-only verification: run `44632065508`, 2026-11-19 22:48:58Z. It was superseded by the fresher 2026-11-20 run `44725743866` recorded below.
- The sole remote video is public, 20 seconds, published 2026-10-22T15:05:56Z. The owner reviewed and accepted it as a historical Short; it is a legacy exception to the current 50–60-second Short specification.
- The reconciliation document is marked complete and matches the remote video ID, channel, visibility and timestamp.
- The owner attestation for manual/local/third-party upload attempts is only valid through 2026-11-18. Attempts after that date are not attested; this is a hard hold before another upload.
- Latest production-readiness workflow run `44712917611` (2026-11-20 09:41:57Z) failed with **17 non-OAuth blockers**. It confirmed the four YouTube secrets were configured but did not perform a fresh live OAuth refresh. It reported missing short and long-form media, captions, rights/compliance evidence, metadata approval, exact-hash quality approval, rendered MP4, and stale/incomplete local/workflow/owner upload-attempt reconciliation. It did not attempt an upload or metadata write.
- The read-only verification workflow now also triggers when `content/long-form-render-manifest.json` or `content/long-form-001-youtube-metadata-draft.md` changes. Its result must be inspected before any upload; a successful read-only check is still not upload authorization.


### Latest fresh YouTube inventory (2026-11-20 11:13 UTC)

- Read-only workflow run `44725743866` passed; all steps succeeded, including deterministic scope/identity tests, live authenticated channel verification and complete uploads-playlist pagination.
- Channel identity and both required scopes passed. The channel's display title is `SonicVibes`; its exact handle is `@sonicvhibez`; ID is `UCSlkuPfHH78oGC1o418HV4w`.
- Inventory: one public video, zero private, zero unlisted. The video is `LjePS02hA1o`, `PT20S`, published `2026-10-22T15:05:56Z`. The new artifact labels its format unclassified; its ID/channel/visibility/publishedAt/duration match the prior owner-reviewed Short record. Reaffirm the classification before using it in cadence calculations.
- Artifact `14623951721` is retained for seven days. ZIP SHA-256: `f311a9e989ae7b121dec09bf1ee8cdeaee77c9b8dbdcc2914045f8b87a1672e8`; JSON SHA-256: `0dd1fad51ee1ecc2f5ae192fc2d42fc94d93657198c310e9f5ad7f0ad904e316`.
- No upload, metadata write or publishing state change occurred.
- The remaining YouTube history blocker is the stale owner attestation for manual/local/third-party attempts after 2026-11-18, plus owner reaffirmation of the format classification. The 2026-11-20 readiness report's 17 blockers remain otherwise unresolved.


## Exact-HEAD verification update — 2026-11-20 11:17 UTC

The implementation branch and PR #1 head were re-read from GitHub immediately after workflow completion.

- PR #1 remains OPEN / DRAFT / UNMERGED, base `main`, head branch `codex/marketing-machine-audit-fixes`.
- Exact PR head SHA: `eb3ee0c78fc3896eec7b88e79dc4782dce3b4f6d`. This matches the code commit checked out by the completed Node validation run `44725961752`.
- Workflow job `136253334705` completed successfully. Its log explicitly reports **1,041 Node tests passed, 181/181 test files passed, 0 failed, 0 skipped**.
- The same job confirms clean locked `npm ci`, successful schedule and campaign validation, and JavaScript syntax checks.
- Schedule validation output explicitly says the 72-hour/rolling-cycle checks are local validation only and do not query YouTube. Remote history and uncertain-upload reconciliation remain independent production gates.
- Current compare against `main`: **4,756 commits ahead / 10 behind**, status `diverged`; compare endpoint returns a capped 300-file listing. Main SHA is `7efc548065385051f7c69377f87b77a35065ce74`; merge base is `45352b73bb6cc4787b2a49988b575afb754ab627`.
- No merge, rebase, reset, force-push, history rewrite, or main-branch modification was performed.
- This update verifies the Node validation gate only. It does not clear the production readiness HOLD, complete other runtime/acceptance gates, or authorize any upload/publication.


## Further exact-branch verification — quality gates and current external blockers

### Quality gate source and test verification

- Inspected `docs/PRODUCTION-QUALITY-ENFORCEMENT.md`, `scripts/production-quality-scorecard.mjs`, `scripts/production-quality-approval.mjs`, `scripts/validate-production-quality-approval.mjs`, both renderers, and `scripts/upload-private.mjs`.
- The release scorecard enforces eight dimensions, each at least 80/100, unweighted mean at least 85/100, mandatory critical gates, full-video playback evidence, mobile/desktop image inspection, factual/editorial evidence, timezone-aware review freshness, and SHA-256 bindings for video, metadata, thumbnail, captions, narration and all related images.
- The long-form and Short renderers validate exact export and audio bytes. If a production-quality approval path is configured, they also invoke the final approval validator; otherwise they label output provisional and explicitly NOT approved for release.
- The private uploader independently revalidates the scorecard, technical receipt, exact artifact hashes, retained rights evidence, private-only state and separate one-shot authorization before any live insert. The one-shot authorization check is executed before the remote `youtube.videos.insert` call and rejects reuse of an authorization ID.
- Exact Node run `44725961752` included `test/production-quality-scorecard.test.mjs`, `test/production-quality-approval.test.mjs`, `test/validate-long-form-export.test.mjs`, and `tests/upload-private.test.mjs`; the full suite passed 1,041/1,041 with zero failures/skips.
- This verifies the code-level quality and private-upload safety checks. It does not create real media, prove a reviewer actually watched it, or satisfy the human review/rights requirements.

### Readiness artifact inspected

- Read-only readiness run `44712917611`, artifact `14617469583`, created 2026-11-20 09:42 UTC; artifact SHA-256 `33943d87fdd0a6f2bda1f4993b1a187e70c962a62847a2130bec5ca4dd91ee7e`.
- Its report records 17 blockers: missing Short footage/narration, missing long-form footage/narration/captions, missing source and narration rights evidence, missing rights/compliance confirmations, unreviewed metadata, missing exact-hash-bound quality approval, missing final Short MP4, and stale/incomplete upload-attempt reconciliation.
- The report says all four YouTube secret names are configured. This is presence-only evidence, not proof that credentials are valid or that a private upload is authorized.
- This report predates the later 11:13 UTC read-only YouTube inventory run; use the newer inventory evidence for channel identity/scopes/history, but retain the separate owner attestation and upload-attempt reconciliation gate.

### Comfy Cloud and narration rights rechecked

- Comfy Cloud currently lists two saved workflows. `SONICVHIBEZ LTX WILDLIFE VIDEO` remains saved as workflow `889333a8-ed73-402a-b5d9-1e2bd491a6ce`, version 1, graph format, seven nodes.
- The saved prompt is still an Arctic hunter/polar-bear demo; the workflow is not permanently configured for the Nile crocodile documentary. Its per-run prompt input is editable, but no saved-workflow update action is available in the connected toolset. Do not claim the permanent prompt is fixed.
- No new generation was submitted. Prior free GPU quota exhaustion remains the last known constraint; do not spend credits or start a paid run.
- Gmail was rechecked for the HeyGen Legal thread `1a1f841532f681a1`. It contains the owner's 2026-11-20 09:19:52 UTC request only; no Legal reply is present. Free-plan Roderic narration remains blocked from commercial release pending written permission.


## Security hardening in progress — signed one-shot upload authorization

A source review found that the previous live one-shot authorization checked the operator name, job/media/metadata/approval/channel hashes, privacy state and timestamp, but did **not** cryptographically authenticate the authorization record. A privileged repository writer could therefore forge the JSON record and its plain-text operator field. This was a material authorization-integrity weakness.

Changes now committed on the implementation branch:

- `1987a3b2a202982d03f4776d9febef5a4492b781`: live private-upload path now requires a base64-encoded Ed25519 public key and verifies a signature over the canonical one-shot authorization fields before the remote insert.
- `c964e138147c27fc5421b233d1baee62768194fe`: added `scripts/sign-youtube-upload-authorization.mjs`, which signs a fresh record locally with the owner's Ed25519 private key, writes atomically, refuses symlinked paths/re-signing, and never prints or stores the private key.
- `b40e100dbfb84c8794abf6a42fd8a562ba484541`: added tests for valid signature, mismatched/tampered record, missing key/signature, expiry, and atomic signer behavior.
- `82f73080b37f4766a04aaae7397bbd650d232190`: documented the public-key environment variable in `.env.example`.
- `6c94a3a74b52bba223fb01a6b325ca148a34000c`: added `docs/YOUTUBE-PRIVATE-UPLOAD-AUTHORIZATION.md` with key-generation, storage and signing instructions.

**Status: IMPLEMENTED IN SOURCE; NOT YET TEST-VERIFIED.** The current GitHub connector exposes no workflow-dispatch action, and these connector-authored commits have no reported CI status checks. Do not treat the new signature gate as verified until `.github/workflows/validate.yml` is manually dispatched against the current branch or an equivalent exact-head CI run passes. Do not attempt any live upload until the owner creates and securely retains an Ed25519 key pair, configures `YOUTUBE_UPLOAD_AUTHORIZATION_PUBLIC_KEY_B64`, and all production readiness gates pass.

The owner private key must never be sent in chat, committed, uploaded to the repository, or installed on a worker. The public key is safe to configure; the matching private key remains owner-controlled. This security change does not authorize an upload.


## Nature Frontiers / Metricool read-only verification — 2026-11-20

- Metricool currently returns one brand: **Nature Frontiers SA**, brand ID `8094526`, timezone `Africa/Johannesburg`, Facebook Page ID `1431329126735709`, Instagram account `naturefrontieers2026`.
- The same Metricool brand also exposes YouTube channel ID `UCSlkuPfHH78oGC1o418HV4w`, which is the verified SonicVhibez YouTube channel. This is a cross-brand destination-mapping risk: **do not schedule or publish SonicVhibez content through the Nature Frontiers Metricool brand, and do not treat that YouTube connection as a Nature Frontiers destination.** Correct the account mapping only through an owner-approved Metricool account action.
- Read-only scheduled-post query for 2026-11-20 through 2026-12-20 (Africa/Johannesburg) returned zero scheduled posts.
- This endpoint exposes only future scheduled posts. It does not reconcile the eight previously identified historical records with `draft=false` and `autoPublish=true`; those remain unresolved. No Metricool post, setting, connection or campaign was changed.
- Nature Frontiers remains separate from SonicVhibez. Keep its publishing disabled/dry-run/emergency-stop defaults and do not enable auto-publishing until the historical records and approval state are independently reconciled.


## Execution addendum — 2026-11-21 (supersedes earlier snapshot statements)

This addendum is the current status correction for the 2026-11-20 plan. Historical statements above remain an audit trail and must not override the determinations below.

### Verified work completed on 2026-11-21

1. **HeyGen Roderic rights decision is no longer pending.** Support replied in writing and denied a zero-cost commercial-use exception for both existing and future Roderic Free-plan outputs. The decision is recorded in `content/heygen-roderic-commercial-rights-determination-2026-11-21.json`; the long-form and Short manifests and narration status record point to it. Keep all Free-plan Roderic audio internal-only. No paid upgrade is allowed and no alternative narrator is authorized. This is an external blocker, not a task that can be cleared by another local test.
2. **Alternate narrator workflows are fail-closed.** Job-level `if: false` guards were added and read back for the Piper audition, Edge TTS long-form audition, Edge TTS short/queue audition, and Edge TTS short artifact workflows. The existing American/Norman and Banjo audition workflows were already disabled. This closes the known repository workflow routes for unapproved voice generation on this branch; it does not establish a commercially eligible narrator.
3. **Short footage evidence is correctly classified.** Pexels rights research and acquired preview bytes are reference-only and explicitly excluded by the original creator-captured-media requirement. `content/render-manifest.json` no longer presents the Pexels license record as production footage-license clearance. Its script and caption source pins now match the exact current Git blob SHAs.
4. **Long-form script and scientific review are pinned.** The current script revision is `f4949a62c1235867ab7565ba43c3cfe97efae297`; the scientific desk-review file is `5c794a85fdec74bafb14b832d366edda12007ffb`. The 2025 *Biology Open* primary study is explicitly limited to young captive Nile crocodiles tested in controlled conditions; it is not presented as proof of adult wild hunting behaviour. The long-form manifest pins both exact blob SHAs.
5. **Comfy workflow is disqualified for production.** The saved five-second Arctic hunter/polar-bear text-to-video demo has no original-footage input and is not a production asset source. The disposition is recorded at `content/comfy-workflow-production-disposition-2026-11-21.json`. No generation or GPU spend occurred.
6. **Metricool remains read-only and unresolved.** Current brand 8094526 settings read returned Facebook and Instagram connections, with no YouTube channel listed in that response; this alone does not prove the prior mapping was disconnected. The legacy brand 7545638 remains inaccessible (403). No provider mutation was performed. The eight historical auto-publish records and reported 20 drafts remain unreconciled pending access/provider response.

### Current production gate status

| Gate | Status | Exact reason |
|---|---|---|
| Original wildlife source media | BLOCKED | No admissible original creator-captured footage package with source provenance, file hashes and rights evidence is present. Pexels is reference-only and excluded. |
| Commercial narrator | BLOCKED | HeyGen denied the zero-cost Roderic commercial exception; no other narrator is owner-approved. |
| Long-form 001 | BLOCKED | Footage and commercial narration are missing; no final captions, 6–10 minute master, thumbnail, full playback or exact-hash approval. |
| Short 001 | BLOCKED | Existing Pexels preview is reference-only; Roderic audio is non-commercial; no final edit, synchronized release captions, thumbnail or approval. |
| Independent zoological review | NOT_TESTED | Desk review is documented; qualified independent review of the complete narration and final scene mapping remains outstanding. |
| Metricool legacy reconciliation | BLOCKED | Brand 7545638 access denied; provider confirmation of brand 8094526 mapping is absent. |
| YouTube OAuth/history freshness | NOT_TESTED | Last successful complete inventory was 2026-11-19; local/manual/third-party upload attestation is stale after 2026-11-18. Recheck before any upload. |
| Publication cycle | BLOCKED | Only one pre-cycle legacy 20-second Short is verified; no post-approval long-form publications exist. |
| Durable archive | BLOCKED | Cloudflare R2 was previously disabled (error 10042); no verified permanent archive or restore exists. |
| Production publisher | BLOCKED | No verified SonicVhibez production publisher Worker or operational production runner state. |
| Dashboard/API/software acceptance | PARTIAL / STALE | Prior exact-SHA tests exist, but no full current-head regression or live production acceptance was run after today's repository changes. |
| Git/release controls | HOLD | Branch remains diverged; no main writes, merge, rebase, reset, force-push or PR state changes. |

### Owner/provider inputs still required

- Original creator-captured wildlife MP4s and creator/source provenance plus explicit commercial-use permission.
- A zero-cost commercial-use path for Roderic confirmed in writing by HeyGen, **or** the owner's explicit change to the Roderic-only narrator rule. Current provider decision is denial.
- Owner access/export for Metricool legacy brand 7545638 and provider confirmation of the YouTube mapping for brand 8094526.
- Updated owner attestation for any manual, local, third-party or out-of-band YouTube upload attempts since 2026-11-18; if any exist, exact IDs/timestamps must be reconciled.
- Fresh authenticated YouTube identity, OAuth scopes and complete paginated public/private/unlisted inventory before any future upload.
- Cloudflare account owner/admin to enable R2 or approve another genuinely zero-cost durable archive route after terms/limits are checked.
- Independent qualified zoological review and exact-hash human review of final media.
- Production account/admin inputs for a dedicated publisher Worker, D1 runner state, current OIDC trust and branch protection; none may be fabricated or enabled without account authority.
- Exact one-shot private-upload authorization only after all production gates pass; separate explicit public-release authorization remains required.

**No release state changed:** public/unattended publishing remains disabled, manifests remain fail-closed, no media was rendered, no provider mutation was made, and no paid service or GPU generation was used.


### Additional execution — brand-separation and rights regression hardening (2026-11-21)

7. **Nature Frontiers YouTube route removed from repository configuration.** The Facebook and Instagram approved-destination lists no longer include the NatureFrontiers-life YouTube subscription URL. The Nature Frontiers post-link catalogue no longer defines a YouTube destination and now explicitly sets `youtubePublishingAllowed=false`. The brand is Facebook/Instagram-only; SonicVhibez remains the sole YouTube brand. Config commits: `26e9e03749c9478fd85c38e370c362b9f375a32a`, `db6ea2245adb3d7d8cddc4c46d6a1673cc5cbc67`, `e3086ab98548baa2ffc163448cef312d7d116576`.
8. **Brand-separation regression tests added.** `test/nature-frontiers-brand-separation.test.mjs` asserts no YouTube destinations or SonicVhibez channel ID in Nature Frontiers configs, and that safe publishing defaults remain intact. Test file commit: `0766fa508aed6e72b8e0fb4ab87c4bd1a8cd5a4f`.
9. **Production-rights fail-closed regression tests added.** `test/production-rights-fail-closed.test.mjs` pins the long-form script/scientific-review and Short script/caption Git blob hashes, verifies Pexels exclusion, checks the HeyGen denial and checks all six known alternate narration workflows are disabled. Test file/fix commits: `b90c5814b3fb8450c32a4de37339b60c3ea21678`, `953b20f46a5c7f6c4f5b49ea2cfd9646c64d2c81f`, `2d2f7907df11e6939623f2973b3b8eb2e2efc81f`.
10. **Read-back assertions passed.** The current three Nature Frontiers configs contain no YouTube URLs or SonicVhibez channel ID; all publishing/dry-run/emergency-stop defaults remain safe. Long-form and Short manifest pins match the current script/caption/scientific-review blob SHAs. All six alternate narrator workflow jobs have job-level `if: false` guards. Both added test files passed local `node --check` syntax checks from copied source. The full repository Node suite has **not** been run on this head: the connected GitHub actions interface exposes no workflow-dispatch action, and the latest commit-run lookup returned no PR-triggered runs. Do not label these tests runtime-passed until a full current-head CI run is available.

**External Metricool status is unchanged:** removing the Nature Frontiers YouTube link from repository config does not alter the live Metricool account. The current settings read and legacy brand access limitations remain as described above. No provider settings, posts or connections were changed.


### Additional execution — wildlife-media policy reconciliation (2026-11-21)

11. **Corrected stale SonicVhibez imported-media policy.** The five imported Canva/Pexels assets were already excluded, but their exclusion reason incorrectly said the active production path was realistic AI-generated scenes. The inventory now explicitly states that genuine original creator-captured wildlife media is required and both generic stock and AI-generated wildlife visuals are prohibited as substitutes. All five remain quarantined, with no rights or release clearance claimed. Commit: `81e8dfd3d68eaa5ab1ddfe0f9a540f8894940a22`.
12. **Quarantined all Nature Frontiers stock-register entries.** The 92-entry register contains 85 Pexels and seven Pixabay listings, zero local source files, zero approved entries, and zero scheduled/published uses. Every asset is now marked reference-only and ineligible under the original creator-captured-media policy. Rights assessment fields remain unchanged (not assessed); the update does not falsely mark rights as cleared or rejected. Commit: `7ea794bcb882bfe36510b8c41586f9a0d562c881`.
13. **Corrected Short 001 acquisition disposition.** The four previously selected/acquired Pexels clips are retained as historical/reference-only acquisition evidence, not production footage. Each is explicitly excluded under the original-media policy. Commit: `b0d45f89ab3fddedb2aff48e4a552e4a3a3565dc`.
14. **Extended regression coverage.** The production fail-closed test now asserts all Nature Frontiers Pexels/Pixabay records and Short 001 Pexels clips remain reference-only and ineligible. Commit: `5b45b3803e0b273579dab5cc5b68bf2ca84aa062`.

**Verification:** GitHub read-back confirmed five SonicVhibez imported assets excluded, all 92 Nature Frontiers stock listings excluded, all four Short 001 Pexels clips excluded, and zero Nature Frontiers assets marked scheduled or published. The existing rights/inspection state was preserved. Full repository runtime tests remain NOT_TESTED on this head.


### Git safety incident — explicit disclosure (2026-11-21)

Four sequential updates to historical stock-source rights-review JSON files were accidentally submitted without a branch parameter. The GitHub connector defaults an omitted branch to `main`. These four commits therefore landed on `main`:

- `ae3200a9ef9b4877fafaf246c5640b851ec712e9` — Pexels crocodile rights-review record.
- `c1e5c0713c67b196153615e73f2defd8cce11517` — Wikimedia Kruger tilapia record.
- `450aef056c429ffda10865c0a0b24dea3de82be9` — Wikimedia Nairobi crocodile record.
- `3795519ccbf58fd02d74458624b58dd2e44a88c0` — Wikimedia wildebeest ambush record.

Read-back confirmed those four records changed on `main`; their corrected counterparts were then separately committed and verified on `codex/marketing-machine-audit-fixes`. No other files were intentionally written to `main` in this incident. I did not attempt a rollback, reset, rebase or history rewrite. **No further writes to `main` will be made.** Any remediation of these four default-branch commits requires an owner-approved normal GitHub process.

Latest comparison: main head `3795519ccbf58fd02d74458624b58dd2e44a88c0`; implementation branch is 4,872 commits ahead / 17 behind, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`.

**Immediate default-branch risk:** `.github/workflows/acquire-noaa-broll-candidates.yml` still exists and is enabled on `main` (scheduled Tuesday and manual triggers). The branch copy has been disabled, but PR #1 remains unmerged, so the branch correction does not disable the default-branch workflow. The connected GitHub actions tools expose no workflow-disable operation, and no main-branch write will be attempted. A repository owner must disable that workflow in GitHub Actions or approve a safe branch/PR remediation. This is a release blocker.
