# Current Release Evidence — 2026-10-25

## Authoritative status

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** The latest exact code/test candidate passes available automated checks and five Chromium operator journeys. This is not full code acceptance: not every dashboard control is tested, and the 1013 branch-only commits have not been reviewed patch by patch. Production acceptance remains blocked by real media/rights, owner review, live account identity/history, one-shot upload authorization, Facebook default-branch draft evidence, and recovery/deployment gates.

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Exact application-code/test candidate: `aebb25d5ce795090cb6383ba8e533ccd23a147ee`
- Current documentation HEAD: the live PR metadata is authoritative; documentation synchronization is a descendant of the exact code/test candidate.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Comparison at exact candidate: **1013 commits ahead, 2 behind, 108 changed files**. GitHub compare output is bounded and is not a full patch-by-patch review.
- PR #1 remains open, draft and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- The two base-only commits are understood: `71578dafc24e5d48173dce3f4e392e18e42aa40e` added the Facebook history-restoration test; `fa00d28e7f58911482686e4ad69fac9f4701a2e6` reverted that file on `main`. The implementation branch retains equivalent tests. Branch-only history review remains incomplete.
- No merge, rebase, reset, force-push, cherry-pick, history rewrite or direct `main` edit was performed.

## Exact-candidate automated evidence

All results below refer to `aebb25d5ce795090cb6383ba8e533ccd23a147ee`.

| Check | Result | Evidence |
|---|---|---|
| Node.js regression suite | **238 passed, 0 failed, 0 skipped** | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024807) |
| Python safety tests | **8 passed** | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024807) |
| Locked and normal lifecycle-script `npm ci` | **Passed** | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024807); [lockfile validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173021070) |
| Google API import | **Passed** | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024807) |
| `npm audit` | **0 vulnerabilities** in 49 audited packages | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024807) |
| Syntax/compilation and queue/campaign checks | **Passed**; 16 queued topics checked | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024807) |
| Browser E2E | **5 passed** | [Dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173021071) |
| Content quality | **Passed** | [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024722) |
| Metadata validation | **Passed** | [Metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024740) |
| Lockfile validation | **Passed** | [Lockfile validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173021070) |
| Production readiness | **Blocked as required: 12 blockers** | [Readiness diagnostic](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024741); artifact ID `12590599094`, ZIP SHA-256 `eddfc91ed12b4734c0cadab6273b89d0f53998da6fe2a7d9c49e82c9be64c5d4` |
| Nature Frontiers Facebook draft | **Skipped** on PR event | [Skipped workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40173024822); not default-branch acceptance evidence |

## Code changes and regressions

1. Approval artifact transaction checks/creates parent components individually and rejects symlinked/non-directory ancestors before nested approval writes.
2. Facebook cross-run history restoration rejects symlinked temporary/output ancestors before nested writes.
3. Atomic JSON state replacement and exclusive creation validate every parent ancestor, not just the immediate directory.
4. Dashboard startup validates/creates state-directory components individually and rejects symlinked ancestors before state writes.
5. Fixed a real dead dashboard control: the Facebook draft form defined its submit handler but never assigned it to the form. The form now binds to `createFacebookDraft`.
6. Expanded browser acceptance for queue search/filter and the Facebook idea → draft save → persistence flow. The test verifies the destination remains `nature_frontiers_facebook` and publishing stays disabled.

