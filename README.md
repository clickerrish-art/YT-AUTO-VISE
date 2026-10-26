## Latest verified checkpoint — 26 October 2026, 13:45 SAST: dashboard Short-parent review UI

**Exact application/source-test SHA:** `eee84beaa7bbdfbc19ec795c0b14cecc289a9342`. This commit contains the dashboard relationship panel and its browser acceptance test; all status claims below are for this exact SHA unless explicitly described as an external prerequisite.

- **Live refs:** PR #1 head `eee84beaa7bbdfbc19ec795c0b14cecc289a9342`; main `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base `45352b73bb6cc4787b2a49988b575afb754ab627`; `main...codex/marketing-machine-audit-fixes` is **1,422 ahead / 2 behind**; PR reports 144 changed files. PR #1 remains **OPEN, DRAFT, UNMERGED**.
- **Automation/security — PASS:** [run 40316826162](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826162); 312 Node tests passed, 0 failed; 8 Python safety tests passed; npm audit reported 0 vulnerabilities; locked installation, syntax checks and Python compilation passed.
- **Dashboard browser E2E — PASS:** [run 40316826186](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826186); 11 Chromium journeys passed, including the new relationship-panel visibility and incomplete-binding rejection journey against the real local dashboard/API.
- **Content quality — PASS:** [run 40316826193](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826193). **Metadata — PASS:** [run 40316826250](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826250). **Isolated main/candidate baseline — PASS:** [run 40316826301](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826301). **Lockfile workflow — PASS:** [run 40316820572](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316820572).
- **Production readiness — BLOCKED:** [run 40316826177](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826177); this is an expected non-release result while external prerequisites and production gates remain unresolved. **Facebook daily draft — SKIPPED:** [run 40316826125](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40316826125), not integration evidence.
- **Implemented in this checkpoint:** dashboard form calls the existing authenticated `POST /api/jobs/parent-relationship`; lists Short and long-form jobs; exposes exact media path, source-segment JSON, review notes and explicit confirmation; reports relationship digest and separate native Related video status. The browser suite confirms the form exists and an incomplete request returns HTTP 400 without changing saved relationship state.
- **Acceptance limitation:** the successful relationship-binding path is still **NOT TESTED end-to-end** because it requires a genuinely approved parent, verified private-upload receipt, real hashed media/metadata artifacts and matching publication-cycle evidence. This UI test does not establish successful binding, restart/backup persistence, concurrency safety, or native Related video setup.
- **Release verdict:** **CODE ACCEPTANCE BLOCKED / PRODUCTION ACCEPTANCE BLOCKED**. Script-to-narration/captions/multi-scene rendering, real rights-cleared final exports and human playback review, exhaustive dashboard/recovery tests, authenticated YouTube history/channel verification, authorized Meta draft execution, feasible owner-approved cadence, full history review and branch-protection governance remain unresolved.
- **Safety:** public/unattended YouTube publishing remains disabled; Facebook live publishing remains disabled; Safari campaigns remain inactive; approved Selar URL remains `https://selar.com/0u19v8u99l`. No live upload/post, campaign activation, visibility change, merge, reset, rebase, force-push or destructive Git operation occurred.

---

## Historical checkpoint — 26 October 2026: explicit Short-to-parent review and upload binding

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

# SonicVhibez Marketing Machine

## Historical acceptance checkpoint — superseded by the latest verified checkpoint above

**Decision: CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED.** Automated checks pass on the exact code/test SHA below, but full dashboard-control acceptance, complete divergent-history review, isolated recovery drills, real-account integration and deployment acceptance remain incomplete.

