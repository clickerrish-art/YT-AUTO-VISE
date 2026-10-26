# Current release evidence — 26 October 2026

## Git and PR state

- Repository: `clickerrish-art/YT-AUTO-VISE`
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Source/test SHA with the new content-quality gates: `be11490345ae89938c32af1496f01b75ae20134a`
- Main SHA at the source/test checkpoint: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Divergence at source/test checkpoint: 1,289 commits ahead, 2 behind, 139 changed files.
- PR #1 is open, draft and unmerged. Subsequent documentation commits have advanced the branch; the live PR head must be fetched before using this report as the final-head checkpoint.
- No merge, reset, rebase, force-push, history rewrite, upload, public post or campaign activation occurred.

## Implemented source changes

The source/test candidate adds `scripts/content-quality-gates.mjs`, `scripts/validate-content-quality.mjs`, the source-constrained prompt builder `scripts/build-script-generation-prompt.mjs`, and `scripts/validate-rendered-audio.mjs`. Both renderers require `qualityEvidencePath` and run this gate before FFmpeg. They no longer loop a source clip to fake target duration; they apply seed-bound fit/crop and subtle bounded colour grading, use profile-based audio filtering/compression/loudness normalization/fades, and measure the actual rendered MP4's integrated loudness and true peak before reporting success. The gate validates:

- measured script word count and differentiated sections, source-backed claims and a retained similarity-review record;
- asset provenance and original SHA-256 values against actual files, with commercial-use permission and human rights verification fields;
- deterministic scene selection from a recorded seed and matching edit-plan hash;
- audio profile, measured integrated loudness, true peak, music/ambience separation, fades, rights and human-verified transcript matching, bound to the exact narration bytes;
- a human editorial approval record;
- for Shorts, explicit parent content ID, same cycle, approved parent revision and media hash, SonicVhibez identity, verified remote parent video ID and canonical watch URL.

The native YouTube Related video setting is intentionally separate. Internal relationship validation and a description URL do not prove that YouTube Studio's Related video feature is configured. The publication-stage validator requires `youtubeRelatedVideoStatus=VERIFIED`; manual Studio verification and retained evidence remain necessary.

## Exact source/test SHA CI evidence

All links below are workflows associated with source/test SHA `be11490345ae89938c32af1496f01b75ae20134a`.

- [Automation/security — run 40284726836](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803930): PASS; 299 Node tests passed, 0 failed; npm audit reported 0 vulnerabilities. The workflow also ran clean/locked install checks and other repository validations.
- [Content quality — run 40284726814](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803919): PASS.
- [Metadata validation — run 40284726766](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803925): PASS.
- [Dashboard browser E2E — run 40284726765](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282804001): PASS.
- [Isolated main/candidate baseline — run 40284726848](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803924): PASS.
- [Production readiness — run 40284726890](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803929): BLOCKED as expected; human-readable and JSON readiness returned 2/2 and retained the diagnostic artifact. The blockers include missing verified media manifests, channel ID, OAuth credentials, owner-approved cadence decision and complete upload-history reconciliation.
- [Nature Frontiers Facebook daily draft — run 40284726775](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40282803928): SKIPPED, not successful Meta integration evidence.

The structured prompt builder is covered by regression tests and produces a prompt; the current TTS workflow still consumes authored scripts rather than automatically invoking an LLM. The deterministic visual adjustments are limited to framing/colour grading of the single manifest footage input; the pipeline does not yet compose a multi-scene storyboard automatically. Prompt-builder integration into an automated authoring service is not claimed. These results apply to source/test SHA `be11490345ae89938c32af1496f01b75ae20134a`, not automatically to later documentation descendants. Fetch and inspect workflows on the exact current PR head before release decisions.

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


## Exact PR/documentation-descendant CI checkpoint

At the time this section was written, live PR metadata reported documentation descendant `5f4cff95e4119f9175bd4b96f702e405aed58a3f`, while this document's application source/test SHA remains `be11490345ae89938c32af1496f01b75ae20134a`. This resolves the stale PR body/documentation SHA discrepancy; the PR body still contains an older historical checkpoint and should not be treated as live-ref evidence.

Exact-HEAD workflow results for documentation descendant `5f4cff95e4119f9175bd4b96f702e405aed58a3f`:

- [Automation/security — run 40284364171](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364171): PASS; 299 Node tests passed, 0 failed; npm audit total 0 vulnerabilities.
- [Dashboard browser E2E — run 40284364156](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364156): PASS; 10 Chromium tests passed.
- [Isolated main/candidate baseline — run 40284364148](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364148): PASS.
- [Metadata — run 40284364176](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364176): PASS.
- [Content quality — run 40284364278](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364278): PASS.
- [Production readiness — run 40284364175](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364175): BLOCKED as intended by external production prerequisites.
- [Facebook daily draft — run 40284364164](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284364164): SKIPPED, not Meta integration evidence.

