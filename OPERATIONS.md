## Latest verified implementation and CI checkpoint — 27 October 2026, 21:28 UTC

**Exact tested candidate SHA:** `466605be027f531d1c6143a6d1f42e1bf4c2ffcc`. The candidate includes strict Short-parent approval timestamp validation, FFmpeg installation in the content-quality and metadata workflows, and explicit zero-skip assertions in the automation, content-quality and metadata workflows.

- **Automation/security PASS:** [run 40586772617](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772617): 373 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; normal lifecycle-script install, npm audit 0 vulnerabilities, FFmpeg renderer integration, JS syntax and Python compilation passed.
- **Content quality PASS:** [run 40586772612](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772612): 373 tests, 0 failures, 0 skips. **Metadata validation PASS:** [run 40586772614](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772614): 373 tests, 0 failures, 0 skips. Both jobs install FFmpeg/ffprobe and fail if the Node test summary does not explicitly report zero skips.
- **Dashboard browser E2E PASS:** [run 40586772627](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772627), 13 Chromium journeys.
- **Isolated main/candidate baseline PASS:** [run 40586772619](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772619); [retained baseline artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772619/artifacts/12772562360).
- **Facebook workflow PASS for local deterministic draft validation only:** [run 40586772611](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772611); external `create-draft-package` remains skipped, so no live Meta integration is accepted.
- **Production readiness BLOCKED:** [run 40586772604](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586772604), fail-closed with 13 genuine production prerequisites.

### Latest implementation fixes

1. Parent relationship and native association approval timestamps must be strict, calendar-valid ISO timestamps with explicit timezones. Regression tests reject timezone-free values, impossible dates and invalid UTC offsets.
2. FFmpeg is installed in content-quality and metadata CI jobs, removing the previous renderer integration skip.
3. CI explicitly fails if the automation, content-quality or metadata Node test summary does not report zero skipped tests.

**Verdict: automated code and CI acceptance pass on this exact candidate SHA; implementation remains partial and production acceptance is blocked.** Genuine rights-cleared media, human approvals, independently verified SonicVhibez identity and complete remote history, secure runtime credentials, owner-approved cadence, live Meta draft creation and complete operational recovery/deployment drills remain unproven.

No upload, post, campaign activation, visibility change, merge, main edit or destructive Git operation occurred. PR #1 remains open, draft and unmerged.

---

## Latest verified implementation and workflow checkpoint — 27 October 2026, 21:25 UTC

**Exact tested candidate SHA:** `9310d961311871c3f6e9d2b1271735129fe45d31`. **Application-code fix:** `ebd4f334683237878bac742e052767faabb4f632`. **CI fixes:** `1702513c9d32e22b99dd218054ce693b246402c7` and `9310d961311871c3f6e9d2b1271735129fe45d31`.

- **Automation/security PASS:** [run 40586342797](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342797): 373 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; normal lifecycle-script install, npm audit 0 vulnerabilities, FFmpeg renderer integration, JS syntax and Python compilation passed.
- **Content quality PASS:** [run 40586342818](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342818): 373 Node tests, 0 failures, 0 skips. **Metadata validation PASS:** [run 40586342777](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342777): 373 Node tests, 0 failures, 0 skips. Both workflows now install FFmpeg/ffprobe before testing; previously each had one FFmpeg-dependent skip.
- **Dashboard browser E2E PASS:** [run 40586342774](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342774), 13 Chromium journeys.
- **Isolated main/candidate baseline PASS:** [run 40586342909](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342909); [retained comparison artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342909/artifacts/12772391880).
- **Facebook workflow PASS for local deterministic draft validation only:** [run 40586342799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342799); remote `create-draft-package` was skipped, so no live Meta integration is accepted.
- **Production readiness BLOCKED:** [run 40586342805](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40586342805), fail-closed with 13 genuine production prerequisites.

### Implementation fixes

1. Short-to-parent relationship approval and native-association verification timestamps now require strict calendar-valid ISO timestamps with explicit timezones; regression cases reject timezone-free timestamps, impossible dates and invalid UTC offsets.
2. Content-quality and metadata workflows install FFmpeg and ffprobe rather than silently skipping the real renderer integration test.

**Verdict: automated code and CI acceptance pass on the exact tested candidate SHA; implementation is partial and production acceptance remains blocked.** Genuine media/rights, human approvals, verified channel identity and full remote history, secure runtime credentials, owner-approved cadence, live Meta draft creation and full recovery/deployment drills remain unproven.

No upload, post, campaign activation, visibility change, merge, main edit or destructive Git operation occurred. PR #1 remains open, draft and unmerged.

---

## Latest verified implementation checkpoint — 27 October 2026, 21:19 UTC

**Exact source/test SHA:** `9abc4a46ed3ea6e3368ad7af5f24c587baee9411`. **Application code commit:** `ebd4f334683237878bac742e052767faabb4f632`. The new timestamp-hardening regression test passed on the exact source/test SHA.

- **Automation/security PASS:** [run 40585444830](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444830): 373 Node tests passed, 0 failed, 0 skipped; 16 Python tests passed; normal lifecycle-script dependency install, npm audit with 0 vulnerabilities, FFmpeg renderer integration, JS syntax checks and Python compilation passed.
- **Dashboard browser E2E PASS:** [run 40585444732](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444732), 13 Chromium journeys against the local dashboard/backend.
- **Content quality PASS:** [run 40585444874](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444874). **Metadata PASS:** [run 40585444697](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444697). Each of these two workflow-specific test invocations skipped one FFmpeg-dependent test because FFmpeg was absent in those jobs; the automation workflow installed FFmpeg and ran the full 373-test candidate suite with zero skips.
- **Isolated main/candidate baseline PASS:** [run 40585444803](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444803). The retained comparison artifact is [available here](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444803/artifacts/12771906551).
- **Facebook workflow PASS for local draft validation only:** [run 40585444973](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444973); external `create-draft-package` was skipped, so no real Meta integration is accepted.
- **Production readiness BLOCKED:** [run 40585444822](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40585444822); fail-closed report identifies 13 outstanding production prerequisites.

### Implementation change

Short-to-parent relationship approval timestamps and native Related-video verification timestamps now use the strict shared ISO timestamp validator, rejecting timezone-free timestamps, impossible calendar dates and invalid UTC offsets. Regression coverage is in [test commit](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/9abc4a46ed3ea6e3368ad7af5f24c587baee9411).

**Verdict: automated code checks pass at this exact SHA; overall implementation is partial and production acceptance remains blocked.** Genuine production media/rights, human approvals, verified SonicVhibez identity and complete remote history, secure runtime credentials, owner-approved cadence, actual Meta draft integration and full operational recovery/deployment drills are not replaced by CI results. PR #1 remains open, draft and unmerged. No upload, post, campaign activation, visibility change, merge, main edit or destructive Git operation occurred.

---

## Unverified follow-up code checkpoint — 27 October 2026

A new source/test change was committed after the last verified SHA. The latest **verified** source/test SHA remains `4ee5a6c8f1dded39d97d9b30dd70f9e0df2b32cd`. New code commit `ebd4f334683237878bac742e052767faabb4f632` tightens Short-to-parent approval timestamps, and test commit `9abc4a46ed3ea6e3368ad7af5f24c587baee9411` adds regression cases for timezone-free timestamps, impossible dates and invalid offsets. **The new source/test SHA is NOT TESTED**: no workflow runs were returned for it, and a local clone could not be fetched because this environment could not resolve github.com. Do not attribute the previous passing test counts to this newer SHA.

The latest test candidate requires CI to run before acceptance: `9abc4a46ed3ea6e3368ad7af5f24c587baee9411`. Production readiness remains blocked. PR #1 remains open, draft and unmerged; no external publishing or destructive Git operation was performed.

---

## Latest verification — 27 October 2026

The retained render output and manifest guards passed the exact source/test SHA `3690ec82b52263cb2da2378f8aba9a5b19658a8f`: automation/security [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972741), 367 Node tests / 0 failures / 0 skips, 16 Python tests, 0 npm audit vulnerabilities; dashboard E2E [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972740), 13 Chromium journeys; content quality [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972899); metadata [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972743). Isolated baseline [PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972749), with one candidate integration test explicitly skipped because FFmpeg could not be installed in that isolated baseline runner. Production readiness remains [BLOCKED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40575972751).

Continue to preserve any existing MP4, thumbnail or per-job manifest and reconcile it under operator review before retrying. Never delete retained evidence merely to get a clean render. A private parent cannot serve as a native Short Related video under YouTube's [official eligibility rule](https://support.google.com/youtube/answer/14075157?hl=en); do not change privacy to bypass it. Real media/rights/playback approval, verified OAuth/history, one-shot private-upload receipt, eligible Short-parent association, live Meta integration, owner cadence approval and full recovery/deployment acceptance remain outstanding.

---

## Live recovery note — 27 October 2026

A render request now refuses to overwrite an existing per-job MP4, thumbnail or render manifest. The standalone render destination validator also refuses an existing regular output file. A `409 recoveryRequired` response means **do not delete the file and retry blindly**: preserve the artifact, inspect job state and hashes, and reconcile the interrupted attempt under operator review. The current regression tests assert that retained bytes are unchanged and the job remains queued. Exact source/test checkpoint: `3690ec82b52263cb2da2378f8aba9a5b19658a8f`; automation/security and isolated baseline were still running at the time this note was recorded.

Production is still blocked on genuine rights-cleared media, full human playback approval, verified SonicVhibez OAuth identity/history, an explicitly authorized one-shot private upload with verified receipt, a platform-eligible Short Related video, real Meta integration and operational recovery/deployment acceptance. YouTube requires a Related video to be public or unlisted; do not change a private parent to bypass this limitation. Keep all live publishing disabled.

---

## Latest operational checkpoint — 26 October 2026

Exact tested source/test SHA: `9982caed6bee7f8d01740acff5162b94988b2e59`; application-code commit: `1aeca29026c6965fe13ff206f8cc097f7d4fa038`.

The latest code gates now reject shallow/out-of-duration scripts, reserved/private research URLs, malformed or missing explicit Short parent identifiers, and audio reports without measured loudness range. Estimated script duration is not a substitute for measured final audio duration or genuine human full-playback review.

Current exact-SHA evidence: content quality, metadata, browser E2E and isolated baseline **PASS**; automation/security **IN PROGRESS** at last observation; production readiness **BLOCKED**; Facebook daily draft **SKIPPED**. See `docs/CURRENT_RELEASE_EVIDENCE_2026-10-26.md`.

