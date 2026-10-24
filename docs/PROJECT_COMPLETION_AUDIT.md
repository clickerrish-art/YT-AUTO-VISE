## Verified code/test checkpoint and documentation-refresh status — 2026-10-24

- The most recent code/test checkpoint is `703a7d380a63f0d379ca17f0b920279597ea58be`; it passed all three validation workflows: [automation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084232036), [metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084232050), and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084232178). Logs show 112 Node tests passed, 0 failed, 0 skipped; Python safety tests and syntax/compilation checks also passed.
- A subsequent documentation-only refresh on this branch updated the evidence sections. Its current branch HEAD and its own CI runs are recorded in PR #1; do not mistake the code/test checkpoint above for the documentation commit SHA.
- The [lockfile workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40084228825) passed on the code/test checkpoint, including `npm ci --ignore-scripts`, Node tests, schedule/campaign validation and syntax checks. Plain `npm ci` without `--ignore-scripts` remains unverified.
- The latest verified automation audit reports four moderate npm advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`, with no high/critical findings. The available Google API client fix is a major version upgrade and needs compatibility testing. Do not describe dependencies as vulnerability-free.
- Production acceptance remains blocked by the cadence decision, genuine rights-cleared media and manifests, full decode and human playback review bound to final hashes, secure live SonicVhibez OAuth identity verification, one explicitly authorized private upload with a remotely verified private-status receipt, and owner-run restart/backup-restore acceptance. Safari remains inactive until exact HTTPS destination, truthful disclosure and explicit owner approval exist.
- Public publishing remains disabled. The Tuesday/Saturday 1-long-form + 1-Short schedule is an interim draft-only fallback; the requested 2-long-form + 1-Short weekly cadence conflicts with 72-hour cyclic spacing and requires an explicit owner decision.

## Historical checkpoint — superseded by the verified code/test checkpoint above


## Historical checkpoint — superseded by current branch-head verification


# SonicVhibez Marketing Machine — Acceptance Audit

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

## Evidence-backed status

| Acceptance area | Status | Evidence / remaining boundary |
|---|---|---|
| Authoritative schedule and draft-only UTC workflows | PASS | Schedule validation passed at tested commit; Tue/Thu long-form, Sat Short; 15:00 UTC = 17:00 Johannesburg |
| Draft queue, durable state, stable job IDs, idempotency and cross-process slot locking | PASS | Node regression suite includes process-safe slot and lifecycle cases |
| Local dashboard auth, loopback binding, allowlisted tasks, real state, health/readiness | PASS | Dashboard integration tests start the actual server and exercise authenticated API paths |
| Short and long-form renderers with fail-closed technical export verification | PASS WITH BLOCKED REAL PRODUCTION | Short and long-form renderers now run their standalone full-file export validators before reporting success; missing production manifests and rights-cleared media remain BLOCKED |
| Thumbnail generation and media inspection | IMPLEMENTED; LIVE ARTIFACT BLOCKED | Successful render path invokes FFmpeg thumbnail generation and ffprobe; no rights-cleared wildlife inputs were available for a genuine production render |
| Caption and metadata validation | PASS FOR CHECKS; CONTENT RELEASE BLOCKED | Caption fixtures pass; unreviewed metadata and asset-register examples remain intentionally blocked |
| Structured rights evidence and checksum-bound human review | IMPLEMENTED; OWNER EVIDENCE REQUIRED | Server hashes source and license-evidence files, requires configured operator identity and binds approval to video, thumbnail and metadata versions |
| Artifact-bound approval file | PASS IN CODE PATH | Approval record is atomically written under `run-logs/upload-approvals/`; uploader rechecks every related artifact checksum |
| Private-only uploader and uncertain-outcome recovery | PASS IN AUTOMATED MOCK TESTS; LIVE UPLOAD BLOCKED | Attempt ledger is persisted before insert; timeout/receipt failure tests cover recovery; live OAuth and remote YouTube identity were not exercised |
| Campaign isolation | PASS | Selar is fixed to `https://selar.com/0u19v8u99l`; Safari starts inactive and needs exact HTTPS destination, disclosure and explicit owner approval |
| Clean dependency install | PASS WITH SCRIPTS DISABLED | `npm ci --ignore-scripts` passed in workflow 40037943712; plain `npm ci` without the flag was not separately claimed |
| Node tests at implementation commit | PASS | 95 tests, 95 pass, 0 fail, 0 skipped in each of the three validation workflows |
| Main-branch baseline | PASS | 54 tests, 0 failures: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047 |
| Genuine MP4 and independent playback inspection | BLOCKED | No real rights-cleared Short/long-form artifact was generated in this run; therefore no production MP4 checksum/duration/dimensions are claimed |
| Verified SonicVhibez channel identity and live private upload | BLOCKED | Owner must configure OAuth secrets and independently confirm channel ID through the authenticated API |
| Public publishing | PASS — DISABLED | Schedule and upload workflows remain private/draft-only; no public/unlisted fallback |

