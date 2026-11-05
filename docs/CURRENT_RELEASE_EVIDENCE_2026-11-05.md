# SonicVhibez Marketing Machine — current release evidence

**Evidence snapshot:** 5 November 2026, 02:05 UTC  
**Repository:** `clickerrish-art/YT-AUTO-VISE`  
**Implementation branch:** `codex/marketing-machine-audit-fixes`  
**Exact tested source/test SHA:** `51ad2bbcd502c9e44717cd4a529794993cfc50fe`  
**Branch HEAD at evidence snapshot:** `51ad2bbcd502c9e44717cd4a529794993cfc50fe`  
**Main HEAD:** `fa00d28e7f58911482686e4ad69fac9f4701a2e6` (unchanged)  
**Merge base:** `45352b73bb6cc4787b2a49988b575afb754ab627`  
**PR #1:** OPEN · DRAFT · UNMERGED

## Release decision

**NOT PRODUCTION READY — HOLD.** This is an exact-SHA engineering and release-evidence refresh. It does not authorize merge, external provider mutation, upload, scheduling or publication.

## Latest exact-SHA validation — `51ad2bbcd502c9e44717cd4a529794993cfc50fe`

The current source/test candidate fixes two file-ownership races in Facebook draft/publisher cleanup and adds a worker regression for uncertain HTTP dispatch outcomes (408/5xx). No external publishing behavior was enabled.

| Validation | Run | Result |
|---|---:|---|
| Automation/security | [41951888776](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888776) | **PASS** — 111/111 Node test files, 529 tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, syntax and Python compilation passed |
| Dashboard Chromium E2E | [41951888813](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888813) | **PASS — 26/26** |
| Content quality | [41951888729](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888729) | **PASS** |
| Metadata validation | [41951888810](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888810) | **PASS** |
| Isolated main/candidate baseline | [41951888702](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888702) | **PASS** — main 54 Node/8 Python; candidate 529 Node/16 Python; zero candidate skips |
| Branch reconciliation inventory | [41951888807](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888807) | **PASS** — non-destructive inventory; semantic integration review remains open |
| Nature Frontiers local draft validation | [41951889001](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951889001) | **PASS** — local validation only; no Meta provider creation/read-back |
| npm lockfile workflow | [41951882085](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951882085) | **PASS** — clean locked install and complete Node suite |
| Production readiness | [41951888791](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888791) | **HOLD** — read-only report generated; final gate failed as designed with 13 blockers |

### Latest focused regression evidence

Local exact-source focused tests passed **44/44** across worker runner, Facebook autonomous publisher and Facebook daily-draft suites. The full exact-SHA CI suite independently passed 529 Node tests across 111 files, 16 Python tests, zero skips and zero npm audit vulnerabilities.

### Latest live Git inventory

The [non-destructive inventory artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888807) records 2,604 branch-only commits, 2 main-only commits, 231 changed paths, zero final-tree deletions, zero patch-equivalent commits and 17 critical paths. Heuristic classification: 1,109 documentation-only; 640 test-only; 543 implementation; 106 workflow-only; 75 mixed; 73 implementation-and-tests; 58 configuration/content. Integration remains `REQUIRES_REVIEW`.

### Latest dashboard and API checkpoint

- Dashboard inventory: 104 controls, 16 forms, 40 route handlers, 36 protected API routes.
- Dashboard Chromium E2E: **26/26 passed** on exact source/test SHA `51ad2bbcd502c9e44717cd4a529794993cfc50fe`.
- **DASH-001 remains NOT_TESTED overall**; the 26 browser journeys do not prove exhaustive per-control business acceptance.
- API matrix remains 36 routes / 31 PASS / 5 BLOCKED / 0 NOT_TESTED with 36/36 auth-negative checks. Route-by-route evidence remains sourced from `8272d2e39868237c05b2951f37bcade6ae6608c4`; **API-001 remains NOT_TESTED overall**.

### Latest production readiness

The exact-`51ad2bb` read-only report [41951888791](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41951888791) reports **HOLD / 13 blockers**. Public publishing remains disabled. Remaining blockers include owner cadence approval, remote YouTube history and uncertain-attempt reconciliation, genuine rights-cleared Short and long-form media/manifests, human review, verified channel identity and four missing YouTube environment values. No upload, schedule or publication was attempted.

