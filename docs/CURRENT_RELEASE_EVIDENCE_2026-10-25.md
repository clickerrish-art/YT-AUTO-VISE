# Current Release Evidence — 2026-10-25

## Authoritative status

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** The current application-code candidate passes the available automated regression checks, including the new approval-path regression. This is not full code acceptance: the Chromium suite covers three operator journeys rather than every visible control; complete divergent history review is unfinished; and real media production, full recovery/deployment acceptance, and real-account integrations are not verified. Production acceptance remains blocked by genuine media/rights evidence, human review, verified account identity and permissions, remote-history reconciliation, explicit private-upload authorization, a successful default-branch Facebook draft artifact, and operational recovery/deployment evidence.

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- **Exact application-code/test candidate:** `10d5d7bf63b96b99ee44d77be60e1d137edbf430`
- **Current PR HEAD:** the live PR metadata is the source of truth for the current documentation-only descendant SHA. The exact application-code/test candidate remains `10d5d7bf63b96b99ee44d77be60e1d137edbf430`; documentation-only descendants do not change the tested code tree.
- `main` SHA observed during this audit: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Live comparison at code/test candidate: **999 commits ahead, 2 behind, 108 changed files**. GitHub's compare response returns only a bounded commit list; it is not a line-by-line review of all 999 divergent commits. No history rewrite or reconciliation has been performed.
- PR #1: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1 — open, draft, unmerged.
- The branch protection metadata read returned `protected: false` for `main`; required checks are reported disabled. This is the API's current repository response, not a claim that an unobserved organization-level policy does not exist.
- No merge, rebase, reset, force-push, cherry-pick, or direct `main` edit was performed.

## Exact-candidate automated evidence

All code/test results in this table are for `10d5d7bf63b96b99ee44d77be60e1d137edbf430`.

| Check | Result | Evidence |
|---|---|---|
| Node.js regression suite | **235 passed, 0 failed, 0 skipped** | [Automation validation — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772750) |
| Python safety tests | **8 passed** | [Automation validation logs — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772750) |
| Clean locked install `npm ci --ignore-scripts` | Passed | [Automation validation — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772750) |
| Normal lifecycle-script `npm ci` in an isolated clean environment | Passed; `googleapis` import passed | [Automation validation — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772750) |
| `npm audit` | **0 vulnerabilities** in 49 audited packages | [Automation validation — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772750) |
| JavaScript syntax, Python compilation, queue/campaign safeguards | Passed; 16 queued topics checked | [Automation validation — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772750) |
| Browser E2E | **3 passed**: draft creation/persistence, campaign restrictions, server restart persistence | [Dashboard browser E2E — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772758) |
| Content-quality checks | Passed | [Content quality — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772588) |
| Metadata validation | Passed | [Metadata validation — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772845) |
| Lockfile validation | Passed | [Lockfile validation — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171768066) |
| Production readiness | **Blocked as required: 12 blockers**; diagnostic artifact retained (artifact ID `12590826195`) | [Readiness diagnostic — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772633) |
| Nature Frontiers Facebook draft | **Skipped** on the PR event; not default-branch acceptance | [Skipped workflow — exact candidate](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171772673) |

## Application defect fixed in this checkpoint

The approval-artifact transaction previously called recursive `mkdir` on the destination parent before checking ancestor paths for symlinks. For a destination under a symlinked parent with a missing nested directory, that ordering could create the nested directory outside the intended approval tree before the later path check rejected the symlink.

- Changed `scripts/approval-artifact-transaction.mjs` to inspect/create parent directories one component at a time, rejecting symlinks and non-directory ancestors before proceeding.
- Added a regression test that attempts approval publication beneath a symlinked parent and asserts that persistence is not called and no directory is created through the link.
- Existing tests still cover state-persistence failure, existing destination preservation, symlink destination rejection and rollback after temporary-link cleanup failure.
- Implementation commit: `f2e8466f272d8b517a1057a84d0fa73510755945`.
- Regression-test commit: `10d5d7bf63b96b99ee44d77be60e1d137edbf430`.
- Exact candidate CI passed for the combined code and test changes.

Earlier implemented fixes remain in the candidate, including exclusive atomic initial state creation, dashboard state-path validation, uploader artifact/rights-path symlink rejection, upload-attempt durability and one-shot authorization checks. Historical commit details remain in Git history and earlier evidence records.

## Acceptance register

