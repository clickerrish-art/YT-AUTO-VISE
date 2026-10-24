# CURRENT CANDIDATE — 2026-10-24 (latest verified status)

- Branch: `codex/marketing-machine-audit-fixes`; tested code SHA: `4c2cb1c82dbc5cf36bd47a8b179645a7cb07d004`.
- PR #1: open, draft, unmerged — https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1.
- Branch comparison: 717 commits ahead, 2 behind `main`; base HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Preserve the disclosed accidental test-file add/delete incident for owner review; no merge or history rewrite performed.
- Exact-SHA CI passed:
  - Automation [run 40100161525](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100161525): 159 Node tests passed, 0 failed/skipped; 8 Python safety tests passed; `npm ci --ignore-scripts`, syntax/compilation, campaign/queue checks passed.
  - Content quality [run 40100161522](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100161522): 159 Node tests passed, 0 failed/skipped.
  - Metadata validation [run 40100161580](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100161580): 159 Node tests passed, 0 failed/skipped; schedule, readiness and caption checks passed.
  - Facebook daily draft [run 40100161604](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100161604): skipped on the PR branch; not default-branch acceptance.
- The cycle is `long_form → long_form → short`, minimum 72 elapsed hours between consecutive actual publications and 216 hours across three cyclic gaps. Tuesday/Saturday triggers are draft preparation only. Successful ledger receipts are excluded from future scheduled-slot checks; an exclusive upload lock prevents concurrent inserts and leaves a stale lock fail-closed after a crash.
- Audit remains 4 moderate, 0 high/critical; `gaxios`, `googleapis`, `googleapis-common`, `uuid` remain unresolved. Node 20 deprecation warnings remain for checkout/setup-node v4. CI install used `npm ci --ignore-scripts`; unrestricted install not tested.
- Production acceptance remains BLOCKED: genuine media/licence evidence, human final-hash playback approval, live SonicVhibez OAuth/history reconciliation, separately authorized private upload and remote receipt, default-branch Facebook artifact, Meta identity/permissions, dependency-risk disposition, and owner-accepted backup/restore drill are outstanding. No real upload/post or production restore is claimed.

# Release evidence snapshot — prior checkpoint cb6ca43b7723d903c3e6b78fd3ed662a13498b04 (2026-10-24)

This section records evidence from the preceding branch checkpoint; the commit containing this correction is documentation-only and is not covered by the run links below. See PR #1 for the live branch HEAD and exact current-HEAD workflow links. This is not production acceptance.

- At the preceding evidence checkpoint the implementation branch was `codex/marketing-machine-audit-fixes`, based on `main` at `45352b73bb6cc4787b2a49988b575afb754ab627`. Re-fetch live refs from PR #1 before relying on current counts. PR #1 remains open, draft and unmerged. The last code/test checkpoint remains `703a7d380a63f0d379ca17f0b920279597ea58be`.
- At checkpoint `586e5404ceabf399375e59fc0adad95389367408`, the following PR workflows succeeded: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868763), [metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868753), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868796). The lockfile verification run is [40084865929](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084865929). The lockfile workflow ran `npm ci --ignore-scripts`, 112 Node tests, schedule/campaign validators and syntax checks; it did not execute the lockfile refresh/commit steps because no refresh was needed.
- The automation log at checkpoint `586e5404ceabf399375e59fc0adad95389367408` reports 112 Node tests passed, 0 failed, 0 skipped; Python safety tests: 8 passed. Campaign validation passed, 16 queued topics were held for review, public publishing was disabled, and JavaScript/Python syntax checks passed.
- The automation install at that checkpoint used `npm ci --ignore-scripts` (46 packages added, 47 audited). Plain `npm ci` without `--ignore-scripts` has not been verified.
- Current npm audit: 4 moderate, 0 high, 0 critical. Affected packages/ranges reported by the audit: `gaxios` 6.4.0–6.7.1 (via `uuid`); `googleapis` 33.0.0–149.0.0 (via `googleapis-common`); `googleapis-common` <=7.2.0 (via `uuid`); `uuid` <11.1.1 (v3/v5/v6 buffer bounds-check advisory). npm reports the available `googleapis` fix as 178.0.0, a major upgrade. Do not upgrade blindly; evaluate runtime compatibility and rerun the full suite. Dependency tree is not vulnerability-free.
- Production acceptance remains **BLOCKED**: the rolling cycle and fail-closed history gate are implemented but live channel history/OAuth have not been accepted; genuine assets, retained rights evidence and final-hash human review are absent; one explicitly authorized private upload/remote receipt is unverified; owner-run restart/backup/restore acceptance is outstanding. Safari remains inactive pending exact HTTPS destination, truthful disclosure and explicit owner approval.
- Public publishing remains disabled. GitHub Actions success does not prove that scheduled workflows are active on `main`, and does not prove production media, real rights, live OAuth, upload acceptance or restore acceptance.
- The malformed content-quality URL formerly in PR #1 was corrected to run [40084868796](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868796).

