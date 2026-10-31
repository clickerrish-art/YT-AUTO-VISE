# SonicVhibez Marketing Machine — Release Evidence
# 31 October 2026 checkpoint

## Repository and protected Git state

- Repository: https://github.com/clickerrish-art/YT-AUTO-VISE
- Implementation branch: `codex/marketing-machine-audit-fixes`
- Pull request: https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1
- Observed PR state: OPEN, DRAFT, UNMERGED
- Observed branch HEAD at this evidence snapshot: `ba0ed89a3d8509d264bfdcb837ba01443beb25fb`
- Latest exact application/test candidate: `7c8470a86aab237fe87002adbe8cec8fc47ae4d1`
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`
- Comparison at the observed HEAD: 2,259 commits ahead, 2 behind, 183 changed files.
- No merge, reset, rebase, force-push or destructive reconciliation was performed. The work was committed only to the implementation branch.
- A local developer working tree was not available through the remote GitHub session; local uncommitted changes therefore cannot be certified clean.

## Exact-SHA CI evidence

The latest full PR validation batch was triggered on exact application/test SHA `7c8470a86aab237fe87002adbe8cec8fc47ae4d1`. Subsequent commits through `ba0ed89a3d8509d264bfdcb837ba01443beb25fb` updated acceptance documentation and register evidence; no application behavior was changed after that tested candidate.

- Dashboard browser E2E — [run 41142804815](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804815): SUCCESS, 19/19 Chromium journeys on exact SHA `7c8470a86aab237fe87002adbe8cec8fc47ae4d1`.
- Automation/security — [run 41142804948](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804948): SUCCESS, 436 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; npm audit reported 0 vulnerabilities.
- Metadata validation — [run 41142804925](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804925): SUCCESS.
- Content quality — [run 41142804795](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804795): SUCCESS.
- Isolated main/candidate baseline comparison — [run 41142804801](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804801): SUCCESS.
- Non-destructive branch inventory — [run 41142804861](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804861): SUCCESS.
- Nature Frontiers local draft validation — [run 41142804788](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804788): SUCCESS. This validates the local draft package, not an external Facebook or Instagram publication.
- Production readiness — [run 41142804825](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41142804825): EXPECTED HOLD / workflow failure, 13 blockers remain. This is not a passing readiness result.

## DASH-001 dashboard acceptance

Inventory remains 105 dashboard controls, 15 forms and 38 API routes. DASH-001 remains **NOT_TESTED** because full per-control and per-route acceptance is not complete.

Current form-specific matrix:
- PASS: campaignform, draft, facebookdraftform, authoringform, scriptreviewform, narrationform, narrationreviewform (7 forms).
- NOT_TESTED: productionplanform, productionplanreviewform (2 forms).
- BLOCKED: produceform, parentrelationshipform, validationform, rightsform, reviewform, reconcileform (6 forms).

The new narration browser journey exercised the actual dashboard form against an isolated local server and the free Edge TTS service. It:
1. Created a source-bound short-form script and approved its exact script SHA.
2. Submitted the dashboard narration form.
3. Generated real TTS audio, measured with FFmpeg/ffprobe.
4. Verified the 137-word narration and 50–60 second duration requirement.
5. Verified TTS word-boundary caption timing.
6. Verified SHA-256 values and regular-file persistence for narration.mp3, narration.txt, captions.srt and narration-report.json.
7. Reloaded the dashboard and verified the persisted job/artifact state.
8. Simulated a recovery-required state with the completed artifacts retained, then reconciled those files without re-running TTS.
9. Confirmed publishing remained disabled and the narration remained a draft pending human review.

The narration-review form's separate earlier browser journey still uses a synthetic, non-playable audio fixture. It proves hash-bound review API/UI logic only; it does not prove that a human listened to the generated audio or granted genuine editorial approval.

The 19/19 browser result is reproducible in run 41141841497. The earlier initial run 41140897700 failed due to a test-harness assertion using native Response.status as a function; the next run exposed a trailing-newline word-count assertion. Both failures were preserved as historical evidence, corrected, and followed by the passing exact-PR-head run.

## Other requirement acceptance

- API-001: NOT_TESTED overall. Authentication, malformed request and focused successful API cases exist, but all 38 routes have not passed complete authorized success, persistence, concurrency, failure and response-contract acceptance.
- SCHED-001: NOT_TESTED overall. Full worker lifecycle, concurrent workers, retry/recovery, schedule history and operational timezone acceptance are outstanding.
- STATE-001: NOT_TESTED overall. A dashboard server restart journey passes, but complete backup integrity, restore, interrupted-write, cross-process concurrency and crash-recovery acceptance is outstanding.
- DEPLOY-001: NOT_TESTED. No isolated production deployment and rollback drill has been demonstrated.
- GIT-002: NOT_TESTED. Automated non-destructive branch inventory passes, but human semantic review of the full 2,254-ahead/2-behind difference is not complete.

The restore-history investigation is preserved:
- `test/restore-facebook-draft-history.test.mjs` exists on the implementation branch.
- The same path is absent from `main`.
- Neither version has been deleted or overwritten as part of this work.

## Production readiness — 13 blockers remain

The exact readiness run reports these blockers:

1. Owner-approved publication cadence, timezone-aware approval timestamp and approval reference are missing.
2. Complete SonicVhibez public/private/unlisted YouTube history and all pending/uncertain upload attempts must be reconciled.
3. Genuine rights-verified `content/render-manifest.json` is missing.
4. Genuine rights-verified `content/long-form-render-manifest.json` is missing.
5. Human-reviewed metadata is not marked READY_FOR_PRIVATE_UPLOAD.
6. Verified SonicVhibez YouTube channel ID is missing.
7. Rights approval is not established.
8. Compliance approval is not established.
9. Rendered `media/next-short.mp4` is missing.
10. `YOUTUBE_CLIENT_ID` is not configured in the CI execution environment.
11. `YOUTUBE_CLIENT_SECRET` is not configured in the CI execution environment.
12. `YOUTUBE_REFRESH_TOKEN` is not configured in the CI execution environment.
13. `SONICVHIBEZ_CHANNEL_ID` is not configured in the CI execution environment.

The readiness report explicitly states it never uploads, schedules or publishes. No YouTube upload, Facebook publication, Instagram publication, or external account change was attempted in this work.

## Decision

This checkpoint demonstrates a real, successful narration-generation and recovery journey and broad passing CI coverage. It does **not** establish that the entire application is complete, that DASH-001 is accepted, or that production is ready. Keep PR #1 open and in draft; keep publishing disabled; continue with production-plan submission/review, remaining successful form journeys, all-route API acceptance, scheduling, backup/restore, deployment/rollback and semantic branch review.


---

## Implementation continuation — production-plan integrity and business-flow acceptance — 31 October 2026

### Exact source/test candidate

- Application-code commit: `e7d91d06626c1c9c87314f3d380c57c65943ae83`.
- Exact browser/test candidate: `e3a7e8b2bba82b0db96aefe396eaca7dddecf8e9`.
- The subsequent commits `30de9be63fb8db39a9a4ab1869e52186e7650a59` and `068f16aadc4769bd1f08dfd1a2b6a1afaa896268` update only the dashboard acceptance matrix and requirements register; no application behavior changed after the tested candidate.
- At the exact candidate: `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 2,270 commits ahead / 2 behind / 183 changed files. PR #1 remained open, draft and unmerged.

