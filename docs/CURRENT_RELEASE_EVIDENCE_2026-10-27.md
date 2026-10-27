## Newer exact-SHA acceptance result — 27 October 2026

**Exact application/test SHA:** `3690ec82b52263cb2da2378f8aba9a5b19658a8f`; latest application-code commit `d465c03cb3b12ee68000192089165f326121e8eb`. The PR HEAD at this evidence snapshot was `57ce7714ccdabbb149a95c56c3e3e0f5468f3f28`; subsequent documentation-only commits do not alter the tested application or tests. `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; divergence at that snapshot: 1,698 ahead / 2 behind / 163 changed files. No removed or renamed files appear in the live compare, and `test/restore-facebook-draft-history.test.mjs` is preserved.

### Verified results for the exact source/test SHA

- **Automation/security — PASS:** [run 40575972741](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972741): 367 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; `npm ci` with normal lifecycle scripts succeeded; Google API import passed; `npm audit` reported 0 vulnerabilities; JavaScript syntax, Python compilation, campaign/disclosure, metadata-safety and queue checks passed.
- **Dashboard browser E2E — PASS:** [run 40575972740](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972740): 13 Chromium journeys against the real local dashboard/backend.
- **Content quality — PASS:** [run 40575972899](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972899).
- **Metadata validation — PASS:** [run 40575972743](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972743).
- **Isolated main/candidate baseline — PASS:** [run 40575972749](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972749): main Node 54/54 passed; candidate Node exit code 0 with 366 passed, 0 failed and 1 skipped; main Python 8 passed and candidate Python 16 passed. The isolated baseline runner could not install FFmpeg, so one candidate renderer integration test was explicitly skipped there; the main automation/security run installed FFmpeg and completed 367/367 Node tests with no skips.
- **Production readiness — BLOCKED:** [run 40575972751](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972751), as required while production prerequisites are missing.
- **Facebook draft workflow — PASS for local deterministic draft-package validation only:** [run 40575973011](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575973011). This is not a live Meta API/Page integration.

### Acceptance decision

The retained-output/manifest guards and regression tests now pass the full automation/security suite. This does not prove genuine production media, full human playback/rights approval, authenticated SonicVhibez OAuth identity and complete remote history, an authorized private-upload receipt, eligible native Short-parent association, live Meta integration, owner-approved cadence, or all recovery/deployment drills. YouTube's [official Related video rule](https://support.google.com/youtube/answer/14075157?hl=en) requires the selected parent to be public or unlisted; a private parent cannot be linked. Do not change visibility to bypass this.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.** No live YouTube upload or Facebook post occurred; public/unattended YouTube publishing, Facebook live publishing and Safari campaigns remain disabled.

---

## Live checkpoint — 27 October 2026: retained render evidence protection

**Application-code SHA:** `d465c03cb3b12ee68000192089165f326121e8eb`  
**Exact source/test SHA:** `3690ec82b52263cb2da2378f8aba9a5b19658a8f`  
**PR #1:** open, draft, unmerged. Documentation-only commits may follow this source/test SHA.  
**Git comparison:** `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; 1,691 commits ahead / 2 behind / 163 changed files. The current compare lists no removed or renamed files; `test/restore-facebook-draft-history.test.mjs` remains present.

### Implemented in this checkpoint

- `scripts/dashboard-server.mjs` refuses to replace a retained per-job render manifest, including an existing regular file, and returns a recovery-required response.
- `scripts/safe-media-path.mjs` rejects an existing regular render destination before FFmpeg can overwrite it.
- Regression tests preserve existing manifest/output bytes and verify refusal occurs before a job leaves `QUEUED`.
- Earlier related protection: `bd6a4b75addcb2e14b31d2219ff82b5ef33a1406` guards existing video/thumbnail output; `fc466b1192305464493313c7c9ef68ee69129289` guards retained per-job manifests; `d465c03cb3b12ee68000192089165f326121e8eb` hardens direct renderer output handling.

