# Project Completion Audit — SonicVhibez Marketing Machine

Audit date: 2026-10-23
Implementation HEAD at last inspection: `a426b36b908103e2ce001a28a012a346da5c859c` (verify again before merge).
Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
Default branch: `main`
Implementation branch inspected: `codex/marketing-machine-audit-fixes`
Publishing posture: public publishing disabled; no upload was performed by this audit.

## Evidence and scope

This audit is based on the repository files inspected on the two named branches through the GitHub repository integration. No clean local checkout, npm install, test execution, media render, OAuth request, or YouTube upload could be performed in this execution environment. Therefore code presence is not treated as proof of runtime behavior. Exact SHAs must be refreshed before merge because branches can advance.

## Branches and commits

- `main`: package.json blob `705709a18dcb5893728c77e4b1b5ea216f9e1b03`; schedule config blob `8e2c27ff880512734611a2b53c78922b5a04eea2`.
- `codex/marketing-machine-audit-fixes`: schedule config blob `5cc623fd5d78e2bd824587f3043873aea35a9b6a`; queue blob `98b25d39cf0ade9bcd8e6a7191fb3ee3bea4f201`; report blob `029523a6b64af1a9af2e1b01c0480d0cbe102f5d`.
- Branch search returned `main`, `codex/marketing-machine-audit-fixes`, and `https/github.com/clickerrish-art/nature-frontiers.git`. The latter is not an implementation target and must not be selected as a promotional channel.

## Implemented features (code exists; runtime not verified)

- Node.js ESM scripts for metadata checks, subtitle checks, media preflight, Short rendering, thumbnail rendering, long-form rendering/export validation, asset-register validation, production readiness, and private-only YouTube upload.
- GitHub Actions workflows for metadata/tests, scheduled draft narration/artifact generation, long-form narration drafts, and manual private upload.
- Approved Selar product URL is consistently configured as `https://selar.com/0u19v8u99l`.
- Channel guard requires the exact channel title `SonicVhibez`, configured channel ID, and private visibility in the existing uploader.
- Queue and weekly plan both state public publishing is disabled.
- Existing test suite includes queue cadence and media-export validator tests, but execution is blocked in this environment.

## Implemented but unverified

- Python/Node narration generation and text-led draft artifact generation.
- FFmpeg rendering and media technical preflight.
- Caption timing/structure checks.
- YouTube OAuth channel lookup and private upload code path.
- GitHub Actions scheduling and artifact upload.
- Current implementation-branch tests and CI. Previously inspected commit-status data had no status entries; an empty status list is not a pass.

## Incomplete / defects identified

1. A first local operator dashboard now exists (`scripts/dashboard-server.mjs`, `public/dashboard.html`) with real configuration/queue reads, token-protected API, draft creation, duplicate prevention, and JSON state/audit persistence. It is incomplete: no job launch controls, queue edit UI, rights evidence workflow, campaign isolation beyond the approved Selar URL, or uploader/reconciliation controls.
2. `OPERATIONS.md` contradicts the authoritative plan: it still says two Shorts on Tuesday/Friday.
3. The default branch schedule config is version 1 and conflicts with the implementation branch's version 2 schedule. Branch choice and merge must be explicit.
4. The narration workflow can produce draft text/audio/captions and a typography-led review video; it does not establish a finished wildlife documentary with rights-cleared footage.
5. The scheduled Short workflow's dispatcher choices are `both`, `short-001`, and `short-002`, while its schedule targets one Short per week. The exact scheduled content selection and queue item reservation need idempotent tests.
6. Queue has multiple Shorts assigned to Saturday; the queue is a backlog, but no authoritative reservation/claim mechanism was verified.
7. `package.json` has no observed lockfile, so reproducible `npm ci` installation is unavailable.
8. Existing uploader writes a receipt after upload, but no demonstrated reconciliation for remote success/local timeout, durable upload-attempt ledger, checksum binding, or receipt-write failure recovery was found in the inspected file.
9. The inspected uploader verifies channel identity and private metadata before upload but the returned privacy state is not independently re-fetched after upload.
10. No evidence in the inspected files establishes that current OAuth secrets exist, that they belong to the SonicVhibez owner, or that a real private upload occurred.
11. No verified asset-rights evidence or human review records were supplied; example manifests cannot satisfy this gate.
12. Campaign configuration currently includes the single approved Selar URL; Safari affiliate campaigns must remain absent until exact owner-verified destinations are added.

## Security and rights risks

- Do not set rights or editorial review flags without human review and retained evidence.
- Treat OAuth credentials as secrets; never print environment values or upload them into artifacts.
- Preserve exact SonicVhibez channel ID matching; never reuse the known Nature Frontiers ID.
- All YouTube upload requests must specify `privacyStatus: private`, and no public visibility path should be added.
- A timeout after a remote upload is an uncertain state and must be reconciled before retrying.
- Current generated typography visuals are not rights-cleared wildlife footage and must not be represented as documentary footage.