Operational safety remains unchanged: public/unattended YouTube publishing disabled; Facebook live publishing disabled; Safari campaigns inactive; PR #1 open/draft/unmerged. Never retry an uncertain upload until its durable attempt ledger and YouTube state are reconciled. Do not treat a description URL as proof of native YouTube Related video. Do not alter the 72-hour minimum or cadence policy without explicit owner approval.

---

## Latest live checkpoint — 26 October 2026: parent source evidence and exact-SHA acceptance

**Application-code SHA:** `02eb5c42b81b479223fd32c262247d75ecf5472d`. **Exact tested source/test SHA:** `02eb5c42b81b479223fd32c262247d75ecf5472d`. **PR HEAD at this checkpoint:** `2f455314d4f75dafe8b9b309ead0040570158e09` (documentation-only descendant after the tested source/test SHA).

- **Live Git state:** `main` `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; **1,447 ahead / 2 behind / 148 changed files**. PR #1 remains **OPEN, DRAFT, UNMERGED**.
- **Automation/security — PASS:** [run 40325797435](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797435): 319 Node tests passed, 0 failed/skipped; 8 Python safety tests passed; normal/locked install, syntax/compile checks passed; npm audit reported 0 vulnerabilities.
- **Content quality — PASS:** [run 40325797106](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797106). **Metadata — PASS:** [run 40325797283](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797283). **Dashboard browser E2E — PASS:** [run 40325797233](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797233), 11 Chromium journeys. **Isolated main/candidate baseline — PASS:** [run 40325797285](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797285), Node/Python commands exited 0 for both main and candidate.
- **Production readiness — BLOCKED:** [run 40325797317](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797317). **Nature Frontiers Facebook draft — SKIPPED:** [run 40325797165](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325797165), not integration evidence.
- **Implementation:** dashboard requires the exact parent quality-evidence path; backend validates source-scene IDs and time ranges; relationship digest includes evidence path/hash; uploader rechecks evidence immediately before remote insert. Successful binding with genuine approved media/receipt remains **NOT TESTED end-to-end**.
- **Remaining blockers:** genuine final exports and human realism/playback review; integrated narration/caption/render/review; YouTube OAuth/channel/history reconciliation; native Related video while parent is private; verified Meta Page and non-skipped draft; feasible owner-approved cadence; exhaustive recovery/deployment drills and full divergent-history review.
- **Safety:** public/unattended YouTube and Facebook live publishing remain disabled; Safari campaigns remain inactive; approved Selar URL remains `https://selar.com/0u19v8u99l`. No live upload/post, campaign activation, visibility change, merge or destructive Git operation occurred.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.**

---

## Live checkpoint — 26 October 2026: Short-parent source-evidence binding

**Application-code SHA:** `02eb5c42b81b479223fd32c262247d75ecf5472d`. **Exact tested source/test SHA:** `02eb5c42b81b479223fd32c262247d75ecf5472d`. **Latest workflow-only PR HEAD at this checkpoint:** `baa1fcfee7e71082a187746bae65c7c3d0730650`; it bounds optional FFmpeg installation in the isolated-baseline workflow and does not change application code or tests.

- **Live Git state at the code checkpoint:** PR #1 HEAD `baa1fcfee7e71082a187746bae65c7c3d0730650`; `main` `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; **1,438 ahead / 2 behind / 148 changed files**. PR #1 remains **OPEN, DRAFT, UNMERGED**.
- **Automation/security — PASS:** [run 40325185979](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185979): 319 Node tests passed, 0 failed/skipped; 8 Python safety tests passed; normal/locked install, syntax/compile checks passed; npm audit reported 0 vulnerabilities.
- **Content quality — PASS:** [run 40325185867](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185867). **Metadata — PASS:** [run 40325185858](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185858). **Isolated main/candidate baseline — PASS:** [run 40325185901](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185901), main and candidate Node/Python commands exited 0.
- **Dashboard browser E2E:** **PASS on exact source/test SHA `02eb5c4`** — [run 40324089738](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40324089738), 11 Chromium journeys. The workflow for the latest workflow-only PR HEAD `baa1fcf` was **IN PROGRESS at last query**: [run 40325186030](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325186030); do not report that run as completed.
- **Production readiness — BLOCKED:** [run 40325185869](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185869). **Nature Frontiers Facebook draft — SKIPPED:** [run 40325185929](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40325185929), not external-integration evidence.
- **New enforcement:** dashboard parent binding requires the exact parent quality-evidence path; backend checks scene IDs/time ranges against the explicit long-form timeline; relationship digest includes the evidence path and SHA-256; private upload rechecks evidence bytes and source segments immediately before remote insert. Successful relationship binding with real approved media/receipt remains **NOT TESTED end-to-end**.
- **Remaining blockers:** genuine rights-cleared final exports and human playback/realism review; integrated narration/caption/multi-scene render/review; verified SonicVhibez OAuth/channel identity and complete YouTube history/uncertain-attempt reconciliation; native Related video while parent is private; verified Meta Page and successful non-skipped draft; feasible owner-approved cadence; exhaustive dashboard/recovery/backup/restore/concurrency/deployment drills; full divergent-history review and branch governance.
- **Safety:** public/unattended YouTube and Facebook live publishing remain disabled; Safari campaigns remain inactive; approved Selar URL remains `https://selar.com/0u19v8u99l`. No live upload/post, campaign activation, visibility change, merge or destructive Git operation occurred.

**Verdict: CODE ACCEPTANCE PARTIAL / PRODUCTION ACCEPTANCE BLOCKED.**

---

## Latest implementation checkpoint — 26 October 2026: explicit Short-to-parent review and upload binding

**Application source SHA:** `cabd24f750cf68bb801538bc959f9f61e4c03cdf`. **Exact tested source/test-tree SHA:** `defe68872edc1a24e404a17a4e997e98708826b6` (the application source at this SHA includes the same code plus updated regression fixtures). PR HEAD at the start of this checkpoint was `defe68872edc1a24e404a17a4e997e98708826b6`; subsequent documentation-only commits are separate. `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`; divergence at this checkpoint: 1,411 ahead / 2 behind / 144 changed files. PR #1 remains open, draft and unmerged.

### Latest code behavior
- Added a strict Short-parent relationship schema and validator with exact child/parent content IDs, revisions, media and metadata hashes, parent approval digest, verified remote parent video ID, canonical URL, verified SonicVhibez channel identity/title/privacy, same publication cycle, explicit source-scene segments, reviewer/timestamp/notes, tamper-evident relationship evidence and separate native Related video status.
- Added authenticated `POST /api/jobs/parent-relationship`. It requires explicit child and parent media paths, a human-approved long-form parent, a verified private-upload ledger/receipt, matching media/metadata hashes, matching explicit publication-cycle ID, child metadata naming the exact parent ID and canonical URL, and explicit reviewer confirmation plus notes. It stores an audit event and marks native Related video `BLOCKED_EXTERNAL` for a private parent.
- Lifecycle approval and upload-approval validation reject a missing, stale, cross-channel or mismatched parent relationship. The uploader rechecks child/media/metadata/approval hashes, all related artifacts, authenticated channel identity and exact remote parent ID/title/channel/privacy immediately before the irreversible insert. Upload attempt/receipt evidence stores the parent IDs, relationship digest and native Related video status.
- Regression coverage now includes missing/stale relationships, wrong parent/channel/URL, cycle mismatch, invalid native feature claims, upload-approval binding, and mocked parent reconciliation. No test performs a real upload.
- The relationship API is not yet exposed as a dedicated dashboard control and has no dedicated browser journey covering successful bind, stale-parent mutation and restart persistence. Do not treat the entire Short lifecycle as accepted.

### Exact-SHA CI evidence
- Automation/security **PASS** — 312 Node tests, 8 Python safety tests, locked install/compile checks, npm audit 0 vulnerabilities: [run 40311601185](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601185).
- Content quality **PASS** — 312 tests, 0 failures: [run 40311600981](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311600981).
- Metadata validation **PASS**: [run 40311601046](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601046).
- Dashboard browser E2E **PASS** — 10 Chromium journeys: [run 40311602123](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311602123).
- Isolated main/candidate baseline **PASS**: [run 40311601026](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601026).
- Production readiness **BLOCKED** — 13 blockers remain, including complete remote history/uncertain-attempt reconciliation: [run 40311601074](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601074).
- Nature Frontiers Facebook draft workflow **SKIPPED**, not integration evidence: [run 40311601171](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40311601171).

### Remaining blockers
No genuine rights-cleared final exports or human playback approval; YouTube OAuth/channel identity and complete upload history remain unverified; no owner-approved feasible cadence; native Related video remains blocked while the parent is private; Meta Page identity/draft integration is unverified; the complete script-to-narration/captions/multi-scene-render/review pipeline, exhaustive dashboard matrix, full divergent-history review, backup/restore and deployment drills remain incomplete. Public/unattended YouTube and Facebook publishing remain disabled; Safari remains inactive.

**Verdict: CODE ACCEPTANCE BLOCKED / PRODUCTION ACCEPTANCE BLOCKED.**

---

## Latest implementation checkpoint — 26 October 2026: explicit Short-to-parent binding

**Exact tested application-code SHA:** `9766a5181eeb3a055357bbc8551af2e6f0fdb6f8`. The later release-document commits, if any, are documentation-only and do not change this application code. Live `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`; comparison at this checkpoint: 1,396 ahead / 2 behind / 144 changed files. PR #1 remains open, draft and unmerged.

### Implemented in this checkpoint
- Added `scripts/short-parent-relationship.mjs`: explicit parent/child content IDs, exact child and parent media/metadata hashes, parent approval hash, verified remote video ID, canonical watch URL, SonicVhibez channel identity, remote title/privacy verification, shared publication cycle, source scene segments, reviewer/timestamp, tamper-evident relationship evidence digest, and an honest separate native Related video status.
- Integrated the relationship into lifecycle approval and private-upload approval validation. A Short without a current, exact relationship cannot pass the approval gate.
- Added authenticated `POST /api/jobs/parent-relationship`. It requires explicit child and parent media paths, a human-approved long-form parent, an actual verified private-upload ledger entry and receipt, matching parent media/metadata hashes, matching explicit publication cycle, and child metadata that names the exact parent ID and canonical URL. It rechecks parent receipt and hashes before Short review.
- Updated `scripts/upload-private.mjs` to reject missing/stale parent bindings, revalidate the exact child/metadata/approval and related-artifact hashes immediately before the remote insert, recheck authenticated SonicVhibez identity, and independently re-fetch the exact parent video to verify ID, title, channel and privacy. The receipt/attempt ledger records parent content ID, remote parent ID, relationship digest and native Related video status.
- Added focused relationship and uploader tests; updated isolated upload tests to use a mock verified parent. Tests use fixtures only and do not upload real media.
- A private parent is explicitly marked `BLOCKED_EXTERNAL` for native YouTube Related video. The code does not change visibility or claim that a description URL proves the native feature.