Relevant implementation/test commits:
- `f2e8466f272d8b517a1057a84d0fa73510755945` — approval artifact path hardening.
- `10d5d7bf63b96b99ee44d77be60e1d137edbf430` — approval symlink-parent regression.
- `86bc60fb998990147405b57cac8a997723e99fcc` — Facebook history output-path hardening.
- `fd92b55415c8a630860dba5894dae705b19ef5ac` — history restoration regression.
- `e9a0e03740cec3fa63f2b3b623176cc174022ca1` — atomic state ancestor validation.
- `2b5e5033f2c3d403f5fb38e1825046a5413bb0e8` — atomic state symlink-ancestor regression.
- `29098f4a2ed2f2bfbff4387e12841b03a0a56f98` — dashboard state ancestor validation.
- `cf12cd4447350045dd8762ad909388ce5a95d994` — dashboard startup regression.
- `54b72f0f1373eb401fdaa9ac13c6a4043093e48b` — Facebook draft form submit binding.
- `aebb25d5ce795090cb6383ba8e533ccd23a147ee` — browser test uses the supported Facebook state API; exact tested code/test candidate.

## Acceptance register

| Gate | Status | Reason |
|---|---|---|
| Automated Node/Python tests, clean install and dependency audit | **PASS** | 238 Node, 8 Python, zero npm-audit vulnerabilities |
| Browser acceptance | **PARTIALLY VERIFIED** | Five journeys pass; not every visible control is covered |
| Symlink-path and Facebook form regressions | **PASS** | Exact candidate checks pass |
| Production readiness | **BLOCKED** | Twelve mandatory blockers retained |
| Genuine production media, rights, manifests and human review | **BLOCKED** | No accepted Short/long-form final media package |
| SonicVhibez OAuth/channel identity and remote history | **BLOCKED** | No verified live-account evidence |
| One-shot private upload and verified receipt | **NOT PERFORMED / BLOCKED** | No separately authorized upload |
| Nature Frontiers Page identity/permissions and default-branch draft | **BLOCKED** | PR event skipped; no accepted default-branch artifact |
| Full recovery/deployment acceptance | **PARTIALLY VERIFIED / BLOCKED** | Test coverage exists; retained operational drill/deployment evidence incomplete |
| Full branch-only history review | **BLOCKED** | 1013-ahead/2-behind; full patch review incomplete |
| Public/unattended YouTube and Facebook live publishing disabled | **PASS (code/configuration guard)** | No live external publishing performed |
| Overall code acceptance | **CODE ACCEPTANCE BLOCKED** | Browser/control coverage and history review incomplete |
| Overall production acceptance | **PRODUCTION BLOCKED** | Real media, account, authorization, integration and deployment gates remain open |

## Remaining owner actions

1. Supply genuine rights-cleared Short and long-form assets and real licence/provenance records.
2. Render final videos; inspect playback, captions, thumbnail, metadata and hashes; approve the exact artifacts.
3. Configure OAuth securely, verify channel ID `UCSlkuPfHH78oC1o418HV4w`, and reconcile public/private/unlisted history and uncertain attempts.
4. Only after every gate passes, separately authorize one exact private-only upload and independently verify its remote receipt/privacy state.
5. Verify the real Nature Frontiers Page, token permissions/scopes/tasks, and run the eligible default-branch draft workflow; inspect its retained artifact. No live Facebook post was performed.
6. Complete isolated backup/restore, interruption, stale-lease, concurrency, rollback and uncertain-outcome drills with retained evidence.
7. Verify deployment, HTTPS/access controls, persistent storage, monitoring, alerting and emergency stop.
8. Approve a safe strategy for reconciling divergent branch history before any merge/rebase or other history-changing operation.
9. Expand browser acceptance to every visible control and the complete operator lifecycle.

## Permanent safety status

- Public and unattended YouTube publishing remain disabled.
- Private uploads remain guarded by exact-hash human approval, verified SonicVhibez identity, history reconciliation and one-shot authorization.
- Facebook live publishing remains disabled.
- Only `https://selar.com/0u19v8u99l` is approved; Safari campaigns remain inactive.
- No real YouTube upload, public post or live Facebook post was performed.

## Evidence limits

CI verifies the reported code checks, not authentic media rights, visual quality, real OAuth identity, complete remote history, a real upload receipt, Page permissions, or deployment. Five browser journeys are useful but not comprehensive. Full branch-only history review is incomplete. Do not represent this candidate as fully accepted or production-ready.
