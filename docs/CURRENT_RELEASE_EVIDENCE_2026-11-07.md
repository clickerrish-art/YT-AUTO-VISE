# Current release evidence — 7 November 2026

## Exact source/test candidate and Git state

- Repository: `clickerrish-art/YT-AUTO-VISE`.
- Exact application/source/test candidate: `9e04b6bf86784665a48e2b0f8c48b6b48287ec6c`.
- Main: `fa00d28e7f58911482686e4ad69fac9f4701a2e6` (unchanged).
- Merge base: `45352b73bb6cc4787b2a49988b575afb754ab627`.
- Compare at the tested candidate: **2,985 ahead / 2 behind / 269 changed files**. This is an inventory, not semantic integration approval.
- PR #1: **OPEN · DRAFT · UNMERGED**. No merge, main edit, reset, rebase, force-push or destructive reconciliation occurred.
- The subsequent release-evidence documentation refresh is a docs-only descendant; the code/test results below apply to the exact source/test candidate above.

## Owner-independent implementation completed in this run

### Worker retry-backoff durability

- `scripts/worker-runner.mjs`: the generic retry-cooldown persistence failure path now sets `preserveProcessLock = true` before stopping. Previously the worker stopped its current loop but its `finally` block could remove the process lock; a restart could then load stale/empty cooldown state and contact dispatch too early.
- `test/worker-runner.test.mjs`: the HTTP 409 regression now makes the cooldown write fail while leaving the parent directory intact, asserts the process lock remains, then attempts a restart and proves it is rejected before another API request.
- This is a local fail-closed restart-safety improvement. It does not claim that a remote dispatch succeeded or authorize an upload.

### Product authorization and promotional draft plan

- All three supplied Selar pages were re-fetched read-only on 7 November. Each listing identifies **Click 47** as seller. The Wildlife Creator's Vault listing body uses **Nature Frontiers** wording; SonicVhibez promotion is explicitly owner-authorized, but the resource must not be misrepresented as a SonicVhibez-owned product.
- The current owner brief explicitly requests SonicVhibez creator-education promotions connected to the Prompt Pack and Success Blueprint. Their `brandAuthorization` records are now `OWNER_CONFIRMED` for SonicVhibez with a dated approval reference. The Vault authorization was already recorded.
- This does **not** establish whether any link is affiliate, paid placement or uncompensated. Compensation and viewer-facing disclosure remain `UNVERIFIED`; the products remain held from release. The descriptions carry an internal **DISCLOSURE HOLD** and are not publish-ready.
- `content/promotional-short-plan.json` contains exactly two drafts for the week of **9 November 2026**, no publication timestamps, no live schedule, and no third item. The validator still enforces the two-per-week cap, SonicVhibez-only channel, Africa/Johannesburg, 50–60-second target, exact product URLs, keyword evidence, and disabled scheduling/publication.
- `scripts/validate-promotional-short-plan.mjs` now requires candidate products used in SonicVhibez draft content to have explicit owner-confirmed brand authorization (exact brand, valid zoned timestamp and approval reference). Compensation/disclosure checks still keep those candidates on hold.
- The exact approved Vault URL remains `https://selar.com/0u19v8u99l`; the two new draft links are the exact Prompt Pack and Success Blueprint URLs.

## Exact-SHA CI for `9e04b6bf86784665a48e2b0f8c48b6b48287ec6c`

All listed runs report this exact `head_sha`.

