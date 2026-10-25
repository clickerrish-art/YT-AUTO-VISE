# Current Release Evidence — 2026-10-25

## Authoritative status

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** The verified application-code candidate passes the available automated checks, but this is not full code acceptance: the browser suite covers three operator journeys rather than every visible control, the full divergent history has not been reconciled, and recovery/deployment/live integration acceptance is incomplete. Production acceptance is blocked by missing genuine media, rights review, verified account credentials/identity, history reconciliation, explicit private-upload authorization, Facebook Page verification/default-branch draft evidence, and operational recovery/deployment evidence.

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Code/test candidate SHA: `ef042167f8b6fcca68e1f92f0f75cbea5461b85b`
- `main` SHA observed during this audit: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Live comparison at code/test candidate `ef042167f8b6fcca68e1f92f0f75cbea5461b85b`: 996 commits ahead, 2 behind, 108 changed files. The compare API caps the commit list at 250, so this is not a complete manual review of all divergent history. This evidence-record update itself is documentation-only and follows the tested code candidate.
- PR #1: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1 — open, draft, unmerged.
- No merge, rebase, reset, force-push, cherry-pick, or main-branch edit was performed.

## Exact-candidate automated evidence

All results below are for code/test candidate `ef042167f8b6fcca68e1f92f0f75cbea5461b85b`.

| Check | Result | Evidence |
|---|---|---|
| Node.js test suite | 234 passed, 0 failed, 0 skipped | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171105637) |
| Python safety tests | 8 passed | [Automation validation logs](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40170874180) |
| Browser E2E | 3 passed | [Dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171105655) |
| Content-quality checks | Passed | [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171105646) |
| Metadata validation | Passed | [Metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171105670) |
| Lockfile validation / clean install | Passed | [Lockfile validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171103322) |
| Normal `npm ci` and Google API client import | Passed | [Automation validation logs](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40170874180) |
| `npm audit` | 0 total vulnerabilities | [Automation validation logs](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40170874180) |
| Production readiness | Blocked as required: 12 blockers; diagnostic artifact retained | [Readiness workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171105651), artifact `sonicvhibez-readiness-report`, SHA-256 `a99c0db478456b85577e85ed4ba0d25a9cf459c02c5345605e5731105a178d36` |
| Nature Frontiers Facebook draft | Skipped on PR event; not accepted as default-branch evidence | [Skipped workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40171105644) |

## Application changes implemented in this checkpoint

1. Added exclusive atomic JSON state creation for first startup. It writes and fsyncs a temporary file, then uses an exclusive hard link so concurrent dashboard starts cannot overwrite a peer's initial state.
2. Dashboard startup now rejects a symlinked or non-regular state directory/file and validates an initialization race before continuing.
3. Added tests for atomic initial state creation, existing destination preservation, symlink rejection, staged-file cleanup on failure, and dashboard refusal to start with a symlinked state file.
4. Private uploader now rejects symlinks in the metadata, video, approval, related-artifact and retained rights-evidence paths, and uses the validated video path for the upload stream.
5. Added a regression test proving symlinked upload/rights evidence is rejected.

Relevant commits:
- `777ac8a5a1619fb8aa84a53bcd2c304b7d152663` — exclusive atomic JSON creation.
- `08945c1a641833cab766cfca68495b678f488061` — race-safe dashboard state initialization.
- `a7253dbea475cb74a53e87aa4ea214fe3c02d71c` — reject symlinked dashboard state paths.
- `f137a77d7b54df688446547d405ebba9d71299be` — atomic initialization regression tests.
- `64a2217cc9ec7cbb70a73790eae6106c6da0505a` — dashboard symlink-startup regression test and newline correction.
- `aa4881461869cce25a06c60cc3e68ebb0e522a9b`, `37d31985c3dc5ee9c8a085be7661b8d92d334c50`, `e3d32a31eedac1667e0d3f8f19df01fb3cec52c9`, `b50b801cb2270bbafe88f1ff62f7e933f871ed70` — uploader path hardening, regression coverage and test-order correction.

## Production blockers and required owner actions

1. Supply genuine rights-cleared Short and long-form assets, completed manifests, final MP4s, thumbnail/captions/metadata, hashes, validation reports and human playback approval. No production media acceptance is claimed.
2. Securely configure valid YouTube OAuth credentials and the actual SonicVhibez channel ID; authenticate and verify identity using the API.
3. Reconcile complete public/private/unlisted YouTube history and all uncertain prior attempts.
4. Review and approve final artifact hashes, then separately authorize one exact private-only upload. No real upload was performed; public/unattended upload remains disabled.
5. Verify the actual Nature Frontiers Facebook Page, token, scopes and tasks; authorize the eligible default-branch draft workflow and inspect its retained artifact. No live Facebook post was performed.
6. Complete isolated backup/restore, interruption, stale-lease, concurrency, rollback and remote-outcome recovery drills with retained logs/checksums.
7. Inspect production deployment, persistent storage, monitoring, emergency stop and HTTPS/access controls.
8. Owner approval is required for any branch reconciliation. Do not reconcile the 974-ahead/2-behind history destructively without that approval.
9. Expand browser acceptance beyond three tests to cover all visible controls and the full operator lifecycle.

## Safety status

- YouTube public and unattended publishing remain disabled.
- Upload tooling is private-only and requires separate one-shot authorization.
- Facebook live publishing remains disabled; the PR-triggered draft workflow being skipped is not a pass.
- The only approved Selar URL remains `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive until their destination and disclosure are explicitly approved.
- No real YouTube upload, public post, or live Facebook post was performed.

## Evidence limits

GitHub Actions verifies the code candidate and its automated checks; it does not prove genuine media rights, visual quality, real OAuth identity, live remote-history completeness, a real upload receipt, Facebook Page permissions, or production deployment. The current three-test Chromium suite is useful but does not satisfy the prompt's requirement to exercise every dashboard control. Full divergent history review is incomplete. Therefore this checkpoint must not be represented as 100% code-complete or production-ready.
