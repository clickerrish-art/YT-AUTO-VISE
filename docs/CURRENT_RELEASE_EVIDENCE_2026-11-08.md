# Verified worker retry-classification follow-up — 8 November 2026

**Exact code/test candidate:** `774b35382cf78bb706acd7a56c7befe0477eaeb0`  
**PR #1:** OPEN · DRAFT · UNMERGED · implementation branch `codex/marketing-machine-audit-fixes`.  
**main:** `fa00d28e7f58911482686e4ad69fac9f4701a2e6` (unchanged).

## Owner-independent implementation

- `scripts/worker-runner.mjs` now distinguishes dashboard HTTP 409 responses requiring operator remediation from transient dispatch conflicts. `requiresOperatorRetry=true` or `deadLettered=true` returns `OPERATOR_REQUIRED` or `DEAD_LETTERED`, clears any stale local retry cooldown, and does not expose a misleading retry timer.
- Transient 409 responses without those operator-only signals continue to use bounded `Retry-After` and persisted exponential backoff.
- `test/worker-runner.test.mjs` and `test/worker-backoff-persistence.test.mjs` cover the operator-only response, transient retry behavior, and restart behavior. The dashboard removes an operator-blocked job from automatic dispatch; remediation and explicit retry authorization remain operator-controlled.

## Exact-SHA verification for `774b35382cf78bb706acd7a56c7befe0477eaeb0`

- Content quality [42505747207](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747207): **PASS — 722/722 Node tests, zero failures, zero skips**; includes the new operator-only 409 regression.
- Automation/security [42505747242](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747242): **PASS — 34/34 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, syntax and compilation checks passed**.
- Dashboard Chromium E2E [42505747131](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747131): **PASS — 29/29 journeys**.
- Cloudflare durable-state [42505747199](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747199): **PASS — 8/8**.
- Queue readiness [42505747137](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747137): **PASS — 16 queue items; 72-hour elapsed minimum; 216-hour rolling cycle; publishing disabled**.
- Metadata [42505747247](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747247), isolated main/candidate baseline [42505747180](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747180), deployment recovery [42505747200](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747200), branch inventory [42505747167](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747167), and local Nature Frontiers draft validation [42505747246](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747246): **PASS**.
- Production readiness [42505747214](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42505747214): **HOLD — 24 blockers**, intentionally fail-closed; not a production pass.

No upload, publication, live scheduling, account reconnection, paid generation, merge, main edit, or destructive Git operation occurred. The 24 production blockers and all owner-controlled gates remain open; see the detailed blocker section below.

---

# Follow-up verification — 8 November 2026

**Exact test-verified branch HEAD:** `b149254a3d5b080be704790fa26529067e88a24a` · **source implementation candidate:** `6c71814aebc8a384badef8ebecd8ada67c76cb93` · **main:** `fa00d28e7f58911482686e4ad69fac9f4701a2e6` unchanged · **merge base:** `45352b73bb6cc4787b2a49988b575afb754ab627`. At this verification point the PR branch was 3,155 commits ahead / 2 behind, with 285 changed files. PR #1 remains OPEN · DRAFT · UNMERGED; branch protection is disabled. This is a test-only descendant: no application source code changed after the `6c71814` candidate.

## Change made

`test/dashboard-ui-contract.test.mjs` now distinguishes static ID-addressable buttons from the dynamically generated Cloudflare restore buttons. The restore buttons use a delegated `click` listener on `#stateBackupList` and a `data-restore-backup` selector, not a static per-button `.onclick` assignment. The contract test now excludes the interpolated dynamic ID from the static-button scan and explicitly asserts that the delegated handler targets restore buttons. This fixes the single false-negative UI-contract test that caused the prior `71daca1` CI run to fail; it does not weaken the real handler requirement.

## Exact-HEAD CI results