### Exact-SHA workflow evidence
- Automation/security **PASS** — 312 Node tests, 8 Python safety tests, clean install/compile checks, npm audit 0 vulnerabilities: [run 40310763040](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763040).
- Content quality **PASS** — 312 tests, 0 failures: [run 40310763155](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763155).
- Metadata validation **PASS**: [run 40310763002](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763002).
- Dashboard browser E2E **PASS** — 10 Chromium journeys against the real local dashboard/backend: [run 40310762992](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310762992).
- Isolated main/candidate baseline **PASS**: [run 40310762998](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310762998).
- Production readiness **BLOCKED**, as required by unresolved real prerequisites: [run 40310763178](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763178).
- Nature Frontiers Facebook draft workflow **SKIPPED**, not integration evidence: [run 40310763123](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40310763123).

### Remaining limitations
- The parent-binding API has unit and full-suite coverage, but no dedicated browser journey yet exercises successful parent binding, stale-parent mutation and the entire Short-to-parent-to-approval sequence. The visible dashboard has not yet gained a dedicated parent-binding control.
- No real parent receipt, channel identity, rights-cleared media, full playback approval or native Related video evidence was created during tests.
- Full script-to-narration/captions/multi-scene render/review lifecycle, exhaustive dashboard-control coverage, full divergent-history review, backup/restore and deployment drills remain incomplete.
- Owner must provide a feasible, timestamped cadence approval and verify YouTube/Meta accounts. Public/unattended YouTube and Facebook live publishing remain disabled; Safari remains inactive.
- **Verdict remains CODE ACCEPTANCE BLOCKED / PRODUCTION ACCEPTANCE BLOCKED.** Automated code checks pass on the exact application-code SHA, but the full acceptance criteria are not satisfied.

---

> **Latest implementation checkpoint — 26 October 2026 (source/test SHA 25f920890479271e961b4178f52675d6a811e4e6).** The dashboard now starts source-constrained script generation through authenticated POST /api/jobs/author, durably stores the exact supplied research brief and generated script, records audit events, reuses identical completed requests, rejects silent brief replacement, and marks stale in-flight calls RECOVERY_REQUIRED without retrying. Generated script claims do not pass originality review; factual, rights and human editorial gates remain pending. Jobs with authoring records are blocked from bypassing the missing narration/caption/scene integration by using the fixed-manifest renderer. The UI displays the persisted script as escaped text and has a responsive CSS correction. Exact-SHA automation/security PASS: 306 Node tests, 8 Python safety tests, npm audit 0 vulnerabilities ([run 40306582741](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582741)); content quality PASS ([40306582779](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582779)); metadata PASS ([40306582615](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582615)); isolated main/candidate baseline PASS ([40306583897](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306583897)). Readiness remains BLOCKED ([40306582834](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582834)); Facebook draft workflow SKIPPED ([40306582827](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582827)). Browser E2E is still running ([40306582878](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40306582878)); a previous SHA failed the 375px viewport test, and the CSS fix is not yet verified. The complete authoring-to-render pipeline, multi-scene renderer, full dashboard matrix, full branch-history review, recovery/deployment drills and production account/media prerequisites remain blocked. Keep public/unattended YouTube and Facebook live publishing disabled; Safari campaigns inactive.

> **Current source/test checkpoint — `2686612d9982e0094cd25759e9a73fe466585634` (25 October 2026).** Dashboard validation now executes strict format-specific media validators, and private-upload approval rechecks the exact validated captions hash and binds the MP4, thumbnail, captions and metadata hashes. A regression test verifies the live dashboard returns HTTP 400 and persists no passing result when a Short's frame rate is invalid; lifecycle tests reject approvals with missing captions or failed technical validation. Exact-SHA evidence: [automation/security PASS — 280 Node tests, 0 failures, 8 Python safety tests, npm audit 0 vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940102), [real-dashboard Chromium E2E PASS — 10 tests on this exact SHA](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229935212), [isolated main/candidate baseline PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229935210), [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940142), and [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940079). [Production readiness remains BLOCKED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940077) by owner-controlled prerequisites; the [Nature Frontiers Facebook draft workflow was SKIPPED](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40229940225), not integration evidence. Exhaustive dashboard control coverage, fault-injection/recovery/deployment drills, genuine rights-cleared media, authenticated YouTube/Meta identities, owner-approved feasible cadence, full history review and branch governance remain unresolved. Public/unattended YouTube and Facebook live publishing remain disabled; Safari remains inactive; no upload, post, campaign activation or merge occurred. `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; divergence at this source/test checkpoint is 1,208 ahead / 2 behind / 124 changed files. PR #1 remains open/draft/unmerged.

> **Latest verified code checkpoint — 25 October 2026:** Candidate `8146666ec32d5496dd0af6fb93a79fbd3284bf8f` includes symlink-/traversal-safe readiness prerequisite checks, a corrected readiness CI gate that compares retained exit codes, and Facebook idea-date validation returning HTTP 400 for malformed/impossible dates without mutating drafts. Exact-candidate evidence: [automation/security — 276 Node tests, 0 failures, 8 Python tests, 0 reported dependency vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472179), [browser E2E — 9 passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472355), [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472244), [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472262), and [locked install PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223467206). [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472230) correctly records exit codes 2/2 and remains **BLOCKED** on genuine prerequisites; the [Facebook draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40223472186) was **SKIPPED**, not passed. These results apply to this exact candidate; the final PR HEAD's separate checks remain authoritative.

> **Latest verified code checkpoint — 25 October 2026:** Source/test candidate `dfad17c87c6473a81ac65baa67ac7f694e2c7b29` adds symlink- and traversal-safe readiness file checks and corrects the readiness workflow to compare retained line-delimited exit codes. Exact-candidate evidence: [automation/security — 276 Node tests, 0 failures, 8 Python tests, 0 reported dependency vulnerabilities](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702143), [browser E2E — 8 passed](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702124), [content quality PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702109), [metadata PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702097), and [locked install PASS](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222697980). [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702175) correctly records exit codes 2/2 and remains **BLOCKED** on genuine prerequisites; the [Facebook draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40222702166) was **SKIPPED**, not passed. These results apply only to this exact candidate until the final PR HEAD's checks complete.

> **Cadence decision blocker — 25 October 2026:** The requested target of two long-form videos plus one Short per week is mathematically incompatible with a 72-hour minimum between consecutive publications: three cyclic gaps require at least 216 hours (9 days), versus 168 hours in a week. `config/weekly-content-plan.json` now records the requested target and `cadenceDecision.status=OWNER_DECISION_REQUIRED`; `npm run validate:schedule` reports the conflict, and production readiness blocks publication until a feasible mode is explicitly owner-approved. Draft-generation triggers are not publication times. Public/unattended publishing remains disabled.

## Authoritative current checkpoint — 25 October 2026

**Current source/test candidate:** `4819a6ed6553a87913aa8edc07a0aca09979831e`. **Documentation descendant before this refresh:** `600def0df653963c55560eb98461f4af2ba5c16e`. Documentation updates do not change application code; every final PR HEAD must still have its own CI verified.

- [Automation/security on source/test SHA](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909067): **PASS** — 267 Node tests, 0 failures, 0 skipped; 8 Python tests; normal lifecycle-script install isolation passed; dependency audit reported 0 vulnerabilities; JavaScript syntax and Python compilation passed.
- [Dashboard browser E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909103): **PASS** — 8 Chromium tests against the local dashboard/backend.
- [Metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909068) and [content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909057): **PASS**.
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909066): **BLOCKED** by required owner-controlled prerequisites.
- [Facebook draft workflow](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40211909117): **SKIPPED**, not live Page integration evidence.
- Restore safety fix: `scripts/restore-state.mjs` rejects symlinked backup files and ancestors, opens the backup without following a final-component symlink where supported, and inspects every destination path component from the filesystem root. Regression tests in `tests/restore-state.test.mjs` cover a symlinked backup file, symlinked backup parent, symlinked destination root, regular backup read and explicit confirmation. See [implementation](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/73cf186a988d8a6fbc636298a4da6d7b78e15745), [destination-ancestor hardening](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/4dd3f1ea11e4619ed3b85e9add38a1a31af53cd1), [backup-path tests](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/832482f1ad8068421f7c4894bb5e5ac956a36a93), [destination-ancestor regression](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/4819a6ed6553a87913aa8edc07a0aca09979831e). Portable path-based APIs cannot eliminate every ancestor TOCTOU race; use an isolated restore environment.
- Dashboard mapping: [DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.md](DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.md). The acceptance register includes `RESTORE-001` and retains untested/external requirements as unresolved.
- Git state before this docs refresh: PR #1 open, draft and unmerged; `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; 1,135 commits ahead, 2 behind, 118 changed files. Full branch-only patch review remains incomplete; do not reconcile destructively.
- **Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Exact-`main` isolated baseline, exhaustive dashboard journeys, full divergent-history review, concurrency/recovery/backup/deployment drills, genuine media and rights/human review, verified SonicVhibez OAuth/history, one-shot upload authorization/receipt, and verified Nature Frontiers Page/draft workflow remain unresolved.
- Safety: public/unattended YouTube publishing and Facebook live publishing remain disabled; Safari remains inactive; only approved Selar URL is `https://selar.com/0u19v8u99l`. No upload, post, campaign activation, merge or destructive Git operation occurred.

> Older checkpoint sections below are historical unless they match the exact SHA and workflow evidence above. Do not treat their counts or "current" labels as current evidence.

---

## Latest evidence checkpoint — application-code SHA `eda0dbb7be1cfb2e71155d7478f1875739078340` (25 October 2026)

This is the latest verified application-code checkpoint; later documentation-only commits do not change source. Verify CI again on the final docs-refresh HEAD.