## Workflow evidence

At implementation commit `c39c3b88eefb3430dcfedbc0663bef33ad03f45c`, all three validation workflows reported 95 passed, 0 failed and 0 skipped:
- [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943766)
- [Automation validation and clean install](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943712)
- [Metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40037943732)

An earlier docs-only branch head `8f5c1186492131be6c644b73c02230a6b29650ce` also passed all three validation workflows with 95 tests, 0 failures and 0 skips:
- [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073678762)
- [Automation validation and `npm ci --ignore-scripts`](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073678805)
- [Metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40073678871)

The main-branch baseline is 54 passing tests: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047. These are automated test results; they do not establish genuine media rendering, rights validity or a live YouTube upload. The clean-install workflow uses `npm ci --ignore-scripts`; plain `npm ci` is not claimed. See [go-live blockers](GO_LIVE_BLOCKERS.md) and [release gate checklist](RELEASE_GATE_CHECKLIST.md).

## Exact owner actions to clear external blockers

1. Add source footage, narration and any music that is legitimately licensed for YouTube use; retain original license/permission documents and checksums.
2. Complete `content/render-manifest.json` and `content/long-form-render-manifest.json` using real paths and evidence; render and inspect both actual outputs with FFmpeg/ffprobe and human playback.
3. Start the dashboard locally with a random `DASHBOARD_OPERATOR_TOKEN` of at least 24 characters and `DASHBOARD_OPERATOR_ID` set to the actual authorized operator. Keep `DASHBOARD_HOST=127.0.0.1`.
4. Verify the OAuth account's channel ID through YouTube API, then store `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` and the independently confirmed `SONICVHIBEZ_CHANNEL_ID` in the appropriate secure environment/GitHub Actions secrets.
5. Complete rights verification and human review for the exact rendered MP4, thumbnail and metadata; only then use the uploader with `CONFIRM_PRIVATE_UPLOAD=YES`.
6. Keep Safari inactive until the owner supplies the exact destination and disclosure, reviews the preview and explicitly approves it.

This repository is **not 100% operational for real media release** until the blocked owner-dependent gates above have genuine evidence. No real upload or documentary artifact is claimed.


See [GO_LIVE_BLOCKERS.md](GO_LIVE_BLOCKERS.md) for owner-dependent acceptance gates and [RELEASE_GATE_CHECKLIST.md](RELEASE_GATE_CHECKLIST.md) for per-release evidence requirements.


## Historical implementation checkpoint — superseded by the current verified baseline above

- Tested code/workflow HEAD: `4ba995bc51ed2ae0513bc312865713a73e0e3160` (timezone-aware local-time conversion plus the 72-hour weekly schedule guard).
- [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305593), [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305540), and [metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40081305556) all passed on that code HEAD. Each ran 106 tests: 106 passed, 0 failed, 0 skipped. Automation also passed `npm ci --ignore-scripts` (46 packages added, 47 audited) and Python safety tests. Metadata validation explicitly confirms that `npm run check` fails closed while real production metadata is incomplete; this is not a release-readiness pass.
- Planned draft slots are Tuesday 17:00 and Saturday 17:00 Africa/Johannesburg. The cyclic gaps are 96 hours and 72 hours. The validator checks the weekly UTC schedule and queue collisions; actual public/private/unlisted upload history and live destination queue must still be inspected before any publication.
- PR #1 remains open, draft and unmerged. Public publishing remains disabled. No production MP4, thumbnail, rights clearance, human playback acceptance, live OAuth identity check, private upload receipt, or owner-run restore acceptance is claimed.
- Remaining owner-controlled gates: genuine rights-cleared source assets and completed manifests; rendered/decoded media and human review; secure OAuth identity verification for SonicVhibez; explicit per-operation private-upload authorization; operational backup/restore acceptance. Safari remains inactive until exact destination, disclosure, and owner approval exist.


