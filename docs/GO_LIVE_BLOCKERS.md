# Go-live blockers

## Dependency remediation candidate — verification pending

The `package.json` dependency range has been deliberately advanced from `googleapis ^144.0.0` to `^188.0.0` to address the previously reported moderate advisory chain. The lockfile workflow refreshed `package-lock.json` and its clean locked install/test/configuration checks passed on its triggering candidate. The newest branch head after that bot-generated lockfile commit is `df5d28560a757fb185a020982f981fb1ce6722c7`; exact-head normal-install, full-test and npm-audit evidence is still pending. Do not treat the major upgrade as accepted until those checks pass and the resulting advisory report is reviewed.


## Live release assessment — 24 October 2026

**Latest application-code/test candidate:** `c093143a804299cbf7a673f25e0c19d3f8ea4507`. This is the exact application-code candidate tested by the workflows below. Documentation-only descendants do not change application code; re-fetch the live branch HEAD and its checks before release.
**PR #1:** [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
**Branch comparison at this candidate:** 890 commits ahead, 2 behind `main`; 94 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Do not merge, reset, force-push, or rewrite divergent history without the owner's explicit decision.

### Exact-SHA evidence

- [Automation validation — run 40125043955](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125043955): **PASS** on exact candidate `c093143a804299cbf7a673f25e0c19d3f8ea4507`; 206 Node tests passed, 0 failed, 0 skipped; Python safety tests: 8 passed; campaign/queue/schedule checks, JavaScript syntax and Python compilation passed. The isolated normal lifecycle-script `npm ci` passed and `googleapis` imported successfully. npm audit reported four moderate advisories, zero high and zero critical.
- [Metadata validation — run 40125043948](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125043948): **PASS** on the same exact candidate; 206 Node tests passed, 0 failed, 0 skipped.
- [Content quality — run 40125044071](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125044071): **PASS** on the same exact candidate.
- [Locked install/lockfile validation — run 40125040155](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125040155): **PASS** on the same exact candidate; clean `npm ci --ignore-scripts`, tests and configuration checks passed.
- [Production-readiness diagnostic — run 40125043947](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125043947): **BLOCKED as intended** because mandatory production prerequisites remain unresolved. The `sonicvhibez-readiness-report` artifact was retained (artifact ID `12572064725`; expires 23 November 2026). This is not a readiness pass.
- [Nature Frontiers Facebook draft — run 40125043932](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125043932): **SKIPPED** on the pull-request event. No default-branch draft or retained default-branch artifact is established by this run.

### Changes in this audit

- The read-only readiness CLI exits with status 2 when mandatory gates are blocked and prints the complete blocker report; it exits 0 only when checks find no blockers.
- The dashboard readiness parser accepts the explicit blocked status and preserves actionable blockers rather than collapsing them into a generic validator error.
- The production-readiness workflow uses Node.js 24, runs for relevant pull-request paths, retains its diagnostic artifact, and fails the readiness gate while production prerequisites remain blocked.
- Pull-request validation workflows check out the exact pull-request head SHA rather than GitHub's synthetic merge ref. The automation workflow also verifies a normal lifecycle-script install in a clean temporary checkout with no credentials in its environment.
- The publication minimum gap is now configuration-driven across schedule validation, readiness checks, dashboard checks and the pre-upload history gate. The default remains 72 hours. The configured value must be finite, positive and at most 8,760 hours; cycle duration must equal the gap multiplied by the three-item publication cycle, and the schedule, queue and spacing policy must agree. A regression test confirms a consistent 96-hour configuration is accepted.
- Publication cadence remains a rolling `long_form → long_form → short` cycle; the default 72-hour gap means at least 216 hours across three cyclic gaps. Tuesday/Saturday triggers are draft preparation only; no three-posts-per-week promise is made.

### Branch-divergence reconciliation

The live comparison is 890 ahead / 2 behind, with merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. The two base-only commits are file-only test churn: `71578dafc24e5d48173dce3f4e392e18e42aa40e` added `test/restore-facebook-draft-history.test.mjs` (117 lines), and `fa00d28e7f58911482686e4ad69fac9f4701a2e6` removed that same test file. They do not change runtime code. The implementation branch lacks this dedicated test file; owner review should decide whether to reintroduce its cross-run history-restoration coverage as a separately reviewed test. No merge, reset, force-push or history rewrite was performed.