### Implementation changes

- Production-plan review now recomputes the exact narration approval receipt and rejects a persisted `APPROVE` decision if any protected receipt field has changed.
- Production-plan review rechecks a Short's independently approved parent relationship against the persisted parent job, public remote receipt, exact channel identity, parent media hash and canonical URL. Submission-time validation is no longer treated as sufficient.
- The production-plan API returns a fail-closed 409 when narration approval or parent relationship evidence is stale/invalid; it does not write a review decision or approval audit event.
- Regression tests cover narration receipt tampering and stale/wrong parent identity.
- The real dashboard/server Chromium journey additionally alters the persisted narration approval receipt and verifies that review is rejected before restoring the fixture and completing the valid review.

Implementation commits:
- `119cf6215ae922938941d9ab862ffe4c580e9f9b` — receipt and parent revalidation helpers.
- `c0e922877a287e077ede4fb6a504c7d24c4e6f0f` — helper regression tests.
- `e7d91d06626c1c9c87314f3d380c57c65943ae83` — API enforcement.
- `e3a7e8b2bba82b0db96aefe396eaca7dddecf8e9` — browser tamper regression.

### Exact-SHA CI evidence on `e3a7e8b2bba82b0db96aefe396eaca7dddecf8e9`

- Automation/security [run 41148265949](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265949): **SUCCESS** — 438 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, syntax and compilation checks passed.
- Dashboard browser E2E [run 41148260651](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148260651): **SUCCESS** — 20/20 Chromium journeys. The production-plan journey uses an isolated temporary state directory and explicitly test-only media/rights fixtures. It proves dashboard submission, persisted plan read-back, audit event, narration-receipt tamper rejection, changed-scene rejection, reviewer-bound approval, approval hash and server-restart persistence.
- Content quality [run 41148265966](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265966): **SUCCESS**.
- Metadata validation [run 41148265891](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265891): **SUCCESS**.
- Isolated main/candidate baseline [run 41148265897](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265897): **SUCCESS**.
- Non-destructive branch inventory [run 41148265902](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265902): **SUCCESS** (inventory only; human semantic review remains incomplete).
- Nature Frontiers local draft validation [run 41148266077](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148266077): **SUCCESS for local validation only**; provider-side draft creation/read-back was not performed.
- Lockfile verification [run 41148260623](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148260623): **SUCCESS**.
- Production readiness [run 41148265917](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41148265917): **HOLD / BLOCKED by 13 mandatory prerequisites**, as designed. This is not a passing production-readiness result.