## Requirement traceability — verified implementation checkpoint `68dd24f7a369a8bdb4ddb2513127e9bf3a0044e3`

| Requirement | Implementation | Automated tests / CI | Real-world acceptance | Status / next action |
|---|---|---|---|---|
| Timezone-aware 72-hour scheduling | `scripts/schedule-policy.mjs`, `scripts/validate-schedule.mjs`, `scripts/dashboard-server.mjs`, `config/weekly-content-plan.json` | `test/schedule-policy.test.mjs`, `test/validate-schedule.test.mjs`, `test/queue-cadence.test.mjs`, `test/dashboard-server.test.mjs`; all 107 tests passed in each of the three linked workflows above | Inspect complete YouTube upload history and the live queue before publication | **Code/test PASS; cadence target BLOCKED.** Owner must resolve the 3-post weekly target versus 72-hour spacing |
| Dashboard authentication, operator attribution and persistent state | `scripts/dashboard-server.mjs`, `test/dashboard-server.test.mjs`, `test/dashboard-task-runner.test.mjs` | 107/107 tests pass on the verified checkpoint | Owner must run the local app with real operator identity and verify restart persistence | Automated pass; operator acceptance outstanding |
| Queue lifecycle, idempotency, leases and interrupted-job recovery | `scripts/content-job-lifecycle.mjs`, dashboard state/lock code, `scripts/replenish-queue.mjs` | `test/content-job-lifecycle.test.mjs`, dashboard integration tests; 107/107 pass | Exercise real operator restart and recovery with local state backup | Automated pass; owner-run restart acceptance outstanding |
| Short/long rendering and export checks | `scripts/render-short.mjs`, `scripts/render-long-form.mjs`, `scripts/validate-short-export.mjs`, `scripts/validate-long-form-export.mjs` | Render/export regression tests; 107/107 pass with fixtures | Supply real licensed assets; render, fully decode, inspect streams and perform human playback review | Pipeline code tested; production artifacts BLOCKED |
| Rights evidence and artifact-bound human review | `scripts/human-review.mjs`, `scripts/upload-private.mjs`, retained rights evidence validators | `test/human-review.test.mjs`, `tests/upload-private.test.mjs`, `tests/upload-safety.test.mjs`; 107/107 pass | Retain genuine licences/permissions and approve exact final hashes | Automated guards pass; genuine rights and editorial acceptance BLOCKED |
| Private-only SonicVhibez upload and uncertain-outcome reconciliation | `scripts/upload-private.mjs`, `.github/workflows/upload-private.yml`, `.github/workflows/upload-artifact-privately.yml` | Upload mocks and fail-closed tests; 107/107 pass | Configure OAuth secrets securely, independently verify channel identity, authorize one private upload, verify remote private status and receipt | Mock tests pass; live upload BLOCKED |
| Campaign destination/disclosure controls | `config/campaigns.json`, `config/products.json`, `scripts/validate-campaigns.mjs`, `scripts/campaign-management.mjs` | `test/validate-campaigns.test.mjs`, `test/campaign-management.test.mjs`; 107/107 pass | Owner review of disclosures; Safari exact HTTPS destination and approval | Selar destination enforced; Safari remains inactive |
| Backup/restore integrity | `scripts/backup-state.mjs`, `scripts/restore-state.mjs` | `test/backup-restore.test.mjs`; 107/107 pass | Owner-run restore drill against an isolated local backup and persisted state | Automated fixtures pass; operational restore acceptance BLOCKED |
| Installation and workflow safety | `package-lock.json`, `.github/workflows/validate-automation.yml`, `.github/workflows/validate.yml`, `.github/workflows/content-quality.yml` | `npm ci --ignore-scripts` passed; Python safety suite 8/8; Node suite 107/107 | Plain `npm ci` has not been verified; no public publishing test is authorized | Supported CI install passes; plain install unverified; public publishing disabled |

**Release decision: BLOCKED.** CI proves the checked-in automated paths and test fixtures only. It does not prove genuine rights, production media quality, human review, live OAuth identity, a real private upload, or owner-run operational recovery.