## Previous exact-SHA validation — `b036174641a51bf9e4220ba4e612d6aaab7752cd`

The current source/test candidate is `b036174641a51bf9e4220ba4e612d6aaab7752cd`. The only code-tree change since the preceding candidate was a browser-test assertion correction: the Facebook caption suggestion is a textarea value, so the test now uses Playwright `toHaveValue` rather than text-content matching. No application runtime code or publishing behavior changed in this commit.

| Validation | Run | Result |
|---|---:|---|
| Automation/security | [41950432631](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432631) | **PASS** — 111/111 Node test files, 526 tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, syntax and Python compilation passed |
| Dashboard Chromium E2E | [41950432596](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432596) | **PASS — 26/26** |
| Content quality | [41950432618](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432618) | **PASS** |
| Metadata validation | [41950432753](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432753) | **PASS** |
| Isolated main/candidate baseline | [41950432551](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432551) | **PASS** — exact main and candidate checkouts; candidate 526 Node / 16 Python, zero skips |
| Branch reconciliation inventory | [41950432546](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432546) | **PASS** — non-destructive inventory only; semantic review remains open |
| Nature Frontiers local draft validation | [41950432557](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432557) | **PASS** — local validation only; provider-side Meta creation/read-back skipped |
| npm lockfile workflow | [41950425761](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950425761) | **PASS** — clean locked install and complete Node suite |
| Production readiness | [41950432665](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432665) | **HOLD** — read-only readiness report generated; final mandatory gate failed as designed with 13 blockers |

### Latest isolated baseline evidence

The [baseline-comparison artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432551) records:

- Main `fa00d28e7f58911482686e4ad69fac9f4701a2e6`: 54 Node tests and 8 Python tests passed; zero failures/skips; test commands exit 0. The older main dependency tree reported four moderate npm audit findings.
- Candidate `b036174641a51bf9e4220ba4e612d6aaab7752cd`: 524 Node tests across 111/111 files and 16 Python tests passed; zero failures/skips; test commands exit 0. Candidate npm audit reported zero vulnerabilities.
- FFmpeg/ffprobe installation and verification passed.

### Latest live Git inventory

The [non-destructive inventory artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432546) records:

| Measure | Result |
|---|---:|
| Branch-only commits | 2,599 |
| Main-only commits | 2 |
| Changed final-tree paths | 231 |
| Final-tree deletions | 0 |
| Patch-equivalent commits | 0 |
| Critical paths requiring semantic review | 17 |
| CI inventory working tree | Clean |

Branch-only classification is heuristic, not semantic approval: 1,107 documentation-only; 639 test-only; 543 implementation; 106 workflow-only; 75 mixed; 71 implementation-and-tests; 58 configuration/content. Integration remains `REQUIRES_REVIEW`; no destructive Git operation occurred.

### Latest dashboard and API checkpoint

- Dashboard inventory: 104 controls, 16 forms, 40 route handlers, 36 protected API routes.
- Dashboard Chromium E2E: **26/26 passed** on exact source/test SHA `b036174641a51bf9e4220ba4e612d6aaab7752cd`. The added Facebook research-suggestion journey verifies that the topic and caption starter populate the UI, the state remains byte-identical, and no draft or publication is created.
- **DASH-001 remains NOT_TESTED overall.** The browser suite and static inventory do not prove exhaustive control-by-control success, validation, authorization, failure feedback, persistence, concurrency, recovery and accessibility.
- The API route matrix remains 36 routes / 31 PASS / 5 BLOCKED / 0 NOT_TESTED, with 36/36 authentication-negative checks passing. Its route-by-route evidence remains sourced from `8272d2e39868237c05b2951f37bcade6ae6608c4`; it is not silently re-certified by this dashboard-only test change. **API-001 remains NOT_TESTED overall.**

### Latest production readiness

