# CURRENT CANDIDATE — 2026-10-24 (latest code/test evidence)

## Current release status — 24 October 2026

**Current tested code candidate:** `b7e1a68413edca07900099dd04942c5ef8dcb02b`  
**PR #1:** [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1)  
**Branch comparison at this checkpoint:** 873 commits ahead, 2 behind `main`; 92 changed files. Merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; base head `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. History reconciliation remains an owner decision.

### Exact-SHA CI evidence

All listed completed workflow runs were triggered for code candidate `b7e1a68413edca07900099dd04942c5ef8dcb02b` and their job logs were inspected:

- [Automation validation — run 40121115027](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115027): **PASS WITH MODERATE ADVISORIES**; `npm ci --ignore-scripts`; Node tests 203 passed, 0 failed, 0 skipped; Python safety tests 8 passed; 16 held queue topics validated; campaign checks, JavaScript syntax and Python compilation passed. Fresh locked audit: 4 moderate, 0 high, 0 critical.
- [Metadata validation — run 40121115039](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115039): **PASS**; 203 Node tests passed, 0 failed, 0 skipped; schedule/caption and fail-closed readiness checks passed.
- [Content quality — run 40121115019](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115019): **PASS**; 203 Node tests passed, 0 failed, 0 skipped.
- [Daily Facebook draft — run 40121115017](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115017): **SKIPPED** on the PR event. No default-branch draft artifact is established by this run.
- Combined commit status returned no status entries; no missing status is inferred to have passed.

### Recent code-level changes

- `scripts/schedule-policy.mjs` rejects malformed calendar dates, timezone-free timestamps and invalid offsets. Regression coverage remains in `test/schedule-policy.test.mjs`.
- `scripts/youtube-history-gate.mjs` now strictly validates remote publication timestamps, owner reconciliation verification timestamps and reconciled record timestamps before accepting channel history. `test/youtube-history-gate.test.mjs` adds malformed-date, missing-timezone and invalid-offset cases.
- Exact code candidate: [`b7e1a68413edca07900099dd04942c5ef8dcb02b`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/b7e1a68413edca07900099dd04942c5ef8dcb02b). Exact-SHA workflow runs: [automation 40121115027](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115027), [metadata 40121115039](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115039), and [content quality 40121115019](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115019). All report 203 Node tests passed, 0 failed, 0 skipped; automation also reports 8 Python tests passed. The [daily Facebook draft run 40121115017](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121115017) was skipped on the PR event.
- CI ran `npm ci --ignore-scripts`, not a normal lifecycle-script install. Dependency audit remains 4 moderate, 0 high and 0 critical advisories.

### Acceptance summary

| Gate | Status | Evidence / remaining action |
|---|---|---|
| Node and Python automated tests | PASS | 203 Node and 8 Python safety tests on exact code SHA above. |
| Schedule/campaign/queue/caption/syntax checks | PASS | Exact-SHA CI logs linked above. |
| Malformed timestamp rejection | PASS | New regression cases pass in 203-test suite. |
| Normal lifecycle-script install | NOT RUN | CI deliberately uses `npm ci --ignore-scripts`. |
| Dependency remediation | BLOCKED | Four moderate advisories remain; no untested major Google API upgrade was applied. |
| Full dashboard clean-install end-to-end acceptance | NOT RUN | Every visible action, restart and operator flow not independently exercised end to end. |
| Genuine media, rights evidence and final-hash human review | OWNER ACTION REQUIRED | Supply licensed inputs and complete human review. |
| SonicVhibez OAuth/channel identity and complete remote history | OWNER ACTION REQUIRED | Independently verify identity; reconcile public/private/unlisted videos and uncertain attempts. |
| Single private upload and remote receipt | OWNER ACTION REQUIRED | No upload authorization or live upload occurred. |
| Nature Frontiers Facebook Page/permissions and trusted claim verifier | OWNER ACTION REQUIRED | Verify integration; live publishing remains disabled. |
| Default-branch Facebook draft and retained artifact | BLOCKED | PR run was skipped; verify scheduled/manual default-branch execution and artifact. |
| Isolated backup/restore/restart drill | OWNER ACTION REQUIRED | Run in isolation and retain evidence. |
| Branch divergence and test-file incident | OWNER ACTION REQUIRED | Review both base-only commits and branch integration; no merge/rebase performed. |
| Production acceptance | BLOCKED | External, media, dependency, integration and owner-controlled gates remain open. |

**Safety defaults:** public/unattended YouTube publishing remains disabled; private upload requires separate single-operation authorization; Facebook live publishing remains disabled with dry-run/emergency stop safeguards; only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive. No live YouTube upload or Facebook post was performed.

**Verdict:** `CODE-LEVEL ACCEPTANCE BLOCKED`; production acceptance `BLOCKED`. Automated checks pass, but this does not establish full dashboard end-to-end acceptance or production readiness.

---

## Historical checkpoint material


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

---


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


# Release gate checklist — SonicVhibez Marketing Machine

## Current publication-spacing control — 2026-10-24

Tuesday/Saturday workflow slots are draft-preparation triggers only. Publication follows the rolling `long_form → long_form → short` cycle with at least 72 complete elapsed hours between each consecutive actual publication; three cyclic gaps require at least 216 hours. The upload gate retrieves the authenticated uploads playlist and requires a complete owner-reviewed reconciliation of remote IDs, actual timestamps, formats and public/private/unlisted visibility, plus a clear attempt ledger. Missing history or unresolved attempts blocks upload. Public publishing remains disabled.


Keep each item unchecked until evidence has actually been inspected. Automated tests and mocks do not close real-world acceptance gates.

## Historical checkpoint — superseded by the current verified baseline above

The code/test commit `62b1bd599d63c3ab1d55b6a6660740fbf3d44157` passed all three GitHub Actions validation workflows with 100 passed, 0 failed, 0 skipped in each: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495157), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495128), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495162). The automation run completed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python compilation.

The later documentation checkpoint `b505a260570afb23de637d599868e55376a827aa` also passed all three workflows with 100 passed, 0 failed, 0 skipped: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034769), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034706), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034728). It was documentation-only relative to the tested code/test commit.

The implemented safeguards include: full production preflight at dashboard readiness; required operator identity in audit events; rights-record hash verification and rechecking retained source/licence file checksums before upload; checksummed backup/restore of state, audit history, rights records, review approvals, upload attempts and receipts; and fail-closed refusal to overwrite a different upload ledger. `.gitignore` excludes local secrets, state, rights records, backups and generated media.

These are automated/code-level checks, not proof of genuine licence authenticity, human playback review, real wildlife renders or a live YouTube upload. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

## Repository and automation
- [ ] Re-fetch and record branch/PR head SHA; PR #1 remains open and unmerged.
- [ ] Public publishing remains disabled.
- [ ] `npm ci --ignore-scripts` and `npm test` pass on the candidate SHA; record exit codes and test counts.
- [ ] Run `npm run check`, `npm run validate:schedule`, `npm run validate:campaigns`, `npm run check:captions`, and `npm run readiness`; record outcomes.
- [ ] Workflow cron values agree with `config/weekly-content-plan.json`; schedules create drafts only.
- [ ] Dashboard starts on loopback with actual operator credentials; unauthenticated calls fail and authenticated actions persist/audit.
- [ ] Restart recovery, slot idempotency/conflict, and backup/restore are verified.

## Real production artifacts
- [ ] Both production manifests point to present, non-empty, validated source files.
- [ ] Each asset has retained original licence/permission evidence and checksums.
- [ ] Commercial YouTube use, attribution, restrictions and expiry were checked by an identified reviewer.
- [ ] Narration, captions, metadata and edit match; wildlife claims are fact-checked.
- [ ] Short: 50–60 seconds, 1080×1920, H.264/AAC, full-file decode and measurable audio.
- [ ] Long-form: 6–10 minutes, 16:9, supported video/audio codecs and full-file decode.
- [ ] Thumbnail is a real file derived from the final rendered artifact and has a checksum.
- [ ] Video, thumbnail, captions, metadata and rights-evidence hashes are recorded.
- [ ] Human playback inspection and synthetic/altered-media disclosure review are complete.
- [ ] Authenticated human approval binds the exact artifact hashes and current metadata/rights versions.

## Private YouTube upload
- [ ] OAuth credentials remain in a secure environment/secret store, never browser code or chat.
- [ ] Authenticated API confirms exact title `SonicVhibez` and independently confirmed channel ID.
- [ ] Artifact package and explicit per-operation operator confirmation are present.
- [ ] Durable upload attempt is written before remote insert.
- [ ] Request explicitly sets `privacyStatus: private`; no public/unlisted fallback.
- [ ] Exact remote video is re-fetched and channel ownership/private visibility verified.
- [ ] Durable receipt and ledger are persisted; uncertain outcomes are reconciled before retry.

## Campaign compliance
- [ ] Selar destination is exactly `https://selar.com/0u19v8u99l` with accurate visible disclosure.
- [ ] Safari remains inactive unless exact HTTPS destination, disclosure and owner approval are retained.
- [ ] No unsupported sales, SEO-score, monetization or wildlife-event claims.
- [ ] Nature Frontiers is never selected as a target.