### Dashboard acceptance status

- `productionplanform`: **PASS** for isolated dashboard/server submission and durable read-back using test-only fixtures.
- `productionplanreviewform`: **PASS** for exact-hash review, narration receipt tamper rejection, changed scene rejection, persisted reviewer receipt and restart recovery using test-only fixtures.
- The 20/20 browser result is not exhaustive acceptance of the dashboard. DASH-001 remains **NOT_TESTED**: 105 controls and 38 API routes have not all passed dedicated success, failure, authorization, persistence and concurrency acceptance.
- Six downstream production forms remain BLOCKED pending genuine assets, independently verifiable rights, real media validation/final review or an actual uncertain remote upload attempt.

### Scope and honest limitations

- The production-plan browser fixture deliberately uses synthetic test bytes and a test-only rights record. It proves the application gate and integrity mechanics; it is not a genuine production asset, commercial licence, human rights approval or editorial approval.
- No actual production render, YouTube upload, Facebook/Instagram post, visibility change, campaign activation or owner authorization was created by these tests.
- The verified YouTube channel identity/history and credentials, genuine media manifests, rights and human approvals, external Meta identities/permissions, production deployment/rollback drills, full scheduler/worker lifecycle and human semantic branch review remain outstanding.
- `SCHED-001`, `STATE-001`, `API-001`, `DEPLOY-001` and `GIT-002` remain **NOT_TESTED overall** until their full acceptance criteria are demonstrated.
- PR #1 remains open, draft and unmerged. `main` remains untouched. Nature Frontiers remains prohibited as a YouTube target; public/unattended YouTube publishing and live Meta publishing remain disabled.

**Decision:** production-plan submission and review mechanics now have exact-SHA browser acceptance with fail-closed tamper checks. This is a meaningful engineering increment, not 100% application completion or production authorization. Keep the overall project on HOLD until the remaining application, external evidence and operational acceptance gates are independently proven.

---

## Live API route acceptance continuation — 31 October 2026

### Live repository state after this documentation refresh