The exact-`b036174` read-only report [41950432665](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41950432665) reports **HOLD / 13 blockers**. The queue contains 16 items and public publishing remains disabled. The 13 blockers remain the owner cadence decision, complete remote YouTube history/uncertain-attempt reconciliation, genuine rights-cleared Short and long-form manifests/media, human review, verified SonicVhibez channel identity, and four missing YouTube environment values. The report never uploads, schedules or publishes.

## Historical exact-SHA CI results — prior candidate `05daf438c889079853c6521df1cb54a1223424ff`

All listed workflows completed against exact candidate SHA `05daf438c889079853c6521df1cb54a1223424ff`.

| Validation | Run | Result |
|---|---:|---|
| Automation/security | [41941480162](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480162) | **PASS** — 111/111 Node test files, 524 tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, syntax and Python compilation passed |
| Dashboard Chromium E2E | [41941480117](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480117) | **PASS — 23/23** |
| Content quality | [41941480128](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480128) | **PASS** |
| Metadata validation | [41941480299](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480299) | **PASS** |
| Isolated main/candidate baseline | [41941480198](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480198) | **PASS** — exact checkout and test exits verified below |
| Branch reconciliation inventory | [41941480110](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480110) | **PASS** — non-destructive inventory only |
| Nature Frontiers local draft validation | [41941480386](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480386) | **PASS** — local validation only; provider-side creation/read-back skipped |
| npm lockfile workflow | [41941470991](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941470991) | **PASS** — clean locked install and complete Node test suite |
| Production readiness | [41941480109](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480109) | **HOLD** — readiness report generated and uploaded; final mandatory gate correctly failed with 13 blockers |

### Historical retained isolated baseline evidence — `05daf438c889079853c6521df1cb54a1223424ff`

The [baseline-comparison artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480198) records:

- Main `fa00d28e7f58911482686e4ad69fac9f4701a2e6`: install exit 0; 54 Node tests passed, 0 failed, 0 skipped; 8 Python tests passed; both test commands exit 0.
- Candidate `05daf438c889079853c6521df1cb54a1223424ff`: install exit 0; 524 Node tests passed across 111/111 files, 0 failed, 0 skipped; 16 Python tests passed; both test commands exit 0.
- Candidate locked dependency installation reported 0 vulnerabilities.
- FFmpeg and FFprobe installation/verification passed.

The main baseline's older dependency install reported four moderate audit findings. This does not alter the candidate result; no automated dependency fix was applied to main.

The comparison is test evidence, not proof that all business workflows, deployment paths or external providers are accepted.

## Historical Git and history inventory — `05daf438c889079853c6521df1cb54a1223424ff`

The exact [branch inventory artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41941480110) was generated from candidate `05daf438c889079853c6521df1cb54a1223424ff` and records:

| Measure | Result |
|---|---:|
| Branch-only commits | 2,589 |
| Main-only commits | 2 |
| Changed final-tree paths | 231 |
| Final-tree deletions | 0 |
| Patch-equivalent commits | 0 |
| Critical paths requiring semantic review | 17 |
| CI inventory working tree | Clean |

Branch-only commit classification (heuristic, not semantic approval):

- 1,106 documentation-only
- 633 test-only
- 540 implementation
- 106 workflow-only
- 75 mixed
- 71 implementation-and-tests
- 58 configuration/content

The two main-only commits add and then revert `test/restore-facebook-draft-history.test.mjs`. The implementation branch retains that test and `tests/restore-state.test.mjs`; both must be preserved pending review.

The inventory explicitly records `REQUIRES_REVIEW`. Zero patch-equivalent commits does not prove semantic uniqueness. **GIT-002 remains open for human review of the 17 critical paths and divergent implementation history.**

Main remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. No merge, reset, rebase, force-push, main-branch edit or destructive reconciliation occurred. Branch protection remains **UNVERIFIED** because the GitHub protection endpoint returned 403; no claim is made that protection is enabled or disabled.

## Historical dashboard and API acceptance — `05daf438c889079853c6521df1cb54a1223424ff`