- Media path security: `scripts/safe-media-path.mjs` now protects the Short/long-form renderers, technical export validators, media preflight and thumbnail renderer from symlinked input files, symlinked output files and symlinked output ancestors. Thumbnail title sidecars are created exclusively with restrictive permissions.
- Regression tests: `test/safe-media-path.test.mjs`, `test/render-thumbnail.test.mjs`, plus new renderer/export-validator symlink cases. The source-contract test was updated to match the safe resolver.
- Automation/security [run 40207797361](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797361): **PASS**, 262 Node tests, 0 failures, 0 skipped; 8 Python tests; clean isolated install; npm audit 0 reported vulnerabilities.
- Dashboard browser [run 40207797321](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797321): **PASS**, 8 browser tests. Metadata [run 40207797357](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797357) and content quality [run 40207797355](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797355): **PASS**.
- Production readiness [run 40207797310](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797310): **BLOCKED as required** by missing owner/account/media/approval prerequisites. Facebook draft workflow [run 40207797368](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40207797368): **SKIPPED**, not integration evidence.
- PR #1 remains open, draft and unmerged. At the source checkpoint the branch was 1,104 commits ahead and 2 behind main, with 116 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. The full divergent history has not been independently reviewed.
- Safety retained: no upload, live post, campaign activation, merge or destructive Git operation. Public/unattended YouTube publishing and Facebook live publishing stay disabled; Safari stays inactive.
- Decision: **CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED** pending exhaustive dashboard acceptance, full history review, recovery/deployment drills, real media and rights evidence, authenticated SonicVhibez identity/history, and verified Nature Frontiers Facebook draft integration.

# OPERATIONS.md

## Historical acceptance checkpoint — superseded by the latest verified checkpoint above

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Automated checks pass on the exact code/test SHA below, but full dashboard-control acceptance, complete divergent-history review, isolated recovery drills, real-account integration and deployment acceptance remain incomplete.

### Exact Git state
- Implementation branch: `codex/marketing-machine-audit-fixes`; tested code/test SHA: `e56e3f5a328590a2b54849299a9fabc09df02f25`.
- Current PR HEAD will be a documentation-only descendant of this tested candidate; see [live PR metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- At the tested code/test candidate, comparison was **1,036 ahead, 2 behind, 110 changed files**; subsequent documentation-only commits add no application-code changes. Use the live PR metadata for the current-head comparison. The full branch-only history has not been reviewed patch by patch. PR #1 remains open, draft and unmerged. No direct `main` edit or destructive history operation was performed.

### Exact-SHA CI
- [Automation/security — run 40181771250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771250): **PASS** — 244 Node tests, 0 failed/0 skipped; 8 Python tests; locked and normal `npm ci`; Google API import; JS syntax/Python compilation; 16 queue items; `npm audit`: 0 vulnerabilities across 49 packages.
- [Browser E2E — run 40181771259](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771259): **PASS** — 7 Chromium journeys against the local dashboard/backend; not every visible control is covered.
- [Content quality — run 40181771275](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771275): **PASS**.
- [Metadata — run 40181771283](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771283): **PASS**.
- [Production readiness — run 40181771257](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771257): **BLOCKED as required: 12 mandatory blockers**; retained diagnostic [artifact 12594570724](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771257/artifacts/12594570724).
- [Facebook daily draft — run 40181771276](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40181771276): **SKIPPED** on PR event; not default-branch acceptance evidence.

### Code fixes in this candidate
- Approval artifact directory creation now uses component-by-component symlink/non-directory checks before nested writes. Four new path-safety tests cover safe creation, symlink ancestors, file ancestors and dashboard use of the guard.
- Validation-task start and result persistence now use the cross-process state lock. A durable `RUNNING` record prevents duplicate launches across two dashboard processes sharing state; the regression test exercises concurrent submissions.
- Facebook Page verification now reports success/failure in a dedicated accessible status area, so refreshing the dashboard cannot erase the operation result; the new browser regression verifies persistent blocked feedback.
- Private upload workflow now uses lockfile-enforced `npm ci --ignore-scripts` and the built-in `${{ github.token }}` for restoring the prior attempt ledger; `test/ci-lockfile.test.mjs` asserts both settings.
- Existing approval transaction rollback, atomic JSON path checks, Facebook history restoration safeguards, dashboard handler wiring, schedule/queue invariants and publishing safety tests remain covered.

### Acceptance and owner actions
- [x] Exact-SHA automation, install, dependency audit, content and metadata checks pass.
- [x] Seven browser journeys pass.
- [x] Public/unattended YouTube publishing and Facebook live publishing remain disabled.
- [ ] Full dashboard-control browser acceptance and complete branch-history review/reconciliation.
- [ ] Isolated crash, rollback, backup/restore and deployment drills with retained evidence.
- [ ] Genuine rights-cleared Short/long-form media, validated manifests/checksums and human review.
- [ ] Verified SonicVhibez OAuth/channel identity, remote-history reconciliation, one-shot authorization and verified private-upload receipt.
- [ ] Verified Nature Frontiers Page permissions and successful default-branch Facebook draft run with retained artifact.
- [ ] Production monitoring, backup, emergency stop and deployment acceptance.

No real YouTube upload, public post or live Facebook post was performed. The sole approved Selar destination remains `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive. See [the current release evidence](docs/CURRENT_RELEASE_EVIDENCE_2026-10-25.md).

## Historical checkpoints (superseded; retained for audit trail)


## Live release assessment — 24 October 2026

**Latest application-code candidate:** `df5d28560a757fb185a020982f981fb1ce6722c7` (Google API client dependency and lockfile upgrade). Exact-head checks passed on `36b9e34285a9becb3ad3305f1147b5e831d7bf16`, a documentation-only descendant containing the same application code and dependency tree.
**PR #1:** [open, draft, unmerged](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
**Branch comparison at exact test head `36b9e34285a9becb3ad3305f1147b5e831d7bf16`:** 896 commits ahead, 2 behind `main`; 94 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` HEAD `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Do not merge, reset, force-push, or rewrite divergent history without the owner's explicit decision.

### Exact-SHA evidence

- [Automation validation — run 40125752411](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752411): **PASS** on exact test head `36b9e34285a9becb3ad3305f1147b5e831d7bf16`; **206 Node tests passed, 0 failed, 0 skipped**; Python safety tests: **8 passed**; 16 queued topics passed safe-state/destination checks; campaign validation, JavaScript syntax and Python compilation passed. A clean isolated normal lifecycle-script `npm ci` passed and `googleapis` imported successfully.
- [Metadata validation — run 40125752409](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752409): **PASS** on the same exact test head.
- [Content quality — run 40125752405](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752405): **PASS** on the same exact test head.
- [Locked install/lockfile validation — run 40125748862](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125748862): **PASS** on the same exact test head; clean locked installation and configuration checks passed.
- [Production-readiness diagnostic — run 40125752527](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752527): **BLOCKED as intended** because mandatory production prerequisites remain unresolved. The `sonicvhibez-readiness-report` artifact was retained (artifact ID `12573171174`; expires 23 November 2026). This is not a readiness pass.
- [Nature Frontiers Facebook draft — run 40125752399](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40125752399): **SKIPPED** on the pull-request event. No default-branch draft or retained default-branch artifact is established by this run.

### Implemented in this audit

- The read-only readiness CLI exits with status 2 when mandatory gates are blocked and prints the complete blocker report; it exits 0 only when checks find no blockers.
- The dashboard readiness parser accepts the explicit blocked status and preserves actionable blockers rather than collapsing them into a generic validator error.
- The production-readiness workflow uses Node.js 24, runs for relevant pull-request paths, retains its diagnostic artifact, and fails the readiness gate while production prerequisites remain blocked.
- Pull-request validation workflows check out the exact pull-request head SHA rather than GitHub's synthetic merge ref. The automation workflow also verifies a normal lifecycle-script install in a clean temporary checkout with no credentials in its environment.
- Publication minimum spacing is configuration-driven across schedule validation, readiness checks, dashboard checks and the pre-upload history gate. The default remains 72 hours. The configured value must be finite, positive and at most 8,760 hours; cycle duration must equal the configured gap multiplied by the three-item cycle, and schedule, queue and spacing policy must agree. A regression test confirms a consistent 96-hour configuration is accepted.
- Upgraded `googleapis` from `^144.0.0` to `^188.0.0`; the lockfile now resolves `googleapis 188.0.0`, `gaxios 8.3.2` and `googleapis-common 9.3.1`. Exact-head npm audit reports **0 vulnerabilities** across all severities. The four previously reported moderate advisories are resolved in the audited lockfile; live OAuth/API account acceptance remains unverified.
- Publication cadence remains a rolling `long_form → long_form → short` cycle; the default 72-hour gap means at least 216 hours across three cyclic gaps. Tuesday/Saturday triggers are draft preparation only; no three-posts-per-week promise is made.

### Branch-divergence reconciliation

The live comparison is 896 ahead / 2 behind at the exact test head, with merge base `45352b73bb6cc4787b2a49988b575afb754ab627`. The two base-only commits are file-only test churn: `71578dafc24e5d48173dce3f4e392e18e42aa40e` added `test/restore-facebook-draft-history.test.mjs` (117 lines), and `fa00d28e7f58911482686e4ad69fac9f4701a2e6` removed that same test file. They do not change runtime code. The implementation branch lacks this dedicated test file; owner review should decide whether to reintroduce its cross-run history-restoration coverage as a separately reviewed test. No merge, reset, force-push or history rewrite was performed.

### Historical acceptance register — superseded by latest verified checkpoint

| Gate | Status | Evidence / next action |
|---|---|---|
| Node.js automated tests | PASS | 206 passed, 0 failed, 0 skipped on exact test head. |
| Python safety tests | PASS | 8 passed on exact test head. |
| Campaign, queue, schedule, syntax and compilation checks | PASS | Exact-head automation workflow above. |
| Normal lifecycle-script installation | PASS | Isolated clean checkout, no credentials, normal `npm ci`, and `googleapis` import passed. |
| Dependency audit | PASS | `npm audit`: 0 info, 0 low, 0 moderate, 0 high, 0 critical; total 0. |
| Configurable publication spacing | PASS | Default 72 hours; schedule, queue, dashboard, readiness and upload history gate use the validated configured value. |
| Readiness reporting fails closed | PASS | CLI returns status 2 with actionable blockers; dashboard returns HTTP 503 while mandatory production prerequisites are missing. |
| Clean-start dashboard/browser acceptance | NOT RUN | Exercise every visible control, authentication failure, API persistence, restart and error paths using the real app. |
| Real Short and long-form production media | OWNER ACTION REQUIRED | Supply genuine assets, completed manifests, rights evidence, checksums, full renders, full-file decode reports and human playback review bound to final hashes. |
| YouTube OAuth and channel identity | OWNER ACTION REQUIRED | Configure secrets securely, verify authenticated channel is SonicVhibez, retrieve complete public/private/unlisted history and reconcile uncertain attempts. |
| Private upload | OWNER ACTION REQUIRED | No live upload attempted. Require one-operation authorization, durable pre-insert ledger, private-only request and remotely verified private receipt. |
| Facebook integration | OWNER ACTION REQUIRED | Verify Nature Frontiers Page identity, token scopes and default-branch draft/artifact retention; live publishing remains disabled. |
| Backup/restore/restart drill | OWNER ACTION REQUIRED | Perform isolated restore and interruption/restart/concurrency tests; retain logs and checksums. |
| Branch divergence/test-file incident | OWNER ACTION REQUIRED | Review whether to restore the dedicated test coverage; no history rewrite or merge performed. |
| Production acceptance | BLOCKED | Mandatory media, identity, integration, recovery and owner-approval gates remain open. |

**Safety defaults:** public and unattended YouTube publishing remain disabled; a private upload requires explicit operation-specific authorization; Facebook live publishing remains disabled with dry-run and emergency-stop safeguards; the only approved Selar destination is `https://selar.com/0u19v8u99l`; Safari affiliate campaigns remain inactive.

**Verdict:** automated code checks and dependency audit pass on the stated exact test head; **CODE-LEVEL ACCEPTANCE REMAINS BLOCKED** pending remaining runtime verification. **PRODUCTION ACCEPTANCE IS BLOCKED.**

---

## Historical checkpoint material

## Cross-run Facebook draft history — new

The scheduled/manual default-branch workflow runs `scripts/restore-facebook-draft-history.mjs` before generating a new draft. It reads only artifacts named `nature-frontiers-facebook-draft-*` from the previous 14 days using the workflow token with `actions: read`; it does not need write permission. The restore step validates each artifact's identity, destination, timezone, 08:00/18:00 assignment and draft-only flags. Missing permissions, API failures, unexpected archive paths, malformed packages or conflicting packages for the same date stop the job rather than silently resetting history.

This history is **bounded to the artifact-retention window**, not a permanent editorial database. If the history step fails, inspect the run and artifacts before manually rerunning; do not bypass the guard or manufacture history. Re-running the same local date reuses the exact retained package; conflicting same-date packages stop the job for operator reconciliation. Artifact downloads are bounded and archive paths are not extracted to disk. Mocked integration tests cover these failure paths, but they do not replace the first real default-branch restoration check. The PR-branch workflow is intentionally skipped, so the first default-branch scheduled/manual run after authorized release must verify real artifact restoration and deduplication. Drafts remain research-required, with `publishReady=false` and `publishingEnabled=false`; this step never publishes to Facebook.

# Operations Runbook

## Facebook daily workflow — draft-only

The Nature Frontiers Facebook Page is a separate destination from SonicVhibez YouTube. The application includes a gated Meta Graph API adapter, but publishing defaults are disabled and no real Page operation has been tested.

1. Verify the exact Facebook Page in Meta's own settings and record the numeric Page ID; do not rely on the Page display name.
2. Put the same exact numeric Page ID in `config/facebook-publishing.json` and `NATURE_FRONTIERS_FACEBOOK_PAGE_ID`. Configure `META_USER_ACCESS_TOKEN` and `META_PAGE_ACCESS_TOKEN` only in the secure environment. Never paste or commit tokens.
3. Start the dashboard locally. Use the read-only “Verify Page identity” control (or authenticated `POST /api/facebook/verify-page`) to check granted `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, the Page `CREATE_CONTENT`/`MANAGE` task, exact Page ID and matching Page token. Then inspect `GET /api/facebook/state`. The dashboard can suggest a research-first topic; it intentionally supplies a placeholder rather than inventing a factual claim.
4. Create a draft through `POST /api/facebook/drafts` with a unique ID, specific topic, supported content pillar, caption, future local date, numeric destination Page ID, structured claim sources, and media/license evidence paths and SHA-256 checksums.
5. Recheck with `POST /api/facebook/drafts/evaluate`. The checker blocks missing/wrong Page identity, missing media/license evidence, checksum mismatches, unsupported source records, missing required disclosures, engagement bait and near-duplicate content. Some uncertain or sensitive cases are flagged for human review.
6. Approval through `POST /api/facebook/drafts/approve` is allowed only when the current deterministic evaluation passes. Material changes invalidate the recorded approval fingerprint.
7. The schedule uses `Africa/Johannesburg`, initially testing 08:00 versus 18:00. This is a hypothesis, not a claimed best time. The current experiment requires at least 14 eligible observations in each arm before recommending further comparison; no Page Insights are currently present.
8. Keep `config.publishingEnabled=false`, `config.dryRun=true`, and `FACEBOOK_PUBLISH_ENABLED=NO` unless the owner explicitly approves enabling the integration after all checks. The publish endpoint returns HTTP 409 with these defaults. When gates are enabled, each scheduled post still requires explicit per-operation confirmation, durable attempt logging, remote refetch and receipt persistence. No live test has been performed.

Never store Meta tokens in source control, browser state, API responses or audit events. No real Facebook post has been created by these tests. See [the Facebook pipeline audit](docs/FACEBOOK_PIPELINE_AUDIT_2026-10-24.md).

## 1. Safe startup

Use Node.js 22+ (CI runs Node.js 24) and run `npm ci --ignore-scripts` (the supported, CI-verified install path). Set `DASHBOARD_OPERATOR_TOKEN` to a random value at least 24 characters long and `DASHBOARD_OPERATOR_ID` to the actual authorized operator. Start with `npm run dashboard`; it binds to loopback (`127.0.0.1) by default. Keep it local. A non-loopback deployment requires a securely authenticated reverse proxy, TLS, network controls and reviewed operational configuration; do not expose the bare server.