### Current acceptance register

| Gate | Status | Evidence / next action |
|---|---|---|
| Node.js automated tests | PASS | 206 Node tests passed, 0 failed, 0 skipped on exact code candidate. |
| Python safety tests | PASS | 8 passed on exact code candidate. |
| Campaign, queue, schedule, syntax and compilation checks | PASS | Exact-candidate automation workflow above. |
| Normal lifecycle-script installation | PASS | Isolated clean checkout, no credentials, normal `npm ci`, and `googleapis` import passed. |
| Configurable publication spacing | PASS | Default 72 hours; schedule, queue, dashboard, readiness and upload history gate use the validated configured value. |
| Readiness reporting fails closed | PASS | CLI returns status 2 with actionable blockers; dashboard returns HTTP 503 while mandatory production prerequisites are missing. |
| Dependency audit | BLOCKED | Four moderate advisories remain in `gaxios`, `googleapis`, `googleapis-common` and `uuid`; compatible remediation and risk disposition remain required. |
| Clean-start dashboard/browser acceptance | NOT RUN | Exercise every visible control, authentication failure, API persistence, restart and error paths using the real app. |
| Real Short and long-form production media | OWNER ACTION REQUIRED | Supply genuine assets, completed manifests, rights evidence, checksums, full renders, full-file decode reports and human playback review bound to final hashes. |
| YouTube OAuth and channel identity | OWNER ACTION REQUIRED | Configure secrets securely, verify authenticated channel is SonicVhibez, retrieve complete public/private/unlisted history and reconcile uncertain attempts. |
| Private upload | OWNER ACTION REQUIRED | No live upload attempted. Require one-operation authorization, durable pre-insert ledger, private-only request and remotely verified private receipt. |
| Facebook integration | OWNER ACTION REQUIRED | Verify Nature Frontiers Page identity, token scopes and default-branch draft/artifact retention; live publishing remains disabled. |
| Backup/restore/restart drill | OWNER ACTION REQUIRED | Perform isolated restore and interruption/restart/concurrency tests; retain logs and checksums. |
| Branch divergence/test-file incident | OWNER ACTION REQUIRED | Review whether to restore the dedicated test coverage; no history rewrite or merge performed. |
| Production acceptance | BLOCKED | Mandatory media, identity, integration, dependency, recovery and owner-approval gates remain open. |

**Safety defaults:** public and unattended YouTube publishing remain disabled; a private upload requires explicit operation-specific authorization; Facebook live publishing remains disabled with dry-run and emergency-stop safeguards; the only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive.

**Verdict:** automated code checks pass on the stated exact code candidate; **CODE-LEVEL ACCEPTANCE REMAINS BLOCKED** pending remaining runtime verification and dependency disposition. **PRODUCTION ACCEPTANCE IS BLOCKED.**

---

# HISTORICAL CHECKPOINT — 2026-10-24

This is the current dated evidence snapshot. Older checkpoints below are historical only. If the branch advances, consult PR #1 and the exact-SHA Actions results before treating this snapshot as current.

- Latest exact-SHA verified PR head at this checkpoint: `5a542fd702aee926515718027af850e34a0dc325` (documentation-only refresh). The executable-code change and regression test are in parent candidate `249558377b71eec7b793ad2667bac3cee5594a13`; the report-refresh commit changed this report only.
- PR #1 is open, draft and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1.
- Live branch comparison: 758 commits ahead and 2 behind `main`; current `main` HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; 80 changed files.
- Security implementation: `scripts/dashboard-server.mjs` resolves operator-supplied repository-relative file paths to canonical paths and rejects symlink targets outside the repository. `test/dashboard-server.test.mjs` tests this through the authenticated HTTP upload-reconciliation endpoint using a temporary external fixture; the request is rejected before reconciliation. The earlier dashboard state-path disclosure fix remains covered by HTTP integration assertions.
- Exact-SHA CI for report-refresh candidate `5a542fd702aee926515718027af850e34a0dc325`:
  - Automation validation [run 40108268034](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40108268034): PASS — 160 Node tests passed, 0 failed; 8 Python safety tests passed; queue/campaign checks, JavaScript syntax and Python compilation passed.
  - Content quality [run 40108268023](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40108268023): PASS — 160 Node tests passed, 0 failed.
  - Metadata validation [run 40108268048](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40108268048): PASS — 160 Node tests passed, 0 failed; schedule and caption validation passed; readiness correctly remains blocked.
  - Nature Frontiers daily Facebook draft [run 40108268027](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40108268027): SKIPPED on the PR branch; this is not default-branch production acceptance.