- PR #1: **OPEN, DRAFT, UNMERGED**.
- PR HEAD immediately before this evidence refresh: `de578e71ef1327147c4b43fa7414b2ca9c55f50b`.
- Exact application/test candidate: `a16b94e60960aba90fa20adc8fcdaf3057e15d68`.
- All commits after the tested candidate in this evidence sequence are documentation-only updates to the acceptance register, dashboard matrix and release evidence; no application behavior changed after the tested candidate. The current live PR HEAD must be read from GitHub rather than inferred from this pre-update reference.
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`.
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Live divergence: **2,278 ahead / 2 behind / 184 changed files**.
- No merge, main edit, reset, rebase, force-push or destructive reconciliation occurred. The local developer working tree is not available through this remote GitHub session; no claim is made about local uncommitted work.

### New API acceptance implementation

- Added `test/dashboard-api-authenticated-route-negative-matrix.test.mjs`.
- The test starts the actual dashboard server in an isolated temporary state directory and sends authenticated empty requests to every source-discovered API method/path.
- It verifies no unexpected 5xx response, a JSON response envelope, no internal filesystem path disclosure, and byte-identical persisted dashboard state after the complete route sweep.
- The current source contains **38 registered route handlers total**: **35 `/api/` routes** plus the dashboard root, `/healthz` and `/readyz`. Older descriptions that call all 38 handlers API routes are inaccurate and should be read as total registered handlers.
- This test is a negative-request acceptance slice only. It does not prove successful business behavior or complete API-001 acceptance.

### Exact-SHA CI on `a16b94e60960aba90fa20adc8fcdaf3057e15d68`

- Automation/security [run 41149529825](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529825): **SUCCESS** — 439 Node tests passed, 0 failures, 0 skips; 16 Python tests passed; npm audit reported 0 vulnerabilities; FFmpeg/ffprobe, JavaScript syntax and Python compilation steps passed.
- Dashboard browser E2E [run 41149529722](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529722): **SUCCESS** — 20/20 Chromium journeys passed against the real local dashboard/backend.
- Metadata validation [run 41149529692](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529692): **SUCCESS** — 439 Node tests, 0 failures, 0 skips; required metadata fail-closed checks passed.
- Content quality [run 41149529718](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529718): **SUCCESS** — 439 Node tests, 0 failures, 0 skips.
- Isolated main/candidate baseline [run 41149529768](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529768): **SUCCESS**; retained comparison artifact ID `13022835442`.
- Non-destructive branch inventory [run 41149529702](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529702): **SUCCESS** (inventory only; human semantic review of all divergent history remains incomplete).
- Nature Frontiers local draft validation [run 41149529710](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529710): **SUCCESS for local draft-package validation only**; provider-side draft creation/read-back was skipped.
- Production readiness [run 41149529996](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41149529996): **HOLD / BLOCKED by 13 mandatory prerequisites**, as intended. The workflow's expected nonzero result is not a code-test failure or a production pass.
- Exact readiness blockers from that run:
  1. Owner-approved feasible cadence mode, timezone-aware approval timestamp and approval reference.
  2. Independent reconciliation of SonicVhibez public/private/unlisted history and all pending/uncertain upload attempts.
  3. Genuine rights-verified `content/render-manifest.json`.
  4. Genuine rights-verified `content/long-form-render-manifest.json`.
  5. Human-reviewed metadata explicitly marked `READY_FOR_PRIVATE_UPLOAD`.
  6. Verified SonicVhibez YouTube channel ID bound to metadata.
  7. Media rights confirmation based on actual evidence.
  8. Content/compliance review confirmation.
  9. Genuine validated `media/next-short.mp4`.
  10. `YOUTUBE_CLIENT_ID` in the secure execution environment.
  11. `YOUTUBE_CLIENT_SECRET` in the secure execution environment.
  12. `YOUTUBE_REFRESH_TOKEN` in the secure execution environment.
  13. Verified `SONICVHIBEZ_CHANNEL_ID` in the secure execution environment.
  The readiness report explicitly performs no upload, scheduling or publication.

### Acceptance register refresh

- Requirements register now contains 73 records: **56 PASS / 9 NOT_TESTED / 8 BLOCKED**.
- Only the permitted statuses `PASS`, `FAIL`, `NOT_TESTED` and `BLOCKED` are used.
- `API-NEG-001` is PASS for the narrow all-route negative-request sweep.
- `API-001` remains NOT_TESTED until route-specific successful operations, invalid-field matrices, persistence, concurrency/idempotency, audit and restart acceptance are complete.
- `DASH-001` remains NOT_TESTED. Static inventory is 105 controls across 15 forms; 20/20 browser journeys are not exhaustive control acceptance.
- Production-plan submission and review remain accepted only for isolated test fixtures and application integrity mechanics. They do not establish genuine source-media provenance, commercial licence validity, human editorial approval, final rendering or upload authorization.

### Safety and outstanding external gates

- `test/restore-facebook-draft-history.test.mjs` remains present on the implementation branch and is included in the Node test suite.
- No YouTube upload, Facebook/Instagram publication, campaign activation, visibility change or external account mutation was performed.
- Nature Frontiers remains prohibited as a YouTube target. Public/unattended YouTube publishing and live Meta publishing remain disabled. Safari remains inactive. The approved Selar destination remains unchanged.
- Genuine media/manifests/rights evidence and human approval, verified SonicVhibez YouTube identity/history/OAuth, live Meta identity/permissions, owner-approved feasible cadence, full scheduler/worker lifecycle, full backup/restore/power-loss and deployment/rollback drills, complete per-control/API acceptance and human semantic branch review remain outstanding.

**Decision: PARTIALLY IMPLEMENTED.** The latest exact-SHA automation and browser suites pass, but API-001, DASH-001 and the full business application are not accepted. Production remains on HOLD.

---

## Live continuation — Nature Frontiers dashboard policy alignment — 31 October 2026

### Exact source/test candidate and live PR state

- Exact tested application/test candidate: `d489318421af534988e2d44df4f6666d3dbc4955`.
- PR #1 was OPEN, DRAFT and UNMERGED at this checkpoint. The PR head immediately before this evidence-only update was `ddbc07932aa863ade7e29a247803d10a59caff80`; this release-evidence commit is documentation-only.
- `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base remains `45352b73bb6cc4787b2a49988b575afb754ab627`.
- The exact tested candidate comparison was 2,285 commits ahead / 2 behind / 184 changed files. The implementation branch remains heavily divergent and still requires human semantic review.
- No merge, main edit, reset, rebase, force-push or destructive reconciliation occurred.
- The original `YT-AUTO-VISE.bundle` was not attached or found in the current conversation. **No bundle checksum, `git bundle verify`, bundle refs or bundle recovery is claimed.** The live GitHub repository was used as a separate source of truth.
- No local developer working tree was available through this remote GitHub session; local uncommitted changes cannot be certified clean.

