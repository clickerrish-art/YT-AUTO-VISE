# Test Baseline and Regression Report

Updated: 2026-10-23  
Implementation branch: `codex/marketing-machine-audit-fixes`  
Tested implementation SHA: `c0ebeb9bc9c3911b26705e0c35067fa2afb13dd3`  
Main baseline SHA: `45352b73bb6cc4787b2a49988b575afb754ab627`  
Public publishing: disabled

## Verified results

| Ref | Workflow | Result |
|---|---|---|
| Implementation `c0ebeb9bc9c3911b26705e0c35067fa2afb13dd3` | [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40022023904) | 82 passed, 0 failed, 0 skipped |
| Implementation `c0ebeb9bc9c3911b26705e0c35067fa2afb13dd3` | [Metadata/schedule validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40022023824) | 82 passed, 0 failed, 0 skipped; schedule, caption and negative metadata/asset gates passed |
| Implementation `c0ebeb9bc9c3911b26705e0c35067fa2afb13dd3` | [Automation validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40022023772) | 82 passed, 0 failed, 0 skipped; campaign isolation and queue invariants passed |
| Main `45352b73bb6cc4787b2a49988b575afb754ab627` | [Baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40018038047) | 54 passed, 0 failed |

The tested implementation suite includes dashboard integration, two-process dated-slot reservation, lifecycle guards, review-evidence checksum binding, campaign preview/activation/deactivation, upload safety checks, schedule validation and existing regression tests. The documentation-only commits after the tested implementation SHA do not alter runtime code; the latest branch head is visible on the live PR.

## Installation reproducibility

- Node.js engine requirement: `>=20`.
- Runtime dependency: `googleapis`.
- CI currently uses `npm install --ignore-scripts`.
- No `package-lock.json` is committed. Therefore `npm ci` has **not** been demonstrated and must not be reported as passing.
- No claim is made that a clean checkout, FFmpeg render, real media artifact, YouTube OAuth flow, remote upload, or remote privacy verification was exercised.

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

1. Commit a valid npm lockfile and run `npm ci` on a clean runner.
2. Implement worker leases, heartbeat, expiry, bounded retry/backoff and stale-worker fencing.
3. Complete the dashboard-launched render-to-validation-to-review pipeline.
4. Generate and inspect actual rights-cleared MP4 outputs; record real checksums, durations, dimensions and validation results.
5. Test upload failure injection against mocked YouTube responses and exercise reconciliation behavior.
6. Verify authorized SonicVhibez OAuth identity, then perform a private upload only after real rights evidence, completed review and explicit operator confirmation.
7. Complete backup/restore and end-to-end restart-recovery tests.

No tests are skipped in the three implementation workflow runs listed above. Live media/OAuth acceptance is blocked by missing inputs and was not simulated as a success.