- Dependency audit from run 40108268034: 4 moderate, 0 high, 0 critical advisories. Affected packages: `gaxios`, `googleapis`, `googleapis-common`, and `uuid`. The available Google API remediation is a major upgrade to `googleapis@188.0.0`; it has not been applied without compatibility testing.
- Installation evidence uses `npm ci --ignore-scripts`; unrestricted lifecycle-script installation was not tested.
- Production acceptance remains BLOCKED: genuine licensed source media, complete render manifests/asset register and human playback review are missing; live SonicVhibez OAuth and complete channel-history reconciliation have not been verified; no explicitly authorized private upload or durable remote receipt exists; real Meta identity/default-branch artifact and owner-run backup/restore acceptance are unverified; dependency-risk disposition and branch-divergence review remain open.
- No real YouTube upload or Facebook post is claimed. Public YouTube publishing stays disabled; Facebook live publishing stays disabled/dry-run; Safari remains inactive. Do not merge or perform external mutations without the relevant explicit owner authorization.


---

# HISTORICAL CHECKPOINT — 2026-10-24 (superseded; retained for audit)

- Tested code SHA: `bb9c8d115979ab5aff48ed0ee3ca9afe1bc0fd05`; implementation branch `codex/marketing-machine-audit-fixes`.
- PR #1 remains open, draft and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1.
- Branch comparison at this checkpoint: 746 commits ahead, 2 behind `main`; base HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Preserve the accidental test-file add/delete incident for owner review; no merge or history rewrite was performed.
- Exact-SHA CI passed:
  - Automation validation [run 40100702894](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100702894): 160 Node tests passed, 0 failed/skipped; 8 Python safety tests passed; `npm ci --ignore-scripts`, campaign/queue checks, JavaScript syntax and Python compilation passed.
  - Content quality [run 40100702959](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100702959): 160 Node tests passed, 0 failed/skipped.
  - Metadata validation [run 40100702955](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100702955): 160 Node tests passed, 0 failed/skipped; schedule validation, readiness and captions checks passed.
  - Nature Frontiers daily Facebook draft [run 40100702958](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40100702958): skipped on the PR branch; not default-branch acceptance.
- Rolling publication policy: `long_form → long_form → short`; minimum 72 elapsed hours between consecutive actual publications and 216 hours across the three cyclic gaps. Tuesday/Saturday triggers are draft preparation only. Completed ledger receipts are not re-counted as future slots; an exclusive upload lock prevents concurrent inserts and fails closed after a crash.
- Live uploads now require a separate one-shot authorization bound to the job ID, final video hash, metadata hash, approval hash and verified channel ID. Authorization ID is persisted before insert and cannot be reused. This automated gate does not replace live owner credentials, rights evidence or human approval.
- All eleven inspected workflows now use `actions/checkout@v7` and `actions/setup-node@v7` where applicable, with Node.js 24 and setup-node caching explicitly disabled. Package engine floor is Node.js >=22. The exact SHA above passed on those updated actions.
- Dependency audit remains 4 moderate, 0 high/critical: `gaxios`, `googleapis`, `googleapis-common`, `uuid`. No unsafe major dependency upgrade was applied.
- CI installation used `npm ci --ignore-scripts`; unrestricted lifecycle-script installation was not tested.
- Production acceptance remains BLOCKED: required real short/long manifests and asset register are absent, `media/next-short.mp4` is absent, genuine licence evidence and human final-hash playback approval are not available, live SonicVhibez OAuth/history reconciliation and a separately authorized private upload/remote receipt have not occurred, Meta identity/default-branch artifact remains unverified, and owner-accepted backup/restore drill is outstanding.

