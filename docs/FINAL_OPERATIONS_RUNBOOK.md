> **Current release status — 2026-10-25:** See the [authoritative current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-25.md). Exact tested code candidate: `aebb25d5ce795090cb6383ba8e533ccd23a147ee`. Automated checks pass (238 Node tests, 8 Python tests, 5 Chromium E2E tests, clean installs and zero npm-audit vulnerabilities), but **code acceptance remains BLOCKED** by incomplete full control coverage and branch-history review; **production acceptance remains BLOCKED** by genuine media/rights, account, authorization, integration, recovery and deployment gates. This status supersedes older checkpoint wording where it conflicts.

# Final operations runbook

## Authoritative current acceptance status — 25 October 2026

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Automated checks pass on the exact code/test SHA below, but full dashboard-control acceptance, complete divergent-history review, isolated recovery drills, real-account integration and deployment acceptance remain incomplete.

### Exact Git state
- Implementation branch: `codex/marketing-machine-audit-fixes`; tested code/test SHA: `030efdd5d006bfcc096051b0a9e091656abfb77e`.
- Current PR HEAD will be a documentation-only descendant of this tested candidate; see [live PR metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Current compare: **1,023 ahead, 2 behind, 110 changed files**. The full branch-only history has not been reviewed patch by patch. PR #1 remains open, draft and unmerged. No direct `main` edit or destructive history operation was performed.

### Exact-SHA CI
- [Automation/security — run 40174445376](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40174445376): **PASS** — 243 Node tests, 0 failed/0 skipped; 8 Python tests; locked and normal `npm ci`; Google API import; JS syntax/Python compilation; 16 queue items; `npm audit`: 0 vulnerabilities across 49 packages.
- [Browser E2E — run 40174445382](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40174445382): **PASS** — 5 Chromium journeys against the local dashboard/backend; not every visible control is covered.
- [Content quality — run 40174445428](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40174445428): **PASS**.
- [Metadata — run 40174445371](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40174445371): **PASS**.
- [Production readiness — run 40174445375](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40174445375): **BLOCKED as required: 12 mandatory blockers**; retained diagnostic [artifact 12590883990](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40174445375/artifacts/12590883990).
- [Facebook daily draft — run 40174445374](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40174445374): **SKIPPED** on PR event; not default-branch acceptance evidence.

### Code fixes in this candidate
- Approval artifact directory creation now uses component-by-component symlink/non-directory checks before nested writes. Four new path-safety tests cover safe creation, symlink ancestors, file ancestors and dashboard use of the guard.
- Validation-task start and result persistence now use the cross-process state lock. A durable `RUNNING` record prevents duplicate launches across two dashboard processes sharing state; the regression test exercises concurrent submissions.
- Existing approval transaction rollback, atomic JSON path checks, Facebook history restoration safeguards, dashboard handler wiring, schedule/queue invariants and publishing safety tests remain covered.

### Acceptance and owner actions
- [x] Exact-SHA automation, install, dependency audit, content and metadata checks pass.
- [x] Five browser journeys pass.
- [x] Public/unattended YouTube publishing and Facebook live publishing remain disabled.
- [ ] Full dashboard-control browser acceptance and complete branch-history review/reconciliation.
- [ ] Isolated crash, rollback, backup/restore and deployment drills with retained evidence.
- [ ] Genuine rights-cleared Short/long-form media, validated manifests/checksums and human review.
- [ ] Verified SonicVhibez OAuth/channel identity, remote-history reconciliation, one-shot authorization and verified private-upload receipt.
- [ ] Verified Nature Frontiers Page permissions and successful default-branch Facebook draft run with retained artifact.
- [ ] Production monitoring, backup, emergency stop and deployment acceptance.

No real YouTube upload, public post or live Facebook post was performed. The sole approved Selar destination remains `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive. See [the current release evidence](CURRENT_RELEASE_EVIDENCE_2026-10-25.md).

## Historical release assessment — 24 October 2026 (superseded)

**Latest application-code candidate:** `df5d28560a757fb185a020982f981fb1ce6722c7` (Google API client dependency and lockfile upgrade). Exact-head checks passed on `36b9e34285a9becb3ad3305f1147b5e831d7bf16`, a documentation-only descendant containing the same application code and dependency tree.
**PR #1:** [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
**Branch comparison at exact test head `36b9e34285a9becb3ad3305f1147b5e831d7bf16`:** 896 commits ahead, 2 behind `main`; 94 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Do not merge, reset, force-push, or rewrite divergent history without the owner's explicit decision.

### Exact-SHA evidence

- [Automation validation — run 40125752411](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752411): **PASS** on exact test head `36b9e34285a9becb3ad3305f1147b5e831d7bf16`; **206 Node tests passed, 0 failed, 0 skipped**; Python safety tests: **8 passed**; 16 queued topics passed safe-state/destination checks; campaign validation, JavaScript syntax and Python compilation passed. A clean isolated normal lifecycle-script `npm ci` passed and `googleapis` imported successfully.
- [Metadata validation — run 40125752409](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752409): **PASS** on the same exact test head.
- [Content quality — run 40125752405](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752405): **PASS** on the same exact test head.
- [Locked install/lockfile validation — run 40125748862](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125748862): **PASS** on the same exact test head; clean locked installation and configuration checks passed.
- [Production-readiness diagnostic — run 40125752527](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752527): **BLOCKED as intended** because mandatory production prerequisites remain unresolved. The `sonicvhibez-readiness-report` artifact was retained (artifact ID `12573171174`; expires 23 November 2026). This is not a readiness pass.
- [Nature Frontiers Facebook draft — run 40125752399](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752399): **SKIPPED** on the pull-request event. No default-branch draft or retained default-branch artifact is established by this run.

### Implemented in this audit

- The read-only readiness CLI exits with status 2 when mandatory gates are blocked and prints the complete blocker report; it exits 0 only when checks find no blockers.
- The dashboard readiness parser accepts the explicit blocked status and preserves actionable blockers rather than collapsing them into a generic validator error.
- The production-readiness workflow uses Node.js 24, runs for relevant pull-request paths, retains its diagnostic artifact, and fails the readiness gate while production prerequisites remain blocked.
- Pull-request validation workflows check out the exact pull-request head SHA rather than GitHub's synthetic merge ref. The automation workflow also verifies a normal lifecycle-script install in a clean temporary checkout with no credentials in its environment.
- Publication minimum spacing is configuration-driven across schedule validation, readiness checks, dashboard checks and the pre-upload history gate. The default remains 72 hours. The configured value must be finite, positive and at most 8,760 hours; cycle duration must equal the configured gap multiplied by the three-item cycle, and schedule, queue and spacing policy must agree. A regression test confirms a consistent 96-hour configuration is accepted.
- Upgraded `googleapis` from `^144.0.0` to `^188.0.0`; the lockfile now resolves `googleapis 188.0.0`, `gaxios 8.3.2` and `googleapis-common 9.3.1`. Exact-head npm audit reports **0 vulnerabilities** across all severities. The four previously reported moderate advisories are resolved in the audited lockfile; live OAuth/API account acceptance remains unverified.
- Publication cadence remains a rolling `long_form → long_form → short` cycle; the default 72-hour gap means at least 216 hours across three cyclic gaps. Tuesday/Saturday triggers are draft preparation only; no three-posts-per-week promise is made.

### Branch-divergence reconciliation

The live comparison is 896 ahead / 2 behind at the exact test head, with merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. The two base-only commits are file-only test churn: `71578dafc24e5d48173dce3f4e392e18e42aa40e` added `test/restore-facebook-draft-history.test.mjs` (117 lines), and `fa00d28e7f58911482686e4ad69fac9f4701a2e6` removed that same test file. They do not change runtime code. The implementation branch lacks this dedicated test file; owner review should decide whether to reintroduce its cross-run history-restoration coverage as a separately reviewed test. No merge, reset, force-push or history rewrite was performed.

### Current acceptance register

| Gate | Status | Evidence / next action |
|---|---|---|
| Node.js automated tests | PASS | 206 passed, 0 failed, 0 skipped on exact test head. |
| Python safety tests | PASS | 8 passed on exact test head. |
| Campaign, queue, schedule, syntax and compilation checks | PASS | Exact-head automation workflow above. |
| Normal lifecycle-script installation | PASS | Isolated clean checkout, no credentials, normal `npm ci`, and `googleapis` import passed. |
| Dependency audit | PASS | `npm audit`: 0 info, 0 low, 0 moderate, 0 high, 0 critical; total 0. |
| Configurable publication spacing | PASS | Default 72 hours; schedule, queue, dashboard, readiness and upload history gate use the validated configured value. |
| Readiness reporting fails closed | PASS | CLI returns status 2 with actionable blockers; dashboard returns HTTP 503 while mandatory production prerequisites are missing. |
| Clean-start dashboard/browser acceptance | NOT RUN | Exercise every visible control, authentication failure, API persistence, restart and error paths using the real app. |
| Real Short and long-form production media | OWNER ACTION REQUIRED | Supply genuine assets, completed manifests, rights evidence, checksums, full renders, full-file decode reports and human playback review bound to final hashes. |
| YouTube OAuth and channel identity | OWNER ACTION REQUIRED | Configure secrets securely, verify authenticated channel is SonicVhibez, retrieve complete public/private/unlisted history and reconcile uncertain attempts. |
| Private upload | OWNER ACTION REQUIRED | No live upload attempted. Require one-operation authorization, durable pre-insert ledger, private-only request and remotely verified private receipt. |
| Facebook integration | OWNER ACTION REQUIRED | Verify Nature Frontiers Page identity, token scopes and default-branch draft/artifact retention; live publishing remains disabled. |
| Backup/restore/restart drill | OWNER ACTION REQUIRED | Perform isolated restore and interruption/restart/concurrency tests; retain logs and checksums. |
| Branch divergence/test-file incident | OWNER ACTION REQUIRED | Review whether to restore the dedicated test coverage; no history rewrite or merge performed. |
| Production acceptance | BLOCKED | Mandatory media, identity, integration, recovery and owner-approval gates remain open. |

**Safety defaults:** public and unattended YouTube publishing remain disabled; a private upload requires explicit operation-specific authorization; Facebook live publishing remains disabled with dry-run and emergency-stop safeguards; the only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive.

**Verdict:** automated code checks and dependency audit pass on the stated exact test head; **CODE-LEVEL ACCEPTANCE REMAINS BLOCKED** pending remaining runtime verification. **PRODUCTION ACCEPTANCE IS BLOCKED.**

---

## Historical checkpoint material


- Latest verified code/test checkpoint: `1155263c25e85f901b9245fd4e024898a1af6f19`. Later commits update documentation only. Base `main`: `45352b73bb6cc4787b2a49988b575afb754ab627`. PR #1 remains open, draft and unmerged; use PR #1 for the exact live documentation HEAD and comparison.
- All three validation workflows and the daily Facebook draft workflow passed on the exact code/test checkpoint: [automation — run 40091734573](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734573), [metadata — run 40091734584](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734584), [content quality — run 40091734600](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734600), [daily Facebook draft — run 40091734576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576). Each reports 139 Node tests passed, 0 failed, 0 skipped. Automation also passed 8 Python safety tests, JavaScript syntax checks and Python compilation. CI verified `npm ci --ignore-scripts` (46 packages added, 47 audited); ordinary `npm ci` remains unverified.
- Daily Facebook draft automation generates an idempotent research-only JSON package using `Africa/Johannesburg`, checks local editorial state where available, assigns an 08:00/18:00 experiment arm and retains an artifact. [Verified artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856). The observed run detected the 08:00 SAST slot had passed and returned `MISSED_SLOT_REVIEW_REQUIRED`; it did not backdate or batch-publish. Scheduled triggers execute only on the default branch; PR #1 remains draft, so this is not an active production daily trigger.
- Facebook approval fingerprints bind claims/source and media/licensing/provenance/disclosure fields. Keyed Meta credential fingerprints invalidate old Page permission attestations after Page token, user token or operator-secret rotation. These tests do not establish real Page identity, current permissions, Page Insights, licence authenticity or publication.
- npm audit reports 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`. A major Google API client upgrade remains untested and unapplied.
- YouTube publication policy is now a rolling `long_form → long_form → short` cycle with 72 elapsed hours between consecutive actual publications (216 hours for three cyclic gaps). Tuesday/Saturday remains draft-only; stale weekly-count fields are removed; live history reconciliation and explicit private-upload authorization remain required. Public YouTube publishing remains disabled.
- Production acceptance remains blocked by genuine rights-cleared media/manifests and full decode/playback, final-hash-bound human review, secure verified SonicVhibez OAuth identity, explicit authorization for a private upload and verified receipt, owner-run restart/restore acceptance, complete remote history reconciliation, and owner-provided Meta Page credentials/permissions plus a reviewed real Facebook test operation. Safari remains inactive pending exact HTTPS destination, disclosure and approval.

---

## Last fully verified code checkpoint before this documentation refresh — 2026-10-24

- Verified code/test HEAD: `68dd24f7a369a8bdb4ddb2513127e9bf3a0044e3`; PR #1 was open, draft and unmerged against `main`. The subsequent commits in this documentation refresh change documentation only; the final branch HEAD and its CI are reported in the PR description and completion response.
- All three GitHub Actions validation workflows passed on that exact code/test HEAD, each with 107 passed, 0 failed, 0 skipped: [automation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496654), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496646), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40082496600).
- The automation run passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and 8 Python safety tests. The metadata workflow intentionally verifies that `npm run check` fails closed while production metadata remains incomplete; that is a successful safety check, not production readiness. Plain `npm ci` without `--ignore-scripts` remains unverified.
- Schedule implementation converts configured 17:00 local time with IANA timezone rules, validates elapsed-hour gaps and local dates, and applies schedule/spacing checks to dashboard draft creation, draft updates and direct job creation. The dashboard state/readiness responses and CLI production-readiness report explicitly show that complete remote channel history reconciliation is required before upload. The Tuesday/Saturday slots remain draft preparation only.
- The rolling three-publication cycle is implemented in configuration, queue validation and the pre-upload history gate. The Tuesday/Saturday schedule remains draft preparation only. Live owner-reviewed history reconciliation, OAuth verification and a separate private-upload authorization remain blocked; public publishing stays disabled.
- Production acceptance remains blocked by genuine rights-cleared source media and manifests, real rendered and fully decoded exports, human review bound to final hashes, secure live SonicVhibez OAuth identity verification, one explicitly authorized private upload with remote private-status receipt, and owner-run restart/backup-restore acceptance. Safari remains inactive until exact HTTPS destination, disclosure and owner approval exist.