**Decision: BLOCKED** if any required real-world gate remains unchecked. Passing mock tests never substitutes for a genuine render, rights verification, human review or remote private-upload verification.


## Current branch checkpoint — 2026-10-24

Branch HEAD at the latest verified documentation checkpoint: `54680587e71b5c84074a2c681ed8e95d919a87fd`. The three PR validation workflows passed on this exact SHA: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578167), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578180), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079578198). Each reported 100 passed, 0 failed, 0 skipped. The automation workflow verified `npm ci --ignore-scripts` and Python compilation. The metadata workflow deliberately verifies that production checks fail closed while production metadata is incomplete; it is not a production-readiness pass.

These CI results do not close owner-controlled media, rights, human playback, OAuth/channel identity, private upload, or operational restore gates. PR #1 remains open, draft and unmerged; public publishing remains disabled. Recheck this section against the current HEAD before relying on it after future commits.


## Historical implementation checkpoint — superseded by the current verified baseline above

- Historical checkpoint only: `4ba995bc51ed2ae0513bc312865713a73e0e3160`. This predates the rolling-cycle and history-gate changes and is **not** current release evidence; check the exact latest branch HEAD and its CI before acceptance.
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305593), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305540), and [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305556) all passed on that code HEAD. Each ran 106 tests: 106 passed, 0 failed, 0 skipped. Automation also passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python safety tests. Metadata validation explicitly confirms that `npm run check` fails closed while real production metadata is incomplete; this is not a release-readiness pass.
- Tuesday/Saturday are draft-preparation triggers only. The rolling publication cycle is long-form → long-form → Short with at least 72 elapsed hours between actual publications. The pre-upload gate requires complete remote public/private/unlisted history and reconciliation of uncertain attempts; live acceptance remains blocked until owner evidence and authorization are supplied.
- PR #1 remains open, draft and unmerged. Public publishing remains disabled. No production MP4, thumbnail, rights clearance, human playback acceptance, live OAuth identity check, private upload receipt, or owner-run restore acceptance is claimed.
- Remaining owner-controlled gates: genuine rights-cleared source assets and completed manifests; rendered/decoded media and human review; secure OAuth identity verification for SonicVhibez; explicit per-operation private-upload authorization; operational backup/restore acceptance. Safari remains inactive until exact destination, disclosure, and owner approval exist.
