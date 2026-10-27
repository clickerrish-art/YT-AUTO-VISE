# Latest verified checkpoint — 27 October 2026: publication-slot status coverage

**Exact tested source/test SHA:** `71555f20cc5fbd24658f50e82da5544eeed1a622`  
**Application-code commit:** `cb9118e8cadaa72c6be334031e250e4ceb44d02c`  
**Regression-test commit:** `71555f20cc5fbd24658f50e82da5544eeed1a622`  
**PR at test time:** #1 open, draft, unmerged. Documentation-only descendants may follow this exact tested source/test SHA.

## Change and verification

- `scripts/schedule-policy.mjs` now treats `queued_for_publication` and `pending_schedule` as active publication reservations. Previously, `evaluateNextPublication` recognized these states as planned attempts but `validatePublicationSlot` could filter them out, allowing a proposed slot to miss a queued collision.
- `test/schedule-policy.test.mjs` now covers same-day collision rejection, fail-closed missing timestamps, and reservation of these states through the rolling publication gate.
- Automation/security **PASS** — [run 40465705566](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705566): 338 Node tests passed, 0 failed; 16 Python safety tests passed; npm audit reported 0 vulnerabilities.
- Dashboard browser E2E **PASS** — [run 40465705587](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705587): 12 Chromium tests passed.
- Content quality **PASS** — [run 40465705622](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705622).
- Metadata validation **PASS** — [run 40465705503](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705503).
- Isolated main/candidate baseline **PASS** — [run 40465705450](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705450).
- Production readiness remains **BLOCKED** — [run 40465705498](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705498).
- Nature Frontiers Facebook daily draft was **SKIPPED** — [run 40465705576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40465705576); this is not Meta integration evidence.

## Release decision and remaining gates

**Code/test improvement verified; production release remains BLOCKED.** Still required: real rights-cleared media and narration, approved per-job render manifests and final MP4s, hash-bound human playback/rights review, verified SonicVhibez OAuth identity and complete public/private/unlisted history, reconciliation of uncertain upload attempts, explicit one-operation private-upload authorization and remote receipt, native Short-to-parent Related video evidence, verified Meta Page identity and a successful non-skipped draft-only integration, owner-approved feasible cadence, recovery/backup/restore/deployment drills, full divergent-history review and branch-governance acceptance.

Safety remains unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; exact approved Selar destination remains `https://selar.com/0u19v8u99l`. No upload, post, merge, main-branch edit or destructive Git operation occurred.

---

# Current Release Evidence — 27 October 2026