# SonicVhibez operations runbook

This repository is a draft-generation and gated private-upload system. It is not an unattended public-publishing system.

## Scheduled draft generation

The workflow `.github/workflows/free-narration-artifact.yml` runs Tuesdays and Saturdays at 15:00 UTC (17:00 in South Africa while SAST is UTC+2). It generates a US-English narration package, estimated SRT captions, a 1080x1920 text-led review video, and a thumbnail/provenance record. GitHub-hosted scheduled workflows can be delayed; the cadence is a target, not a guaranteed delivery SLA.

Open Actions → Generate free narration audio to inspect the latest run. Download the `sonicvhibez-short-draft-package` artifact. The package includes:
- `rendered-drafts/*-DRAFT.mp4`: text-led visual review draft, not a finished wildlife documentary;
- matching `.json`: held metadata;
- `thumbnail.jpg` and `thumbnail-rights-evidence.json`;
- queue package narration `.mp3`, script `.txt`, and estimated captions `.srt`.

## Before any upload

1. Listen to the complete narration and watch the entire MP4.
2. Check each factual statement against reliable sources; correct any claim that cannot be verified.
3. Replace the text-only visuals with suitable wildlife footage only when each clip's license/permission and required attribution have been checked. Keep evidence for every asset.
4. Check that the voice, audio, visuals, music, thumbnail, and captions are suitable for publication; align captions to actual speech.
5. Confirm the thumbnail represents the actual video and is not misleading.
6. Check the title and description, including clear disclosure that the Selar resource is promotional.
7. Keep the only permitted product URL exactly `https://selar.com/0u19v8u99l`.
8. Confirm the destination channel is SonicVhibez. Never use the Nature Frontiers YouTube channel for these promotions.