### Exact-SHA CI status for `3690ec82b52263cb2da2378f8aba9a5b19658a8f`

- Dashboard browser E2E: **PASS**, 13 Chromium journeys — [run 40575972740](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972740).
- Content quality: **PASS** — [run 40575972899](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972899).
- Metadata validation: **PASS** — [run 40575972743](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972743).
- Lockfile install completed successfully in browser CI; that job reported 0 npm vulnerabilities — [run 40575972740](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972740).
- Automation/security: **IN PROGRESS** — [run 40575972741](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972741). Its unit-test step had not started when this checkpoint was recorded; do not infer that the new helper regression passed.
- Isolated main/candidate baseline: **IN PROGRESS** — [run 40575972749](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972749).
- Production readiness: **BLOCKED** — [run 40575972751](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972751).
- Daily Nature Frontiers Facebook workflow: **PASS for local draft-package validation only**, not live Meta integration — [run 40575973011](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575973011).

### External and production gates

No genuine production media, full human playback/rights approval, authenticated SonicVhibez OAuth identity and complete remote history, one-operation private-upload receipt, successful native Short Related video, verified Meta Page integration, or operational acceptance is proven. YouTube's [official Related video guidance](https://support.google.com/youtube/answer/14075157?hl=en) requires the selected video to be public or unlisted; a private parent is ineligible. Do not change privacy to bypass this. No live upload or post was performed. Public/unattended YouTube publishing and Facebook live publishing remain disabled; Safari campaigns remain inactive.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.** This is a checkpoint, not a claim of completion.

---

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


---

# Live implementation checkpoint — 27 October 2026: native Short-parent evidence binding

**Exact source/test SHA:** `3c961716d348945b266afd3e996c7952984c7260`  
**Implementation commit:** `1c8bde08e6bf0e9574e4085365fcde2924ca2f6d`  
**Regression-test commit / source-test HEAD:** `3c961716d348945b266afd3e996c7952984c7260`  
**Live PR #1:** open, draft, unmerged. Documentation/PR metadata updates are not application-code test evidence.

## Live Git reconciliation

- Implementation branch HEAD at this checkpoint: `3c961716d348945b266afd3e996c7952984c7260`.
- `main` HEAD: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Comparison: 1,640 commits ahead, 2 behind; 162 changed files.
- Historical release evidence elsewhere in this file refers to older SHAs and must not be treated as evidence for this checkpoint.

## Implemented

- `scripts/short-parent-relationship.mjs` now requires native Related video evidence marked `VERIFIED` to identify the exact approved parent video ID, matching verified SonicVhibez channel ID, and canonical parent destination URL.
- `test/short-parent-relationship.test.mjs` adds regression cases for wrong parent ID, wrong channel, wrong destination, and a matching evidence record.
- The validator still treats `BLOCKED_EXTERNAL` as an explicit external blocker. These checks validate recorded evidence consistency; they do not independently query YouTube or prove that the native Related video setting is configured correctly.

## Exact-SHA workflow status for `3c961716d348945b266afd3e996c7952984c7260`

- Metadata validation **PASS** — [run 40528746426](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746426).
- Content quality **PASS** — [run 40528746313](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746313).
- Automation/security **PASS** — [run 40528746351](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746351): 362 Node tests passed, 0 failed; npm audit reported 0 vulnerabilities; JavaScript syntax and Python compilation checks passed.
- Dashboard browser E2E **PASS** — [run 40528746832](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746832): 13 Chromium browser acceptance tests passed.
- Isolated main/candidate baseline **PASS** — [run 40528746461](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746461).
- Production readiness **BLOCKED / fail-closed** — [run 40528746326](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746326).
- Facebook daily draft **SKIPPED** — [run 40528746430](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40528746430); this is not evidence of a real Meta integration.

## Release decision

