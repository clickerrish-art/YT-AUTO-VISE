## Current release status — 24 October 2026

**Current tested code candidate:** `de1bf204663f05b24d46833a2483453d9926ff0c`  
**PR #1:** [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1)  
**Branch comparison at this code-candidate checkpoint:** 875 commits ahead, 2 behind `main`; 92 changed files. Merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; base head `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. History reconciliation remains an owner decision.

### Exact-SHA CI evidence

These completed workflows ran against code candidate `de1bf204663f05b24d46833a2483453d9926ff0c`; counts and advisories were checked in job logs:

- [Automation validation — run 40121438928](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121438928): **PASS WITH MODERATE ADVISORIES**; `npm ci --ignore-scripts`; Node tests 204 passed, 0 failed, 0 skipped; Python safety tests 8 passed; 16 queued topics validated; campaign checks, JavaScript syntax and Python compilation passed. Audit: 4 moderate, 0 high, 0 critical.
- [Metadata validation — run 40121439065](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121439065): **PASS**; 204 Node tests passed, 0 failed, 0 skipped; schedule/caption and fail-closed readiness checks passed.
- [Content quality — run 40121438920](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121438920): **PASS**; 204 Node tests passed, 0 failed, 0 skipped.
- [Locked-install and lockfile validation — run 40121435383](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121435383): **PASS**; clean `npm ci --ignore-scripts`, complete Node test suite and validation checks passed.
- [Daily Facebook draft — run 40121438924](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40121438924): **SKIPPED** on the PR event. No default-branch draft artifact is established by this run.
- No live YouTube upload or Facebook post was performed. A skipped workflow is not counted as a pass.

### Recent code-level changes

- `scripts/schedule-policy.mjs` rejects malformed calendar dates, timezone-free timestamps and invalid offsets; `test/schedule-policy.test.mjs` covers regression cases.
- `scripts/youtube-history-gate.mjs` strictly validates remote publication timestamps, owner reconciliation verification timestamps and reconciled record timestamps; `test/youtube-history-gate.test.mjs` covers malformed dates, missing time zones and invalid offsets.
- `scripts/upload-private.mjs` applies the same strict timestamp validation to retained rights-evidence verification and one-shot private-upload authorization. `tests/upload-safety.test.mjs` covers invalid calendar dates, missing time zones and invalid offsets. This is deterministic code/test evidence, not proof of a real owner approval or live upload.
- CI deliberately uses `npm ci --ignore-scripts`; a normal lifecycle-script install and clean local runtime acceptance remain unverified.

### Current acceptance register

| Gate | Status | Evidence / remaining action |
|---|---|---|
| Automated Node tests | PASS | 204 passed, 0 failed, 0 skipped on exact code candidate above. |
| Python safety tests | PASS | 8 passed on exact code candidate above. |
| Queue, campaign, schedule, caption, syntax and compilation checks | PASS | Exact-SHA automation/metadata logs linked above. |
| Strict timestamp validation for schedule, history and private-upload authorization | PASS | Regression tests pass; no real account operation implied. |
| Normal lifecycle-script install | NOT RUN | CI deliberately uses `npm ci --ignore-scripts`. |
| Dependency remediation | BLOCKED | Four moderate advisories remain; no major Google API upgrade was applied blindly. |
| Full dashboard clean-install end-to-end acceptance | NOT RUN | Every visible action, restart and operator flow has not been independently exercised end to end. |
| Genuine media, rights evidence and final-hash human review | OWNER ACTION REQUIRED | Supply genuine licensed inputs and review exact final hashes. |
| SonicVhibez OAuth identity and complete remote history | OWNER ACTION REQUIRED | Verify identity; reconcile public/private/unlisted history and uncertain attempts. |
| One authorized private upload and remote receipt | OWNER ACTION REQUIRED | No operation-specific authorization or live upload occurred. |
| Nature Frontiers Facebook Page identity/permissions | OWNER ACTION REQUIRED | Verify Page identity, scopes and token validity; live publishing remains disabled. |
| Default-branch Facebook draft and retained artifact | BLOCKED | PR run skipped; verify a real default-branch run and retained artifact. |
| Isolated backup/restore/restart drill | OWNER ACTION REQUIRED | Run in isolation and retain evidence. |
| Branch divergence and test-file incident | OWNER ACTION REQUIRED | Review the two base-only commits and 875/2 divergence; no merge or history rewrite performed. |
| Production acceptance | BLOCKED | External, media, dependency, integration and owner-controlled gates remain open. |

**Safety defaults:** public/unattended YouTube publishing remains disabled; private upload requires separate single-operation authorization; Facebook live publishing remains disabled with dry-run/emergency-stop safeguards; only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive.

**Verdict:** `CODE-LEVEL ACCEPTANCE BLOCKED`; production acceptance `BLOCKED`. Passing automated tests do not establish complete end-to-end or production acceptance.

---

## Historical checkpoint material


- Tested code HEAD: `e36f3fb288df257e71605e9f8e51f4941a9253ab`.
- Exact-HEAD CI: [automation run 40095077502](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40095077502), [content quality run 40095077405](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40095077405), and [metadata run 40095077505](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40095077505) passed. Each reports 147 Node tests passed, 0 failed, 0 skipped. Automation also reports 8 Python safety tests passed and completed locked installation, JavaScript syntax/Python compilation, campaign and queue checks.
- The new mocked history-restoration tests cover artifact download/persistence, malformed archive failure, HTTPS API origin enforcement, bounded archive size, exact same-day artifact reuse and conflicting-artifact rejection. These do not prove real default-branch artifact retrieval.
- The daily workflow [run 40095077449](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40095077449) was intentionally skipped on the PR branch. A default-branch scheduled/manual run is still required to verify actual artifact restoration.
- Latest npm audit: 4 moderate, 0 high, 0 critical advisories (`gaxios`, `googleapis`, `googleapis-common`, `uuid`). The available `googleapis` fix is a major upgrade; no blind upgrade was applied.
- PR #1 remains open, draft and unmerged. Public YouTube and Facebook publishing remain disabled. No live Meta post or YouTube upload is claimed.

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


# Test Baseline and Regression Report

## Historical checkpoint — superseded by the current verified baseline above

The code/test commit `62b1bd599d63c3ab1d55b6a6660740fbf3d44157` passed all three GitHub Actions validation workflows with 100 passed, 0 failed, 0 skipped in each: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495157), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495128), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079495162). The automation run completed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python compilation.

The later documentation checkpoint `b505a260570afb23de637d599868e55376a827aa` also passed all three workflows with 100 passed, 0 failed, 0 skipped: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034769), [metadata/schedule](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034706), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40079034728). It was documentation-only relative to the tested code/test commit.

The implemented safeguards include: full production preflight at dashboard readiness; required operator identity in audit events; rights-record hash verification and rechecking retained source/licence file checksums before upload; checksummed backup/restore of state, audit history, rights records, review approvals, upload attempts and receipts; and fail-closed refusal to overwrite a different upload ledger. `.gitignore` excludes local secrets, state, rights records, backups and generated media.

These are automated/code-level checks, not proof of genuine licence authenticity, human playback review, real wildlife renders or a live YouTube upload. Public publishing remains disabled; PR #1 remains open, draft and unmerged.

## Previous implementation checkpoint (superseded by current code/test checkpoint below) — 2026-10-24

Code and regression-test commit: `6b0874b870343cf435099eedf74038bf2e01f58c`. The three GitHub Actions validation workflows passed on this exact commit: 95 tests passed, 0 failed, 0 skipped in each workflow. [Automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083877), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083898), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40077083943). The automation workflow completed `npm ci --ignore-scripts` and installed/audited 46 packages.

The dashboard `/readyz` endpoint now runs the full production-readiness preflight, includes actionable blockers, and returns HTTP 503 with `ready: false` when owner-controlled or production prerequisites remain unmet. This is not proof of real wildlife media, license authenticity, human playback review, live OAuth identity, or a real YouTube upload. Public publishing remains disabled and PR #1 remains open, draft and unmerged.


## Previous acceptance checkpoint (superseded by the latest code checkpoint below) — 2026-10-24

Tested implementation commit: `c39c3b88eefb3430dcfedbc0663bef33ad03f45c`. GitHub Actions ran the full Node suite at this commit: 95 passed, 0 failed, 0 skipped. [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766) all passed. The automation workflow also completed `npm ci --ignore-scripts` successfully.

Short and long-form renderers now fail closed on technical export validation errors. This code-test result does not mean a genuine wildlife MP4 was produced: the production manifests and rights-cleared assets are still absent. No live OAuth identity, real private upload, or remote receipt is claimed. Public publishing remains disabled; PR #1 remains draft and unmerged.

## Results

| Run | Commit tested | Result | Link |
|---|---|---|---|
| Content quality | `c39c3b88eefb3430dcfedbc0663bef33ad03f45c` | 95 tests, 95 pass, 0 fail, 0 skipped | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766 |
| Automation validation | `c39c3b88eefb3430dcfedbc0663bef33ad03f45c` | 95 tests, 95 pass, 0 fail, 0 skipped | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712 |
| Metadata/schedule validation | `c39c3b88eefb3430dcfedbc0663bef33ad03f45c` | 95 tests, 95 pass, 0 fail, 0 skipped; schedule/captions passed | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732 |
| npm clean install | `c39c3b88eefb3430dcfedbc0663bef33ad03f45c` | `npm ci --ignore-scripts` passed; 46 packages installed/audited | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712 |
| Main baseline | `45352b73bb6cc4787b2a49988b575afb754ab627` | 54 tests passed, 0 failed | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047 |

## Coverage represented by automated tests

- Dashboard authentication, local state persistence, real draft operations, campaign state operations and audit history.
- Cross-process slot reservation, idempotent creation, schedule-date validation, lease transitions and stale worker protection.
- Rights evidence shape, review checksum binding and blocked attempts to bypass review.
- Private-only uploader preconditions, authenticated channel identity checks, durable pre-upload ledger, uncertain remote timeout, receipt persistence failure, reconciliation-only recovery and no blind retry.
- Campaign separation, exact Selar URL, inactive Safari defaults, schedule/workflow agreement and public publishing disabled.
- Caption, metadata and asset-register preflight.

## Important limits

- GitHub Actions tests exercise mock YouTube clients for failure scenarios; they are not proof of a real external YouTube integration.
- `npm ci --ignore-scripts` was run; plain `npm ci` without `--ignore-scripts` is not separately claimed.
- No production wildlife MP4, actual thumbnail or real-media checksum/duration/dimensions are claimed because legitimate assets and rights evidence were unavailable.
- Live OAuth identity verification, real private upload, remote receipt verification and real-world rights validation remain blocked on owner-provided prerequisites.
- The test suite does not turn public publishing on; it remains disabled.


## Acceptance gate references

See [GO_LIVE_BLOCKERS.md](GO_LIVE_BLOCKERS.md) for current owner-dependent blockers and [RELEASE_GATE_CHECKLIST.md](RELEASE_GATE_CHECKLIST.md) for the exact evidence required before release. No live-media render or live private upload is claimed. Public publishing remains disabled.


## Previous branch-head CI checkpoint (superseded)

Docs-only branch head `460f57fdddc48b8eb163ba452e6044a434c0bceb` passed all three validation workflows with 95 passed, 0 failed and 0 skipped: [automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073783190), [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073783221), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073783180). The workflow ran `npm ci --ignore-scripts` and reported 46 packages added/audited. Plain `npm ci` without the flag remains unverified. These tests do not prove real media rendering or a live YouTube upload.


## Historical implementation checkpoint — superseded by the current verified baseline above

- Historical checkpoint only: `4ba995bc51ed2ae0513bc312865713a73e0e3160`. This predates the rolling-cycle and history-gate changes and is **not** current release evidence; check the exact latest branch HEAD and its CI before acceptance.
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305593), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305540), and [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305556) all passed on that code HEAD. Each ran 106 tests: 106 passed, 0 failed, 0 skipped. Automation also passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python safety tests. Metadata validation explicitly confirms that `npm run check` fails closed while real production metadata is incomplete; this is not a release-readiness pass.
- Tuesday/Saturday are draft-preparation triggers only. The rolling publication cycle is long-form → long-form → Short with at least 72 elapsed hours between actual publications. The pre-upload gate requires complete remote public/private/unlisted history and reconciliation of uncertain attempts; live acceptance remains blocked until owner evidence and authorization are supplied.
- PR #1 remains open, draft and unmerged. Public publishing remains disabled. No production MP4, thumbnail, rights clearance, human playback acceptance, live OAuth identity check, private upload receipt, or owner-run restore acceptance is claimed.
- Remaining owner-controlled gates: genuine rights-cleared source assets and completed manifests; rendered/decoded media and human review; secure OAuth identity verification for SonicVhibez; explicit per-operation private-upload authorization; operational backup/restore acceptance. Safari remains inactive until exact destination, disclosure, and owner approval exist.

## Verified branch-head checkpoint — 2026-10-24 (documentation commit pending revalidation)

- Exact tested code HEAD: `7b5a97da38a9716f49b19682c117f1b8a195afe4`; base `main` SHA: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- The three PR workflows completed successfully on that exact HEAD: [automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40083885872), [metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40083885858), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40083885897).
- Automation job evidence: Node test suite reported 112 tests, 112 passed, 0 failed; queue invariant check confirmed 16 held/review-state topics, the exact approved Selar destination, and publishing disabled. JavaScript syntax checks and Python compilation completed successfully. Install path was `npm ci --ignore-scripts`.
- Dependency audit: 4 moderate findings, 0 high, 0 critical. Reported paths/advisories include `gaxios` (range 6.4.0–6.7.1, fix available via `uuid`), `googleapis` (range 33.0.0–149.0.0; suggested fix `googleapis@178.0.0`, a major upgrade), `googleapis-common` (<=7.2.0; major-upgrade fix path), and `uuid` (<11.1.1; buffer-bounds-check issue). Do not call the dependency tree vulnerability-free; compatibility assessment and remediation remain open. CI deliberately warns rather than suppressing the audit.
- This checkpoint verifies automated repository checks only. It does not establish plain `npm ci`, live OAuth, genuine rights clearance, actual production media, human playback acceptance, a live private upload, or operator-run restore acceptance.
- The report was updated after the above test runs. Any commit containing this documentation update must be revalidated independently; these links apply to `7b5a97da38a9716f49b19682c117f1b8a195afe4`, not to a later documentation commit.
