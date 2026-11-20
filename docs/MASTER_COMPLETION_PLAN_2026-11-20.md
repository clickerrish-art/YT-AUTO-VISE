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
| Scientific review | Sensory-system claims reviewed and evidence note committed at `content/assets/long-form-001-scientific-claim-review.md`; ecology, locomotion, feeding and safety claims still need independent review | PARTIAL |
| Narrator choice | Owner selected Roderic — Authoritative & Refined exclusively; Banjo rejected; no substitution authorized | PASS — choice only |
| Existing narration | One 398.083-second Roderic WAV generated on HeyGen Free for internal evaluation | HOLD — not commercially cleared |
| Roderic rights exception | Request sent to HeyGen Legal; no Legal reply in latest mailbox inspection; Support says it cannot give binding licensing confirmation | BLOCKED — external decision |
| Genuine footage | Five Pexels candidates are sourcing leads only; no MP4 source bytes acquired, hashed, decoded or visually approved | BLOCKED |
| Synthetic video | Comfy Cloud LTX-2.5 workflow v1 exists; its saved prompt is still an unrelated Arctic/polar-bear demo. Earlier generated outputs are not approved footage or final scenes | PARTIAL / HOLD |
| LTX output rights | LTX-2.x Community License and transparency requirements reviewed; exact asset provenance, model-version evidence and output-by-output disclosure review still required | PARTIAL |
| Captions | No current, verified SRT for the approved Roderic narration; timestamp data exists at provider level but no local synchronized caption artifact is verified | BLOCKED |
| Thumbnail | Direction exists (“TOO BIG?”); no cleared final thumbnail exists | BLOCKED |
| Edit and final master | No final 6–10 minute 16:9 MP4 exists or has been verified | BLOCKED |
| Audio / visual QC | No full human listen-through, full master playback, final audio mix or exact-hash sign-off | BLOCKED |
| Rights / provenance | Render manifest has empty footage/narration licence evidence and `rightsConfirmed=false`, `complianceReviewed=false` | BLOCKED |
| YouTube identity and OAuth | Latest production-readiness evidence reports live OAuth refresh `invalid_grant`; upload scope, channel identity, full history and upload-attempt reconciliation are not accepted | BLOCKED |
| Publishing | No upload or publication authorized or verified; private-only one-shot policy remains | HOLD |
| Scheduler | Local queue readiness is tested; actual remote publication timestamps and complete YouTube history gate are not verified | PARTIAL |
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

1. Owner reauthorizes the existing YouTube OAuth client and securely updates the GitHub Actions `YOUTUBE_REFRESH_TOKEN` secret; never paste credentials into chat.
2. Verify the token has the required upload scope and independently verify the exact SonicVhibez channel identity. Do not guess the channel ID.
3. Fetch the complete paginated public, private and unlisted channel history and remote publication timestamps.
4. Reconcile all local jobs, GitHub workflows, provider uploads, uncertain upload attempts and remote video IDs. Do not blind-retry uncertain uploads.
5. Reconcile the queue and actual history against the owner-approved cadence: rolling `long_form → long_form → short`, Africa/Johannesburg, at least 72 elapsed hours between actual publications and no two publications on the same Johannesburg calendar day. The minimum three-item cycle is 216 hours; do not force a weekly cadence.
6. Confirm the final artifact, metadata, thumbnail, captions, rights and owner review hashes match the one-shot upload authorization.
7. Perform only the exact authorized private upload; verify remote video ID, channel, final privacy and remote metadata. Do not enable public/unattended publishing.
8. Only after the owner separately authorizes public release, publish and verify the public URL and actual publication timestamp.

**Required owner input:** OAuth reauthorization and secure secret update. Required remote history and channel evidence are currently unavailable because the live refresh reports `invalid_grant`.

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
