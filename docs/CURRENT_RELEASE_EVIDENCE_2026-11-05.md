# SonicVhibez Marketing Machine — current release evidence

**Evidence date:** 5 November 2026  
**Repository:** `clickerrish-art/YT-AUTO-VISE`  
**Branch:** `codex/marketing-machine-audit-fixes`  
**Candidate HEAD:** `e99bc24511879106157c002c09242315e6219325`  
**Main:** `fa00d28e7f58911482686e4ad69fac9f4701a2e6`  
**Merge base:** `45352b73bb6cc4787b2a49988b575afb754ab627`

## Release decision

**NOT PRODUCTION READY — HOLD.** This document refreshes repository, CI, API and branch-inventory evidence only. It does not authorize a merge, a provider action, upload or publication.

## Exact-SHA automated evidence

All results below are tied to candidate `e99bc24511879106157c002c09242315e6219325`.

| Check | Run | Result |
|---|---:|---|
| Automation/security | [41932281012](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41932281012) | PASS |
| Dashboard Chromium E2E | [41937791880](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41937791880) | PASS — 23/23 tests |
| Content quality | [41932280837](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41932280837) | PASS |
| Metadata validation | [41932280783](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41932280783) | PASS |
| Isolated main/candidate baseline | [41932280933](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41932280933) | PASS |
| Branch reconciliation inventory | [41932280768](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41932280768) | PASS — inventory only |
| Nature Frontiers local draft validation | [41932280669](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41932280669) | PASS — local validation only |
| Production readiness | [41932280922](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41932280922) | HOLD — 13 blockers |

### Exact isolated baseline

The retained [baseline-comparison artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41932280933) records exact checkout SHAs and test exits:

- Main `fa00d28e7f58911482686e4ad69fac9f4701a2e6`: installation exit 0; 54 Node tests passed, 0 failed, 0 skipped; 8 Python tests passed.
- Candidate `e99bc24511879106157c002c09242315e6219325`: installation exit 0; 524 Node tests passed across 111/111 test files, 0 failed, 0 skipped; 16 Python tests passed.
- Both Node and Python test commands exited 0 on both checkouts.
- FFmpeg/FFprobe installation and verification passed.
- The candidate worker API integration test proves that a scoped worker cannot access operator state or lease claims, that an unknown production job returns 404, and that a queued legacy job without the approved authoring pipeline returns 409 with byte-identical persisted state and no render manifest or per-job media directory.

The baseline is a test comparison, not proof that every business workflow or provider integration is production-ready.

## Live Git and integration state

- Candidate branch HEAD: `e99bc24511879106157c002c09242315e6219325`.
- Main HEAD: `fa00d28e7f58911482686e4ad69fac9f4701a2e6` — unchanged.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Branch divergence: **2,582 ahead / 2 behind**.
- Final tree: **229 changed paths**, zero final-tree deletions.
- Patch-equivalent branch commits reported by the inventory: **0**; this is not proof of semantic uniqueness.
- Critical paths requiring semantic review: **17**.
- Branch-only commit classification: 1,102 documentation-only; 632 test-only; 540 implementation; 105 workflow-only; 75 mixed; 70 implementation-and-tests; 58 config/content.
- The two base-only commits add then revert `test/restore-facebook-draft-history.test.mjs`; the branch retains that test and `tests/restore-state.test.mjs`.
- The CI inventory working tree was clean; no destructive reconciliation was performed.
- PR #1 remains **OPEN, DRAFT, UNMERGED**. No merge, reset, rebase, force-push or main-branch edit occurred.

The inventory's classification is heuristic. GIT-002 human semantic review remains NOT TESTED.

## Dashboard acceptance snapshot

The exact-head dashboard run [41937791880](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41937791880) passed **23/23 browser tests**. The source inventory contains 104 controls, 16 forms and 40 route handlers (36 protected API routes). Ten forms have demonstrated successful UI journeys; six downstream forms remain blocked by genuine production prerequisites. DASH-001 remains NOT_TESTED overall because full per-control success, validation, failure, authorization, persistence and recovery acceptance is not complete.