### Implementation change

- `public/dashboard.html`: removed the Selar promotion option and commercial/affiliate/disclosure controls from the Nature Frontiers Facebook draft form. The form now explicitly says Nature Frontiers is education-only.
- The form's submission payload fixes `campaignId: null`, `commercial: false` and `disclosureRequired: false`; the dashboard can no longer suggest a prohibited promotion that the backend would reject.
- `test/dashboard-ui-contract.test.mjs`: added a regression test asserting that the prohibited controls remain absent and the request payload remains non-commercial.
- `test/dashboard-inventory.test.mjs`: refreshed exact inventory expectations after the four controls were removed.
- Commits: `6af30170db5231fc3d582b63bd88907ea7b89184` (dashboard fix), `60240f3bd8139f215a4c909e6d0a45659c8112ac` (robust regression assertion), and `d489318421af534988e2d44df4f6666d3dbc4955` (inventory test expectations).

### Exact-SHA verification on `d489318421af534988e2d44df4f6666d3dbc4955`

- Automation/security [run 41155835021](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835021): **SUCCESS** — 440 Node tests, 0 failures, 0 skips; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, JavaScript syntax and Python compilation passed.
- Dashboard browser E2E [run 41155835124](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835124): **SUCCESS** — 20/20 Chromium journeys against the real local dashboard/backend.
- Content quality [run 41155835080](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835080): **SUCCESS**.
- Metadata validation [run 41155834980](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155834980): **SUCCESS**.
- Isolated main/candidate baseline [run 41155835151](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835151): **SUCCESS** — both exact main and candidate checkouts returned install, Node and Python exit code 0; retained artifact [13025083151](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835151/artifacts/13025083151).
- Non-destructive branch inventory [run 41155834996](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155834996): **SUCCESS** (inventory only; human semantic review remains outstanding).
- Nature Frontiers local draft validation [run 41155835138](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835138): **SUCCESS for local draft-package validation only**; the provider-side create-draft job was skipped.
- Production readiness [run 41155835201](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41155835201): **HOLD / BLOCKED by 13 prerequisites**, as designed. The report performed no upload, scheduling or publication.

### Current dashboard inventory and acceptance boundary