Check:
- `GET /healthz` — process health
- `GET /readyz` — readiness and external prerequisites
- dashboard API — requires the operator token in `x-operator-token`

The `/readyz` endpoint is a **production-readiness gate**, not just a process-health check. It executes the read-only production preflight and returns HTTP 503 with a `blockers` array while required manifests, source assets, rights/compliance checks, reviewed metadata, the Short MP4, or YouTube environment configuration are missing or invalid. Use `/healthz` to distinguish a running local server from production readiness. A clear readiness response does not independently prove that a license is genuine or that editorial review occurred.

For a structured terminal report, run `npm run readiness:json`. It emits JSON only, with deterministic `RDY-…` blocker identifiers, severity, the observed readiness finding, and a suggested resolution. Exit code `2` means prerequisites remain blocked; exit code `0` means the configured checks found no blockers, not that account identity, licence authenticity, media quality, or human review was independently proven. This command is read-only and never uploads or publishes.

Never put OAuth tokens in browser code, committed files or logs.

Dashboard startup also requires `DASHBOARD_OPERATOR_ID` (2–120 characters). Audit events use this configured operator identity; use the actual person responsible for the session rather than a generic label. The private uploader validates the approval's structured rights-evidence hash and rechecks each source asset and retained licence-evidence file against the saved SHA-256 values immediately before the remote upload flow.

## 2. Backup and restore

Create a secret-excluding checksummed snapshot of dashboard state, audit history, upload attempts, receipts, upload approvals and retained rights evidence:

```sh
npm run backup:state -- backups/sonicvhibez-backup.json
```

Review the backup file and keep it in a protected location. It excludes OAuth credentials and generated video files. Restore into an empty or reconciled environment with explicit confirmation:

```sh
RESTORE_CONFIRM=YES npm run restore:state -- backups/sonicvhibez-backup.json
```

If the existing dashboard state differs, restore requires `RESTORE_OVERWRITE=YES` and refuses to replace state modified after the backup. A different existing upload ledger is always a hard stop: reconcile remote YouTube state first and do not overwrite that ledger. Receipt, approval and rights-evidence conflicts are also refused. The restore preflights every entry and checksum before writing any files.

## Daily Facebook draft generation

Run `npm run facebook:draft:daily` to create today's research-only draft package using the `Africa/Johannesburg` calendar date. The default output is `run-logs/facebook-daily-drafts/YYYY-MM-DD.json`. The generator preserves an existing same-day artifact, checks local editorial state when present, and never fills missing claims, media, licence evidence or Page identity with invented data. Every output remains `publishReady=false` and `publishingEnabled=false`.

The [GitHub Actions daily-draft workflow](.github/workflows/facebook-daily-draft.yml) is configured for 07:30 SAST and stores its output artifact for 14 days. The verified run created [artifact 12558699856](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856). Scheduled workflows execute only from the repository's default branch; while PR #1 remains draft, this is not an active production schedule. The workflow creates a draft artifact only and does not call Meta or publish. Research, media/licensing evidence, current Page identity/permissions, compliance recheck and human approval remain required.

## Historical validation evidence — see latest verified checkpoint

The latest verified code/test checkpoint is `1155263c25e85f901b9245fd4e024898a1af6f19`. All three validation workflows and the daily-draft workflow passed on that exact commit:
- [Automation validation — run 40091734573](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734573)
- [Metadata validation — run 40091734584](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734584)
- [Content quality — run 40091734600](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734600)
- [Daily Facebook draft workflow — run 40091734576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576)