- Automation/security [42461823297](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461823297): **PASS** — 130/130 Node test files, zero skips; 34/34 Python tests; npm audit 0 vulnerabilities; promotional-plan validator passed.
- Content quality [42461823010](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461823010): **PASS** — 712/712 tests, zero failures/skips.
- Dashboard Chromium E2E [42461823058](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461823058): **PASS** — 27/27 journeys.
- Cloudflare durable-state tests [42461822976](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461822976): **PASS** — 8/8.
- Queue readiness [42461822939](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461822939): **PASS** — 16 queue items; 72-hour minimum and 216-hour rolling cycle policy; publication and scheduling disabled.
- Metadata fail-closed validation [42461822887](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461822887): **PASS**.
- Isolated main/candidate baseline [42461823020](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461823020): **PASS**.
- Branch inventory [42461822971](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461822971): **PASS** — inventory only, not semantic approval.
- Deployment recovery [42461822982](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461822982): **PASS**.
- Local Nature Frontiers draft-package validation [42461823145](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461823145): **PASS, local-only**; no provider-side post was created or read back.
- Lockfile validation [42461819192](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461819192): **PASS**.
- Production readiness [42461822968](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42461822968): **HOLD / 24 blockers**; the non-zero result is the intended fail-closed outcome, not a production pass.

## Safety and remaining work

No main-branch edit, PR merge, upload, publication, live scheduling, account reconnection, paid generation or mutation of existing Metricool records occurred. Scheduled GitHub workflows still execute from `main`; these PR runs are CI evidence only.

Owner-independent acceptance remains open: DASH-001 exhaustive UI journeys, API-001 full route acceptance, SCHED-001 complete queue/history/recovery proof, STATE-001 durable-state backup/restore failure drills, DEPLOY-001 install/upgrade/rollback drills, and GIT-002 semantic review of the large branch divergence.

Owner-controlled gates remain: a SonicVhibez-only Metricool destination and complete public/private/unlisted YouTube history; product compensation classification and exact viewer disclosure; genuine rights-cleared media and manifests; final MP4/thumbnail and human playback review; secure OAuth identity; and one-shot private-upload authorization. Nature Frontiers' six future Metricool records remain `draft=false` and `autoPublish=true`; they were not changed. The Wildlife Vault Selar listing is sold by Click 47 but its page copy uses Nature Frontiers branding, so final SonicVhibez context review and the compensation/disclosure decision remain required.

# Current release evidence — 8 November 2026

**Exact code/test candidate:** `6c71814aebc8a384badef8ebecd8ada67c76cb93`  
**Implementation branch:** `codex/marketing-machine-audit-fixes`  
**main:** `fa00d28e7f58911482686e4ad69fac9f4701a2e6` (unchanged) · **merge base:** `45352b73bb6cc4787b2a49988b575afb754ab627`  
**Compare:** 3,150 commits ahead / 2 behind / 284 changed files. This is inventory, not semantic approval.  
**PR #1:** OPEN · DRAFT · UNMERGED. No merge, main edit, reset, rebase, force-push or destructive reconciliation occurred.

## Owner-independent implementation completed this run

- `scripts/dashboard-inventory.mjs` now ignores markup-like strings inside executable script/style blocks, so generated template strings are not miscounted as static dashboard controls.
- Dashboard inventory expectations now reflect 118 static controls, 17 forms and 49 API routes (16 GET, 33 POST). The protected-route auth matrix covers 12 GET and 33 mutating routes.
- The three Cloudflare backup endpoints return a documented fail-closed 503 when Cloudflare state sync is not configured; the auth-negative test now verifies that exact unavailable response instead of treating it as an internal server error.
- Fixed the Cloudflare state integration test's missing ready-server base URL and aligned the browser acceptance count with the two new static backup controls.
- `scripts/validate-promotional-short-plan.mjs` now accepts either measured vidIQ estimates with an explicit estimate caveat or qualitative web-search evidence with a timestamp, HTTPS source references and no volume/competition figures. This allows honest content preparation when keyword credits or volume data are unavailable.
- `content/promotional-short-plan.json` now contains 3 approximately 55-second SonicVhibez drafts: 2 for the week of 9 November and 1 for the week of 16 November. The weekly cap is enforced; every item remains DRAFT_ONLY; no publication timestamps or scheduling flags were added.
- The 8 November vidIQ research for “how to script a YouTube video” records 44,243 provider-estimated monthly searches, competition 46/100 and +70.7% demand growth. “YouTube growth strategy” retains its 7 November vidIQ estimate (22,973) with a 8 November qualitative search check. The wildlife-documentary draft uses qualitative evidence only; no volume was invented.

## Exact-SHA CI — code/test candidate 6c71814

