# Test Baseline and Regression Report

Updated: 2026-10-23  
Implementation branch: `codex/marketing-machine-audit-fixes`  
Tested implementation SHA: `e568471c73dae207948a78538c79324ac15a5376`  
Main baseline SHA: `45352b73bb6cc4787b2a49988b575afb754ab627`  
Public publishing: disabled

## Verified results

| Ref | Workflow | Result |
|---|---|---|
| Implementation `e568471c73dae207948a78538c79324ac15a5376` | [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40025100677) | 88 passed, 0 failed, 0 skipped |
| Implementation `e568471c73dae207948a78538c79324ac15a5376` | [Metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40025100793) | 88 passed, 0 failed, 0 skipped; schedule, caption and negative metadata/asset gates passed |
| Implementation `e568471c73dae207948a78538c79324ac15a5376` | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40025100724) | 88 passed, 0 failed, 0 skipped; campaign isolation and queue invariants passed |
| Main `45352b73bb6cc4787b2a49988b575afb754ab627` | [Baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047) | 54 passed, 0 failed |

The tested implementation suite includes dashboard integration, two-process dated-slot reservation, lifecycle guards, review-evidence checksum binding, campaign preview/activation/deactivation, upload safety checks, schedule validation and existing regression tests. The documentation-only commits after the tested implementation SHA do not alter runtime code; the latest branch head is visible on the live PR.

## Installation reproducibility

- Node.js engine requirement: `>=20`.
- Runtime dependency: `googleapis`.
- CI currently uses `npm install --ignore-scripts`.
- `package-lock.json` is committed. Clean `npm ci --ignore-scripts` passed in [lockfile workflow run 40025040014](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40025040014) at code-equivalent SHA `c3d3638c03b77e0e04e07748669788a614a758c5`.
- No claim is made that a clean checkout-to-render pipeline, real media artifact, YouTube OAuth flow, remote upload, or remote privacy verification was exercised. A clean locked dependency installation did pass.

## Dashboard integration evidence

The dashboard integration test starts the real server with a temporary state directory and operator token. It verifies authentication, state loading, real draft creation, duplicate/conflicting slot rejection, invalid-date rejection, rejection of forged approval fields, campaign preview, explicit draft-only activation, deactivation, and durable campaign audit entries. It does not prove the real media render pipeline or upload path is operational.

## Safety regression coverage

- Public publishing stays disabled in queue and schedule configuration.
- Selar destination must remain exactly `https://selar.com/0u19v8u99l`.
- Safari is inactive by default and cannot activate without an HTTPS preview, disclosure and explicit operator confirmation.
- Human approval must bind to artifact checksum, metadata version, reviewer identity and structured rights evidence.
- Uploader refuses missing credentials/approval, mismatched artifact or metadata checksums, wrong channel identity, non-private metadata and unconfirmed upload attempts.
- The upload script writes a durable attempt ledger before remote insertion, verifies the remote video is private, and refuses blind retries when an earlier attempt is unresolved.
- Upload workflows require explicit confirmation and support restoring/preserving the prior ledger artifact. Live OAuth and upload remain untested.

## Outstanding acceptance work

1. Keep the committed npm lockfile synchronized and rerun clean `npm ci --ignore-scripts` after dependency changes.
2. Add automatic background lease reaping and complete restart recovery; guarded lease APIs, heartbeats, backoff and stale-worker fencing are implemented/tested.
3. Supply real rights-cleared manifests/assets and pass a complete dashboard-launched render/validation/rights/review run; missing prerequisites currently block safely.
4. Generate and inspect actual rights-cleared MP4 outputs; record real checksums, durations, dimensions and validation results.
5. Test upload failure injection against mocked YouTube responses and exercise reconciliation behavior.
6. Verify authorized SonicVhibez OAuth identity, then perform a private upload only after real rights evidence, completed review and explicit operator confirmation.
7. Complete backup/restore and end-to-end restart-recovery tests.

No tests are skipped in the three implementation workflow runs listed above. Live media/OAuth acceptance is blocked by missing inputs and was not simulated as a success.

## Latest media-preflight regression

At `e568471c73dae207948a78538c79324ac15a5376`, media preflight now rejects incomplete metadata, non-9:16 Shorts, suspiciously small files, failed full-file decode and silent/unmeasurable audio. The corresponding regression is included in the 88/88 test suite. The real FFmpeg rendering acceptance remains blocked until legitimate input assets and rights evidence are provided; CI passing unit/integration tests is not evidence of a genuine wildlife render.