Each reports 139 Node tests passed, 0 failed, 0 skipped. Automation also passed 8 Python safety tests, JavaScript syntax checks and Python compilation. CI used `npm ci --ignore-scripts` (46 packages added, 47 audited). npm audit reports 4 moderate, 0 high, 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`. Plain `npm ci` remains unverified.

The actual daily workflow output detected that its assigned 08:00 SAST slot had passed and returned `MISSED_SLOT_REVIEW_REQUIRED`; it did not backdate, batch-publish, or claim success. The retained draft artifact is [here](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856). Scheduled events execute only on the default branch, so the daily schedule is not active in production while PR #1 remains draft.

Approval fingerprints now bind claims/source/licensing provenance and disclosure, and keyed Meta credential fingerprints invalidate stale permission attestations after credential rotation. These automated tests do not prove real Page identity, Insights, licence authenticity or publishing. Public YouTube publishing remains disabled; PR #1 remains open, draft and unmerged.


## 3. Schedule and queue

`config/weekly-content-plan.json` is authoritative:
- Tuesday at 17:00 Africa/Johannesburg: 6–10 minute 16:9 long-form draft.
- Saturday at 17:00 Africa/Johannesburg: 50–60 second 9:16 Short draft.

The Tuesday/Saturday cron slots are draft-preparation triggers only. The publication policy is a rolling `long_form → long_form → short` cycle with at least 72 elapsed hours between consecutive actual publications (216 hours minimum for three cyclic gaps); it makes no weekly-count promise. The upload path now retrieves the authenticated channel's uploads playlist, compares all returned remote IDs/timestamps/visibility against a complete owner-reviewed reconciliation file, and blocks unresolved upload attempts. This live history check still needs real owner credentials and a completed reconciliation record. Public publishing remains disabled.
- Scheduled GitHub workflows run at 15:00 UTC and must remain draft-only.

Queue backlog items are separate from reserved dated production slots. Duplicate/conflicting reservations are rejected. Do not manually edit the JSON state while the dashboard is running.

## 4. Rendering and media checks

Use `content/render-manifest.example.json` and `content/long-form-render-manifest.example.json` only as schema examples. Copy to the expected manifest paths and fill with real footage, narration, captions and actual license-evidence references. Evidence references must point to retained, non-empty documents; a filename or checkbox alone does not establish that rights are genuine.

Run `npm run render:short` or `npm run render:long`; both renderers now run the appropriate standalone technical export validator before reporting success. Then run `npm run preflight:media -- media/next-short.mp4 content/next-short.json` for the separate Short metadata gate and inspect outputs with `ffprobe`/playback. The dashboard additionally verifies checksums, audio stream, duration, orientation and the generated 1280×720 thumbnail. Review the media by playback; a technically valid MP4 is not automatically editorially complete.

Do not represent test fixtures, typography-only slides or missing/placeholder footage as a wildlife documentary. If inputs or tools are missing, leave the job BLOCKED.

## 5. Human review and private approval

Configure the real operator identity before enabling rights review. Use the dashboard to validate captions/metadata, verify each source asset against its original rights evidence, and review the exact MP4 and thumbnail. Approval is bound to the MP4 checksum, related artifact checksums, metadata version and rights-evidence hash.

An approval file is written under `run-logs/upload-approvals/`. The file is not a substitute for genuine rights documents or actual human inspection. If media, thumbnail, metadata or rights evidence changes, do not reuse the approval; rerun validation and review.

## 6. Private-only YouTube upload

Never upload until all checks are complete. Set secrets securely:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`
- `SONICVHIBEZ_CHANNEL_ID` (must be independently confirmed via authenticated YouTube API)
- `CONFIRM_PRIVATE_UPLOAD=YES`
- `PRIVATE_UPLOAD_AUTHORIZATION_PATH` — a separate one-shot authorization record bound to the exact job ID, final video hash, metadata hash, approval hash and independently verified channel ID
- `JOB_ID`, `UPLOAD_APPROVAL_PATH`, `METADATA_PATH`, `VIDEO_PATH`

The uploader verifies that the authenticated channel title is exactly SonicVhibez and its ID matches the configured ID. A live insert additionally requires `PRIVATE_UPLOAD_AUTHORIZATION_PATH` containing `decision: AUTHORIZE_ONE_PRIVATE_UPLOAD`, a unique `authorizationId`, the exact `jobId`, `artifactSha256`, `metadataSha256`, `approvalSha256`, verified `channelId`, `visibility: private`, `publishingEnabled: false`, operator identity and a timestamp no older than 24 hours. The authorization ID is persisted in the pre-insert attempt ledger and cannot be reused. The uploader writes the attempt ledger before remote insert, uses only `privacyStatus: private`, re-fetches the remote video and verifies private visibility and channel ownership. No public or unlisted fallback exists.

## 7. Uncertain upload outcomes and recovery

Attempt ledger: `run-logs/upload-attempts.json`. Receipts: `run-logs/upload-<video-id>.json`. The uploader also uses `run-logs/upload-operation.lock` to serialize concurrent processes. A crash can leave a stale lock; the system intentionally fails closed and requires an operator to reconcile the ledger and lock before clearing it. Never automatically remove a stale lock or reuse a consumed authorization.

- If an attempt is marked `RECOVERY_REQUIRED`, do not run a new upload attempt for that job/artifact.
- If the ledger contains a remote video ID, use the reconciliation-only mode (`RECONCILE_ONLY=YES) to fetch that exact remote video, verify the channel and private status, and rebuild the local receipt.
- If no remote video ID was persisted, reconcile manually in YouTube Studio/API using the authorized account before retrying. Never guess an ID or blindly repeat the insert.
- A receipt-write failure is not success. Only the remote verification plus durable receipt can establish `PRIVATE_UPLOAD_VERIFIED`.

For GitHub Actions upload workflows, preserve the prior `sonicvhibez-upload-ledger` artifact and supply its run ID on the next manual dispatch. Use `NONE` only for a first-ever attempt. These workflows require explicit manual confirmation and secrets; they do not run on a schedule.

## 7. Backup and restore

Stop the dashboard before backup. Copy:
- the directory specified by `DASHBOARD_STATE_DIR` (or repository `state/), including `dashboard-state.json`;
- `run-logs/upload-attempts.json`;
- `run-logs/upload-approvals/` and upload receipt JSON files;
- original rights/license evidence and source asset register.

Keep backup copies private and access-controlled. To restore, stop the dashboard, preserve the current directory as a dated backup, restore the state/log/evidence files to their original paths, verify file permissions and checksums, then start the dashboard and inspect `/healthz`, `/readyz`, job states and upload ledger. Never restore an old ledger over a newer one without reconciling external uploads first.

## 8. Failed workflow recovery

Open the failed GitHub Actions run and inspect its summary/logs. Fix the root cause before rerunning. A green historical workflow does not validate a newer commit. Scheduled workflows only validate configuration and create draft work; do not add public publishing or automatic visibility changes.

## 9. Cost, campaign and channel constraints

- No paid services or upgrades are introduced by this workflow.
- Selar must remain exactly `https://selar.com/0u19v8u99l`.
- Safari stays inactive until its exact HTTPS destination and disclosure are supplied, previewed and explicitly approved by the owner.
- Nature Frontiers must never be selected as a target.
- Public publishing remains disabled.


## Rolling publication and history gate

The authoritative cycle is `long_form → long_form → short`; each next actual publication must be at least 72 elapsed hours after the previous actual publication. The cycle's three gaps total at least 216 hours. Workflow cron slots are draft-preparation only. The production upload command fails closed unless authenticated channel history is retrieved, every public/private/unlisted video is covered by `CHANNEL_HISTORY_RECONCILIATION_PATH`, all IDs/timestamps/visibility match the remote API, the next format is correct, the gap is valid, and the upload-attempt ledger has no unresolved attempts. The reconciliation file is owner-reviewed evidence, not a substitute for the API comparison.


## Autonomous Nature Frontiers Facebook publisher — current implementation

The autonomous publisher is separate from the draft-only Facebook workflow and SonicVhibez YouTube uploader. See [the secure runner setup guide](docs/FACEBOOK_AUTONOMOUS_RUNNER_SETUP.md).

- Scheduled workflow: `.github/workflows/facebook-autonomous-publisher.yml`, 07:30 Africa/Johannesburg, default branch only, persistent self-hosted runner labelled `facebook-publisher`.
- Intake: `npm run facebook:intake:autonomous`. It accepts only evidence-bearing candidate records, runs the final-payload policy engine, queues eligible candidates and records blocked reasons in the durable state directory. It does not invent evidence, media, rights or captions.
- Publisher: `npm run facebook:publish:autonomous`. It requires an absolute durable `FACEBOOK_STATE_DIR`, exact matching Page ID in config/runtime, both Meta tokens, `FACEBOOK_PUBLISH_ENABLED=YES`, `publishingEnabled=true`, `dryRun=false`, and `emergencyStop=false`. Defaults remain disabled.
- Dashboard: authenticated `GET /api/facebook/autonomous-status` displays current configuration readiness, queue size, intake summary, recent run summary, blocked posts, uncertain attempts and the last verified receipt. It does not expose tokens or claim that the runner itself is healthy.
- Routine path: the autonomous workflow does not require per-post approval. The visible dashboard no longer includes per-post review or manual publish forms for routine operation. The older separately gated API endpoints remain for compatibility and are not called by the autonomous schedule.

### Recovery behavior

Before selecting new work, the publisher examines durable attempts in `PUBLISHING` or `UNCERTAIN` state. It uses the official Page `scheduled_posts` and `feed` edges with bounded pagination, exact caption and time matching, and no mutation retry. A unique verified match is persisted as a receipt. No match does not prove non-publication; unresolved or ambiguous outcomes stay blocked and are retried only as read-only reconciliation on a later run. The original attempt and history are never deleted to enable retry.

The checked-in `content/facebook-intake-candidates.json` and `content/facebook-autonomous-queue.json` are intentionally empty. Until a genuine content-intake record contains source evidence and excerpt, final caption, actual media checksum, licence evidence and the configured destination/schedule, the correct outcome is no post.

### Release limitations

Mock tests do not establish the real Page ID, token validity, permissions, runner isolation, durable volume, licence authenticity or successful remote publication. The self-hosted workflow is not active from the default branch until the PR is accepted through the repository's normal review process. Do not enable live flags until the exact candidate SHA has green CI and a controlled, separately authorized Meta integration test has a remotely verified receipt.


## Historical release evidence snapshot — 24 October 2026 (superseded)

Current tested code candidate: `9dd102f9636a5ba71c797cf79c104d3616cbe14e`. Exact-SHA automation validation [40122567804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567804) passed with advisories: 205 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; 16 queue topics validated; JavaScript syntax and Python compilation passed. Metadata [40122567802](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567802), content quality [40122567799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567799), and locked installation [40122564222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122564222) passed. Daily Facebook draft [40122567717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567717) was **SKIPPED** on the PR event and does not prove a default-branch artifact. The restore code now rejects symlinked destination paths before writing, with regression tests in `test/backup-restore.test.mjs`. Four moderate dependency advisories remain. This snapshot is historical for the tested code candidate; see [the current release register](GO_LIVE_BLOCKERS.md) for owner actions and production blockers. This docs-only update is not represented by the run links above; its exact-head CI is recorded in PR #1 after completion. Verdict: **CODE-LEVEL ACCEPTANCE BLOCKED; PRODUCTION ACCEPTANCE BLOCKED**.


## Browser end-to-end acceptance

The repository includes a Playwright Chromium workflow that starts the actual local dashboard and backend with an isolated temporary state directory and test-only operator token. It does not call YouTube or Meta APIs, upload media, or publish posts.

Run locally with Node.js 24 (Node.js 22+ is declared by the package):

```sh
npm ci
npx playwright install --with-deps chromium
npm run test:browser
```

The browser test verifies unauthenticated API rejection, authenticated dashboard connection, schedule/rolling-cycle display from the backend, creation and persistence of a real local draft/job, duplicate-ID rejection, fail-closed readiness, and mobile-width horizontal overflow. This automated browser journey is separate from owner-controlled live integration, rights review, private-upload authorization, Facebook Page verification, and backup/restore drills.


## Approval-artifact rollback regression checkpoint — 25 October 2026

**Code/test candidate:** `85f4ececcdedc576c66dccf6103180fe0f2e9c72` (this documentation update is a later documentation-only descendant).