- [x] Automation/security [42460609571](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609571): **PASS — 130/130 Node tests, 34 Python tests, zero skips, npm audit 0 vulnerabilities**. Promotional plan validator reports 3 drafts, weekly cap enforced, scheduling/publication disabled.
- [x] Content quality [42460609479](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609479): **PASS — 712/712 tests, zero failures, zero skips**.
- [x] Dashboard Chromium E2E [42460609449](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609449): **PASS — 26/26**.
- [x] Cloudflare durable-state unit checks [42460609491](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609491): **PASS — 8/8**.
- [x] Queue readiness [42460609549](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609549): **PASS**; the cadence policy reports a 72-hour minimum between publication instants and a 216-hour full long-form/long-form/Short cycle. This is code-policy evidence, not remote-history clearance.
- [x] Metadata validation [42460609489](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609489): **PASS** for fail-closed behavior; unreviewed metadata remains blocked.
- [x] Isolated main/candidate baseline [42460609494](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609494): **PASS**. Retained artifact: [baseline comparison](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609494/artifacts/13609481661). Main: 54/54 Node tests, 4 moderate npm advisories. Candidate: 130/130 Node tests, 34 Python tests; candidate npm audit has 0 vulnerabilities.
- [x] Non-destructive branch inventory [42460609455](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609455): **PASS — inventory only, not semantic approval**.
- [x] Deployment recovery smoke [42460609598](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609598): **PASS**.
- [x] Nature Frontiers local draft-package validation [42460609492](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609492): **PASS — local-only validation; no provider draft was created or read back**.
- [ ] Production readiness [42460609465](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609465): **HOLD — 24 blockers**. The non-zero result is intentional fail-closed behavior, not a production pass.

## Production-readiness blockers

The 24 blockers include: complete public/private/unlisted SonicVhibez history and pending/uncertain upload reconciliation; genuine Short and long-form render manifests with rights evidence; human-reviewed metadata; verified SonicVhibez channel identity; rights and compliance sign-off; confirmed product compensation type and evidence; owner-approved exact disclosure text, timestamp and approval reference; matching metadata/description disclosure; final rendered `media/next-short.mp4`; and the four YouTube credentials/channel settings absent from the CI execution environment. No credentials belong in chat. Readiness report: [42460609465](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42460609465).

## Live external safety state — read-only checks

- Metricool exposes only brand **Nature Frontiers**, ID `7545638`, with a YouTube channel field but no distinct SonicVhibez/Sonic Fire brand identity. The seven returned records include one Facebook post already published on 7 November at 10:00 SAST and six future pending records on 11, 14, 18, 21, 25 and 28 November at 10:00 SAST. All six future records are `draft=false` and `autoPublish=true`; one is Facebook plus Instagram. No SonicVhibez YouTube provider schedule was exposed. These records were not changed.
- The last recorded public SonicVhibez Short was 22 October 2026 at 17:05:56 Africa/Johannesburg. The elapsed time at 8 November 2026 09:38 SAST is 400h32m04s. This is only the gap from the last known public item, not a complete history check. Private/unlisted history and a SonicVhibez-only destination schedule remain unverified; the 72-hour spacing gate is **UNVERIFIED**. No publication calendar was proposed and nothing was scheduled.
- Product registry records seller Click 47 as verified on 6 November for the Wildlife Creator's Vault and 7 November for the Prompt Pack and Success Blueprint. The compensation relationship and viewer-facing disclosure remain UNVERIFIED for all three. The Wildlife Vault listing's Nature Frontiers wording still needs final SonicVhibez context review.
- Repository tree contains example render manifests only; no MP4, final thumbnail or production image assets are present. No render or upload was attempted. HeyGen's previously reported monthly free-video allowance remains the last known quota state; no paid render was requested.
- Public/unattended publishing and scheduling remain disabled. Safari remains inactive. No account reconnection, existing-post mutation, upload, publication or spend occurred.
- GitHub scheduled workflows execute from `main`; PR-branch CI is verification only and is not production scheduling automation.

## Remaining acceptance and owner-controlled gates

DASH-001, API-001, SCHED-001, STATE-001, DEPLOY-001 and GIT-002 remain OPEN. Remaining owner-controlled gates include the exact compensation/disclosure classification for each Selar product; a SonicVhibez-only destination and complete YouTube history; genuine rights-cleared footage, narration and music; real manifests, final MP4/thumbnail and human review; secure OAuth identity; and one-shot private-upload authorization. Do not infer readiness from CI.