| Gate | Status | Evidence / reason |
|---|---|---|
| Application Node/Python regression suite | **PASS** | 235 Node tests; 8 Python tests on exact candidate |
| Clean locked and normal dependency installation | **PASS** | Both installation paths ran; `googleapis` import passed |
| Dependency audit | **PASS** | `npm audit`: 0 vulnerabilities; this does not establish application-wide security |
| Browser acceptance | **PARTIALLY VERIFIED** | 3 Chromium journeys pass; not every visible control or operator path is covered |
| Approval transaction symlink-parent regression | **PASS** | New regression included in 235-test exact-candidate suite |
| Production readiness gate | **BLOCKED** | 12 blockers are emitted and retained; fail-closed result is expected |
| Genuine Short and long-form production media, rights and final manifests | **BLOCKED** | No accepted final production exports/rights package verified |
| Human playback review and final-hash-bound approval | **BLOCKED** | No owner review record for final production artifacts |
| SonicVhibez OAuth/channel identity and remote history | **BLOCKED** | No verified real-account evidence or complete remote-history reconciliation |
| One-shot private upload and independently verified receipt | **NOT PERFORMED / BLOCKED** | No separately authorized live upload; no receipt fabricated |
| Nature Frontiers Page identity/permissions and default-branch draft artifact | **BLOCKED** | PR-triggered workflow skipped; default-branch result not verified |
| Full backup/restore, interruption, concurrency, rollback and uncertain-outcome drills | **PARTIALLY VERIFIED** | Unit/integration coverage exists; complete retained operational drill evidence not established |
| Deployment, HTTPS/access controls, monitoring and emergency stop | **NOT VERIFIED** | No production deployment target evidence provided |
| Full divergent-history audit and reconciliation | **BLOCKED** | 999-ahead/2-behind comparison; complete 999-commit patch review not performed; owner approval required before history-changing reconciliation |
| Public/unattended YouTube publishing disabled | **PASS (configuration/code guard)** | No public or unattended upload path authorized; keep disabled |
| Facebook live publishing disabled | **PASS (configuration/code guard)** | No live Facebook post performed |
| Overall code acceptance | **CODE ACCEPTANCE BLOCKED** | Browser/control coverage and full branch-history review remain incomplete |
| Overall production acceptance | **PRODUCTION BLOCKED** | Multiple real-asset, account, authorization and deployment gates remain unresolved |

## Remaining owner actions and external gates

1. Provide genuine rights-cleared footage, narration, music and other required media for one Short and one long-form video, with real source/licence records.
2. Complete rendering; inspect playable exports, captions, thumbnail, metadata and hashes; approve the exact final package as a human reviewer.
3. Securely configure YouTube OAuth credentials, then verify authenticated channel ID `UCSlkuPfHH78oC1o418HV4w` and reconcile complete public/private/unlisted history plus uncertain attempts.
4. After all gates pass, separately authorize one exact private-only upload. Independently verify the remote video, channel and privacy state, and persist the receipt. No upload was performed during this checkpoint.
5. Verify the actual Nature Frontiers Facebook Page, token permissions/scopes/tasks, and authorize the eligible default-branch draft workflow; inspect its retained artifact. No live Facebook post was performed.
6. Run and retain isolated backup/restore, crash/interruption, stale-lease, concurrent-worker, rollback and remote-timeout drills.
7. Verify the intended deployment environment, HTTPS/access controls, persistent storage, monitoring, alerts and emergency stop.
8. Approve a non-destructive strategy for reconciling the highly divergent branch before any merge/rebase or other history-changing operation.
9. Expand browser acceptance to all visible controls and full draft-to-review lifecycle journeys.

## Permanent safety status

- YouTube public publishing and unattended publishing remain disabled.
- Any private upload must remain operation-specific, one-shot, human-approved and hash-bound, with authenticated SonicVhibez identity and remote-history reconciliation.
- Facebook live publishing remains disabled; the skipped PR workflow is not a pass.
- The only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive.
- No real YouTube upload, public post, or live Facebook post was performed.

## Evidence limits

GitHub Actions provides reproducible evidence for the code candidate and its automated checks. It does not prove authentic media rights, editorial quality, real OAuth identity, complete remote history, a real upload receipt, Facebook Page permissions, or production deployment. The current three-test Chromium suite is useful but does not satisfy the requested control-by-control acceptance. The complete divergent history has not been manually reviewed. Therefore this checkpoint must not be represented as fully accepted or production-ready.
