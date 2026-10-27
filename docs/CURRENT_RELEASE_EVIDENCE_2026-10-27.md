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