- Cross-run history restoration now has mocked API integration tests for valid artifact retrieval, malformed archive failure, HTTPS enforcement and bounded archive size. Same-day retained packages are reused exactly; conflicting same-date artifacts fail closed. These are mocked tests, not proof of a real default-branch artifact restore.
- History remains bounded by GitHub's 14-day artifact retention, not a permanent editorial database. The next authorized default-branch scheduled/manual run must verify real artifact restoration and deduplication.
- Latest npm audit on this tested candidate: 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`; the available `googleapis` remediation is a major version upgrade and remains unmodified pending compatibility testing.
- Production acceptance remains blocked by real Meta Page verification, authorized live-post receipt, genuine media/licensing evidence and human review, live SonicVhibez OAuth/channel verification, explicitly authorized private upload and remote receipt, backup/restore owner acceptance, and live owner-reviewed YouTube history reconciliation remains required.
- No real Facebook post or YouTube upload is claimed. Do not merge, enable public publishing or perform external mutations without separate explicit owner authorization.

---


# Current branch status — 2026-10-24

- Verified code/test checkpoint: `4f144038aba80630494292ec63bc221535881459` on `codex/marketing-machine-audit-fixes`; base `main`: `45352b73bb6cc4787b2a49988b575afb754ab627`. PR #1 was open, draft and unmerged; comparison at this checkpoint was 583 ahead, 0 behind.
- All checkpoint workflows passed: [automation — run 40090594392](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40090594392), [metadata — run 40090594361](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40090594361), [content quality — run 40090594384](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40090594384). Node tests: 133 passed, 0 failed, 0 skipped; automation also passed 8 Python safety tests and syntax/compilation checks. Verified CI install path: `npm ci --ignore-scripts`; plain `npm ci` remains unverified.
- Facebook implementation includes research-first draft ideas, authenticated dashboard UI/API, persistent state/audit, duplicate and one-post-per-local-day checks, source/license checksum gates, disclosure/high-impact claim/external-link checks, exact Selar campaign/pillar restrictions, artifact-bound approvals, live Meta scope/Page/task/token verification, gated Graph API scheduled text/photo publishing, image ffprobe/checksum validation, durable attempts, remote refetch and interrupted-attempt reconciliation. It is disabled by default: `publishingEnabled=false`, `dryRun=true`, `FACEBOOK_PUBLISH_ENABLED=NO`. No real Meta account was verified and no Facebook post was published.
- npm audit remains 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common`, and `uuid`.

## Current owner-controlled production blockers

1. Securely configure `META_USER_ACCESS_TOKEN`, `META_PAGE_ACCESS_TOKEN`, the exact Page ID in config and `NATURE_FRONTIERS_FACEBOOK_PAGE_ID`; run read-only Meta permission/Page verification and review the returned scopes, Page task, ID and token match.
2. Keep Facebook publishing kill switches disabled until the owner explicitly authorizes a real test post. Any real scheduled operation requires current human approval, per-operation confirmation, durable attempt record and remote receipt verification.
3. Supply `CHANNEL_HISTORY_RECONCILIATION_PATH` containing every SonicVhibez remote video ID, format, actual timestamp and visibility; verify the authenticated uploads playlist is complete and resolve every pending/uncertain upload attempt.
4. Supply genuine rights-cleared YouTube media, narration, music, manifests/provenance/checksums, and complete full-file decode and human playback/caption/thumbnail review.
5. Complete final-hash-bound rights/editorial approval, secure live OAuth verification of SonicVhibez, then explicitly authorize one private-only upload and verify its remote ID/receipt.
6. Run and record owner-controlled restart and backup/restore acceptance.
7. Supply exact Safari HTTPS destination, truthful disclosure and explicit owner approval.
8. Resolve four moderate npm advisories through tested compatible upgrades or a documented risk decision.

No live Facebook post, YouTube upload, public publishing or production acceptance is claimed by these CI results.

---






# Release evidence snapshot — prior checkpoint cb6ca43b7723d903c3e6b78fd3ed662a13498b04 (2026-10-24)

This section records evidence from the preceding branch checkpoint; the commit containing this correction is documentation-only and is not covered by the run links below. All links below identify their historical checkpoint explicitly. See PR #1 for the live branch HEAD and exact current-HEAD workflow links. This is not production acceptance.