### Exact Git state
- Implementation branch: `codex/marketing-machine-audit-fixes`; tested code/test SHA: `e56e3f5a328590a2b54849299a9fabc09df02f25`.
- Current PR HEAD will be a documentation-only descendant of this tested candidate; see [live PR metadata](https://github.com/clickerrish-art/YT-AUTO-VISE/pull/1).
- `main`: `fa00d28e7f58911482686e4ad69fac9f4701a2e6`; merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- At the tested code/test candidate, comparison was **1,036 ahead, 2 behind, 110 changed files**; subsequent documentation-only commits add no application-code changes. Use the live PR metadata for the current-head comparison. The full branch-only history has not been reviewed patch by patch. PR #1 remains open, draft and unmerged. No direct `main` edit or destructive history operation was performed.
- **Branch protection:** GitHub branch metadata reports both `main` and the implementation branch as unprotected (`protected=false`), with required status-check enforcement off. Owner action: enable branch protection and require the relevant checks before merging.

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


Free-first, local-first content operations for the SonicVhibez YouTube channel. This repository manages draft scheduling, production jobs, compliance gates, human review, campaigns and a guarded private-only upload path.

**Public publishing is disabled. Nature Frontiers is not an authorized target.** The approved Selar destination is exactly `https://selar.com/0u19v8u99l`. Safari affiliate campaigns start inactive.

## Requirements

- Node.js 22 or newer (CI runs on Node.js 24)
- npm
- FFmpeg and ffprobe with required filters/fonts for real rendering and thumbnail extraction
- Legitimately licensed footage/narration/music and retained rights evidence before any production release

## Setup

```sh
npm ci --ignore-scripts
cp .env.example .env
```

Populate secrets only in your local environment or secure secret store; never commit them. Set:
- `DASHBOARD_OPERATOR_TOKEN`: random token, at least 24 characters
- `DASHBOARD_OPERATOR_ID`: actual operator identity for review and rights verification
- Optional `DASHBOARD_STATE_DIR`: durable local state directory
- For private upload only: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, and the independently confirmed `SONICVHIBEZ_CHANNEL_ID`

The dashboard refuses to start without its operator token and binds to `127.0.0.1` by default. Do not expose it directly to the internet.

## Facebook publishing (separate from YouTube)

Nature Frontiers Facebook is a separate destination from SonicVhibez YouTube. Public YouTube publishing remains disabled; the rolling long_form → long_form → short cadence and 72-hour actual-publication spacing remain independently enforced.

The new dedicated autonomous path has no routine per-post approval or manual publish button. It runs on the default branch at 07:30 Africa/Johannesburg, prepares the 08:00 local slot, runs evidence intake, evaluates the final payload, rechecks the Meta Page connection and publishes only when every required check passes. A blocked or missed slot is recorded and skipped; it is never backdated or caught up. The workflow requires an isolated persistent self-hosted runner labelled facebook-publisher.

- `npm run facebook:intake:autonomous` — evaluate evidence-complete candidate records and queue only eligible payloads.
- `npm run facebook:publish:autonomous` — reconcile interrupted attempts, validate the current slot and publish eligible queued content when all live gates are explicitly enabled.
- `GET /api/facebook/autonomous-status` — authenticated read-only dashboard status for connection readiness, queue count, intake summary, run history, blocked posts and receipts.
- `POST /api/facebook/verify-page` — initial read-only verification of required Meta scopes, exact managed Page ID, Page task and matching Page token.

The current candidate file `content/facebook-intake-candidates.json` is intentionally empty. The checked-in `content/facebook-autonomous-queue.json` is only a local-development fallback; production intake and publishing default to `facebook-autonomous-queue.json` inside the durable `FACEBOOK_STATE_DIR` (or an explicitly configured `FACEBOOK_AUTONOMOUS_QUEUE_PATH`). The intake will not fabricate facts, source evidence, media, licence records or captions. No eligible candidate means no post. Every queued item is rechecked immediately before the publish mutation. Because no trusted semantic-verification provider is configured, factual claims are currently blocked by default even when a source excerpt is present.

Live publishing is disabled by default. It requires all three JSON controls (`publishingEnabled=true`, `dryRun=false`, `emergencyStop=false)), the secure runtime variable `FACEBOOK_PUBLISH_ENABLED=YES`, the exact Page ID in both config and runtime, valid Meta user/Page tokens, live scope/task/token verification, durable state, and an eligible payload. Keep the emergency stop independent from enablement. Never store tokens in source control or paste them into chat.

Uncertain mutations are never blindly retried. The publisher reconciles the official Page scheduled_posts and feed edges using bounded pagination and exact caption/time matching. A single verified remote match is persisted as a receipt; no match is not proof of non-publication, and ambiguous outcomes remain blocked. See [autonomous runner setup](docs/FACEBOOK_AUTONOMOUS_RUNNER_SETUP.md) and [Facebook pipeline audit](docs/FACEBOOK_PIPELINE_AUDIT_2026-10-24.md).

The older authenticated Facebook draft and one-operation API routes remain separately gated for compatibility; they are not used by the autonomous schedule and are not presented as routine dashboard controls. The dashboard's visible Facebook area now focuses on autonomous health and read-only receipts rather than per-post approval/publish forms.

## Daily Facebook draft automation (draft-only)

The separate `npm run facebook:draft:daily` workflow creates a research-required draft package. It remains distinct from the autonomous publisher and never sends posts to Meta. It uses `Africa/Johannesburg`, preserves prior draft artifacts, and reports `publishReady=false` and `publishingEnabled=false`. Its GitHub artifact history is limited by artifact retention and is not a permanent editorial database. The autonomous publisher uses its own durable state directory instead.

The [daily draft workflow](.github/workflows/facebook-daily-draft.yml) is a separate, default-branch-only workflow. A skipped pull-request run is not evidence that the default-branch schedule has executed. Neither workflow is proof of live Page acceptance until the dedicated persistent runner and real Meta integration are verified.
 
## Run the dashboard

```sh
DASHBOARD_OPERATOR_TOKEN='use-a-random-secret-of-at-least-24-characters' DASHBOARD_OPERATOR_ID='actual-operator-id' npm run dashboard
```

Open `http://127.0.0.1:8787`. Keep the terminal running. The dashboard's actions operate on real local state and allowlisted server-side tasks. Missing manifests or rights-cleared media should result in a blocked job, not a fake success.

## Schedule

Source of truth: `config/weekly-content-plan.json`.

- Tuesday, 17:00 Africa/Johannesburg: long-form draft, 6–10 minutes, 16:9
- Saturday, 17:00 Africa/Johannesburg: Short draft, 50–60 seconds, 9:16

These Tuesday/Saturday workflows are **draft-preparation triggers only**, not a publication schedule. Actual publication follows a rolling `long_form → long_form → short` cycle with at least 72 complete elapsed hours between consecutive actual publications (216 hours minimum for three cyclic gaps; no weekly post-count promise). The private-upload path now requires a complete owner-reviewed channel-history reconciliation, checks public/private/unlisted remote records and blocks unresolved upload attempts. Public publishing remains disabled.
- GitHub Actions uses 15:00 UTC and creates drafts only.

## Useful commands

```sh
npm test
npm run validate:schedule
npm run validate:campaigns
npm run check:captions
npm run readiness
npm run render:short
npm run render:long
npm run validate:short-export -- media/next-short.mp4
npm run validate:long-export -- media/long-form-next.mp4
npm run preflight:media -- media/next-short.mp4 content/next-short.json
npm run render:thumbnail -- media/next-short.mp4 'Reviewed title' media/next-short-thumbnail.jpg
npm run upload:private -- content/next-short.json media/next-short.mp4
```

Rendering requires real manifests, audio, captions, footage and rights evidence. Examples are deliberately blocked until replaced with verified information. Upload requires a persisted artifact-bound approval, actual thumbnail file/checksum, `CONFIRM_PRIVATE_UPLOAD=YES`, valid OAuth credentials and a channel ID verified against the authenticated YouTube API. The uploader sets visibility to `private` and refuses blind retries.

## Test evidence

The latest verified code/test checkpoint is `1155263c25e85f901b9245fd4e024898a1af6f19`. All three repository validation workflows and the daily-draft workflow passed on that exact commit:
- [Automation validation — run 40091734573](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734573)
- [Metadata validation — run 40091734584](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734584)
- [Content quality — run 40091734600](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734600)
- [Daily Facebook draft workflow — run 40091734576](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576), [retained draft artifact](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40091734576/artifacts/12558699856)

Each run reports 139 Node tests passed, 0 failed, 0 skipped. Automation also passed 8 Python safety tests, JavaScript syntax checks and Python compilation. CI used `npm ci --ignore-scripts` (46 packages added, 47 audited). npm audit still reports 4 moderate, 0 high and 0 critical advisories involving `gaxios`, `googleapis`, `googleapis-common` and `uuid`. Plain `npm ci` without `--ignore-scripts` remains unverified.

The daily workflow's actual output marked the assigned 08:00 SAST slot `MISSED_SLOT_REVIEW_REQUIRED` because the run occurred after that time. The generator now records the proposed instant and refuses to backdate or catch up by publishing a backlog. The artifact remains draft-only. GitHub scheduled triggers run only on the default branch; PR #1 remains draft, so this schedule is not yet active as a production daily trigger.

The latest code also binds approvals to claim/source/licensing details and invalidates Meta permission attestations after credential rotation. These tests use mocks and local fixtures; they do not prove live Meta Page identity, permissions, Insights, licence authenticity, or real publishing.


## Operations and recovery

See [OPERATIONS.md](OPERATIONS.md), [docs/PROJECT_COMPLETION_AUDIT.md](docs/PROJECT_COMPLETION_AUDIT.md), [docs/GO_LIVE_BLOCKERS.md](docs/GO_LIVE_BLOCKERS.md), and [docs/RELEASE_GATE_CHECKLIST.md](docs/RELEASE_GATE_CHECKLIST.md). Back up the state directory and `run-logs/`; never retry an upload whose outcome is uncertain until the durable ledger and YouTube remote state have been reconciled. Keep PR #1 open and draft until all external prerequisites and live acceptance criteria are genuinely met.


## Rolling publication policy (current)

The publication sequence is `long_form → long_form → short`, with at least 72 complete elapsed hours between each consecutive actual publication. Three cyclic gaps require at least 216 hours; this is not a weekly posting promise. Tuesday/Saturday workflow triggers create drafts only. Before a private upload, the uploader fetches the authenticated SonicVhibez uploads playlist and requires `CHANNEL_HISTORY_RECONCILIATION_PATH` to enumerate every remote video with exact ID, format, actual timestamp and visibility, and it blocks unresolved upload attempts. This gate has automated tests but still requires owner credentials, a complete real reconciliation record, genuine approved assets and explicit authorization for one private upload.


## Historical release evidence snapshot — 24 October 2026 (superseded)

Current tested code candidate: `9dd102f9636a5ba71c797cf79c104d3616cbe14e`. Exact-SHA automation validation [40122567804](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567804) passed with advisories: 205 Node tests passed, 0 failed, 0 skipped; 8 Python safety tests passed; 16 queue topics validated; JavaScript syntax and Python compilation passed. Metadata [40122567802](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567802), content quality [40122567799](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567799), and locked installation [40122564222](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122564222) passed. Daily Facebook draft [40122567717](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40122567717) was **SKIPPED** on the PR event and does not prove a default-branch artifact. The restore code now rejects symlinked destination paths before writing, with regression tests in `test/backup-restore.test.mjs`. Four moderate dependency advisories remain. This snapshot is historical for the tested code candidate; see [the current release register](GO_LIVE_BLOCKERS.md) for owner actions and production blockers. This docs-only update is not represented by the run links above; its exact-head CI is recorded in PR #1 after completion. Verdict: **CODE-LEVEL ACCEPTANCE BLOCKED; PRODUCTION ACCEPTANCE BLOCKED**.


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


## Evidence-bound content quality gate (2026-10-26)

Both renderers now require a separate `qualityEvidencePath` in their render manifest. Run the gate explicitly with:

```sh
npm run validate:content-quality -- content/long-form-quality-evidence.json long_form
npm run validate:content-quality -- content/short-quality-evidence.json short
```

The evidence JSON must bind the script's measured word count/sections/claim sources and similarity-review record, exact footage bytes to provenance SHA-256, a deterministic edit plan and seed, measured audio report and narration bytes, and an approving human editorial review. Short evidence must also bind an explicit approved long-form parent, its revision and media hash, the verified remote parent video ID and the canonical watch URL. The native YouTube Related video setting is a separate Studio verification; an internal relationship or description URL does not prove that setting.

The validator blocks placeholders and mismatched files; it does not prove licence authenticity, guarantee originality, assess animal realism automatically, or replace a real full-playback/factual review. Keep public/unattended publishing disabled. See `scripts/content-quality-gates.mjs`, `scripts/validate-content-quality.mjs`, and `test/validate-content-quality.test.mjs`.


### Structured script-authoring prompt

Use `npm run prompt:script -- long_form <brief.json>` or `npm run prompt:script -- short <brief.json>` to produce a source-constrained prompt. A Short brief must identify its exact long-form parent and weekly cycle. This command builds a prompt only; it does not call an LLM or invent research. Validate the returned structured script through the quality-evidence gate before narration/rendering.


### Reproducible render and audio processing

Renderers do not loop a short source clip to fake a 50–60 second or 6–10 minute duration; short footage produces a short export that fails the duration gate. A recorded seed produces a deterministic framing choice and subtle bounded brightness/contrast/saturation adjustment. Audio profile filters apply high/low-pass filtering, compression, loudness normalization and short fades. After technical export validation, the renderer measures the actual MP4 audio loudness and true peak with FFmpeg and blocks success when the profile tolerance fails. These filters improve delivery consistency; they do not establish originality or hide reused content.


## Latest live checkpoint — 26 October 2026

Tested application/test SHA: `a912d3c724195fb1f3ca823d186cddf8b9b4f984`. Exact-SHA CI: automation/security **PASS** (306 Node tests, 0 failures/skips; 8 Python tests; npm audit 0 vulnerabilities; clean install/syntax checks) [run 40302828218](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828218); content quality **PASS** [40302828279](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828279); metadata **PASS** [40302828303](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828303); dashboard E2E **PASS** [10 tests, run 40302828398](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828398); isolated main/candidate baseline **PASS** [40302828254](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828254). Production readiness **BLOCKED** [40302828489](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828489); Facebook daily draft **SKIPPED** [40302828351](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/40302828351).

Change: [`3dbccd1`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/3dbccd19584cb9da81e646cb9c34a65184fcd47b) hardens script research input validation; [`a912d3c`](https://github.com/clickerrish-art/YT-AUTO-VISE/commit/a912d3c724195fb1f3ca823d186cddf8b9b4f984) adds regression tests proving malformed, insecure, placeholder and duplicate research records are rejected before provider access. Current PR HEAD after evidence-document updates is later than the tested SHA; those updates are documentation-only.

Current Git snapshot before these documentation updates: PR HEAD `a912d3c724195fb1f3ca823d186cddf8b9b4f984`, `main=fa00d28e7f58911482686e4ad69fac9f4701a2e6`, merge base `45352b73bb6cc4787b2a49988b575afb754ab627`, 1,322 ahead / 2 behind, 141 changed files. PR remains open/draft/unmerged. Full branch-only history review remains incomplete. Verdict remains **CODE ACCEPTANCE BLOCKED / PRODUCTION BLOCKED**: authoring is not lifecycle/dashboard integrated; renderer still does not compose a genuine multi-scene storyboard; no production media/rights/human playback evidence; YouTube/Meta identity and history are unverified; cadence decision and exhaustive recovery/deployment gates remain open. No external upload, post, campaign activation, merge, or destructive Git operation occurred.