## API acceptance snapshot

The existing API matrix contains 36 protected routes:

- 31 overall PASS.
- 5 overall BLOCKED.
- 0 overall NOT TESTED.
- 36/36 authentication-negative checks pass.

The five blocked operations remain:
- `POST /api/facebook/verify-page`
- `POST /api/facebook/drafts/approve`
- `POST /api/facebook/publish`
- `POST /api/uploads/reconcile`
- `POST /api/jobs/produce`

For `POST /api/jobs/produce`, the fail-closed negative path is now verified on this exact candidate. A legacy job without the approved authoring pipeline is rejected before state, audit, lease or artifact mutation. Successful rendering remains blocked pending genuine approved script, narration, scene and rights-cleared media evidence.

API-001 remains NOT TESTED overall; individual route acceptance does not replace complete business API acceptance.

## Requirement register status caveat

The existing register's last full status assessment remains **82 requirements: 60 PASS / 12 NOT_TESTED / 10 BLOCKED**, recorded 2 November 2026. This evidence refresh does not silently relabel those statuses. The following remain open: DASH-001, API-001, SCHED-001, STATE-001, DEPLOY-001 and GIT-002. The register has been annotated with the newer live SHA and CI evidence while retaining the historical status-assessment date.

## Production readiness — 13 blockers

The exact-HEAD read-only readiness artifact reports status `blocked`, exit code 2, and these blockers:

1. Owner decision on a feasible publication cadence, preserving the 72-hour minimum and `long_form → long_form → short` cycle, with a timezone-aware approval timestamp and non-empty reference.
2. Independent reconciliation of complete SonicVhibez public, private and unlisted YouTube history, including pending and uncertain attempts.
3. Genuine `content/render-manifest.json` with verified rights and final media evidence.
4. Genuine `content/long-form-render-manifest.json` with verified long-form assets and rights.
5. Human review of final media, captions, thumbnail, metadata, claims and disclosures; metadata must be marked `READY_FOR_PRIVATE_UPLOAD` only after review.
6. Verified SonicVhibez YouTube channel identity.
7. Genuine source and licence/permission evidence for every asset before `rightsConfirmed` can be true.
8. Human compliance review before `complianceReviewed` can be true.
9. Final playable `media/next-short.mp4`.
10. `YOUTUBE_CLIENT_ID` in the secure runtime environment.
11. `YOUTUBE_CLIENT_SECRET` in the secure runtime environment.
12. `YOUTUBE_REFRESH_TOKEN` in the secure runtime environment.
13. `SONICVHIBEZ_CHANNEL_ID` in the secure runtime environment and independently verified against the authenticated account.

The readiness artifact reports all four YouTube environment variables missing in the CI environment. No secret values are recorded here.

## Publishing and brand safety

- YouTube public and unattended publishing remain disabled.
- Nature Frontiers remains separate from SonicVhibez.
- Nature Frontiers local draft validation does not claim provider-side Page creation or publishing.
- No upload, publication, schedule mutation, account reconnection, paid GPU generation or external provider mutation occurred in these checks.
- The approved product URL remains `https://selar.com/0u19v8u99l`; no additional product claim or destination is authorized.

## Next engineering acceptance order

1. Complete DASH-001 exhaustive dashboard control behavior and accessible interaction acceptance.
2. Complete API-001 route-level success, validation, persistence, audit, concurrency and restart coverage; retain provider-gated routes as blocked.
3. Complete SCHED-001 end-to-end scheduling, retry, cancellation, lease expiry and recovery drills without weakening the 72-hour rule.
4. Complete STATE-001 crash/failure-injection and recovery acceptance.
5. Complete DEPLOY-001 clean install, upgrade, service operation and rollback drills.
6. Complete GIT-002 human semantic review of the 17 critical paths and divergent implementation history.
7. Re-run the exact-HEAD readiness gate after genuine owner-controlled prerequisites are supplied.

No branch integration or publishing action is authorized by this report.