- At the preceding evidence checkpoint the implementation branch was `codex/marketing-machine-audit-fixes`, based on `main` at `45352b73bb6cc4787b2a49988b575afb754ab627`. Re-fetch live refs from PR #1 before relying on current counts. PR #1 remains open, draft and unmerged. The last code/test checkpoint remains `703a7d380a63f0d379ca17f0b920279597ea58be`.
- At checkpoint `586e5404ceabf399375e59fc0adad95389367408`, the following PR workflows succeeded: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868763), [metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868753), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868796). The lockfile verification run is [40084865929](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084865929). The lockfile workflow ran `npm ci --ignore-scripts`, 112 Node tests, schedule/campaign validators and syntax checks; it did not execute the lockfile refresh/commit steps because no refresh was needed.
- The automation log at checkpoint `586e5404ceabf399375e59fc0adad95389367408` reports 112 Node tests passed, 0 failed, 0 skipped; Python safety tests: 8 passed. Campaign validation passed, 16 queued topics were held for review, public publishing was disabled, and JavaScript/Python syntax checks passed.
- The automation install at that checkpoint used `npm ci --ignore-scripts` (46 packages added, 47 audited). Plain `npm ci` without `--ignore-scripts` has not been verified.
- Current npm audit: 4 moderate, 0 high, 0 critical. Affected packages/ranges reported by the audit: `gaxios` 6.4.0–6.7.1 (via `uuid`); `googleapis` 33.0.0–149.0.0 (via `googleapis-common`); `googleapis-common` <=7.2.0 (via `uuid`); `uuid` <11.1.1 (v3/v5/v6 buffer bounds-check advisory). npm reports the available `googleapis` fix as 178.0.0, a major upgrade. Do not upgrade blindly; evaluate runtime compatibility and rerun the full suite. Dependency tree is not vulnerability-free.
- Production acceptance remains **BLOCKED**: the rolling cycle and fail-closed history gate are implemented but live channel history/OAuth have not been accepted; genuine assets, retained rights evidence and final-hash human review are absent; one explicitly authorized private upload/remote receipt is unverified; owner-run restart/backup/restore acceptance is outstanding. Safari remains inactive pending exact HTTPS destination, truthful disclosure and explicit owner approval.
- Public publishing remains disabled. GitHub Actions success does not prove that scheduled workflows are active on `main`, and does not prove production media, real rights, live OAuth, upload acceptance or restore acceptance.
- The malformed content-quality URL formerly in PR #1 was corrected to run [40084868796](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084868796).

---

# Go-live blockers — SonicVhibez Marketing Machine

## Current publication-spacing control — 2026-10-24

Tuesday/Saturday cron slots are draft-preparation triggers only, not a publication cadence. Actual uploads are gated by the rolling long-form → long-form → Short cycle, 72 elapsed hours from the latest actual publication, complete remote history reconciliation, and a clear upload-attempt ledger. Public publishing remains disabled.


**Acceptance status: BLOCKED for real media release and live YouTube acceptance.** Code and mock tests do not substitute for real rights evidence, media inspection or remote upload verification.

Last review: 2026-10-24. PR #1 remains open, draft and unmerged. Public publishing remains disabled.