- **101 HTML controls**: 21 buttons, 41 inputs, 25 selects and 14 textareas.
- **15 forms**.
- **38 total registered route handlers**: 35 `/api/` routes plus `/`, `/healthz` and `/readyz`.
- **83 non-submit controls** have stable IDs and JavaScript bindings.
- The requirements register now contains **74 records: 57 PASS / 9 NOT_TESTED / 8 BLOCKED**. New item `NF-PROMO-UI-001` passes for the exact UI-policy alignment. `DASH-001` remains NOT_TESTED; inventory and 20 browser journeys are not exhaustive acceptance of all controls/routes.

### Remaining production blockers

The exact readiness run still reports 13 blockers:
1. Owner-approved feasible cadence mode, timezone-aware approval timestamp and approval reference.
2. Complete SonicVhibez public/private/unlisted history and reconciliation of all pending/uncertain upload attempts.
3. Genuine rights-verified `content/render-manifest.json`.
4. Genuine rights-verified `content/long-form-render-manifest.json`.
5. Human-reviewed metadata marked `READY_FOR_PRIVATE_UPLOAD`.
6. Verified SonicVhibez YouTube channel ID bound to metadata.
7. Actual media rights confirmation.
8. Content/compliance review confirmation.
9. Genuine validated `media/next-short.mp4`.
10. Secure `YOUTUBE_CLIENT_ID`.
11. Secure `YOUTUBE_CLIENT_SECRET`.
12. Secure `YOUTUBE_REFRESH_TOKEN`.
13. Verified `SONICVHIBEZ_CHANNEL_ID`.

No YouTube upload, Facebook/Instagram post, campaign activation, visibility change or external account mutation occurred. The existing provider-side Metricool schedule was not changed or rechecked as part of this code fix; owner review remains separate.

**Decision: IMPLEMENTATION INCOMPLETE — ENGINEERING WORK REMAINS.** This exact-SHA dashboard policy fix is verified. It does not complete DASH-001, API-001, scheduler/worker acceptance, full state/deployment drills, semantic branch reconciliation or the external production gates.

---

## Live continuation — campaign API integration and abrupt-restart acceptance — 31 October 2026

Exact source/test SHA: `faf7b993ee58b8761c716ca5dc7b70f2b372caae`.

A new real-server integration test, `test/campaign-management-api.integration.test.mjs`, exercises `POST /api/campaigns/manage` against an isolated dashboard process and persistent state directory. It verifies:

- An unapproved destination is rejected with HTTP 400 and does not mutate the state snapshot.
- The exact approved Selar destination can be previewed; the pending URL/disclosure are persisted with their SHA-256 destination-version binding.
- The authenticated operator ID is written to the `CAMPAIGN_PREVIEW` audit event.
- Deactivation clears the pending preview and records a `CAMPAIGN_DEACTIVATE` audit event.
- The dashboard process is terminated with `SIGKILL`; a fresh process then reads the deactivated campaign and both audit events from the same state directory.
- No external provider call is made and `publishingEnabled` remains false.

The API concurrency/restart test also now uses `SIGKILL` after 12 concurrent identical `POST /api/jobs` requests have been acknowledged, then verifies one durable job and one audit event after restart.

### Exact-SHA evidence

- Automation/security [41184686421](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686421): **444 Node tests passed, 0 failed, 0 skipped; 16 Python tests; npm audit 0 vulnerabilities; FFmpeg/FFprobe, syntax and Python compilation checks passed**.
- Dashboard browser E2E [41184686381](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686381): **20/20 Chromium journeys passed**.
- Metadata [41184686382](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686382): **SUCCESS**.
- Content quality [41184686487](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686487): **SUCCESS**.
- Local Nature Frontiers draft validation [41184686385](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686385): **SUCCESS; provider-side creation skipped**.
- Non-destructive branch inventory [41184686405](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686405): **SUCCESS**.
- Isolated exact main/candidate baseline [41184681953](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184681953): **SUCCESS**.
- Production readiness [41184686378](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/41184686378): **HOLD with 13 blockers**, as designed.

**Acceptance boundary:** API-001 and STATE-001 remain NOT_TESTED overall. These tests establish two real-server state-changing routes and recovery after acknowledged writes followed by abrupt process termination. They do not prove all 35 API routes' successful business paths, power-loss/disk-full/interrupted-write behavior, complete backup/restore/rollback drills or ambiguous external side-effect reconciliation. DASH-001 remains NOT_TESTED. No external YouTube or Meta operation was attempted.

