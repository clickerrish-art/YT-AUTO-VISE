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