**Production release remains BLOCKED.** This checkpoint is not evidence of a genuine end-to-end production video or of originality, rights authenticity, naturalism, narration quality, final playback approval, native Related video configuration, live YouTube identity/history, an authorized private-upload receipt, Meta draft-only integration, or a feasible owner-approved cadence.

Safety controls remain unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar destination remains `https://selar.com/0u19v8u99l`. No upload, social post, merge, `main` edit, reset, rebase, force-push or destructive history operation was performed.


---

# Live implementation checkpoint — 27 October 2026: fail closed on unverified Short Related video

**Exact source/test SHA:** `3b91b1338f970ab671ca366eec6c860672146671`  
**Latest application-code commit:** `13fea8d69efb8680fe2619a183296e5bc3904f3d`  
**Latest regression-test commit:** `3b91b1338f970ab671ca366eec6c860672146671`

## Implemented and tested

- `scripts/short-parent-relationship.mjs` supports a strict publication context that requires native Related video status `VERIFIED` and rejects a private parent as ineligible.
- `scripts/upload-private.mjs` invokes that strict context for Short uploads, so a Short with `BLOCKED_EXTERNAL`, missing native evidence or an ineligible private parent cannot proceed to upload.
- `scripts/dashboard-server.mjs` applies the same strict requirement to final Short approval, keeping the job in review until the native association is independently verified and eligible.
- `test/short-parent-relationship.test.mjs`, `test/short-parent-upload.test.mjs`, `test/dashboard-approval-contract.test.mjs`, and `tests/upload-private.test.mjs` cover mismatched parent evidence, the final approval gate, eligible synthetic test fixtures, and generic upload-recovery tests without bypassing the Short-specific gate.
- A private-only parent cannot satisfy the native Related video eligibility rule in this workflow. This is intentionally fail-closed; do not change the parent visibility or publish it publicly without separate explicit owner authorization. Current private-only policy therefore leaves native Short linking as a production blocker.

## Exact-SHA workflow outcomes for `3b91b1338f970ab671ca366eec6c860672146671`

- Automation/security **PASS** — [run 40529986572](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986572): 363 Node tests passed, 0 failed; 16 Python tests passed; npm audit reported 0 vulnerabilities; syntax/compile checks passed.
- Dashboard browser E2E **PASS** — [run 40529986676](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986676): 13 Chromium tests passed.
- Content quality **PASS** — [run 40529986871](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986871).
- Metadata validation **PASS** — [run 40529986776](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986776).
- Isolated main/candidate baseline **PASS** — [run 40529986758](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986758).
- Production readiness **BLOCKED / fail-closed** — [run 40529986321](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986321).
- Nature Frontiers Facebook daily draft **SKIPPED** — [run 40529986454](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40529986454); not live Meta integration evidence.

## Release decision

**Production release remains BLOCKED.** No real production MP4 or rights licence was independently reviewed in this run. No real YouTube native Related video association, authenticated channel/history reconciliation, authorized private-upload receipt, Meta draft-only integration, or owner-approved cadence was verified. The synthetic upload fixtures exercise recovery mechanics only; they are not production media or real licence proof.

Safety remains unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar destination remains `https://selar.com/0u19v8u99l`. No external account mutation, upload, post, merge, `main` edit or destructive Git operation occurred.


---

## Follow-up implementation checkpoint — cadence hard invariant (27 October 2026)

**Exact source/test SHA:** `47c839452fda99757a34dcb29865da9e967121af`  
**Application-code commit:** `e9c555d1c70cc18d6fc6a919b3899ca78d67713f`  
**Configuration commit:** `477f1ad0d86ff00aac7dcf1d89f455553a6d8a4b`  
**Regression-test commit:** `47c839452fda99757a34dcb29865da9e967121af`

### Code change