| Gate | Status | Owner action | Evidence required to close |
|---|---|---|---|
| Real media | BLOCKED | Supply genuine wildlife footage, narration and any music with permission for commercial YouTube use. | Actual rendered Short and long-form MP4s, real thumbnails/captions, SHA-256 values, ffprobe output, full decode and human playback inspection. |
| Production manifests | BLOCKED | Populate `content/render-manifest.json` and `content/long-form-render-manifest.json` using real existing files; do not promote example placeholders. | Both manifests reference existing, non-empty, validated inputs. |
| Rights | BLOCKED pending owner evidence | Retain original licence/permission documents; verify platform/commercial permissions, attribution, restrictions and expiry per asset. | Evidence files and checksums, source checksums, actual verifier identity and timestamp. A filename or checkbox is not proof. |
| Human review | BLOCKED pending production artifacts | Review exact video, thumbnail, captions, metadata, factual claims, disclosures and synthetic/altered-media flags. | Authenticated decision bound to the final video, thumbnail, caption, metadata and rights-evidence hashes, timestamp and rejection reason where applicable. |
| YouTube identity | BLOCKED | Securely configure `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` and independently confirmed `SONICVHIBEZ_CHANNEL_ID` in a secret store/environment. Never paste secrets into chat. | Authenticated API confirms channel title exactly `SonicVhibez` and channel ID matches configured ID. |
| Live private upload | BLOCKED | After all gates pass, explicitly authorize one private upload; set `CONFIRM_PRIVATE_UPLOAD=YES` only for that operation. | Durable pre-upload attempt, remote video ID, re-fetched remote ownership/private visibility, durable receipt. |
| Safari affiliate | INACTIVE by design | Supply exact HTTPS destination and disclosure if wanted; preview and explicitly approve. | Exact destination, disclosure and owner approval. Until then Safari stays inactive. |
| Plain `npm ci` | NOT VERIFIED | Review install-script effects and run plain `npm ci` in a clean environment if required. | Captured command exit code and output. The evidenced install path is `npm ci --ignore-scripts`. |
| Rolling publication cycle | PASS — AUTOMATED POLICY / BLOCKED — OWNER ACTION FOR LIVE RELEASE | Configuration, queue validation and pre-upload gate require long-form → long-form → Short, at least 72 elapsed hours between consecutive actual publications, and at least 216 hours across three cyclic gaps. Tuesday/Saturday are draft-preparation triggers only. | Provide complete owner-reviewed channel-history reconciliation and resolve all pending/uncertain attempts; live OAuth and a separately authorized private upload remain required. |
| Operator runtime acceptance | PARTIALLY VERIFIED | Run clean local startup, authenticated API checks, restart-persistence and backup/restore. | Captured health/readiness results and persisted-state/restore checks. Automated integration tests alone are not operator acceptance. |

## Non-negotiable controls

- SonicVhibez only; never use Nature Frontiers as the YouTube target.
- Public publishing remains disabled. No public/unlisted upload or unattended public scheduling.
- Preserve the exact Selar destination: `https://selar.com/0u19v8u99l`.
- Never blindly retry an uncertain upload; reconcile the existing attempt with YouTube first.
- Keep PR #1 open, draft and unmerged unless the owner separately authorizes a merge.

## Latest verified code/test checkpoint — 2026-10-24

The code/test commit `62b1bd599d63c3ab1d55b6a6660740fbf3d44157` passed all three GitHub Actions validation workflows with 100 passed, 0 failed, 0 skipped in each: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495157), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495128), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495162). The automation run completed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python compilation.

The later documentation checkpoint `b505a260570afb23de637d599868e55376a827aa` also passed all three workflows with 100 passed, 0 failed, 0 skipped: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034769), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034706), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034728). It was documentation-only relative to the tested code/test commit.

The implemented safeguards include: full production preflight at dashboard readiness; required operator identity in audit events; rights-record hash verification and rechecking retained source/licence file checksums before upload; checksummed backup/restore of state, audit history, rights records, review approvals, upload attempts and receipts; and fail-closed refusal to overwrite a different upload ledger. `.gitignore` excludes local secrets, state, rights records, backups and generated media.

These are automated/code-level checks, not proof of genuine licence authenticity, human playback review, real wildlife renders or a live YouTube upload. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

## Remaining owner-controlled blockers

- Genuine rights-cleared wildlife footage, narration/music and complete Short/long-form manifests.
- Actual media render, ffprobe/full-decode evidence and human playback/editorial review.
- Securely configured and independently verified SonicVhibez OAuth channel identity.
- Explicit per-operation authorization for one private upload, then remote private-status verification and durable receipt.
- Separate operator-run restart and backup/restore acceptance.
- Safari remains inactive until its exact HTTPS destination, disclosure and owner approval are supplied.



## Current branch checkpoint — 2026-10-24

Branch HEAD at the latest verified documentation checkpoint: `54680587e71b5c84074a2c681ed8e95d919a87fd`. The three PR validation workflows passed on this exact SHA: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578167), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578180), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578198). Each reported 100 passed, 0 failed, 0 skipped. The automation workflow verified `npm ci --ignore-scripts` and Python compilation. The metadata workflow deliberately verifies that production checks fail closed while production metadata is incomplete; it is not a production-readiness pass.

