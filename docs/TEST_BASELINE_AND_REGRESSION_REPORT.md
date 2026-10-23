# Test Baseline and Regression Report

Date: 2026-10-23  
Repository: https://github.com/clickerrish-art/YT-AUTO-VISE  
Implementation branch: `codex/marketing-machine-audit-fixes`  
Tested implementation SHA: `ec4a98137dd74932bd99abae4686de70fd03b4f8`  
Main baseline SHA: `45352b73bb6cc4787b2a49988b575afb754ab627`

## Results

| Run | Commit tested | Result | Link |
|---|---|---|---|
| Content quality | `ec4a98137dd74932bd99abae4686de70fd03b4f8` | 90 tests, 90 pass, 0 fail, 0 skipped | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40027289171 |
| Automation validation | `ec4a98137dd74932bd99abae4686de70fd03b4f8` | 90 tests, 90 pass, 0 fail, 0 skipped | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40027289133 |
| Metadata/schedule validation | `ec4a98137dd74932bd99abae4686de70fd03b4f8` | 90 tests, 90 pass, 0 fail, 0 skipped; schedule/captions passed | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40027289207 |
| npm clean install | `ec4a98137dd74932bd99abae4686de70fd03b4f8` | `npm ci --ignore-scripts` passed; 46 packages installed/audited | https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40027283578 |
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