- Dashboard source inventory: 104 controls, 16 forms, 40 route handlers, 36 protected API routes.
- Dashboard browser workflow: 23/23 passed on exact candidate `05daf438c889079853c6521df1cb54a1223424ff`.
- **DASH-001 remains NOT_TESTED overall.** The browser journeys and static inventory do not prove exhaustive control-by-control behavior, validation, persistence, authorization, recovery and accessibility.
- The API route matrix retains its route-specific snapshot: 36 routes, 36/36 authentication-negative checks passed, 31 overall PASS and 5 BLOCKED. Its route-by-route evidence snapshot was last generated on source/test SHA `8272d2e39868237c05b2951f37bcade6ae6608c4`; the complete test suite passed on `05daf438c889079853c6521df1cb54a1223424ff`, but this does not independently re-certify every route's acceptance status.
- **API-001 remains NOT_TESTED overall.** The five provider/production-gated routes remain blocked: `POST /api/facebook/verify-page`, `POST /api/facebook/drafts/approve`, `POST /api/facebook/publish`, `POST /api/uploads/reconcile`, and `POST /api/jobs/produce`.

## Requirements register status caveat

The last full requirement assessment remains **82 requirements: 60 PASS / 12 NOT_TESTED / 10 BLOCKED**, dated 2 November 2026. This evidence refresh does not silently change those requirement statuses. The register now records the newer exact-SHA CI and Git evidence while retaining the original assessment date.

Open engineering gates remain: **DASH-001, API-001, SCHED-001, STATE-001, DEPLOY-001 and GIT-002**.

## Historical production readiness — 13 blockers on `05daf438c889079853c6521df1cb54a1223424ff`

The exact-HEAD read-only readiness artifact for `05daf438c889079853c6521df1cb54a1223424ff` reports `blocked`, exit code 2, and 13 blockers:

1. Owner-approved feasible publication cadence, with timezone-aware approval timestamp and non-empty approval reference, preserving the 72-hour minimum and `long_form → long_form → short` cycle.
2. Complete SonicVhibez public, private and unlisted YouTube history reconciliation, including pending and uncertain upload attempts.
3. Genuine `content/render-manifest.json` and verified rights for the Short.
4. Genuine `content/long-form-render-manifest.json` and verified long-form assets and rights.
5. Human-reviewed Short metadata and a hash-bound approval receipt; `READY_FOR_PRIVATE_UPLOAD` only after review.
6. Independently verified SonicVhibez YouTube channel identity.
7. Genuine source and licence/permission evidence for every asset.
8. Human compliance review of final media, captions, thumbnail, metadata, claims and disclosures.
9. Playable final `media/next-short.mp4`.
10. Secure runtime `YOUTUBE_CLIENT_ID`.
11. Secure runtime `YOUTUBE_CLIENT_SECRET`.
12. Secure runtime `YOUTUBE_REFRESH_TOKEN`.
13. Secure runtime `SONICVHIBEZ_CHANNEL_ID`, independently verified against the authenticated account.

The CI readiness process reports all four required YouTube environment variables absent. No secret values are recorded. No media rights, human approvals or channel identity have been fabricated.

## Publishing and brand safety

- YouTube public and unattended publishing remain disabled.
- Nature Frontiers remains separate from SonicVhibez.
- Nature Frontiers workflow success is local draft validation only; no provider-side Page creation or publication is claimed.
- No upload, publication, account reconnection, paid GPU generation, schedule mutation or external provider write occurred in these checks.
- The 72-hour minimum is not weakened. The three-gap cycle requires at least 216 hours; no weekly three-publication target is promised.
- The approved product URL remains `https://selar.com/0u19v8u99l`.

## Next engineering acceptance order

1. Finish exhaustive DASH-001 dashboard control acceptance.
2. Finish API-001 route-level success, validation, persistence, audit, concurrency and restart acceptance; keep provider-gated operations blocked.
3. Finish SCHED-001 scheduling, retry, cancellation, lease expiry and recovery drills without weakening the 72-hour rule.
4. Finish STATE-001 crash/failure-injection and recovery acceptance.
5. Finish DEPLOY-001 clean-install, upgrade, service operation and rollback drills.
6. Complete GIT-002 human semantic review of the 17 critical paths and divergent history.
7. Re-run readiness only after genuine owner-controlled prerequisites are supplied.

No branch integration or publishing action is authorized by this evidence.