These CI results do not close owner-controlled media, rights, human playback, OAuth/channel identity, private upload, or operational restore gates. PR #1 remains open, draft and unmerged; public publishing remains disabled. Recheck this section against the current HEAD before relying on it after future commits.


## Latest verified implementation checkpoint — 2026-10-24

- Historical checkpoint only: `4ba995bc51ed2ae0513bc312865713a73e0e3160`. This predates the rolling-cycle and history-gate changes and is **not** current release evidence; check the exact latest branch HEAD and its CI before acceptance.
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305593), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305540), and [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305556) all passed on that code HEAD. Each ran 106 tests: 106 passed, 0 failed, 0 skipped. Automation also passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python safety tests. Metadata validation explicitly confirms that `npm run check` fails closed while real production metadata is incomplete; this is not a release-readiness pass.
- Tuesday/Saturday are draft-preparation triggers only. The rolling publication cycle is long-form → long-form → Short with at least 72 elapsed hours between actual publications. The pre-upload gate requires complete remote public/private/unlisted history and reconciliation of uncertain attempts; live acceptance remains blocked until owner evidence and authorization are supplied.
- PR #1 remains open, draft and unmerged. Public publishing remains disabled. No production MP4, thumbnail, rights clearance, human playback acceptance, live OAuth identity check, private upload receipt, or owner-run restore acceptance is claimed.
- Remaining owner-controlled gates: genuine rights-cleared source assets and completed manifests; rendered/decoded media and human review; secure OAuth identity verification for SonicVhibez; explicit per-operation private-upload authorization; operational backup/restore acceptance. Safari remains inactive until exact destination, disclosure, and owner approval exist.


## Current implementation delta — rolling publication cycle

The authoritative configuration and queue use the rolling `long_form → long_form → short` sequence, 72 elapsed hours between consecutive actual publications, and 216 hours minimum across the three cyclic gaps; Tuesday/Saturday remain draft-preparation slots only. The upload evaluator now excludes reconciled successful ledger receipts from future-slot checks (remote history remains authoritative), and the uploader uses a cross-process exclusive lock to prevent simultaneous private-upload attempts. A process crash leaves a stale lock that fails closed and requires operator reconciliation rather than automatic deletion. Live uploads still require complete owner-reviewed remote history and unresolved-attempt reconciliation. Automated tests do not constitute live OAuth or upload acceptance.


**Evidence freshness note (2026-10-24):** exact tested code SHA `e86f715ee52522964e2864aead890b8bedf94395` passed all three code/test workflows linked at the top of this document (159 Node tests in each, 0 failures/skips; 8 Python safety tests in Automation validation). Older SHAs and counts elsewhere are historical checkpoints only. The Facebook workflow skip is not live default-branch acceptance.


## Current release evidence register — 2026-10-24

This register was prepared from live CI results for code/test candidate `9dd102f9636a5ba71c797cf79c104d3616cbe14e`. It does not turn mocked or local tests into proof of live external integrations. The docs-only commit carrying this register is not represented by these earlier run links; its exact-head checks are listed in PR #1 after they complete.

### Exact-SHA CI evidence

| Gate | Status | Candidate SHA | Operation and actual result | Evidence | Remaining risk / next action |
|---|---|---|---|---|---|
| Automation and safety suite | PASS with advisories | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | `npm ci --ignore-scripts`; Node tests: 205 passed, 0 failed, 0 skipped; Python safety tests: 8 passed; 16 queue topics validated; JavaScript syntax and Python compilation passed. | [Run 40122567804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567804) | Four moderate npm advisories remain; clean normal lifecycle installation and production runtime are not proven. |
| Metadata, schedule, caption and fail-closed readiness validation | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | `npm ci --ignore-scripts`, 205 Node tests, schedule and caption checks, default production readiness remains blocked as intended. | [Run 40122567802](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567802) | These checks do not prove real media, OAuth identity or external history. |
| Content quality | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | 205 Node tests passed; long-form draft minimum and content-quality assertions passed. | [Run 40122567799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567799) | Content validation does not replace factual, rights or human review. |
| Locked installation / lockfile | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Clean `npm ci --ignore-scripts` and 205 Node tests passed. | [Run 40122564222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122564222) | Lifecycle scripts deliberately not executed; normal install path remains NOT RUN. |
| Daily Nature Frontiers Facebook draft | SKIPPED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | PR-event workflow skipped by its condition; no default-branch run or retained artifact established. | [Run 40122567717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567717) | OWNER ACTION REQUIRED: run on intended default-branch schedule after review and verify retained artifact. |