## Prioritized work and acceptance tests

P0: align schedule and operations docs; create a validator that reads the authoritative schedule and checks queue/workflow agreement; test duplicate prevention and queue status preservation.
P0: verify default/implementation branch HEAD SHAs and execute clean-install CI on both branches.
P1: implement a real local operator dashboard backed by server-side services and durable state, with access control and audit log.
P1: strengthen private-upload receipt persistence, post-upload verification, checksum/idempotency/reconciliation, and failure tests.
P1: generate and validate actual MP4s with audio/captions/thumbnail, but block documentary claims until licensed footage and review evidence exist.
P2: isolate Selar and Safari campaign schemas and require owner-verified destination URLs.
P2: document install, startup, backup/restore, operator flow, OAuth setup, and recovery.

## Acceptance status

- Dashboard starts and serves real data: IMPLEMENTED IN PART / NOT EXECUTED; integration test added but runtime result is blocked.
- Authoritative schedule consumed by production logic: PARTIAL; config and crons exist, but cross-file validator was not yet verified.
- Draft generation: IMPLEMENTED IN PARTS / NOT END-TO-END VERIFIED.
- Complete rights-cleared wildlife Short and long-form documentary: BLOCKED by verified footage/rights and human review.
- OAuth channel identity: BLOCKED pending owner credentials and independently verified channel ID.
- Real private upload and independent privacy verification: NOT PERFORMED.
- Durable queue/job/review/upload lifecycle and uncertain-outcome recovery: INCOMPLETE.
- Tests on both branches: BLOCKED in this environment.
- Public publishing disabled: CONFIGURED AS DISABLED; preserve this invariant.


## Live state refresh — 2026-10-23

- Current main SHA: 45352b73bb6cc4787b2a49988b575afb754ab627.
- Current implementation SHA at this refresh: 896eea1521ba93afdff8f29a248cf9760d8c8e6a.
- PR #1 remains open, draft, and unmerged: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1.
- Full validation passed at implementation SHA 83501ea5db994c5b6dd73f9b7cc20fcd0d71bcbc: https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40014937474. The workflow ran npm test, Python review-safety tests, queue invariants, JavaScript syntax checks and Python compilation.
- The recovery-enhanced current code SHA 896eea1521ba93afdff8f29a248cf9760d8c8e6a passed automation CI in run 40014972795 and metadata validation in run 40014972886; the recovery test therefore passed. The later documentation-only commit a47e74d91013f7ae38912bb4a144574f2575dfdd also passed automation CI (run 40015187821). Current branch HEAD has advanced with documentation-only commits; no code changes occurred after the tested implementation SHA.

## Acceptance status refresh

| Requirement | Status | Evidence / blocker |
|---|---|---|
| Schedule configuration | PASS | Validator and workflow checks succeeded in run 40014937474; Tuesday/Thursday long-form, Saturday Short, 17:00 Africa/Johannesburg / 15:00 UTC |
| Dashboard task allowlist | PASS | Fixed commands only; no uploader/publication task exposed |
| Task timeout and same-process duplicate prevention | PASS | Implemented in dashboard server; broad cross-process race testing is not evidenced |
| Restart detection | PASS | Persisted RUNNING task becomes RECOVERY_REQUIRED with audit event; test passed in run 40014972795 |
| Full durable content-job lifecycle/leases | NOT IMPLEMENTED | Local JSON persistence exists; full state machine and multi-process locking absent |
| Full media pipeline launched through dashboard | NOT IMPLEMENTED | Dashboard allows validation commands only |
| Genuine rights-cleared wildlife Short and long-form | BLOCKED BY EXTERNAL PREREQUISITE | Rights-cleared substantive footage and human review unavailable |
| Full approval and campaign UI / Selar-Safari isolation | NOT IMPLEMENTED | Selar URL preserved; no verified Safari URLs/schema and isolation tests |
| SonicVhibez OAuth identity/private upload | BLOCKED BY EXTERNAL PREREQUISITE | Channel ID blank by design; no verified owner OAuth identity or real upload |
| Recovery-enhanced implementation CI | PASS | Run 40014972795 for SHA 896eea1521ba93afdff8f29a248cf9760d8c8e6a; subsequent docs-only run 40015187821 also passed |
| Full main branch suite baseline | BLOCKED BY EXTERNAL PREREQUISITE | No authorized workflow-dispatch tool available; individual main workflow successes are not full baseline |
| Public publishing disabled | PASS | Config false; dashboard exposes no publish task |

The application is not production accepted. No real private upload, rights-cleared documentary, or artifact checksum is claimed.