## Prepare reviewed metadata

Create or edit `content/next-short.json` from the JSON matching the selected artifact's MP4. Preserve the exact `queueItemId`, `title`, and `productUrl` from that artifact so the handoff workflow can match them. Do not mark a review complete until it actually is.

Only after completing the checks above, set:
- `status`: `READY_FOR_PRIVATE_UPLOAD`
- `channelId`: the verified SonicVhibez YouTube channel ID (must match the GitHub secret)
- `rightsConfirmed`: `true` only after documenting rights for all final media
- `complianceReviewed`: `true` only after factual, disclosure, platform-policy, and metadata review
- `visibility`: `private`

Never set these values just to bypass the gates.

## Private upload handoff

1. Add the four GitHub Actions repository secrets: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, and `SONICVHIBEZ_CHANNEL_ID`. Use YouTube OAuth credentials authorized for the intended channel. Never commit secrets or paste them into logs.
2. Open Actions → Upload reviewed artifact privately → Run workflow.
3. Enter the successful draft-generation run ID as `source_run_id`; set `reviewed_metadata_path` to `content/next-short.json` unless you have deliberately added a different reviewed JSON file to the repository.
4. Inspect the run log and receipt artifact. Confirm the uploaded video's visibility is private and the returned channel/video identifiers are correct.
5. If any gate fails, do not weaken the gate. Correct the underlying issue and retry.