- [x] Automation/security [42351724517](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42351724517): **PASS** — 635 Node tests, 0 failures, 0 skips; 34 Python tests; npm audit 0 vulnerabilities; FFmpeg/ffprobe, JavaScript syntax and Python compilation passed. The new HTTP 409 process-lock regression passed, and `npm run validate:promotional-shorts` passed for exactly 2 draft items with scheduling/publication disabled.
- [x] Content quality [42351723953](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42351723953): **PASS**.
- [x] Dashboard Chromium E2E [42351723872](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42351723872): **PASS — 26/26 journeys**.
- [x] Metadata [42351723937](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42351723937): **PASS**.
- [x] Isolated main/candidate baseline [42351723921](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42351723921): **PASS**.
- [x] Non-destructive branch inventory [42351723910](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42351723910): **PASS — inventory only, not semantic review**.
- [x] Nature Frontiers local draft-package validation [42351723901](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42351723901): **PASS — local validation only; no provider-side Meta draft was created or read back**.
- [x] Queue readiness [42351723885](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42351723885): **PASS** for the non-mutating preparation workflow; its production-readiness report remains HOLD.
- [ ] Production readiness [42351723913](https://github.com/clickerrish-art/YT-AUTO-VISE/actions/runs/42351723913): **HOLD / fail-closed (exit 2)**. This is not a production pass.

## SEO evidence for the two prepared Shorts

vidIQ keyword research was refreshed on 7 November. Volumes below are provider-estimated monthly searches, not independently audited counts.

- **Short 003 — “How to Script a YouTube Video: 5 Prompt Details to Include”** (127 words; approximately 55 seconds): primary phrase `how to script a YouTube video` — 44,320 estimated monthly searches, competition 46/100, reported growth +70.6%. Related phrases: `YouTube video prompts` 3,946 (competition 29); `YouTube video ideas` 53,941 (competition 27; top markets India 29%, US 12%, Philippines 6%); `how to come up with YouTube video ideas` 18,637 (+41.4%, competition 31). Product: The Full Video Creation Prompt Pack Premium Edition.
- **Short 004 — “YouTube Growth Strategy: Build a 90-Day Content Plan”** (119 words; approximately 55 seconds): primary phrase `YouTube growth strategy` — 22,973 estimated monthly searches, competition 46/100. Related phrases: `how to grow YouTube channel` 214,276 (+43%, competition 40); `YouTube growth tips` 86,457 (competition 33); `how to grow a small YouTube channel` 129,456 (+238.3%, competition 36). Product: The YouTube Success Blueprint 90-Day Creator System.
- Search volumes are vidIQ estimates; no third-party SEO score or independent volume audit is claimed. The broader growth phrases are supporting search intent, not promises of growth.

## Live destination, video and spacing checks

- Metricool exposes only brand **7545638 — Nature Frontiers**. Its `youtubeData` value is `UCSlkuPfHH78oGC1o418HV4w`, matching the vidIQ channel `SonicVibes` / `@sonicvhibez`, but the same brand also contains Nature Frontiers Facebook, Instagram, TikTok and Pinterest identities. No separate SonicVhibez/Sonic Fire YouTube-only brand is selectable.
- Metricool returned **7 future Nature Frontiers records** between 7 and 28 November. All seven are `draft=false` and `autoPublish=true`. Product promotions: 11 November 10:00 Facebook (Vault, direct URL); 14 November 10:00 Facebook (Prompt Pack, direct URL); 18 November 10:00 Facebook (Blueprint, generic storefront URL rather than the supplied direct URL); 25 November 10:00 Facebook + Instagram (Vault). The other three are Cash Smasher Secrets (7 and 21 November) and Internet Marketing Bible (28 November). **No records were changed.**
- vidIQ connected channels show SonicVibes / `@sonicvhibez` / `UCSlkuPfHH78oGC1o418HV4w` and Nature Frontiers / `@naturefrontiers-life` / `UC41xXhw22o6Q2I2pTKB2kOg`. The complete owned-video query for SonicVibes returned one public Short, no private/unlisted/scheduled records, and no next-page token. Last actual publication: **22 October 2026 17:05:56 Africa/Johannesburg**. The 72-hour threshold passed **25 October 2026 17:05:56**. At **7 November 2026 09:37:01**, elapsed time is **15 days 16 hours 31 minutes 5 seconds (376 hours 31 minutes 5 seconds)**.
- Historical channel spacing exceeds 72 hours, but the correct SonicVhibez-only Metricool destination schedule cannot be inspected. Overall destination/queue spacing clearance therefore remains **UNVERIFIED**. No publication time was proposed; nothing was scheduled.
- HeyGen read-only library inspection returned one completed `Stop Starting From Zero` render at **48.7967 seconds** with a thumbnail, three other completed renders at 20.4016, 22.3085 and 24.32 seconds, and one failed render. The 48.8-second item is not a reviewed final ~55-second package. No video was generated, no quota was spent and no asset was approved this run.
- The current week remains at its existing 2/2 draft allowance; the next-week plan contains 2/2 drafts. No third item was added.

## Safety and remaining gates

- SonicVhibez promotional publication and scheduling remain disabled. No video upload, publication, live schedule, account reconnection, spend, existing-post mutation or auto-publishing enablement occurred. Safari remains inactive. GitHub scheduled workflows execute from `main`; PR-branch CI is not production automation.
- Owner-controlled: verify affiliate/paid/no-compensation status and approve exact viewer-facing disclosures for each product; establish a distinct SonicVhibez/Sonic Fire YouTube-only Metricool destination; provide genuine rights-cleared footage/narration/music and real render manifests; approve final MP4/thumbnail after human playback/compliance review; securely verify OAuth identity and authorize any private upload per exact operation.
- Owner-independent acceptance still open: DASH-001 exhaustive dashboard journeys; API-001 full route acceptance; SCHED-001 retry/cancel/dead-letter/restart drills; STATE-001 backup/restore failure injection; DEPLOY-001 clean install/upgrade/rollback; and GIT-002 semantic review of the 2,985-commit divergence. Do not infer production readiness from passing CI.