### Code-level change in this candidate

`scripts/restore-state.mjs` now rejects symbolic links in restore destination paths before writing files, and constrains the configured upload-log directory to the repository root. This prevents a backup restore from writing through a symlink into an unintended external directory. `test/backup-restore.test.mjs` adds regression coverage for symlinked rights and upload-log paths and verifies that rejection happens before state is partially restored.

### Remaining acceptance gates

| Gate | Status | Candidate SHA | Evidence / next action | Owner authorization |
|---|---|---|---|---|
| Node and Python automated tests | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Exact-SHA CI links above; 205 Node and 8 Python tests passed. | No |
| Restore symlink traversal regression | PASS | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Covered by `test/backup-restore.test.mjs` in the exact-SHA test suite. | No |
| Normal lifecycle-script installation | NOT RUN | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Test the supported install path in a trusted, disposable environment after reviewing install scripts. | Yes, environment/operator |
| Full dashboard browser/runtime acceptance | NOT RUN | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Clean-start server, authenticate, exercise every visible control, inspect persisted state and restart recovery. | Yes, operator |
| Genuine media, rights evidence, manifests and exact-hash human review | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Supply genuine licensed assets; render, validate, hash and human-review the final artifacts. | Yes |
| SonicVhibez OAuth identity and channel ID | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Verify the authenticated identity and configured channel independently. | Yes |
| Complete public/private/unlisted remote history and uncertain-attempt reconciliation | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Obtain complete authenticated remote history and reconcile every pending/ambiguous upload. | Yes |
| Single private upload and verified remote receipt | BLOCKED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Only after every prior gate passes, authorize one exact private operation and independently verify its receipt. No upload was performed. | Explicit, operation-specific |
| Nature Frontiers Facebook Page identity/permissions | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Verify Page ID, token validity, scopes and credential fingerprints through authorized configuration. | Yes |
| Default-branch Facebook draft and retained artifact | BLOCKED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | PR run was skipped; verify an actual intended default-branch run and artifact. | Repository owner/reviewer |
| Facebook live publishing | BLOCKED by policy | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Keep `publishingEnabled=false`, dry-run true and live gate disabled. Do not post for testing. | Explicit authorization if later desired |
| Isolated backup/restore/restart drill | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Execute the owner runbook in an isolated directory; record checksums, restart and rollback outcome. | Yes |
| Dependency-risk disposition | BLOCKED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Audit reports 4 moderate, 0 high, 0 critical; assess compatible fixes for `gaxios`, `googleapis`, `googleapis-common`, `uuid`. Avoid blind major upgrades. | Owner/developer decision |
| Branch divergence and test-file incident | OWNER ACTION REQUIRED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Review 878 ahead / 2 behind at tested code candidate `9dd102f9636a5ba71c797cf79c104d3616cbe14e` and base-only add/revert commits before integration; no destructive repair performed. | Yes |
| Production acceptance | BLOCKED | `9dd102f9636a5ba71c797cf79c104d3616cbe14e` | Multiple runtime, external, media and owner gates remain incomplete. | Yes |

Safety invariants remain unchanged: public/unattended YouTube publishing disabled; private upload is a separately authorized one-operation path; Facebook live publishing disabled and dry-run safeguards retained; Safari affiliate campaigns inactive; only approved Selar destination is `https://selar.com/0u19v8u99l`. No live YouTube upload or Facebook post occurred.

**Verdict at tested code candidate `9dd102f9636a5ba71c797cf79c104d3616cbe14e`: CODE-LEVEL ACCEPTANCE BLOCKED; PRODUCTION ACCEPTANCE BLOCKED.**
