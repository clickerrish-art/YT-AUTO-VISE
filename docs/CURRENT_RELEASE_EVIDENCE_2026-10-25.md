# Current Release Evidence — 2026-10-25

## Authoritative status

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Exact-candidate automated checks pass, including new regression coverage for symlinked approval, history, atomic-state and dashboard-state paths. The browser suite still covers only three operator journeys, the full branch-only history is not reviewed, and real media/account/recovery/deployment acceptance remains incomplete.

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Exact application-code/test candidate: `cf12cd4447350045dd8762ad909388ce5a95d994`
- Current documentation HEAD: live PR metadata is authoritative; this record is a documentation-only descendant of the exact code/test candidate.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Comparison at exact candidate: **1008 commits ahead, 2 behind, 108 changed files**. GitHub's bounded compare response is not a line-by-line review of all branch-only commits.
- PR #1: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1 — open, draft, unmerged.
- The two base-only commits are understood: `71578dafc24e5d48173dce3f4e392e18e42aa40e` added the Facebook draft history-restoration test; `fa00d28e7f58911482686e4ad69fac9f4701a2e6` reverted that file on `main`. The implementation branch retains equivalent test coverage. Full branch-only history review remains incomplete.
- No merge, rebase, reset, force-push, cherry-pick or direct `main` edit was performed.

## Exact-candidate automated evidence

All results below are for `cf12cd4447350045dd8762ad909388ce5a95d994`.

| Check | Result | Evidence |
|---|---|---|
| Node.js regression suite | **238 passed, 0 failed, 0 skipped** | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172343029) |
| Python safety tests | **8 passed** | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172343029) |
| Clean locked install and normal lifecycle-script `npm ci` | **Passed** | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172343029); [lockfile validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172340071) |
| Google API client import | **Passed** | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172343029) |
| `npm audit` | **0 vulnerabilities** in 49 audited packages | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172343029) |
| JavaScript syntax, Python compilation and queue/campaign checks | **Passed**; 16 queued topics checked | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172343029) |
| Browser E2E | **3 passed** | [Dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172343102) |
| Content quality | **Passed** | [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172342979) |
| Metadata validation | **Passed** | [Metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172342989) |
| Lockfile validation | **Passed** | [Lockfile validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172340071) |
| Production readiness | **Blocked as required: 12 blockers** | [Readiness diagnostic](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172342923); retained artifact ID `12590188475`, uploaded ZIP SHA-256 `8cbe9b074eb8ed6fbf1f08a8bbcb79847b6fa0204aa3f13961891afc9cee3fe5` |
| Nature Frontiers Facebook draft | **Skipped** on PR event | [Skipped workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40172342930); this is not default-branch evidence |

## Code fixes in this checkpoint

1. Approval artifact transaction checks/creates parent components individually and rejects symlinked/non-directory ancestors before creating nested approval paths.
2. Facebook cross-run history restoration checks/creates temp/output ancestors safely and rejects symlinked paths before nested writes.
3. Atomic JSON state replacement and exclusive initial creation validate all parent ancestors, not just the immediate directory.
4. Dashboard startup validates/creates state-directory components individually and refuses symlinked ancestors before creating state.
5. Added regression tests for each path: no approval persistence or directory creation through symlinked approval parents; no history directory creation through a symlinked output parent; atomic write/create rejects symlinked ancestors; dashboard refuses symlinked state ancestors.

Relevant implementation/test commits:
- `f2e8466f272d8b517a1057a84d0fa73510755945` — approval artifact path hardening.
- `10d5d7bf63b96b99ee44d77be60e1d137edbf430` — approval symlink-parent regression.
- `86bc60fb998990147405b57cac8a997723e99fcc` — Facebook history output-path hardening.
- `fd92b55415c8a630860dba5894dae705b19ef5ac` — history restoration regression.
- `e9a0e03740cec3fa63f2b3b623176cc174022ca1` — atomic state ancestor validation.
- `2b5e5033f2c3d403f5fb38e1825046a5413bb0e8` — atomic state symlink-ancestor regression.
- `29098f4a2ed2f2bfbff4387e12841b03a0a56f98` — dashboard state ancestor validation.
- `cf12cd4447350045dd8762ad909388ce5a95d994` — dashboard startup regression; exact code/test candidate.

## Acceptance register

| Gate | Status | Reason |
|---|---|---|
| Automated Node/Python tests, clean install, dependency audit | **PASS** | Exact candidate: 238 Node, 8 Python, zero npm-audit vulnerabilities |
| Browser acceptance | **PARTIALLY VERIFIED** | Three journeys pass; not every visible control is covered |
| Symlink-path regressions | **PASS** | Approval, history restore, atomic state and dashboard startup |
| Production readiness | **BLOCKED** | Twelve mandatory blockers retained |
| Genuine production media, rights, manifests and human review | **BLOCKED** | No accepted Short/long-form final media package |
| SonicVhibez OAuth/channel identity and remote history | **BLOCKED** | No verified real-account evidence |
| One-shot private upload and verified receipt | **NOT PERFORMED / BLOCKED** | No separately authorized upload |
| Nature Frontiers Page identity/permissions and default-branch draft | **BLOCKED** | PR event skipped; no accepted default-branch artifact |
| Full recovery/deployment acceptance | **PARTIALLY VERIFIED / BLOCKED** | Test coverage exists; retained operational drill/deployment evidence incomplete |
| Full branch-only history review | **BLOCKED** | 1008-ahead/2-behind; base-only add/revert understood, branch-only history not fully reviewed |
| Public/unattended YouTube and Facebook live publishing disabled | **PASS (code/configuration guard)** | No live external publishing performed |
| Overall code acceptance | **CODE ACCEPTANCE BLOCKED** | Browser/control coverage and branch-history review incomplete |
| Overall production acceptance | **PRODUCTION BLOCKED** | Real media, account, authorization, integration and deployment gates remain open |

## Remaining owner actions

1. Supply genuine rights-cleared Short and long-form source assets and real licence/provenance records.
2. Render final videos; inspect playback, captions, thumbnails, metadata and hashes; approve exact final artifacts.
3. Configure OAuth securely, verify channel ID `UCSlkuPfHH78oC1o418HV4w`, and reconcile all public/private/unlisted history and uncertain attempts.
4. Only after every gate passes, separately authorize one exact private-only upload and independently verify remote receipt/privacy state.
5. Verify the real Nature Frontiers Page, token permissions/scopes/tasks, and run the eligible default-branch draft workflow; inspect its retained artifact. No live Facebook post was performed.
6. Complete isolated backup/restore, interruption, stale-lease, concurrency, rollback and uncertain-outcome drills with retained evidence.
7. Verify deployment, HTTPS/access controls, persistent storage, monitoring, alerting and emergency stop.
8. Approve a safe strategy for reconciling the divergent branch history before any merge/rebase or other history-changing operation.
9. Expand browser acceptance to cover every visible control and the full operator lifecycle.

## Permanent safety status

- Public and unattended YouTube publishing remain disabled.
- Private uploads remain guarded by exact-hash human approval, verified SonicVhibez identity, history reconciliation and one-shot authorization.
- Facebook live publishing remains disabled.
- Only `https://selar.com/0u19v8u99l` is approved; Safari campaigns remain inactive.
- No real YouTube upload, public post or live Facebook post was performed.

## Evidence limits

CI proves the reported code checks, not authentic media rights, visual quality, real OAuth identity, complete remote history, a real upload receipt, Page permissions, or deployment. The three-test browser suite is not comprehensive. Full branch-only history review is incomplete. Do not represent this candidate as fully accepted or production-ready.