## Public posting

Public publishing is deliberately disabled. The project does not currently auto-publish public videos or guarantee that the two scheduled jobs will run exactly on time. Do not enable public posting until the end-to-end private workflow is verified, media rights and platform compliance are established, and an explicit publishing authorization is provided.

## Current known limitation

The automated renderer creates a polished text-led draft. It does not automatically source, license, or edit wildlife B-roll into a finished documentary. A thumbnail provenance record does not establish rights to any video footage. All such rights remain unconfirmed until reviewed by a human.


## Current release evidence snapshot — 2026-10-24

Current tested code candidate: `9dd102f9636a5ba71c797cf79c104d3616cbe14e`. Exact-SHA automation validation [40122567804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567804) passed with advisories: 205 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; 16 queue topics validated; JavaScript syntax and Python compilation passed. Metadata [40122567802](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567802), content quality [40122567799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567799), and locked installation [40122564222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122564222) passed. Daily Facebook draft [40122567717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567717) was **SKIPPED** on the PR event and does not prove a default-branch artifact. The restore code now rejects symlinked destination paths before writing, with regression tests in `test/backup-restore.test.mjs`. Four moderate dependency advisories remain. This snapshot is historical for the tested code candidate; see [the current release register](GO_LIVE_BLOCKERS.md) for owner actions and production blockers. This docs-only update is not represented by the run links above; its exact-head CI is recorded in PR #1 after completion. Verdict: **CODE-LEVEL ACCEPTANCE BLOCKED; PRODUCTION ACCEPTANCE BLOCKED**.