- `scripts/production-readiness.mjs` no longer accepts the `WEEKLY_TARGET_WITH_SHORTER_SPACING` mode and rejects any cadence with less than 72 hours, regardless of owner-defined mode.
- `config/weekly-content-plan.json` no longer presents a cadence option that violates the hard minimum.
- `tests/production-readiness.test.mjs` adds regression coverage for the 72-hour invariant, 216-hour cycle, and removal of the unsafe option.
- This does not set owner approval, change actual publication slots, or enable publishing.

### Exact-SHA CI outcomes for `47c839452fda99757a34dcb29865da9e967121af`

- Automation/security **PASS** — [run 40537264912](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264912): 364 Node tests passed, 0 failed; 16 Python tests passed; npm audit reported 0 vulnerabilities.
- Dashboard browser E2E **PASS** — [run 40537264704](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264704): 13 Chromium tests passed against the real local dashboard/backend.
- Content quality **PASS** — [run 40537264707](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264707).
- Metadata validation **PASS** — [run 40537265090](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537265090).
- Lockfile generation/verification **PASS** — [run 40537255697](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537255697).
- Production readiness **BLOCKED / fail-closed** — [run 40537264786](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264786).
- Facebook daily draft **SKIPPED** — [run 40537264915](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264915); not a real Meta integration test.
- Isolated main/candidate baseline **IN PROGRESS at this checkpoint** — [run 40537255841](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537255841). Do not count it as a pass until its actual conclusion is available.

### Release decision remains BLOCKED

No real production media, independent human full-playback approval, authenticated SonicVhibez OAuth/history reconciliation, authorized private-upload receipt, verified eligible native Related video association, real Meta draft-only run, owner-approved feasible cadence, or complete production recovery/deployment drill is established by these CI checks. Keep public/unattended YouTube publishing OFF, Facebook live publishing OFF, Safari inactive, Nature Frontiers prohibited as a YouTube target, and PR #1 open/draft/unmerged. The approved Selar URL remains `https://selar.com/0u19v8u99l`.


### Baseline completion addendum — 27 October 2026

The isolated main/candidate baseline workflows completed after the checkpoint above and are now **PASS** for tested source/test SHA `47c839452fda99757a34dcb29865da9e967121af`: [run 40537255841](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537255841) and [run 40537264675](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40537264675). The earlier `IN PROGRESS at this checkpoint` line accurately describes the earlier observation, but the final result is PASS. Production readiness remains BLOCKED and Facebook draft remains SKIPPED.


---

## Follow-up implementation checkpoint — private-only Short review and truthful Related-video blocker (27 October 2026)

**Application-code commit:** `2186822bba83ecfb299e40ab8d10376c009f8711`  
**Exact source/test SHA:** `77921aca418b25bca0a9aa681281145b00c6d72f`  
**Branch/PR head at this checkpoint:** `77921aca418b25bca0a9aa681281145b00c6d72f`

### Changes

- A private-only Short review upload may carry an explicit `BLOCKED_EXTERNAL` native Related-video status when its parent is private. It does not claim native association success, permit public publishing, or waive the public-release gate.
- Relationship validation now rejects an empty or vague external-blocker explanation (requires 8–500 characters).
- Regression coverage checks private-only approval, exact relationship binding, private-parent eligibility, and rejection of empty blocker evidence.
- The historical `test/restore-facebook-draft-history.test.mjs` remains present on the branch; its recovery coverage was not removed or rewritten.

### CI status observed for exact source/test SHA `77921aca418b25bca0a9aa681281145b00c6d72f`

- Automation/security **PASS** — [run 40542854519](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854519).
- Content quality **PASS** — [run 40542854671](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854671).
- Metadata validation **PASS** — [run 40542854427](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854427).
- Dashboard browser E2E **IN PROGRESS at this observation** — [run 40542854283](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854283). Do not treat as a pass until its final conclusion is checked.
- Isolated main/candidate baseline **IN PROGRESS at this observation** — [run 40542854437](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854437). Do not treat as a pass until its final conclusion is checked.
- Production readiness **BLOCKED / fail-closed** — [run 40542854087](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854087).
- Nature Frontiers Facebook daily draft **SKIPPED** — [run 40542854114](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542854114); this is not live Meta integration evidence.