### Defect fixed and regression evidence
- Found a transaction edge case in `scripts/approval-artifact-transaction.mjs`: if the exclusive hard-link publication succeeded but removing its temporary hard link failed, the function threw while leaving the final approval artifact visible. That could make an operation appear failed while an uploadable-looking approval remained.
- The transaction now removes the final path it exclusively created when any later publication step fails, then cleans up the temporary path. If rollback itself fails, it reports that failure explicitly rather than hiding it.
- Added regression coverage in `test/approval-artifact-transaction.test.mjs` for injected temporary-link cleanup failure. The final approval path and temporary file must both be absent after the failed operation.
- Isolated local execution of the four approval transaction tests: **4 passed, 0 failed, 0 skipped**. This is focused local evidence, not a substitute for the full application suite.
- Exact candidate CI: [automation/security run 40168535857](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535857) **PASS** — 224 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; normal clean `npm ci`, Google API import, syntax/compile/campaign/queue checks passed; `npm audit` reported 0 vulnerabilities. [Browser E2E run 40168535886](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535886) **PASS** — 3 Chromium tests against the real local dashboard/backend. [Metadata run 40168535856](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535856) and [content quality run 40168535873](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535873) **PASS**.
- [Production readiness run 40168535859](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535859) **BLOCKED as intended**; its diagnostic artifact [12589466617](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535859/artifacts/12589466617) is retained through 24 November 2026. The workflow fails because mandatory production gates remain unresolved; that is not a code-test failure and not a release pass. [Facebook draft run 40168535861](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40168535861) was **SKIPPED** on the PR event and is not default-branch acceptance evidence.
- Git comparison at this code/test checkpoint: **957 commits ahead, 2 behind**, 105 changed files; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main` remains `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. PR #1 remains open, draft and unmerged. No merge, rebase, reset, force-push, cherry-pick or history rewrite was performed.

### Acceptance decision
The approval transaction defect is fixed and covered, and the exact candidate's automation, browser, metadata and content-quality checks pass. **The overall project remains IMPLEMENTATION INCOMPLETE; production acceptance is BLOCKED.** Genuine rights-cleared Short and long-form media and completed manifests, final-hash-bound human approval, verified SonicVhibez OAuth/channel identity and complete remote-history reconciliation, explicit authorization for one private upload and verified remote receipt, verified Nature Frontiers Page access and a successful default-branch Facebook draft artifact, isolated backup/restore/interruption/concurrency/rollback drills, full divergent-history review and production deployment verification remain unresolved. Public/unattended YouTube publishing and Facebook live publishing remain disabled; only approved Selar URL is `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive. No real YouTube upload or Facebook post was performed.


## Historical implementation checkpoint — 25 October 2026 (superseded by latest verified checkpoint)

**Exact tested application-code SHA:** `6b05beb4461ddf3065f05b56742a306fa4433ec2`. This checkpoint was tested by GitHub Actions on the exact SHA. Documentation-only descendants, if any, do not change the application code; do not describe this as CI for a later source change.

### Newly implemented fix
The dashboard previously wrote state to a temporary file and renamed it without explicitly flushing the file contents or parent-directory entry. The approval flow relies on state persistence completing before an uploadable approval artifact is exposed, so a successful rename alone was insufficient evidence of durable persistence across a crash/power loss.

- Added `scripts/atomic-json-file.mjs` with exclusive temporary-file creation, restrictive permissions, file `fsync`, atomic rename, parent-directory `fsync`, and cleanup of pre-rename temporary files on failure.
- Updated `scripts/dashboard-server.mjs` so all durable dashboard-state writes use this helper.
- Added `test/atomic-json-file.test.mjs`: complete JSON and mode check; simulated temporary-write failure preserves old state and removes the temp file; simulated rename failure preserves old state and removes staged file; symlink destination is rejected without following it.
- The existing approval-artifact transaction remains ordered so durable state persistence occurs before final approval artifact publication. If state persistence fails, no final approval artifact is exposed.

### Exact-SHA CI evidence
- [Automation/security run 40169467609](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467609) **PASS**: 228 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; clean locked install and isolated normal lifecycle-script `npm ci` passed; campaign/destination, review-metadata, queue, JavaScript syntax and Python compilation checks passed; `npm audit` reported 0 info, 0 low, 0 moderate, 0 high and 0 critical advisories.
- [Browser E2E run 40169467597](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467597) **PASS**: 3 Chromium tests against the real local dashboard/backend, including authenticated draft persistence and duplicate rejection, campaign safeguards, blocked readiness/mobile overflow, and a separate real local server restart persistence test.
- [Metadata run 40169467568](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467568) **PASS**.
- [Content-quality run 40169467601](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467601) **PASS**.
- [Lockfile validation run 40169463693](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169463693) **PASS**.
- [Production readiness run 40169467574](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467574) **BLOCKED as required**; its failure is the expected fail-closed result while mandatory production gates are unresolved, not a successful release gate.
- [Nature Frontiers Facebook draft run 40169467625](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40169467625) **SKIPPED** on the pull-request event; it is not default-branch draft acceptance evidence.

### Baseline and acceptance limitations
The pre-change baseline was not re-executed against the immediately preceding branch SHA before this patch. The last reported historical comparison was 224 Node tests / 8 Python tests on a different code candidate; it is not presented as a same-SHA baseline. Current exact-SHA evidence is 228 Node / 8 Python tests.

Current branch SHA at the code checkpoint: `6b05beb4461ddf3065f05b56742a306fa4433ec2`. `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`. Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`. Live comparison: **967 commits ahead, 2 behind, 107 changed files**. PR #1 remains open, draft and unmerged. No merge, rebase, reset, force-push, cherry-pick or history rewrite was performed. The complete divergent patch history has not been reviewed line by line, so branch reconciliation is not accepted.

### Remaining release gates
**Code acceptance is PARTIALLY VERIFIED, not fully accepted. Production acceptance is BLOCKED.** The current test suite and three browser tests do not establish every visible control/API route or all recovery drills. Genuine rights-cleared Short and long-form media, final manifests and validation reports, human playback and hash-bound approval, verified SonicVhibez OAuth/channel identity and complete remote-history reconciliation, explicit authorization for one private upload and verified remote receipt, verified Nature Frontiers Page access and successful default-branch Facebook draft artifact, isolated backup/restore/interruption/concurrency/rollback drills, complete branch-history review and actual deployment/monitoring verification remain outstanding. No real YouTube upload or Facebook post was performed. Public/unattended YouTube publishing and Facebook live publishing remain disabled. Only approved Selar destination: `https://selar.com/0u19v8u99l`; Safari campaigns remain inactive.


## Content-quality evidence required before rendering

Render manifests must include `qualityEvidencePath`. Before invoking FFmpeg, the Short and long-form renderers run `scripts/validate-content-quality.mjs` and fail closed if the evidence is absent, invalid, stale, or bound to different source bytes. The evidence file is resolved safely without symlinks and must include:

- Structured script, measured word count/sections, source-backed material claims, and recorded similarity review.
- Provenance records for source assets, including original SHA-256, permitted use, commercial permission and a human verifier.
- Scene list and a recorded non-negative render seed; the reproducible edit-plan hash must match.
- Audio profile, measured loudness/true-peak/ducking/fade data, narration SHA-256 and human-verified transcript match.
- Human editorial review record with reviewer and timestamp.
- For a Short, the exact parent content ID, weekly cycle, approved parent revision/hash, SonicVhibez channel, verified remote parent video ID and canonical URL.

This is a technical evidence gate, not a claim that a licence is genuine or the footage looks realistic. A human must review the complete export for factual accuracy, scene continuity, animal anatomy/behavior, synthetic-media disclosure, captions and narration synchronization.

### YouTube Short Related video verification

Keep three states distinct: (1) internal parent relationship, (2) canonical parent URL used in description/metadata, and (3) YouTube Studio's native Related video association. The current repository gate can validate (1) and (2); it does not configure or independently observe (3). After the Short exists in Studio, an authorized operator must select the intended verified parent under the Short's Related video setting and record a dated verification artifact with the Short ID, parent video ID and reviewer. Until that artifact is checked and `youtubeRelatedVideoStatus` is `VERIFIED`, the Short is not cleared for publication. Do not automate unsupported Studio actions or infer success from a description link.


### Script prompt workflow

Build a source-constrained authoring prompt with `npm run prompt:script -- long_form <brief.json>` or `npm run prompt:script -- short <brief.json>`. The brief must contain the topic, audience, editorial purpose and HTTPS research sources; Short briefs must also identify the explicit SonicVhibez long-form parent and weekly cycle. The builder does not call an external model. Use it in the approved authoring process, then measure and validate the returned script with the content-quality gate before generating narration. The current text-to-speech workflow consumes authored scripts; automatic LLM authoring is not claimed unless separately integrated and tested.


### Render behavior and audio quality

The renderers intentionally do not loop a single source clip to manufacture the required duration. Provide footage long enough for the complete narration or rendering will fail the strict duration gate. The evidence manifest's fixed seed and allowed framing choices determine a reproducible fit/crop and subtle colour-grade adjustment; this is editorial variation, not an originality test. The selected audio profile applies filtering, compression, loudness normalization and fades. After the normal export validator, `validate-rendered-audio.mjs` measures the actual output audio stream and enforces integrated loudness and true-peak tolerance. If audio measurement is absent or fails, the render cannot report success. Human listening for intelligibility, pronunciation, distortion and scene synchronization remains mandatory.


**Important visibility constraint:** YouTube's [official Shorts Related video help](https://support.google.com/youtube/answer/14075157?hl=en-GB) states the selected target must be **public or unlisted** and the channel needs advanced feature access. Therefore a private parent cannot be selected as the native Related video target. Because this project keeps public/unattended publishing disabled and uses private-only upload, the native association remains blocked until the owner explicitly authorizes a compliant public/unlisted visibility change for the parent (or chooses to leave the native feature unconfigured). Never change visibility to satisfy a test. The relationship gate now rejects native-Related-video verification when the parent visibility is private or unknown.


## Latest live checkpoint — 26 October 2026

Tested application/test SHA: `a912d3c724195fb1f3ca823d186cddf8b9b4f984`. Exact-SHA CI: automation/security **PASS** (306 Node tests, 0 failures/skips; 8 Python tests; npm audit 0 vulnerabilities; clean install/syntax checks) [run 40302828218](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828218); content quality **PASS** [40302828279](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828279); metadata **PASS** [40302828303](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828303); dashboard E2E **PASS** [10 tests, run 40302828398](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828398); isolated main/candidate baseline **PASS** [40302828254](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828254). Production readiness **BLOCKED** [40302828489](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828489); Facebook daily draft **SKIPPED** [40302828351](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828351).

