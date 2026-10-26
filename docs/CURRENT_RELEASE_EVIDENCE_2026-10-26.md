# Current release evidence — 26 October 2026

## Git and PR state

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Source/test SHA with the new content-quality gates: `bbde79e1f3f589f1737e3ea95512a412e5c91d61`
- Main SHA at the source/test checkpoint: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Divergence at source/test checkpoint: 1,251 commits ahead, 2 behind, 136 changed files.
- PR #1 is open, draft and unmerged. Subsequent documentation commits have advanced the branch; the live PR head must be fetched before using this report as the final-head checkpoint.
- No merge, reset, rebase, force-push, history rewrite, upload, public post or campaign activation occurred.

## Implemented source changes

The source/test candidate adds `scripts/content-quality-gates.mjs`, `scripts/validate-content-quality.mjs`, and the source-constrained prompt builder `scripts/build-script-generation-prompt.mjs`. Both renderers require `qualityEvidencePath` and run this gate before FFmpeg. The gate validates:

- measured script word count and differentiated sections, source-backed claims and a retained similarity-review record;
- asset provenance and original SHA-256 values against actual files, with commercial-use permission and human rights verification fields;
- deterministic scene selection from a recorded seed and matching edit-plan hash;
- audio profile, measured integrated loudness, true peak, music/ambience separation, fades, rights and human-verified transcript matching, bound to the exact narration bytes;
- a human editorial approval record;
- for Shorts, explicit parent content ID, same cycle, approved parent revision and media hash, SonicVhibez identity, verified remote parent video ID and canonical watch URL.

The native YouTube Related video setting is intentionally separate. Internal relationship validation and a description URL do not prove that YouTube Studio's Related video feature is configured. The publication-stage validator requires `youtubeRelatedVideoStatus=VERIFIED`; manual Studio verification and retained evidence remain necessary.

## Exact source/test SHA CI evidence

All links below are workflows associated with source/test SHA `bbde79e1f3f589f1737e3ea95512a412e5c91d61`.

- [Automation/security — run 40283292738](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803930): PASS; 296 Node tests passed, 0 failed; npm audit reported 0 vulnerabilities. The workflow also ran clean/locked install checks and other repository validations.
- [Content quality — run 40283292695](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803919): PASS.
- [Metadata validation — run 40283292591](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803925): PASS.
- [Dashboard browser E2E — run 40283292552](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282804001): PASS.
- [Isolated main/candidate baseline — run 40283292715](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803924): PASS.
- [Production readiness — run 40283292557](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803929): BLOCKED as expected; human-readable and JSON readiness returned 2/2 and retained the diagnostic artifact. The blockers include missing verified media manifests, channel ID, OAuth credentials, owner-approved cadence decision and complete upload-history reconciliation.
- [Nature Frontiers Facebook daily draft — run 40283292743](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803928): SKIPPED, not successful Meta integration evidence.

The structured prompt builder is covered by regression tests and produces a prompt; the current TTS workflow still consumes authored scripts rather than automatically invoking an LLM. Prompt-builder integration into an automated authoring service is not claimed. These results apply to source/test SHA `bbde79e1f3f589f1737e3ea95512a412e5c91d61`, not automatically to later documentation descendants. Fetch and inspect workflows on the exact current PR head before release decisions.

## Relationship and media limitations

The code now has a tested internal parent relationship gate and a separate publication-stage native Related video gate. It does not autonomously set the native YouTube Studio Related video feature. A reviewer must verify it in Studio and retain evidence naming both the Short and parent video IDs.

No real source asset set, generated wildlife sequence, final narration, final captions, finished MP4, rights packet or full-playback editorial review was supplied or independently verified in this execution. No production export was rendered. The code cannot claim naturalistic visual quality, zero reused-content risk, zero copyright claims or monetization eligibility.

## Acceptance status

- Content-quality gate implementation: code checks passed on the source/test SHA; genuine production assets and human editorial review remain BLOCKED_EXTERNAL.
- Internal Short-parent linkage: automated gate tested; native Related video configuration remains NOT_TESTED until Studio evidence exists.
- Code acceptance: BLOCKED overall because the full dashboard matrix, complete branch-only history review, cross-process/fault-injection/recovery drills and deployment acceptance remain incomplete.
- Production acceptance: BLOCKED.
- Public/unattended YouTube publishing: disabled.
- Facebook live publishing: disabled; workflow skipped.
- Safari campaigns: inactive.
- Approved Selar destination remains exactly `https://selar.com/0u19v8u99l`.