---

## Verified code/test checkpoint and documentation-refresh status — 2026-10-24

- The most recent code/test checkpoint is `703a7d380a63f0d379ca17f0b920279597ea58be`; it passed all three validation workflows: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084232036), [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084232050), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084232178). Logs show 112 Node tests passed, 0 failed, 0 skipped; Python safety tests and syntax/compilation checks also passed.
- A subsequent documentation-only refresh on this branch updated the evidence sections. Its current branch HEAD and its own CI runs are recorded in PR #1; do not mistake the code/test checkpoint above for the documentation commit SHA.
- The [lockfile workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084228825) passed on the code/test checkpoint, including `npm ci --ignore-scripts`, Node tests, schedule/campaign validation and syntax checks. Plain `npm ci` without `--ignore-scripts` remains unverified.
- The latest verified automation audit reports four moderate npm advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`, with no high/critical findings. The available Google API client fix is a major version upgrade and needs compatibility testing. Do not describe dependencies as vulnerability-free.
- Production acceptance remains blocked by owner-supplied genuine rights-cleared media, full decode and human playback review bound to final hashes, secure live SonicVhibez OAuth identity verification, a complete owner-reviewed channel-history reconciliation, one explicitly authorized private upload with a remotely verified private-status receipt, and owner-run restart/backup-restore acceptance. Safari remains inactive until exact HTTPS destination, truthful disclosure and explicit owner approval exist.
- Public publishing remains disabled. The rolling `long_form → long_form → short` publication cycle requires at least 72 complete elapsed hours between each consecutive actual publication (216 hours minimum for three cyclic gaps). Tuesday/Saturday remains draft preparation only; it is not represented as publication cadence.

## Historical checkpoint — superseded by the verified code/test checkpoint above


## Historical checkpoint — superseded by current branch-head verification


# Project Completion Report — SonicVhibez Marketing Machine

## Historical checkpoint — superseded by the current verified baseline above

The code/test commit `62b1bd599d63c3ab1d55b6a6660740fbf3d44157` passed all three GitHub Actions validation workflows with 100 passed, 0 failed, 0 skipped in each: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495157), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495128), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495162). The automation run completed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python compilation.

The later documentation checkpoint `b505a260570afb23de637d599868e55376a827aa` also passed all three workflows with 100 passed, 0 failed, 0 skipped: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034769), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034706), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034728). It was documentation-only relative to the tested code/test commit.

The implemented safeguards include: full production preflight at dashboard readiness; required operator identity in audit events; rights-record hash verification and rechecking retained source/licence file checksums before upload; checksummed backup/restore of state, audit history, rights records, review approvals, upload attempts and receipts; and fail-closed refusal to overwrite a different upload ledger. `.gitignore` excludes local secrets, state, rights records, backups and generated media.

These are automated/code-level checks, not proof of genuine licence authenticity, human playback review, real wildlife renders or a live YouTube upload. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

## Previous implementation checkpoint (superseded by current code/test checkpoint below) — 2026-10-24

Code and regression-test commit: `6b0874b870343cf435099eedf74038bf2e01f58c`. The three GitHub Actions validation workflows passed on this exact commit: 95 tests passed, 0 failed, 0 skipped in each workflow. [Automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083877), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083898), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083943). The automation workflow completed `npm ci --ignore-scripts` and installed/audited 46 packages.

The dashboard `/readyz` endpoint now runs the full production-readiness preflight, includes its actionable blockers, and returns HTTP 503 with `ready: false` when owner-controlled or production prerequisites remain unmet. The new regression test verifies this fail-closed behavior. This is not proof of real wildlife media, license authenticity, human playback review, live OAuth identity, or a real YouTube upload. Public publishing remains disabled and PR #1 remains open, draft and unmerged.


## Previous acceptance checkpoint (superseded by the latest code checkpoint below) — 2026-10-24

Tested implementation commit: `c39c3b88eefb3430dcfedbc0663bef33ad03f45c`. GitHub Actions ran the full Node suite at this commit: 95 passed, 0 failed, 0 skipped. [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766) all passed. The automation workflow also completed `npm ci --ignore-scripts` successfully.

Short and long-form renderers now fail closed on technical export validation errors. This code-test result does not mean a genuine wildlife MP4 was produced: the production manifests and rights-cleared assets are still absent. No live OAuth identity, real private upload, or remote receipt is claimed. Public publishing remains disabled; PR #1 remains draft and unmerged.

## Implemented and tested

- Durable local dashboard state, authenticated API access, loopback-only binding, health/readiness endpoints and audit events.
- Date-specific draft reservations with idempotency, conflict detection and cross-process state locking.
- Fixed, typed dashboard tasks for schedule checks, caption checks, readiness diagnostics, tests and Short/long-form renderers; no browser-triggered arbitrary shell command.
- Both Short and long-form renderers run fail-closed technical export validation before reporting success; checks include duration, resolution/orientation, codecs, audio presence, full-file decode, and measurable audio for Shorts. The dashboard separately verifies checksums, metadata, captions and thumbnail. Real media production remains blocked without rights-cleared inputs.
- Technical validation rechecks media checksums, metadata version and caption structure before rights review.
- Rights verification records each source asset and evidence file, their checksums, permitted uses, restrictions, attribution requirements, verifier and timestamp.
- Human review is authenticated and bound to the actual MP4 checksum, thumbnail, metadata version and verified rights-evidence hash. The resulting approval JSON is persisted under `run-logs/upload-approvals/`.
- The uploader validates all approval-bound files, confirms the authenticated channel ID and exact channel title, writes an attempt ledger before upload, forces `privacyStatus: private`, re-fetches the remote item and verifies channel/privacy, and enters recovery rather than blindly retrying uncertain outcomes.
- Campaign operations are separated: Selar uses the exact approved destination; Safari remains inactive until an exact HTTPS destination and disclosure are previewed and owner-approved.
- `package-lock.json` is committed and clean install was exercised with `npm ci --ignore-scripts`.

## Workflow evidence at implementation SHA `c39c3b88eefb3430dcfedbc0663bef33ad03f45c`

| Workflow | Result | Link |
|---|---|---|
| Content quality | 95 passed, 0 failed, 0 skipped | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766 |
| Automation validation | 95 passed, 0 failed, 0 skipped; campaign isolation and queue checks passed | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712 |
| Metadata/schedule validation | 95 passed, 0 failed, 0 skipped; schedule and captions passed; unreviewed metadata/assets stayed blocked | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732 |
| Clean install | `npm ci --ignore-scripts` passed; 46 packages installed/audited | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712 |
| Main baseline | 54 passed, 0 failed | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047 |

## Acceptance checklist

- **PASS — AUTOMATED POLICY:** rolling long-form → long-form → Short cycle, 72-hour minimum spacing gate, draft-only preparation triggers, exact Selar URL, public publishing disabled. This is not live publication acceptance.
- **PASS:** dashboard integration/authentication, durable drafts, schedule-slot conflict protection, campaign operations and fail-closed rendering paths.
- **PASS:** automated private-uploader mock tests for remote timeout, receipt persistence failure, remote reconciliation, private visibility checks and duplicate-prevention behavior.
- **BLOCKED:** actual rights-cleared Short/long-form MP4 generation and human playback inspection. No genuine production media, checksum, duration or dimensions are claimed.
- **BLOCKED:** live OAuth channel identity verification and real private upload. No credentials or real YouTube upload receipt were available in this implementation environment.
- **BLOCKED:** Safari activation until owner supplies the exact destination and disclosure.
- **NOT CLAIMED:** unattended public posting, automatic visibility changes, or 100% production readiness.

## Media evidence

No genuine wildlife documentary MP4 or production thumbnail was generated during this run because legitimate media inputs and verified rights evidence were not supplied. The render path is implemented and tested to block missing or invalid inputs; test fixtures are not represented as documentary output.

## Owner actions to clear blockers

1. Supply licensed footage, narration and any music, with original permission/license evidence and stable checksums.
2. Fill both render manifests with real files and evidence; generate and inspect actual MP4s with FFmpeg/ffprobe and by playback.
3. Configure secure local dashboard credentials and operator identity.
4. Independently confirm SonicVhibez's channel ID through the authenticated YouTube API and store OAuth credentials only in secure environment variables or GitHub Actions secrets.
5. Complete artifact-bound rights verification and review, then authorize an explicit private-only upload.
6. Supply and approve Safari's exact HTTPS destination and disclosure if that campaign is desired.

PR #1 remains open and draft. Do not merge or enable public publishing as part of this work.


## Acceptance gate documents

- [Go-live blockers and exact owner actions](GO_LIVE_BLOCKERS.md)
- [Release gate checklist](RELEASE_GATE_CHECKLIST.md)

The code implementation is not a 100% production-complete release: real licensed media, independent playback inspection, authenticated SonicVhibez channel confirmation, and a live private-upload receipt remain blocked. Public publishing remains disabled; PR #1 remains open, draft and unmerged.


## Previous branch-head CI checkpoint (superseded)

Docs-only branch head `460f57fdddc48b8eb163ba452e6044a434c0bceb` passed the three validation workflows with 95 passed, 0 failed and 0 skipped: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073783190), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073783221), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073783180). This was a documentation-only commit after the tested runtime implementation `c39c3b88eefb3430dcfedbc0663bef33ad03f45c`; the live-media and private-upload gates remain blocked.


## Historical implementation checkpoint — superseded by the current verified baseline above

- Historical checkpoint only: `4ba995bc51ed2ae0513bc312865713a73e0e3160`. This predates the rolling-cycle and history-gate changes and is **not** current release evidence; check the exact latest branch HEAD and its CI before acceptance.
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305593), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305540), and [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305556) all passed on that code HEAD. Each ran 106 tests: 106 passed, 0 failed, 0 skipped. Automation also passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python safety tests. Metadata validation explicitly confirms that `npm run check` fails closed while real production metadata is incomplete; this is not a release-readiness pass.
- Tuesday/Saturday are draft-preparation triggers only. The rolling publication cycle is long-form → long-form → Short with at least 72 elapsed hours between actual publications. The pre-upload gate requires complete remote public/private/unlisted history and reconciliation of uncertain attempts; live acceptance remains blocked until owner evidence and authorization are supplied.
- PR #1 remains open, draft and unmerged. Public publishing remains disabled. No production MP4, thumbnail, rights clearance, human playback acceptance, live OAuth identity check, private upload receipt, or owner-run restore acceptance is claimed.
- Remaining owner-controlled gates: genuine rights-cleared source assets and completed manifests; rendered/decoded media and human review; secure OAuth identity verification for SonicVhibez; explicit per-operation private-upload authorization; operational backup/restore acceptance. Safari remains inactive until exact destination, disclosure, and owner approval exist.