Change: [`3dbccd1`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/3dbccd19584cb9da81e646cb9c34a65184fcd47b) hardens script research input validation; [`a912d3c`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/a912d3c724195fb1f3ca823d186cddf8b9b4f984) adds regression tests proving malformed, insecure, placeholder and duplicate research records are rejected before provider access. Current PR HEAD after evidence-document updates is later than the tested SHA; those updates are documentation-only.

Current Git snapshot before these documentation updates: PR HEAD `a912d3c724195fb1f3ca823d186cddf8b9b4f984`, `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 1,322 ahead / 2 behind, 141 changed files. PR remains open/draft/unmerged. Full branch-only history review remains incomplete. Verdict remains **CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED**: authoring is not lifecycle/dashboard integrated; renderer still does not compose a genuine multi-scene storyboard; no production media/rights/human playback evidence; YouTube/Meta identity and history are unverified; cadence decision and exhaustive recovery/deployment gates remain open. No external upload, post, campaign activation, merge, or destructive Git operation occurred.

## Release checkpoint supplement — 27 October 2026

The exact source/test checkpoint is `28d326c474d2c4871f6e9f2f55f050dac9fe14bd`; current evidence is in [docs/CURRENT_RELEASE_EVIDENCE_2026-10-27.md](docs/CURRENT_RELEASE_EVIDENCE_2026-10-27.md). Provenance lineage validation now rejects duplicate IDs, missing ancestors, self-links, malformed derivative lists and cycles, with unit and integrated tests. Exact-SHA automation/security, browser E2E, metadata and content-quality workflows passed. Production readiness is still blocked; Facebook daily draft is skipped and is not integration evidence; the isolated baseline was pending at checkpoint time.

Do not bypass the known authored-job production guard. The current dashboard does not yet connect generated narration, captions and scene rendering end to end. Keep public/unattended YouTube publishing disabled, Facebook live publishing disabled and Safari campaigns inactive. No real upload/post or activation is permitted for testing.

---

## Authoring narration component — draft-only, not yet dashboard-integrated (27 October 2026)

A reusable component now exists at `scripts/generate-authoring-narration.py`. It is **not yet connected to `POST /api/jobs/produce`**, so do not treat it as the completed production workflow and do not remove the dashboard's fail-closed authoring guard.

For isolated manual component testing only:

1. Install `edge-tts` in a disposable Python environment (`python -m pip install edge-tts`) and ensure `ffprobe` is installed. The voice generation step requires network access to the free Edge TTS service.
2. Export the generated structured script result as JSON. It must include the full narration, matching section narration, at least three differentiated Short sections or five long-form sections, non-empty visual/pacing/sound direction, and source-backed claims.
3. Run the generator with a unique stable job ID as the output folder name, for example:

   ```sh
   python scripts/generate-authoring-narration.py --script-json path/to/script-result.json --format short --output-dir media/generated-authoring/job-UUID
   ```

   Use `--format long_form` for long-form scripts. Output must remain under `media/generated-authoring/`; symlinked media/output directories are rejected.

4. Inspect `narration.mp3`, `narration.txt`, `captions.srt` and `narration-report.json`. The report binds a canonical script hash and the audio, transcript and caption hashes. Captions must have actual TTS word-boundary timings; the generator fails closed rather than estimating missing timings.
5. This output is a narration/caption **draft only**. It does not create or approve wildlife visuals, verify source rights, validate scene alignment, render a video, produce reviewed metadata, replace human playback review, or authorize upload. Do not use these files as a production-ready manifest until the dashboard-to-render integration and all evidence gates are implemented and passed.

Required next implementation: persistently connect this narration stage to each content job, bind its output hashes to an explicitly approved storyboard and traceable source assets, render into per-job output paths, run format-specific media/audio/caption/metadata validation, and require human review bound to final artifact hashes before any separate private-upload authorization.


---

## Dashboard script review and narration draft workflow — 27 October 2026

The dashboard now supports a separate, hash-bound script review and narration draft stage. This is **not yet the complete authoring-to-render workflow**. `POST /api/jobs/produce` remains fail-closed for authoring jobs until approved visual assets, rights evidence, scene manifests, final validation and video review are integrated.

1. Generate a script through the existing authoring control. Inspect the complete structured script and its supplied research references.
2. In **Hash-bound script review**, select the draft, confirm its SHA-256, choose APPROVE or REJECT, and record review notes. Approval is bound to that exact script hash. A rejected draft must be regenerated; its approval cannot be reused.
3. For an approved script, choose the job under **Generate narration draft**. The server invokes `scripts/generate-authoring-narration.py` in a job-specific directory under `media/generated-authoring/`. It needs Python, `edge-tts`, `ffprobe`, and network access to Edge TTS. Voice and rate can be configured with `AUTHORING_TTS_VOICE` and `AUTHORING_TTS_RATE`.
4. The stage validates the script hash, transcript text and word count, measured audio duration, artifact hashes, caption structure and caption timing. It remains draft-only; rights status remains unverified and publishing remains disabled.
5. Under **Human narration playback review**, listen to the full audio, inspect the transcript and timed captions, and submit a hash-bound APPROVE or REJECT decision with review notes. Approval permits only a later render stage; it does not approve rights, source visuals, realism, the final video or publication.
6. If a previous narration attempt was interrupted, use **Reconcile interrupted narration without retrying TTS**. Reconciliation validates existing complete artifacts and their hashes; it never starts TTS or overwrites partial files. If it cannot prove completeness, the stage remains `RECOVERY_REQUIRED` for manual inspection.

The review API serves audio only to authenticated dashboard operators and checks the stored artifact hash before streaming. Do not copy or edit generated files in place after review; any content change requires a new revision and revalidation.

### Current limitation

No real narration audio or final video was produced in the CI tests. The API integration tests use synthetic fixture bytes to exercise hashing and review attestations; they are not playback or production-media evidence. The dashboard's production action still blocks authoring jobs because the approved narration has not yet been connected to a reviewed production plan, traceable visual assets, a per-job multi-scene render, final media validators and final-video human approval.


### Production-plan stage (new, draft-only)

After the exact script and narration have been approved, use **Scene-by-scene production plan** in the dashboard. Submit a schema-version-1 JSON plan bound to the exact job ID, content format and approved script SHA-256. Each scene must include a repository-relative asset path and hash, editorial purpose, narration cue, timing, provenance and a separate rights-evidence path/hash. Shorts additionally require an explicit parent binding that matches the independently persisted human-approved relationship and verified public SonicVhibez receipt.

The API checks that referenced files are regular non-symlink files and that the current bytes match the declared hashes. The plan then remains in REVIEW_REQUIRED until the reviewer inspects the persisted plan preview, source evidence and narration alignment and records a hash-bound decision. An approved result is APPROVED_PLAN_ONLY, not final media approval. Any changed script, narration artifact, scene asset or rights-evidence file blocks review.

**Important:** hashes establish integrity, not ownership or licence validity. A plan-stage decision does not prove originality, factual accuracy or realism. The renderer integration is not complete, so POST /api/jobs/produce continues to refuse authoring jobs. Do not bypass this gate or use the fixed global manifest for a generated authoring job.


### Current cadence invariant and release state — 27 October 2026

The readiness engine enforces **at least 72 elapsed hours between every pair of consecutive actual publications** in all cadence modes. Do not approve or configure a weekly target by reducing the spacing minimum. The configured long_form → long_form → short cycle requires at least 216 hours across its three cyclic gaps. Africa/Johannesburg remains the scheduling timezone; Tuesday/Saturday workflow slots are draft-preparation triggers, not publication authorization.

Current exact source/test SHA: 47c839452fda99757a34dcb29865da9e967121af. Automation/security, content-quality, metadata, browser E2E and isolated baseline checks passed on that SHA. Production readiness remains blocked. No external account mutation or publication is authorized by these test results. Keep public/unattended YouTube publishing OFF, Facebook live publishing OFF, Safari campaigns inactive and PR #1 open/draft/unmerged. See docs/CURRENT_RELEASE_EVIDENCE_2026-10-27.md for workflow links and outstanding owner-controlled gates.


## Short review operations note — 27 October 2026

A private-only Short review may proceed only through its explicitly bounded private-upload authorization and exact artifact/relationship checks. If the native YouTube Related video association cannot be verified, retain `BLOCKED_EXTERNAL` with a specific 8–500 character explanation. Never infer native association from a description URL, change privacy to bypass a restriction, or treat this state as public-release readiness. Regression coverage is in source/test SHA `77921aca418b25bca0a9aa681281145b00c6d72f`; evidence and remaining blockers are in [docs/CURRENT_RELEASE_EVIDENCE_2026-10-27.md](docs/CURRENT_RELEASE_EVIDENCE_2026-10-27.md).

Production remains blocked until genuine media and rights review, authenticated SonicVhibez identity/history, an authorized private-upload receipt, native Related-video verification or an accepted external blocker policy, real Meta draft-only integration, owner-approved feasible cadence, and operational recovery/deployment drills are evidenced. Keep public/unattended YouTube publishing, Facebook live publishing and Safari activation disabled.


---

## Current dashboard inventory and API authentication checks — 28 October 2026

On source/test candidate `1f72c6dc5b648f0c60fdea45ae1d37e835e4505e`, the dashboard inventory is reproducible:

```sh
npm run inventory:dashboard
node --test test/dashboard-inventory.test.mjs test/operator-auth.test.mjs
```

The full standard suite also includes `test/dashboard-server.test.mjs`, which checks that unauthenticated requests to each distinct inventoried `/api/*` method/path return HTTP 401. The inventory reports 105 HTML controls across 15 forms and 38 literal route branches (10 GET, 28 POST). It is a static inventory, not proof of complete behavior acceptance.

Exact-candidate automated results:
- [Automation/security](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195046): 384 Node tests passed, 0 failed, 0 skipped; 16 Python tests; npm audit 0 vulnerabilities.
- [Content quality](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195232): PASS.
- [Metadata validation](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195101): PASS.
- [Dashboard E2E](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195206): 13 Chromium journeys passed.
- [Isolated main/candidate baseline](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195202): PASS; both Node/Python baseline commands exited 0. Artifact [12776283618](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195202/artifacts/12776283618), SHA-256 `989203aab1898f8d740d4f56294e03eec8d023cb6086ce4c171ee2aff156ad2b`.
- [Production readiness](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40598195430): BLOCKED by unresolved prerequisites.

Do not interpret the passing automation and baseline workflows as production acceptance. Keep YouTube private-only and explicitly authorized, keep public/unattended publishing disabled, keep Meta live publishing disabled, and keep Safari inactive. Do not bypass readiness, rights, approval, identity, history, cadence or recovery gates.