## Exact refs

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Implementation branch: `codex/marketing-machine-audit-fixes`
- PR: [#1](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1), open, draft, unmerged.
- Source/test SHA with latest implementation and regression test: `28d326c474d2c4871f6e9f2f55f050dac9fe14bd`.
- Latest observed PR HEAD at evidence creation: `28d326c474d2c4871f6e9f2f55f050dac9fe14bd`. Documentation-only follow-up commits, if any, are not source/test SHAs.
- Main HEAD: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Divergence at source/test SHA: 1,520 commits ahead, 2 behind; 149 changed files.
- PR description still contains historical checkpoint values and must not be treated as live evidence.

## Implementation in this checkpoint

- `scripts/content-quality-gates.mjs`: added `validateAssetProvenanceSet`, validating the provenance lineage graph for duplicate asset IDs, missing ancestors, self-derivation, malformed derivative declarations, and cycles.
- `scripts/validate-content-quality.mjs`: integrated the graph validation into the existing fail-closed quality evidence gate before scene mapping. Existing per-asset source path and SHA-256 verification remains active.
- `test/asset-provenance-set.test.mjs`: five unit tests for valid chains and invalid graph cases.
- `test/validate-content-quality.test.mjs`: integrated regression verifies duplicate IDs are rejected before a Map overwrite can hide the collision.
- Commits: [`f0c1d0f`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/f0c1d0fabcc9cc4d4b8f3bfe559a79536ab90878), [`dc4c34f`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/dc4c34f3227744d9823cee13139d8d1ee50ef951), [`28d326c`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/28d326c474d2c4871f6e9f2f55f050dac9fe14bd). The first two are implementation; the last adds the integrated regression test. The separate test file was added at [`052927a`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/052927af794660f9d14c5284052e02471865db6f).

## Exact-SHA workflows for `28d326c474d2c4871f6e9f2f55f050dac9fe14bd`

| Gate | Status | Evidence |
|---|---|---|
| Automation/security, Node/Python/security checks | PASS | [Run 40444442486](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442486) |
| Dashboard browser E2E | PASS | [Run 40444442543](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442543) |
| Metadata validation | PASS | [Run 40444442439](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442439) |
| Content quality | PASS | [Run 40444442512](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442512) |
| Isolated main/candidate baseline | PENDING at time of writing | [Run 40444442431](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442431) |
| Production readiness | BLOCKED, expected fail-closed | [Run 40444442464](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442464) |
| Nature Frontiers Facebook daily draft | SKIPPED; not integration proof | [Run 40444442448](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40444442448) |

The automation log reports 328 Node tests, 0 failures. The content-quality workflow also passed. Do not count the readiness workflow failure as a test regression: it is the readiness gate reporting unmet external/production prerequisites. The isolated baseline run had not completed at the time this file was written.

## Still blocked

- Dashboard `POST /api/jobs/produce` still explicitly refuses jobs with generated authoring records because generated narration, captions, scene rendering, and downstream validation are not connected as one complete workflow. This is a real code-level integration defect, not merely an external prerequisite.
- No genuine final Short/long-form exports with complete source/licence provenance and human full-playback approval are evidenced.
- SonicVhibez OAuth/channel identity, full public/private/unlisted history and uncertain-upload reconciliation, one-operation private-upload authorization and verified remote receipt are not established.
- Native YouTube Related video association remains externally unverified; a description URL is not equivalent.
- Nature Frontiers Page identity/permissions and a non-skipped draft-only integration run remain unverified.
- A feasible cadence decision, exhaustive dashboard-control coverage, cross-process failure injection, recovery/rollback/deployment drills, full divergent-history review and repository governance remain outstanding.

## Safety

Public/unattended YouTube publishing stays disabled. Facebook live publishing stays disabled. Safari campaigns stay inactive. Nature Frontiers remains prohibited as a YouTube target. No upload, post, visibility change, campaign activation, merge, reset, rebase, force-push or history rewrite was performed.


---

## Live implementation checkpoint — 27 October 2026: authoring narration component

**Exact source/test SHA:** `4b4b041dd45c41246736bd7973be8d05ba091286`. **Latest application-code commit:** `3a891228a169c027d22bf6a3d6e9a2bba2a102e4`. **PR HEAD at this checkpoint:** `4b4b041dd45c41246736bd7973be8d05ba091286`.

- Live Git comparison: `main` `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; **1,536 ahead / 2 behind / 152 changed files**. PR #1 remains open, draft and unmerged.
- Implemented `scripts/generate-authoring-narration.py`: draft-only Edge TTS generation for an existing structured script; validates word count, section-to-transcript consistency, section scene/pacing/sound directions and source IDs; writes MP3, transcript, captions from TTS word-boundary events and a report containing script/audio/transcript/caption hashes. It rejects absent word-boundary timing rather than silently using approximate timings. Output is restricted to job-specific children of `media/generated-authoring`; symlinked media/output paths are rejected.
- Updated `scripts/build-script-generation-prompt.mjs` to request the same word-count limits as the quality gate: long-form 900–1,500 words; Short 125–150 words.
- **Important limitation:** the narration component is not yet integrated with dashboard `POST /api/jobs/produce`. The existing fail-closed refusal remains. This is not an end-to-end authoring-to-render acceptance result; no real TTS audio was generated by CI, and no final video was produced or playback-reviewed.
- Automation/security **PASS** — [run 40449501858](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501858): 328 Node tests; 16 Python tests; npm audit 0 vulnerabilities; normal/locked install, syntax and Python compile checks passed.
- Dashboard browser E2E **PASS** — [run 40449501863](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501863): 12 Chromium tests.
- Content quality **PASS** — [run 40449501841](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501841). Metadata validation **PASS** — [run 40449501936](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501936).
- Isolated main/candidate baseline **PASS** — [run 40449501846](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501846), comparing exact main/base SHA `fa00d28e7f58911482686e4ad69fac9f4701a2e6` with candidate source/test SHA `4b4b041dd45c41246736bd7973be8d05ba091286`; the baseline artifact was retained. This PASS is for the stated exact SHA only.
- Production readiness **BLOCKED as required** — [run 40449501870](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501870). Nature Frontiers Facebook draft **SKIPPED** — [run 40449501843](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40449501843); not integration proof.
- Remaining primary code defect: connect the authoring record to durable narration/caption generation, an explicitly approved storyboard/source-asset manifest, per-job multi-scene render output, actual audio/caption/export validation, metadata/hash binding, and human review. Do not remove the refusal until this is integrated and tested end-to-end.
- Other blockers remain: genuine rights-cleared media and full-playback realism review; successful Short-parent binding/recovery with real receipts; verified SonicVhibez OAuth/channel identity/history and uncertain-upload reconciliation; native Related video verification; verified Nature Frontiers Page and non-skipped draft workflow; feasible owner-approved cadence; exhaustive recovery/restore/deployment drills; full branch-history review and branch-governance acceptance.
- Safety unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar destination `https://selar.com/0u19v8u99l`. No upload/post, visibility change, campaign activation, merge or destructive Git operation.


---

## Live implementation checkpoint — 27 October 2026: dashboard script/narration review stages

**Exact application/test SHA:** `c5bfbbc7861616494c6b589604fa3797e673681a`. Documentation-only follow-ups, if any, do not change that tested source tree. **Latest server-stage integration commit:** `def2b74541f8f84a9095a92a54872264b4e22a6f`. **Latest narration recovery helper commit:** `85b0a15071a72de6c463e5fe89b7b047ae19a282`.

- Live PR #1 remains OPEN, DRAFT and UNMERGED. At this checkpoint, branch HEAD is `c5bfbbc7861616494c6b589604fa3797e673681a`; `main` is `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; live divergence **1,576 ahead / 2 behind / 154 changed files**. Full divergent-history review remains incomplete.
- Added `scripts/authoring-production-pipeline.mjs` to generate narration only for an explicitly human-approved exact script revision. It records script/audio/transcript/caption hashes, checks transcript text and word count against the approved narration, independently measures audio duration with ffprobe, runs the existing caption structure and synchronization validators, rejects symlinks and partial artifacts, and can reconcile complete prior output without invoking TTS again.
- Added dashboard API stages for hash-bound script review, narration generation, authenticated narration audio and review-bundle retrieval, explicit narration playback/transcript/caption approval, and recovery-only reconciliation. Added UI controls for script review, narration generation, audio playback, transcript/caption inspection, human review and no-retry reconciliation.
- The API tests use synthetic fixture bytes to test integrity/attestation handling; this is **not** evidence of real generated or playable production audio. CI does not invoke live Edge TTS. No genuine narration or final video was generated in this checkpoint.

### Exact-SHA workflow results for `c5bfbbc7861616494c6b589604fa3797e673681a`

- Automation/security **PASS** — [run 40453030534](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030534): **336 Node tests passed, 0 failed**; **16 Python safety tests passed**; npm audit reported **0 vulnerabilities**.
- Dashboard browser E2E **PASS** — [run 40453030615](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030615): **12 Chromium tests passed** against the local dashboard/backend.
- Content quality **PASS** — [run 40453030586](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030586).
- Metadata validation **PASS** — [run 40453030574](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030574).
- Isolated main/candidate baseline **PASS** — [run 40453030640](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030640), with the exact main/candidate comparison retained.
- Production readiness **BLOCKED** — [run 40453031961](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453031961), as expected because external account/media/approval gates remain unsatisfied.
- Nature Frontiers Facebook daily draft **SKIPPED** — [run 40453030497](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40453030497); this is not external integration proof.

### Release decision remains BLOCKED

The main defect is **not closed**: `POST /api/jobs/produce` still refuses authoring jobs. The new review/narration endpoints form a real, hash-bound first part of the pipeline, but the application still does not connect approved narration and approved source assets into a per-job scene manifest, render, final audio/caption/metadata validation and final-video human review. The refusal remains in place intentionally.

Remaining blockers include a production-plan binding contract and renderer integration; real rights-cleared visual assets and narration-licence evidence; final video playback review; successful Short-parent binding/recovery with a real verified parent receipt; verified SonicVhibez OAuth/channel/history and uncertain-upload reconciliation; native Related video verification; a successful non-skipped Nature Frontiers Page draft integration; owner-approved feasible cadence; and exhaustive backup/restore, deployment, rollback and branch-history review.

Safety unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar destination remains `https://selar.com/0u19v8u99l`. No upload, post, visibility change, campaign activation, merge or destructive Git operation occurred.


## Addendum — production-plan integration checkpoint (27 October 2026)

### Exact refs
- Current PR HEAD after documentation-only commits: `c439789e0ba8170821b85a3c9f0d685e5c08e62f`.
- Exact code/test tree used for the latest automated regression runs: `95a64fa88f668ba0f88cd2f4be394c9100c6ff53`; its latest browser run is still pending.
- Latest application-code SHA: `6224218660a11fd59353dbab96d9963e429649bb`; `95a64fa...` adds the corresponding browser acceptance assertion.
- `main` HEAD: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Live compare: 1,607 commits ahead / 2 behind / 157 changed files. Divergent history review is still incomplete.
- PR #1 remains OPEN, DRAFT and UNMERGED.

### Implemented in this checkpoint
- Added `scripts/production-plan.mjs` and structural/hash-bound validation tests for scene-level assets, provenance, rights-evidence hashes, format-specific scene counts, and explicit Short parent fields.
- Added `POST /api/jobs/production-plan` and `POST /api/jobs/production-plan/review`. The APIs require exact approved script and narration revisions, verify on-disk narration/audio/transcript/caption/report hashes, verify scene asset and rights-evidence file hashes, persist plan review state, and revalidate evidence during human review.
- Short plans must match the independently persisted, human-approved Short-parent relationship and verified public SonicVhibez receipt. A submitted plan cannot self-certify the parent.
- Added dashboard plan submission and review controls with a persisted plan preview. The review is explicitly **plan-stage only**.
- `POST /api/jobs/produce` remains fail-closed for authoring jobs. The per-job quality-evidence conversion, renderer integration, final media review and final-artifact approval are not implemented yet.

### Exact-SHA test evidence
- Automation/security PASS at `46186a494da5b512c57d0e6a04056b6c367754ef`: 345 Node tests passed, 0 failed; 16 Python safety tests passed; dependency audit and syntax/compile steps passed — [run 40487769081](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40487769081).
- Dashboard browser E2E at the prior code/test checkpoint PASS: 12 Chromium tests — [run 40487769134](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40487769134). The additional production-plan-preview assertion at current tree `95a64fa...` was still running when this addendum was drafted; do not attribute that result to the older run.
- Content quality PASS at `95a64fa...` — [run 40488246239](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488246239).
- Metadata validation PASS at `95a64fa...` — [run 40488245972](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488245972).
- Isolated main/candidate baseline PASS at `95a64fa...` — [run 40488246103](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488246103).
- Production readiness BLOCKED at `95a64fa...` — [run 40488246069](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488246069).
- Nature Frontiers Facebook daily draft SKIPPED at `95a64fa...` — [run 40488245959](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40488245959); this is not a live integration pass.

### Current Metricool account finding
The connected Metricool account currently returns a Nature Frontiers brand (`7545638`) with a YouTube connection as well as Facebook and Instagram. The scheduled-post query found seven future posts (31 October–25 November 2026) with `autoPublish: true`, `draft: false`, and Instagram auto-publish enabled; one 27 October post is marked Facebook PUBLISHED. A pending/draft YouTube Short record on the Nature Frontiers brand has `youtubeData.privacy: public`. These are account observations, not repository test results. No Metricool post or setting was changed; the unsafe scheduled actions remain an external blocker pending explicit owner action.

### Release decision
**BLOCKED.** No real narration output or final production video has been accepted, no final full-playback realism review exists, no authorized private-upload receipt has been accepted, and the complete authoring-to-render workflow is still disconnected. Public/unattended YouTube publishing remains OFF, Facebook live publishing remains OFF in the application, Safari campaigns remain inactive, Nature Frontiers remains prohibited as a YouTube target, and the approved Selar URL remains `https://selar.com/0u19v8u99l`. No upload, post, visibility change, campaign activation, merge, or destructive Git operation was performed.


## Superseding implementation and exact-SHA evidence — 27 October 2026, 12:57 UTC

This section supersedes earlier statements above that the authoring renderer was entirely disconnected. Those statements remain historical checkpoints, not the current code description.

### Live Git refs at this checkpoint

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- PR #1 remains OPEN, DRAFT and UNMERGED: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- Application/test SHA: `66c61fc8aa8d79069426fc7f34dcb92013c02d7f`
- `main` SHA: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Live comparison: 1,628 commits ahead, 2 behind; 162 changed files.
- No merge, main edit, reset, rebase, force-push or history rewrite was performed.

### Code changes in the tested application/test tree

- Added `scripts/content-job-artifact-paths.mjs` and `test/content-job-artifact-paths.test.mjs`. Authoring jobs now use validated, isolated `media/jobs/<job-id>/final.mp4` and `thumbnail.jpg` paths rather than shared format-level output paths. Traversal/malformed IDs are rejected and distinct jobs receive distinct paths.
- Corrected `test/build-approved-job-render-manifest.test.mjs` fixtures to carry current hash-bound script, narration and plan approval attestations. Mutation tests now recompute the plan approval hash before testing deeper validation, so tests reach the intended gate rather than failing at an earlier stale-approval check.
- Corrected the production-plan review response so it no longer claims renderer integration is absent when `POST /api/jobs/produce` has a hash-gated authoring-render path.
- Final approval for authoring jobs now revalidates the current approved render package and saved per-job render manifest, and records explicit script, narration, transcript, captions, production-plan, quality-evidence and render-manifest hashes. It also records source-asset and licence-evidence hashes in the related-artifact integrity list. A stale or missing render package blocks approval.
- The renderer and all approval stages still keep publication disabled; code-level readiness does not constitute a real-media acceptance receipt.

### Exact-SHA CI for application/test SHA `66c61fc8aa8d79069426fc7f34dcb92013c02d7f`

- **Automation/security — PASS:** 357 Node tests passed, 0 failed; 16 Python safety tests passed; locked dependency install succeeded; npm audit found 0 vulnerabilities; syntax/compile and repository policy checks passed. [Run 40507689487](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689487)
- **Content quality — PASS:** [Run 40507689426](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689426)
- **Metadata validation — PASS:** [Run 40507689469](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689469)
- **Isolated main/candidate baseline — PASS:** main `fa00d28e7f58911482686e4ad69fac9f4701a2e6` and candidate `66c61fc8aa8d79069426fc7f34dcb92013c02d7f` each completed Node and Python tests with exit code 0. [Run 40507689457](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689457)
- **Dashboard browser E2E — PENDING at evidence capture:** [Run 40507689427](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689427). Do not treat this as a pass.
- **Production readiness — BLOCKED:** [Run 40507689465](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689465). The workflow reported 13 blockers, including missing owner-approved feasible cadence, unverified complete YouTube history, missing verified SonicVhibez channel ID, rights attestation and missing final media.
- **Nature Frontiers Facebook daily draft — SKIPPED:** [Run 40507689421](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40507689421). No live draft-execution pass is claimed.

### External and production blockers that remain

- No genuine, rights-cleared production asset set and complete accepted final export have been produced and reviewed in this checkpoint. A renderer test, manifest validation or sample media file is not evidence of realistic wildlife footage.
- No verified SonicVhibez OAuth/channel identity, complete public/private/unlisted history reconciliation, authorized private-upload attempt or remote receipt was produced. No upload was performed.
- No completed real-media human full-playback review, verified caption/audio synchronization receipt, or native YouTube Related-video verification is available.
- The owner-approved feasible publication cadence remains absent. The configured `long_form → long_form → short` cycle and 72-hour minimum gap remain fail-closed until the owner records a feasible policy.
- The latest previously inspected Metricool snapshot reported eight future Nature Frontiers posts with `autoPublish=true` and `draft=false`, plus a Nature Frontiers YouTube connection whose identity was not verified. No safe, reversible account-level pause/disconnect control was exposed by the connected read-only inspection surface; no external schedules or connections were changed. Treat this as an unresolved external safety risk until the account is corrected and verified directly.
- Facebook draft integration remains unproven. Facebook live publishing remains disabled. Safari campaigns remain inactive. Nature Frontiers must never be a YouTube target. The approved Selar URL remains exactly `https://selar.com/0u19v8u99l`.

### Release decision

**BLOCKED — NOT 100% ACCEPTED.** The latest tested tree has meaningful pipeline, approval-integrity and per-job artifact improvements, and the listed exact-SHA checks pass except for the explicitly pending/blocked/skipped workflows. Real-media, external-account, cadence, final human-review, upload-receipt and deployment/recovery acceptance gates remain open. Do not merge PR #1 or enable unattended/public YouTube, Facebook live publishing, or Safari campaigns.