The current PR head at the next fetch may be newer if further documentation commits are made. Do not conflate the application source/test SHA with the PR's documentation descendant SHA.


## Native Related video visibility restriction — official source

The official [YouTube Help instructions for adding a Related video to Shorts](https://support.google.com/youtube/answer/14075157?hl=en-GB) state that the selected target must be **public or unlisted**, and that the channel must have advanced feature access. A private parent is therefore ineligible for the native Related video feature. This repository's private-only upload posture and disabled public/unattended publishing mean the native association is blocked until the owner separately authorizes an eligible parent visibility or decides not to use the native feature. No visibility change was made. The publication-stage relationship validator now rejects private or unknown parent visibility.

## Exact documentation-descendant CI — 26 October 2026

Live PR metadata at this checkpoint reported documentation descendant `06d70ecd28c9ae8330f81cb0ad94c4b4a6351fa2`; application source/test SHA is `be11490345ae89938c32af1496f01b75ae20134a`. The current exact-HEAD runs for that documentation descendant are:

- [Automation/security — run 40284745178](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745178): PASS; 299 Node tests passed, 0 failed; npm audit total 0 vulnerabilities.
- [Browser E2E — run 40284745158](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745158): PASS; 10 Chromium tests.
- [Isolated baseline — run 40284745184](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745184): PASS.
- [Metadata — run 40284745239](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745239): PASS.
- [Content quality — run 40284745194](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745194): PASS.
- [Production readiness — run 40284745174](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745174): BLOCKED as expected.
- [Facebook draft — run 40284745168](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284745168): SKIPPED.


## Latest source/test checkpoint — 26 October 2026

A subsequent branch-only change `390919713da239968d391ec7b715dd6173035f3e` adds queued jobs to active publication-spacing checks, so queued timestamps reserve slots. Regression test `e65e859e44f254edddb735def44ca1b8095ab627` verifies same-day collisions, the exact 72-hour boundary and missing queued timestamps. The current source/test SHA is therefore `e65e859e44f254edddb735def44ca1b8095ab627`; the preceding `be11490345ae89938c32af1496f01b75ae20134a` checkpoint remains useful for the Related video visibility-gate change but is no longer the latest test commit.

Exact SHA workflow status at time of update:
- [Automation/security — run 40284971980](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284971980): PASS; 300 Node tests passed, 0 failed; npm audit total 0 vulnerabilities.
- [Content quality — run 40284972016](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284972016): PASS.
- [Metadata — run 40284972151](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284972151): PASS.
- [Isolated main/candidate baseline — run 40284971993](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284971993): PASS.
- [Production readiness — run 40284972044](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284972044): BLOCKED as expected by real prerequisites.
- [Facebook daily draft — run 40284972048](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284972048): SKIPPED.
- [Dashboard browser E2E — run 40284971984](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40284971984): IN PROGRESS at the time of this note; do not claim it passed on this SHA until the run completes.


## Script-generation provider implementation — 26 October 2026

Implementation commits:
- https://github.com/clickerrish-art/YT-AUTO-VISE/commit/1a393a652fd89bf1516b61a3ad1be74f73fbf79b — added `scripts/generate-script.mjs`, an optional configurable OpenAI-compatible provider that defaults to a loopback endpoint.
- https://github.com/clickerrish-art/YT-AUTO-VISE/commit/6182af1255ecf780b8ffd507eee9bc458136a33e — added regression tests for valid output, source URL substitution, malformed output, remote plaintext endpoint rejection and provider failure.
- https://github.com/clickerrish-art/YT-AUTO-VISE/commit/14bc3daf8faaade5d79275cd8c9b32f56f340d5a — added the `npm run script:generate` command.
- https://github.com/clickerrish-art/YT-AUTO-VISE/commit/12c089305be633d12db29172f4e531d2417d7ad4 — prompt source listing now includes stable source IDs.

The generator does not claim factual accuracy or originality based on model assertions. It verifies returned source identifiers/titles/URLs against the brief, measures narration and structure, requires section narration to concatenate exactly to the transcript, forces similarity review back to PENDING, and sets `publishable=false`. It emits JSON to stdout and does not write production state or call publication APIs. Configure `SCRIPT_GENERATION_ENDPOINT`, `SCRIPT_GENERATION_MODEL`, and optionally `SCRIPT_GENERATION_API_KEY`; loopback HTTP and HTTPS endpoints are permitted, remote plaintext HTTP is rejected. Default endpoint is `http://127.0.0.1:1234/v1/chat/completions`.

**Integration limitation:** this is now an executable generation command, but it is not yet a dashboard/lifecycle worker integration. Research provenance, similarity review, editorial review, actual rendered speech duration and final artifact approval remain independent gates. The new tests and full regression suites must be confirmed on the exact current HEAD before this addition is marked PASS. Production remains BLOCKED.