The separate application-code commit `2186822bba83ecfb299e40ab8d10376c009f8711` had dashboard browser E2E **PASS** in [run 40542804855](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40542804855), but this older run does not replace final checks for the source/test SHA above.

### Release decision

**IMPLEMENTATION INCOMPLETE / PRODUCTION BLOCKED.** The focused Short-review defect is covered, but the broader audit still identifies missing lifecycle integration for authoring, no verified genuine multi-scene production render and no human-approved production MP4. Real SonicVhibez OAuth/history, an authorized private-upload receipt, native Related-video verification, live Meta draft-only integration, owner-approved feasible cadence, and complete recovery/deployment drills remain unproven. Public/unattended YouTube publishing and Facebook live publishing remain disabled; Safari campaigns remain inactive; Nature Frontiers remains prohibited as a YouTube target. PR #1 remains open, draft and unmerged. No live account mutation or publication was performed.


---

## Live repository and workflow reconciliation — 27 October 2026

This addendum supersedes any earlier statement in this document that describes the then-current branch head or says the newest browser/baseline workflows are still pending. It is documentation-only and does not change application code or tests.

- Live PR #1: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1 — OPEN, DRAFT, UNMERGED.
- Live branch: `codex/marketing-machine-audit-fixes`.
- Live PR head observed: `ed6f27d5275a8c9d2e41964d3f5ea386d4078d6c`.
- The head commit is documentation-only (OPERATIONS.md); the application/test tree remains at exact source/test checkpoint `77921aca418b25bca0a9aa681281145b00c6d72f`.
- Live comparison against `main`: 1,675 commits ahead / 2 behind; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; current `main` SHA `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. This is a large divergent history and still requires a full risk review; do not merge or reconcile destructively.

### Current-head workflow observations

The GitHub Actions runs associated with the observed head completed with these results:

- Automation/security PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315036
- Dashboard browser E2E PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315508
- Content quality PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315286
- Metadata validation PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315245
- Isolated main/candidate comparison PASS: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315742
- Production readiness FAILED because mandatory readiness gates remain blocked: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315319
- Nature Frontiers Facebook daily draft SKIPPED: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40543315444. This is not evidence of a successful live Meta integration.

### Implementation interpretation

The current dashboard source includes a guarded authoring-to-render path that calls `buildApprovedJobRenderManifest`, validates the designated metadata path and per-job output directory, persists a per-job manifest, and launches the appropriate renderer. Tests verify that authoring jobs lacking required approval, provenance, quality, compliance, or artifact-integrity evidence are rejected. Therefore, the older blanket description that the endpoint simply refuses every authoring job is not supported by the current source; acceptance still requires successful end-to-end render evidence with genuine approved assets and independent human review.

### Release verdict remains BLOCKED

These CI results do not establish genuine rights-cleared final MP4s, full human playback/factual/realism acceptance, authenticated SonicVhibez OAuth identity and complete remote history, an authorized private-upload receipt, eligible native YouTube Related-video association, a real draft-only Meta run, owner-approved feasible cadence, or complete operational recovery/deployment drills. The documented Metricool risk involving Nature Frontiers' incorrect YouTube association and scheduled auto-publishing must be reconciled in Metricool by the owner before any further external publishing; no such account changes were made in this task.

Safety remains unchanged: public/unattended YouTube publishing OFF; Facebook live publishing OFF; Safari campaigns inactive; Nature Frontiers prohibited as a YouTube target; approved Selar URL unchanged. PR #1 remains open/draft/unmerged. No upload, post, campaign activation, merge, `main` edit, reset, rebase, force-push or destructive history operation occurred.
